// src/frontend/src/components/WeeklyCalendar/CalendarGrid.js
// TEST AMAÇLI - Backend'den veri gelene kadar bu versiyonu kullanın

import React, { useState, useEffect } from 'react';
import GroupedIssueCard from './GroupedIssueCard';
import apiService from '../../services/api';

const CalendarGrid = ({ days, formatDate, onCardClick, onDateClick }) => {
  console.log('🎨 CalendarGrid rendered');
  
  const [overdueMap, setOverdueMap] = useState(new Map());
  const [loading, setLoading] = useState(false);

  // Gecikme kontrolü - her grup için
  useEffect(() => {
    const checkOverdue = async () => {
      if (!days || days.length === 0) return;
      
      setLoading(true);
      const newMap = new Map();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      try {
        for (const day of days) {
          const dayDate = new Date(day.date);
          dayDate.setHours(0, 0, 0, 0);
          
          // Sadece bugün ve geçmiş günler için kontrol et
          if (dayDate <= today) {
            for (const group of day.groupedProductions || []) {
              try {
                const response = await apiService.getIssuesByDateAndType({
                  date: day.date.split('T')[0],
                  projectId: group.projectId,
                  productionType: group.productionType
                });

                // Bu grupta gecikmiş iş var mı?
                const hasOverdueIssue = response.issues?.some(issue => {
                  if (!issue.plannedEndDate) return false;
                  
                  const plannedEnd = new Date(issue.plannedEndDate);
                  plannedEnd.setHours(0, 0, 0, 0);
                  
                  // İş kapalıysa, kapanma tarihini kontrol et
                  if (issue.isClosed && issue.closedOn) {
                    const closedDate = new Date(issue.closedOn);
                    closedDate.setHours(0, 0, 0, 0);
                    return closedDate > plannedEnd;
                  }
                  
                  // İş açıksa, bugünü kontrol et
                  return dayDate > plannedEnd;
                });

                if (hasOverdueIssue) {
                  const key = `${day.date}_${group.projectId}_${group.productionType}`;
                  newMap.set(key, true);
                }
              } catch (error) {
                console.error('Error checking overdue for group:', error);
              }
            }
          }
        }
        
        setOverdueMap(newMap);
      } catch (error) {
        console.error('Error in checkOverdue:', error);
      } finally {
        setLoading(false);
      }
    };

    checkOverdue();
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
    
    if (onDateClick) {
      onDateClick(date);
    }
  };

  return (
    <div className="calendar-grid">
      {days?.map((day, index) => {
        return (
          <div
            key={index}
            className={`calendar-day-card ${isToday(day.date) ? 'today' : ''}`}
          >
            <div 
              className="day-header clickable-date-header"
              onClick={(e) => handleDateHeaderClick(day.date, e)}
              role="button"
              tabIndex={0}
            >
              <div className="day-name">{day.dayName}</div>
              <div className="day-date">{formatDate(day.date)}</div>
              
              {(day.groupedProductions?.length > 0) && (
                <span className="badge bg-light text-dark position-absolute top-0 end-0 m-2">
                  {day.groupedProductions?.length || 0}
                </span>
              )}
              
              <div className="date-click-hint">
                <i className="bi bi-box-arrow-up-right"></i>
              </div>
            </div>

            <div className="day-issues">
              {loading && (
                <div className="text-center py-2">
                  <div className="spinner-border spinner-border-sm text-danger" role="status">
                    <span className="visually-hidden">Kontrol ediliyor...</span>
                  </div>
                </div>
              )}

              {day.groupedProductions && day.groupedProductions.length > 0 ? (
                day.groupedProductions.map((group, groupIndex) => {
                  // Bu grup için gecikme var mı?
                  const key = `${day.date}_${group.projectId}_${group.productionType}`;
                  const hasOverdue = overdueMap.has(key);
                  
                  return (
                    <GroupedIssueCard
                      key={`card-${groupIndex}`}
                      group={group}
                      hasOverdue={hasOverdue}
                      onClick={() => {
                        if (onCardClick) {
                          onCardClick(group, day.date);
                        }
                      }}
                    />
                  );
                })
              ) : !loading ? (
                <div className="text-center py-4">
                  <i className="bi bi-inbox text-muted" style={{ fontSize: '2rem' }}></i>
                  <p className="text-muted mb-0 mt-2" style={{ fontSize: '0.85rem' }}>
                    İş bulunmuyor
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CalendarGrid;