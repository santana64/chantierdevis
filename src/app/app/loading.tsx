export default function AppLoading() {
  return (
    <div className="animate-pulse space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Page header skeleton */}
      <div className="mb-7 border-b border-border/70 pb-5">
        <div className="h-8 w-64 rounded-lg bg-slate-200" />
        <div className="mt-2 h-4 w-96 rounded bg-slate-100" />
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-white p-5">
            <div className="h-3 w-24 rounded bg-slate-200" />
            <div className="mt-3 h-7 w-32 rounded bg-slate-200" />
          </div>
        ))}
      </div>

      {/* Card skeleton */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <div className="h-5 w-40 rounded bg-slate-200" />
        </div>
        <div className="divide-y divide-border">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <div className="h-4 w-28 rounded bg-slate-100" />
              <div className="h-4 w-40 rounded bg-slate-100" />
              <div className="ml-auto h-6 w-16 rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
