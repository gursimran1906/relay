import { Suspense } from "react";
import { IssuesDataServer } from "@/components/server/IssuesDataServer";
import { IssuesSkeleton } from "@/components/skeletons/IssuesSkeleton";

export default function IssuesPage() {
  return (
    <Suspense fallback={<IssuesSkeleton />}>
      <IssuesDataServer />
    </Suspense>
  );
}
