import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, Clock, Plus, Target, PiggyBank, CreditCard } from 'lucide-react';
import CalendarView from './components/CalendarView';
import DailyView from './components/DailyView';
import MonthlySetupModal from './components/MonthlySetupModal';
import { formatCurrency, formatDate, getCurrentMonth, getDaysInMonth } from './utils/dateUtils';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { AppData, DailyData } from './types';

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [showMonthlySetup, setShowMonthlySetup] = useState(false);
  
  const [appData, setAppData] = useLocalStorage<AppData>('financeAppData', {
    monthlyCredit: 0,
    dailyTarget: 0,
    totalSavings: 0,
    currentMonth: getCurrentMonth(),
    dailyData: {}
  });

  // Check if we need to show monthly setup
  useEffect(() => {
    const currentMonth = getCurrentMonth();
    if (appData.currentMonth !== currentMonth) {
      setShowMonthlySetup(true);
    }
  }, [appData.currentMonth]);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const updateMonthlySetup = (monthlyCredit: number, dailyTarget: number) => {
    const currentMonth = getCurrentMonth();
    setAppData({
      ...appData,
      monthlyCredit,
      dailyTarget,
      currentMonth,
      dailyData: {} // Reset daily data for new month
    });
    setShowMonthlySetup(false);
  };

  const updateDailyData = (date: string, data: Partial<DailyData>) => {
    const updatedData = {
      ...appData,
      dailyData: {
        ...appData.dailyData,
        [date]: {
          ...appData.dailyData[date],
          ...data
        }
      }
    };
    setAppData(updatedData);
  };

  const calculateRemainingCredit = () => {
    let totalSpent = 0;
    let totalSavingsTransferred = 0;
    let totalBorrowed = 0;

    Object.values(appData.dailyData).forEach((day) => {
      if (day.spending) {
        totalSpent += day.spending.reduce((sum, entry) => sum + entry.amount, 0);
      }
      if (day.savingsTransferred) {
        totalSavingsTransferred += day.savingsTransferred;
      }
      if (day.borrowed) {
        totalBorrowed += day.borrowed;
      }
    });

    return appData.monthlyCredit - totalSpent - totalSavingsTransferred + totalBorrowed;
  };

  const getCurrentDateTime = () => {
    return currentDate.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const remainingCredit = calculateRemainingCredit();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">FinanceFlow</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{getCurrentDateTime()}</span>
              </div>
              
              <button
                onClick={() => setShowMonthlySetup(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Target className="w-4 h-4" />
                <span>Setup Month</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Monthly Credit</p>
                  <p className="text-2xl font-bold">{formatCurrency(appData.monthlyCredit)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-200" />
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Remaining</p>
                  <p className={`text-2xl font-bold ${remainingCredit < 0 ? 'text-red-200' : ''}`}>
                    {formatCurrency(remainingCredit)}
                  </p>
                </div>
                <CreditCard className="w-8 h-8 text-blue-200" />
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Daily Target</p>
                  <p className="text-2xl font-bold">{formatCurrency(appData.dailyTarget)}</p>
                </div>
                <Target className="w-8 h-8 text-blue-200" />
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Savings</p>
                  <p className="text-2xl font-bold">{formatCurrency(appData.totalSavings)}</p>
                </div>
                <PiggyBank className="w-8 h-8 text-blue-200" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Calendar Section */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Calendar</h2>
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{showCalendar ? 'Hide' : 'Show'} Calendar</span>
                </button>
              </div>
              
              {showCalendar && (
                <CalendarView
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  dailyData={appData.dailyData}
                />
              )}
              
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Selected Date:</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(selectedDate)}
                </p>
              </div>
            </div>
          </div>

          {/* Daily View Section */}
          <div className="lg:w-2/3">
            <DailyView
              selectedDate={selectedDate}
              dailyData={appData.dailyData[formatDate(selectedDate)] || {}}
              previousDayData={appData.dailyData[formatDate(new Date(selectedDate.getTime() - 24 * 60 * 60 * 1000))]}
              dailyTarget={appData.dailyTarget}
              onUpdateDailyData={(data) => updateDailyData(formatDate(selectedDate), data)}
              onUpdateSavings={(amount) => setAppData({...appData, totalSavings: appData.totalSavings + amount})}
            />
          </div>
        </div>
      </div>

      {/* Monthly Setup Modal */}
      {showMonthlySetup && (
        <MonthlySetupModal
          onSave={updateMonthlySetup}
          onClose={() => setShowMonthlySetup(false)}
          currentCredit={appData.monthlyCredit}
          currentTarget={appData.dailyTarget}
        />
      )}
    </div>
  );
}

export default App;