using API.Data;
using API.Data.Entities;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace API.Services
{
    /// <summary>
    /// Vehicle log operations service implementation
    /// </summary>
    public class VehicleLogService : IVehicleLogService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<VehicleLogService> _logger;

        public VehicleLogService(ApplicationDbContext context, ILogger<VehicleLogService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <inheritdoc />
        public async Task LogOperationAsync(
            int vehicleId, 
            string operationType, 
            string description, 
            object? oldValues = null, 
            object? newValues = null, 
            string userName = "System", 
            string ipAddress = "Unknown")
        {
            try
            {
                var log = new VehicleLog
                {
                    VehicleId = vehicleId,
                    OperationType = operationType,
                    Description = description,
                    OldValues = oldValues != null ? JsonSerializer.Serialize(oldValues, new JsonSerializerOptions { WriteIndented = true }) : null,
                    NewValues = newValues != null ? JsonSerializer.Serialize(newValues, new JsonSerializerOptions { WriteIndented = true }) : null,
                    UserName = userName,
                    IpAddress = ipAddress,
                    OperationDate = DateTime.Now
                };

                _context.VehicleLogs.Add(log);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Vehicle log entry created. VehicleId: {VehicleId}, Operation: {OperationType}, User: {UserName}", 
                    vehicleId, operationType, userName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating vehicle log entry. VehicleId: {VehicleId}, Operation: {OperationType}", 
                    vehicleId, operationType);
                throw;
            }
        }

        /// <inheritdoc />
        public async Task<List<VehicleLog>> GetVehicleLogsAsync(int vehicleId)
        {
            try
            {
                return await _context.VehicleLogs
                    .Where(l => l.VehicleId == vehicleId)
                    .OrderByDescending(l => l.OperationDate)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving vehicle logs. VehicleId: {VehicleId}", vehicleId);
                throw;
            }
        }

        /// <inheritdoc />
        public async Task<(List<VehicleLog> logs, int totalCount)> GetAllLogsAsync(int pageNumber = 1, int pageSize = 50)
        {
            try
            {
                var query = _context.VehicleLogs
                    .Include(l => l.Vehicle)
                    .OrderByDescending(l => l.OperationDate);

                var totalCount = await query.CountAsync();

                var logs = await query
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                return (logs, totalCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all vehicle logs. Page: {PageNumber}, Size: {PageSize}", 
                    pageNumber, pageSize);
                throw;
            }
        }

        /// <inheritdoc />
        public async Task<List<VehicleLog>> GetLogsByDateRangeAsync(DateTime startDate, DateTime endDate, int? vehicleId = null)
        {
            try
            {
                var query = _context.VehicleLogs
                    .Include(l => l.Vehicle)
                    .Where(l => l.OperationDate >= startDate && l.OperationDate <= endDate);

                if (vehicleId.HasValue)
                {
                    query = query.Where(l => l.VehicleId == vehicleId.Value);
                }

                return await query
                    .OrderByDescending(l => l.OperationDate)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving vehicle logs by date range. Start: {StartDate}, End: {EndDate}, VehicleId: {VehicleId}", 
                    startDate, endDate, vehicleId);
                throw;
            }
        }
    }
}