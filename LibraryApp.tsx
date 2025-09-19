
import React, { useState, useEffect, useContext } from 'react';
import SetupPage from './components/SetupPage';
import UserLayout from './components/Layout';
import { AppStateContext } from './App';

export const LibraryContext = React.createContext<{
    spreadsheetId: string | null;
    setSpreadsheetId: (id: string | null) => void;
}>({
    spreadsheetId: null,
    setSpreadsheetId: () => {},
});

const LibraryApp: React.FC = () => {
    const { user } = useContext(AppStateContext);
    const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);

    useEffect(() => {
        const savedSpreadsheetId = localStorage.getItem('spreadsheetId');
        if (savedSpreadsheetId) {
            setSpreadsheetId(savedSpreadsheetId);
        }
    }, []);

    const handleSetSpreadsheetId = (id: string | null) => {
        if (id) {
            localStorage.setItem('spreadsheetId', id);
        } else {
            localStorage.removeItem('spreadsheetId');
        }
        setSpreadsheetId(id);
    };

    const contextValue = {
        spreadsheetId,
        setSpreadsheetId: handleSetSpreadsheetId,
    };
    
    // This check is a safeguard, but LibraryApp should only be rendered if user is present.
    if (!user) {
        return null; 
    }

    return (
        <LibraryContext.Provider value={contextValue}>
            {!spreadsheetId ? <SetupPage /> : <UserLayout />}
        </LibraryContext.Provider>
    );
};

export default LibraryApp;
