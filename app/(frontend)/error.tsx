'use client'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-4 py-32">
      <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
        Something went wrong
      </h2>
      <p className="text-neutral-500">
        {error.message || 'An unexpected error occurred.'}
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
