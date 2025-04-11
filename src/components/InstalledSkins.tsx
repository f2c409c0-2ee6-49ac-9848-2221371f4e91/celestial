import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Loader2, Search, Upload, Wrench, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { InstalledSkin } from '../../shared/types/types';
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import { InstalledSkinCard } from './InstalledSkinCard';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface InstalledSkinsProps {
  onSkinToggle: (id: string | number, isActive: boolean, type: 'imported' | 'paid' | 'free') => void;
  activeSkins: {
    imported: Record<string, boolean>;
    paid: Record<number, boolean>;
    free: Record<number, boolean>;
  };
  onShowSettings: () => void;
  onRepair: () => void;
  isRepairing: boolean;
  isPatcherRunning?: boolean;
}

export function InstalledSkins({ 
  onSkinToggle, 
  activeSkins, 
  onShowSettings, 
  onRepair,
  isRepairing,
  isPatcherRunning = false
}: InstalledSkinsProps) {
  const [installedSkins, setInstalledSkins] = useState<InstalledSkin[]>([]);
  const [isLeaguePathSet, setIsLeaguePathSet] = useState(false);
  const [isInGame, setIsInGame] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedType, setSelectedType] = useState<'all' | 'imported' | 'paid' | 'free' | 'active'>('all');
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [conflictData, setConflictData] = useState<{
    newSkin: InstalledSkin;
    existingSkin: InstalledSkin;
    champion: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Add ref for the scroll area viewport and a ref to store scroll position
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);

  // Check League path on mount
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

  // Update champion information for imported skins
  const updateImportedSkinsChampionInfo = async (skins: InstalledSkin[]) => {
    const updatedSkins = [...skins];
    let hasUpdates = false;
    
    // Process imported skins to get champion information
    for (let i = 0; i < updatedSkins.length; i++) {
      const skin = updatedSkins[i];
      
      if (skin.type === 'imported') {
        try {
          console.log(`Fetching champion info for imported skin: ${skin.id} (${skin.name}), current champion: ${skin.champion}`);
          const championName = await window.api.getChampionFromImportedSkin(skin.id as string);
          
          if (championName) {
            console.log(`Found champion for skin ${skin.id}: ${championName}`);
            
            // Only update if the champion name is different
            if (skin.champion !== championName) {
              console.log(`Updating champion for skin ${skin.id} from "${skin.champion}" to "${championName}"`);
              updatedSkins[i] = {
                ...skin,
                champion: championName
              };
              hasUpdates = true;
            } else {
              console.log(`Champion name already set correctly for skin ${skin.id}: ${championName}`);
            }
          } else {
            console.log(`Could not extract champion name for skin ${skin.id}`);
          }
        } catch (error) {
          console.error(`Error getting champion for skin ${skin.id}:`, error);
        }
      }
    }
    
    // If we updated any skins, log the changes
    if (hasUpdates) {
      console.log('Updated skins with champion information:', updatedSkins);
    } else {
      console.log('No champion information updates needed');
    }
    
    return updatedSkins;
  };

  // Refresh the installed skins list when the component mounts
  useEffect(() => {
    const loadInstalledSkins = async () => {
      try {
        // Get imported skins
        const importedSkins = await window.api.getImportedSkins();
        
        // Get paid and free installed skins
        const paidInstalled = await window.api.getInstalledSkins('paid');
        const freeInstalled = await window.api.getInstalledSkins('free');
        
        // Get paid and free skin details
        const paidSkins = await window.api.getPaidUserSkins();
        const freeSkins = await window.api.getFreeSkins();
        
        // Format all skins into a unified format
        const formattedImportedSkins = importedSkins.map(skin => ({
          id: skin.id,
          name: skin.name,
          type: 'imported' as const,
          champion: 'Unknown', // Imported skins might not have champion info
          imagePath: '', // Imported skins might not have images
          artistUsername: skin.author || 'Unknown'
        }));
        
        const formattedPaidSkins = paidSkins
          .filter(skin => paidInstalled.includes(skin.id))
          .map(skin => ({
            id: skin.id,
            name: skin.name,
            type: 'paid' as const,
            champion: skin.champion,
            imagePath: skin.imagePath,
            artistUsername: skin.artistUsername
          }));
        
        const formattedFreeSkins = freeSkins
          .filter(skin => freeInstalled.includes(skin.id))
          .map(skin => ({
            id: skin.id,
            name: skin.name,
            type: 'free' as const,
            champion: skin.champion,
            imagePath: skin.imagePath,
            artistUsername: skin.artistUsername
          }));
        
        // Combine all skins
        const allSkins = [
          ...formattedImportedSkins,
          ...formattedPaidSkins,
          ...formattedFreeSkins
        ];
        
        // Verify each skin exists on disk before adding it to the state
        const verifiedSkins: InstalledSkin[] = [];
        for (const skin of allSkins) {
          const exists = await window.api.verifySkinExists(skin.id, skin.type);
          if (exists) {
            verifiedSkins.push(skin);
          }
        }
        
        // Update champion information for imported skins
        const skinsWithChampionInfo = await updateImportedSkinsChampionInfo(verifiedSkins);
        
        setInstalledSkins(skinsWithChampionInfo);
        console.log('Installed skins refreshed on panel open');
        
      } catch (error) {
        console.error('Error loading installed skins:', error);
        // toast.error('Failed to load installed skins');
      }
    };
    
    // Load installed skins when the component mounts (panel is opened)
    loadInstalledSkins();
    
    // No interval for periodic refreshes - only refresh when panel is opened
  }, []);

  // Add a helper function to save and restore scroll position
  const saveScrollPosition = () => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        scrollPositionRef.current = viewport.scrollTop;
      }
    }
  };

  const restoreScrollPosition = () => {
    setTimeout(() => {
      if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
          viewport.scrollTop = scrollPositionRef.current;
        }
      }
    }, 0);
  };

  // Handle skin uninstallation
  const handleUninstallSkin = async (skin: InstalledSkin) => {
    if (isPatcherRunning) return;
    
    // Save scroll position before uninstallation
    saveScrollPosition();
    
    try {
      if (skin.type === 'imported') {
        await window.api.removeImportedSkin(skin.id as string);
        // Deactivate the skin if it was active
        if (activeSkins.imported[skin.id as string]) {
          onSkinToggle(skin.id, false, 'imported');
        }
        
        // Emit a custom event to notify other components that an imported skin was uninstalled
        window.dispatchEvent(new CustomEvent('skin-uninstalled', { 
          detail: { 
            id: skin.id, 
            type: skin.type 
          } 
        }));
      } else {
        // For paid and free skins, we uninstall them
        // This will return them to their source tabs
        await window.api.uninstallSkin(skin.id as number, skin.type);
        // Deactivate the skin if it was active
        if (skin.type === 'paid' && activeSkins.paid[skin.id as number]) {
          onSkinToggle(skin.id, false, 'paid');
        } else if (skin.type === 'free' && activeSkins.free[skin.id as number]) {
          onSkinToggle(skin.id, false, 'free');
        }
        
        // Emit a custom event to notify other components that a skin was uninstalled
        window.dispatchEvent(new CustomEvent('skin-uninstalled', { 
          detail: { 
            id: skin.id, 
            type: skin.type 
          } 
        }));
      }
      
      // Remove from local state
      setInstalledSkins(prev => prev.filter(s => !(s.id === skin.id && s.type === skin.type)));
      toast.success(`${skin.name} uninstalled successfully`);
      
      // Restore scroll position
      restoreScrollPosition();
    } catch (error) {
      console.error('Error uninstalling skin:', error);
      toast.error('Failed to uninstall skin');
      
      // Restore scroll position even if there's an error
      restoreScrollPosition();
    }
  };

  // Handle skin activation toggle
  const handleToggleSkin = async (skin: InstalledSkin, active: boolean) => {
    if (isPatcherRunning) return;
    
    try {
      // Save current scroll position before making changes
      saveScrollPosition();

      // If we're deactivating a skin, just do it without checking for conflicts
      if (!active) {
        await window.api.cleanupProfiles();
        onSkinToggle(skin.id, active, skin.type);
        
        // Restore scroll position in the next tick after state updates
        restoreScrollPosition();
        return;
      }

      // We're activating a skin, check for champion conflicts
      let championName = skin.champion;
      
      console.log(`Toggling skin: ${skin.name} (${skin.id}, ${skin.type}), current champion: ${championName}`);
      
      // For imported skins, we need to extract the champion name from the WAD files
      if (skin.type === 'imported' && (championName === 'Unknown' || !championName)) {
        try {
          console.log(`Attempting to extract champion name for imported skin ${skin.id}`);
          const extractedChampion = await window.api.getChampionFromImportedSkin(skin.id as string);
          console.log(`Extracted champion name result: ${extractedChampion}`);
          
          if (extractedChampion) {
            championName = extractedChampion;
            console.log(`Updated champion name to: ${championName}`);
            
            // Update the skin object with the extracted champion name
            skin = {
              ...skin,
              champion: championName
            };
            
            // Update the skin in the installedSkins state
            setInstalledSkins(prev => 
              prev.map(s => 
                s.id === skin.id && s.type === skin.type 
                  ? { ...s, champion: championName } 
                  : s
              )
            );
          } else {
            console.log(`Could not extract champion name, proceeding with activation anyway`);
          }
        } catch (extractError) {
          console.error('Error extracting champion name:', extractError);
          // Continue with activation even if champion extraction fails
        }
      }
      
      // If we have a valid champion name, check for conflicts
      if (championName && championName !== 'Unknown') {
        // Convert champion name to lowercase for case-insensitive comparison
        const lowerChampionName = championName.toLowerCase();
        console.log(`Checking for conflicts with champion: ${championName} (${lowerChampionName})`);
        
        // Log all active skins for debugging
        console.log('Currently active skins:');
        const activeImportedSkinIds = Object.keys(activeSkins.imported).filter(id => activeSkins.imported[id]);
        const activePaidSkinIds = Object.keys(activeSkins.paid).filter(id => activeSkins.paid[Number(id)]);
        const activeFreeSkinIds = Object.keys(activeSkins.free).filter(id => activeSkins.free[Number(id)]);
        
        console.log('Imported:', activeImportedSkinIds);
        console.log('Paid:', activePaidSkinIds);
        console.log('Free:', activeFreeSkinIds);
        
        // Get all active skins with their details
        const activeSkinsDetails: InstalledSkin[] = [];
        
        // Get details for active imported skins
        for (const id of activeImportedSkinIds) {
          const activeSkin = installedSkins.find(s => s.type === 'imported' && s.id === id);
          if (activeSkin) {
            console.log(`Active imported skin: ${activeSkin.name} (${activeSkin.id}), champion: ${activeSkin.champion}`);
            activeSkinsDetails.push(activeSkin);
          }
        }
        
        // Get details for active paid skins
        for (const id of activePaidSkinIds) {
          const activeSkin = installedSkins.find(s => s.type === 'paid' && s.id === Number(id));
          if (activeSkin) {
            console.log(`Active paid skin: ${activeSkin.name} (${activeSkin.id}), champion: ${activeSkin.champion}`);
            activeSkinsDetails.push(activeSkin);
          }
        }
        
        // Get details for active free skins
        for (const id of activeFreeSkinIds) {
          const activeSkin = installedSkins.find(s => s.type === 'free' && s.id === Number(id));
          if (activeSkin) {
            console.log(`Active free skin: ${activeSkin.name} (${activeSkin.id}), champion: ${activeSkin.champion}`);
            activeSkinsDetails.push(activeSkin);
          }
        }
        
        // Find any active skins for the same champion
        const conflictingSkins = activeSkinsDetails.filter(otherSkin => {
          // Skip the current skin
          if (otherSkin.id === skin.id && otherSkin.type === skin.type) {
            console.log(`Skipping current skin: ${otherSkin.name} (${otherSkin.id}, ${otherSkin.type})`);
            return false;
          }
          
          // Get the other skin's champion name
          let otherChampionName = otherSkin.champion;
          console.log(`Comparing with active skin: ${otherSkin.name} (${otherSkin.id}, ${otherSkin.type}), champion: ${otherChampionName}`);
          
          // If the other skin is imported and has Unknown champion, try to extract it
          if (otherSkin.type === 'imported' && (otherChampionName === 'Unknown' || !otherChampionName)) {
            console.log(`Other skin has unknown champion, skipping comparison`);
            return false;
          }
          
          // Compare champion names (case insensitive)
          const isMatch = otherChampionName.toLowerCase() === lowerChampionName;
          if (isMatch) {
            console.log(`Found conflicting skin: ${otherSkin.name} for champion ${otherChampionName}`);
          }
          return isMatch;
        });
        
        // If we found conflicting skins, show the conflict dialog
        if (conflictingSkins.length > 0) {
          console.log(`Found ${conflictingSkins.length} conflicting skins for champion ${championName}`);
          
          // Use the first conflicting skin for the dialog
          const conflictingSkin = conflictingSkins[0];
          console.log(`Showing conflict dialog for champion ${championName} with skin ${conflictingSkin.name}`);
          
          setConflictData({
            newSkin: skin,
            existingSkin: conflictingSkin,
            champion: championName
          });
          setConflictDialogOpen(true);
          
          // Restore scroll position even if we show the conflict dialog
          restoreScrollPosition();
          return;
        }
      } else {
        console.log(`No valid champion name found, proceeding with activation without conflict check`);
      }
      
      // No conflicts, proceed with activation
      console.log(`No conflicts found, activating skin: ${skin.id} (${skin.type})`);
      await window.api.cleanupProfiles();
      onSkinToggle(skin.id, active, skin.type);
      
      // Restore scroll position in the next tick after state updates
      restoreScrollPosition();
    } catch (error) {
      console.error('Error toggling skin:', error);
      toast.error(`Failed to toggle skin: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Restore scroll position even if there's an error
      restoreScrollPosition();
    }
  };

  // Handle choosing a skin in the conflict dialog
  const handleChooseSkin = async (chosenSkin: InstalledSkin) => {
    try {
      if (!conflictData) return;
      
      // Save current scroll position
      saveScrollPosition();
      
      console.log(`User chose skin: ${chosenSkin.name} (${chosenSkin.id}, ${chosenSkin.type})`);
      
      // Deactivate the other skin
      const otherSkin = chosenSkin.id === conflictData.newSkin.id 
        ? conflictData.existingSkin 
        : conflictData.newSkin;
      
      console.log(`Deactivating other skin: ${otherSkin.name} (${otherSkin.id}, ${otherSkin.type})`);
      
      // Deactivate the other skin
      onSkinToggle(otherSkin.id, false, otherSkin.type);
      
      // Activate the chosen skin if it's the new skin
      if (chosenSkin.id === conflictData.newSkin.id) {
        console.log(`Activating new skin: ${chosenSkin.name} (${chosenSkin.id}, ${chosenSkin.type})`);
        await window.api.cleanupProfiles();
        onSkinToggle(chosenSkin.id, true, chosenSkin.type);
      } else {
        console.log(`Keeping existing skin active: ${chosenSkin.name} (${chosenSkin.id}, ${chosenSkin.type})`);
      }
      
      // Close the dialog
      setConflictDialogOpen(false);
      setConflictData(null);
      
      toast.success(`Activated ${chosenSkin.name} for ${conflictData.champion}`);
      
      // Restore scroll position in the next tick after state updates
      restoreScrollPosition();
    } catch (error) {
      console.error('Error choosing skin:', error);
      toast.error(`Failed to activate skin: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Close the dialog even if there's an error
      setConflictDialogOpen(false);
      setConflictData(null);
      
      // Restore scroll position even if there's an error
      restoreScrollPosition();
    }
  };

  // Handle manual refresh
  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      // Reload installed skins
      const importedSkins = await window.api.getImportedSkins();
      const paidInstalled = await window.api.getInstalledSkins('paid');
      const freeInstalled = await window.api.getInstalledSkins('free');
      const paidSkins = await window.api.getPaidUserSkins();
      const freeSkins = await window.api.getFreeSkins();
      
      // Format skins
      const formattedImportedSkins = importedSkins.map(skin => ({
        id: skin.id,
        name: skin.name,
        type: 'imported' as const,
        champion: 'Unknown',
        imagePath: '',
        artistUsername: skin.author || 'Unknown'
      }));
      
      const formattedPaidSkins = paidSkins
        .filter(skin => paidInstalled.includes(skin.id))
        .map(skin => ({
          id: skin.id,
          name: skin.name,
          type: 'paid' as const,
          champion: skin.champion,
          imagePath: skin.imagePath,
          artistUsername: skin.artistUsername
        }));
      
      const formattedFreeSkins = freeSkins
        .filter(skin => freeInstalled.includes(skin.id))
        .map(skin => ({
          id: skin.id,
          name: skin.name,
          type: 'free' as const,
          champion: skin.champion,
          imagePath: skin.imagePath,
          artistUsername: skin.artistUsername
        }));
      
      // Combine and verify skins
      const allSkins = [
        ...formattedImportedSkins,
        ...formattedPaidSkins,
        ...formattedFreeSkins
      ];
      
      const verifiedSkins: InstalledSkin[] = [];
      for (const skin of allSkins) {
        const exists = await window.api.verifySkinExists(skin.id, skin.type);
        if (exists) {
          verifiedSkins.push(skin);
        }
      }
      
      // Update champion information for imported skins
      const skinsWithChampionInfo = await updateImportedSkinsChampionInfo(verifiedSkins);
      
      setInstalledSkins(skinsWithChampionInfo);
      toast.success('Skins refreshed successfully');
    } catch (error) {
      console.error('Error refreshing skins:', error);
      toast.error('Failed to refresh skins');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Function to deactivate all skins
  const handleDeactivateAllSkins = () => {
    // Save current scroll position
    saveScrollPosition();
    
    // Get all active skins
    const activeImportedSkins = Object.entries(activeSkins.imported)
      .filter(([_, isActive]) => isActive)
      .map(([id]) => id);
    
    const activePaidSkins = Object.entries(activeSkins.paid)
      .filter(([_, isActive]) => isActive)
      .map(([id]) => Number(id));
    
    const activeFreeSkins = Object.entries(activeSkins.free)
      .filter(([_, isActive]) => isActive)
      .map(([id]) => Number(id));
    
    // Deactivate all imported skins
    activeImportedSkins.forEach(id => {
      onSkinToggle(id, false, 'imported');
    });
    
    // Deactivate all paid skins
    activePaidSkins.forEach(id => {
      onSkinToggle(id, false, 'paid');
    });
    
    // Deactivate all free skins
    activeFreeSkins.forEach(id => {
      onSkinToggle(id, false, 'free');
    });
    
    // Show success message
    const totalDeactivated = activeImportedSkins.length + activePaidSkins.length + activeFreeSkins.length;
    if (totalDeactivated > 0) {
      toast.success(`Deactivated ${totalDeactivated} skin${totalDeactivated !== 1 ? 's' : ''}`);
    } else {
      toast.info('No active skins to deactivate');
    }
    
    // Restore scroll position
    restoreScrollPosition();
  };

  // Filter and sort skins based on search query, type, and activation status
  const filteredSkins = useMemo(() => {
    const filtered = installedSkins.filter(skin => {
      // Filter by search query
      const matchesSearch = 
        skin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (skin.type !== 'imported' && skin.champion.toLowerCase().includes(searchQuery.toLowerCase())) ||
        skin.artistUsername.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Check if skin is active
      const isActive = 
        (skin.type === 'imported' && activeSkins.imported[skin.id as string]) ||
        (skin.type === 'paid' && activeSkins.paid[skin.id as number]) ||
        (skin.type === 'free' && activeSkins.free[skin.id as number]);
      
      // Filter by type if not 'all'
      const matchesType = 
        selectedType === 'all' || 
        (selectedType === 'active' ? isActive : skin.type === selectedType);
      
      return matchesSearch && matchesType;
    });

    // Sort active skins to the top
    return filtered.sort((a, b) => {
      const aIsActive = 
        (a.type === 'imported' && activeSkins.imported[a.id as string]) ||
        (a.type === 'paid' && activeSkins.paid[a.id as number]) ||
        (a.type === 'free' && activeSkins.free[a.id as number]);
      
      const bIsActive = 
        (b.type === 'imported' && activeSkins.imported[b.id as string]) ||
        (b.type === 'paid' && activeSkins.paid[b.id as number]) ||
        (b.type === 'free' && activeSkins.free[b.id as number]);
      
      if (aIsActive && !bIsActive) return -1;
      if (!aIsActive && bIsActive) return 1;
      
      // Secondary sort by type
      if (a.type !== b.type) {
        const typeOrder = { imported: 0, paid: 1, free: 2 };
        return typeOrder[a.type] - typeOrder[b.type];
      }
      
      // Finally sort by name
      return a.name.localeCompare(b.name);
    });
  }, [installedSkins, searchQuery, selectedType, activeSkins]);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    // Prevent default to allow drop
    e.preventDefault();
    e.stopPropagation();
    
    // Only show drag effect if not already importing or running patcher
    if (!isPatcherRunning && !isImporting) {
      // Set the drop effect
      e.dataTransfer.dropEffect = 'copy';
      setIsDragging(true);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isPatcherRunning && !isImporting) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if we're leaving to a child element - if so, don't change state
    const relatedTarget = e.relatedTarget as Node;
    if (relatedTarget && e.currentTarget.contains(relatedTarget)) {
      return;
    }
    
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    // Prevent default behavior (prevent file from being opened)
    e.preventDefault();
    e.stopPropagation();
    
    // Reset dragging state
    setIsDragging(false);
    
    // Check if we can process files
    if (isPatcherRunning) {
      toast.error('Cannot import skins while patcher is running');
      return;
    }
    
    if (isImporting) {
      toast.error('Already importing skins, please wait');
      return;
    }
    
    // Get the files
    const { files } = e.dataTransfer;
    
    if (!files || files.length === 0) {
      toast.error('No files dropped');
      return;
    }
    
    console.log('Files dropped:', Array.from(files).map(f => f.name));
    
    // Filter for supported file types
    const supportedFiles = Array.from(files).filter(file => {
      const fileName = file.name.toLowerCase();
      return fileName.endsWith('.fantome') || 
             fileName.endsWith('.zip') || 
             fileName.endsWith('.wad') || 
             fileName.endsWith('.client');
    });
    
    if (supportedFiles.length === 0) {
      toast.error('No valid files dropped. Supported formats: .fantome, .zip, .wad, .client');
      return;
    }
    
    // Process the files
    importFiles(supportedFiles).catch(error => {
      console.error('Error handling dropped files:', error);
      toast.error('Failed to import dropped files');
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // Convert FileList to Array
    const fileArray = Array.from(files);
    console.log('Files selected:', fileArray.map(f => f.name));
    
    try {
      await importFiles(fileArray);
    } catch (error) {
      console.error('Error importing files:', error);
      toast.error('Failed to import files');
    } finally {
      // Reset the input value so the same file can be selected again
      event.target.value = '';
    }
  };

  const importFiles = async (files: File[]) => {
    if (isPatcherRunning) {
      toast.error('Cannot import skins while patcher is running');
      return;
    }
    
    if (isImporting) {
      toast.error('Already importing skins, please wait');
      return;
    }
    
    setIsImporting(true);
    
    try {
      // Filter for supported file types
      const supportedFiles = files.filter(file => {
        const fileName = file.name.toLowerCase();
        return fileName.endsWith('.fantome') || 
               fileName.endsWith('.zip') || 
               fileName.endsWith('.wad') || 
               fileName.endsWith('.client');
      });
      
      if (supportedFiles.length === 0) {
        toast.error('No valid files selected. Supported formats: .fantome, .zip, .wad, .client');
        return;
      }
      
      // Update progress state
      setImportProgress({ current: 0, total: supportedFiles.length });
      
      // Prepare file buffers for import
      const fileBuffers: Array<{ name: string, buffer: ArrayBuffer }> = [];
      
      for (let i = 0; i < supportedFiles.length; i++) {
        const file = supportedFiles[i];
        try {
          const buffer = await file.arrayBuffer();
          fileBuffers.push({ name: file.name, buffer });
          
          // Update progress
          setImportProgress(prev => ({ ...prev, current: i + 1 }));
        } catch (error) {
          console.error(`Error reading file ${file.name}:`, error);
          toast.error(`Failed to read file ${file.name}`);
        }
      }
      
      if (fileBuffers.length === 0) {
        toast.error('Failed to read any files');
        return;
      }
      
      console.log(`Sending ${fileBuffers.length} files to import API:`, fileBuffers.map(f => f.name));
      
      // Reset progress for the actual import process
      setImportProgress({ current: 0, total: fileBuffers.length });
      
      // Import the files using the API (still using importFantomeFiles for backward compatibility)
      const importedSkins = await window.api.importFantomeFiles(fileBuffers);
      console.log('Import result:', importedSkins);
      
      if (importedSkins && importedSkins.length > 0) {
        // Success message based on number of skins
        if (importedSkins.length > 1) {
          toast.success(`Successfully imported ${importedSkins.length} skins`);
        } else {
          toast.success(`Successfully imported ${importedSkins[0].name}`);
        }
        
        // Refresh the list of installed skins
        await handleManualRefresh();
      } else {
        toast.error('No skins were imported');
      }
    } catch (error) {
      console.error('Error in importFiles:', error);
      
      // Handle duplicate skins error
      if (error instanceof Error) {
        if (error.message.includes('All skins were already imported')) {
          toast.warning('All selected skins are already imported');
        } else if (error.message.includes('Some were duplicates')) {
          toast.warning('Some skins were already imported and others failed to import');
        } else if (error.message.includes('already imported')) {
          toast.warning('Some of the selected skins are already imported');
        } else {
          toast.error(`Import failed: ${error.message}`);
        }
      } else {
        toast.error('Import failed: Unknown error');
      }
    } finally {
      setIsImporting(false);
      setImportProgress({ current: 0, total: 0 });
    }
  };

  // Add this check before the main content render
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

  return (
    <>
      <div 
        className={cn(
          "flex flex-col h-full max-h-full overflow-hidden relative",
          isDragging && "bg-[#2a2737]/50 border-2 border-dashed border-[#ad7e34]",
          isPatcherRunning && "pointer-events-none opacity-50"
        )}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Centered Drop Area Overlay */}
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50 pointer-events-none">
            <div className="bg-[#1a1525] p-8 rounded-lg border-2 border-dashed border-[#ad7e34] text-center shadow-lg transform scale-110">
              <Upload className="w-16 h-16 text-[#ad7e34] mx-auto mb-4" />
              <p className="text-[#ecb96a] text-xl font-medium mb-2">Drop files here</p>
              <p className="text-[#ad7e34] mb-1">Supported formats:</p>
              <p className="text-[#ad7e34] text-sm">.fantome, .zip, .wad, .client</p>
            </div>
          </div>
        )}
        
        {/* Header with Search and Filters */}
        <div className="flex items-center justify-between p-2 border-b border-[#2a2737]">
          <div className="flex items-center space-x-3">
            {/* Search Bar - Made Smaller */}
            <div className="relative w-40">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[#ad7e34] w-3.5 h-3.5" />
              <Input
                placeholder="Search skins..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 py-1 h-8 text-xs bg-[#0b0a0f] border-[#ad7e34] text-[#ecb96a] placeholder:text-[#ad7e34] focus:border-[#ad7e34] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            
            {/* Custom Radio Inputs for skin type filtering */}
            <div className="radio-inputs">
              <label className="radio">
                <input 
                  type="radio" 
                  name="skin-type" 
                  checked={selectedType === 'all'} 
                  onChange={() => setSelectedType('all')}
                />
                <span className="name">All</span>
              </label>
              <label className="radio">
                <input 
                  type="radio" 
                  name="skin-type" 
                  checked={selectedType === 'imported'} 
                  onChange={() => setSelectedType('imported')}
                />
                <span className="name">Imported</span>
              </label>
              <label className="radio">
                <input 
                  type="radio" 
                  name="skin-type" 
                  checked={selectedType === 'paid'} 
                  onChange={() => setSelectedType('paid')}
                />
                <span className="name">Paid</span>
              </label>
              <label className="radio">
                <input 
                  type="radio" 
                  name="skin-type" 
                  checked={selectedType === 'free'} 
                  onChange={() => setSelectedType('free')}
                />
                <span className="name">Free</span>
              </label>
              <label className="radio">
                <input 
                  type="radio" 
                  name="skin-type" 
                  checked={selectedType === 'active'} 
                  onChange={() => setSelectedType('active')}
                />
                <span className="name">Active</span>
              </label>
            </div>
          </div>
          
          <div className="flex items-center space-x-1.5">
            {/* Import Button with Progress Indicator */}
            <div className="flex items-center gap-1">
              <div className="relative">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="fancy-button import-button"
                  onClick={() => {
                    // Create a file input element
                    const fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.multiple = true;
                    fileInput.accept = '.fantome,.zip,.wad,.client';
                    fileInput.style.display = 'none';
                    document.body.appendChild(fileInput);
                    
                    fileInput.addEventListener('change', (e) => {
                      const files = (e.target as HTMLInputElement).files;
                      if (files && files.length > 0) {
                        const fileArray = Array.from(files);
                        console.log('Files selected via direct button:', fileArray.map(f => f.name));
                        importFiles(fileArray).catch(error => {
                          console.error('Error importing files:', error);
                          toast.error('Failed to import files');
                        });
                      }
                    });
                    
                    // Trigger the file dialog
                    fileInput.click();
                  }}
                  disabled={isPatcherRunning || isImporting}
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      <span>Import Skin</span>
                    </>
                  )}
                </Button>
              </div>
              
              {/* Import Progress Indicator */}
              {isImporting && (
                <div className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 text-[#ad7e34] animate-spin" />
                  <span className="text-xs text-[#ecb96a]">
                    ({importProgress.current}/{importProgress.total})
                  </span>
                </div>
              )}
            </div>
            
            {/* Repair Button */}
            <Button 
              variant="outline" 
              size="sm" 
              className="fancy-button repair-button"
              onClick={onRepair}
              disabled={isRepairing || isPatcherRunning}
            >
              {isRepairing ? (
                <>
                  <Loader2 className="animate-spin loader" />
                  <span>Repairing...</span>
                </>
              ) : (
                <>
                  <span className="text">Repair</span>
                  <span className="icon">
                    <Wrench className="h-4 w-4" />
                  </span>
                </>
              )}
            </Button>
            
            {/* Deactivate All Button */}
            <Button 
              variant="outline" 
              size="sm" 
              className="fancy-button deactivate-button"
              onClick={handleDeactivateAllSkins}
              disabled={isPatcherRunning}
            >
              <span className="text">Deactivate All</span>
              <span className="icon">
                <X className="h-4 w-4" />
              </span>
            </Button>
          </div>
        </div>

        {/* Skins List */}
        <div className="p-3 flex-1">
          <ScrollArea className="h-[calc(100vh-220px)] rounded-lg border border-[#ad7e34] [&_[data-radix-scroll-area-thumb]]:bg-[#ecb96a]" ref={scrollAreaRef}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 p-3 justify-items-center">
              {filteredSkins.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center p-8 text-center">
                  <p className="text-[#ecb96a] mb-2">No installed skins found</p>
                  <p className="text-gray-400 text-sm">
                    Install skins from the Paid or Free tabs, or import your own skins
                  </p>
                </div>
              ) : (
                filteredSkins.map((skin) => {
                  const isActive = skin.type === 'imported' 
                    ? activeSkins.imported[skin.id as string] 
                    : skin.type === 'paid'
                      ? activeSkins.paid[skin.id as number]
                      : activeSkins.free[skin.id as number];
                  
                  return (
                    <InstalledSkinCard
                      key={`${skin.type}-${skin.id}`}
                      skin={skin}
                      isActive={isActive}
                      onToggle={(checked) => handleToggleSkin(skin, checked)}
                      onDelete={() => handleUninstallSkin(skin)}
                    />
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
      
      {/* Champion Conflict Dialog */}
      <Dialog open={conflictDialogOpen} onOpenChange={setConflictDialogOpen}>
        <DialogContent className="sm:max-w-xl bg-[#0b0a0f] border-[#ad7e34]">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#ecb96a]">Champion Skin Conflict</DialogTitle>
            <DialogDescription className="text-[#ad7e34]">
              You can only have one custom skin active per champion at a time.
              <span className="block mt-1 font-semibold">
                Choose which skin to use for <span className="text-[#ecb96a] font-bold">{conflictData?.champion}</span>:
              </span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-6 py-6">
            {conflictData && (
              <>
                {/* Currently Active Skin */}
                <div 
                  className={`
                    flex flex-col items-center p-4 rounded-lg cursor-pointer transition-all duration-200
                    border-2 border-[#2a2737] bg-[#1a1525]/50
                    hover:border-[#ad7e34] hover:bg-[#1a1525]
                  `}
                  onClick={() => handleChooseSkin(conflictData.existingSkin)}
                >
                  <div className="w-full aspect-video mb-3 overflow-hidden rounded-md bg-[#0b0a0f]">
                    {conflictData.existingSkin.type !== 'imported' && conflictData.existingSkin.imagePath ? (
                      <img 
                        src={`${import.meta.env.VITE_API_URL}/api/skins/images/${conflictData.existingSkin.imagePath}`}
                        alt={conflictData.existingSkin.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.png';
                        }}
                      />
                    ) : (
                      <img 
                        src="/placeholder.png"
                        alt={conflictData.existingSkin.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  
                  <div className="w-full text-center">
                    <h3 className="font-semibold text-white text-lg mb-1">{conflictData.existingSkin.name}</h3>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-[#2a2737] text-[#ecb96a] text-xs rounded-full">
                        Currently Active
                      </span>
                      <span className={`
                        px-2 py-1 text-xs rounded-full
                        ${conflictData.existingSkin.type === 'imported' ? 'bg-[#6b21a8] text-white' : 
                          conflictData.existingSkin.type === 'paid' ? 'bg-[#b91c1c] text-white' : 
                          'bg-[#15803d] text-white'}
                      `}>
                        {conflictData.existingSkin.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">by {conflictData.existingSkin.artistUsername}</p>
                    <div className="mt-2 p-1 bg-[#2a2737]/50 rounded text-xs text-[#ecb96a]">
                      Champion: {conflictData.champion}
                    </div>
                  </div>
                </div>
                
                {/* New Selection Skin */}
                <div 
                  className={`
                    flex flex-col items-center p-4 rounded-lg cursor-pointer transition-all duration-200
                    border-2 border-[#2a2737] bg-[#1a1525]/50
                    hover:border-[#ad7e34] hover:bg-[#1a1525]
                  `}
                  onClick={() => handleChooseSkin(conflictData.newSkin)}
                >
                  <div className="w-full aspect-video mb-3 overflow-hidden rounded-md bg-[#0b0a0f]">
                    {conflictData.newSkin.type !== 'imported' && conflictData.newSkin.imagePath ? (
                      <img 
                        src={`${import.meta.env.VITE_API_URL}/api/skins/images/${conflictData.newSkin.imagePath}`}
                        alt={conflictData.newSkin.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.png';
                        }}
                      />
                    ) : (
                      <img 
                        src="/placeholder.png"
                        alt={conflictData.newSkin.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  
                  <div className="w-full text-center">
                    <h3 className="font-semibold text-white text-lg mb-1">{conflictData.newSkin.name}</h3>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-[#2a2737] text-[#ecb96a] text-xs rounded-full">
                        New Selection
                      </span>
                      <span className={`
                        px-2 py-1 text-xs rounded-full
                        ${conflictData.newSkin.type === 'imported' ? 'bg-[#6b21a8] text-white' : 
                          conflictData.newSkin.type === 'paid' ? 'bg-[#b91c1c] text-white' : 
                          'bg-[#15803d] text-white'}
                      `}>
                        {conflictData.newSkin.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">by {conflictData.newSkin.artistUsername}</p>
                    <div className="mt-2 p-1 bg-[#2a2737]/50 rounded text-xs text-[#ecb96a]">
                      Champion: {conflictData.champion}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="text-center text-sm text-[#ad7e34] mb-4">
            <p>Click on a skin to select it and deactivate the other</p>
            <p className="mt-1 text-xs text-[#ad7e34]/80">
              Note: League of Legends only allows one custom skin per champion at a time
            </p>
          </div>
          
          <DialogFooter className="flex justify-center sm:justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setConflictDialogOpen(false);
                setConflictData(null);
              }}
              className="border-[#ad7e34] text-[#ecb96a] hover:bg-[#ad7e34]/10"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 