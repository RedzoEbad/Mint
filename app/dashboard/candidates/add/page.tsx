"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { Loader2, CalendarIcon, Plus, X, Upload, Image as ImageIcon, Info, FileDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AddCandidatePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [languages, setLanguages] = useState<string[]>([])
  const [languageInput, setLanguageInput] = useState("")

  const [form, setForm] = useState({
    full_name: "",
    father_name: "",
    date_of_birth: undefined as Date | undefined,
    marital_status: "",
    religion: "",
    passport_no: "",
    date_of_issue: undefined as Date | undefined,
    date_of_expiry: undefined as Date | undefined,
    place_of_issue: "",
    academic_qualifications: "",
    technical_qualifications: "",
    experience_total: "",
    post_applied_for: "",
    referred_by: "",
    profile_image: "",
    cv_file: "",
    remarks: "",
  })

  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string>("")
  const [cvFileName, setCvFileName] = useState<string>("")

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function addLanguage() {
    if (!languageInput.trim()) return
    if (!languages.includes(languageInput.trim())) setLanguages((l) => [...l, languageInput.trim()])
    setLanguageInput("")
  }

  function removeLanguage(lang: string) {
    setLanguages((l) => l.filter((x) => x !== lang))
  }

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const allowed = ["image/jpeg", "image/png", "image/jpg"]
      const maxBytes = 2 * 1024 * 1024
      if (!allowed.includes(file.type)) {
        toast({ title: "Invalid image type", description: "Only JPG or PNG allowed.", variant: "destructive" })
        return
      }
      if (file.size > maxBytes) {
        toast({ title: "Image too large", description: "Max size is 2MB.", variant: "destructive" })
        return
      }
      setProfileImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      const img = new Image()
      img.onload = () => {
        const ratio = img.width / img.height
        if (ratio < 0.7 || ratio > 0.9) {
          toast({ title: "Unusual photo ratio", description: "Use a passport-style portrait photo (approx 35x45mm)." })
        }
      }
      if (file) img.src = URL.createObjectURL(file)
    }
  }

  const handleCvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const allowed = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]
      const maxBytes = 5 * 1024 * 1024
      if (!allowed.includes(file.type)) {
        toast({ title: "Invalid CV type", description: "Only PDF or DOC/DOCX allowed.", variant: "destructive" })
        return
      }
      if (file.size > maxBytes) {
        toast({ title: "CV too large", description: "Max size is 5MB.", variant: "destructive" })
        return
      }
      setCvFile(file)
      setCvFileName(file.name)
    }
  }

  const removeProfileImage = () => {
    setProfileImageFile(null)
    setProfileImagePreview("")
    setField("profile_image", "")
  }

  const removeCvFile = () => {
    setCvFile(null)
    setCvFileName("")
    setField("cv_file", "")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      // Create FormData for file uploads
      const formData = new FormData()

      // Add form fields
      Object.entries(form).forEach(([key, value]) => {
        if (value instanceof Date) {
          formData.append(key, format(value, "yyyy-MM-dd"))
        } else if (value !== undefined && value !== null) {
          formData.append(key, value.toString())
        }
      })

      // Add languages array
      formData.append("languages_known", JSON.stringify(languages))

      // Add files if they exist
      if (profileImageFile) {
        formData.append("profile_image_file", profileImageFile)
      }
      if (cvFile) {
        formData.append("cv_file", cvFile)
      }

      const res = await fetch("/api/candidates", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()

      if (res.status === 401) {
        toast({
          title: "Session Expired",
          description: "Please log in again.",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      if (res.ok && data.success) {
        toast({
          title: "Success",
          description: "Candidate created successfully",
        })
        router.push("/dashboard/candidates")
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create candidate",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating candidate:", error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout title="Add Candidate">
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .animate-slide-in {
          animation: slideIn 0.4s ease-out forwards;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(226, 232, 240, 0.8);
        }
        .input-field {
          transition: all 0.2s ease;
        }
        .input-field:focus {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }
      `}</style>

      <form
        id="candidate-form-container"
        onSubmit={handleSubmit}
        className="space-y-6 animate-fade-in"
        data-testid="candidate-form"
      >
        {/* Header Section */}
        <div className="glass-card rounded-2xl p-6 shadow-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <span className="text-white font-bold text-xl">M</span>
              </div>
              <div>
                <div className="text-xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">
                  MINT International
                </div>
                <div className="text-sm text-slate-600 font-medium">Overseas Employment Platform</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-slate-900">New Registration</div>
              <div className="text-xs text-slate-500">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <Card className="glass-card shadow-lg border-0 overflow-hidden animate-slide-in" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50/30 border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-slate-900">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2 pt-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Full Name</Label>
              <Input
                data-testid="full_name"
                placeholder="Enter full name"
                value={form.full_name}
                onChange={(e) => setField("full_name", e.target.value)}
                className="input-field h-11 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Father's Name</Label>
              <Input
                data-testid="father_name"
                placeholder="Enter father's name"
                value={form.father_name}
                onChange={(e) => setField("father_name", e.target.value)}
                className="input-field h-11 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Marital Status</Label>
              <Select value={form.marital_status} onValueChange={(v) => setField("marital_status", v)}>
                <SelectTrigger className="h-11 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                  <SelectValue placeholder="Select marital status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                  <SelectItem value="divorced">Divorced</SelectItem>
                  <SelectItem value="widowed">Widowed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Religion</Label>
              <Input
                data-testid="religion"
                placeholder="Enter religion"
                value={form.religion}
                onChange={(e) => setField("religion", e.target.value)}
                className="input-field h-11 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Date of Birth</Label>
              <DateField
                label="Select date of birth"
                date={form.date_of_birth}
                onSelect={(d) => setField("date_of_birth", d)}
                fromYear={1950}
                toYear={new Date().getFullYear()}
                disableFuture
              />
            </div>
          </CardContent>
        </Card>

        {/* Passport Details */}
        <Card className="glass-card shadow-lg border-0 overflow-hidden animate-slide-in" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50/30 border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-slate-900">Passport Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2 pt-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Passport Number</Label>
              <Input
                data-testid="passport_no"
                placeholder="Enter passport number"
                value={form.passport_no}
                onChange={(e) => setField("passport_no", e.target.value)}
                className="input-field h-11 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Place of Issue</Label>
              <Input
                placeholder="Enter place of issue"
                value={form.place_of_issue}
                onChange={(e) => setField("place_of_issue", e.target.value)}
                className="input-field h-11 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Date of Issue</Label>
              <DateField
                label="Select issue date"
                date={form.date_of_issue}
                onSelect={(d) => setField("date_of_issue", d)}
                fromYear={2000}
                toYear={new Date().getFullYear()}
                disableFuture
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Date of Expiry</Label>
              <DateField
                label="Select expiry date"
                date={form.date_of_expiry}
                onSelect={(d) => setField("date_of_expiry", d)}
                fromYear={new Date().getFullYear()}
                toYear={new Date().getFullYear() + 20}
                disabledDates={(date) => {
                  if (form.date_of_issue) {
                    return date < form.date_of_issue
                  }
                  return false
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Qualifications */}
        <Card className="glass-card shadow-lg border-0 overflow-hidden animate-slide-in" style={{ animationDelay: '0.3s' }}>
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50/30 border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-slate-900">Qualifications</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 pt-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Academic Qualifications</Label>
              <Textarea
                data-testid="academic_qualifications"
                placeholder="Enter academic qualifications"
                value={form.academic_qualifications}
                onChange={(e) => setField("academic_qualifications", e.target.value)}
                className="input-field min-h-[100px] border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Technical Qualifications</Label>
              <Textarea
                data-testid="technical_qualifications"
                placeholder="Enter technical qualifications"
                value={form.technical_qualifications}
                onChange={(e) => setField("technical_qualifications", e.target.value)}
                className="input-field min-h-[100px] border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700">Languages Known</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add language (e.g., English, Urdu)"
                  value={languageInput}
                  onChange={(e) => setLanguageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                  className="input-field h-11 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <Button
                  type="button"
                  onClick={addLanguage}
                  className="h-11 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {languages.map((lang) => (
                  <span
                    key={lang}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 px-4 py-2 text-sm font-medium shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    {lang}
                    <button
                      type="button"
                      onClick={() => removeLanguage(lang)}
                      aria-label="remove"
                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Position & Experience */}
        <Card className="glass-card shadow-lg border-0 overflow-hidden animate-slide-in" style={{ animationDelay: '0.4s' }}>
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50/30 border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-slate-900">Role & Experience</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2 pt-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Post Applied For</Label>
              <Input
                data-testid="post_applied_for"
                placeholder="Enter position"
                value={form.post_applied_for}
                onChange={(e) => setField("post_applied_for", e.target.value)}
                className="input-field h-11 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Referred By</Label>
              <Input
                data-testid="referred_by"
                placeholder="Enter referrer name"
                value={form.referred_by}
                onChange={(e) => setField("referred_by", e.target.value)}
                className="input-field h-11 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Total Experience (Years)</Label>
              <Input
                data-testid="experience_total"
                placeholder="Enter years of experience"
                value={form.experience_total}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '')
                  setField("experience_total", val)
                }}
                className="input-field h-11 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm font-semibold text-slate-700">Remarks</Label>
              <Textarea
                data-testid="remarks"
                placeholder="Additional remarks or notes"
                value={form.remarks}
                onChange={(e) => setField("remarks", e.target.value)}
                className="input-field min-h-[100px] border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* File Uploads */}
        <Card className="glass-card shadow-lg border-0 overflow-hidden animate-slide-in" style={{ animationDelay: '0.5s' }}>
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50/30 border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-slate-900">Attachments</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2 pt-6">
            {/* Profile Image Upload */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700">Profile Image</Label>
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-blue-50 border border-blue-100 rounded-lg p-2.5">
                <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <span>JPG/PNG, passport-style portrait, solid background, max 2MB</span>
              </div>
              {profileImagePreview ? (
                <div className="relative group">
                  <img
                    src={profileImagePreview}
                    alt="Profile preview"
                    className="w-full h-48 object-cover rounded-xl border-2 border-slate-200 shadow-md"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={removeProfileImage}
                    className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-200 cursor-pointer">
                  <ImageIcon className="mx-auto h-12 w-12 text-slate-400" />
                  <div className="mt-3">
                    <Label htmlFor="profile-image" className="cursor-pointer">
                      <span className="text-sm font-medium text-slate-700 hover:text-blue-600">Click to upload profile image</span>
                    </Label>
                    <input
                      id="profile-image"
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                      className="hidden"
                      data-testid="profile-image"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* CV File Upload */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700">CV Document</Label>
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-blue-50 border border-blue-100 rounded-lg p-2.5">
                <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <span>PDF or DOC/DOCX, max 5MB</span>
              </div>
              {cvFileName ? (
                <div className="flex items-center justify-between p-4 border-2 border-slate-200 rounded-xl bg-slate-50 shadow-sm group hover:border-blue-300 transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                      <FileDown className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{cvFileName}</span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={removeCvFile}
                    className="bg-red-600 hover:bg-red-700 text-white shadow-lg"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-200 cursor-pointer">
                  <Upload className="mx-auto h-12 w-12 text-slate-400" />
                  <div className="mt-3">
                    <Label htmlFor="cv-file" className="cursor-pointer">
                      <span className="text-sm font-medium text-slate-700 hover:text-blue-600">Click to upload CV</span>
                    </Label>
                    <input
                      id="cv-file"
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleCvFileChange}
                      className="hidden"
                      data-testid="cv-file"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-2 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/candidates")}
            className="h-11 px-6 border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="h-11 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 font-semibold disabled:opacity-50"
            data-testid="submit"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              "Save Candidate"
            )}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  )
}

function DateField({
  label,
  date,
  onSelect,
  fromYear,
  toYear,
  disableFuture,
  disabledDates,
}: {
  label: string
  date?: Date
  onSelect: (d?: Date) => void
  fromYear?: number
  toYear?: number
  disableFuture?: boolean
  disabledDates?: (date: Date) => boolean
}) {
  const today = new Date()
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="justify-start w-full h-11 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 input-field font-medium text-slate-700"
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" /> {date ? format(date, "PPP") : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 border-0 shadow-2xl rounded-2xl overflow-hidden glass-card" align="start">
        <div className="p-4 bg-white/95 backdrop-blur-md">
          <Calendar
            mode="single"
            selected={date}
            onSelect={onSelect}
            captionLayout="dropdown"
            fromYear={fromYear}
            toYear={toYear}
            disabled={(d) => {
              if (disableFuture && d > today) return true
              if (disabledDates && disabledDates(d)) return true
              return false
            }}
            initialFocus
            className="rounded-xl"
          />
          <div className="flex justify-between items-center p-2 pt-4 border-t border-slate-100 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelect(undefined)}
              className="text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              Clear
            </Button>
            {date && (
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                {format(date, "PPP")}
              </span>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
