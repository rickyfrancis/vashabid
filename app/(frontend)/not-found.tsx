import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-4 py-32">
      <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-50">
        404
      </h1>
      <p className="text-neutral-500">This page could not be found.</p>
      <Link
        href="/"
        className="text-brand-600 hover:text-brand-700 hover:underline transition-colors"
      >
        Go home
      </Link>
    </div>
  )
}
