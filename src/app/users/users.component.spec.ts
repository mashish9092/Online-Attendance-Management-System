import { Component, OnInit } from '@angular/core';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {

  constructor(private userService: UserService) {}

  searchText = '';
  users: any[] = [];
  user: any = {};
  isEdit = false;

  ngOnInit() {
    this.getUsers();
  }

  // 🔥 GET USERS FROM API
  getUsers() {
    this.userService.getUsers().subscribe(res => {
      this.users = res;
    });
  }

  // 🔍 SEARCH
  filteredUsers() {
    return this.users.filter(x =>
      x.name.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  // ➕ ADD / UPDATE
  saveUser() {

    if (!this.user.name || !this.user.email) {
      alert('Fill all fields');
      return;
    }

    if (this.isEdit) {
      this.userService.updateUser(this.user).subscribe(() => {
        this.getUsers();
      });
    } else {
      this.userService.addUser(this.user).subscribe(() => {
        this.getUsers();
      });
    }

    this.user = {};
    this.isEdit = false;
  }

  // ✏️ EDIT
  editUser(u: any) {
    this.user = { ...u };
    this.isEdit = true;
  }

  // 🗑️ DELETE
  deleteUser(id: number) {
    if (confirm('Delete this user?')) {
      this.userService.deleteUser(id).subscribe(() => {
        this.getUsers();
      });
    }
  }
}