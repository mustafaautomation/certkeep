import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-[70vh] w-full max-w-lg place-items-center px-4 text-center">
      <div>
        <p className="text-sm uppercase tracking-[0.16em] text-primary">Missing record</p>
        <h1 className="mt-2 font-display text-4xl">That page is not in the vault.</h1>
        <Link href="/" className="mt-6 inline-block underline">Return home</Link>
      </div>
    </main>
  );
}
