import { useEffect, useState } from "react";
import { Download, Eye, FileSpreadsheet, FileText, X } from "lucide-react";
import { GlassWorkspace } from "../components/layout/GlassWorkspace";
import { PdfDocumentPreview } from "../components/PdfDocumentPreview";
import { useSoc } from "../context/SocContext";
import { createReportCsv, createReportPdf, triggerBrowserDownload } from "../utils/fileDownloader";

const formatDate = (value) => new Date(value).toLocaleString();
const REPORT_HISTORY_KEY = "dejen.reportHistory";
const REPORT_HISTORY_LIMIT = 25;

const readReportHistory = () => {
  try {
    const history = JSON.parse(localStorage.getItem(REPORT_HISTORY_KEY) || "[]");
    return Array.isArray(history) ? history : [];
  } catch {
    return [];
  }
};

const parseCsvRows = (content) => {
  const rows = [];
  let row = [];
  let field = "";
  let insideQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    if (character === '"') {
      if (insideQuotes && content[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (character === "," && !insideQuotes) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !insideQuotes) {
      if (character === "\r" && content[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (field || row.length) {
    row.push(field);
    if (row.some((value) => value !== "")) rows.push(row);
  }
  return rows;
};

export const ReportsPage = () => {
  const { summary, alerts, incidents, events, loading } = useSoc();
  const [createdAt] = useState(() => new Date().toISOString());
  const [exporting, setExporting] = useState("");
  const [exportError, setExportError] = useState("");
  const [preview, setPreview] = useState(null);
  const [reportHistory, setReportHistory] = useState(readReportHistory);
  const reportAuthor = "DEJEN SOC live data";
  const reports = [
    {
      id: "SOC-SUMMARY",
      title: "Operations summary",
      type: "DAILY_SECURITY",
      classification: "INTERNAL_SOC",
      createdAt,
      author: reportAuthor,
      status: "DRAFT",
      summary: "Snapshot of dashboard totals currently returned by the backend.",
      findings: summary ? Object.entries(summary).map(([label, value]) => {
        const readableLabels = {
          total_events: "Events received",
          total_alerts: "Detections",
          open_alerts: "Open alerts",
          critical_alerts: "Critical alerts",
          total_incidents: "Total incidents",
          open_incidents: "Open incidents",
          investigating_incidents: "Incidents under investigation",
          resolved_incidents: "Resolved incidents",
        };
        return `${readableLabels[label] || label.replaceAll("_", " ")}: ${value}`;
      }) : ["Dashboard summary is not available yet."],
      iocs: [],
      remediationSteps: [],
      recordCount: Object.keys(summary || {}).length,
      description: "Counts for events, alerts, and incidents.",
    },
    {
      id: "SOC-ALERTS",
      title: "Alert register",
      type: "ALERT_REPORT",
      classification: "INTERNAL_SOC",
      createdAt,
      author: reportAuthor,
      status: "DRAFT",
      summary: `${alerts.length} alert record${alerts.length === 1 ? "" : "s"} returned by the backend at export time.`,
      findings: alerts.map((alert) => {
        const timestamp = new Date(alert.timestamp);
        const detectedAt = Number.isNaN(timestamp.getTime()) ? alert.timestamp : timestamp.toLocaleString();
        return [
          `${alert.severity} | ${alert.title}`,
          `Status: ${alert.status}  Rule: ${alert.rule}`,
          `Detected: ${detectedAt}`,
          `Host: ${alert.host}  Source IP: ${alert.sourceIp}`,
          `Description: ${alert.description}`,
        ].join("\n");
      }),
      iocs: [...new Set(alerts.map((alert) => alert.sourceIp).filter((value) => value && value !== "Unknown IP"))],
      remediationSteps: [],
      recordCount: alerts.length,
      description: "Detection titles, severity, status, and source details.",
    },
    {
      id: "SOC-INCIDENTS",
      title: "Incident register",
      type: "INCIDENT_REPORT",
      classification: "INTERNAL_SOC",
      createdAt,
      author: reportAuthor,
      status: "DRAFT",
      summary: `${incidents.length} incident record${incidents.length === 1 ? "" : "s"} returned by the backend at export time.`,
      findings: incidents.map((incident) => {
        const timestamp = new Date(incident.createdAt);
        const createdAt = Number.isNaN(timestamp.getTime()) ? incident.createdAt : timestamp.toLocaleString();
        return [
          `${incident.severity} | ${incident.title}`,
          `Status: ${incident.status}  Assigned to: ${incident.assignedAnalyst}`,
          `Created: ${createdAt}`,
          `Related alert: ${incident.alertId}`,
          `Details: ${incident.description}`,
        ].join("\n");
      }),
      iocs: [],
      remediationSteps: [],
      recordCount: incidents.length,
      description: "Incident status, assignment, severity, and descriptions.",
    },
    {
      id: "SOC-EVENTS",
      title: "Event telemetry",
      type: "THREAT_REPORT",
      classification: "INTERNAL_SOC",
      createdAt,
      author: reportAuthor,
      status: "DRAFT",
      summary: `${events.length} event record${events.length === 1 ? "" : "s"} returned by the backend at export time.`,
      findings: events.map((event) => {
        const timestamp = new Date(event.timestamp);
        const occurredAt = Number.isNaN(timestamp.getTime())
          ? event.timestamp
          : `${timestamp.toISOString().replace("T", " ").slice(0, 19)} UTC`;
        return [
          `${event.severity} | ${event.host} | ${event.event_type}`,
          `Time: ${occurredAt}  Agent: ${event.agent_id}`,
          `User: ${event.username || "-"}  Source IP: ${event.source_ip || "-"}`,
          `Activity: ${event.message}`,
        ].join("\n");
      }),
      iocs: [...new Set(events.map((event) => event.source_ip).filter(Boolean))],
      remediationSteps: [],
      recordCount: events.length,
      description: "Ingested event messages, hosts, agents, and source addresses.",
    },
  ];

  useEffect(() => {
    localStorage.setItem(REPORT_HISTORY_KEY, JSON.stringify(reportHistory));
  }, [reportHistory]);

  useEffect(() => {
    if (!preview) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setPreview(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      if (preview.url) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  const recordReportHistory = (report, format, action) => {
    setReportHistory((history) => [{
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      reportId: report.id,
      title: report.title,
      format,
      action,
      createdAt: new Date().toISOString(),
      report,
    }, ...history].slice(0, REPORT_HISTORY_LIMIT));
  };

  const previewReport = async (report, format, recordHistory = true) => {
    setExporting(`${report.id}-${format}-PREVIEW`);
    setExportError("");
    try {
      const blob = format === "PDF" ? await createReportPdf(report) : createReportCsv(report);
      const url = format === "PDF" ? URL.createObjectURL(blob) : null;
      const content = format === "CSV" ? await blob.text() : "";
      setPreview({ report, format, blob, url, rows: format === "CSV" ? parseCsvRows(content) : [] });
      if (recordHistory) recordReportHistory(report, format, "Previewed");
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Could not create PDF preview.");
    } finally {
      setExporting("");
    }
  };

  const downloadPreview = () => {
    if (!preview) return;
    triggerBrowserDownload(preview.blob, `DEJEN-Report-${preview.report.id}.${preview.format.toLowerCase()}`);
    recordReportHistory(preview.report, preview.format, "Downloaded");
  };

  return <GlassWorkspace>
    <div className="soc-report-view">
      <div className="soc-view-head">
        <div>
          <span className="soc-eyebrow">SECURITY CENTER / REPORTS</span>
          <h1>Report exports</h1>
          <p>Download snapshots generated from current backend records.</p>
        </div>
        <div className="soc-head-actions">
          <span className="soc-live-label"><i />{loading ? "Syncing records" : "Source data connected"}</span>
        </div>
      </div>

      <div className="soc-report-note"><FileText size={15} /><span>Exports reflect the latest loaded data and are not stored as backend report records.</span></div>
      {exportError && <p role="alert" className="soc-form-error">{exportError}</p>}

      <section className="soc-report-grid" aria-label="Available report exports">
        {reports.map((report) => <article className="soc-glass-panel soc-report-card" key={report.id}>
          <div className="soc-report-card-top">
            <span className="soc-report-icon"><FileText size={17} /></span>
            <span className="soc-report-count">{report.recordCount} {report.id === "SOC-SUMMARY" ? "metrics" : "records"}</span>
          </div>
          <span className="soc-eyebrow">{report.type.replaceAll("_", " ")}</span>
          <h2>{report.title}</h2>
          <p>{report.description}</p>
          <div className="soc-report-meta"><span>Generated {formatDate(report.createdAt)}</span><span>{report.classification}</span></div>
          <div className="soc-report-actions">
            <button onClick={() => previewReport(report, "PDF")} disabled={Boolean(exporting)} className="soc-primary-button" title={`Preview ${report.title} as PDF`}><Eye size={14} />{exporting === `${report.id}-PDF-PREVIEW` ? "Preparing..." : "Preview PDF"}</button>
            <button onClick={() => previewReport(report, "CSV")} disabled={Boolean(exporting)} className="soc-secondary-button" title={`Preview ${report.title} as CSV`}><FileSpreadsheet size={14} />{exporting === `${report.id}-CSV-PREVIEW` ? "Preparing..." : "Preview CSV"}</button>
          </div>
        </article>)}
      </section>
      <section className="soc-glass-panel soc-report-history p-4 sm:p-5" aria-labelledby="report-history-heading">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-black/10 pb-3">
          <div><span className="soc-eyebrow">LOCAL ACTIVITY</span><h2 id="report-history-heading" className="mt-1 text-sm font-bold text-[#283532]">Report history</h2><p className="mt-1 text-[11px] text-[#697974]">Recent previews and downloads saved in this browser.</p></div>
          {reportHistory.length > 0 && <button onClick={() => setReportHistory([])} className="soc-secondary-button" title="Clear report history">Clear history</button>}
        </div>
        {reportHistory.length ? <div className="divide-y divide-black/5">
          {reportHistory.map((entry) => <article key={entry.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0"><strong className="block truncate text-xs text-[#283532]">{entry.title}</strong><span className="mt-1 block text-[10px] text-[#697974]">{entry.format} · {entry.action} · {formatDate(entry.createdAt)}</span></div>
            <button onClick={() => previewReport(entry.report, entry.format, false)} disabled={Boolean(exporting)} className="soc-secondary-button" title={`Reopen ${entry.title} ${entry.format} preview`}><Eye size={13} />Open</button>
          </article>)}
        </div> : <p className="py-5 text-center text-xs text-[#697974]">No report previews or downloads yet.</p>}
      </section>
      <div className="soc-report-refresh"><Download size={13} /><span>Refresh backend data from the header before exporting an updated snapshot.</span></div>
    </div>
    {preview && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6" onClick={() => setPreview(null)}>
      <section role="dialog" aria-modal="true" aria-labelledby="report-preview-title" className="flex h-[min(92vh,960px)] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-black/15 bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-black/10 px-4 py-3 sm:px-5">
          <div className="min-w-0"><span className="soc-eyebrow">{preview.format} PREVIEW</span><h2 id="report-preview-title" className="truncate text-sm font-bold text-[#283532]">{preview.report.title}</h2></div>
          <div className="flex shrink-0 items-center gap-2">
            <button onClick={downloadPreview} className="soc-primary-button" title={`Download this ${preview.format}`}><Download size={14} />Download {preview.format}</button>
            <button onClick={() => setPreview(null)} className="soc-icon-button" aria-label={`Close ${preview.format} preview`} title="Close preview"><X size={16} /></button>
          </div>
        </header>
        {preview.format === "PDF" ? <PdfDocumentPreview file={preview.blob} title={preview.report.title} /> : <div aria-label={`${preview.report.title} CSV contents`} className="min-h-0 flex-1 overflow-auto bg-[#f7f9fa] p-4 sm:p-6">
          <table className="mx-auto w-full max-w-5xl border-separate border-spacing-0 overflow-hidden rounded-lg border border-[#dce2e5] bg-white text-left text-xs shadow-sm">
            <thead className="sticky top-0 z-10 bg-[#edf2f3] text-[10px] uppercase tracking-wider text-[#58666e]"><tr><th className="w-[30%] border-b border-[#dce2e5] px-4 py-3">Field</th><th className="border-b border-[#dce2e5] px-4 py-3">Value</th></tr></thead>
            <tbody className="divide-y divide-[#edf0f2]">
              {preview.rows.map((row, index) => row.length === 1 ? <tr key={`${row[0]}-${index}`}><th colSpan={2} className="border-b border-[#e6ebed] bg-[#f4f7f8] px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-[#35454d]">{row[0]}</th></tr> : <tr key={`${row[0]}-${index}`} className="align-top hover:bg-[#f8fafb]"><th scope="row" className="border-b border-[#edf0f2] px-4 py-2.5 font-semibold text-[#53616a]">{row[0]}</th><td className="whitespace-pre-wrap break-words border-b border-[#edf0f2] px-4 py-2.5 leading-5 text-[#26343b]">{row.slice(1).join(", ")}</td></tr>)}
            </tbody>
          </table>
        </div>}
      </section>
    </div>}
  </GlassWorkspace>;
};
