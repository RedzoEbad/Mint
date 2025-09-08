"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { getValidToken } from "@/lib/token-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Users, UserPlus, Search, Eye, Edit, Trash2, Calendar, FileText, FileDown } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { EmptyCandidates, EmptySearch } from "@/components/ui/empty-state"

interface Candidate {
  id: string
  full_name: string
  father_name: string
  passport_no: string
  post_applied_for: string
  status: "active" | "in_process" | "completed" | "rejected"
  created_at: string
  created_by_name: string
  experience_count: number
  marital_status?: string
  religion?: string
  date_of_birth?: string
  place_of_issue?: string
  date_of_issue?: string
  date_of_expiry?: string
  academic_qualifications?: string
  technical_qualifications?: string
  languages_known?: string[]
  referred_by?: string
  experience_total?: number
  remarks?: string
  profile_image?: string
}

interface Stats {
  total: number
  today: number
  statusBreakdown: Record<string, number>
  recent: Candidate[]
}

export default function ReceptionistDashboard() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [detailedCandidate, setDetailedCandidate] = useState<any>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchStats()
    fetchCandidates()
  }, [])

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      setHasSearched(true)
      fetchCandidates()
    }, 300)

    return () => clearTimeout(delayedSearch)
  }, [searchTerm, statusFilter])

  const fetchStats = async () => {
    try {
      const token = getValidToken()
      const response = await fetch("/api/candidates/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const fetchCandidates = async () => {
    try {
      setLoading(true)
      const token = getValidToken()
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (statusFilter !== "all") params.append("status", statusFilter)

      const response = await fetch(`/api/candidates?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setCandidates(data.data)
      }
    } catch (error) {
      console.error("Error fetching candidates:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCandidate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this candidate?")) return

    try {
      const token = getValidToken()
      const response = await fetch(`/api/candidates/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Candidate deleted successfully",
        })
        fetchCandidates()
        fetchStats()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to delete candidate",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deleting the candidate",
        variant: "destructive",
      })
    }
  }

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setHasSearched(false)
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-100 text-green-800",
      in_process: "bg-blue-100 text-blue-800",
      completed: "bg-purple-100 text-purple-800",
      rejected: "bg-red-100 text-red-800",
    }
    return (
      <Badge className={variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    )
  }

  const fetchCandidateDetails = async (id: string) => {
    try {
      const token = getValidToken()
      const response = await fetch(`/api/candidates/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setDetailedCandidate(data.data)
      }
    } catch (error) {
      console.error("Error fetching candidate details:", error)
    }
  }

  const handleDownloadPDF = async (candidateId: string) => {
    try {
      const token = getValidToken()
      const response = await fetch(`/api/candidates/${candidateId}/pdf`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.style.display = "none"
        a.href = url
        a.download = `candidate-${candidateId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Success",
          description: "PDF downloaded successfully",
        })
      } else {
        throw new Error("PDF generation failed")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download PDF",
        variant: "destructive",
      })
    }
  }

  return (
    <DashboardLayout title="Receptionist Dashboard">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats?.total || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Today</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.today || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats?.statusBreakdown?.active || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Process</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats?.statusBreakdown?.in_process || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="in_process">In Process</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button asChild className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
            <Link href="/dashboard/candidates/add">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Candidate
            </Link>
          </Button>
        </div>

        {/* Candidates Table */}
        <Card>
          <CardHeader>
            <CardTitle>Candidates</CardTitle>
            <CardDescription>Manage candidate profiles and information</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : candidates.length === 0 ? (
              hasSearched ? (
                <EmptySearch onClear={clearFilters} />
              ) : (
                <EmptyCandidates onCreate={() => (window.location.href = "/dashboard/candidates/add")} />
              )
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Passport No</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{candidate.full_name}</div>
                          <div className="text-sm text-gray-500">{candidate.father_name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{candidate.passport_no}</TableCell>
                      <TableCell>{candidate.post_applied_for}</TableCell>
                      <TableCell>{getStatusBadge(candidate.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">{new Date(candidate.created_at).toLocaleDateString()}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedCandidate(candidate)
                                  fetchCandidateDetails(candidate.id)
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center justify-between">
                                  <span>Candidate Details</span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownloadPDF(selectedCandidate?.id || "")}
                                    className="ml-4"
                                  >
                                    <FileDown className="h-4 w-4 mr-2" />
                                    Download PDF
                                  </Button>
                                </DialogTitle>
                                <DialogDescription>View and download candidate information</DialogDescription>
                              </DialogHeader>
                              {detailedCandidate && (
                                <div
                                  id="candidate-print-container"
                                  className="space-y-6 bg-white p-6 rounded-xl shadow-sm text-[15px] leading-relaxed tracking-wide"
                                >
                                  <div className="flex items-center justify-between pb-4 border-b">
                                    <div className="flex items-center gap-3">
                                      <img
                                        src="/images/mint-logo.png"
                                        alt="MINT International"
                                        className="h-8 w-auto"
                                      />
                                      <div>
                                        <div className="text-lg font-semibold">MINT International</div>
                                        <div className="text-xs text-gray-500">Candidate Form</div>
                                      </div>
                                    </div>
                                    <div className="text-xs text-gray-500">{new Date().toLocaleDateString()}</div>
                                  </div>

                                  <div className="border border-gray-200 rounded-lg p-4">
                                    <h3 className="font-semibold mb-4 text-blue-600">Personal Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium w-32">Full Name:</span>
                                        <div className="flex-1 border-b border-blue-300 pb-1">
                                          {detailedCandidate.full_name || "-"}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium w-32">Father Name:</span>
                                        <div className="flex-1 border-b border-blue-300 pb-1">
                                          {detailedCandidate.father_name || "-"}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium w-32">Marital Status:</span>
                                        <div className="flex-1 border-b border-blue-300 pb-1">
                                          {detailedCandidate.marital_status || "-"}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium w-32">Religion:</span>
                                        <div className="flex-1 border-b border-blue-300 pb-1">
                                          {detailedCandidate.religion || "-"}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium w-32">Date of Birth:</span>
                                        <div className="flex-1 border-b border-blue-300 pb-1">
                                          {detailedCandidate.date_of_birth
                                            ? new Date(detailedCandidate.date_of_birth).toLocaleDateString()
                                            : "-"}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="border border-gray-200 rounded-lg p-4">
                                    <h3 className="font-semibold mb-4 text-blue-600">Passport Details</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium w-32">Passport No:</span>
                                        <div className="flex-1 border-b border-blue-300 pb-1 font-mono">
                                          {detailedCandidate.passport_no || "-"}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium w-32">Place of Issue:</span>
                                        <div className="flex-1 border-b border-blue-300 pb-1">
                                          {detailedCandidate.place_of_issue || "-"}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium w-32">Date of Issue:</span>
                                        <div className="flex-1 border-b border-blue-300 pb-1">
                                          {detailedCandidate.date_of_issue
                                            ? new Date(detailedCandidate.date_of_issue).toLocaleDateString()
                                            : "-"}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium w-32">Date of Expiry:</span>
                                        <div className="flex-1 border-b border-blue-300 pb-1">
                                          {detailedCandidate.date_of_expiry
                                            ? new Date(detailedCandidate.date_of_expiry).toLocaleDateString()
                                            : "-"}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="border border-gray-200 rounded-lg p-4">
                                    <h3 className="font-semibold mb-4 text-blue-600">Qualifications</h3>
                                    <div className="space-y-4">
                                      <div>
                                        <span className="font-medium">Academic Qualifications:</span>
                                        <div className="mt-1 border-b border-blue-300 pb-1 min-h-[24px]">
                                          {detailedCandidate.academic_qualifications || "-"}
                                        </div>
                                      </div>
                                      <div>
                                        <span className="font-medium">Technical Qualifications:</span>
                                        <div className="mt-1 border-b border-blue-300 pb-1 min-h-[24px]">
                                          {detailedCandidate.technical_qualifications || "-"}
                                        </div>
                                      </div>
                                      {detailedCandidate.languages_known &&
                                        detailedCandidate.languages_known.length > 0 && (
                                          <div>
                                            <span className="font-medium">Languages Known:</span>
                                            <div className="mt-1 border-b border-blue-300 pb-1 min-h-[24px]">
                                              {detailedCandidate.languages_known.join(", ")}
                                            </div>
                                          </div>
                                        )}
                                    </div>
                                  </div>

                                  <div className="border border-gray-200 rounded-lg p-4">
                                    <h3 className="font-semibold mb-4 text-blue-600">Role & Experience</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium w-32">Post Applied For:</span>
                                        <div className="flex-1 border-b border-blue-300 pb-1">
                                          {detailedCandidate.post_applied_for || "-"}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium w-32">Referred By:</span>
                                        <div className="flex-1 border-b border-blue-300 pb-1">
                                          {detailedCandidate.referred_by || "-"}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 col-span-2">
                                        <span className="font-medium w-32">Experience Total:</span>
                                        <div className="flex-1 border-b border-blue-300 pb-1">
                                          {detailedCandidate.experience_total || "-"} years
                                        </div>
                                      </div>
                                      {detailedCandidate.remarks && (
                                        <div className="col-span-2">
                                          <span className="font-medium">Remarks:</span>
                                          <div className="mt-1 border-b border-blue-300 pb-1 min-h-[24px]">
                                            {detailedCandidate.remarks}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {detailedCandidate.profile_image && (
                                    <div className="border border-gray-200 rounded-lg p-4">
                                      <h3 className="font-semibold mb-4 text-blue-600">Profile Image</h3>
                                      <div className="flex justify-center">
                                        <img
                                          src={detailedCandidate.profile_image || "/placeholder.svg"}
                                          alt="Profile"
                                          className="w-32 h-40 object-cover border border-gray-300 rounded"
                                        />
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex justify-between items-center pt-4 border-t">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">Date:</span>
                                      <div className="border-b border-blue-300 pb-1 w-32">
                                        {new Date(detailedCandidate.created_at).toLocaleDateString()}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">Client Signature:</span>
                                      <div className="border-b border-blue-300 pb-1 w-48"></div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/candidates/${candidate.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadPDF(candidate.id)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <FileDown className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCandidate(candidate.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
