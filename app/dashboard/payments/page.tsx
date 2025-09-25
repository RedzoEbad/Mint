"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getValidToken } from "@/lib/token-utils"
import {
  Stethoscope,
  FileText,
  Shield,
  BookOpen,
  Plane,
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
  Filter,
  Sparkles,
} from "lucide-react"

export default function AgentPaymentsPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState("")
  const [ptype, setPtype] = useState("")

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const qs = new URLSearchParams()
        if (status) qs.set("status", status)
        if (ptype) qs.set("payment_type", ptype)
        const token = getValidToken()
        const res = await fetch(`/api/payments?${qs.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
        })
        const data = await res.json()
        if (data.success) setRows(data.data || [])
      } finally {
        setLoading(false)
      }
    })()
  }, [status, ptype])

  const statusBadge = (s: string) => {
    const baseClasses =
      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all duration-200"

    switch (s) {
      case "paid":
        return (
          <Badge className={`${baseClasses} bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:shadow-md`}>
            <CheckCircle2 className="w-3 h-3" />
            PAID
          </Badge>
        )
      case "rejected":
        return (
          <Badge className={`${baseClasses} bg-gradient-to-r from-red-500 to-rose-600 text-white hover:shadow-md`}>
            <XCircle className="w-3 h-3" />
            REJECTED
          </Badge>
        )
      default:
        return (
          <Badge className={`${baseClasses} bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-md`}>
            <Clock className="w-3 h-3" />
            PENDING
          </Badge>
        )
    }
  }

  const getPaymentTypeIcon = (type: string) => {
    switch (type) {
      case "medical":
        return <Stethoscope className="w-4 h-4 text-blue-600" />
      case "visa":
        return <FileText className="w-4 h-4 text-purple-600" />
      case "protector":
        return <Shield className="w-4 h-4 text-green-600" />
      case "passport":
        return <BookOpen className="w-4 h-4 text-indigo-600" />
      case "flight":
        return <Plane className="w-4 h-4 text-sky-600" />
      default:
        return <DollarSign className="w-4 h-4 text-gray-600" />
    }
  }

  return (
    <DashboardLayout title="Payments">
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-white to-gray-50/50 border-0 shadow-xl">
          {/* <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="w-5 h-5" />
              My Payment Requests
            </CardTitle>
          </CardHeader> */}
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Filter className="w-4 h-4" />
                  Status
                </div>
                <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-full border-gray-200 focus:border-blue-500 focus:ring-blue-500/20">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <DollarSign className="w-4 h-4" />
                  Type
                </div>
                <Select value={ptype || "all"} onValueChange={(v) => setPtype(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-full border-gray-200 focus:border-blue-500 focus:ring-blue-500/20">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="medical">Medical</SelectItem>
                    <SelectItem value="visa">Visa</SelectItem>
                    <SelectItem value="protector">Protector</SelectItem>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="flight">Flight</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="font-semibold text-gray-900">Candidate</TableHead>
                    <TableHead className="font-semibold text-gray-900">Type</TableHead>
                    <TableHead className="font-semibold text-gray-900">Amount</TableHead>
                    <TableHead className="font-semibold text-gray-900">Notes</TableHead>
                    <TableHead className="font-semibold text-gray-900">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2 text-gray-500">
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          Loading payments...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No payment requests found
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((r) => (
                      <TableRow key={r.id} className="hover:bg-gray-50/50 transition-colors">
                        <TableCell className="font-medium text-gray-900">{r.candidate_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getPaymentTypeIcon(r.payment_type)}
                            <span className="capitalize font-medium">{r.payment_type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-gray-900">
                          {r.amount} {r.currency}
                        </TableCell>
                        <TableCell className="max-w-[320px] truncate text-gray-600" title={r.notes}>
                          {r.notes || "—"}
                        </TableCell>
                        <TableCell>{statusBadge(r.payment_status)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
