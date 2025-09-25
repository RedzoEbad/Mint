"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { getValidToken } from "@/lib/token-utils"
import {
  CheckCircle2,
  Clock,
  Stethoscope,
  Shield,
  Stamp,
  Plane,
  FileText,
  Lock,
  ChevronDown,
  FileIcon,
  ImageIcon,
  Trash2,
  Upload,
  User,
  Building,
  CreditCard,
  AlertTriangle,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion, AnimatePresence } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"

type StageStatus = "pending" | "in_progress" | "completed" | "rejected"

export default function WorkflowDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [workflow, setWorkflow] = useState<any | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    ;(async () => {
      try {
        setLoading(true)
        const token = getValidToken()
        const res = await fetch(`/api/workflows/${params.id}?ts=${Date.now()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
          signal: controller.signal,
          cache: "no-store" as RequestCache,
        })
        const data = await res.json()
        if (res.ok && data.success) setWorkflow(data.data)
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          console.error("Workflow detail load error", e)
          toast({ title: "Failed to load workflow", description: "Please try again.", variant: "destructive" })
        }
      } finally {
        setLoading(false)
      }
    })()
    return () => controller.abort()
  }, [params.id])

  const stagesOrder = ["medical", "visa", "protector", "passport", "flight"] as const

  const isStageLocked = (stageKey: string) => {
    const idx = stagesOrder.indexOf(stageKey as any)
    if (idx <= 0) return false
    const prev = stagesOrder[idx - 1]
    const prevStatus = workflow?.[`${prev}_status`]
    return prevStatus !== "completed"
  }

  const requiresPayment = (stageKey: string) => stageKey === "medical" || stageKey === "visa"
  const isPaymentApproved = (stageKey: string) => workflow?.[`${stageKey}_payment_status`] === "paid"

  const StageCard = ({
    title,
    icon,
    stageKey,
    status,
    fields,
  }: {
    title: string
    icon: React.ReactNode
    stageKey: string
    status: StageStatus
    fields?: React.ReactNode
  }) => {
    const [localStatus, setLocalStatus] = useState<StageStatus>(status)
    const [saving, setSaving] = useState(false)
    const [expanded, setExpanded] = useState<boolean>(true)
    const locked = isStageLocked(stageKey)
    const paymentNeeded = requiresPayment(stageKey)
    const paymentOk = isPaymentApproved(stageKey)
    const [reqAmount, setReqAmount] = useState<string>("")
    const [reqCurrency, setReqCurrency] = useState<string>("PKR")
    const [requesting, setRequesting] = useState<boolean>(false)
    const [retractOpen, setRetractOpen] = useState(false)
    const [retractMode, setRetractMode] = useState<"hard" | "soft">("hard")
    const [confirmText, setConfirmText] = useState("")
    const [uploading, setUploading] = useState(false)
    const [pendingDocs, setPendingDocs] = useState<
      { url: string; filename?: string; mime_type?: string; size_bytes?: number }[]
    >([])

    const [stageNotes, setStageNotes] = useState<string>(workflow?.[`${stageKey}_notes`] || "")

    const update = async () => {
      try {
        setSaving(true)
        const token = getValidToken()
        const res = await fetch(`/api/workflows/${params.id}`, {
          method: "PUT",
          headers: token
            ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
            : { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            stage: stageKey,
            status: localStatus,
            notes: stageNotes,
            ...(stageKey === "medical"
              ? {
                  medical_center:
                    (document.getElementById("medical_center") as HTMLInputElement | null)?.value || undefined,
                  medical_report_no:
                    (document.getElementById("medical_report_no") as HTMLInputElement | null)?.value || undefined,
                }
              : {}),
            ...(stageKey === "visa"
              ? {
                  visa_file_no:
                    (document.getElementById("visa_file_no") as HTMLInputElement | null)?.value || undefined,
                  visa_embassy:
                    (document.getElementById("visa_embassy") as HTMLInputElement | null)?.value || undefined,
                }
              : {}),
            ...(stageKey === "protector"
              ? {
                  protector_no:
                    (document.getElementById("protector_no") as HTMLInputElement | null)?.value || undefined,
                }
              : {}),
            ...(stageKey === "flight"
              ? {
                  flight_pnr: (document.getElementById("flight_pnr") as HTMLInputElement | null)?.value || undefined,
                  flight_airline:
                    (document.getElementById("flight_airline") as HTMLInputElement | null)?.value || undefined,
                }
              : {}),
            documents: pendingDocs,
          }),
        })
        const data = await res.json()
        if (res.ok && data.success) {
          toast({ title: `${title} updated` })
          // Refetch to show latest state without hard refresh
          try {
            const tk = getValidToken()
            const r = await fetch(`/api/workflows/${params.id}?ts=${Date.now()}`, {
              headers: tk ? { Authorization: `Bearer ${tk}` } : {},
              credentials: "include",
              cache: "no-store" as RequestCache,
            })
            const d = await r.json().catch(() => ({}))
            if (r.ok && d.success) setWorkflow(d.data)
          } catch {}
        } else {
          toast({ title: `Failed to update ${title}`, description: data.message || "", variant: "destructive" })
        }
      } catch {
        toast({ title: "Error", description: "Request failed", variant: "destructive" })
      } finally {
        setSaving(false)
      }
    }

    const iconBadge = {
      pending: <Clock className="h-4 w-4 text-amber-500" />,
      in_progress: <TrendingUp className="h-4 w-4 text-blue-500" />,
      completed: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
      rejected: <AlertTriangle className="h-4 w-4 text-red-500" />,
    }[localStatus]

    const statusBadge = (
      <Badge
        className={
          localStatus === "completed"
            ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0 shadow-lg shadow-emerald-500/25"
            : localStatus === "in_progress"
              ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-lg shadow-blue-500/25"
              : localStatus === "rejected"
                ? "bg-gradient-to-r from-red-500 to-rose-600 text-white border-0 shadow-lg shadow-red-500/25"
                : "bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-lg shadow-amber-500/25"
        }
      >
        <Sparkles className="h-3 w-3 mr-1" />
        {localStatus.replace("_", " ").toUpperCase()}
      </Badge>
    )

    const saveDisabled = locked || (paymentNeeded && !paymentOk)

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 backdrop-blur-sm">
          <CardHeader className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-t-lg">
            <button className="flex items-center gap-3 group" onClick={() => setExpanded((v) => !v)}>
              <div className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-md group-hover:shadow-lg transition-all duration-200">
                {icon}
              </div>
              <CardTitle className="group-hover:text-primary transition-colors duration-200">{title}</CardTitle>
              <ChevronDown
                className={`ml-2 h-5 w-5 transition-all duration-300 ${expanded ? "rotate-180" : "rotate-0"} text-muted-foreground group-hover:text-primary`}
              />
          </button>
            <div className="flex items-center gap-3 text-sm">
            {locked ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                      <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700">
                    <Lock className="h-4 w-4 text-gray-500" />
                      </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Complete previous stage to unlock</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : null}
              <div className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm">{iconBadge}</div>
            {statusBadge}
          </div>
        </CardHeader>
          <AnimatePresence>
        {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CardContent className="pt-6">
          {paymentNeeded && !paymentOk && (
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="mb-6 rounded-xl border-0 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-6 shadow-lg"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/50">
                          <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="font-semibold text-amber-900 dark:text-amber-100">Payment Required</div>
                      </div>
                      <div className="mb-4 text-amber-800 dark:text-amber-200">
                        Request payment from Accounts to unlock this stage.
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Amount"
                          className="w-32 bg-white dark:bg-gray-800 border-amber-200 dark:border-amber-700"
                          value={reqAmount}
                          onChange={(e) => setReqAmount(e.target.value)}
                        />
                        <Input
                          placeholder="Currency"
                          className="w-28 bg-white dark:bg-gray-800 border-amber-200 dark:border-amber-700"
                          value={reqCurrency}
                          onChange={(e) => setReqCurrency(e.target.value)}
                        />
                        <Button
                          variant="secondary"
                          disabled={!reqAmount || requesting}
                          className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 hover:from-amber-600 hover:to-orange-700 shadow-lg"
                          onClick={async () => {
                            // ... existing payment request logic ...
                          }}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          {requesting ? "Requesting..." : "Request Payment"}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                  <div
                    className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${locked || (paymentNeeded && !paymentOk) ? "opacity-60 pointer-events-none" : ""}`}
                  >
                    {fields}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-foreground">Attach Documents</label>
                      <div className="text-xs text-muted-foreground mb-3">PDF/JPG/PNG/WebP, max 5MB each</div>
                      <div className="flex items-center gap-3">
                        <input
                          id={`file_${stageKey}`}
                          type="file"
                          accept=".pdf,image/*"
                          multiple
                          className="hidden"
                          onChange={async (e) => {
                            // ... existing file upload logic ...
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          disabled={uploading}
                          onClick={() => document.getElementById(`file_${stageKey}`)?.click()}
                          className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700 hover:from-blue-100 hover:to-indigo-100"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {uploading ? "Uploading..." : "Upload Files"}
                        </Button>
                      </div>
                      {pendingDocs.length > 0 && (
                        <div className="space-y-2">
                          {pendingDocs.map((d, idx) => {
                            const isImage = (d.mime_type || "").startsWith("image/")
                            const Icon = isImage ? ImageIcon : d.mime_type === "application/pdf" ? FileText : FileIcon
                            return (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center justify-between rounded-lg border bg-white dark:bg-gray-800 p-3 shadow-sm"
                              >
                                <div className="flex items-center gap-3 text-sm">
                                  <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-900/20">
                                    <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <a
                                    href={d.url}
                                    className="hover:underline font-medium"
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {d.filename || d.url}
                                  </a>
                                  <Badge variant="secondary" className="text-xs">
                                    {Math.ceil((d.size_bytes || 0) / 1024)} KB
                                  </Badge>
              </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setPendingDocs((prev) => prev.filter((_, i) => i !== idx))}
                                  className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </motion.div>
                            )
                          })}
            </div>
          )}
                    </div>
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-foreground">Status</label>
              <Select value={localStatus} onValueChange={(v) => setLocalStatus(v as StageStatus)}>
                        <SelectTrigger className="bg-white dark:bg-gray-800">
                          <SelectValue />
                        </SelectTrigger>
                <SelectContent>
                          <SelectItem value="pending">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-amber-500" />
                              Pending
                            </div>
                          </SelectItem>
                          <SelectItem value="in_progress">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-blue-500" />
                              In Progress
                            </div>
                          </SelectItem>
                          <SelectItem value="completed">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              Completed
                            </div>
                          </SelectItem>
                          <SelectItem value="rejected">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                              Rejected
                            </div>
                          </SelectItem>
                </SelectContent>
              </Select>
              {paymentNeeded && (
                        <p className="text-xs text-muted-foreground">Completion may require Accounts approval.</p>
              )}
            </div>
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-foreground">Notes</label>
                      <Input
                        value={stageNotes}
                        onChange={(e) => setStageNotes(e.target.value)}
                        placeholder={`Notes for ${title}`}
                        className="bg-white dark:bg-gray-800"
                      />
            </div>
          </div>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Button
                      onClick={async () => {
                        await update()
                      }}
                      disabled={saving || saveDisabled}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg"
                    >
                      {saving ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                            className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                          />
                          Saving...
                        </>
                      ) : locked ? (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Locked
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Save
                        </>
                      )}
                    </Button>
            {paymentNeeded && localStatus === "completed" && !paymentOk && (
                      <Badge variant="outline" className="text-amber-600 border-amber-200">
                        <Clock className="h-3 w-3 mr-1" />
                        Awaiting Accounts approval
                      </Badge>
                    )}
                  <Button
                      variant="outline"
                      onClick={() => setRetractOpen(true)}
                      className="hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/20"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Retract
                    </Button>
                    {/* ... existing retract dialog logic ... */}
          </div>
        </CardContent>
              </motion.div>
        )}
          </AnimatePresence>
      </Card>
      </motion.div>
    )
  }

  if (loading || !workflow) {
    return (
      <DashboardLayout title="Workflow">
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-2 w-full rounded-full" />
            </CardContent>
          </Card>
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-40" />
                  <Skeleton className="h-9 w-40" />
                </div>
                <div className="mt-4 flex gap-3">
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title={`Workflow: ${workflow.candidate_name || workflow.candidate_id}`}>
      <div className="space-y-8">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/50">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl">Workflow Progress</CardTitle>
                <CardDescription>Track completion across all stages</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="sticky top-16 z-10 -mx-4 mb-6 px-4 py-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-xl shadow-lg border">
              <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden shadow-inner">
                {(() => {
                  const progressPercent = Math.round(
                    (stagesOrder.filter((s) => (workflow?.[`${s}_status`] || "pending") === "completed").length /
                      stagesOrder.length) *
                      100,
                  )
                  return (
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-600 shadow-lg"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  )
                })()}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-sm font-medium text-foreground">
                  {stagesOrder.filter((s) => (workflow?.[`${s}_status`] || "pending") === "completed").length} of{" "}
                  {stagesOrder.length} stages completed
                </div>
                <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
                  {Math.round(
                    (stagesOrder.filter((s) => (workflow?.[`${s}_status`] || "pending") === "completed").length /
                      stagesOrder.length) *
                      100,
                  )}
                  %
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-4 overflow-x-auto pb-2">
              {stagesOrder.map((s) => {
                const st = workflow?.[`${s}_status`] || "pending"
                const locked = isStageLocked(s)
                return (
                  <a key={s} href={`#stage-${s}`}>
                    <motion.div
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg min-w-fit ${
                        st === "completed"
                          ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-emerald-500/25"
                          : st === "in_progress"
                            ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-blue-500/25"
                            : st === "rejected"
                              ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-red-500/25"
                              : "bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 dark:from-gray-700 dark:to-gray-600 dark:text-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                      <span className="capitalize">{s}</span>
                        {locked && <Lock className="h-4 w-4 opacity-70" />}
                      </div>
                    </motion.div>
                  </a>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
                <User className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <CardTitle className="text-xl">Candidate Overview</CardTitle>
                <CardDescription>Essential information and context</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <div className="text-sm text-muted-foreground">Candidate</div>
                  <div className="font-semibold">{workflow.candidate_name}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <div className="text-sm text-muted-foreground">Passport</div>
                  <div className="font-semibold">{workflow.passport_no}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <Building className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <div>
                  <div className="text-sm text-muted-foreground">Company</div>
                  <div className="font-semibold">{workflow.company_name}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medical */}
        <div id="stage-medical" />
        <StageCard
          title="Medical Examination"
          icon={<Stethoscope className="h-6 w-6 text-red-500" />}
          stageKey="medical"
          status={workflow.medical_status as StageStatus}
          fields={
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">Medical Center</label>
                <Input
                  id="medical_center"
                  defaultValue={workflow.medical_center || ""}
                  placeholder="Enter medical center name"
                  className="bg-white dark:bg-gray-800"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">Report Number</label>
                <Input
                  id="medical_report_no"
                  defaultValue={workflow.medical_report_no || ""}
                  placeholder="Enter report number"
                  className="bg-white dark:bg-gray-800"
                />
              </div>
            </>
          }
        />

        {/* Visa */}
        <div id="stage-visa" />
        <StageCard
          title="Visa Processing"
          icon={<Stamp className="h-6 w-6 text-purple-500" />}
          stageKey="visa"
          status={workflow.visa_status as StageStatus}
          fields={
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">Visa File Number</label>
                <Input
                  id="visa_file_no"
                  defaultValue={workflow.visa_file_no || ""}
                  placeholder="Enter visa file number"
                  className="bg-white dark:bg-gray-800"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">Embassy</label>
                <Input
                  id="visa_embassy"
                  defaultValue={workflow.visa_embassy || ""}
                  placeholder="Enter embassy name"
                  className="bg-white dark:bg-gray-800"
                />
              </div>
            </>
          }
        />

        {/* Protector */}
        <div id="stage-protector" />
        <StageCard
          title="Protector Registration"
          icon={<Shield className="h-6 w-6 text-emerald-500" />}
          stageKey="protector"
          status={workflow.protector_status as StageStatus}
          fields={
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">Protector Number</label>
                <Input
                  id="protector_no"
                  defaultValue={workflow.protector_no || ""}
                  placeholder="Enter protector number"
                  className="bg-white dark:bg-gray-800"
                />
              </div>
            </>
          }
        />

        {/* Passport */}
        <div id="stage-passport" />
        <StageCard
          title="Passport Processing"
          icon={<FileText className="h-6 w-6 text-gray-600" />}
          stageKey="passport"
          status={workflow.passport_status as StageStatus}
        />

        {/* Flight */}
        <div id="stage-flight" />
        <StageCard
          title="Flight Booking"
          icon={<Plane className="h-6 w-6 text-sky-500" />}
          stageKey="flight"
          status={workflow.flight_status as StageStatus}
          fields={
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">PNR Code</label>
                <Input
                  id="flight_pnr"
                  defaultValue={workflow.flight_pnr || ""}
                  placeholder="Enter PNR code"
                  className="bg-white dark:bg-gray-800"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">Airline</label>
                <Input
                  id="flight_airline"
                  defaultValue={workflow.flight_airline || ""}
                  placeholder="Enter airline name"
                  className="bg-white dark:bg-gray-800"
                />
              </div>
            </>
          }
        />
      </div>
    </DashboardLayout>
  )
}
