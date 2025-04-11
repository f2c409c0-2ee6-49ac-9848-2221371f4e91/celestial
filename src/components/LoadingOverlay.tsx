import { PatcherState } from './StartButton';
import { Square } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface LoadingOverlayProps {
  state: PatcherState;
  onStop: () => Promise<void>;
  progress?: number;
}

export function LoadingOverlay({ state, onStop, progress }: LoadingOverlayProps) {
  // Get the appropriate message based on the state
  const getMessage = () => {
    switch (state) {
      case PatcherState.LOADING:
        return 'Loading...';
      case PatcherState.INSTALLING:
        return 'Preparing the Custom Skins. Please Wait...';
      case PatcherState.IN_GAME:
        return 'Game is running with Custom Skins';
      case PatcherState.WAITING:
        return 'Start a game...';
      case PatcherState.ERROR:
        return 'Error occurred. Please try again.';
      default:
        return 'Operation in progress...';
    }
  };

  return (
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-[#0b0a0f]/80 p-8 rounded-lg border border-[#ad7e34] max-w-md w-full animate-fadeIn">
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-[#ecb96a] opacity-20"></div>
            <div className="absolute inset-0 rounded-full border-t-2 border-[#ecb96a] animate-spin"></div>
          </div>
          
          <p className="text-[#ecb96a] text-lg text-center animate-slideIn">
            {getMessage()}
          </p>
          
          <div className="w-full h-1 bg-[#2a2737] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#ecb96a] via-[#ad7e34] to-[#ecb96a] animate-gradientFlow"
              style={{ 
                backgroundSize: '200% 100%',
                width: progress !== undefined ? `${progress}%` : '100%'
              }}
            />
          </div>

          {/* Stop button - only show when in WAITING state */}
          {state === PatcherState.WAITING && (
            <Button 
              onClick={async () => {
                try {
                  // Show loading state on the button
                  const button = document.activeElement as HTMLButtonElement;
                  if (button) {
                    button.disabled = true;
                    button.innerText = "Stopping...";
                  }
                  
                  // Call the onStop handler from props
                  await onStop();
                  
                  // Add a small delay to ensure state has time to update
                  // This helps prevent race conditions when quickly stopping and starting
                  await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                  console.error('Error stopping patcher from overlay:', error);
                }
              }}
              className="mt-4 bg-red-600 hover:bg-red-700"
            >
              <Square className="mr-2 h-4 w-4" />
              Stop The Patcher
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 