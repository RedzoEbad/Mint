"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { format, formatDistanceToNow } from "date-fns"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useAuth } from "@/components/auth-provider"
import { getValidToken } from "@/lib/token-utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Users,
  UserPlus,
  CalendarDays,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  Eye,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface CandidateStats {
  total: number
  today: number
  thisMonth: number
  active: number
  inProcess: number
  completed: number
  rejected: number
  statusBreakdown: Record<string, number>
  recent: {
    id: string
    full_name: string
    surname?: string
    post_applied_for: string
    status: string
    created_at: string
  }[]
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active: {
    label: "Active",
    className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
  },
  in_process: {
    label: "In Process",
    className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
  },
  rejected: {
    label: "Rejected",
    className: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
  },
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  }
  return (
    <Badge variant="outline" className={cn("font-medium capitalize border", config.className)}>
      {config.label}
    </Badge>
  )
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
  loading,
}: {
  title: string
  value: number
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  gradient: string
  loading?: boolean
}) {
  return (
    <Card className="candidate-glass-card border-0 overflow-hidden shadow-lg hover:shadow-xl dark:shadow-none dark:hover:shadow-md transition-shadow duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{title}</p>
            {loading ? (
              <Skeleton className="h-9 w-20" />
            ) : (
              <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{value.toLocaleString()}</p>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl shadow-md", gradient)}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ReceptionistDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<CandidateStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      setLoading(true)
      const token = getValidToken()
      const res = await fetch("/api/candidates/stats", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setStats(data.data)
      }
    } catch (e) {
      console.error("Error loading candidate stats", e)
    } finally {
      setLoading(false)
    }
  }

  const firstName = user?.full_name?.split(" ")[0] ?? "there"

  return (
    <DashboardLayout title="Reception Dashboard">
      <div className="space-y-6 candidate-fade-in max-w-6xl mx-auto">
        {/* Welcome banner */}
        <div className="candidate-form-hero">
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Reception Portal
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Welcome back, {firstName}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm sm:text-base">
                Here&apos;s an overview of candidate registrations and activity.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <Button
                asChild
                className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 dark:shadow-blue-900/40"
              >
                <Link href="/dashboard/candidates/add">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Candidate
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-xl border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:bg-slate-800 dark:text-slate-200"
              >
                <Link href="/dashboard/candidates">
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Total Candidates"
            value={stats?.total ?? 0}
            subtitle="All registered candidates"
            icon={Users}
            gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
            loading={loading}
          />
          <StatCard
            title="Registered Today"
            value={stats?.today ?? 0}
            subtitle={format(new Date(), "EEEE, MMM d")}
            icon={CalendarDays}
            gradient="bg-gradient-to-br from-violet-500 to-purple-600"
            loading={loading}
          />
          <StatCard
            title="This Month"
            value={stats?.thisMonth ?? 0}
            subtitle={format(new Date(), "MMMM yyyy")}
            icon={TrendingUp}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
            loading={loading}
          />
          <StatCard
            title="In Process"
            value={stats?.inProcess ?? 0}
            subtitle="Currently being processed"
            icon={Clock}
            gradient="bg-gradient-to-br from-amber-500 to-orange-600"
            loading={loading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status breakdown */}
          <Card className="candidate-glass-card border-0 shadow-lg dark:shadow-none lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Status Overview</CardTitle>
              <CardDescription className="dark:text-slate-400">Breakdown by candidate status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)
              ) : (
                [
                  { key: "active", label: "Active", value: stats?.active ?? 0, color: "bg-blue-500", icon: Users },
                  { key: "in_process", label: "In Process", value: stats?.inProcess ?? 0, color: "bg-amber-500", icon: Clock },
                  { key: "completed", label: "Completed", value: stats?.completed ?? 0, color: "bg-emerald-500", icon: CheckCircle2 },
                  { key: "rejected", label: "Rejected", value: stats?.rejected ?? 0, color: "bg-rose-500", icon: XCircle },
                ].map(({ key, label, value, color, icon: Icon }) => {
                  const pct = stats?.total ? Math.round((value / stats.total) * 100) : 0
                  return (
                    <div
                      key={key}
                      className="rounded-xl border border-slate-100 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", color)}>
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
                        </div>
                        <span className="text-lg font-bold text-slate-900 dark:text-white">{value}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{pct}% of total</p>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* Recent registrations */}
          <Card className="candidate-glass-card border-0 shadow-lg dark:shadow-none lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Recent Registrations</CardTitle>
                <CardDescription className="dark:text-slate-400">Latest candidates added to the system</CardDescription>
              </div>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/50 rounded-lg"
              >
                <Link href="/dashboard/candidates">
                  See all <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : stats?.recent?.length ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                        <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Name</TableHead>
                        <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Post Applied</TableHead>
                        <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Status</TableHead>
                        <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Added</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.recent.map((c) => (
                        <TableRow
                          key={c.id}
                          className="border-slate-100 dark:border-slate-800 hover:bg-blue-50/30 dark:hover:bg-slate-800/60"
                        >
                          <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                            {[c.full_name, c.surname].filter(Boolean).join(" ")}
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400">{c.post_applied_for || "—"}</TableCell>
                          <TableCell>
                            <StatusBadge status={c.status} />
                          </TableCell>
                          <TableCell className="text-slate-500 dark:text-slate-400 text-sm">
                            {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                          </TableCell>
                          <TableCell>
                            <Button
                              asChild
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-950/50 dark:hover:text-blue-300"
                            >
                              <Link href={`/dashboard/candidates/${c.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="candidate-empty-state m-6">
                  <Users className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No candidates yet</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 mb-4">Start by registering your first candidate</p>
                  <Button asChild size="sm" className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600">
                    <Link href="/dashboard/candidates/add">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Candidate
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
