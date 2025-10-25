import React, { useState } from 'react';
import { X } from 'lucide-react';
import { formatCurrency } from '../utils/dateUtils';

interface TransferModalProps {
  title: string;
  maxAmount?: number;
  onSave: (amount: number) => void;
  onClose: () => void;
  type: 'savings' | 'borrow';
}

const TransferModal: React.FC<TransferModalProps> = ({ title, maxAmount, onSave, onClose, type }) => {
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const numAmount = parseFloat(amount);
    if (numAmount && numAmount > 0) {
      if (type === 'savings' && maxAmount && numAmount > maxAmount) {
        alert(`Cannot transfer more than ${formatCurrency(maxAmount)}`);
        return;
      }
      onSave(numAmount);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount ($)
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              max={maxAmount}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 placeholder-gray-500 dark:placeholder-gray-400"
              autoFocus
            />
            {type === 'savings' && maxAmount && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Maximum available: {formatCurrency(maxAmount)}
              </p>
            )}
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
              className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                type === 'savings' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {type === 'savings' ? 'Transfer' : 'Borrow'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferModal;