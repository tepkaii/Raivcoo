// app/projects/ProjectForm.tsx
// This adds the ability to edit existing step names

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RevButtons } from "@/components/ui/RevButtons";
import { Loader2, PlusCircle, X, Edit, Move } from "lucide-react";
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

export default function ProjectForm({
  clients,
  createProject,
}: ProjectFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [steps, setSteps] = useState<string[]>([
    "Get Clips",
    "Edit/Cut",
    "Color",
  ]);
  const [newStep, setNewStep] = useState<string>("");
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);
  const [editingStepValue, setEditingStepValue] = useState<string>("");
  const router = useRouter();

  const handleAddStep = () => {
    if (!newStep.trim()) {
      toast({
        title: "Error",
        description: "Step name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setSteps([...steps, newStep.trim()]);
    setNewStep("");
  };

  const handleRemoveStep = (index: number) => {
    // Don't allow removing if it's the last step
    if (steps.length === 1) {
      toast({
        title: "Error",
        description: "You need at least one step for the workflow",
        variant: "destructive",
      });
      return;
    }

    const newSteps = [...steps];
    newSteps.splice(index, 1);
    setSteps(newSteps);
  };

  const handleEditStep = (index: number) => {
    setEditingStepIndex(index);
    setEditingStepValue(steps[index]);
  };

  const handleSaveStepEdit = () => {
    if (editingStepIndex === null) return;

    if (!editingStepValue.trim()) {
      toast({
        title: "Error",
        description: "Step name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    const newSteps = [...steps];
    newSteps[editingStepIndex] = editingStepValue.trim();
    setSteps(newSteps);
    setEditingStepIndex(null);
    setEditingStepValue("");
  };

  const handleMoveStepUp = (index: number) => {
    if (index === 0) return; // Already at the top

    const newSteps = [...steps];
    [newSteps[index - 1], newSteps[index]] = [
      newSteps[index],
      newSteps[index - 1],
    ];
    setSteps(newSteps);
  };

  const handleMoveStepDown = (index: number) => {
    if (index === steps.length - 1) return; // Already at the bottom

    const newSteps = [...steps];
    [newSteps[index], newSteps[index + 1]] = [
      newSteps[index + 1],
      newSteps[index],
    ];
    setSteps(newSteps);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedClient) {
      toast({
        title: "Error",
        description: "Please select a client",
        variant: "destructive",
      });
      return;
    }

    if (steps.length === 0) {
      toast({
        title: "Error",
        description: "You need at least one step for the workflow",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("client_id", selectedClient);

    // Convert steps to the format needed by the server
    // Always add Finish as the last step
    const workflowSteps = [...steps];

    const formattedSteps = workflowSteps.map((step) => ({
      name: step,
      status: "pending",
    }));

    // Add the Finish step at the end
    formattedSteps.push({
      name: "Finish",
      status: "pending",
      deliverable_link: null,
    });

    formData.set("steps", JSON.stringify(formattedSteps));

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
          <div className="space-y-4">
            <div>
              <Label htmlFor="client">Client</Label>
              <Select
                value={selectedClient}
                onValueChange={setSelectedClient}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="title">Project Title</Label>
              <Input
                type="text"
                id="title"
                name="title"
                placeholder="Enter project title"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Project description..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="deadline">Deadline (Optional)</Label>
              <Input type="date" id="deadline" name="deadline" />
            </div>
          </div>

          {/* Workflow Steps Section */}
          <div className="border-t pt-4">
            <Label className="mb-2 block">Workflow Steps</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Define the steps before the final "Finish" step. You can reorder
              steps using the arrow buttons.
            </p>

            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center gap-2">
                  {editingStepIndex === index ? (
                    <div className="flex-1 flex gap-2">
                      <Input
                        value={editingStepValue}
                        onChange={(e) => setEditingStepValue(e.target.value)}
                        autoFocus
                      />
                      <RevButtons
                        variant="outline"
                        onClick={handleSaveStepEdit}
                        size="sm"
                      >
                        Save
                      </RevButtons>
                    </div>
                  ) : (
                    <div className="flex-1 p-2 border rounded-md flex justify-between items-center">
                      <span>{step}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveStepUp(index)}
                          className="text-gray-500 hover:text-gray-700 p-1"
                          disabled={index === 0}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="m18 15-6-6-6 6" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveStepDown(index)}
                          className="text-gray-500 hover:text-gray-700 p-1"
                          disabled={index === steps.length - 1}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditStep(index)}
                          className="text-blue-500 hover:text-blue-700 p-1"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveStep(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={newStep}
                  onChange={(e) => setNewStep(e.target.value)}
                  placeholder="Add a new step..."
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

              {/* Preview of steps with Finish */}
              <div className="mt-6 border-t pt-4">
                <p className="text-sm font-medium mb-2">
                  Project Workflow Preview:
                </p>
                <div className="relative flex items-center justify-between mt-4">
                  {steps.map((step, index) => (
                    <React.Fragment key={index}>
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <span className="text-xs mt-1 max-w-[80px] text-center">
                          {step}
                        </span>
                      </div>
                      {index < steps.length - 1 && (
                        <div className="flex-1 h-0.5 bg-gray-200"></div>
                      )}
                    </React.Fragment>
                  ))}

                  {/* Finish step */}
                  <div className="flex-1 h-0.5 bg-gray-200"></div>
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      ✓
                    </div>
                    <span className="text-xs mt-1">Finish</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <RevButtons
            type="submit"
            variant="success"
            disabled={
              isLoading ||
              !selectedClient ||
              steps.length === 0 ||
              editingStepIndex !== null
            }
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
