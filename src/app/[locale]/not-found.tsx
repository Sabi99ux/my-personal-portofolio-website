import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#10132a] text-[#e9e6f2]">
      <h1 className="text-4xl font-semibold">404</h1>
      <p className="mt-2 text-sm text-[#9a9bb8]">Page not found</p>
      <Link href="/en" className="mt-6 rounded-full bg-[#ffb067] px-6 py-2.5 text-sm font-medium text-[#1a1208]">
        Return home
      </Link>
    </div>
  );
}
