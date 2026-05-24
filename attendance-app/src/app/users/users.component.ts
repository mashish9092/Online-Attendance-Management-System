import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as ExcelJS from 'exceljs';
import * as FileSaver from 'file-saver';
import { ToastrService } from 'ngx-toastr';
import { environment } from 'src/environments/environment';

@Component({
selector:'app-users',
templateUrl:'./users.component.html',
styleUrls:['./users.component.css']
})

export class UsersComponent implements OnInit {

apiUrl=`${environment.baseUrl}/Users`;

constructor(
private http:HttpClient,
private toastr:ToastrService
){}


searchText='';

users:any[]=[];

loading=false;

isEdit=false;

showPopup=false;


user:any={

userId:0,
name:'',
email:'',
password:'',
role:''

};


ngOnInit():void{

this.resetForm();

this.loadUsers();

}



/* popup */

openPopup(){

this.resetForm();

this.isEdit=false;

this.showPopup=false;

setTimeout(()=>{

this.showPopup=true;

},50);

}



closePopup(){

this.showPopup=false;

this.isEdit=false;

this.resetForm();

this.user=null;

setTimeout(()=>{

this.user={

userId:0,
name:'',
email:'',
password:'',
role:''

};

this.loadUsers();

},200);

}

/* reset form */

resetForm(){

this.user={

userId:0,
name:'',
email:'',
password:'',
role:''

};

}


/* load users */

loadUsers(){

this.loading=true;

this.http
.get<any[]>(this.apiUrl)

.subscribe({

next:(res)=>{

this.users=[...(res || [])]; // new reference force

this.loading=false;

},

error:(err)=>{

console.log(err);

this.loading=false;

this.toastr.error(
'Users Load Failed',
'Error'
);

}

});

}



/* search */

filteredUsers(){

return this.users.filter(x=>

(x.name || '')
.toLowerCase()
.includes(
this.searchText.toLowerCase()
)

||

(x.email || '')
.toLowerCase()
.includes(
this.searchText.toLowerCase()
)

||

(x.role || '')
.toLowerCase()
.includes(
this.searchText.toLowerCase()
)

);

}



/* save + update */

saveUser(){

if(

!this.user.name ||
!this.user.email ||
!this.user.password ||
!this.user.role

){

this.toastr.warning(
'Fill all fields',
'Warning'
);

return;

}


const request=this.isEdit

?

this.http.put(
`${this.apiUrl}/${this.user.userId}`,
this.user
)

:

this.http.post(
this.apiUrl,
this.user
);


request.subscribe({

next:(res:any)=>{

this.toastr.success(

this.isEdit
?
'Updated Successfully'
:
'User Added Successfully',

'Success'
);


/* force fresh load */

this.http
.get<any[]>(this.apiUrl)
.subscribe(data=>{

this.users=[...data];

this.closePopup();

});

},

error:(err)=>{

console.log(err);

this.toastr.error(

'Save Failed',

'Error'

);

}

});

}



/* edit */

editUser(u:any){

this.user={

userId:u.userId,

name:u.name || '',

email:u.email || '',

password:'',   // force blank

role:u.role || ''

};

this.isEdit=true;

this.showPopup=true;

}


/* delete */

deleteUser(id:number){

if(!confirm(
'Delete this user ?'
))
return;

this.loading=true;

this.http.delete(

`${this.apiUrl}/${id}`,

{ responseType:'text' }

)

.subscribe({

next:(res)=>{

console.log(res);

this.toastr.success(

'Deleted Successfully',

'Success'

);

this.users=
this.users.filter(
x=>x.userId!==id
);

this.loading=false;

},

error:(err)=>{

console.log(err);

this.loading=false;

this.toastr.error(

'Delete Failed',

'Error'

);

}

});

}

/* excel */

exportToExcel(){

const users=this.filteredUsers();

if(users.length===0){

this.toastr.warning(

'No data available',

'Warning'

);

return;

}


const workbook=
new ExcelJS.Workbook();

const worksheet=
workbook.addWorksheet(
'Users'
);


worksheet.columns=[

{
header:'Sr No',
key:'sr',
width:10
},

{
header:'Name',
key:'name',
width:25
},

{
header:'Email',
key:'email',
width:35
},

{
header:'Role',
key:'role',
width:20
}

];


users.forEach((u,index)=>{

worksheet.addRow({

sr:index+1,

name:u.name,

email:u.email,

role:u.role

});

});


workbook.xlsx
.writeBuffer()

.then(data=>{

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

'Users.xlsx'

);


this.toastr.success(

'Excel Exported',

'Success'

);

});

}

}