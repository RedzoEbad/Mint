"use client"

import { useEffect, useMemo, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { getValidToken } from "@/lib/token-utils"

type Salary = { id: string; net_salary: number; salary_month: string; payment_status: string }
type Expense = { id: string; amount: number; currency: string; status: string; category: string; expense_date: string }
type Payment = { id: string; amount: number; currency: string; payment_status: string; payment_date?: string; payment_type: string }

export default function AccountsReportPage() {
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [loading, setLoading] = useState(true)
  const [salaries, setSalaries] = useState<Salary[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [payments, setPayments] = useState<Payment[]>([])

  const load = async () => {
    setLoading(true)
    try {
      const token = getValidToken()
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined
      const qsP = new URLSearchParams({ status: "paid" }).toString()
      const [sRes, eRes, pRes] = await Promise.all([
        fetch(`/api/salaries`, { headers, credentials: "include" }),
        fetch(`/api/expenses`, { headers, credentials: "include" }),
        fetch(`/api/payments?${qsP}`, { headers, credentials: "include" }),
      ])
      const [sData, eData, pData] = await Promise.all([sRes.json().catch(() => ({})), eRes.json().catch(() => ({})), pRes.json().catch(() => ({}))])
      if (sRes.ok && sData.success) setSalaries((sData.data || []) as Salary[])
      if (eRes.ok && eData.success) setExpenses((eData.data || []) as Expense[])
      if (pRes.ok && pData.success) setPayments((pData.data || []) as Payment[])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const inRange = (d: string | undefined) => {
      if (!d) return true
      const day = d.slice(0, 10)
      if (from && day < from) return false
      if (to && day > to) return false
      return true
    }
    const paidSalaries = salaries.filter(s => s.payment_status === "paid" && inRange(s.salary_month))
    const approvedExpenses = expenses.filter(e => e.status === "approved" && inRange(e.expense_date))
    const paidPayments = payments.filter(p => p.payment_status === "paid" && inRange(p.payment_date))
    return { paidSalaries, approvedExpenses, paidPayments }
  }, [salaries, expenses, payments, from, to])

  const totals = useMemo(() => {
    const salariesTotal = filtered.paidSalaries.reduce((a, b) => a + Number(b.net_salary || 0), 0)
    const expensesTotal = filtered.approvedExpenses.reduce((a, b) => a + Number(b.amount || 0), 0)
    const paymentsTotal = filtered.paidPayments.reduce((a, b) => a + Number(b.amount || 0), 0)
    const netOutflow = expensesTotal + salariesTotal + paymentsTotal
    return { salariesTotal, expensesTotal, paymentsTotal, netOutflow }
  }, [filtered])

  return (
    <DashboardLayout title="Accounts Report">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <div className="text-sm mb-1">From</div>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <div className="text-sm mb-1">To</div>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-md border p-3 text-sm">
              <div className="text-muted-foreground">Salaries Paid</div>
              <div className="font-semibold">{totals.salariesTotal}</div>
            </div>
            <div className="rounded-md border p-3 text-sm">
              <div className="text-muted-foreground">Expenses Approved</div>
              <div className="font-semibold">{totals.expensesTotal}</div>
            </div>
            <div className="rounded-md border p-3 text-sm">
              <div className="text-muted-foreground">Payments</div>
              <div className="font-semibold">{totals.paymentsTotal}</div>
            </div>
            <div className="rounded-md border p-3 text-sm">
              <div className="text-muted-foreground">Net Outflow</div>
              <div className="font-semibold">{totals.netOutflow}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Salaries (paid)</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={2} className="text-center py-6">Loading...</TableCell></TableRow>
                  ) : filtered.paidSalaries.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-sm">{s.salary_month}</TableCell>
                      <TableCell className="text-right">{s.net_salary}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Expenses (approved)</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-6">Loading...</TableCell></TableRow>
                  ) : filtered.approvedExpenses.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-mono text-sm">{e.expense_date}</TableCell>
                      <TableCell>{e.category}</TableCell>
                      <TableCell className="text-right">{e.amount} {e.currency}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payments (paid)</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-6">Loading...</TableCell></TableRow>
                  ) : filtered.paidPayments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-sm">{(p.payment_date || '').slice(0,10)}</TableCell>
                      <TableCell className="capitalize">{p.payment_type}</TableCell>
                      <TableCell className="text-right">{p.amount} {p.currency}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="text-xs text-slate-500">Downloads are restricted for the Accounts role.</div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}


