"use client"

import { useState, useEffect } from "react"
import { FiX, FiCheck, FiAlertTriangle, FiInfo } from "react-icons/fi"

interface NotificationProps {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  onClose: (id: string) => void
}

export function NotificationToast({ 
  id, 
  type, 
  title, 
  message, 
  duration = 5000,
  onClose 
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Enter animation
    const enterTimer = setTimeout(() => setIsVisible(true), 50)
    
    // Auto close
    const autoCloseTimer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => {
      clearTimeout(enterTimer)
      clearTimeout(autoCloseTimer)
    }
  }, [duration])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => onClose(id), 300)
  }

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-400/50',
          icon: 'text-green-100',
          title: 'text-white',
          message: 'text-green-100/90'
        }
      case 'error':
        return {
          container: 'bg-gradient-to-r from-red-500 to-rose-600 border-red-400/50',
          icon: 'text-red-100',
          title: 'text-white',
          message: 'text-red-100/90'
        }
      case 'warning':
        return {
          container: 'bg-gradient-to-r from-amber-500 to-orange-600 border-amber-400/50',
          icon: 'text-amber-100',
          title: 'text-white',
          message: 'text-amber-100/90'
        }
      case 'info':
        return {
          container: 'bg-gradient-to-r from-violet-500 to-purple-600 border-violet-400/50',
          icon: 'text-violet-100',
          title: 'text-white',
          message: 'text-violet-100/90'
        }
      default:
        return {
          container: 'bg-gray-800 border-gray-600',
          icon: 'text-gray-300',
          title: 'text-white',
          message: 'text-gray-300'
        }
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'success': return <FiCheck className="w-5 h-5" />
      case 'error': return <FiAlertTriangle className="w-5 h-5" />
      case 'warning': return <FiAlertTriangle className="w-5 h-5" />
      case 'info': return <FiInfo className="w-5 h-5" />
      default: return <FiInfo className="w-5 h-5" />
    }
  }

  const styles = getTypeStyles()

  return (
    <div 
      className={`relative transform transition-all duration-300 ease-out ${
        isVisible && !isLeaving 
          ? 'translate-x-0 opacity-100 scale-100' 
          : '-translate-x-full opacity-0 scale-95'
      }`}
    >
      <div className={`
        relative flex items-start gap-4 p-5 rounded-2xl border shadow-2xl shadow-black/10
        backdrop-blur-xl bg-opacity-95 max-w-md w-full
        ${styles.container}
      `}>
        {/* Icon */}
        <div className={`flex-shrink-0 mt-0.5 ${styles.icon}`}>
          {getIcon()}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className={`text-lg font-bold mb-1 ${styles.title}`}>
            {title}
          </h4>
          <p className={`text-sm leading-relaxed ${styles.message}`}>
            {message}
          </p>
          
          {/* Progress bar */}
          <div className="mt-3">
            <div className="h-1 bg-black/20 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  type === 'success' ? 'bg-white/50' :
                  type === 'error' ? 'bg-white/50' :
                  type === 'warning' ? 'bg-white/50' :
                  'bg-white/50'
                }`}
                style={{
                  animation: `progress-${id} ${duration}ms linear forwards`
                }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Close button */}
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-black/10 transition-colors"
          aria-label="Fermer la notification"
        >
          <FiX className={`w-4 h-4 ${styles.icon}`} />
        </button>
      </div>
      
      {/* Custom animation style */}
      <style jsx>{`
        @keyframes progress-${id} {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}