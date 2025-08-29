import React from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingScreenProps {
  message?: string
  fullScreen?: boolean
}

export function LoadingScreen({
  message = "Chargement...",
  fullScreen = true
}: LoadingScreenProps) {
  const containerClasses = fullScreen
    ? "flex items-center justify-center min-h-screen bg-gray-50"
    : "flex items-center justify-center py-8"

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  )
}