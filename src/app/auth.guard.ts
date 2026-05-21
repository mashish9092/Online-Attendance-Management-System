import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {

  const userId = localStorage.getItem('userId');
  const role = localStorage.getItem('role');

  if (!userId) {
    this.router.navigate(['/login']);
    return false;
  }

  // 👉 Admin route protection
  if (route.data['roles'] && !route.data['roles'].includes(role)) {
    alert('Access Denied ❌');
    this.router.navigate(['/dashboard']);
    return false;
  }

  return true;
}
}