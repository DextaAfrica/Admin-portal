import Link from "next/link";
import { Compass, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-white select-none">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121217] p-8 shadow-xl text-center space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/[0.05] text-[#ED2618] border border-slate-200 dark:border-white/10">
          <Compass className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#ED2618]">
            404 &bull; Resource Unmapped
          </span>
          <h1 className="text-xl font-bold tracking-tight">
            Destination Not Found
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            The requested location does not exist in the Dexta Africa operations matrix or has been decommissioned.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Link href="/dashboard" className="w-full">
            <Button
              size="md"
              variant="primary"
              leftIcon={<Home className="h-4 w-4" />}
              className="w-full"
            >
              Return to Workspace Overview
            </Button>
          </Link>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] text-[11px] text-slate-400">
          Dexta Africa Enterprise System &bull; Active Route Shielding
        </div>
      </div>
    </div>
  );
}
