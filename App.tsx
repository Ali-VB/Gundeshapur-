import React, { useState, useEffect, useCallback } from 'react';
import type { UserProfile } from './types';
import { initGoogleScripts, signIn, signOut, configureGoogleApi } from './services/google';

import LoginPage from './components/LoginPage';
import SetupPage from './components/SetupPage';
import Layout from './components/Layout';
import Spinner from './components/common/Spinner';
import ConfigurationWizard from './components/ConfigurationWizard';

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
  const [apiKey, setApiKey] = useState<string | null>(localStorage.getItem('googleApiKey'));
  const [clientId, setClientId] = useState<string | null>(localStorage.getItem('googleClientId'));
  const isConfigured = !!(apiKey && clientId);
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isGapiLoaded, setIsGapiLoaded] = useState(false);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(
    localStorage.getItem('spreadsheetId')
  );
  const [isLoading, setIsLoading] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleConfigurationComplete = (key: string, id: string) => {
    localStorage.setItem('googleApiKey', key);
    localStorage.setItem('googleClientId', id);
    setApiKey(key);
    setClientId(id);
    setInitializationError(null); // Clear any previous errors
    setShowWizard(false); // Hide the wizard and return to login page
    // Reset loading state to re-trigger initialization
    setIsLoading(true);
  };

  const handleSignOut = useCallback(() => {
    signOut();
    setUser(null);
  }, []);

  const handleResetConfiguration = () => {
    handleSignOut(); // Signs out and clears user state
    setSpreadsheetId(null); // Clear sheet state
    localStorage.removeItem('spreadsheetId'); // Clear sheet from storage
    localStorage.removeItem('googleApiKey');
    localStorage.removeItem('googleClientId');
    setApiKey(null);
    setClientId(null);
    setInitializationError(null);
    setLoginError(null);
  };

  useEffect(() => {
    const initialize = async () => {
      if (!isConfigured || !apiKey || !clientId) {
        setIsLoading(false);
        return;
      }
      try {
        configureGoogleApi(apiKey, clientId);
        await initGoogleScripts();
        setIsGapiLoaded(true);
        
        // Attempt a silent sign-in on page load
        const silentUser = await signIn({ prompt: '' });
        if (silentUser) {
          setUser(silentUser);
        }

      } catch (error) {
        console.error("Failed to initialize Google scripts:", error);
        const errorMessage = `Failed to initialize Google services. This is likely due to an invalid API Key or Client ID, or because the key is not correctly restricted to this website's URL (${window.location.origin}). Please double-check your Google Cloud project configuration.`;
        setInitializationError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, [isConfigured, apiKey, clientId]);

  const handleSignIn = async () => {
    setLoginError(null);
    if (!isConfigured) {
      setLoginError('Application is not configured. Please complete the setup wizard first.');
      return;
    }

    if (!isGapiLoaded) return;
    setIsLoading(true);
    try {
      // Interactive sign-in will now remember the last used account.
      const profile = await signIn();
      if (profile) {
        setUser(profile);
      }
    } catch (error) {
      console.error("Sign in failed", error);
      alert('Sign in failed. Please check your configuration and allow popups.');
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
  
  if (isLoading && !user) {
     return (
        <div className="flex h-screen w-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
            <Spinner />
        </div>
    );
  }
  
  if (showWizard) {
      return <ConfigurationWizard onComplete={handleConfigurationComplete} onCancel={() => setShowWizard(false)} />;
  }

  return (
    <AppStateContext.Provider value={contextValue}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {!user ? (
          <LoginPage 
            onSignIn={handleSignIn} 
            initializationError={initializationError}
            loginError={loginError}
            onSetup={() => {
              setLoginError(null);
              setShowWizard(true);
            }}
          />
        ) : !spreadsheetId ? (
          <SetupPage />
        ) : (
          <Layout />
        )}
      </div>
    </AppStateContext.Provider>
  );
};

export default App;
