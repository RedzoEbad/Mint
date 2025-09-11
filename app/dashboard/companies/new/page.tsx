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
  const { toast } = useToast()
  const router = useRouter()
  const [name, setName] = useState("")
  const [contact, setContact] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [country, setCountry] = useState("")
  const [requirements, setRequirements] = useState("")
  const [saving, setSaving] = useState(false)

  const createCompany = async () => {
    try {
      setSaving(true)
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
        router.push("/dashboard/companies")
      } else {
        toast({ title: "Failed to create", description: data.message || "", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Error", description: "Unable to create company", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout title="New Company">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> Company Details</CardTitle>
            <CardDescription>Provide company information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm mb-1">Name</label>
                <div className="relative">
                  <Factory className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9" value={name} onChange={(e) => setName(e.target.value)} placeholder="Company name" />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">Contact Person</label>
                <div className="relative">
                  <User2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Full name" />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="email" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@company.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 3xx xxxxxxx" />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">Country</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <div className="pl-8">
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger><SelectValue placeholder="Select a country" /></SelectTrigger>
                      <SelectContent className="max-h-64">
                        {COUNTRIES.map((c) => (
                          <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm mb-1">Address</label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, City" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm mb-1">Requirements</label>
                <Input value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="Role requirements or notes" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Button onClick={createCompany} disabled={!name || saving}>{saving ? "Creating..." : "Create"}</Button>
              <Button variant="ghost" onClick={() => history.back()}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}


