// src/backend/API/Services/ArventoService.cs
// ✅ ARVENTO REPORT SERVICE - CONNECTED SERVICE KULLANIMI

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Xml.Linq;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ArventoReportService; // ✅ Connected Service namespace

namespace API.Services
{
    /// <summary>
    /// Arvento Web Servisleri entegrasyonu
    /// Connected Service: ArventoReportService (SOAP WSDL)
    /// Endpoint: https://ws.arvento.com/v1/report.asmx
    /// </summary>
    public class ArventoService
    {
        private readonly ILogger<ArventoService> _logger;
        private readonly IConfiguration _configuration;
        private readonly ArventoReportWebServiceSoapClient _soapClient;
        
        private string _username;
        private string _pin1;
        private string _pin2;

        public ArventoService(
            ILogger<ArventoService> logger, 
            IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
            
            // ✅ SOAP Client oluştur
            _soapClient = new ArventoReportWebServiceSoapClient(
                ArventoReportWebServiceSoapClient.EndpointConfiguration.ArventoReportWebServiceSoap);
            
            LoadConfiguration();
        }

        private void LoadConfiguration()
        {
            _username = _configuration["Arvento:Username"] ?? "";
            _pin1 = _configuration["Arvento:PIN1"] ?? "";
            _pin2 = _configuration["Arvento:PIN2"] ?? "";
            
            _logger.LogInformation("Arvento configuration loaded. Username: {Username}", _username);
        }

        // ============================================================
        // PUBLIC METHODS - CONNECTED SERVICE KULLANIMI
        // ============================================================

        /// <summary>
        /// ✅ Araç plaka ve cihaz eşleşmelerini getirir
        /// </summary>
        public async Task<List<LicensePlateNodeMappingDto>> GetLicensePlateNodeMappingsAsync(string language = "0")
        {
            try
            {
                _logger.LogInformation("Getting license plate node mappings from Arvento");

                // ✅ Connected Service üzerinden SOAP çağrısı
                var result = await _soapClient.GetLicensePlateNodeMappingsAsync(
                    _username, 
                    _pin1, 
                    _pin2, 
                    language);

                _logger.LogDebug("SOAP Response received. Node count: {Count}", result?.Nodes?.Count ?? 0);

                var mappings = ParseLicensePlateNodeMappings(result);
                
                _logger.LogInformation("Retrieved {Count} vehicle mappings from Arvento", mappings.Count);
                
                return mappings;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting license plate node mappings from Arvento");
                throw new Exception("Arvento araç-cihaz eşleşmeleri alınırken hata oluştu: " + ex.Message);
            }
        }

