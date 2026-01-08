"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "./auth-provider"
import { getValidToken } from "@/lib/token-utils"

interface Company {
    id: string
    name: string
}

interface CompanyContextType {
    companies: Company[]
    selectedCompanyId: string
    setSelectedCompanyId: (id: string) => void
    loading: boolean
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

export function CompanyProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth()
    const [companies, setCompanies] = useState<Company[]>([])
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>("")
    const [loading, setLoading] = useState(false)

    // Load companies for process agents
    useEffect(() => {
        if (!user || user.role !== "process_agent") {
            setCompanies([])
            setSelectedCompanyId("")
            return
        }

        const fetchCompanies = async () => {
            try {
                setLoading(true)
                const token = getValidToken()
                const res = await fetch(`/api/companies`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    credentials: "include"
                })
                const data = await res.json()
                if (data.success) {
                    const list = data.data || []
                    setCompanies(list)

                    // Hydrate from localStorage or select first
                    const stored = localStorage.getItem("selectedCompanyId")
                    if (stored && list.some((c: Company) => c.id === stored)) {
                        setSelectedCompanyId(stored)
                    } else if (list.length > 0) {
                        const firstId = list[0].id
                        setSelectedCompanyId(firstId)
                        localStorage.setItem("selectedCompanyId", firstId)
                    }
                }
            } catch (error) {
                console.error("Failed to fetch companies:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchCompanies()
    }, [user])

    const handleSetSelectedCompanyId = (id: string) => {
        setSelectedCompanyId(id)
        localStorage.setItem("selectedCompanyId", id)
        // Dispatch global event for components not using this context yet (legacy support during transition)
        window.dispatchEvent(new CustomEvent("companyChanged", { detail: { id } }))
    }

    return (
        <CompanyContext.Provider value={{
            companies,
            selectedCompanyId,
            setSelectedCompanyId: handleSetSelectedCompanyId,
            loading
        }}>
            {children}
        </CompanyContext.Provider>
    )
}

export function useCompany() {
    const context = useContext(CompanyContext)
    if (context === undefined) {
        throw new Error("useCompany must be used within a CompanyProvider")
    }
    return context
}
