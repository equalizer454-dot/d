import { SeverityBadge } from "./SeverityBadge";

interface AlertRecord {
  id: string;
  title: string;
  rule: string;
  host: string;
  sourceIp: string;
  severity: string;
  riskScore: number;
  status: string;
  timestamp: string;
}

interface AlertTableProps {
  alerts: AlertRecord[];
  canManage: boolean;
  onOpen: (alert: AlertRecord) => void;
  onStatusChange: (alert: AlertRecord, status: string) => void;
}

const statuses = ["OPEN", "INVESTIGATING", "RESOLVED"];

export const AlertTable = ({ alerts, canManage, onOpen, onStatusChange }: AlertTableProps) => (
  <div className="overflow-x-auto rounded-md border border-black/10 bg-white">
    <table className="w-full min-w-[800px] text-left text-xs">
      <thead className="bg-[#f5f6f6] text-[#62686d]"><tr><th className="px-4 py-3">Alert</th><th className="px-4 py-3">Rule</th><th className="px-4 py-3">Host / Source IP</th><th className="px-4 py-3">Severity</th><th className="px-4 py-3">Risk</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Created</th></tr></thead>
      <tbody className="divide-y divide-black/5">
        {alerts.map((alert) => <tr key={alert.id} onClick={() => onOpen(alert)} className="cursor-pointer hover:bg-[#f8f9f9]">
          <td className="px-4 py-3"><span className="block max-w-sm font-semibold">{alert.title}</span><span className="mt-1 block font-mono text-[10px] text-[#73797e]">{alert.id}</span></td>
          <td className="px-4 py-3">{alert.rule}</td>
          <td className="px-4 py-3"><span className="block">{alert.host}</span><span className="mt-1 block font-mono text-[10px] text-[#73797e]">{alert.sourceIp}</span></td>
          <td className="px-4 py-3"><SeverityBadge severity={alert.severity} /></td>
          <td className="px-4 py-3 tabular-nums">{alert.riskScore}</td>
          <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}><select aria-label={`Status for ${alert.title}`} value={alert.status} disabled={!canManage} onChange={(event) => onStatusChange(alert, event.target.value)} className="rounded border border-black/15 bg-white px-2 py-1 text-[11px] disabled:bg-[#f2f3f3]">{statuses.map((status) => <option key={status}>{status}</option>)}</select></td>
          <td className="whitespace-nowrap px-4 py-3">{new Date(alert.timestamp).toLocaleString()}</td>
        </tr>)}
        {!alerts.length && <tr><td colSpan={7} className="px-4 py-10 text-center text-[#777d82]">No backend alerts match these filters.</td></tr>}
      </tbody>
    </table>
  </div>
);