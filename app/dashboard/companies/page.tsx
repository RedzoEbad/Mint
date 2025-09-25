"use client"

import { useEffect, useMemo, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { getValidToken } from "@/lib/token-utils"
import { Building2, Mail, Phone, User2, MapPin, PlusCircle, Search, Factory, Edit3, Save, X, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"

export default function CompaniesPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<any[]>([])
  const [total, setTotal] = useState<number>(0)
  const [page, setPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(12)
  const [name, setName] = useState("")
  const [contact, setContact] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [country, setCountry] = useState("")
  const [requirements, setRequirements] = useState("")
  const [editingId, setEditingId] = useState<string>("")
  const [draft, setDraft] = useState<any>({})

  const qs = useMemo(() => {
    const s = new URLSearchParams()
    if (search) s.set("search", search)
    s.set("page", String(page))
    s.set("limit", String(limit))
    return s.toString()
  }, [search, page, limit])

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    async function load() {
      try {
        setLoading(true)
        const token = getValidToken()
        const res = await fetch(`/api/companies?${qs}`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: "include", signal: controller.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (!active) return
        if (data.success) {
          setRows(data.data)
          setTotal(data.meta?.total || (data.data || []).length)
        }
      } catch (_) {
        if (!active) return
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false; controller.abort() }
  }, [qs])

  const createCompany = async () => {
    try {
      const token = getValidToken()
      const res = await fetch(`/api/companies`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, contact_person: contact, email, phone, address, country, requirements }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast({ title: "Company created" })
        setName(""); setContact(""); setEmail(""); setPhone(""); setAddress(""); setCountry(""); setRequirements("")
        // refresh list
        const token2 = getValidToken()
        const res2 = await fetch(`/api/companies?${qs}`, { headers: token2 ? { Authorization: `Bearer ${token2}` } : {}, credentials: "include" })
        const data2 = await res2.json()
        if (data2.success) setRows(data2.data)
      } else {
        const msg = data?.message || "Failed to create company"
        toast({ title: "Failed to create", description: msg, variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Error", description: "Unable to create company", variant: "destructive" })
    }
  }

  return (
    <DashboardLayout title="Companies">
      <div className="space-y-6">
        {/* Header + Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Companies</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total}</div>
              <p className="text-xs text-muted-foreground">Total active records</p>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Search & Quick Create</CardTitle>
              <CardDescription>Find existing companies or add a new one</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Search by name, contact, requirements" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => setSearch("")} variant="outline">Clear</Button>
                  <Button onClick={() => router.push("/dashboard/companies/new") }>
                    <PlusCircle className="mr-2 h-4 w-4" /> New Company
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>


        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>Companies matching your search</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-28 w-full bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <div className="text-center">
                  <Building2 className="mx-auto h-8 w-8 mb-2" />
                  <p className="font-medium">No companies found</p>
                  <p className="text-sm">Try a different search or create a new company</p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rows.map((r) => (
                    <Card key={r.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="rounded-md bg-blue-50 p-2 text-blue-600"><Building2 className="h-4 w-4" /></div>
                            <div>
                              {editingId === r.id ? (
                                <div className="space-y-1">
                                  <Input value={draft.name || ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="h-8" />
                                  <Input value={draft.country || ""} onChange={(e) => setDraft({ ...draft, country: e.target.value })} className="h-8" placeholder="Country" />
                                </div>
                              ) : (
                                <>
                                  <CardTitle className="text-base leading-tight">{r.name}</CardTitle>
                                  <CardDescription>{r.country || "—"}</CardDescription>
                                </>
                              )}
                            </div>
                          </div>
                          {editingId === r.id ? (
                            <div className="flex items-center gap-2">
                              <Button size="sm" onClick={async () => {
                                try {
                                  const res = await fetch(`/api/companies/${r.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ name: draft.name, country: draft.country, contact_person: draft.contact_person, email: draft.email, phone: draft.phone }) })
                                  const data = await res.json().catch(() => ({}))
                                  if (res.ok && data.success) {
                                    toast({ title: "Saved", description: "Company updated" })
                                    const res2 = await fetch(`/api/companies?${qs}`, { credentials: "include" })
                                    const data2 = await res2.json()
                                    if (data2.success) setRows(data2.data)
                                    setEditingId("")
                                  } else {
                                    toast({ title: "Failed", description: data?.message || `HTTP ${res.status}`, variant: "destructive" })
                                  }
                                } catch (e: any) {
                                  if (e?.message) toast({ title: "Error", description: e.message, variant: "destructive" })
                                }
                              }} className="gap-1"><Save className="h-4 w-4" /> Save</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingId("")}>Cancel</Button>
                            </div>
                          ) : null}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <User2 className="h-4 w-4" /> {editingId === r.id ? <Input value={draft.contact_person || ""} onChange={(e) => setDraft({ ...draft, contact_person: e.target.value })} className="h-8" /> : (r.contact_person || "—")}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" /> {editingId === r.id ? <Input value={draft.phone || ""} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} className="h-8" /> : (r.phone || "—")}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                            <Mail className="h-4 w-4" /> {editingId === r.id ? <Input value={draft.email || ""} onChange={(e) => setDraft({ ...draft, email: e.target.value })} className="h-8" /> : (r.email || "—")}
                          </div>
                        </div>
                        {editingId !== r.id && (
                          <div className="flex items-center justify-end gap-2 pt-2">
                            <Button size="sm" variant="outline" className="gap-1" onClick={() => { setEditingId(r.id); setDraft(r) }}>
                              <Edit3 className="h-4 w-4" /> Edit
                            </Button>
                            <Button size="sm" className="gap-1" onClick={() => router.push(`/dashboard/admin/assignments?companyId=${r.id}`)}>
                              <UserPlus className="h-4 w-4" /> Assign Agent
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <Button variant="outline" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>Previous</Button>
                  <div className="text-sm text-muted-foreground">Page {page}</div>
                  <Button variant="outline" onClick={() => setPage(page + 1)} disabled={rows.length < limit}>Next</Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}


