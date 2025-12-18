// CalendarGrid.js - TÜM SPLIT HATALARI DÜZELTİLDİ
// ✅ FIX: Değişken isim çakışması çözüldü, tüm split'ler güvenli hale getirildi

import React, { useState, useEffect } from 'react';
import GroupedIssueCard from './GroupedIssueCard';
import apiService from '../../services/api';

const CalendarGrid = ({ days, formatDate, onCardClick, onDateClick }) => {
  console.log('🎨 CalendarGrid rendered with days:', days);

  const [overdueMap, setOverdueMap] = useState(new Map());
  const [loading, setLoading] = useState(false);

  // ✅ Helper function: Tarih string'ini güvenli şekilde al
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

  // Gecikme kontrolü - her grup için
  useEffect(() => {
    const checkOverdue = async () => {
      if (!days || days.length === 0) {
        console.log('⚠️ No days to check');
        return;
      }

      setLoading(true);
      const newMap = new Map();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      try {
        // ✅ "dayItem" kullan - "day" ile karışmasın
        for (const dayItem of days) {
          // ✅ Güvenli kontrol
          if (!dayItem || !dayItem.date) {
            console.warn('⚠️ Invalid day item:', dayItem);
            continue;
          }

          const dayDate = new Date(dayItem.date);
          dayDate.setHours(0, 0, 0, 0);

          // Sadece bugün ve geçmiş günler için kontrol et
          if (dayDate <= today) {
            for (const group of dayItem.groupedProductions || []) {
              try {
                // ✅ Güvenli tarih string
                const dateStr = getDateString(dayItem.date);
                if (!dateStr) {
                  console.warn('⚠️ Could not get date string for:', dayItem.date);
                  continue;
                }

                console.log('📅 Checking day:', {
                  date: dateStr,
                  projectId: group.projectId,
                  projectName: group.projectName,
                  productionType: group.productionType
                });

                const response = await apiService.getIssuesByDateAndType({
                  date: dateStr,
                  projectId: group.projectId,
                  productionType: group.productionType
                });

                // Bu grupta gecikmiş iş var mı?
                const hasOverdueIssue = response.issues?.some(issue => {
                  // ✅ Revize tarih varsa onu kullan
                  const effectiveEndDate = issue.revisedPlannedEndDate || issue.plannedEndDate;
                  if (!effectiveEndDate) return false;

                  const plannedEnd = new Date(effectiveEndDate);
                  plannedEnd.setHours(0, 0, 0, 0);

                  console.log('🔍 Checking issue:', {
                    issueId: issue.issueId,
                    subject: issue.subject?.substring(0, 40),
                    isClosed: issue.isClosed,
                    effectiveEndDate: getDateString(effectiveEndDate),
                    dayDate: getDateString(dayDate)
                  });

                  // İş kapalıysa, kapanma tarihini kontrol et
                  if (issue.isClosed && issue.closedOn) {
                    // ✅ Manuel tarih parse - timezone bypass
                    const closedDateStr = getDateString(issue.closedOn);
                    if (!closedDateStr) return false;

                    const [year, month, dayOfMonth] = closedDateStr.split('-').map(Number);
                    const closedDate = new Date(year, month - 1, dayOfMonth);
                    closedDate.setHours(0, 0, 0, 0);

                    const isOverdue = closedDate > plannedEnd;

                    console.log('   ✅ Closed issue:', {
                      closedDate: getDateString(closedDate),
                      plannedEnd: getDateString(plannedEnd),
                      isOverdue: isOverdue,
                      calculation: `${getDateString(closedDate)} > ${getDateString(plannedEnd)} = ${isOverdue}`
                    });

                    return isOverdue;
                  }

                  // İş açıksa, bugünü kontrol et
                  const isOpenOverdue = dayDate > plannedEnd;
                  console.log('   📌 Open issue:', {
                    dayDate: getDateString(dayDate),
                    plannedEnd: getDateString(plannedEnd),
                    isOverdue: isOpenOverdue
                  });

                  return isOpenOverdue;
                });

                if (hasOverdueIssue) {
                  const key = `${dayItem.date}_${group.projectId}_${group.productionType}`;
                  console.log('❗ OVERDUE FOUND:', {
                    day: dateStr,
                    dayName: dayItem.dayName,
                    projectId: group.projectId,
                    productionType: group.productionType,
                    key: key
                  });
                  newMap.set(key, true);
                } else {
                  console.log('✅ No overdue:', {
                    day: dateStr,
                    projectId: group.projectId,
                    productionType: group.productionType
                  });
                }
              } catch (error) {
                console.error('Error checking overdue for group:', error);
              }
            }
          }
        }

        console.log('📊 Final overdueMap:', Array.from(newMap.keys()));
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
        // ✅ Güvenli kontrol
        if (!dayItem || !dayItem.date) {
          console.warn('⚠️ Skipping invalid day at index:', index);
          return null;
        }

        return (
          <div
            key={index}
            className={`calendar-day-card ${isToday(dayItem.date) ? 'today' : ''}`}
          >
            <div
              className="day-header clickable-date-header"
              onClick={(e) => handleDateHeaderClick(dayItem.date, e)}
              role="button"
              tabIndex={0}
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
                  // ✅ Güvenli key oluşturma
                  const key = `${dayItem.date}_${group.projectId}_${group.productionType}`;
                  const hasOverdue = overdueMap.has(key);

                  // console.log('🎨 Rendering card:', {
                  //   key,
                  //   hasOverdue,
                  //   group: group.productionType,
                  //   date: getDateString(dayItem.date)
                  // });

                  return (
                    <GroupedIssueCard
                      key={`card-${groupIndex}`}
                      group={group}
                      hasOverdue={hasOverdue}
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