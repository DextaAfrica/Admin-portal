import { PortalLoader } from "@/components/ui/PortalLoader";

export default function AdminLoading() {
  return (
    <div className="py-12">
      <PortalLoader message="Loading operational module..." durationMs={800} />
    </div>
  );
}

