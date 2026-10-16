import { useEffect, useMemo, useState } from "react";
import { GlassWorkspace } from "../components/layout/GlassWorkspace";
import { AlertTable } from "../components/AlertTable";
import { useSoc } from "../context/SocContext";

const ALERT_STATUSES = ["OPEN", "INVESTIGATING", "RESOLVED"];

export const AlertsPage = () => {
  const { alerts, updateAlertStatus, navigate, currentUser, routeParams } = useSoc();
  const canManage = ["ADMIN", "ANALYST"].includes(currentUser?.role);
  const [query, setQuery] = useState(routeParams.query || "");
  const [severity, setSeverity] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    setQuery(routeParams.query || "");
  }, [routeParams.query]);

  const filteredAlerts = useMemo(() => alerts.filter((alert) => {
    const matchesQuery = !query || [alert.title, alert.rule, alert.host, alert.sourceIp, alert.user].some((value) => value?.toLowerCase().includes(query.toLowerCase()));
    return matchesQuery && (severity === "ALL" || alert.severity === severity) && (status === "ALL" || alert.status === status);
  }), [alerts, query, severity, status]);

  const changeStatus = async (alert, status) => {
    setActionError("");
    try {
      await updateAlertStatus(alert.id, status);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not update alert status.");
    }
  };

  return <GlassWorkspace>
    <div className="space-y-5">
      <div className="border-b border-black/10 pb-3">
        <h1 className="text-xl font-bold">Alerts</h1>
        <p className="mt-1 text-sm text-[#62686d]">Alerts recorded by backend detection rules</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-black/10 bg-white p-3">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, host, IP, or user" className="min-w-52 flex-1 rounded-md border border-black/15 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-700" />
        <select value={severity} onChange={(event) => setSeverity(event.target.value)} className="rounded-md border border-black/15 bg-white px-3 py-2 text-xs">
          {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((item) => <option key={item} value={item}>{item === "ALL" ? "All severities" : item}</option>)}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-md border border-black/15 bg-white px-3 py-2 text-xs">
          {["ALL", ...ALERT_STATUSES].map((item) => <option key={item} value={item}>{item === "ALL" ? "All statuses" : item}</option>)}
        </select>
        <span className="text-xs text-[#62686d]">{filteredAlerts.length} records</span>
      </div>
      {actionError && <p role="alert" className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800">{actionError}</p>}
      <AlertTable alerts={filteredAlerts} canManage={canManage} onOpen={(alert) => navigate(`/alerts/${alert.id}`)} onStatusChange={changeStatus} />
    </div>
  </GlassWorkspace>;
};
