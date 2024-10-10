import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import Fuse from 'fuse.js';
import { DomainCardComponent } from '@components/domain-card/domain-card.component';
import { DomainListComponent } from '@components/domain-list/domain-list.component';
import { PrimeNgModule } from '../../prime-ng.module';
import DatabaseService from '@services/database.service';
import { DbDomain } from '@/types/Database';
import { FieldVisibilityFilterComponent, type FieldOption } from '@components/domain-filters/domain-filters.component';
import { MessageService } from 'primeng/api';

@Component({
  standalone: true,
  selector: 'domain-all-page',
  imports: [DomainCardComponent, DomainListComponent, PrimeNgModule, CommonModule, FieldVisibilityFilterComponent],
  templateUrl: './index.page.html',
})
export default class DomainAllPageComponent implements OnInit {

  @ViewChild(FieldVisibilityFilterComponent)
  filtersComp: FieldVisibilityFilterComponent = new FieldVisibilityFilterComponent;

  domains: DbDomain[] = [];
  filteredDomains: DbDomain[] = [];
  loading: boolean = true;
  isGridLayout: boolean = true;
  visibleFields: FieldOption[] = [];
  searchTerm: string = '';
  private fuse!: Fuse<DbDomain>;

  allColumns = [
    { field: 'domain_name', header: 'Domain', width: 200 },
    { field: 'registrar', header: 'Registrar', width: 150 },
    { field: 'expiry_date', header: 'Expiry', width: 120 },
    { field: 'tags', header: 'Tags', width: 150 },
    { field: 'notes', header: 'Notes', width: 200 },
    { field: 'ip_addresses', header: 'IP Addresses', width: 150 },
    { field: 'ssl', header: 'SSL', width: 200 },
    { field: 'whois', header: 'WHOIS', width: 200 },
    { field: 'host', header: 'Host Info', width: 200 },
    { field: 'dns', header: 'DNS Records', width: 200 }
  ];

  visibleColumns: any[] = [];

  constructor(private databaseService: DatabaseService, private messageService: MessageService) {}

  ngOnInit() {
    this.loadDomains();
    this.initializeFuse();
  }

  loadDomains() {
    this.loading = true;
    this.databaseService.listDomains().subscribe({
      next: (domains) => {
        this.domains = domains;
        this.filteredDomains = domains;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching domains:', error);
        this.loading = false;
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Couldn\'t fetch domains from database' 
        });

      }
    });
  }

  onVisibilityChange(selectedFields: FieldOption[]) {
    this.visibleFields = selectedFields;
    this.updateVisibleColumns();
  }

  updateVisibleColumns() {
    // Ensure 'domain_name' is always included
    const domainNameField = { value: 'domainName', label: 'Domain Name' };
    const fieldsToShow = this.visibleFields.some(f => f.value === 'domainName') 
      ? this.visibleFields 
      : [domainNameField, ...this.visibleFields];

    this.visibleColumns = this.allColumns.filter(column => 
      fieldsToShow.some(field => this.mapFieldToColumn(field.value) === column.field)
    );

    // Ensure 'domain_name' is the first column
    this.visibleColumns.sort((a, b) => 
      a.field === 'domain_name' ? -1 : b.field === 'domain_name' ? 1 : 0
    );
  }

  mapFieldToColumn(fieldValue: string): string {
    const fieldToColumnMap: { [key: string]: string } = {
      'domainName': 'domain_name',
      'registrar': 'registrar',
      'expiryDate': 'expiry_date',
      'tags': 'tags',
      'notes': 'notes',
      'ipAddresses': 'ip_addresses',
      'sslCertificate': 'ssl',
      'whoisRecord': 'whois',
      'hostInfo': 'host',
      'dnsRecords': 'dns'
    };
    return fieldToColumnMap[fieldValue] || fieldValue;
  }

  onSearchChange(searchTerm: string) {
    this.searchTerm = searchTerm.toLowerCase();
    this.filterDomains();
  }

  onLayoutChange(isGrid: boolean) {
    this.isGridLayout = isGrid;
  }

  initializeFuse() {
    const options = {
      keys: ['domain_name', 'registrar.name', 'tags', 'notes', 'ip_addresses.ip_address'],
      threshold: 0.3
    };
    this.fuse = new Fuse(this.domains, options);
  }

  filterDomains() {
    if (!this.searchTerm) {
      this.filteredDomains = this.domains;
      return;
    }
    const searchResults = this.fuse.search(this.searchTerm);
    this.filteredDomains = searchResults.map(result => result.item);
    if (this.filteredDomains.length === 0) {
      this.filteredDomains = this.domains.filter(domain => 
        this.domainMatchesSearch(domain, this.searchTerm.toLowerCase())
      );
    }
  }

  domainMatchesSearch(domain: DbDomain, searchTerm: string): boolean {
    return domain.domain_name.toLowerCase().includes(searchTerm) ||
      domain.registrar?.name.toLowerCase().includes(searchTerm) ||
      domain.tags?.some(tag => tag.toLowerCase().includes(searchTerm)) ||
      domain.notes?.toLowerCase().includes(searchTerm) ||
      domain.ip_addresses?.some(ip => ip.ip_address.includes(searchTerm)) ||
      false;
  }

  resetFilters() {
    this.searchTerm = '';
    this.filtersComp.initializeSelectedFields();
    this.filteredDomains = this.domains;
  }
}
