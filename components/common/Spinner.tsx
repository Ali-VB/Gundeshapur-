
import React from 'react';

const Spinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div
        className="w-12 h-12 rounded-full animate-spin border-4 border-solid border-blue-500 border-t-transparent"
        style={{ animation: 'spin 1.2s linear infinite' }}
      ></div>
      <p className="text-gray-600 dark:text-gray-300">Loading...</p>
    </div>
  );
};

export default Spinner;
