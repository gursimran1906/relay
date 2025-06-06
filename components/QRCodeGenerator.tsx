"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import QRCode from "qrcode";
import jsPDF from "jspdf";
import { Download, QrCode, Loader2, FileText } from "lucide-react";
import { generateReportUrl } from "@/utils/assetUrl";

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

interface QRCodeGeneratorProps {
  assets: Asset[];
}

export function QRCodeGenerator({ assets }: QRCodeGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<number[]>([]);

  const generateQRCodePDF = async (asset: Asset) => {
    try {
      // Generate QR code URL with name and location parameters for public access
      const qrUrl = generateReportUrl(
        {
          uid: asset.uid,
          name: asset.name,
          location: asset.location,
        },
        window.location.origin
      );

      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Page dimensions
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Margins
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;

      // Colors
      const primaryColor = "#DC2626"; // Red
      const secondaryColor = "#374151"; // Dark gray
      const accentColor = "#1F2937"; // Darker gray

      // Header - Main Title
      pdf.setFillColor(220, 38, 38); // Red background
      pdf.rect(0, 0, pageWidth, 35, "F");

      pdf.setTextColor(255, 255, 255); // White text
      pdf.setFontSize(28);
      pdf.setFont("helvetica", "bold");
      pdf.text("If you discover a fault", pageWidth / 2, 15, {
        align: "center",
      });
      pdf.text("with this equipment", pageWidth / 2, 26, { align: "center" });

      // Reset text color to black
      pdf.setTextColor(0, 0, 0);

      // QR Code Section
      const qrSize = 60; // 60mm
      const qrX = (pageWidth - qrSize) / 2;
      const qrY = 50;

      // QR Code border/frame
      pdf.setFillColor(245, 245, 245); // Light gray
      pdf.rect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10, "F");
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.rect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10, "S");

      pdf.addImage(qrCodeDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

      // Scan instruction
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(55, 65, 81); // Dark gray
      pdf.text("SCAN QR CODE TO REPORT", pageWidth / 2, qrY + qrSize + 15, {
        align: "center",
      });

      // Asset Information Box
      const assetInfoY = qrY + qrSize + 30;
      pdf.setFillColor(249, 250, 251); // Very light gray
      pdf.rect(margin, assetInfoY, contentWidth, 45, "F");
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(margin, assetInfoY, contentWidth, 45, "S");

      // Asset Name
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(31, 41, 55); // Dark
      pdf.text(asset.name, pageWidth / 2, assetInfoY + 12, { align: "center" });

      // Asset Type
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(75, 85, 99); // Medium gray
      pdf.text(`Type: ${asset.type}`, pageWidth / 2, assetInfoY + 22, {
        align: "center",
      });

      // Location
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(31, 41, 55);
      pdf.text("Location:", pageWidth / 2, assetInfoY + 32, {
        align: "center",
      });

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(75, 85, 99);
      const locationLines = pdf.splitTextToSize(
        asset.location,
        contentWidth - 20
      );
      let locationY = assetInfoY + 40;
      locationLines.forEach((line: string, index: number) => {
        pdf.text(line, pageWidth / 2, locationY + index * 6, {
          align: "center",
        });
      });

      // Instructions Section
      const instructionsY = assetInfoY + 65;

      // Section header
      pdf.setFillColor(239, 68, 68); // Lighter red
      pdf.rect(margin, instructionsY, contentWidth, 8, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("REPORTING INSTRUCTIONS", pageWidth / 2, instructionsY + 6, {
        align: "center",
      });

      // Instructions text
      pdf.setTextColor(31, 41, 55);
      pdf.setFontSize(13);
      pdf.setFont("helvetica", "normal");

      const instructionLines = [
        "1. Scan the QR code above with your phone camera",
        "2. Fill out the fault report form completely",
        "3. Take photos of the issue if possible",
        "4. Submit the report immediately",
      ];

      let instrY = instructionsY + 20;
      instructionLines.forEach((instruction, index) => {
        pdf.text(instruction, margin + 5, instrY + index * 8, {
          align: "left",
        });
      });

      // Department info (if available)
      if (asset.metadata?.department) {
        const deptY = instrY + 40;
        pdf.setFillColor(243, 244, 246); // Light gray
        pdf.rect(margin, deptY, contentWidth, 15, "F");
        pdf.setTextColor(55, 65, 81);
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.text(
          `Department: ${asset.metadata.department}`,
          pageWidth / 2,
          deptY + 8,
          { align: "center" }
        );

        if (asset.metadata?.criticality) {
          pdf.text(
            `Criticality: ${asset.metadata.criticality}`,
            pageWidth / 2,
            deptY + 13,
            { align: "center" }
          );
        }
      }

      // Emergency Contact Section
      const emergencyY = pageHeight - 55;
      pdf.setFillColor(220, 38, 38); // Red
      pdf.rect(margin, emergencyY, contentWidth, 25, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("FOR URGENT SAFETY ISSUES", pageWidth / 2, emergencyY + 8, {
        align: "center",
      });
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        "Contact facilities management immediately",
        pageWidth / 2,
        emergencyY + 15,
        { align: "center" }
      );
      pdf.text(
        "Do not wait for QR code response",
        pageWidth / 2,
        emergencyY + 20,
        { align: "center" }
      );

      // Thank you message
      pdf.setTextColor(75, 85, 99);
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("Thank you.", pageWidth / 2, pageHeight - 20, {
        align: "center",
      });

      // Footer with branding
      pdf.setTextColor(156, 163, 175);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "italic");
      pdf.text(
        "Powered by Relay Asset Management System",
        pageWidth / 2,
        pageHeight - 8,
        { align: "center" }
      );

      // Asset ID in corner for reference
      pdf.setTextColor(156, 163, 175);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Asset ID: ${asset.uid}`, margin, pageHeight - 5, {
        align: "left",
      });

      return pdf;
    } catch (error) {
      console.error("Error generating QR code PDF:", error);
      throw error;
    }
  };

  const downloadSinglePDF = async (asset: Asset) => {
    setLoading(true);
    try {
      const pdf = await generateQRCodePDF(asset);
      const fileName = `QR-${asset.name.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`;
      pdf.save(fileName);
      toast.success("QR code PDF downloaded successfully!");
    } catch (error) {
      toast.error("Failed to generate QR code PDF");
    } finally {
      setLoading(false);
    }
  };

  const downloadBulkPDFs = async () => {
    if (selectedAssets.length === 0) {
      toast.error("Please select assets to download");
      return;
    }

    setLoading(true);
    try {
      // Create a single PDF with all selected assets
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      let isFirstPage = true;

      for (const assetId of selectedAssets) {
        const asset = assets.find((a) => a.id === assetId);
        if (!asset) continue;

        if (!isFirstPage) {
          pdf.addPage();
        }
        isFirstPage = false;

        // Generate QR code URL with name and location parameters for public access
        const qrUrl = generateReportUrl(
          {
            uid: asset.uid,
            name: asset.name,
            location: asset.location,
          },
          window.location.origin
        );

        // Generate QR code as data URL
        const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });

        // Page dimensions
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        // Margins
        const margin = 20;
        const contentWidth = pageWidth - margin * 2;

        // Header text
        pdf.setFillColor(220, 38, 38); // Red background
        pdf.rect(0, 0, pageWidth, 35, "F");

        pdf.setTextColor(255, 255, 255); // White text
        pdf.setFontSize(28);
        pdf.setFont("helvetica", "bold");
        pdf.text("If you discover a fault", pageWidth / 2, 15, {
          align: "center",
        });
        pdf.text("with this equipment", pageWidth / 2, 26, { align: "center" });

        // Reset text color to black
        pdf.setTextColor(0, 0, 0);

        // QR Code Section
        const qrSize = 60; // 60mm
        const qrX = (pageWidth - qrSize) / 2;
        const qrY = 50;

        // QR Code border/frame
        pdf.setFillColor(245, 245, 245); // Light gray
        pdf.rect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10, "F");
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.5);
        pdf.rect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10, "S");

        pdf.addImage(qrCodeDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

        // Scan instruction
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(55, 65, 81); // Dark gray
        pdf.text("SCAN QR CODE TO REPORT", pageWidth / 2, qrY + qrSize + 15, {
          align: "center",
        });

        // Asset Information Box
        const assetInfoY = qrY + qrSize + 30;
        pdf.setFillColor(249, 250, 251); // Very light gray
        pdf.rect(margin, assetInfoY, contentWidth, 45, "F");
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(margin, assetInfoY, contentWidth, 45, "S");

        // Asset Name
        pdf.setFontSize(18);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(31, 41, 55); // Dark
        pdf.text(asset.name, pageWidth / 2, assetInfoY + 12, {
          align: "center",
        });

        // Asset Type
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(75, 85, 99); // Medium gray
        pdf.text(`Type: ${asset.type}`, pageWidth / 2, assetInfoY + 22, {
          align: "center",
        });

        // Location
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(31, 41, 55);
        pdf.text("Location:", pageWidth / 2, assetInfoY + 32, {
          align: "center",
        });

        pdf.setFontSize(12);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(75, 85, 99);
        const locationLines = pdf.splitTextToSize(
          asset.location,
          contentWidth - 20
        );
        let locationY = assetInfoY + 40;
        locationLines.forEach((line: string, index: number) => {
          pdf.text(line, pageWidth / 2, locationY + index * 6, {
            align: "center",
          });
        });

        // Instructions Section
        const instructionsY = assetInfoY + 65;

        // Section header
        pdf.setFillColor(239, 68, 68); // Lighter red
        pdf.rect(margin, instructionsY, contentWidth, 8, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text("REPORTING INSTRUCTIONS", pageWidth / 2, instructionsY + 6, {
          align: "center",
        });

        // Instructions text
        pdf.setTextColor(31, 41, 55);
        pdf.setFontSize(13);
        pdf.setFont("helvetica", "normal");

        const instructionLines = [
          "1. Scan the QR code above with your phone camera",
          "2. Fill out the fault report form completely",
          "3. Take photos of the issue if possible",
          "4. Submit the report immediately",
        ];

        let instrY = instructionsY + 20;
        instructionLines.forEach((instruction, index) => {
          pdf.text(instruction, margin + 5, instrY + index * 8, {
            align: "left",
          });
        });

        // Department info (if available)
        if (asset.metadata?.department) {
          const deptY = instrY + 40;
          pdf.setFillColor(243, 244, 246); // Light gray
          pdf.rect(margin, deptY, contentWidth, 15, "F");
          pdf.setTextColor(55, 65, 81);
          pdf.setFontSize(11);
          pdf.setFont("helvetica", "bold");
          pdf.text(
            `Department: ${asset.metadata.department}`,
            pageWidth / 2,
            deptY + 8,
            { align: "center" }
          );

          if (asset.metadata?.criticality) {
            pdf.text(
              `Criticality: ${asset.metadata.criticality}`,
              pageWidth / 2,
              deptY + 13,
              { align: "center" }
            );
          }
        }

        // Emergency Contact Section
        const emergencyY = pageHeight - 55;
        pdf.setFillColor(220, 38, 38); // Red
        pdf.rect(margin, emergencyY, contentWidth, 25, "F");

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.text("FOR URGENT SAFETY ISSUES", pageWidth / 2, emergencyY + 8, {
          align: "center",
        });
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.text(
          "Contact facilities management immediately",
          pageWidth / 2,
          emergencyY + 15,
          { align: "center" }
        );
        pdf.text(
          "Do not wait for QR code response",
          pageWidth / 2,
          emergencyY + 20,
          { align: "center" }
        );

        // Thank you message
        pdf.setTextColor(75, 85, 99);
        pdf.setFontSize(16);
        pdf.setFont("helvetica", "bold");
        pdf.text("Thank you.", pageWidth / 2, pageHeight - 20, {
          align: "center",
        });

        // Footer with branding
        pdf.setTextColor(156, 163, 175);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "italic");
        pdf.text(
          "Powered by Relay Asset Management System",
          pageWidth / 2,
          pageHeight - 8,
          { align: "center" }
        );

        // Asset ID in corner for reference
        pdf.setTextColor(156, 163, 175);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.text(`Asset ID: ${asset.uid}`, margin, pageHeight - 5, {
          align: "left",
        });
      }

      const fileName = `QR-Codes-Bulk-${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      pdf.save(fileName);
      toast.success(
        `Downloaded ${selectedAssets.length} QR code PDFs successfully!`
      );
    } catch (error) {
      toast.error("Failed to generate bulk QR code PDFs");
    } finally {
      setLoading(false);
    }
  };

  const toggleAssetSelection = (assetId: number) => {
    setSelectedAssets((prev) =>
      prev.includes(assetId)
        ? prev.filter((id) => id !== assetId)
        : [...prev, assetId]
    );
  };

  const selectAll = () => {
    setSelectedAssets(assets.map((asset) => asset.id));
  };

  const deselectAll = () => {
    setSelectedAssets([]);
  };

  if (assets.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Assets Available
        </h3>
        <p className="text-gray-600">
          Add some assets first to generate QR codes.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Generate QR Code PDFs
          </h3>
          <p className="text-sm text-gray-600">
            Create printable QR codes for issue reporting
          </p>
        </div>
        <QrCode className="h-8 w-8 text-blue-600" />
      </div>

      {/* Bulk Actions */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
        <button
          onClick={selectAll}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Select All
        </button>
        <button
          onClick={deselectAll}
          className="text-sm text-gray-600 hover:text-gray-700 font-medium"
        >
          Deselect All
        </button>
        <div className="flex-1" />
        {selectedAssets.length > 0 && (
          <button
            onClick={downloadBulkPDFs}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Download {selectedAssets.length} PDFs
          </button>
        )}
      </div>

      {/* Assets List */}
      <div className="space-y-3">
        {assets.map((asset) => (
          <div
            key={asset.id}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedAssets.includes(asset.id)}
                onChange={() => toggleAssetSelection(asset.id)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <h4 className="font-medium text-gray-900">{asset.name}</h4>
                <p className="text-sm text-gray-600">{asset.location}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {asset.type}
                  </span>
                  {asset.metadata?.department && (
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {asset.metadata.department}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => downloadSinglePDF(asset)}
              disabled={loading}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              PDF
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
