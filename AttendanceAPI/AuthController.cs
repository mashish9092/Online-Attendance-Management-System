using Microsoft.AspNetCore.Mvc;
using AttendanceAPI.Data;
using AttendanceAPI.Models;
using System.Linq;
using System;

namespace AttendanceAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuthController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginDto loginUser)
        {
            var user = _context.Users
                .FirstOrDefault(x => x.Email == loginUser.Email && x.Password == loginUser.Password);

            if (user == null)
                return Unauthorized("Invalid credentials");

            return Ok(new
            {
                id = user.UserId,
                name = user.Name,
                email = user.Email,
                role = user.Role
            });
        }
    }
}