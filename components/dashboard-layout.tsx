  "use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Users,
  UserPlus,
  Settings,
  LogOut,
  Menu,
  Home,
  Building2,
  CreditCard,
  Calendar,
  BarChart3,
  UserCheck,
  Workflow,
  Receipt,
  Search as SearchIcon,
  Command as CommandIcon,
  MoreHorizontal,
  DollarSign,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { routeRoleMap } from "@/lib/rbac"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CommandDialog, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty, CommandSeparator } from "@/components/ui/command"

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[]
}

// Primary navigation tuned per role (RBAC further filters this)
const navigationItems: NavigationItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: Home, roles: ["super_admin", "receptionist", "process_agent", "accountant"] },
  { name: "Dashboard", href: "/dashboard/super-admin", icon: Settings, roles: ["super_admin"] },
  { name: "Dashboard", href: "/dashboard/admin", icon: Home, roles: ["admin"] },
  { name: "Employees", href: "/dashboard/admin/employees", icon: Users, roles: ["super_admin", "admin"] },
  // Admin-specific core tasks
  { name: "Companies", href: "/dashboard/companies", icon: Building2, roles: ["super_admin", "admin"] },
  { name: "Agent Assignments", href: "/dashboard/admin/assignments", icon: UserCheck, roles: ["super_admin", "admin"] },
  { name: "Engagements", href: "/dashboard/admin/engagements", icon: Users, roles: ["super_admin", "admin"] },
  { name: "Accounts Report", href: "/dashboard/accounts/reports", icon: BarChart3, roles: ["super_admin", "accountant", "admin"] },
  // General
  { name: "Candidate Pool", href: "/dashboard/agent/pool", icon: Users, roles: ["process_agent"] },
  { name: "Payments", href: "/dashboard/payments", icon: DollarSign, roles: ["process_agent"] },
  { name: "Workflows", href: "/dashboard/workflows", icon: Workflow, roles: ["super_admin", "process_agent", "admin"] },
  { name: "Reports", href: "/dashboard/agent/reports", icon: BarChart3, roles: ["process_agent"] },
]

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([])
  const [companyId, setCompanyId] = useState<string>("")
  const [commandOpen, setCommandOpen] = useState(false)

  const userInitials = (user?.full_name || "")
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase()

  // Filter nav by RBAC route map; if the route exists in RBAC, use it as source of truth
  const filteredNavigation = navigationItems
    .filter((item) => {
      const allowed = routeRoleMap[item.href as keyof typeof routeRoleMap]
      const roles = allowed ?? item.roles
      if (!allowed && !item.roles?.length) return false
      if (!user) return false
      // For admins, hide the generic /dashboard link in favor of /dashboard/admin
      if (user.role === "admin" && item.href === "/dashboard") return false
      return roles.includes(user.role)
    })

  // Prune redundant links for accountant role (Dashboard already points to Accounts sections)
  const rolePrunedNavigation = filteredNavigation.filter((item) => {
    if (user?.role === "accountant") {
      if (item.href === "/dashboard/accounts" || item.href === "/dashboard/reports") {
        return false
      }
    }
    return true
  })

  // Determine the deepest matching route so only one nav item is highlighted
  const matchedItems = filteredNavigation.filter((item) => {
    if (item.href === "/dashboard") return pathname === "/dashboard"
    return pathname === item.href || pathname.startsWith(item.href + "/")
  })
  const activeHref = matchedItems.sort((a, b) => b.href.length - a.href.length)[0]?.href

  const roleLabels = {
    super_admin: "Super Administrator",
    admin: "Admin",
    receptionist: "Receptionist",
    process_agent: "Process Agent",
    accountant: "Accountant",
  }

  // Build command palette links with RBAC visibility
  const commandLinks: { name: string; href: string }[] = [
    { name: "Candidate Pool", href: "/dashboard/agent/pool" },
    { name: "Workflows", href: "/dashboard/workflows" },
    { name: "Admin Engagements", href: "/dashboard/admin/engagements" },
    { name: "Agent Assignments", href: "/dashboard/admin/assignments" },
    { name: "Companies", href: "/dashboard/companies" },
    { name: "Payments", href: "/dashboard/payments" },
    { name: "Expenses", href: "/dashboard/expenses" },
    { name: "Reports", href: "/dashboard/reports" },
    { name: "Users", href: "/dashboard/users" },
  ]
  const allowedCommands = commandLinks.filter((link) => {
    const roles = routeRoleMap[link.href as keyof typeof routeRoleMap]
    return user ? Array.isArray(roles) && roles.includes(user.role) : false
  })

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="relative flex h-full flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Background Pattern - Using CSS for better performance */}
      <div className="absolute inset-0 sidebar-pattern opacity-[0.12] dark:opacity-[0.08] pointer-events-none pattern-transition"></div>

      {/* Logo */}
      <div className="relative z-10 flex h-16 items-center justify-center px-4 border-b border-gray-200 dark:border-gray-700 bg-white/85 dark:bg-gray-900/85 sidebar-backdrop">
        <div className="relative w-32 h-8">
          <Image src="/images/mint-logo.png" alt="MINT International" fill className="object-contain" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex-1 space-y-1 px-2 py-4">
        {rolePrunedNavigation.map((item) => {
          const isActive = item.href === activeHref

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => mobile && setSidebarOpen(false)}
              className={cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 relative",
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg"
                  : "text-gray-700 dark:text-gray-300 hover:bg-blue-50/80 dark:hover:bg-gray-800/80 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-sm sidebar-backdrop",
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                  isActive ? "text-white" : "text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400",
                )}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Enhanced Pattern Footer - Using CSS for better performance */}
      <div className="relative z-10 h-24 overflow-hidden bg-gradient-to-t from-white/90 dark:from-gray-900/90 to-transparent">
        <div className="absolute inset-0 sidebar-pattern-footer opacity-[0.06] dark:opacity-[0.04] pattern-transition"></div>
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-gray-900 to-transparent"></div>
      </div>
    </div>
  )

  // Load assigned companies for process agents and hydrate switcher from localStorage
  useEffect(() => {
    if (!user || user.role !== "process_agent") return
    ;(async () => {
      try {
        const res = await fetch(`/api/companies`, { credentials: "include" })
        const data = await res.json()
        if (data?.success) {
          const list = data.data || []
          setCompanies(list)
          const stored = typeof window !== "undefined" ? localStorage.getItem("selectedCompanyId") || "" : ""
          if (stored && list.some((c: any) => c.id === stored)) {
            setCompanyId(stored)
          } else if (list.length && !companyId) {
            const first = list[0].id
            setCompanyId(first)
            if (typeof window !== "undefined") localStorage.setItem("selectedCompanyId", first)
          }
        }
      } catch {}
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role])

  const onChangeCompany = (id: string) => {
    setCompanyId(id)
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("selectedCompanyId", id)
        window.dispatchEvent(new CustomEvent("companyChanged", { detail: { id } }))
      }
    } catch {}
  }

  // Global command palette shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setCommandOpen((v) => !v)
      }
    }
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", onKey)
      return () => window.removeEventListener("keydown", onKey)
    }
  }, [])

  return (
    <div className="flex h-screen bg-gray-50 overflow-x-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar mobile />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
              </Sheet>

              {/* Page Title */}
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{title || "Dashboard"}</h1>
                <p className="text-sm text-gray-500">{user?.role ? roleLabels[user.role] : ""}</p>
              </div>

              {/* Company Switcher for Process Agents */}
              {user?.role === "process_agent" && (
                <div className="hidden md:flex items-center gap-2 ml-2">
                  <span className="text-sm text-gray-600">Company</span>
                  <Select value={companyId} onValueChange={onChangeCompany}>
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Right Controls: Command bar, More, User */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCommandOpen(true)} className="hidden md:inline-flex gap-2">
                <SearchIcon className="h-4 w-4" />
                Command
                <span className="ml-2 text-xs text-gray-500">⌘K</span>
              </Button>

              {/* More menu with low-use links */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>More</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/candidates" className="cursor-pointer">
                      <Users className="mr-2 h-4 w-4" /> Candidates
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/admin/assignments" className="cursor-pointer">
                      <UserCheck className="mr-2 h-4 w-4" /> Agent Assignments
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/admin/engagements" className="cursor-pointer">
                      <Users className="mr-2 h-4 w-4" /> Engagement Tools
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/companies" className="cursor-pointer">
                      <Building2 className="mr-2 h-4 w-4" /> Companies
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/expenses" className="cursor-pointer">
                      <Receipt className="mr-2 h-4 w-4" /> Expenses
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.full_name || ""}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email || ""}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="relative min-h-full">
            {/* Header Pattern */}
            <div className="absolute top-0 right-0 w-64 h-32 opacity-5 overflow-hidden pointer-events-none">
              <Image src="/images/header-pattern.png" alt="Header Pattern" fill className="object-cover" />
            </div>

            {/* Content */}
            <div className="relative z-10 p-6">{children}</div>
          </div>
        </main>
        {/* Global Command Palette */}
        <CommandDialog open={commandOpen} onOpenChange={setCommandOpen} title="Quick Actions" description="Type a command or page">
          <CommandInput placeholder="Search actions or pages..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Go to">
              {allowedCommands.map((c) => (
                <CommandItem key={c.href} onSelect={() => { setCommandOpen(false); location.assign(c.href) }}>{c.name}</CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Shortcuts">
              
              <CommandItem onSelect={() => { setCommandOpen(false); location.assign("/dashboard/workflows") }}>Start or open workflow</CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </div>
    </div>
  )
}
