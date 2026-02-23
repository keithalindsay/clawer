"use client";

import { useState } from "react";
import { motion } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────

interface SecurityAlert {
  id: string;
  icon: string;
  title: string;
  description: string;
  example: string;
  enabled: boolean;
}

interface SecuritySetupProps {
  onComplete: () => void;
  onSkip: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────

const DEFAULT_ALERTS: SecurityAlert[] = [
  {
    id: "intrusion",
    icon: "🔒",
    title: "Intrusion Detection",
    description: "Monitors SSH login attempts and blocks suspicious activity automatically.",
    example: "🔒 5 failed SSH login attempts from 192.168.1.100 detected. IP has been blocked.",
    enabled: true,
  },
  {
    id: "health",
    icon: "💾",
    title: "System Health",
    description: "Tracks disk space and container health. Alerts before issues become critical.",
    example: "🟡 WARNING: Disk usage at 85%. Consider cleaning up old files.",
    enabled: true,
  },
  {
    id: "audit",
    icon: "🔍",
    title: "Daily Security Audit",
    description: "Reviews configuration changes and scans for vulnerabilities every morning.",
    example: "✅ Daily audit complete. No unauthorized changes detected.",
    enabled: true,
  },
];

// ─── Component ────────────────────────────────────────────────────────────

export function SecuritySetup({ onComplete, onSkip }: SecuritySetupProps) {
  const [alerts, setAlerts] = useState<SecurityAlert[]>(DEFAULT_ALERTS);
  const [setupComplete, setSetupComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleAlert = (alertId: string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId ? { ...alert, enabled: !alert.enabled } : alert
      )
    );
  };

  const handleEnableProtection = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/dashboard/alerts/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to setup alerts');
      }

      setSetupComplete(true);
      
      // Auto-advance after brief success message
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (err: any) {
      console.error('Security setup error:', err);
      setError(err.message || 'Failed to enable protection');
    } finally {
      setIsLoading(false);
    }
  };

  const enabledCount = alerts.filter(a => a.enabled).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          🛡️ Protect Your Instance
        </h2>
        <p className="text-gray-500 text-sm">
          Enable security monitoring in one click. These alerts run automatically
          and notify you of any issues.
        </p>
      </div>

      {/* Alert Cards */}
      <div className="space-y-3">
        {alerts.map((alert) => (
          <button
            key={alert.id}
            onClick={() => !setupComplete && toggleAlert(alert.id)}
            disabled={setupComplete}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
              alert.enabled
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            } ${setupComplete ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">{alert.icon}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                  <div
                    className={`w-10 h-5 rounded-full transition-colors ${
                      alert.enabled ? 'bg-green-500' : 'bg-gray-300'
                    } relative`}
                  >
                    <motion.div
                      className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
                      animate={{ left: alert.enabled ? '20px' : '2px' }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                
                {/* Example notification */}
                <div className="bg-white border border-gray-200 rounded-lg p-2 text-xs text-gray-700">
                  <span className="text-gray-400">Example alert:</span>
                  <div className="mt-1 font-mono text-xs">{alert.example}</div>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Alert Preview Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <span className="text-lg">📱</span>
          <div className="flex-1 text-sm">
            <p className="text-blue-900 font-medium mb-1">
              Alerts are delivered via your configured channels
            </p>
            <p className="text-blue-700">
              You'll receive notifications through WhatsApp, Telegram, or whatever
              messaging platform you've connected to Clawer.
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <p className="font-medium">Setup failed</p>
          <p className="mt-1">{error}</p>
          <p className="mt-2 text-xs text-red-600">
            You can configure alerts later from the dashboard settings.
          </p>
        </div>
      )}

      {/* Success State */}
      {setupComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-50 border-2 border-green-500 rounded-xl p-6 text-center"
        >
          <div className="text-4xl mb-2">✅</div>
          <h3 className="text-lg font-semibold text-green-900 mb-1">
            Protection Enabled!
          </h3>
          <p className="text-sm text-green-700">
            Your instance is now being monitored 24/7
          </p>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!setupComplete && (
          <>
            <button
              onClick={onSkip}
              disabled={isLoading}
              className="flex-1 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Skip for now
            </button>
            <button
              onClick={handleEnableProtection}
              disabled={isLoading || enabledCount === 0}
              className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                enabledCount > 0 && !isLoading
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="inline-block"
                  >
                    ⚙️
                  </motion.span>
                  Enabling...
                </span>
              ) : (
                `Enable Protection (${enabledCount})`
              )}
            </button>
          </>
        )}
      </div>

      {/* Skip Note */}
      {!setupComplete && (
        <p className="text-center text-xs text-gray-400">
          You can configure individual alerts later in Dashboard → Settings
        </p>
      )}
    </div>
  );
}
