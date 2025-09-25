"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { getValidToken } from "@/lib/token-utils"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Play, Loader2, CheckCircle, XCircle, MoreHorizontal, Eye, Edit, Trash2, Filter, Search, Calendar, Building2, User, CheckCircle as CheckCircleIcon, Clock } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent } from "@/components/ui/card"

type InterviewRow = {
  id: string
  candidate_name: string
  company_name: string
  interview_type: string
  interview_date: string
  interview_status: string
  result: string | null
}

interface InterviewTableProps {
  page?: number
  limit?: number
  onPageChange?: (page: number) => void
  onLimitChange?: (limit: number) => void
  hideCompanyFilter?: boolean
}

export default function InterviewTable({
  page = 1,
  limit = 10,
  onPageChange,
  onLimitChange,
  hideCompanyFilter = false,
}: InterviewTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [rows, setRows] = useState<InterviewRow[]>([])
  const [total, setTotal] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [status, setStatus] = useState<string>(searchParams.get("status") || "all")
  const [search, setSearch] = useState<string>(searchParams.get("search") || "")
  const [date, setDate] = useState<string>(searchParams.get("date") || "")
  const [savingId, setSavingId] = useState<string>("")
  const { toast } = useToast()
  const { user } = useAuth()
  const [viewOpen, setViewOpen] = useState(false)
  const [viewRow, setViewRow] = useState<InterviewRow | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editRow, setEditRow] = useState<InterviewRow | null>(null)
  const [editType, setEditType] = useState<string>("")
  const [editDate, setEditDate] = useState<string>("")
  const [editStatus, setEditStatus] = useState<string>("")
  const [editResult, setEditResult] = useState<string>("")
  const [savingEdit, setSavingEdit] = useState(false)
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([])
  const [companyId, setCompanyId] = useState<string>(
    searchParams.get("company_id") ||
      (typeof window !== "undefined" ? localStorage.getItem("selectedCompanyId") || "" : ""),
  )

  const queryString = useMemo(() => {
    const sp = new URLSearchParams()
    sp.set("page", String(page))
    sp.set("limit", String(limit))
    if (status && status !== "all") sp.set("status", status)
    if (search) sp.set("search", search)
    return sp.toString()
  }, [page, limit, status, search])

  useEffect(() => {
    const sp = new URLSearchParams()
    sp.set("page", String(page))
    sp.set("limit", String(limit))
    if (status && status !== "all") sp.set("status", status)
    if (search) sp.set("search", search)
    if (companyId) sp.set("company_id", companyId)
    if (date) sp.set("date", date)
    router.replace(`${pathname}?${sp.toString()}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, status, search, date])

  useEffect(() => {
    let isActive = true
    const controller = new AbortController()
    async function load() {
      try {
        setLoading(true)
        const token = getValidToken()
        const qs = new URLSearchParams(queryString)
        if (companyId) qs.set("company_id", companyId)
        const res = await fetch(`/api/interviews?${qs.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
          signal: controller.signal,
        })
        if (res.status === 403) {
          setRows([])
          setTotal(0)
          return
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (!isActive) return
        if (data.success) {
          setRows(data.data || [])
          setTotal(data.meta?.total || data.total || (data.data?.length ?? 0))
        }
      } catch (_) {
        if (!isActive) return
      } finally {
        if (isActive) setLoading(false)
      }
    }
    load()
    return () => {
      isActive = false
      controller.abort()
    }
  }, [queryString])

  useEffect(() => {
    // Load companies for agent selector
    if (!user) return
    ;(async () => {
      try {
        const token = getValidToken()
        const res = await fetch(`/api/companies`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
        })
        const data = await res.json()
        if (data.success) {
          setCompanies(data.data || [])
          const stored = typeof window !== "undefined" ? localStorage.getItem("selectedCompanyId") || "" : ""
          if (stored && data.data?.some((c: any) => c.id === stored)) {
            setCompanyId(stored)
          } else if (!companyId && data.data?.length) {
            setCompanyId(data.data[0].id)
          }
        }
      } catch {}
    })()
  }, [user])

  // Persist changes and listen for global switcher changes
  useEffect(() => {
    if (companyId && typeof window !== "undefined") localStorage.setItem("selectedCompanyId", companyId)
  }, [companyId])

  useEffect(() => {
    function onCompanyChanged(e: any) {
      if (e?.detail?.id) setCompanyId(e.detail.id)
    }
    if (typeof window !== "undefined") {
      window.addEventListener("companyChanged", onCompanyChanged as any)
      return () => window.removeEventListener("companyChanged", onCompanyChanged as any)
    }
  }, [])

  const statusBadge = (status: string) => {
    const variants: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      scheduled: {
        bg: "bg-blue-50 border-blue-200 text-blue-700",
        text: "Scheduled",
        icon: <Clock className="h-3 w-3" />,
      },
      completed: {
        bg: "bg-emerald-50 border-emerald-200 text-emerald-700",
        text: "Completed",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      cancelled: {
        bg: "bg-gray-50 border-gray-200 text-gray-600",
        text: "Cancelled",
        icon: <XCircle className="h-3 w-3" />,
      },
      pending: {
        bg: "bg-amber-50 border-amber-200 text-amber-700",
        text: "Pending",
        icon: <Clock className="h-3 w-3" />,
      },
      selected: {
        bg: "bg-green-50 border-green-200 text-green-700",
        text: "Selected",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      rejected: {
        bg: "bg-red-50 border-red-200 text-red-600",
        text: "Rejected",
        icon: <XCircle className="h-3 w-3" />,
      },
    }
    const variant = variants[status] || variants.pending
    return (
      <Badge className={`${variant.bg} border flex items-center gap-1 font-medium`}>
        {variant.icon}
        {variant.text}
      </Badge>
    )
  }

  const typeBadge = (type: string) => {
    const typeColors: Record<string, string> = {
      technical: "bg-purple-50 border-purple-200 text-purple-700",
      behavioral: "bg-indigo-50 border-indigo-200 text-indigo-700",
      final: "bg-orange-50 border-orange-200 text-orange-700",
      screening: "bg-teal-50 border-teal-200 text-teal-700",
    }
    return (
      <Badge
        variant="outline"
        className={`${typeColors[type.toLowerCase()] || "bg-gray-50 border-gray-200 text-gray-600"} font-medium`}
      >
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    )
  }

  const updateInterview = async (id: string, updates: Partial<{ interview_status: string; result: string }>) => {
    try {
      setSavingId(id)
      const token = getValidToken()
      const res = await fetch(`/api/interviews/${id}`, {
        method: "PUT",
        headers: token
          ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
          : { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        toast({ title: "Saved", description: "Interview updated" })
        // Refresh current list
        const token2 = getValidToken()
        const res2 = await fetch(`/api/interviews?${queryString}`, {
          headers: token2 ? { Authorization: `Bearer ${token2}` } : {},
          credentials: "include",
        })
        const data2 = await res2.json()
        if (data2.success) {
          setRows(data2.data || [])
          setTotal(data2.meta?.total || data2.total || (data2.data?.length ?? 0))
        }
      } else {
        const desc = data?.message || (res.status ? `HTTP ${res.status}` : "Unexpected error")
        toast({ title: "Failed", description: desc, variant: "destructive" })
      }
    } catch (e: any) {
      const msg = e?.message?.trim()
      if (msg) toast({ title: "Error", description: msg, variant: "destructive" })
    } finally {
      setSavingId("")
    }
  }

  const deleteInterview = async (id: string) => {
    try {
      const token = getValidToken()
      const res = await fetch(`/api/interviews/${id}`, { method: "DELETE", headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: "include" })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        toast({ title: "Deleted", description: "Interview removed" })
        const token2 = getValidToken()
        const res2 = await fetch(`/api/interviews?${queryString}`, { headers: token2 ? { Authorization: `Bearer ${token2}` } : {}, credentials: "include" })
        const data2 = await res2.json()
        if (data2.success) { setRows(data2.data || []); setTotal(data2.meta?.total || 0) }
      } else {
        toast({ title: "Failed", description: data?.message || `HTTP ${res.status}`, variant: "destructive" })
      }
    } catch (e: any) {
      if (e?.message) toast({ title: "Error", description: e.message, variant: "destructive" })
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
      <Card className="border-0 shadow-sm bg-gradient-to-r from-slate-50 to-gray-50">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col space-y-4">
            {/* Filter Header */}
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters</span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-6">
              {/* Left Side - Filter Controls */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3 gap-3">
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-full bg-white border-gray-200">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search candidates..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 bg-white border-gray-200"
                    />
                  </div>

                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-10 bg-white border-gray-200"
                    />
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => {
                    setStatus("all")
                    setSearch("")
                    setDate("")
                  }}
                  className="w-full sm:w-auto bg-white border-gray-200 hover:bg-gray-50"
                >
                  Clear All
                </Button>
              </div>

              {/* Right Side - Company Filter & Pagination Controls */}
              <div className="space-y-3 xl:pl-6 xl:border-l xl:border-gray-200">
                {user?.role === "process_agent" && !hideCompanyFilter && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Company</span>
                    </div>
                    <Select value={companyId} onValueChange={setCompanyId}>
                      <SelectTrigger className="w-full bg-white border-gray-200">
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-gray-200 xl:border-t-0 xl:pt-0">
                  <span className="text-sm font-medium text-gray-600">Total: {total}</span>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Show:</span>
                    <Select value={String(limit)} onValueChange={(v) => onLimitChange?.(Number(v))}>
                      <SelectTrigger className="w-20 bg-white border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 border-b border-gray-200">
                <TableHead className="font-semibold text-gray-700">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Candidate
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Company
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-gray-700">Type</TableHead>
                <TableHead className="font-semibold text-gray-700">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                <TableHead className="font-semibold text-gray-700">Result</TableHead>
                <TableHead className="font-semibold text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`s-${i}`} className="border-b border-gray-100">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                    </TableCell>
                  </TableRow>
                ))}
              {!loading &&
                rows.map((r) => (
                  <TableRow key={r.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {r.candidate_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{r.candidate_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-700">{r.company_name}</span>
                    </TableCell>
                    <TableCell>{typeBadge(r.interview_type)}</TableCell>
                    <TableCell>
                      <span className="text-gray-700">
                        {new Date(r.interview_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </TableCell>
                    <TableCell>{statusBadge(r.interview_status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {r.result ? statusBadge(r.result) : <span className="text-gray-400 text-sm">Pending</span>}
                        {r.interview_status === "completed" && !r.result && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              className="h-7 px-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => updateInterview(r.id, { result: "selected" })}
                              disabled={savingId === r.id}
                            >
                              {savingId === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Pass"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
                              onClick={() => updateInterview(r.id, { result: "rejected" })}
                              disabled={savingId === r.id}
                            >
                              {savingId === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Fail"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {r.interview_status === "scheduled" && (
                          <>
                            <Button
                              size="sm"
                              className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => updateInterview(r.id, { interview_status: "completed" })}
                              disabled={savingId === r.id}
                            >
                              {savingId === r.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Complete
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-3 border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
                              onClick={() => updateInterview(r.id, { interview_status: "cancelled" })}
                              disabled={savingId === r.id}
                            >
                              {savingId === r.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Cancel
                                </>
                              )}
                            </Button>
                          </>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setViewRow(r as any); setViewOpen(true) }}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setEditRow(r as any); setEditType(r.interview_type); setEditDate(r.interview_date?.slice(0,16) || ""); setEditStatus(r.interview_status); setEditResult(r.result || ""); setEditOpen(true) }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Interview
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => deleteInterview(r.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
        <Button
          variant="outline"
          onClick={() => onPageChange?.(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="w-full sm:w-auto bg-white border-gray-200 hover:bg-gray-50"
        >
          Previous
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Page</span>
          <Badge variant="outline" className="bg-white border-gray-200 text-gray-700 font-medium">
            {page}
          </Badge>
          <span className="text-sm text-gray-600">of {Math.ceil(total / limit)}</span>
        </div>
        <Button
          variant="outline"
          onClick={() => onPageChange?.(page + 1)}
          disabled={rows.length < limit}
          className="w-full sm:w-auto bg-white border-gray-200 hover:bg-gray-50"
        >
          Next
        </Button>
      </div>
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Interview Details</DialogTitle>
          </DialogHeader>
          {viewRow && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2"><User className="h-4 w-4" /><span className="font-medium">{viewRow.candidate_name}</span></div>
              <div className="flex items-center gap-2"><Building2 className="h-4 w-4" /><span>{viewRow.company_name}</span></div>
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /><span>{new Date(viewRow.interview_date).toLocaleString()}</span></div>
              <div className="flex items-center gap-2">Status: {statusBadge(viewRow.interview_status)}</div>
              <div className="flex items-center gap-2">Result: {viewRow.result ? statusBadge(viewRow.result) : <span className="text-gray-500">Pending</span>}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit / Quick Save Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Interview</DialogTitle>
          </DialogHeader>
          {editRow && (
            <div className="space-y-3">
              <div className="text-sm text-gray-600">{editRow.candidate_name} • {editRow.company_name}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <span className="text-sm">Date & Time</span>
                  <Input type="datetime-local" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                </div>
                <div>
                  <span className="text-sm">Type</span>
                  <Select value={editType} onValueChange={setEditType}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="in_person">In Person</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <span className="text-sm">Status</span>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <span className="text-sm">Result</span>
                  <Select value={editResult || "none"} onValueChange={(v) => setEditResult(v === "none" ? "" : v)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="(none)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">(none)</SelectItem>
                      <SelectItem value="selected">Selected</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button onClick={async () => {
                  if (!editRow) return
                  try {
                    setSavingEdit(true)
                    const token = getValidToken()
                    const payload: any = {}
                    if (editType !== undefined) payload.interview_type = editType
                    if (editDate) payload.interview_date = editDate
                    if (editStatus) payload.interview_status = editStatus
                    if (editResult !== undefined) payload.result = editResult || null
                    const res = await fetch(`/api/interviews/${editRow.id}`, {
                      method: "PUT",
                      headers: token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify(payload),
                    })
                    const data = await res.json().catch(() => ({}))
                    if (res.ok && data.success) {
                      toast({ title: "Saved", description: "Interview updated" })
                      setEditOpen(false)
                      const token2 = getValidToken()
                      const res2 = await fetch(`/api/interviews?${queryString}`, { headers: token2 ? { Authorization: `Bearer ${token2}` } : {}, credentials: "include" })
                      const data2 = await res2.json()
                      if (data2.success) { setRows(data2.data || []); setTotal(data2.meta?.total || 0) }
                    } else {
                      toast({ title: "Failed", description: data?.message || `HTTP ${res.status}`, variant: "destructive" })
                    }
                  } catch (e: any) {
                    if (e?.message) toast({ title: "Error", description: e.message, variant: "destructive" })
                  } finally {
                    setSavingEdit(false)
                  }
                }} disabled={savingEdit}>
                  {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
