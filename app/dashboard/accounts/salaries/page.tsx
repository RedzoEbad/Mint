"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { getValidToken } from "@/lib/token-utils"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

type SalaryRow = {
  id: string
  user_id: string
  user_name?: string
  net_salary: number
  salary_month: string
  payment_status: string
}

export default function SalariesPage() {
  const { toast } = useToast()
  const [rows, setRows] = useState<SalaryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const token = getValidToken()
      const res = await fetch(`/api/salaries`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: "include" })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) setRows(data.data || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const toggleStatus = async (s: SalaryRow) => {
    const next = s.payment_status === "paid" ? "pending" : "paid"
    try {
      const token = getValidToken()
      const res = await fetch(`/api/salaries/${s.id}`, { method: "PUT", headers: token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ payment_status: next }) })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) { toast({ title: "Updated" }); setRows((arr) => arr.map((x) => x.id === s.id ? { ...x, payment_status: next } : x)) } else { toast({ title: "Failed", description: data?.message || "", variant: "destructive" }) }
    } catch {}
  }

  const create = async () => {
    const token = getValidToken()
    const payload = {
      user_id: (document.getElementById('sl_user') as HTMLInputElement)?.value,
      net_salary: Number((document.getElementById('sl_net') as HTMLInputElement)?.value || 0),
      salary_month: (document.getElementById('sl_month') as HTMLInputElement)?.value,
    }
    try {
      const res = await fetch(`/api/salaries`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) { toast({ title: 'Salary added' }); setAddOpen(false); load() } else { toast({ title: 'Failed', description: data?.message || '', variant: 'destructive' }) }
    } catch {}
  }

  return (
    <DashboardLayout title="Salaries">
      <div className="flex justify-end mb-4"><Button onClick={() => setAddOpen(true)}>Add Salary</Button></div>
      <Card>
        <CardHeader>
          <CardTitle>Salaries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Net</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.user_name || r.user_id}</TableCell>
                    <TableCell className="font-mono text-sm">{r.salary_month}</TableCell>
                    <TableCell>{r.net_salary}</TableCell>
                    <TableCell className="capitalize">{r.payment_status || 'pending'}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => toggleStatus(r)}>Toggle</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Salary</DialogTitle>
            <DialogDescription>Record a salary for a specific month.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input id="sl_user" placeholder="User (type to search)" list="emp_list" onChange={async (e) => {
              const token = getValidToken()
              const res = await fetch(`/api/employees?q=${encodeURIComponent(e.target.value)}`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: 'include' })
              const data = await res.json().catch(() => ({}))
              const list = (data.data || []) as any[]
              const datalist = document.getElementById('emp_list') as HTMLDataListElement
              if (datalist) {
                datalist.innerHTML = ''
                list.forEach((r) => {
                  const opt = document.createElement('option')
                  opt.value = r.user_id
                  opt.label = `${r.full_name} (${r.email})`
                  datalist.appendChild(opt)
                })
              }
            }} />
            <datalist id="emp_list" />
            <Input id="sl_net" placeholder="Net Salary" type="number" min="0" step="0.01" />
            <Input id="sl_month" type="date" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={create}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}