        /// <summary>
        /// ✅ Araç durum bilgilerini getirir
        /// </summary>
        public async Task<List<VehicleStatusDto>> GetVehicleStatusAsync(string language = "0")
        {
            try
            {
                _logger.LogInformation("Getting vehicle status from Arvento");

                // ✅ Connected Service üzerinden SOAP çağrısı
                var result = await _soapClient.GetVehicleStatusAsync(
                    _username, 
                    _pin1, 
                    _pin2, 
                    language);

                _logger.LogDebug("SOAP Response received. Node count: {Count}", result?.Nodes?.Count ?? 0);

                var vehicles = ParseVehicleStatus(result);
                
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
        /// ✅ Araç çalışma raporu getirir (Kontak bazlı)
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

                // ✅ Connected Service üzerinden SOAP çağrısı
                var result = await _soapClient.IgnitionBasedDeviceWorkingAsync(
                    _username,
                    _pin1,
                    _pin2,
                    startDate.ToString("yyyy-MM-ddTHH:mm:ss"),
                    endDate.ToString("yyyy-MM-ddTHH:mm:ss"),
                    node ?? "",
                    group ?? "",
                    locale,
                    language);

                _logger.LogDebug("SOAP Response received. Node count: {Count}", result?.Nodes?.Count ?? 0);

                var reports = ParseIgnitionBasedDeviceWorking(result);
                
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
        // RESPONSE PARSERS - ArrayOfXElement'den DTO'ya dönüşüm
        // ============================================================

        /// <summary>
        /// ✅ GetLicensePlateNodeMappings sonucunu parse eder
        /// ArrayOfXElement.Nodes yapısı:
        /// - [0] = XML Schema/Metadata
        /// - [1] = Data Container (diffgram wrapper)
        ///   └─ [0] = <dsPlaka>
        ///       └─ <tblPlaka>, <tblPlaka>, ... (asıl kayıtlar)
        /// </summary>
        private List<LicensePlateNodeMappingDto> ParseLicensePlateNodeMappings(ArrayOfXElement arrayOfXElement)
        {
            var mappings = new List<LicensePlateNodeMappingDto>();

            if (arrayOfXElement?.Nodes == null || arrayOfXElement.Nodes.Count == 0)
            {
                _logger.LogWarning("Empty or null ArrayOfXElement received");
                return mappings;
            }

            try
            {
                // ✅ İlk node (index 0) = Schema, İkinci node (index 1) = Data
                if (arrayOfXElement.Nodes.Count < 2)
                {
                    _logger.LogWarning("ArrayOfXElement does not contain data node (expected 2 nodes, got {Count})", 
                        arrayOfXElement.Nodes.Count);
                    return mappings;
                }

                var dataNode = arrayOfXElement.Nodes[1]; // ✅ İkinci node = diffgram wrapper
                
                _logger.LogDebug("Data node name: {Name}, Element count: {Count}", 
                    dataNode.Name.LocalName, dataNode.Elements().Count());

                // ✅ diffgram wrapper içindeki ilk element = <dsPlaka>
                var dsPlaka = dataNode.Elements().FirstOrDefault();
                
                if (dsPlaka == null)
                {
                    _logger.LogWarning("dsPlaka element not found in data node");
                    return mappings;
                }

                _logger.LogDebug("dsPlaka element name: {Name}, Child count: {Count}", 
                    dsPlaka.Name.LocalName, dsPlaka.Elements().Count());

                // ✅ <dsPlaka> içindeki TÜM <tblPlaka> elementleri
                var tblPlakaElements = dsPlaka.Elements().ToList();

                _logger.LogInformation("Found {Count} tblPlaka elements in dsPlaka", tblPlakaElements.Count);

                foreach (var tblPlaka in tblPlakaElements)
                {
                    try
                    {
                        _logger.LogDebug("Processing element: {Name}", tblPlaka.Name.LocalName);

                        var mapping = new LicensePlateNodeMappingDto
                        {
                            RecordNo = ParseIntValue(tblPlaka.Element("Kayıt_x0020_No")?.Value),
                            DeviceNo = tblPlaka.Element("Cihaz_x0020_No")?.Value,
                            LicensePlate = tblPlaka.Element("Plaka")?.Value,
                            VehicleGsmNo = tblPlaka.Element("Araç_x0020_GSM_x0020_No")?.Value,
                            Notes = tblPlaka.Element("Notlar")?.Value,
                            Load = tblPlaka.Element("Yük")?.Value,
                            VehicleType = tblPlaka.Element("Araç_x0020_Cinsi")?.Value,
                            NodeNo = tblPlaka.Element("Node_x0020_No")?.Value,
                            GroupNo = tblPlaka.Element("Grup_x0020_No")?.Value,
                            VehicleIcon = tblPlaka.Element("Araç_x0020_İkonu")?.Value,
                            DriverName = tblPlaka.Element("Sürücü_x0020_Adı")?.Value,
                            DriverPhone = tblPlaka.Element("Sürücü_x0020_Telefonu")?.Value,
                            VehicleModel = tblPlaka.Element("Araç_x0020_Modeli")?.Value,
                            DeviceType = tblPlaka.Element("Cihaz_x0020_Tipi")?.Value,
                            DriverIdentificationNumber = tblPlaka.Element("Kaydeden")?.Value,
                            RegistrationDate = ParseDateTimeValue(tblPlaka.Element("Kayıt_x0020_Tarihi")?.Value)
                        };

                        mappings.Add(mapping);
                        
                        _logger.LogDebug("Parsed vehicle: {LicensePlate}, Node: {NodeNo}, Device: {DeviceNo}", 
                            mapping.LicensePlate, mapping.NodeNo, mapping.DeviceNo);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Error parsing individual tblPlaka element");
                    }
                }

                _logger.LogInformation("Successfully parsed {Count} vehicle mappings from ArrayOfXElement", mappings.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error parsing ArrayOfXElement");
            }

            return mappings;
        }

        /// <summary>
        /// ✅ GetVehicleStatus sonucunu parse eder
        /// ArrayOfXElement.Nodes yapısı:
        /// - [0] = XML Schema/Metadata
        /// - [1] = Data Container → İlk element → Asıl kayıtlar
        /// </summary>
        private List<VehicleStatusDto> ParseVehicleStatus(ArrayOfXElement arrayOfXElement)
        {
            var vehicles = new List<VehicleStatusDto>();

            if (arrayOfXElement?.Nodes == null || arrayOfXElement.Nodes.Count == 0)
            {
                _logger.LogWarning("Empty or null ArrayOfXElement received");
                return vehicles;
            }

            try
            {
                // ✅ İkinci node = Data
                if (arrayOfXElement.Nodes.Count < 2)
                {
                    _logger.LogWarning("ArrayOfXElement does not contain data node");
                    return vehicles;
                }

                var dataNode = arrayOfXElement.Nodes[1];
                
                // ✅ Data container içindeki ilk element (dataset wrapper)
                var datasetElement = dataNode.Elements().FirstOrDefault();
                
                if (datasetElement == null)
                {
                    _logger.LogWarning("Dataset element not found in data node");
                    return vehicles;
                }

                // ✅ Dataset içindeki tüm table elementleri
                var tableElements = datasetElement.Elements().ToList();

                _logger.LogInformation("Found {Count} vehicle status records", tableElements.Count);

                foreach (var table in tableElements)
                {
                    try
                    {
                        var vehicle = new VehicleStatusDto
                        {
                            // ✅ Gerçek XML Field'ları
                            NodeNo = table.Element("Cihaz_x0020_No")?.Value,
                            LicensePlate = table.Element("Plaka")?.Value,
                            DeviceNo = table.Element("Cihaz_x0020_No")?.Value,
                            Latitude = ParseDoubleValue(table.Element("Enlem")?.Value),
                            Longitude = ParseDoubleValue(table.Element("Boylam")?.Value),
                            Speed = ParseIntValue(table.Element("Hız")?.Value),
                            Address = table.Element("Adres")?.Value,
                            Altitude = ParseIntValue(table.Element("Yükseklik")?.Value),
                            LastUpdateTime = ParseDateTimeValue(table.Element("GMT_x0020_Tarih_x0020F_Saat")?.Value),
                            Region = table.Element("Bina_x0020__x0020F_x0020_Bölge")?.Value,
                            LocationType = table.Element("İl")?.Value,
                            District = table.Element("İlçe")?.Value,
                            GpsQuality = ParseIntValue(table.Element("Görülen_x0020_GPS_x0020_Uydu_x0020_Sayısı")?.Value),
                            SupportedDeviceCount = ParseDoubleValue(table.Element("Cihaz_x0020_Besleme_x0020_Gerilimi")?.Value),
                            RssiSignalStrength = ParseIntValue(table.Element("RSSI_x0020_Aralığı")?.Value)
                        };

                        vehicles.Add(vehicle);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Error parsing individual vehicle status row");
                    }
                }

                _logger.LogInformation("Parsed {Count} vehicles from ArrayOfXElement", vehicles.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error parsing ArrayOfXElement");
            }

            return vehicles;
        }

        /// <summary>
        /// ✅ IgnitionBasedDeviceWorking sonucunu parse eder
        /// ArrayOfXElement.Nodes yapısı:
        /// - [0] = XML Schema/Metadata
        /// - [1] = Data Container → İlk element → Asıl kayıtlar
        /// </summary>
        private List<VehicleWorkingReportDto> ParseIgnitionBasedDeviceWorking(ArrayOfXElement arrayOfXElement)
        {
            var reports = new List<VehicleWorkingReportDto>();

            if (arrayOfXElement?.Nodes == null || arrayOfXElement.Nodes.Count == 0)
            {
                _logger.LogWarning("Empty or null ArrayOfXElement received");
                return reports;
            }

            try
            {
                // ✅ İkinci node = Data
                if (arrayOfXElement.Nodes.Count < 2)
                {
                    _logger.LogWarning("ArrayOfXElement does not contain data node");
                    return reports;
                }

                var dataNode = arrayOfXElement.Nodes[1];
                
                // ✅ Data container içindeki ilk element (dataset wrapper)
                var datasetElement = dataNode.Elements().FirstOrDefault();
                
                if (datasetElement == null)
                {
                    _logger.LogWarning("Dataset element not found in data node");
                    return reports;
                }

                // ✅ Dataset içindeki tüm table elementleri
                var tableElements = datasetElement.Elements().ToList();

                _logger.LogInformation("Found {Count} working report records", tableElements.Count);

                foreach (var table in tableElements)
                {
                    try
                    {
                        var report = new VehicleWorkingReportDto
                        {
                            LicensePlate = table.Element("Plaka")?.Value,
                            NodeNo = table.Element("Node_x0020_No")?.Value,
                            StartTime = ParseDateTimeValue(table.Element("Başlangıç_x0020_Zamanı")?.Value),
                            EndTime = ParseDateTimeValue(table.Element("Bitiş_x0020_Zamanı")?.Value),
                            Duration = ParseTimeSpanValue(table.Element("Süre")?.Value),
                            Distance = ParseDoubleValue(table.Element("Mesafe")?.Value),
                            StartAddress = table.Element("Başlangıç_x0020_Adresi")?.Value,
                            EndAddress = table.Element("Bitiş_x0020_Adresi")?.Value,
                            StartLatitude = ParseDoubleValue(table.Element("Başlangıç_x0020_Enlem")?.Value),
                            StartLongitude = ParseDoubleValue(table.Element("Başlangıç_x0020_Boylam")?.Value),
                            EndLatitude = ParseDoubleValue(table.Element("Bitiş_x0020_Enlem")?.Value),
                            EndLongitude = ParseDoubleValue(table.Element("Bitiş_x0020_Boylam")?.Value),
                            DriverName = table.Element("Sürücü_x0020_Adı")?.Value,
                            MaxSpeed = ParseIntValue(table.Element("Maksimum_x0020_Hız")?.Value),
                            AverageSpeed = ParseDoubleValue(table.Element("Ortalama_x0020_Hız")?.Value)
                        };

                        reports.Add(report);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Error parsing individual working report row");
                    }
                }

                _logger.LogInformation("Parsed {Count} working reports from ArrayOfXElement", reports.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error parsing ArrayOfXElement");
            }

            return reports;
        }

        // ============================================================
        // HELPER METHODS - Type Conversions
        // ============================================================

        private int ParseIntValue(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return 0;
                
            if (int.TryParse(value, out int result))
                return result;
                
            return 0;
        }

        private double ParseDoubleValue(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return 0;
                
            // Türkçe ondalık ayracı için
            value = value.Replace(',', '.');
            
            if (double.TryParse(value, System.Globalization.NumberStyles.Any, 
                System.Globalization.CultureInfo.InvariantCulture, out double result))
                return result;
                
            return 0;
        }

        private DateTime? ParseDateTimeValue(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return null;
                
            if (DateTime.TryParse(value, out DateTime result))
                return result;
                
            return null;
        }

        private TimeSpan? ParseTimeSpanValue(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return null;
                
            // Format genellikle "HH:mm:ss" veya "dd.HH:mm:ss" şeklinde
            if (TimeSpan.TryParse(value, out TimeSpan result))
                return result;
                
            return null;
        }
    }

    // ============================================================
    // DTO CLASSES
    // ============================================================

    public class LicensePlateNodeMappingDto
    {
        public int RecordNo { get; set; }
        public string? DeviceNo { get; set; }
        public string? LicensePlate { get; set; }
        public string? VehicleGsmNo { get; set; }
        public string? Notes { get; set; }
        public string? Load { get; set; }
        public string? VehicleType { get; set; }
        public string? NodeNo { get; set; }
        public string? GroupNo { get; set; }
        public string? VehicleIcon { get; set; }
        public string? DriverName { get; set; }
        public string? DriverPhone { get; set; }
        public string? VehicleModel { get; set; }
        public string? DeviceType { get; set; }
        public string? DriverIdentificationNumber { get; set; } // Kaydeden
        public DateTime? RegistrationDate { get; set; } // Kayıt_x0020_Tarihi
    }

    public class VehicleStatusDto
    {
        // ✅ Gerçek API Response Field'ları
        public string? NodeNo { get; set; }                    // Cihaz_x0020_No -> X100858741
        public string? LicensePlate { get; set; }              // Plaka -> (boş olabilir)
        public string? DeviceNo { get; set; }                  // Cihaz_x0020_No
        public double Latitude { get; set; }                   // Enlem -> 36.555943
        public double Longitude { get; set; }                  // Boylam -> 36.155533
        public int Speed { get; set; }                         // Hız -> 0
        public string? Address { get; set; }                   // Adres -> İsmet İnönü Mh., İskenderun...
        public int Altitude { get; set; }                      // Yükseklik -> 42
        public DateTime? LastUpdateTime { get; set; }          // GMT_x0020_Tarih_x0020F_Saat -> 2025-07-04T16:21:08.316+03:00
        public string? Region { get; set; }                    // Bina_x0020__x0020F_x0020_Bölge (null olabilir)
        public string? LocationType { get; set; }              // İl -> Hatay
        public string? District { get; set; }                  // İlçe -> İskenderun
        public int GpsQuality { get; set; }                    // Görülen_x0020_GPS_x0020_Uydu_x0020_Sayısı -> 14
        public double SupportedDeviceCount { get; set; }       // Cihaz_x0020_Besleme_x0020_Gerilimi -> -6.1
        public int RssiSignalStrength { get; set; }            // RSSI_x0020_Aralığı -> -31
    }

    public class VehicleWorkingReportDto
    {
        public string? LicensePlate { get; set; }
        public string? NodeNo { get; set; }
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public TimeSpan? Duration { get; set; }
        public double Distance { get; set; }
        public string? StartAddress { get; set; }
        public string? EndAddress { get; set; }
        public double StartLatitude { get; set; }
        public double StartLongitude { get; set; }
        public double EndLatitude { get; set; }
        public double EndLongitude { get; set; }
        public string? DriverName { get; set; }
        public int MaxSpeed { get; set; }
        public double AverageSpeed { get; set; }
    }
}