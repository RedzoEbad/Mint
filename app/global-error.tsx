"use client"

import Link from "next/link"

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full text-center">
            <h1 className="text-2xl font-semibold text-gray-900">Something went wrong</h1>
            <p className="mt-2 text-gray-600">An unexpected error occurred. Please try again.</p>
            {error?.message ? (
              <p className="mt-2 text-xs text-gray-400 break-all">{error.message}</p>
            ) : null}
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => reset()}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                Try again
              </button>
              <Link href="/" className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100">
                Go home
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}


