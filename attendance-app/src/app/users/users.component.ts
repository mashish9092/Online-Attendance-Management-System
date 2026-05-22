import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as ExcelJS from 'exceljs';
import * as FileSaver from 'file-saver';
import { ToastrService } from 'ngx-toastr';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  apiUrl = `${environment.baseUrl}/Users`;

  constructor(private http: HttpClient, private toastr:ToastrService) {}

  searchText = '';

  users: any[] = [];

  user: any = {};

  isEdit = false;

  loading = false;

  ngOnInit(): void {

    this.resetForm();

    this.loadUsers();

  }


  resetForm() {

    this.user = {
      name: '',
      email: '',
      password: '',
      role: ''
    };

  }


  loadUsers() {

    this.loading = true;

    this.http.get<any[]>(this.apiUrl)
      .subscribe({

        next: (res) => {

          this.users = res || [];

          this.loading = false;

        },

        error: (err) => {

          console.log(err);

          this.loading = false;

        }

      });

  }


  // SEARCH
  filteredUsers() {

    return this.users.filter(x =>

      (x.name || '')
      .toLowerCase()
      .includes(
        this.searchText.toLowerCase()
      )

    );

  }


  // EXPORT
exportToExcel() {

const users = this.filteredUsers();

if(users.length===0){

this.toastr.warning(
'No data available',
'Warning'
);

return;
}
const workbook = new ExcelJS.Workbook();

const today = new Date();

const date =
today.toLocaleDateString('en-GB')
.replace(/\//g,'-');

const worksheet =
workbook.addWorksheet(
`Users`
);


// Title
worksheet.mergeCells('A1:F1');

const titleCell =
worksheet.getCell('A1');

titleCell.value =
'Online Employee Attendance System';

titleCell.font={
size:18,
bold:true,
color:{argb:'FFFFFF'}
};

titleCell.alignment={
vertical:'middle',
horizontal:'center'
};

titleCell.fill={
type:'pattern',
pattern:'solid',
fgColor:{argb:'1F4E78'}
};

worksheet.getRow(1).height=30;


// Subtitle

worksheet.mergeCells('A2:F2');

worksheet.getCell('A2').value=
`Admin Manage Users Report (${date})`;

worksheet.getCell('A2').font={
bold:true,
size:13
};

worksheet.getCell('A2').alignment={
horizontal:'center'
};


// Count

const adminCount =
users.filter(
x=>x.role==="Admin"
).length;

const userCount =
users.filter(
x=>x.role==="User"
).length;


worksheet.mergeCells('A4:B4');
worksheet.mergeCells('C4:D4');
worksheet.mergeCells('E4:F4');

worksheet.getCell('A4').value=
`Total Users : ${users.length}`;

worksheet.getCell('C4').value=
`Admins : ${adminCount}`;

worksheet.getCell('E4').value=
`Users : ${userCount}`;

// Count row border + style

['A4','C4','E4'].forEach(cellNo=>{

const cell = worksheet.getCell(cellNo);

cell.font = {
bold:true
};

cell.alignment = {
horizontal:'center',
vertical:'middle'
};

cell.fill = {
type:'pattern',
pattern:'solid',
fgColor:{argb:'D9EAD3'}
};

cell.border={

top:{style:'thin'},
left:{style:'thin'},
bottom:{style:'thin'},
right:{style:'thin'}

};

});

worksheet.getRow(6).values=[
'Sr No',
'Name',
'Email',
'Role'
];


// Header color

worksheet.getRow(6).eachCell(cell=>{

cell.font={
bold:true,
color:{argb:'FFFFFF'}
};

cell.fill={

type:'pattern',
pattern:'solid',
fgColor:{argb:'28A745'}

};

cell.alignment={

horizontal:'center',
vertical:'middle'

};

cell.border={

top:{style:'thin'},
left:{style:'thin'},
bottom:{style:'thin'},
right:{style:'thin'}

};

});



// Data rows

users.forEach(
(u:any,index:number)=>{

const row=
worksheet.addRow([

index+1,
u.name,
u.email,
u.role

]);

row.eachCell(cell=>{

cell.border={

top:{style:'thin'},
left:{style:'thin'},
bottom:{style:'thin'},
right:{style:'thin'}

};

cell.alignment={
horizontal:'center'
};

});

});
    

worksheet.columns=[

{width:10},
{width:25},
{width:35},
{width:20}

];



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
`Admin_Manage_Users_${date}.xlsx`
);
this.toastr.success(
'Excel Exported Successfully',
'Success'
);
});

}
  saveUser() {

    if (
      !this.user.name ||
      !this.user.email ||
      !this.user.password ||
      !this.user.role
    ) {

    this.toastr.warning(
'Fill all fields',
'Warning'
);

    }


    if (this.isEdit) {

      this.http.put(
        `${this.apiUrl}/${this.user.userId}`,
        this.user
      )
      .subscribe({

        next: () => {

        this.toastr.success(
'Updated Successfully',
'Success'
);

          this.resetForm();

          this.isEdit = false;

          this.loadUsers();

        },

        error: (err) => {

          console.log(err);

        this.toastr.error(
'Update Failed',
'Error'
);

        }

      });

    }

    else {

      this.http.post(
        this.apiUrl,
        this.user
      )
      .subscribe({

        next: () => {

       this.toastr.success(
'User Saved Successfully',
'Success'
);

          // form clear
          this.resetForm();

          // edit off
          this.isEdit = false;

          // table reload
          this.loadUsers();

        },

        error: (err) => {

          console.log(err);

          this.toastr.error(
'Database Save Failed',
'Error'
);

        }

      });

    }

  }



  editUser(u: any) {

    this.user = Object.assign({}, u);

    this.isEdit = true;

  }



  deleteUser(id: any) {

    if (confirm("Delete this user?")) {

      this.loading = true;

      this.http.delete(
        `${this.apiUrl}/${id}`
      )
      .subscribe({

        next: () => {

         this.toastr.success(
'Deleted Successfully',
'Success'
);

          this.loadUsers();

        },

        error: (err) => {

          console.log(err);

          this.loading = false;

        }

      });

    }

  }

}