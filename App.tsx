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
}>({
  user: null,
  spreadsheetId: null,
  setSpreadsheetId: () => {},
  handleSignOut: () => {},
});

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(localStorage.getItem('googleApiKey'));
  const [clientId, setClientId] = useState<string | null>(localStorage.getItem('googleClientId'));
  const [isConfigured, setIsConfigured] = useState(!!(apiKey && clientId));
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isGapiLoaded, setIsGapiLoaded] = useState(false);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(
    localStorage.getItem('spreadsheetId')
  );
  const [isLoading, setIsLoading] = useState(true);

  const handleConfigurationComplete = (key: string, id: string) => {
    localStorage.setItem('googleApiKey', key);
    localStorage.setItem('googleClientId', id);
    setApiKey(key);
    setClientId(id);
    setIsConfigured(true);
    // Reset loading state to re-trigger initialization
    setIsLoading(true);
  };

  const handleSignOut = useCallback(() => {
    signOut();
    setUser(null);
    setSpreadsheetId(null);
    localStorage.removeItem('spreadsheetId');
  }, []);

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
      } catch (error) {
        console.error("Failed to initialize Google scripts:", error);
        localStorage.removeItem('googleApiKey');
        localStorage.removeItem('googleClientId');
        setIsConfigured(false);
        alert("Failed to initialize Google services with the provided credentials. Please check them and try again.");
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, [isConfigured, apiKey, clientId]);

  const handleSignIn = async () => {
    if (!isGapiLoaded) return;
    setIsLoading(true);
    try {
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
  };
  
  if (isLoading) {
     return (
        <div className="flex h-screen w-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
            <Spinner />
        </div>
    );
  }
  
  if (!isConfigured) {
      return <ConfigurationWizard onComplete={handleConfigurationComplete} />;
  }

  return (
    <AppStateContext.Provider value={contextValue}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {!user ? (
          <LoginPage onSignIn={handleSignIn} />
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
