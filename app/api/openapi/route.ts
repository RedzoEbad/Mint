import { NextResponse } from "next/server"

export async function GET() {
  const spec = {
    openapi: "3.0.3",
    info: {
      title: "MINT International API",
      version: "1.0.0",
    },
    servers: [{ url: "http://localhost:3000" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      "/api/auth/login": {
        post: {
          summary: "Login and obtain JWT",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string" },
                  },
                  required: ["email", "password"],
                },
              },
            },
          },
          responses: {
            200: {
              description: "JWT token",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      token: { type: "string" },
                    },
                  },
                },
              },
            },
            401: { description: "Invalid credentials" },
          },
        },
      },
      "/api/candidates": {
        get: { summary: "List candidates", responses: { 200: { description: "OK" } } },
        post: { summary: "Create candidate", responses: { 200: { description: "OK" } } },
      },
      "/api/candidates/{id}": {
        get: {
          summary: "Get candidate",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: { 200: { description: "OK" }, 404: { description: "Not found" } },
        },
        put: {
          summary: "Update candidate",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: { 200: { description: "OK" } },
        },
      },
      "/api/payments": {
        get: { summary: "List payments", responses: { 200: { description: "OK" } } },
      },
      "/api/expenses": {
        get: { summary: "List expenses", responses: { 200: { description: "OK" } } },
      },
    },
  }
  return NextResponse.json(spec)
}
