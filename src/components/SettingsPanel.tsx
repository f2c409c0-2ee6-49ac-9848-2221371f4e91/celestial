import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FolderOpen, X, RefreshCw, LogOut } from 'lucide-react'
import { toast } from 'sonner'

interface SettingsPanelProps {
  onClose: () => void;
  isLoggedIn?: boolean;
  onLogout?: () => Promise<void>;
}

export function SettingsPanel({ onClose, isLoggedIn = false, onLogout }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState('set-path')
  const [path, setPath] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isFirstSetup, setIsFirstSetup] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshMessage, setRefreshMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    const checkPath = async () => {
      const currentPath = await window.api.getLeaguePath();
      if (currentPath) {
        setPath(currentPath);
      } else {
        setIsFirstSetup(true);
      }
    };
    checkPath();
  }, []);

  const handleSetPath = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const verification = await window.api.verifyLeaguePath(path)
      if (verification.isValid) {
        await window.api.setLeaguePath(path)
        if (isFirstSetup) {
          window.location.reload();
        } else {
          onClose()
        }
      } else {
        setError(verification.error || 'Invalid League of Legends path')
      }
    } catch (err) {
      setError('Failed to set League of Legends path')
      console.error(err)
    }
  }

  const handleBrowse = async () => {
    try {
      const selectedPath = await window.api.selectLeaguePath()
      if (selectedPath) {
        setPath(selectedPath)
        setError(null)
      }
    } catch (err) {
      setError('Failed to select League of Legends path')
      console.error(err)
    }
  }

  const handleHardRefresh = async () => {
    setShowConfirmation(true);
  }

  const confirmHardRefresh = async () => {
    setShowConfirmation(false);
    setIsRefreshing(true);
    setRefreshMessage(null);
    
    try {
      const result = await window.api.hardRefresh();
      if (result.success) {
        setRefreshMessage({ type: 'success', text: result.message });
      } else {
        setRefreshMessage({ type: 'error', text: result.message });
      }
    } catch (err) {
      console.error('Hard refresh failed:', err);
      setRefreshMessage({ type: 'error', text: 'An unexpected error occurred during hard refresh' });
    } finally {
      setIsRefreshing(false);
    }
  }

  const cancelHardRefresh = () => {
    setShowConfirmation(false);
  }

  const handleLogout = async () => {
    if (!onLogout) return;
    
    try {
      setIsLoggingOut(true);
      await onLogout();
      // The settings panel will be closed by the parent component after logout
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to log out. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#2a2737] rounded-lg shadow-lg w-[480px] max-w-[90vw] max-h-[80vh] flex">
        {/* Sidebar */}
        <div className="w-1/3 p-4 border-r border-[#ad7e34]">
          <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-[#ecb96a] to-[#c084fc] text-transparent bg-clip-text">
            Settings
          </h2>
          <Button 
            variant={activeTab === 'set-path' ? 'default' : 'ghost'}
            className={`w-full justify-start mb-2 text-sm ${
              activeTab === 'set-path'
                ? 'bg-[#3a3747] text-[#c084fc]'
                : 'text-[#ecb96a] hover:bg-[#3a3747] hover:text-[#c084fc]'
            }`}
            onClick={() => setActiveTab('set-path')}
          >
            Set Path
          </Button>
          <Button 
            variant={activeTab === 'hard-refresh' ? 'default' : 'ghost'}
            className={`w-full justify-start mb-2 text-sm ${
              activeTab === 'hard-refresh'
                ? 'bg-[#3a3747] text-[#c084fc]'
                : 'text-[#ecb96a] hover:bg-[#3a3747] hover:text-[#c084fc]'
            }`}
            onClick={() => setActiveTab('hard-refresh')}
          >
            Hard Refresh
          </Button>
          {isLoggedIn && (
            <Button 
              variant={activeTab === 'account' ? 'default' : 'ghost'}
              className={`w-full justify-start mb-2 text-sm ${
                activeTab === 'account'
                  ? 'bg-[#3a3747] text-[#c084fc]'
                  : 'text-[#ecb96a] hover:bg-[#3a3747] hover:text-[#c084fc]'
              }`}
              onClick={() => setActiveTab('account')}
            >
              Account
            </Button>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 relative">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="absolute top-2 right-2 text-[#ecb96a] hover:text-[#c084fc]"
          >
            <X className="w-4 h-4" />
          </Button>

          {activeTab === 'set-path' && (
            <div className="mt-8">
              <h3 className="text-lg font-bold mb-4 text-[#ecb96a]">
                {isFirstSetup ? 'Welcome! Please set your League of Legends path' : 'Set League of Legends Path'}
              </h3>
              <form onSubmit={handleSetPath} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="path" className="text-[#ecb96a]">League of Legends Executable Path</Label>
                  <div className="flex gap-2">
                    <Input
                      id="path"
                      type="text"
                      placeholder="C:\Riot Games\League of Legends\League of Legends.exe"
                      value={path}
                      onChange={(e) => setPath(e.target.value)}
                      className="flex-1 bg-[#0b0a0f] border-[#ad7e34] text-[#ecb96a] placeholder:text-[#ad7e34]"
                      required
                    />
                    <Button 
                      type="button" 
                      onClick={handleBrowse}
                      className="bg-[#3a3747] text-[#ecb96a] hover:bg-[#4a4757] hover:text-[#c084fc]"
                    >
                      <FolderOpen className="w-4 h-4" />
                    </Button>
                  </div>
                  {error && (
                    <p className="text-red-500 text-sm">{error}</p>
                  )}
                </div>
                <Button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#ecb96a] to-[#c084fc] hover:from-[#ad7e34] hover:to-[#783cb5] text-[#0b0a0f]"
                >
                  Save Path
                </Button>
              </form>
            </div>
          )}

          {activeTab === 'hard-refresh' && (
            <div className="mt-8">
              <h3 className="text-lg font-bold mb-4 text-[#ecb96a]">
                Hard Refresh
              </h3>
              <p className="text-[#ecb96a] mb-4">
                This will reset all application data except your authentication information. Use this if you're experiencing issues with the application.
              </p>
              
              {!showConfirmation ? (
                <Button 
                  onClick={handleHardRefresh}
                  className="w-full bg-gradient-to-r from-[#ecb96a] to-[#c084fc] hover:from-[#ad7e34] hover:to-[#783cb5] text-[#0b0a0f]"
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    'Hard Refresh'
                  )}
                </Button>
              ) : (
                <div className="space-y-4">
                  <p className="text-red-500 font-semibold">
                    Are you sure? This action cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      onClick={confirmHardRefresh}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                    >
                      Yes, Reset Data
                    </Button>
                    <Button 
                      onClick={cancelHardRefresh}
                      className="flex-1 bg-[#3a3747] text-[#ecb96a] hover:bg-[#4a4757]"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              
              {refreshMessage && (
                <p className={`mt-4 ${refreshMessage.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                  {refreshMessage.text}
                </p>
              )}
            </div>
          )}

          {activeTab === 'account' && isLoggedIn && (
            <div className="mt-8">
              <h3 className="text-lg font-bold mb-4 text-[#ecb96a]">
                Account Management
              </h3>
              <p className="text-[#ecb96a] mb-4">
                You are currently logged in. Use the button below to log out of your account.
              </p>
              
              <Button 
                onClick={handleLogout}
                className="w-full bg-[#3a3747] border border-[#ad7e34] text-[#ecb96a] hover:bg-[#4a4757] flex items-center justify-center gap-2"
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Logging out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

