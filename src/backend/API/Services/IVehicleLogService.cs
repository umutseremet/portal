using API.Data.Entities;

namespace API.Services
{
    /// <summary>
    /// Vehicle log operations service interface
    /// </summary>
    public interface IVehicleLogService
    {
        /// <summary>
        /// Logs a vehicle operation
        /// </summary>
        /// <param name="vehicleId">Vehicle ID</param>
        /// <param name="operationType">Operation type (e.g., "User Update")</param>
        /// <param name="description">Operation description</param>
        /// <param name="oldValues">Old values (will be serialized as JSON)</param>
        /// <param name="newValues">New values (will be serialized as JSON)</param>
        /// <param name="userName">User performing the operation</param>
        /// <param name="ipAddress">Client IP address</param>
        Task LogOperationAsync(
            int vehicleId, 
            string operationType, 
            string description, 
            object? oldValues = null, 
            object? newValues = null, 
            string userName = "System", 
            string ipAddress = "Unknown");

        /// <summary>
        /// Gets logs for a specific vehicle
        /// </summary>
        /// <param name="vehicleId">Vehicle ID</param>
        /// <returns>Vehicle logs list (ordered by date descending)</returns>
        Task<List<VehicleLog>> GetVehicleLogsAsync(int vehicleId);

        /// <summary>
        /// Gets all vehicle logs with pagination
        /// </summary>
        /// <param name="pageNumber">Page number</param>
        /// <param name="pageSize">Page size</param>
        /// <returns>Paginated log list</returns>
        Task<(List<VehicleLog> logs, int totalCount)> GetAllLogsAsync(int pageNumber = 1, int pageSize = 50);

        /// <summary>
        /// Gets logs within a date range
        /// </summary>
        /// <param name="startDate">Start date</param>
        /// <param name="endDate">End date</param>
        /// <param name="vehicleId">Vehicle ID (optional)</param>
        /// <returns>Filtered log list</returns>
        Task<List<VehicleLog>> GetLogsByDateRangeAsync(DateTime startDate, DateTime endDate, int? vehicleId = null);
    }
}