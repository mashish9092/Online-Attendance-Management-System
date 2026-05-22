namespace AttendanceAPI.Models
{
    public class ActivityHistory
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        public string UserName { get; set; }

        public string ActionType { get; set; }

        public DateTime ActionTime { get; set; }

        public string Status { get; set; }
    }
}
