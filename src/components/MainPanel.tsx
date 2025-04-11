import { useState, useEffect } from 'react'
import { Settings, Upload, DollarSign, Gift } from 'lucide-react'
import { SiDiscord, SiYoutube, SiTiktok, SiInstagram } from 'react-icons/si'
import { LoginPanel } from '../components/LoginPanel'
import { SettingsPanel } from '../components/SettingsPanel'
import { PaidSkins } from '../components/side-bar/PaidSkins'
import { FreeSkins } from '../components/side-bar/FreeSkins'
import { StartButton, PatcherState } from './StartButton'
import { InstalledSkins } from './InstalledSkins'
import { LoadingOverlay } from './LoadingOverlay'
import { ConfirmDialog } from './ConfirmDialog'
import { toast } from 'sonner'

// Remove the servers array and replace with single logo
const logoPath = "asset://divine-logo.gif"

export default function MainPanel() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showLoginPanel, setShowLoginPanel] = useState(false)
  const [showSettingsPanel, setShowSettingsPanel] = useState(false)
  const [activeTab, setActiveTab] = useState('installed')
  const [filters, setFilters] = useState({
    anime: false,
    edgy: false,
    nsfw: false,
    chroma: false,
    other: false,
  })
  const [activeSkins, setActiveSkins] = useState<{
    imported: Record<string, boolean>;
    paid: Record<number, boolean>;
    free: Record<number, boolean>;
  }>({
    imported: {},
    paid: {},
    free: {}
  });
  const [isLoading, setIsLoading] = useState(false);
  const [patcherState, setPatcherState] = useState<PatcherState>(PatcherState.IDLE);
  const [isInGame, setIsInGame] = useState(false);
  const [installedSkins, setInstalledSkins] = useState<{
    paid: number[];
    free: number[];
  }>({
    paid: [],
    free: []
  });
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairProgress, setRepairProgress] = useState<number>(0);
  const [showRepairConfirm, setShowRepairConfirm] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const isAuthenticated = await window.api.isAuthenticated()
        setIsLoggedIn(isAuthenticated)
        
        if (isAuthenticated) {
          setShowLoginPanel(false)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      }
    }

    checkAuthStatus()

    const unsubscribe = window.api.onAuthStateChanged((isAuthenticated) => {
      setIsLoggedIn(isAuthenticated)
      if (isAuthenticated) {
        setShowLoginPanel(false)
      }
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  useEffect(() => {
    const handleRepairProgress = (status: string) => {
      // Extract current/total if it's a repair status message
      if (status.includes('Installation: Repairing') && status.includes('/')) {
        const match = status.match(/(\d+)\/(\d+)/);
        if (match && match.length >= 3) {
          const current = parseInt(match[1]);
          const total = parseInt(match[2]);
          setRepairProgress((current / total) * 100);
        }
      }
    };

    const unsubscribe = window.api.onPatcherStatus((status) => {
      // First, handle repair progress updates
      handleRepairProgress(status);
      
      // Log all status messages for debugging transition issues
      console.log('Patcher status received:', status);
      
      // Avoid unnecessary processing for frequent DLL messages during gameplay
      // Only process important state changes that affect UI
      if (status.includes('[DLL] info: Init done!')) {
        setIsInGame(true);
        setPatcherState(PatcherState.IN_GAME);
        
        // Automatically minimize the window when game starts to reduce CPU usage
        window.api.minimizeWindow().catch(error => {
          console.error('Failed to minimize window:', error);
        });
      } else if (status.includes('[DLL] info: Exit in process!')) {
        setIsInGame(false);
        setPatcherState(PatcherState.WAITING);
      } else if (status.includes('Status: Start a League match')) {
        setPatcherState(PatcherState.WAITING);
      } else if (status.includes('Status: Waiting for match to start')) {
        // Handle the status message that appears after finishing a game
        setIsInGame(false);
        setPatcherState(PatcherState.WAITING);
      } else if (status.includes('Status: Waiting for league match')) {
        // Handle alternative waiting status message
        setIsInGame(false);
        setPatcherState(PatcherState.WAITING);
      } else if (status.includes('Status: Waiting for match')) {
        // Handle third variation of waiting status message
        setIsInGame(false);
        setPatcherState(PatcherState.WAITING);
      } else if (status.includes('Error:') 
                 && !status.includes('Error installing skin') 
                 && !status.includes('Error installing skin(s)') 
                 && !status.includes('Failed to install skin')
                 && !status.includes('Error: Failed to install skin')
                 // Filter out installation-related error messages
                 && !status.toLowerCase().includes('install')
                 && !status.includes('Installation Error:')
                 && !status.includes('Installation:')) {
        // Only set ERROR state for errors that aren't related to skin installation
        setPatcherState(PatcherState.ERROR);
      } else if (status.includes('Status: Starting patcher...')) {
        setPatcherState(PatcherState.WAITING);
      } else if (status.includes('Status: Patcher stopped')) {
        setPatcherState(PatcherState.IDLE);
        setIsInGame(false);
      } else if (status.includes('Status: Patcher exited successfully')) {
        setPatcherState(PatcherState.IDLE);
        setIsInGame(false);
      }
      // Ignore installation messages - don't change patcher state for these
      // This prevents LoadingOverlay from appearing during skin installation
      else if (status.includes('Installing:') || 
               status.includes('Installing skin') || 
               status.includes('Processing skin') ||
               status.includes('Successfully installed') ||
               status.includes('Installation:')) {
        // Do nothing - we don't want to change patcher state for installations
        // This ensures LoadingOverlay doesn't appear during skin installation
      }
      // Ignore other frequent status updates during gameplay to reduce CPU load
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isInGame]);

  // Load installed skins
  useEffect(() => {
    const loadInstalledSkins = async () => {
      try {
        const paidInstalled = await window.api.getInstalledSkins('paid');
        const freeInstalled = await window.api.getInstalledSkins('free');
        
        setInstalledSkins({
          paid: paidInstalled,
          free: freeInstalled
        });
      } catch (error) {
        console.error('Error loading installed skins:', error);
      }
    };
    
    loadInstalledSkins();
    
    // Listen for skin uninstallation events to refresh the installed skins state
    const handleSkinUninstalled = () => {
      loadInstalledSkins();
    };
    
    window.addEventListener('skin-uninstalled', handleSkinUninstalled);
    
    return () => {
      window.removeEventListener('skin-uninstalled', handleSkinUninstalled);
    };
  }, []);

  // Load active skins
  useEffect(() => {
    const loadActiveSkins = async () => {
      try {
        const importedActive = await window.api.getActiveSkins('imported');
        const paidActive = await window.api.getActiveSkins('paid');
        const freeActive = await window.api.getActiveSkins('free');
        
        setActiveSkins({
          imported: importedActive,
          paid: paidActive,
          free: freeActive
        });
      } catch (error) {
        console.error('Error loading active skins:', error);
      }
    };
    
    loadActiveSkins();
  }, []);

  const toggleFilter = (key: string) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key as keyof typeof filters] }))
  }

  const handleSkinToggle = (skinId: string | number, isActive: boolean, type: 'imported' | 'paid' | 'free') => {
    console.log(`Toggling ${type} skin:`, skinId, 'to:', isActive); // Debug log
    
    setActiveSkins(prev => {
      const newState = {
        ...prev,
        [type]: {
          ...prev[type],
          [skinId]: isActive
        }
      };
      
      // Save to store
      window.api.saveActiveSkins(type, newState[type]);
      
      return newState;
    });
  };

  const handleStart = async () => {
    try {
      setIsLoading(true);
      // Explicitly set patcher state to INSTALLING when starting the patcher
      // This is different from skin installation which shouldn't show the overlay
      setPatcherState(PatcherState.INSTALLING);
      
      // First, verify the League path is valid
      const leaguePathResult = await window.api.getLeaguePath();
      if (!leaguePathResult) {
        toast.error('League of Legends path not set. Open Settings to configure.', {
          action: {
            label: 'Settings',
            onClick: () => setShowSettingsPanel(true)
          }
        });
        setPatcherState(PatcherState.ERROR);
        setIsLoading(false);
        return;
      }
      
      // Verify the League path is valid
      const pathVerification = await window.api.verifyLeaguePath(leaguePathResult);
      if (!pathVerification.isValid) {
        toast.error('Invalid League of Legends path', {
          action: {
            label: 'Settings',
            onClick: () => setShowSettingsPanel(true)
          }
        });
        setPatcherState(PatcherState.ERROR);
        setIsLoading(false);
        return;
      }
      
      // Get all active skin IDs
      const activeImportedIds = Object.entries(activeSkins.imported)
        .filter(([_, isActive]) => isActive)
        .map(([id]) => id);
        
      const activePaidIds = Object.entries(activeSkins.paid)
        .filter(([_, isActive]) => isActive)
        .map(([id]) => id.toString());
        
      const activeFreeIds = Object.entries(activeSkins.free)
        .filter(([_, isActive]) => isActive)
        .map(([id]) => id.toString());
      
      // Check if any skins are active
      const totalActiveSkins = activeImportedIds.length + activePaidIds.length + activeFreeIds.length;
      if (totalActiveSkins === 0) {
        toast.error('Please select at least one skin to activate');
        setPatcherState(PatcherState.IDLE);
        setIsLoading(false);
        return;
      }
      
      // Use the InstalledService to create and run the combined overlay
      const result = await window.api.runActiveSkins({
        imported: activeImportedIds,
        paid: activePaidIds,
        free: activeFreeIds
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to start patcher');
      }
      
      setPatcherState(PatcherState.WAITING);
      
    } catch (error) {
      // Extract error message
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      // Log error details to help with debugging
      console.error('Patcher error:', error);
      
      // Handle specific error cases
      if (errorMessage.includes('patcher is already running') || errorMessage.includes('Patcher is already running')) {
        toast.error('A patcher is already running. Please stop it first before starting a new one.', {
          duration: 5000,
          action: {
            label: 'Stop Patcher',
            onClick: () => handleStop()
          }
        });
        
        // Try to automatically stop the patcher and restart
        try {
          await handleStop();
          // Wait a moment for cleanup
          setTimeout(() => {
            handleStart();
          }, 2000);
        } catch (stopError) {
          console.error('Error stopping patcher:', stopError);
        }
      }
      else if (errorMessage.includes('disk space') || 
               errorMessage.includes('space on the disk') || 
               errorMessage.includes('Not enough disk space') || 
               errorMessage.includes('no space') || 
               errorMessage.includes('ENOSPC')) {
        
        toast.error('Not enough disk space on C: drive. Please free up some space and try again.', { 
          duration: 10000,
        });
        
        setPatcherState(PatcherState.ERROR);
      }
      else if (errorMessage.includes('paths containing spaces')) {
        // New case for path with spaces issues
        toast.error(
          'File access denied. This is likely due to your application path.', 
          {
            duration: 10000,
            description: 'Move the application to a path without spaces. Contact support.',
          }
        );
        setPatcherState(PatcherState.ERROR);
      }
      else if (errorMessage.includes('locking the files')) {
        // New case for locked files
        toast.error(errorMessage, {
          duration: 8000,
        });
        setPatcherState(PatcherState.ERROR);
      }
      else if (errorMessage.includes('wad(s)')) {
        // New case for missing WAD files
        toast.error(errorMessage, {
          duration: 8000,
        });
        setPatcherState(PatcherState.ERROR);
      }
      else if (errorMessage.includes('EPERM') || 
               errorMessage.includes('permission') || 
               errorMessage.includes('access denied') ||
               errorMessage.toLowerCase().includes('try running as administrator')) {
        toast.error('Permission denied. Please run the application as administrator.');
        setPatcherState(PatcherState.ERROR);
      }
      else if (errorMessage.includes('valid Game folder') || 
               errorMessage.includes('league') && (errorMessage.includes('path') || errorMessage.includes('directory'))) {
        toast.error(
          'League of Legends path is incorrect. Please update it in Settings.', 
          {
            duration: 5000,
            action: {
              label: 'Settings',
              onClick: () => setShowSettingsPanel(true)
            }
          }
        );
        setPatcherState(PatcherState.ERROR);
      }
      else if (errorMessage.includes('not found') || 
               errorMessage.includes('missing') || 
               errorMessage.includes('Invalid mod') ||
               errorMessage.includes('repairing the installation')) {
        toast.error(
          errorMessage, 
          {
            duration: 5000
          }
        );
        setPatcherState(PatcherState.ERROR);
      }
      else if (errorMessage.includes('contact support')) {
        // Generic error with support link
        toast.error(
          errorMessage,
          {
            duration: 10000,
            action: {
              label: 'Discord',
              onClick: () => window.api.openExternal('https://discord.gg/divineskins')
            }
          }
        );
        setPatcherState(PatcherState.ERROR);
      }
      else {
        // Fall back to displaying the exact error message
        toast.error(errorMessage, {
          duration: 8000
        });
        setPatcherState(PatcherState.ERROR);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    try {
      setIsLoading(true);
      
      // Create a timeout that will reset the UI state if stopping takes too long
      const timeoutId = setTimeout(() => {
        console.warn('Patcher stop timeout - forcing UI state reset');
        setPatcherState(PatcherState.IDLE);
        setIsLoading(false);
        setIsInGame(false);
        toast.warning('Patcher stop operation timed out. UI has been reset.', {
          description: 'You may need to restart the application if issues persist.'
        });
      }, 10000); // 10 seconds timeout
      
      try {
        // Attempt to stop the patcher
        await window.api.stopPatcher();
        console.log('Patcher stopped successfully');
        
        // Clear the timeout since the operation succeeded
        clearTimeout(timeoutId);
        
        setPatcherState(PatcherState.IDLE);
        setIsInGame(false);
        
        // If the UI state doesn't update properly from status events, force it here
        setTimeout(() => {
          if (patcherState !== PatcherState.IDLE) {
            setPatcherState(PatcherState.IDLE);
          }
        }, 1000);
      } catch (error) {
        // Clear the timeout to prevent double-handling
        clearTimeout(timeoutId);
        
        console.error('Error stopping patcher:', error);
        
        // Still set to IDLE to allow the user to retry
        setPatcherState(PatcherState.IDLE);
        toast.error('Error stopping patcher. Application state has been reset.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowSettings = () => {
    handleNavChange('settings');
  };

  const handleRepair = async () => {
    try {
      setIsRepairing(true);
      setRepairProgress(0);

      await window.api.repairInstalledSkins();
      
      // Refresh installed skins
      const paidInstalled = await window.api.getInstalledSkins('paid');
      const freeInstalled = await window.api.getInstalledSkins('free');
      
      setInstalledSkins({
        paid: paidInstalled,
        free: freeInstalled
      });

    } catch (error) {
      console.error('Error repairing skins:', error);
    } finally {
      setIsRepairing(false);
      setRepairProgress(0);
    }
  };

  const handleRepairClick = () => {
    setShowRepairConfirm(true);
  };

  // Add a function to handle navigation changes
  const handleNavChange = (tab: string) => {
    if (tab === 'settings') {
      setShowSettingsPanel(true);
    } else {
      setActiveTab(tab);
      // Close settings panel if it was open
      if (showSettingsPanel) {
        setShowSettingsPanel(false);
      }
    }
  }

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await window.api.logout();
      toast.success('Successfully logged out');
      setIsLoggedIn(false);
      // Show login panel after logout
      setShowLoginPanel(true);
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to log out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f0f] overflow-hidden">
      {/* Simple gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0b0f0f] via-[#1a1525] to-[#1e1424] opacity-80" />

      {/* Content container */}
      <div className="relative z-10 p-6 flex flex-col h-screen text-[#ecb96a] overflow-hidden">
        {/* Logo Section - Simplified with Logout Button */}
        <div className="flex items-center justify-between h-16 mb-4">
          {/* Logo and Title (Left side) */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12">
              <img 
                src="asset://celestial-logo-2.png" 
                alt="Celestial Logo" 
                className="w-full h-full object-contain"
              />
            </div>

            <h1 className="text-3xl font-bold tracking-wider">
              <span className="bg-gradient-to-r from-[#ecb96a] to-[#c084fc] bg-clip-text text-transparent">
                CELESTIAL
              </span>
            </h1>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 gap-8">
          {/* Left Sidebar */}
          <div className="w-48 flex flex-col gap-6 relative">
            {/* Simplified Logo Display */}
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#ecb96a] to-[#c084fc] p-0.5 shadow-lg">
                <div className="w-full h-full rounded-full bg-[#0b0a0f] flex items-center justify-center overflow-hidden">
                  <img 
                    src={logoPath} 
                    alt="Divine Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              {/* Social Media Icons - Now directly below logo */}
              <div className="flex gap-4 mt-4">
                <button 
                  onClick={() => window.api.openExternal('https://discord.gg/divineskins')}
                  className="text-[#ad7e34] hover:text-[#ecb96a] transition-colors"
                >
                  <SiDiscord size={20} />
                  <span className="sr-only">Join our Discord</span>
                </button>
                <button 
                  onClick={() => window.api.openExternal('https://www.youtube.com/@divineskins')}
                  className="text-[#ad7e34] hover:text-[#ecb96a] transition-colors"
                >
                  <SiYoutube size={20} />
                  <span className="sr-only">Follow us on YouTube</span>
                </button>
                <button 
                  onClick={() => window.api.openExternal('https://www.tiktok.com/@divine.skins')}
                  className="text-[#ad7e34] hover:text-[#ecb96a] transition-colors"
                >
                  <SiTiktok size={20} />
                  <span className="sr-only">Follow us on TikTok</span>
                </button>
                <button 
                  onClick={() => window.api.openExternal('https://www.instagram.com/divine.skins_/')}
                  className="text-[#ad7e34] hover:text-[#ecb96a] transition-colors"
                >
                  <SiInstagram size={20} />
                  <span className="sr-only">Follow us on Instagram</span>
                </button>
              </div>
            </div>

            {/* Navigation Container - Make it flex and add flex-1 to allow space for the bottom button */}
            <div className="flex-1 flex flex-col">
              {/* Sidebar Buttons - Replace with Radio Container */}
              <div className="radio-container focus-within:outline-none">
                <input 
                  type="radio" 
                  id="nav-installed" 
                  name="navigation" 
                  checked={activeTab === 'installed' && !showSettingsPanel} 
                  onChange={() => handleNavChange('installed')}
                  disabled={patcherState !== PatcherState.IDLE}
                  className="focus:outline-none focus:ring-0"
                />
                <label htmlFor="nav-installed">
                  <Upload className="w-4 h-4" />
                  Installed Skins
                </label>
                
                <input 
                  type="radio" 
                  id="nav-paid" 
                  name="navigation" 
                  checked={activeTab === 'paid' && !showSettingsPanel} 
                  onChange={() => handleNavChange('paid')}
                  disabled={patcherState !== PatcherState.IDLE}
                  className="focus:outline-none focus:ring-0"
                />
                <label htmlFor="nav-paid">
                  <DollarSign className="w-4 h-4" />
                  Premium Skins
                </label>
                
                <input 
                  type="radio" 
                  id="nav-free" 
                  name="navigation" 
                  checked={activeTab === 'free' && !showSettingsPanel} 
                  onChange={() => handleNavChange('free')}
                  disabled={patcherState !== PatcherState.IDLE}
                  className="focus:outline-none focus:ring-0"
                />
                <label htmlFor="nav-free">
                  <Gift className="w-4 h-4" />
                  Free Skins
                </label>
                
                <input 
                  type="radio" 
                  id="nav-settings" 
                  name="navigation" 
                  checked={showSettingsPanel} 
                  onChange={() => handleNavChange('settings')}
                  className="focus:outline-none focus:ring-0"
                />
                <label htmlFor="nav-settings">
                  <Settings className="w-4 h-4" />
                  Settings
                </label>
                
                <div className="glider-container">
                  <div className="glider"></div>
                </div>
              </div>
            </div>

            {/* Start Button - Now at the bottom of sidebar */}
            <div className="border-t border-[#2a2737] pt-4">
              <StartButton
                state={patcherState}
                onStart={handleStart}
                onStop={handleStop}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {activeTab === 'installed' && (
              <InstalledSkins 
                onSkinToggle={handleSkinToggle} 
                activeSkins={activeSkins}
                onShowSettings={handleShowSettings}
                onRepair={handleRepairClick}
                isRepairing={isRepairing}
                isPatcherRunning={patcherState !== PatcherState.IDLE}
              />
            )}
            {activeTab === 'paid' && <PaidSkins 
              filters={filters} 
              toggleFilter={toggleFilter}
              installedSkins={installedSkins.paid}
              onShowSettings={handleShowSettings}
            />}
            {activeTab === 'free' && <FreeSkins 
              filters={filters} 
              toggleFilter={toggleFilter}
              installedSkins={installedSkins.free}
              onShowSettings={handleShowSettings}
            />}
            
            {/* Overlay when patcher is running */}
            {patcherState !== PatcherState.IDLE && patcherState !== PatcherState.ERROR && (
              <LoadingOverlay 
                state={patcherState} 
                onStop={handleStop}
              />
            )}
          </div>
        </div>

        {/* Login Panel */}
        {!isLoggedIn && showLoginPanel && (
          <LoginPanel 
            onClose={() => setShowLoginPanel(false)}
            onLogin={() => setIsLoggedIn(true)}
          />
        )}

        {/* Settings Panel */}
        {showSettingsPanel && (
          <SettingsPanel 
            onClose={() => setShowSettingsPanel(false)} 
            isLoggedIn={isLoggedIn}
            onLogout={handleLogout}
          />
        )}

        {isRepairing && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-[#0b0a0f]/80 p-8 rounded-lg border border-[#ad7e34] max-w-md w-full animate-fadeIn">
              <div className="flex flex-col items-center gap-6">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 rounded-full border-2 border-[#ecb96a] opacity-20"></div>
                  <div className="absolute inset-0 rounded-full border-t-2 border-[#ecb96a] animate-spin"></div>
                </div>
                
                <p className="text-[#ecb96a] text-lg text-center animate-slideIn">
                  Repairing installed skins... Please wait
                </p>
                
                <div className="w-full h-1 bg-[#2a2737] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#ecb96a] via-[#ad7e34] to-[#ecb96a] animate-gradientFlow"
                    style={{ 
                      backgroundSize: '200% 100%',
                      width: `${repairProgress}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          isOpen={showRepairConfirm}
          onConfirm={() => {
            setShowRepairConfirm(false);
            handleRepair();
          }}
          onCancel={() => setShowRepairConfirm(false)}
          title="Confirm Repair"
          message="Are you sure you want to repair all installed skins? This process cannot be interrupted once started."
        />
      </div>
    </div>
  )
}

