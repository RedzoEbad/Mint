"use client"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CandidateDateField } from "@/components/candidate-date-field"
import { format } from "date-fns"
import { Loader2, Plus, X, Upload, Info, FileDown, Briefcase, User, BookOpen, Globe, MapPin, Stamp, FileText, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { computeExperienceTotal, sanitizeExperienceInput } from "@/lib/candidate-experience"
import { validateCandidateForm, validateDocOrImageFile, formatDiplomaDetails } from "@/lib/candidate-form-validation"
import { DocUploadField, FieldLabel, ReqLabel } from "@/components/candidate-doc-upload"
import { ProfilePortraitUpload } from "@/components/profile-portrait-upload"
import { CandidateFormSection, CANDIDATE_INPUT, CANDIDATE_SELECT } from "@/components/candidate-form-section"
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
  const [passportImageFile, setPassportImageFile] = useState<File | null>(null)
  const [passportImageName, setPassportImageName] = useState("")
  const [educationalDocFile, setEducationalDocFile] = useState<File | null>(null)
  const [educationalDocName, setEducationalDocName] = useState("")
  const [experienceLetterFile, setExperienceLetterFile] = useState<File | null>(null)
  const [experienceLetterName, setExperienceLetterName] = useState("")
  const [diplomaName, setDiplomaName] = useState("")
  const [diplomaInstitution, setDiplomaInstitution] = useState("")
  const [diplomaYear, setDiplomaYear] = useState("")
  const [diplomaCertFile, setDiplomaCertFile] = useState<File | null>(null)
  const [diplomaCertName, setDiplomaCertName] = useState("")
  const [technicalQuals, setTechnicalQuals] = useState<TechnicalQualEntry[]>([])

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

  function clearTechQualCert(index: number) {
    setTechnicalQuals((prev) =>
      prev.map((tq, i) => (i === index ? { ...tq, certificateFile: null, certificateFileName: "" } : tq)),
    )
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
      { ...form, diploma: formatDiplomaDetails(diplomaName, diplomaInstitution, diplomaYear) },
      languages,
      technicalQuals.map((tq) => ({
        qualification_name: tq.qualification_name,
        institution: tq.institution,
        year: tq.year,
        hasCertificate: Boolean(tq.certificateFile),
      })),
      {
        profileImage: Boolean(profileImageFile),
        passportImage: Boolean(passportImageFile),
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
        if (key === "diploma") return
        if (value instanceof Date) {
          formData.append(key, format(value, "yyyy-MM-dd"))
        } else if (value !== undefined && value !== null) {
          formData.append(key, value.toString())
        }
      })
      formData.append("diploma", formatDiplomaDetails(diplomaName, diplomaInstitution, diplomaYear))
      formData.append("primary_school", "")
      formData.append("secondary_school", "")
      formData.append("higher_education", "")

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
      if (passportImageFile) formData.append("passport_image_file", passportImageFile)
      if (cnicFrontFile) formData.append("cnic_front_file", cnicFrontFile)
      if (cnicBackFile) formData.append("cnic_back_file", cnicBackFile)
      if (educationalDocFile) formData.append("educational_document_file", educationalDocFile)
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
        router.refresh()
        router.push(data.candidateId ? `/dashboard/candidates/${data.candidateId}` : "/dashboard/candidates")
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create candidate",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating candidate:", error)
      toast({
        title: "Error",
        description: "Failed to create candidate. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout title="Add Candidate">
      <div className="candidate-form-shell candidate-fade-in">
        <form
          id="candidate-form-container"
          onSubmit={handleSubmit}
          className="space-y-5"
          data-testid="candidate-form"
          suppressHydrationWarning
        >
          {/* Hero Header */}
          <div className="candidate-form-hero">
            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/30 ring-4 ring-blue-100 dark:ring-blue-900/50">
                    <span className="text-white font-bold text-2xl">M</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-800 flex items-center justify-center">
                    <Sparkles className="h-2.5 w-2.5 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-800 dark:from-slate-100 dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent tracking-tight">
                    New Candidate Registration
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">MINT International · Overseas Employment</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="candidate-progress-pill">7 sections</span>
                    <span className="candidate-progress-pill">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                      All fields marked * are required
                    </span>
                  </div>
                </div>
              </div>
              <div className="sm:text-right shrink-0">
                <div className="inline-flex flex-col items-start sm:items-end gap-1 rounded-xl bg-white/70 dark:bg-slate-700/50 border border-slate-200/80 dark:border-slate-600/50 px-4 py-3 shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Registration Date</span>
                  <ClientOnly fallback={<span className="text-sm text-slate-500 dark:text-slate-400">—</span>}>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200" suppressHydrationWarning>
                      {format(new Date(), "EEEE, MMMM d, yyyy")}
                    </span>
                  </ClientOnly>
                </div>
              </div>
            </div>
          </div>

          <CandidateFormSection
            id="section-application"
            step={1}
            icon={Briefcase}
            title="Application Details"
            description="Position and referral information"
            contentClassName="grid gap-5 md:grid-cols-2"
          >
            <div className="space-y-2">
              <ReqLabel>Post Applied For</ReqLabel>
              <Input
                data-testid="post_applied_for"
                placeholder="e.g. Driver, Electrician, Welder"
                value={form.post_applied_for}
                onChange={(e) => setField("post_applied_for", e.target.value)}
                className={CANDIDATE_INPUT}
              />
            </div>
            <div className="space-y-2">
              <ReqLabel>Referred By</ReqLabel>
              <Input
                data-testid="referred_by"
                placeholder="Referrer name or agency"
                value={form.referred_by}
                onChange={(e) => setField("referred_by", e.target.value)}
                className={CANDIDATE_INPUT}
              />
            </div>
          </CandidateFormSection>

          <CandidateFormSection
            id="section-personal"
            step={2}
            icon={User}
            title="Personal Information"
            description="Identity details as shown on passport"
            contentClassName="grid gap-5 md:grid-cols-2"
          >
            <div className="space-y-2">
              <ReqLabel>Given Names</ReqLabel>
              <Input
                data-testid="full_name"
                placeholder="Enter given names (as on passport)"
                value={form.full_name}
                onChange={(e) => setField("full_name", e.target.value)}
                className={CANDIDATE_INPUT}
              />
            </div>
            <div className="space-y-2">
              <ReqLabel>Surname</ReqLabel>
              <Input
                data-testid="surname"
                placeholder="Enter surname (as on passport)"
                value={form.surname}
                onChange={(e) => setField("surname", e.target.value)}
                className={CANDIDATE_INPUT}
              />
            </div>

            <div className="space-y-2">
              <ReqLabel>Father Name</ReqLabel>
              <Input
                data-testid="father_name"
                placeholder="Enter father's name"
                value={form.father_name}
                onChange={(e) => setField("father_name", e.target.value)}
                className={CANDIDATE_INPUT}
              />
            </div>

            <div className="space-y-2">
              <ReqLabel>Marital Status</ReqLabel>
              <Select value={form.marital_status} onValueChange={(v) => setField("marital_status", v)}>
                <SelectTrigger className={CANDIDATE_SELECT}>
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
                className={CANDIDATE_INPUT}
              />
            </div>

            <div className="space-y-2">
              <ReqLabel>Gender</ReqLabel>
              <Select value={form.sex} onValueChange={(v) => setField("sex", v)}>
                <SelectTrigger className={CANDIDATE_SELECT}>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <ReqLabel>CNIC</ReqLabel>
              <Input
                data-testid="citizenship_no"
                placeholder="Enter CNIC number"
                value={form.citizenship_no}
                onChange={(e) => setField("citizenship_no", e.target.value)}
                className={`${CANDIDATE_INPUT} font-mono`}
              />
            </div>

            <div className="space-y-2">
              <ReqLabel>Date of Birth</ReqLabel>
              <CandidateDateField
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
          </CandidateFormSection>

          <CandidateFormSection
            id="section-passport"
            step={3}
            icon={Stamp}
            title="Passport & Identity Documents"
            description="Travel document details and ID uploads"
            contentClassName="grid gap-5 md:grid-cols-2"
          >
            <div className="space-y-2">
              <ReqLabel>Passport Number</ReqLabel>
              <Input
                data-testid="passport_no"
                placeholder="Enter passport number"
                value={form.passport_no}
                onChange={(e) => setField("passport_no", e.target.value)}
                className={`${CANDIDATE_INPUT} font-mono`}
              />
            </div>
            <div className="space-y-2">
              <ReqLabel>Place of Issue</ReqLabel>
              <Input
                placeholder="Enter place of issue"
                value={form.place_of_issue}
                onChange={(e) => setField("place_of_issue", e.target.value)}
                className={CANDIDATE_INPUT}
              />
            </div>

            <div className="space-y-2">
              <ReqLabel>Date of Issue</ReqLabel>
              <CandidateDateField
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
              <CandidateDateField
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

            <div className="md:col-span-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 border-t border-slate-100/80 dark:border-slate-600/50 pt-6 mt-1">
              <DocUploadField
                id="passport-picture"
                label="Passport Picture"
                fileName={passportImageName}
                accept="image/*"
                hint="Clear passport photo page, JPG or PNG, max 5MB"
                onFileChange={(e) => handleDocFileChange(e, setPassportImageFile, setPassportImageName)}
                onClear={() => { setPassportImageFile(null); setPassportImageName("") }}
              />
              <DocUploadField
                id="cnic-front"
                label="CNIC Front"
                fileName={cnicFrontName}
                required={false}
                hint="PDF or image, max 5MB"
                onFileChange={(e) => handleDocFileChange(e, setCnicFrontFile, setCnicFrontName)}
                onClear={() => { setCnicFrontFile(null); setCnicFrontName("") }}
              />
              <DocUploadField
                id="cnic-back"
                label="CNIC Back"
                fileName={cnicBackName}
                required={false}
                hint="PDF or image, max 5MB"
                onFileChange={(e) => handleDocFileChange(e, setCnicBackFile, setCnicBackName)}
                onClear={() => { setCnicBackFile(null); setCnicBackName("") }}
              />
            </div>
          </CandidateFormSection>

          <CandidateFormSection
            id="section-qualifications"
            step={4}
            icon={BookOpen}
            title="Qualifications"
            description="Education, diplomas, and language skills"
            contentClassName="space-y-6"
          >
            <DocUploadField
              id="educational-doc"
              label="Educational Certificate"
              fileName={educationalDocName}
              required={false}
              hint="Matric, intermediate, diploma, or degree certificate — PDF or image, max 5MB"
              onFileChange={(e) => handleDocFileChange(e, setEducationalDocFile, setEducationalDocName)}
              onClear={() => { setEducationalDocFile(null); setEducationalDocName("") }}
            />

            {/* Diploma — separate fields */}
            <div className="candidate-nested-panel">
              <FieldLabel className="text-base">Diploma / Technical Certificate</FieldLabel>
              <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">Optional — leave blank if not applicable</p>
              <div className="grid gap-3 md:grid-cols-3">
                <Input
                  placeholder="Diploma / course name"
                  value={diplomaName}
                  onChange={(e) => setDiplomaName(e.target.value)}
                  className={CANDIDATE_INPUT}
                />
                <Input
                  placeholder="Institution"
                  value={diplomaInstitution}
                  onChange={(e) => setDiplomaInstitution(e.target.value)}
                  className={CANDIDATE_INPUT}
                />
                <Input
                  placeholder="Year"
                  value={diplomaYear}
                  onChange={(e) => setDiplomaYear(e.target.value)}
                  className={CANDIDATE_INPUT}
                />
              </div>
              <DocUploadField
                id="diploma-cert"
                label="Upload Certificate"
                fileName={diplomaCertName}
                required={false}
                hint="Upload diploma or technical certificate — PDF or image, max 5MB"
                onFileChange={(e) => handleDocFileChange(e, setDiplomaCertFile, setDiplomaCertName)}
                onClear={() => { setDiplomaCertFile(null); setDiplomaCertName("") }}
              />
            </div>

            {/* Technical Qualifications — optional */}
            <div className="space-y-3 border-t border-slate-100 dark:border-slate-600/50 pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <FieldLabel className="text-base">Technical Qualifications</FieldLabel>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Optional — add trade certifications if any</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTechnicalQual}
                  className="h-9 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
              {technicalQuals.length === 0 ? (
                <div className="candidate-empty-state">
                  <BookOpen className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">No technical qualifications added yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Click Add to include trade certifications</p>
                </div>
              ) : (
              <div className="space-y-4">
                  {technicalQuals.map((tq, index) => (
                    <div key={index} className="candidate-nested-panel !p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wide">
                          <span className="h-5 w-5 rounded-md bg-blue-100 flex items-center justify-center text-[10px]">{index + 1}</span>
                          Qualification
                        </span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeTechnicalQual(index)} className="h-8 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-3">
                        <Input
                          placeholder="Qualification name"
                          value={tq.qualification_name}
                          onChange={(e) => updateTechnicalQual(index, "qualification_name", e.target.value)}
                          className={CANDIDATE_INPUT}
                        />
                        <Input
                          placeholder="Institution"
                          value={tq.institution}
                          onChange={(e) => updateTechnicalQual(index, "institution", e.target.value)}
                          className={CANDIDATE_INPUT}
                        />
                        <Input
                          placeholder="Year"
                          value={tq.year}
                          onChange={(e) => updateTechnicalQual(index, "year", e.target.value)}
                          className={CANDIDATE_INPUT}
                        />
                      </div>
                      <DocUploadField
                        id={`tech-cert-${index}`}
                        label="Certificate"
                        fileName={tq.certificateFileName}
                        required={false}
                        hint="PDF or image, max 5MB"
                        onFileChange={(e) => handleTechQualCertChange(index, e)}
                        onClear={() => clearTechQualCert(index)}
                      />
                    </div>
                  ))}
              </div>
              )}
            </div>

            <div className="space-y-3 border-t border-slate-100 dark:border-slate-600/50 pt-5">
              <ReqLabel>Languages Known</ReqLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="Add language (e.g., English, Urdu)"
                  value={languageInput}
                  onChange={(e) => setLanguageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                  className={CANDIDATE_INPUT}
                />
                <Button
                  type="button"
                  onClick={addLanguage}
                  className="h-11 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {languages.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">No languages added yet</p>
                ) : null}
                {languages.map((lang) => (
                  <span key={lang} className="candidate-lang-chip">
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
          </CandidateFormSection>

          <CandidateFormSection
            id="section-experience"
            step={5}
            icon={Briefcase}
            title="Work Experience"
            description="Years of experience and supporting documents"
            contentClassName="grid gap-6"
          >
            <div className="space-y-4">
              <ReqLabel>Experience (Years)</ReqLabel>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="candidate-exp-stat">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Globe className="h-4 w-4 text-amber-600" />
                    </div>
                    <ReqLabel className="!text-xs text-slate-600 !font-medium">GCC</ReqLabel>
                  </div>
                  <Input
                    data-testid="gcc_experience"
                    placeholder="0"
                    value={form.gcc_experience}
                    onChange={(e) => setField("gcc_experience", sanitizeExperienceInput(e.target.value))}
                    className={`${CANDIDATE_INPUT} text-lg font-semibold text-center`}
                  />
                </div>
                <div className="candidate-exp-stat">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                    </div>
                    <ReqLabel className="!text-xs text-slate-600 !font-medium">KSA</ReqLabel>
                  </div>
                  <Input
                    data-testid="ksa_experience"
                    placeholder="0"
                    value={form.ksa_experience}
                    onChange={(e) => setField("ksa_experience", sanitizeExperienceInput(e.target.value))}
                    className={`${CANDIDATE_INPUT} text-lg font-semibold text-center`}
                  />
                </div>
                <div className="candidate-exp-stat">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-violet-600" />
                    </div>
                    <ReqLabel className="!text-xs text-slate-600 !font-medium">Local</ReqLabel>
                  </div>
                  <Input
                    data-testid="local_experience"
                    placeholder="0"
                    value={form.local_experience}
                    onChange={(e) => setField("local_experience", sanitizeExperienceInput(e.target.value))}
                    className={`${CANDIDATE_INPUT} text-lg font-semibold text-center`}
                  />
                </div>
                <div className="candidate-exp-stat-total">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center shadow-sm">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <Label className="text-xs font-bold text-blue-700 uppercase tracking-wide">Total</Label>
                  </div>
                  <Input
                    data-testid="experience_total"
                    value={experienceTotal || "0"}
                    readOnly
                    className="h-11 rounded-xl border-blue-200/80 dark:border-blue-700/50 bg-white/80 dark:bg-slate-700/60 text-blue-800 dark:text-blue-300 text-xl font-bold text-center cursor-not-allowed shadow-inner"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" />
                Total is calculated automatically from GCC, KSA, and Local experience.
              </p>
            </div>

            <DocUploadField
              id="experience-letter"
              label="Experience Letter"
              fileName={experienceLetterName}
              required={false}
              hint="PDF or image, max 5MB"
              onFileChange={(e) => handleDocFileChange(e, setExperienceLetterFile, setExperienceLetterName)}
              onClear={() => { setExperienceLetterFile(null); setExperienceLetterName("") }}
            />

            <div className="space-y-2">
              <ReqLabel>Remarks</ReqLabel>
              <Textarea
                data-testid="remarks"
                placeholder="Additional remarks or notes about the candidate..."
                value={form.remarks}
                onChange={(e) => setField("remarks", e.target.value)}
                className={`${CANDIDATE_INPUT} min-h-[110px] resize-none`}
              />
            </div>
          </CandidateFormSection>

          <CandidateFormSection
            id="section-cv"
            step={6}
            icon={FileText}
            title="CV Attachment"
            description="Upload the candidate's curriculum vitae"
            contentClassName="max-w-xl"
          >
            <div className="space-y-3">
              <ReqLabel>CV Document</ReqLabel>
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-gradient-to-r from-blue-50 to-indigo-50/60 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-100/80 dark:border-blue-800/50 rounded-xl p-3">
                <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <span>PDF or DOC/DOCX, max 5MB</span>
              </div>
              {cvFileName ? (
                <div className="flex items-center justify-between p-4 border-2 border-emerald-200/80 dark:border-emerald-800/50 rounded-2xl bg-gradient-to-r from-emerald-50/50 to-teal-50/30 dark:from-emerald-950/30 dark:to-teal-950/20 shadow-sm group hover:border-emerald-300 dark:hover:border-emerald-700 transition-all">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shrink-0">
                      <FileDown className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{cvFileName}</span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={removeCvFile}
                    className="rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-md shrink-0 ml-3"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="candidate-upload-zone cursor-pointer py-10">
                  <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 mb-3">
                    <Upload className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                  </div>
                  <Label htmlFor="cv-file" className="cursor-pointer">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700/60 rounded-xl px-5 py-2.5 bg-white dark:bg-slate-700 shadow-sm hover:shadow-md transition-all">
                      <Upload className="h-4 w-4" /> Click to upload CV
                    </span>
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
              )}
            </div>
          </CandidateFormSection>

          {/* Sticky Action Bar */}
          <div className="candidate-sticky-actions">
            <div className="candidate-form-shell flex items-center justify-between gap-4 !max-w-none">
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Review all sections before saving
              </p>
              <div className="flex justify-end gap-3 ml-auto w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/candidates")}
                  className="h-11 px-6 rounded-xl border-2 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 font-semibold dark:text-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-11 px-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 font-semibold disabled:opacity-50"
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
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
