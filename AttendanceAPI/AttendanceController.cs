using Microsoft.AspNetCore.Mvc;
using AttendanceAPI.Data;
using AttendanceAPI.Models;
using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;


namespace AttendanceAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AttendanceController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AttendanceController(AppDbContext context)
        {
            _context = context;
        }
        // CHECK-IN API
        [HttpPost("checkin")]
        public IActionResult CheckIn([FromBody] int userId)
        {
            var today = DateTime.Today;

            // ❌ Already check-in?
            var exists = _context.Attendances
                .Any(a => a.UserId == userId && a.Date.Date == today);

            if (exists)
            {
                return BadRequest("You already checked in today");
            }

            var now = DateTime.Now;

            var isLate =
            now.TimeOfDay > new TimeSpan(9, 30, 0);

            var attendance = new Attendance
            {
                UserId = userId,
                Date = now,
                CheckInTime = now,
                IsLate = isLate,
                Status = isLate
                ?
                "Late"
                :
                "On Time"
            };

            _context.Attendances.Add(attendance);

            // 🔥 USER NAME GET
            var user =
            _context.Users
            .FirstOrDefault(x => x.UserId == userId);

            // 🔥 SAVE ACTIVITY HISTORY
            if (user != null)
            {
                ActivityHistory activity =
                new ActivityHistory
                {
                    UserId = user.UserId,

                    UserName = user.Name,

                    ActionType = "Check In",

                    ActionTime = DateTime.Now,

                    Status =
                    isLate
                    ?
                    "Late"
                    :
                    "On Time"
                };

                _context.ActivityHistory
                .Add(activity);
            }

            _context.SaveChanges();

            return Ok(new
            {
                message = "Check-in successful",
                checkInTime = now
            });
        }


        // CHECK-OUT API
        [HttpPost("checkout")]
        public IActionResult CheckOut([FromBody] int userId)
        {
            if (userId == 0)
                return BadRequest("UserId not received");

            var today = DateTime.Today;

            var attendance =
            _context.Attendances
            .FirstOrDefault(
            x => x.UserId == userId &&
            x.Date.Date == today);

            if (attendance == null)
                return BadRequest("Check-in not found");


            // 🔥 FIX
            if (attendance.CheckInTime == null)
                return BadRequest("Check-in time missing");


            if (attendance.CheckOutTime != null)
                return BadRequest("Already checked out");


            var checkOutTime = DateTime.Now;

            attendance.CheckOutTime = checkOutTime;


            var workingHours =
            (
                checkOutTime -
                attendance.CheckInTime.Value
            ).TotalHours;

            attendance.WorkingHours =
            (decimal)workingHours;


            // STATUS
            if (workingHours < 8)
                attendance.Status = "Half Day";

            else if (attendance.IsLate == true)
                attendance.Status = "Late";

            else
                attendance.Status = "Present";


            var user =
            _context.Users
            .FirstOrDefault(
            x => x.UserId == userId);


            if (user != null)
            {
                ActivityHistory activity =
                new ActivityHistory
                {
                    UserId = user.UserId,

                    UserName = user.Name,

                    ActionType = "Check Out",

                    ActionTime = DateTime.Now,

                    Status = attendance.Status
                };

                _context.ActivityHistory
                .Add(activity);
            }

            _context.SaveChanges();

            return Ok(new
            {
                success = true,

                workingHours =
                Math.Round(workingHours, 2),

                status =
                attendance.Status
            });
        }
        [HttpGet("all")]
        public IActionResult GetAllAttendance()
        {
            var data = _context.Attendances
                .Join(_context.Users,
                      a => a.UserId,
                      u => u.UserId,
                      (a, u) => new
                      {
                          name = u.Name,
                          email = u.Email,
                          date = a.Date,
                          checkInTime = a.CheckInTime,
                          checkOutTime = a.CheckOutTime,

                          workingHours =
                          a.WorkingHours != null
                          ? a.WorkingHours.ToString()
                          : "--",

                          isLate = a.IsLate
                      })
                .OrderByDescending(x => x.date)
                .ToList();

            return Ok(data);
        }

        [HttpGet("list/{userId}")]
        public IActionResult GetAttendance(int userId)
        {
            var user =
            _context.Users
            .FirstOrDefault(x => x.UserId == userId);

            if (user == null)
                return BadRequest("User not found");

            // attendance records
            var attendanceData =
            _context.Attendances
            .Where(a => a.UserId == userId)
            .ToList();

            DateTime startDate =
            new DateTime(2026, 5, 1); // change if needed

            DateTime endDate =
            DateTime.Today;

            var data =
            Enumerable.Range(
                0,
                (endDate - startDate).Days + 1
            )

            .Select(i =>
            {
                var date =
                startDate.AddDays(i);

                var attendance =
                attendanceData
                .FirstOrDefault(a =>
                    a.Date.Date ==
                    date.Date);

                return new
                {
                    Name = user.Name,

                    Email = user.Email,

                    Date = date,

                    CheckInTime =
                    attendance?.CheckInTime,

                    CheckOutTime =
                    attendance?.CheckOutTime,

                    WorkingHours =
                    attendance?.WorkingHours ?? 0,

                    IsLate =
                    attendance?.IsLate ?? false,

                    Status =
                    attendance == null
                    ? "Absent"
                    : attendance.IsLate == true
                        ? "Late Entry"
                        : "On Time"
                };
            })

            .OrderByDescending(x => x.Date)

            .ToList();

            return Ok(data);
        }
        [HttpGet("monthly-report")] // Monthly kitna time(ganta) kaam kiya //
        public IActionResult GetMonthlyReport([FromQuery] int userId, [FromQuery] int month, [FromQuery] int year)
        {
            var data = _context.Attendances
                .Where(a => a.UserId == userId
                            && a.Date.Month == month
                            && a.Date.Year == year
                            && a.CheckOutTime != null)
                .ToList();

            var totalMinutes = data
                .Sum(a => (a.CheckOutTime.Value - a.CheckInTime.Value).TotalMinutes);

            var hours = (int)totalMinutes / 60;
            var minutes = (int)totalMinutes % 60;

            var result = $"{hours:D2}:{minutes:D2}";

            return Ok(new
            {
                userId,
                month,
                year,
                totalHours = result
            });
        }
      
        [HttpGet("dashboard")]
        public IActionResult GetDashboard()
        {
            DateTime today = DateTime.Today;

            // Total users
            int totalUsers =
            _context.Users.Count();

            // Today's attendance
            var todayData =
            _context.Attendances
            .Where(a => a.Date.Date == today)
            .ToList();

            // Present users
            int presentToday =
            todayData
            .Select(x => x.UserId)
            .Distinct()
            .Count();

            // Late users
            int lateCount =
            todayData
            .Where(x => x.IsLate == true)
            .Select(x => x.UserId)
            .Distinct()
            .Count();

            // Auto absent
            int absentToday =
            totalUsers - presentToday;

            // Safety
            if (absentToday < 0)
            {
                absentToday = 0;
            }

            // Working hours
            var totalMinutes =
            todayData
            .Where(a =>
                a.CheckInTime.HasValue &&
                a.CheckOutTime.HasValue)
            .Sum(a =>
                (int)(
                a.CheckOutTime.Value -
                a.CheckInTime.Value
                ).TotalMinutes);

            string workingHours =
            $"{totalMinutes / 60:D2}:{totalMinutes % 60:D2}";

            // DEBUG
            Console.WriteLine($"Users:{totalUsers}");
            Console.WriteLine($"Present:{presentToday}");
            Console.WriteLine($"Absent:{absentToday}");

            return Ok(new
            {
                totalUsers,
                presentToday,
                absentToday,
                lateCount,
                workingHours
            });
        }
        [HttpGet("today")]
        public IActionResult GetTodayAttendance()
        {
            var today = DateTime.Today;

            var data =
            _context.Users

            .GroupJoin(

            _context.Attendances
            .Where(a => a.Date.Date == today),

            u => u.UserId,

            a => a.UserId,

            (u, a) => new {

                user = u,

                attendance =
                a.FirstOrDefault()

            })

           .Select(x => new {
            
                           name =
            x.user.Name,
            
                           email =
            x.user.Email,
            
                           date =
            today,
            
                           checkInTime =
            x.attendance != null
            ?
            x.attendance.CheckInTime
            :
            null,

               checkOutTime =
            x.attendance != null
            ?
            x.attendance.CheckOutTime
            :
            null,

               isLate =
            x.attendance != null
            ?
            x.attendance.IsLate
            :
            false,

               workingHours =

            x.attendance == null ? "--" : x.attendance.CheckOutTime != null ?

            (
            x.attendance.CheckOutTime.Value
            -
            x.attendance.CheckInTime.Value
            )
            .ToString(@"hh\:mm")

:

"--",


               status =

x.attendance != null

?

x.attendance.Status

:

"Absent"

           })

            .OrderByDescending(
x => x.checkInTime
)

            .ToList();


            return Ok(data);
        }
        [HttpGet("activity")]
        public IActionResult GetActivity()
        {

            var data =
            _context.ActivityHistory
            .OrderByDescending(
            x => x.ActionTime
            )
            .ToList();

            return Ok(data);

        }
        [HttpPost("mark-absent")]
        public IActionResult MarkAbsent()
        {
            var today = DateTime.Today;

            // saare users
            var users = _context.Users.ToList();

            foreach (var user in users)
            {
                bool exists = _context.Attendances
                .Any(x =>
                    x.UserId == user.UserId &&
                    x.Date.Date == today
                );

                // agar attendance hi nahi hai
                if (!exists)
                {
                    var attendance = new Attendance
                    {
                        UserId = user.UserId,
                        Date = today,
                        Status = "Absent",
                        IsLate = false
                    };

                    _context.Attendances.Add(attendance);
                }
            }

            _context.SaveChanges();

            return Ok(new
            {
                success = true,
                message = "Absent marked"
            });
        }
        [HttpGet("monthly-summary/{userId}")]
        public IActionResult MonthlySummary(
  int userId,
  int month,
  int year)
        {
            var data =
            _context.Attendances
            .Where(x =>
            x.UserId == userId &&
            x.Date.Month == month &&
            x.Date.Year == year)
            .ToList();

            decimal totalHours =
            data.Sum(x => x.WorkingHours ?? 0);

            int present =
            data.Count(x =>
            x.Status == "Present"
            ||
            x.Status == "On Time");

            int absent =
            data.Count(x =>
            x.Status == "Absent");

            int late =
            data.Count(x =>
            x.Status == "Late"
            ||
            x.Status == "Late Entry");

            return Ok(new
            {

                totalHours,
                present,
                absent,
                late

            });
        }
        [HttpGet("monthly-details/{userId}")]
        public IActionResult MonthlyDetails(
int userId,
int month,
int year)
        {
            var data =
            _context.Attendances

            .Where(x =>
                x.UserId == userId
                &&
                x.Date.Month == month
                &&
                x.Date.Year == year)

            .OrderByDescending(x => x.Date)

            .Select(x => new {

                date = x.Date,

                status = x.Status,

                hours =
                x.WorkingHours

            })

            .ToList();

            return Ok(data);
        }
    } 
}
