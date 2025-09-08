"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { getValidToken } from "@/lib/token-utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { Users, UserPlus, Download, TrendingUp, DollarSign, Activity } from "lucide-react"
import { EmptyUsers } from "@/components/ui/empty-state"

interface AdminStats {
  users: {
    total_users: number
    receptionists: number
    process_agents: number
    accountants: number
    active_users: number
  }
  candidates: {
    total_candidates: number
    active_candidates: number
    in_process: number
    completed: number
    new_this_month: number
  }
  companies: {
    total_companies: number
    active_companies: number
  }
  workflows: {
    total_workflows: number
    medical_completed: number
    visa_completed: number
    protector_completed: number
    passport_completed: number
    flight_completed: number
  }
  payments: {
    total_payments: number
    total_revenue: number
    pending_payments: number
    avg_payment: number
  }
  recentActivity: Array<{
    type: string
    description: string
    timestamp: string
  }>
}

interface User {
  id: string
  full_name: string
  email: string
  role: string
  is_active: boolean
  created_at: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "",
  })

  useEffect(() => {
    ;(async () => {
      await Promise.all([fetchStats(), fetchUsers()])
      setLoading(false)
    })()
  }, [])

  const fetchStats = async () => {
    try {
      const token = getValidToken()
      const response = await fetch("/api/admin/stats", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      const token = getValidToken()
      const response = await fetch("/api/admin/users", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(Array.isArray(data) ? data : data.users || [])
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const handleCreateUser = async () => {
    try {
      const token = getValidToken()
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          email: newUser.email,
          full_name: newUser.full_name,
          password: newUser.password,
          role: newUser.role,
          is_active: true,
        }),
      })

      if (response.ok) {
        setIsCreateUserOpen(false)
        setNewUser({ full_name: "", email: "", password: "", role: "" })
        fetchUsers()
        fetchStats()
      }
    } catch (error) {
      console.error("Error creating user:", error)
    }
  }

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const token = getValidToken()
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ is_active: !currentStatus }),
      })

      if (response.ok) {
        fetchUsers()
        fetchStats()
      }
    } catch (error) {
      console.error("Error updating user status:", error)
    }
  }

  const downloadFinancialReport = async () => {
    try {
      const response = await fetch("/api/admin/reports/financial")
      if (response.ok) {
        const data = await response.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `financial-report-${new Date().toISOString().split("T")[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error("Error downloading financial report:", error)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Super Admin Dashboard">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-white border rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="mt-6 bg-white border rounded-lg h-80 animate-pulse" />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Super Admin Dashboard">
      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.users.total_users || 0}</div>
              <p className="text-xs text-muted-foreground">{stats?.users.active_users || 0} active users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.candidates.total_candidates || 0}</div>
              <p className="text-xs text-muted-foreground">{stats?.candidates.new_this_month || 0} new this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats?.payments.total_revenue?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">{stats?.payments.pending_payments || 0} pending payments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Companies</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.companies.active_companies || 0}</div>
              <p className="text-xs text-muted-foreground">of {stats?.companies.total_companies || 0} total</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Workflow Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Workflow Progress</CardTitle>
                  <CardDescription>Current status of all workflows</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Medical Completed</span>
                    <Badge variant="secondary">{stats?.workflows.medical_completed || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Visa Completed</span>
                    <Badge variant="secondary">{stats?.workflows.visa_completed || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Protector Completed</span>
                    <Badge variant="secondary">{stats?.workflows.protector_completed || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Passport Completed</span>
                    <Badge variant="secondary">{stats?.workflows.passport_completed || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Flight Completed</span>
                    <Badge variant="secondary">{stats?.workflows.flight_completed || 0}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest system activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats?.recentActivity.slice(0, 5).map((activity, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">User Management</h3>
              <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                      Add a new user to the system with appropriate role permissions.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="full_name">Full name</Label>
                      <Input
                        id="full_name"
                        value={newUser.full_name}
                        onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="receptionist">Receptionist</SelectItem>
                          <SelectItem value="process_agent">Process Agent</SelectItem>
                          <SelectItem value="accountant">Accountant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateUserOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateUser}>Create User</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                {users.length === 0 ? (
                  <EmptyUsers onCreate={() => setIsCreateUserOpen(true)} />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.full_name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{user.role.replace("_", " ").toUpperCase()}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.is_active ? "default" : "secondary"}>
                              {user.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                            >
                              {user.is_active ? "Deactivate" : "Activate"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Reports & Analytics</h3>
              <Button onClick={downloadFinancialReport}>
                <Download className="h-4 w-4 mr-2" />
                Download Financial Report
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Summary</CardTitle>
                  <CardDescription>Revenue and payment statistics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Payments</span>
                    <span className="font-semibold">{stats?.payments.total_payments || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Revenue</span>
                    <span className="font-semibold">${stats?.payments.total_revenue?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Payment</span>
                    <span className="font-semibold">${stats?.payments.avg_payment?.toFixed(2) || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pending Payments</span>
                    <span className="font-semibold">{stats?.payments.pending_payments || 0}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Performance</CardTitle>
                  <CardDescription>Key performance indicators</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Users</span>
                    <span className="font-semibold">{stats?.users.active_users || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Candidates in Process</span>
                    <span className="font-semibold">{stats?.candidates.in_process || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Completed Workflows</span>
                    <span className="font-semibold">{stats?.candidates.completed || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Companies</span>
                    <span className="font-semibold">{stats?.companies.active_companies || 0}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
