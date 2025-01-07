import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { BillingService } from '@/app/services/billing.service';
import { EnvService, type EnvironmentType } from '@/app/services/environment.service';
import { features, type FeatureConfig, type FeatureDefinitions } from '@/app/constants/feature-options';

@Injectable({
  providedIn: 'root',
})
export class FeatureService {
  private environment: EnvironmentType;
  private userPlan$: Observable<string | null>;
  private features: FeatureDefinitions = features;

  private activeFeatures$: BehaviorSubject<Record<keyof FeatureDefinitions, any>> = new BehaviorSubject({} as Record<keyof FeatureDefinitions, any>);

  constructor(private billingService: BillingService, private environmentService: EnvService) {
    this.environment = this.environmentService.getEnvironmentType();
    this.userPlan$ = this.billingService.getUserPlan();

    // Reactive update for feature configurations
    combineLatest([this.userPlan$]).subscribe(([userPlan]) => {
      const features = this.resolveFeatures(userPlan || 'free');
      this.activeFeatures$.next(features);
    });
  }

  /**
   * Resolves features based on user plan, environment, and feature configuration.
   */
  private resolveFeatures(userPlan: string): Record<keyof FeatureDefinitions, any> {
    const features: Record<keyof FeatureDefinitions, any> = {} as Record<
      keyof FeatureDefinitions,
      any
    >;
    for (const [feature, config] of Object.entries(this.features) as [
      keyof FeatureDefinitions,
      any
    ][]) {
      if (this.environment === 'managed') {
        // If `managed` is a single value, use it directly
        if (typeof config.managed === 'boolean' || typeof config.managed === 'number') {
          features[feature] = config.managed;
        } else if (typeof config.managed === 'object') {
          // Otherwise, check for userPlan-specific value
          features[feature] = config.managed[userPlan] ?? config.default;
        }
      } else if (config[this.environment] !== undefined) {
        // If there's an environment-specific value (e.g., selfHosted, demo)
        features[feature] = config[this.environment];
      } else {
        // Default value
        features[feature] = config.default;
      }
    }

    return features;
  }


  /**
   * Get the resolved value for a specific feature.
   */
  public getFeatureValue<T>(feature: keyof FeatureDefinitions): Observable<T | null> {
    return this.activeFeatures$.pipe(map((features) => (features[feature] ?? null) as T | null));
  }

  /**
   * Check if a specific feature is enabled (boolean features).
   */
  public isFeatureEnabled(feature: keyof FeatureDefinitions): Observable<boolean> {
    return this.getFeatureValue<boolean>(feature).pipe(
      map((value) => {
        if (typeof value !== 'boolean') {
          console.error(`Feature "${feature}" did not resolve to a boolean. Got:`, value);
          return false; // Fallback to false if value isn't boolean
        }
        return value;
      })
    );
  }
  
}
