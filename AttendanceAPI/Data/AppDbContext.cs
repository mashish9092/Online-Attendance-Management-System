using Microsoft.EntityFrameworkCore;
using AttendanceAPI.Models;

namespace AttendanceAPI.Data
{
  public class AppDbContext : DbContext
  {
    public AppDbContext(
        DbContextOptions<AppDbContext> options
    ) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }

    public DbSet<Attendance> Attendances { get; set; }

    public DbSet<ActivityHistory> ActivityHistory { get; set; }
  }
}
