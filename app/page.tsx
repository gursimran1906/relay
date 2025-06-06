import { Suspense } from "react";
import { DashboardDataServer } from "@/components/server/DashboardDataServer";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardDataServer />
    </Suspense>
  );
}
