// Codexium composer model/effort/speed selector.
//
// Compiled with esbuild (jsx: "transform", jsxFactory: "cxh") and the resulting
// function body is injected into the module scope of
// app-initial-CUcIZsiK.js, so it can reuse the bundle's own `U2` (jsx) and
// `Wo` (React hooks) bindings. For the same reason this module must NOT import
// React or the app chunk — it relies on those being in scope at the injection
// point. We therefore write JSX but point the factory at `cxh`, a tiny shim
// that converts esbuild's variadic `cxh(type, props, ...children)` calls into
// the `U2.jsx(type, props)` form the bundle expects (children inside props).
//
// State access: the trigger lives inside the composer's intelligence dropdown
// root. We find the owning component (WVs) by walking up the React fiber from
// our DOM node and read model/effort/speed + the onSelect* setters from its
// memoizedProps, exactly like the settings pages talk to shared state.

/* eslint-disable no-unused-vars */
function cxh(type, props, ...children) {
  if (children.length) {
    props = Object.assign({}, props || {});
    props.children = children.length === 1 ? children[0] : children;
  }
  return U2.jsx(type, props);
}

export function CxSelector() {
  const [open, setOpen] = Wo.useState(null);
  const [anchor, setAnchor] = Wo.useState(null);
  const ref = Wo.useRef(null);
  const popRef = Wo.useRef(null);

  const order = ["low", "medium", "high", "xhigh", "ultra"];
  const label = ["Light", "Medium", "High", "Extra High", "Ultra"];

  // Walk up the React fiber from our DOM node to the component owning
  // model/effort/speed state (WVs), which exposes onSelect* setters + the
  // current values as memoizedProps.
  const fiber = () => {
    const el = ref.current;
    if (!el) return null;
    const k = Object.keys(el).find((x) => x.indexOf("__reactFiber") === 0);
    if (!k) return null;
    let f = el[k];
    for (let i = 0; i < 60 && f; i++) {
      f = f.return;
      if (!f) break;
      const n = (f.type && (f.type.name || f.type.displayName)) || "";
      if (n === "WVs") return f;
    }
    return null;
  };
  const getProps = () => {
    const f = fiber();
    return f ? f.memoizedProps || null : null;
  };

  const read = () => {
    const p = getProps();
    if (!p) return { model: "", modelId: "", effortName: "Medium", effort: "medium", tier: "", models: [] };
    const idx = order.indexOf(p.reasoningEffort);
    const md = (p.models || []).filter((m) => m.id === p.model)[0];
    const effortName =
      idx >= 0
        ? label[idx]
        : p.reasoningEffort && p.reasoningEffort !== "none"
          ? p.reasoningEffort
          : "Medium";
    return {
      model: md ? md.displayName || md.id : p.model || "",
      modelId: p.model,
      effortName,
      effort: p.reasoningEffort || "medium",
      tier: p.selectedServiceTier || "",
      models: p.models || [],
    };
  };

  const setModel = (id) => {
    const p = getProps();
    if (p && p.onSelectModel) p.onSelectModel(id, null);
    setOpen(null);
  };
  const setEffort = (e) => {
    const p = getProps();
    if (p && p.onSelectReasoningEffort) p.onSelectReasoningEffort(e);
    setOpen(null);
  };
  const setTier = (t) => {
    const p = getProps();
    if (p && p.onSelectServiceTier) p.onSelectServiceTier(t);
    setOpen(null);
  };

  Wo.useEffect(() => {
    const h = (e) => {
      if (
        open &&
        popRef.current &&
        !popRef.current.contains(e.target) &&
        !(ref.current && ref.current.contains(e.target))
      ) {
        setOpen(null);
      }
    };
    document.addEventListener("pointerdown", h, true);
    return () => document.removeEventListener("pointerdown", h, true);
  }, [open]);

  const btnCls =
    "no-drag cursor-interaction items-center gap-1 border whitespace-nowrap select-none focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 flex rounded-md h-7 px-2 py-0 text-xs leading-[18px] text-token-text-secondary hover:text-token-foreground border-token-border/40 bg-token-bg-fog";
  const cur = read();
  const popCls =
    "fixed z-[70] min-w-[170px] select-none rounded-xl border border-token-border bg-token-dropdown-background/95 p-1 text-token-foreground shadow-lg backdrop-blur-sm";
  // Anchor the panel to the clicked button and auto-flip so it never overflows
  // the viewport edge: the composer sits at the bottom of the window, so when
  // there isn't enough room below the button we open upward instead.
  const vh = window.innerHeight;
  const itemCount =
    open === "model" ? (cur.models || []).length : open === "effort" ? order.length : open === "speed" ? 3 : 0;
  const estH = Math.min((itemCount || 0) * 36 + 28, 220);
  const spaceBelow = anchor ? vh - anchor.bottom : 0;
  const spaceAbove = anchor ? anchor.top : 0;
  const openUp = !!(anchor && spaceBelow < estH + 12 && spaceAbove > estH + 12);
  const popStyle = openUp
    ? {
        left: anchor.left,
        bottom: vh - anchor.top + 4,
        maxHeight: Math.max(estH, Math.floor(spaceAbove) - 8),
      }
    : {
        left: (anchor && anchor.left) || 0,
        top: ((anchor && anchor.bottom) || 0) + 4,
        maxHeight: Math.max(estH, Math.floor(spaceBelow) - 8),
      };
  const itemCls =
    "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm text-token-foreground hover:bg-token-list-hover-background cursor-interaction";

  let panelEl = null;
  const handler = (kind) => (e) => {
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    setAnchor({ left: r.left, top: r.top, bottom: r.bottom, width: r.width });
    setOpen((o) => (o === kind ? null : kind));
  };

  if (open === "model") {
    panelEl = (
      <div ref={popRef} className={popCls} style={popStyle}>
        <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-token-text-secondary">
          Model
        </div>
        <div className="flex max-h-[220px] flex-col overflow-y-auto">
          {cur.models.map((m) => (
            <button type="button" key={m.id} onClick={() => setModel(m.id)} className={itemCls}>
              <span className="truncate">{m.displayName || m.id}</span>
              {m.id === cur.modelId ? (
                <span className="shrink-0 text-token-charts-blue">{"\u2713"}</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    );
  } else if (open === "effort") {
    panelEl = (
      <div ref={popRef} className={popCls} style={popStyle}>
        <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-token-text-secondary">
          Reasoning effort
        </div>
        <div className="flex max-h-[220px] flex-col overflow-y-auto">
          {order.map((o, i) => (
            <button type="button" key={o} onClick={() => setEffort(o)} className={itemCls}>
              <span className="truncate">{label[i]}</span>
              {o === cur.effort ? (
                <span className="shrink-0 text-token-charts-blue">{"\u2713"}</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    );
  } else if (open === "speed") {
    panelEl = (
      <div ref={popRef} className={popCls} style={popStyle}>
        <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-token-text-secondary">
          Speed
        </div>
        <div className="flex max-h-[220px] flex-col overflow-y-auto">
          {["default", "priority", "fast"].map((o) => (
            <button
              type="button"
              key={o}
              onClick={() => setTier(o)}
              className={itemCls}
            >
              <span className="truncate">{o[0].toUpperCase() + o.slice(1)}</span>
              {o === cur.tier ? (
                <span className="shrink-0 text-token-charts-blue">{"\u2713"}</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="inline-flex items-center gap-1"
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <button type="button" className={btnCls} onClick={handler("model")}>
        {cur.model || "Model"}
      </button>
      <button type="button" className={btnCls} onClick={handler("effort")}>
        {cur.effortName}
      </button>
      <button type="button" className={btnCls} onClick={handler("speed")}>
        {cur.tier || "Speed"}
      </button>
      {panelEl}
    </div>
  );
}
