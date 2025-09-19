
import React, { useContext } from 'react';
import { AppStateContext } from '../../App';
import AdminPage from '../Admin';
import { ICONS } from '../../constants';

const AdminLayout: React.FC = () => {
  const { user, handleSignOut } = useContext(AppStateContext);

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-800">
      <header className="bg-white dark:bg-gray-900 shadow-md p-4 flex justify-between items-center">
         <div className="flex items-center">
           <div className="bg-blue-600 text-white rounded-md p-2 mr-3">
             {ICONS.ADMIN}
           </div>
           <h1 className="text-xl font-bold text-gray-800 dark:text-white">Admin Panel</h1>
        </div>
         <div className="flex items-center">
            <img src={user?.imageUrl} alt={user?.name} className="w-10 h-10 rounded-full" />
            <div className="ml-3 mr-4">
              <p className="text-sm font-semibold text-gray-800 dark:text-white">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
            </div>
            <button onClick={handleSignOut} className="p-2 text-gray-500 hover:text-red-500 dark:hover:text-red-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="Sign Out">
              {ICONS.LOGOUT}
            </button>
         </div>
      </header>
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <AdminPage />
      </main>
    </div>
  );
};

export default AdminLayout;
