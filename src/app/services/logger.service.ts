//@Author: Lyes Tarzalt
import { Injectable } from '@angular/core';
import { NGXLogger, NgxLoggerLevel } from 'ngx-logger';

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  constructor(private ngxLogger: NGXLogger) {}

  private log(
    level: NgxLoggerLevel,
    message: string,
    data: any = '',
    stackTrace?: string
  ): void {
    const simpleMessage = `${message}`;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level: NgxLoggerLevel[level],
      message,
      data: data === undefined ? '' : data,
      stackTrace: stackTrace || '',
    };
    switch (level) {
      case NgxLoggerLevel.DEBUG:
        this.ngxLogger.debug(simpleMessage, data);
        break;
      case NgxLoggerLevel.INFO:
        this.ngxLogger.info(simpleMessage, data);
        break;
      case NgxLoggerLevel.WARN:
        this.ngxLogger.warn(simpleMessage, data);
        break;
      case NgxLoggerLevel.ERROR:
        this.ngxLogger.error(simpleMessage, data, stackTrace);
        break;
      default:
        this.ngxLogger.log(simpleMessage, data); // Generic log
    }
  }

  debug(message: string, data?: any) {
    this.log(NgxLoggerLevel.DEBUG, message, data);
  }

  info(message: any, data?: any) {
    this.log(NgxLoggerLevel.INFO, message, data);
  }

  warn(message: string, data?: any) {
    this.log(NgxLoggerLevel.WARN, message, data);
  }

  error(message: string, data?: any, error?: Error) {
    const stackTrace = error?.stack || 'Stack trace unavailable';
    const context = error ? this.parseErrorStack(error) : 'Context unknown';

    this.log(NgxLoggerLevel.ERROR, `${context}: ${message}`, data, stackTrace);
  }

  event(eventType: string, data?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      data,
    };

    this.ngxLogger.info(JSON.stringify(logEntry));
  }

  private parseErrorStack(error: Error): string {
    const stackLines = error.stack?.split('\n') || [];
    const relevantLine = stackLines[1] || 'Context parsing error';
    return relevantLine.trim();
  }
}
