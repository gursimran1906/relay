"use client";

import { Sidebar } from "@/components/Sidebar";
import { useState } from "react";
import { Clock, PlusCircle } from "lucide-react";

function SkeletonBox({
  width,
  height,
  className = "",
}: {
  width?: string;
  height?: string;
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      style={{ width, height }}
    />
  );
}

export function DashboardSkeleton() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        expanded={sidebarExpanded}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
        onToggle={() => setSidebarExpanded(!sidebarExpanded)}
      />
      <div
        className={`transition-all duration-300 ${
          sidebarExpanded ? "ml-64" : "ml-20"
        }`}
      >
        <main className="p-6 max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                Dashboard
              </h1>
              <p className="text-gray-600">
                Overview of your items and system status
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm">
                <PlusCircle className="h-4 w-4" />
                <span>Add Item</span>
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white p-4 rounded-lg border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <SkeletonBox width="80px" height="16px" />
                    <SkeletonBox width="40px" height="24px" />
                  </div>
                  <SkeletonBox width="16px" height="16px" />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <SkeletonBox width="12px" height="12px" />
                  <SkeletonBox width="60px" height="12px" />
                </div>
              </div>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Issues Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Critical Issues */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <div>
                        <h2 className="font-medium text-gray-900">
                          Critical Issues
                        </h2>
                        <p className="text-sm text-gray-500">
                          Requires immediate attention
                        </p>
                      </div>
                    </div>
                    <SkeletonBox width="50px" height="16px" />
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1">
                          <SkeletonBox width="80px" height="16px" />
                          <SkeletonBox width="200px" height="14px" />
                          <div className="flex items-center gap-4">
                            <SkeletonBox width="60px" height="12px" />
                            <SkeletonBox width="40px" height="20px" />
                          </div>
                        </div>
                        <SkeletonBox width="60px" height="28px" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Other Issues */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      <div>
                        <h2 className="font-medium text-gray-900">
                          Other Issues
                        </h2>
                        <p className="text-sm text-gray-500">
                          Active maintenance and updates
                        </p>
                      </div>
                    </div>
                    <SkeletonBox width="50px" height="16px" />
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1">
                          <SkeletonBox width="80px" height="16px" />
                          <SkeletonBox width="180px" height="14px" />
                          <div className="flex items-center gap-4">
                            <SkeletonBox width="60px" height="12px" />
                            <SkeletonBox width="40px" height="20px" />
                          </div>
                        </div>
                        <SkeletonBox width="60px" height="28px" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Insights Section */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <div>
                      <h2 className="font-medium text-gray-900">AI Insights</h2>
                      <p className="text-sm text-gray-500">
                        Smart recommendations
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                      <div className="flex items-start gap-3">
                        <SkeletonBox width="16px" height="16px" />
                        <div className="space-y-2 flex-1">
                          <SkeletonBox width="120px" height="16px" />
                          <SkeletonBox width="100%" height="14px" />
                          <div className="flex items-center gap-2">
                            <SkeletonBox width="40px" height="16px" />
                            <SkeletonBox width="60px" height="16px" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
