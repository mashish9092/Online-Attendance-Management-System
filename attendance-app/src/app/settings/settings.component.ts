import { Component, OnInit } from '@angular/core';
import { AttendanceService } from '../services/attendance.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})

export class SettingsComponent implements OnInit {

  user:any = {

    userId:0,
    name:'',
    email:'',
    role:''

  };

  password={

    oldPassword:'',
    newPassword:'',
    confirmPassword:''

  };

  loading=false;

  constructor(
    private service:AttendanceService,
    private toastr:ToastrService
  ){}

  ngOnInit(){

    const userId =
    Number(
      localStorage.getItem('userId')
    );

    console.log(
      "Logged UserId:",
      userId
    );

    if(!userId){

    //   alert(
    //     "User not found"
    //   );
    this.toastr.error(
'User not found',
'Error'
);

      return;

    }

    this.loadProfile(userId);

  }



loadProfile(userId:number){

this.loading=true;

this.service
.getProfile(userId)
.subscribe({

next:(res:any)=>{

console.log(
"Profile Data:",
res
);

this.user=res;

this.loading=false;

},

error:(err:any)=>{

console.log(
"Profile Error",
err
);

this.loading=false;

// alert(
// "Failed to load profile"
// );
this.toastr.warning(
'Failed to load profile',
'Warning'
);

}

});

}



saveSettings(){

console.log("Button Clicked");

this.user.userId =
Number(
localStorage.getItem('userId')
);

console.log(this.user);


// ===== PROFILE UPDATE =====

this.service
.updateProfile(this.user)
.subscribe({

next:(res:any)=>{

console.log(res);


// ===== PASSWORD UPDATE =====

if(this.password.newPassword){

if(
this.password.newPassword
!=
this.password.confirmPassword
){

// alert(
// "New Password & Confirm Password not match"
// );
this.toastr.warning(
'New Password & Confirm Password not match',
'Warning'
);

return;

}

const passwordData={

userId:
this.user.userId,

oldPassword:
this.password.oldPassword,

newPassword:
this.password.newPassword

};


this.service
.changePassword(passwordData)
.subscribe({

next:(res:any)=>{

console.log(res);

// alert(
// "Profile + Password Updated Successfully"
// );
this.toastr.warning(
'Profile + Password Updated Successfully',
'Warning'
);

// clear fields

this.password={

oldPassword:'',
newPassword:'',
confirmPassword:''

};

},

error:(err:any)=>{

console.log(err);

// alert(
// "Old Password Incorrect"
// );
this.toastr.warning(
'Old Password Incorrect',
'Warning'
);

}

});

}
else{

this.toastr.success(
'Profile Updated Successfully',
'Success'
);
}

},

error:(err:any)=>{

console.log(err);

this.toastr.error(
'Update Failed',
'Error'
);

}

});

}

// future password api
changePassword(){

if(
this.password.newPassword !=
this.password.confirmPassword
){

this.toastr.warning(
"Password mismatch"
);

return;

}

console.log(
this.password
);

}

}