"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateBatchModalProps {
  open: boolean;
  onClose: () => void;
  productId: number;
  onSubmit: (payload: any) => void;
}

export default function CreateBatchModal({
  open,
  onClose,
  productId,
  onSubmit,
}: CreateBatchModalProps) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [uid, setUid] = useState("");
  const [totalUnits, setTotalUnits] = useState("");

  const [errors, setErrors] = useState({
    start: "",
    end: "",
    uid: "",
    totalUnits: "",
  });

  const handleSubmit = () => {
    const newErrors = {
      start: !start ? "Start code is required" : "",
      end: !end ? "End code is required" : "",
      uid: !uid ? "UID is required" : "",
      totalUnits: !totalUnits ? "Total units is required" : "",
    };

    setErrors(newErrors);

    // if any error exists, stop submit
    if (Object.values(newErrors).some((err) => err !== "")) {
      return;
    }

    const payload = {
      start,
      end,
      total_units: Number(totalUnits),
      uid,
      product_id: productId,
    };

    onSubmit(payload);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Batch</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Start */}
          <div>
            <Label className="mb-2 block" htmlFor="start">
              Start
            </Label>
            <Input
              id="start"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              placeholder="Enter start code"
            />
            {errors.start && (
              <p className="text-sm text-red-500 mt-1">{errors.start}</p>
            )}
          </div>

          {/* End */}
          <div>
            <Label className="mb-2 block" htmlFor="end">
              End
            </Label>
            <Input
              id="end"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              placeholder="Enter end code"
            />
            {errors.end && (
              <p className="text-sm text-red-500 mt-1">{errors.end}</p>
            )}
          </div>

          {/* UID */}
          <div>
            <Label className="mb-2 block" htmlFor="uid">
              UID
            </Label>
            <Input
              id="uid"
              type="text"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              placeholder="Enter UID"
            />
            {errors.uid && (
              <p className="text-sm text-red-500 mt-1">{errors.uid}</p>
            )}
          </div>

          {/* Total Units */}
          <div>
            <Label className="mb-2 block" htmlFor="total">
              Total Units
            </Label>
            <Input
              id="total"
              type="number"
              value={totalUnits}
              onChange={(e) => setTotalUnits(e.target.value)}
              placeholder="Enter total units"
            />
            {errors.totalUnits && (
              <p className="text-sm text-red-500 mt-1">{errors.totalUnits}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
