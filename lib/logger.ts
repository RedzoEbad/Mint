type LogLevel = "debug" | "info" | "warn" | "error"

interface LogContext {
  requestId?: string
  path?: string
  method?: string
  userId?: string
  userRole?: string
  ip?: string
  [key: string]: unknown
}

function formatContext(context?: LogContext) {
  if (!context) return ""
  try {
    return ` ${JSON.stringify(context)}`
  } catch {
    return ""
  }
}

function baseLog(level: LogLevel, message: string, context?: LogContext) {
  const ts = new Date().toISOString()
  const line = `[${ts}] [${level.toUpperCase()}] ${message}${formatContext(context)}`
  // eslint-disable-next-line no-console
  if (level === "error") console.error(line)
  else if (level === "warn") console.warn(line)
  else if (level === "info") console.info(line)
  else console.debug(line)
}

export const logger = {
  debug: (message: string, context?: LogContext) => baseLog("debug", message, context),
  info: (message: string, context?: LogContext) => baseLog("info", message, context),
  warn: (message: string, context?: LogContext) => baseLog("warn", message, context),
  error: (message: string, context?: LogContext) => baseLog("error", message, context),
}

export function getRequestContext(request: Request, extras?: LogContext): LogContext {
  const headers = (request as any).headers
  const url = new URL((request as any).url)
  const requestId = headers?.get?.("x-request-id") || crypto.randomUUID()
  const ip = headers?.get?.("x-forwarded-for") || headers?.get?.("x-real-ip") || undefined
  return {
    requestId,
    path: url.pathname,
    method: (request as any).method,
    ip,
    ...extras,
  }
}


