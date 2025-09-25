"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getValidToken } from "@/lib/token-utils"
import { useToast } from "@/hooks/use-toast"

type Employee = { id: string; full_name: string; email?: string; phone?: string; department?: string; position?: string; join_date?: string; status?: string }

export default function AdminEmployeesPage() {
  const { toast } = useToast()
  const [list, setList] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState<Employee | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const token = getValidToken()
      const res = await fetch(`/api/employees${q ? `?q=${encodeURIComponent(q)}` : ''}`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: 'include' })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) setList(data.data || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [q])

  const create = async () => {
    const token = getValidToken()
    const payload = {
      full_name: (document.getElementById('emp_full') as HTMLInputElement)?.value,
      email: (document.getElementById('emp_email') as HTMLInputElement)?.value,
      phone: (document.getElementById('emp_phone') as HTMLInputElement)?.value,
      department: (document.getElementById('emp_dept') as HTMLInputElement)?.value,
      position: (document.getElementById('emp_pos') as HTMLInputElement)?.value,
      join_date: (document.getElementById('emp_join') as HTMLInputElement)?.value,
      status: (document.getElementById('emp_status') as HTMLInputElement)?.value || 'active',
    }
    try {
      const res = await fetch(`/api/employees`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) { toast({ title: 'Employee added' }); setAddOpen(false); load() } else { toast({ title: 'Failed', description: data?.message || '', variant: 'destructive' }) }
    } catch {}
  }

  const update = async () => {
    if (!editRow) return
    const token = getValidToken()
    const payload = {
      id: editRow.id,
      full_name: (document.getElementById('emp2_full') as HTMLInputElement)?.value,
      email: (document.getElementById('emp2_email') as HTMLInputElement)?.value,
      phone: (document.getElementById('emp2_phone') as HTMLInputElement)?.value,
      department: (document.getElementById('emp2_dept') as HTMLInputElement)?.value,
      position: (document.getElementById('emp2_pos') as HTMLInputElement)?.value,
      join_date: (document.getElementById('emp2_join') as HTMLInputElement)?.value,
      status: (document.getElementById('emp2_status') as HTMLInputElement)?.value,
    }
    try {
      const res = await fetch(`/api/employees`, { method: 'PUT', headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) { toast({ title: 'Employee updated' }); setEditRow(null); load() } else { toast({ title: 'Failed', description: data?.message || '', variant: 'destructive' }) }
    } catch {}
  }

  const remove = async (id: string) => {
    const token = getValidToken()
    try {
      const res = await fetch(`/api/employees?id=${id}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: 'include' })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) { toast({ title: 'Employee deleted' }); load() } else { toast({ title: 'Failed', description: data?.message || '', variant: 'destructive' }) }
    } catch {}
  }

  return (
    <DashboardLayout title="Employees">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Input placeholder="Search name/email" value={q} onChange={(e) => setQ(e.target.value)} className="w-64" />
          <Button onClick={() => setAddOpen(true)}>Add Employee</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Employee List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
                  ) : list.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.full_name}</TableCell>
                      <TableCell className="font-mono text-sm">{r.email}</TableCell>
                      <TableCell>{r.department || '—'}</TableCell>
                      <TableCell>{r.position || '—'}</TableCell>
                      <TableCell className="font-mono text-sm">{r.phone || '—'}</TableCell>
                      <TableCell className="capitalize">{r.status || 'active'}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => setEditRow(r)}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => remove(r.id)}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Add */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Employee</DialogTitle>
              <DialogDescription>Create a new employee record.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input id="emp_full" placeholder="Full name" />
              <Input id="emp_email" placeholder="Email" />
              <Input id="emp_phone" placeholder="Phone" />
              <Input id="emp_dept" placeholder="Department" />
              <Input id="emp_pos" placeholder="Position" />
              <Input id="emp_join" type="date" />
              <Input id="emp_status" placeholder="Status" defaultValue="active" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={create}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit */}
        <Dialog open={!!editRow} onOpenChange={(o) => setEditRow(o ? editRow : null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Employee</DialogTitle>
            </DialogHeader>
            {editRow && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input id="emp2_full" defaultValue={editRow.full_name || ''} placeholder="Full name" />
                <Input id="emp2_email" defaultValue={editRow.email || ''} placeholder="Email" />
                <Input id="emp2_phone" defaultValue={editRow.phone || ''} placeholder="Phone" />
                <Input id="emp2_dept" defaultValue={editRow.department || ''} placeholder="Department" />
                <Input id="emp2_pos" defaultValue={editRow.position || ''} placeholder="Position" />
                <Input id="emp2_join" defaultValue={editRow.join_date || ''} type="date" />
                <Input id="emp2_status" defaultValue={editRow.status || 'active'} placeholder="Status" />
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditRow(null)}>Cancel</Button>
              <Button onClick={update}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}



