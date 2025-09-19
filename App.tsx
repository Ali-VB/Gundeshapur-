
import React, { useState, useEffect, useCallback } from 'react';
import type { UserProfile } from './types';
import { initGoogleScripts, signIn, signOut, configureGoogleApi } from './services/google';
import { SUPER_ADMIN_EMAIL } from './constants';

import LoginPage from './components/LoginPage';
import SetupPage from './components/SetupPage';
import UserLayout from './components/Layout';
import Spinner from './components/common/Spinner';
import ConfigurationWizard from './components/ConfigurationWizard';
import AdminLayout from './components/admin/AdminLayout';
import WelcomePage from './components/WelcomePage';

export const AppStateContext = React.createContext<{
  user: UserProfile | null;
  spreadsheetId: string | null;
  setSpreadsheetId: (id: string | null) => void;
  handleSignOut: () => void;
  handleResetConfiguration: () => void;
}>({
  user: null,
  spreadsheetId: null,
  setSpreadsheetId: () => {},
  handleSignOut: () => {},
  handleResetConfiguration: () => {},
});

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isGapiLoaded, setIsGapiLoaded] = useState(false);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [appMode, setAppMode] = useState<'user' | 'admin' | null>(null);

  useEffect(() => {
    // Load config from localStorage on initial mount
    const savedApiKey = localStorage.getItem('googleApiKey');
    const savedClientId = localStorage.getItem('googleClientId');
    const savedSpreadsheetId = localStorage.getItem('spreadsheetId');
    
    setApiKey(savedApiKey);
    setClientId(savedClientId);
    setSpreadsheetId(savedSpreadsheetId);

    const initialize = async () => {
      // We must have a client ID to attempt sign-in, even for an admin.
      // If client ID is missing, we can't do anything but wait for a user to configure.
      // But we will allow the login page to show.
      if (!savedClientId) {
          setIsLoading(false);
          return;
      }
      
      try {
        configureGoogleApi(savedApiKey, savedClientId);
        await initGoogleScripts();
        setIsGapiLoaded(true);
        
        const silentUser = await signIn({ prompt: '' });
        if (silentUser) {
          if (silentUser.email === SUPER_ADMIN_EMAIL) {
            setUser(silentUser);
            setAppMode('admin');
          } else {
            setUser(silentUser);
            setAppMode('user');
          }
        }
      } catch (error) {
        console.error("Failed to initialize Google scripts:", error);
        const errorMessage = `Failed to initialize Google services. This is likely due to an invalid Client ID saved in your browser. Please try resetting the configuration.`;
        setInitializationError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  const handleConfigurationComplete = (key: string, id: string) => {
    localStorage.setItem('googleApiKey', key);
    localStorage.setItem('googleClientId', id);
    setApiKey(key);
    setClientId(id);
    setInitializationError(null);
    setShowWizard(false);
    // Reload to re-initialize with the new credentials
    window.location.reload();
  };
  
  const handleSignOut = useCallback(() => {
    signOut();
    setUser(null);
    setAppMode(null);
  }, []);

  const handleResetConfiguration = () => {
    handleSignOut();
    setSpreadsheetId(null);
    localStorage.removeItem('spreadsheetId');
    localStorage.removeItem('googleApiKey');
    localStorage.removeItem('googleClientId');
    setApiKey(null);
    setClientId(null);
    setInitializationError(null);
    setShowWizard(false);
  };

  const handleSignIn = async () => {
    // Always allow sign-in attempt. The app will route the user based on their role and config status.
    setIsLoading(true);
    try {
      const profile = await signIn();
      if (profile) {
        if (profile.email === SUPER_ADMIN_EMAIL) {
          setUser(profile);
          setAppMode('admin');
        } else {
          setUser(profile);
          setAppMode('user');
        }
      }
    } catch (error) {
      console.error("Sign in failed", error);
      alert('Sign in failed. Please check your browser console and ensure popups are allowed.');
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue = {
    user,
    spreadsheetId,
    setSpreadsheetId: (id: string | null) => {
      if (id) {
        localStorage.setItem('spreadsheetId', id);
      } else {
        localStorage.removeItem('spreadsheetId');
      }
      setSpreadsheetId(id);
    },
    handleSignOut,
    handleResetConfiguration,
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Spinner />
      </div>
    );
  }

  if (showWizard) {
    return <ConfigurationWizard onComplete={handleConfigurationComplete} onCancel={() => setShowWizard(false)} />;
  }
  
  const isConfigured = !!(apiKey && clientId);

  const renderContent = () => {
    if (!user) {
      return <LoginPage onSignIn={handleSignIn} initializationError={initializationError} />;
    }

    if (appMode === 'admin') {
      return <AdminLayout />;
    }

    if (appMode === 'user') {
      if (!isConfigured) {
        return <WelcomePage onStartSetup={() => setShowWizard(true)} />;
      }
      if (!spreadsheetId) {
        return <SetupPage />;
      }
      return <UserLayout />;
    }

    // Fallback for any unexpected state
    return <LoginPage onSignIn={handleSignIn} initializationError="An unexpected error occurred. Please try signing in again." />;
  };

  return (
    <AppStateContext.Provider value={contextValue}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {renderContent()}
      </div>
    </AppStateContext.Provider>
  );
};

export default App;
