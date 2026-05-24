import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AttendanceService } from '../services/attendance.service';
import * as ExcelJS from 'exceljs';
import * as FileSaver from 'file-saver';
import { ToastrService } from 'ngx-toastr';
import { environment } from 'src/environments/environment';


@Component({
  selector: 'app-attendance',
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.css']
})
export class AttendanceComponent implements OnInit {

  // 🔥 BASE URL (IMPORTANT)
baseUrl = environment.baseUrl;

  data: any[] = [];
  userName: string = '';
  isCheckedIn = false;
  checkInTime: any;
  workingHours = '00:00';
  todayCheckIn:any='--:--';
todayCheckOut:any='--:--';
todayStatus:any='--';
  attendanceList: any[] = []; 
  dashboard: any = {
    totalUsers: 0,
    presentToday: 0,
    absentToday: 0,
    lateCount: 0,
    workingHoursToday: '00:00'
    
  };

  monthlyHours: any = 0;
  currentTime: string = '';
  searchText='';

  currentPage=1;

  pageSize=5;
get paginatedData(){

const filtered =
this.filteredAttendance();

const start =
(this.currentPage-1)
*this.pageSize;

return filtered.slice(
start,
start+this.pageSize
);

}
get totalPages(){

return Math.ceil(
this.filteredAttendance().length /
this.pageSize
);

}
nextPage(){

if(
this.currentPage <
this.totalPages
){

this.currentPage++;

}

}
prevPage(){

if(
this.currentPage > 1
){

this.currentPage--;

}

}
  constructor(
    private service: AttendanceService,
    private http: HttpClient,
    private router: Router,
     private toastr:ToastrService
  ) {}

  goDashboard(){

this.router.navigate(['/admin']);

}

filteredAttendance() {

if (!this.data) {
return [];
}

return this.data.filter((x:any)=>{

const search =
this.searchText
.toLowerCase()
.trim();

const name =
(x.name || '')
.toLowerCase();


// Full formatted date
const formattedDate =
x.date
? new Date(x.date)
.toLocaleDateString(
'en-US',
{
month:'short',
day:'numeric',
year:'numeric'
}
).toLowerCase()
: '';


// day only
const day =
x.date
? new Date(x.date)
.getDate()
.toString()
: '';


// month only
const month =
x.date
? new Date(x.date)
.toLocaleString(
'en-US',
{
month:'short'
}
).toLowerCase()
: '';


// year only
const year =
x.date
? new Date(x.date)
.getFullYear()
.toString()
: '';

return(

name.includes(search) ||

formattedDate.includes(search) ||

day.includes(search) ||

month.includes(search) ||

year.includes(search)

);

});

}

  // ✅ USER ID
  getUserId() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.id;
  }

  // ✅ INIT
 ngOnInit() {

const user = JSON.parse(localStorage.getItem('user') || '{}');
const userId = user?.id;

if (!userId) {
this.router.navigate(['/login']);
return;
}

this.userName = user?.name;


// this.markAbsent();     // 🔥 NEW

this.refreshData();
this.loadData(userId);
this.loadDashboard();

this.updateTime();

setInterval(() => {
this.updateTime();
},1000);

}

markAbsent(){

this.http.post<any>(
`${this.baseUrl}/attendance/mark-absent`,
{}
)
.subscribe({

next:(res)=>{

console.log("Absent marked");

},

error:(err)=>{

console.log(err);

}

});

}
  // ✅ USER HISTORY (LIST)
  loadData(userId: any) {
    if (!userId) return;

    this.http.get<any[]>(`${this.baseUrl}/attendance/list/${userId}`)
      .subscribe({
       next:(res)=>{

console.log("USER LIST:",res);

this.data=res;


// 🔥 Latest attendance top row
if(this.data.length>0)
{
const latest=this.data[0];

this.todayCheckIn=

latest.checkInTime

?

new Date(
latest.checkInTime
)
.toLocaleTimeString(
[],
{
hour:'2-digit',
minute:'2-digit'
}
)

:

'--:--';


this.todayCheckOut=

latest.checkOutTime

?

new Date(
latest.checkOutTime
)
.toLocaleTimeString(
[],
{
hour:'2-digit',
minute:'2-digit'
}
)

:

'--:--';


this.todayStatus=
latest.status || '--';
}

},
        error: (err) => {
          console.log("LIST ERROR:", err);
        }
      });
  }

  // ✅ TODAY DATA (TABLE)
  refreshData() {
    this.http.get<any[]>(`${this.baseUrl}/attendance/today`)
      .subscribe({
        next: (res) => {
          console.log("TODAY DATA:", res);

          this.attendanceList = res;
         this.attendanceList = res;
        },
        error: (err) => {
          console.error("REFRESH ERROR:", err);
        }
      });
  }

  // ✅ CHECK IN
