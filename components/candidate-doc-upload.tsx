"use client"

import { Label } from "@/components/ui/label"
import { Upload, X, FileText, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ReqLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <Label className={`text-sm font-semibold text-slate-700 ${className}`.trim()}>
      {children} <span className="text-red-500">*</span>
    </Label>
  )
}

export function DocUploadField({
  id,
  label,
  fileName,
  onFileChange,
  onClear,
  accept = ".pdf,image/*",
  hint,
}: {
  id: string
  label: string
  fileName?: string
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClear?: () => void
  accept?: string
  hint?: string
}) {
  const hasFile = Boolean(fileName)

  return (
    <div className="space-y-2">
      <ReqLabel>{label}</ReqLabel>
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      <div className={`candidate-upload-zone ${hasFile ? "has-file" : ""}`}>
        <div className="flex flex-col items-center gap-2">
          {hasFile ? (
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          ) : (
            <FileText className="h-8 w-8 text-slate-400" />
          )}
          <Label htmlFor={id} className="cursor-pointer">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg px-4 py-2 bg-white shadow-sm">
              <Upload className="h-4 w-4" />
              {hasFile ? "Replace file" : "Choose file"}
            </span>
          </Label>
          {hasFile ? (
            <p className="text-xs text-slate-600 truncate max-w-full px-2">{fileName}</p>
          ) : (
            <p className="text-xs text-slate-400">PDF or image, max 5MB</p>
          )}
        </div>
        <input id={id} type="file" accept={accept} onChange={onFileChange} className="hidden" />
        {hasFile && onClear ? (
          <div className="mt-3 flex justify-center">
            <Button type="button" variant="ghost" size="sm" onClick={onClear} className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50">
              <X className="h-4 w-4 mr-1" /> Remove
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
