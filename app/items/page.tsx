import { Suspense } from "react";
import { ItemsDataServer } from "@/components/server/ItemsDataServer";
import { ItemsSkeleton } from "@/components/skeletons/ItemsSkeleton";

export default function ItemsPage() {
  return (
    <Suspense fallback={<ItemsSkeleton />}>
      <ItemsDataServer />
    </Suspense>
  );
}
