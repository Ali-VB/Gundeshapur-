import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  // Fix: Changed icon prop type to JSX.Element to allow cloning with new props, as React.ReactElement can sometimes infer props as 'unknown' in strict mode.
  icon: JSX.Element;
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'red';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300',
    green: 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300',
    purple: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-300',
    red: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300',
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center">
      <div className={`p-3 rounded-full mr-4 ${colorClasses[color]}`}>
        {React.cloneElement(icon, { className: 'w-7 h-7' })}
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-800 dark:text-white">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;