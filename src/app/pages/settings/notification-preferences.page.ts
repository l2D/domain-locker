import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '../../prime-ng.module';
import { ReactiveFormsModule } from '@angular/forms';
import { DlIconComponent } from '@components/misc/svg-icon.component';
import { GlobalMessageService } from '@services/messaging.service';
import DatabaseService from '@services/database.service';
import { SupabaseService } from '@/app/services/supabase.service';
import { FeatureService } from '@/app/services/features.service';
import { FeatureNotEnabledComponent } from '@components/misc/feature-not-enabled.component';

interface NotificationChannelField {
  label: string;
  name: string;
  placeholder?: string;
  validator?: any;
  defaultValue?: string;
}

interface NotificationChannelProvider {
  label: string;
  value: string;
  fields: NotificationChannelField[];
}

interface NotificationChannel {
  name: string;
  formControlName: string;
  requires: NotificationChannelField[];
  providers?: NotificationChannelProvider[];
}

@Component({
  selector: 'app-notification-preferences',
  templateUrl: './notification-preferences.page.html',
  standalone: true,
  imports: [CommonModule, PrimeNgModule, ReactiveFormsModule, DlIconComponent, FeatureNotEnabledComponent],
  providers: [],
  styles: ['::ng-deep .p-card-content { padding: 0; } '],
})
export default class NotificationPreferencesPage implements OnInit {
  
  notificationFeatureEnabled$ = this.featureService.isFeatureEnabled('notificationChannels');
  
  notificationForm!: FormGroup;
  notificationChannels: NotificationChannel[] = [
    {
      name: 'Email',
      formControlName: 'email',
      requires: [
        { label: 'Notification Email', name: 'address', placeholder: 'Enter email', validator: [Validators.required, Validators.email] }
      ]
    },
    {
      name: 'Push Notifications',
      formControlName: 'pushNotification',
      requires: []
    },
    {
      name: 'Web Hook',
      formControlName: 'webHook',
      requires: [
        { label: 'Webhook URL', name: 'url', placeholder: 'Enter webhook URL' }
      ],
      providers: [
        {
          label: 'Ntfy',
          value: 'ntfy',
          fields: [
            { label: 'Topic', name: 'topic', placeholder: 'Enter topic' },
          ]
        },
        {
          label: 'Gotify',
          value: 'gotify',
          fields: [
            { label: 'Token', name: 'token', placeholder: 'Enter token' }
          ]
        },
        {
          label: 'Pushbits',
          value: 'pushbits',
          fields: [
            { label: 'Token', name: 'token', placeholder: 'Enter token' },
            { label: 'User ID', name: 'userId', placeholder: 'Enter user ID' },
          ]
        },
        {
          label: 'Pushbullet',
          value: 'pushbullet',
          fields: [
            { label: 'Access Token', name: 'accessToken', placeholder: 'Enter access token' }
          ]
        },
        {
          label: 'Custom',
          value: 'custom',
          fields: [
            { label: 'Headers', name: 'headers', placeholder: 'Specified as valid JSON' }
          ]
        }
      ],
    },
    {
      name: 'Signal',
      formControlName: 'signal',
      requires: [
        { label: 'Signal Number', name: 'number', placeholder: 'Enter Signal number' },
        { label: 'API Key', name: 'apiKey', placeholder: 'Enter API key' }
      ]
    },
    {
      name: 'Telegram',
      formControlName: 'telegram',
      requires: [
        { label: 'Bot Token', name: 'botToken', placeholder: 'Enter bot token' },
        { label: 'Chat ID', name: 'chatId', placeholder: 'Enter chat ID' }
      ]
    },
    {
      name: 'Slack',
      formControlName: 'slack',
      requires: [
        { label: 'Webhook URL', name: 'webhookUrl', placeholder: 'Enter webhook URL' }
      ]
    },
    {
      name: 'Matrix',
      formControlName: 'matrix',
      requires: [
        { label: 'Homeserver URL', name: 'homeserverUrl', placeholder: 'Enter homeserver URL' },
        { label: 'Access Token', name: 'accessToken', placeholder: 'Enter access token' }
      ]
    }
  ];

