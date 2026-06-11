"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getValidToken } from "@/lib/token-utils"
import { FileDown, Edit, ArrowLeft, FileSpreadsheet } from "lucide-react"
import { format } from "date-fns"
import { PageLoader } from "@/components/ui/page-loader"
import { useToast } from "@/hooks/use-toast"
import { SecureFileLink, SecureImage } from "@/components/secure-file"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const sectionCardClass = "candidate-glass-card border-0 shadow-md overflow-hidden"
const sectionHeaderClass =
  "border-b border-slate-100/80 dark:border-slate-600/50 bg-slate-50/60 dark:bg-slate-800/50 pb-4"

export default function CandidateDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [candidate, setCandidate] = useState<any>(null)

  useEffect(() => {
    if (!id) return
      ; (async () => {
        try {
          const token = getValidToken()
          const res = await fetch(`/api/candidates/${id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          })
          const json = await res.json()
          if (json.success) setCandidate(json.data)
        } catch (e) {
          console.error("Load candidate error", e)
        } finally {
          setLoading(false)
        }
      })()
  }, [id])

  async function downloadExcel() {
    try {
      const token = getValidToken()
      const res = await fetch(`/api/candidates/${id}/excel`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error("Failed to generate Excel")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `candidate-${candidate?.passport_no || id}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error("Excel error", e)
    }
  }

  async function downloadPdf(type: "client" | "own" = "own") {
    try {
      const res = await fetch(`/api/candidates/${id}/pdf?type=${type}`, {
        credentials: "include",
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to generate PDF")
      }
      const blob = await res.blob()
      if (blob.type && !blob.type.includes("pdf")) {
        throw new Error("Server did not return a PDF file")
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `candidate-${type}-${candidate?.id || id}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      console.error("PDF error", e)
      toast({ title: "PDF download failed", description: e?.message || "Could not generate PDF", variant: "destructive" })
    }
  }

  return (
    <DashboardLayout title="Candidate Details">
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/candidates")}
            className="dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div className="flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-700">
                  <FileDown className="h-4 w-4 mr-2" /> Download PDF
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="dark:bg-slate-800 dark:border-slate-600">
                <DropdownMenuItem onClick={() => downloadPdf("client")} className="cursor-pointer dark:focus:bg-slate-700">
                  FORM-B (Client PDF)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => downloadPdf("own")} className="cursor-pointer dark:focus:bg-slate-700">
                  FORM-A (Internal PDF)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={downloadExcel} className="dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-700">
              <FileSpreadsheet className="h-4 w-4 mr-2" /> Download Excel
            </Button>
            <Button asChild>
              <Link href={`/dashboard/candidates/${id}/edit`}><Edit className="h-4 w-4 mr-2" /> Edit</Link>
            </Button>
          </div>
        </div>

        <div
          id="candidate-print-container"
          className="space-y-6 glass-card candidate-glass-card p-6 rounded-xl shadow-sm text-[15px] leading-relaxed tracking-wide text-slate-900 dark:text-slate-100 print:bg-white print:text-black"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-600/50">
            <div className="flex items-center gap-3">
              <img src="/images/mint-logo.png" alt="MINT International" className="h-8 w-auto" />
              <div>
                <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">MINT International</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Candidate Form</div>
              </div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{format(new Date(), "PPpp")}</div>
          </div>

          {loading ? (
            <PageLoader message="Loading candidate..." />
          ) : !candidate ? (
            <div className="text-slate-600 dark:text-slate-400">Not found.</div>
          ) : (
            <>
              <Card className={sectionCardClass}>
                <CardHeader className={sectionHeaderClass}>
                  <CardTitle className="text-slate-900 dark:text-slate-100">Application Details</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 pt-6">
                  <StaticField label="Post applied for" value={candidate.post_applied_for} />
                  <StaticField label="Referred by" value={candidate.referred_by} />
                </CardContent>
              </Card>

              <Card className={sectionCardClass}>
                <CardHeader className={sectionHeaderClass}>
                  <CardTitle className="text-slate-900 dark:text-slate-100">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 pt-6">
                  <StaticField label="Given Names" value={candidate.full_name} />
                  <StaticField label="Surname" value={candidate.surname} />
                  <StaticField label="Father's Name" value={candidate.father_name} />
                  <StaticField label="Marital Status" value={candidate.marital_status} />
                  <StaticField label="Religion" value={candidate.religion} />
                  <StaticField label="Gender" value={candidate.sex === "M" ? "Male" : candidate.sex === "F" ? "Female" : candidate.sex} />
                  <StaticField label="CNIC" value={candidate.citizenship_no} />
                  <StaticField label="Date of Birth" value={candidate.date_of_birth ? format(new Date(candidate.date_of_birth), "PPP") : "-"} />
                  {candidate.profile_image ? (
                    <div className="md:col-span-2">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">Profile image</div>
                      <SecureImage
                        src={candidate.profile_image}
                        alt="Profile"
                        className="w-32 h-40 object-cover rounded-lg border border-slate-200 dark:border-slate-600"
                      />
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card className={sectionCardClass}>
                <CardHeader className={sectionHeaderClass}>
                  <CardTitle className="text-slate-900 dark:text-slate-100">Passport Details</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <StaticField label="Passport no" value={candidate.passport_no} />
                    <StaticField label="Place of issue" value={candidate.place_of_issue} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <StaticField label="Date of issue" value={candidate.date_of_issue ? format(new Date(candidate.date_of_issue), "PPP") : "-"} />
                    <StaticField label="Date of expiry" value={candidate.date_of_expiry ? format(new Date(candidate.date_of_expiry), "PPP") : "-"} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <DocLink label="Passport picture" url={candidate.passport_image} />
                    <DocLink label="CNIC front" url={candidate.cnic_front_image} />
                    <DocLink label="CNIC back" url={candidate.cnic_back_image} />
                  </div>
                </CardContent>
              </Card>

              <Card className={sectionCardClass}>
                <CardHeader className={sectionHeaderClass}>
                  <CardTitle className="text-slate-900 dark:text-slate-100">Qualifications</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 pt-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <StaticField label="Primary school" value={candidate.primary_school} />
                    <StaticField label="Secondary school" value={candidate.secondary_school} />
                    <StaticField label="Higher education" value={candidate.higher_education} />
                    <StaticField label="Diploma" value={candidate.diploma} />
                  </div>
                  <DocLink label="Educational document" url={candidate.matric_certificate || candidate.intermediate_certificate || candidate.diploma_certificate} />
                  {Array.isArray(candidate.technical_qualification_details) && candidate.technical_qualification_details.length > 0 ? (
                    <div>
                      <div className="mb-2 text-sm text-slate-600 dark:text-slate-400">Technical qualifications</div>
                      <div className="space-y-2">
                        {candidate.technical_qualification_details.map((tq: any) => (
                          <div
                            key={tq.id}
                            className="p-3 border border-slate-200 dark:border-slate-600/50 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-sm"
                          >
                            <div className="font-medium text-slate-900 dark:text-slate-100">{tq.qualification_name}</div>
                            {tq.institution && <div className="text-slate-600 dark:text-slate-400">Institution: {tq.institution}</div>}
                            {tq.year && <div className="text-slate-600 dark:text-slate-400">Year: {tq.year}</div>}
                            {tq.certificate_file && (
                              <a
                                href={tq.certificate_file}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 dark:text-blue-400 underline text-xs mt-1 inline-block"
                              >
                                View certification
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {Array.isArray(candidate.languages_known) && candidate.languages_known.length > 0 ? (
                    <div>
                      <div className="mb-2 text-sm text-slate-600 dark:text-slate-400">Languages known</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {candidate.languages_known.map((lang: string) => (
                          <span key={lang} className="candidate-lang-chip text-xs py-1">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card className={sectionCardClass}>
                <CardHeader className={sectionHeaderClass}>
                  <CardTitle className="text-slate-900 dark:text-slate-100">Experience</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 pt-6">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StaticField label="GCC experience (years)" value={candidate.gcc_experience} />
                    <StaticField label="KSA experience (years)" value={candidate.ksa_experience} />
                    <StaticField label="Local experience (years)" value={candidate.local_experience} />
                    <StaticField label="Total experience (years)" value={candidate.experience_total} />
                  </div>
                  <DocLink label="Experience letter" url={candidate.experience_letter} />
                  <StaticField label="Remarks" value={candidate.remarks} multiline />
                </CardContent>
              </Card>

              <Card className={sectionCardClass}>
                <CardHeader className={sectionHeaderClass}>
                  <CardTitle className="text-slate-900 dark:text-slate-100">CV Attachment</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <DocLink label="CV document" url={candidate.cv_file} />
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

function StaticField({ label, value, className, multiline }: { label: string; value?: string; className?: string; multiline?: boolean }) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className={cn("text-sm text-slate-900 dark:text-slate-100", multiline && "whitespace-pre-wrap")}>{value || "-"}</div>
    </div>
  )
}

function DocLink({ label, url }: { label: string; url?: string }) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <SecureFileLink url={url} label="View document" />
    </div>
  )
}
