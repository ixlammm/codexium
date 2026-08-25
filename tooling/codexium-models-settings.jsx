import { Skt as codexiumReactFactory } from "./app-initial-CUcIZsiK.js";
import { Txt as codexiumRpc } from "./app-initial-CUcIZsiK.js";
import {
  Page, Section, Card, Row, Button, Input, SmallInput, Toggle, Badge,
  EmptyState, Alert, Toast, Icon, PlusIcon, PencilIcon, ProviderIconTile, ProviderBadge, SearchInput, Modal, LabeledField, cx,
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

// The model-picker toggle states shown in the screenshot: which models are on.
function CodexiumModelsSettings() {
  const [providers, setProviders] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(null);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState({});   // providerId -> bool (collapsed)
  const [expanded, setExpanded] = useState({});     // providerId -> bool (explicitly open)
  const [editModel, setEditModel] = useState(null); // { providerId, slug, model }
  const [addModel, setAddModel] = useState(null);   // providerId
  const [modelDraft, setModelDraft] = useState({ name: "", label: "" });

  const load = useCallback(async () => {
    try {
      const res = await withTimeout(codexiumRpc("codexium/models/read", { hostId: "local" }), 15000);
      setProviders(res.providers || {});
      setError(null);
    } catch (e) {
      setError(String((e && e.message) || e));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (next) => {
    setSaving(true); setSavedMsg(null);
    try {
      await withTimeout(codexiumRpc("codexium/models/write", { hostId: "local", providers: next }), 15000);
      setProviders(next);
      setError(null);
      setSavedMsg("Saved");
      refreshModels();
    } catch (e) {
      setError(String((e && e.message) || e));
    } finally {
      setSaving(false);
    }
  }, []);

  const toggleModel = (providerId, slug) => {
    const next = { ...(providers || {}) };
    const provider = { ...(next[providerId] || {}), models: { ...((next[providerId] || {}).models || {}) } };
    const model = { ...(provider.models[slug] || {}), enabled: !(provider.models[slug] || {}).enabled };
    provider.models[slug] = model;
    next[providerId] = provider;
    save(next);
  };

  const updateModel = (providerId, slug, patch) => {
    const next = { ...(providers || {}) };
    const provider = { ...(next[providerId] || {}), models: { ...((next[providerId] || {}).models || {}) } };
    provider.models[slug] = { ...(provider.models[slug] || {}), ...patch };
    next[providerId] = provider;
    save(next);
  };

  const removeModel = (providerId, slug) => {
    const next = { ...(providers || {}) };
    const provider = { ...(next[providerId] || {}), models: { ...((next[providerId] || {}).models || {}) } };
    delete provider.models[slug];
    next[providerId] = provider;
    save(next);
  };

  const commitModel = (providerId, slug) => {
    const name = (modelDraft.name || "").trim();
    if (!name) return;
    const patch = {
      label: (modelDraft.label || "").trim() || null,
      context_window: modelDraft.context_window ? parseInt(modelDraft.context_window, 10) : null,
      max_output_tokens: modelDraft.max_output_tokens ? parseInt(modelDraft.max_output_tokens, 10) : null,
    };
    // A brand-new model keyed by draft name (the slug becomes the modal name).
    const targetSlug = slug || name;
    updateModel(providerId, targetSlug, patch);
    setEditModel(null); setAddModel(null); setModelDraft({ name: "", label: "", context_window: "", max_output_tokens: "" });
  };

  const modelEntries = (providerId) => {
    const prov = (providers || {})[providerId];
    const models = Object.entries(prov?.models || {});
    const q = (search || "").toLowerCase();
    const list = q ? models.filter(([slug, m]) => (slug + " " + (m.label || "")).toLowerCase().includes(q)) : models;
    return { list, total: models.length, enabled: models.filter(([, m]) => m.enabled !== false).length, hasMatch: q ? list.length > 0 : true };
  };

  const isCollapsed = (providerId) => collapsed[providerId];
  const defaultCollapse = (providerId) => {
    const { enabled } = modelEntries(providerId);
    // Auto-expand providers that have enabled models.
    return providerId !== OPENAI_ID && enabled === 0;
  };
  const isOpen = (providerId) => {
    if (expanded[providerId] != null) return expanded[providerId];
    return !defaultCollapse(providerId);
  };
  const toggleGroup = (providerId) => {
    setExpanded((prev) => ({ ...prev, [providerId]: !isOpen(providerId) }));
    setCollapsed((prev) => ({ ...prev, [providerId]: !isOpen(providerId) }));
  };

  const providerList = Object.entries(providers || {})
    .filter(([providerId]) => modelEntries(providerId).hasMatch)
    .sort(([a], [b]) => (a === OPENAI_ID ? -1 : b === OPENAI_ID ? 1 : a.localeCompare(b)));

  const totalModels = providerList.reduce((acc, [, p]) => acc + Object.keys(p.models || {}).length, 0);

  return (
    <Page title="Models" description="Enable, disable, and configure the models each provider exposes."
      actions={<Badge color="blue">{totalModels} models</Badge>}>
      {error ? <Alert variant="error">{error}</Alert> : null}
      {savedMsg ? <Toast variant="success" message={savedMsg} onClose={() => setSavedMsg(null)} /> : null}

      <div className="flex flex-col gap-8">
        <SearchInput placeholder="Search models" value={search} onChange={setSearch} />

        {providerList.length === 0 ? (
          <EmptyState title="No providers" description="Add a provider from the Providers page to see its models." />
        ) : (
          <Section>
            {providerList.map(([providerId, provider]) => {
            const { list, total, enabled } = modelEntries(providerId);
            const open = isOpen(providerId);
            const isBuiltin = !!provider.readonly;
            return (
              <div key={providerId} className="flex flex-col gap-2">
                {/* Group header */}
                <button type="button" onClick={() => toggleGroup(providerId)}
                  className="group flex w-full cursor-interaction items-center justify-between gap-2 rounded-lg px-2 py-2 text-left hover:bg-token-foreground/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-token-focus-border">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className={"transition-transform duration-basic " + (open ? "rotate-90" : "")}>
                      <svg width={14} height={14} viewBox="0 0 16 16" fill="none" className="text-token-text-secondary">
                        <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <ProviderIconTile id={provider.icon} name={provider.label || providerId} className="h-6 w-6 border-none" />
                    <span className="truncate font-medium text-token-foreground text-sm">{provider.label || providerId}</span>
                    <span className="shrink-0 text-xs text-token-text-tertiary">{enabled}/{total} on</span>
                  </span>
                  {!isBuiltin && (
                    <span className="flex shrink-0 items-center gap-1">
                      <Button variant="secondary" size="sm" icon={<PlusIcon size={16} />} onClick={(e) => { e.stopPropagation(); setAddModel(providerId); setModelDraft({ name: "", label: "", context_window: "", max_output_tokens: "" }); }} disabled={saving}>Add</Button>
                    </span>
                  )}
                </button>
                {/* Models */}
                {open && (
                  <div className="flex flex-col gap-1.5 pl-2">
                    {list.length === 0 ? (
                      <div className="rounded-xl border border-token-border/30 px-4 py-3 text-sm text-token-text-secondary">{search ? "No models match." : isBuiltin ? "No models available." : "Add a model to this provider."}</div>
                    ) : (
                      <Card>
                        {list.map(([slug, model]) => (
                          <Row key={slug}
                            label={model.label || slug}
                            description={cx(model.label && model.label !== slug ? slug : null, model.description || null)}
                            control={
                              <div className="flex items-center gap-2">
                                {!isBuiltin && (
                                  <button type="button" aria-label={"Edit " + slug} onClick={() => { setEditModel({ providerId, slug, model }); setModelDraft({ name: slug, label: model.label || "", context_window: model.context_window || "", max_output_tokens: model.max_output_tokens || "" }); }} disabled={saving}
                                    className="no-drag cursor-interaction items-center gap-1 border whitespace-nowrap select-none focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 flex rounded-lg text-token-text-tertiary enabled:hover:bg-token-list-hover-background data-[state=open]:bg-token-list-hover-background border-transparent h-token-button-composer px-2 py-0 text-base leading-[18px] aspect-square shrink-0 items-center justify-center !px-0">
                                    <PencilIcon size={21} className="icon-xs" />
                                  </button>
                                )}
                                {!isBuiltin && (
                                  <Button variant="danger" size="sm" onClick={() => removeModel(providerId, slug)} disabled={saving}>Remove</Button>
                                )}
                                <Toggle checked={model.enabled !== false} onChange={() => toggleModel(providerId, slug)} disabled={saving} label={"Enable " + slug} />
                              </div>
                            } />
                        ))}
                      </Card>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          </Section>
        )}
      </div>

      {/* Edit / add model modal */}
      {(editModel || addModel) ? (
        <Modal
          title={editModel ? ("Edit " + (editModel.slug)) : ("Add model to " + (providers?.[addModel]?.label || addModel))}
          onClose={() => { if (!saving) { setEditModel(null); setAddModel(null); } }}
          footer={
            <>
              <Button variant="subtle" onClick={() => { setEditModel(null); setAddModel(null); }} disabled={saving}>Cancel</Button>
              <Button variant="primary" onClick={() => commitModel(editModel ? editModel.providerId : addModel, editModel ? editModel.slug : null)} disabled={saving || !modelDraft.name.trim()}>Save</Button>
            </>
          }>
          <LabeledField label="Model ID" hint="The model slug used when calling the API.">
            <Input placeholder="e.g. deepseek-chat" value={modelDraft.name} disabled={!!editModel} onChange={(e) => setModelDraft({ ...modelDraft, name: e.target.value })} />
          </LabeledField>
          <LabeledField label="Display name (optional)">
            <Input placeholder="DeepSeek V3" value={modelDraft.label} onChange={(e) => setModelDraft({ ...modelDraft, label: e.target.value })} />
          </LabeledField>
          <LabeledField label="Context window" hint="Tokens (e.g. 65536).">
            <SmallInput type="number" value={modelDraft.context_window || ""} onChange={(e) => setModelDraft({ ...modelDraft, context_window: e.target.value })} />
          </LabeledField>
          <LabeledField label="Max output tokens">
            <SmallInput type="number" value={modelDraft.max_output_tokens || ""} onChange={(e) => setModelDraft({ ...modelDraft, max_output_tokens: e.target.value })} />
          </LabeledField>
        </Modal>
      ) : null}
    </Page>
  );
}

export { CodexiumModelsSettings };
