"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AttestationRecord {
  attester: string;
  value: string;
  role: string;
  note: string;
  timestamp: string;
  date: string;
}

interface AttestationRecordsModalProps {
  open: boolean;
  onClose: () => void;
  batch: any;
}

export default function AttestationRecordsModal({
  open,
  onClose,
  batch,
}: AttestationRecordsModalProps) {
  const [attestations, setAttestations] = useState<AttestationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && batch) {
      fetchAttestations();
    }
  }, [open, batch]);

  const fetchAttestations = async () => {
    if (!batch?.batch_range_logs?.[0]?.nft_token_id) {
      setError("No NFT token ID found for this batch");
      return;
    }

    let tokenId = batch.batch_range_logs[0].nft_token_id;
    
    // Skip wallet addresses (40 hex chars = Ethereum address)
    if (tokenId.startsWith('0x') && tokenId.length === 42) {
      setError("Invalid token ID (appears to be a wallet address)");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch(`/api/attest-nft?tokenId=${tokenId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch attestations');
      }
      
      setAttestations(data.attestations || []);
    } catch (err: any) {
      console.error('Failed to fetch attestations:', err);
      setError(err.message || 'Failed to fetch attestations');
      setAttestations([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Attestation Records - {batch?.uid}</DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            NFT Token ID: {batch?.batch_range_logs?.[0]?.nft_token_id}
          </p>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <span className="ml-3 text-gray-600">Loading attestations...</span>
          </div>
        ) : attestations.length > 0 ? (
          <div className="space-y-4">
            {attestations.map((attestation, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{attestation.role}</h3>
                      <p className="text-xs text-gray-500">{attestation.date}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Attester: </span>
                    <span className="text-gray-900 font-mono text-xs">
                      {attestation.attester}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Note: </span>
                    <span className="text-gray-900">{attestation.note}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No attestations found for this batch
          </div>
        )}

        <div className="flex justify-end mt-4">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 