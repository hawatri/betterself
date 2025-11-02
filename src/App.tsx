import { useState, useEffect, useMemo } from 'react';
import { Calendar, CreditCard, Clock, Target, PiggyBank, Sun, Moon, Plus } from 'lucide-react';
import { Authenticated, Unauthenticated, AuthLoading, useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { SignInButton, UserButton, useAuth } from '@clerk/clerk-react';
import CalendarView from './components/CalendarView';
import DailyView from './components/DailyView';
import MonthlySetupModal from './components/MonthlySetupModal';
import AddSavingsModal from './components/AddSavingsModal';
import { formatCurrency, formatDate, getCurrentMonth } from './utils/dateUtils';
import { useTheme } from './hooks/useTheme';
import type { AppData, DailyData, SpendingEntry, Task } from './types';

// Define Convex data types
interface ConvexFinanceData {
  _id: string;
  userId: string;
  monthlyCredit: number;
  dailyTarget: number;
  totalSavings: number;
  currentMonth: string;
  _creationTime: number;
  createdAt?: number;
  updatedAt?: number;
}

// Helper function to convert Convex data to AppData
const convertConvexToAppData = (convexData: ConvexFinanceData | null | undefined, dailyDataObject: Record<string, unknown> | undefined): AppData => {
  if (!convexData) {
    return {
      monthlyCredit: 0,
      dailyTarget: 0,
      totalSavings: 0,
      currentMonth: getCurrentMonth(),
      dailyData: {}
    };
  }

  // Convert dailyData object to match TypeScript types
  const appDailyData: { [date: string]: DailyData } = {};
  if (dailyDataObject) {
    for (const [date, data] of Object.entries(dailyDataObject)) {
      const typedData = data as {
        spending?: { id: string; description: string; amount: number; timestamp: number; }[];
        tasks?: { id: string; description: string; completed: boolean; createdDate: string; }[];
        notes?: string;
        due?: number;
        savingsTransferred?: number;
        borrowed?: number;
        excessSpending?: number;
        excessSpendingReason?: string;
        createdAt?: number;
        updatedAt?: number;
      };
      
      appDailyData[date] = {
        spending: typedData.spending?.map((entry) => ({
          id: entry.id,
          description: entry.description,
          amount: entry.amount,
          timestamp: new Date(entry.timestamp), // Convert number back to Date
        })) || undefined,
        tasks: typedData.tasks?.map((task) => ({
          id: task.id,
          description: task.description,
          completed: task.completed,
          createdDate: task.createdDate,
        })) || undefined,
        notes: typedData.notes,
        due: typedData.due,
        savingsTransferred: typedData.savingsTransferred,
        borrowed: typedData.borrowed,
        excessSpending: typedData.excessSpending,
        excessSpendingReason: typedData.excessSpendingReason,
      };
    }
  }

  return {
    monthlyCredit: convexData.monthlyCredit,
    dailyTarget: convexData.dailyTarget,
    totalSavings: convexData.totalSavings,
    currentMonth: convexData.currentMonth,
    dailyData: appDailyData,
  };
};

// Helper function to convert AppData to Convex data
const convertAppDataToConvex = (appData: AppData): Omit<ConvexFinanceData, '_id' | 'userId' | '_creationTime' | 'createdAt' | 'updatedAt'> => {
  return {
    monthlyCredit: appData.monthlyCredit,
    dailyTarget: appData.dailyTarget,
    totalSavings: appData.totalSavings,
    currentMonth: appData.currentMonth,
  };
};

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [showCalendar, setShowCalendar] = useState(false);
  const [showMonthlySetup, setShowMonthlySetup] = useState(false);
  const [showAddSavingsModal, setShowAddSavingsModal] = useState(false);
  const [theme, setTheme] = useTheme();
  const [authTimeout, setAuthTimeout] = useState(false);
  const { isLoaded } = useAuth();
  
  // Load finance data from Convex only when authenticated
  const financeData = useQuery(api.functions.finance.getFinanceData);
  const allDailyData = useQuery(api.functions.finance.getAllDailyData);
  const monthlyDailyData = useQuery(api.functions.finance.getDailyDataForMonth, { 
    year: calendarYear, 
    month: calendarMonth 
  });
  
  // Mutations for saving data
  const saveFinanceData = useMutation(api.functions.finance.saveFinanceData);
  const saveDailyData = useMutation(api.functions.finance.saveDailyData);
  const updateMonthlySetupMutation = useMutation(api.functions.finance.updateMonthlySetup);
  
  // Initialize appData with either Convex data or default values
  const appData: AppData = useMemo(() => {
    console.log("Finance data:", financeData);
    console.log("All daily data:", allDailyData);
    console.log("Monthly daily data:", monthlyDailyData);
    
    // Merge all daily data sources
    const mergedDailyData = { ...allDailyData, ...monthlyDailyData };
    
    const result = convertConvexToAppData(financeData, mergedDailyData);
    console.log("Converted app data:", result);
    return result;
  }, [financeData, allDailyData, monthlyDailyData]);
  
  // Set a timeout for authentication loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoaded) {
        setAuthTimeout(true);
      }
    }, 10000); // 10 seconds timeout
    
    return () => clearTimeout(timer);
  }, [isLoaded]);
  
  // Check if we need to show monthly setup
  useEffect(() => {
    // Only proceed if financeData is loaded and not an error
    if (financeData && !('error' in financeData)) {
      const currentMonth = getCurrentMonth();
      if (financeData.currentMonth !== currentMonth) {
        setShowMonthlySetup(true);
      }
    }
  }, [financeData]);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Update calendar month/year when selectedDate changes
  useEffect(() => {
    setCalendarMonth(selectedDate.getMonth());
    setCalendarYear(selectedDate.getFullYear());
  }, [selectedDate]);

  const updateMonthlySetup = async (monthlyCredit: number, dailyTarget: number) => {
    try {
      await updateMonthlySetupMutation({ monthlyCredit, dailyTarget });
      setShowMonthlySetup(false);
    } catch (error) {
      console.error("Failed to update monthly setup:", error);
    }
  };

  const updateDailyData = async (date: string, data: Partial<DailyData>) => {
    try {
      // Update the daily data in Convex
      // Create a clean object without createdAt and updatedAt fields
      const dailyDataToSave = {
        date, // Include the date in the data object as required by the schema
        spending: data.spending?.map((entry: SpendingEntry) => ({
          id: entry.id,
          description: entry.description,
          amount: entry.amount,
          timestamp: entry.timestamp.getTime(), // Convert Date to number
        })) || undefined,
        tasks: data.tasks?.map((task: Task) => ({
          id: task.id,
          description: task.description,
          completed: task.completed,
          createdDate: task.createdDate,
        })) || undefined,
        notes: data.notes,
        due: data.due,
        savingsTransferred: data.savingsTransferred,
        borrowed: data.borrowed,
        excessSpending: data.excessSpending,
        excessSpendingReason: data.excessSpendingReason,
      };
      
      console.log("Saving daily data for date:", date, "with data:", dailyDataToSave);
      const result = await saveDailyData({ date, data: dailyDataToSave });
      console.log("Save result:", result);
    } catch (error) {
      console.error("Failed to update daily data:", error);
    }
  };

  // New function to handle excess spending
  const recordExcessSpending = async (date: string, amount: number, reason: string) => {
    try {
      // For excess spending, we need to update the daily data
      // but we don't need to modify total savings
      // The deduction from remaining credit is handled by the fact that
      // excess spending is tracked separately and affects calculations
      
      const dailyDataToUpdate = appData.dailyData[date] || {};
      const currentExcessSpending = dailyDataToUpdate.excessSpending || 0;
      const newExcessSpending = currentExcessSpending + amount;
      
      await updateDailyData(date, {
        excessSpending: newExcessSpending,
        excessSpendingReason: reason
      });
    } catch (error) {
      console.error("Failed to record excess spending:", error);
    }
  };

  // New function to add extra savings that don't affect monthly credit
  const addExtraSavings = async (amount: number) => {
    try {
      const updatedAppData = {
        ...appData,
        totalSavings: appData.totalSavings + amount
      };
      
      const convexData = convertAppDataToConvex(updatedAppData);
      await saveFinanceData({ data: convexData });
    } catch (error) {
      console.error("Failed to add extra savings:", error);
    }
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

  const remainingCredit = useMemo(() => {
    let totalSpent = 0;
    let totalSavingsTransferred = 0;
    let totalBorrowed = 0;
    let totalExcessSpending = 0;

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
      if (day.excessSpending) {
        totalExcessSpending += day.excessSpending;
      }
    });

    return appData.monthlyCredit - totalSpent - totalSavingsTransferred + totalBorrowed - totalExcessSpending;
  }, [appData]);

  const availableSavings = useMemo(() => {
    // Available savings is just the current total savings
    // When you borrow money, totalSavings decreases, so availableSavings = totalSavings
    return appData.totalSavings;
  }, [appData]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Authenticated>
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-8 h-8 text-blue-600" />
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">FinanceFlow</h1>
                </div>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{getCurrentDateTime()}</span>
                </div>
                
                <div className="flex items-center space-x-4">
                  <UserButton 
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8"
                      }
                    }}
                  />
                  
                  <button
                    onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
                  </button>
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
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-700 dark:to-blue-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white/10 dark:bg-white/5 backdrop-blur rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Monthly Credit</p>
                    <p className="text-2xl font-bold">{formatCurrency(appData.monthlyCredit)}</p>
                  </div>
                  <CreditCard className="w-8 h-8 text-blue-200" />
                </div>
              </div>
              
              <div className="bg-white/10 dark:bg-white/5 backdrop-blur rounded-lg p-4">
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
              
              <div className="bg-white/10 dark:bg-white/5 backdrop-blur rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Daily Target</p>
                    <p className="text-2xl font-bold">{formatCurrency(appData.dailyTarget)}</p>
                  </div>
                  <Target className="w-8 h-8 text-blue-200" />
                </div>
              </div>
              
              <div className="bg-white/10 dark:bg-white/5 backdrop-blur rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Available Savings</p>
                    <p className="text-2xl font-bold">{formatCurrency(availableSavings)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <PiggyBank className="w-8 h-8 text-blue-200" />
                    <button
                      onClick={() => setShowAddSavingsModal(true)}
                      className="p-2 bg-blue-500 dark:bg-blue-600 rounded-full hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
                      title="Add extra savings"
                    >
                      <Plus className="w-5 h-5 text-white" />
                    </button>
                  </div>
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
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Calendar</h2>
                  <button
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
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
                    onMonthChange={(month, year) => {
                      setCalendarMonth(month);
                      setCalendarYear(year);
                    }}
                  />
                )}
                
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Selected Date:</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">
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
                remainingCredit={remainingCredit}
                availableSavings={availableSavings}
                onUpdateDailyData={(data) => updateDailyData(formatDate(selectedDate), data)}
                onUpdateSavings={async (amount: number, dailySavingsData?: Partial<DailyData>) => {
                  console.log("=== onUpdateSavings called ===");
                  console.log("Amount:", amount);
                  console.log("Current total savings:", appData.totalSavings);
                  
                  // Calculate the new total savings based on current appData
                  const newTotalSavings = appData.totalSavings + amount;
                  console.log("New total savings will be:", newTotalSavings);
                  console.log("Daily savings data:", dailySavingsData);
                  
                  // Update total savings in finance data
                  const updatedAppData = {
                    ...appData,
                    totalSavings: newTotalSavings
                  };
                  
                  console.log("Updated app data:", updatedAppData);
                  
                  // Save updated finance data
                  const convexData = convertAppDataToConvex(updatedAppData);
                  console.log("Convex data to save:", convexData);
                  
                  // Await the mutation before continuing
                  await saveFinanceData({ data: convexData });
                  console.log("Finance data saved");
                  
                  // If there's daily data to update, save it separately
                  if (dailySavingsData) {
                    console.log("Updating daily data with:", dailySavingsData);
                    await updateDailyData(formatDate(selectedDate), dailySavingsData);
                  }
                  
                  console.log("=== onUpdateSavings finished ===");
                }}
                onRecordExcessSpending={(amount: number, reason: string) => recordExcessSpending(formatDate(selectedDate), amount, reason)}
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
        
        {/* Add Savings Modal */}
        {showAddSavingsModal && (
          <AddSavingsModal
            onSave={addExtraSavings}
            onClose={() => setShowAddSavingsModal(false)}
          />
        )}
      </Authenticated>
      
      <Unauthenticated>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Welcome to FinanceFlow</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">Sign in to manage your finances</p>
            <SignInButton mode="modal">
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Sign In
              </button>
            </SignInButton>
          </div>
        </div>
      </Unauthenticated>
      
      <AuthLoading>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Loading authentication...</p>
            {authTimeout && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Authentication is taking longer than expected.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Refresh Page
                </button>
              </div>
            )}
            {!authTimeout && (
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                If this takes too long, try refreshing the page.
              </p>
            )}
          </div>
        </div>
      </AuthLoading>
    </div>
  );
}

export default App;