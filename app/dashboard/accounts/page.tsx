"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { getValidToken } from "@/lib/token-utils"
import { useToast } from "@/hooks/use-toast"
import {
  Stethoscope,
  FileText,
  Shield,
  BookOpen,
  Plane,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Filter,
  Sparkles,
  TrendingUp,
} from "lucide-react"

type Payment = {
  id: string
  candidate_name: string
  passport_no: string
  payment_type: string
  amount: number
  currency: string
  notes: string
  payment_status: string
  created_at: string
}

type SalaryRow = {
  id: string
  user_id: string
  user_name?: string
  net_salary: number
  salary_month: string
  payment_status: string
  payment_date?: string
}

type ExpenseRow = {
  id: string
  category: string
  description?: string
  amount: number
  currency: string
  status: string
  expense_date: string
}

export default function AccountsDashboard() {
  const { toast } = useToast()
  const [rows, setRows] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<string>("")
  const [ptype, setPtype] = useState<string>("")
  const [tab, setTab] = useState<string>("payments")

  const [salaries, setSalaries] = useState<SalaryRow[]>([])
  const [salariesLoading, setSalariesLoading] = useState(false)
  const [expenses, setExpenses] = useState<ExpenseRow[]>([])
  const [expensesLoading, setExpensesLoading] = useState(false)
  const [metrics, setMetrics] = useState<{ pendingPayments: number; expensesCount: number; salariesCount: number }>({ pendingPayments: 0, expensesCount: 0, salariesCount: 0 })

  const load = async () => {
    try {
      setLoading(true)
      const token = getValidToken()
      const qs = new URLSearchParams()
      if (status) qs.set("status", status)
      if (ptype) qs.set("payment_type", ptype)
      const res = await fetch(`/api/payments?${qs.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      })
      const data = await res.json()
      if (res.ok && data.success) setRows(data.data || [])
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [status, ptype])

  useEffect(() => {
    const token = getValidToken()
    ;(async () => {
      try {
        setSalariesLoading(true)
        const res = await fetch(`/api/salaries`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: "include" })
        const data = await res.json().catch(() => ({}))
        if (res.ok && data.success) setSalaries(data.data || [])
      } finally {
        setSalariesLoading(false)
      }
    })()
    ;(async () => {
      try {
        setExpensesLoading(true)
        const res = await fetch(`/api/expenses`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: "include" })
        const data = await res.json().catch(() => ({}))
        if (res.ok && data.success) setExpenses(data.data || [])
      } finally {
        setExpensesLoading(false)
      }
    })()
    ;(async () => {
      try {
        const token2 = getValidToken()
        const [pRes, eRes, sRes] = await Promise.all([
          fetch(`/api/payments?status=pending`, { headers: token2 ? { Authorization: `Bearer ${token2}` } : {}, credentials: "include" }),
          fetch(`/api/expenses`, { headers: token2 ? { Authorization: `Bearer ${token2}` } : {}, credentials: "include" }),
          fetch(`/api/salaries`, { headers: token2 ? { Authorization: `Bearer ${token2}` } : {}, credentials: "include" }),
        ])
        const [p, e, s] = await Promise.all([pRes.json().catch(() => ({})), eRes.json().catch(() => ({})), sRes.json().catch(() => ({}))])
        setMetrics({ pendingPayments: (p.data || []).length || 0, expensesCount: (e.data || []).length || 0, salariesCount: (s.data || []).length || 0 })
      } catch {}
    })()
  }, [])

  const setStatusOn = async (id: string, newStatus: string) => {
    try {
      const token = getValidToken()
      const res = await fetch(`/api/payments/${id}`, {
        method: "PUT",
        headers: token
          ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
          : { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ payment_status: newStatus }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        toast({ title: "Updated" })
        load()
      } else {
        toast({ title: "Failed", description: data?.message || `HTTP ${res.status}`, variant: "destructive" })
      }
    } catch {}
  }

  const statusBadge = (s: string) => {
    const config = {
      paid: {
        className: "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25",
        icon: CheckCircle,
      },
      rejected: {
        className: "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25",
        icon: XCircle,
      },
      pending: {
        className: "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25",
        icon: Clock,
      },
    }

    const { className, icon: Icon } = config[s as keyof typeof config] || config.pending

    return (
      <Badge className={`${className} flex items-center gap-1 px-3 py-1`}>
        <Icon className="w-3 h-3" />
        <Sparkles className="w-2 h-2 opacity-60" />
        {s.toUpperCase()}
      </Badge>
    )
  }

  const getPaymentTypeIcon = (type: string) => {
    const icons = {
      medical: Stethoscope,
      visa: FileText,
      protector: Shield,
      passport: BookOpen,
      flight: Plane,
    }
    const Icon = icons[type as keyof typeof icons] || DollarSign
    return <Icon className="w-4 h-4" />
  }

  return (
    <DashboardLayout title="Accounts">
      <div className="space-y-6">
        {/* Overview hero & quick links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-5">
              <div className="text-xs text-slate-600 mb-1">Pending Payments</div>
              <div className="text-2xl font-semibold">{metrics.pendingPayments}</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-teal-50">
            <CardContent className="p-5">
              <div className="text-xs text-slate-600 mb-1">Salaries Records</div>
              <div className="text-2xl font-semibold">{metrics.salariesCount}</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="p-5">
              <div className="text-xs text-slate-600 mb-1">Expenses Records</div>
              <div className="text-2xl font-semibold">{metrics.expensesCount}</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-5 flex flex-col gap-2">
              <div className="text-xs text-slate-600">Quick Links</div>
              <div className="flex flex-wrap gap-2">
                <Link href="/dashboard/payments" className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700">Payments</Link>
                <Link href="/dashboard/accounts/salaries" className="px-3 py-2 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700">Salaries</Link>
                <Link href="/dashboard/accounts/expenses" className="px-3 py-2 text-sm rounded-md bg-amber-600 text-white hover:bg-amber-700">Expenses</Link>
                <Link href="/dashboard/accounts/reports" className="px-3 py-2 text-sm rounded-md bg-slate-800 text-white hover:bg-slate-900">Accounts Report</Link>
              </div>
            </CardContent>
          </Card>
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="salaries">Salaries</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
          </TabsList>

          <TabsContent value="payments">
            <Card className="bg-gradient-to-br from-white to-slate-50 border-0 shadow-xl shadow-slate-200/50">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-4 bg-white/20 rounded-lg backdrop-blur-sm">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  Payment Requests
                  <Sparkles className="w-4 h-4 opacity-70" />
                </CardTitle>
          </CardHeader>
              <CardContent className="p-6">
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-4 rounded-xl border border-slate-200 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Filter Options</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                  <div className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Status
                  </div>
                <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
                    <SelectTrigger className="w-full bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500/20">
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
              <div>
                  <div className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Type
                  </div>
                <Select value={ptype || "all"} onValueChange={(v) => setPtype(v === "all" ? "" : v)}>
                    <SelectTrigger className="w-full bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500/20">
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
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden shadow-lg bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                    <TableHead className="font-semibold text-slate-700">Candidate</TableHead>
                    <TableHead className="font-semibold text-slate-700">Passport</TableHead>
                    <TableHead className="font-semibold text-slate-700">Type</TableHead>
                    <TableHead className="font-semibold text-slate-700">Amount</TableHead>
                    <TableHead className="font-semibold text-slate-700">Notes</TableHead>
                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2 text-slate-500">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                          Loading payments...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((r) => (
                      <TableRow key={r.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100">
                        <TableCell className="font-medium text-slate-900">{r.candidate_name}</TableCell>
                        <TableCell className="font-mono text-sm text-slate-600">{r.passport_no}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-slate-100 rounded">{getPaymentTypeIcon(r.payment_type)}</div>
                            <span className="capitalize font-medium text-slate-700">{r.payment_type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-900">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-green-600" />
                            {r.amount} {r.currency}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[320px] truncate text-slate-600" title={r.notes}>
                          {r.notes || "—"}
                        </TableCell>
                        <TableCell>{statusBadge(r.payment_status)}</TableCell>
                        <TableCell className="text-right min-w-[180px]">
                          {r.payment_status === "pending" ? (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:shadow-emerald-500/40"
                                onClick={() => setStatusOn(r.id, "paid")}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg shadow-red-500/25 transition-all duration-200 hover:shadow-red-500/40"
                                onClick={() => setStatusOn(r.id, "rejected")}
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 italic">No actions</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="mt-3 text-xs text-slate-500">Financial statements download is restricted for Accounts role.</div>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="salaries">
            <Card className="bg-gradient-to-br from-white to-emerald-50 border-0 shadow-xl shadow-emerald-200/50">
              <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-4 bg-white/20 rounded-lg backdrop-blur-sm">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  Salaries
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="rounded-xl border border-emerald-200 overflow-hidden shadow-lg bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-b border-emerald-200">
                        <TableHead className="font-semibold text-slate-700">Employee</TableHead>
                        <TableHead className="font-semibold text-slate-700">Month</TableHead>
                        <TableHead className="font-semibold text-slate-700">Net Salary</TableHead>
                        <TableHead className="font-semibold text-slate-700">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salariesLoading ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-slate-500">Loading salaries...</TableCell>
                        </TableRow>
                      ) : (
                        salaries.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell className="font-medium text-slate-900">{s.user_name || s.user_id}</TableCell>
                            <TableCell className="font-mono text-sm text-slate-600">{s.salary_month}</TableCell>
                            <TableCell className="font-semibold text-slate-900">{s.net_salary}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {statusBadge((s.payment_status || "pending") as any)}
                                <Button size="sm" variant="outline" onClick={async () => {
                                  const token = getValidToken()
                                  const res = await fetch(`/api/salaries/${s.id}`, { method: "PUT", headers: token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ payment_status: s.payment_status === 'paid' ? 'pending' : 'paid' }) })
                                  const data = await res.json().catch(() => ({}))
                                  if (res.ok && data.success) { toast({ title: "Updated" }); setSalaries((arr) => arr.map((x) => x.id === s.id ? { ...x, payment_status: (s.payment_status === 'paid' ? 'pending' : 'paid') } : x)) } else { toast({ title: "Failed", description: data?.message || "", variant: "destructive" }) }
                                }}>Toggle</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses">
            <Card className="bg-gradient-to-br from-white to-amber-50 border-0 shadow-xl shadow-amber-200/50">
              <CardHeader className="bg-gradient-to-r from-amber-600 to-orange-700 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-4 bg-white/20 rounded-lg backdrop-blur-sm">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  Expenses
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="rounded-xl border border-amber-200 overflow-hidden shadow-lg bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-amber-50 to-amber-100 border-b border-amber-200">
                        <TableHead className="font-semibold text-slate-700">Category</TableHead>
                        <TableHead className="font-semibold text-slate-700">Date</TableHead>
                        <TableHead className="font-semibold text-slate-700">Amount</TableHead>
                        <TableHead className="font-semibold text-slate-700">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expensesLoading ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-slate-500">Loading expenses...</TableCell>
                        </TableRow>
                      ) : (
                        expenses.map((e) => (
                          <TableRow key={e.id}>
                            <TableCell className="font-medium text-slate-900">{e.category}</TableCell>
                            <TableCell className="font-mono text-sm text-slate-600">{e.expense_date}</TableCell>
                            <TableCell className="font-semibold text-slate-900">{e.amount} {e.currency}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {statusBadge((e.status || "pending") as any)}
                                <Button size="sm" variant="outline" onClick={async () => {
                                  const token = getValidToken()
                                  const next = e.status === 'approved' ? 'pending' : 'approved'
                                  const res = await fetch(`/api/expenses/${e.id}`, { method: "PUT", headers: token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ status: next }) })
                                  const data = await res.json().catch(() => ({}))
                                  if (res.ok && data.success) { toast({ title: "Updated" }); setExpenses((arr) => arr.map((x) => x.id === e.id ? { ...x, status: next } : x)) } else { toast({ title: "Failed", description: data?.message || "", variant: "destructive" }) }
                                }}>Toggle</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
