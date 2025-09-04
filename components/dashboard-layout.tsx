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
    roles: ["super_admin", "receptionist", "process_agent", "accountant"],
  },
  {
    name: "Candidates",
    href: "/dashboard/candidates",
    icon: Users,
    roles: ["super_admin", "receptionist", "process_agent"],
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
    roles: ["super_admin", "process_agent"],
  },
  {
    name: "Workflows",
    href: "/dashboard/workflows",
    icon: Workflow,
    roles: ["super_admin", "process_agent"],
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
    roles: ["super_admin", "accountant", "process_agent"],
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
    roles: ["super_admin", "accountant", "process_agent"],
  },
  {
    name: "User Management",
    href: "/dashboard/users",
    icon: UserCheck,
    roles: ["super_admin"],
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

  const filteredNavigation = navigationItems.filter((item) => item.roles.includes(user.role))

  const roleLabels = {
    super_admin: "Super Administrator",
    receptionist: "Receptionist",
    process_agent: "Process Agent",
    accountant: "Accountant",
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex h-full flex-col bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center px-4 border-b border-gray-200">
        <div className="relative w-32 h-8">
          <Image src="/images/mint-logo.png" alt="MINT International" fill className="object-contain" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => mobile && setSidebarOpen(false)}
              className={cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                  : "text-gray-700 hover:bg-blue-50 hover:text-blue-600",
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  isActive ? "text-white" : "text-gray-400 group-hover:text-blue-600",
                )}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Sidebar Pattern */}
      <div className="relative h-32 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <Image src="/images/sidebar-pattern.png" alt="Pattern" fill className="object-cover" />
        </div>
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
