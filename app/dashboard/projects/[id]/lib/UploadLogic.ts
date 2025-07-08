// app/dashboard/projects/[id]/lib/UploadLogic.ts
import { createClient } from "@/utils/supabase/client";
import { toast } from "@/hooks/use-toast";

// Plan limits based on your pricing structure
const PLAN_LIMITS = {
  free: {
    maxUploadSize: 200 * 1024 * 1024, // 200MB
    maxStorage: 0.5 * 1024 * 1024 * 1024, // 500MB
  },
  lite: {
    maxUploadSize: 2 * 1024 * 1024 * 1024, // 2GB
    maxStorage: null, // Dynamic based on subscription.storage_gb
  },
  pro: {
    maxUploadSize: 5 * 1024 * 1024 * 1024, // 5GB
    maxStorage: null, // Dynamic based on subscription.storage_gb
  },
};

interface SubscriptionInfo {
  plan_id: string;
  status: string;
  current_period_end: string | null;
  storage_gb: number | null;
  max_upload_size_mb: number | null;
}

interface UploadLimits {
  maxUploadSize: number;
  maxStorage: number;
  planName: string;
  isActive: boolean;
}

interface ProjectUsage {
  currentSize: number;
  currentSizeFormatted: string;
  maxSize: number;
  maxSizeFormatted: string;
  percentage: number;
  remaining: number;
  remainingFormatted: string;
  canUpload: boolean;
}

export class UploadValidator {
  private subscription: SubscriptionInfo | null;
  private projectUsage: ProjectUsage;
  private uploadLimits: UploadLimits;

  constructor(
    subscription: SubscriptionInfo | null,
    projectUsage: ProjectUsage
  ) {
    this.subscription = subscription;
    this.projectUsage = projectUsage;
    this.uploadLimits = this.calculateUploadLimits();
  }

  private calculateUploadLimits(): UploadLimits {
    // Check if subscription is active and not expired
    const isActive =
      this.subscription &&
      this.subscription.status === "active" &&
      this.subscription.current_period_end &&
      new Date(this.subscription.current_period_end) > new Date();

    if (
      !isActive ||
      !this.subscription ||
      this.subscription.plan_id === "free"
    ) {
      // Free plan limits
      return {
        maxUploadSize: PLAN_LIMITS.free.maxUploadSize,
        maxStorage: PLAN_LIMITS.free.maxStorage,
        planName: "Free",
        isActive: false,
      };
    }

    const planId = this.subscription.plan_id as keyof typeof PLAN_LIMITS;

    if (planId === "lite" || planId === "pro") {
      return {
        maxUploadSize: this.subscription.max_upload_size_mb
          ? this.subscription.max_upload_size_mb * 1024 * 1024
          : PLAN_LIMITS[planId].maxUploadSize,
        maxStorage: this.subscription.storage_gb
          ? this.subscription.storage_gb * 1024 * 1024 * 1024
          : PLAN_LIMITS.free.maxStorage, // Fallback to free if no storage_gb
        planName: planId.charAt(0).toUpperCase() + planId.slice(1),
        isActive: true,
      };
    }

    // Fallback to free plan
    return {
      maxUploadSize: PLAN_LIMITS.free.maxUploadSize,
      maxStorage: PLAN_LIMITS.free.maxStorage,
      planName: "Free",
      isActive: false,
    };
  }

  public getUploadLimits(): UploadLimits {
    return this.uploadLimits;
  }

  public getProjectUsage(): ProjectUsage {
    return this.projectUsage;
  }

  public validateFiles(files: File[]): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check individual file sizes
    for (const file of files) {
      if (file.size > this.uploadLimits.maxUploadSize) {
        errors.push(
          `${file.name} (${this.formatBytes(file.size)}) exceeds the ${this.uploadLimits.planName} plan limit of ${this.formatBytes(this.uploadLimits.maxUploadSize)} per file`
        );
      }
    }

    // Check total upload size against remaining storage
    const totalUploadSize = files.reduce((sum, file) => sum + file.size, 0);

    if (this.projectUsage.remaining < totalUploadSize) {
      errors.push(
        `Upload size (${this.formatBytes(totalUploadSize)}) exceeds available storage (${this.projectUsage.remainingFormatted})`
      );
    }

