"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AttestBatchModalProps {
  open: boolean;
  onClose: () => void;
  batch: any;
  onSubmit: (steps: AttestationStep[]) => Promise<void>;
  onAttestStep?: (step: AttestationStep, stepIndex: number, onProgress?: (msg: string) => void) => Promise<void>;
}

export interface AttestationStep {
  role: string;
  roleLabel: string;
  note: string;
  completed: boolean;
}

const STEP_ROLES = [
  { role: "1", label: "Manufacturer" },
  { role: "2", label: "Distributor" },
  { role: "3", label: "Retailer" },
];

export default function AttestBatchModal({
  open,
  onClose,
  batch,
  onSubmit,
  onAttestStep,
}: AttestBatchModalProps) {
  const [steps, setSteps] = useState<AttestationStep[]>([
    { role: "1", roleLabel: "Manufacturer", note: "", completed: false },
    { role: "2", roleLabel: "Distributor", note: "", completed: false },
    { role: "3", roleLabel: "Retailer", note: "", completed: false },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");

  // Initialize steps based on completed attestations
  React.useEffect(() => {
    if (open && batch?.completedSteps) {
      const newSteps = [...steps];
      let nextStep = 0;
      
      if (batch.completedSteps.manufacturer) {
        newSteps[0].completed = true;
        nextStep = 1;
      }
      if (batch.completedSteps.distributor) {
        newSteps[1].completed = true;
        nextStep = 2;
      }
      if (batch.completedSteps.retailer) {
        newSteps[2].completed = true;
        nextStep = 2; // Keep at last step if all complete
      }
      
      setSteps(newSteps);
      setCurrentStep(nextStep);
    } else if (open) {
      // Reset to initial state
      setSteps([
        { role: "1", roleLabel: "Manufacturer", note: "", completed: false },
        { role: "2", roleLabel: "Distributor", note: "", completed: false },
        { role: "3", roleLabel: "Retailer", note: "", completed: false },
      ]);
      setCurrentStep(0);
    }
  }, [open, batch]);

  const handleStepChange = (index: number, field: "role" | "note", value: string) => {
    const newSteps = [...steps];
    newSteps[index][field] = value;
    setSteps(newSteps);
    setError("");
  };

  const handleCompleteStep = async (index: number) => {
    if (!steps[index].note) {
      setError(`Please enter a note for ${steps[index].roleLabel}`);
      return;
    }
    
    setIsLoading(true);
    setError("");
    setProgressMessage("");
    
    try {
      // Attest all NFTs in the batch for this step
      if (onAttestStep) {
        await onAttestStep(steps[index], index, (msg: string) => {
          setProgressMessage(msg);
        });
      }
      
      const newSteps = [...steps];
      newSteps[index].completed = true;
      setSteps(newSteps);
      setProgressMessage("");
      
      if (index < 2) {
        setCurrentStep(index + 1);
      }
    } catch (error: any) {
      setError(error.message || `Failed to complete Step ${index + 1}`);
      setProgressMessage("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditStep = (index: number) => {
    // Don't allow editing if step was completed in database
    const isFromDatabase = 
      (index === 0 && batch?.completedSteps?.manufacturer) ||
      (index === 1 && batch?.completedSteps?.distributor) ||
      (index === 2 && batch?.completedSteps?.retailer);
    
    if (isFromDatabase) {
      setError("Cannot edit steps that are already saved in the database");
      return;
    }
    
    const newSteps = [...steps];
    newSteps[index].completed = false;
    setSteps(newSteps);
    setCurrentStep(index);
  };

  const canCompleteStep = (index: number) => {
    if (index === 0) return true;
    return steps[index - 1].completed;
  };

  const allStepsCompleted = steps.every(step => step.completed);

  const handleSubmit = async () => {
    if (!allStepsCompleted) {
      setError("Please complete all three steps");
      return;
    }

    try {
      await onSubmit(steps);
    } catch (err: any) {
      setError(err.message || "Failed to finish");
      return;
    }
    
    onClose();
    // Reset state
    setSteps([
      { role: "1", roleLabel: "Manufacturer", note: "", completed: false },
      { role: "2", roleLabel: "Distributor", note: "", completed: false },
      { role: "3", roleLabel: "Retailer", note: "", completed: false },
    ]);
    setCurrentStep(0);
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      // Reset state
      setSteps([
        { role: "1", roleLabel: "Manufacturer", note: "", completed: false },
        { role: "2", roleLabel: "Distributor", note: "", completed: false },
        { role: "3", roleLabel: "Retailer", note: "", completed: false },
      ]);
      setCurrentStep(0);
      setError("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Attest Batch - {batch?.uid}</DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            This will attest the batch through 3 supply chain steps (Manufacturer, Distributor, Retailer).
          </p>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="mb-8">
          {/* Circles and connectors */}
          <div className="flex items-center mb-2">
            {[0, 1, 2].map((index) => (
              <React.Fragment key={index}>
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg flex-shrink-0 ${
                    steps[index].completed
                      ? "bg-emerald-600 text-white"
                      : index === currentStep
                      ? "bg-emerald-100 text-emerald-600 border-2 border-emerald-600"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {steps[index].completed ? "✓" : index + 1}
                </div>
                {index < 2 && (
                  <div 
                    className="h-1 flex-1 mx-4 rounded-full" 
                    style={{ 
                      backgroundColor: steps[index].completed ? "#059669" : "#e5e7eb"
                    }} 
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          {/* Labels */}
          <div className="flex">
            {STEP_ROLES.map((stepRole, index) => (
              <React.Fragment key={index}>
                <div className="w-12 flex justify-center">
                  <span className="text-xs text-gray-600 font-medium whitespace-nowrap">{stepRole.label}</span>
                </div>
                {index < 2 && <div className="flex-1 mx-4" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {progressMessage && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4">
            {progressMessage}
          </div>
        )}

        {/* Steps */}
        <div className="space-y-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${
                !canCompleteStep(index)
                  ? "bg-gray-50 opacity-60"
                  : step.completed
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{step.roleLabel}</h3>
                {step.completed && (() => {
                  const isFromDatabase = 
                    (index === 0 && batch?.completedSteps?.manufacturer) ||
                    (index === 1 && batch?.completedSteps?.distributor) ||
                    (index === 2 && batch?.completedSteps?.retailer);
                  
                  return !isFromDatabase ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditStep(index)}
                      disabled={isLoading}
                    >
                      Edit
                    </Button>
                  ) : (
                    <span className="text-xs text-green-600 font-medium">
                      ✓ Saved
                    </span>
                  );
                })()}
              </div>

              {step.completed ? (
                <div className="space-y-2">
                  {step.note ? (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Note: </span>
                      <span className="text-sm text-gray-900">{step.note}</span>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic">
                      Completed (saved in database)
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor={`note-${index}`}>Note</Label>
                    <Textarea
                      id={`note-${index}`}
                      value={step.note}
                      onChange={(e) => handleStepChange(index, "note", e.target.value)}
                      placeholder={`Enter ${step.roleLabel.toLowerCase()} attestation note`}
                      disabled={!canCompleteStep(index) || isLoading}
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={() => handleCompleteStep(index)}
                    disabled={!canCompleteStep(index) || isLoading || !step.note}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></span>
                        Attesting NFTs...
                      </>
                    ) : (
                      `Complete ${step.roleLabel}`
                    )}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!allStepsCompleted || isLoading}
          >
            Finish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 