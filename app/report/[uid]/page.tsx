import { createPublicClient } from "@/utils/supabase/public";
import { ReportIssueForm } from "@/components/ReportIssueForm";
import { Package, AlertTriangle } from "lucide-react";
import { notFound } from "next/navigation";

export default async function ReportIssuePage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const supabase = await createPublicClient();

  // Await params to fix Next.js 15+ requirement
  const { uid } = await params;

  // Fetch asset details using the UID
  const { data: asset, error } = await supabase
    .from("items")
    .select("*")
    .eq("uid", uid)
    .single();

  if (error || !asset) {
    notFound();
  }

  const getCriticalityColor = (criticality?: string) => {
    switch (criticality) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-3 px-3">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="flex justify-center mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <AlertTriangle className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            Report an Issue
          </h1>
          <p className="text-sm text-gray-600">
            Help us keep everything running smoothly
          </p>
        </div>

        {/* Asset Information Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 flex-shrink-0">
              <Package className="h-5 w-5 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-gray-900 mb-1 truncate">
                {asset.name}
              </h2>
              <p className="text-sm text-gray-600 mb-2 truncate">
                {asset.location}
              </p>

              <div className="flex flex-wrap gap-1">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {asset.type}
                </span>
                {asset.metadata?.department && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {asset.metadata.department}
                  </span>
                )}
                {asset.metadata?.criticality && (
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCriticalityColor(
                      asset.metadata.criticality
                    )}`}
                  >
                    {asset.metadata.criticality.charAt(0).toUpperCase() +
                      asset.metadata.criticality.slice(1)}
                  </span>
                )}
              </div>

              {asset.metadata?.description && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                  {asset.metadata.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Issue Report Form */}
        <ReportIssueForm asset={asset} />
      </div>
    </div>
  );
}
