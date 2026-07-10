import { PieChart, Pie, Cell } from 'recharts'

/** Placeholder counts — pending a real Incidents API (see quick-260710-dsh). */
const DATA = [
  { name: 'Critical', value: 6, color: '#042050' },
  { name: 'High', value: 9, color: '#0d428c' },
  { name: 'Medium', value: 7, color: '#45ae73' },
  { name: 'Low', value: 2, color: '#bae2c9' },
]

const TOTAL = DATA.reduce((sum, d) => sum + d.value, 0)

export function IncidentsByPriorityCard() {
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
