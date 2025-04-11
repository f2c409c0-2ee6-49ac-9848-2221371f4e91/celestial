import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { RefreshCw } from 'lucide-react';

export const UpdateNotification = () => {
  const [updateState, setUpdateState] = useState<{
    available: boolean;
    downloading: boolean;
    downloaded: boolean;
    status: string;
    error: string;
    installing: boolean;
  }>({
    available: false,
    downloading: false,
    downloaded: false,
    status: '',
    error: '',
    installing: false
  });

  useEffect(() => {
    // Only set up event listeners, no manual check
    const cleanup = [
      window.api.onUpdateAvailable(() => {
        setUpdateState(prev => ({ ...prev, available: true }));
      }),
      
      window.api.onUpdateStatus((status) => {
        setUpdateState(prev => ({ 
          ...prev, 
          status,
          downloading: status.includes('Downloading'),
          error: '' // Clear any previous errors
        }));
      }),
      
      window.api.onUpdateDownloaded(() => {
        setUpdateState(prev => ({ 
          ...prev, 
          downloading: false,
          downloaded: true,
          status: 'Update ready. Please restart the application to install.'
        }));
      }),
      
      window.api.onUpdateNotAvailable(() => {
        setUpdateState({
          available: false,
          downloading: false,
          downloaded: false,
          status: '',
          error: '',
          installing: false
        });
      }),
      
      window.api.onUpdateError((error) => {
        console.error('Update error:', error);
        // Only show error state if it's not a blockmap error
        if (!error.includes('started')) {
          setUpdateState(prev => ({
            ...prev,
            error,
            downloading: false
          }));
        }
      })
    ];

    return () => cleanup.forEach(fn => fn());
  }, []); // Empty dependency array to run only once

  // Only show notification when there's something to show
  if ((!updateState.available && !updateState.downloading && !updateState.downloaded && !updateState.error) || 
      (updateState.available && !updateState.downloading && !updateState.downloaded && !updateState.status)) {
    return null;
  }

  const handleRestart = () => {
    setUpdateState(prev => ({ ...prev, installing: true, status: 'Restarting to install update...' }));
    
    // Add a small delay to show the status message before quitting
    setTimeout(() => {
      window.api.quitAndInstall();
    }, 1000);
  };

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-[#2a2737] border border-[#ad7e34] rounded-lg shadow-lg z-50">
      {updateState.error ? (
        <p className="text-red-400 text-sm">{updateState.error}</p>
      ) : (
        <>
          {updateState.status && (
            <p className="text-[#ecb96a] text-sm">{updateState.status}</p>
          )}
          
          {updateState.downloaded && !updateState.installing && (
            <Button
              onClick={handleRestart}
              className="flex items-center gap-2 text-[#ecb96a] hover:text-[#c084fc] mt-2 relative z-50"
              disabled={updateState.installing}
            >
              <RefreshCw className="w-4 h-4" />
              Restart to Install
            </Button>
          )}
        </>
      )}
    </div>
  );
} 