using AttendanceAPI.Data;
using AttendanceAPI.Models;
using AttendanceAPI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;



namespace AttendanceAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AttendanceController : ControllerBase
    {
    private readonly AppDbContext _context;
    private readonly TelegramService _telegram;

    public AttendanceController(
        AppDbContext context,
        TelegramService telegram)
    {
      _context = context;
      _telegram = telegram;
    }
    [HttpPost("checkin")]
    public async Task<IActionResult> CheckIn([FromBody] int userId)
    {
      var today = DateTime.Today;
      var now = DateTime.Now;

      // 🔥 Previous open attendance check
      var previousAttendance =
      _context.Attendances
      .Where(x =>
          x.UserId == userId &&
          x.CheckOutTime == null)
      .OrderByDescending(x => x.Date)
      .FirstOrDefault();

      // Previous date checkout miss
      if (previousAttendance != null &&
    previousAttendance.CheckInTime.HasValue)
      {
        previousAttendance.CheckOutTime =
            previousAttendance.Date.Date
            .AddHours(23)
            .AddMinutes(59)
            .AddSeconds(59);

        TimeSpan duration =
            previousAttendance.CheckOutTime.Value -
            previousAttendance.CheckInTime.Value;

        previousAttendance.WorkingHours =
            (decimal)duration.TotalHours;

        previousAttendance.Status = "Missed Checkout";
      }

      // Today already open
      if (
        previousAttendance != null &&
        previousAttendance.Date.Date == today
      )
      {
        return BadRequest(
        "Please checkout previous attendance first");
      }

      // Already checked in today
      var exists =
      _context.Attendances
      .Any(a =>
          a.UserId == userId &&
          a.Date.Date == today);

      if (exists)
      {
        return BadRequest(
        "You already checked in today");
      }

      bool isLate =
      now.TimeOfDay >
      new TimeSpan(9, 30, 0);

      var attendance =
      new Attendance
      {
        UserId = userId,
        Date = now,
        CheckInTime = now,
        IsLate = isLate,

        Status =
          isLate
          ?
          "Late"
          :
          "On Time"
      };

      _context.Attendances.Add(attendance);

      var user =
      _context.Users
      .FirstOrDefault(
      x => x.UserId == userId);

      // 🔥 Activity duplicate check
      if (user != null)
      {
        var alreadyAdded =
        _context.ActivityHistory
        .Any(x =>

        x.UserId == user.UserId &&

        x.ActionType == "Check In" &&

        x.ActionTime.Date == DateTime.Today &&

        EF.Functions.DateDiffMinute(
            x.ActionTime,
            DateTime.Now
        ) < 2
        );

        if (!alreadyAdded)
        {
          _context.ActivityHistory.Add(
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
          });
        }
      }

      _context.SaveChanges();
      if (user != null)
      {

    await _telegram.SendMessage(

$@"✅ Employee Check-In

👤 Name: {user.Name}

⏰ Check In: {DateTime.Now:hh:mm tt}

📌 Status: {(isLate ? "Late" : "On Time")}

📅 Date: {DateTime.Now:dd-MM-yyyy}"
);
      }

      return Ok(new
      {
        message =
          previousAttendance != null
          ?
          "Previous attendance auto closed. Check-in successful"
          :
          "Check-in successful",

        checkInTime = now
      });
    }


    // CHECK-OUT API
    [HttpPost("checkout")]
    public async Task<IActionResult> CheckOut([FromBody] int userId)
    {
      if (userId == 0)
        return BadRequest("UserId not received");

      var today = DateTime.Today;

      var attendance =
      _context.Attendances
      .FirstOrDefault(
      x =>
      x.UserId == userId &&
      x.Date.Date == today);

      if (attendance == null)
        return BadRequest(
        "Check-in not found");

      if (attendance.CheckInTime == null)
        return BadRequest(
        "Check-in time missing");

      if (attendance.CheckOutTime != null)
        return BadRequest(
        "Already checked out");


      var checkOutTime =
      DateTime.Now;

      attendance.CheckOutTime =
      checkOutTime;


      // 🔥 Duration calculate
      var duration =
      checkOutTime
      -
      attendance.CheckInTime.Value;

      // Hours for status logic
      var workingHours =
      duration.TotalHours;

      // Save decimal in DB
      attendance.WorkingHours =
      (decimal)
      duration.TotalMinutes
      /
      60;


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


      // 🔥 Duplicate Activity block
      if (user != null)
      {
        bool alreadyExists =
        _context.ActivityHistory
        .Any(x =>

        x.UserId == user.UserId &&

        x.ActionType == "Check Out" &&

        x.ActionTime.Date ==
        DateTime.Today &&

        EF.Functions.DateDiffMinute(
        x.ActionTime,
        DateTime.Now
        ) < 2
        );

        if (!alreadyExists)
        {
          ActivityHistory activity =
          new ActivityHistory
          {
            UserId = user.UserId,

            UserName = user.Name,

            ActionType =
              "Check Out",

            ActionTime =
              DateTime.Now,

            Status =
              attendance.Status
          };

          _context.ActivityHistory
          .Add(activity);
        }
      }

      _context.SaveChanges();
      if (user != null)
      {
        await _telegram.SendMessage(

    $@"🔴 Employee Check-Out

👤 Name: {user.Name}

🕘 Check In: {attendance.CheckInTime:hh:mm tt}

🕕 Check Out: {attendance.CheckOutTime:hh:mm tt}

⏱ Working Hours: {duration:hh\:mm}

📌 Status: {attendance.Status}

📅 Date: {DateTime.Now:dd-MM-yyyy}"
        );
      }

      return Ok(new
      {
        success = true,

        message =
          "Check-out successful",

        // 🔥 UI hh:mm format
        workingHours =
          duration
          .ToString(@"hh\:mm"),

        status =
          attendance.Status
      });
    }

    [HttpGet("allActivity")]
    public IActionResult GetAllActivity()
    {
      var data = _context.ActivityHistory
          .AsNoTracking()
          .OrderByDescending(x => x.ActionTime)
          .Select(x => new
          {
            name = x.UserName,
            time = x.ActionTime,
            status = x.Status
          })
          .ToList();

      Console.WriteLine(
          "Activity Count = " + data.Count
      );

      return Ok(data);
    }

    [HttpGet("list/{userId}")]
    public IActionResult GetAttendance(int userId)
    {
      var data =
      _context.Attendances

      .Where(a => a.UserId == userId)

      .Join(
          _context.Users,
          a => a.UserId,
          u => u.UserId,

          (a, u) => new
          {
            Name = u.Name,
            Email = u.Email,

            Date = a.Date,

            CheckInTime =
              a.CheckInTime,

            CheckOutTime =
              a.CheckOutTime,

            WorkingHours =
a.WorkingHours != null
?

TimeSpan
.FromHours(
(double)a.WorkingHours.Value
)
.ToString(@"hh\:mm")

:

"--",

            IsLate =
              a.IsLate,

            Status =
              a.Status
          })

      .OrderByDescending(
      x => x.Date)

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

      // Sirf employees/User count
      int totalUsers =
      _context.Users
      .Count(x => x.Role == "User");


      var todayData =
 _context.Attendances
 .Where(x =>
 x.Date.Date == today)
 .ToList();


      int presentToday =
      todayData
      .Where(x =>
        x.Status != "Absent"
      )
      .Select(x => x.UserId)
      .Distinct()
      .Count();


      int lateCount =
      todayData
      .Where(x => x.IsLate == true)
      .Select(x => x.UserId)
      .Distinct()
      .Count();


      int absentToday =
 todayData
 .Count(x =>
 x.Status == "Absent");


      int totalMinutes =
      todayData
      .Where(x =>

      x.CheckInTime.HasValue
      &&

      x.CheckOutTime.HasValue

      )
      .Sum(x =>

     (int)Math.Ceiling(
(
x.CheckOutTime.Value
-
x.CheckInTime.Value
).TotalMinutes
)
      );


      string workingHours =
      totalMinutes > 0
      ?
      TimeSpan
      .FromMinutes(totalMinutes)
      .ToString(@"hh\:mm")
      :
      "00:00";


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

      _context.Attendances

      .Where(a => a.Date.Date == today)

      .Join(

      _context.Users,

      a => a.UserId,

      u => u.UserId,

      (a, u) => new
      {
        name = u.Name,

        email = u.Email,

        date = a.Date,

        checkInTime = a.CheckInTime,

        checkOutTime = a.CheckOutTime,

        isLate = a.IsLate,

        workingHours =

          a.CheckInTime != null &&
          a.CheckOutTime != null

          ?

          (
          a.CheckOutTime.Value
          -
          a.CheckInTime.Value
          )
          .ToString(@"hh\:mm")

          :

          "--",

        status = a.Status
      })

      .OrderByDescending(
      x => x.checkInTime
      )

      .ToList();

      return Ok(data);
    }

    [HttpPost("mark-absent")]
    public IActionResult MarkAbsent()
    {
      var today = DateTime.Today;

      // Sirf User role wale
      var users = _context.Users
          .Where(x => x.Role == "User")
          .ToList();

      foreach (var user in users)
      {
        bool checkedIn =
        _context.Attendances
        .Any(x =>
            x.UserId == user.UserId &&
            x.Date.Date == today);

        // Agar aaj record nahi hai tabhi absent banao
        if (!checkedIn)
        {
          _context.Attendances.Add(
          new Attendance
          {
            UserId = user.UserId,
            Date = today,

            Status = "Absent",

            CheckInTime = null,
            CheckOutTime = null,

            WorkingHours = 0,

            IsLate = false
          });
        }
      }

      _context.SaveChanges();

      return Ok(new
      {
        message = "Absent marked successfully"
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
    [HttpGet("all")]
    public IActionResult GetAllAttendance()
    {
      var data =

      _context.Attendances

      .Join(
          _context.Users,

          a => a.UserId,
          u => u.UserId,

          (a, u) => new
          {
            name = u.Name,

            date = a.Date,

            checkInTime = a.CheckInTime,

            checkOutTime = a.CheckOutTime,

            workingHours =

              a.WorkingHours != null
              ?

              TimeSpan
              .FromHours(
                  (double)a.WorkingHours.Value
              )
              .ToString(@"hh\:mm")

              :

              "--",

            isLate = a.IsLate,

            status = a.Status
          })

      .OrderByDescending(
          x => x.date
      )

      .ToList();

      return Ok(data);
    }
  } 
}
