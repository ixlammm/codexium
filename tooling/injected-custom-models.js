(() => {
  const fsMod = require("node:fs");
  const pathMod = require("node:path");
  const osMod = require("node:os");
  const home =
    (process.env.CODEX_HOME && process.env.CODEX_HOME.trim()) ||
    pathMod.join(osMod.homedir(), ".codex");
  const configPath = pathMod.join(home, "config.toml");

  const parseConfig = () => {
    if (!fsMod.existsSync(configPath)) return { sections: {}, providers: [] };
    const raw = fsMod.readFileSync(configPath, "utf8");
    const sections = {};
    let current = null;
    for (const line of raw.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const m = t.match(/^\[(.+)\]$/);
      if (m) {
        current = m[1].replace(/^"|"$/g, "");
        sections[current] = sections[current] || {};
        continue;
      }
      if (current === null) current = "__top__";
      sections[current] = sections[current] || {};
      const eq = t.indexOf("=");
      if (eq < 0) continue;
      let key = t.slice(0, eq).trim();
      key = key.replace(/^"|"$/g, "");
      let val = t.slice(eq + 1).trim();
      if (val.startsWith("[") || val.startsWith("{")) val = null;
      else if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      )
        val = val.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
      if (val !== null) sections[current][key] = val;
    }
    const providers = [];
    for (const k of Object.keys(sections)) {
      if (!k.startsWith("model_providers.")) continue;
      const rest = k.slice("model_providers.".length);
      const dot = rest.indexOf(".");
      let id = rest;
      let modelKey = null;
      if (dot >= 0) {
        id = rest.slice(0, dot);
        const sub = rest.slice(dot + 1);
        if (sub.indexOf("models.") === 0) {
          modelKey = sub.slice("models.".length).replace(/^"|"$/g, "");
        }
      }
      providers.push({ id, modelKey, ...sections[k] });
    }
    return { sections, providers };
  };

  const collectDeclaredModels = (sections, providerId) => {
    const pre = "model_providers." + providerId + ".models.";
    const out = [];
    for (const k of Object.keys(sections)) {
      if (k.indexOf(pre) === 0) {
        const slug = k.slice(pre.length).replace(/^"|"$/g, "");
        out.push({ slug, label: sections[k].label || slug });
      }
    }
    return out;
  };

  const buildModelObjects = (providerName, entries) =>
    entries.map((s) => ({
      slug: s.slug,
      title: s.label || s.slug,
      description: s.description || null,
      default_thinking_effort: null,
      owned_by: "custom",
      object: "model",
    }));

  const buildProviderRows = (providerId, providerName, entries) =>
    entries.map((me) => ({
      provider: providerId,
      providerLabel: providerName,
      model: me.slug,
      label: me.label || me.slug,
      description: me.description || null,
      hidden: false,
      isCustom: true,
    }));

  const buildCatalogFromRows = (rows, styleById) =>
    rows.map((r) => ({
      model:
        styleById && styleById[r.provider] === "bare"
          ? r.model
          : r.provider + "." + r.model,
      displayName: r.label || r.model,
      description: r.description || null,
      hidden: false,
      isCustom: true,
      isDefault: false,
      provider: r.provider,
      providerLabel: r.providerLabel,
      supportedReasoningEfforts: [
        { reasoningEffort: "low", description: "low effort" },
        { reasoningEffort: "medium", description: "medium effort" },
        { reasoningEffort: "high", description: "high effort" },
      ],
      defaultReasoningEffort: "medium",
    }));

  const setCatalog = (rows, sections) => {
    const top = (sections && sections.__top__) || {},
      topModel = top.model,
      topProv = top.model_provider,
      styles = {};
    for (const r of rows) {
      if (topProv === r.provider) styles[r.provider] = topModel && topModel.indexOf(".") > 0 ? "dot" : "bare";
      else styles[r.provider] = "dot";
    }
    const cat = buildCatalogFromRows(rows, styles);
    try {
      globalThis.__custom_models_catalog = cat;
    } catch (e) {}
    try {
      this.sharedObjectRepository.set("custom_models_catalog", cat);
    } catch (e) {}
  };

  // 1) SYNCHRONOUS: populate shared object from config.toml fallback models immediately
  try {
    const { sections, providers } = parseConfig();
    const providerRows = [];
    const feedRows = [];
    for (const p of providers) {
      if (!p.base_url) continue;
      const name = p.name || p.id;
      const declared = collectDeclaredModels(sections, p.id);
      if (declared.length) {
        providerRows.push(...buildProviderRows(p.id, name, declared));
        feedRows.push(...buildModelObjects(name, declared));
      }
    }
    if (providerRows.length) {
      const merged = (this.sharedObjectRepository.get("custom_models") ?? []).concat(providerRows);
      this.sharedObjectRepository.set("custom_models", merged);
    }
    if (feedRows.length) {
      this.sharedObjectRepository.set("custom_models_feed", feedRows);
    }
    const allRows = this.sharedObjectRepository.get("custom_models") ?? providerRows;
    setCatalog(allRows, sections);
  } catch (e) {}

  // 2) ASYNC: enrich with /v1/models from each provider; update shared object on each completion
  (async () => {
    try {
      const { sections, providers } = parseConfig();
      for (const p of providers) {
        if (!p.base_url) continue;
        const name = p.name || p.id;
        const base = String(p.base_url).replace(/\/+$/, "");
        const declared = collectDeclaredModels(sections, p.id);
        let entries = [];
        try {
          const authToken = p.env_key ? process.env[p.env_key] : null;
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 5000);
          const res = await fetch(base + "/models", {
            signal: controller.signal,
            headers: {
              Accept: "application/json",
              ...(authToken ? { Authorization: "Bearer " + authToken } : {}),
            },
          });
          clearTimeout(timer);
          if (res.ok) {
            const data = await res.json();
            const list = data && Array.isArray(data.data) ? data.data : null;
            if (list && list.length) {
              for (const x of list) {
                const slug = x.id || x.model;
                if (slug) entries.push({ slug, label: x.id || slug });
              }
            }
          }
        } catch (e) {
          entries = [];
        }
        if (!entries.length) continue; // keep the synchronous fallback already in shared object
        const newRows = buildProviderRows(p.id, name, entries);
        const existing = this.sharedObjectRepository.get("custom_models") ?? [];
        // remove existing entries for this provider before appending
        const filtered = existing.filter((r) => r.provider !== p.id);
        const merged = filtered.concat(newRows);
        this.sharedObjectRepository.set("custom_models", merged);
        const existingFeed = this.sharedObjectRepository.get("custom_models_feed") ?? [];
        const filteredFeed = existingFeed.filter(
          (m) => !merged.some((r) => r.provider === p.id && r.model === m.slug)
        );
        const newFeed = filteredFeed.concat(buildModelObjects(name, entries));
        this.sharedObjectRepository.set("custom_models_feed", newFeed);
        setCatalog(merged, sections);
      }
    } catch (e) {}
  })();
})();