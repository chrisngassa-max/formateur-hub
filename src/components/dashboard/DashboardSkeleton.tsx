import { LayoutGrid, List, Search } from "lucide-react";

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">
      {/* Header Skeleton */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="h-4 w-32 bg-zinc-200 rounded"></div>
          <div className="h-8 w-64 bg-zinc-200 rounded"></div>
          <div className="h-4 w-48 bg-zinc-100 rounded mt-1"></div>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="h-10 w-28 bg-zinc-200 rounded-lg"></div>
          <div className="h-10 w-32 bg-zinc-200 rounded-lg"></div>
          <div className="h-10 w-40 bg-zinc-200 rounded-lg"></div>
        </div>
      </header>

      {/* Filters Skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-16 bg-zinc-200 rounded-lg"></div>
          <div className="h-8 w-24 bg-zinc-100 rounded-lg"></div>
          <div className="h-8 w-24 bg-zinc-100 rounded-lg"></div>
          <div className="h-8 w-24 bg-zinc-100 rounded-lg"></div>
          <div className="h-8 w-24 bg-zinc-100 rounded-lg"></div>
        </div>
        <div className="relative w-full sm:w-64 h-10 bg-zinc-100 rounded-xl"></div>
      </div>

      {/* KPIs Skeleton */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="relative overflow-hidden rounded-xl border border-zinc-100 bg-white shadow-sm pt-4 p-5 h-32">
            <div className="h-3 w-24 bg-zinc-200 rounded mb-4"></div>
            <div className="h-8 w-16 bg-zinc-200 rounded mb-2"></div>
            <div className="h-3 w-32 bg-zinc-100 rounded"></div>
            <div className="absolute top-5 right-5 h-10 w-10 rounded-lg bg-zinc-100"></div>
          </div>
        ))}
      </section>

      {/* Table Section Skeleton */}
      <section className="flex flex-col gap-4 mt-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <div className="h-6 w-40 bg-zinc-200 rounded"></div>
            <div className="h-4 w-64 bg-zinc-100 rounded hidden sm:block"></div>
          </div>
          <div className="h-8 w-32 bg-zinc-200 rounded-full"></div>
        </div>

        <div className="rounded-xl border border-zinc-100 bg-white shadow-sm overflow-hidden min-h-[300px]">
          <div className="h-12 bg-zinc-50 border-b border-zinc-100 w-full"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex h-16 items-center px-4 border-b border-zinc-50">
              <div className="flex flex-col gap-2 w-1/4">
                <div className="h-4 w-3/4 bg-zinc-200 rounded"></div>
                <div className="h-3 w-1/2 bg-zinc-100 rounded"></div>
              </div>
              <div className="flex flex-col gap-2 w-1/4">
                <div className="h-4 w-2/3 bg-zinc-200 rounded"></div>
                <div className="h-3 w-1/3 bg-zinc-100 rounded"></div>
              </div>
              <div className="flex flex-col gap-2 w-1/4">
                <div className="h-4 w-1/2 bg-zinc-200 rounded"></div>
                <div className="h-2 w-full bg-zinc-100 rounded"></div>
              </div>
              <div className="flex flex-col gap-2 w-1/4">
                <div className="h-4 w-full bg-zinc-100 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
