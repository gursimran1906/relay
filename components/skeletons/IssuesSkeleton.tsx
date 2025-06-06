"use client";

import { Sidebar } from "@/components/Sidebar";
import { useState } from "react";
import {
  Search,
  Filter,
  AlertTriangle,
  ChevronDown,
  Calendar,
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

export function IssuesSkeleton() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
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
        <main className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                Issues
              </h1>
              <p className="text-gray-600">
                Track and manage asset problems and maintenance requests
              </p>
            </div>
            <div className="mt-4 lg:mt-0">
              <button className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition-colors">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Report Issue
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <SkeletonBox width="80px" height="14px" />
                    <SkeletonBox width="40px" height="20px" />
                  </div>
                  <SkeletonBox
                    width="32px"
                    height="32px"
                    className="rounded-lg"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search issues..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-3">
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Filter className="h-4 w-4" />
                  <span>Status</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Urgency</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Calendar className="h-4 w-4" />
                  <span>Date</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Issues List */}
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, assetIndex) => (
              <div
                key={assetIndex}
                className="bg-white rounded-lg border border-gray-200 shadow-sm"
              >
                {/* Asset Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <SkeletonBox
                        width="40px"
                        height="40px"
                        className="rounded-lg"
                      />
                      <div className="space-y-2">
                        <SkeletonBox width="150px" height="18px" />
                        <SkeletonBox width="100px" height="14px" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm space-y-1">
                        <SkeletonBox width="60px" height="14px" />
                        <SkeletonBox width="80px" height="14px" />
                      </div>
                      <SkeletonBox width="20px" height="20px" />
                    </div>
                  </div>
                </div>

                {/* Issue Groups */}
                <div className="divide-y divide-gray-200">
                  {Array.from({
                    length: Math.floor(Math.random() * 3) + 2,
                  }).map((_, groupIndex) => (
                    <div key={groupIndex}>
                      {/* Group Header */}
                      <div className="px-6 py-4 bg-gray-25">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <SkeletonBox width="16px" height="16px" />
                            <div className="space-y-1">
                              <SkeletonBox width="120px" height="16px" />
                              <SkeletonBox width="80px" height="12px" />
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <SkeletonBox
                              width="60px"
                              height="20px"
                              className="rounded-full"
                            />
                            <SkeletonBox
                              width="70px"
                              height="20px"
                              className="rounded-full"
                            />
                            <SkeletonBox width="20px" height="20px" />
                          </div>
                        </div>
                      </div>

                      {/* Individual Issues */}
                      <div className="divide-y divide-gray-100">
                        {Array.from({
                          length: Math.floor(Math.random() * 4) + 1,
                        }).map((_, issueIndex) => (
                          <div
                            key={issueIndex}
                            className="px-6 py-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-3">
                                {/* Issue Header */}
                                <div className="flex items-center gap-3">
                                  <SkeletonBox
                                    width="16px"
                                    height="16px"
                                    className="rounded-full"
                                  />
                                  <SkeletonBox width="60px" height="16px" />
                                  <SkeletonBox
                                    width="80px"
                                    height="20px"
                                    className="rounded-full"
                                  />
                                  <SkeletonBox
                                    width="60px"
                                    height="20px"
                                    className="rounded-full"
                                  />
                                </div>

                                {/* Issue Description */}
                                <SkeletonBox width="70%" height="16px" />

                                {/* Issue Meta */}
                                <div className="flex items-center gap-4 text-sm">
                                  <SkeletonBox width="70px" height="12px" />
                                  <SkeletonBox width="50px" height="12px" />
                                  <SkeletonBox width="60px" height="12px" />
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2 ml-4">
                                <SkeletonBox
                                  width="60px"
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
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          <div className="mt-8 text-center">
            <SkeletonBox width="120px" height="36px" className="mx-auto" />
          </div>
        </main>
      </div>
    </div>
  );
}
