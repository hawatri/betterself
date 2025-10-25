export interface SpendingEntry {
  id: string;
  description: string;
  amount: number;
  timestamp: Date;
}

export interface Task {
  id: string;
  description: string;
  completed: boolean;
  createdDate: string;
}

export interface DailyData {
  spending?: SpendingEntry[];
  tasks?: Task[];
  notes?: string;
  due?: number;
  savingsTransferred?: number;
  borrowed?: number;
}

export interface AppData {
  monthlyCredit: number;
  dailyTarget: number;
  totalSavings: number;
  currentMonth: string;
  dailyData: { [date: string]: DailyData };
}