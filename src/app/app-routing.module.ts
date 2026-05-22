import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { AttendanceComponent } from './attendance/attendance.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UsersComponent } from './users/users.component';
import { AuthGuard } from './auth.guard';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component'; 
import { ReportsComponent } from './reports/reports.component';
import { SettingsComponent } from './settings/settings.component';
import { ActivityHistoryComponent } from './activity-history/activity-history.component';
import { MonthlyHoursComponent } from './monthly-hours/monthly-hours.component';


const routes: Routes = [

{ path: '', redirectTo: 'login', pathMatch: 'full' },

{ path: 'login', component: LoginComponent },

{
path: 'dashboard',
component: DashboardComponent,
canActivate: [AuthGuard],
data: { roles: ['Admin'] }
},

{
path: 'attendance',
component: AttendanceComponent,
canActivate: [AuthGuard]
},

{
path: 'users',
component: UsersComponent,
canActivate: [AuthGuard],
data: { roles: ['Admin'] }
},

{
path: 'admin',
component: AdminDashboardComponent,
canActivate: [AuthGuard],
data: { roles: ['Admin'] }
},

{
path: 'reports',
component: ReportsComponent,
canActivate: [AuthGuard],
data: { roles: ['Admin'] }
},

{
path: 'settings',
component: SettingsComponent,
canActivate: [AuthGuard]
},

{
path: 'activity',
component: ActivityHistoryComponent
},

{
path:'monthly-hours',
component:MonthlyHoursComponent
},

/* ALWAYS LAST */

{
path:'**',
redirectTo:'login'
}

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }