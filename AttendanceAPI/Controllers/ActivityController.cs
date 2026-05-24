using Microsoft.AspNetCore.Mvc;
using AttendanceAPI.Data;
using Microsoft.EntityFrameworkCore;

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

      return Ok(data);
    }
  }
}
