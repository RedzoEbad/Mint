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

  return (
    <DashboardLayout title="Candidates">
      <div className="space-y-6">
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
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Rows:</span>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1) }}>
                <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button asChild className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
            <Link href="/dashboard/candidates/add">Add Candidate</Link>
          </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Candidates</CardTitle>
            <CardDescription>View, edit, and export candidate records</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Passport No</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Skeleton className="h-8 w-8 rounded" />
                          <Skeleton className="h-8 w-8 rounded" />
                          <Skeleton className="h-8 w-8 rounded" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Passport No</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="font-medium">{c.full_name}</div>
                        <div className="text-xs text-gray-500">{c.father_name}</div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{c.passport_no}</TableCell>
                      <TableCell>{c.post_applied_for}</TableCell>
                      <TableCell>{new Date(c.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/candidates/${c.id}`}> 
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/candidates/${c.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => downloadCandidatePdf(c.id)}>
                            <FileDown className="h-4 w-4" />
                          </Button>
                          {(user?.role === "super_admin" || user?.role === "receptionist") && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete candidate?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. The candidate and associated data may be permanently removed.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteCandidate(c.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
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

        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)) }} />
              </PaginationItem>
              {Array.from({ length: pages }).slice(0, 5).map((_, i) => {
                const p = i + 1
                return (
                  <PaginationItem key={p}>
                    <PaginationLink href="#" isActive={p === page} onClick={(e) => { e.preventDefault(); setPage(p) }}>
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}
              <PaginationItem>
                <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(pages, p + 1)) }} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </DashboardLayout>
  )
}
