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
import { useCompany } from "@/components/company-provider"
import { ThemeToggle } from "@/components/theme-toggle"

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[]
}

// Primary navigation tuned per role (RBAC further filters this)
const navigationItems: NavigationItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: Home, roles: ["super_admin", "process_agent", "accountant"] },
  { name: "Dashboard", href: "/dashboard/receptionist", icon: Home, roles: ["receptionist"] },
  { name: "Candidates", href: "/dashboard/candidates", icon: Users, roles: ["receptionist"] },
  { name: "Add Candidate", href: "/dashboard/candidates/add", icon: UserPlus, roles: ["receptionist"] },
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
  const { companies, selectedCompanyId, setSelectedCompanyId } = useCompany()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
      // For receptionists, hide generic /dashboard in favor of /dashboard/receptionist
      if (user.role === "receptionist" && item.href === "/dashboard") return false
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
    { name: "Reception Dashboard", href: "/dashboard/receptionist" },
    { name: "Candidates", href: "/dashboard/candidates" },
    { name: "Add Candidate", href: "/dashboard/candidates/add" },
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
    <div className="relative flex h-full flex-col bg-white dark:bg-sidebar border-r border-gray-200 dark:border-sidebar-border overflow-hidden">
      {/* Background Pattern - Using CSS for better performance */}
      <div className="absolute inset-0 sidebar-pattern opacity-[0.12] dark:opacity-[0.08] pointer-events-none pattern-transition"></div>

      {/* Logo */}
      <div className="relative z-10 flex h-16 items-center justify-center px-4 border-b border-gray-200 dark:border-sidebar-border bg-white/85 dark:bg-sidebar/85 sidebar-backdrop">
        <div className="relative w-32 h-8">
          <Image src="/images/mint-logo.png" alt="MINT International" fill className="object-contain" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex-1 space-y-2 px-3 py-6">
        {rolePrunedNavigation.map((item) => {
          const isActive = item.href === activeHref

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => mobile && setSidebarOpen(false)}
              className={cn(
                "group flex items-center px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 relative overflow-hidden",
                isActive
                  ? "nav-active-gradient text-white"
                  : "text-slate-600 dark:text-slate-400 hover:bg-blue-50/50 dark:hover:bg-gray-800/50 hover:text-blue-600 dark:hover:text-blue-400",
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0 transition-all duration-300",
                  isActive
                    ? "text-white scale-110"
                    : "text-slate-400 group-hover:text-blue-600 group-hover:scale-110",
                )}
              />
              {item.name}
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white ring-4 ring-white/20 rounded-r-full" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Enhanced Pattern Footer - Using CSS for better performance */}
      <div className="relative z-10 h-24 overflow-hidden bg-gradient-to-t from-white/90 dark:from-sidebar to-transparent">
        <div className="absolute inset-0 sidebar-pattern-footer opacity-[0.06] dark:opacity-[0.04] pattern-transition"></div>
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-sidebar to-transparent"></div>
      </div>
    </div>
  )

  const onChangeCompany = (id: string) => {
    setSelectedCompanyId(id)
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
    <div className="flex h-screen bg-gray-50 dark:bg-background overflow-x-hidden">
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
        <header className="glass-panel border-b border-slate-200/60 dark:border-slate-600/40 h-16 flex items-center px-6 z-20">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-6">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden hover:bg-slate-100 rounded-xl"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5 text-slate-600" />
              </Button>

              {/* Page Title & Breadcrumb-ish */}
              <div className="flex flex-col">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{title || "Dashboard"}</h1>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {user?.role ? roleLabels[user.role] : "Portal"}
                  </p>
                </div>
              </div>

              {/* Company Switcher for Process Agents */}
              {user?.role === "process_agent" && (
                <div className="hidden xl:flex items-center gap-3 ml-4">
                  <div className="h-8 w-px bg-slate-200" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Client</span>
                  <Select value={selectedCompanyId} onValueChange={onChangeCompany}>
                    <SelectTrigger className="w-64 h-9 bg-slate-50 border-slate-200/80 hover:bg-white hover:border-blue-300 transition-all rounded-lg text-sm font-medium">
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 shadow-2xl">
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="font-medium focus:bg-blue-50 focus:text-blue-700">
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-3">
              {user?.role === "receptionist" && <ThemeToggle />}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCommandOpen(true)}
                className="hidden md:flex items-center gap-3 h-9 bg-slate-50 border-slate-200/80 hover:bg-white hover:border-blue-400 hover:shadow-md transition-all rounded-lg group"
              >
                {/* <div className="flex items-center gap-2 text-slate-400 group-hover:text-blue-600 transition-colors">
                  <SearchIcon className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Quick Search</span>
                </div>
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-1.5 py-0.5 shadow-sm group-hover:border-blue-200 transition-colors">
                  <CommandIcon className="h-2.5 w-2.5 text-slate-400 group-hover:text-blue-500" />
                  <span className="text-[10px] font-bold text-slate-500 group-hover:text-blue-600">K</span>
                </div> */}
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
                  <Button variant="ghost" className="relative group p-0.5 rounded-full hover:bg-blue-50 transition-all duration-300 ring-2 ring-transparent hover:ring-blue-100 ring-offset-2">
                    <Avatar className="h-9 w-9 border border-slate-200 shadow-sm transition-transform duration-300 group-hover:scale-105">
                      <AvatarFallback className="nav-active-gradient text-white text-xs font-bold">
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
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50/40 dark:bg-background">
          <div className="relative min-h-full">
            {/* Design Elements */}
            <div className="absolute top-0 right-0 w-full h-96 bg-gradient-to-br from-blue-100/20 via-transparent to-transparent dark:from-blue-900/15 pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 px-8 py-8 animate-fade-in">
              {children}
            </div>
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
