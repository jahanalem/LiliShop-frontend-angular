import { NgModule, provideZonelessChangeDetection } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { SharedModule } from './shared/shared.module';
import { CoreModule } from './core/core.module';
import { AppComponent } from './app.component';
import { CloudinaryModule } from '@cloudinary/ng';
import { RouterModule } from '@angular/router';
import { provideCloudinaryLoader } from '@angular/common';

@NgModule({
  declarations: [
    AppComponent,
  ],
  bootstrap: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    CoreModule,
    SharedModule,
    RouterModule,
    CloudinaryModule,
  ],
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(withInterceptors([jwtInterceptor, loadingInterceptor, errorInterceptor])),
    provideCloudinaryLoader('https://res.cloudinary.com/rouhi')
  ]
})
export class AppModule { }
