"use client"

import type React from "react"

import { useState } from "react"
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
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { routeRoleMap } from "@/lib/rbac"

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[]
}

const navigationItems: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
    roles: ["super_admin", "admin", "receptionist", "process_agent", "accountant"],
  },
  {
    name: "Candidates",
    href: "/dashboard/candidates",
    icon: Users,
    roles: ["super_admin", "receptionist", "process_agent", "admin"],
  },
  {
    name: "Add Candidate",
    href: "/dashboard/candidates/add",
    icon: UserPlus,
    roles: ["super_admin", "receptionist"],
  },
  {
    name: "Companies",
    href: "/dashboard/companies",
    icon: Building2,
    roles: ["super_admin", "process_agent", "admin"],
  },
  {
    name: "Workflows",
    href: "/dashboard/workflows",
    icon: Workflow,
    roles: ["super_admin", "process_agent", "admin"],
  },
  {
    name: "Search",
    href: "/dashboard/search",
    icon: Users,
    roles: ["super_admin", "process_agent", "admin"],
  },
  {
    name: "Interviews",
    href: "/dashboard/interviews",
    icon: Calendar,
    roles: ["super_admin", "process_agent"],
  },
  {
    name: "Payments",
    href: "/dashboard/payments",
    icon: CreditCard,
    roles: ["super_admin", "accountant", "process_agent", "admin"],
  },
  {
    name: "Expenses",
    href: "/dashboard/expenses",
    icon: Receipt,
    roles: ["super_admin", "accountant"],
  },
  {
    name: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
    roles: ["super_admin", "admin", "accountant", "process_agent"],
  },
  {
    name: "User Management",
    href: "/dashboard/users",
    icon: UserCheck,
    roles: ["super_admin", "admin"],
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    roles: ["super_admin"],
  },
]

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!user) {
    return null
  }

  const userInitials = user.full_name
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase()

  // Filter nav by RBAC route map; if the route exists in RBAC, use it as source of truth
  const filteredNavigation = navigationItems
    .filter((item) => {
      const allowed = routeRoleMap[item.href as keyof typeof routeRoleMap]
      const roles = allowed ?? item.roles
      // Hide items that aren't registered in RBAC at all (prevents dead links like /dashboard/companies)
      if (!allowed && !item.roles?.length) return false
      return roles.includes(user.role)
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
        {filteredNavigation.map((item) => {
          const isActive = item.href === activeHref

          return (
            <Link
              key={item.name}
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

  return (
    <div className="flex h-screen bg-gray-50">
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
                <p className="text-sm text-gray-500">{roleLabels[user.role]}</p>
              </div>
            </div>

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
                    <p className="text-sm font-medium leading-none">{user.full_name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
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
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="relative min-h-full">
            {/* Header Pattern */}
            <div className="absolute top-0 right-0 w-64 h-32 opacity-5 overflow-hidden">
              <Image src="/images/header-pattern.png" alt="Header Pattern" fill className="object-cover" />
            </div>

            {/* Content */}
            <div className="relative z-10 p-6">{children}</div>
          </div>
        </main>
      </div>
    </div>
  )
}
