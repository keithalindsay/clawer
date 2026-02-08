"use client";

import { useState } from "react";
import { DiagnosisPanel } from "./DiagnosisPanel";

interface DiagnoseButtonProps {
  variant?: "icon" | "full";
  className?: string;
}

export function DiagnoseButton({ variant = "full", className = "" }: DiagnoseButtonProps) {
  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runDiagnosis = async () => {
    setLoading(true);
    setError(null);
    setShowPanel(true);

    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Diagnosis failed");
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFix = async (action: string) => {
    // TODO: Implement auto-fix actions
    console.log("Auto-fix action:", action);
    // After fix, re-run diagnosis
    await runDiagnosis();
  };

  if (variant === "icon") {
    return (
      <>
        <button
          onClick={runDiagnosis}
          className={`p-2 text-gray-400 hover:text-gray-600 transition-colors ${className}`}
          title="Get Help"
        >
          🔧
        </button>
        {showPanel && (
          <DiagnosisPanel
            loading={loading}
            result={result}
            error={error}
            onClose={() => setShowPanel(false)}
            onAutoFix={handleAutoFix}
          />
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={runDiagnosis}
        className={`flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors ${className}`}
      >
        <span>🔧</span>
        <span>Get Help</span>
      </button>
      {showPanel && (
        <DiagnosisPanel
          loading={loading}
          result={result}
          error={error}
          onClose={() => setShowPanel(false)}
          onAutoFix={handleAutoFix}
        />
      )}
    </>
  );
}
