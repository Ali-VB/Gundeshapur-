
import React, { useState, useContext } from 'react';
import { AppStateContext } from '../App';
import { LibraryContext } from '../LibraryApp';
import { Page } from '../types';
import Dashboard from './Dashboard';
import BooksPage from './Books';
import UsersPage from './Users';
import LoansPage from './Loans';
import { ICONS } from '../constants';

const NavLink: React.FC<{
  icon: React.ReactNode;
  label: Page;
  activePage: Page;
  setPage: (page: Page) => void;
}> = ({ icon, label, activePage, setPage }) => (
  <button
    onClick={() => setPage(label)}
    className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
      activePage === label
        ? 'bg-blue-600 text-white'
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
    }`}
  >
    <span className="mr-3">{icon}</span>
    {label}
  </button>
);

const UserLayout: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>(Page.Dashboard);
  const { user, handleSignOut } = useContext(AppStateContext);
  const { spreadsheetId } = useContext(LibraryContext);

  const renderPage = () => {
    switch (activePage) {
      case Page.Dashboard:
        return <Dashboard />;
      case Page.Books:
        return <BooksPage />;
      case Page.Users:
        return <UsersPage />;
      case Page.Loans:
        return <LoansPage />;
      default:
        return <Dashboard />;
    }
  };

  const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-800">
      {/* Sidebar */}
      <aside className="flex flex-col w-64 bg-white dark:bg-gray-900 shadow-lg p-4">
        <div className="flex items-center mb-6">
           <div className="bg-blue-600 text-white rounded-md p-2 mr-3">
             {ICONS.BOOKS}
           </div>
           <h1 className="text-xl font-bold text-gray-800 dark:text-white">Gundeshapur</h1>
        </div>
        <nav className="flex-1 space-y-2">
          <NavLink icon={ICONS.DASHBOARD} label={Page.Dashboard} activePage={activePage} setPage={setActivePage} />
          <NavLink icon={ICONS.BOOKS} label={Page.Books} activePage={activePage} setPage={setActivePage} />
          <NavLink icon={ICONS.USERS} label={Page.Users} activePage={activePage} setPage={setActivePage} />
          <NavLink icon={ICONS.LOANS} label={Page.Loans} activePage={activePage} setPage={setActivePage} />
        </nav>
        <div className="mt-auto">
          <a
            href={sheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-full px-4 py-2 mt-4 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors duration-200"
          >
            Open Sheet {ICONS.EXTERNAL_LINK}
          </a>
          <div className="flex items-center p-2 mt-4 border-t border-gray-200 dark:border-gray-700">
            <img src={user?.imageUrl} alt={user?.name} className="w-10 h-10 rounded-full" />
            <div className="ml-3">
              <p className="text-sm font-semibold text-gray-800 dark:text-white">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
            </div>
            <button onClick={handleSignOut} className="ml-auto p-2 text-gray-500 hover:text-red-500 dark:hover:text-red-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="Sign Out">
              {ICONS.LOGOUT}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {renderPage()}
      </main>
    </div>
  );
};

export default UserLayout;
