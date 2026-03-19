import { useState, useCallback } from 'react';
import { useStore } from '../store/useStore';

const CLIENT_ID = '608489051623-a0rhqv9tcddha9smovk3rninvikq5uc0.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.email';
const FILE_NAME = 'matrix_fitness_backup.json';

export function useGoogleDrive() {
  const [isSyncing, setIsSyncing] = useState(false);
  const { googleEmail, googleToken, googleTokenExpiry, setGoogleAuth } = useStore();

  const getValidToken = useCallback((forcePrompt = false): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Use local storage cached token if it's still alive (bypass Google scripts entirely)
      if (!forcePrompt && googleToken && Date.now() < googleTokenExpiry) {
        return resolve(googleToken);
      }

      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          hint: googleEmail || undefined, // use hint if we already know who they are
          prompt: forcePrompt ? 'consent' : '', // '' tries silent invisible refresh if already authorized
          callback: async (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              const token = tokenResponse.access_token;
              const expiry = Date.now() + (tokenResponse.expires_in * 1000) - 60000;
              
              // If we didn't have an email stored yet, fetch it
              let fetchedEmail = googleEmail;
              if (!fetchedEmail) {
                try {
                  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  if (userInfoRes.ok) {
                    const userInfo = await userInfoRes.json();
                    fetchedEmail = userInfo.email;
                  }
                } catch (e) {
                  // non-blocking
                }
              }
              
              setGoogleAuth(fetchedEmail, token, expiry);
              resolve(token);
            } else {
              if (forcePrompt) setGoogleAuth(null, null, 0);
              reject(new Error('Failed to obtain access token'));
            }
          },
          error_callback: (err: any) => {
             // If silent prompt fails, we wipe the token state so they have to connect again
             if (err.type === 'tokenFailed' && !forcePrompt) {
               setGoogleAuth(null, null, 0);
             }
             reject(err);
          }
        });
        
        client.requestAccessToken();
      } catch (err) {
        reject(err);
      }
    });
  }, [googleEmail, googleToken, googleTokenExpiry, setGoogleAuth]);

  const connect = async () => {
    setIsSyncing(true);
    try {
      await getValidToken(true); // force consent screen to connect immediately
    } catch (err: any) {
      console.error('Connection failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const disconnect = () => {
    setGoogleAuth(null, null, 0);
  };

  const getBackupFileId = async (accessToken: string) => {
    const query = encodeURIComponent(`name='${FILE_NAME}' and 'appDataFolder' in parents and trashed=false`);
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&spaces=appDataFolder`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const result = await response.json();
    return result.files && result.files.length > 0 ? result.files[0].id : null;
  };

  const uploadToDrive = useCallback(async () => {
    setIsSyncing(true);
    try {
      const accessToken = await getValidToken(false);
      const existingFileId = await getBackupFileId(accessToken);
      
      const storeState = useStore.getState();
      const backupData = JSON.stringify({
        isOnboarded: storeState.isOnboarded,
        profile: storeState.profile,
        goals: storeState.goals,
        targets: storeState.targets,
        history: storeState.history,
        customKeys: storeState.customKeys,
      });

      const blob = new Blob([backupData], { type: 'application/json' });
      
      // Drive API restricts changing parents array on PATCH updates
      const metadata: any = { name: FILE_NAME };
      if (!existingFileId) {
        metadata.parents = ['appDataFolder'];
      }

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', blob);

      const url = existingFileId 
        ? `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`
        : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

      const res = await fetch(url, {
        method: existingFileId ? 'PATCH' : 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form
      });

      if (!res.ok) throw new Error('Failed to upload backup');
      alert('Secure Backup successful!');
    } catch (err: any) {
       console.error(err);
       if (err.message) alert('Sync Error: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  }, [getValidToken]);

  const downloadFromDrive = useCallback(async () => {
    setIsSyncing(true);
    try {
      const accessToken = await getValidToken(false);
      const fileId = await getBackupFileId(accessToken);

      if (!fileId) {
        alert('No backup file found in your Google Drive AppData.');
        setIsSyncing(false);
        return;
      }

      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!res.ok) throw new Error('Failed to download backup data');
      
      const data = await res.json();
      
      useStore.setState({
        isOnboarded: data.isOnboarded,
        profile: data.profile,
        goals: data.goals,
        targets: data.targets,
        history: data.history || {},
        customKeys: data.customKeys || [],
        googleEmail: googleEmail, // preserve current auth
        googleToken: googleToken,
        googleTokenExpiry: googleTokenExpiry
      });

      alert('Data restored successfully!');
    } catch (err: any) {
       console.error(err);
       if (err.message) alert('Restore Error: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  }, [getValidToken, googleEmail, googleToken, googleTokenExpiry]);

  return { uploadToDrive, downloadFromDrive, connect, disconnect, isSyncing, googleEmail };
}
