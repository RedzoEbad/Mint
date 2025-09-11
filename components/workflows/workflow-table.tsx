"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/ui/pagination"
import { getValidToken } from "@/lib/token-utils"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { ExternalLink } from "lucide-react"

type WorkflowRow = {
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
}

interface WorkflowTableProps {
  page?: number
  limit?: number
  onPageChange?: (page: number) => void
  onLimitChange?: (limit: number) => void
}

export default function WorkflowTable({ page = 1, limit = 10, onPageChange, onLimitChange }: WorkflowTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [rows, setRows] = useState<WorkflowRow[]>([])
  const [total, setTotal] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [status, setStatus] = useState<string>(searchParams.get("status") || "all")
  const [search, setSearch] = useState<string>(searchParams.get("search") || "")

  const queryString = useMemo(() => {
    const sp = new URLSearchParams()
    sp.set("page", String(page))
    sp.set("limit", String(limit))
    if (status && status !== "all") sp.set("status", status)
    if (search) sp.set("search", search)
    return sp.toString()
  }, [page, limit, status, search])

  // Sync URL when filters/pagination change
  useEffect(() => {
    const sp = new URLSearchParams()
    sp.set("page", String(page))
    sp.set("limit", String(limit))
    if (status && status !== "all") sp.set("status", status)
    if (search) sp.set("search", search)
    router.replace(`${pathname}?${sp.toString()}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, status, search])

  useEffect(() => {
    let isActive = true
    const controller = new AbortController()
    async function load() {
      try {
        setLoading(true)
        const token = getValidToken()
        const res = await fetch(`/api/workflows?${queryString}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
          signal: controller.signal,
        })
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

  const StageSelector = ({ value, onChange }: { value: string; onChange: (s: string) => void }) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-32">
        <div className="flex items-center gap-2">
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pending">Pending</SelectItem>
        <SelectItem value="completed">Completed</SelectItem>
        <SelectItem value="rejected">Rejected</SelectItem>
      </SelectContent>
    </Select>
  )

  const updateStage = async (id: string, stageKey: string, value: string) => {
    const token = getValidToken()
    await fetch(`/api/workflows/${id}`, {
      method: "PUT",
      headers: token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ stage: stageKey.replace(/_status$/, ""), status: value }),
    })
    // naive refresh of current page
    const sp = new URLSearchParams(queryString)
    const next = Number(sp.get("page") || 1)
    onPageChange?.(next)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">Status</span>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Search by name/passport" value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
          <Button variant="outline" onClick={() => { setStatus("all"); setSearch(""); }}>Reset</Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">Total: {total}</div>
          <span className="text-sm">Rows:</span>
          <Select value={String(limit)} onValueChange={(v) => onLimitChange?.(Number(v))}>
            <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Medical</TableHead>
              <TableHead>Visa</TableHead>
              <TableHead>Protector</TableHead>
              <TableHead>Passport</TableHead>
              <TableHead>Flight</TableHead>
              <TableHead>Overall</TableHead>
              <TableHead className="w-[110px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={`s-${i}`}>
                <TableCell><div className="space-y-1"><div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div><div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div></div></TableCell>
                <TableCell><div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div></TableCell>
                <TableCell colSpan={6}><div className="h-8 w-full bg-gray-200 rounded animate-pulse"></div></TableCell>
              </TableRow>
            ))}
            {!loading && rows.map((w) => (
              <TableRow key={w.id}>
                <TableCell>
                  <Link href={`/dashboard/workflows/${w.id}`} className="hover:underline">
                    <div className="font-medium">{w.candidate_name}</div>
                    <div className="text-sm text-gray-500">{w.passport_no}</div>
                  </Link>
                </TableCell>
                <TableCell>{w.company_name}</TableCell>
                <TableCell>{getStatusBadge(w.medical_status)}</TableCell>
                <TableCell>{getStatusBadge(w.visa_status)}</TableCell>
                <TableCell>{getStatusBadge(w.protector_status)}</TableCell>
                <TableCell>{getStatusBadge(w.passport_status)}</TableCell>
                <TableCell>{getStatusBadge(w.flight_status)}</TableCell>
                <TableCell>{getStatusBadge(w.overall_status)}</TableCell>
                <TableCell>
                  <Link href={`/dashboard/workflows/${w.id}`} className="inline-flex items-center text-sm text-blue-600 hover:underline">
                    View <ExternalLink className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => onPageChange?.(Math.max(1, page - 1))} disabled={page <= 1}>Previous</Button>
        <div className="text-sm text-muted-foreground">Page {page}</div>
        <Button variant="outline" onClick={() => onPageChange?.(page + 1)} disabled={rows.length < limit}>Next</Button>
      </div>
    </div>
  )
}


