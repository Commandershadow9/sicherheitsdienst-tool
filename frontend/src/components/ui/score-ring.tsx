/**
 * ScoreRing - Kreis-Chart für Scoring-Anzeige (0-100)
 * v1.8.0 - Intelligent Replacement System
 */

type ScoreRingProps = {
  score: number // 0-100
  color: 'green' | 'yellow' | 'orange' | 'red'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const COLOR_MAP = {
  green: '#10b981', // emerald-500
  yellow: '#f59e0b', // amber-500
  orange: '#f97316', // orange-500
  red: '#ef4444', // red-500
}

const SIZE_MAP = {
  sm: { radius: 20, strokeWidth: 4, fontSize: '12px' },
  md: { radius: 32, strokeWidth: 6, fontSize: '16px' },
  lg: { radius: 48, strokeWidth: 8, fontSize: '20px' },
}

export function ScoreRing({ score, color, size = 'md', showLabel = true }: ScoreRingProps) {
  const { radius, strokeWidth, fontSize } = SIZE_MAP[size]
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference
  const viewBoxSize = (radius + strokeWidth) * 2

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={viewBoxSize} height={viewBoxSize} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        {/* Score circle */}
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          fill="none"
          stroke={COLOR_MAP[color]}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
        {/* Score text */}
        <text
          x={radius + strokeWidth}
          y={radius + strokeWidth}
          textAnchor="middle"
          dominantBaseline="middle"
          className="transform rotate-90"
          style={{ fontSize, fontWeight: 600, fill: COLOR_MAP[color] }}
        >
          {Math.round(score)}
        </text>
      </svg>
      {showLabel && <span className="text-xs text-gray-600 font-medium">Score</span>}
    </div>
  )
}
