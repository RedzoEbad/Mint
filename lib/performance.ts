/**
 * Performance monitoring utilities for API routes and database queries
 */

interface PerformanceTimer {
  start: number
  label: string
  end?: number
  duration?: number
}

class PerformanceMonitor {
  private timers: Map<string, PerformanceTimer> = new Map()

  start(label: string): void {
    this.timers.set(label, {
      start: performance.now(),
      label,
    })
  }

  end(label: string): number {
    const timer = this.timers.get(label)
    if (!timer) {
      console.warn(`Timer "${label}" not found`)
      return 0
    }

    const end = performance.now()
    const duration = end - timer.start
    
    timer.end = end
    timer.duration = duration

    console.log(`⏱️  ${label}: ${duration.toFixed(2)}ms`)
    return duration
  }

  measure<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.start(label)
    return fn().finally(() => this.end(label))
  }

  measureSync<T>(label: string, fn: () => T): T {
    this.start(label)
    const result = fn()
    this.end(label)
    return result
  }

  getSummary(): Record<string, number> {
    const summary: Record<string, number> = {}
    this.timers.forEach((timer, label) => {
      if (timer.duration !== undefined) {
        summary[label] = timer.duration
      }
    })
    return summary
  }

  clear(): void {
    this.timers.clear()
  }
}

// Global performance monitor instance
export const perf = new PerformanceMonitor()

/**
 * API route wrapper with automatic timing
 */
export function withTiming<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  routeName: string
) {
  return async (...args: T): Promise<R> => {
    const start = performance.now()
    console.log(`🚀 Starting ${routeName}`)
    
    try {
      const result = await handler(...args)
      const duration = performance.now() - start
      console.log(`✅ ${routeName} completed in ${duration.toFixed(2)}ms`)
      return result
    } catch (error) {
      const duration = performance.now() - start
      console.error(`❌ ${routeName} failed after ${duration.toFixed(2)}ms:`, error)
      throw error
    }
  }
}

/**
 * Database query timing wrapper
 */
export async function timedQuery<T>(
  queryFn: () => Promise<T>,
  queryName: string
): Promise<T> {
  return perf.measure(`DB Query: ${queryName}`, queryFn)
}

/**
 * Log slow operations (warnings for >1s, errors for >5s)
 */
export function logSlowOperation(label: string, duration: number): void {
  if (duration > 5000) {
    console.error(`🐌 VERY SLOW: ${label} took ${duration.toFixed(2)}ms`)
  } else if (duration > 1000) {
    console.warn(`⚠️  SLOW: ${label} took ${duration.toFixed(2)}ms`)
  }
}
