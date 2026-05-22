import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
    searchText: string = '';

  totalUsers = 4;
  present = 1;
  absent = 3;
  late = 1;
  hours = '03:45';

  recent = [
    { name: 'Ashish', date: '17 Apr', checkIn: '11:00 AM', status: 'Late' },
    { name: 'Rohit', date: '17 Apr', checkIn: '09:10 AM', status: 'On Time' },
     { name: 'Amit', date: '16 Apr', checkIn: '10:45 AM', status: 'Late' }
  ];
filteredData() {
    console.log("RUNNING FILTER");
    return this.recent.filter(x =>
      x.name.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }
  constructor(private router: Router) {}

  goToUsers() {
    this.router.navigate(['/users']);
  }
}