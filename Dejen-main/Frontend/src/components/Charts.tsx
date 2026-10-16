import { useMemo } from "react";
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ApiEvent } from "../services/api";

interface AlertActivityRecord {
  timestamp: string;
}

interface ChartsProps {
  alerts: AlertActivityRecord[];
  events: ApiEvent[];
}

const severityColors: Record<string, string> = { CRITICAL: "#c9535b", HIGH: "#d18b45", MEDIUM: "#6297aa", LOW: "#58a084" };

export const Charts = ({ alerts, events }: ChartsProps) => {
  const chartData = useMemo(() => {
    const latest = Date.now();
    const buckets = Array.from({ length: 6 }, (_, index) => ({
      label: `${(5 - index) * 10}m`,
      events: 0,
      alerts: 0,
    }));

    events.forEach((event) => {
      const ageMinutes = Math.max(0, (latest - new Date(event.timestamp).getTime()) / 60000);
      const bucketIndex = Math.min(5, Math.floor(ageMinutes / 10));
      buckets[5 - bucketIndex].events += 1;
    });

    alerts.forEach((alert) => {
      const ageMinutes = Math.max(0, (latest - new Date(alert.timestamp).getTime()) / 60000);
      const bucketIndex = Math.min(5, Math.floor(ageMinutes / 10));
      buckets[5 - bucketIndex].alerts += 1;
    });

    return buckets;
  }, [alerts, events]);
  const severityData = useMemo(() => ["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((severity) => ({
    name: severity,
    value: events.filter((event) => event.severity === severity).length,
  })).filter((item) => item.value > 0), [events]);
  const totalSeverityEvents = severityData.reduce((total, item) => total + item.value, 0);

  return <section className="soc-chart-grid" aria-label="Security analytics">
    <article className="soc-glass-panel soc-chart-panel">
      <div className="soc-panel-heading">
        <div><span className="soc-eyebrow">TELEMETRY VELOCITY</span><h2>Event activity</h2></div>
        <span className="soc-panel-count">Last 60 minutes</span>
      </div>
      <div className="soc-chart-body">
        {events.length ? <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 12, right: 12, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="dashboardEventFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4d9d89" stopOpacity={0.42} />
                <stop offset="100%" stopColor="#4d9d89" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#788681", fontSize: 9 }} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#788681", fontSize: 9 }} />
            <Tooltip contentStyle={{ border: "1px solid rgba(255,255,255,.8)", borderRadius: 8, background: "#24302f", color: "#fff", fontSize: 10 }} />
            <Area type="monotone" dataKey="events" name="Events" stroke="#3e7d6e" strokeWidth={2} fill="url(#dashboardEventFill)" />
            <Area type="monotone" dataKey="alerts" name="Alerts" stroke="#c9535b" strokeWidth={1.5} fill="none" />
          </AreaChart>
        </ResponsiveContainer> : <p className="soc-empty-state">Event activity will appear here after telemetry is received.</p>}
      </div>
      <div className="soc-chart-legend"><span><i className="soc-legend-events" />Events</span><span><i className="soc-legend-alerts" />Alerts</span></div>
    </article>

    <article className="soc-glass-panel soc-chart-panel">
      <div className="soc-panel-heading">
        <div><span className="soc-eyebrow">SEVERITY MIX</span><h2>Telemetry profile</h2></div>
        <span className="soc-panel-count">{totalSeverityEvents} events</span>
      </div>
      <div className="soc-donut-body">
        {severityData.length ? <>
          <div className="soc-donut-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={severityData} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="82%" paddingAngle={3} stroke="none">
                  {severityData.map((item) => <Cell key={item.name} fill={severityColors[item.name]} />)}
                </Pie>
                <Tooltip contentStyle={{ border: "1px solid rgba(255,255,255,.8)", borderRadius: 8, background: "#24302f", color: "#fff", fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
            <strong>{totalSeverityEvents}</strong><small>Total</small>
          </div>
          <div className="soc-severity-list">{severityData.map((item) => <div key={item.name}><span><i style={{ background: severityColors[item.name] }} />{item.name}</span><strong>{item.value}</strong></div>)}</div>
        </> : <p className="soc-empty-state">Severity distribution will appear with incoming events.</p>}
      </div>
    </article>
  </section>;
};