
import React, { useState } from 'react';
import { ICONS } from '../constants';

interface WizardProps {
    onComplete: (apiKey: string, clientId: string) => void;
    onCancel: () => void;
}

const ConfigurationWizard: React.FC<WizardProps> = ({ onComplete, onCancel }) => {
    const [step, setStep] = useState(1);
    const [apiKey, setApiKey] = useState('');
    const [clientId, setClientId] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (!apiKey.trim() || !clientId.trim()) {
            setError('Both API Key and Client ID are required.');
            return;
        }
        setError('');
        onComplete(apiKey, clientId);
    }

    const appOrigin = window.location.origin;

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">One-Time Setup</h1>
                        <p className="text-gray-600 dark:text-gray-300 mb-8">Let's connect the app to your Google Account. This process will take about 5 minutes and only needs to be done once.</p>
                        <div className="mt-8 flex flex-col-reverse sm:flex-row-reverse gap-4">
                            <button onClick={() => setStep(2)} className="w-full px-6 py-3 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                                Get Started
                            </button>
                             <button onClick={onCancel} className="w-full px-6 py-3 font-medium text-gray-700 bg-gray-200 dark:bg-gray-600 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                                Cancel
                            </button>
                        </div>
                    </>
                );
            case 2:
                return (
                    <>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Step 1: Setup Google Cloud</h1>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">First, you need to create a project and enable the necessary APIs in Google Cloud. This allows the app to securely access your sheets.</p>
                        <ol className="text-left space-y-4 text-gray-700 dark:text-gray-300">
                            <li>
                                <a href="https://console.cloud.google.com/projectcreate" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">Click here to open the Google Cloud Console</a>, and create a new project. Name it something like "Gundeshapur Library".
                            </li>
                            <li>
                                After creating the project, <a href="https://console.cloud.google.com/apis/library/sheets.googleapis.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">click here to find the Google Sheets API</a>, and click the "Enable" button.
                            </li>
                            <li>
                                Next, <a href="https://console.cloud.google.com/apis/library/drive.googleapis.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">click here for the Google Drive API</a>, and also click "Enable".
                            </li>
                        </ol>
                        <div className="mt-8 flex justify-between items-center">
                            <button onClick={() => setStep(1)} className="px-4 py-2 font-medium text-gray-600 bg-gray-200 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">Back</button>
                            <button onClick={() => setStep(3)} className="px-6 py-3 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">I've done this, Next</button>
                        </div>
                    </>
                );
            case 3:
                return (
                    <>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Step 2: Create & Enter Credentials</h1>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">Now, create credentials so the app can use the APIs you just enabled. These are like passwords for your project.</p>
                        
                        <div className="text-left space-y-4">
                            <details className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer" open>
                                <summary className="font-semibold text-gray-800 dark:text-gray-200">1. Get & Restrict API Key</summary>
                                <ol className="list-decimal list-inside mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                    <li><a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">Open the Credentials page</a>.</li>
                                    <li>Click <strong>+ CREATE CREDENTIALS</strong> at the top and select <strong>API key</strong>.</li>
                                    <li>Copy the new key and paste it into the "API Key" field below.</li>
                                    <li>Click <strong>EDIT API KEY</strong>. Under <i>Application restrictions</i>, select <strong>Websites</strong>.</li>
                                    <li>Under <i>Website restrictions</i>, click <strong>ADD</strong> and enter your app's address: <code className="bg-gray-200 dark:bg-gray-600 rounded px-1 font-mono">{appOrigin}</code></li>
                                    <li>Click <strong>DONE</strong>, and then click <strong>SAVE</strong>.</li>
                                </ol>
                            </details>

                            <details className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer">
                                <summary className="font-semibold text-gray-800 dark:text-gray-200">2. Get OAuth Client ID</summary>
                                 <ol className="list-decimal list-inside mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                    <li>Go to the <a href="https://console.cloud.google.com/apis/credentials/consent" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">OAuth consent screen</a>. If status is "Testing", click <strong>PUBLISH APP</strong>.</li>
                                    <li>Go back to the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">Credentials page</a>.</li>
                                    <li>Click <strong>+ CREATE CREDENTIALS</strong> and select <strong>OAuth client ID</strong>.</li>
                                    <li>For "Application type", choose <strong>Web application</strong>.</li>
                                    <li>Under "Authorized JavaScript origins", click <strong>+ ADD URI</strong> and enter: <code className="bg-gray-200 dark:bg-gray-600 rounded px-1 font-mono">{appOrigin}</code></li>
                                    <li>Under "Authorized redirect URIs", click <strong>+ ADD URI</strong> and enter the <strong>same address</strong> again: <code className="bg-gray-200 dark:bg-gray-600 rounded px-1 font-mono">{appOrigin}</code></li>
                                    <li>Click <strong>CREATE</strong>. Copy the Client ID and paste it into the field below.</li>
                                </ol>
                            </details>
                            
                            <div className="space-y-3 mt-4">
                                <input type="text" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Paste your API Key here" className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500" />
                                <input type="text" value={clientId} onChange={e => setClientId(e.target.value)} placeholder="Paste your OAuth Client ID here" className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                        </div>
                         {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                        <div className="mt-8 flex justify-between items-center">
                            <button onClick={() => setStep(2)} className="px-4 py-2 font-medium text-gray-600 bg-gray-200 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">Back</button>
                            <button onClick={handleSubmit} className="px-6 py-3 font-medium text-white bg-green-600 rounded-lg hover:bg-green-700">Save & Connect</button>
                        </div>
                    </>
                );
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
            <div className="p-8 sm:p-10 bg-white dark:bg-gray-800 rounded-2xl shadow-xl text-center max-w-2xl w-full">
                 <div className="flex justify-center mb-6">
                    <div className="bg-blue-600 text-white rounded-xl p-3">
                        {React.cloneElement(ICONS.BOOKS, { className: "w-10 h-10" })}
                    </div>
                 </div>
                {renderStep()}
            </div>
        </div>
    );
};

export default ConfigurationWizard;
