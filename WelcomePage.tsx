
import React, { useContext } from 'react';
import { AppStateContext } from '../App';

interface WelcomePageProps {
  onStartSetup: () => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onStartSetup }) => {
  const { user, handleSignOut, handleResetConfiguration } = useContext(AppStateContext);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="absolute top-4 right-4 flex items-center gap-2">
         <button onClick={handleResetConfiguration} className="px-4 py-2 text-sm text-gray-700 bg-white rounded-md shadow hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
          Reset Config
        </button>
        <button onClick={handleSignOut} className="px-4 py-2 text-sm text-gray-700 bg-white rounded-md shadow hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
          Sign Out
        </button>
      </div>
      <div className="p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-center max-w-lg w-full">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Welcome, {user?.name}!</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          You're one step away from managing your library.
        </p>
        <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h2 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-200">Complete Setup</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            To get started, you need to connect the application to your own Google Cloud project by following a one-time setup wizard.
          </p>
          <button
            onClick={onStartSetup}
            className="w-full px-6 py-3 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Setup
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
