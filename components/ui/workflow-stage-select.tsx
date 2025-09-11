"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, AlertCircle, Clock } from "lucide-react"

export function WorkflowStageSelect({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const getIcon = () => {
    switch (value) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "rejected":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-32">
        <div className="flex items-center gap-2">
          {getIcon()}
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pending">Pending</SelectItem>
        <SelectItem value="completed">Completed</SelectItem>
        <SelectItem value="rejected">Rejected</SelectItem>
      </SelectContent>
    </Select>
  )
}


