import Link from "next/link";

export default function NotFound() {
  return (
    <div className="panel p-8 max-w-md mx-auto text-center">
      <h1 className="text-2xl font-semibold text-fg">404</h1>
      <p className="text-fg-secondary mt-2">That page is not in the terminal.</p>
      <Link href="/" className="btn-primary inline-block mt-4 text-sm">Back to markets</Link>
    </div>
  );
}
