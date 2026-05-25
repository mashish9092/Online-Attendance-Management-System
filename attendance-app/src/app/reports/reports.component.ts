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

console.log("API DATA =",res);

this.data = res || [];


// current month default load
const currentMonth=
new Date().getMonth();

const currentYear=
new Date().getFullYear();

this.filteredData=
this.data.filter((x:any)=>{

const d=new Date(x.date);

return (
d.getMonth()===currentMonth
&&
d.getFullYear()===currentYear
);

});

this.currentPage=1;

this.updatePagination();

this.loading=false;

},

error:(err:any)=>{

console.log("API ERROR",err);

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

search(){

let temp=[...this.data];


// Date Range filter
if(this.fromDate && this.toDate){

temp=temp.filter((x:any)=>{

const rowDate=
new Date(x.date)
.toISOString()
.split('T')[0];

return (
rowDate>=this.fromDate
&&
rowDate<=this.toDate
);

});

}


// Search Name + Date + Status

if(this.searchText){

const text=
this.searchText.toLowerCase();

temp=temp.filter((x:any)=>{

const name=
x.name?.toLowerCase() || "";

const date=
new Date(x.date)
.toLocaleDateString()
.toLowerCase();

const status=
(x.status || "")
.toLowerCase();

return (

name.includes(text)

||

date.includes(text)

||

status.includes(text)

);

});

}



// Status dropdown

if(this.status){

switch(this.status){

case "On Time":

temp=temp.filter(
(x:any)=>
x.status=="Present"
);

break;


case "Late Entry":

temp=temp.filter(
(x:any)=>
x.status=="Late"
);

break;


case "Half Day":

temp=temp.filter(
(x:any)=>
x.status=="Half Day"
);

break;


case "Absent":

temp=temp.filter(
(x:any)=>
x.status=="Absent"
);

break;

}

}


this.filteredData=temp;

this.currentPage=1;

this.updatePagination();

console.log(
"Filtered Data:",
this.filteredData
);

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


// current month reload
const currentMonth=
new Date().getMonth();

const currentYear=
new Date().getFullYear();

this.filteredData=
this.data.filter((x:any)=>{

const d=
new Date(x.date);

return (

d.getMonth()===currentMonth
&&
d.getFullYear()===currentYear

);

});


this.currentPage=1;

this.updatePagination();

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

worksheet.mergeCells('A1:H2');

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
(x:any)=>x.status=="Late"
||
x.status=="Late Entry"
).length;


const onTime=
this.filteredData.filter(
(x:any)=>x.status=="Present"
||
x.status=="On Time"
).length;


const halfDay=
this.filteredData.filter(
(x:any)=>x.status=="Half Day"
).length;


const absent=
this.filteredData.filter(
(x:any)=>x.status=="Absent"
).length;


const presentPercent=
Math.round(
((onTime+late+halfDay)
/total)*100
||0
);


const absentPercent=
Math.round(
(absent/total)*100
||0
);


worksheet.addRow([]);

worksheet.addRow([

'Total',
total,

'Present',
onTime,

'Late',
late,

'Half Day',
halfDay

]);

worksheet.addRow([

'Absent',
absent,

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


// widths

worksheet.getColumn(1).width=10;
worksheet.getColumn(2).width=30;
worksheet.getColumn(3).width=18;
worksheet.getColumn(4).width=18;
worksheet.getColumn(5).width=18;
worksheet.getColumn(6).width=18;
worksheet.getColumn(7).width=18;



// ================= DATA =================

this.filteredData.forEach(
(x:any,i:number)=>{


const statusValue=
x.status ||
(
x.isLate==1
?
'Late Entry'
:
'Present'
);


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

statusValue

]);



// status color

const status=
row.getCell(7);

let color='008000';


if(statusValue=="Late"
||
statusValue=="Late Entry")
color='8B0000';


if(statusValue=="Half Day")
color='ffb327';


if(statusValue=="Absent")
color='FF0000';


status.font={

bold:true,

color:{
argb:color
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