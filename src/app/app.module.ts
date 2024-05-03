//@Author: Lyes Tarzalt
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoadingPageComponent } from './loading-page/loading-page.component';
import { FaceDetectionService } from '@services/face-detection.service';

@NgModule({
  declarations: [AppComponent, LoadingPageComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    LoggerModule.forRoot({
      level: NgxLoggerLevel.DEBUG,
      serverLogLevel: NgxLoggerLevel.ERROR,
    }),
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    FaceDetectionService,

  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
