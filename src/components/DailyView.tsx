import React, { useState, useEffect } from 'react';
import { Plus, CreditCard, CheckSquare, Square, FileText, TrendingUp, TrendingDown, AlertCircle, PiggyBank, Trash2, X, Edit, Trash, Clock } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/dateUtils';
import type { DailyData, SpendingEntry, Task } from '../types';
import SpendingModal from './SpendingModal';
import TaskModal from './TaskModal';
import TransferModal from './TransferModal';
import ExcessSpendingModal from './ExcessSpendingModal';

interface DailyViewProps {
  selectedDate: Date;
  dailyData: DailyData;
  previousDayData?: DailyData;
  dailyTarget: number;
  remainingCredit: number;
  availableSavings: number;
  onUpdateDailyData: (data: Partial<DailyData>) => void;
  onUpdateSavings: (amount: number, dailySavingsData?: Partial<DailyData>) => void;
  onRecordExcessSpending: (amount: number, reason: string) => void;
}

const DailyView: React.FC<DailyViewProps> = ({
  selectedDate,
  dailyData,
  previousDayData,
  dailyTarget,
  remainingCredit,
  availableSavings,
  onUpdateDailyData,
  onUpdateSavings,
  onRecordExcessSpending
}) => {
  const [showSpendingModal, setShowSpendingModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showExcessSpendingModal, setShowExcessSpendingModal] = useState(false);
  const [notes, setNotes] = useState(dailyData.notes || '');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showEditBorrowModal, setShowEditBorrowModal] = useState(false);

  // Update notes state when dailyData.notes changes
  useEffect(() => {
    setNotes(dailyData.notes || '');
  }, [dailyData.notes]);

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
        .map(task => ({ 
          ...task, 
          id: `${task.id}-carried`, 
          createdDate: task.createdDate || formatDate(selectedDate) // Preserve original date
        }));
      
      if (incompleteTasks.length > 0) {
        onUpdateDailyData({ tasks: incompleteTasks });
      }
    }
  }, [previousDayData, dailyData.tasks, selectedDate, onUpdateDailyData]);

  const totalSpent = dailyData.spending?.reduce((sum, entry) => sum + entry.amount, 0) || 0;
  const savingsTransferred = dailyData.savingsTransferred || 0;
  const remainingTarget = dailyTarget - totalSpent - savingsTransferred;
  const isOverTarget = totalSpent > dailyTarget;
  const currentDue = (dailyData.due || 0) + (isOverTarget ? totalSpent - dailyTarget : 0);

  // Calculate available amount for excess spending (from total remaining credit)
  // Excess spending is discretionary spending that deducts from remaining monthly credit
  const availableForExcess = Math.max(0, remainingCredit);

  const addSpending = (description: string, amount: number) => {
    console.log("Adding spending entry:", description, amount);
    const newEntry: SpendingEntry = {
      id: Date.now().toString(),
      description,
      amount,
      timestamp: new Date()
    };

    const updatedSpending = [...(dailyData.spending || []), newEntry];
    console.log("Updated spending array:", updatedSpending);
    onUpdateDailyData({ spending: updatedSpending });
  };

  const deleteSpending = (entryId: string) => {
    setDeleteConfirmId(entryId);
  };

  const confirmDeleteSpending = () => {
    if (deleteConfirmId) {
      const updatedSpending = (dailyData.spending || []).filter(entry => entry.id !== deleteConfirmId);
      onUpdateDailyData({ spending: updatedSpending });
      setDeleteConfirmId(null);
    }
  };

  const cancelDeleteSpending = () => {
    setDeleteConfirmId(null);
  };

  const addTask = (description: string) => {
    console.log("Adding task:", description);
    const newTask: Task = {
      id: Date.now().toString(),
      description,
      completed: false,
      createdDate: formatDate(selectedDate)
    };

    const updatedTasks = [...(dailyData.tasks || []), newTask];
    console.log("Updated tasks array:", updatedTasks);
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
    console.log("=== transferToSavings called ===");
    console.log("Transferring to savings:", amount);
    const currentTransferred = dailyData.savingsTransferred || 0;
    const newSavingsTransferred = currentTransferred + amount;
    console.log("New savings transferred:", newSavingsTransferred);
    console.log("Calling onUpdateSavings with:", amount, { savingsTransferred: newSavingsTransferred });
    onUpdateSavings(amount, { savingsTransferred: newSavingsTransferred });
    console.log("=== transferToSavings finished ===");
  };

  const borrowMoney = (amount: number) => {
    console.log("=== borrowMoney called ===");
    console.log("Borrowing amount:", amount);
    console.log("Current borrowed:", dailyData.borrowed || 0);
    const currentBorrowed = dailyData.borrowed || 0;
    const newBorrowed = currentBorrowed + amount;
    console.log("New borrowed amount:", newBorrowed);
    // Deduct from total savings when borrowing (money leaves the savings account)
    console.log("Amount to deduct from savings:", -amount);
    if (amount > 0) {
      onUpdateSavings(-amount, { borrowed: newBorrowed });
    } else {
      console.log("Invalid amount, not calling onUpdateSavings");
    }
    console.log("=== borrowMoney finished ===");
  };

  const recordExcessSpending = (amount: number, reason: string) => {
    console.log("Recording excess spending:", amount, reason);
    // Call the new function passed from App component
    onRecordExcessSpending(amount, reason);
  };

  const editBorrowedMoney = (newAmount: number) => {
    console.log("=== editBorrowedMoney called ===");
    console.log("Editing borrowed amount to:", newAmount);
    const currentBorrowed = dailyData.borrowed || 0;
    console.log("Current borrowed:", currentBorrowed);
    const difference = newAmount - currentBorrowed;
    console.log("Difference:", difference);
    
    // Only adjust total savings by the difference
    // Prevent double calls by checking if difference is not zero
    if (difference !== 0) {
      console.log("Calling onUpdateSavings with:", -difference, { borrowed: newAmount });
      onUpdateSavings(-difference, { borrowed: newAmount });
    } else {
      console.log("No difference, not calling onUpdateSavings");
    }
    setShowEditBorrowModal(false);
    console.log("=== editBorrowedMoney finished ===");
  };

  const deleteBorrowedMoney = () => {
    console.log("=== deleteBorrowedMoney called ===");
    console.log("Deleting borrowed amount");
    const currentBorrowed = dailyData.borrowed || 0;
    console.log("Current borrowed:", currentBorrowed);
    // Add back to total savings when deleting borrowed amount
    // Prevent double calls by checking if there's actually borrowed amount
    if (currentBorrowed > 0) {
      console.log("Calling onUpdateSavings with:", currentBorrowed, { borrowed: 0 });
      onUpdateSavings(currentBorrowed, { borrowed: 0 });
    } else {
      console.log("No borrowed amount, not calling onUpdateSavings");
    }
    console.log("=== deleteBorrowedMoney finished ===");
  };

  // New function to clear due amounts
  const clearDue = () => {
    if (currentDue <= 0) return;
    
    // Calculate how much we can clear based on remaining target
    const amountToClear = Math.min(currentDue, remainingTarget);
    
    // Add a spending entry for "Clearing due"
    const newEntry: SpendingEntry = {
      id: `clear-due-${Date.now()}`,
      description: "Clearing due",
      amount: amountToClear,
      timestamp: new Date()
    };
    
    // Update daily data with new spending entry and reduced due
    const updatedSpending = [...(dailyData.spending || []), newEntry];
    const newDue = currentDue - amountToClear;
    
    onUpdateDailyData({ 
      spending: updatedSpending,
      due: newDue > 0 ? newDue : undefined // Remove due if fully cleared
    });
  };

  return (
    <div className="space-y-6">
      {/* Daily Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              {currentDue > 0 && remainingTarget > 0 && (
                <button
                  onClick={clearDue}
                  className="mt-2 px-3 py-1 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Clear Due
                </button>
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
              {remainingTarget > 0 && (
                <p className="text-sm text-green-600 dark:text-green-400">Can save: {formatCurrency(remainingTarget)}</p>
              )}
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <PiggyBank className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Borrowed Money</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(dailyData.borrowed || 0)}
              </p>
              <div className="flex items-center space-x-1 mt-2">
                <button
                  onClick={() => setShowEditBorrowModal(true)}
                  className="p-1 text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                  title={dailyData.borrowed && dailyData.borrowed > 0 ? "Edit borrowed amount" : "Add borrowed amount"}
                >
                  <Edit className="w-3 h-3" />
                </button>
                {(dailyData.borrowed && dailyData.borrowed > 0) && (
                  <button
                    onClick={deleteBorrowedMoney}
                    className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="Delete borrowed amount"
                  >
                    <Trash className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-purple-600" />
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
            <CreditCard className="w-4 h-4" />
            <span>Borrow Money</span>
          </button>

          <button
            onClick={() => setShowExcessSpendingModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Excess Spending</span>
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
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-50">{entry.description}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <p className="font-semibold text-red-600">{formatCurrency(entry.amount)}</p>
                    <button
                      onClick={() => deleteSpending(entry.id)}
                      className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )) || (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No spending entries yet</p>
              )}
              
              {/* Excess Spending Entry */}
              {dailyData.excessSpending && dailyData.excessSpending > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex-1">
                    <p className="font-medium text-red-800 dark:text-red-200">Excess Spending</p>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {dailyData.excessSpendingReason || 'No reason provided'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <p className="font-semibold text-red-600">{formatCurrency(dailyData.excessSpending)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tasks */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Daily Tasks</h3>
              <button
                onClick={() => {
                  console.log("Add Task button clicked");
                  setShowTaskModal(true);
                }}
                className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Add Task</span>
              </button>
            </div>

            <div className="space-y-3">
              {dailyData.tasks?.map((task) => {
                const isCarriedOver = task.createdDate !== formatDate(selectedDate);
                return (
                  <div
                    key={task.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      isCarriedOver 
                        ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30' 
                        : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
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
                      <div className="flex items-center space-x-2">
                        <p className={`${task.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-50'}`}>
                          {task.description}
                        </p>
                        {isCarriedOver && (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-full">
                            <Clock className="w-3 h-3" />
                            <span>Previous Day</span>
                          </span>
                        )}
                      </div>
                      {isCarriedOver && task.createdDate && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                          From: {new Date(task.createdDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </div>
                );
              })}
              {(!dailyData.tasks || dailyData.tasks.length === 0) && (
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
          maxAmount={availableSavings}
        />
      )}

      {showExcessSpendingModal && (
        <ExcessSpendingModal
          onSave={recordExcessSpending}
          onClose={() => setShowExcessSpendingModal(false)}
          maxAmount={availableForExcess}
        />
      )}

      {showEditBorrowModal && (
        <TransferModal
          title="Edit Borrowed Amount"
          onSave={editBorrowedMoney}
          onClose={() => setShowEditBorrowModal(false)}
          type="borrow"
          initialValue={dailyData.borrowed || 0}
          maxAmount={availableSavings + (dailyData.borrowed || 0)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Delete Spending Entry</h2>
              <button
                onClick={cancelDeleteSpending}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Are you sure you want to delete this spending entry? This action cannot be undone.
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={cancelDeleteSpending}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteSpending}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyView;