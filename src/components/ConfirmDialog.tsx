import { Button } from "@/components/ui/button"

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
}

export function ConfirmDialog({ isOpen, onConfirm, onCancel, title, message }: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-[#0b0a0f] p-6 rounded-lg border border-[#ad7e34] max-w-md w-full animate-fadeIn">
        <h2 className="text-[#ecb96a] text-xl mb-4">{title}</h2>
        <p className="text-[#ecb96a]/80 mb-6">{message}</p>
        <div className="flex justify-end space-x-4">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="text-[#ecb96a] hover:bg-[#2a2737] hover:text-[#c084fc]"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-[#ad7e34] text-white hover:bg-[#8c6429]"
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
} 