import { cn } from "@/lib/utils"
import type { Custom } from "../../../shared/types/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2, Download, Loader2 } from "lucide-react"

interface SkinCardProps {
  skin: Custom
  isActive?: boolean
  isInstalled?: boolean
  onToggle?: (active: boolean) => void
  onUninstall?: () => void
  onInstall?: () => void
  isInstalling?: boolean
  className?: string
}

export function SkinCard({
  skin,
  isActive,
  isInstalled,
  onToggle,
  onUninstall,
  onInstall,
  isInstalling,
  className
}: SkinCardProps) {
  return (
    <div className={cn(
      "group relative overflow-hidden rounded-lg bg-[#1a1a1a] transition-all hover:shadow-lg w-[280px]",
      "shadow-[0_0_15px_rgba(173,126,52,0.15)]",
      "hover:shadow-[0_0_25px_rgba(173,126,52,0.3)]",
      isActive && "ring-2 ring-[#9A6ACA]/50",
      className
    )}>
      {/* Main Image */}
      <div className="aspect-video overflow-hidden">
        <img
          src={`${import.meta.env.VITE_API_URL}/api/skins/images/${skin.imagePath}`}
          alt={`${skin.name} skin preview`}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder.png';
          }}
        />
      </div>
      
      {/* Always Visible Content */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <div className="space-y-2">
          {/* <div className="flex items-start justify-between">
            <Badge 
              variant="secondary" 
              className="bg-[#1e1424] text-[#ecb96a]"
            >
              by {skin.artistUsername}
            </Badge>
          </div> */}

          {/* Title with text stroke */}
          <h3 className="text-lg font-bold text-white drop-shadow-md [text-shadow:_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000]">
            {skin.name} {skin.champion}
          </h3>
        </div>
      </div>

      {/* Hover Content for Installed Skins */}
      {isInstalled && (
        <div className="absolute inset-0 bg-black/90 p-4 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">{skin.name}</h3>
            <p className="text-base text-[#ecb96a]">{skin.category}</p>
            <p className="text-sm text-gray-300">by {skin.artistUsername}</p>
          </div>

          {/* Activation Switch */}
          {onToggle && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between pt-2 bg-[#2a2737] rounded-lg p-2">
                <span className="text-sm font-medium text-white">
                  {isActive ? 'Activated' : 'Deactivated'}
                </span>
                <Switch
                  checked={isActive}
                  onCheckedChange={onToggle}
                  className="data-[state=checked]:bg-[#9A6ACA] bg-gray-600"
                />
              </div>
              
              {/* Uninstall button - only show for installed skins */}
              {onUninstall && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="w-full"
                  onClick={onUninstall}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Uninstall
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Active indicator */}
      {isActive && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-[#9A6ACA]/80 rounded-full px-2 py-1">
            <span className="text-xs text-white">Active</span>
          </div>
        </div>
      )}
      
      {/* Install Button - Only show for non-installed skins */}
      {!isInstalled && onInstall && (
        <div className="absolute top-2 right-2 z-10">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "rounded-full w-8 h-8 p-0 bg-black border border-[#ad7e34]",
              isInstalling 
                ? "cursor-not-allowed opacity-50 hover:bg-black" 
                : "hover:bg-[#ad7e34]/50"
            )}
            onClick={onInstall}
            disabled={isInstalling}
            title={isInstalling ? "Installing..." : "Install Skin"}
            aria-disabled={isInstalling}
          >
            {isInstalling ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#ecb96a]" />
            ) : (
              <Download className="h-4 w-4 text-[#ecb96a]" />
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

// Custom Switch component for backward compatibility
function Switch({ checked, onCheckedChange, className }: { 
  checked?: boolean, 
  onCheckedChange?: (checked: boolean) => void,
  className?: string
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      data-state={checked ? "checked" : "unchecked"}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ad7e34] focus-visible:ring-offset-2",
        checked ? "bg-[#9A6ACA]" : "bg-gray-600",
        className
      )}
      onClick={() => onCheckedChange?.(!checked)}
    >
      <span
        data-state={checked ? "checked" : "unchecked"}
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  );
}

