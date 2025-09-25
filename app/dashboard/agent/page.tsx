"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useAuth } from "@/components/auth-provider"
import { getValidToken } from "@/lib/token-utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Workflow, Calendar, CheckCircle, Clock, AlertCircle, Users, Search, Play, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { EmptyWorkflows, EmptyInterviews, EmptySearch } from "@/components/ui/empty-state"
import WorkflowTable from "@/components/workflows/workflow-table"
 

interface WorkflowStats {
  active: number
  today: number
  pending_interviews: number
  statusBreakdown: Record<string, number>
}

interface WorkflowItem {
  id: string
  candidate_name: string
  passport_no: string
  post_applied_for: string
  company_name: string
  medical_status: string
  visa_status: string
  protector_status: string
  passport_status: string
  flight_status: string
  overall_status: string
  created_at: string
}

interface Interview {
  id: string
  candidate_name: string
  company_name: string
  interview_type: string
  interview_date: string
  interview_status: string
  result: string
}

export default function ProcessAgentDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<WorkflowStats | null>(null)
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([])
  
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const { toast } = useToast()
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([])
  const [companyId, setCompanyId] = useState("")
  const [candidateId, setCandidateId] = useState("")
  const [interviewDate, setInterviewDate] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetchStats()
    fetchWorkflows()
    
  }, [])

  useEffect(() => {
    // load assigned companies for scheduler
    ;(async () => {
      try {
        const token = getValidToken()
        const res = await fetch(`/api/companies`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: "include" })
        const data = await res.json()
        if (data.success) {
          setCompanies(data.data || [])
          if (!companyId && data.data?.length) setCompanyId(data.data[0].id)
        }
      } catch {}
    })()
  }, [])

  const fetchStats = async () => {
    try {
      const token = getValidToken()
      const response = await fetch("/api/workflows/stats", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          console.warn("Unauthorized access to stats - token may be invalid")
          return
        }
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const fetchWorkflows = async () => {
    try {
      setLoading(true)
      const token = getValidToken()
      const response = await fetch("/api/workflows", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          console.warn("Unauthorized access to workflows - token may be invalid")
          return
        }
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      if (data.success) {
        setWorkflows(data.data)
      }
    } catch (error) {
      console.error("Error fetching workflows:", error)
    } finally {
      setLoading(false)
    }
  }

  

  const updateWorkflowStatus = async (workflowId: string, statusType: string, newStatus: string) => {
    try {
      const token = getValidToken()
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: "PUT",
        headers: token
          ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
          : { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          stage: statusType.replace(/_status$/, ""),
          status: newStatus,
        }),
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Error",
            description: "Authentication failed. Please log in again.",
            variant: "destructive",
          })
          return
        }
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Workflow status updated successfully",
        })
        fetchWorkflows()
        fetchStats()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update workflow status",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while updating the workflow",
        variant: "destructive",
      })
    }
  }

  // Admin/Super Admin reset action (callable from Admin context)
  const resetWorkflow = async (workflowId: string) => {
    try {
      const token = getValidToken()
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: "PUT",
        headers: token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "reset" }),
      })
      const data = await response.json()
      if (data.success) {
        toast({ title: "Workflow reset", description: "All stages set to pending" })
        fetchWorkflows()
        fetchStats()
      } else {
        toast({ title: "Error", description: data.message || "Failed to reset workflow", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to reset workflow", variant: "destructive" })
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      initiated: "bg-blue-100 text-blue-800",
      in_progress: "bg-purple-100 text-purple-800",
      cancelled: "bg-gray-100 text-gray-800",
    }
    return (
      <Badge className={variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    )
  }

  const WorkflowStageButton = ({
    status,
    onUpdate,
    stageName,
  }: {
    status: string
    onUpdate: (newStatus: string) => void
    stageName: string
  }) => {
    const getIcon = () => {
      switch (status) {
        case "completed":
          return <CheckCircle className="h-4 w-4 text-green-600" />
        case "rejected":
          return <AlertCircle className="h-4 w-4 text-red-600" />
        default:
          return <Clock className="h-4 w-4 text-yellow-600" />
      }
    }

    return (
      <Select value={status} onValueChange={onUpdate}>
        <SelectTrigger className="w-32">
          <div className="flex items-center gap-2">
            {getIcon()}
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
        </SelectContent>
      </Select>
    )
  }

  return (
    <DashboardLayout title="Process Agent Dashboard">
      <div className="space-y-6">
        {/* Hero Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Search className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Search & Select</h3>
                  <p className="text-sm text-gray-600">Find candidates by job and keywords</p>
                  <Button size="sm" className="mt-2" onClick={() => window.location.href = "/dashboard/agent/pool"}>
                    Go to Pool
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Manage Engagements</h3>
                  <p className="text-sm text-gray-600">Set interview status and notes</p>
                  <Button size="sm" className="mt-2" onClick={() => window.location.href = "/dashboard/agent/pool"}>
                    Go to Pool
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Workflow className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Continue Workflows</h3>
                  <p className="text-sm text-gray-600">Track and manage active workflows</p>
                  <Button size="sm" className="mt-2" onClick={() => window.location.href = "/dashboard/workflows"}>
                    Go to Workflows
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Users className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">To Select</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.pending_interviews || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Interviews Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.pending_interviews || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ready to Start</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.active || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Workflow className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.active || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
              <Workflow className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats?.active || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Interviews</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats?.pending_interviews || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.today || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats?.statusBreakdown?.in_progress || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Workflows */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Workflows</CardTitle>
                  <CardDescription>Latest workflow activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {workflows.slice(0, 5).map((workflow) => (
                      <div key={workflow.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{workflow.candidate_name}</p>
                          <p className="text-sm text-gray-500">{workflow.company_name}</p>
                        </div>
                        {getStatusBadge(workflow.overall_status)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Engagements emphasis */}
              <Card>
                <CardHeader>
                  <CardTitle>Engagements</CardTitle>
                  <CardDescription>Update interview statuses in Pool</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600">Use Pool to manage interview status and add notes per engagement.</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="workflows" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Management</CardTitle>
                <CardDescription>Track and manage candidate workflows through all stages</CardDescription>
              </CardHeader>
              <CardContent>
                <WorkflowTable />
              </CardContent>
            </Card>
          </TabsContent>

          
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
