"use client"

import { Label } from "@/components/ui/label"
import { Upload, X, FileText, CheckCircle2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ReqLabel({ children, className = "", required = true }: { children: React.ReactNode; className?: string; required?: boolean }) {
  return (
    <Label className={cn("text-sm font-semibold text-slate-700 dark:text-slate-200 tracking-tight", className)}>
      {children} {required ? <span className="text-rose-500 ml-0.5">*</span> : null}
    </Label>
  )
}

export function FieldLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <Label className={cn("text-sm font-semibold text-slate-700 dark:text-slate-200 tracking-tight", className)}>{children}</Label>
}

export function DocUploadField({
  id,
  label,
  fileName,
  onFileChange,
  onClear,
  accept = ".pdf,image/*",
  hint,
  required = true,
}: {
  id: string
  label: string
  fileName?: string
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClear?: () => void
  accept?: string
  hint?: string
  required?: boolean
}) {
  const hasFile = Boolean(fileName)
  const LabelComponent = required === false ? FieldLabel : ReqLabel

  return (
    <div className="space-y-2">
      <LabelComponent required={required !== false}>{label}</LabelComponent>
      {hint ? <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{hint}</p> : null}
      <div className={cn("candidate-upload-zone group/upload", hasFile && "has-file")}>
        <div className="flex flex-col items-center gap-3 py-1">
          <div
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300",
              hasFile
                ? "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/25"
                : "bg-gradient-to-br from-slate-100 to-slate-200 group-hover/upload:from-blue-100 group-hover/upload:to-indigo-100 dark:from-slate-700 dark:to-slate-600 dark:group-hover/upload:from-blue-900/50 dark:group-hover/upload:to-indigo-900/50",
            )}
          >
            {hasFile ? (
              <CheckCircle2 className="h-7 w-7 text-white" />
            ) : (
              <FileText className="h-7 w-7 text-slate-400 group-hover/upload:text-blue-500 dark:group-hover/upload:text-blue-400 transition-colors" />
            )}
          </div>

          <Label htmlFor={id} className="cursor-pointer">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 border border-blue-200/80 dark:border-blue-700/60 rounded-xl px-5 py-2.5 bg-white dark:bg-slate-700 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200">
              <Upload className="h-4 w-4" />
              {hasFile ? "Replace file" : "Choose file"}
            </span>
          </Label>

          {hasFile ? (
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate max-w-full px-3 py-1.5 bg-white/70 dark:bg-slate-700/70 rounded-lg border border-slate-100 dark:border-slate-600/50">
              {fileName}
            </p>
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              PDF or image, max 5MB
            </p>
          )}
        </div>
        <input id={id} type="file" accept={accept} onChange={onFileChange} className="hidden" />
        {hasFile && onClear ? (
          <div className="mt-2 flex justify-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-8 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
            >
              <X className="h-4 w-4 mr-1" /> Remove
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
