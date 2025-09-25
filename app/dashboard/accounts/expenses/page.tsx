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

type ExpenseRow = {
  id: string
  category: string
  description?: string
  amount: number
  currency: string
  status: string
  expense_date: string
}

export default function ExpensesPage() {
  const { toast } = useToast()
  const [rows, setRows] = useState<ExpenseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState<ExpenseRow | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      const token = getValidToken()
      const res = await fetch(`/api/expenses`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: "include" })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) setRows(data.data || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const toggleStatus = async (e: ExpenseRow) => {
    const next = e.status === "approved" ? "pending" : "approved"
    try {
      const token = getValidToken()
      const res = await fetch(`/api/expenses/${e.id}`, { method: "PUT", headers: token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ status: next }) })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) { toast({ title: "Updated" }); setRows((arr) => arr.map((x) => x.id === e.id ? { ...x, status: next } : x)) } else { toast({ title: "Failed", description: data?.message || "", variant: "destructive" }) }
    } catch {}
  }

  const create = async () => {
    const token = getValidToken()
    const payload = {
      category: (document.getElementById('ex_cat') as HTMLInputElement)?.value,
      description: (document.getElementById('ex_desc') as HTMLInputElement)?.value,
      amount: Number((document.getElementById('ex_amt') as HTMLInputElement)?.value || 0),
      currency: (document.getElementById('ex_cur') as HTMLInputElement)?.value || 'SAR',
      expense_date: (document.getElementById('ex_date') as HTMLInputElement)?.value,
    }
    try {
      const res = await fetch(`/api/expenses`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) { toast({ title: 'Expense added' }); setAddOpen(false); load() } else { toast({ title: 'Failed', description: data?.message || '', variant: 'destructive' }) }
    } catch {}
  }

  const update = async () => {
    if (!editRow) return
    const token = getValidToken()
    const payload = {
      category: (document.getElementById('exu_cat') as HTMLInputElement)?.value,
      description: (document.getElementById('exu_desc') as HTMLInputElement)?.value,
      amount: Number((document.getElementById('exu_amt') as HTMLInputElement)?.value || 0),
      currency: (document.getElementById('exu_cur') as HTMLInputElement)?.value || 'SAR',
      expense_date: (document.getElementById('exu_date') as HTMLInputElement)?.value,
    }
    try {
      const res = await fetch(`/api/expenses/${editRow.id}`, { method: 'PUT', headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) { toast({ title: 'Expense updated' }); setEditRow(null); load() } else { toast({ title: 'Failed', description: data?.message || '', variant: 'destructive' }) }
    } catch {}
  }

  return (
    <DashboardLayout title="Expenses">
      <div className="flex justify-end mb-4"><Button onClick={() => setAddOpen(true)}>Add Expense</Button></div>
      <Card>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-sm">{r.expense_date}</TableCell>
                    <TableCell>{r.category}</TableCell>
                    <TableCell className="max-w-[320px] truncate" title={r.description}>{r.description || "—"}</TableCell>
                    <TableCell>{r.amount} {r.currency}</TableCell>
                    <TableCell className="capitalize">{r.status}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => setEditRow(r)}>Edit</Button>
                      <Button size="sm" variant="outline" onClick={() => toggleStatus(r)}>Toggle</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>Record a new organization expense.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input id="ex_cat" placeholder="Category" />
            <Input id="ex_amt" placeholder="Amount" type="number" min="0" step="0.01" />
            <Input id="ex_cur" placeholder="Currency" defaultValue="SAR" />
            <Input id="ex_date" type="date" />
            <Input id="ex_desc" placeholder="Description (optional)" className="md:col-span-2" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={create}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editRow} onOpenChange={(o) => setEditRow(o ? editRow : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
          </DialogHeader>
          {editRow && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input id="exu_cat" defaultValue={editRow.category} placeholder="Category" />
              <Input id="exu_amt" defaultValue={String(editRow.amount)} placeholder="Amount" type="number" min="0" step="0.01" />
              <Input id="exu_cur" defaultValue={editRow.currency} placeholder="Currency" />
              <Input id="exu_date" defaultValue={editRow.expense_date} type="date" />
              <Input id="exu_desc" defaultValue={editRow.description || ''} placeholder="Description (optional)" className="md:col-span-2" />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRow(null)}>Cancel</Button>
            <Button onClick={update}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}


