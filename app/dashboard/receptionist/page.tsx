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
import { Users, UserPlus, Search, Eye, Edit, Trash2, Calendar, FileText } from "lucide-react"
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
  const [statusFilter, setStatusFilter] = useState("all") // Updated default value to 'all'
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
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
      if (statusFilter !== "all") params.append("status", statusFilter) // Updated condition to exclude 'all' status

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
                <EmptyCandidates onCreate={() => window.location.href = '/dashboard/candidates/add'} />
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
                              <Button variant="ghost" size="sm" onClick={() => setSelectedCandidate(candidate)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Candidate Details</DialogTitle>
                                <DialogDescription>View candidate information</DialogDescription>
                              </DialogHeader>
                              {selectedCandidate && (
                                <div className="grid grid-cols-2 gap-4 py-4">
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                                    <p className="text-sm">{selectedCandidate.full_name}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">Father Name</label>
                                    <p className="text-sm">{selectedCandidate.father_name}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">Passport No</label>
                                    <p className="text-sm font-mono">{selectedCandidate.passport_no}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">Position Applied</label>
                                    <p className="text-sm">{selectedCandidate.post_applied_for}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">Status</label>
                                    <div className="mt-1">{getStatusBadge(selectedCandidate.status)}</div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">Experience Count</label>
                                    <p className="text-sm">{selectedCandidate.experience_count} companies</p>
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
