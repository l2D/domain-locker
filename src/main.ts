
import './styles.css';
import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error('Ah fuck, something went seriously wrong...', err));
