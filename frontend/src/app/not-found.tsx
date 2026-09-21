import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-accent-900 text-accent-050 p-12 flex flex-col justify-center items-center">
      <h1 className="font-display text-9xl">404</h1>
      <p className="font-body text-xl mt-4">This workbench trick didn&#39;t find its mark.</p>
      <Link href="/" className="mt-8 underline hover:text-accent-500">Back to workbench</Link>
    </div>
  );
}
