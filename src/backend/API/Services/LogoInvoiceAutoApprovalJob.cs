using API.Data;
using API.Data.Entities;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace API.Services.BackgroundJobs
{
    /// <summary>
    /// Logo faturalarını otomatik olarak onaylayan Hangfire job
    /// Sadece Pending durumundaki faturaları kontrol eder ve Logo'da varsa onaylar
    /// </summary>
    public class LogoInvoiceAutoApprovalJob
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<LogoInvoiceAutoApprovalJob> _logger;
        private readonly IConfiguration _configuration;

        public LogoInvoiceAutoApprovalJob(
            IServiceProvider serviceProvider,
            ILogger<LogoInvoiceAutoApprovalJob> logger,
            IConfiguration configuration)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
            _configuration = configuration;
        }

        /// <summary>
        /// Job'un çalıştırılacağı ana metod
        /// </summary>
        public async Task ExecuteAsync()
        {
            var jobKey = "logo-invoice-auto-approval";
            var startTime = DateTime.Now;

            _logger.LogInformation("🚀 Logo Fatura Otomatik Onay Job başlatıldı: {Time}", startTime);

            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            BackgroundJobExecutionLog? executionLog = null;
            var detailedLogBuilder = new StringBuilder();

            try
            {
                // 1. Job kaydını al
                var jobRecord = await context.BackgroundJobs
                    .FirstOrDefaultAsync(j => j.JobKey == jobKey);

                if (jobRecord == null)
                {
                    _logger.LogWarning("⚠️ Job kaydı bulunamadı: {JobKey}", jobKey);
                    return;
                }

                // 2. Execution log kaydı oluştur
                executionLog = new BackgroundJobExecutionLog
                {
                    BackgroundJobId = jobRecord.Id,
                    JobKey = jobRecord.JobKey,
                    JobName = jobRecord.JobName,
                    StartTime = startTime,
                    Status = "Running",
                    IsManualExecution = false
                };

                context.BackgroundJobExecutionLogs.Add(executionLog);
                await context.SaveChangesAsync();

                detailedLogBuilder.AppendLine($"[{DateTime.Now:HH:mm:ss}] 🚀 Job başlatıldı");
                detailedLogBuilder.AppendLine($"[{DateTime.Now:HH:mm:ss}] Job: {jobRecord.JobName}");
                detailedLogBuilder.AppendLine($"[{DateTime.Now:HH:mm:ss}] Job Key: {jobRecord.JobKey}");
                detailedLogBuilder.AppendLine();

                _logger.LogInformation("📅 Job başlatıldı: {JobName}", jobRecord.JobName);

                // 3. Onay bekleyen faturaları al (Status = 'Pending')
                var pendingApprovals = await context.LogoInvoiceApprovals
                    .Where(a => a.Status == "Pending")
                    .ToListAsync();

                _logger.LogInformation("⏳ {Count} adet onay bekleyen fatura bulundu", pendingApprovals.Count);
                detailedLogBuilder.AppendLine($"[{DateTime.Now:HH:mm:ss}] ⏳ Onay bekleyen fatura sayısı: {pendingApprovals.Count}");

                if (pendingApprovals.Count == 0)
                {
                    _logger.LogInformation("ℹ️ Onay bekleyen fatura yok, job sonlandırılıyor.");
                    detailedLogBuilder.AppendLine($"[{DateTime.Now:HH:mm:ss}] ℹ️ Onay bekleyen fatura bulunamadı");

                    // Job kaydını güncelle
                    jobRecord.LastRunTime = startTime;
                    jobRecord.NextRunTime = CalculateNextRunTime(jobRecord.CronExpression);
                    jobRecord.LastRunStatus = "Success";
                    jobRecord.LastRunMessage = "✅ Onay bekleyen fatura bulunamadı";
                    jobRecord.TotalRunCount++;
                    jobRecord.SuccessCount++;
                    jobRecord.UpdatedAt = DateTime.Now;

                    // Execution log'u güncelle
                    executionLog.EndTime = DateTime.Now;
                    executionLog.DurationSeconds = (DateTime.Now - startTime).TotalSeconds;
                    executionLog.Status = "Success";
                    executionLog.Message = "Onay bekleyen fatura bulunamadı";
                    executionLog.ProcessedCount = 0;
                    executionLog.SuccessCount = 0;
                    executionLog.FailureCount = 0;
                    executionLog.SkippedCount = 0;
                    executionLog.DetailedLog = detailedLogBuilder.ToString();

                    await context.SaveChangesAsync();
                    return;
                }

                // 4. Logo veritabanı bağlantısı
                var logoConnectionString = _configuration.GetConnectionString("LogoWingsConnection");
                if (string.IsNullOrEmpty(logoConnectionString))
                {
                    throw new InvalidOperationException("Logo veritabanı bağlantısı yapılandırılmamış.");
                }

                detailedLogBuilder.AppendLine($"[{DateTime.Now:HH:mm:ss}] 🔌 Logo veritabanına bağlanılıyor...");
                detailedLogBuilder.AppendLine();

                int approvedCount = 0;
                int notFoundCount = 0;
                int errorCount = 0;

                // 5. Her bir Pending faturayı Logo'da kontrol et
                foreach (var pending in pendingApprovals)
                {
                    try
                    {
                        _logger.LogInformation("🔍 Fatura kontrol ediliyor: {InvoiceNumber} (LogicalRef: {LogicalRef})",
                            pending.InvoiceNumber, pending.LogoLogicalRef);

                        detailedLogBuilder.AppendLine($"[{DateTime.Now:HH:mm:ss}] 🔍 Kontrol: {pending.InvoiceNumber} (LogicalRef: {pending.LogoLogicalRef})");

                        bool existsInLogo = false;
                        int? logoLogicalRef = null;
                        string? logoFicheNo = null;
                        DateTime? logoDate = null;

                        // Logo'da faturanın varlığını kontrol et
                        using (var logoConnection = new SqlConnection(logoConnectionString))
                        {
                            await logoConnection.OpenAsync();

                            var query = @"
                                SELECT TOP 1 
                                    LOGICALREF,
                                    FICHENO,
                                    DATE_
                                FROM LG_225_01_INVOICE
                                WHERE FICHENO = @InvoiceNumber
                                AND GRPCODE = 1
                                AND TRCODE = 1
                                AND CANCELLED = 0";

                            using (var command = new SqlCommand(query, logoConnection))
                            {
                                command.Parameters.AddWithValue("@InvoiceNumber", pending.InvoiceNumber);

                                using (var reader = await command.ExecuteReaderAsync())
                                {
                                    if (await reader.ReadAsync())
                                    {
                                        existsInLogo = true;
                                        logoLogicalRef = reader.GetInt32(0);
                                        logoFicheNo = reader.GetString(1);
                                        logoDate = reader.GetDateTime(2);

                                        _logger.LogInformation(
                                            "✅ Fatura Logo'da bulundu: LOGICALREF={LogicalRef}, FICHENO={FicheNo}, DATE={Date}",
                                            logoLogicalRef, logoFicheNo, logoDate);

                                        detailedLogBuilder.AppendLine($"    ✅ Logo'da bulundu: LOGICALREF={logoLogicalRef}, FICHENO={logoFicheNo}");

                                        // LogicalRef bilgisini güncelle (eğer farklıysa)
                                        if (pending.InvoiceNumber != logoFicheNo)
                                        {
                                            _logger.LogInformation(
                                                "🔄 LogicalRef güncellendi: {OldRef} → {NewRef}",
                                                pending.LogoLogicalRef, logoLogicalRef);

                                            detailedLogBuilder.AppendLine($"    🔄 LogicalRef güncellendi: {pending.LogoLogicalRef} → {logoLogicalRef}");
                                            pending.LogoLogicalRef = logoLogicalRef.Value;
                                        }
                                    }
                                    else
                                    {
                                        _logger.LogWarning(
                                            "⚠️ Fatura Logo'da bulunamadı veya kriterleri karşılamıyor: {InvoiceNumber}",
                                            pending.InvoiceNumber);

                                        detailedLogBuilder.AppendLine($"    ⚠️ Logo'da bulunamadı veya kriterleri karşılamıyor");
                                    }
                                }
                            }
                        }

                        // Logo'da varsa onayla
                        if (existsInLogo)
                        {
                            pending.ApprovedDate = DateTime.Now;
                            pending.ApprovedBy = 1; // System user
                            pending.Status = "Approved";
                            pending.UpdatedAt = DateTime.Now;
                            pending.Notes = (pending.Notes ?? "") +
                                $"\n[Otomatik Onay - {DateTime.Now:yyyy-MM-dd HH:mm:ss}] Sistem tarafından otomatik olarak onaylandı. Logo'da GRPCODE=1, TRCODE=1, CANCELLED=0 kriterleri karşılandı.";

                            approvedCount++;
                            _logger.LogInformation("✅ Fatura onaylandı: {InvoiceNumber}", pending.InvoiceNumber);
                            detailedLogBuilder.AppendLine($"    ✅ ONAYLANDI");
                        }
                        else
                        {
                            // Logo'da yoksa veya kriterleri karşılamıyorsa not ekle
                            pending.Notes = (pending.Notes ?? "") +
                                $"\n[Kontrol - {DateTime.Now:yyyy-MM-dd HH:mm:ss}] Logo'da bulunamadı veya kriterleri karşılamıyor (GRPCODE=1, TRCODE=1, CANCELLED=0).";
                            pending.UpdatedAt = DateTime.Now;

                            notFoundCount++;
                            detailedLogBuilder.AppendLine($"    ⚠️ Onaylanmadı (Logo'da yok)");
                        }

                        detailedLogBuilder.AppendLine();
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "❌ Fatura kontrol edilirken hata: {InvoiceNumber}", pending.InvoiceNumber);
                        errorCount++;

                        detailedLogBuilder.AppendLine($"    ❌ HATA: {ex.Message}");
                        detailedLogBuilder.AppendLine();

                        // Hata notunu ekle
                        pending.Notes = (pending.Notes ?? "") +
                            $"\n[Hata - {DateTime.Now:yyyy-MM-dd HH:mm:ss}] Kontrol sırasında hata: {ex.Message}";
                        pending.UpdatedAt = DateTime.Now;
                    }
                }

                // 6. Tüm değişiklikleri kaydet
                await context.SaveChangesAsync();

                detailedLogBuilder.AppendLine($"[{DateTime.Now:HH:mm:ss}] 💾 Tüm değişiklikler kaydedildi");
                detailedLogBuilder.AppendLine();
                detailedLogBuilder.AppendLine("📊 ÖZET:");
                detailedLogBuilder.AppendLine($"   ✅ Onaylanan: {approvedCount}");
                detailedLogBuilder.AppendLine($"   ⚠️ Logo'da yok: {notFoundCount}");
                detailedLogBuilder.AppendLine($"   ❌ Hata: {errorCount}");

                // 7. Job kaydını güncelle
                var endTime = DateTime.Now;
                var duration = (endTime - startTime).TotalSeconds;

                jobRecord.LastRunTime = startTime;
                jobRecord.NextRunTime = CalculateNextRunTime(jobRecord.CronExpression);
                jobRecord.LastRunStatus = errorCount > 0 ? "PartialSuccess" : "Success";
                jobRecord.LastRunMessage = $"✅ {approvedCount} onaylandı, {notFoundCount} Logo'da yok, {errorCount} hata";
                jobRecord.TotalRunCount++;

                if (errorCount > 0)
                {
                    jobRecord.FailureCount++;
                }
                else
                {
                    jobRecord.SuccessCount++;
                }

                jobRecord.UpdatedAt = DateTime.Now;

                // 8. Execution log'u güncelle
                executionLog.EndTime = endTime;
                executionLog.DurationSeconds = duration;
                executionLog.Status = errorCount > 0 ? "PartialSuccess" : "Success";
                executionLog.Message = $"{approvedCount} onaylandı, {notFoundCount} Logo'da yok, {errorCount} hata";
                executionLog.ProcessedCount = pendingApprovals.Count;
                executionLog.SuccessCount = approvedCount;
                executionLog.FailureCount = errorCount;
                executionLog.SkippedCount = notFoundCount;
                executionLog.DetailedLog = detailedLogBuilder.ToString();

                await context.SaveChangesAsync();

                _logger.LogInformation(
                    "✅ Logo Fatura Otomatik Onay Job tamamlandı. Süre: {Duration}s, Onaylanan: {Approved}, Bulunamayan: {NotFound}, Hata: {Error}",
                    duration, approvedCount, notFoundCount, errorCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Logo Fatura Otomatik Onay Job kritik hatası");

                detailedLogBuilder.AppendLine();
                detailedLogBuilder.AppendLine($"[{DateTime.Now:HH:mm:ss}] ❌ KRİTİK HATA:");
                detailedLogBuilder.AppendLine($"Hata: {ex.Message}");
                detailedLogBuilder.AppendLine($"Stack Trace: {ex.StackTrace}");

                // Job kaydını güncelle
                var jobRecord = await context.BackgroundJobs
                    .FirstOrDefaultAsync(j => j.JobKey == jobKey);

                if (jobRecord != null)
                {
                    jobRecord.LastRunTime = startTime;
                    jobRecord.LastRunStatus = "Failed";
                    jobRecord.LastRunMessage = $"❌ Kritik Hata: {ex.Message}";
                    jobRecord.TotalRunCount++;
                    jobRecord.FailureCount++;
                    jobRecord.UpdatedAt = DateTime.Now;
                }

                // Execution log'u güncelle
                if (executionLog != null)
                {
                    executionLog.EndTime = DateTime.Now;
                    executionLog.DurationSeconds = (DateTime.Now - startTime).TotalSeconds;
                    executionLog.Status = "Failed";
                    executionLog.Message = "Kritik hata oluştu";
                    executionLog.ErrorMessage = ex.Message;
                    executionLog.StackTrace = ex.StackTrace;
                    executionLog.DetailedLog = detailedLogBuilder.ToString();
                }

                await context.SaveChangesAsync();

                throw;
            }
        }

        /// <summary>
        /// Cron expression'a göre bir sonraki çalıştırma zamanını hesapla
        /// </summary>
        private DateTime? CalculateNextRunTime(string? cronExpression)
        {
            if (string.IsNullOrEmpty(cronExpression))
                return null;

            try
            {
                if (cronExpression.Contains("*/2"))
                {
                    return DateTime.Now.AddHours(2);
                }
                else if (cronExpression.Contains("*/1"))
                {
                    return DateTime.Now.AddHours(1);
                }
                else if (cronExpression.Contains("*/3"))
                {
                    return DateTime.Now.AddHours(3);
                }
                else if (cronExpression.Contains("*/6"))
                {
                    return DateTime.Now.AddHours(6);
                }
                else if (cronExpression.Contains("*/12"))
                {
                    return DateTime.Now.AddHours(12);
                }

                return DateTime.Now.AddHours(2);
            }
            catch
            {
                return null;
            }
        }
    }
}