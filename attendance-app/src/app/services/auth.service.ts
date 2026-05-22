import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

apiUrl = `${environment.baseUrl}/auth`;

  constructor(private http: HttpClient) {}

login(data:any){

return this.http.post(
`${this.apiUrl}/login`,
data
);

}
// ✅ LOGIN CHECK
isLoggedIn() {
  return !!localStorage.getItem('user');  // 🔥 token nahi, user
}

// ✅ LOGOUT
logout() {
  localStorage.clear();
}
}