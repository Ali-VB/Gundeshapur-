
import React, { useState, useEffect, useContext } from 'react';
import { AppStateContext } from '../App';
import type { Book, LibraryUser, Loan } from '../types';
import { getSheetData } from '../services/google';
import { SHEET_CONFIG, ICONS } from '../constants';
import Spinner from './common/Spinner';
import StatCard from './common/StatCard';

const Dashboard: React.FC = () => {
  const { spreadsheetId } = useContext(AppStateContext);
  const [books, setBooks] = useState<Book[]>([]);
  const [users, setUsers] = useState<LibraryUser[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!spreadsheetId) return;
      setIsLoading(true);
      setError(null);
      try {
        const [booksData, usersData, loansData] = await Promise.all([
          getSheetData<Book>(spreadsheetId, SHEET_CONFIG.BOOKS.name, SHEET_CONFIG.BOOKS.headers),
          getSheetData<LibraryUser>(spreadsheetId, SHEET_CONFIG.USERS.name, SHEET_CONFIG.USERS.headers),
          getSheetData<Loan>(spreadsheetId, SHEET_CONFIG.LOANS.name, SHEET_CONFIG.LOANS.headers),
        ]);
        setBooks(booksData);
        setUsers(usersData);
        setLoans(loansData);
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard data. Please check your sheet and permissions.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [spreadsheetId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  const totalBooks = books.length;
  const availableBooks = books.reduce((sum, book) => sum + (book.available_copies || 0), 0);
  const activeUsers = users.filter(u => u.is_active).length;
  const activeLoans = loans.filter(l => !l.is_returned).length;
  const overdueLoans = loans.filter(l => !l.is_returned && new Date(l.due_date) < new Date()).length;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatCard title="Total Books" value={totalBooks} icon={ICONS.BOOKS} color="blue" />
        <StatCard title="Available Books" value={availableBooks} icon={ICONS.BOOKS} color="green" />
        <StatCard title="Active Users" value={activeUsers} icon={ICONS.USERS} color="purple" />
        <StatCard title="Active Loans" value={activeLoans} icon={ICONS.LOANS} color="yellow" />
        <StatCard title="Overdue Loans" value={overdueLoans} icon={ICONS.LOANS} color="red" />
      </div>
      
      <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Recent Activity</h2>
        {loans.length > 0 ? (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {loans.slice(-5).reverse().map(loan => (
              <li key={loan.id} className="py-3 flex justify-between items-center">
                <div>
                    <p className="font-medium text-gray-800 dark:text-gray-100">{loan.book_title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loaned to {loan.user_name} on {new Date(loan.loan_date).toLocaleDateString()}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${loan.is_returned ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                    {loan.is_returned ? 'Returned' : 'On Loan'}
                </span>
              </li>  
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No loan activity yet.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
