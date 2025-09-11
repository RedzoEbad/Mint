"use client"

import { Badge } from "@/components/ui/badge"

export function WorkflowStatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    initiated: "bg-blue-100 text-blue-800",
    in_progress: "bg-purple-100 text-purple-800",
    cancelled: "bg-gray-100 text-gray-800",
  }
  const cls = variants[status] || "bg-gray-100 text-gray-800"
  return <Badge className={cls}>{status.replace("_", " ").toUpperCase()}</Badge>
}


