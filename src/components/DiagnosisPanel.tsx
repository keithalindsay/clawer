"use client";

interface DiagnosticIssue {
  id: string;
  severity: "warning" | "error" | "critical";
  title: string;
  description: string;
  cause: string;
  autoFixable: boolean;
  autoFixAction: string | null;
  manualSteps: string[];
  confidence: number;
}

interface DiagnosticResult {
  status: "healthy" | "degraded" | "unhealthy" | "error";
  issues: DiagnosticIssue[];
  containerHealth: {
    status: string;
    uptime: string | null;
    lastHealthCheck: string;
    apiResponsive: boolean;
    memoryUsage: string | null;
    cpuUsage: string | null;
  };
  recommendation: string;
  diagnosisId: string;
  timestamp: string;
}

interface DiagnosisPanelProps {
  loading: boolean;
  result: DiagnosticResult | null;
  error: string | null;
  onClose: () => void;
  onAutoFix: (action: string) => void;
}

export function DiagnosisPanel({
  loading,
  result,
  error,
  onClose,
  onAutoFix,
}: DiagnosisPanelProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-50 border-red-200";
      case "error":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "warning":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600 bg-green-50";
      case "degraded":
        return "text-yellow-600 bg-yellow-50";
      case "unhealthy":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case "healthy":
        return "✅";
      case "degraded":
        return "⚠️";
      case "unhealthy":
        return "❌";
      default:
        return "❓";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {loading ? "Diagnosing..." : "Diagnosis Results"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Checking your AI assistant...</p>
              <p className="text-sm text-gray-400 mt-2">This usually takes 2-5 seconds</p>
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-700 font-medium">Diagnosis Failed</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}

          {result && !loading && (
            <>
              {/* Status Banner */}
              <div
                className={`rounded-xl p-4 mb-6 ${getStatusColor(result.status)}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getStatusEmoji(result.status)}</span>
                  <div>
                    <p className="font-semibold capitalize">{result.status}</p>
                    <p className="text-sm opacity-80">{result.recommendation}</p>
                  </div>
                </div>
              </div>

              {/* Issues List */}
              {result.issues.length > 0 ? (
                <div className="space-y-4 mb-6">
                  <h3 className="font-medium text-gray-900">
                    Issues Found ({result.issues.length})
                  </h3>
                  {result.issues.map((issue) => (
                    <div
                      key={issue.id}
                      className={`rounded-xl border p-4 ${getSeverityColor(issue.severity)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{issue.title}</p>
                          <p className="text-sm mt-1 opacity-80">{issue.description}</p>
                        </div>
                        <span className="text-xs uppercase font-medium px-2 py-1 rounded-full bg-white/50">
                          {issue.severity}
                        </span>
                      </div>

                      {issue.cause && (
                        <p className="text-sm mt-2 opacity-70">
                          <strong>Cause:</strong> {issue.cause}
                        </p>
                      )}

                      {issue.manualSteps.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium">Steps to fix:</p>
                          <ul className="text-sm list-disc list-inside mt-1 opacity-80">
                            {issue.manualSteps.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {issue.autoFixable && issue.autoFixAction && (
                        <button
                          onClick={() => onAutoFix(issue.autoFixAction!)}
                          className="mt-3 px-4 py-2 bg-white text-current rounded-lg font-medium hover:bg-white/80 transition-colors text-sm"
                        >
                          🔧 Fix Automatically
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p>No issues detected! 🎉</p>
                </div>
              )}

              {/* Container Health */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-medium text-gray-900 mb-3">Container Health</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className="ml-2 font-medium capitalize">
                      {result.containerHealth.status}
                    </span>
                  </div>
                  {result.containerHealth.uptime && (
                    <div>
                      <span className="text-gray-500">Uptime:</span>
                      <span className="ml-2 font-medium">
                        {result.containerHealth.uptime}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">API:</span>
                    <span className="ml-2 font-medium">
                      {result.containerHealth.apiResponsive ? "✅ Responsive" : "❌ Unresponsive"}
                    </span>
                  </div>
                  {result.containerHealth.memoryUsage && (
                    <div>
                      <span className="text-gray-500">Memory:</span>
                      <span className="ml-2 font-medium">
                        {result.containerHealth.memoryUsage}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t text-center">
                <p className="text-xs text-gray-400">
                  Diagnosis ID: {result.diagnosisId}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Still having issues?{" "}
                  <a href="mailto:support@clawer.ai" className="text-blue-600 hover:underline">
                    Contact Support
                  </a>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
