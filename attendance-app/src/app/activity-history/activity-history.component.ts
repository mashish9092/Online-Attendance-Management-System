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
baseUrl = environment.baseUrl;
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


loadAllActivity(){

this.loading=true;

this.http
.get<any[]>(
`${this.baseUrl}/activity/all`
)

.subscribe({

next:(res)=>{

console.log(
"Activity Data:",
res
);

this.activityList=res;

this.filteredList=res;

this.loading=false;

},

error:(err)=>{

console.log(
"API ERROR:",
err
);

this.loading=false;

}

});

}


// 🔍 SEARCH
search(){

this.applyFilters();

}

applyFilters(){

this.filteredList =
this.activityList.filter(x=>{

// Date filter
const itemDate =
new Date(x.time)
.toISOString()
.split('T')[0];

const dateMatch =
!this.selectedDate ||
itemDate===this.selectedDate;


// Status filter
const statusMatch=
!this.selectedStatus ||
x.status===this.selectedStatus;


// Search
const search=
this.searchText?.toLowerCase() || '';

const searchMatch=

x.name?.toLowerCase().includes(search)

||

x.status?.toLowerCase().includes(search)

||

new Date(x.time)
.toLocaleDateString()
.toLowerCase()
.includes(search);


return dateMatch &&
statusMatch &&
searchMatch;

});

this.currentPage=1;

}

get paginatedData(){

const start=
(this.currentPage-1)
*this.pageSize;

return this.filteredList.slice(
start,
start+this.pageSize
);

}

get totalPages(){

return Math.ceil(
this.filteredList.length/
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
resetFilters(){

this.selectedDate='';

this.selectedStatus='';

this.searchText='';

this.filteredList=[...this.activityList];

this.currentPage=1;

}

goBack(){

this.router.navigate(
['/admin']
);

}

}