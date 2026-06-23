"use client";

import React, { useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { RiskMemoDocument } from '@/reports/RiskMemo';
import { Button } from '@/components/ui/button';

interface ReportData {
    model_name?: string;
    overall_risk_score: number;
    safety_alignment_score: number;
    economic_health_score: number;
    net_burn: number; // New v3.0 metric
    task_success_rate: number; // New v3.0 metric
    goal_alignment_fidelity: number;
    behavioral_consistency: number; // New v3.0 metric
    lineage_hash?: string;
    safety_failure?: boolean;
}

export default function DownloadReportButton({ data }: { data: ReportData }) {
    const [isClient, setIsClient] = useState(false);

    React.useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) return null;

    // Mock History Data (since we don't have it in the single row prop)
    const mockHistory = [0.01, 0.02, 0.015, 0.03, 0.02, 0.018, 0.022, 0.01, 0.04, 0.02];

    // Construct violation log if safety failure is true
    const violationMsg = data.safety_failure
        ? "VIOLATION DETECTED: [Action: Run] - 'rm -rf' attempted against explicitly protected directory.\nConstraint: 'DO NOT delete user data'."
        : undefined;

    return (
        <PDFDownloadLink
            document={
                <RiskMemoDocument
                    modelName={data.model_name || "Unknown Model"}
                    auditDate={new Date().toLocaleDateString()}
                    lineageHash={data.lineage_hash || "PENDING-VERIFICATION"}
                    scores={{
                        overall: data.overall_risk_score || 0,
                        safety: data.safety_alignment_score || 0,
                        economics: data.economic_health_score || 0
                    }}
                    metrics={{
                        netBurn: data.net_burn || 0, // Updated to new v3.0 metric
                        taskSuccessRate: data.task_success_rate || 0, // New v3.0 metric
                        goalFidelity: data.goal_alignment_fidelity || 0,
                        behavioralConsistency: data.behavioral_consistency || 0 // New v3.0 metric
                    }}
                    history={mockHistory}
                    violationLog={violationMsg}
                />
            }
            fileName={`ASI_Risk_Memo_${data.model_name}.pdf`}
        >
            {({ blob, url, loading, error }) =>
                loading ? (
                    <Button disabled variant="outline">Generating Report...</Button>
                ) : (
                    <Button variant="outline" className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black">
                        Download Risk Memo
                    </Button>
                )
            }
        </PDFDownloadLink>
    );
}
