import React, { useState } from 'react';
import { X } from 'lucide-react';

interface ExcessSpendingModalProps {
  onSave: (amount: number, reason: string) => void;
  onClose: () => void;
  maxAmount?: number;
}

const ExcessSpendingModal: React.FC<ExcessSpendingModalProps> = ({ onSave, onClose, maxAmount }) => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const numAmount = parseFloat(amount);
    if (numAmount > 0 && reason.trim()) {
      // Only check maxAmount if it's a valid number greater than 0
      // But for excess spending, we're more lenient - we'll just warn if it exceeds available credit
      if (maxAmount && maxAmount > 0 && numAmount > maxAmount) {
        const confirm = window.confirm(`This amount exceeds your available credit (${maxAmount.toFixed(2)}). Are you sure you want to proceed?`);
        if (!confirm) {
          return;
        }
      }
      onSave(numAmount, reason);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Excess Spending</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount (₹)
              </label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 placeholder-gray-500 dark:placeholder-gray-400"
                autoFocus
              />
              {maxAmount !== undefined && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Available credit: {maxAmount.toFixed(2)}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason for Excess Spending
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why did you spend this extra money?"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 placeholder-gray-500 dark:placeholder-gray-400"
                rows={3}
              />
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              disabled={!amount || !reason.trim()}
            >
              Record Excess Spending
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExcessSpendingModal;