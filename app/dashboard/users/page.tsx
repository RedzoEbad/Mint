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

  async function loadUsers() {
    setLoading(true)
    try {
      const token = getValidToken()
      if (!token) {
        console.warn("No valid token found for loadUsers")
        return
      }
      
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      })
      
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
      const token = getValidToken()
      if (!token) {
        console.warn("No valid token found for createUser")
        return
      }
      
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
      const token = getValidToken()
      if (!token) {
        console.warn("No valid token found for toggleActive")
        return
      }
      
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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

  useEffect(() => {
    loadUsers()
  }, [])

  return (
    <DashboardLayout title="User Management">
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Employee Account</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3">
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
            <Button onClick={createUser} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Creating...
                </span>
              ) : (
                "Create"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employees</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-3 border rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-56" />
                      </div>
                      <Skeleton className="h-9 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <div className="font-medium">{u.full_name}</div>
                      <div className="text-sm text-gray-500">{u.email} • {u.role}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={() => toggleActive(u.id, u.is_active)}>
                        {u.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}


