// src/app/services/supabase.service.ts
import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {

  public supabase: SupabaseClient;
  private authStateSubject = new BehaviorSubject<boolean>(false);
  authState$ = this.authStateSubject.asObservable();
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();
  private token: string | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {

    const supabaseUrl = import.meta.env['SUPABASE_URL'];
    const supabaseAnonKey = import.meta.env['SUPABASE_ANON_KEY'];

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase URL and Supabase Anon Key must be provided');
    }

    this.supabase = createClient(supabaseUrl, supabaseAnonKey);

    this.supabase.auth.onAuthStateChange((event, session) => {
      this.setAuthState(!!session);
    });

    if (isPlatformBrowser(this.platformId)) {
      this.initializeAuth();
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const { data: { session } } = await this.supabase.auth.getSession();
    return !!session;
  }

  async getSessionData() {
    return (await this.supabase.auth.getSession()).data || {};
  }

  private initializeAuth() {
    this.token = localStorage.getItem('supabase_token');
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.userSubject.next(session?.user ?? null);
      if (session) {
        this.token = session.access_token;
        localStorage.setItem('supabase_token', session.access_token);
      } else {
        this.token = null;
        localStorage.removeItem('supabase_token');
      }
    });
  }

  setAuthState(isAuthenticated: boolean) {
    this.authStateSubject.next(isAuthenticated);
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async signInWithGitHub(): Promise<void> {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  
    if (error) {
      console.error('Error during GitHub login:', error.message);
      throw error;
    }
  
    // Handle the response data (e.g., redirect or notify user)
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    this.setAuthState(false);
    if (error) throw error;
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('supabase_token');
    }
    return this.token;
  }

  setToken(token: string | null) {
    this.token = token;
    if (isPlatformBrowser(this.platformId)) {
      if (token) {
        localStorage.setItem('supabase_token', token);
      } else {
        localStorage.removeItem('supabase_token');
      }
    }
  }

  /**
   * Checks if the user's email is verified.
   * @returns {Promise<boolean>}
   */
  async isEmailVerified(): Promise<boolean> {
    const { data: user, error } = await this.supabase.auth.getUser();
    if (error) {
      console.error('Error fetching user data:', error);
      return false;
    }
    console.log(user.user)
    return user.user.email_confirmed_at ? true : false;
  }

  /**
   * Resends the verification email to the provided email address.
   * @param {string} email - The email address to resend the verification email to.
   * @returns {Promise<void>}
   */
  async resendVerificationEmail(email: string): Promise<void> {
    if (!email) {
      throw new Error('Email address is required to resend the verification email.');
    }

    const { error: resendError } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/verify`,
    });

    if (resendError) {
      console.error('Error resending verification email:', resendError);
      throw resendError;
    }
  }

  async verifyEmail() {
    // TODO: Implement email verification logic
    const { error } = await this.supabase.auth.getUser();
    if (error) throw error;
    // The user object should now reflect the verified status
  }

  async updateEmail(newEmail: string): Promise<void> {
    // TODO: Implement email update logic
    const { error } = await this.supabase.auth.updateUser({ email: newEmail });
    if (error) throw error;
  }

  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    // TODO: Implement password update logic
    const { error } = await this.supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }

  async enableMFA(): Promise<{ secret: string; qrCode: string }> {
    // TODO: Implement MFA setup logic
    throw new Error('MFA not implemented');
  }

  async verifyMFA(otpCode: string): Promise<void> {
    // TODO: Implement MFA verification logic
    throw new Error('MFA verification not implemented');
  }

  async getBackupCodes(): Promise<string[]> {
    // TODO: Implement backup codes generation logic
    throw new Error('Backup codes not implemented');
  }

  async exportUserData(): Promise<any> {
    // TODO: Implement data export logic
    // This will depend on what data you're storing for users
    throw new Error('Data export not implemented');
  }

  async deleteAccount(): Promise<void> {
    // TODO: Implement account deletion logic
    const currentUser = await this.getCurrentUser();
    if (currentUser) {
      const { error } = await this.supabase.auth.admin.deleteUser(currentUser.id);
      if (error) throw error;
    }
  }

  async getAccountIssues(): Promise<{ type: 'warn' | 'error' | 'info'; message: string; action?: { label: string; route?: string; callback?: () => void } }[]> {
    const issues: { type: 'warn' | 'error' | 'info'; message: string; action?: { label: string; route?: string; callback?: () => void } }[] = [];
    
    try {
      const { data: user } = await this.supabase.auth.getUser();
      const session = await this.supabase.auth.getSession();
      const userInfo = await this.supabase.from('user_info').select('current_plan').single();
  
      // Check if session expired
      if (!session || !session.data.session) {
        issues.push({
          type: 'error',
          message: 'Your session has expired. Please sign in again.',
          action: { label: 'Sign Out', callback: () => this.signOut() },
        });
      }
  
      // Check if account locked
      if (user?.user?.user_metadata['locked']) {
        issues.push({
          type: 'error',
          message: 'Your account is locked. Please contact support.',
          action: { label: 'Contact Support', route: '/support' },
        });
      }
  
      // Check if email is missing
      if (!user?.user?.email) {
        issues.push({
          type: 'error',
          message: 'Your account is missing an email address. Please update your details.',
          action: { label: 'Update Details', route: '/settings/account' },
        });
      }
  
      // Check if profile is incomplete
      if (!user?.user?.user_metadata?.['name'] || !user?.user?.user_metadata?.['avatar_url']) {
        issues.push({
          type: 'warn',
          message: 'Your profile is incomplete. Add more details to enhance your account.',
          action: { label: 'Update Profile', route: '/settings/account' },
        });
      }
  
      // Check if MFA is not enabled (exclude social logins)
      if (!user?.user?.user_metadata?.['mfa_enabled'] && user?.user?.identities?.[0]?.provider !== 'github') {
        issues.push({
          type: 'warn',
          message: 'You have not enabled multi-factor authentication. Add an extra layer of security.',
          action: { label: 'Setup MFA', route: '/settings/account' },
        });
      }
  
      // Check if unverified OAuth accounts exist
      const unverifiedIdentities = user?.user?.identities?.filter((id) => id.provider && !user.user.email_confirmed_at) || [];
      if (unverifiedIdentities.length > 0) {
        issues.push({
          type: 'warn',
          message: 'One or more third-party accounts are unverified.',
          action: { label: 'Verify Accounts', route: '/settings/account' },
        });
      }
  
      // Plan-based warnings (for future)
      const currentPlan = userInfo?.data?.current_plan || 'free';
      if (currentPlan === 'free') {
        const { count: domainCount } = await this.supabase.from('domains').select('id', { count: 'exact' });
        if (domainCount !== null && domainCount > 5) {
          issues.push({
            type: 'error',
            message: 'You have exceeded the limit of domains on your current plan. Remove some domains, or upgrade to continue using.',
            action: { label: 'Upgrade Plan', route: '/settings/upgrade' },
          });
        } else if (domainCount !== null && domainCount > 3) {
          issues.push({
            type: 'info',
            message: 'You are approaching the limit of the free plan, consider upgrading to add more domains and access additional features.',
            action: { label: 'Upgrade Plan', route: '/settings/upgrade' },
          });
        }
      }
    } catch (error) {
      console.error('Error fetching account issues:', error);
    }
    
    // Sort issues by severity: error, warn, info
    issues.sort((a, b) => {
      const severityOrder = { error: 0, warn: 1, info: 2 };
      return severityOrder[a.type] - severityOrder[b.type];
    });
    return issues;
  }
  
}
