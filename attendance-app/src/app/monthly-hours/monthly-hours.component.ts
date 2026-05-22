import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
selector:'app-monthly-hours',
templateUrl:'./monthly-hours.component.html',
styleUrls:['./monthly-hours.component.css']
})

export class MonthlyHoursComponent implements OnInit{

summary:any={};
details:any=[];
currentPage=1;

pageSize=5;


baseUrl='https://localhost:44336/api';

months=[
'January',
'February',
'March',
'April',
'May',
'June',
'July',
'August',
'September',
'October',
'November',
'December'
];

years=[
2025,
2026,
2027
];

selectedMonth=
new Date().getMonth()+1;

selectedYear=
new Date().getFullYear();

userId:any;

constructor(
private http:HttpClient
){}

ngOnInit(){

const user=
JSON.parse(
localStorage.getItem('user') || '{}'
);

this.userId=user.id;

this.loadMonthlyData();

}


loadMonthlyData(){

this.http.get(
`${this.baseUrl}/attendance/monthly-summary/${this.userId}?month=${this.selectedMonth}&year=${this.selectedYear}`

).subscribe((res:any)=>{

this.summary=res;

});


this.http.get(
`${this.baseUrl}/attendance/monthly-details/${this.userId}?month=${this.selectedMonth}&year=${this.selectedYear}`

).subscribe((res:any)=>{

this.details=res;

});

}
get paginatedData(){

const start=

(this.currentPage-1)
*
this.pageSize;

return this.details.slice(
start,
start+this.pageSize
);

}

get totalPages(){

return Math.ceil(
this.details.length/
this.pageSize
);

}


nextPage(){

if(
this.currentPage<
this.totalPages
){

this.currentPage++;

}

}


prevPage(){

if(
this.currentPage>1
){

this.currentPage--;

}

}

}