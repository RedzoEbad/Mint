"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getValidToken } from "@/lib/token-utils"
import { FileDown, Edit, ArrowLeft, FileSpreadsheet } from "lucide-react"
import { format } from "date-fns"
import { PageLoader } from "@/components/ui/page-loader"
import { SecureFileLink, SecureImage } from "@/components/secure-file"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function CandidateDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
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
      const token = getValidToken()
      const res = await fetch(`/api/candidates/${id}/pdf?type=${type}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error("Failed to generate PDF")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `candidate-${type}-${candidate?.id || id}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error("PDF error", e)
    }
  }

  return (
    <DashboardLayout title="Candidate Details">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.push("/dashboard/candidates")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div className="flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline"><FileDown className="h-4 w-4 mr-2" /> Download PDF</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => downloadPdf("client")} className="cursor-pointer">
                  Client PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => downloadPdf("own")} className="cursor-pointer">
                  Full PDF (Internal)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={downloadExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-2" /> Download Excel
            </Button>
            <Button asChild>
              <Link href={`/dashboard/candidates/${id}/edit`}><Edit className="h-4 w-4 mr-2" /> Edit</Link>
            </Button>
          </div>
        </div>

        {/* Print-friendly form container mirroring Add page sections */}
        <div id="candidate-print-container" className="space-y-6 bg-white p-6 rounded-xl shadow-sm text-[15px] leading-relaxed tracking-wide">
          <div className="flex items-center justify-between pb-4 border-b">
            <div className="flex items-center gap-3">
              <img src="/images/mint-logo.png" alt="MINT International" className="h-8 w-auto" />
              <div>
                <div className="text-lg font-semibold">MINT International</div>
                <div className="text-xs text-gray-500">Candidate Form</div>
              </div>
            </div>
            <div className="text-xs text-gray-500">{format(new Date(), "PPpp")}</div>
          </div>

          {loading ? (
            <PageLoader message="Loading candidate..." />
          ) : !candidate ? (
            <div>Not found.</div>
          ) : (
            <>
              {/* Date formatter */}
              {/**/}
              {/**/}

              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <StaticField label="Given Names" value={candidate.full_name} />
                  <StaticField label="Surname" value={candidate.surname} />
                  <StaticField label="Father's Name" value={candidate.father_name} />
                  <StaticField label="Marital Status" value={candidate.marital_status} />
                  <StaticField label="Religion" value={candidate.religion} />
                  <StaticField label="Sex" value={candidate.sex} />
                  <StaticField label="Citizenship Number" value={candidate.citizenship_no} />
                  <StaticField label="Date of Birth" value={candidate.date_of_birth ? format(new Date(candidate.date_of_birth), "PPP") : "-"} />
                  {candidate.profile_image ? (
                    <div className="md:col-span-2">
                      <div className="text-xs text-gray-500 mb-2">Profile image</div>
                      <SecureImage src={candidate.profile_image} alt="Profile" className="w-32 h-40 object-cover rounded-lg border" />
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              {/* Passport Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Passport Details</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <StaticField label="Passport no" value={candidate.passport_no} />
                    <StaticField label="Place of issue" value={candidate.place_of_issue} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <StaticField label="Date of issue" value={candidate.date_of_issue ? format(new Date(candidate.date_of_issue), "PPP") : "-"} />
                    <StaticField label="Date of expiry" value={candidate.date_of_expiry ? format(new Date(candidate.date_of_expiry), "PPP") : "-"} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <DocLink label="CNIC front" url={candidate.cnic_front_image} />
                    <DocLink label="CNIC back" url={candidate.cnic_back_image} />
                  </div>
                </CardContent>
              </Card>

              {/* Qualifications */}
              <Card>
                <CardHeader>
                  <CardTitle>Qualifications</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <StaticField label="Primary school" value={candidate.primary_school} />
                    <StaticField label="Secondary school" value={candidate.secondary_school} />
                    <StaticField label="Higher education" value={candidate.higher_education} />
                    <StaticField label="Diploma" value={candidate.diploma} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <DocLink label="Matric certificate" url={candidate.matric_certificate} />
                    <DocLink label="Intermediate certificate" url={candidate.intermediate_certificate} />
                    <DocLink label="Diploma certificate" url={candidate.diploma_certificate} />
                  </div>
                  {Array.isArray(candidate.technical_qualification_details) && candidate.technical_qualification_details.length > 0 ? (
                    <div>
                      <div className="mb-2 text-sm text-gray-600">Technical qualifications</div>
                      <div className="space-y-2">
                        {candidate.technical_qualification_details.map((tq: any) => (
                          <div key={tq.id} className="p-3 border rounded-lg bg-gray-50 text-sm">
                            <div className="font-medium">{tq.qualification_name}</div>
                            {tq.institution && <div className="text-gray-600">Institution: {tq.institution}</div>}
                            {tq.year && <div className="text-gray-600">Year: {tq.year}</div>}
                            {tq.certificate_file && (
                              <a href={tq.certificate_file} target="_blank" rel="noreferrer" className="text-blue-600 underline text-xs mt-1 inline-block">
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
                      <div className="mb-2 text-sm text-gray-600">Languages known</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {candidate.languages_known.map((lang: string) => (
                          <span key={lang} className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 text-xs">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              {/* Role & Experience */}
              <Card>
                <CardHeader>
                  <CardTitle>Role & Experience</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <StaticField label="Post applied for" value={candidate.post_applied_for} />
                    <StaticField label="Referred by" value={candidate.referred_by} />
                  </div>
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

              {/* CV */}
              <Card>
                <CardHeader>
                  <CardTitle>CV Attachment</CardTitle>
                </CardHeader>
                <CardContent>
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
    <div className={`space-y-1 ${className || ""}`.trim()}>
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-sm ${multiline ? "whitespace-pre-wrap" : ""}`.trim()}>{value || "-"}</div>
    </div>
  )
}

function DocLink({ label, url }: { label: string; url?: string }) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-gray-500">{label}</div>
      <SecureFileLink url={url} label="View document" />
    </div>
  )
}
