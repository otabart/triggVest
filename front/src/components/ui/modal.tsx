import { X } from "lucide-react"
import { Button } from "./button"
import { useEffect } from "react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: "sm" | "md" | "lg"
}

export function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  // Fermer avec Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl"
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className={`relative bg-background border-4 border-black rounded-none shadow-2xl ${sizeClasses[size]} w-full mx-4 max-h-[90vh] overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-4 border-black bg-secondary">
          <h2 className="text-2xl font-bold font-sans text-foreground">
            {title}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2 hover:bg-background border-2 border-black rounded-none"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {children}
        </div>
      </div>
    </div>
  )
}

interface ModalButtonProps {
  variant?: "default" | "destructive" | "success"
  onClick: () => void
  children: React.ReactNode
  disabled?: boolean
  loading?: boolean
}

export function ModalButton({ variant = "default", onClick, children, disabled, loading }: ModalButtonProps) {
  const variantClasses = {
    default: "bg-secondary hover:bg-secondary/80 text-foreground",
    destructive: "bg-red-500 hover:bg-red-600 text-white",
    success: "bg-green-500 hover:bg-green-600 text-white"
  }

  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      className={`font-bold px-6 py-3 rounded-none border-4 border-black transition-all duration-200 hover:translate-x-1 hover:translate-y-1 active:translate-x-0 active:translate-y-0 ${variantClasses[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      ) : (
        children
      )}
    </Button>
  )
} 