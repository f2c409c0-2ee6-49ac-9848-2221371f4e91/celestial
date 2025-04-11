import { cn } from "@/lib/utils"
import type { InstalledSkin } from "../../shared/types/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface InstalledSkinCardProps {
  skin: InstalledSkin
  isActive: boolean
  onToggle: (active: boolean) => void
  onDelete: () => void
  className?: string
}

const logoPath = "asset://placeholder.jpg"

export function InstalledSkinCard({
  skin,
  isActive,
  onToggle,
  onDelete,
  className
}: InstalledSkinCardProps) {
  // Determine if this is an imported skin
  const isImported = skin.type === 'imported';
  
  return (
    <div className={cn(
      "group relative overflow-hidden rounded-lg bg-[#1a1a1a] transition-all hover:shadow-lg w-[280px]",
      "shadow-[0_0_15px_rgba(173,126,52,0.15)]",
      "hover:shadow-[0_0_25px_rgba(173,126,52,0.3)]",
      isActive && "ring-2 ring-[#357C3C]/50 shadow-[0_0_25px_rgba(53,124,60,0.3)]",
      className
    )}>
      {/* Main Image */}
      <div className="aspect-video overflow-hidden">
        {isImported ? (
          // For imported skins, always use placeholder
          <img
            src={logoPath}
            alt={`${skin.name} skin preview`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          // For paid/free skins, use the image path
          <img
            src={`${import.meta.env.VITE_API_URL}/api/skins/images/${skin.imagePath}`}
            alt={`${skin.name} skin preview`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = logoPath;
            }}
          />
        )}
      </div>
      
      {/* Activation Checkbox - Custom Implementation */}
      <div className="absolute top-2 right-2 z-10">
        <div className="checkbox-wrapper-8 p-0.5">
          <input 
            className="tgl tgl-skewed" 
            id={`skin-toggle-${skin.id}`} 
            type="checkbox"
            checked={isActive}
            onChange={(e) => onToggle(e.target.checked)}
          />
          <label 
            className="tgl-btn" 
            data-tg-off="OFF" 
            data-tg-on="ON" 
            htmlFor={`skin-toggle-${skin.id}`}
          ></label>
        </div>
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
            {isImported ? (
              // For imported skins, show name and champion if available
              skin.champion && skin.champion !== 'Unknown' ? 
                `${skin.name} (${skin.champion})` : 
                skin.name
            ) : (
              // For paid/free skins, show name and champion
              `${skin.name} ${skin.champion}`
            )}
          </h3>
        </div>
      </div>

      {/* Delete Button */}
      <div className="absolute bottom-3 right-3">
        <div className="bg-black/50 rounded-full p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-red-400 hover:text-red-300 hover:bg-red-900/50 p-0 h-8 w-8 rounded-full transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {/* Type Badge */}
      {/* <div className="absolute top-2 left-2">
        <Badge 
          className={cn(
            skin.type === 'imported' && "bg-[#6b21a8] hover:bg-[#6b21a8] text-white",
            skin.type === 'paid' && "bg-[#b91c1c] hover:bg-[#b91c1c] text-white",
            skin.type === 'free' && "bg-[#15803d] hover:bg-[#15803d] text-white"
          )}
        >
          {skin.type}
        </Badge>
      </div> */}
    </div>
  )
} 