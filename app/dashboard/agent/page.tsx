"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Workflow, Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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
  const [stats, setStats] = useState<WorkflowStats | null>(null)
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([])
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const { toast } = useToast()

  useEffect(() => {
    fetchStats()
    fetchWorkflows()
    fetchInterviews()
  }, [])

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("auth-token")
      const response = await fetch("/api/workflows/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
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
      const token = localStorage.getItem("auth-token")
      const response = await fetch("/api/workflows", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
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

  const fetchInterviews = async () => {
    try {
      const token = localStorage.getItem("auth-token")
      const response = await fetch("/api/interviews", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setInterviews(data.data)
      }
    } catch (error) {
      console.error("Error fetching interviews:", error)
    }
  }

  const updateWorkflowStatus = async (workflowId: string, statusType: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("auth-token")
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          [statusType]: newStatus,
        }),
      })
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="interviews">Interviews</TabsTrigger>
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

              {/* Upcoming Interviews */}
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Interviews</CardTitle>
                  <CardDescription>Scheduled interviews</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {interviews
                      .filter((i) => i.interview_status === "scheduled")
                      .slice(0, 5)
                      .map((interview) => (
                        <div key={interview.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{interview.candidate_name}</p>
                            <p className="text-sm text-gray-500">{interview.company_name}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(interview.interview_date).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className="bg-blue-100 text-blue-800">{interview.interview_type.toUpperCase()}</Badge>
                        </div>
                      ))}
                  </div>
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
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Candidate</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Medical</TableHead>
                          <TableHead>Visa</TableHead>
                          <TableHead>Protector</TableHead>
                          <TableHead>Passport</TableHead>
                          <TableHead>Flight</TableHead>
                          <TableHead>Overall</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {workflows.map((workflow) => (
                          <TableRow key={workflow.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{workflow.candidate_name}</div>
                                <div className="text-sm text-gray-500">{workflow.passport_no}</div>
                              </div>
                            </TableCell>
                            <TableCell>{workflow.company_name}</TableCell>
                            <TableCell>
                              <WorkflowStageButton
                                status={workflow.medical_status}
                                onUpdate={(newStatus) => updateWorkflowStatus(workflow.id, "medical_status", newStatus)}
                                stageName="Medical"
                              />
                            </TableCell>
                            <TableCell>
                              <WorkflowStageButton
                                status={workflow.visa_status}
                                onUpdate={(newStatus) => updateWorkflowStatus(workflow.id, "visa_status", newStatus)}
                                stageName="Visa"
                              />
                            </TableCell>
                            <TableCell>
                              <WorkflowStageButton
                                status={workflow.protector_status}
                                onUpdate={(newStatus) =>
                                  updateWorkflowStatus(workflow.id, "protector_status", newStatus)
                                }
                                stageName="Protector"
                              />
                            </TableCell>
                            <TableCell>
                              <WorkflowStageButton
                                status={workflow.passport_status}
                                onUpdate={(newStatus) =>
                                  updateWorkflowStatus(workflow.id, "passport_status", newStatus)
                                }
                                stageName="Passport"
                              />
                            </TableCell>
                            <TableCell>
                              <WorkflowStageButton
                                status={workflow.flight_status}
                                onUpdate={(newStatus) => updateWorkflowStatus(workflow.id, "flight_status", newStatus)}
                                stageName="Flight"
                              />
                            </TableCell>
                            <TableCell>{getStatusBadge(workflow.overall_status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interviews" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Interview Management</CardTitle>
                <CardDescription>Schedule and manage candidate interviews</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {interviews.map((interview) => (
                      <TableRow key={interview.id}>
                        <TableCell className="font-medium">{interview.candidate_name}</TableCell>
                        <TableCell>{interview.company_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{interview.interview_type.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell>{new Date(interview.interview_date).toLocaleDateString()}</TableCell>
                        <TableCell>{getStatusBadge(interview.interview_status)}</TableCell>
                        <TableCell>{interview.result && getStatusBadge(interview.result)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
