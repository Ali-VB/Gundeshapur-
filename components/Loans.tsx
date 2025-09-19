
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AppStateContext } from '../App';
import type { Loan } from '../types';
import { getSheetData } from '../services/google';
import { SHEET_CONFIG, ICONS } from '../constants';
import Spinner from './common/Spinner';

const LoansPage: React.FC = () => {
  const { spreadsheetId } = useContext(AppStateContext);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLoans = async () => {
      if (!spreadsheetId) return;
      setIsLoading(true);
      setError(null);
      try {
        const loansData = await getSheetData<Loan>(spreadsheetId, SHEET_CONFIG.LOANS.name, SHEET_CONFIG.LOANS.headers);
        setLoans(loansData);
      } catch (err) {
        console.error(err);
        setError("Failed to load loans. Please check your sheet and permissions.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchLoans();
  }, [spreadsheetId]);

  const filteredLoans = useMemo(() => {
    if (!searchTerm) return loans;
    const lowercasedFilter = searchTerm.toLowerCase();
    return loans.filter(loan => 
      loan.book_title?.toLowerCase().includes(lowercasedFilter) ||
      loan.user_name?.toLowerCase().includes(lowercasedFilter)
    );
  }, [loans, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    );
  }
  
  const getStatus = (loan: Loan) => {
    if (loan.is_returned) {
      return { text: 'Returned', color: 'green' };
    }
    if (new Date(loan.due_date) < new Date()) {
      return { text: 'Overdue', color: 'red' };
    }
    return { text: 'On Loan', color: 'yellow' };
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Loans</h1>
        <div className="relative">
          <input 
            type="text"
            placeholder="Search loans..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {ICONS.SEARCH}
          </div>
        </div>
      </div>

      {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">Book Title</th>
                <th scope="col" className="px-6 py-3">User</th>
                <th scope="col" className="px-6 py-3">Loan Date</th>
                <th scope="col" className="px-6 py-3">Due Date</th>
                <th scope="col" className="px-6 py-3">Return Date</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.map((loan) => {
                const status = getStatus(loan);
                const colorClasses = {
                  green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                  red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                };
                return (
                  <tr key={loan.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                    <td scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{loan.book_title}</td>
                    <td className="px-6 py-4">{loan.user_name}</td>
                    <td className="px-6 py-4">{new Date(loan.loan_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">{new Date(loan.due_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">{loan.return_date ? new Date(loan.return_date).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colorClasses[status.color as keyof typeof colorClasses]}`}>
                        {status.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!loan.is_returned && <button className="font-medium text-blue-600 dark:text-blue-500 hover:underline">Return</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredLoans.length === 0 && <p className="p-4 text-center">No loans found.</p>}
        </div>
      </div>
    </div>
  );
};

export default LoansPage;
