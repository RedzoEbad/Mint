"use client"

import { Loader2 } from "lucide-react"

export function PageLoader({ message = "Loading...", className = "" }: { message?: string; className?: string }) {
  return (
    <div className={`flex items-center justify-center py-16 text-gray-600 ${className}`.trim()}>
      <div className="flex items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>{message}</span>
      </div>
    </div>
  )
}


