"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error("[GlobalError]", error); }, [error]);
  return (
    <div role="alert" className="panel p-6 max-w-2xl mx-auto">
      <h1 className="text-lg font-semibold text-danger">Something went wrong</h1>
      <p className="text-fg-secondary text-sm mt-2">{error.message}</p>
      <div className="mt-4 flex gap-2">
        <button onClick={reset} className="btn-primary text-sm">Try again</button>
        <Link href="/" className="btn text-sm">Go home</Link>
      </div>
    </div>
  );
}
