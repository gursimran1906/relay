"use client";

import { Sidebar } from "@/components/Sidebar";
import { useState } from "react";
import {
  Search,
  Filter,
  Calendar,
  ChevronDown,
  QrCode,
  Plus,
} from "lucide-react";

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

export function ItemsSkeleton() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar
        expanded={isSidebarExpanded}
        onMouseEnter={() => setIsSidebarExpanded(true)}
        onMouseLeave={() => setIsSidebarExpanded(false)}
        onToggle={() => setIsSidebarExpanded(!isSidebarExpanded)}
      />
      <div
        className={`transition-all duration-300 ${
          isSidebarExpanded ? "ml-64" : "ml-20"
        }`}
      >
        <main className="p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Items</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your inventory items
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* QR Code Generator Toggle */}
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg hover:cursor-pointer transition-colors font-medium">
                <QrCode className="h-5 w-5" />
                <span>QR Codes</span>
              </button>

              {/* Add Item Button */}
              <button className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 hover:cursor-pointer transition-colors font-medium">
                <Plus className="h-5 w-5" />
                <span>Add Item</span>
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search items..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">
                <Filter className="h-5 w-5" />
                <span>Filters</span>
                <ChevronDown className="h-5 w-5 transition-transform" />
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Calendar className="h-5 w-5 text-gray-400" />
                <span>Date</span>
                <ChevronDown className="h-5 w-5 text-gray-400 transition-transform" />
              </button>
            </div>
          </div>

          {/* Items Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-6">
                  {/* Item Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <SkeletonBox
                        width="40px"
                        height="40px"
                        className="rounded-lg"
                      />
                      <div className="space-y-2">
                        <SkeletonBox width="120px" height="16px" />
                        <SkeletonBox width="80px" height="12px" />
                      </div>
                    </div>
                    <SkeletonBox
                      width="60px"
                      height="20px"
                      className="rounded-full"
                    />
                  </div>

                  {/* Item Details */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <SkeletonBox width="12px" height="12px" />
                      <SkeletonBox width="100px" height="12px" />
                    </div>
                    <div className="flex items-center gap-2">
                      <SkeletonBox width="12px" height="12px" />
                      <SkeletonBox width="80px" height="12px" />
                    </div>
                    <div className="flex items-center gap-2">
                      <SkeletonBox width="12px" height="12px" />
                      <SkeletonBox width="90px" height="12px" />
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {Array.from({
                      length: Math.floor(Math.random() * 3) + 1,
                    }).map((_, tagIndex) => (
                      <SkeletonBox
                        key={tagIndex}
                        width={`${Math.floor(Math.random() * 40) + 40}px`}
                        height="20px"
                        className="rounded-full"
                      />
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <SkeletonBox width="60px" height="14px" />
                    <div className="flex items-center gap-2">
                      <SkeletonBox
                        width="28px"
                        height="28px"
                        className="rounded"
                      />
                      <SkeletonBox
                        width="28px"
                        height="28px"
                        className="rounded"
                      />
                      <SkeletonBox
                        width="28px"
                        height="28px"
                        className="rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          <div className="mt-8 text-center">
            <SkeletonBox width="120px" height="36px" className="mx-auto" />
          </div>
        </main>
      </div>
    </div>
  );
}
