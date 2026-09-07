import { Skeleton } from "@/components/ui/skeleton";

export default function PlanLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-10 w-48 max-w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-11 w-72 max-w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
