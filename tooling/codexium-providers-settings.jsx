import { Skt as codexiumReactFactory } from "./app-initial-CUcIZsiK.js";
import { Txt as codexiumRpc } from "./app-initial-CUcIZsiK.js";
import {
  Page, Section, Card, Button, ProviderListItem, ProviderCard, ProviderIconTile,
  ProviderBadge, Badge, Modal, Input, LabeledField, EmptyState, SimpleEmptyState, Alert, Toast, Icon, PlusIcon, RefreshIcon, SearchInput, SegmentedTabs, Tooltip, faviconFor, cx,
} from "./codexium-ui.js";

const React = codexiumReactFactory();
const { useState, useEffect, useCallback } = React;
const h = React.createElement;

// Invalidate the app's cached `["models","list",...]` queries so the chat
// composer's model picker reflects provider/model changes without a relaunch.
const refreshModels = () => {
  const qc = (typeof window !== "undefined" && window.__cxQueryClient) || null;
  if (qc) qc.invalidateQueries({ queryKey: ["models", "list"] });
};

const OPENAI_ID = "openai";

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), ms)),
  ]);
}

// Some registry providers ship without a bundled icon, so fall back to the
// domain favicon derived from their base URL.
function iconFor(provider) {
  return provider.icon || null;
}

// Status dot + label for provider health checks.
function StatusIcon({ ok, unknown }) {
  const color = unknown ? "text-token-text-tertiary" : (ok ? "text-token-charts-green" : "text-token-charts-red");
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={color}>
      {unknown ? (
        <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
      ) : ok ? (
        <>
          <circle cx="7" cy="7" r="6" fill="currentColor" opacity="0.2" />
          <path d="M4.2 7.2l1.8 1.8 3.8-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </>
      ) : (
        <>
          <circle cx="7" cy="7" r="6" fill="currentColor" opacity="0.2" />
          <path d="M4.8 4.8l4.4 4.4M9.2 4.8L4.8 9.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
        </>
      )}
    </svg>
  );
}

function formatTime(epochSec) {
  if (!epochSec) return "—";
  try {
    const d = new Date(epochSec * 1000);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return "—";
  }
}

