"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { getValidToken } from "@/lib/token-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileDown, Eye, Edit, Search, Trash2 } from "lucide-react"
import { PageLoader } from "@/components/ui/page-loader"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Candidate {
  id: string
  full_name: string
  father_name: string
  passport_no: string
  post_applied_for: string
  status: "active" | "in_process" | "completed" | "rejected"
  created_at: string
}

export default function CandidatesPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    // Initialize from URL once
    const initSearch = searchParams.get("q") || ""
    const initStatus = searchParams.get("status") || "all"
    const initPage = Number(searchParams.get("page") || "1")
    const initLimit = Number(searchParams.get("limit") || "10")
    setSearchTerm(initSearch)
    setStatusFilter(initStatus)
    setPage(isNaN(initPage) ? 1 : initPage)
    setPageSize(isNaN(initLimit) ? 10 : initLimit)
    // fetch after init
    fetchCandidates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchCandidates()
      const params = new URLSearchParams()
      if (searchTerm) params.set("q", searchTerm)
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter)
      params.set("page", String(page))
      params.set("limit", String(pageSize))
      router.replace(`${pathname}?${params.toString()}`)
    }, 300)
    return () => clearTimeout(debounce)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, page, pageSize])

  useEffect(() => {
    fetchCandidates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchCandidates = async () => {
    try {
      setLoading(true)
      const token = getValidToken()
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (statusFilter !== "all") params.append("status", statusFilter)
      params.append("page", String(page))
      params.append("limit", String(pageSize))
      const res = await fetch(`/api/candidates?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (data.success) {
        setCandidates(data.data)
        if (data.pagination?.pages) setPages(data.pagination.pages)
      }
    } catch (e) {
      console.error("Error loading candidates", e)
    } finally {
      setLoading(false)
    }
  }

  async function deleteCandidate(candidateId: string) {
    try {
      const token = getValidToken()
      const res = await fetch(`/api/candidates/${candidateId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Deleted", description: "Candidate record removed" })
        // If last row on page, go back a page; otherwise refresh current page
        if (candidates.length <= 1 && page > 1) {
          setPage(page - 1)
        } else {
          fetchCandidates()
        }
      } else {
        toast({ title: "Error", description: data.message || "Failed to delete", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete candidate", variant: "destructive" })
    }
  }

  async function downloadCandidatePdf(candidateId: string) {
    try {
      const res = await fetch(`/api/candidates/${candidateId}/pdf`)
      if (!res.ok) throw new Error("Failed to generate PDF")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `candidate-${candidateId}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("PDF error", err)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      in_process: "bg-amber-50 text-amber-700 border border-amber-200",
      completed: "bg-blue-50 text-blue-700 border border-blue-200",
      rejected: "bg-red-50 text-red-700 border border-red-200"
    }
    const statusLabels = {
      active: "Active",
      in_process: "In Process",
      completed: "Completed",
      rejected: "Rejected"
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusConfig[status as keyof typeof statusConfig] || statusConfig.active}`}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </span>
    )
  }

  return (
    <DashboardLayout title="Candidates">
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-8px); }
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
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .hover-lift {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.1);
        }
      `}</style>

      <div className="space-y-6 animate-fade-in">
        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between glass-card rounded-xl p-4 shadow-sm border">
          <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 bg-white border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-10 bg-white border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
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
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-600 font-medium whitespace-nowrap">Rows:</span>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1) }}>
                <SelectTrigger className="w-[100px] h-10 bg-white border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              asChild
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 h-10 px-6 font-semibold"
            >
              <Link href="/dashboard/candidates/add">Add Candidate</Link>
            </Button>
          </div>
        </div>

        {/* Main Card */}
        <Card className="glass-card shadow-xl border-0 overflow-hidden animate-slide-in">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50/30 border-b border-slate-100 pb-6">
            <CardTitle className="text-2xl font-bold text-slate-900">All Candidates</CardTitle>
            <CardDescription className="text-slate-600 mt-1">View, edit, and export candidate records</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                    <TableHead className="font-semibold text-slate-700">Name</TableHead>
                    <TableHead className="font-semibold text-slate-700">Passport No</TableHead>
                    <TableHead className="font-semibold text-slate-700">Position</TableHead>
                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    <TableHead className="font-semibold text-slate-700">Created</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-slate-100">
                      <TableCell>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-48 bg-slate-200" />
                          <Skeleton className="h-3 w-32 bg-slate-200" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-28 bg-slate-200" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40 bg-slate-200" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full bg-slate-200" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24 bg-slate-200" /></TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Skeleton className="h-9 w-9 rounded-lg bg-slate-200" />
                          <Skeleton className="h-9 w-9 rounded-lg bg-slate-200" />
                          <Skeleton className="h-9 w-9 rounded-lg bg-slate-200" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-50 to-blue-50/30 hover:from-slate-50 hover:to-blue-50/30 border-slate-200">
                    <TableHead className="font-semibold text-slate-700 h-12">Name</TableHead>
                    <TableHead className="font-semibold text-slate-700">Passport No</TableHead>
                    <TableHead className="font-semibold text-slate-700">Position</TableHead>
                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    <TableHead className="font-semibold text-slate-700">Created</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.map((c, idx) => (
                    <TableRow
                      key={c.id}
                      className="border-slate-100 hover:bg-blue-50/30 transition-colors duration-200 group"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                            {c.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{c.full_name}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{c.father_name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                          {c.passport_no}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-700 font-medium">{c.post_applied_for}</TableCell>
                      <TableCell>{getStatusBadge(c.status)}</TableCell>
                      <TableCell className="text-slate-600 font-medium">
                        {new Date(c.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-1 justify-end opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-9 w-9 p-0 hover:bg-blue-100 hover:text-blue-700 transition-all duration-200"
                          >
                            <Link href={`/dashboard/candidates/${c.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-9 w-9 p-0 hover:bg-amber-100 hover:text-amber-700 transition-all duration-200"
                          >
                            <Link href={`/dashboard/candidates/${c.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadCandidatePdf(c.id)}
                            className="h-9 w-9 p-0 hover:bg-emerald-100 hover:text-emerald-700 transition-all duration-200"
                          >
                            <FileDown className="h-4 w-4" />
                          </Button>
                          {(user?.role === "super_admin" || user?.role === "receptionist") && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-9 w-9 p-0 text-red-600 hover:bg-red-100 hover:text-red-700 transition-all duration-200"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="glass-card">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-xl font-bold text-slate-900">Delete candidate?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-slate-600">
                                    This action cannot be undone. The candidate and associated data may be permanently removed.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="hover:bg-slate-100">Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteCandidate(c.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/25"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="flex justify-center animate-fade-in">
          <Pagination>
            <PaginationContent className="gap-1">
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)) }}
                  className="hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200 border border-slate-200"
                />
              </PaginationItem>
              {Array.from({ length: pages }).slice(0, 5).map((_, i) => {
                const p = i + 1
                return (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      isActive={p === page}
                      onClick={(e) => { e.preventDefault(); setPage(p) }}
                      className={`transition-all duration-200 border ${p === page
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow-lg shadow-blue-500/25 hover:shadow-xl'
                        : 'border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
                        }`}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(pages, p + 1)) }}
                  className="hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200 border border-slate-200"
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </DashboardLayout>
  )
}