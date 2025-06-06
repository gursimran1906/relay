"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";

interface IssueImageDisplayProps {
  imagePath: string;
  alt?: string;
  className?: string;
  onClick?: () => void;
}

export function IssueImageDisplay({
  imagePath,
  alt = "Issue attachment",
  className = "max-w-48 h-auto rounded-lg border border-gray-200 cursor-pointer hover:opacity-90",
  onClick,
}: IssueImageDisplayProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSignedUrl = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/get-image-url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imagePath }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch image URL");
        }

        const data = await response.json();
        setSignedUrl(data.signedUrl);
      } catch (err) {
        console.error("Error fetching signed URL:", err);
        setError("Failed to load image");
      } finally {
        setLoading(false);
      }
    };

    if (imagePath) {
      fetchSignedUrl();
    }
  }, [imagePath]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (signedUrl) {
      // Default behavior: open in new tab
      window.open(signedUrl, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading image...</span>
      </div>
    );
  }

  if (error || !signedUrl) {
    return (
      <div className="flex items-center justify-center p-4 bg-red-50 rounded-lg border border-red-200">
        <AlertCircle className="h-5 w-5 text-red-500" />
        <span className="ml-2 text-sm text-red-600">
          {error || "Image not available"}
        </span>
      </div>
    );
  }

  return (
    <img
      src={signedUrl}
      alt={alt}
      className={className}
      onClick={handleClick}
      loading="lazy"
    />
  );
}
