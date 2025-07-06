// app/dashboard/components/GlobalSearch.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  X,
  FileText,
  Folder,
  Filter,
  Image,
  Video,
  Play,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import debounce from "lodash.debounce";
import { RevButtons } from "@/components/ui/RevButtons";

// Updated search filters for actual data structure
interface EnhancedSearchFilters {
  status:
    | "all"
    | "active"
    | "pending"
    | "completed"
    | "on_hold"
    | "cancelled"
    | "in_progress"
    | "needs_review"
    | "rejected"
    | "approved";
  sortBy: "updated_at" | "created_at" | "name" | "file_size";
  sortOrder: "asc" | "desc";
  type: "all" | "projects" | "media";
  mediaType?: "all" | "video" | "image";
}

// Enhanced search result
interface EnhancedSearchResult {
  id: string;
  type: "project" | "media";
  title: string;
  subtitle: string;
  url: string;
  status?: string;
  mediaType?: "video" | "image";
  fileSize?: number;
  projectName?: string;
  projectId?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  uploadedAt?: string;
}

interface GlobalSearchProps {
  onMediaSelect?: (media: EnhancedSearchResult) => void;
  currentProjectId?: string;
  compact?: boolean; // For sidebar icon version
}

export function GlobalSearch({
  onMediaSelect,
  currentProjectId,
  compact = false,
}: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<EnhancedSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<EnhancedSearchFilters>({
    status: "all",
    sortBy: "updated_at",
    sortOrder: "desc",
    type: "all",
    mediaType: "all",
  });

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const hasActiveFilters =
    filters.status !== "all" ||
    filters.sortBy !== "updated_at" ||
    filters.sortOrder !== "desc" ||
    filters.type !== "all" ||
    filters.mediaType !== "all";

  // Enhanced search function
  // In your GlobalSearch.tsx, update the performSearch function:
  const performSearch = useCallback(
    async (term: string, searchFilters: EnhancedSearchFilters) => {
      setIsSearching(true);
      try {
        console.log("Searching with:", {
          term,
          searchFilters,
          currentProjectId,
        });

        const response = await fetch("/api/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: term,
            filters: searchFilters,
            currentProjectId,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Search failed:", response.status, errorText);
          throw new Error(`Search failed: ${response.status}`);
        }

        const data = await response.json();
        console.log("Search response:", data);
        setResults(data.results || []);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [currentProjectId]
  );

  // Load initial results
  const loadInitialResults = useCallback(async () => {
    await performSearch("", {
      ...filters,
      sortBy: "updated_at",
      sortOrder: "desc",
    });
  }, [filters, performSearch]);

  useEffect(() => {
    if (isOpen && searchTerm === "" && results.length === 0) {
      loadInitialResults();
    }
  }, [isOpen, searchTerm, results.length, loadInitialResults]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce(async (term: string, searchFilters: EnhancedSearchFilters) => {
      if (term.trim().length === 0 && !hasActiveFilters) {
        loadInitialResults();
        return;
      }

      if (
        !hasActiveFilters &&
        term.trim().length > 0 &&
        term.trim().length < 2
      ) {
        setResults([]);
        setIsSearching(false);
        return;
      }

      await performSearch(term, searchFilters);
    }, 300),
    [hasActiveFilters, loadInitialResults, performSearch]
  );

  useEffect(() => {
    debouncedSearch(searchTerm, filters);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm, filters, debouncedSearch]);

  // Close search when route changes
  useEffect(() => {
    setIsOpen(false);
    setSearchTerm("");
    setResults([]);
    setShowFilters(false);
  }, [pathname]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        setShowFilters(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === backdropRef.current) {
      setIsOpen(false);
      setShowFilters(false);
    }
  }, []);

  const getStatusVariant = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "approved":
        return "green";
      case "active":
      case "in_progress":
        return "default";
      case "needs_review":
        return "warning";
      case "cancelled":
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getTypeIcon = (result: EnhancedSearchResult) => {
    if (result.type === "project") {
      return <Folder className="h-4 w-4 text-muted-foreground" />;
    } else if (result.type === "media") {
      if (result.mediaType === "video") {
        return <Video className="h-4 w-4 text-muted-foreground" />;
      } else {
        return <Image className="h-4 w-4 text-muted-foreground" />;
      }
    }
    return <FileText className="h-4 w-4 text-muted-foreground" />;
  };

  const handleResultClick = (result: EnhancedSearchResult) => {
    if (result.type === "media" && onMediaSelect) {
      onMediaSelect(result);
    }
    setIsOpen(false);
  };

  const clearFilters = () => {
    setFilters({
      status: "all",
      sortBy: "updated_at",
      sortOrder: "desc",
      type: "all",
      mediaType: "all",
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const isMac =
    typeof window !== "undefined" &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  return (
    <div className="relative">
      {/* Search Button */}
      {compact ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(true)}
          className="h-8 w-8"
          title="Search projects and media"
        >
          <Search className="size-6" strokeWidth={1.5} />
        </Button>
      ) : (
        <RevButtons
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="w-full justify-start border border-dashed text-muted-foreground md:w-[300px]"
        >
          <Search className="md:mr-2 h-4 w-4" />
          <span className="hidden md:inline-flex">
            Search projects and media...
          </span>
          <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 md:flex">
            <span className="text-xs">{isMac ? "⌘" : "Ctrl+"}</span>K
          </kbd>
        </RevButtons>
      )}

      {/* Search Dialog */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            ref={backdropRef}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={handleBackdropClick}
          />

          {/* Search Panel */}
          <div className="fixed left-1/2 top-[20%] z-50 w-full max-w-2xl -translate-x-1/2 p-4">
            <Card ref={searchRef} className="w-full shadow-lg">
              <div className="flex items-center border-b px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <Input
                  ref={inputRef}
                  placeholder="Search projects and media..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex h-11 w-full border-0 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-0"
                />
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn("ml-2", hasActiveFilters && "text-primary")}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4" />
                    {hasActiveFilters && (
                      <span className="ml-1 h-2 w-2 rounded-full bg-primary" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Filters Panel */}
              {showFilters && (
                <div className="border-b p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={filters.type}
                        onValueChange={(value: EnhancedSearchFilters["type"]) =>
                          setFilters((prev) => ({ ...prev, type: value }))
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[100]">
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="projects">Projects</SelectItem>
                          <SelectItem value="media">Media</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {filters.type === "media" && (
                      <div className="space-y-2">
                        <Label className="text-xs">Media Type</Label>
                        <Select
                          value={filters.mediaType}
                          onValueChange={(
                            value: EnhancedSearchFilters["mediaType"]
                          ) =>
                            setFilters((prev) => ({
                              ...prev,
                              mediaType: value,
                            }))
                          }
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[100]">
                            <SelectItem value="all">All Media</SelectItem>
                            <SelectItem value="video">Videos</SelectItem>
                            <SelectItem value="image">Images</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-xs">Status</Label>
                      <Select
                        value={filters.status}
                        onValueChange={(
                          value: EnhancedSearchFilters["status"]
                        ) => setFilters((prev) => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[100]">
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="in_progress">
                            In Progress
                          </SelectItem>
                          <SelectItem value="needs_review">
                            Needs Review
                          </SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="on_hold">On Hold</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Sort By</Label>
                      <Select
                        value={filters.sortBy}
                        onValueChange={(
                          value: EnhancedSearchFilters["sortBy"]
                        ) => setFilters((prev) => ({ ...prev, sortBy: value }))}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[100]">
                          <SelectItem value="updated_at">
                            Last Updated
                          </SelectItem>
                          <SelectItem value="created_at">
                            Created Date
                          </SelectItem>
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="file_size">File Size</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {hasActiveFilters && (
                    <div className="mt-4 flex justify-end">
                      <RevButtons
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                      >
                        Clear Filters
                      </RevButtons>
                    </div>
                  )}
                </div>
              )}

              {/* Search Results */}
              <div className="max-h-[400px] overflow-y-auto p-2">
                {isSearching ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Searching...
                    </div>
                  </div>
                ) : results.length > 0 ? (
                  <div className="space-y-1">
                    {results.map((result) => (
                      <div
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleResultClick(result)}
                        className={cn(
                          "flex items-center justify-between rounded-md px-3 py-2 hover:bg-accent cursor-pointer",
                          "focus:bg-accent focus:outline-none"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {getTypeIcon(result)}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium truncate">
                                {result.title}
                              </p>
                              {result.type === "media" && (
                                <Badge
                                  variant="outline"
                                  className="text-xs flex-shrink-0"
                                >
                                  {result.mediaType}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="truncate">
                                {result.subtitle}
                              </span>
                              {result.fileSize && (
                                <>
                                  <span>•</span>
                                  <span className="flex-shrink-0">
                                    {formatFileSize(result.fileSize)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {result.status && (
                            <Badge
                              variant={getStatusVariant(result.status)}
                              className="text-xs"
                            >
                              {result.status.replace("_", " ")}
                            </Badge>
                          )}
                          {result.type === "media" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (result.mediaUrl) {
                                  window.open(result.mediaUrl, "_blank");
                                }
                              }}
                              title="View full media"
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    {searchTerm.length > 0 &&
                    searchTerm.length < 2 &&
                    !hasActiveFilters
                      ? "Type at least 2 characters to search"
                      : `No results found${searchTerm ? ` for "${searchTerm}"` : ""}`}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