  constructor(
    private fb: FormBuilder,
    private globalMessageService: GlobalMessageService,
    private databaseService: DatabaseService,
    private supabaseService: SupabaseService,
    private featureService: FeatureService,
  ) {}

  ngOnInit() {
    this.initializeForm();
    this.loadNotificationPreferences();
  }

  private initializeForm() {
    const formGroupConfig: Record<string, FormGroup> = this.notificationChannels.reduce((config, channel) => {
        const channelConfig: { [key: string]: any } = { enabled: [false] };
        channel.requires.forEach(requirement => {
            channelConfig[requirement.name] = ['', requirement.validator || []];
        });

        if (channel.providers) {
            channelConfig['provider'] = [''];
            channel.providers.forEach((provider: NotificationChannelProvider) => {
                provider.fields.forEach((field: NotificationChannelField) => {
                    channelConfig[field.name] = ['', field.validator || []];
                });
            });
        }
        config[channel.formControlName] = this.fb.group(channelConfig) as FormGroup;
        return config;
    }, {} as Record<string, FormGroup>);

    this.notificationForm = this.fb.group(formGroupConfig);
  }

  private async loadNotificationPreferences() {
    const userEmail = (await this.supabaseService.getCurrentUser())?.email || '';
    try {
      const preferences = await this.databaseService.notificationQueries.getNotificationChannels();

      if (preferences) {
        this.notificationForm.patchValue(preferences);
      } else {
        // Set default: Email enabled with user's auth email if it exists
        this.notificationForm.get('email')?.patchValue({ enabled: true, address: userEmail });
      }
    } catch (error) {
      this.notificationForm.get('email')?.patchValue({ enabled: true, address: userEmail });
    }
  }
  private onProviderChange() {
    this.notificationForm.get('webHook')?.get('provider')?.valueChanges.subscribe(() => {
      this.setDefaultWebhookNotificationUrls();
    });
  }
  
  ngAfterViewInit() {
    this.onProviderChange();
  }
  private setDefaultWebhookNotificationUrls() {
    const webhookUrl = this.notificationForm.get('webHook')?.get('url');
    const newProvider = this.notificationForm.get('webHook')?.get('provider')?.value;
    if (newProvider === 'ntfy') {
      webhookUrl?.patchValue('https://ntfy.sh');
    } else if (newProvider === 'gotify') {
      webhookUrl?.patchValue('');
    } else if (newProvider === 'pushbits') {
      webhookUrl?.patchValue('');
    } else if (newProvider === 'pushbullet') {
      webhookUrl?.patchValue('https://pushbullet.com');
    } else if (newProvider === 'custom') {
      webhookUrl?.patchValue('');
    }
  }

  savePreferences() {
    let isValid = true;
    this.notificationChannels.forEach(channel => {
      const channelForm = this.notificationForm.get(channel.formControlName) as FormGroup;
      const isEnabled = channelForm.get('enabled')?.value;

      if (isEnabled) {
        channel.requires.forEach(field => {
          const control = channelForm.get(field.name);
          if (control) {
            control.setValidators([Validators.required].concat(field.validator || []));
            control.updateValueAndValidity();
            if (control.invalid) {
              control.markAsTouched();
              isValid = false;
            }
          }
        });

        if (channel.providers) {
          const selectedProvider = channelForm.get('provider')?.value;
          const provider = channel.providers.find(p => p.value === selectedProvider);

          provider?.fields.forEach(field => {
            const control = channelForm.get(field.name);
            if (control) {
              control.setValidators([Validators.required].concat(field.validator || []));
              control.updateValueAndValidity();
              if (control.invalid) {
                control.markAsTouched();
                isValid = false;
              }
            }
          });
        }
      }
    });

    if (isValid) {
      this.databaseService.notificationQueries.updateNotificationChannels(this.notificationForm.value)
        .then(() => {
          this.globalMessageService.showMessage({
            severity: 'success',
            summary: 'Success',
            detail: 'Preferences saved successfully'
          });
        })
        .catch(error => {
          console.error('Error saving preferences:', error);
          this.globalMessageService.showMessage({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to save notification preferences'
          });
        });
    } else {
      this.globalMessageService.showMessage({
        severity: 'error',
        summary: 'Error',
        detail: 'Please complete all required fields for enabled notifications'
      });
    }
  }
}
