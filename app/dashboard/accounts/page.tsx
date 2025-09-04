"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { TrendingUp, TrendingDown, CheckCircle, XCircle, Clock, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

export default function AccountsDashboard() {
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
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
    fetchStats()
    fetchPayments()
    fetchExpenses()
  }, [])

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("auth-token")
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
      const token = localStorage.getItem("auth-token")
      const response = await fetch("/api/payments", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setPayments(data.data)
      }
    } catch (error) {
      console.error("Error fetching payments:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem("auth-token")
      const response = await fetch("/api/expenses", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setExpenses(data.data)
      }
    } catch (error) {
      console.error("Error fetching expenses:", error)
    }
  }

  const updatePaymentStatus = async (paymentId: string, status: string) => {
    try {
      const token = localStorage.getItem("auth-token")
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
      const token = localStorage.getItem("auth-token")
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
      const token = localStorage.getItem("auth-token")
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
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
                </CardContent>
              </Card>

              {/* Recent Expenses */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Expenses</CardTitle>
                  <CardDescription>Latest expense records</CardDescription>
                </CardHeader>
                <CardContent>
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
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
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
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