checkIn() {

const userId=this.getUserId();

if(!userId){

this.router.navigate(['/login']);
return;

}

this.http.post<any>(
`${this.baseUrl}/attendance/checkin`,
userId

).subscribe({

next:(res)=>{

this.toastr.success(
res.message,
'Success'
);

if(
res.message.includes(
'Previous attendance auto closed'
))
{
this.toastr.warning(
'Yesterday checkout was missing and auto closed',
'Attendance Alert'
);
}

this.checkInTime=
new Date(res.checkInTime);

this.isCheckedIn=true;

this.startTimer();

this.refreshData();

this.loadData(userId);

this.loadDashboard();

},

error:(err)=>{

this.toastr.error(
err.error || 'Check In Failed',
'Error'
);

}

});

}

  // ✅ CHECK OUT
checkOut(){

const userId=
this.getUserId();

if(!userId){

this.router.navigate(['/login']);
return;

}

this.http.post<any>(
`${this.baseUrl}/attendance/checkout`,
userId

).subscribe({

next:(res)=>{

this.toastr.success(
res.message,
'Success'
);

this.isCheckedIn=false;

this.workingHours=
res.workingHours;


this.refreshData();

this.loadData(userId);

this.loadDashboard();

},

error:(err)=>{

this.toastr.error(
err.error || 'Check Out Failed',
'Error'
);


}

});

}

  // ✅ TIMER
  startTimer() {
    setInterval(() => {
      if (this.checkInTime) {
        const now = new Date();
        const diff = now.getTime() - this.checkInTime.getTime();

        const hours = Math.floor(diff / 1000 / 60 / 60);
        const minutes = Math.floor((diff / 1000 / 60) % 60);

        this.workingHours =
          String(hours).padStart(2, '0') + ':' +
          String(minutes).padStart(2, '0');
      }
    }, 1000);
  }

  // ✅ CLOCK
  updateTime() {
    const now = new Date();
    this.currentTime = now.toLocaleString();
  }

  // ✅ DASHBOARD (dummy)
 loadDashboard(){

this.http.get<any>(
`${this.baseUrl}/attendance/dashboard`
)
.subscribe({

next:(res)=>{

this.dashboard=res;

},

error:(err)=>{

console.log(err);

}

});

}
  getMonthlyHours() {
  console.log("Monthly Hours clicked");

  // dummy for now
  this.monthlyHours = 120;

this.toastr.info(
'Monthly Hours : ' + this.monthlyHours,
'Report'
);
}

openMonthlyHours(){

console.log("Monthly clicked");

this.router.navigateByUrl(
'/monthly-hours'
);

}

