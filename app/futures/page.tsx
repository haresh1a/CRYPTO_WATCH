import { FuturesTracker } from "@/components/FuturesTracker";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Futures" };

export default async function FuturesPage() {
  await requireUser();
  return (
    <ErrorBoundary label="Futures page">
      <FuturesTracker />
    </ErrorBoundary>
  );
}
