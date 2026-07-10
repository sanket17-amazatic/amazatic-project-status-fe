import { PieChart, Pie, Cell } from 'recharts'
import type { IncidentStats } from '@/hooks/useIncidents'

const COLORS = {
  Critical: '#042050',
  High: '#0d428c',
  Medium: '#45ae73',
  Low: '#bae2c9',
} as const

interface IncidentsByPriorityCardProps {
  breakdown: IncidentStats['priority_breakdown']
}

/** Real counts — /api/insights/stats/, derived from SlackMessageInsight. */
export function IncidentsByPriorityCard({ breakdown }: IncidentsByPriorityCardProps) {
  const DATA = [
    { name: 'Critical', value: breakdown.critical, color: COLORS.Critical },
    { name: 'High', value: breakdown.high, color: COLORS.High },
    { name: 'Medium', value: breakdown.medium, color: COLORS.Medium },
    { name: 'Low', value: breakdown.low, color: COLORS.Low },
  ]
  const TOTAL = DATA.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="w-[280px] shrink-0 rounded-lg border border-border bg-card p-6">
      <p className="text-sm font-semibold text-foreground">Incidents by Priority</p>
      <p className="mt-0.5 text-xs text-muted-foreground">Current open incidents across all projects</p>

      <div className="mt-4 flex items-center gap-4">
        <div className="relative size-24 shrink-0">
          <PieChart width={96} height={96}>
            <Pie
              data={DATA}
              dataKey="value"
              innerRadius={32}
              outerRadius={48}
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              {DATA.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-foreground">{TOTAL}</span>
            <span className="text-[10px] text-muted-foreground">Incidents</span>
          </div>
        </div>

        <ul className="flex flex-col gap-1.5 text-xs">
          {DATA.map((entry) => (
            <li key={entry.name} className="flex items-center gap-1.5">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
                aria-hidden="true"
              />
              <span className="text-muted-foreground">{entry.name}</span>
              <span className="ml-auto font-medium text-foreground">{entry.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
