
import React, { useState, useEffect, useCallback } from 'react';
import type { UserProfile } from './types';
import { initGoogleScripts, signIn, signOut, configureGoogleApi } from './services/google';

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
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

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
    const savedAdminEmail = localStorage.getItem('adminEmail');
    const savedSpreadsheetId = localStorage.getItem('spreadsheetId');
    
    setApiKey(savedApiKey);
    setClientId(savedClientId);
    setAdminEmail(savedAdminEmail);
    setSpreadsheetId(savedSpreadsheetId);

    const isConfigured = !!(savedApiKey && savedClientId && savedAdminEmail);

    const initialize = async () => {
      if (!isConfigured) {
        setIsLoading(false);
        return;
      }
      try {
        configureGoogleApi(savedApiKey!, savedClientId!);
        await initGoogleScripts();
        setIsGapiLoaded(true);
        
        const silentUser = await signIn({ prompt: '' });
        if (silentUser) {
          setUser(silentUser);
          if (silentUser.email === savedAdminEmail) {
            setAppMode('admin');
          } else {
            setAppMode('user');
          }
        }
      } catch (error) {
        console.error("Failed to initialize Google scripts:", error);
        const errorMessage = `Failed to initialize Google services. This is likely due to an invalid API Key or Client ID. Please double-check your Google Cloud project configuration.`;
        setInitializationError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  const handleConfigurationComplete = (key: string, id: string, email: string) => {
    localStorage.setItem('googleApiKey', key);
    localStorage.setItem('googleClientId', id);
    localStorage.setItem('adminEmail', email);
    setApiKey(key);
    setClientId(id);
    setAdminEmail(email);
    setInitializationError(null);
    setShowWizard(false);
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
    localStorage.removeItem('adminEmail');
    setApiKey(null);
    setClientId(null);
    setAdminEmail(null);
    setInitializationError(null);
    setLoginError(null);
  };

  const handleSignIn = async (mode: 'user' | 'admin') => {
    setLoginError(null);
    const isConfigured = !!(apiKey && clientId && adminEmail);

    if (!isConfigured) {
      setLoginError('Application is not configured. Please complete the setup wizard first.');
      return;
    }

    if (!isGapiLoaded) return;
    setIsLoading(true);
    try {
      const profile = await signIn();
      if (profile) {
        if (mode === 'admin') {
          if (profile.email === adminEmail) {
            setUser(profile);
            setAppMode('admin');
          } else {
            setLoginError('Access Denied: This Google account is not authorized for admin access.');
            signOut(); // Immediately sign out the unauthorized user.
          }
        } else { // mode === 'user'
          setUser(profile);
          setAppMode('user');
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
  
  const isConfigured = !!(apiKey && clientId && adminEmail);

  return (
    <AppStateContext.Provider value={contextValue}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {!user ? (
          <LoginPage
            onUserSignIn={() => handleSignIn('user')}
            onAdminSignIn={() => handleSignIn('admin')}
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
          // Fallback if mode is not set for some reason
           <div className="flex h-screen w-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
             <p>An unexpected error occurred. Please try resetting configuration.</p>
             <button onClick={handleResetConfiguration}>Reset</button>
           </div>
        )}
      </div>
    </AppStateContext.Provider>
  );
};

export default App;
