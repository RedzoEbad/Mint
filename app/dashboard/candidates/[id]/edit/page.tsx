"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
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
import { Loader2, CalendarIcon, Plus, X, FileDown, Upload, Image as ImageIcon, Info, ArrowLeft, GraduationCap } from "lucide-react"

type TechnicalQualEntry = {
  qualification_name: string
  institution: string
  year: string
  certificate_file: string
  certificateFileName: string
}

import { PageLoader } from "@/components/ui/page-loader"
import { useToast } from "@/hooks/use-toast"
import { computeExperienceTotal, sanitizeExperienceInput } from "@/lib/candidate-experience"
import { validateCandidateForm, validateDocOrImageFile } from "@/lib/candidate-form-validation"
import { DocUploadField } from "@/components/candidate-doc-upload"

export default function EditCandidatePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [languages, setLanguages] = useState<string[]>([])
  const [languageInput, setLanguageInput] = useState("")

  const [form, setForm] = useState<any>({
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
    cnic_front_image: "",
    cnic_back_image: "",
    matric_certificate: "",
    intermediate_certificate: "",
    diploma_certificate: "",
    experience_letter: "",
    profile_image: "",
    cv_file: "",
    remarks: "",
    status: "",
  })

  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string>("")
  const [cvFileName, setCvFileName] = useState<string>("")
  const [technicalQuals, setTechnicalQuals] = useState<TechnicalQualEntry[]>([])

  const experienceTotal = useMemo(
    () => computeExperienceTotal(form.gcc_experience, form.ksa_experience, form.local_experience),
    [form.gcc_experience, form.ksa_experience, form.local_experience],
  )

  useEffect(() => {
    if (!id) return
      ; (async () => {
        try {
          const res = await fetch(`/api/candidates/${id}`)
          const json = await res.json()
          if (json.success) {
            const c = json.data
            setForm({
              ...form,
              ...c,
              date_of_birth: c.date_of_birth ? new Date(c.date_of_birth) : undefined,
              date_of_issue: c.date_of_issue ? new Date(c.date_of_issue) : undefined,
              date_of_expiry: c.date_of_expiry ? new Date(c.date_of_expiry) : undefined,
            })
            setLanguages(Array.isArray(c.languages_known) ? c.languages_known : [])
            if (c.profile_image) {
              const url = typeof c.profile_image === 'string' && !c.profile_image.startsWith('http') && !c.profile_image.startsWith('/')
                ? `/${c.profile_image}`
                : c.profile_image
              setProfileImagePreview(url)
            }
            if (c.cv_file) setCvFileName(c.cv_file.split("/").pop())
            if (Array.isArray(c.technical_qualification_details)) {
              setTechnicalQuals(c.technical_qualification_details.map((tq: any) => ({
                qualification_name: tq.qualification_name || "",
                institution: tq.institution || "",
                year: tq.year || "",
                certificate_file: tq.certificate_file || "",
                certificateFileName: tq.certificate_file ? tq.certificate_file.split("/").pop() : "",
              })))
            }
            if (Array.isArray(c.technical_qualification_details) && c.technical_qualification_details.length === 0) {
              setTechnicalQuals([{ qualification_name: "", institution: "", year: "", certificate_file: "", certificateFileName: "" }])
            }
          }
        } catch (e) {
          console.error("Load candidate error", e)
        } finally {
          setLoading(false)
        }
      })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  function setField(key: string, value: any) {
    setForm((prev: any) => ({ ...prev, [key]: value }))
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
    setTechnicalQuals((prev) => [...prev, { qualification_name: "", institution: "", year: "", certificate_file: "", certificateFileName: "" }])
  }

  function updateTechnicalQual(index: number, field: keyof TechnicalQualEntry, value: string) {
    setTechnicalQuals((prev) => prev.map((tq, i) => (i === index ? { ...tq, [field]: value } : tq)))
  }

  function removeTechnicalQual(index: number) {
    setTechnicalQuals((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleTechQualCertChange(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
    if (!allowed.includes(file.type)) {
      toast({ title: "Invalid file", description: "Only PDF or image files allowed.", variant: "destructive" })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max size is 5MB.", variant: "destructive" })
      return
    }
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/uploads/certificates", { method: "POST", body: fd })
      const data = await res.json()
      if (data.success) {
        setTechnicalQuals((prev) => prev.map((tq, i) => i === index ? { ...tq, certificate_file: data.url, certificateFileName: file.name } : tq))
      }
    } catch { }
  }

  async function uploadDocFile(file: File, folder: string): Promise<string | null> {
    const err = validateDocOrImageFile(file)
    if (err) {
      toast({ title: "Invalid file", description: err, variant: "destructive" })
      return null
    }
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch(`/api/uploads/${folder}`, { method: "POST", body: fd })
      const data = await res.json()
      return data.success ? data.url : null
    } catch {
      return null
    }
  }

  async function handleDocFieldUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    field: string,
    folder: string,
  ) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await uploadDocFile(file, folder)
    if (url) setField(field, url)
  }

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
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
    reader.onload = (ev) => setProfileImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    // Upload to get URL
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/uploads/profile-images", { method: "POST", body: fd })
      const data = await res.json()
      if (data.success) setField("profile_image", data.url)
    } catch { }
  }

  const handleCvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
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

    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/uploads/cv-docs", { method: "POST", body: fd })
      const data = await res.json()
      if (data.success) setField("cv_file", data.url)
    } catch { }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()

    const validation = validateCandidateForm(
      form,
      languages,
      technicalQuals.map((tq) => ({
        qualification_name: tq.qualification_name,
        institution: tq.institution,
        year: tq.year,
        hasCertificate: Boolean(tq.certificate_file),
      })),
      {
        profileImage: Boolean(form.profile_image),
        cnicFront: Boolean(form.cnic_front_image),
        cnicBack: Boolean(form.cnic_back_image),
        matricCertificate: Boolean(form.matric_certificate),
        intermediateCertificate: Boolean(form.intermediate_certificate),
        diplomaCertificate: Boolean(form.diploma_certificate),
        experienceLetter: Boolean(form.experience_letter),
        cv: Boolean(form.cv_file),
      },
    )

    if (!validation.valid) {
      toast({ title: "Incomplete form", description: validation.message, variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const body = {
        ...form,
        date_of_birth: form.date_of_birth ? format(form.date_of_birth, "yyyy-MM-dd") : null,
        date_of_issue: form.date_of_issue ? format(form.date_of_issue, "yyyy-MM-dd") : null,
        date_of_expiry: form.date_of_expiry ? format(form.date_of_expiry, "yyyy-MM-dd") : null,
        languages_known: languages,
        technical_qualification_details: technicalQuals
          .filter((tq) => tq.qualification_name.trim())
          .map(({ qualification_name, institution, year, certificate_file }) => ({ qualification_name, institution, year, certificate_file })),
      }
      const res = await fetch(`/api/candidates/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.success) {
        toast({ title: "Success", description: "Candidate updated successfully" })
        router.push("/dashboard/candidates")
      } else {
        toast({ title: "Error", description: json.message || "Failed to update", variant: "destructive" })
      }
    } catch (e) {
      console.error("Save error", e)
      toast({ title: "Error", description: "Failed to save changes", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Edit Candidate">
        <PageLoader message="Loading candidate..." />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Edit Candidate">
      <form onSubmit={handleSave} className="space-y-6">
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.push(`/dashboard/candidates/${id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
            {saving ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Saving...</span> : "Save Changes"}
          </Button>
        </div>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Given Names</Label>
              <Input placeholder="Given names (as on passport)" value={form.full_name} onChange={(e) => setField("full_name", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Surname</Label>
              <Input placeholder="Surname (as on passport)" value={form.surname} onChange={(e) => setField("surname", e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Father's Name</Label>
              <Input placeholder="Father name" value={form.father_name} onChange={(e) => setField("father_name", e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Marital Status</Label>
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
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Religion</Label>
              <Input placeholder="Religion" value={form.religion} onChange={(e) => setField("religion", e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Sex</Label>
              <Select value={form.sex} onValueChange={(v) => setField("sex", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">M (Male)</SelectItem>
                  <SelectItem value="F">F (Female)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Citizenship Number</Label>
              <Input placeholder="Citizenship number" value={form.citizenship_no} onChange={(e) => setField("citizenship_no", e.target.value)} className="font-mono" />
            </div>

            {/* Date of Birth */}
            <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
              <DateField
                label="Date of birth"
                date={form.date_of_birth}
                onSelect={(d) => setField("date_of_birth", d)}
                fromYear={1950}
                toYear={new Date().getFullYear()}
                disableFuture
              />
            </div>
            <div className="md:col-span-2 border-t pt-4 space-y-2">
              <Label>Profile Image</Label>
              {profileImagePreview ? (
                <div className="relative w-full max-w-[220px] aspect-[3/4] rounded-xl border bg-gray-50 overflow-hidden">
                  <img src={profileImagePreview} alt="Profile preview" className="absolute inset-0 h-full w-full object-cover" />
                </div>
              ) : null}
              <input id="profile-image" type="file" accept="image/*" onChange={handleProfileImageChange} className="block text-sm" />
            </div>
          </CardContent>
        </Card>

        {/* Passport Details */}
        <Card>
          <CardHeader>
            <CardTitle>Passport Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Input placeholder="Passport no" value={form.passport_no} onChange={(e) => setField("passport_no", e.target.value)} />
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
            <div className="md:col-span-2 grid gap-4 sm:grid-cols-2 border-t pt-4">
              <DocUploadField
                id="edit-cnic-front"
                label="CNIC Front Image"
                fileName={form.cnic_front_image ? form.cnic_front_image.split("/").pop() : ""}
                onFileChange={(e) => handleDocFieldUpload(e, "cnic_front_image", "cnic-images")}
              />
              <DocUploadField
                id="edit-cnic-back"
                label="CNIC Back Image"
                fileName={form.cnic_back_image ? form.cnic_back_image.split("/").pop() : ""}
                onFileChange={(e) => handleDocFieldUpload(e, "cnic_back_image", "cnic-images")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Qualifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              Qualifications
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Primary School</Label>
                <Input placeholder="School name, year completed" value={form.primary_school} onChange={(e) => setField("primary_school", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Secondary School</Label>
                <Input placeholder="School name, year completed" value={form.secondary_school} onChange={(e) => setField("secondary_school", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Higher Education</Label>
                <Input placeholder="University / college, degree, year" value={form.higher_education} onChange={(e) => setField("higher_education", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Diploma</Label>
                <Input placeholder="Diploma name, institution, year" value={form.diploma} onChange={(e) => setField("diploma", e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 border-t pt-4">
              <DocUploadField
                id="edit-matric"
                label="Matric Certificate"
                fileName={form.matric_certificate ? form.matric_certificate.split("/").pop() : ""}
                onFileChange={(e) => handleDocFieldUpload(e, "matric_certificate", "certificates")}
              />
              <DocUploadField
                id="edit-intermediate"
                label="Intermediate Certificate"
                fileName={form.intermediate_certificate ? form.intermediate_certificate.split("/").pop() : ""}
                onFileChange={(e) => handleDocFieldUpload(e, "intermediate_certificate", "certificates")}
              />
              <DocUploadField
                id="edit-diploma-cert"
                label="Diploma Certificate"
                fileName={form.diploma_certificate ? form.diploma_certificate.split("/").pop() : ""}
                onFileChange={(e) => handleDocFieldUpload(e, "diploma_certificate", "certificates")}
              />
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Technical Qualifications</Label>
                <Button type="button" variant="outline" size="sm" onClick={addTechnicalQual}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
              {technicalQuals.map((tq, index) => (
                <div key={index} className="p-3 border rounded-lg space-y-2 bg-gray-50">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">#{index + 1}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeTechnicalQual(index)} className="h-7 text-red-600">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-2 md:grid-cols-3">
                    <Input placeholder="Qualification name" value={tq.qualification_name} onChange={(e) => updateTechnicalQual(index, "qualification_name", e.target.value)} />
                    <Input placeholder="Institution" value={tq.institution} onChange={(e) => updateTechnicalQual(index, "institution", e.target.value)} />
                    <Input placeholder="Year" value={tq.year} onChange={(e) => updateTechnicalQual(index, "year", e.target.value)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`edit-tech-cert-${index}`} className="cursor-pointer text-sm text-blue-600 border border-blue-200 rounded px-3 py-1.5 bg-white">
                      <Upload className="h-3.5 w-3.5 inline mr-1" />
                      {tq.certificateFileName || "Attach Certification"}
                    </Label>
                    <input id={`edit-tech-cert-${index}`} type="file" accept=".pdf,image/*" onChange={(e) => handleTechQualCertChange(index, e)} className="hidden" />
                    {tq.certificate_file && (
                      <a href={tq.certificate_file} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">View</a>
                    )}
                  </div>
                </div>
              ))}
            </div>

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

        {/* Role & Experience */}
        <Card>
          <CardHeader>
            <CardTitle>Role & Experience</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input placeholder="Post applied for" value={form.post_applied_for} onChange={(e) => setField("post_applied_for", e.target.value)} />
              <Input placeholder="Referred by" value={form.referred_by} onChange={(e) => setField("referred_by", e.target.value)} />
            </div>
            <div className="border-t pt-4 space-y-3">
              <Label className="text-sm font-medium">Experience (Years)</Label>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">GCC Experience</Label>
                  <Input
                    placeholder="Years"
                    value={form.gcc_experience}
                    onChange={(e) => setField("gcc_experience", sanitizeExperienceInput(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">KSA Experience</Label>
                  <Input
                    placeholder="Years"
                    value={form.ksa_experience}
                    onChange={(e) => setField("ksa_experience", sanitizeExperienceInput(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Local Experience</Label>
                  <Input
                    placeholder="Years"
                    value={form.local_experience}
                    onChange={(e) => setField("local_experience", sanitizeExperienceInput(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Total Experience</Label>
                  <Input value={experienceTotal || "0"} readOnly className="bg-gray-100 font-semibold cursor-not-allowed" />
                </div>
              </div>
            </div>
            <DocUploadField
              id="edit-experience-letter"
              label="Experience Letter"
              fileName={form.experience_letter ? form.experience_letter.split("/").pop() : ""}
              onFileChange={(e) => handleDocFieldUpload(e, "experience_letter", "experience-letters")}
            />
            <Textarea placeholder="Remarks" value={form.remarks} onChange={(e) => setField("remarks", e.target.value)} />
          </CardContent>
        </Card>

        {/* CV Attachment */}
        <Card>
          <CardHeader>
            <CardTitle>CV Attachment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-w-xl">
              <Label htmlFor="cv-file">CV Document</Label>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Info className="h-3.5 w-3.5" /> PDF or DOC/DOCX, max 5MB
              </p>
              {form.cv_file ? (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <FileDown className="h-4 w-4 text-gray-500" />
                    <a href={form.cv_file} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">
                      {cvFileName || form.cv_file.split('/').pop()}
                    </a>
                  </div>
                  <Button type="button" variant="destructive" size="sm" onClick={() => { setCvFile(null); setCvFileName(""); setField("cv_file", "") }}>
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
                    <input id="cv-file" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleCvFileChange} className="hidden" />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
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
