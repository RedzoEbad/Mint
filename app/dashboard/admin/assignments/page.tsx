"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getValidToken } from "@/lib/token-utils"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Loader2, UserPlus, Building2 } from "lucide-react"

export default function AdminAssignmentsPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [agents, setAgents] = useState<{ id: string; full_name: string; email: string }[]>([])
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [agentId, setAgentId] = useState("")
  const [companyId, setCompanyId] = useState("")
  const [filter, setFilter] = useState("")
  const [busy, setBusy] = useState(false)

  async function load() {
    try {
      const token = getValidToken()
      const [usersRes, compsRes, asgRes] = await Promise.all([
        fetch("/api/admin/users", { headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: "include" }),
        fetch("/api/companies", { headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: "include" }),
        fetch("/api/admin/assignments", { headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: "include" }),
      ])
      const [users, comps, asg] = await Promise.all([usersRes.json(), compsRes.json(), asgRes.json()])
      const agentList = (users.users || []).filter((u: any) => u.role === "process_agent").map((u: any) => ({ id: u.id, full_name: u.full_name, email: u.email }))
      setAgents(agentList)
      setCompanies(comps.data || [])
      setAssignments(asg.data || [])
      if (!agentId && agentList[0]) setAgentId(agentList[0].id)
      if (!companyId && (comps.data || [])[0]) setCompanyId(comps.data[0].id)
    } catch {}
  }

  useEffect(() => { load() }, [])

  // Preselect company from query param (?companyId=...)
  useEffect(() => {
    const cid = searchParams.get("companyId")
    if (cid) setCompanyId(cid)
  }, [searchParams])

  async function assign() {
    try {
      setBusy(true)
      const token = getValidToken()
      const res = await fetch("/api/admin/assignments", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ agent_id: agentId, company_id: companyId }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        toast({ title: "Assigned" })
        load()
      } else {
        toast({ title: "Failed", description: data?.message || `HTTP ${res.status}`, variant: "destructive" })
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Assign failed", variant: "destructive" })
    } finally { setBusy(false) }
  }

  async function remove(id: string) {
    try {
      const token = getValidToken()
      const res = await fetch(`/api/admin/assignments/${id}`, { method: "DELETE", headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: "include" })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) { toast({ title: "Removed" }); load() } else { toast({ title: "Failed", description: data?.message || `HTTP ${res.status}`, variant: "destructive" }) }
    } catch (e: any) { toast({ title: "Error", description: e?.message || "Remove failed", variant: "destructive" }) }
  }

  const filteredAssignments = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return assignments
    return assignments.filter((a) => `${a.agent_name} ${a.agent_email} ${a.company_name}`.toLowerCase().includes(q))
  }, [assignments, filter])

  return (
    <DashboardLayout title="Agent Assignments">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Assign Agent to Company</CardTitle>
            <CardDescription>Select an agent and a company, then click Assign. Agents will only see companies assigned here.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:grid md:grid-cols-12">
              <div className="md:col-span-4">
                <div className="text-sm mb-1">Agent</div>
                <Select value={agentId} onValueChange={setAgentId}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select agent" /></SelectTrigger>
                  <SelectContent>
                    {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.full_name} ({a.email})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-4">
                <div className="text-sm mb-1">Company</div>
                <Select value={companyId} onValueChange={setCompanyId}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select company" /></SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-4 flex items-end">
                <Button onClick={assign} disabled={!agentId || !companyId || busy} className="gap-2">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Assign
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle>Current Assignments</CardTitle>
                <CardDescription>Manage existing links between agents and companies</CardDescription>
              </div>
              <Input placeholder="Search agent or company" value={filter} onChange={(e) => setFilter(e.target.value)} className="md:w-80" />
            </div>
          </CardHeader>
          <CardContent>
            <Table className="rounded-md overflow-hidden">
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">No assignments found</TableCell>
                  </TableRow>
                ) : filteredAssignments.map((a) => (
                  <TableRow key={a.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8"><AvatarFallback>{(a.agent_name || "").split(" ").map((n: string) => n[0]).join("")?.slice(0,2) || "AG"}</AvatarFallback></Avatar>
                        <div>
                          <div className="font-medium">{a.agent_name}</div>
                          <div className="text-xs text-muted-foreground">{a.agent_email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /> {a.company_name}</div>
                    </TableCell>
                    <TableCell className="text-right"><Button variant="outline" onClick={() => remove(a.id)}>Remove</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}


