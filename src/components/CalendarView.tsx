import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getMonthName, getDaysInMonth, formatDate, isSameDay, createLocalDate } from '../utils/dateUtils';
import type { DailyData } from '../types';

interface CalendarViewProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  dailyData: { [date: string]: DailyData };
  onMonthChange?: (month: number, year: number) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ selectedDate, onDateSelect, dailyData, onMonthChange }) => {
  const [currentMonth, setCurrentMonth] = React.useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = React.useState(selectedDate.getFullYear());

  // Update calendar view when selectedDate changes
  React.useEffect(() => {
    setCurrentMonth(selectedDate.getMonth());
    setCurrentYear(selectedDate.getFullYear());
  }, [selectedDate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    let newMonth = currentMonth;
    let newYear = currentYear;
    
    if (direction === 'prev') {
      if (currentMonth === 0) {
        newMonth = 11;
        newYear = currentYear - 1;
      } else {
        newMonth = currentMonth - 1;
      }
    } else {
      if (currentMonth === 11) {
        newMonth = 0;
        newYear = currentYear + 1;
      } else {
        newMonth = currentMonth + 1;
      }
    }
    
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    
    // Notify parent component of month change
    if (onMonthChange) {
      onMonthChange(newMonth, newYear);
    }
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = createLocalDate(currentYear, currentMonth, 1).getDay();
  const today = new Date();

  const hasDataForDate = (date: Date): boolean => {
    const dateStr = formatDate(date);
    const data = dailyData[dateStr];
    return !!(data && (data.spending?.length || data.tasks?.length || data.notes));
  };

  const getDayIndicator = (date: Date): string => {
    const data = dailyData[formatDate(date)];
    if (!data) return '';
    
    const hasSpending = data.spending && data.spending.length > 0;
    const hasTasks = data.tasks && data.tasks.length > 0;
    const hasNotes = data.notes && data.notes.length > 0;
    
    if (hasSpending && hasTasks && hasNotes) return 'bg-purple-500';
    if (hasSpending && hasTasks) return 'bg-blue-500';
    if (hasSpending && hasNotes) return 'bg-green-500';
    if (hasTasks && hasNotes) return 'bg-yellow-500';
    if (hasSpending) return 'bg-red-500';
    if (hasTasks) return 'bg-blue-400';
    if (hasNotes) return 'bg-gray-500';
    
    return '';
  };

  const renderCalendarDays = () => {
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-10" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = createLocalDate(currentYear, currentMonth, day);
      const isSelected = isSameDay(date, selectedDate);
      const isToday = isSameDay(date, today);
      const hasData = hasDataForDate(date);
      const indicator = getDayIndicator(date);

      days.push(
        <button
          key={day}
          onClick={() => onDateSelect(date)}
          className={`
            relative h-10 w-full rounded-lg text-sm font-medium transition-all duration-200
            ${isSelected 
              ? 'bg-blue-600 text-white shadow-lg transform scale-105' 
              : isToday
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-2 border-blue-200 dark:border-blue-700'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }
            ${hasData ? 'font-bold' : ''}
          `}
        >
          {day}
          {indicator && (
            <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${indicator}`} />
          )}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="bg-white dark:bg-gray-800">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
          {getMonthName(currentMonth)} {currentYear}
        </h3>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="h-8 flex items-center justify-center">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{day}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {renderCalendarDays()}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Legend:</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">Spending</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">Tasks</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">Notes</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">All</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;