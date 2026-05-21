import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  email: string = '';
  password: string = '';
  isLoading: boolean = false;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  // ✅ LOGIN FUNCTION
  login() {

    // 🔥 LOADING START
    this.isLoading = true;

    const data = {
      email: this.email,
      password: this.password
    };

    this.auth.login(data).subscribe({

      next: (res: any) => {

        console.log("LOGIN RES:", res);

        // ✅ CLEAR OLD DATA
        localStorage.clear();

        // ✅ SAVE USER (FULL OBJECT)
        localStorage.setItem('user', JSON.stringify(res));

        // 🔥 IMPORTANT (STRING me save karo)
        localStorage.setItem('userId', res.id.toString());

        // ✅ ROLE SAVE
        localStorage.setItem('role', res.role);

        console.log("Saved userId:", res.id);
        console.log("Saved role:", res.role);

        // 🔥 NAVIGATION (DELAY SAFE)
        setTimeout(() => {
  if (res.role === 'Admin') {
    this.router.navigate(['/admin']);   // ✅ correct
  } else {
    this.router.navigate(['/attendance']);
  }
}, 100);

        this.isLoading = false;
      },

      error: (err) => {
        console.log("Login Error:", err);
        alert("Invalid Email or Password ❌");
        this.isLoading = false;
      }
    });
  }

  // ✅ LOGOUT
  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}