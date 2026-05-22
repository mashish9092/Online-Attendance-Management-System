import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {

  // Base URL
  private apiUrl = 'https://localhost:44336/api/attendance';

  constructor(
    private http: HttpClient
  ) { }

  // ==============================
  // 👑 ADMIN APIs
  // ==============================

  // Get All Attendance
  getAllAttendance(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/all`
    );
  }

  // Dashboard
  getDashboard(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/dashboard`
    );
  }

  // Today Attendance
  getTodayAttendance(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/today`
    );
  }


  // ==============================
  // 👤 USER APIs
  // ==============================

  getMyAttendance(userId:number): Observable<any>{

    return this.http.get<any>(
      `${this.apiUrl}/list/${userId}`
    );

  }


  // ==============================
  // ⏱ ATTENDANCE ACTIONS
  // ==============================

  checkIn(userId:number): Observable<any>{

    return this.http.post<any>(
      `${this.apiUrl}/checkin`,
      userId
    );

  }


  checkOut(userId:number): Observable<any>{

    return this.http.post<any>(
      `${this.apiUrl}/checkout`,
      userId
    );

  }


  // ==============================
  // 📊 REPORTS
  // ==============================

  getMonthlyReport(
    userId:number,
    month:number,
    year:number
  ): Observable<any>{

    return this.http.get<any>(
`${this.apiUrl}/monthly-report?userId=${userId}&month=${month}&year=${year}`
    );

  }


  // ==============================
  // ⚙ SETTINGS
  // ==============================

  getProfile(userId:number): Observable<any>{

    return this.http.get<any>(
`https://localhost:44336/api/users/profile/${userId}`
    );

  }


  updateProfile(data:any): Observable<any>{

    return this.http.put<any>(
`https://localhost:44336/api/users/update-profile`,
      data
    );

  }
  changePassword(data:any){
return this.http.put(
'https://localhost:44336/api/users/change-password',
data
);
}
getActivity(){

return this.http.get(
'https://localhost:44336/api/activity'
);

}

}