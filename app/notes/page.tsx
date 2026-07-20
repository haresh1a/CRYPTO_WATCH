import { NotesPanel } from "@/components/NotesPanel";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Notes" };

export default async function NotesPage() {
  await requireUser();
  return (
    <ErrorBoundary label="Notes page">
      <NotesPanel />
    </ErrorBoundary>
  );
}
