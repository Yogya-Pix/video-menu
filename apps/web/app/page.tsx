import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-bold">VideoMenu</h1>
      <p className="max-w-sm text-gray-600">
        Diners open your menu by scanning the QR code on their table — there&apos;s nothing to visit here directly.
      </p>
      <Link
        href="/login"
        className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Restaurant staff login
      </Link>
    </main>
  );
}
