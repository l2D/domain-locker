import { defineEventHandler, getQuery } from 'h3';
import whois from 'whois-json';
import dns from 'dns';
import tls from 'tls';
import { PeerCertificate } from 'tls';
import type { DomainInfo } from '../../types/DomainInfo';
import type { HostData } from '../../types/DomainInfo';
import { Contact, Host } from 'src/types/common';
import { verifyAuth } from '../utils/auth';

// Helper function to handle potential failures in asynchronous operations
const safeExecute = async <T>(fn: () => Promise<T>, errorMsg: string, errors: string[]): Promise<T | undefined> => {
  try {
    return await fn();
  } catch (error) {
    errors.push(errorMsg);
    return;
  }
};

const getParentDomain = (domain: string): string => {
  const parts = domain.split('.');
  return parts.length > 2 && parts[parts.length - 2].length > 3
    ? parts.slice(-2).join('.')
    : domain;
}

const getWhoisData = async (domain: string): Promise<any | null> => {
  return new Promise((resolve) => {
    whois(getParentDomain(domain))
      .then(async (data: any) => {
        // For some domains, like gov.uk, the WHOIS data is just {}
        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          resolve(data as Contact);
        } else {
          const backupData = await getWhoisBackupData(domain);
          if (backupData) {
            return resolve(backupData);
          }
          resolve(null);
        }
      })
      .catch((err: any) => {
        console.error('Error fetching WHOIS data:', err);
        resolve(null);
      });
  });
};

// Utility function to get IPv4 addresses
const getIpAddress = async (domain: string): Promise<string[]> => {
  return new Promise((resolve) => {
    dns.resolve4(domain, (err: any, addresses: string[] | PromiseLike<string[]>) => {
      if (err) {
        resolve([]);
      } else {
        resolve(addresses);
      }
    });
  });
};

// Utility function to get Name Servers
const getNameServers = async (domain: string): Promise<string[]> => {
  return new Promise((resolve) => {
    dns.resolveNs(domain, (err: any, addresses: string[] | PromiseLike<string[]>) => {
      if (err || !addresses) {
        resolve([]); // return empty array on error
      } else {
        resolve(addresses);
      }
    });
  });
};

// Utility function to get IPv6 addresses
const getIpv6Address = async (domain: string): Promise<string[]> => {
  return new Promise((resolve) => {
    dns.resolve6(domain, (err: any, addresses: string[] | PromiseLike<string[]>) => {
      if (err) {
        resolve([]); // return empty array on error to handle gracefully
      } else {
        resolve(addresses);
      }
    });
  });
};

// Utility function to get MX records
const getMxRecords = async (domain: string): Promise<string[]> => {
  return new Promise((resolve) => {
    dns.resolveMx(domain, (err: any, addresses: any[]) => {
      if (err || !addresses) {
        resolve([]); // return empty array on error
      } else {
        resolve(addresses.map((record: { exchange: any; priority: any; }) => `${record.exchange} (priority: ${record.priority})`));
      }
    });
  });
};

// Utility function to get TXT records
const getTxtRecords = async (domain: string): Promise<string[]> => {
  return new Promise((resolve) => {
    dns.resolveTxt(domain, (err, addresses) => {
      if (err || !addresses) {
        resolve([]); // Return empty array on error
      } else {
        // Flatten the array of arrays into a single array
        const flattenedRecords = addresses.flatMap(record => record);
        resolve(flattenedRecords);
      }
    });
  });
};

const getHostData = async (ip: string): Promise<Host | undefined> => {
  const apiUrl = `http://ip-api.com/json/${ip}?fields=12249`;
  try {
    const response = await fetch(apiUrl);
    if (response.ok) {
      const data = await response.json();
      if (data.regionName) data.region = data.regionName;
      return data;
    } else {
      return;
    }
  } catch (error) {
    console.error(error);
    return;
  }
};

// Utility function to get SSL certificate details
const getSslCertificateDetails = (domain: string): Promise<Partial<PeerCertificate>> => {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(443, domain, { servername: domain }, () => {
      const certificate = socket.getPeerCertificate();
      if (certificate) {
        resolve(certificate);
      } else {
        reject(new Error('No certificate found'));
      }
      socket.end();
    });
    socket.on('error', (err: any) => {
      reject(err);
    });
  });
};

// Helper to convert domain status
const makeStatusArray = (status: string | undefined): string[] => {
  return status
    ? Array.from(new Set([...status.matchAll(/([a-zA-Z]+Prohibited)/g)].map((match) => match[1])))
    : [];
};

