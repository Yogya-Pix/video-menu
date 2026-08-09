"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-xl font-bold text-gray-900">Something went wrong</h1>
      <p className="text-sm text-gray-500">Please try again, or come back in a moment.</p>
      <button
        onClick={reset}
        className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Try again
      </button>
    </main>
  );
}
