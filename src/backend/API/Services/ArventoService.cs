using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Linq;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace API.Services
{
    /// <summary>
    /// Arvento Web Service entegrasyonu için servis sınıfı
    /// </summary>
    public class ArventoService
    {
        private readonly ILogger<ArventoService> _logger;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;
        
        // Arvento Web Service URL'leri
        private const string ARVENTO_BASE_URL = "https://ws.arvento.com/v1/report.asmx";
        
        // Konfigürasyon anahtarları
        private string _username;
        private string _pin1;
        private string _pin2;

        public ArventoService(
            ILogger<ArventoService> logger, 
            IConfiguration configuration,
            IHttpClientFactory httpClientFactory)
        {
            _logger = logger;
            _configuration = configuration;
            _httpClient = httpClientFactory.CreateClient();
            
            // Konfigürasyondan bilgileri oku
            LoadConfiguration();
        }

        private void LoadConfiguration()
        {
            _username = _configuration["Arvento:Username"] ?? "";
            _pin1 = _configuration["Arvento:PIN1"] ?? "";
            _pin2 = _configuration["Arvento:PIN2"] ?? "";
            
            _logger.LogInformation("Arvento configuration loaded. Username: {Username}", _username);
        }

        /// <summary>
        /// Araçların son konum bilgilerini getirir
        /// GetVehicleStatus metodu kullanılır
        /// </summary>
        public async Task<List<VehicleStatusDto>> GetVehicleStatusAsync(string language = "0")
        {
            try
            {
                _logger.LogInformation("Getting vehicle status from Arvento");

                var soapRequest = BuildGetVehicleStatusSoapRequest(_username, _pin1, _pin2, language);
                
                var response = await SendSoapRequestAsync(soapRequest, "GetVehicleStatus");
                
                var vehicles = ParseVehicleStatusResponse(response);
                
                _logger.LogInformation("Retrieved {Count} vehicles from Arvento", vehicles.Count);
                
                return vehicles;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting vehicle status from Arvento");
                throw new Exception("Arvento araç durumu alınırken hata oluştu: " + ex.Message);
            }
        }

        /// <summary>
        /// Araç çalışma raporunu getirir
        /// IgnitionBasedDeviceWorking metodu kullanılır
        /// </summary>
        public async Task<List<VehicleWorkingReportDto>> GetIgnitionBasedDeviceWorkingAsync(
            DateTime startDate,
            DateTime endDate,
            string? node = null,
            string? group = null,
            string locale = "tr",
            string language = "0")
        {
            try
            {
                _logger.LogInformation("Getting vehicle working report from Arvento. StartDate: {StartDate}, EndDate: {EndDate}", 
                    startDate, endDate);

                var soapRequest = BuildIgnitionBasedDeviceWorkingSoapRequest(
                    _username, _pin1, _pin2, startDate, endDate, node, group, locale, language);
                
                var response = await SendSoapRequestAsync(soapRequest, "IgnitionBasedDeviceWorking");
                
                var reports = ParseIgnitionBasedDeviceWorkingResponse(response);
                
                _logger.LogInformation("Retrieved {Count} working reports from Arvento", reports.Count);
                
                return reports;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting vehicle working report from Arvento");
                throw new Exception("Arvento araç çalışma raporu alınırken hata oluştu: " + ex.Message);
            }
        }

        /// <summary>
        /// SOAP request gönderir
        /// </summary>
        private async Task<string> SendSoapRequestAsync(string soapRequest, string action)
        {
            try
            {
                var content = new StringContent(soapRequest, Encoding.UTF8, "text/xml");
                content.Headers.Add("SOAPAction", $"http://tempuri.org/{action}");

                var response = await _httpClient.PostAsync(ARVENTO_BASE_URL, content);
                response.EnsureSuccessStatusCode();

                var responseContent = await response.Content.ReadAsStringAsync();
                return responseContent;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "HTTP error while calling Arvento web service");
                throw new Exception($"Arvento servisine bağlanırken hata: {ex.Message}");
            }
        }

        /// <summary>
        /// GetVehicleStatus için SOAP request oluşturur
        /// </summary>
        private string BuildGetVehicleStatusSoapRequest(string username, string pin1, string pin2, string language)
        {
            return $@"<?xml version=""1.0"" encoding=""utf-8""?>
<soap:Envelope xmlns:xsi=""http://www.w3.org/2001/XMLSchema-instance"" 
               xmlns:xsd=""http://www.w3.org/2001/XMLSchema"" 
               xmlns:soap=""http://schemas.xmlsoap.org/soap/envelope/"">
  <soap:Body>
    <GetVehicleStatus xmlns=""http://tempuri.org/"">
      <Username>{username}</Username>
      <PIN1>{pin1}</PIN1>
      <PIN2>{pin2}</PIN2>
      <Language>{language}</Language>
    </GetVehicleStatus>
  </soap:Body>
</soap:Envelope>";
        }

        /// <summary>
        /// IgnitionBasedDeviceWorking için SOAP request oluşturur
        /// </summary>
        private string BuildIgnitionBasedDeviceWorkingSoapRequest(
            string username, string pin1, string pin2, 
            DateTime startDate, DateTime endDate,
            string? node, string? group, string locale, string language)
        {
            // Tarih formatı: MMddyyyyHHmmss
            var startDateStr = startDate.ToString("MMddyyyyHHmmss");
            var endDateStr = endDate.ToString("MMddyyyyHHmmss");

            return $@"<?xml version=""1.0"" encoding=""utf-8""?>
<soap:Envelope xmlns:xsi=""http://www.w3.org/2001/XMLSchema-instance"" 
               xmlns:xsd=""http://www.w3.org/2001/XMLSchema"" 
               xmlns:soap=""http://schemas.xmlsoap.org/soap/envelope/"">
  <soap:Body>
    <IgnitionBasedDeviceWorking xmlns=""http://tempuri.org/"">
      <Username>{username}</Username>
      <PIN1>{pin1}</PIN1>
      <PIN2>{pin2}</PIN2>
      <StartDate>{startDateStr}</StartDate>
      <EndDate>{endDateStr}</EndDate>
      <Node>{node ?? ""}</Node>
      <Group>{group ?? ""}</Group>
      <Locale>{locale}</Locale>
      <Language>{language}</Language>
    </IgnitionBasedDeviceWorking>
  </soap:Body>
</soap:Envelope>";
        }

        /// <summary>
        /// GetVehicleStatus SOAP response'unu parse eder
        /// </summary>
        private List<VehicleStatusDto> ParseVehicleStatusResponse(string xmlResponse)
        {
            var vehicles = new List<VehicleStatusDto>();

            try
            {
                var doc = XDocument.Parse(xmlResponse);
                
                // SOAP namespace'leri
                XNamespace soap = "http://schemas.xmlsoap.org/soap/envelope/";
                XNamespace ns = "http://tempuri.org/";

                // GetVehicleStatusResponse içindeki GetVehicleStatusResult'ı al
                var resultElement = doc.Descendants(ns + "GetVehicleStatusResult").FirstOrDefault();
                
                if (resultElement == null)
                {
                    _logger.LogWarning("GetVehicleStatusResult not found in response");
                    return vehicles;
                }

                // İçteki XML'i parse et
                var innerXml = XDocument.Parse(resultElement.Value);
                
                // Her bir VehicleStatus kaydını işle
                var vehicleElements = innerXml.Descendants("VehicleStatus");
                
                foreach (var vehicle in vehicleElements)
                {
                    vehicles.Add(new VehicleStatusDto
                    {
                        DeviceNo = vehicle.Element("Cihaz_x0020_No")?.Value,
                        DateTime = ParseArventoDateTime(vehicle.Element("GMT_x0020_Tarih_x002F_Saat")?.Value),
                        Latitude = ParseDouble(vehicle.Element("Enlem")?.Value),
                        Longitude = ParseDouble(vehicle.Element("Boylam")?.Value),
                        Speed = ParseDouble(vehicle.Element("Hız")?.Value),
                        Address = vehicle.Element("Adres")?.Value,
                        BuildingRegion = vehicle.Element("Bina_x0020__x002F__x0020_Bölge")?.Value
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error parsing vehicle status response");
                throw;
            }

            return vehicles;
        }

        /// <summary>
        /// IgnitionBasedDeviceWorking SOAP response'unu parse eder
        /// </summary>
        private List<VehicleWorkingReportDto> ParseIgnitionBasedDeviceWorkingResponse(string xmlResponse)
        {
            var reports = new List<VehicleWorkingReportDto>();

            try
            {
                var doc = XDocument.Parse(xmlResponse);
                
                XNamespace soap = "http://schemas.xmlsoap.org/soap/envelope/";
                XNamespace ns = "http://tempuri.org/";

                var resultElement = doc.Descendants(ns + "IgnitionBasedDeviceWorkingResult").FirstOrDefault();
                
                if (resultElement == null)
                {
                    _logger.LogWarning("IgnitionBasedDeviceWorkingResult not found in response");
                    return reports;
                }

                var innerXml = XDocument.Parse(resultElement.Value);
                
                var reportElements = innerXml.Descendants("IgnitionBasedDeviceWorking");
                
                foreach (var report in reportElements)
                {
                    reports.Add(new VehicleWorkingReportDto
                    {
                        RecordNo = report.Element("Kayıt_x0020_No")?.Value,
                        DeviceNo = report.Element("Cihaz_x0020_No")?.Value,
                        LicensePlate = report.Element("Plaka")?.Value,
                        Driver = report.Element("Sürücü")?.Value,
                        Date = report.Element("Tarih")?.Value,
                        IgnitionOnTime = report.Element("Kontak_x0020_Açık_x0020_Kalma_x0020_Süresi")?.Value,
                        IdlingTime = report.Element("Rölanti_x0020_Süresi")?.Value,
                        MovingTime = report.Element("Hareket_x0020_Süresi")?.Value,
                        StandStillTime = report.Element("Duraklama_x0020_Süresi")?.Value,
                        Distance = ParseDouble(report.Element("Mesafe_x0020_km")?.Value),
                        MaxSpeed = ParseDouble(report.Element("Maksimum_x0020_Hız_x0020_km_x002F_s")?.Value),
                        AverageSpeed = ParseDouble(report.Element("Ortalama_x0020_Hız_x0020_km_x002F_s")?.Value)
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error parsing ignition based device working response");
                throw;
            }

            return reports;
        }

        /// <summary>
        /// Arvento tarih formatını parse eder
        /// </summary>
        private DateTime? ParseArventoDateTime(string? dateString)
        {
            if (string.IsNullOrEmpty(dateString))
                return null;

            // Arvento formatı: MM/dd/yyyy HH:mm:ss veya benzer
            if (DateTime.TryParse(dateString, out DateTime result))
                return result;

            return null;
        }

        /// <summary>
        /// String'i double'a çevirir
        /// </summary>
        private double? ParseDouble(string? value)
        {
            if (string.IsNullOrEmpty(value))
                return null;

            if (double.TryParse(value, out double result))
                return result;

            return null;
        }
    }

    // DTO sınıfları
    public class VehicleStatusDto
    {
        public string? DeviceNo { get; set; }
        public DateTime? DateTime { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public double? Speed { get; set; }
        public string? Address { get; set; }
        public string? BuildingRegion { get; set; }
    }

    public class VehicleWorkingReportDto
    {
        public string? RecordNo { get; set; }
        public string? DeviceNo { get; set; }
        public string? LicensePlate { get; set; }
        public string? Driver { get; set; }
        public string? Date { get; set; }
        public string? IgnitionOnTime { get; set; }
        public string? IdlingTime { get; set; }
        public string? MovingTime { get; set; }
        public string? StandStillTime { get; set; }
        public double? Distance { get; set; }
        public double? MaxSpeed { get; set; }
        public double? AverageSpeed { get; set; }
    }
}