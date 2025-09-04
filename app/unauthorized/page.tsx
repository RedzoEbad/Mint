import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <Card className="w-full max-w-md text-center shadow-xl">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="relative w-32 h-10">
              <Image src="/images/mint-logo.png" alt="MINT International" fill className="object-contain" />
            </div>
          </div>

          <div className="flex justify-center">
            <AlertTriangle className="h-16 w-16 text-red-500" />
          </div>

          <CardTitle className="text-2xl font-bold text-gray-900">Access Denied</CardTitle>
          <CardDescription className="text-gray-600">
            You don't have permission to access this resource.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">Please contact your administrator if you believe this is an error.</p>

          <div className="flex gap-2 justify-center">
            <Button asChild variant="outline">
              <Link href="/login">Back to Login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
