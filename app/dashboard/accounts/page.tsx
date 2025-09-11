"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { getValidToken } from "@/lib/token-utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { TrendingUp, TrendingDown, CheckCircle, XCircle, Clock, Plus, Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { EmptyPayments, EmptySearch } from "@/components/ui/empty-state"

interface PaymentStats {
  pending: number
  today: number
  revenue: number
  expenses: number
}

interface Payment {
  id: string
  candidate_name: string
  passport_no: string
  payment_type: string
  amount: number
  currency: string
  payment_status: string
  payment_method: string
  transaction_id: string
  created_at: string
  verified_by_name: string
  notes: string
}

interface Expense {
  id: string
  category: string
  description: string
  amount: number
  currency: string
  expense_date: string
  status: string
  created_by_name: string
  approved_by_name: string
}

interface SalaryItem {
  id: string
  user_name: string
  basic_salary: number
  allowances: number
  deductions: number
  net_salary: number
  salary_month: string
  payment_status: string
  payment_date?: string
}

export default function AccountsDashboard() {
  const router = useRouter()
  const pathname = usePathname()
  const search = useSearchParams()
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [salaries, setSalaries] = useState<SalaryItem[]>([])
  const [newSalary, setNewSalary] = useState({ user_id: "", salary_month: "", basic_salary: "", allowances: "0", deductions: "0" })
  const [loading, setLoading] = useState(true)
  const [expensesLoading, setExpensesLoading] = useState<boolean>(false)
  const [salariesLoading, setSalariesLoading] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [paymentsPage, setPaymentsPage] = useState(1)
  const [paymentsPages, setPaymentsPages] = useState(1)
  const [paymentsPageSize, setPaymentsPageSize] = useState(10)
  const [expensesPage, setExpensesPage] = useState(1)
  const [expensesPages, setExpensesPages] = useState(1)
  const [expensesPageSize, setExpensesPageSize] = useState(10)
  const [salariesPage, setSalariesPage] = useState(1)
  const [salariesPages, setSalariesPages] = useState(1)
  const [salariesPageSize, setSalariesPageSize] = useState(10)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [paymentNotes, setPaymentNotes] = useState("")
  const [newExpense, setNewExpense] = useState({
    category: "",
    description: "",
    amount: "",
    expense_date: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    // Initialize from URL if present
    const tab = search.get("tab") || undefined
    const pPage = Number(search.get("pp") || "1")
    const pSize = Number(search.get("ps") || "10")
    const ePage = Number(search.get("ep") || "1")
    const eSize = Number(search.get("es") || "10")
    const sPage = Number(search.get("sp") || "1")
    const sSize = Number(search.get("ss") || "10")
    if (tab) setActiveTab(tab)
    setPaymentsPage(isNaN(pPage) ? 1 : pPage)
    setPaymentsPageSize(isNaN(pSize) ? 10 : pSize)
    setExpensesPage(isNaN(ePage) ? 1 : ePage)
    setExpensesPageSize(isNaN(eSize) ? 10 : eSize)
    setSalariesPage(isNaN(sPage) ? 1 : sPage)
    setSalariesPageSize(isNaN(sSize) ? 10 : sSize)

    fetchStats()
    fetchPayments()
    fetchExpenses()
    fetchSalaries()
  }, [])

  // Sync URL with state
  useEffect(() => {
    const params = new URLSearchParams(search.toString())
    params.set("tab", activeTab)
    params.set("pp", String(paymentsPage))
    params.set("ps", String(paymentsPageSize))
    params.set("ep", String(expensesPage))
    params.set("es", String(expensesPageSize))
    params.set("sp", String(salariesPage))
    params.set("ss", String(salariesPageSize))
    const url = `${pathname}?${params.toString()}`
    router.replace(url)
  }, [activeTab, paymentsPage, paymentsPageSize, expensesPage, expensesPageSize, salariesPage, salariesPageSize])

  useEffect(() => { fetchPayments() }, [paymentsPage, paymentsPageSize])
  useEffect(() => { fetchExpenses() }, [expensesPage, expensesPageSize])
  useEffect(() => { fetchSalaries() }, [salariesPage, salariesPageSize])

  const fetchStats = async () => {
    try {
      const token = getValidToken()
      const response = await fetch("/api/payments/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const token = getValidToken()
      const response = await fetch(`/api/payments?page=${paymentsPage}&limit=${paymentsPageSize}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setPayments(data.data)
        if (data.pagination?.pages) setPaymentsPages(data.pagination.pages)
      }
    } catch (error) {
      console.error("Error fetching payments:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchExpenses = async () => {
    try {
      setExpensesLoading(true)
      const token = getValidToken()
      const response = await fetch(`/api/expenses?page=${expensesPage}&limit=${expensesPageSize}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setExpenses(data.data)
        if (data.pagination?.pages) setExpensesPages(data.pagination.pages)
      }
    } catch (error) {
      console.error("Error fetching expenses:", error)
    } finally {
      setExpensesLoading(false)
    }
  }

  const fetchSalaries = async () => {
    try {
      setSalariesLoading(true)
      const token = getValidToken()
      const response = await fetch(`/api/salaries?page=${salariesPage}&limit=${salariesPageSize}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        setSalaries(data.data)
        if (data.pagination?.pages) setSalariesPages(data.pagination.pages)
      }
    } catch (e) {
      console.error("Error fetching salaries:", e)
    } finally {
      setSalariesLoading(false)
    }
  }

  const markSalaryStatus = async (salaryId: string, payment_status: string) => {
    try {
      const token = getValidToken()
      const res = await fetch(`/api/salaries/${salaryId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ payment_status }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Success", description: "Salary status updated" })
        fetchSalaries()
      } else {
        toast({ title: "Error", description: data.message || "Failed to update salary", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to update salary", variant: "destructive" })
    }
  }

  const createSalary = async () => {
    try {
      const token = getValidToken()
      const res = await fetch(`/api/salaries`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: newSalary.user_id,
          salary_month: newSalary.salary_month,
          basic_salary: Number(newSalary.basic_salary || 0),
          allowances: Number(newSalary.allowances || 0),
          deductions: Number(newSalary.deductions || 0),
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Success", description: "Salary created" })
        setNewSalary({ user_id: "", salary_month: "", basic_salary: "", allowances: "0", deductions: "0" })
        fetchSalaries()
      } else {
        toast({ title: "Error", description: data.message || "Failed to create salary", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to create salary", variant: "destructive" })
    }
  }

  const updatePaymentStatus = async (paymentId: string, status: string) => {
    try {
      const token = getValidToken()
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payment_status: status,
          notes: paymentNotes,
        }),
      })
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Payment status updated successfully",
        })
        fetchPayments()
        fetchStats()
        setSelectedPayment(null)
        setPaymentNotes("")
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update payment status",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while updating the payment",
        variant: "destructive",
      })
    }
  }

  const createExpense = async () => {
    try {
      const token = getValidToken()
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newExpense,
          amount: Number.parseFloat(newExpense.amount),
          currency: "SAR",
        }),
      })
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Expense created successfully",
        })
        fetchExpenses()
        fetchStats()
        setNewExpense({
          category: "",
          description: "",
          amount: "",
          expense_date: "",
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create expense",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while creating the expense",
        variant: "destructive",
      })
    }
  }

  const updateExpenseStatus = async (expenseId: string, status: string) => {
    try {
      const token = getValidToken()
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Expense status updated successfully",
        })
        fetchExpenses()
        fetchStats()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update expense status",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while updating the expense",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      approved: "bg-green-100 text-green-800",
      refunded: "bg-blue-100 text-blue-800",
    }
    return (
      <Badge className={variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"}>
        {status.toUpperCase()}
      </Badge>
    )
  }

  const formatCurrency = (amount: number, currency = "SAR") => {
    return new Intl.NumberFormat("en-SA", {
      style: "currency",
      currency: currency,
    }).format(amount)
  }

  return (
    <DashboardLayout title="Accounts Dashboard">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats?.pending || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.today || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats?.revenue || 0)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats?.expenses || 0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="salaries">Salaries</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Payments */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Payments</CardTitle>
                  <CardDescription>Latest payment requests</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-10 text-gray-600">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading recent payments...
                    </div>
                  ) : (
                  <div className="space-y-4">
                    {payments.slice(0, 5).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{payment.candidate_name}</p>
                          <p className="text-sm text-gray-500">
                            {payment.payment_type} - {formatCurrency(payment.amount, payment.currency)}
                          </p>
                        </div>
                        {getStatusBadge(payment.payment_status)}
                      </div>
                    ))}
                  </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Expenses */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Expenses</CardTitle>
                  <CardDescription>Latest expense records</CardDescription>
                </CardHeader>
                <CardContent>
                  {!expenses.length && loading ? (
                    <div className="flex items-center justify-center py-10 text-gray-600">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading recent expenses...
                    </div>
                  ) : (
                  <div className="space-y-4">
                    {expenses.slice(0, 5).map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{expense.category}</p>
                          <p className="text-sm text-gray-500">
                            {expense.description} - {formatCurrency(expense.amount, expense.currency)}
                          </p>
                        </div>
                        {getStatusBadge(expense.status)}
                      </div>
                    ))}
                  </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Management</CardTitle>
                <CardDescription>Review and approve payment requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-end pb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Rows:</span>
                    <Select value={String(paymentsPageSize)} onValueChange={(v) => { setPaymentsPageSize(Number(v)); setPaymentsPage(1) }}>
                      <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {loading ? (
                  <div className="flex items-center justify-center py-16 text-gray-600">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>Loading payments...</span>
                    </div>
                  </div>
                ) : payments.length === 0 ? (
                  <EmptyPayments onCreate={() => window.location.href = '/dashboard/candidates/add'} />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Candidate</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading && Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={`sk-${i}`}>
                          <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                        </TableRow>
                      ))}
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{payment.candidate_name}</div>
                              <div className="text-sm text-gray-500">{payment.passport_no}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{payment.payment_type.toUpperCase()}</Badge>
                          </TableCell>
                          <TableCell className="font-mono">
                            {formatCurrency(payment.amount, payment.currency)}
                          </TableCell>
                          <TableCell>{getStatusBadge(payment.payment_status)}</TableCell>
                          <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {payment.payment_status === "pending" && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" onClick={() => setSelectedPayment(payment)}>
                                    Review
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Review Payment</DialogTitle>
                                    <DialogDescription>Approve or reject this payment request</DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label>Candidate</Label>
                                        <p className="text-sm">{payment.candidate_name}</p>
                                      </div>
                                      <div>
                                        <Label>Amount</Label>
                                        <p className="text-sm font-mono">
                                          {formatCurrency(payment.amount, payment.currency)}
                                        </p>
                                      </div>
                                      <div>
                                        <Label>Type</Label>
                                        <p className="text-sm">{payment.payment_type}</p>
                                      </div>
                                      <div>
                                        <Label>Transaction ID</Label>
                                        <p className="text-sm font-mono">{payment.transaction_id}</p>
                                      </div>
                                    </div>
                                    <div>
                                      <Label htmlFor="notes">Notes</Label>
                                      <Textarea
                                        id="notes"
                                        value={paymentNotes}
                                        onChange={(e) => setPaymentNotes(e.target.value)}
                                        placeholder="Add verification notes..."
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        onClick={() => updatePaymentStatus(payment.id, "paid")}
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Approve
                                      </Button>
                                      <Button
                                        onClick={() => updatePaymentStatus(payment.id, "rejected")}
                                        variant="destructive"
                                      >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Reject
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
            <div className="flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setPaymentsPage((p) => Math.max(1, p - 1)) }} />
                  </PaginationItem>
                  {Array.from({ length: paymentsPages }).slice(0, 5).map((_, i) => {
                    const p = i + 1
                    return (
                      <PaginationItem key={`pay-${p}`}>
                        <PaginationLink href="#" isActive={p === paymentsPage} onClick={(e) => { e.preventDefault(); setPaymentsPage(p) }}>{p}</PaginationLink>
                      </PaginationItem>
                    )
                  })}
                  <PaginationItem>
                    <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setPaymentsPage((p) => Math.min(paymentsPages, p + 1)) }} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Expense Management</h3>
                <p className="text-sm text-gray-500">Track and manage organizational expenses</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Expense</DialogTitle>
                    <DialogDescription>Create a new expense record</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={newExpense.category}
                        onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="office">Office Supplies</SelectItem>
                          <SelectItem value="travel">Travel</SelectItem>
                          <SelectItem value="utilities">Utilities</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="legal">Legal</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={newExpense.description}
                        onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                        placeholder="Expense description"
                      />
                    </div>
                    <div>
                      <Label htmlFor="amount">Amount (SAR)</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={newExpense.amount}
                        onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="expense_date">Expense Date</Label>
                      <Input
                        id="expense_date"
                        type="date"
                        value={newExpense.expense_date}
                        onChange={(e) => setNewExpense({ ...newExpense, expense_date: e.target.value })}
                      />
                    </div>
                    <Button onClick={createExpense} className="w-full">
                      Create Expense
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-end pb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Rows:</span>
                    <Select value={String(expensesPageSize)} onValueChange={(v) => { setExpensesPageSize(Number(v)); setExpensesPage(1) }}>
                      <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expensesLoading && Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={`sk-exp-${i}`}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                      </TableRow>
                    ))}
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>
                          <Badge variant="outline">{expense.category.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell className="font-mono">{formatCurrency(expense.amount, expense.currency)}</TableCell>
                        <TableCell>{new Date(expense.expense_date).toLocaleDateString()}</TableCell>
                        <TableCell>{getStatusBadge(expense.status)}</TableCell>
                        <TableCell>
                          {expense.status === "pending" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => updateExpenseStatus(expense.id, "approved")}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateExpenseStatus(expense.id, "rejected")}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <div className="flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setExpensesPage((p) => Math.max(1, p - 1)) }} />
                  </PaginationItem>
                  {Array.from({ length: expensesPages }).slice(0, 5).map((_, i) => {
                    const p = i + 1
                    return (
                      <PaginationItem key={`exp-${p}`}>
                        <PaginationLink href="#" isActive={p === expensesPage} onClick={(e) => { e.preventDefault(); setExpensesPage(p) }}>{p}</PaginationLink>
                      </PaginationItem>
                    )
                  })}
                  <PaginationItem>
                    <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setExpensesPage((p) => Math.min(expensesPages, p + 1)) }} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </TabsContent>

          <TabsContent value="salaries" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Salaries</CardTitle>
                  <CardDescription>Manage employee salaries and payment status</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">Create Salary</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Salary</DialogTitle>
                      <DialogDescription>Add a new salary record</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="salary_user">User ID</Label>
                        <Input id="salary_user" value={newSalary.user_id} onChange={(e) => setNewSalary({ ...newSalary, user_id: e.target.value })} placeholder="UUID of employee" />
                      </div>
                      <div>
                        <Label htmlFor="salary_month">Salary Month</Label>
                        <Input id="salary_month" type="month" value={newSalary.salary_month} onChange={(e) => setNewSalary({ ...newSalary, salary_month: e.target.value + '-01' })} />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label htmlFor="basic_salary">Basic</Label>
                          <Input id="basic_salary" type="number" value={newSalary.basic_salary} onChange={(e) => setNewSalary({ ...newSalary, basic_salary: e.target.value })} />
                        </div>
                        <div>
                          <Label htmlFor="allowances">Allowances</Label>
                          <Input id="allowances" type="number" value={newSalary.allowances} onChange={(e) => setNewSalary({ ...newSalary, allowances: e.target.value })} />
                        </div>
                        <div>
                          <Label htmlFor="deductions">Deductions</Label>
                          <Input id="deductions" type="number" value={newSalary.deductions} onChange={(e) => setNewSalary({ ...newSalary, deductions: e.target.value })} />
                        </div>
                      </div>
                      <Button onClick={createSalary} className="w-full">Save</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-end pb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Rows:</span>
                    <Select value={String(salariesPageSize)} onValueChange={(v) => { setSalariesPageSize(Number(v)); setSalariesPage(1) }}>
                      <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Month</TableHead>
                      <TableHead>Basic</TableHead>
                      <TableHead>Allowances</TableHead>
                      <TableHead>Deductions</TableHead>
                      <TableHead>Net</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salariesLoading && Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={`sk-sal-${i}`}>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                      </TableRow>
                    ))}
                    {salaries.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>{s.user_name}</TableCell>
                        <TableCell>{new Date(s.salary_month).toLocaleDateString()}</TableCell>
                        <TableCell className="font-mono">{formatCurrency(s.basic_salary)}</TableCell>
                        <TableCell className="font-mono">{formatCurrency(s.allowances)}</TableCell>
                        <TableCell className="font-mono">{formatCurrency(s.deductions)}</TableCell>
                        <TableCell className="font-mono">{formatCurrency(s.net_salary)}</TableCell>
                        <TableCell>{getStatusBadge(s.payment_status)}</TableCell>
                        <TableCell>
                          {s.payment_status !== "paid" && (
                            <div className="flex gap-2">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => markSalaryStatus(s.id, 'paid')}>Mark Paid</Button>
                              <Button size="sm" variant="outline" onClick={() => markSalaryStatus(s.id, 'pending')}>Mark Pending</Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <div className="flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setSalariesPage((p) => Math.max(1, p - 1)) }} />
                  </PaginationItem>
                  {Array.from({ length: salariesPages }).slice(0, 5).map((_, i) => {
                    const p = i + 1
                    return (
                      <PaginationItem key={`sal-${p}`}>
                        <PaginationLink href="#" isActive={p === salariesPage} onClick={(e) => { e.preventDefault(); setSalariesPage(p) }}>{p}</PaginationLink>
                      </PaginationItem>
                    )
                  })}
                  <PaginationItem>
                    <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setSalariesPage((p) => Math.min(salariesPages, p + 1)) }} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
