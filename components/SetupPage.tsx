
import React, { useState, useContext } from 'react';
import { AppStateContext } from '../App';
import { createNewSheet, validateSheet } from '../services/google';
import Spinner from './common/Spinner';

const SetupPage: React.FC = () => {
  const { setSpreadsheetId, user, handleSignOut } = useContext(AppStateContext);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputId, setInputId] = useState('');

  const handleCreateSheet = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const newSheetId = await createNewSheet(`Gundeshapur Library - ${user?.name}`);
      if (newSheetId) {
        setSpreadsheetId(newSheetId);
      } else {
        setError("Failed to create a new sheet. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while creating the sheet. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectSheet = async () => {
    if (!inputId) {
      setError("Please paste a Spreadsheet ID.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const isValid = await validateSheet(inputId);
      if (isValid) {
        setSpreadsheetId(inputId);
      } else {
        setError("Invalid sheet. Ensure it has 'Books', 'Users', and 'Loans' tabs.");
      }
    } catch (err) {
      console.error(err);
      setError("Could not access or validate the sheet. Please check the ID and your permissions.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
       <div className="absolute top-4 right-4">
        <button onClick={handleSignOut} className="px-4 py-2 text-sm text-gray-700 bg-white rounded-md shadow hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
          Sign Out
        </button>
      </div>
      <div className="p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-center max-w-lg w-full">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Welcome, {user?.name}!</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">Let's set up your library database.</p>
        
        {isLoading && <div className="my-4"><Spinner /></div>}
        {error && <p className="text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-md mb-4">{error}</p>}
        
        <div className="space-y-6">
          {/* Option 1: Create New */}
          <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h2 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-200">Create a New Library Sheet</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">We'll create a new Google Sheet in your Drive, perfectly formatted for you.</p>
            <button
              onClick={handleCreateSheet}
              disabled={isLoading}
              className="w-full px-6 py-3 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-800 transition-colors"
            >
              Create New Sheet
            </button>
          </div>

          <div className="flex items-center text-gray-400">
            <hr className="w-full border-gray-300 dark:border-gray-600"/>
            <span className="px-4">OR</span>
            <hr className="w-full border-gray-300 dark:border-gray-600"/>
          </div>

          {/* Option 2: Connect Existing */}
          <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h2 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-200">Connect an Existing Sheet</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Paste the ID of your Google Sheet. You can find it in the URL.</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputId}
                onChange={(e) => setInputId(e.target.value)}
                placeholder="Spreadsheet ID"
                className="flex-grow p-3 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleConnectSheet}
                disabled={isLoading}
                className="px-6 py-3 font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-green-300 dark:disabled:bg-green-800 transition-colors"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupPage;
