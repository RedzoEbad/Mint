"use client"

import { Image as ImageIcon, Upload, X, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ReqLabel } from "@/components/candidate-doc-upload"

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
    <div className="space-y-3 md:col-span-2 border-t border-slate-100 pt-5">
      <ReqLabel>Profile Image (Passport Portrait)</ReqLabel>
      <div className="flex items-start gap-2 text-xs text-slate-500 bg-blue-50 border border-blue-100 rounded-lg p-2.5 max-w-2xl">
        <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <span>JPG/PNG only. Use a passport-style portrait (3:4 ratio), plain background, max 2MB. Stored securely and linked to this candidate only.</span>
      </div>
      <div className="flex flex-wrap items-start gap-6">
        <div className={`candidate-upload-zone max-w-sm flex-1 ${preview ? "has-file" : ""}`}>
          {preview ? (
            <div className="flex flex-col items-center gap-3">
              <div className="candidate-passport-frame">
                <img src={preview} alt="Profile portrait" className="absolute inset-0 h-full w-full object-cover object-top" />
              </div>
              <Button type="button" size="sm" variant="outline" onClick={onClear} className="text-red-600 border-red-200 hover:bg-red-50">
                <X className="h-4 w-4 mr-1" /> Remove
              </Button>
            </div>
          ) : (
            <>
              <ImageIcon className="mx-auto h-10 w-10 text-slate-400" />
              <Label htmlFor={inputId} className="cursor-pointer mt-2 block text-sm font-medium text-slate-700 hover:text-blue-600">
                <span className="inline-flex items-center gap-2 justify-center">
                  <Upload className="h-4 w-4" /> Upload portrait photo
                </span>
              </Label>
              <p className="text-xs text-slate-400 mt-1">Isolated passport-style frame</p>
            </>
          )}
          <input id={inputId} type="file" accept="image/jpeg,image/png,image/jpg" onChange={onChange} className="hidden" data-testid="profile-image" />
        </div>
        {!preview && (
          <div className="candidate-passport-frame opacity-40 border-dashed">
            <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 p-2 text-center">Preview</div>
          </div>
        )}
      </div>
    </div>
  )
}
