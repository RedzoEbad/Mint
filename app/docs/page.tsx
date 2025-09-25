"use client"

import "swagger-ui-react/swagger-ui.css"
import SwaggerUI from "swagger-ui-react"

export default function ApiDocsPage() {
  return (
    <SwaggerUI
      url="/api/openapi"
      docExpansion="list"
      defaultModelsExpandDepth={0}
    />
  )
}


