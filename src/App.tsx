import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import MainPanel from './components/MainPanel';
import { UpdateNotification } from './components/UpdateNotification';

export default function App() {
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check if League path exists, if not, prompt user to select it
        const leaguePath = await window.api.getLeaguePath();
        if (!leaguePath) {
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#2a2737]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ecb96a]" />
      </div>
    );
  }

  return (
    <>
      <MainPanel />
      <UpdateNotification />
      <Toaster 
        position="top-center"
        richColors 
        closeButton
        theme="dark"
        toastOptions={{
          style: {
            background: '#2a2737',
            border: '1px solid #ad7e34',
            color: '#ecb96a'
          }
        }}
      />
    </>
  );
}