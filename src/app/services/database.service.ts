import { Injectable, Provider } from '@angular/core';
import { EnvService } from '@/app/services/environment.service';
import SbDatabaseService from '@/app/services/db-query-services/sb-database.service';
import PgDatabaseService from '@/app/services/db-query-services/pg-database.service';
import { SupabaseService } from '@/app/services/supabase.service';
import { ErrorHandlerService } from '@/app/services/error-handler.service';
import { GlobalMessageService } from '@/app/services/messaging.service';
import { PgApiUtilService } from '@/app/utils/pg-api.util';

@Injectable({
  providedIn: 'root',
})
export default class DatabaseService {
  private service: SbDatabaseService | PgDatabaseService;

  constructor(
    envService: EnvService,
    supabaseService: SupabaseService,
    errorHandler: ErrorHandlerService,
    globalMessagingService: GlobalMessageService,
    pgApiUtil: PgApiUtilService,
  ) {
    if (envService.isSupabaseEnabled()) {
      this.service = new SbDatabaseService(
        supabaseService,
        errorHandler,
        globalMessagingService
      );
    } else {
      this.service = new PgDatabaseService(pgApiUtil);
    }
  }

  // Forward method calls to the selected service
  get instance() {
    return this.service;
  }

}
