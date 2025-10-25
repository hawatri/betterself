import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, CheckSquare, Square, FileText, TrendingUp, TrendingDown, AlertCircle, PiggyBank } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/dateUtils';
import type { DailyData, SpendingEntry, Task } from '../types';
import SpendingModal from './SpendingModal';
import TaskModal from './TaskModal';
import TransferModal from './TransferModal';

interface DailyViewProps {
  selectedDate: Date;
  dailyData: DailyData;
  previousDayData?: DailyData;
  dailyTarget: number;
  onUpdateDailyData: (data: Partial<DailyData>) => void;
  onUpdateSavings: (amount: number) => void;
}

const DailyView: React.FC<DailyViewProps> = ({
  selectedDate,
  dailyData,
  previousDayData,
  dailyTarget,
  onUpdateDailyData,
  onUpdateSavings
}) => {
  const [showSpendingModal, setShowSpendingModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [notes, setNotes] = useState(dailyData.notes || '');

  // Auto-save notes after 1 second of no typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (notes !== (dailyData.notes || '')) {
        onUpdateDailyData({ notes });
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [notes, dailyData.notes, onUpdateDailyData]);

  // Auto-carry over tasks from previous day
  useEffect(() => {
    if (previousDayData && previousDayData.tasks && (!dailyData.tasks || dailyData.tasks.length === 0)) {
      const incompleteTasks = previousDayData.tasks
        .filter(task => !task.completed)
        .map(task => ({ ...task, id: `${task.id}-carried`, createdDate: formatDate(selectedDate) }));
      
      if (incompleteTasks.length > 0) {
        onUpdateDailyData({ tasks: incompleteTasks });
      }
    }
  }, [previousDayData, dailyData.tasks, selectedDate, onUpdateDailyData]);

  const totalSpent = dailyData.spending?.reduce((sum, entry) => sum + entry.amount, 0) || 0;
  const remainingTarget = dailyTarget - totalSpent;
  const isOverTarget = totalSpent > dailyTarget;
  const currentDue = (dailyData.due || 0) + (isOverTarget ? totalSpent - dailyTarget : 0);

  const addSpending = (description: string, amount: number) => {
    const newEntry: SpendingEntry = {
      id: Date.now().toString(),
      description,
      amount,
      timestamp: new Date()
    };

    const updatedSpending = [...(dailyData.spending || []), newEntry];
    onUpdateDailyData({ spending: updatedSpending });
  };

  const addTask = (description: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      description,
      completed: false,
      createdDate: formatDate(selectedDate)
    };

    const updatedTasks = [...(dailyData.tasks || []), newTask];
    onUpdateDailyData({ tasks: updatedTasks });
  };

  const toggleTask = (taskId: string) => {
    const updatedTasks = (dailyData.tasks || []).map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    onUpdateDailyData({ tasks: updatedTasks });
  };

  const deleteTask = (taskId: string) => {
    const updatedTasks = (dailyData.tasks || []).filter(task => task.id !== taskId);
    onUpdateDailyData({ tasks: updatedTasks });
  };

  const transferToSavings = (amount: number) => {
    const currentTransferred = dailyData.savingsTransferred || 0;
    onUpdateDailyData({ savingsTransferred: currentTransferred + amount });
    onUpdateSavings(amount);
  };

  const borrowMoney = (amount: number) => {
    const currentBorrowed = dailyData.borrowed || 0;
    onUpdateDailyData({ borrowed: currentBorrowed + amount });
  };

  return (
    <div className="space-y-6">
      {/* Daily Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Daily Spent</p>
              <p className={`text-2xl font-bold ${isOverTarget ? 'text-red-600' : 'text-gray-900 dark:text-gray-50'}`}>
                {formatCurrency(totalSpent)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Target: {formatCurrency(dailyTarget)}</p>
            </div>
            <div className={`p-3 rounded-lg ${isOverTarget ? 'bg-red-100' : 'bg-green-100'}`}>
              {isOverTarget ? (
                <TrendingUp className="w-6 h-6 text-red-600" />
              ) : (
                <TrendingDown className="w-6 h-6 text-green-600" />
              )}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Due Amount</p>
              <p className={`text-2xl font-bold ${currentDue > 0 ? 'text-orange-600' : 'text-gray-900 dark:text-gray-50'}`}>
                {formatCurrency(currentDue)}
              </p>
              {remainingTarget > 0 && (
                <p className="text-sm text-green-600 dark:text-green-400">Can save: {formatCurrency(remainingTarget)}</p>
              )}
            </div>
            <div className={`p-3 rounded-lg ${currentDue > 0 ? 'bg-orange-100' : 'bg-gray-100'}`}>
              <AlertCircle className={`w-6 h-6 ${currentDue > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Savings Transferred</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(dailyData.savingsTransferred || 0)}
              </p>
              {dailyData.borrowed && (
                <p className="text-sm text-blue-600 dark:text-blue-400">Borrowed: {formatCurrency(dailyData.borrowed)}</p>
              )}
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <PiggyBank className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="card p-6">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowSpendingModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Spending</span>
          </button>

          {remainingTarget > 0 && (
            <button
              onClick={() => setShowTransferModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <PiggyBank className="w-4 h-4" />
              <span>Transfer to Savings</span>
            </button>
          )}

          <button
            onClick={() => setShowBorrowModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <DollarSign className="w-4 h-4" />
            <span>Borrow Money</span>
          </button>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Spending & Tasks */}
        <div className="space-y-6">
          {/* Spending List */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Spending Entries</h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {dailyData.spending?.length || 0} entries
              </span>
            </div>

            <div className="space-y-3">
              {dailyData.spending?.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-50">{entry.description}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <p className="font-semibold text-red-600">{formatCurrency(entry.amount)}</p>
                </div>
              )) || (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No spending entries yet</p>
              )}
            </div>
          </div>

          {/* Tasks */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Daily Tasks</h3>
              <button
                onClick={() => setShowTaskModal(true)}
                className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Add Task</span>
              </button>
            </div>

            <div className="space-y-3">
              {dailyData.tasks?.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {task.completed ? (
                      <CheckSquare className="w-5 h-5 text-green-600" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                  <div className="flex-1">
                    <p className={`${task.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-50'}`}>
                      {task.description}
                    </p>
                    {task.createdDate !== formatDate(selectedDate) && (
                      <p className="text-xs text-blue-600 dark:text-blue-400">Carried over</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors text-sm"
                  >
                    Delete
                  </button>
                </div>
              )) || (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No tasks yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Notes */}
        <div className="space-y-6">
          {/* Previous Day Notes Preview */}
          {previousDayData?.notes && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl shadow-sm p-6 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center space-x-2 mb-3">
                <FileText className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200">Yesterday's Notes</h3>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{previousDayData.notes}</p>
              </div>
            </div>
          )}

          {/* Today's Notes */}
          <div className="card p-6">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Today's Notes</h3>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write your thoughts, reflections, or reminders for today..."
              className="w-full h-64 p-4 border border-gray-200 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 placeholder-gray-500 dark:placeholder-gray-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Notes are automatically saved</p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showSpendingModal && (
        <SpendingModal
          onSave={addSpending}
          onClose={() => setShowSpendingModal(false)}
        />
      )}

      {showTaskModal && (
        <TaskModal
          onSave={addTask}
          onClose={() => setShowTaskModal(false)}
        />
      )}

      {showTransferModal && (
        <TransferModal
          title="Transfer to Savings"
          maxAmount={remainingTarget}
          onSave={transferToSavings}
          onClose={() => setShowTransferModal(false)}
          type="savings"
        />
      )}

      {showBorrowModal && (
        <TransferModal
          title="Borrow Money"
          onSave={borrowMoney}
          onClose={() => setShowBorrowModal(false)}
          type="borrow"
        />
      )}
    </div>
  );
};

export default DailyView;