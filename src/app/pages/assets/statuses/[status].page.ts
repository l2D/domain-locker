import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { DbDomain } from '@/types/Database';
import DatabaseService from '@/app/services/database.service';
import { MessageService } from 'primeng/api';
import { DomainCollectionComponent } from '@components/domain-collection/domain-collection.component';
import { getByEppCode, type SecurityCategory } from '@/app/constants/security-categories';

@Component({
  standalone: true,
  selector: 'app-status-domains',
  imports: [CommonModule, PrimeNgModule, DomainCollectionComponent],
  template: `
    <h1>Domains with status "{{ statusInfo ? statusInfo.label : statusCode }}"</h1>
    
    @if (statusInfo) {
      <div class="flex gap-2 items-center">
        @if (statusInfo.severity === 'good') {
          <p-tag icon="pi pi-check-circle" severity="success" />
        } @else if (statusInfo.severity === 'bad') {
          <p-tag icon="pi pi-times-circle" severity="danger" />
        } @else {
          <p-tag icon="pi pi-info-circle" severity="info" />
        }
        <p class="my-0 italic text-surface-500 text-lg opacity-90">{{ statusInfo.description }}</p>
      </div>
      @if (statusInfo.actionToTake && statusInfo.severity === 'bad') {
          <p class="my-0 text-red-400">{{ statusInfo.actionToTake }}</p>
        } @else if (statusInfo.actionToTake) {
          <p class="my-0 text-blue-400">{{ statusInfo.actionToTake }}</p>
        } @else {
          <p class="my-0 text-green-400">This is a good status, no action is needed</p>
        }
    }
    
    <app-domain-view
    [domains]="domains"
    [preFilteredText]="'with status '+statusCode+''"
    [showAddButton]="false"
    *ngIf="!loading" />
    <p-progressSpinner *ngIf="loading"></p-progressSpinner>
  `,
})
export default class StatusDomainsPageComponent implements OnInit {
  statusCode: string = '';
  domains: DbDomain[] = [];
  loading: boolean = true;
  statusInfo: SecurityCategory | undefined;

  constructor(
    private route: ActivatedRoute,
    private databaseService: DatabaseService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.statusCode = params['status'];
      this.statusInfo = getByEppCode(this.statusCode);
      this.loadDomains();
    });
  }

  loadDomains() {
    this.loading = true;
    this.databaseService.getDomainsByStatus(this.statusCode).subscribe({
      next: (domains) => {
        this.domains = domains;
        this.loading = false;
      },
      error: (error) => {
        console.error(`Error fetching domains for status ${this.statusCode}:`, error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load domains for this status'
        });
        this.loading = false;
      }
    });
  }
}
