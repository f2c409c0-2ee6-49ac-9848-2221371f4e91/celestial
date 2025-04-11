import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { toast } from "sonner" 
import { useState, useEffect } from "react"

// Path to the wings SVG using the asset protocol
const wingsPath = "asset://wings.svg"

export enum PatcherState {
  IDLE = 'idle',
  LOADING = 'loading',
  INSTALLING = 'installing',
  IN_GAME = 'in-game',
  WAITING = 'waiting',
  ERROR = 'error'
}

interface StartButtonProps {
  state: PatcherState;
  isLoading: boolean;
  onStart: () => Promise<void>;
  onStop: () => Promise<void>;
}

export function StartButton({ 
  state,
  isLoading,
  onStart, 
  onStop,
}: StartButtonProps) {
  const isDisabled = 
    state === PatcherState.IN_GAME ||
    state === PatcherState.INSTALLING ||
    isLoading;

  const handleClick = async () => {
    if (state === PatcherState.WAITING) {
      try {
        await onStop();
        toast.success('Patcher stopped successfully');
      } catch (error) {
        toast.error('Failed to stop patcher');
        console.error('Stop error:', error);
      }
    } else {
      try {
        await onStart();
      } catch (error) {
        toast.error('Failed to start patcher');
        console.error('Start error:', error);
      }
    }
  };

  // Determine button text and class based on state
  let buttonText = "START";
  let buttonClass = "start-button";
  let wingsClass = "wings-icon";
  
  if (isLoading) {
    buttonText = "LOADING...";
  } else if (state === PatcherState.WAITING) {
    buttonText = "STOP";
    buttonClass += " waiting";
    wingsClass += " waiting";
  } else if (state === PatcherState.IN_GAME) {
    buttonText = "IN GAME";
    buttonClass += " in-game";
    wingsClass += " in-game";
  } else if (state === PatcherState.ERROR) {
    buttonText = "RETRY";
    buttonClass += " error";
    wingsClass += " error";
  }

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={buttonClass}
      type="button"
    >
      <div className="icon_shadow">
        <span>{buttonText}</span>
        {isLoading ? (
          <Loader2 className="ml-2 h-6 w-6 animate-spin" />
        ) : (
          <div className="wings-container">
            <img 
              src={wingsPath} 
              className={wingsClass} 
              alt="Wings" 
            />
          </div>
        )}
      </div>
    </button>
  );
}