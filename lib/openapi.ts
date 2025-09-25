import fs from "fs/promises"
import path from "path"

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD"

function toOpenApiPath(appRoutePath: string): string {
  // Convert Next.js dynamic segments [id] -> {id} and catch-alls [...slug] -> {slug}
  return (
    "/api" +
    appRoutePath
      .replace(/^[\\\/]/, "")
      .split(path.sep)
      .map((segment) => {
        if (segment.startsWith("[...") && segment.endsWith("]")) {
          return `{${segment.slice(4, -1)}}`
        }
        if (segment.startsWith("[") && segment.endsWith("]")) {
          return `{${segment.slice(1, -1)}}`
        }
        return segment
      })
      .join("/")
      // Ensure leading slash
      .replace(/^(?!\/)/, "/")
  )
}

async function fileExportsHttpMethods(filePath: string): Promise<Set<HttpMethod>> {
  const code = await fs.readFile(filePath, "utf8")
  const methods = new Set<HttpMethod>()
  const candidates: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]
  for (const m of candidates) {
    const exportRegex = new RegExp(`export\\s+(async\\s+)?function\\s+${m}\\b`)
    if (exportRegex.test(code)) methods.add(m)
  }
  return methods
}

async function walkApiRoutes(dir: string, baseDir: string, acc: Array<{ routePath: string; filePath: string }>) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await walkApiRoutes(full, baseDir, acc)
    } else if (entry.isFile() && entry.name === "route.ts") {
      const routePath = path
        .dirname(path.relative(baseDir, full))
        .replace(/\\\\/g, "/")
        .replace(/^\.$/, "")
      acc.push({ routePath: routePath ? `/${routePath}` : "/" , filePath: full })
    }
  }
}

export async function generateOpenApiSpec() {
  const projectRoot = process.cwd()
  const apiDir = path.join(projectRoot, "app", "api")

  const found: Array<{ routePath: string; filePath: string }> = []
  try {
    await walkApiRoutes(apiDir, apiDir, found)
  } catch (e) {
    // If scanning fails (e.g., in some serverless envs), fall back to empty
  }

  const paths: Record<string, any> = {}

  for (const { routePath, filePath } of found) {
    const httpMethods = await fileExportsHttpMethods(filePath)
    if (httpMethods.size === 0) continue
    const openApiPath = toOpenApiPath(routePath)

    paths[openApiPath] = paths[openApiPath] || {}
    for (const method of httpMethods) {
      const lower = method.toLowerCase()
      paths[openApiPath][lower] = {
        summary: `${method} ${openApiPath}`,
        responses: { 200: { description: "OK" } },
      }
    }
  }

  const spec = {
    openapi: "3.0.3",
    info: { title: "MINT International API", version: "1.0.0" },
    servers: [{ url: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
    security: [{ bearerAuth: [] }],
    paths,
  }

  return spec
}


