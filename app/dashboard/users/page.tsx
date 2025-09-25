"use client"
import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { getValidToken } from "@/lib/token-utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2 } from "lucide-react"
import { PageLoader } from "@/components/ui/page-loader"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

interface UserItem {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [role, setRole] = useState("receptionist")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editEmail, setEditEmail] = useState("")
  const [editFullName, setEditFullName] = useState("")
  const [editRole, setEditRole] = useState("receptionist")
  const [editPassword, setEditPassword] = useState("")
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [confirmToggleId, setConfirmToggleId] = useState<string | null>(null)
  const [confirmToggleActive, setConfirmToggleActive] = useState<boolean>(false)

  async function loadUsers() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/users", { credentials: "include" })
      
      if (!res.ok) {
        if (res.status === 401) {
          console.warn("Unauthorized access to users - token may be invalid")
          return
        }
        throw new Error(`HTTP ${res.status}`)
      }
      
      const data = await res.json()
      if (data.success) setUsers(data.users)
    } catch (error) {
      console.error("Error loading users:", error)
    } finally {
      setLoading(false)
    }
  }

  async function createUser() {
    if (!email || !fullName || !password) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, full_name: fullName, role, password, is_active: true }),
      })
      
      if (!res.ok) {
        if (res.status === 401) {
          console.warn("Unauthorized access for createUser - token may be invalid")
          return
        }
        throw new Error(`HTTP ${res.status}`)
      }
      
      if (res.ok) {
        setEmail("")
        setFullName("")
        setPassword("")
        setCreateOpen(false)
        await loadUsers()
      }
    } catch (error) {
      console.error("Error creating user:", error)
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleActive(id: string, is_active: boolean) {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ is_active: !is_active }),
      })
      
      if (!res.ok) {
        if (res.status === 401) {
          console.warn("Unauthorized access for toggleActive - token may be invalid")
          return
        }
        throw new Error(`HTTP ${res.status}`)
      }
      
      await loadUsers()
    } catch (error) {
      console.error("Error toggling user active status:", error)
    }
  }

  function beginEdit(u: UserItem) {
    setEditId(u.id)
    setEditEmail(u.email)
    setEditFullName(u.full_name)
    setEditRole(u.role)
    setEditPassword("")
    setEditOpen(true)
  }

  async function submitEdit() {
    if (!editId) return
    setEditSubmitting(true)
    try {
      const token = getValidToken()
      const res = await fetch(`/api/admin/users/${editId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          email: editEmail || undefined,
          full_name: editFullName || undefined,
          password: editPassword || undefined,
        }),
      })

      if (!res.ok) {
        if (res.status === 401) {
          console.warn("Unauthorized access for submitEdit - token may be invalid")
          return
        }
        throw new Error(`HTTP ${res.status}`)
      }

      setEditId(null)
      setEditPassword("")
      await loadUsers()
    } catch (error) {
      console.error("Error updating user:", error)
    } finally {
      setEditSubmitting(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  return (
    <DashboardLayout title="User Management">
      <div className="grid grid-cols-1 gap-6">
        <div className="flex items-center justify-between">
          <CardTitle>Employees</CardTitle>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">Add User</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Employee Account</DialogTitle>
                <DialogDescription>Provide details to create a new user.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
                <Input
                  placeholder="Full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="focus:ring-2 focus:ring-blue-600"
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="focus:ring-2 focus:ring-blue-600"
                />
                <Input
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus:ring-2 focus:ring-blue-600"
                />
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="focus:ring-2 focus:ring-blue-600">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receptionist">Receptionist</SelectItem>
                    <SelectItem value="process_agent">Process Agent</SelectItem>
                    <SelectItem value="accountant">Accountant</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button onClick={createUser} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Creating...
                    </span>
                  ) : (
                    "Create"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Employees</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <PageLoader message="Loading users..." />
            ) : (
              <div className="space-y-2">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <div className="font-medium">{u.full_name}</div>
                      <div className="text-sm text-gray-500">{u.email} • {u.role}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={() => beginEdit(u)}>
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" onClick={() => { setConfirmToggleId(u.id); setConfirmToggleActive(u.is_active) }}>
                            {u.is_active ? "Deactivate" : "Activate"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{confirmToggleActive ? "Deactivate user?" : "Activate user?"}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {confirmToggleActive ? "This will disable the user's access." : "This will enable the user's access."}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={async () => { const id = confirmToggleId; const active = confirmToggleActive; setConfirmToggleId(null); await toggleActive(id as string, active) }}>Confirm</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
              <Input
                placeholder="Full name"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                className="focus:ring-2 focus:ring-blue-600"
              />
              <Input
                placeholder="Email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="focus:ring-2 focus:ring-blue-600"
              />
              <Input
                placeholder="New Password (leave blank to keep)"
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                className="focus:ring-2 focus:ring-blue-600"
              />
              {/* Role is immutable after creation; display-only */}
              <Input value={editRole} disabled className="opacity-70" />
            </div>
            <DialogFooter>
              <Button onClick={submitEdit} disabled={editSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                {editSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                  </span>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
