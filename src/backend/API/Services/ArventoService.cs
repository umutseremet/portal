// src/backend/API/Services/ArventoService.cs
// ✅ XML PARSING DÜZELTİLMİŞ VERSİYON

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
    public class ArventoService
    {
        private readonly ILogger<ArventoService> _logger;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;
        
        // ✅ SOAP servisleri için base URL (op parametresi YOK)
        private const string ARVENTO_BASE_URL = "https://ws.arvento.com/v1/report.asmx";
        
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
        /// Araç plaka ve cihaz eşleşmelerini getirir
        /// </summary>
        public async Task<List<LicensePlateNodeMappingDto>> GetLicensePlateNodeMappingsAsync(string language = "0")
        {
            try
            {
                _logger.LogInformation("Getting license plate node mappings from Arvento");

                var soapRequest = BuildGetLicensePlateNodeMappingsSoapRequest(_username, _pin1, _pin2, language);
                
                _logger.LogDebug("SOAP Request: {Request}", soapRequest);
                
                // ✅ SOAPAction header ile POST çağrısı
                var response = await SendSoapRequestAsync(soapRequest, "GetLicensePlateNodeMappings");
                
                _logger.LogDebug("SOAP Response: {Response}", response);
                
                var mappings = ParseLicensePlateNodeMappingsResponse(response);
                
                _logger.LogInformation("Retrieved {Count} vehicle mappings from Arvento", mappings.Count);
                
                return mappings;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting license plate node mappings from Arvento");
                throw new Exception("Arvento araç-cihaz eşleşmeleri alınırken hata oluştu: " + ex.Message);
            }
        }

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

                var soapRequest = BuildGetIgnitionBasedDeviceWorkingSoapRequest(
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

        // ============================================================
        // SOAP REQUEST BUILDERS
        // ============================================================

        private string BuildGetLicensePlateNodeMappingsSoapRequest(
            string username, string pin1, string pin2, string language)
        {
            return $@"<?xml version=""1.0"" encoding=""utf-8""?>
<soap:Envelope xmlns:xsi=""http://www.w3.org/2001/XMLSchema-instance"" 
               xmlns:xsd=""http://www.w3.org/2001/XMLSchema"" 
               xmlns:soap=""http://schemas.xmlsoap.org/soap/envelope/"">
  <soap:Body>
    <GetLicensePlateNodeMappings xmlns=""http://tempuri.org/"">
      <Username>{username}</Username>
      <PIN1>{pin1}</PIN1>
      <PIN2>{pin2}</PIN2>
      <Language>{language}</Language>
    </GetLicensePlateNodeMappings>
  </soap:Body>
</soap:Envelope>";
        }

        private string BuildGetVehicleStatusSoapRequest(
            string username, string pin1, string pin2, string language)
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

        private string BuildGetIgnitionBasedDeviceWorkingSoapRequest(
            string username, string pin1, string pin2,
            DateTime startDate, DateTime endDate,
            string? node, string? group, string locale, string language)
        {
            var nodeElement = !string.IsNullOrEmpty(node) ? $"<Node>{node}</Node>" : "";
            var groupElement = !string.IsNullOrEmpty(group) ? $"<Group>{group}</Group>" : "";

            return $@"<?xml version=""1.0"" encoding=""utf-8""?>
<soap:Envelope xmlns:xsi=""http://www.w3.org/2001/XMLSchema-instance"" 
               xmlns:xsd=""http://www.w3.org/2001/XMLSchema"" 
               xmlns:soap=""http://schemas.xmlsoap.org/soap/envelope/"">
  <soap:Body>
    <IgnitionBasedDeviceWorking xmlns=""http://tempuri.org/"">
      <Username>{username}</Username>
      <PIN1>{pin1}</PIN1>
      <PIN2>{pin2}</PIN2>
      <StartDate>{startDate:yyyy-MM-ddTHH:mm:ss}</StartDate>
      <EndDate>{endDate:yyyy-MM-ddTHH:mm:ss}</EndDate>
      {nodeElement}
      {groupElement}
      <Locale>{locale}</Locale>
      <Language>{language}</Language>
    </IgnitionBasedDeviceWorking>
  </soap:Body>
</soap:Envelope>";
        }

        // ============================================================
        // HTTP REQUEST - SOAP POST İLE
        // ============================================================

        /// <summary>
        /// ✅ SOAP servisi çağrısı - HER ZAMAN POST
        /// URL: https://ws.arvento.com/v1/report.asmx (op parametresi YOK)
        /// Header: SOAPAction: http://tempuri.org/{MethodName}
        /// </summary>
        private async Task<string> SendSoapRequestAsync(string soapRequest, string soapAction)
        {
            try
            {
                // ✅ SOAP için Content-Type
                var content = new StringContent(soapRequest, Encoding.UTF8, "text/xml");
                
                // ✅ SOAPAction header - Hangi metod çağrılacağını belirtir
                content.Headers.Add("SOAPAction", $"http://tempuri.org/{soapAction}");

                _logger.LogDebug("Sending SOAP POST request to: {Url}", ARVENTO_BASE_URL);
                _logger.LogDebug("SOAPAction: http://tempuri.org/{SoapAction}", soapAction);

                // ✅ POST ile çağır (SOAP her zaman POST kullanır)
                var response = await _httpClient.PostAsync(ARVENTO_BASE_URL, content);
                
                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Arvento SOAP request failed. Status: {StatusCode}, Response: {Response}", 
                        response.StatusCode, responseContent);
                    throw new Exception($"Arvento SOAP request failed with status: {response.StatusCode}");
                }

                _logger.LogDebug("SOAP response received successfully. Length: {Length}", responseContent.Length);

                return responseContent;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending SOAP request to Arvento");
                throw;
            }
        }

        // ============================================================
        // RESPONSE PARSERS
        // ============================================================

        /// <summary>
        /// ✅ DÜZELTİLMİŞ: GetLicensePlateNodeMappings response parser
        /// </summary>
        private List<LicensePlateNodeMappingDto> ParseLicensePlateNodeMappingsResponse(string xmlResponse)
        {
            try
            {
                var doc = XDocument.Parse(xmlResponse);
                
                // ✅ Namespace'leri doğru tanımla
                XNamespace soapNs = "http://schemas.xmlsoap.org/soap/envelope/";
                XNamespace ns = "http://tempuri.org/";
                XNamespace diffNs = "urn:schemas-microsoft-com:xml-diffgram-v1";

                var mappings = new List<LicensePlateNodeMappingDto>();

                // ✅ XML yapısını doğru parse et
                // Path: soap:Envelope -> soap:Body -> GetLicensePlateNodeMappingsResponse -> GetLicensePlateNodeMappingsResult -> diffgram -> NewDataSet -> Table
                var tables = doc.Descendants(diffNs + "diffgram")
                    .Descendants("NewDataSet")
                    .Descendants("Table")
                    .ToList();

                _logger.LogInformation("Found {Count} table rows in XML response", tables.Count);

                foreach (var table in tables)
                {
                    try
                    {
                        var mapping = new LicensePlateNodeMappingDto
                        {
                            RecordNo = ParseIntValue(table.Element("Kayıt_x0020_No")?.Value),
                            DeviceNo = table.Element("Cihaz_x0020_No")?.Value,
                            LicensePlate = table.Element("Plaka")?.Value,
                            VehicleGsmNo = table.Element("Araç_x0020_GSM_x0020_No")?.Value,
                            Notes = table.Element("Notlar")?.Value,
                            Load = table.Element("Yük")?.Value,
                            VehicleType = table.Element("Araç_x0020_Cinsi")?.Value,
                            VehicleBrand = table.Element("Araç_x0020_Markası")?.Value,
                            VehicleCategory = table.Element("Araç_x0020_Tipi")?.Value,
                            VehicleModel = table.Element("Araç_x0020_Modeli")?.Value,
                            CreatedBy = table.Element("Kaydeden")?.Value,
                            CreatedDate = ParseDateTimeValue(table.Element("Kayıt_x0020_Tarihi")?.Value)
                        };

                        mappings.Add(mapping);

                        _logger.LogDebug("Parsed mapping: DeviceNo={DeviceNo}, LicensePlate={LicensePlate}", 
                            mapping.DeviceNo, mapping.LicensePlate);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Error parsing individual table row, skipping");
                    }
                }

                _logger.LogInformation("Successfully parsed {Count} license plate mappings from XML", mappings.Count);

                return mappings;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error parsing license plate node mappings response. XML: {Xml}", xmlResponse);
                throw new Exception("Arvento yanıtı işlenirken hata oluştu: " + ex.Message);
            }
        }

        private List<VehicleStatusDto> ParseVehicleStatusResponse(string xmlResponse)
        {
            try
            {
                var doc = XDocument.Parse(xmlResponse);
                XNamespace diffNs = "urn:schemas-microsoft-com:xml-diffgram-v1";

                var vehicles = new List<VehicleStatusDto>();

                var tables = doc.Descendants(diffNs + "diffgram")
                    .Descendants("NewDataSet")
                    .Descendants("Table")
                    .ToList();

                foreach (var table in tables)
                {
                    vehicles.Add(new VehicleStatusDto
                    {
                        DeviceNo = table.Element("Cihaz_x0020_No")?.Value,
                        DateTime = ParseDateTimeValue(table.Element("Tarih_x0020_Saat")?.Value),
                        Latitude = ParseDoubleValue(table.Element("Enlem")?.Value),
                        Longitude = ParseDoubleValue(table.Element("Boylam")?.Value),
                        Speed = ParseDoubleValue(table.Element("Hız")?.Value),
                        Address = table.Element("Adres")?.Value,
                        BuildingRegion = table.Element("Bina_x0020_Bölge")?.Value
                    });
                }

                _logger.LogInformation("Parsed {Count} vehicles from XML", vehicles.Count);

                return vehicles;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error parsing vehicle status response");
                throw new Exception("Arvento yanıtı işlenirken hata oluştu: " + ex.Message);
            }
        }

        private List<VehicleWorkingReportDto> ParseIgnitionBasedDeviceWorkingResponse(string xmlResponse)
        {
            try
            {
                var doc = XDocument.Parse(xmlResponse);
                XNamespace diffNs = "urn:schemas-microsoft-com:xml-diffgram-v1";

                var reports = new List<VehicleWorkingReportDto>();

                var tables = doc.Descendants(diffNs + "diffgram")
                    .Descendants("NewDataSet")
                    .Descendants("Table")
                    .ToList();

                foreach (var table in tables)
                {
                    reports.Add(new VehicleWorkingReportDto
                    {
                        RecordNo = table.Element("Kayıt_x0020_No")?.Value,
                        DeviceNo = table.Element("Cihaz_x0020_No")?.Value,
                        LicensePlate = table.Element("Plaka")?.Value,
                        Driver = table.Element("Sürücü")?.Value,
                        Date = table.Element("Tarih")?.Value,
                        IgnitionOnTime = table.Element("Kontak_x0020_Açık_x0020_Süresi")?.Value,
                        IdlingTime = table.Element("Rölanti_x0020_Süresi")?.Value,
                        MovingTime = table.Element("Hareket_x0020_Süresi")?.Value,
                        StandStillTime = table.Element("Durma_x0020_Süresi")?.Value,
                        Distance = ParseDoubleValue(table.Element("Mesafe_x0020__x0028_km_x0029_")?.Value),
                        MaxSpeed = ParseDoubleValue(table.Element("Max_x0020_Hız")?.Value),
                        AverageSpeed = ParseDoubleValue(table.Element("Ortalama_x0020_Hız")?.Value)
                    });
                }

                _logger.LogInformation("Parsed {Count} working reports from XML", reports.Count);

                return reports;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error parsing working report response");
                throw new Exception("Arvento yanıtı işlenirken hata oluştu: " + ex.Message);
            }
        }

        // ============================================================
        // HELPER METHODS
        // ============================================================

        private int? ParseIntValue(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return null;

            if (int.TryParse(value, out int result))
                return result;

            return null;
        }

        private double? ParseDoubleValue(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return null;

            value = value.Replace(',', '.');

            if (double.TryParse(value, System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture, out double result))
                return result;

            return null;
        }

        private DateTime? ParseDateTimeValue(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return null;

            if (DateTime.TryParse(value, out DateTime result))
                return result;

            return null;
        }
    }

    // DTO MODELS (aynı)
    public class LicensePlateNodeMappingDto
    {
        public int? RecordNo { get; set; }
        public string? DeviceNo { get; set; }
        public string? LicensePlate { get; set; }
        public string? VehicleGsmNo { get; set; }
        public string? Notes { get; set; }
        public string? Load { get; set; }
        public string? VehicleType { get; set; }
        public string? VehicleBrand { get; set; }
        public string? VehicleCategory { get; set; }
        public string? VehicleModel { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime? CreatedDate { get; set; }
    }

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