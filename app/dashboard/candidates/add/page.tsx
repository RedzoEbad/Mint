"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { getValidToken } from "@/lib/token-utils"
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
      const token = getValidToken()
      if (!token) {
        console.warn("No valid token found")
        return
      }

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
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      })
      const data = await res.json()
      if (res.ok && data.success) {
        router.push("/dashboard/candidates")
      }
    } catch (error) {
      console.error("Error creating candidate:", error)
    } finally {
      setSubmitting(false)
    }
  }

  // PDF download removed. Generation is handled server-side on detail/list pages.

  return (
    <DashboardLayout title="Add Candidate">
      {/* PDF download removed on Add page */}
      <form id="candidate-form-container" onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-sm text-[15px] leading-relaxed tracking-wide" data-testid="candidate-form">
        {/* PDF/Header branding */}
        <div className="flex items-center justify-between pb-4 border-b">
          <div className="flex items-center gap-3">
            <img src="/images/mint-logo.png" alt="MINT International" className="h-8 w-auto" />
            <div>
              <div className="text-lg font-semibold">MINT International</div>
              <div className="text-xs text-gray-500">Overseas Employment Platform</div>
            </div>
          </div>
          <div className="text-xs text-gray-500">{new Date().toLocaleDateString()}</div>
        </div>
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Input data-testid="full_name" placeholder="Full name" value={form.full_name} onChange={(e) => setField("full_name", e.target.value)} />
            <Input data-testid="father_name" placeholder="Father name" value={form.father_name} onChange={(e) => setField("father_name", e.target.value)} />

            <div className="flex items-center gap-2">
              <Select value={form.marital_status} onValueChange={(v) => setField("marital_status", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Marital status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                  <SelectItem value="divorced">Divorced</SelectItem>
                  <SelectItem value="widowed">Widowed</SelectItem>
                </SelectContent>
              </Select>
              <Input data-testid="religion" placeholder="Religion" value={form.religion} onChange={(e) => setField("religion", e.target.value)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <DateField
                label="Date of birth"
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
        <Card>
          <CardHeader>
            <CardTitle>Passport Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Input data-testid="passport_no" placeholder="Passport no" value={form.passport_no} onChange={(e) => setField("passport_no", e.target.value)} />
            <Input placeholder="Place of issue" value={form.place_of_issue} onChange={(e) => setField("place_of_issue", e.target.value)} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:col-span-2">
              <DateField
                label="Date of issue"
                date={form.date_of_issue}
                onSelect={(d) => setField("date_of_issue", d)}
                fromYear={2000}
                toYear={new Date().getFullYear()}
                disableFuture
              />
              <DateField
                label="Date of expiry"
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
        <Card>
          <CardHeader>
            <CardTitle>Qualifications</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Textarea data-testid="academic_qualifications" placeholder="Academic qualifications" value={form.academic_qualifications} onChange={(e) => setField("academic_qualifications", e.target.value)} />
            <Textarea data-testid="technical_qualifications" placeholder="Technical qualifications" value={form.technical_qualifications} onChange={(e) => setField("technical_qualifications", e.target.value)} />

            <div>
              <div className="mb-2 text-sm text-gray-600">Languages known</div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add language and press +"
                  value={languageInput}
                  onChange={(e) => setLanguageInput(e.target.value)}
                />
                <Button type="button" variant="secondary" onClick={addLanguage}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {languages.map((lang) => (
                  <span key={lang} className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 text-xs">
                    {lang}
                    <button type="button" onClick={() => removeLanguage(lang)} aria-label="remove" className="text-blue-600 hover:text-blue-800">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Position & Experience */}
        <Card>
          <CardHeader>
            <CardTitle>Role & Experience</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Input data-testid="post_applied_for" placeholder="Post applied for" value={form.post_applied_for} onChange={(e) => setField("post_applied_for", e.target.value)} />
            <Input data-testid="referred_by" placeholder="Referred by" value={form.referred_by} onChange={(e) => setField("referred_by", e.target.value)} />
            <Input data-testid="experience_total" placeholder="Experience total (years)" value={form.experience_total} onChange={(e) => setField("experience_total", e.target.value)} />
            <Textarea data-testid="remarks" placeholder="Remarks" value={form.remarks} onChange={(e) => setField("remarks", e.target.value)} />
          </CardContent>
        </Card>

        {/* File Uploads */}
        <Card>
          <CardHeader>
            <CardTitle>Attachments</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            {/* Profile Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="profile-image">Profile Image</Label>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Info className="h-3.5 w-3.5" /> JPG/PNG, passport-style portrait, solid background, max 2MB
              </p>
              {profileImagePreview ? (
                <div className="relative">
                  <img 
                    src={profileImagePreview} 
                    alt="Profile preview" 
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeProfileImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-2">
                    <Label htmlFor="profile-image" className="cursor-pointer">
                      <span className="text-sm text-gray-600">Click to upload profile image</span>
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
            <div className="space-y-2">
              <Label htmlFor="cv-file">CV Document</Label>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Info className="h-3.5 w-3.5" /> PDF or DOC/DOCX, max 5MB
              </p>
              {cvFileName ? (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-center space-x-2">
                    <FileDown className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{cvFileName}</span>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={removeCvFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-2">
                    <Label htmlFor="cv-file" className="cursor-pointer">
                      <span className="text-sm text-gray-600">Click to upload CV</span>
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

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/candidates")}>Cancel</Button>
          <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white" data-testid="submit">
            {submitting ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Saving...</span> : "Save Candidate"}
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
        <Button variant="outline" className="justify-start w-full">
          <CalendarIcon className="mr-2 h-4 w-4" /> {date ? format(date, "PPP") : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <div className="p-2">
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
          />
          <div className="flex justify-between p-2 pt-0">
            <Button variant="ghost" size="sm" onClick={() => onSelect(undefined)}>Clear</Button>
            {date ? <span className="text-xs text-muted-foreground px-2">{format(date, "PPP")}</span> : null}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
