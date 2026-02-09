'use client';

interface SystemHealthProps {
  health: {
    cpuPercent: number;
    memoryPercent: number;
    diskPercent: number;
    totalContainers: number;
  };
}

export function SystemHealth({ health }: SystemHealthProps) {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900 mb-6">System Health</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <HealthMetric
          label="CPU Usage"
          value={health.cpuPercent}
          max={100}
          unit="%"
          warning={70}
          critical={90}
        />
        <HealthMetric
          label="Memory Usage"
          value={health.memoryPercent}
          max={100}
          unit="%"
          warning={80}
          critical={95}
        />
        <HealthMetric
          label="Disk Usage"
          value={health.diskPercent}
          max={100}
          unit="%"
          warning={70}
          critical={85}
        />
        <HealthMetric
          label="Total Containers"
          value={health.totalContainers}
          max={100}
          unit=""
          warning={80}
          critical={95}
          showBar={false}
        />
      </div>
    </div>
  );
}

function HealthMetric({
  label,
  value,
  max,
  unit,
  warning,
  critical,
  showBar = true,
}: {
  label: string;
  value: number;
  max: number;
  unit: string;
  warning: number;
  critical: number;
  showBar?: boolean;
}) {
  const percent = (value / max) * 100;
  const isCritical = value >= critical;
  const isWarning = value >= warning && !isCritical;
  const isHealthy = !isCritical && !isWarning;

  const color = isCritical
    ? 'bg-red-500'
    : isWarning
    ? 'bg-yellow-500'
    : 'bg-green-500';

  const textColor = isCritical
    ? 'text-red-600'
    : isWarning
    ? 'text-yellow-600'
    : 'text-green-600';

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className={`text-lg font-bold ${textColor}`}>
          {value}{unit}
        </span>
      </div>
      {showBar && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${color}`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