function CodexiumProvidersSettings() {
  const [providers, setProviders] = useState(null);   // connected providers (id -> provider)
  const [registry, setRegistry] = useState({ version: "0", providers: [] });
  const [registryRefreshed, setRegistryRefreshed] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(null);
  const [showConnect, setShowConnect] = useState(null); // registry provider being connected
  const [showCustom, setShowCustom] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [dangerOpen, setDangerOpen] = useState(false);
  const [providerSearch, setProviderSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [statuses, setStatuses] = useState({});   // providerId -> { ok, message, latencyMs, checkedAt }
  const [checking, setChecking] = useState({});   // providerId -> bool

  const checkProviders = useCallback(async (providerId) => {
    setChecking((prev) => ({ ...prev, [providerId || "all"]: true }));
    setError(null);
    try {
      const res = await withTimeout(codexiumRpc("codexium/providers/check", { hostId: "local", providerId: providerId || null }), 20000);
      const next = { ...statuses };
      for (const s of res.statuses || []) {
        next[s.providerId] = { ok: s.ok, message: s.message, latencyMs: s.latencyMs, checkedAt: s.checkedAt };
      }
      setStatuses(next);
    } catch (e) {
      setError(String((e && e.message) || e));
    } finally {
      setChecking((prev) => ({ ...prev, [providerId || "all"]: false }));
    }
  }, [statuses]);

  const load = useCallback(async () => {
    try {
      const reg = await withTimeout(codexiumRpc("codexium/registry/read", { hostId: "local" }), 15000);
      setRegistry({ version: reg.version || "0", providers: reg.providers || [] });
      setRegistryRefreshed(!!reg.refreshed);
      const res = await withTimeout(codexiumRpc("codexium/models/read", { hostId: "local" }), 15000);
      setProviders(res.providers || {});
      setError(null);
    } catch (e) {
      setError(String((e && e.message) || e));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const refresh = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      await load();
      setSavedMsg("Refresh complete");
    } finally {
      setSaving(false);
    }
  }, [load]);

  const connect = async () => {
    if (!showConnect) return;
    const registryProvider = showConnect;
    setSaving(true); setError(null);
    try {
      await withTimeout(codexiumRpc("codexium/providers/connect", {
        hostId: "local",
        providerId: registryProvider.id,
        label: registryProvider.name,
        baseUrl: registryProvider.baseUrl || null,
        envKey: registryProvider.envKey || null,
        providerType: registryProvider.providerType || "apiKey",
        icon: registryProvider.icon || null,
        apiKey: apiKey.trim() || null,
        models: (registryProvider.models || []).map((m) => ({
          name: m.name, label: m.label, contextWindow: m.contextWindow,
          maxOutputTokens: m.maxOutputTokens, input: m.input, output: m.output, description: m.description,
        })),
      }), 15000);
      setApiKey("");
      setShowConnect(null);
      await load();
      setSavedMsg("Connected " + registryProvider.name);
      refreshModels();
    } catch (e) {
      setError(String((e && e.message) || e));
    } finally {
      setSaving(false);
    }
  };

  const disconnect = async (providerId) => {
    setSaving(true); setError(null);
    try {
      await withTimeout(codexiumRpc("codexium/providers/disconnect", { hostId: "local", providerId }), 15000);
      const next = { ...(providers || {}) };
      delete next[providerId];
      setProviders(next);
      setDangerOpen(false);
      setSavedMsg("Disconnected");
      refreshModels();
    } catch (e) {
      setError(String((e && e.message) || e));
    } finally {
      setSaving(false);
    }
  };

  // Custom provider form state
  const [custom, setCustom] = useState({ id: "", label: "", baseUrl: "", envKey: "", providerType: "apiKey" });
  const addCustom = async () => {
    if (!custom.id.trim()) return;
    setSaving(true); setError(null);
    try {
      await withTimeout(codexiumRpc("codexium/providers/connect", {
        hostId: "local",
        providerId: custom.id.trim(),
        label: custom.label.trim() || null,
        baseUrl: custom.baseUrl.trim() || null,
        envKey: custom.envKey.trim() || null,
        providerType: custom.providerType || "apiKey",
        icon: null,
        apiKey: apiKey.trim() || null,
        models: [],
      }), 15000);
      setApiKey("");
      setCustom({ id: "", label: "", baseUrl: "", envKey: "", providerType: "apiKey" });
      setShowCustom(false);
      await load();
      setSavedMsg("Provider added");
      refreshModels();
    } catch (e) {
      setError(String((e && e.message) || e));
    } finally {
      setSaving(false);
    }
  };

  const connectedEntries = Object.entries(providers || {});
  const providerMap = (providers || {});
  const popular = (registry.providers || []).filter((p) => {
    if (p.id === OPENAI_ID) return false;
    // Already connected (by id) -> not popular.
    return !(providerMap[p.id]);
  });
  const recommended = popular.find((p) => p.recommended);
  const q = (providerSearch || "").toLowerCase();
  const apiKeyCount = popular.filter((p) => (p.providerType || p.type) === "apiKey").length;
  const oauthCount = popular.filter((p) => (p.providerType || p.type) === "oauth").length;
  const matchesType = (p) => {
    const t = (p.providerType || p.type || "apiKey");
    if (filterType === "apiKey") return t === "apiKey";
    if (filterType === "oauth") return t === "oauth";
    return true;
  };
  const visiblePopular = popular.filter((p) => matchesType(p) && (!q || (p.name + " " + (p.description || "")).toLowerCase().includes(q)));

  return (
    <Page title="Providers" description="Connect custom model providers or use the built-in ones."
      actions={<Button variant="secondary" icon={<PlusIcon size={16} />} onClick={() => setShowCustom(true)} disabled={saving}>Add Custom</Button>}>
      {error ? <Alert variant="error">{error}</Alert> : null}
      {savedMsg ? <Toast variant="success" message={savedMsg} onClose={() => setSavedMsg(null)} /> : null}

      {/* -------------------------------------------------------------------- */}
      {/* Connected providers */}
      {/* -------------------------------------------------------------------- */}
      <Section title="Connected providers" actions={
        <div className="flex max-w-full shrink-0 items-center gap-2">
          <Tooltip content="Recheck all providers">
            <button type="button" aria-label="Recheck all providers" onClick={() => checkProviders(null)} disabled={checking["all"] || saving}
              className="no-drag cursor-interaction items-center gap-1 border whitespace-nowrap select-none focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 flex rounded-full electron:rounded-md text-token-text-tertiary enabled:hover:bg-token-list-hover-background data-[state=open]:bg-token-list-hover-background border-transparent electron:p-1 electron:[&>svg]:icon-sm flex items-center justify-center p-0.5">
              {checking["all"] ? <span className="text-xs text-token-text-tertiary">…</span> : <RefreshIcon size={20} className="icon-xs" />}
            </button>
          </Tooltip>
        </div>
      }>
        {connectedEntries.length === 0 ? (
          <EmptyState title="No connected providers" description="Connect a provider below to get started." />
        ) : (
          <Card style={{ padding: 0 }}>
            {connectedEntries
              .sort(([a], [b]) => (a === OPENAI_ID ? -1 : b === OPENAI_ID ? 1 : a.localeCompare(b)))
              .map(([providerId, provider]) => {
                const isBuiltin = !!provider.readonly;
                const title = provider.label || providerId;
                const icon = iconFor(provider);
                const st = statuses[providerId];
                return (
                  <ProviderListItem key={providerId} icon={icon} name={title}
                    providerType={provider.providerType || (isBuiltin ? "openai" : "custom")}
                    description={cx(provider.baseUrl || null, provider.envKey ? " · " + provider.envKey : null)}
                    action={
                      <div className="flex items-center gap-1">
                        {!isBuiltin && (
                          <Tooltip content={
                            cx(
                              st ? "Last check " + formatTime(st.checkedAt) : null,
                              st ? null : "Check status"
                            )
                          }>
                            <button type="button" aria-label={"Check " + title} onClick={() => checkProviders(providerId)} disabled={checking[providerId] || saving}
                              className="no-drag cursor-interaction items-center gap-1 border whitespace-nowrap select-none focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 flex rounded-full electron:rounded-md text-token-text-tertiary enabled:hover:bg-token-list-hover-background border-transparent electron:p-1 electron:[&>svg]:icon-sm flex items-center justify-center p-0.5">
                              {checking[providerId]
                                ? <span className="text-xs text-token-text-tertiary">…</span>
                                : st
                                  ? (st.ok
                                    ? <StatusIcon ok />
                                    : <StatusIcon ok={false} />)
                                  : <StatusIcon unknown />}
                            </button>
                          </Tooltip>
                        )}
                        {isBuiltin
                          ? <Badge color="blue">Default</Badge>
                          : <Button variant="ghost" size="sm" onClick={() => setDangerOpen(providerId)} disabled={saving}>Disconnect</Button>}
                      </div>
                    } />
                );
              })}
          </Card>
        )}
      </Section>

      {/* -------------------------------------------------------------------- */}
      {/* Popular providers */}
      {/* -------------------------------------------------------------------- */}
      <Section title="Popular providers" actions={
        <div className="flex max-w-full shrink-0 items-center gap-2">
          <span data-state="closed" className="contents">
            <Tooltip content="Refresh">
              <button type="button" aria-label="Reload providers" onClick={refresh} disabled={saving}
                className="no-drag cursor-interaction items-center gap-1 border whitespace-nowrap select-none focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 flex rounded-full electron:rounded-md text-token-text-tertiary enabled:hover:bg-token-list-hover-background data-[state=open]:bg-token-list-hover-background border-transparent electron:p-1 electron:[&>svg]:icon-sm flex items-center justify-center p-0.5">
                <RefreshIcon size={20} className="icon-xs" />
              </button>
            </Tooltip>
          </span>
        </div>
      }>
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SegmentedTabs
              value={filterType}
              onChange={setFilterType}
              options={[
                { value: "all", label: "All", count: popular.length },
                { value: "apiKey", label: "API Key", count: apiKeyCount },
                { value: "oauth", label: "OAuth", count: oauthCount },
              ]}
            />
            <div className="w-56 min-w-0">
              <SearchInput placeholder="Search providers" label="Search providers" value={providerSearch} onChange={setProviderSearch} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            {recommended && matchesType(recommended) && (!q || (recommended.name + " " + (recommended.description || "")).toLowerCase().includes(q)) ? (
              <ProviderCard key={recommended.id} icon={iconFor(recommended)} providerType={recommended.providerType}
                name={recommended.name} description={recommended.description}
                onClick={() => setShowConnect(recommended)} readonly={false}
                actions={
                  <div className="flex items-center gap-2">
                    <Badge color="blue">Recommended</Badge>
                    <Button variant="secondary" onClick={(e) => { e.stopPropagation(); setShowConnect(recommended); }}>Connect</Button>
                  </div>
                } />
            ) : null}
            {visiblePopular.filter((p) => (recommended ? p.id !== recommended.id : true)).length ? (
              <div className="grid grid-cols-1 gap-2">
                {visiblePopular.filter((p) => (recommended ? p.id !== recommended.id : true)).map((p) => (
                  <ProviderCard key={p.id} icon={iconFor(p)} providerType={p.providerType}
                    name={p.name} description={p.description}
                    onClick={() => setShowConnect(p)} readonly={false}
                    actions={<Button variant="secondary" onClick={(e) => { e.stopPropagation(); setShowConnect(p); }}>Connect</Button>} />
                ))}
              </div>
            ) : null}
            {visiblePopular.length === 0 && (q || filterType !== "all") ? <SimpleEmptyState>No providers found</SimpleEmptyState> : null}
            {visiblePopular.length === 0 && !q && filterType === "all" && popular.length === 0 ? <SimpleEmptyState>All popular providers are connected.</SimpleEmptyState> : null}
          </div>
        </div>
      </Section>

      {/* -------------------------------------------------------------------- */}
      {/* Connect a registry provider (api key modal) */}
      {/* -------------------------------------------------------------------- */}
      {showConnect ? (
        <Modal title={"Connect " + showConnect.name}
          description={cx(showConnect.baseUrl || null, showConnect.models ? " · " + showConnect.models.length + " models" : null)}
          onClose={() => { if (!saving) { setShowConnect(null); setApiKey(""); } }}
          footer={
            <>
              <Button variant="subtle" onClick={() => { setShowConnect(null); setApiKey(""); }} disabled={saving}>Cancel</Button>
              <Button variant="primary" onClick={connect} disabled={saving}>{saving ? "Connecting…" : "Connect"}</Button>
            </>
          }>
          <LabeledField label="API key" hint={"Stored in auth.json as " + (showConnect.envKey || showConnect.id.toUpperCase() + "_API_KEY")}>
            <Input type="password" placeholder="sk-…" value={apiKey} onChange={(e) => setApiKey(e.target.value)} autoComplete="off" />
          </LabeledField>
        </Modal>
      ) : null}

      {/* -------------------------------------------------------------------- */}
      {/* Add a custom provider */}
      {/* -------------------------------------------------------------------- */}
      {showCustom ? (
        <Modal title="Add custom provider" description="Add your own OpenAI-compatible model provider."
          onClose={() => { if (!saving) { setShowCustom(false); setApiKey(""); } }}
          footer={
            <>
              <Button variant="subtle" onClick={() => { setShowCustom(false); setApiKey(""); }} disabled={saving}>Cancel</Button>
              <Button variant="primary" onClick={addCustom} disabled={saving || !custom.id.trim()}>{saving ? "Adding…" : "Add provider"}</Button>
            </>
          }>
          <LabeledField label="Provider id">
            <Input placeholder="e.g. deepseek" value={custom.id} onChange={(e) => setCustom({ ...custom, id: e.target.value })} />
          </LabeledField>
          <LabeledField label="Display name (optional)">
            <Input placeholder="DeepSeek" value={custom.label} onChange={(e) => setCustom({ ...custom, label: e.target.value })} />
          </LabeledField>
          <LabeledField label="Base URL">
            <Input placeholder="https://api.deepseek.com" value={custom.baseUrl} onChange={(e) => setCustom({ ...custom, baseUrl: e.target.value })} />
          </LabeledField>
          <LabeledField label="Env key (optional)" hint="The environment variable that holds the API key.">
            <Input placeholder="DEEPSEEK_API_KEY" value={custom.envKey} onChange={(e) => setCustom({ ...custom, envKey: e.target.value })} />
          </LabeledField>
          <LabeledField label="API key (optional)">
            <Input type="password" placeholder="sk-…" value={apiKey} onChange={(e) => setApiKey(e.target.value)} autoComplete="off" />
          </LabeledField>
        </Modal>
      ) : null}

      {/* Disconnect confirm */}
      {dangerOpen ? (
        <Modal title="Disconnect provider?" description={"Remove " + (providerMap[dangerOpen]?.label || dangerOpen) + " and its API key?"}
          onClose={() => { if (!saving) setDangerOpen(false); }}
          footer={
            <>
              <Button variant="subtle" onClick={() => setDangerOpen(false)} disabled={saving}>Cancel</Button>
              <Button variant="danger" onClick={() => disconnect(dangerOpen)} disabled={saving}>Disconnect</Button>
            </>
          }>
          <div className="text-sm text-token-text-secondary">This removes the provider and its stored key. Models it provided will no longer appear in the picker.</div>
        </Modal>
      ) : null}
    </Page>
  );
}

export { CodexiumProvidersSettings };

