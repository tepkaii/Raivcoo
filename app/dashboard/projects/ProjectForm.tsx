// app/projects/ProjectForm.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RevButtons } from "@/components/ui/RevButtons";
import { Loader2, PlusCircle, X, Edit, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Client {
  id: string;
  name: string;
}

interface ProjectFormProps {
  clients: Client[];
  createProject: (
    formData: FormData
  ) => Promise<{ message: string; project: any }>;
}

interface WorkflowStep {
  name: string;
  description?: string;
  files?: File[];
}

export default function ProjectForm({
  clients,
  createProject,
}: ProjectFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [steps, setSteps] = useState<WorkflowStep[]>([
    { name: "Get Clips" },
    { name: "Edit/Cut" },
    { name: "Color" },
  ]);
  const [newStepName, setNewStepName] = useState("");
  const router = useRouter();

  const handleAddStep = () => {
    if (!newStepName.trim()) {
      toast({
        title: "Error",
        description: "Step name cannot be empty",
        variant: "destructive",
      });
      return;
    }
    setSteps([...steps, { name: newStepName.trim() }]);
    setNewStepName("");
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length <= 1) {
      toast({
        title: "Error",
        description: "Need at least one step",
        variant: "destructive",
      });
      return;
    }
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleFileUpload = (index: number, files: FileList | null) => {
    if (!files) return;
    const newSteps = [...steps];
    newSteps[index].files = Array.from(files);
    setSteps(newSteps);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedClient || steps.length === 0) {
      toast({
        title: "Error",
        description: "Fill required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.set("client_id", selectedClient);
    formData.set("title", e.currentTarget.title.value);
    formData.set("description", e.currentTarget.description.value);
    if (e.currentTarget.deadline.value) {
      formData.set("deadline", e.currentTarget.deadline.value);
    }

    // Add steps data
    formData.set(
      "steps",
      JSON.stringify(
        steps.map((step) => ({
          name: step.name,
          description: step.description,
        }))
      )
    );

    // Add files to form data
    steps.forEach((step, index) => {
      if (step.files) {
        step.files.forEach((file, fileIndex) => {
          formData.append(`step_${index}_files`, file);
        });
      }
    });

    try {
      const result = await createProject(formData);
      toast({
        title: "Success",
        description: result.message,
        variant: "success",
      });
      router.push(`/projects/${result.project.id}`);
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

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client, Title, Description fields remain the same */}

          {/* Workflow Steps Section */}
          <div className="border-t pt-4">
            <Label className="mb-2 block">Workflow Steps</Label>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <div className="space-y-2 flex-1">
                      <Input
                        name={`step_${index}_name`}
                        value={step.name}
                        onChange={(e) => {
                          const newSteps = [...steps];
                          newSteps[index].name = e.target.value;
                          setSteps(newSteps);
                        }}
                        placeholder="Step name"
                      />
                      <Textarea
                        name={`step_${index}_description`}
                        value={step.description || ""}
                        onChange={(e) => {
                          const newSteps = [...steps];
                          newSteps[index].description = e.target.value;
                          setSteps(newSteps);
                        }}
                        placeholder="Step description (optional)"
                        rows={2}
                      />
                      <div>
                        <Label className="text-sm">Attachments</Label>
                        <Input
                          type="file"
                          onChange={(e) =>
                            handleFileUpload(index, e.target.files)
                          }
                          multiple
                          className="mt-1"
                        />
                        {step.files?.map((file, i) => (
                          <div
                            key={i}
                            className="flex items-center mt-1 text-sm"
                          >
                            <span className="truncate">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newSteps = [...steps];
                                newSteps[index].files = newSteps[
                                  index
                                ].files?.filter((_, idx) => idx !== i);
                                setSteps(newSteps);
                              }}
                              className="ml-2 text-red-500"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col space-y-1 ml-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (index > 0) {
                            const newSteps = [...steps];
                            [newSteps[index - 1], newSteps[index]] = [
                              newSteps[index],
                              newSteps[index - 1],
                            ];
                            setSteps(newSteps);
                          }
                        }}
                        disabled={index === 0}
                        className="p-1 disabled:opacity-50"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (index < steps.length - 1) {
                            const newSteps = [...steps];
                            [newSteps[index], newSteps[index + 1]] = [
                              newSteps[index + 1],
                              newSteps[index],
                            ];
                            setSteps(newSteps);
                          }
                        }}
                        disabled={index === steps.length - 1}
                        className="p-1 disabled:opacity-50"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(index)}
                        className="p-1 text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex items-center gap-2">
                <Input
                  value={newStepName}
                  onChange={(e) => setNewStepName(e.target.value)}
                  placeholder="Add new step..."
                  className="flex-1"
                />
                <RevButtons
                  type="button"
                  variant="outline"
                  onClick={handleAddStep}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Step
                </RevButtons>
              </div>
            </div>
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
                Creating...
              </>
            ) : (
              "Create Project"
            )}
          </RevButtons>
        </form>
      </CardContent>
    </Card>
  );
}
