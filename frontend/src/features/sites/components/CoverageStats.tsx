import { useQuery } from '@tanstack/react-query';
import { fetchCoverageStats, CoverageStats as CoverageStatsType } from '../api';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface CoverageStatsProps {
  siteId: string;
}

export default function CoverageStats({ siteId }: CoverageStatsProps) {
  const { data: coverage, isLoading } = useQuery({
    queryKey: ['coverage-stats', siteId],
    queryFn: () => fetchCoverageStats(siteId),
    staleTime: 30000, // 30 seconds
  });

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-5 border border-green-100 animate-pulse">
        <div className="h-6 bg-green-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-green-200 rounded w-full"></div>
          <div className="h-4 bg-green-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!coverage) {
    return null;
  }

  // Status-basierte Farben
  const statusColors = {
    OK: {
      bg: 'from-green-50 to-emerald-50',
      border: 'border-green-100',
      text: 'text-green-900',
      badgeBg: 'bg-green-100',
      badgeText: 'text-green-800',
      icon: CheckCircle2,
      iconColor: 'text-green-600',
    },
    WARNING: {
      bg: 'from-yellow-50 to-amber-50',
      border: 'border-yellow-100',
      text: 'text-yellow-900',
      badgeBg: 'bg-yellow-100',
      badgeText: 'text-yellow-800',
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
    },
    CRITICAL: {
      bg: 'from-red-50 to-rose-50',
      border: 'border-red-100',
      text: 'text-red-900',
      badgeBg: 'bg-red-100',
      badgeText: 'text-red-800',
      icon: XCircle,
      iconColor: 'text-red-600',
    },
  };

  const statusConfig = statusColors[coverage.status];
  const StatusIcon = statusConfig.icon;

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      OBJEKTLEITER: 'Objektleiter',
      SCHICHTLEITER: 'Schichtleiter',
      MITARBEITER: 'Mitarbeiter',
    };
    return labels[role] || role;
  };

  const getRoleIcon = (percentage: number) => {
    if (percentage >= 80) return '✅';
    if (percentage >= 50) return '⚠️';
    return '❌';
  };

  return (
    <div className={`bg-gradient-to-br ${statusConfig.bg} rounded-lg p-5 border ${statusConfig.border}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${statusConfig.text} flex items-center gap-2`}>
          <StatusIcon size={20} className={statusConfig.iconColor} />
          Personalauslastung
        </h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.badgeBg} ${statusConfig.badgeText}`}>
          {coverage.coveragePercentage}% Abdeckung
        </span>
      </div>

      {/* Gesamtübersicht */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Zugewiesen: <span className="font-bold">{coverage.assignedStaff}</span> von{' '}
            <span className="font-bold">{coverage.requiredStaff}</span> MA
          </span>
          <span
            className={`text-xs font-semibold px-2 py-1 rounded ${statusConfig.badgeBg} ${statusConfig.badgeText}`}
          >
            {coverage.status}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 transition-all duration-500 ${
              coverage.status === 'OK'
                ? 'bg-green-500'
                : coverage.status === 'WARNING'
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(coverage.coveragePercentage, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Breakdown nach Rollen */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Breakdown nach Rollen:</h4>
        {coverage.breakdown.map((roleData) => (
          <div key={roleData.role} className="bg-white/50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <span>{getRoleIcon(roleData.percentage)}</span>
                {getRoleLabel(roleData.role)}
              </span>
              <span className="text-xs text-gray-600">
                {roleData.assigned} / {roleData.required}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 transition-all duration-300 ${
                  roleData.percentage >= 80
                    ? 'bg-green-500'
                    : roleData.percentage >= 50
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(roleData.percentage, 100)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Warnung bei kritischer Abdeckung */}
      {coverage.status === 'CRITICAL' && (
        <div className="mt-4 bg-red-100 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800 font-medium flex items-center gap-2">
            <XCircle size={16} />
            Kritische Personalunterdeckung! Bitte dringend weitere Mitarbeiter zuweisen.
          </p>
        </div>
      )}

      {/* Warnung bei Warning-Status */}
      {coverage.status === 'WARNING' && (
        <div className="mt-4 bg-yellow-100 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800 font-medium flex items-center gap-2">
            <AlertTriangle size={16} />
            Personalbesetzung unvollständig. Weitere Mitarbeiter empfohlen.
          </p>
        </div>
      )}
    </div>
  );
}
