"use client"

import { useEffect, useMemo, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getValidToken } from "@/lib/token-utils"

type Stats = {
  total_workflows?: number
  today_created?: number
  in_progress?: number
  completed?: number
  pending?: number
}

type WorkflowItem = {
  id: string
  candidate_name?: string
  company_name?: string
  overall_status?: string
  created_at?: string
}

export default function AgentReportsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({})
  const [recent, setRecent] = useState<WorkflowItem[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const token = getValidToken()
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined
        const [sRes, wRes] = await Promise.all([
          fetch(`/api/workflows/stats`, { headers, credentials: "include" }),
          fetch(`/api/workflows?page=1&limit=10`, { headers, credentials: "include" }),
        ])
        const [sData, wData] = await Promise.all([sRes.json().catch(() => ({})), wRes.json().catch(() => ({}))])
        if (sRes.ok && sData.success) setStats(sData.data || {})
        if (wRes.ok && wData.success) setRecent(wData.data?.rows || [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <DashboardLayout title="Agent Reports">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader><CardTitle>Total Workflows</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">{stats.total_workflows ?? "—"}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Created Today</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">{stats.today_created ?? "—"}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>In Progress</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">{stats.in_progress ?? "—"}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Completed</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">{stats.completed ?? "—"}</CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow>
                  ) : recent.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8">No workflows</TableCell></TableRow>
                  ) : recent.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.candidate_name || "—"}</TableCell>
                      <TableCell>{r.company_name || "—"}</TableCell>
                      <TableCell className="capitalize">{r.overall_status || "—"}</TableCell>
                      <TableCell className="font-mono text-sm">{(r.created_at || "").slice(0,10)}</TableCell>
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