exportAttendanceExcel(){

const data = this.filteredAttendance();

if(data.length===0){

this.toastr.warning(
'No data found',
'Warning'
);

return;

}

const workbook = new ExcelJS.Workbook();

const worksheet =
workbook.addWorksheet(
'Attendance'
);

const today = new Date();

const fileDate =
today
.toLocaleDateString('en-GB')
.replace(/\//g,'-');



// ===== COUNTS =====

const total =
data.length;

const late =
data.filter(
(x:any)=>x.isLate
).length;

const present =
data.filter(
(x:any)=>!x.isLate
).length;

const absent = 0;



// ===== TITLE =====

worksheet.mergeCells('A1:H1');

const title =
worksheet.getCell('A1');

title.value =
'Online Employee Attendance System';

title.font={

bold:true,
size:18,
color:{argb:'FFFFFF'}

};

title.alignment={

horizontal:'center'

};

title.fill={

type:'pattern',
pattern:'solid',

fgColor:{
argb:'1F4E78'
}

};

worksheet.getRow(1).height=30;



// ===== SUBTITLE =====

worksheet.mergeCells('A2:H2');

worksheet.getCell('A2').value=
`Admin Attendance Report (${fileDate})`;

worksheet.getCell('A2').alignment={

horizontal:'center'

};

worksheet.getCell('A2').font={

bold:true,
size:13

};



// ===== COUNT BOX =====

worksheet.mergeCells('A4:B4');
worksheet.mergeCells('C4:D4');
worksheet.mergeCells('E4:F4');
worksheet.mergeCells('G4:H4');

worksheet.getCell('A4').value=
`Total : ${total}`;

worksheet.getCell('C4').value=
`Present : ${present}`;

worksheet.getCell('E4').value=
`Absent : ${absent}`;

worksheet.getCell('G4').value=
`Late : ${late}`;


['A4','C4','E4','G4']
.forEach(cellNo=>{

const c=
worksheet.getCell(cellNo);

c.font={
bold:true
};

c.alignment={

horizontal:'center',
vertical:'middle'

};

c.fill={

type:'pattern',
pattern:'solid',

fgColor:{
argb:'D9EAD3'
}

};

c.border={

top:{style:'thin'},
left:{style:'thin'},
bottom:{style:'thin'},
right:{style:'thin'}

};

});



// ===== TABLE HEADER =====

worksheet.getRow(6).values=[

'Sr No',
'Name',
'Email',
'Date',
'Check-In',
'Check-Out',
'Working Hours',
'Status'

];


worksheet
.getRow(6)
.eachCell(cell=>{

cell.font={

bold:true,
color:{argb:'FFFFFF'}

};

cell.fill={

type:'pattern',
pattern:'solid',

fgColor:{
argb:'28A745'
}

};

cell.alignment={

horizontal:'center'

};

cell.border={

top:{style:'thin'},
left:{style:'thin'},
bottom:{style:'thin'},
right:{style:'thin'}

};

});




// ===== DATA =====

data.forEach(
(x:any,index:number)=>{

const checkIn =

x.checkInTime ?

new Date(x.checkInTime)
.toLocaleTimeString(
'en-US',
{
hour:'numeric',
minute:'2-digit',
hour12:true
}
)

:'--';



const checkOut =

x.checkOutTime ?

new Date(x.checkOutTime)
.toLocaleTimeString(
'en-US',
{
hour:'numeric',
minute:'2-digit',
hour12:true
}
)

:'--';



const formattedDate =

x.date ?

new Date(x.date)
.toLocaleDateString(
'en-US',
{
month:'short',
day:'numeric',
year:'numeric'
}
)

:'--';



const status =

x.isLate ?

'Late Entry'

:

'On Time';



const row=
worksheet.addRow([

index+1,
x.name,
x.email,
formattedDate,
checkIn,
checkOut,
x.workingHours || '--',
status

]);


row.eachCell(cell=>{

cell.border={

top:{style:'thin'},
left:{style:'thin'},
bottom:{style:'thin'},
right:{style:'thin'}

};

cell.alignment={

horizontal:'center',
vertical:'middle'

};

});

});



// ===== WIDTH =====

worksheet.columns=[

{width:10},
{width:25},
{width:35},
{width:20},
{width:15},
{width:15},
{width:20},
{width:20}

];



// ===== DOWNLOAD =====

workbook.xlsx
.writeBuffer()
.then((buffer)=>{

const blob=
new Blob(

[buffer],

{

type:
'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

}

);

FileSaver.saveAs(

blob,

`Admin_attendance_report_${fileDate}.xlsx`

);
this.toastr.success(
'Excel Exported Successfully',
'Success'
);

});

}
}