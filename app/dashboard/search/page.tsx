"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { getValidToken } from "@/lib/token-utils"

export default function CandidateSearchPage() {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const { toast } = useToast()

  const [job, setJob] = useState(sp.get("job") || "")
  const [q, setQ] = useState(sp.get("q") || "")
  const [algo, setAlgo] = useState(sp.get("algo") || "keyword")
  const [page, setPage] = useState(Number(sp.get("page") || 1))
  const [limit, setLimit] = useState(Number(sp.get("limit") || 10))
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([])
  const [companyId, setCompanyId] = useState<string>(sp.get("company_id") || "")

  const queryString = useMemo(() => {
    const s = new URLSearchParams()
    if (job) s.set("job", job)
    if (q) s.set("q", q)
    if (algo) s.set("algo", algo)
    if (companyId) s.set("company_id", companyId)
    s.set("page", String(page))
    s.set("limit", String(limit))
    return s.toString()
  }, [job, q, algo, companyId, page, limit])

  useEffect(() => {
    router.replace(`${pathname}?${queryString}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString])

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    async function load() {
      try {
        setLoading(true)
        const token = getValidToken()
        const res = await fetch(`/api/candidates/search?${queryString}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (!active) return
        if (data.success) {
          setRows(data.data)
          setTotal(data.meta?.total || 0)
        }
      } catch (_) {
        if (!active) return
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false; controller.abort() }
  }, [queryString])

  useEffect(() => {
    async function loadCompanies() {
      try {
        const token = getValidToken()
        const res = await fetch(`/api/companies`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: "include" })
        const data = await res.json()
        if (data.success) {
          setCompanies(data.data)
          if (!companyId && data.data.length > 0) {
            setCompanyId(data.data[0].id)
          }
        }
      } catch {}
    }
    loadCompanies()
  }, [])

  const startWorkflow = async (candidateId: string) => {
    if (!companyId) {
      toast({ title: "Select a company", description: "Choose company for this workflow", variant: "destructive" })
      return
    }
    try {
      const token = getValidToken()
      const res = await fetch(`/api/workflows`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ candidate_id: candidateId, company_id: companyId }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast({ title: "Workflow started", description: "Opening workflow detail" })
        if (data.workflowId) router.push(`/dashboard/workflows/${data.workflowId}`)
        else router.push("/dashboard/workflows")
      } else {
        toast({ title: "Unable to start workflow", description: data.message || "Try another candidate", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to start workflow", variant: "destructive" })
    }
  }

  return (
    <DashboardLayout title="Search Candidates">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Job-based Candidate Search</CardTitle>
            <CardDescription>Search candidates by job posting and keywords. Select a company to start a workflow.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
              <div className="flex-1">
                <label className="block text-sm mb-1">Job Posting</label>
                <Input placeholder="e.g. Electrician" value={job} onChange={(e) => setJob(e.target.value)} />
              </div>
              <div className="flex-1">
                <label className="block text-sm mb-1">Keywords</label>
                <Input placeholder="skills, tools, certifications" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm mb-1">Algorithm</label>
                <Select value={algo} onValueChange={setAlgo}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keyword">Keyword match</SelectItem>
                    <SelectItem value="embedding" disabled>Embedding rank (coming soon)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm mb-1">Company</label>
                <Select value={companyId} onValueChange={setCompanyId}>
                  <SelectTrigger className="w-56"><SelectValue placeholder="Select company" /></SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>{total} candidates found</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 w-full bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Passport</TableHead>
                      <TableHead>Applied For</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.full_name}</TableCell>
                        <TableCell>{r.passport_no}</TableCell>
                        <TableCell>{r.post_applied_for}</TableCell>
                        <TableCell className="capitalize">{r.status?.replaceAll("_", " ")}</TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => startWorkflow(r.id)} disabled={!companyId}>Start Workflow</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex items-center justify-between mt-4">
              <Button variant="outline" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>Previous</Button>
              <div className="text-sm text-muted-foreground">Page {page}</div>
              <Button variant="outline" onClick={() => setPage(page + 1)} disabled={rows.length < limit}>Next</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}


