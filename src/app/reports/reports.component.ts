import { Component, OnInit } from '@angular/core';
import { AttendanceService } from '../services/attendance.service';
import * as ExcelJS from 'exceljs';
import * as FileSaver from 'file-saver';

@Component({
selector:'app-reports',
templateUrl:'./reports.component.html',
styleUrls:['./reports.component.css']
})

export class ReportsComponent implements OnInit{

data:any[]=[];
filteredData:any[]=[];

searchText='';
status='';

fromDate='';
toDate='';

userId:number=0;

currentPage=1;

pageSize=5;

totalPages=0;

paginatedData:any[]=[];

loading=false;

constructor(
private attendanceService:AttendanceService
){}

ngOnInit(){
this.loadData();
}


loadData(){

this.loading=true;

this.attendanceService
.getAllAttendance()
.subscribe({

next:(res:any)=>{

this.data=res || [];

this.filteredData=
[...this.data];

this.updatePagination();

this.loading=false;

},

error:(err:any)=>{

console.log(err);

this.loading=false;

}

});

}
updatePagination(){

this.totalPages=
Math.ceil(
this.filteredData.length/
this.pageSize
);

const start=
(this.currentPage-1)
*
this.pageSize;

const end=
start+
this.pageSize;

this.paginatedData=
this.filteredData.slice(
start,
end
);

}


nextPage(){

if(
this.currentPage<
this.totalPages
){

this.currentPage++;

this.updatePagination();

}

}


prevPage(){

if(
this.currentPage>1
){

this.currentPage--;

this.updatePagination();

}

}
search() {

this.filteredData =
this.data.filter((x:any)=>{

// Name search
const nameMatch =
!this.searchText ||
x.name?.toLowerCase()
.includes(
this.searchText.toLowerCase()
);


// Status search
let statusMatch=true;

if(this.status==="Late Entry"){
statusMatch=x.isLate==1;
}
else if(this.status==="On Time"){
statusMatch=x.isLate==0;
}


// API date → yyyy-mm-dd
const rowDate =
x.date
? new Date(x.date)
.toISOString()
.split('T')[0]
: "";


// Input date compare
const fromMatch =
!this.fromDate ||
rowDate >= this.fromDate;

const toMatch =
!this.toDate ||
rowDate <= this.toDate;


return (
nameMatch &&
statusMatch &&
fromMatch &&
toMatch
);

});

console.log(
"Filtered Data:",
this.filteredData
);
this.currentPage=1;

this.updatePagination();
}


// helper
convertDate(date:any){

const d =
new Date(date);

return d
.toISOString()
.split('T')[0];

}
resetFilter(){

this.searchText='';

this.status='';

this.fromDate='';

this.toDate='';

this.filteredData=
[...this.data];

}

exportExcel() {

if(this.filteredData.length===0){
alert("No data found");
return;
}

const workbook =
new ExcelJS.Workbook();

const worksheet =
workbook.addWorksheet(
'Attendance Report'
);


// ================= TITLE =================

worksheet.mergeCells('A1:G2');

const title=
worksheet.getCell('A1');

title.value=
'ONLINE ATTENDANCE REPORT';

title.font={

size:20,
bold:true,
color:{argb:'FFFFFF'}

};

title.alignment={

horizontal:'center',
vertical:'middle'

};

title.fill={

type:'pattern',
pattern:'solid',

fgColor:{
argb:'1E3A8A'
}

};


// ================= SUMMARY =================

const total=
this.filteredData.length;

const late=
this.filteredData.filter(
(x:any)=>x.isLate==1
).length;


const onTime=
this.filteredData.filter(
(x:any)=>x.isLate==0
).length;


const absent=
total-(late+onTime);


const presentPercent=
Math.round(
(onTime/total)*100 ||0
);


const absentPercent=
100-presentPercent;


worksheet.addRow([]);

worksheet.addRow([

'Total Records',
total,

'Late Count',
late,

'On Time',
onTime,

'Absent',
absent

]);

worksheet.addRow([

'Present %',
presentPercent+'%',

'Absent %',
absentPercent+'%'

]);


const summary1=
worksheet.getRow(4);

const summary2=
worksheet.getRow(5);


[summary1,summary2]
.forEach((row)=>{

row.font={
bold:true
};

row.alignment={
horizontal:'center'
};

row.eachCell(cell=>{

cell.fill={

type:'pattern',
pattern:'solid',

fgColor:{
argb:'D9EAF7'
}

};

cell.border={

top:{style:'thin'},
left:{style:'thin'},
bottom:{style:'thin'},
right:{style:'thin'}

};

});

});


// ================= HEADER =================

worksheet.addRow([]);

const headerRow=
worksheet.getRow(7);

headerRow.values=[

'Sr.No',
'Name',
'Date',
'Check In',
'Check Out',
'Working Hours',
'Status'

];

headerRow.height=25;

headerRow.font={

bold:true,
color:{argb:'FFFFFF'}

};

headerRow.fill={

type:'pattern',
pattern:'solid',

fgColor:{
argb:'1F2937'}

};

headerRow.alignment={

horizontal:'center',
vertical:'middle'

};


// column widths

worksheet.getColumn(1).width=10;
worksheet.getColumn(2).width=25;
worksheet.getColumn(3).width=18;
worksheet.getColumn(4).width=18;
worksheet.getColumn(5).width=18;
worksheet.getColumn(6).width=18;
worksheet.getColumn(7).width=18;


// ================= DATA =================

this.filteredData.forEach(
(x:any,i:number)=>{

const row=
worksheet.addRow([

i+1,

x.name,

new Date(
x.date
).toLocaleDateString(),

x.checkInTime
?
new Date(
x.checkInTime
).toLocaleTimeString()
:
'--',

x.checkOutTime
?
new Date(
x.checkOutTime
).toLocaleTimeString()
:
'--',

x.workingHours
|| '--',

x.isLate==1
?
'Late Entry'
:
'On Time'

]);


// Status color

const status=
row.getCell(7);

status.font={

bold:true,

color:{

argb:
x.isLate==1
?
'FF0000'
:
'008000'

}

};

});


// ================= BORDER =================

worksheet.eachRow((row)=>{

row.eachCell((cell)=>{

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


// ================= DOWNLOAD =================

workbook.xlsx
.writeBuffer()
.then((data)=>{

const blob=
new Blob(
[data],
{
type:
'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
}
);

FileSaver.saveAs(
blob,
'Attendance_Report.xlsx'
);

});

}

}