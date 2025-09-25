"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getValidToken } from "@/lib/token-utils"
import { useToast } from "@/hooks/use-toast"

export default function AdminEngagementsPage() {
  const { toast } = useToast()
  const [rows, setRows] = useState<any[]>([])
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([])
  const [companyId, setCompanyId] = useState("")
  const [search, setSearch] = useState("")
  const [newAgent, setNewAgent] = useState("")
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    ;(async () => {
      const token = getValidToken()
      const comps = await fetch(`/api/companies`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: "include" })
      const cdata = await comps.json()
      if (cdata.success) setCompanies(cdata.data || [])
      const users = await fetch(`/api/admin/users`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: "include" })
      const udata = await users.json()
      if (udata.success) {
        const list = (udata.users || [])
          .filter((u: any) => u.role === "process_agent" && u.is_active !== false)
          .map((u: any) => ({ id: u.id, name: u.full_name || u.email }))
        setAgents(list)
      }
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      if (!companyId) { setRows([]); return }
      const token = getValidToken()
      const res = await fetch(`/api/engagements?company_id=${companyId}&limit=50`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: "include" })
      const data = await res.json()
      if (data.success) setRows(data.data || [])
    })()
  }, [companyId])

  const filtered = rows.filter((r) => `${r.candidate_name} ${r.company_name}`.toLowerCase().includes(search.trim().toLowerCase()))

  const transfer = async (row: any) => {
    if (!newAgent) { toast({ title: "Select new agent" }); return }
    const token = getValidToken()
    const res = await fetch(`/api/admin/engagements/transfer`, { method: "POST", headers: token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ candidate_id: row.candidate_id, company_id: companyId, new_agent_id: newAgent }) })
    const d = await res.json().catch(() => ({}))
    if (res.ok && d.success) {
      toast({ title: "Transferred" })
      const token2 = getValidToken(); const rr = await fetch(`/api/engagements?company_id=${companyId}`, { headers: token2 ? { Authorization: `Bearer ${token2}` } : {}, credentials: "include" }); const nd = await rr.json(); if (nd.success) setRows(nd.data || [])
    } else {
      toast({ title: "Failed", description: d?.message || `HTTP ${res.status}`, variant: "destructive" })
    }
  }

  return (
    <DashboardLayout title="Admin • Engagements">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Ownership & Locks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <div className="text-sm mb-1">Company</div>
                <Select value={companyId} onValueChange={setCompanyId}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select company" /></SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="text-sm mb-1">Search</div>
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter by candidate/company" />
              </div>
              <div>
                <div className="text-sm mb-1">Transfer to Agent</div>
                <Select value={newAgent} onValueChange={setNewAgent}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select agent" /></SelectTrigger>
                  <SelectContent>
                    {agents.map((a) => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Locked</TableHead>
                    <TableHead>Workflow</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.candidate_name}</TableCell>
                      <TableCell>{r.company_name}</TableCell>
                      <TableCell className="font-mono text-sm">{r.agent_id || "—"}</TableCell>
                      <TableCell>{r.locked_by_workflow ? "Yes" : "No"}</TableCell>
                      <TableCell className="font-mono text-sm">{r.workflow_id || "—"}</TableCell>
                      <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => transfer(r)}
                        disabled={!newAgent || newAgent === r.agent_id}
                        title={!newAgent ? "Select an agent" : newAgent === r.agent_id ? "Selected agent already owns this engagement" : r.locked_by_workflow ? "Will transfer and unlock" : "Transfer"}
                      >
                        Transfer & Unlock
                      </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}


