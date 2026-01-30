// src/frontend/src/components/WeeklyCalendar/CalendarGrid.js
// ✅ COMPLETE VERSION - Gecikme ve Revize Kontrolü ile

import React, { useState, useEffect } from 'react';
import GroupedIssueCard from './GroupedIssueCard';
import apiService from '../../services/api';

const CalendarGrid = ({ days, formatDate, onCardClick, onDateClick }) => {
  console.log('🎨 CalendarGrid rendered with days:', days);

  const [overdueMap, setOverdueMap] = useState(new Map());
  const [revisedMap, setRevisedMap] = useState(new Map()); // ✅ YENİ
  const [loading, setLoading] = useState(false);

  // Helper function: Tarih string'ini güvenli şekilde al
  const getDateString = (dateValue) => {
    if (!dateValue) return null;
    if (typeof dateValue === 'string') {
      return dateValue.includes('T') ? dateValue.split('T')[0] : dateValue;
    }
    if (dateValue instanceof Date) {
      return dateValue.toISOString().split('T')[0];
    }
    return null;
  };

  // ✅ Gecikme ve Revize kontrolü - her grup için
  useEffect(() => {
    const checkOverdueAndRevised = async () => {
      if (!days || days.length === 0) {
        console.log('⚠️ No days to check');
        return;
      }

      setLoading(true);
      const newOverdueMap = new Map();
      const newRevisedMap = new Map(); // ✅ YENİ

      try {
        for (const dayItem of days) {
          if (!dayItem || !dayItem.date) {
            console.warn('⚠️ Invalid day item:', dayItem);
            continue;
          }

          const dateStr = getDateString(dayItem.date);
          if (!dateStr) continue;

          const dayDate = new Date(dateStr + 'T00:00:00');
          dayDate.setHours(0, 0, 0, 0);

          for (const group of dayItem.groupedProductions || []) {
            if (!group || !group.projectId || !group.productionType) continue;

            const key = `${dayItem.date}_${group.projectId}_${group.productionType}`;

            try {
              console.log('📅 Checking:', {
                date: dateStr,
                project: group.projectCode,
                type: group.productionType
              });

              const response = await apiService.getIssuesByDateAndType({
                date: dateStr,
                projectId: group.projectId,
                productionType: group.productionType
              });

              if (response && response.issues) {
                // ✅ GECIKME KONTROLÜ
                const hasOverdueIssue = response.issues?.some(issue => {
                  const effectiveEndDate = issue.revisedPlannedEndDate || issue.plannedEndDate;
                  if (!effectiveEndDate) return false;

                  const plannedEnd = new Date(effectiveEndDate);
                  plannedEnd.setHours(0, 0, 0, 0);

                  if (issue.isClosed && issue.closedOn) {
                    const closedDateStr = getDateString(issue.closedOn);
                    if (!closedDateStr) return false;

                    const [year, month, dayOfMonth] = closedDateStr.split('-').map(Number);
                    const closedDate = new Date(year, month - 1, dayOfMonth);
                    closedDate.setHours(0, 0, 0, 0);

                    return closedDate > plannedEnd;
                  }

                  return dayDate > plannedEnd;
                });

                // ✅ YENİ: REVİZE KONTROLÜ
                const hasRevisedIssue = response.issues?.some(issue => {
                  const hasRevisedStart = issue.revisedPlannedStartDate && 
                                         !issue.revisedPlannedStartDate.startsWith('0001-01-01');
                  const hasRevisedEnd = issue.revisedPlannedEndDate && 
                                       !issue.revisedPlannedEndDate.startsWith('0001-01-01');
                  
                  return hasRevisedStart || hasRevisedEnd;
                });

                if (hasOverdueIssue) {
                  console.log('❗ OVERDUE:', key);
                  newOverdueMap.set(key, true);
                }

                if (hasRevisedIssue) {
                  console.log('📝 REVISED:', key);
                  newRevisedMap.set(key, true);
                }
              }
            } catch (error) {
              console.error('Error checking group:', error);
            }
          }
        }

        // console.log('📊 Final overdueMap:', Array.from(newOverdueMap.keys()));
        // console.log('📊 Final revisedMap:', Array.from(newRevisedMap.keys()));

        setOverdueMap(newOverdueMap);
        setRevisedMap(newRevisedMap);
      } catch (error) {
        console.error('Error in checkOverdueAndRevised:', error);
      } finally {
        setLoading(false);
      }
    };

    checkOverdueAndRevised();
  }, [days]);

  const isToday = (dateInput) => {
    try {
      const today = new Date();
      const checkDate = typeof dateInput === 'string' ?
        new Date(dateInput) : dateInput;

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
      {days?.map((dayItem, index) => {
        if (!dayItem || !dayItem.date) {
          console.warn('⚠️ Skipping invalid day at index:', index);
          return null;
        }

        return (
          <div
            key={index}
            className={`calendar-day-card ${isToday(dayItem.date) ? 'today' : ''}`}
          >
            {/* Day Header - Tıklanabilir */}
            <div
              className="day-header clickable-date-header"
              onClick={(e) => handleDateHeaderClick(dayItem.date, e)}
              role="button"
              tabIndex={0}
              style={{ cursor: 'pointer' }}
              title="Bu günün tüm işlerini görmek için tıklayın"
            >
              <div className="day-name">{dayItem.dayName}</div>
              <div className="day-date">{formatDate(dayItem.date)}</div>

              {(dayItem.groupedProductions?.length > 0) && (
                <span className="badge bg-light text-dark position-absolute top-0 end-0 m-2">
                  {dayItem.groupedProductions?.length || 0}
                </span>
              )}

              <div className="date-click-hint">
                <i className="bi bi-box-arrow-up-right"></i>
              </div>
            </div>

            {/* Issues Container */}
            <div className="day-issues">
              {loading && (
                <div className="text-center py-2">
                  <div className="spinner-border spinner-border-sm text-danger" role="status">
                    <span className="visually-hidden">Kontrol ediliyor...</span>
                  </div>
                </div>
              )}

              {dayItem.groupedProductions && dayItem.groupedProductions.length > 0 ? (
                dayItem.groupedProductions.map((group, groupIndex) => {
                  const key = `${dayItem.date}_${group.projectId}_${group.productionType}`;
                  const hasOverdue = overdueMap.has(key);
                  const hasRevised = revisedMap.has(key); // ✅ YENİ

                  return (
                    <GroupedIssueCard
                      key={`card-${groupIndex}`}
                      group={group}
                      hasOverdue={hasOverdue}
                      hasRevised={hasRevised} // ✅ YENİ PROP
                      onClick={() => {
                        if (onCardClick) {
                          onCardClick(group, dayItem.date);
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