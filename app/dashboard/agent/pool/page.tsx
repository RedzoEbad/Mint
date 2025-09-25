"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { getValidToken } from "@/lib/token-utils"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Loader2,
  Play,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  CalendarIcon,
  Search,
  Users,
  Filter,
  Eye,
  Edit3,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"

export default function AgentCandidatePoolPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([])
  const [companyId, setCompanyId] = useState("")
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [busy, setBusy] = useState(false)
  const [job, setJob] = useState("")
  const [q, setQ] = useState("")
  const [candidates, setCandidates] = useState<any[]>([])
  const [loadingCandidates, setLoadingCandidates] = useState(false)
  const [startingId, setStartingId] = useState<string>("")
  const [editingNoteId, setEditingNoteId] = useState<string>("")
  const [noteDraft, setNoteDraft] = useState<string>("")

  const qs = useMemo(() => {
    const s = new URLSearchParams()
    s.set("page", "1")
    s.set("limit", "10")
    return s.toString()
  }, [])

  useEffect(() => {
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
          if (typeof window !== "undefined") {
            const stored = localStorage.getItem("selectedCompanyId") || ""
            if (stored && data.data?.some((c: any) => c.id === stored)) {
              setCompanyId(stored)
            } else if (!companyId && data.data?.length) setCompanyId(data.data[0].id)
          }
        }
      } catch {}
    })()
  }, [])

  useEffect(() => {
    if (!companyId) {
      setRows([])
      return
    }
    ;(async () => {
      try {
        setLoading(true)
        const token = getValidToken()
        const res = await fetch(`/api/engagements?${qs}&company_id=${companyId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
        })
        const data = await res.json()
        if (data.success) setRows(data.data || [])
      } catch {
      } finally {
        setLoading(false)
      }
    })()
  }, [companyId, qs])

  // persist and listen to global header switcher
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

  async function selectCandidate(candidateId: string) {
    if (!candidateId || !companyId) {
      toast({ title: "Missing", description: "Select a company and candidate" })
      return
    }
    try {
      setBusy(true)
      const token = getValidToken()
      const res = await fetch(`/api/engagements`, {
        method: "POST",
        headers: token
          ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
          : { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ candidate_id: candidateId, company_id: companyId }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        toast({ title: "Candidate selected" })
      } else {
        toast({ title: "Failed", description: data?.message || `HTTP ${res.status}`, variant: "destructive" })
      }
    } catch (e: any) {
      if (e?.message) toast({ title: "Error", description: e.message, variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  async function startWorkflow(candidateId: string, existingWorkflowId?: string | null) {
    if (existingWorkflowId) {
      location.assign(`/dashboard/workflows/${existingWorkflowId}`)
      return
    }
    if (!companyId) {
      toast({ title: "Select company" })
      return
    }
    try {
      setStartingId(candidateId)
      const token = getValidToken()
      const res = await fetch(`/api/workflows`, {
        method: "POST",
        headers: token
          ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
          : { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ candidate_id: candidateId, company_id: companyId }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success && data.workflowId) {
        toast({ title: "Workflow started" })
        location.assign(`/dashboard/workflows/${data.workflowId}`)
      } else {
        toast({ title: "Unable to start", description: data?.message || `HTTP ${res.status}`, variant: "destructive" })
      }
    } catch (e: any) {
      if (e?.message) toast({ title: "Error", description: e.message, variant: "destructive" })
    } finally {
      setStartingId("")
    }
  }

  const statusBadge = (status: string) => {
    const variants: Record<string, { className: string; icon: React.ReactNode }> = {
      pending: { className: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock className="h-3 w-3" /> },
      scheduled: { className: "bg-blue-50 text-blue-700 border-blue-200", icon: <CalendarIcon className="h-3 w-3" /> },
      completed: {
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      cancelled: { className: "bg-gray-50 text-gray-700 border-gray-200", icon: <XCircle className="h-3 w-3" /> },
      selected: {
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      rejected: { className: "bg-red-50 text-red-700 border-red-200", icon: <XCircle className="h-3 w-3" /> },
    }
    const variant = variants[status] || {
      className: "bg-gray-50 text-gray-700 border-gray-200",
      icon: <Clock className="h-3 w-3" />,
    }
    return (
      <Badge className={`${variant.className} border font-medium flex items-center gap-1.5 px-2.5 py-1`}>
        {variant.icon}
        {(status || "—").toUpperCase()}
      </Badge>
    )
  }

  const startDisabledReason = (r: any): string | null => {
    if (r.workflow_id) return null
    if (r.locked_by_workflow && user && r.agent_id && r.agent_id !== user.id) return "Locked by another agent"
    if (!(r.interview_status === "completed" && r.interview_result === "selected"))
      return "Interview must be completed and passed"
    if (r.active_other_workflow_id) return "Workflow in progress with another company"
    return null
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => `${r.candidate_name} ${r.company_name}`.toLowerCase().includes(q))
  }, [rows, search])

  return (
    <DashboardLayout title="Candidate Pool">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {/* <h1 className="text-3xl font-bold tracking-tight">Candidate Pool</h1> */}
            <p className="text-muted-foreground mt-1">Search, select, and manage candidates for your positions</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{filtered.length} engagements</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Search className="h-4 w-4" />
              <span>{candidates.length} candidates found</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-4">
            <Card className="shadow-sm border-0 bg-gradient-to-br from-slate-50 to-white">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Search className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Search & Select</CardTitle>
                    <CardDescription className="text-sm">Find candidates by job and keywords</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Company</label>
                    <Select value={companyId} onValueChange={setCompanyId}>
                      <SelectTrigger className="w-full h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
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
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Job Position</label>
                    <Input
                      value={job}
                      onChange={(e) => setJob(e.target.value)}
                      placeholder="e.g. Electrician, Engineer, Manager"
                      className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Keywords</label>
                    <Input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="skills, tools, certifications"
                      className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <Button
                    onClick={async () => {
                      if (!companyId) {
                        toast({ title: "Select company" })
                        return
                      }
                    try {
                      setLoadingCandidates(true)
                      const token = getValidToken()
                        const params = new URLSearchParams({
                          job,
                          q,
                          algo: "keyword",
                          company_id: companyId,
                          page: "1",
                          limit: "10",
                        })
                        const res = await fetch(`/api/candidates/search?${params.toString()}`, {
                          headers: token ? { Authorization: `Bearer ${token}` } : {},
                          credentials: "include",
                        })
                      const data = await res.json()
                      if (data.success) setCandidates(data.data || [])
                      } catch {
                      } finally {
                        setLoadingCandidates(false)
                      }
                    }}
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                    disabled={loadingCandidates}
                  >
                    {loadingCandidates ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Searching…
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Search Candidates
                      </>
                    )}
                  </Button>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Quick Filters</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start h-9 border-gray-200 hover:bg-gray-50 bg-transparent"
                    >
                      <div className="w-2 h-2 bg-amber-400 rounded-full mr-2"></div>
                      Unselected
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start h-9 border-gray-200 hover:bg-gray-50 bg-transparent"
                    >
                      <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></div>
                      Selected
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start h-9 border-gray-200 hover:bg-gray-50 bg-transparent"
                    >
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                      Ready to Start
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="xl:col-span-8">
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Search Results</CardTitle>
                    <CardDescription className="text-sm">
                      {candidates.length > 0 ? `${candidates.length} candidates found` : "No candidates found"}
                    </CardDescription>
                  </div>
                  {candidates.length > 0 && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {candidates.length} results
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow className="border-b border-gray-200">
                        <TableHead className="font-semibold text-gray-900">Candidate Name</TableHead>
                        <TableHead className="font-semibold text-gray-900">Passport</TableHead>
                        <TableHead className="font-semibold text-gray-900">Applied For</TableHead>
                        <TableHead className="font-semibold text-gray-900">Status</TableHead>
                        <TableHead className="font-semibold text-gray-900 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingCandidates ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12">
                            <div className="flex items-center justify-center gap-2 text-muted-foreground">
                              <Loader2 className="h-5 w-5 animate-spin" />
                              <span>Searching candidates...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : candidates.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12">
                            <div className="text-muted-foreground">
                              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>No candidates found</p>
                              <p className="text-sm">Try adjusting your search criteria</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        candidates.map((c) => (
                          <TableRow key={c.id} className="hover:bg-gray-50 transition-colors">
                            <TableCell className="font-medium text-gray-900">{c.full_name}</TableCell>
                            <TableCell className="text-gray-600 font-mono text-sm">{c.passport_no}</TableCell>
                            <TableCell className="text-gray-600">{c.post_applied_for}</TableCell>
                          <TableCell>
                              {c.workflow_id ? (
                                <Badge className="bg-blue-50 text-blue-700 border border-blue-200">In Workflow</Badge>
                              ) : c.eng_agent_id ? (
                                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">Selected</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Unselected</Badge>
                              )}
                          </TableCell>
                            <TableCell className="text-right">
                              {c.workflow_id ? (
                                <Button size="sm" variant="outline" disabled className="h-8 px-3 opacity-70">
                                  In Workflow
                                </Button>
                              ) : c.eng_agent_id ? (
                                <Button size="sm" variant="outline" disabled className="h-8 px-3 opacity-70">Selected</Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => selectCandidate(c.id)}
                                  disabled={busy}
                                  className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-3"
                                >
                                  {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                              Select
                            </Button>
                              )}
                          </TableCell>
                        </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Active Engagements</CardTitle>
                <CardDescription className="text-sm">
                  Manage selected candidates and their interview progress
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  placeholder="Search engagements..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-64 h-9 border-gray-200"
                />
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                  {filtered.length} engagements
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow className="border-b border-gray-200">
                      <TableHead className="font-semibold text-gray-900 min-w-[150px]">Candidate</TableHead>
                      <TableHead className="font-semibold text-gray-900 min-w-[120px]">Company</TableHead>
                      <TableHead className="font-semibold text-gray-900 min-w-[200px]">Notes</TableHead>
                      <TableHead className="font-semibold text-gray-900 min-w-[160px]">Interview Status</TableHead>
                      <TableHead className="font-semibold text-gray-900 min-w-[140px]">Result</TableHead>
                      <TableHead className="font-semibold text-gray-900 min-w-[180px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Loading engagements...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <div className="text-muted-foreground">
                            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No engagements found</p>
                            <p className="text-sm">Select candidates to start managing engagements</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((r) => (
                        <TableRow key={r.id} className="hover:bg-gray-50 transition-colors">
                          <TableCell className="font-medium text-gray-900">{r.candidate_name}</TableCell>
                          <TableCell className="text-gray-600">{r.company_name}</TableCell>
                          <TableCell>
                            {editingNoteId === r.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={noteDraft}
                                  onChange={(e) => setNoteDraft(e.target.value)}
                                  className="h-8 text-sm"
                                  placeholder="Add note"
                                />
                                <Button
                                  size="sm"
                                  className="h-8 px-2 bg-emerald-600 hover:bg-emerald-700"
                                  onClick={async () => {
                                    const res = await fetch(`/api/engagements/${r.id}`, {
                                      method: "PUT",
                                      headers: { "Content-Type": "application/json" },
                                      credentials: "include",
                                      body: JSON.stringify({ note: noteDraft }),
                                    })
                                    const d = await res.json().catch(() => ({}))
                                    if (res.ok && d.success) {
                                      const token2 = getValidToken()
                                      const rr = await fetch(`/api/engagements?${qs}&company_id=${companyId}`, {
                                        headers: token2 ? { Authorization: `Bearer ${token2}` } : {},
                                        credentials: "include",
                                      })
                                      const nd = await rr.json()
                                      if (nd.success) setRows(nd.data || [])
                                      setEditingNoteId("")
                                      setNoteDraft("")
                                      toast({ title: "Saved", description: "Note updated" })
                                    } else {
                                      toast({
                                        title: "Failed",
                                        description: d?.message || `HTTP ${res.status}`,
                                        variant: "destructive",
                                      })
                                    }
                                  }}
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2 bg-transparent"
                                  onClick={() => {
                                    setEditingNoteId("")
                                    setNoteDraft("")
                                  }}
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 group">
                                <span className="text-sm text-gray-700 truncate max-w-[180px]">
                                  {r.note || <span className="text-gray-400 italic">No note</span>}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => {
                                    setEditingNoteId(r.id)
                                    setNoteDraft(r.note || "")
                                  }}
                                >
                                  <Edit3 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {statusBadge(r.interview_status || "pending")}
                              <Select
                                value={r.interview_status || "pending"}
                                onValueChange={async (v) => {
                                  const res = await fetch(`/api/engagements/${r.id}`, {
                                    method: "PUT",
                                    headers: { "Content-Type": "application/json" },
                                    credentials: "include",
                                    body: JSON.stringify({ interview_status: v }),
                                  })
                          if (res.ok) {
                                    const token2 = getValidToken()
                                    const rr = await fetch(`/api/engagements?${qs}&company_id=${companyId}`, {
                                      headers: token2 ? { Authorization: `Bearer ${token2}` } : {},
                                      credentials: "include",
                                    })
                                    const d = await rr.json()
                                    if (d.success) setRows(d.data || [])
                                  }
                                }}
                              >
                                <SelectTrigger className="w-32 h-8 text-xs border-gray-200">
                                  <SelectValue />
                                </SelectTrigger>
                            <SelectContent>
                                  <SelectItem value="pending">
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-3 w-3" /> Pending
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="scheduled">
                                    <div className="flex items-center gap-2">
                                      <CalendarIcon className="h-3 w-3" /> Scheduled
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="completed">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle className="h-3 w-3" /> Completed
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="cancelled">
                                    <div className="flex items-center gap-2">
                                      <XCircle className="h-3 w-3" /> Cancelled
                                    </div>
                                  </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                              {r.interview_result ? (
                                statusBadge(r.interview_result)
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                              <Select
                                value={r.interview_result || "pending"}
                                onValueChange={async (v) => {
                                  const res = await fetch(`/api/engagements/${r.id}`, {
                                    method: "PUT",
                                    headers: { "Content-Type": "application/json" },
                                    credentials: "include",
                                    body: JSON.stringify({ interview_result: v }),
                                  })
                          if (res.ok) {
                                    const token2 = getValidToken()
                                    const rr = await fetch(`/api/engagements?${qs}&company_id=${companyId}`, {
                                      headers: token2 ? { Authorization: `Bearer ${token2}` } : {},
                                      credentials: "include",
                                    })
                                    const d = await rr.json()
                                    if (d.success) setRows(d.data || [])
                                  }
                                }}
                              >
                                <SelectTrigger className="w-32 h-8 text-xs border-gray-200">
                                  <SelectValue />
                                </SelectTrigger>
                            <SelectContent>
                                  <SelectItem value="pending">
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-3 w-3" /> Pending
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="selected">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle className="h-3 w-3" /> Selected
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="rejected">
                                    <div className="flex items-center gap-2">
                                      <XCircle className="h-3 w-3" /> Rejected
                                    </div>
                                  </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                        {r.workflow_id ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startWorkflow(r.candidate_id || r.id, r.workflow_id)}
                                  className="h-8 px-3 border-blue-200 text-blue-700 hover:bg-blue-50"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View Workflow
                          </Button>
                        ) : (
                          (() => {
                            const disabledReason = startDisabledReason(r)
                            const disabled = !!disabledReason || startingId === (r.candidate_id || r.id)
                            const content = (
                                    <Button
                                      size="sm"
                                      className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                                      disabled={disabled}
                                      onClick={() => startWorkflow(r.candidate_id || r.id)}
                                    >
                                      {startingId === (r.candidate_id || r.id) ? (
                                        <>
                                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                          Starting…
                                        </>
                                      ) : (
                                        <>
                                          <Play className="h-3 w-3 mr-1" />
                                          Start
                                        </>
                                      )}
                              </Button>
                            )
                            return disabledReason ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>{content}</TooltipTrigger>
                                  <TooltipContent>{disabledReason}</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                                  ) : (
                                    content
                                  )
                          })()
                        )}
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={async () => {
                                  const res = await fetch(`/api/engagements/${r.id}`, {
                                    method: "DELETE",
                                    credentials: "include",
                                  })
                                  const d = await res.json().catch(() => ({}))
                                  if (res.ok && d.success) {
                                    toast({ title: "Engagement deleted" })
                                    const token2 = getValidToken()
                                    const rr = await fetch(`/api/engagements?${qs}&company_id=${companyId}`, {
                                      headers: token2 ? { Authorization: `Bearer ${token2}` } : {},
                                      credentials: "include",
                                    })
                                    const nd = await rr.json()
                                    if (nd.success) setRows(nd.data || [])
                                  } else {
                                    toast({
                                      title: "Failed",
                                      description: d?.message || `HTTP ${res.status}`,
                                      variant: "destructive",
                                    })
                                  }
                                }}
                                aria-label="Delete engagement"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                      </TableCell>
                    </TableRow>
                      ))
                    )}
                </TableBody>
              </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
