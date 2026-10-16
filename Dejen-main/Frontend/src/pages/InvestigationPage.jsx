import { ArrowLeft, Crosshair } from "lucide-react";
import { InvestigationGraph } from "../components/investigation/InvestigationGraph";
import { GlassWorkspace } from "../components/layout/GlassWorkspace";
import { useSoc } from "../context/SocContext";

const nodeTypeFor = (value) => {
  if (value === "HOST") return "HOST";
  if (value === "USER") return "USER";
  if (value === "PROCESS") return "PROCESS";
  return value === "IP" ? "EXTERNAL IP" : "HOST";
};

export const InvestigationPage = () => {
  const { routeParams, navigate } = useSoc();
  const entity = routeParams.entity || "";
  const selectedType = nodeTypeFor(routeParams.entityType);
  const contextValues = [
    { value: routeParams.host, type: "HOST" },
    { value: routeParams.user, type: "USER" },
    { value: routeParams.process, type: "PROCESS" },
    { value: routeParams.ip, type: "EXTERNAL IP" },
  ].filter((item) => item.value && item.value !== entity);
  const nodes = [
    ...(entity ? [{ id: "focused", name: entity, type: selectedType, risk: "UNKNOWN", position: { x: 420, y: 210 } }] : []),
    ...contextValues.map((item, index) => ({ id: `context-${index}`, name: item.value, type: item.type, risk: "UNKNOWN", position: { x: 80 + index * 260, y: index % 2 === 0 ? 40 : 390 } })),
  ];

  return <GlassWorkspace>
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-black/10 pb-3">
        <div><button type="button" onClick={() => navigate("/hunting")} className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-[#287b70] hover:underline"><ArrowLeft size={13} />Threat Hunting</button><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#287b70]">Event Context</p><h1 className="mt-1 text-xl font-bold">{entity || "Investigation"}</h1><p className="mt-1 text-xs text-[#62686d]">Observed fields from the selected event. Relationships and entity risk are not inferred.</p></div>
        <span className="inline-flex items-center gap-1.5 rounded border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1.5 font-mono text-[10px] text-cyan-300"><Crosshair size={12} />{selectedType}</span>
      </div>
      {nodes.length ? <InvestigationGraph nodes={nodes} edges={[]} selectedNode={entity ? "focused" : null} /> : <div className="rounded-md border border-black/10 bg-white px-5 py-12 text-center"><h2 className="text-sm font-semibold text-[#283532]">No event context selected</h2><p className="mt-1 text-xs text-[#697974]">Open an event from Threat Hunting to inspect its observed host, user, process, and network fields.</p><button type="button" onClick={() => navigate("/hunting")} className="mt-4 rounded-md bg-[#292b2e] px-3 py-2 text-xs font-semibold text-white">Open Threat Hunting</button></div>}
    </div>
  </GlassWorkspace>;
};