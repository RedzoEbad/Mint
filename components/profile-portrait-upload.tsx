"use client"

import { Image as ImageIcon, Upload, X, Info, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ReqLabel } from "@/components/candidate-doc-upload"
import { cn } from "@/lib/utils"

export function ProfilePortraitUpload({
  preview,
  onChange,
  onClear,
  inputId = "profile-image",
}: {
  preview?: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClear: () => void
  inputId?: string
}) {
  return (
    <div className="space-y-4 md:col-span-2 border-t border-slate-100/80 dark:border-slate-600/50 pt-6 mt-2">
      <ReqLabel>Profile Image (Passport Portrait)</ReqLabel>
      <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 bg-gradient-to-r from-blue-50 to-indigo-50/60 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-100/80 dark:border-blue-800/50 rounded-xl p-3 max-w-2xl shadow-sm">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <span>
          JPG/PNG only. Use a passport-style portrait (3:4 ratio), plain background, max 2MB. Stored securely and linked to this candidate only.
        </span>
      </div>
      <div className="flex flex-wrap items-start gap-8">
        <div className={cn("candidate-upload-zone max-w-xs flex-1 min-w-[240px]", preview && "has-file border-solid")}>
          {preview ? (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="candidate-passport-frame ring-4 ring-blue-100 dark:ring-blue-900/50 shadow-xl">
                <img src={preview} alt="Profile portrait" className="absolute inset-0 h-full w-full object-cover object-top" />
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onClear}
                className="rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 dark:text-rose-400 dark:border-rose-800 dark:hover:bg-rose-950/40"
              >
                <X className="h-4 w-4 mr-1.5" /> Remove photo
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950/60 dark:to-indigo-950/60">
                <Camera className="h-8 w-8 text-blue-500 dark:text-blue-400" />
              </div>
              <Label htmlFor={inputId} className="cursor-pointer">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700/60 rounded-xl px-5 py-2.5 bg-white dark:bg-slate-700 shadow-sm hover:shadow-md transition-all">
                  <Upload className="h-4 w-4" /> Upload portrait photo
                </span>
              </Label>
              <p className="text-xs text-slate-400 dark:text-slate-500">Passport-style 3:4 frame</p>
            </div>
          )}
          <input
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            onChange={onChange}
            className="hidden"
            data-testid="profile-image"
          />
        </div>
        {!preview && (
          <div className="candidate-passport-frame opacity-50 border-dashed border-2 border-slate-300 dark:border-slate-600 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-slate-700">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500 p-4">
              <ImageIcon className="h-8 w-8 opacity-60" />
              <span className="text-xs text-center font-medium">Preview appears here</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
