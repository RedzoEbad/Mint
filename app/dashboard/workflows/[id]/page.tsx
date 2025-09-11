"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { getValidToken } from "@/lib/token-utils"
import { AlertCircle, CheckCircle, Clock, HeartPulse, ShieldCheck, Stamp, Plane, FileText, Lock, ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion, AnimatePresence } from "framer-motion"

type StageStatus = "pending" | "in_progress" | "completed" | "rejected"

export default function WorkflowDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [workflow, setWorkflow] = useState<any | null>(null)

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    async function load() {
      try {
        setLoading(true)
        const token = getValidToken()
        const res = await fetch(`/api/workflows/${params.id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: "include", signal: controller.signal })
        const data = await res.json()
        if (!active) return
        if (res.ok && data.success) setWorkflow(data.data)
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          console.error("Workflow detail load error", e)
          toast({ title: "Failed to load workflow", description: "Please try again.", variant: "destructive" })
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    load();
    return () => { active = false; controller.abort() }
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
  const isPaymentApproved = (stageKey: string) => Boolean(workflow?.[`${stageKey}_payment_ok`])

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

    const update = async () => {
      try {
        setSaving(true)
        const token = getValidToken()
        const res = await fetch(`/api/workflows/${params.id}`, {
          method: "PUT",
          headers: token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ stage: stageKey, status: localStatus }),
        })
        const data = await res.json()
        if (res.ok && data.success) {
          toast({ title: `${title} updated` })
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
      pending: <Clock className="h-4 w-4 text-yellow-600" />,
      in_progress: <Clock className="h-4 w-4 text-blue-600" />,
      completed: <CheckCircle className="h-4 w-4 text-green-600" />,
      rejected: <AlertCircle className="h-4 w-4 text-red-600" />,
    }[localStatus]

    const statusBadge = (
      <Badge className={
        localStatus === "completed" ? "bg-green-100 text-green-800" :
        localStatus === "in_progress" ? "bg-blue-100 text-blue-800" :
        localStatus === "rejected" ? "bg-red-100 text-red-800" :
        "bg-gray-100 text-gray-800"
      }>
        {localStatus.replace("_", " ").toUpperCase()}
      </Badge>
    )

    const saveDisabled = locked || (paymentNeeded && localStatus === "completed" && !paymentOk)

    return (
      <Card className="border shadow-sm">
        <CardHeader className="flex items-center justify-between">
          <button className="flex items-center gap-2 group" onClick={() => setExpanded((v) => !v)}>
            <div>{icon}</div>
            <CardTitle className="group-hover:underline">{title}</CardTitle>
            <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${expanded ? "rotate-180" : "rotate-0"}`} />
          </button>
          <div className="flex items-center gap-2 text-sm">
            {locked ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Lock className="h-4 w-4 text-gray-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Complete previous stage to unlock</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : null}
            {iconBadge}
            {statusBadge}
          </div>
        </CardHeader>
        {expanded && (
        <CardContent>
          {paymentNeeded && !paymentOk && (
            <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm">
              <div className="font-medium text-yellow-900">Payment required to proceed</div>
              <div className="mt-1 text-yellow-800">Request payment from Accounts to unlock this stage.</div>
              <div className="mt-3 flex items-center gap-2">
                <Input type="number" min="0" step="0.01" placeholder="Amount" className="w-28" value={reqAmount} onChange={(e) => setReqAmount(e.target.value)} />
                <Input placeholder="Currency" className="w-24" value={reqCurrency} onChange={(e) => setReqCurrency(e.target.value)} />
                <Button variant="secondary" disabled={!reqAmount || requesting} onClick={async () => {
                  try {
                    setRequesting(true)
                    const token = getValidToken()
                    const res = await fetch(`/api/payments`, {
                      method: "POST",
                      headers: token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({
                        candidate_id: workflow?.candidate_id,
                        workflow_id: params.id,
                        payment_type: stageKey,
                        amount: Number(reqAmount),
                        currency: reqCurrency,
                        payment_method: "N/A",
                        transaction_id: "",
                        notes: `Requested via workflow (${stageKey})`,
                      }),
                    })
                    const data = await res.json()
                    if (res.ok && data.success) {
                      toast({ title: "Payment requested", description: `${title} payment sent to Accounts` })
                    } else {
                      toast({ title: "Failed to request", description: data.message || "Payment not created", variant: "destructive" })
                    }
                  } catch {
                    toast({ title: "Network error", description: "Request failed", variant: "destructive" })
                  } finally {
                    setRequesting(false)
                  }
                }}>{requesting ? "Requesting..." : "Request Payment"}</Button>
              </div>
            </div>
          )}
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${locked || (paymentNeeded && !paymentOk) ? "opacity-60 pointer-events-none" : ""}`}>
            {fields}
            <div>
              <label className="block text-sm mb-1">Status</label>
              <Select value={localStatus} onValueChange={(v) => setLocalStatus(v as StageStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              {paymentNeeded && (
                <p className="mt-1 text-xs text-muted-foreground">Completion may require Accounts approval.</p>
              )}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={async () => { await update() }} disabled={saving || saveDisabled}>{saving ? "Saving..." : locked ? "Locked" : "Save"}</Button>
            {paymentNeeded && localStatus === "completed" && !paymentOk && (
              <span className="text-xs text-muted-foreground">Awaiting Accounts approval/payment</span>
            )}
            <Button variant="outline" onClick={async () => {
              if (!confirm("Retract this stage to Pending?")) return
              try {
                const token = getValidToken()
                await fetch(`/api/workflows/${params.id}`, {
                  method: "PUT",
                  headers: token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({ stage: stageKey, status: "pending" }),
                })
                toast({ title: "Stage retracted", description: `${title} set to Pending` })
              } catch {}
            }}>Retract</Button>
            {paymentNeeded && !paymentOk && (
              <div className="flex items-center gap-2 ml-auto">
                <Input type="number" min="0" step="0.01" placeholder="Amount" className="w-28" value={reqAmount} onChange={(e) => setReqAmount(e.target.value)} />
                <Input placeholder="Currency" className="w-24" value={reqCurrency} onChange={(e) => setReqCurrency(e.target.value)} />
                <Button variant="secondary" disabled={!reqAmount || requesting} onClick={async () => {
                  try {
                    setRequesting(true)
                    const token = getValidToken()
                    const res = await fetch(`/api/payments`, {
                      method: "POST",
                      headers: token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({
                        candidate_id: workflow?.candidate_id,
                        workflow_id: params.id,
                        payment_type: stageKey,
                        amount: Number(reqAmount),
                        currency: reqCurrency,
                        payment_method: "N/A",
                        transaction_id: "",
                        notes: `Requested via workflow (${stageKey})`,
                      }),
                    })
                    const data = await res.json()
                    if (res.ok && data.success) toast({ title: "Payment requested", description: `${title} payment sent to Accounts` })
                    else toast({ title: "Failed to request", description: data.message || "Payment not created", variant: "destructive" })
                  } catch {
                    toast({ title: "Network error", description: "Request failed", variant: "destructive" })
                  } finally {
                    setRequesting(false)
                  }
                }}>{requesting ? "Requesting..." : "Request Payment"}</Button>
              </div>
            )}
          </div>
        </CardContent>
        )}
      </Card>
    )
  }

  if (loading || !workflow) {
    return (
      <DashboardLayout title="Workflow">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div key={i} className="h-40 w-full bg-gray-200 rounded-2xl" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity }} />
          ))}
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title={`Workflow: ${workflow.candidate_name || workflow.candidate_id}` }>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Stages</CardTitle>
            <CardDescription>Click a stage to edit if unlocked</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="sticky top-16 z-10 -mx-4 mb-3 px-4 py-3 bg-white/80 backdrop-blur rounded-lg shadow-sm">
              <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                {(() => {
                  const progressPercent = Math.round((stagesOrder.filter(s => (workflow?.[`${s}_status`] || "pending") === "completed").length / stagesOrder.length) * 100)
                  return (
                    <motion.div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-400" initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.6 }} />
                  )
                })()}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">{stagesOrder.filter(s => (workflow?.[`${s}_status`] || "pending") === "completed").length} of {stagesOrder.length} stages completed</div>
            </div>
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {stagesOrder.map((s) => {
                const st = workflow?.[`${s}_status`] || "pending"
                const locked = isStageLocked(s)
                return (
                  <a key={s} href={`#stage-${s}`}>
                    <motion.div whileHover={{ scale: 1.05 }} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        st === "completed" ? "bg-green-600 text-white" :
                        st === "in_progress" ? "bg-blue-600 text-white" :
                        st === "rejected" ? "bg-red-600 text-white" :
                        "bg-gray-200 text-gray-700"
                      }`}>
                      <span className="capitalize">{s}</span>
                      {locked && <Lock className="ml-2 inline-block h-4 w-4 opacity-70" />}
                    </motion.div>
                  </a>
                )
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Candidate and employer context</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div><span className="text-muted-foreground">Candidate:</span> {workflow.candidate_name}</div>
              <div><span className="text-muted-foreground">Passport:</span> {workflow.passport_no}</div>
              <div><span className="text-muted-foreground">Company:</span> {workflow.company_name}</div>
            </div>
          </CardContent>
        </Card>

        {/* Medical */}
        <div id="stage-medical" />
        <StageCard
          title="Medical"
          icon={<HeartPulse className="h-5 w-5 text-blue-600" />}
          stageKey="medical"
          status={workflow.medical_status as StageStatus}
          fields={
            <>
              <div>
                <label className="block text-sm mb-1">Medical Center</label>
                <Input defaultValue={workflow.medical_center || ""} placeholder="Optional" />
              </div>
              <div>
                <label className="block text-sm mb-1">Report No.</label>
                <Input defaultValue={workflow.medical_report_no || ""} placeholder="Optional" />
              </div>
            </>
          }
        />

        {/* Visa */}
        <div id="stage-visa" />
        <StageCard
          title="Visa"
          icon={<Stamp className="h-5 w-5 text-purple-600" />}
          stageKey="visa"
          status={workflow.visa_status as StageStatus}
          fields={
            <>
              <div>
                <label className="block text-sm mb-1">Visa File No.</label>
                <Input defaultValue={workflow.visa_file_no || ""} placeholder="Optional" />
              </div>
              <div>
                <label className="block text-sm mb-1">Embassy</label>
                <Input defaultValue={workflow.visa_embassy || ""} placeholder="Optional" />
              </div>
            </>
          }
        />

        {/* Protector */}
        <div id="stage-protector" />
        <StageCard
          title="Protector"
          icon={<ShieldCheck className="h-5 w-5 text-emerald-600" />}
          stageKey="protector"
          status={workflow.protector_status as StageStatus}
          fields={
            <>
              <div>
                <label className="block text-sm mb-1">Protector No.</label>
                <Input defaultValue={workflow.protector_no || ""} placeholder="Optional" />
              </div>
            </>
          }
        />

        {/* Passport */}
        <div id="stage-passport" />
        <StageCard
          title="Passport"
          icon={<FileText className="h-5 w-5 text-gray-700" />}
          stageKey="passport"
          status={workflow.passport_status as StageStatus}
        />

        {/* Flight */}
        <div id="stage-flight" />
        <StageCard
          title="Flight"
          icon={<Plane className="h-5 w-5 text-sky-600" />}
          stageKey="flight"
          status={workflow.flight_status as StageStatus}
          fields={
            <>
              <div>
                <label className="block text-sm mb-1">PNR</label>
                <Input defaultValue={workflow.flight_pnr || ""} placeholder="Optional" />
              </div>
              <div>
                <label className="block text-sm mb-1">Airline</label>
                <Input defaultValue={workflow.flight_airline || ""} placeholder="Optional" />
              </div>
            </>
          }
        />
      </div>
    </DashboardLayout>
  )
}


