
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
  const [loginError, setLoginError] = useState<string | null>(null);
  const [appMode, setAppMode] = useState<'user' | 'admin' | null>(null);

  useEffect(() => {
    // Load config from localStorage on initial mount
    const savedApiKey = localStorage.getItem('googleApiKey');
    const savedClientId = localStorage.getItem('googleClientId');
    const savedSpreadsheetId = localStorage.getItem('spreadsheetId');
    
    setApiKey(savedApiKey);
    setClientId(savedClientId);
    setSpreadsheetId(savedSpreadsheetId);

    const isConfigured = !!(savedApiKey && savedClientId);

    const initialize = async () => {
      // We must have a client ID to attempt sign-in. API key is for sheets.
      // If client ID is missing, we can't do anything, just wait for user to enter wizard.
      if (!savedClientId) {
          setIsLoading(false);
          return;
      }
      
      try {
        // Configure the google service with whatever credentials we have.
        // The service is designed to handle a missing API key for admin login.
        configureGoogleApi(savedApiKey, savedClientId);
        await initGoogleScripts();
        setIsGapiLoaded(true);
        
        // Attempt a silent sign-in
        const silentUser = await signIn({ prompt: '' });
        if (silentUser) {
          // Check if the signed-in user is the super admin
          if (silentUser.email === SUPER_ADMIN_EMAIL) {
            setUser(silentUser);
            setAppMode('admin');
          } else if (isConfigured) {
            // If it's a regular user, they can only proceed if the app is fully configured
            setUser(silentUser);
            setAppMode('user');
          }
        }
      } catch (error) {
        console.error("Failed to initialize Google scripts:", error);
        const errorMessage = `Failed to initialize Google services. This is likely due to an invalid Client ID. Please double-check your Google Cloud project configuration.`;
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
    setLoginError(null);
  };

  const handleSignIn = async () => {
    setLoginError(null);
    
    // Sign-in can be attempted even without full config, for the admin.
    // The google service needs to be loaded, which requires a client ID.
    if (!isGapiLoaded) {
      setLoginError("Application is not configured. Please complete the setup wizard.");
      return;
    }

    setIsLoading(true);
    try {
      const profile = await signIn();
      if (profile) {
        // Automatic role detection
        if (profile.email === SUPER_ADMIN_EMAIL) {
          setUser(profile);
          setAppMode('admin');
        } else {
          // For regular users, check if the app is configured.
          const isConfigured = !!(apiKey && clientId);
          if (isConfigured) {
            setUser(profile);
            setAppMode('user');
          } else {
            // This case should ideally not be hit if the button is disabled, but is a safeguard.
            signOut();
            setLoginError("Application is not configured. Please complete the setup wizard before signing in.");
          }
        }
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
            isConfigured={isConfigured}
          />
        ) : appMode === 'admin' ? (
          <AdminLayout />
        ) : appMode === 'user' ? (
          !spreadsheetId ? (
            <SetupPage />
          ) : (
            <UserLayout />
          )
        ) : (
           // Fallback if mode is not set for some reason, e.g. a non-admin user logs in on an unconfigured app
           <div className="flex h-screen w-screen items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
             <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold mb-4">Login Error</h2>
                <p>Could not determine application state. This might happen if you are trying to log in as a regular user before the application is configured.</p>
                <div className="mt-6 flex gap-4 justify-center">
                    <button onClick={handleSignOut} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg">Sign Out</button>
                    <button onClick={handleResetConfiguration} className="px-4 py-2 bg-red-600 text-white rounded-lg">Reset Config</button>
                </div>
             </div>
           </div>
        )}
      </div>
    </AppStateContext.Provider>
  );
};

export default App;
