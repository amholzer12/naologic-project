import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { NgbDateParserFormatter, NgbDateStruct, NgbInputDatepickerConfig } from '@ng-bootstrap/ng-bootstrap';

import { routes } from './app.routes';

// MM.DD.YYYY formatter to match the Sketch design (e.g. 12.30.2025)
class MdyDateFormatter extends NgbDateParserFormatter {
  parse(value: string): NgbDateStruct | null {
    if (!value) return null;
    const parts = value.split('.');
    if (parts.length !== 3) return null;
    return { month: +parts[0], day: +parts[1], year: +parts[2] };
  }
  format(date: NgbDateStruct | null): string {
    if (!date) return '';
    return `${String(date.month).padStart(2, '0')}.${String(date.day).padStart(2, '0')}.${date.year}`;
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: NgbDateParserFormatter, useValue: new MdyDateFormatter() },
    {
      provide: NgbInputDatepickerConfig,
      useFactory: () => {
        const config = new NgbInputDatepickerConfig();
        config.navigation = 'none';
        return config;
      }
    },
  ]
};
