using System.Net.Http;

namespace AttendanceAPI.Services
{
  public class TelegramService
  {
    private readonly IConfiguration _config;
    private readonly HttpClient _http;

    public TelegramService(
        IConfiguration config,
        HttpClient http)
    {
      _config = config;
      _http = http;
    }

    public async Task SendMessage(string message)
    {
      var token = _config["Telegram:BotToken"];
      var chatId = _config["Telegram:ChatId"];

      var url =
      $"https://api.telegram.org/bot{token}/sendMessage?chat_id={chatId}&text={message}";

      await _http.GetAsync(url);
    }
  }
}
