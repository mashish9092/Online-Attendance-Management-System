using AttendanceAPI.Data;
using AttendanceAPI.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")));


// TELEGRAM
builder.Services.AddHttpClient();

builder.Services.AddScoped<TelegramService>();


builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen();


// CORS
builder.Services.AddCors(options =>
{
  options.AddPolicy("AllowAngular",
  policy =>
  {
    policy.AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
  });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
  app.UseSwagger();
  app.UseSwaggerUI();
}

app.UseCors("AllowAngular");

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
