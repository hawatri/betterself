import React, { useState } from 'react';
import { X, DollarSign, Target } from 'lucide-react';
import { formatCurrency } from '../utils/dateUtils';

interface MonthlySetupModalProps {
  onSave: (monthlyCredit: number, dailyTarget: number) => void;
  onClose: () => void;
  currentCredit: number;
  currentTarget: number;
}

const MonthlySetupModal: React.FC<MonthlySetupModalProps> = ({ onSave, onClose, currentCredit, currentTarget }) => {
  const [monthlyCredit, setMonthlyCredit] = useState(currentCredit.toString());
  const [dailyTarget, setDailyTarget] = useState(currentTarget.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const credit = parseFloat(monthlyCredit);
    const target = parseFloat(dailyTarget);
    
    if (credit > 0 && target > 0) {
      onSave(credit, target);
    }
  };

  const suggestedTarget = parseFloat(monthlyCredit) > 0 ? (parseFloat(monthlyCredit) / 30).toFixed(2) : '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Monthly Setup</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="monthly-credit" className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Monthly Available Credit</span>
                </div>
              </label>
              <input
                type="number"
                id="monthly-credit"
                value={monthlyCredit}
                onChange={(e) => setMonthlyCredit(e.target.value)}
                placeholder="Enter your monthly budget"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <p className="text-sm text-gray-600 mt-1">
                Total amount available for spending this month
              </p>
            </div>

            <div>
              <label htmlFor="daily-target" className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4" />
                  <span>Daily Spending Target</span>
                </div>
              </label>
              <input
                type="number"
                id="daily-target"
                value={dailyTarget}
                onChange={(e) => setDailyTarget(e.target.value)}
                placeholder="Enter daily spending limit"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {suggestedTarget && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    Suggested: {formatCurrency(parseFloat(suggestedTarget))} (monthly credit ÷ 30 days)
                  </p>
                  <button
                    type="button"
                    onClick={() => setDailyTarget(suggestedTarget)}
                    className="text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    Use suggested amount
                  </button>
                </div>
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Set your total monthly budget</li>
                <li>• Define a daily spending target</li>
                <li>• Track daily expenses automatically</li>
                <li>• Save leftover amounts or track overspending</li>
              </ul>
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Setup
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MonthlySetupModal;