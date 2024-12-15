import { SupabaseClient, User } from '@supabase/supabase-js';
import { catchError, forkJoin, from, map, Observable, of } from 'rxjs';
import { Notification } from '@/types/Database';

export class NotificationQueries {
  constructor(
    private supabase: SupabaseClient,
    private handleError: (error: any) => Observable<never>,
    private getCurrentUser: () => Promise<User | null>,
  ) {}

  
  // Fetch notification preferences for the logged-in user
  async getNotificationChannels() {
    const { data, error } = await this.supabase
      .from('user_info')
      .select('notification_channels')
      .single();

    if (error) {
      console.error('Error fetching preferences:', error);
      throw error;
    }
    return data?.notification_channels || null;
  }

  // Update notification preferences for the logged-in user
  async updateNotificationChannels(preferences: any) {
    const userId = await this.getCurrentUser().then(user => user?.id);

    const { error } = await this.supabase
      .from('user_info')
      .upsert(
        {
          user_id: userId,
          notification_channels: preferences,
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      this.handleError(error);
      return;
    }
    return true;
  }

  getNotificationPreferences(): Observable<{ domain_id: string; notification_type: string; is_enabled: boolean }[]> {
    return from(this.supabase.from('notification_preferences').select('domain_id, notification_type, is_enabled')).pipe(
      map(({ data, error }) => {
        if (error) {
          this.handleError(error);
          throw error;
        }
        return data;
      }),
      catchError((error) => {
        this.handleError(error);
        return of([]);
      })
    );
  }
  

  updateBulkNotificationPreferences(preferences: { domain_id: string; notification_type: string; is_enabled: boolean }[]): Observable<void> {
    const updates = preferences.map(pref =>
      this.supabase
        .from('notification_preferences')
        .upsert({
          domain_id: pref.domain_id,
          notification_type: pref.notification_type,
          is_enabled: pref.is_enabled,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'domain_id,notification_type' })
    );
  
    return forkJoin(updates).pipe(
      map(() => undefined), // Return void type after all updates
      catchError(error => {
        this.handleError(error);
        throw error;
      })
    );
  }
  
  
  getUserNotifications(limit?: number, offset = 0): Observable<{ notifications: (Notification & { domain_name: string })[]; total: number }> {
    const query = this.supabase
      .from('notifications')
      .select(`
        id,
        change_type,
        message,
        sent,
        read,
        created_at,
        domain_id,
        domains ( domain_name )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(limit || 25)
      .range(offset, offset + (limit || 25));
  
    return from(query).pipe(
      map(({ data, count, error }) => {
        if (error) {
          this.handleError(error);
          throw error;
        }
        
        const notifications = (data || []).map((notification): Notification & { domain_name: string } => ({
          id: notification.id,
          domainId: notification.domain_id,
          change_type: notification.change_type,
          message: notification.message,
          sent: notification.sent,
          read: notification.read,
          created_at: notification.created_at,
          domain_name: ((notification.domains as unknown) as { domain_name: string }).domain_name
        }));
        
        return { notifications, total: count || 0 };
      }),
      catchError((error) => {
        this.handleError(error);
        return of({ notifications: [], total: 0 });
      })
    );
  }
  
  
  async markAllNotificationsRead(read = true): Promise<Observable<void>> {
    const userId = await this.getCurrentUser().then(user => user?.id);
    return from(
      this.supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
    ).pipe(
      map(({ error }) => {
        if (error) {
          this.handleError(error);
          throw error;
        }
      })
    );
  }  

  markNotificationReadStatus(notificationId: string, readStatus: boolean): Observable<void> {
    return from(
      this.supabase
        .from('notifications')
        .update({ read: readStatus })
        .eq('id', notificationId)
    ).pipe(
      map(() => void 0)
    );
  }

  getUnreadNotificationCount(): Observable<number> {
    return from(
      this.supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('read', false)
    ).pipe(
      map(({ count, error }) => {
        if (error) {
          this.handleError(error);
          return 0;
        }
        return count || 0;
      }),
      catchError((error) => {
        this.handleError(error);
        return of(0);
      })
    );
  }
}
