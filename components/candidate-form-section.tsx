"use client"

import type { LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Variant = "primary" | "default"

export function CandidateFormSection({
  icon: Icon,
  title,
  description,
  step,
  variant = "default",
  children,
  className,
  contentClassName,
  id,
}: {
  icon: LucideIcon
  title: string
  description?: string
  step?: number
  variant?: Variant
  children: React.ReactNode
  className?: string
  contentClassName?: string
  id?: string
}) {
  const isPrimary = variant === "primary"

  return (
    <Card
      id={id}
      className={cn(
        "candidate-glass-card border-0 overflow-hidden candidate-slide-in shadow-lg transition-shadow duration-300 hover:shadow-xl dark:hover:shadow-lg dark:hover:shadow-black/10 gap-0 py-0",
        isPrimary && "ring-1 ring-blue-200/60 dark:ring-blue-700/40",
        className,
      )}
      style={step ? { animationDelay: `${step * 0.07}s` } : undefined}
    >
      <CardHeader
        className={cn(
          "relative overflow-hidden px-6 pt-5 pb-5",
          isPrimary
            ? "bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 text-white border-b-0"
            : "bg-gradient-to-r from-slate-50 via-white to-blue-50/40 border-b border-slate-100/80 dark:from-slate-800 dark:via-slate-800 dark:to-blue-950/40 dark:border-slate-600/50",
        )}
      >
        <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-4 bottom-0 h-16 w-16 rounded-full bg-blue-400/5 blur-xl pointer-events-none dark:bg-blue-400/10" />

        <div className="relative flex items-start gap-3.5">
          <div className="relative shrink-0">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl shadow-md",
                isPrimary
                  ? "bg-white/15 ring-1 ring-white/25 backdrop-blur-sm"
                  : "bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-500/25 ring-1 ring-blue-500/20",
              )}
            >
              <Icon className="h-5 w-5 text-white" />
            </div>
            {step != null && (
              <div
                className={cn(
                  "absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none shadow-sm ring-2",
                  isPrimary
                    ? "bg-white text-blue-700 ring-blue-600"
                    : "bg-white text-blue-700 ring-blue-600 dark:bg-blue-500 dark:text-white dark:ring-slate-800",
                )}
              >
                {step}
              </div>
            )}
          </div>
          <div className="min-w-0 pt-0.5">
            <CardTitle
              className={cn(
                "text-base sm:text-lg font-bold tracking-tight",
                isPrimary ? "text-white" : "text-slate-900 dark:text-slate-100",
              )}
            >
              {title}
            </CardTitle>
            {description ? (
              <p className={cn("text-sm mt-0.5 leading-snug", isPrimary ? "text-blue-100/90" : "text-slate-500 dark:text-slate-400")}>
                {description}
              </p>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn("px-6 pt-6 pb-6", contentClassName)}>{children}</CardContent>
    </Card>
  )
}

export const CANDIDATE_INPUT =
  "candidate-input-field h-11 rounded-xl border-slate-200/90 bg-white/80 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm dark:border-slate-600/70 dark:bg-slate-700/60 dark:text-slate-100 dark:placeholder:text-slate-400"

export const CANDIDATE_SELECT =
  "h-11 rounded-xl border-slate-200/90 bg-white/80 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm dark:border-slate-600/70 dark:bg-slate-700/60 dark:text-slate-100"
