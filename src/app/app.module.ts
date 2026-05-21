import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { ToastrModule } from 'ngx-toastr';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { LoginComponent } from './login/login.component';
import { AttendanceComponent } from './attendance/attendance.component';
import { NavbarComponent } from './navbar/navbar.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UsersComponent } from './users/users.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { ReportsComponent } from './reports/reports.component';
import { SettingsComponent } from './settings/settings.component';
import { ActivityHistoryComponent } from './activity-history/activity-history.component';
import { MonthlyHoursComponent } from './monthly-hours/monthly-hours.component';

@NgModule({

  declarations: [

    AppComponent,
    LoginComponent,
    AttendanceComponent,
    NavbarComponent,
    DashboardComponent,
    UsersComponent,
    AdminDashboardComponent,
    ReportsComponent,
    SettingsComponent,
    ActivityHistoryComponent,
    MonthlyHoursComponent

  ],

  imports: [

    BrowserModule,

    AppRoutingModule,

    FormsModule,

    HttpClientModule,

    BrowserAnimationsModule,

    ToastrModule.forRoot({

      timeOut:3000,

      positionClass:'toast-top-right',

      preventDuplicates:true,

      closeButton:true,

      progressBar:true

    })

  ],

  providers: [],

  bootstrap:[AppComponent]

})

export class AppModule { }