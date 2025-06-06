import { ReportIssueForm } from "@/components/ReportIssueForm";
import { Package, AlertTriangle } from "lucide-react";
import { notFound } from "next/navigation";
import { getAssetDataFromUrl } from "@/utils/assetUrl";

interface Asset {
  id: number;
  uid: string;
  name: string;
  type: string;
  location: string;
  status: string;
  metadata?: {
    department?: string;
    criticality?: string;
    description?: string;
  };
}

export default async function ReportIssuePage({
  params,
  searchParams,
}: {
  params: Promise<{ uid: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { uid } = await params;
  const urlSearchParams = await searchParams;



  // Extract asset data from URL parameters
  const searchParamsObj = new URLSearchParams();
  Object.entries(urlSearchParams).forEach(([key, value]) => {
    if (typeof value === "string") {
      searchParamsObj.set(key, value);
    }
  });

  const assetData = getAssetDataFromUrl(searchParamsObj);

  if (!assetData) {
    notFound();
  }

  // Create asset object for the form
  const asset: Asset = {
    id: assetData.id, // Use the actual item ID from URL parameters
    uid: uid,
    name: assetData.name,
    type: "Equipment", // Default type since we don't have it
    location: assetData.location,
    status: "unknown", // Default status
    metadata: {},
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
              </div>
            </div>
          </div>
        </div>

        {/* Issue Report Form */}
        <ReportIssueForm asset={asset} />
      </div>
    </div>
  );
}
