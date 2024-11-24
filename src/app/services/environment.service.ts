import { Injectable } from '@angular/core';
import { environment } from '@/app/environments/environment';

type EnvironmentType = 'dev' | 'managed' | 'self-hosted' | 'demo';

type EnvVar =
'SUPABASE_URL'          // Supabase URL
| 'SUPABASE_ANON_KEY'   // Supabase public key
| 'DL_ENV_TYPE'         // EnvironmentType (dev, managed, self-hosted, demo)
| 'DL_SUPABASE_PROJECT' // Supabase project ID
| 'DL_DEBUG'            // Enable debug mode, to show debug messages
| 'DL_GLITCHTIP_DSN'    // GlitchTip DSN, for error tracking
| 'DL_PLAUSIBLE_URL'    // URL to Plausible instance, for hit counting
| 'DL_PLAUSIBLE_SITE'   // Plausible site ID /  URL, for hit counting
;

@Injectable({
  providedIn: 'root',
})
export class EnvService {

  private environmentFile = (environment || {}) as Record<string, any>;

  mapKeyToVarName(key: EnvVar): string {
    return key.startsWith('DL_') ? key.substring(3) : key;
  }

  /**
   * Retrieves the value of an environment variable
   * Tries environmental variable (e.g. from .env) first, then runtime variable (e.g. from environment.ts)
   * Otherwise returns the fallback value if present, otherwise null.
   * @param key Environment variable key
   * @param fallback Fallback value
   */
  getEnvVar(key: EnvVar, fallback: string | null = null, throwError: boolean = false): any {
    const buildtimeValue = import.meta.env[key]; // From .env
    const runtimeValue = this.environmentFile[this.mapKeyToVarName(key)]; // From environment.ts

    const value = (buildtimeValue || runtimeValue) ?? fallback;
    
    if (!value && throwError) { // Throw error to be caught by the caller
      throw new Error(`Environment variable ${key} is not set.`);
    }
    return value;
  }


  /**
   * Checks if Supabase is enabled in the environment, but without throwing an error.
   * @returns
   */
  isSupabaseEnabled(): boolean {
    const supabaseUrl = this.getEnvVar('SUPABASE_URL');
    const supabaseKey = this.getEnvVar('SUPABASE_ANON_KEY');
    return Boolean(supabaseUrl && supabaseKey);
  }

  /**
   * Determines the environment type.
   */
  getEnvironmentType(): EnvironmentType {
    const env = this.getEnvVar('DL_ENV_TYPE', 'self-hosted');
    if (['dev', 'managed', 'self-hosted', 'demo'].includes(env)) {
      return env as EnvironmentType;
    }
    return 'self-hosted';
  }

  /**
   * Returns the Supabase URL from the environment.
   */
  getSupabaseUrl(): string {
    return this.getEnvVar('SUPABASE_URL', null, true);
  }

  /**
   * Returns the Supabase public key from the environment.
   */
  getSupabasePublicKey(): string {
    return this.getEnvVar('SUPABASE_ANON_KEY', null, true);
  }

  getProjectId(): string {
    return this.getEnvVar('DL_SUPABASE_PROJECT');
  }

  getGlitchTipDsn(): string {
    return this.getEnvVar('DL_GLITCHTIP_DSN');
  }

  getPlausibleConfig(): { site: string, url: string, isConfigured: boolean } {
    const site = this.getEnvVar('DL_PLAUSIBLE_SITE', '');
    const url = this.getEnvVar('DL_PLAUSIBLE_URL', '');
    const isConfigured = Boolean(site && url);
    return { site, url, isConfigured };
  }

}
