import React, { useState, useContext } from 'react';
import { AppStateContext } from '../App';
import { appendRows } from '../services/google';
import { SHEET_CONFIG } from '../constants';
import Spinner from './common/Spinner';
import Modal from './common/Modal';

const sampleData = {
    books: (now: Date) => {
        const book1Id = crypto.randomUUID();
        const book2Id = crypto.randomUUID();
        return [
            [book1Id, "The Hobbit", "J.R.R. Tolkien", "9780345339683", "823.912", "Houghton Mifflin", "1937", "Fantasy", 3, 3, "https://covers.openlibrary.org/b/isbn/9780345339683-L.jpg", "A classic fantasy novel.", now.toISOString()],
            [book2Id, "1984", "George Orwell", "9780451524935", "823.912", "Signet Classic", "1949", "Dystopian", 2, 2, "https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg", "A story of a dystopian future.", now.toISOString()],
        ];
    },
    users: (now: Date) => {
        const user1Id = crypto.randomUUID();
        const user2Id = crypto.randomUUID();
        return [
            [user1Id, "John", "Doe", "john.doe@example.com", "123-456-7890", now.toLocaleDateString('en-CA'), "TRUE", now.toISOString()],
            [user2Id, "Jane", "Smith", "jane.smith@example.com", "098-765-4321", now.toLocaleDateString('en-CA'), "TRUE", now.toISOString()],
        ];
    },
    loans: (now: Date, bookId: string, userId: string, bookTitle: string, userName: string) => {
        const dueDate = new Date(now);
        dueDate.setDate(now.getDate() + 14);
        return [
            [crypto.randomUUID(), bookId, userId, bookTitle, userName, now.toLocaleDateString('en-CA'), dueDate.toLocaleDateString('en-CA'), "", "FALSE", 0, 0, now.toISOString()]
        ];
    }
};

const AdminPage: React.FC = () => {
    const { spreadsheetId, handleResetConfiguration } = useContext(AppStateContext);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', body: '', onConfirm: () => {} });

    const handleGenerateData = async () => {
        if (!spreadsheetId) return;
        
        setIsModalOpen(false);
        setIsLoading(true);
        setError(null);
        try {
            const now = new Date();
            const books = sampleData.books(now);
            const users = sampleData.users(now);
            
            // For the loan, we'll use the first sample book and user
            const loan = sampleData.loans(now, books[0][0] as string, users[0][0] as string, books[0][1] as string, `${users[0][1]} ${users[0][2]}`);

            await appendRows(spreadsheetId, SHEET_CONFIG.BOOKS.name, books);
            await appendRows(spreadsheetId, SHEET_CONFIG.USERS.name, users);
            await appendRows(spreadsheetId, SHEET_CONFIG.LOANS.name, loan);
            
            alert('Sample data added successfully! Please refresh the page or navigate to another tab to see the changes.');

        } catch (err: any) {
            console.error("Failed to generate sample data", err);
            let message = "An error occurred. Check console for details.";
            if (err?.result?.error?.message) {
                message = `Error from Google: ${err.result.error.message}`;
            }
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const openConfirmationModal = (title: string, body: string, onConfirm: () => void) => {
        setModalContent({ title, body, onConfirm });
        setIsModalOpen(true);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Admin Panel</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* System Status */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">System Status</h2>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Google API Connection:</span>
                            <span className="font-semibold px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Connected</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Spreadsheet ID:</span>
                            <span className="font-mono bg-gray-100 dark:bg-gray-700 text-xs px-2 py-1 rounded truncate max-w-[200px]">{spreadsheetId}</span>
                        </div>
                    </div>
                </div>

                {/* Onboarding Tools */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Onboarding Tools</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">Quickly populate your sheet with sample data to see how the app works.</p>
                    <button
                        onClick={() => openConfirmationModal('Generate Sample Data?', 'This will add 2 books, 2 users, and 1 loan to your current sheet. This action cannot be undone.', handleGenerateData)}
                        disabled={isLoading}
                        className="w-full px-4 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center"
                    >
                        {isLoading ? <Spinner small/> : 'Generate Sample Data'}
                    </button>
                </div>

                {/* Danger Zone */}
                <div className="md:col-span-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold text-red-800 dark:text-red-300">Danger Zone</h2>
                    <p className="text-red-700 dark:text-red-400 mt-2 mb-4 text-sm">These actions are destructive and cannot be undone. Please proceed with caution.</p>
                    <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-md">
                         <div>
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Reset Configuration</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">This will clear all local application settings, including your API Key, Client ID, and Spreadsheet ID, and sign you out.</p>
                        </div>
                        <button
                            onClick={() => openConfirmationModal('Are you sure?', 'This will clear all local configuration and sign you out. You will need to complete the setup wizard again.', handleResetConfiguration)}
                            className="px-4 py-2 font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 whitespace-nowrap"
                        >
                            Reset Configuration
                        </button>
                    </div>
                </div>
            </div>
            {error && <p className="text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-md mt-4">{error}</p>}
            
             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalContent.title}>
                 <p className="text-gray-600 dark:text-gray-300 mb-6">{modalContent.body}</p>
                 <div className="flex justify-end gap-3">
                     <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 rounded-lg hover:bg-gray-300">Cancel</button>
                     <button onClick={modalContent.onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Confirm</button>
                 </div>
             </Modal>
        </div>
    );
};

export default AdminPage;
