
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { LibraryContext } from '../LibraryApp';
import type { Loan, Book } from '../types';
import { getSheetData, updateCell } from '../services/google';
import { SHEET_CONFIG, ICONS } from '../constants';
import Spinner from './common/Spinner';

const LoansPage: React.FC = () => {
  const { spreadsheetId } = useContext(LibraryContext);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdatingLoan, setIsUpdatingLoan] = useState<string | null>(null);

  const fetchData = async () => {
    if (!spreadsheetId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [loansData, booksData] = await Promise.all([
        getSheetData<Loan>(spreadsheetId, SHEET_CONFIG.LOANS.name, SHEET_CONFIG.LOANS.headers),
        getSheetData<Book>(spreadsheetId, SHEET_CONFIG.BOOKS.name, SHEET_CONFIG.BOOKS.headers),
      ]);
      setLoans(loansData);
      setBooks(booksData);
    } catch (err: any) {
      console.error(err);
      let message = "Failed to load loans. Please check your sheet and permissions.";
      if (err?.result?.error?.message) {
        message = `Error from Google: ${err.result.error.message}. Please verify your Spreadsheet ID and permissions.`;
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [spreadsheetId]);

  const handleReturnBook = async (loan: Loan) => {
    if (!spreadsheetId) return;
    setIsUpdatingLoan(loan.id);
    try {
      // 1. Update Loan sheet: is_returned to TRUE and return_date to today
      const returnDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
      const isReturnedCell = `${SHEET_CONFIG.LOANS.name}!I${loan.row}`; // Column I is is_returned
      const returnDateCell = `${SHEET_CONFIG.LOANS.name}!H${loan.row}`; // Column H is return_date
      
      await Promise.all([
        updateCell(spreadsheetId, isReturnedCell, 'TRUE'),
        updateCell(spreadsheetId, returnDateCell, returnDate)
      ]);

      // 2. Update Books sheet: increment available_copies
      const bookToReturn = books.find(b => b.id === loan.book_id);
      if (bookToReturn) {
        const newAvailableCopies = bookToReturn.available_copies + 1;
        const availableCopiesCell = `${SHEET_CONFIG.BOOKS.name}!J${bookToReturn.row}`; // Column J is available_copies
        await updateCell(spreadsheetId, availableCopiesCell, newAvailableCopies);
      } else {
          console.warn(`Book with ID ${loan.book_id} not found for returning loan ${loan.id}. Available copies not updated.`);
      }

      // 3. Refresh data
      await fetchData();

    } catch (err: any) {
      console.error("Failed to return book", err);
      alert(`Failed to return book. Error from Google: ${err?.result?.error?.message || 'Unknown error'}`);
    } finally {
      setIsUpdatingLoan(null);
    }
  };

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
    if (loan.due_date && new Date(loan.due_date) < new Date()) {
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

      {error && <p className="text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-md mb-4">{error}</p>}

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
                    <td className="px-6 py-4">{loan.loan_date ? new Date(loan.loan_date).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-6 py-4">{loan.due_date ? new Date(loan.due_date).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-6 py-4">{loan.return_date ? new Date(loan.return_date).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colorClasses[status.color as keyof typeof colorClasses]}`}>
                        {status.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!loan.is_returned && (
                        <button 
                          onClick={() => handleReturnBook(loan)} 
                          disabled={isUpdatingLoan === loan.id}
                          className="font-medium text-blue-600 dark:text-blue-500 hover:underline disabled:text-gray-400 disabled:no-underline"
                        >
                          {isUpdatingLoan === loan.id ? 'Returning...' : 'Return'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredLoans.length === 0 && !isLoading && <p className="p-4 text-center">No loans found.</p>}
        </div>
      </div>
    </div>
  );
};

export default LoansPage;
