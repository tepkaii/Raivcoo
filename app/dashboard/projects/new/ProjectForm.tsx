// app/projects/ProjectForm.tsx
// @ts-nocheck
"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RevButtons } from "@/components/ui/RevButtons";
import {
  Loader2,
  Plus,
  X,
  Image as ImageIcon,
  XCircle,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Video,
  Link,
  Eye,
  Copy,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const MAX_IMAGES_PER_COMMENT = 4;
const ACCEPTED_IMAGE_TYPES_STRING = "image/jpeg,image/png,image/webp";

interface ProjectFormProps {
  createProject: (formData: FormData) => Promise<{
    message: string;
    project: any;
    reviewLink?: string;
    trackId?: string;
  }>;
}

export default function ProjectForm({ createProject }: ProjectFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [useManualSteps, setUseManualSteps] = useState(false);
  const [includeDeliverable, setIncludeDeliverable] = useState(false);
  const [deliverableMediaType, setDeliverableMediaType] = useState<
    "video" | "image" | ""
  >("");
  const [steps, setSteps] = useState<{ text: string; images?: File[] }[]>([
    { text: "" },
  ]);

  // Success state
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdProject, setCreatedProject] = useState<any>(null);
  const [reviewLink, setReviewLink] = useState<string>("");
  const [trackId, setTrackId] = useState<string>("");

  const router = useRouter();
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const addStep = () => {
    setSteps([...steps, { text: "" }]);
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, text: string) => {
    const newSteps = [...steps];
    newSteps[index].text = text;
    setSteps(newSteps);
  };

  const handleFileChange = (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const totalFiles = (steps[index].images?.length || 0) + files.length;

      if (totalFiles > MAX_IMAGES_PER_COMMENT) {
        toast({
          title: "Too many images",
          description: `You can only select up to ${MAX_IMAGES_PER_COMMENT} images per step.`,
          variant: "warning",
        });
        return;
      }

      const newSteps = [...steps];
      newSteps[index].images = [...(newSteps[index].images || []), ...files];
      setSteps(newSteps);
    }
  };

  const removeImage = (stepIndex: number, imageIndex: number) => {
    const newSteps = [...steps];
    newSteps[stepIndex].images = newSteps[stepIndex].images?.filter(
      (_, i) => i !== imageIndex
    );
    setSteps(newSteps);
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(steps);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSteps(items);
  };

  const copyReviewLink = () => {
    if (reviewLink) {
      navigator.clipboard.writeText(reviewLink);
      toast({
        title: "Review link copied!",
        description: "Share this link with your client.",
        variant: "success",
      });
    }
  };

  const openReviewPage = () => {
    if (reviewLink) {
      window.open(reviewLink, "_blank");
    }
  };

  const visitProjectPage = () => {
    if (createdProject?.id) {
      router.push(`/dashboard/projects/${createdProject.id}`);
    }
  };

  const createAnotherProject = () => {
    setIsSuccess(false);
    setCreatedProject(null);
    setReviewLink("");
    setTrackId("");
    // Reset form
    setUseManualSteps(false);
    setIncludeDeliverable(false);
    setIsPasswordProtected(false);
    setDeliverableMediaType("");
    setSteps([{ text: "" }]);
    setShowAdvanced(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);

      // Project details
      formData.set("title", e.currentTarget.title.value);
      formData.set("client_name", e.currentTarget.client_name.value);

      // Optional fields
      if (e.currentTarget.client_email?.value) {
        formData.set("client_email", e.currentTarget.client_email.value);
      }
      if (e.currentTarget.description?.value) {
        formData.set("description", e.currentTarget.description.value);
      }
      if (e.currentTarget.deadline?.value) {
        formData.set("deadline", e.currentTarget.deadline.value);
      }

      // Password protection
      formData.set("password_protected", isPasswordProtected.toString());
      if (isPasswordProtected && e.currentTarget.access_password?.value) {
        formData.set("access_password", e.currentTarget.access_password.value);
      }

      // Handle deliverable link if included
      if (includeDeliverable) {
        const deliverableLink = e.currentTarget.deliverable_link?.value;
        const mediaType = deliverableMediaType;

        if (!deliverableLink?.trim()) {
          toast({
            title: "Error",
            description: "Please provide the deliverable link",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        if (!mediaType) {
          toast({
            title: "Error",
            description: "Please select the deliverable media type",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        formData.set("deliverable_link", deliverableLink);
        formData.set("deliverable_media_type", mediaType);
      }

      // Handle steps based on mode
      formData.set("use_manual_steps", useManualSteps.toString());
      formData.set("include_deliverable", includeDeliverable.toString());

      if (useManualSteps) {
        const validSteps = steps.filter(
          (s) => s.text.trim() !== "" || (s.images && s.images.length > 0)
        );

        if (validSteps.length === 0) {
          toast({
            title: "Error",
            description:
              "At least one work step with text or image is required",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        // Add manual steps plus final step
        const stepsWithFinal = [
          ...validSteps.map((step) => ({
            text: step.text,
            images: step.images?.map((f) => f.name) || [],
          })),
          { text: "Final Deliverable", is_final: true },
        ];

        formData.set("comments", JSON.stringify(stepsWithFinal));

        // Add image files
        validSteps.forEach((step, index) => {
          step.images?.forEach((file, fileIndex) => {
            formData.append(`image_${index}_${fileIndex}`, file);
          });
        });
      } else {
        // Create just a final deliverable step automatically
        formData.set(
          "comments",
          JSON.stringify([
            {
              text: "Final Deliverable",
              is_final: true,
            },
          ])
        );
      }

      const result = await createProject(formData);

      // Set success state instead of redirecting - Get title from form data
      setIsSuccess(true);
      setCreatedProject({
        id: result.project.id,
        title: formData.get("title") as string,
        client_name: formData.get("client_name") as string,
      });
      if (result.reviewLink) {
        setReviewLink(result.reviewLink);
      }
      if (result.trackId) {
        setTrackId(result.trackId);
      }

      toast({
        title: "Success",
        description: result.message,
        variant: "success",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Success view
  if (isSuccess) {
    return (
      <Card className="mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 border-2 border-white/5 rounded-[10px] flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold ">
                  Project Created Successfully!
                </h2>
                <p className="text-muted-foreground mt-2">
                  Your project "{createdProject?.title}" is ready to go.
                </p>
              </div>
            </div>

            {/* Review Link Actions - Only show if review link exists */}
            {reviewLink && (
              <div className="space-y-4 p-4  rounded-lg border border-dashed">
                <h3 className="font-medium ">🎉 Review Link Ready!</h3>
                <p className="text-sm ">
                  Your deliverable has been submitted and the review link is
                  ready to share with your client.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <RevButtons
                    className="flex-1"
                    variant="outline"
                    onClick={openReviewPage}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Open Review Page
                  </RevButtons>
                  <RevButtons
                    className="flex-1"
                    variant="info"
                    onClick={copyReviewLink}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Review Link
                  </RevButtons>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <RevButtons
                className="w-full"
                variant="default"
                onClick={visitProjectPage}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit Project Page
              </RevButtons>

              <RevButtons
                className="w-full"
                variant="outline"
                onClick={createAnotherProject}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Another Project
              </RevButtons>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Form view
  return (
    <Card className="mx-auto">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Essential Fields */}
            <div>
              <Label className="font-medium">Project Title</Label>
              <Input name="title" placeholder="Project title" required />
            </div>

            <div>
              <Label className="font-medium">Client Name</Label>
              <Input name="client_name" placeholder="Client name" required />
            </div>

            {/* Project Workflow Info */}
            {/* <div className="bg-muted/30 p-4 rounded-md border border-dashed">
              <h3 className="text-sm font-medium mb-2">How This Works:</h3>
              <ol className="text-sm text-muted-foreground space-y-1 pl-5 list-decimal">
                <li>Fill in your project details and client information</li>
                <li>
                  Toggle "Include Deliverable Link" to get review link instantly
                </li>
                <li>
                  Create project and choose your next action from the success
                  screen
                </li>
                <li>Share the review link with your client for feedback</li>
                <li>
                  Client feedback becomes actionable steps for your next
                  revision
                </li>
              </ol>
            </div> */}

            {/* Quick Deliverable Toggle */}
            <div className="flex items-center justify-between border-t border-dashed pt-4">
              <div>
                <h3 className="text-sm font-medium">
                  Include Deliverable Link
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Add your deliverable now to get the review link immediately
                </p>
              </div>
              <Switch
                checked={includeDeliverable}
                onCheckedChange={setIncludeDeliverable}
              />
            </div>

            {/* Quick Deliverable Section */}
            {includeDeliverable && (
              <div className="space-y-4 pt-2 border border-dashed rounded-md p-4 ">
                <div className="flex items-center gap-2 mb-3">
                  <Link className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-medium ">Final Deliverable</h3>
                </div>

                <div>
                  <Label
                    htmlFor="deliverable-link"
                    className="text-sm font-normal"
                  >
                    Deliverable Link
                  </Label>
                  <Input
                    id="deliverable-link"
                    name="deliverable_link"
                    type="url"
                    placeholder="Paste shareable video or image link..."
                    className="flex-1 h-10"
                    required={includeDeliverable}
                  />
                </div>

                <div>
                  <Label className="text-sm font-normal mb-2 block">
                    Media Type
                  </Label>
                  <RadioGroup
                    value={deliverableMediaType}
                    onValueChange={(value: "video" | "image") =>
                      setDeliverableMediaType(value)
                    }
                    className="flex gap-4"
                    required={includeDeliverable}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="video" id="quick-type-video" />
                      <Label
                        htmlFor="quick-type-video"
                        className="flex items-center gap-1 cursor-pointer"
                      >
                        <Video className="h-4 w-4" /> Video
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="image" id="quick-type-image" />
                      <Label
                        htmlFor="quick-type-image"
                        className="flex items-center gap-1 cursor-pointer"
                      >
                        <ImageIcon className="h-4 w-4" /> Image
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="text-xs text-muted-foreground bg-yellow-50 dark:bg-yellow-950/20 p-2 rounded border border-yellow-200 dark:border-yellow-800">
                  💡 <strong>Pro tip:</strong> Including your deliverable now
                  means you'll get the review link immediately after creation!
                </div>
              </div>
            )}

            {/* Advanced Fields Toggle */}
            <button
              type="button"
              className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4 mr-2" />
              ) : (
                <ChevronDown className="h-4 w-4 mr-2" />
              )}
              {showAdvanced ? "Hide" : "Show"} Advanced Options
            </button>

            {showAdvanced && (
              <div className="space-y-4  ">
                <div className="pt-2">
                  <Label>Client Email (Optional)</Label>
                  <Input
                    name="client_email"
                    type="email"
                    placeholder="client@example.com"
                  />
                </div>

                <div>
                  <Label>Description (Optional)</Label>
                  <Textarea
                    name="description"
                    placeholder="Project description"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Deadline (Optional)</Label>
                  <Input name="deadline" type="date" />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="password-protection"
                    checked={isPasswordProtected}
                    onCheckedChange={(checked) =>
                      setIsPasswordProtected(checked === true)
                    }
                  />
                  <label
                    htmlFor="password-protection"
                    className="text-sm font-medium leading-none"
                  >
                    Password Protect Project
                  </label>
                </div>

                {isPasswordProtected && (
                  <div className="pt-2">
                    <Label>Access Password</Label>
                    <Input
                      name="access_password"
                      type="password"
                      placeholder="Set access password"
                      required={isPasswordProtected}
                    />
                  </div>
                )}

                {/* Manual Steps Toggle - Now in Advanced */}
                <div className="flex items-center justify-between border-t border-dashed pt-4">
                  <div>
                    <h3 className="text-sm font-medium">
                      Add Manual Work Steps
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Optional: Create specific steps to follow before
                      submitting your work
                    </p>
                  </div>
                  <Switch
                    checked={useManualSteps}
                    onCheckedChange={setUseManualSteps}
                  />
                </div>

                {/* Manual Steps Section */}
                {useManualSteps && (
                  <div className="space-y-4 pt-2">
                    <DragDropContext onDragEnd={onDragEnd}>
                      <Droppable droppableId="steps">
                        {(provided) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-6"
                          >
                            {steps.map((step, index) => (
                              <Draggable
                                key={index}
                                draggableId={`step-${index}`}
                                index={index}
                              >
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className="relative"
                                  >
                                    <div className="space-y-3">
                                      <div className="flex justify-between items-start gap-2">
                                        <Textarea
                                          value={step.text}
                                          onChange={(e) =>
                                            updateStep(index, e.target.value)
                                          }
                                          placeholder={`Step ${index + 1}: Describe this work step...`}
                                          className="flex-1 min-h-[80px]"
                                        />
                                        <div className="flex flex-col gap-2">
                                          <RevButtons
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            onClick={() => removeStep(index)}
                                            disabled={steps.length <= 1}
                                            title="Remove step"
                                          >
                                            <X className="h-4 w-4" />
                                          </RevButtons>
                                          <div
                                            {...provided.dragHandleProps}
                                            className="h-9 w-9 rounded hover:bg-accent border-2 border-dashed cursor-grab flex items-center justify-center"
                                            title="Drag to reorder"
                                          >
                                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                                          </div>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <label
                                          htmlFor={`image-upload-${index}`}
                                          className="text-sm font-medium text-muted-foreground flex items-center gap-2 cursor-pointer hover:text-primary"
                                        >
                                          <ImageIcon className="h-4 w-4" /> Add
                                          Reference Images (Optional)
                                        </label>
                                        <Input
                                          id={`image-upload-${index}`}
                                          ref={(el) =>
                                            (fileInputRefs.current[index] = el)
                                          }
                                          type="file"
                                          multiple
                                          accept={ACCEPTED_IMAGE_TYPES_STRING}
                                          onChange={(e) =>
                                            handleFileChange(index, e)
                                          }
                                          className="hidden"
                                          disabled={
                                            (step.images?.length || 0) >=
                                            MAX_IMAGES_PER_COMMENT
                                          }
                                        />

                                        {step.images &&
                                          step.images.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                              {step.images.map(
                                                (file, imgIndex) => (
                                                  <div
                                                    key={imgIndex}
                                                    className="relative w-20 h-20"
                                                  >
                                                    <img
                                                      src={URL.createObjectURL(
                                                        file
                                                      )}
                                                      alt={`Preview ${imgIndex + 1}`}
                                                      className="w-full h-full object-cover rounded border"
                                                    />
                                                    <RevButtons
                                                      variant="destructive"
                                                      size="icon"
                                                      className="absolute top-0 right-0 h-5 w-5 rounded-full -mt-1 -mr-1"
                                                      onClick={() =>
                                                        removeImage(
                                                          index,
                                                          imgIndex
                                                        )
                                                      }
                                                      title="Remove image"
                                                    >
                                                      <XCircle className="h-4 w-4" />
                                                    </RevButtons>
                                                  </div>
                                                )
                                              )}
                                            </div>
                                          )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>

                    <RevButtons
                      type="button"
                      variant="outline"
                      onClick={addStep}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Another Work Step
                    </RevButtons>
                  </div>
                )}
              </div>
            )}
          </div>

          <RevButtons
            type="submit"
            variant="success"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Project...
              </>
            ) : (
              `Create Project${includeDeliverable ? " & Get Review Link" : ""}`
            )}
          </RevButtons>
        </form>
      </CardContent>
    </Card>
  );
}
