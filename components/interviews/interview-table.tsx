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
}

export default function InterviewTable({ page = 1, limit = 10, onPageChange, onLimitChange }: InterviewTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [rows, setRows] = useState<InterviewRow[]>([])
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
        const res = await fetch(`/api/interviews?${queryString}`, {
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

  const statusBadge = (status: string) => {
    const variants: Record<string, string> = {
      scheduled: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-gray-100 text-gray-800",
      pending: "bg-yellow-100 text-yellow-800",
      selected: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    }
    return <Badge className={variants[status] || "bg-gray-100 text-gray-800"}>{status.toUpperCase()}</Badge>
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
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Search by name/company" value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Candidate</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Result</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={`s-${i}`}>
              <TableCell><div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div></TableCell>
              <TableCell><div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div></TableCell>
              <TableCell colSpan={4}><div className="h-8 w-full bg-gray-200 rounded animate-pulse"></div></TableCell>
            </TableRow>
          ))}
          {!loading && rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.candidate_name}</TableCell>
              <TableCell>{r.company_name}</TableCell>
              <TableCell><Badge variant="outline">{r.interview_type.toUpperCase()}</Badge></TableCell>
              <TableCell>{new Date(r.interview_date).toLocaleDateString()}</TableCell>
              <TableCell>{statusBadge(r.interview_status)}</TableCell>
              <TableCell>{r.result ? statusBadge(r.result) : <span className="text-muted-foreground">—</span>}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => onPageChange?.(Math.max(1, page - 1))} disabled={page <= 1}>Previous</Button>
        <div className="text-sm text-muted-foreground">Page {page}</div>
        <Button variant="outline" onClick={() => onPageChange?.(page + 1)} disabled={rows.length < limit}>Next</Button>
      </div>
    </div>
  )
}


