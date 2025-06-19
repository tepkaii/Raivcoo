"use client";

import React, { useState } from "react";
import { RevButtons } from "@/components/ui/RevButtons";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  Check,
  GitCompare,
  Calendar,
  FileText,
  X,
} from "lucide-react";

interface MediaVersion {
  id: string;
  filename: string;
  original_filename: string;
  file_type: "video" | "image";
  file_size: number;
  version_number: number;
  is_current_version: boolean;
  uploaded_at: string;
  r2_url: string;
}

interface VersionSelectorProps {
  currentMedia: MediaVersion;
  allVersions: MediaVersion[];
  onVersionChange: (version: MediaVersion) => void;
  onCompareToggle: (compareVersion: MediaVersion | null) => void;
  compareVersion: MediaVersion | null;
  isCompareMode: boolean;
}

export const VersionSelector: React.FC<VersionSelectorProps> = ({
  currentMedia,
  allVersions,
  onVersionChange,
  onCompareToggle,
  compareVersion,
  isCompareMode,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCompareOptions, setShowCompareOptions] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleVersionSelect = (version: MediaVersion) => {
    onVersionChange(version);
    setIsOpen(false);
  };

  const handleCompareSelect = (version: MediaVersion) => {
    onCompareToggle(version);
    setShowCompareOptions(false);
  };

  const exitCompareMode = () => {
    onCompareToggle(null);
    setShowCompareOptions(false);
  };

  // Sort versions by version number (newest first)
  const sortedVersions = [...allVersions].sort(
    (a, b) => b.version_number - a.version_number
  );

  return (
    <div className="flex items-center gap-3">
      {/* Current Version Selector */}
      <div className="relative">
        <RevButtons
          variant="ghost"
          onClick={() => setIsOpen(!isOpen)}
          className="border-gray-600 text-gray-300 hover:border-gray-500 flex items-center gap-2"
        >
          <Badge variant="outline" className="border-gray-600 text-gray-300">
            v{currentMedia.version_number}
          </Badge>
          {currentMedia.is_current_version && (
            <Badge
              variant="default"
              className="bg-green-600 text-white text-xs"
            >
              Latest
            </Badge>
          )}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </RevButtons>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
            <div className="p-3 border-b border-gray-700">
              <h3 className="text-sm font-medium text-white">All Versions</h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {sortedVersions.map((version) => (
                <div
                  key={version.id}
                  className={`p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-750 last:border-b-0 ${
                    version.id === currentMedia.id ? "bg-gray-700" : ""
                  }`}
                  onClick={() => handleVersionSelect(version)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className="border-gray-600 text-gray-300"
                      >
                        v{version.version_number}
                      </Badge>
                      {version.is_current_version && (
                        <Badge
                          variant="default"
                          className="bg-green-600 text-white text-xs"
                        >
                          Latest
                        </Badge>
                      )}
                      {version.id === currentMedia.id && (
                        <Check className="h-4 w-4 text-green-400" />
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatFileSize(version.file_size)}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-300">
                    {version.original_filename}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    {formatDate(version.uploaded_at)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Compare Mode Toggle */}
      {/* {allVersions.length > 1 && (
        <div className="relative">
          {!isCompareMode ? (
            <RevButtons
              variant="outline"
              onClick={() => setShowCompareOptions(!showCompareOptions)}
              className="border-gray-600 text-gray-300 hover:border-gray-500 flex items-center gap-2"
            >
              <GitCompare className="h-4 w-4" />
              Compare
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showCompareOptions ? "rotate-180" : ""}`}
              />
            </RevButtons>
          ) : (
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-purple-600 text-white">
                Comparing with v{compareVersion?.version_number}
              </Badge>
              <RevButtons
                variant="ghost"
                size="sm"
                onClick={exitCompareMode}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </RevButtons>
            </div>
          )}

          {showCompareOptions && !isCompareMode && (
            <div className="absolute top-full left-0 mt-1 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
              <div className="p-3 border-b border-gray-700">
                <h3 className="text-sm font-medium text-white">
                  Compare with Version
                </h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {sortedVersions
                  .filter((version) => version.id !== currentMedia.id)
                  .map((version) => (
                    <div
                      key={version.id}
                      className="p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-750 last:border-b-0"
                      onClick={() => handleCompareSelect(version)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="outline"
                            className="border-gray-600 text-gray-300"
                          >
                            v{version.version_number}
                          </Badge>
                          {version.is_current_version && (
                            <Badge
                              variant="default"
                              className="bg-green-600 text-white text-xs"
                            >
                              Latest
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatFileSize(version.file_size)}
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-300">
                        {version.original_filename}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {formatDate(version.uploaded_at)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )} */}

      {/* Click outside to close */}
      {(isOpen || showCompareOptions) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsOpen(false);
            setShowCompareOptions(false);
          }}
        />
      )}
    </div>
  );
};
