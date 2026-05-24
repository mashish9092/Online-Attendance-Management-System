import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Chart } from 'chart.js/auto';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  baseUrl = environment.baseUrl;

  // ================= VARIABLES =================
  dashboard: any = {};
  attendanceList: any[] = [];
  allAttendance: any[] = [];
  activityList: any[] = [];
weeklyData: any[] = [];
  searchText: string = '';

  intervalId: any;

  // 🔥 CHARTS
  barChart: any;
  pieChart: any;
  // pagination
currentPage: number = 1;
pageSize: number = 5;
sortColumn: string = '';
sortAsc: boolean = true;
totalUsers=0;


  constructor(private http: HttpClient) {}

  // ================= INIT =================
ngOnInit() {

  // 🔥 Initial load
  this.loadDashboard();

  this.loadTodayAttendance();

  this.loadActivity();

  this.loadWeeklyData();

  // Charts init
  setTimeout(() => {

    this.initBarChart();

    this.initPieChart();

  },500);

  // Auto refresh
  this.intervalId =
  setInterval(()=>{

    if(!this.searchText){

      this.loadDashboard();

      this.loadTodayAttendance();

      this.loadActivity();

      this.loadWeeklyData();

      this.updateBarChart();

      this.updatePieChart();

    }

  },10000);

}
loadUsersCount(){

this.http.get<any[]>(
`${this.baseUrl}/Users`
)
.subscribe({

next:(res)=>{

this.totalUsers=
res.length;

this.dashboard.totalUsers=
res.length;

console.log(
'Users Count:',
this.totalUsers
);

},

error:(err)=>{

console.log(
'Users API Error:',
err
);

}

});

}

loadActivity() {

this.http.get<any[]>(
`${this.baseUrl}/attendance/activity`
)

.subscribe({

next:(res)=>{

this.activityList=res;

},

error:(err)=>{

console.log(err);

}

});

}
  // ================= DESTROY =================
  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);

    if (this.barChart) this.barChart.destroy();
    if (this.pieChart) this.pieChart.destroy();
  }

  // ================= DASHBOARD =================
  // loadDashboard() {
  //   this.http.get<any>('https://localhost:44336/api/dashboard')
  //     .subscribe({
  //       next: (res) => this.dashboard = res,
  //       error: (err) => console.error(err)
  //     });
  // }
loadDashboard() {

this.http.get<any>(
`${this.baseUrl}/attendance/dashboard`
)

.subscribe({

next:(res)=>{

this.dashboard = {

totalUsers:
res.totalUsers,

presentToday:
res.presentToday,

lateCount:
res.lateCount,

absentToday:
res.absentToday,

workingHoursToday:
res.workingHours

};

console.log(
'Dashboard API:',
this.dashboard
);

},

error:(err)=>{

console.log(
'Dashboard Error:',
err
);

}

});

}

  // ================= ATTENDANCE =================
loadTodayAttendance() {

this.http.get<any[]>(
`${this.baseUrl}/attendance/today`
)

.subscribe({

next:(res)=>{

console.log(
"Attendance Data:",
res
);

// safety filter
this.attendanceList = res;

this.allAttendance =
this.attendanceList;

this.updateBarChart();

this.updatePieChart();

},

error:(err)=>{

console.log(
"API Error:",
err
);

}

});

}

  // ================= SEARCH =================
  search() {
    if (!this.searchText) {
      this.attendanceList = this.allAttendance;
      return;
    }

    const text = this.searchText.toLowerCase();

    this.attendanceList = this.allAttendance.filter(x =>
      x.name.toLowerCase().includes(text)
    );
  }

  // ================= EXPORT =================
