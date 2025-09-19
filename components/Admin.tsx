
import React, { useContext } from 'react';
import { AppStateContext } from '../App';

const AdminPage: React.FC = () => {
    const { user } = useContext(AppStateContext);

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">SaaS Admin Dashboard</h1>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Welcome, Administrator</h2>
                <p className="text-gray-600 dark:text-gray-400">
                    You are logged in as <span className="font-semibold">{user?.email}</span>.
                </p>
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                    This area is reserved for managing all client instances of the Gundeshapur Library application.
                    Future features for client management, subscription monitoring, and analytics will be available here.
                </p>
            </div>
        </div>
    );
};

export default AdminPage;
