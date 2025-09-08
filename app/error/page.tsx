export default function UniversalErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Something went wrong</h1>
        <p className="mt-2 text-gray-600">Please try again or return to the dashboard.</p>
        <a href="/dashboard" className="mt-6 inline-block px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
          Back to dashboard
        </a>
      </div>
    </div>
  )
}