exportToExcel() {

  if (!this.attendanceList || this.attendanceList.length === 0) {
    alert("No data to export ❌");
    return;
  }

  import('exceljs').then((ExcelJS) => {

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Attendance Report");

    const today = new Date();
    const monthName = today.toLocaleString('default', { month: 'long' });

    // 🔥 TITLE
    worksheet.mergeCells('A1:F1');
    const title = worksheet.getCell('A1');
    title.value = `📊 Attendance Report - ${monthName}`;
    title.font = { size: 16, bold: true };
    title.alignment = { horizontal: 'center' };

    worksheet.addRow([]);

    // 🔥 HEADER
    const headerRow = worksheet.addRow([
      'Sr.No', 'Name', 'Date', 'Check In', 'Working Hours', 'Status'
    ]);

    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    headerRow.eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '2F4B8F' }
      };
      cell.alignment = { horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // 🔥 DATA
    this.attendanceList.forEach((item, index) => {

      const row = worksheet.addRow([
        index + 1,
        item.name,
        new Date(item.date).toLocaleDateString(),
        item.checkInTime ? new Date(item.checkInTime).toLocaleTimeString() : '-',
        item.workingHours || '--',
        item.isLate ? 'Late' : 'On Time'
      ]);

      row.alignment = { horizontal: 'center' };

      row.eachCell(cell => {
        cell.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // 🎨 STATUS COLOR
      const statusCell = row.getCell(6);

      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: item.isLate
          ? { argb: 'FFC7CE' }   // 🔴 Late
          : { argb: 'C6EFCE' }   // 🟢 On Time
      };

    });

    // 🔥 AUTO WIDTH
    worksheet.columns.forEach(col => col.width = 18);

    // ===============================
    // 🔥 SUMMARY CARD STYLE
    // ===============================

    const total = this.attendanceList.length;
    const late = this.attendanceList.filter(x => x.isLate).length;
    const present = total - late;

    worksheet.addRow([]);
    
    // 🟦 SUMMARY TITLE
    const summaryTitle = worksheet.addRow(['Summary']);
    summaryTitle.font = { bold: true };

    // 🟢 PRESENT
    const presentRow = worksheet.addRow(['Present', present]);
    presentRow.getCell(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'C6EFCE' }
    };

    // 🔴 LATE
    const lateRow = worksheet.addRow(['Late', late]);
    lateRow.getCell(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFC7CE' }
    };

    // 🔵 TOTAL USERS
    const totalRow = worksheet.addRow(['Total Users', total]);

    // ⭐ GRAND TOTAL
    const grandRow = worksheet.addRow(['Grand Total', total]);
    grandRow.font = { bold: true };

    // 🔥 APPLY BORDER TO SUMMARY
    [presentRow, lateRow, totalRow, grandRow].forEach(row => {
      row.eachCell(cell => {
        cell.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { horizontal: 'center' };
      });
    });

    // 🔥 DOWNLOAD
    workbook.xlsx.writeBuffer().then((data: any) => {
      const blob = new Blob([data]);
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Attendance_${monthName}.xlsx`;
      link.click();
    });

  });
}
  // ================= BAR CHART =================
  initBarChart() {
    this.barChart = new Chart("barChart", {
      type: 'bar',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        datasets: [
          {
            label: 'Present',
            data: [2, 3, 1, 4, 2],
            backgroundColor: '#22c55e'
          },
          {
            label: 'Absent',
            data: [3, 2, 4, 1, 3],
            backgroundColor: '#ef4444'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
         animation: {
    duration: 1000
  }
      }
    });
  }

  updateBarChart() {
    if (!this.barChart) return;

    this.barChart.data.datasets[0].data = [
      this.dashboard.presentToday || 0,
      2, 3, 1, 4
    ];

    this.barChart.data.datasets[1].data = [
      this.dashboard.absentToday || 0,
      3, 2, 4, 1
    ];

    this.barChart.update();
  }

  // ================= PIE CHART =================
  initPieChart() {
    this.pieChart = new Chart("pieChart", {
      type: 'pie',
      data: {
        labels: ['Present', 'Absent'],
        datasets: [{
          data: [
            this.dashboard.presentToday || 0,
            this.dashboard.absentToday || 0
          ],
          backgroundColor: ['#22c55e', '#ef4444']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  updatePieChart() {
    if (!this.pieChart) return;

    this.pieChart.data.datasets[0].data = [
      this.dashboard.presentToday || 0,
      this.dashboard.absentToday || 0
    ];

    this.pieChart.update();
  }
  loadWeeklyData() {
 this.http.get<any[]>(
`${this.baseUrl}/dashboard/weekly`
)
    .subscribe(res => {
      this.weeklyData = res;

      this.updateBarChartFromAPI();
    });
}
updateBarChartFromAPI() {
  if (!this.barChart || this.weeklyData.length === 0) return;

  const labels = this.weeklyData.map(x => x.day);
  const presentData = this.weeklyData.map(x => x.present);
  const absentData = this.weeklyData.map(x => x.absent);

  this.barChart.data.labels = labels;
  this.barChart.data.datasets[0].data = presentData;
  this.barChart.data.datasets[1].data = absentData;

  this.barChart.update();
}
get paginatedData() {
  const start = (this.currentPage - 1) * this.pageSize;
  return this.attendanceList.slice(start, start + this.pageSize);
}

nextPage() {
  if ((this.currentPage * this.pageSize) < this.attendanceList.length) {
    this.currentPage++;
  }
}

prevPage() {
  if (this.currentPage > 1) {
    this.currentPage--;
  }
}
sortData(column: string) {

  if (this.sortColumn === column) {
    this.sortAsc = !this.sortAsc;
  } else {
    this.sortColumn = column;
    this.sortAsc = true;
  }

  this.attendanceList.sort((a: any, b: any) => {
    let valA = a[column];
    let valB = b[column];

    if (valA < valB) return this.sortAsc ? -1 : 1;
    if (valA > valB) return this.sortAsc ? 1 : -1;
    return 0;
  });

}

}