using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using API.Services;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ArventoController : ControllerBase
    {
        private readonly ArventoService _arventoService;
        private readonly ILogger<ArventoController> _logger;

        public ArventoController(
            ArventoService arventoService,
            ILogger<ArventoController> logger)
        {
            _arventoService = arventoService;
            _logger = logger;
        }

        /// <summary>
        /// Araçların son konum bilgilerini getirir
        /// GET /api/Arvento/vehicle-status
        /// </summary>
        [HttpGet("vehicle-status")]
        public async Task<ActionResult<VehicleStatusResponse>> GetVehicleStatus([FromQuery] string language = "0")
        {
            try
            {
                _logger.LogInformation("Getting vehicle status. Language: {Language}", language);

                var vehicles = await _arventoService.GetVehicleStatusAsync(language);

                var response = new VehicleStatusResponse
                {
                    Success = true,
                    Data = vehicles,
                    TotalCount = vehicles.Count,
                    Message = $"{vehicles.Count} araç bilgisi getirildi"
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting vehicle status");
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "Araç durumu alınırken hata oluştu",
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Araç çalışma raporunu getirir
        /// GET /api/Arvento/working-report
        /// </summary>
        [HttpGet("working-report")]
        public async Task<ActionResult<VehicleWorkingReportResponse>> GetWorkingReport(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] string? node,
            [FromQuery] string? group,
            [FromQuery] string locale = "tr",
            [FromQuery] string language = "0")
        {
            try
            {
                // Tarih kontrolü
                if (!startDate.HasValue || !endDate.HasValue)
                {
                    return BadRequest(new
                    {
                        Success = false,
                        Message = "Başlangıç ve bitiş tarihleri zorunludur"
                    });
                }

                // Tarih aralığı kontrolü (maksimum 31 gün)
                if ((endDate.Value - startDate.Value).Days > 31)
                {
                    return BadRequest(new
                    {
                        Success = false,
                        Message = "Tarih aralığı maksimum 31 gün olabilir"
                    });
                }

                _logger.LogInformation("Getting vehicle working report. StartDate: {StartDate}, EndDate: {EndDate}, Node: {Node}, Group: {Group}",
                    startDate, endDate, node, group);

                var reports = await _arventoService.GetIgnitionBasedDeviceWorkingAsync(
                    startDate.Value, endDate.Value, node, group, locale, language);

                var response = new VehicleWorkingReportResponse
                {
                    Success = true,
                    Data = reports,
                    TotalCount = reports.Count,
                    StartDate = startDate.Value,
                    EndDate = endDate.Value,
                    Message = $"{reports.Count} araç çalışma raporu getirildi"
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting vehicle working report");
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "Araç çalışma raporu alınırken hata oluştu",
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Arvento bağlantı durumunu test eder
        /// GET /api/Arvento/test-connection
        /// </summary>
        [HttpGet("test-connection")]
        public async Task<ActionResult> TestConnection()
        {
            try
            {
                _logger.LogInformation("Testing Arvento connection");

                // Basit bir test için GetVehicleStatus çağrısı yapıyoruz
                var vehicles = await _arventoService.GetVehicleStatusAsync("0");

                return Ok(new
                {
                    Success = true,
                    Message = "Arvento bağlantısı başarılı",
                    VehicleCount = vehicles.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Arvento connection test failed");
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "Arvento bağlantısı başarısız",
                    Error = ex.Message
                });
            }
        }
    }

    // Response Models
    public class VehicleStatusResponse
    {
        public bool Success { get; set; }
        public List<VehicleStatusDto> Data { get; set; } = new();
        public int TotalCount { get; set; }
        public string? Message { get; set; }
    }

    public class VehicleWorkingReportResponse
    {
        public bool Success { get; set; }
        public List<VehicleWorkingReportDto> Data { get; set; } = new();
        public int TotalCount { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string? Message { get; set; }
    }
}