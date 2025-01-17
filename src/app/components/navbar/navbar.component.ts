// src/app/components/navbar/navbar.component.ts
import { Component, OnInit, ChangeDetectorRef, PLATFORM_ID, inject, ViewChild, AfterViewInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { SupabaseService } from '@/app/services/supabase.service';
import { FormsModule } from '@angular/forms';
import { SelectButtonModule } from 'primeng/selectbutton';
import { RadioButtonModule } from 'primeng/radiobutton';
import { OverlayModule } from 'primeng/overlay';
import { Subscription } from 'rxjs';
import { authenticatedNavLinks, unauthenticatedNavLinks, settingsLinks } from '@/app/constants/navigation-links';
import { UiSettingsComponent } from '@/app/components/settings/ui-options/ui-options.component';
import { NotificationsListComponent } from '@components/notifications-list/notifications-list.component';
import { OverlayPanel } from 'primeng/overlaypanel';
import DatabaseService from '@/app/services/database.service';
import { BillingService, UserType } from '@/app/services/billing.service';
import { EnvironmentType, EnvService } from '@/app/services/environment.service';
import { LogoComponent} from '@components/home-things/logo/logo.component';
import { FeatureService } from '@/app/services/features.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PrimeNgModule,
    FormsModule,
    SelectButtonModule,
    RadioButtonModule,
    OverlayModule,
    UiSettingsComponent,
    NotificationsListComponent,
    LogoComponent,
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, AfterViewInit {
  @ViewChild('notificationsOverlay') notificationsOverlay!: OverlayPanel;
  notificationsVisible: boolean = false;
  items: MenuItem[] = [];
  itemsWithSettings: MenuItem[] = [];
  sidebarVisible: boolean = false;
  settingsVisible: boolean = false;
  isAuthenticated: boolean = false;
  unreadNotificationsCount: number = 0;
  userPlan: EnvironmentType | UserType | null = null;
  planColor: string = 'primary';

  settingsEnabled$ = this.featureService.isFeatureEnabled('accountSettings');
  private subscriptions: Subscription = new Subscription();
  private platformId = inject(PLATFORM_ID);

  constructor(
    public supabaseService: SupabaseService,
    private databaseService: DatabaseService,
    private billingService: BillingService,
    private environmentService: EnvService,
    private cdr: ChangeDetectorRef,
    private featureService: FeatureService,
  ) {}

  ngOnInit() {
    // Initial check for auth status
    this.checkAuthStatus();
    this.billingService.fetchUserPlan();

    this.subscriptions.add(
      this.supabaseService.authState$.subscribe(isAuthenticated => {
        this.isAuthenticated = isAuthenticated;
        this.initializeMenuItems();
        this.cdr.detectChanges();
      })
    );
  }

  ngAfterViewInit() {
    this.loadUnreadNotificationCount();
    this.loadUserPlanEnvironment();
  }

  loadUserPlanEnvironment() {
    const environmentType = this.environmentService.getEnvironmentType();
    if (environmentType === 'managed') {
      this.billingService.getUserPlan().subscribe(plan => {
        this.userPlan = plan;
        this.planColor = this.getColorForPlan(this.userPlan);
        this.cdr.detectChanges();
      });
    } else {
      this.userPlan = environmentType;
      this.cdr.detectChanges();
    }
  }

  getColorForPlan(plan: EnvironmentType | UserType | null): string {
    switch (plan) {
      case 'free':
        return 'cyan';
      case 'hobby':
        return 'yellow';
      case 'pro':
        return 'orange';
      case 'sponsor':
        return 'pink';
      case 'enterprise':
        return 'blue';
      case 'tester':
        return 'red';
      case 'super':
        return 'indigo';
      case 'selfHosted':
        return 'teal';
      case 'demo':
        return 'orange';
      case 'dev':
        return 'purple';
      default:
        return 'primary';
    }
  }

  loadUnreadNotificationCount() {
    this.databaseService.instance.notificationQueries.getUnreadNotificationCount().subscribe(
      (count) => this.unreadNotificationsCount = count,
    );
  }

  async checkAuthStatus() {
    const isAuthenticated = await this.supabaseService.isAuthenticated();
    this.supabaseService.setAuthState(isAuthenticated);
  }

  async initializeMenuItems() {
    if (this.isAuthenticated) {
      // User is logged in, show authenticated nav links
      this.items = authenticatedNavLinks as MenuItem[];
      this.itemsWithSettings = [
        ...(authenticatedNavLinks as MenuItem[]),
        { label: 'Settings', routerLink: '/settings', icon: 'pi pi-wrench',  items: settingsLinks as MenuItem[] },
      ];
    } else {
      // User is not logged in, show docs links
      this.items = unauthenticatedNavLinks;
      this.itemsWithSettings = unauthenticatedNavLinks;
      if (await this.featureService.isFeatureEnabledPromise('disableDocs')) {
        // Docs is disabled, don't show docs links
        this.items = [];
        this.itemsWithSettings = [];
      }
    }
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }

  closeSidebar() {
    this.sidebarVisible = false;
    this.cdr.detectChanges();
  }

  toggleNotifications(event: Event) {
    this.notificationsVisible = true;
    this.notificationsOverlay.toggle(event);
    this.unreadNotificationsCount = 0;
  }

  toggleSettings(event: Event) {
    this.settingsVisible = !this.settingsVisible;
    event.preventDefault();
  }

  async signOut() {
    await this.supabaseService.signOut();
    window.location.href = '/login';
  }
}
