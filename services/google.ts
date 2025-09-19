import { GOOGLE_SCOPES, SHEET_CONFIG } from '../constants';
import type { UserProfile } from '../types';

declare global {
  interface Window {
    gapi: any;
    google: any;
    tokenClient: any;
  }
}

let gapiInited = false;
let gisInited = false;
let apiKey: string | null = null;
let clientId: string | null = null;

export const configureGoogleApi = (key: string, id: string) => {
    apiKey = key;
    clientId = id;
};

export const initGoogleScripts = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!apiKey || !clientId) {
      return reject("Google API key and Client ID are not configured.");
    }
    const start = () => {
      if (gapiInited && gisInited) {
        resolve();
      }
    };

    window.gapi.load('client', () => {
      window.gapi.client.init({
        apiKey: apiKey,
        discoveryDocs: [
          'https://sheets.googleapis.com/$discovery/rest?version=v4',
          'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
        ],
      }).then(() => {
        gapiInited = true;
        start();
      }).catch(reject);
    });
    
    window.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: GOOGLE_SCOPES,
        callback: '', // defined at call time
    });
    gisInited = true;
    start();
  });
};

export const signIn = (): Promise<UserProfile | null> => {
    return new Promise((resolve, reject) => {
        const callback = async (res: any) => {
            if (res.error) {
                return reject(res);
            }
            try {
                const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { 'Authorization': `Bearer ${window.gapi.client.getToken().access_token}` }
                });
                const profile = await response.json();
                resolve({
                    id: profile.sub,
                    name: profile.name,
                    email: profile.email,
                    imageUrl: profile.picture,
                });
            } catch (error) {
                reject(error);
            }
        };

        window.tokenClient.callback = callback;
        
        if (window.gapi.client.getToken() === null) {
            window.tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            window.tokenClient.requestAccessToken({ prompt: '' });
        }
    });
};

export const signOut = () => {
  const token = window.gapi.client.getToken();
  if (token !== null) {
    window.google.accounts.oauth2.revoke(token.access_token, () => {});
    window.gapi.client.setToken(null);
  }
};

const arrayToObjects = <T,>(data: any[][], headers: string[]): T[] => {
    if (!data || data.length < 2) return [];
    const headerRow = data[0]; // actual headers in sheet
    const realHeaders = headers.map(h => h.toLowerCase()); // expected headers
    const headerMap = realHeaders.map(header => headerRow.findIndex(h => h.toLowerCase() === header));

    return data.slice(1).map((row, rowIndex) => {
        const obj: any = { row: rowIndex + 2 }; // +2 because sheet is 1-indexed and we sliced header
        headers.forEach((header, index) => {
            const columnIndex = headerMap[index];
            if (columnIndex !== -1) {
                const val = row[columnIndex];
                if (header.includes('copies') || header.includes('amount') || header.includes('days')) {
                    obj[header] = Number(val) || 0;
                } else if (header.includes('is_')) {
                    obj[header] = val === 'TRUE' || val === true;
                } else {
                    obj[header] = val;
                }
            } else {
                obj[header] = undefined;
            }
        });
        return obj as T;
    });
};


export const getSheetData = async <T,>(spreadsheetId: string, sheetName: string, headers: string[]): Promise<T[]> => {
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: sheetName,
    });
    return arrayToObjects<T>(response.result.values, headers);
};

export const createNewSheet = async (title: string) => {
    const spreadsheet = await window.gapi.client.sheets.spreadsheets.create({
        properties: {
            title: title,
        },
        sheets: [
            { properties: { title: SHEET_CONFIG.BOOKS.name } },
            { properties: { title: SHEET_CONFIG.USERS.name } },
            { properties: { title: SHEET_CONFIG.LOANS.name } },
        ],
    });

    const spreadsheetId = spreadsheet.result.spreadsheetId;

    await window.gapi.client.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        resource: {
            valueInputOption: 'USER_ENTERED',
            data: [
                { range: `${SHEET_CONFIG.BOOKS.name}!A1`, values: [SHEET_CONFIG.BOOKS.headers] },
                { range: `${SHEET_CONFIG.USERS.name}!A1`, values: [SHEET_CONFIG.USERS.headers] },
                // Fix: Corrected typo from SHEOT_CONFIG to SHEET_CONFIG
                { range: `${SHEET_CONFIG.LOANS.name}!A1`, values: [SHEET_CONFIG.LOANS.headers] },
            ]
        }
    });
    return spreadsheetId;
};

export const validateSheet = async (spreadsheetId: string): Promise<boolean> => {
  try {
    const response = await window.gapi.client.sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
    });
    const sheetNames = response.result.sheets.map((s: any) => s.properties.title);
    const hasBooks = sheetNames.includes(SHEET_CONFIG.BOOKS.name);
    const hasUsers = sheetNames.includes(SHEET_CONFIG.USERS.name);
    const hasLoans = sheetNames.includes(SHEET_CONFIG.LOANS.name);
    
    // a full validation would check headers too, but this is good for the MVP
    return hasBooks && hasUsers && hasLoans;
  } catch (error) {
    console.error("Sheet validation failed", error);
    return false;
  }
};


export const appendRow = async (spreadsheetId: string, sheetName: string, row: any[]) => {
    return await window.gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId,
        range: sheetName,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [row]
        }
    });
};


export const updateCell = async (spreadsheetId: string, range: string, value: any) => {
    return await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [[value]]
        }
    });
};