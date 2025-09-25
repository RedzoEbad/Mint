"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const titleStr = typeof title === "string" ? title.trim() : title
        const descStr = typeof description === "string" ? description.trim() : description
        if (!titleStr && !descStr) return null
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {titleStr && <ToastTitle>{titleStr}</ToastTitle>}
              {descStr && (
                <ToastDescription>{descStr}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