    // Check if approaching storage limit
    const newUsage =
      ((this.projectUsage.currentSize + totalUploadSize) /
        this.uploadLimits.maxStorage) *
      100;
    if (newUsage > 80 && newUsage < 100) {
      warnings.push(
        `Upload will use ${newUsage.toFixed(1)}% of your storage limit`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  public canUploadFiles(files: File[]): boolean {
    return this.validateFiles(files).valid;
  }

  public getUploadStatus(): {
    canUpload: boolean;
    reason?: string;
    suggestion?: string;
  } {
    if (this.projectUsage.percentage >= 100) {
      return {
        canUpload: false,
        reason: `Storage limit reached (${this.projectUsage.currentSizeFormatted} / ${this.projectUsage.maxSizeFormatted})`,
        suggestion: this.uploadLimits.isActive
          ? "Upgrade your storage or delete some files"
          : "Upgrade to Lite or Pro for more storage",
      };
    }

    if (!this.uploadLimits.isActive && this.projectUsage.percentage > 90) {
      return {
        canUpload: true,
        reason: `Approaching storage limit (${this.projectUsage.percentage.toFixed(1)}%)`,
        suggestion: "Consider upgrading to Lite or Pro for more storage",
      };
    }

    return { canUpload: true };
  }

  public formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  public showUploadError(files: File[]): void {
    const validation = this.validateFiles(files);

    if (!validation.valid) {
      toast({
        title: "Upload Failed",
        description: validation.errors[0], // Show first error
        variant: "destructive",
      });
    }
  }

  public showUploadWarnings(files: File[]): void {
    const validation = this.validateFiles(files);

    if (validation.warnings.length > 0) {
      toast({
        title: "Upload Warning",
        description: validation.warnings[0],
        variant: "destructive",
      });
    }
  }
}

// Helper function to fetch subscription and calculate project usage
export async function getUploadValidatorData(
  projectId: string,
  mediaFiles: any[]
) {
  const supabase = createClient();

  // Get user's subscription
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select(
      "plan_id, status, current_period_end, storage_gb, max_upload_size_mb"
    )
    .eq("user_id", user.id)
    .single();

  // Calculate project usage
  const totalBytes = mediaFiles.reduce((sum, file) => sum + file.file_size, 0);

  // Determine max storage based on subscription
  let maxStorage = PLAN_LIMITS.free.maxStorage; // Default to free plan

  if (
    subscription &&
    subscription.status === "active" &&
    subscription.current_period_end &&
    new Date(subscription.current_period_end) > new Date()
  ) {
    if (subscription.storage_gb) {
      maxStorage = subscription.storage_gb * 1024 * 1024 * 1024; // Convert GB to bytes
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const projectUsage: ProjectUsage = {
    currentSize: totalBytes,
    currentSizeFormatted: formatBytes(totalBytes),
    maxSize: maxStorage,
    maxSizeFormatted: formatBytes(maxStorage),
    percentage: (totalBytes / maxStorage) * 100,
    remaining: maxStorage - totalBytes,
    remainingFormatted: formatBytes(maxStorage - totalBytes),
    canUpload: totalBytes < maxStorage,
  };

  return { subscription, projectUsage };
}

// Upload function
export async function uploadFiles(
  files: File[],
  projectId: string,
  validator: UploadValidator,
  targetMediaId?: string,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; files?: any[]; error?: string }> {
  // Validate files before upload
  if (!validator.canUploadFiles(files)) {
    validator.showUploadError(files);
    return { success: false, error: "Upload validation failed" };
  }

  // Show warnings if any
  validator.showUploadWarnings(files);

  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    if (targetMediaId) {
      formData.append("parentMediaId", targetMediaId);
    }

    const xhr = new XMLHttpRequest();

    const uploadPromise = new Promise<any>((resolve, reject) => {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);
            resolve(result);
          } catch (e) {
            reject(new Error("Invalid response format"));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.error || "Upload failed"));
          } catch (e) {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Network error during upload"));
      });

      xhr.open("POST", `/api/projects/${projectId}/media`);
      xhr.send(formData);
    });

    const result = await uploadPromise;

    toast({
      title: "Success",
      description: targetMediaId
        ? `Added ${result.files.length} new version(s)`
        : result.message,
      variant: "green",
    });

    return { success: true, files: result.files };
  } catch (error) {
    console.error("Upload error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to upload files";

    toast({
      title: "Upload Failed",
      description: errorMessage,
      variant: "destructive",
    });

    return { success: false, error: errorMessage };
  }
}
