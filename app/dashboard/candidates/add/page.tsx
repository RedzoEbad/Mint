"use client"
import { useMemo, useState } from "react"
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
import { Loader2, CalendarIcon, Plus, X, Upload, Info, FileDown, GraduationCap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { computeExperienceTotal, sanitizeExperienceInput } from "@/lib/candidate-experience"
import { validateCandidateForm, validateDocOrImageFile } from "@/lib/candidate-form-validation"
import { DocUploadField, ReqLabel } from "@/components/candidate-doc-upload"
import { ProfilePortraitUpload } from "@/components/profile-portrait-upload"
import { ClientOnly } from "@/components/client-only"

type TechnicalQualEntry = {
  qualification_name: string
  institution: string
  year: string
  certificateFile: File | null
  certificateFileName: string
}

export default function AddCandidatePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [languages, setLanguages] = useState<string[]>([])
  const [languageInput, setLanguageInput] = useState("")

  const [form, setForm] = useState({
    full_name: "",
    surname: "",
    father_name: "",
    date_of_birth: undefined as Date | undefined,
    marital_status: "",
    religion: "",
    sex: "",
    citizenship_no: "",
    passport_no: "",
    date_of_issue: undefined as Date | undefined,
    date_of_expiry: undefined as Date | undefined,
    place_of_issue: "",
    primary_school: "",
    secondary_school: "",
    higher_education: "",
    diploma: "",
    gcc_experience: "",
    ksa_experience: "",
    local_experience: "",
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
  const [cnicFrontFile, setCnicFrontFile] = useState<File | null>(null)
  const [cnicFrontName, setCnicFrontName] = useState("")
  const [cnicBackFile, setCnicBackFile] = useState<File | null>(null)
  const [cnicBackName, setCnicBackName] = useState("")
  const [matricCertFile, setMatricCertFile] = useState<File | null>(null)
  const [matricCertName, setMatricCertName] = useState("")
  const [intermediateCertFile, setIntermediateCertFile] = useState<File | null>(null)
  const [intermediateCertName, setIntermediateCertName] = useState("")
  const [diplomaCertFile, setDiplomaCertFile] = useState<File | null>(null)
  const [diplomaCertName, setDiplomaCertName] = useState("")
  const [experienceLetterFile, setExperienceLetterFile] = useState<File | null>(null)
  const [experienceLetterName, setExperienceLetterName] = useState("")
  const [technicalQuals, setTechnicalQuals] = useState<TechnicalQualEntry[]>([
    { qualification_name: "", institution: "", year: "", certificateFile: null, certificateFileName: "" },
  ])

  const experienceTotal = useMemo(
    () => computeExperienceTotal(form.gcc_experience, form.ksa_experience, form.local_experience),
    [form.gcc_experience, form.ksa_experience, form.local_experience],
  )

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

  function addTechnicalQual() {
    setTechnicalQuals((prev) => [...prev, { qualification_name: "", institution: "", year: "", certificateFile: null, certificateFileName: "" }])
  }

  function updateTechnicalQual(index: number, field: keyof TechnicalQualEntry, value: string | File | null) {
    setTechnicalQuals((prev) => prev.map((tq, i) => (i === index ? { ...tq, [field]: value } : tq)))
  }

  function removeTechnicalQual(index: number) {
    setTechnicalQuals((prev) => prev.filter((_, i) => i !== index))
  }

  function handleDocFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setName: (n: string) => void,
  ) {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateDocOrImageFile(file)
    if (err) {
      toast({ title: "Invalid file", description: err, variant: "destructive" })
      return
    }
    setFile(file)
    setName(file.name)
  }

  function handleTechQualCertChange(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateDocOrImageFile(file)
    if (err) {
      toast({ title: "Invalid file", description: err, variant: "destructive" })
      return
    }
    setTechnicalQuals((prev) => prev.map((tq, i) => i === index ? { ...tq, certificateFile: file, certificateFileName: file.name } : tq))
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

    const validation = validateCandidateForm(
      form,
      languages,
      technicalQuals.map((tq) => ({
        qualification_name: tq.qualification_name,
        institution: tq.institution,
        year: tq.year,
        hasCertificate: Boolean(tq.certificateFile),
      })),
      {
        profileImage: Boolean(profileImageFile),
        cnicFront: Boolean(cnicFrontFile),
        cnicBack: Boolean(cnicBackFile),
        matricCertificate: Boolean(matricCertFile),
        intermediateCertificate: Boolean(intermediateCertFile),
        diplomaCertificate: Boolean(diplomaCertFile),
        experienceLetter: Boolean(experienceLetterFile),
        cv: Boolean(cvFile),
      },
    )

    if (!validation.valid) {
      toast({ title: "Incomplete form", description: validation.message, variant: "destructive" })
      return
    }

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

      // Technical qualifications metadata
      const filteredTechQuals = technicalQuals.filter((tq) => tq.qualification_name.trim())
      const techQualMeta = filteredTechQuals.map(({ qualification_name, institution, year }) => ({ qualification_name, institution, year }))
      formData.append("technical_qualification_details", JSON.stringify(techQualMeta))
      filteredTechQuals.forEach((tq, i) => {
        if (tq.certificateFile) formData.append(`technical_qual_cert_${i}`, tq.certificateFile)
      })

      if (profileImageFile) formData.append("profile_image_file", profileImageFile)
      if (cnicFrontFile) formData.append("cnic_front_file", cnicFrontFile)
      if (cnicBackFile) formData.append("cnic_back_file", cnicBackFile)
      if (matricCertFile) formData.append("matric_certificate_file", matricCertFile)
      if (intermediateCertFile) formData.append("intermediate_certificate_file", intermediateCertFile)
      if (diplomaCertFile) formData.append("diploma_certificate_file", diplomaCertFile)
      if (experienceLetterFile) formData.append("experience_letter_file", experienceLetterFile)
      if (cvFile) formData.append("cv_file", cvFile)

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
      <form
        id="candidate-form-container"
        onSubmit={handleSubmit}
        className="space-y-6 candidate-fade-in"
        data-testid="candidate-form"
        suppressHydrationWarning
      >
        {/* Header Section */}
        <div className="candidate-glass-card rounded-2xl p-6">
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
              <ClientOnly fallback={<div className="text-xs text-slate-500">—</div>}>
                <div className="text-xs text-slate-500" suppressHydrationWarning>
                  {format(new Date(), "MMMM d, yyyy")}
                </div>
              </ClientOnly>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <Card className="candidate-glass-card border-0 overflow-hidden candidate-slide-in shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50/30 border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-slate-900">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2 pt-6">
            <div className="space-y-2">
              <ReqLabel>Given Names</ReqLabel>
              <Input
                data-testid="full_name"
                placeholder="Enter given names (as on passport)"
                value={form.full_name}
                onChange={(e) => setField("full_name", e.target.value)}
                className="candidate-input-field h-11 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="space-y-2">
              <ReqLabel>Surname</ReqLabel>
              <Input
                data-testid="surname"
                placeholder="Enter surname (as on passport)"
                value={form.surname}
                onChange={(e) => setField("surname", e.target.value)}
                className="candidate-input-field h-11 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-2">
              <ReqLabel>Father Name</ReqLabel>
              <Input
                data-testid="father_name"
                placeholder="Enter father's name"
                value={form.father_name}
                onChange={(e) => setField("father_name", e.target.value)}
                className="candidate-input-field h-11 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-2">
              <ReqLabel>Marital Status</ReqLabel>
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
              <ReqLabel>Religion</ReqLabel>
              <Input
                data-testid="religion"
                placeholder="Enter religion"
                value={form.religion}
                onChange={(e) => setField("religion", e.target.value)}
                className="candidate-input-field h-11 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-2">
              <ReqLabel>Sex</ReqLabel>
              <Select value={form.sex} onValueChange={(v) => setField("sex", v)}>
                <SelectTrigger className="h-11 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">M (Male)</SelectItem>
                  <SelectItem value="F">F (Female)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <ReqLabel>Citizenship Number</ReqLabel>
              <Input
                data-testid="citizenship_no"
                placeholder="Enter citizenship number"
                value={form.citizenship_no}
                onChange={(e) => setField("citizenship_no", e.target.value)}
                className="candidate-input-field h-11 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-mono"
              />
            </div>

            <div className="space-y-2">
              <ReqLabel>Date of Birth</ReqLabel>
              <DateField
                label="Select date of birth"
                date={form.date_of_birth}
                onSelect={(d) => setField("date_of_birth", d)}
                fromYear={1950}
                toYear={new Date().getFullYear()}
                disableFuture
              />
            </div>

            <ProfilePortraitUpload
              preview={profileImagePreview}
              onChange={handleProfileImageChange}
              onClear={removeProfileImage}
            />
          </CardContent>
        </Card>

        {/* Passport Details */}
        <Card className="candidate-glass-card border-0 overflow-hidden candidate-slide-in shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50/30 border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-slate-900">Passport Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2 pt-6">
            <div className="space-y-2">
              <ReqLabel>Passport Number</ReqLabel>
              <Input
                data-testid="passport_no"
                placeholder="Enter passport number"
                value={form.passport_no}
                onChange={(e) => setField("passport_no", e.target.value)}
                className="candidate-input-field h-11 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-mono"
              />
            </div>
            <div className="space-y-2">
              <ReqLabel>Place of Issue</ReqLabel>
              <Input
                placeholder="Enter place of issue"
                value={form.place_of_issue}
                onChange={(e) => setField("place_of_issue", e.target.value)}
                className="candidate-input-field h-11 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-2">
              <ReqLabel>Date of Issue</ReqLabel>
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
              <ReqLabel>Date of Expiry</ReqLabel>
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

            <div className="md:col-span-2 grid gap-4 sm:grid-cols-2 border-t border-slate-100 pt-5">
              <DocUploadField
                id="cnic-front"
                label="CNIC Front Image"
                fileName={cnicFrontName}
                hint="PDF or image, max 5MB"
                onFileChange={(e) => handleDocFileChange(e, setCnicFrontFile, setCnicFrontName)}
                onClear={() => { setCnicFrontFile(null); setCnicFrontName("") }}
              />
              <DocUploadField
                id="cnic-back"
                label="CNIC Back Image"
                fileName={cnicBackName}
                hint="PDF or image, max 5MB"
                onFileChange={(e) => handleDocFileChange(e, setCnicBackFile, setCnicBackName)}
                onClear={() => { setCnicBackFile(null); setCnicBackName("") }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Qualifications */}
        <Card className="candidate-glass-card border-0 overflow-hidden candidate-slide-in shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50/30 border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              Qualifications
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 pt-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <ReqLabel>Primary School</ReqLabel>
                <Input
                  data-testid="primary_school"
                  placeholder="School name, year completed"
                  value={form.primary_school}
                  onChange={(e) => setField("primary_school", e.target.value)}
                  className="candidate-input-field h-11 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="space-y-2">
                <ReqLabel>Secondary School</ReqLabel>
                <Input
                  data-testid="secondary_school"
                  placeholder="School name, year completed"
                  value={form.secondary_school}
                  onChange={(e) => setField("secondary_school", e.target.value)}
                  className="candidate-input-field h-11 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="space-y-2">
                <ReqLabel>Higher Education</ReqLabel>
                <Input
                  data-testid="higher_education"
                  placeholder="University / college, degree, year"
                  value={form.higher_education}
                  onChange={(e) => setField("higher_education", e.target.value)}
                  className="candidate-input-field h-11 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="space-y-2">
                <ReqLabel>Diploma</ReqLabel>
                <Input
                  data-testid="diploma"
                  placeholder="Diploma name, institution, year"
                  value={form.diploma}
                  onChange={(e) => setField("diploma", e.target.value)}
                  className="candidate-input-field h-11 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 border-t border-slate-100 pt-5">
              <DocUploadField
                id="matric-cert"
                label="Matric Certificate"
                fileName={matricCertName}
                onFileChange={(e) => handleDocFileChange(e, setMatricCertFile, setMatricCertName)}
                onClear={() => { setMatricCertFile(null); setMatricCertName("") }}
              />
              <DocUploadField
                id="intermediate-cert"
                label="Intermediate Certificate"
                fileName={intermediateCertName}
                onFileChange={(e) => handleDocFileChange(e, setIntermediateCertFile, setIntermediateCertName)}
                onClear={() => { setIntermediateCertFile(null); setIntermediateCertName("") }}
              />
              <DocUploadField
                id="diploma-cert"
                label="Diploma Certificate"
                fileName={diplomaCertName}
                onFileChange={(e) => handleDocFileChange(e, setDiplomaCertFile, setDiplomaCertName)}
                onClear={() => { setDiplomaCertFile(null); setDiplomaCertName("") }}
              />
            </div>

            {/* Technical Qualifications */}
            <div className="space-y-3 border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between">
                <ReqLabel className="!text-sm">Technical Qualifications</ReqLabel>
                <Button type="button" variant="outline" size="sm" onClick={addTechnicalQual} className="h-9">
                  <Plus className="h-4 w-4 mr-1" /> Add Qualification
                </Button>
              </div>
              <p className="text-xs text-slate-500">List each technical qualification and attach its certification.</p>
              <div className="space-y-4">
                  {technicalQuals.map((tq, index) => (
                    <div key={index} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Qualification #{index + 1}</span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeTechnicalQual(index)} className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-3">
                        <Input
                          placeholder="Qualification name"
                          value={tq.qualification_name}
                          onChange={(e) => updateTechnicalQual(index, "qualification_name", e.target.value)}
                          className="h-10"
                        />
                        <Input
                          placeholder="Institution / issuing body"
                          value={tq.institution}
                          onChange={(e) => updateTechnicalQual(index, "institution", e.target.value)}
                          className="h-10"
                        />
                        <Input
                          placeholder="Year"
                          value={tq.year}
                          onChange={(e) => updateTechnicalQual(index, "year", e.target.value)}
                          className="h-10"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <Label htmlFor={`tech-cert-${index}`} className="cursor-pointer">
                          <span className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg px-3 py-2 bg-white">
                            <Upload className="h-4 w-4" />
                            {tq.certificateFileName || "Attach Certification"}
                          </span>
                        </Label>
                        <input
                          id={`tech-cert-${index}`}
                          type="file"
                          accept=".pdf,image/*"
                          onChange={(e) => handleTechQualCertChange(index, e)}
                          className="hidden"
                        />
                        {tq.certificateFileName && (
                          <span className="text-xs text-slate-500 truncate max-w-[200px]">{tq.certificateFileName}</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-5">
              <ReqLabel>Languages Known</ReqLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="Add language (e.g., English, Urdu)"
                  value={languageInput}
                  onChange={(e) => setLanguageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                  className="candidate-input-field h-11 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
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

        {/* Role & Experience */}
        <Card className="candidate-glass-card border-0 overflow-hidden candidate-slide-in shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50/30 border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-slate-900">Role & Experience</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 pt-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <ReqLabel>Post Applied For</ReqLabel>
                <Input
                  data-testid="post_applied_for"
                  placeholder="Enter position"
                  value={form.post_applied_for}
                  onChange={(e) => setField("post_applied_for", e.target.value)}
                  className="candidate-input-field h-11 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="space-y-2">
                <ReqLabel>Referred By</ReqLabel>
                <Input
                  data-testid="referred_by"
                  placeholder="Enter referrer name"
                  value={form.referred_by}
                  onChange={(e) => setField("referred_by", e.target.value)}
                  className="candidate-input-field h-11 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-5">
              <ReqLabel>Experience (Years)</ReqLabel>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <ReqLabel className="!text-xs text-slate-500">GCC Experience</ReqLabel>
                  <Input
                    data-testid="gcc_experience"
                    placeholder="Years"
                    value={form.gcc_experience}
                    onChange={(e) => setField("gcc_experience", sanitizeExperienceInput(e.target.value))}
                    className="candidate-input-field h-11 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <ReqLabel className="!text-xs text-slate-500">KSA Experience</ReqLabel>
                  <Input
                    data-testid="ksa_experience"
                    placeholder="Years"
                    value={form.ksa_experience}
                    onChange={(e) => setField("ksa_experience", sanitizeExperienceInput(e.target.value))}
                    className="candidate-input-field h-11 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <ReqLabel className="!text-xs text-slate-500">Local Experience</ReqLabel>
                  <Input
                    data-testid="local_experience"
                    placeholder="Years"
                    value={form.local_experience}
                    onChange={(e) => setField("local_experience", sanitizeExperienceInput(e.target.value))}
                    className="candidate-input-field h-11 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500">Total Experience</Label>
                  <Input
                    data-testid="experience_total"
                    value={experienceTotal || "0"}
                    readOnly
                    className="candidate-input-field h-11 border-slate-200 bg-slate-100 text-slate-700 font-semibold cursor-not-allowed"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500">Total is calculated automatically from GCC, KSA, and Local experience.</p>
            </div>

            <DocUploadField
              id="experience-letter"
              label="Experience Letter"
              fileName={experienceLetterName}
              hint="PDF or image, max 5MB"
              onFileChange={(e) => handleDocFileChange(e, setExperienceLetterFile, setExperienceLetterName)}
              onClear={() => { setExperienceLetterFile(null); setExperienceLetterName("") }}
            />

            <div className="space-y-2">
              <ReqLabel>Remarks</ReqLabel>
              <Textarea
                data-testid="remarks"
                placeholder="Additional remarks or notes"
                value={form.remarks}
                onChange={(e) => setField("remarks", e.target.value)}
                className="candidate-input-field min-h-[100px] border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* CV Attachment */}
        <Card className="candidate-glass-card border-0 overflow-hidden candidate-slide-in shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50/30 border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-slate-900">CV Attachment</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3 max-w-xl">
              <ReqLabel>CV Document</ReqLabel>
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
          className="justify-start w-full h-11 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 candidate-input-field font-medium text-slate-700"
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" /> {date ? format(date, "PPP") : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 border-0 shadow-2xl rounded-2xl overflow-hidden candidate-glass-card" align="start">
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
