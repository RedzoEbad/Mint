import { ReactNode } from "react"
import { Button } from "./button"
import { Card, CardContent } from "./card"

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  className = "" 
}: EmptyStateProps) {
  return (
    <Card className={`border-dashed ${className}`}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        {icon && (
          <div className="mb-4 text-gray-400">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
          {description}
        </p>
        {action && (
          <Button onClick={action.onClick} className="bg-blue-600 hover:bg-blue-700">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// Predefined empty states for common scenarios
export function EmptyCandidates({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      }
      title="No candidates found"
      description="Get started by adding your first candidate to the system."
      action={{
        label: "Add Candidate",
        onClick: onCreate
      }}
    />
  )
}

export function EmptyWorkflows({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      }
      title="No workflows found"
      description="No workflow stages have been created yet. Create one to get started."
      action={{
        label: "Create Workflow",
        onClick: onCreate
      }}
    />
  )
}

export function EmptyInterviews({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      }
      title="No interviews scheduled"
      description="No interviews have been scheduled yet. Schedule an interview to get started."
      action={{
        label: "Schedule Interview",
        onClick: onCreate
      }}
    />
  )
}

export function EmptyPayments({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      }
      title="No payments found"
      description="No payment records have been created yet. Add a payment to get started."
      action={{
        label: "Add Payment",
        onClick: onCreate
      }}
    />
  )
}

export function EmptyUsers({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      }
      title="No users found"
      description="No users have been created yet. Create a user account to get started."
      action={{
        label: "Create User",
        onClick: onCreate
      }}
    />
  )
}

export function EmptySearch({ onClear }: { onClear: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      title="No results found"
      description="Try adjusting your search criteria or filters to find what you're looking for."
      action={{
        label: "Clear Filters",
        onClick: onClear
      }}
    />
  )
}
