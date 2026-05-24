import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
selector: 'app-activity-history',
templateUrl: './activity-history.component.html',
styleUrls: ['./activity-history.component.css']
})
export class ActivityHistoryComponent implements OnInit {

activityList:any[]=[];
filteredList:any[]=[];

baseUrl=environment.baseUrl;

searchText='';

loading=false;

selectedDate='';

selectedStatus='';

currentPage=1;

pageSize=5;


constructor(
private http:HttpClient,
private router:Router
){}


ngOnInit(){

this.loadAllActivity();

}


// LOAD API DATA
loadAllActivity(){

this.loading=true;

this.http.get<any[]>(
`${this.baseUrl}/activity/all`
)
.subscribe({

next:(res)=>{

console.log(
'Activity Data:',
res
);

this.activityList=
res || [];

this.filteredList=
[...this.activityList];

this.currentPage=1;

this.loading=false;

},

error:(err)=>{

console.log(
'API ERROR:',
err
);

this.activityList=[];

this.filteredList=[];

this.loading=false;

}

});

}



// SEARCH
search(){

this.applyFilters();

}


// FILTER
applyFilters(){

this.filteredList=
this.activityList.filter(x=>{

// DATE
const itemDate=
x.time
?
new Date(x.time)
.toISOString()
.split('T')[0]
:
'';

const dateMatch=
!this.selectedDate
||
itemDate===
this.selectedDate;


// STATUS
const statusMatch=
!this.selectedStatus
||
x.status===
this.selectedStatus;


// SEARCH TEXT
const search=
this.searchText
?.toLowerCase()
.trim()
|| '';

const searchMatch=

(x.name || '')
.toLowerCase()
.includes(search)

||

(x.status || '')
.toLowerCase()
.includes(search)

||

(x.time
?
new Date(x.time)
.toLocaleDateString()
.toLowerCase()
.includes(search)
:
false);


return(
dateMatch
&&
statusMatch
&&
searchMatch
);

});

this.currentPage=1;

}



// PAGINATION
get paginatedData(){

const start=
(this.currentPage-1)
*
this.pageSize;

return this.filteredList.slice(
start,
start+
this.pageSize
);

}


get totalPages(){

return Math.ceil(
this.filteredList.length/
this.pageSize
) || 1;

}


nextPage(){

if(
this.currentPage
<
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



// RESET
resetFilters(){

this.selectedDate='';

this.selectedStatus='';

this.searchText='';

this.filteredList=
[...this.activityList];

this.currentPage=1;

}



// BACK
goBack(){

this.router.navigate(
['/admin']
);

}

}