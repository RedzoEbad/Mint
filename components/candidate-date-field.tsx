"use client"

import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CANDIDATE_SELECT } from "@/components/candidate-form-section"
import { cn } from "@/lib/utils"

type CandidateDateFieldProps = {
  label: string
  date?: Date
  onSelect: (d?: Date) => void
  fromYear?: number
  toYear?: number
  disableFuture?: boolean
  disabledDates?: (date: Date) => boolean
  buttonClassName?: string
  popoverClassName?: string
}

function clampMonth(month: Date, startMonth: Date, endMonth: Date) {
  if (month < startMonth) return startMonth
  if (month > endMonth) return endMonth
  return month
}

export function CandidateDateField({
  label,
  date,
  onSelect,
  fromYear = 1950,
  toYear = new Date().getFullYear(),
  disableFuture,
  disabledDates,
  buttonClassName,
  popoverClassName,
}: CandidateDateFieldProps) {
  const today = new Date()
  const startMonth = useMemo(() => new Date(fromYear, 0, 1), [fromYear])
  const endMonth = useMemo(() => new Date(toYear, 11, 31), [toYear])
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(() => clampMonth(date ?? today, startMonth, endMonth))

  useEffect(() => {
    if (date) {
      setMonth(clampMonth(date, startMonth, endMonth))
    }
  }, [date, startMonth, endMonth])

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (nextOpen) {
          setMonth(clampMonth(date ?? today, startMonth, endMonth))
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "justify-start w-full font-medium",
            buttonClassName ?? `${CANDIDATE_SELECT} candidate-input-field`,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          {date ? format(date, "PPP") : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "p-0 border-0 shadow-2xl rounded-2xl overflow-hidden candidate-glass-card",
          popoverClassName,
        )}
        align="start"
      >
        <div className="p-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md">
          <Calendar
            mode="single"
            selected={date}
            month={month}
            onMonthChange={(nextMonth) => setMonth(clampMonth(nextMonth, startMonth, endMonth))}
            onSelect={(selected) => {
              onSelect(selected)
              if (selected) setMonth(selected)
              setOpen(false)
            }}
            captionLayout="dropdown"
            startMonth={startMonth}
            endMonth={endMonth}
            hideNavigation
            disabled={(d) => {
              if (disableFuture && d > today) return true
              if (disabledDates?.(d)) return true
              return false
            }}
            className="rounded-xl"
          />
          <div className="flex justify-between items-center p-2 pt-4 border-t border-slate-100 dark:border-slate-600/50 mt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onSelect(undefined)
                setOpen(false)
              }}
              className="text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            >
              Clear
            </Button>
            {date ? (
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-1 rounded-md">
                {format(date, "PPP")}
              </span>
            ) : null}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