// Main event handler for the API
export default defineEventHandler(async (event) => {

  const authResult = await verifyAuth(event);

  if (!authResult.success) {
    return { statusCode: 401, body: { error: authResult.error } };
  }
  
  const query = getQuery(event);
  const domain = query['domain'] as string;

  if (!domain) {
    return { error: 'Domain name is required' };
  }

  const errors: string[] = [];
  const dunno = null;

  try {
    const whoisData = await getWhoisData(domain);
    if (!whoisData) {
      return { error: 'Failed to fetch WHOIS data' };
    }

    // Fetch other data concurrently
    const [ipv4Addresses, ipv6Addresses, mxRecords, txtRecords, nameServers, sslInfo] = await Promise.all([
      safeExecute(() => getIpAddress(domain), 'Failed to fetch IPv4 addresses', errors),
      safeExecute(() => getIpv6Address(domain), 'Failed to fetch IPv6 addresses', errors),
      safeExecute(() => getMxRecords(domain), 'Failed to fetch MX records', errors),
      safeExecute(() => getTxtRecords(domain), 'Failed to fetch TXT records', errors),
      safeExecute(() => getNameServers(domain), 'Failed to fetch name servers', errors),
      safeExecute(() => getSslCertificateDetails(domain), 'Failed to fetch SSL certificate details', errors)
    ]);

    let hostInfo: HostData | undefined;
    if (ipv4Addresses && ipv4Addresses.length > 0) {
      hostInfo = await safeExecute(() => getHostData(ipv4Addresses[0]), 'Failed to fetch IP information', errors);
    }

    const registrarName = whoisData.registrarName
      || (typeof whoisData.registrar === 'string') ? whoisData.registrar : whoisData?.registrar?.name
      || dunno;

    const domainInfo: DomainInfo = {
      domainName: whoisData.domainName || dunno,
      status: makeStatusArray(whoisData.domainStatus),
      ip_addresses: {
        ipv4: ipv4Addresses || [],
        ipv6: ipv6Addresses || [],
      },
      dates: {
        expiry_date: whoisData.expiryDate || whoisData.registrarRegistrationExpirationDate || whoisData?.dates?.expiry_date,
        updated_date: whoisData.lastUpdated || whoisData.updatedDate || whoisData?.dates?.updated_date,
        creation_date: whoisData.creationDate || whoisData?.dates?.creation_date,
      },
      registrar: {
        name: registrarName,
        id: whoisData.registrarIanaId || dunno,
        url: whoisData.registrarUrl || dunno,
        registryDomainId: whoisData.registryDomainId || dunno,
      },
      whois: {
        name: whoisData.registrantName || dunno,
        organization: whoisData.registrantOrganization || dunno,
        street: whoisData.registrantStreet || dunno,
        city: whoisData.registrantCity || dunno,
        country: whoisData.registrantCountry || dunno,
        state: whoisData.registrantStateProvince || dunno,
        postal_code: whoisData.registrantPostalCode || dunno,
      },
      abuse: {
        email: whoisData.abuseContactEmail || whoisData.registrarAbuseContactEmail || dunno,
        phone: whoisData.abuseContactPhone || whoisData.registrarAbuseContactPhone || dunno,
      },
      dns: {
        dnssec: whoisData.dnssec || dunno,
        nameServers: nameServers || [],
        mxRecords: mxRecords || [],
        txtRecords: txtRecords || [],
      },
      ssl: {
        issuer: sslInfo?.issuer?.O || dunno,
        issuer_country: sslInfo?.issuer?.C || '',
        valid_from: sslInfo?.valid_from || '',
        valid_to: sslInfo?.valid_to || '',
        subject: sslInfo?.subject?.CN || '',
        fingerprint: sslInfo?.fingerprint || '',
        key_size: sslInfo?.bits || 0,
        signature_algorithm: sslInfo?.asn1Curve || '',
      },
      host: hostInfo,
    };
    return { domainInfo, errors: errors.length > 0 ? errors : undefined };
  } catch (error) {
    console.error('Error processing domain information:', error);
    return { error: 'An unexpected error occurred while processing domain information' };
  }
});


/* This is a backup method, for some domains with funny extensions, which we can't find whois data for */
const getWhoisBackupData = async (domain: string): Promise<any | null> => {
  const WHOISXML_API_KEY = import.meta.env['WHOISXML_API_KEY']; 
  if (!WHOISXML_API_KEY) {
    console.warn("[WHOISXML] API key not set. Skipping fallback lookup.");
    return null;
  }

  const parentDomain = getParentDomain(domain);
  const apiUrl = `https://www.whoisxmlapi.com/whoisserver/WhoisService?`
  + `apiKey=${WHOISXML_API_KEY}&outputFormat=json&domainName=${parentDomain}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      console.error(`[WHOISXML] API request failed for ${parentDomain}: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    if (!data?.WhoisRecord) {
      console.warn(`[WHOISXML] No valid WhoisRecord found for ${parentDomain}`);
      return null;
    }

    const record = data.WhoisRecord;
    const registryData = record.registryData || {};

    return {
      domainName: record.domainName || parentDomain,
      registrar: {
        name: record.registrarName || registryData.registrarName || "Unknown",
        id: record.registrarIANAID || "Unknown",
        url: record.registryData?.whoisServer ? `https://${registryData.whoisServer}` : null,
      },
      dates: {
        creation_date: registryData.createdDateNormalized || "Unknown",
        expiry_date: registryData.expiresDateNormalized || "Unknown",
        updated_date: registryData.updatedDateNormalized || "Unknown",
      },
      whois: {
        name: registryData.registrant?.name || null,
        organization: registryData.registrant?.organization || null,
        street: registryData.registrant?.street1 || null,
        city: registryData.registrant?.state || null,
        country: registryData.registrant?.countryCode || null,
        postal_code: registryData.registrant?.postalCode || null,
      },
    };
  } catch (error) {
    console.error(`[WHOISXML] Error fetching data for ${parentDomain}:`, error);
    return null;
  }
};
