import { useState, useEffect } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SkinCard } from "./SkinCard"
import { LoginPanel } from "../LoginPanel"
import type { Custom } from '../../../shared/types/types'
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"

interface FreeSkinsProps {
  filters: Record<string, boolean>;
  toggleFilter: (key: string) => void;
  installedSkins: number[];
  onShowSettings: () => void;
}

export function FreeSkins({ 
  filters, 
  toggleFilter,
  installedSkins,
  onShowSettings 
}: FreeSkinsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [customs, setCustoms] = useState<Custom[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showLoginPanel, setShowLoginPanel] = useState(false)
  const [isLeaguePathSet, setIsLeaguePathSet] = useState(false)
  const [installingSkins, setInstallingSkins] = useState<number[]>([])
  const [installQueue, setInstallQueue] = useState<{id: number, status: 'queued' | 'installing'}[]>([])
  const [isProcessingQueue, setIsProcessingQueue] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await window.api.isAuthenticated();
        setIsAuthenticated(isAuth);
        if (!isAuth) {
          setShowLoginPanel(true);
        }
      } catch (err) {
        console.error('Error checking authentication:', err);
      }
    };

    checkAuth();

    const unsubscribe = window.api.onAuthStateChanged((isAuth) => {
      setIsAuthenticated(isAuth);
      if (isAuth) {
        setShowLoginPanel(false);
        fetchCustoms();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const checkLeaguePath = async () => {
      try {
        const leaguePath = await window.api.getLeaguePath();
        setIsLeaguePathSet(!!leaguePath);
      } catch (err) {
        console.error('Error checking League path:', err);
      }
    };

    checkLeaguePath();
  }, []);

  // Listen for skin uninstallation events
  useEffect(() => {
    const handleSkinUninstalled = (event: CustomEvent) => {
      const { id, type } = event.detail;
      
      // Only refresh if the uninstalled skin is of type 'free'
      if (type === 'free') {
        fetchCustoms();
      }
    };
    
    // Add event listener
    window.addEventListener('skin-uninstalled', handleSkinUninstalled as EventListener);
    
    // Clean up
    return () => {
      window.removeEventListener('skin-uninstalled', handleSkinUninstalled as EventListener);
    };
  }, []);

  const fetchCustoms = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching free skins...');
      const userCustoms = await window.api.getFreeSkins();
      console.log('Received free skins:', userCustoms);
      
      if (!Array.isArray(userCustoms)) {
        throw new Error('Invalid response format');
      }
      
      // Get the list of installed skins to filter them out
      const installedSkinIds = await window.api.getInstalledSkins('free');
      console.log('Installed free skins:', installedSkinIds);
      
      // Filter out already installed skins
      const availableSkins = userCustoms.filter(skin => !installedSkinIds.includes(skin.id));
      console.log('Available free skins after filtering:', availableSkins);
      
      setCustoms(availableSkins);
    } catch (err) {
      console.error('Error fetching free skins:', err);
      setError(err instanceof Error ? err.message : 'Failed to load skins');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCustoms();
    }
  }, [isAuthenticated]);

  const handleLogin = async () => {
    setShowLoginPanel(false);
  };

  // Add queue processor
  useEffect(() => {
    const processQueue = async () => {
      // If no items in queue, do nothing
      if (installQueue.length === 0 || installQueue[0].status === 'installing') return;

      try {
        // Update first item status to installing
        setInstallQueue(prev => [
          { ...prev[0], status: 'installing' },
          ...prev.slice(1)
        ]);
        
        // Install the skin
        await window.api.installSkin(installQueue[0].id, 'free');
        
        // Remove installed skin and update customs list
        setCustoms(prev => prev.filter(skin => skin.id !== installQueue[0].id));
        setInstallQueue(prev => prev.slice(1));
        
        toast.success(`Skin installed successfully`, {
          duration: 3000,
        });
      } catch (error) {
        console.error('Error installing skin:', error);
        
        // Provide a cleaner error message
        let errorMessage = 'Failed to install skin';
        
        if (error instanceof Error) {
          // Clean up the error message
          const errorString = error.message;
          
          // Check for specific error types and provide cleaner messages
          if (errorString.includes('disk space') || errorString.includes('Not enough disk space')) {
            errorMessage = 'Not enough disk space on C: drive. Please free up some space and try again.';
          } else if (errorString.includes('permission') || errorString.includes('EPERM')) {
            errorMessage = 'Permission denied. Please run as administrator.';
          } else if (errorString.includes('not found') || errorString.includes('ENOENT')) {
            errorMessage = 'Files not found. Check your League path in Settings.';
          }
        }
        
        toast.error(errorMessage, { 
          duration: 5000,
        });
        
        // Remove failed skin from queue
        setInstallQueue(prev => prev.slice(1));
      }
    };

    // Start processing the queue
    processQueue();
  }, [installQueue]);

  const handleInstallSkin = (skinId: number) => {
    // Check if skin is already in queue
    if (installQueue.some(item => item.id === skinId)) {
      return;
    }

    // Add to queue with initial status
    setInstallQueue(prev => [...prev, { id: skinId, status: 'queued' }]);
  };

  if (showLoginPanel) {
    return (
      <LoginPanel 
        onLogin={handleLogin} 
        onClose={() => setShowLoginPanel(false)} 
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <p className="text-[#ecb96a] mb-4">Please log in to view free skins</p>
        <Button 
          onClick={() => setShowLoginPanel(true)}
          className="bg-[#ad7e34] hover:bg-[#ad7e34]"
        >
          Login
        </Button>
      </div>
    );
  }

  if (!isLeaguePathSet) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <p className="text-[#ecb96a] mb-4">Please set your League of Legends path in Settings</p>
        <Button 
          onClick={onShowSettings}
          className="bg-[#ad7e34] hover:bg-[#ad7e34]"
        >
          Open Settings
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ecb96a]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="text-red-500 text-center mb-4">{error}</div>
        <Button 
          onClick={() => fetchCustoms()} 
          className="bg-[#ecb96a] hover:bg-[#d4a55f]"
        >
          Retry
        </Button>
      </div>
    );
  }

  const filteredCustoms = customs.filter(custom => {
    const activeFilters = Object.entries(filters).filter(([_, isActive]) => isActive);
    
    if (activeFilters.length === 0) {
      return custom.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             custom.champion.toLowerCase().includes(searchQuery.toLowerCase());
    }

    const categoryMatches = activeFilters.some(([category, _]) => 
      custom.category.toLowerCase() === category.toLowerCase()
    );

    return categoryMatches && (
      custom.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      custom.champion.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Filter out already installed skins
  const availableSkins = filteredCustoms.filter(custom => !installedSkins.includes(custom.id));

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden">
      <div className="flex justify-between items-center p-3 border-b border-[#2a2737]">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#ad7e34] w-4 h-4" />
            <Input
              type="text"
              placeholder="Search free skins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[#0b0a0f] border-[#ad7e34] text-[#ecb96a] placeholder:text-[#ad7e34] focus:border-[#ad7e34] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-[#0b0a0f] border-[#ad7e34] text-[#ecb96a] hover:bg-[#1a1a1a]">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#0b0a0f] border-[#ad7e34]">
              {Object.entries(filters).map(([key, value]) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={value}
                  onCheckedChange={() => toggleFilter(key)}
                  className="text-[#ecb96a] focus:bg-[#1a1a1a] focus:text-[#ecb96a]"
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="p-3">
        <ScrollArea className="h-[calc(100vh-220px)] rounded-lg border border-[#ad7e34] [&_[data-radix-scroll-area-thumb]]:bg-[#ecb96a]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 p-3 justify-items-center">
            {availableSkins.length > 0 ? (
              availableSkins.map((custom) => (
                <SkinCard
                  key={custom.id}
                  skin={custom}
                  isInstalled={false}
                  onInstall={() => handleInstallSkin(custom.id)}
                  isInstalling={installQueue.some(item => item.id === custom.id)}
                />
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center p-8 text-center">
                <p className="text-[#ecb96a] mb-2">No skins available to install</p>
                <p className="text-gray-400 text-sm">All free skins have been installed or no skins match your filters</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

