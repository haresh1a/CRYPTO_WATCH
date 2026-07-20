import { PortfolioTracker } from "@/components/PortfolioTracker";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Portfolio" };

export default async function PortfolioPage() {
  // Middleware already gates this; calling requireUser as well so
  // a misconfigured middleware never leaks data.
  await requireUser();
  return (
    <ErrorBoundary label="Portfolio page">
      <PortfolioTracker />
    </ErrorBoundary>
  );
}
