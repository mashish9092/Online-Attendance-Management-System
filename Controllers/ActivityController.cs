using AttendanceAPI.Data;
using Microsoft.AspNetCore.Mvc;

namespace AttendanceAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ActivityController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ActivityController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("all")]
        public IActionResult GetAll()
        {
            var startDate = new DateTime(2026, 5, 1);
            var endDate = new DateTime(2026, 5, 20);

            var result = new List<object>();

            foreach (var user in _context.Users.ToList())
            {
                for (var date = startDate; date <= endDate; date = date.AddDays(1))
                {
                    var attendance =
                    _context.Attendances
                    .FirstOrDefault(x =>
                    x.UserId == user.UserId &&
                    x.Date.Date == date.Date);

                    if (attendance != null)
                    {
                        result.Add(new
                        {
                            name = user.Name,

                            time = attendance.CheckInTime,

                            status = attendance.Status
                        });
                    }
                    else
                    {
                        // 🔥 Auto absent
                        result.Add(new
                        {
                            name = user.Name,

                            time = date,

                            status = "Absent"
                        });
                    }
                }
            }

            return Ok(
            result
            .OrderByDescending(x => x.GetType().GetProperty("time").GetValue(x))
            .Take(50));
        }
    }
}