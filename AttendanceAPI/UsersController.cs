using Microsoft.AspNetCore.Mvc;
using AttendanceAPI.Models;
using AttendanceAPI.Data;
using System.Linq;

namespace AttendanceAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        // GET ALL
        [HttpGet]
        public IActionResult GetUsers()
        {
            return Ok(_context.Users.ToList());
        }

        // ADD
        [HttpPost]
        public IActionResult AddUser(User user)
        {
            _context.Users.Add(user);
            _context.SaveChanges();
            return Ok(user);
        }

        // UPDATE
        [HttpPut("{id}")]
        public IActionResult UpdateUser(int id, User updatedUser)
        {
            var user = _context.Users.FirstOrDefault(x => x.UserId == id);
            if (user == null) return NotFound();

            user.Name = updatedUser.Name;
            user.Email = updatedUser.Email;
            user.Role = updatedUser.Role;

            _context.SaveChanges();
            return Ok(user);
        }

        // DELETE
        [HttpDelete("{id}")]
        public IActionResult DeleteUser(int id)
        {
            var user = _context.Users
                .FirstOrDefault(x => x.UserId == id);

            if (user == null)
                return NotFound("User not found");

            try
            {
                var attendanceRecords = _context.Attendances
                    .Where(x => x.UserId == id)
                    .ToList();

                if (attendanceRecords.Any())
                {
                    _context.Attendances
                        .RemoveRange(attendanceRecords);
                }

                _context.Users.Remove(user);

                _context.SaveChanges();

                return Ok("Deleted Successfully");
            }
            catch (Exception ex)
            {
                return BadRequest(
                    ex.InnerException?.Message
                    ?? ex.Message
                );
            }
        }
        [HttpGet("profile/{id}")]
        public IActionResult GetProfile(int id)
        {
            var user = _context.Users
                .Where(x => x.UserId == id)
                .Select(x => new
                {
                    x.UserId,
                    x.Name,
                    x.Email,
                    x.Role
                })
                .FirstOrDefault();

            if (user == null)
                return NotFound();

            return Ok(user);
        }



        [HttpPut("update-profile")]
        public IActionResult UpdateProfile(User model)
        {
            var user = _context.Users
                .FirstOrDefault(x => x.UserId == model.UserId);

            if (user == null)
                return NotFound();

            user.Name = model.Name;
            user.Email = model.Email;

            _context.SaveChanges();

            return Ok(
                new
                {
                    message = "Profile Updated"
                });
        }
        [HttpPut("change-password")]
        public IActionResult ChangePassword([FromBody] ChangePasswordModel model)
        {
            var user = _context.Users
                .FirstOrDefault(x => x.UserId == model.UserId);

            if (user == null)
            {
                return BadRequest("User not found");
            }

            if (user.Password != model.OldPassword)
            {
                return BadRequest("Old password incorrect");
            }

            user.Password = model.NewPassword;

            _context.SaveChanges();

            return Ok(new
            {
                message = "Password Updated Successfully"
            });
        }
    }
}