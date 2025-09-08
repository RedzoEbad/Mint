"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getValidToken } from "@/lib/token-utils"
import { FileDown, Edit, ArrowLeft } from "lucide-react"
import { format } from "date-fns"

export default function CandidateDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [candidate, setCandidate] = useState<any>(null)

  useEffect(() => {
    if (!id) return
    ;(async () => {
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

  async function downloadPdf() {
    try {
      const token = getValidToken()
      const res = await fetch(`/api/candidates/${id}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error("Failed to generate PDF")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `candidate-form-${candidate?.id || id}.pdf`
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadPdf}><FileDown className="h-4 w-4 mr-2" /> PDF</Button>
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
            <div>Loading...</div>
          ) : !candidate ? (
            <div>Not found.</div>
          ) : (
            <>
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <StaticField label="Full name" value={candidate.full_name} />
                  <StaticField label="Father name" value={candidate.father_name} />

                  <div className="flex items-center gap-2 md:col-span-2">
                    <StaticField label="Marital status" value={candidate.marital_status} className="flex-1" />
                    <StaticField label="Religion" value={candidate.religion} className="flex-1" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:col-span-2">
                    <StaticField label="Date of birth" value={candidate.date_of_birth?.slice(0,10)} />
                    <StaticField label="Date of issue" value={candidate.date_of_issue?.slice(0,10)} />
                    <StaticField label="Date of expiry" value={candidate.date_of_expiry?.slice(0,10)} />
                  </div>

                  <StaticField label="Place of issue" value={candidate.place_of_issue} />
                  <StaticField label="Passport no" value={candidate.passport_no} />
                </CardContent>
              </Card>

              {/* Qualifications */}
              <Card>
                <CardHeader>
                  <CardTitle>Qualifications</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <StaticField label="Academic qualifications" value={candidate.academic_qualifications} multiline />
                  <StaticField label="Technical qualifications" value={candidate.technical_qualifications} multiline />
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
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <StaticField label="Post applied for" value={candidate.post_applied_for} />
                  <StaticField label="Referred by" value={candidate.referred_by} />
                  <StaticField label="Experience total (years)" value={candidate.experience_total} />
                  <StaticField label="Remarks" value={candidate.remarks} multiline />
                </CardContent>
              </Card>

              {/* Attachments */}
              <Card>
                <CardHeader>
                  <CardTitle>Attachments</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500">Profile Image</div>
                    {candidate.profile_image ? (
                      <img src={candidate.profile_image} alt="Profile" className="w-full h-32 object-cover rounded-lg border" />
                    ) : (
                      <div className="text-xs text-gray-400">No image uploaded</div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500">CV Document</div>
                    {candidate.cv_file ? (
                      <a href={candidate.cv_file} target="_blank" rel="noreferrer" className="text-blue-600 underline">Open CV</a>
                    ) : (
                      <div className="text-xs text-gray-400">No CV uploaded</div>
                    )}
                  </div>
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


