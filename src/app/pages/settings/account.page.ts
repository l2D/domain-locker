import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SupabaseService } from '@/app/services/supabase.service';
import { CommonModule } from '@angular/common';
import { GlobalMessageService } from '@/app/services/messaging.service';
import { ErrorHandlerService } from '@/app/services/error-handler.service';

@Component({
  standalone: true,
  selector: 'app-settings',
  templateUrl: './account.page.html',
  styleUrls: ['./index.page.scss'],
  imports: [PrimeNgModule, ReactiveFormsModule, CommonModule],
  providers: [MessageService, ConfirmationService]
})
export default class UserSettingsComponent implements OnInit {
  profileForm!: FormGroup;
  emailForm!: FormGroup;
  passwordForm!: FormGroup;
  mfaForm!: FormGroup;
  sessionForm!: FormGroup;
  hasPassword = false;
  loading = {
    profile: false,
    email: false,
    password: false,
    mfa: false,
    session: false,
    backupCodes: false,
    exportData: false,
    deleteAccount: false
  };
  user: any;

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private messageService: GlobalMessageService,
    private errorHandler: ErrorHandlerService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.initializeForms();
    this.loadUserData();
    this.checkIfUserHasPassword().then((hasPassword) => {
      this.hasPassword = hasPassword;
      this.updatePasswordForm(hasPassword);
      this.cdr.detectChanges(); // Ensures the UI updates
    });
  }

  initializeForms() {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.profileForm = this.fb.group({
      name: [
        '', 
        [Validators.maxLength(50), Validators.pattern(/^[a-zA-Z0-9\s\-_]+$/)]
      ],
      avatar_url: [
        '', 
        [Validators.pattern(/^(https?:\/\/(?:www\.)?[a-zA-Z0-9.\-_]+(?:\/[^\s]*)?)$/)]
      ]
    });

    this.passwordForm = this.fb.group({
      ...(this.hasPassword && { currentPassword: ['', Validators.required] }),
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    }, { validators: this.passwordMatchValidator });

    this.mfaForm = this.fb.group({
      otpCode: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });

    this.sessionForm = this.fb.group({
      sessionTimeout: ['', [Validators.required, Validators.min(1)]]
    });
  }

  async loadUserData() {
    this.loading.profile = true;
    try {
      this.user = await this.supabaseService.getCurrentUser();
      this.emailForm.patchValue({ email: this.user.email });
      this.profileForm.patchValue({
        name: this.user.user_metadata.name || this.user.user_metadata.full_name || '',
        avatar_url: this.user.user_metadata.avatar_url || ''
      });
    } catch (error) {
      this.errorHandler.handleError({ error, message: 'Unable to fetch user metadata', location: 'settings/account', showToast: true });
    } finally {
      this.loading.profile = false;
    }
  }

  updatePasswordForm(hasPassword: boolean) {
    if (hasPassword) {
      this.passwordForm.addControl('currentPassword', this.fb.control('', Validators.required));
    } else {
      this.passwordForm.removeControl('currentPassword');
    }
  }

  /* Returns true if user has email + password (aka not social login) */
  async checkIfUserHasPassword(): Promise<boolean> {
    const sessionData = await this.supabaseService.getSessionData();
    const identities = sessionData?.session?.user?.identities || [];
  
    // If the user has an email identity, they definitely have a password
    const emailIdentity = identities.find((identity: any) => identity.provider === 'email');
    if (emailIdentity) {
      return true;
    }
  
    // Otherwise, check the `has_password` flag in user metadata
    const userMetadata = sessionData?.session?.user?.user_metadata || {};
    return !!userMetadata['has_password'];
  }

  async updateProfile() {
    if (this.profileForm.valid) {
      this.loading.profile = true;
      try {
        await this.supabaseService.updateUserMetadata(this.profileForm.value);
        this.messageService.showSuccess('Profile updated successfully', '');
      } catch (error) {
        this.errorHandler.handleError({ error, message: 'Failed to update profile', location: 'settings/account', showToast: true });
      } finally {
        this.loading.profile = false;
      }
    }
  }

  async updateEmail() {
    if (this.emailForm.valid) {
      this.loading.email = true;
      try {
        await this.supabaseService.updateEmail(this.emailForm.get('email')!.value);
        this.messageService.showSuccess('Update Complete', 'Your email has been updated');
      } catch (error) {
        this.errorHandler.handleError({ error, message: 'Failed to update email', location: 'settings/account', showToast: true });
      } finally {
        this.loading.email = false;
      }
    }
  }

  async updatePassword() {
    if (this.passwordForm.valid) {
      this.loading.password = true;
      try {
        if (this.hasPassword) {
          await this.supabaseService.updatePassword(
            this.passwordForm.get('currentPassword')!.value,
            this.passwordForm.get('newPassword')!.value
          );
          this.messageService.showSuccess('Password Updated', 'You may now login with your new password');
        } else {
          await this.supabaseService.setPassword(
            this.passwordForm.get('newPassword')!.value,
          );
          this.messageService.showSuccess('Password Set', 'You can now login with email/password');
        }        
        this.passwordForm.reset();
      } catch (error) {
        this.errorHandler.handleError({
          error,
          message: (error as any)?.message || 'Failed to set/update password',
          location: 'settings/account',
          showToast: true,
        });
      } finally {
        this.loading.password = false;
      }
    }
  }
  
  async enableMFA() {
    this.loading.mfa = true;
    try {
      const { secret, qrCode } = await this.supabaseService.enableMFA();
      // Display QR code to user (you might want to use a modal for this)
      this.messageService.showSuccess('MFA Enabled', 'Please scan the QR code with your authenticator app');
    } catch (error) {
      this.errorHandler.handleError({ error, message: 'Failed to enable MFA', location: 'settings/account', showToast: true });
    } finally {
      this.loading.mfa = false;
    }
  }

  async verifyMFA() {
    if (this.mfaForm.valid) {
      this.loading.mfa = true;
      try {
        await this.supabaseService.verifyMFA(this.mfaForm.get('otpCode')!.value);
        this.messageService.showSuccess('MFA is now enabled', 'You\'ll be prompted for the code next time you login from a new device');
      } catch (error) {
        this.errorHandler.handleError({ error, message: 'Failed to verify MFA', location: 'settings/account', showToast: true });
      } finally {
        this.loading.mfa = false;
      }
    }
  }

  async downloadBackupCodes() {
    this.loading.backupCodes = true;
    try {
      const codes = await this.supabaseService.getBackupCodes();
      // Implement logic to download codes as a file
      this.messageService.showSuccess('Backup codes downloaded', 'Be sure to store them in a safe place');
    } catch (error) {
      this.errorHandler.handleError({ error, message: 'Failed to download backup codes', location: 'settings/account', showToast: true });
    } finally {
      this.loading.backupCodes = false;
    }
  }

  async updateSessionTimeout() {
    if (this.sessionForm.valid) {
      this.loading.session = true;
      this.errorHandler.handleError({ message: 'Method not yet implemented', location: 'settings/account', showToast: true });
      this.loading.session = false;
      // try {
      //   await this.supabaseService.updateSessionTimeout(this.sessionForm.get('sessionTimeout')!.value);
      //   this.messageService.showSuccess('Session timeout updated', '');
      // } catch (error) {
      //   this.errorHandler.handleError({ error, message: 'Failed to update session timeoue', location: 'settings/account', showToast: true });
      // } finally {
      //   this.loading.session = false;
      // }
    }
  }

  async exportData() {
    this.loading.exportData = true;
    try {
      const data = await this.supabaseService.exportUserData();
      // Implement logic to download data as a file
      this.messageService.showSuccess('Data exported', 'Your data has been downloaded');
    } catch (error) {
      this.errorHandler.handleError({ error, message: 'Failed to export data', location: 'settings/account', showToast: true });
    } finally {
      this.loading.exportData = false;
    }
  }

  confirmDeleteAccount() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete your account? This action cannot be undone.',
      accept: () => {
        this.deleteAccount();
      }
    });
  }

  async deleteAccount() {
    this.loading.deleteAccount = true;
    try {
      await this.supabaseService.deleteAccount();
      this.messageService.showSuccess('Account Deleted', 'Your account has been permanently deleted, and all data wiped');
      // Implement logout and redirect logic
    } catch (error) {
      this.errorHandler.handleError({ error, message: 'Failed to delete account', location: 'settings/account', showToast: true });
    } finally {
      this.loading.deleteAccount = false;
    }
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : {'mismatch': true};
  }
}
