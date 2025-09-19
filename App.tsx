
import React, { useState, useEffect, useCallback } from 'react';
import type { UserProfile } from './types';
import { initSignIn, initGapiClient, signIn, signOut } from './services/google';
import { SUPER_ADMIN_EMAIL } from './constants';

import LoginPage from './components/LoginPage';
import WelcomePage from './components/WelcomePage';
import ConfigurationWizard from './components/ConfigurationWizard';
import LibraryApp from './LibraryApp'; // New component to handle the configured user's experience
import Spinner from './components/common/Spinner';
import AdminLayout from './components/admin/AdminLayout';

export const AppStateContext = React.createContext<{
  user: UserProfile | null;
  handleSignOut: () => void;
  handleResetConfiguration: () => void;
}>({
  user: null,
  handleSignOut: () => {},
  handleResetConfiguration: () => {},
});

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userApiKey, setUserApiKey] = useState<string | null>(null);
  const [userClientId, setUserClientId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [appMode, setAppMode] = useState<'user' | 'admin' | null>(null);

  // Load credentials from local storage on initial mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('userApiKey');
    const savedClientId = localStorage.getItem('userClientId');
    if (savedApiKey && savedClientId) {
      setUserApiKey(savedApiKey);
      setUserClientId(savedClientId);
    }
  }, []);
  
  // Initialize Google services when credentials change
  useEffect(() => {
    const initialize = async () => {
      try {
        // Init sign-in for everyone, if client ID is available
        if (userClientId) {
            await initSignIn(userClientId);
        }
        
        // Init GAPI client for API calls, if API key is available
        if (userApiKey) {
            await initGapiClient(userApiKey);
        }

        // Attempt silent sign-in only if the client ID is configured
        if (userClientId) {
            const silentUser = await signIn({ prompt: '' });
             if (silentUser) {
              handleUserLogin(silentUser);
            }
        }
      } catch (error: any) {
        console.error("Initialization failed:", error);
        // Don't block the UI for initialization errors, let the user try to sign in or configure.
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, [userApiKey, userClientId]);

  const handleUserLogin = (profile: UserProfile) => {
    setUser(profile);
    if (profile.email === SUPER_ADMIN_EMAIL) {
      setAppMode('admin');
    } else {
      setAppMode('user');
    }
  };
  
  const handleSignIn = async () => {
    if (!userClientId) {
        alert("Application is not configured. Please complete the setup wizard first.");
        setShowWizard(true);
        return;
    }
    setIsLoading(true);
    try {
      const profile = await signIn();
      if (profile) {
        handleUserLogin(profile);
      }
    } catch (error) {
      console.error("Sign in failed", error);
      alert('Sign in failed. Please ensure popups are allowed and your Client ID is correct.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSignOut = useCallback(() => {
    if (window.gapi?.client) signOut();
    setUser(null);
    setAppMode(null);
  }, []);

  const handleResetConfiguration = () => {
    localStorage.removeItem('userApiKey');
    localStorage.removeItem('userClientId');
    localStorage.removeItem('spreadsheetId');
    setUserApiKey(null);
    setUserClientId(null);
    setShowWizard(false);
  };

  const handleConfigComplete = (apiKey: string, clientId: string) => {
      localStorage.setItem('userApiKey', apiKey);
      localStorage.setItem('userClientId', clientId);
      setUserApiKey(apiKey);
      setUserClientId(clientId);
      setShowWizard(false);
  };
  
  const contextValue = {
    user,
    handleSignOut,
    handleResetConfiguration,
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
          <Spinner />
        </div>
      );
    }

    if (!user) {
      return <LoginPage onSignIn={handleSignIn} />;
    }

    if (appMode === 'admin') {
      return <AdminLayout />;
    }

    if (appMode === 'user') {
      if (showWizard) {
        return <ConfigurationWizard onComplete={handleConfigComplete} onCancel={() => setShowWizard(false)} />;
      }
      if (!userApiKey || !userClientId) {
        return <WelcomePage onStartSetup={() => setShowWizard(true)} />;
      }
      return <LibraryApp />;
    }
    
    // Default fallback to login page
    return <LoginPage onSignIn={handleSignIn} />;
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
