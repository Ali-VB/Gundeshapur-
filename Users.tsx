
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { LibraryContext } from '../LibraryApp';
import type { LibraryUser } from '../types';
import { getSheetData, updateCell } from '../services/google';
import { SHEET_CONFIG, ICONS } from '../constants';
import Spinner from './common/Spinner';
import ToggleSwitch from './common/ToggleSwitch';

const UsersPage: React.FC = () => {
  const { spreadsheetId } = useContext(LibraryContext);
  const [users, setUsers] = useState<LibraryUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (!spreadsheetId) return;
    setIsLoading(true);
    setError(null);
    try {
      const usersData = await getSheetData<LibraryUser>(spreadsheetId, SHEET_CONFIG.USERS.name, SHEET_CONFIG.USERS.headers);
      setUsers(usersData);
    } catch (err: any) {
      console.error(err);
      let message = "Failed to load users. Please check your sheet and permissions.";
      if (err?.result?.error?.message) {
        message = `Error from Google: ${err.result.error.message}. Please verify your Spreadsheet ID and permissions.`;
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [spreadsheetId]);

  const handleToggleUserStatus = async (user: LibraryUser) => {
    if (!spreadsheetId) return;
    setIsUpdating(user.id);
    try {
      const newStatus = !user.is_active;
      // Column G is 'is_active' in the Users sheet
      const statusCell = `${SHEET_CONFIG.USERS.name}!G${user.row}`;
      await updateCell(spreadsheetId, statusCell, newStatus ? 'TRUE' : 'FALSE');

      // Update local state for instant UI feedback
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === user.id ? { ...u, is_active: newStatus } : u
        )
      );
    } catch (err: any) {
      console.error("Failed to update user status", err);
      alert(`Failed to update status. Error from Google: ${err?.result?.error?.message || 'Unknown error'}`);
    } finally {
      setIsUpdating(null);
    }
  };


  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const lowercasedFilter = searchTerm.toLowerCase();
    return users.filter(user => 
      user.first_name?.toLowerCase().includes(lowercasedFilter) ||
      user.last_name?.toLowerCase().includes(lowercasedFilter) ||
      user.email?.toLowerCase().includes(lowercasedFilter)
    );
  }, [users, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Users</h1>
        <div className="relative">
          <input 
            type="text"
            placeholder="Search users..."
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
                <th scope="col" className="px-6 py-3">Name</th>
                <th scope="col" className="px-6 py-3">Email</th>
                <th scope="col" className="px-6 py-3">Phone</th>
                <th scope="col" className="px-6 py-3">Registration Date</th>
                <th scope="col" className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <td scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                    {user.first_name} {user.last_name}
                  </td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">{user.phone}</td>
                  <td className="px-6 py-4">{user.registration_date ? new Date(user.registration_date).toLocaleDateString() : 'N/A'}</td>
                  <td className="px-6 py-4 text-center">
                     <div className="flex flex-col items-center">
                        <ToggleSwitch
                            checked={user.is_active}
                            onChange={() => handleToggleUserStatus(user)}
                            disabled={isUpdating === user.id}
                        />
                        <span className={`text-xs mt-1 font-semibold ${user.is_active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && !isLoading && <p className="p-4 text-center">No users found.</p>}
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
