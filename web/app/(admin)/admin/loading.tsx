import { PvrdLoader } from "@/components/brand/loader";

export default function AdminLoading() {
  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-2.5 text-sm font-medium text-primary">
        <PvrdLoader decorative className="size-5" />
        Loading
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="pvrd-card h-24 animate-pulse bg-white" />
        ))}
      </div>
      <div className="pvrd-card h-80 animate-pulse bg-white" />
    </div>
  );
}
