using System;
using System.ComponentModel.DataAnnotations.Schema;
namespace AttendanceAPI.Models
{
    [Table("Attendance")]
    public class Attendance
    {
        public int AttendanceId { get; set; }
        public int UserId { get; set; }
        public DateTime Date { get; set; }
        public DateTime? CheckInTime { get; set; }
        public DateTime? CheckOutTime { get; set; }
        public decimal? WorkingHours { get; set; }
        public bool? IsLate { get; set; }
        public string Status { get; set; }
    }
}
