"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { getValidToken } from "@/lib/token-utils"
import { Building2, Factory, Mail, MapPin, Phone, User2 } from "lucide-react"
import { COUNTRIES } from "@/components/data/countries"
import { useRouter } from "next/navigation"

export default function NewCompanyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [form, setForm] = useState({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    country: "",
    requirements: "",
  })
  const [busy, setBusy] = useState(false)

  const onChange = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value })

  const submit = async () => {
    if (!form.name) { toast({ title: "Name is required", variant: "destructive" }); return }
    try {
      setBusy(true)
      const token = getValidToken()
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        toast({ title: "Company created" })
        router.replace("/dashboard/companies")
      } else {
        toast({ title: "Failed", description: data?.message || `HTTP ${res.status}`, variant: "destructive" })
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Create failed", variant: "destructive" })
    } finally { setBusy(false) }
  }

  return (
    <DashboardLayout title="New Company">
      <div className="max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Create Company/Project</CardTitle>
            <CardDescription>Admins can create a company and later assign agents to it.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm mb-1 flex items-center gap-2"><Factory className="h-4 w-4" /> Name</div>
                <Input value={form.name} onChange={onChange("name")} placeholder="Company name" />
              </div>
              <div>
                <div className="text-sm mb-1 flex items-center gap-2"><User2 className="h-4 w-4" /> Contact Person</div>
                <Input value={form.contact_person} onChange={onChange("contact_person")} placeholder="Contact person" />
              </div>
              <div>
                <div className="text-sm mb-1 flex items-center gap-2"><Mail className="h-4 w-4" /> Email</div>
                <Input type="email" value={form.email} onChange={onChange("email")} placeholder="Email" />
              </div>
              <div>
                <div className="text-sm mb-1 flex items-center gap-2"><Phone className="h-4 w-4" /> Phone</div>
                <Input value={form.phone} onChange={onChange("phone")} placeholder="Phone" />
              </div>
              <div className="md:col-span-2">
                <div className="text-sm mb-1 flex items-center gap-2"><MapPin className="h-4 w-4" /> Address</div>
                <Input value={form.address} onChange={onChange("address")} placeholder="Address" />
              </div>
              <div>
                <div className="text-sm mb-1">Country</div>
                <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select country" /></SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (<SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="text-sm mb-1">Requirements</div>
                <Input value={form.requirements} onChange={onChange("requirements")} placeholder="Short requirements" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={submit} disabled={busy}>{busy ? "Saving..." : "Create"}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}


