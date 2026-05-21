import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  apiUrl = 'https://localhost:7125/api/auth';

  constructor(private http: HttpClient) {}

 login(data: any) {
  return this.http.post('https://localhost:44336/api/Auth/login', data);
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