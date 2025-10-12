// src/frontend/src/components/WeeklyCalendar/CalendarGrid.js
import React, { useState, useEffect } from 'react';
import GroupedIssueCard from './GroupedIssueCard';
import OverdueIssueCard from './OverdueIssueCard';
import apiService from '../../services/api';

const CalendarGrid = ({ days, formatDate, onCardClick, onDateClick }) => {
  console.log('🎨 CalendarGrid rendered');

  // Geciken işleri saklamak için state
  const [overdueIssuesMap, setOverdueIssuesMap] = useState(new Map());
  const [loading, setLoading] = useState(false);

  // Her gün ve grup için geciken işleri kontrol et
  useEffect(() => {
    const checkOverdueIssues = async () => {
      if (!days || days.length === 0) return;
      
      setLoading(true);
      const newOverdueMap = new Map();

      try {
        for (const day of days) {
          const dayDate = new Date(day.date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          dayDate.setHours(0, 0, 0, 0);
          
          // Sadece bugün veya geçmiş tarihler için kontrol yap
          if (dayDate <= today) {
            for (const group of day.groupedProductions || []) {
              try {
                // Bu grup için işleri çek
                const response = await apiService.getIssuesByDateAndType({
                  date: day.date.split('T')[0],
                  projectId: group.projectId,
                  productionType: group.productionType
                });

                // Geciken işleri say
                let overdueCount = 0;
                let hasOverdueExtension = false;

                response.issues?.forEach(issue => {
                  if (issue.plannedEndDate) {
                    const plannedEnd = new Date(issue.plannedEndDate);
                    plannedEnd.setHours(0, 0, 0, 0);
                    
                    // Örnek 1: İş açık veya çalışıyor ve planlanan bitiş geçmiş
                    if (!issue.isClosed && dayDate > plannedEnd) {
                      overdueCount++;
                      hasOverdueExtension = true;
                    }
                    
                    // Örnek 2: İş kapanmış ama planlanan bitiş tarihinden sonra kapanmış
                    if (issue.isClosed && issue.closedOn) {
                      const closedDate = new Date(issue.closedOn);
                      closedDate.setHours(0, 0, 0, 0);
                      
                      // Planlanan bitiş ile kapanma tarihi arasındaki günlerde göster
                      if (closedDate > plannedEnd && dayDate > plannedEnd && dayDate <= closedDate) {
                        overdueCount++;
                        hasOverdueExtension = true;
                      }
                    }
                  }
                });

                if (hasOverdueExtension) {
                  const key = `${day.date}_${group.projectId}_${group.productionType}`;
                  newOverdueMap.set(key, {
                    group,
                    overdueCount,
                    date: day.date
                  });
                }
              } catch (error) {
                console.error('Error checking overdue issues:', error);
              }
            }
          }
        }

        setOverdueIssuesMap(newOverdueMap);
      } catch (error) {
        console.error('Error in checkOverdueIssues:', error);
      } finally {
        setLoading(false);
      }
    };

    checkOverdueIssues();
  }, [days]);

  const isToday = (dateInput) => {
    try {
      const today = new Date();
      const checkDate = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

      return today.getFullYear() === checkDate.getFullYear() &&
        today.getMonth() === checkDate.getMonth() &&
        today.getDate() === checkDate.getDate();
    } catch (error) {
      console.error('Error checking isToday:', error);
      return false;
    }
  };

  const handleDateHeaderClick = (date, event) => {
    event.stopPropagation();
    console.log('🖱️ Date header clicked in CalendarGrid:', date);
    
    if (onDateClick) {
      onDateClick(date);
    }
  };

  return (
    <div className="calendar-grid">
      {days?.map((day, index) => {
        // Geciken işleri bu gün için topla
        const overdueGroupsForDay = [];
        const normalGroupIds = new Set();
        
        // Normal işlerin ID'lerini topla
        day.groupedProductions?.forEach(group => {
          normalGroupIds.add(`${group.projectId}_${group.productionType}`);
        });
        
        // Geciken işleri kontrol et
        day.groupedProductions?.forEach(group => {
          const key = `${day.date}_${group.projectId}_${group.productionType}`;
          if (overdueIssuesMap.has(key)) {
            overdueGroupsForDay.push({
              ...group,
              overdueData: overdueIssuesMap.get(key)
            });
          }
        });

        return (
          <div
            key={index}
            className={`calendar-day-card ${isToday(day.date) ? 'today' : ''}`}
          >
            {/* Day Header - Tıklanabilir */}
            <div 
              className="day-header clickable-date-header"
              onClick={(e) => handleDateHeaderClick(day.date, e)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleDateHeaderClick(day.date, e);
                }
              }}
            >
              <div className="day-name">{day.dayName}</div>
              <div className="day-date">{formatDate(day.date)}</div>
              
              {/* Toplam iş sayısı badge */}
              {(day.groupedProductions?.length > 0) && (
                <span className="badge bg-light text-dark position-absolute top-0 end-0 m-2">
                  {day.groupedProductions?.length || 0}
                </span>
              )}
              
              {/* Gecikme uyarısı badge */}
              {overdueGroupsForDay.length > 0 && (
                <span className="badge bg-danger position-absolute top-0 start-0 m-2">
                  <i className="bi bi-exclamation-triangle-fill me-1"></i>
                  {overdueGroupsForDay.length}
                </span>
              )}
              
              <div className="date-click-hint">
                <i className="bi bi-box-arrow-up-right"></i>
              </div>
            </div>

            {/* Day Issues */}
            <div className="day-issues">
              {loading && (
                <div className="text-center py-2">
                  <div className="spinner-border spinner-border-sm text-danger" role="status">
                    <span className="visually-hidden">Yükleniyor...</span>
                  </div>
                </div>
              )}

              {/* Normal işler */}
              {day.groupedProductions && day.groupedProductions.length > 0 ? (
                day.groupedProductions.map((group, groupIndex) => {
                  // Bu grup için gecikme var mı?
                  const key = `${day.date}_${group.projectId}_${group.productionType}`;
                  const hasOverdue = overdueIssuesMap.has(key);

                  // Eğer gecikme varsa, sadece OverdueCard göster
                  if (hasOverdue) {
                    const overdueData = overdueIssuesMap.get(key);
                    return (
                      <OverdueIssueCard
                        key={`overdue-${groupIndex}`}
                        group={group}
                        overdueCount={overdueData?.overdueCount}
                        onClick={() => {
                          console.log('🚨 Overdue card clicked:', group);
                          if (onCardClick) {
                            onCardClick(group, day.date);
                          }
                        }}
                      />
                    );
                  }

                  // Gecikme yoksa normal kart göster
                  return (
                    <GroupedIssueCard
                      key={`normal-${groupIndex}`}
                      group={group}
                      onClick={() => {
                        console.log('📌 Normal card clicked:', group);
                        if (onCardClick) {
                          onCardClick(group, day.date);
                        }
                      }}
                    />
                  );
                })
              ) : null}

              {/* Hiç iş yoksa */}
              {(!day.groupedProductions || day.groupedProductions.length === 0) && !loading && (
                <div className="text-center py-4">
                  <i className="bi bi-inbox text-muted" style={{ fontSize: '2rem' }}></i>
                  <p className="text-muted mb-0 mt-2" style={{ fontSize: '0.85rem' }}>
                    İş bulunmuyor
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CalendarGrid;