"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface SecurityStatus {
  configured: boolean;
  alertCount: number;
}

export function SecurityBadge() {
  const [status, setStatus] = useState<SecurityStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecurityStatus();
  }, []);

  const fetchSecurityStatus = async () => {
    try {
      const response = await fetch('/api/dashboard/alerts/setup/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch security status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse" />
          <div className="flex-1">
            <div className="h-4 bg-gray-100 rounded w-24 mb-2 animate-pulse" />
            <div className="h-3 bg-gray-100 rounded w-32 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const getShieldIcon = () => {
    if (status.configured && status.alertCount >= 5) {
      return "🛡️"; // Green shield - all configured
    } else if (status.alertCount > 0) {
      return "🟡"; // Yellow shield - some configured
    } else {
      return "🔴"; // Red shield - none configured
    }
  };

  const getStatusColor = () => {
    if (status.configured && status.alertCount >= 5) {
      return {
        bg: "bg-green-50",
        border: "border-green-200",
        text: "text-green-900",
        badge: "bg-green-100 text-green-700",
      };
    } else if (status.alertCount > 0) {
      return {
        bg: "bg-yellow-50",
        border: "border-yellow-200",
        text: "text-yellow-900",
        badge: "bg-yellow-100 text-yellow-700",
      };
    } else {
      return {
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-900",
        badge: "bg-red-100 text-red-700",
      };
    }
  };

  const getStatusText = () => {
    if (status.configured && status.alertCount >= 5) {
      return "Protected";
    } else if (status.alertCount > 0) {
      return "Partial";
    } else {
      return "Unprotected";
    }
  };

  const getStatusMessage = () => {
    if (status.configured && status.alertCount >= 5) {
      return `${status.alertCount} security alerts monitoring your instance`;
    } else if (status.alertCount > 0) {
      return `Only ${status.alertCount} of 5 recommended alerts enabled`;
    } else {
      return "No security monitoring configured";
    }
  };

  const colors = getStatusColor();

  return (
    <Link
      href="/dashboard/settings#security"
      className={`block bg-white rounded-xl border ${colors.border} p-5 shadow-sm hover:shadow-md transition-all group`}
    >
      <div className="flex items-start gap-3">
        <motion.div
          className="text-3xl"
          animate={
            status.configured && status.alertCount >= 5
              ? { scale: [1, 1.1, 1] }
              : {}
          }
          transition={
            status.configured && status.alertCount >= 5
              ? { duration: 2, repeat: Infinity, repeatDelay: 3 }
              : {}
          }
        >
          {getShieldIcon()}
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
              Security Status
            </h3>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${colors.badge}`}
            >
              {getStatusText()}
            </span>
          </div>
          <p className={`text-xs ${colors.text}`}>
            {getStatusMessage()}
          </p>
          {!status.configured && (
            <div className="mt-3 text-xs font-medium text-orange-600 group-hover:text-orange-700 flex items-center gap-1">
              Enable protection
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
