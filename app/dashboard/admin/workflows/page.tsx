"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { getValidToken } from "@/lib/token-utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageLoader } from "@/components/ui/page-loader"
import { Skeleton } from "@/components/ui/skeleton"

interface WorkflowItem {
  id: string
  candidate_name: string
  passport_no: string
  company_name: string
  medical_status: string
  visa_status: string
  protector_status: string
  passport_status: string
  flight_status: string
  overall_status: string
  created_at: string
}

export default function AdminWorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    fetchWorkflows()
  }, [])

  useEffect(() => {
    setLoading(true)
    const t = setTimeout(fetchWorkflows, 50)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize])

  const fetchWorkflows = async () => {
    try {
      setLoading(true)
      const token = getValidToken()
      const res = await fetch(`/api/workflows?page=${page}&limit=${pageSize}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (data.success) {
        setWorkflows(data.data)
        if (data.total) {
          const totalPages = Math.max(1, Math.ceil(Number(data.total) / pageSize))
          setPages(totalPages)
        } else if (data.pagination?.pages) {
          setPages(data.pagination.pages)
        }
      }
    } catch (e) {
      console.error("Admin workflows load error", e)
    } finally {
      setLoading(false)
    }
  }

  const resetWorkflow = async (id: string) => {
    try {
      const token = getValidToken()
      const res = await fetch(`/api/workflows/${id}`, {
        method: "PUT",
        headers: token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      })
      const data = await res.json()
      if (data.success) {
        fetchWorkflows()
      }
    } catch (e) {
      console.error("Admin workflow reset error", e)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      initiated: "bg-blue-100 text-blue-800",
      in_progress: "bg-purple-100 text-purple-800",
      cancelled: "bg-gray-100 text-gray-800",
    }
    return <Badge className={variants[status] || "bg-gray-100 text-gray-800"}>{status.replace("_", " ").toUpperCase()}</Badge>
  }

  return (
    <DashboardLayout title="Admin – Workflows">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Workflows Oversight</CardTitle>
              <CardDescription>View all workflows and reset if required</CardDescription>
            </div>
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
          </CardHeader>
          <CardContent>
            {loading ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Stages</TableHead>
                    <TableHead>Overall</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`sk-${i}`}>
                      <TableCell>
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Stages</TableHead>
                    <TableHead>Overall</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workflows.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell>
                        <div className="font-medium">{w.candidate_name}</div>
                        <div className="text-xs text-gray-500">{w.passport_no}</div>
                      </TableCell>
                      <TableCell>{w.company_name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {getStatusBadge(w.medical_status)}
                          {getStatusBadge(w.visa_status)}
                          {getStatusBadge(w.protector_status)}
                          {getStatusBadge(w.passport_status)}
                          {getStatusBadge(w.flight_status)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(w.overall_status)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => resetWorkflow(w.id)}>Reset</Button>
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
                  <PaginationItem key={`p-${p}`}>
                    <PaginationLink href="#" isActive={p === page} onClick={(e) => { e.preventDefault(); setPage(p) }}>{p}</PaginationLink>
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


