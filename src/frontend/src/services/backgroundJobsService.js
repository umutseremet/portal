// src/frontend/src/services/backgroundJobsService.js

import api from './api';

const backgroundJobsService = {
  /**
   * Tüm job'ları listele
   */
  async getAllJobs() {
    const response = await api.get('/BackgroundJobs');
    return response;
  },

  /**
   * Belirli bir job'un detaylarını getir
   * @param {number} id - Job ID
   */
  async getJob(id) {
    const response = await api.get(`/BackgroundJobs/${id}`);
    return response;
  },

  /**
   * Yeni job oluştur
   * @param {Object} jobData - Job verileri
   */
  async createJob(jobData) {
    const response = await api.post('/BackgroundJobs', jobData);
    return response;
  },

  /**
   * Job'u güncelle
   * @param {number} id - Job ID
   * @param {Object} jobData - Güncellenecek veriler
   */
  async updateJob(id, jobData) {
    const response = await api.put(`/BackgroundJobs/${id}`, jobData);
    return response;
  },

  /**
   * Job'u sil
   * @param {number} id - Job ID
   */
  async deleteJob(id) {
    const response = await api.delete(`/BackgroundJobs/${id}`);
    return response;
  },

  /**
   * Job'u manuel olarak çalıştır
   * @param {number} id - Job ID
   */
  async runJob(id) {
    const response = await api.post(`/BackgroundJobs/${id}/run`);
    return response;
  },

  /**
   * Job'u aktif/pasif yap
   * @param {number} id - Job ID
   */
  async toggleJob(id) {
    const response = await api.post(`/BackgroundJobs/${id}/toggle`);
    return response;
  },

  /**
   * Cron expression önerileri
   */
  getCronExpressionSuggestions() {
    return [
      { expression: '0 */1 * * *', description: 'Her saat başı' },
      { expression: '0 */2 * * *', description: 'Her 2 saatte bir' },
      { expression: '0 */3 * * *', description: 'Her 3 saatte bir' },
      { expression: '0 */6 * * *', description: 'Her 6 saatte bir' },
      { expression: '0 */12 * * *', description: 'Her 12 saatte bir' },
      { expression: '0 0 * * *', description: 'Her gün gece yarısı' },
      { expression: '0 8 * * *', description: 'Her gün saat 08:00' },
      { expression: '0 12 * * *', description: 'Her gün öğlen 12:00' },
      { expression: '0 18 * * *', description: 'Her gün akşam 18:00' },
      { expression: '0 0 * * 1', description: 'Her Pazartesi gece yarısı' },
      { expression: '0 0 1 * *', description: 'Her ayın 1\'i' },
      { expression: '*/5 * * * *', description: 'Her 5 dakikada bir' },
      { expression: '*/15 * * * *', description: 'Her 15 dakikada bir' },
      { expression: '*/30 * * * *', description: 'Her 30 dakikada bir' }
    ];
  },

  /**
   * Belirli bir job'un çalışma geçmişini getir
   */
  async getJobExecutionLogs(jobId, page = 1, pageSize = 20) {
    try {
      const response = await api.get(`/BackgroundJobs/${jobId}/execution-logs`, {
        params: { page, pageSize }
      });
      return response;
    } catch (error) {
      console.error('Job execution logs alınırken hata:', error);
      throw error;
    }
  },

  /**
   * Belirli bir execution log'un detayını getir
   */
  async getExecutionLogDetail(logId) {
    try {
      const response = await api.get(`/BackgroundJobs/execution-logs/${logId}`);
      return response;
    } catch (error) {
      console.error('Execution log detayı alınırken hata:', error);
      throw error;
    }
  },

  /**
   * En son çalışan job'ları getir
   */
  async getRecentExecutions(count = 10) {
    try {
      const response = await api.get('/BackgroundJobs/recent-executions', {
        params: { count }
      });
      return response;
    } catch (error) {
      console.error('Son çalışmalar alınırken hata:', error);
      throw error;
    }
  }
};

export default backgroundJobsService;