const STORAGE_PREFIX = "rscalc.web.v1";
const CHANGELOG_FILE = "./CHANGELOG.md";
const INSTRUCTIONS_FILE = "./INSTRUCTIONS.md";
const REPORT_ISSUE_URL = typeof window !== "undefined" ? String(window.REPORT_ISSUE_URL || "").trim() : "";
const MAX_XP = 200_000_000;
const REAL_MAX_LEVEL = 120;
const METHOD_ALL_TAB_LABEL = "All";
const WEB_BASE_URL = new URL(".", import.meta.url);
const APP_ROOT_URL = new URL("../", import.meta.url);
const RS3_SKILL_ORDER = [
  "Attack", "Defence", "Strength", "Constitution", "Ranged", "Prayer", "Magic",
  "Cooking", "Woodcutting", "Fletching", "Fishing", "Firemaking", "Crafting",
  "Smithing", "Mining", "Herblore", "Agility", "Thieving", "Slayer", "Farming",
  "Runecrafting", "Hunter", "Construction", "Summoning", "Dungeoneering",
  "Divination", "Invention", "Archaeology", "Necromancy"
];
const FIXED_SKILL_ORDER = [
  "attack", "constitution", "mining", "strength", "agility", "smithing", "defence", "herblore", "fishing",
  "ranged", "thieving", "cooking", "prayer", "crafting", "firemaking", "magic", "fletching", "woodcutting",
  "runecrafting", "slayer", "farming", "construction", "hunter", "summoning", "dungeoneering",
  "divination", "invention", "archaeology", "necromancy"
];

const refs = {
  profileSelect: document.getElementById("profileSelect"),
  newProfileBtn: document.getElementById("newProfileBtn"),
  deleteProfileBtn: document.getElementById("deleteProfileBtn"),
  importRs3Btn: document.getElementById("importRs3Btn"),
  resetAllDataBtn: document.getElementById("resetAllDataBtn"),
  resetSkillOrderBtn: document.getElementById("resetSkillOrderBtn"),
  exportDataBtn: document.getElementById("exportDataBtn"),
  importDataBtn: document.getElementById("importDataBtn"),
  importDataFile: document.getElementById("importDataFile"),
  resetSkillSettingsBtn: document.getElementById("resetSkillSettingsBtn"),
  aboutBtn: document.getElementById("aboutBtn"),
  instructionsBtn: document.getElementById("instructionsBtn"),
  reportIssueBtn: document.getElementById("reportIssueBtn"),
  disableNotificationsToggle: document.getElementById("disableNotificationsToggle"),
  changelogModal: document.getElementById("changelogModal"),
  changelogBackdrop: document.getElementById("changelogBackdrop"),
  closeChangelogBtn: document.getElementById("closeChangelogBtn"),
  changelogTitle: document.getElementById("changelogTitle"),
  changelogContent: document.getElementById("changelogContent"),
  instructionsModal: document.getElementById("instructionsModal"),
  instructionsBackdrop: document.getElementById("instructionsBackdrop"),
  closeInstructionsBtn: document.getElementById("closeInstructionsBtn"),
  instructionsTitle: document.getElementById("instructionsTitle"),
  instructionsContent: document.getElementById("instructionsContent"),
  saveStatus: document.getElementById("saveStatus"),
  bottomNotice: document.getElementById("bottomNotice"),
  wikiPreview: document.getElementById("wikiPreview"),
  validationCard: document.getElementById("validationCard"),
  validationList: document.getElementById("validationList"),
  virtualToggle: document.getElementById("virtualToggle"),
  skillsGrid: document.getElementById("skillsGrid"),
  boostsWrap: document.getElementById("boostsWrap"),
  methodsWrap: document.getElementById("methodsWrap"),
  currentXp: document.getElementById("currentXp"),
  goalStartLevel: document.getElementById("goalStartLevel"),
  goalStartXp: document.getElementById("goalStartXp"),
  goalEndLevel: document.getElementById("goalEndLevel"),
  goalEndXp: document.getElementById("goalEndXp"),
  goalStartLevelLabel: document.getElementById("goalStartLevelLabel"),
  goalStartXpLabel: document.getElementById("goalStartXpLabel"),
  goalStartResolvedLabel: document.getElementById("goalStartResolvedLabel"),
  goalEndLevelLabel: document.getElementById("goalEndLevelLabel"),
  goalEndXpLabel: document.getElementById("goalEndXpLabel"),
  goalEndResolvedLabel: document.getElementById("goalEndResolvedLabel"),
  goalTrackingEnabled: document.getElementById("goalTrackingEnabled"),
  useCurrentAsStartBtn: document.getElementById("useCurrentAsStartBtn"),
  goalStartResolved: document.getElementById("goalStartResolved"),
  goalEndResolved: document.getElementById("goalEndResolved"),
  goalStartLevelResolved: document.getElementById("goalStartLevelResolved"),
  goalEndLevelResolved: document.getElementById("goalEndLevelResolved"),
  boostFactor: document.getElementById("boostFactor"),
  xpNeeded: document.getElementById("xpNeeded"),
  goalProgressText: document.getElementById("goalProgressText"),
  goalProgressBar: document.getElementById("goalProgressBar"),
  goalStartCard: document.getElementById("goalStartCard"),
  goalEndCard: document.getElementById("goalEndCard"),
  goalStatsCard: document.getElementById("goalStatsCard"),
  currentTitle: document.getElementById("currentTitle"),
  methodsTitle: document.getElementById("methodsTitle"),
  methodsHeaderControls: document.getElementById("methodsHeaderControls"),
  centerTabCurrent: document.getElementById("centerTabCurrent"),
  centerTabGoals: document.getElementById("centerTabGoals"),
  centerPaneCurrent: document.getElementById("centerPaneCurrent"),
  centerPaneGoals: document.getElementById("centerPaneGoals"),
  skillButtonTemplate: document.getElementById("skillButtonTemplate"),
};

const state = {
  skills: [],
  skillByKey: new Map(),
  selectedSkillKey: null,
  profiles: [],
  activeProfile: null,
  profileData: null,
  suppressInput: false,
  validationIssues: [],
  changelogText: "",
  changelogVersion: "unknown",
  instructionsText: "",
  noticeTimer: null,
  noticeQueue: [],
  noticeActive: false,
  wikiPreviewCache: new Map(),
  wikiPreviewTimer: null,
  wikiPreviewTargetTitle: null,
  wikiPreviewRequestId: 0,
};

const numberFormat = new Intl.NumberFormat("en-US");

initialize();

function setDraggingCursorEnabled(enabled) {
  const active = !!enabled;
  document.body.classList.toggle("is-dragging", active);
  document.documentElement.classList.toggle("is-dragging", active);
  if (active) {
    document.body.style.setProperty("cursor", "var(--cursor-use) 0 0, grabbing", "important");
    document.documentElement.style.setProperty("cursor", "var(--cursor-use) 0 0, grabbing", "important");
  } else {
    document.body.style.removeProperty("cursor");
    document.documentElement.style.removeProperty("cursor");
  }
}

async function initialize() {
  await loadChangelogFile();
  await loadInstructionsFile();
  if (refs.changelogContent && !refs.changelogContent.innerHTML) {
    refs.changelogContent.innerHTML = renderMarkdown(state.changelogText || "Changelog not available.");
  }
  if (refs.instructionsContent && !refs.instructionsContent.innerHTML) {
    refs.instructionsContent.innerHTML = renderMarkdown(state.instructionsText || "Instructions not available.");
  }
  bindTopbarEvents();
  bindInputEvents();
  bindCenterTabEvents();
  bindGlobalDragCursorEvents();
  bindWikiPreviewEvents();
  window.addEventListener("resize", () => syncMethodTableHeaderGutter());
  const skills = await loadSkills();
  state.skills = skills;
  state.skillByKey = new Map(skills.map((s) => [s.key, s]));
  loadProfiles();
  hydrateProfileUI();
  renderAll();
  setSaveStatus("Ready");
}

function bindGlobalDragCursorEvents() {
  document.addEventListener("dragstart", () => setDraggingCursorEnabled(true));
  document.addEventListener("dragover", () => setDraggingCursorEnabled(true));
  document.addEventListener("dragend", () => setDraggingCursorEnabled(false));
  document.addEventListener("drop", () => setDraggingCursorEnabled(false));
}

function bindWikiPreviewEvents() {
  if (!refs.methodsWrap || !refs.wikiPreview) return;
  document.addEventListener("mouseover", onMethodsLinkMouseOver);
  document.addEventListener("mousemove", onMethodsLinkMouseMove);
  document.addEventListener("mouseout", onMethodsLinkMouseOut);
}

function findPreviewLink(target) {
  if (!(target instanceof Element)) return null;
  const direct = target.closest("a[data-wiki-preview-title]");
  if (direct instanceof HTMLAnchorElement) return direct;
  const cell = target.closest("td");
  if (!cell) return null;
  const nested = cell.querySelector("a[data-wiki-preview-title]");
  return nested instanceof HTMLAnchorElement ? nested : null;
}

function onMethodsLinkMouseOver(event) {
  if (!refs.methodsWrap?.contains(event.target instanceof Node ? event.target : null)) return;
  const target = findPreviewLink(event.target);
  if (!target || !(target instanceof HTMLAnchorElement)) return;
  const title = String(target.dataset.wikiPreviewTitle || "").trim();
  if (!title) return;
  if (window.WIKI_PREVIEW_DEBUG) console.debug("[wiki-preview] over", title);
  state.wikiPreviewTargetTitle = title;
  if (state.wikiPreviewTimer) {
    window.clearTimeout(state.wikiPreviewTimer);
    state.wikiPreviewTimer = null;
  }
  renderWikiPreviewLoading(title);
  setWikiPreviewVisible(true);
  positionWikiPreview(event.clientX, event.clientY);
  state.wikiPreviewTimer = window.setTimeout(async () => {
    state.wikiPreviewTimer = null;
    const requestId = ++state.wikiPreviewRequestId;
    const data = await fetchWikiPreviewData(title);
    if (requestId !== state.wikiPreviewRequestId) return;
    if (state.wikiPreviewTargetTitle !== title) return;
    renderWikiPreviewData(data, title);
  }, 180);
}

function onMethodsLinkMouseMove(event) {
  if (!refs.methodsWrap?.contains(event.target instanceof Node ? event.target : null)) return;
  if (!state.wikiPreviewTargetTitle) {
    const link = findPreviewLink(event.target);
    if (link) onMethodsLinkMouseOver(event);
    return;
  }
  positionWikiPreview(event.clientX, event.clientY);
}

function onMethodsLinkMouseOut(event) {
  if (!refs.methodsWrap?.contains(event.target instanceof Node ? event.target : null)) return;
  const from = findPreviewLink(event.target);
  if (!from) return;
  const to = findPreviewLink(event.relatedTarget);
  if (to === from) return;
  if (window.WIKI_PREVIEW_DEBUG) console.debug("[wiki-preview] out");
  hideWikiPreview();
}

function hideWikiPreview() {
  if (state.wikiPreviewTimer) {
    window.clearTimeout(state.wikiPreviewTimer);
    state.wikiPreviewTimer = null;
  }
  state.wikiPreviewTargetTitle = null;
  setWikiPreviewVisible(false);
}

function setWikiPreviewVisible(visible) {
  if (!refs.wikiPreview) return;
  refs.wikiPreview.hidden = !visible;
  refs.wikiPreview.setAttribute("aria-hidden", visible ? "false" : "true");
  refs.wikiPreview.classList.toggle("show", visible);
}

function positionWikiPreview(mouseX, mouseY) {
  const el = refs.wikiPreview;
  if (!el || el.hidden) return;
  const pad = 8;
  const offset = 14;
  let left = mouseX + offset;
  let top = mouseY + offset;
  const rect = el.getBoundingClientRect();
  if (left + rect.width + pad > window.innerWidth) left = Math.max(pad, mouseX - rect.width - offset);
  if (top + rect.height + pad > window.innerHeight) top = Math.max(pad, mouseY - rect.height - offset);
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
}

function renderWikiPreviewLoading(title) {
  const el = refs.wikiPreview;
  if (!el) return;
  if (window.WIKI_PREVIEW_DEBUG) console.debug("[wiki-preview] loading", title);
  el.classList.add("wiki-preview-loading");
  el.innerHTML = `
    <div class="wiki-preview-head">${escapeHtml(title)}</div>
    <div class="wiki-preview-body">
      <div class="wiki-preview-text">Loading preview...</div>
    </div>`;
}

function renderWikiPreviewData(data, fallbackTitle) {
  const el = refs.wikiPreview;
  if (!el) return;
  if (window.WIKI_PREVIEW_DEBUG) console.debug("[wiki-preview] data", data?.title || fallbackTitle);
  el.classList.remove("wiki-preview-loading");
  const title = escapeHtml(data.title || fallbackTitle);
  const summary = escapeHtml(data.summary || "No summary available.");
  const thumbHtml = data.thumb
    ? `<div class="wiki-preview-thumb"><img src="${escapeHtml(data.thumb)}" alt="" /></div>`
    : `<div class="wiki-preview-thumb"></div>`;
  el.innerHTML = `
    <div class="wiki-preview-head">${title}</div>
    <div class="wiki-preview-body">
      ${thumbHtml}
      <div class="wiki-preview-text">${summary}</div>
    </div>`;
}

async function fetchWikiPreviewData(title) {
  const cached = state.wikiPreviewCache.get(title);
  if (cached) return cached;
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    prop: "extracts|pageimages",
    exintro: "1",
    explaintext: "1",
    pithumbsize: "120",
    titles: title,
  });
  const url = `https://runescape.wiki/api.php?${params.toString()}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const pages = json?.query?.pages || {};
    const page = Object.values(pages)[0] || {};
    const rawExtract = String(page.extract || "").trim();
    const data = {
      title: String(page.title || title),
      summary: rawExtract ? truncateText(rawExtract, 220) : "No summary available.",
      thumb: String(page.thumbnail?.source || ""),
    };
    state.wikiPreviewCache.set(title, data);
    return data;
  } catch {
    const data = { title, summary: "Preview unavailable.", thumb: "" };
    state.wikiPreviewCache.set(title, data);
    return data;
  }
}

function truncateText(text, max) {
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1)).trimEnd()}...`;
}

function bindCenterTabEvents() {
  refs.centerTabCurrent?.addEventListener("click", () => setActiveCenterPane("current", true));
  refs.centerTabGoals?.addEventListener("click", () => setActiveCenterPane("goals", true));
}

function setActiveCenterPane(pane, persist = false) {
  const normalized = pane === "goals" ? "goals" : "current";
  const isCurrent = normalized === "current";
  refs.centerTabCurrent?.classList.toggle("active", isCurrent);
  refs.centerTabGoals?.classList.toggle("active", !isCurrent);
  refs.centerPaneCurrent?.classList.toggle("active", isCurrent);
  refs.centerPaneGoals?.classList.toggle("active", !isCurrent);
  if (persist && state.profileData) {
    if (state.profileData.centerPane !== normalized) {
      state.profileData.centerPane = normalized;
      persistProfile();
    }
  }
}

function updateCenterTabAvailability() {
  const enabled = !!refs.goalTrackingEnabled?.checked;
  if (refs.centerTabGoals) {
    refs.centerTabGoals.disabled = !enabled;
    refs.centerTabGoals.classList.toggle("disabled", !enabled);
  }
  if (!enabled && refs.centerPaneGoals?.classList.contains("active")) {
    setActiveCenterPane("current");
  }
}

function setSaveStatus(text) {
  if (!refs.saveStatus) return;
  refs.saveStatus.textContent = text;
}

function showBottomNotice(message, type = "info", durationMs = 5000) {
  if (state.profileData?.notificationsDisabled) return;
  state.noticeQueue.push({ message: String(message || ""), type, durationMs });
  if (state.noticeActive) return;
  showNextBottomNotice();
}

function showNextBottomNotice() {
  const el = refs.bottomNotice;
  if (!el) return;
  if (!state.noticeQueue.length) {
    state.noticeActive = false;
    return;
  }
  state.noticeActive = true;
  const notice = state.noticeQueue.shift();
  if (!notice) {
    state.noticeActive = false;
    return;
  }
  if (state.noticeTimer) {
    window.clearTimeout(state.noticeTimer);
    state.noticeTimer = null;
  }
  el.textContent = notice.message;
  el.classList.remove("error", "show");
  if (notice.type === "error") el.classList.add("error");
  // force reflow so repeated notices replay animation
  void el.offsetHeight;
  el.classList.add("show");
  state.noticeTimer = window.setTimeout(() => {
    el.classList.remove("show");
    state.noticeTimer = window.setTimeout(() => {
      state.noticeTimer = null;
      showNextBottomNotice();
    }, 220);
  }, Math.max(3000, notice.durationMs));
}

function trySetStorageItem(key, value, context) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    const prefix = context ? `${context}: ` : "";
    showBottomNotice(`${prefix}Failed to save locally. ${detail}`, "error", 4200);
    return false;
  }
}

async function loadChangelogFile() {
  const urls = [
    new URL(CHANGELOG_FILE, WEB_BASE_URL).href,
    new URL(CHANGELOG_FILE, APP_ROOT_URL).href,
    "/web/CHANGELOG.md",
    "/CHANGELOG.md",
  ];
  const text = await fetchTextWithFallback(urls);
  state.changelogText = text || "# Changelog\n\nUnable to load CHANGELOG.md.";
  const match = state.changelogText.match(/^##\s+\[([^\]]+)\]/m);
  state.changelogVersion = match ? match[1] : "unknown";
}

async function loadInstructionsFile() {
  const urls = [
    new URL(INSTRUCTIONS_FILE, WEB_BASE_URL).href,
    new URL(INSTRUCTIONS_FILE, APP_ROOT_URL).href,
    "/INSTRUCTIONS.md",
  ];
  const text = await fetchTextWithFallback(urls);
  state.instructionsText = text || "# Instructions\n\nInstructions file not available.";
}

function bindTopbarEvents() {
  refs.profileSelect.addEventListener("change", () => {
    const selected = refs.profileSelect.value;
    if (!selected || selected === state.activeProfile) return;
    state.activeProfile = selected;
    trySetStorageItem(`${STORAGE_PREFIX}.selectedProfile`, selected, "Profile selection save");
    state.profileData = loadProfileData(selected);
    renderAll();
  });

  refs.newProfileBtn.addEventListener("click", () => {
    const input = window.prompt("Enter profile name (use your RuneScape username for high-score import):", "");
    if (!input) return;
    const cleaned = sanitizeProfileName(input);
    if (!cleaned) return;
    if (!state.profiles.includes(cleaned)) {
      state.profiles.push(cleaned);
      saveProfiles();
    }
    state.activeProfile = cleaned;
    state.profileData = createDefaultProfileData();
    saveProfileData(cleaned, state.profileData);
    trySetStorageItem(`${STORAGE_PREFIX}.selectedProfile`, cleaned, "Profile selection save");
    hydrateProfileUI();
    renderAll();
  });

  refs.deleteProfileBtn.addEventListener("click", () => {
    if (state.activeProfile === "default") return;
    if (!window.confirm(`Delete profile '${state.activeProfile}'?`)) return;
    const key = profileStorageKey(state.activeProfile);
    localStorage.removeItem(key);
    state.profiles = state.profiles.filter((p) => p !== state.activeProfile);
    if (!state.profiles.includes("default")) state.profiles.unshift("default");
    saveProfiles();
    state.activeProfile = "default";
    trySetStorageItem(`${STORAGE_PREFIX}.selectedProfile`, state.activeProfile, "Profile selection save");
    state.profileData = loadProfileData(state.activeProfile);
    hydrateProfileUI();
    renderAll();
  });

  refs.virtualToggle.addEventListener("change", () => {
    state.profileData.showVirtualLevels = refs.virtualToggle.checked;
    ensureProfileSkillState();
    let convertedStartCount = 0;
    let convertedEndCount = 0;
    if (!refs.virtualToggle.checked) {
      const activeSkill = selectedSkill();
      if (activeSkill) {
        const activeState = getSkillState(activeSkill.key);
        if (convertGoalStartLevelToXpIfNeeded(activeSkill, activeState, { useUiFields: true, modeFromUi: true })) {
          convertedStartCount += 1;
        }
        if (convertGoalEndLevelToXpIfNeeded(activeSkill, activeState, { useUiFields: true, modeFromUi: true })) {
          convertedEndCount += 1;
        }
      }
      for (const skill of state.skills) {
        if (activeSkill && skill.key === activeSkill.key) continue;
        const s = getSkillState(skill.key);
        if (convertGoalStartLevelToXpIfNeeded(skill, s)) {
          convertedStartCount += 1;
        }
        if (convertGoalEndLevelToXpIfNeeded(skill, s)) {
          convertedEndCount += 1;
        }
      }
    }
    persistProfile();
    renderAll();
    if (convertedStartCount > 0 || convertedEndCount > 0) {
      const parts = [];
      if (convertedStartCount > 0) parts.push(`${convertedStartCount} goal start`);
      if (convertedEndCount > 0) parts.push(`${convertedEndCount} goal end`);
      showBottomNotice(`Virtual off: converted ${parts.join(" and ")} target(s) from Level to XP to preserve targets.`);
    }
  });

  refs.importRs3Btn.addEventListener("click", async () => {
    const player = (state.activeProfile || "").trim();
    if (!player) {
      window.alert("No active profile/player name.");
      return;
    }
    refs.importRs3Btn.disabled = true;
    refs.importRs3Btn.textContent = "Importing...";
    debugLog("info", `Import RS3 requested for profile/player '${player}'.`);
    try {
      const xpBySkill = await fetchRs3HiscoreXp(player);
      if (!xpBySkill.size) {
        throw new Error("No hiscore data returned.");
      }
      ensureProfileSkillState();
      for (const skill of state.skills) {
        const xp = xpBySkill.get(skill.name);
        if (!Number.isFinite(xp)) continue;
        const s = getSkillState(skill.key);
        const level = skill.curve.levelForXp(xp);
        s.currentXp = xp;
        s.currentByXp = true;
        s.currentLevelInput = level;
      }
      persistProfile();
      renderAll();
      debugLog("info", `Import RS3 complete. Skills with XP data: ${xpBySkill.size}.`);
      window.alert(`Imported RS3 hiscores for: ${player}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      debugLog("error", `Import RS3 failed: ${message}`);
      window.alert(`Import failed: ${message}`);
    } finally {
      refs.importRs3Btn.disabled = false;
      refs.importRs3Btn.textContent = "Import RS3";
    }
  });

  refs.resetAllDataBtn?.addEventListener("click", () => {
    const ok = window.confirm("This will remove all saved profiles/settings for this site. Continue?");
    if (!ok) return;
    clearPrefixedStorage();
    loadProfiles();
    hydrateProfileUI();
    renderAll();
    setSaveStatus("All data reset");
  });

  refs.resetSkillOrderBtn?.addEventListener("click", () => {
    if (!state.profileData) return;
    state.profileData.skillOrderCustomized = false;
    state.profileData.skillOrder = [];
    persistProfile();
    renderSkillsGrid();
  });

  refs.resetSkillSettingsBtn?.addEventListener("click", () => {
    const skill = selectedSkill();
    if (!skill) return;
    const ok = window.confirm(`Reset all saved settings for ${skill.name}?`);
    if (!ok) return;
    ensureProfileSkillState();
    const existing = getSkillState(skill.key);
    const reset = defaultSkillState(skill);
    reset.currentXp = existing.currentXp;
    reset.currentByXp = existing.currentByXp;
    reset.currentLevelInput = existing.currentLevelInput;
    state.profileData.skills[skill.key] = reset;
    persistProfile();
    renderAll();
  });

  refs.exportDataBtn.addEventListener("click", () => {
    try {
      const summary = exportAppData();
      window.alert(`Exported ${summary.keyCount} keys across ${summary.profileCount} profile(s).`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      window.alert(`Export failed: ${message}`);
    }
  });

  refs.importDataBtn.addEventListener("click", () => {
    if (!refs.importDataFile) return;
    refs.importDataFile.value = "";
    refs.importDataFile.click();
  });

  refs.importDataFile?.addEventListener("change", async () => {
    const file = refs.importDataFile.files?.[0];
    if (!file) return;
    try {
      await importAppDataFromFile(file);
      loadProfiles();
      hydrateProfileUI();
      renderAll();
      window.alert("Data import completed.");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message === "Import cancelled.") return;
      window.alert(`Import failed: ${message}`);
    } finally {
      refs.importDataFile.value = "";
    }
  });

  refs.aboutBtn?.addEventListener("click", () => {
    if (!refs.changelogModal) return;
    if (refs.changelogTitle) refs.changelogTitle.textContent = `Changelog (${state.changelogVersion})`;
    if (refs.changelogContent) refs.changelogContent.innerHTML = renderMarkdown(state.changelogText || "Changelog not available.");
    refs.changelogModal.hidden = false;
  });
  refs.instructionsBtn?.addEventListener("click", () => {
    if (!refs.instructionsModal) return;
    if (refs.instructionsTitle) refs.instructionsTitle.textContent = "Instructions";
    if (refs.instructionsContent) refs.instructionsContent.innerHTML = renderMarkdown(state.instructionsText || "Instructions not available.");
    refs.instructionsModal.hidden = false;
  });
  refs.reportIssueBtn?.addEventListener("click", () => {
    if (!REPORT_ISSUE_URL) {
      window.alert("Report issue URL is not configured yet. Set window.REPORT_ISSUE_URL in import-config.js.");
      return;
    }
    window.open(REPORT_ISSUE_URL, "_blank", "noopener,noreferrer");
  });
  refs.closeChangelogBtn?.addEventListener("click", () => {
    if (refs.changelogModal) refs.changelogModal.hidden = true;
  });
  refs.changelogBackdrop?.addEventListener("click", () => {
    if (refs.changelogModal) refs.changelogModal.hidden = true;
  });
  refs.closeInstructionsBtn?.addEventListener("click", () => {
    if (refs.instructionsModal) refs.instructionsModal.hidden = true;
  });
  refs.instructionsBackdrop?.addEventListener("click", () => {
    if (refs.instructionsModal) refs.instructionsModal.hidden = true;
  });
  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (refs.changelogModal && !refs.changelogModal.hidden) refs.changelogModal.hidden = true;
    if (refs.instructionsModal && !refs.instructionsModal.hidden) refs.instructionsModal.hidden = true;
  });

  refs.disableNotificationsToggle?.addEventListener("change", () => {
    if (!state.profileData) return;
    state.profileData.notificationsDisabled = !!refs.disableNotificationsToggle.checked;
    if (state.profileData.notificationsDisabled) {
      state.noticeQueue = [];
      state.noticeActive = false;
      if (state.noticeTimer) {
        window.clearTimeout(state.noticeTimer);
        state.noticeTimer = null;
      }
      refs.bottomNotice?.classList.remove("show", "error");
    }
    persistProfile();
  });
}

function bindInputEvents() {
  for (const el of [refs.currentXp, refs.goalStartLevel, refs.goalStartXp, refs.goalEndLevel, refs.goalEndXp]) {
    if (!el) continue;
    el.addEventListener("input", () => recalcAndRender());
    el.addEventListener("blur", () => recalcAndRender());
  }

  document.querySelectorAll("input[name='goalStartBy'],input[name='goalEndBy']")
    .forEach((el) => el.addEventListener("change", () => recalcAndRender()));

  refs.goalTrackingEnabled.addEventListener("change", () => {
    if (refs.goalTrackingEnabled.checked) {
      const skill = selectedSkill();
      if (skill) {
        const currentXp = normalizeXp(refs.currentXp.value, skill.curve.maxXp);
        const currentLevel = skill.curve.levelForXp(currentXp);
        const showVirtual = !!state.profileData.showVirtualLevels;
        const effectiveMaxLevel = showVirtual ? skill.curve.maxVirtual : skill.curve.maxReal;
        const capLevelXp = skill.curve.xpForLevel(effectiveMaxLevel);
        const nextLevel = Math.min(effectiveMaxLevel, currentLevel + 1);

        setRadio("goalStartBy", "xp");
        refs.goalStartXp.value = String(currentXp);
        refs.goalStartLevel.value = String(currentLevel);

        if (currentXp > capLevelXp) {
          setRadio("goalEndBy", "max");
          refs.goalEndXp.value = String(MAX_XP);
          showBottomNotice("Goal defaults applied: Start set to current XP, End set to MAX.");
        } else {
          setRadio("goalEndBy", "level");
          refs.goalEndLevel.value = String(nextLevel);
          refs.goalEndXp.value = String(skill.curve.xpForLevel(nextLevel));
          showBottomNotice("Goal defaults applied: Start set to current XP, End set to next level.");
        }
      }
    }
    recalcAndRender();
  });

  refs.useCurrentAsStartBtn.addEventListener("click", () => {
    setRadio("goalStartBy", "xp");
    refs.goalStartXp.value = normalizeNonNegativeInt(refs.currentXp.value);
    recalcAndRender();
  });
}

async function loadSkills() {
  state.validationIssues = [];
  const manifest = await fetchJson(new URL("./skills-manifest.json", WEB_BASE_URL).href);
  if (!manifest) {
    state.validationIssues.push({ scope: "manifest", line: 0, message: "skills-manifest.json could not be loaded." });
  }
  const files = (manifest?.skills ?? []).filter((x) => typeof x === "string");
  const skills = [];
  for (const fileName of files) {
    const text = await fetchTextWithFallback([
      new URL(`../skills/${fileName}`, WEB_BASE_URL).href,
      new URL(`./skills/${fileName}`, WEB_BASE_URL).href,
      new URL(`skills/${fileName}`, APP_ROOT_URL).href,
      `/skills/${fileName}`,
    ]);
    if (!text) {
      state.validationIssues.push({ scope: fileName, line: 0, message: "Skill file not found/readable." });
      continue;
    }
    const parsed = parseSkillFile(fileName, text);
    skills.push(parsed.skill);
    for (const issue of parsed.issues) {
      state.validationIssues.push({ scope: fileName, line: issue.line, message: issue.message });
    }
  }
  return skills;
}

function parseSkillFile(fileName, text) {
  const base = fileName.replace(/\.[^.]+$/, "");
  const name = toDisplayName(base);
  let curve = base.toLowerCase() === "invention" ? buildInventionCurve() : buildStandardCurve();
  let locked = true;
  let icon = null;
  const methods = [];
  const boosts = [];
  const issues = [];

  let block = "";
  let method = { name: "", type: "Default", level: 1, xp: null };
  let boost = { name: "", type: "General", xpPercent: null, xpMultiplier: null };

  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const lineNo = i + 1;
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const lower = line.toLowerCase();

    if (lower.startsWith("curve:")) {
      const v = line.slice(6).trim().toLowerCase();
      if (v === "invention") curve = buildInventionCurve();
      if (v === "standard") curve = buildStandardCurve();
      continue;
    }
    if (lower.startsWith("icon:")) {
      icon = line.slice(5).trim();
      continue;
    }
    if (lower.startsWith("locked:")) {
      const v = line.slice(7).trim().toLowerCase();
      if (["true", "1", "yes", "on", "locked"].includes(v)) locked = true;
      else if (["false", "0", "no", "off", "unlocked"].includes(v)) locked = false;
      else issues.push({ line: lineNo, message: "Invalid Locked value. Use true/false." });
      continue;
    }
    if (lower.startsWith("method:")) {
      finalizeMethod(methods, method, issues, lineNo);
      if (block === "boost") finalizeBoost(boosts, boost, issues, lineNo);
      block = "method";
      method = { name: line.slice(7).trim(), type: "Default", level: 1, xp: null };
      boost = { name: "", type: "General", xpPercent: null, xpMultiplier: null };
      continue;
    }
    if (lower.startsWith("boost:")) {
      if (block === "method") finalizeMethod(methods, method, issues, lineNo);
      finalizeBoost(boosts, boost, issues, lineNo);
      block = "boost";
      boost = { name: line.slice(6).trim(), type: "General", xpPercent: null, xpMultiplier: null };
      method = { name: "", type: "Default", level: 1, xp: null };
      continue;
    }
    if (lower.startsWith("type:")) {
      const v = line.slice(5).trim();
      if (block === "boost") boost.type = v || "General";
      else if (block === "method") method.type = v || "Default";
      else issues.push({ line: lineNo, message: "Type is outside a Method/Boost block." });
      continue;
    }
    if (lower.startsWith("level:")) {
      if (block !== "method") {
        issues.push({ line: lineNo, message: "Level is outside a Method block." });
        continue;
      }
      const n = Number.parseInt(line.slice(6).trim(), 10);
      if (Number.isFinite(n) && n >= 1) method.level = n;
      else issues.push({ line: lineNo, message: "Invalid Level value." });
      continue;
    }
    if (lower.startsWith("xp-percent:")) {
      if (block !== "boost") {
        issues.push({ line: lineNo, message: "XP-Percent is outside a Boost block." });
        continue;
      }
      const n = Number.parseFloat(line.slice(11).trim().replace("%", ""));
      if (Number.isFinite(n)) boost.xpPercent = n;
      else issues.push({ line: lineNo, message: "Invalid XP-Percent value." });
      continue;
    }
    if (lower.startsWith("xp-multiplier:")) {
      if (block !== "boost") {
        issues.push({ line: lineNo, message: "XP-Multiplier is outside a Boost block." });
        continue;
      }
      const n = Number.parseFloat(line.slice(14).trim());
      if (Number.isFinite(n)) boost.xpMultiplier = n;
      else issues.push({ line: lineNo, message: "Invalid XP-Multiplier value." });
      continue;
    }
    if (lower.startsWith("xp:")) {
      if (block !== "method") {
        issues.push({ line: lineNo, message: "XP is outside a Method block." });
        continue;
      }
      const n = Number.parseFloat(line.slice(3).trim());
      if (Number.isFinite(n) && n > 0) method.xp = n;
      else issues.push({ line: lineNo, message: "Invalid XP value." });
      continue;
    }
    issues.push({ line: lineNo, message: `Unrecognized line: ${line}` });
  }

  if (block === "method") finalizeMethod(methods, method, issues, lines.length);
  if (block === "boost") finalizeBoost(boosts, boost, issues, lines.length);

  return {
    skill: {
      key: normalizeKey(name),
      fileName,
      name,
      locked,
      curve,
      methods,
      boosts,
      iconCandidates: iconCandidatesForSkill(name, icon),
    },
    issues,
  };
}

function finalizeMethod(methods, m, issues, lineNo) {
  if (!m.name) return;
  if (!Number.isFinite(m.xp) || m.xp <= 0) {
    issues.push({ line: lineNo, message: `Method '${m.name}' is missing valid XP.` });
    return;
  }
  methods.push({ action: m.name, type: m.type || "Default", requiredLevel: Math.max(1, m.level || 1), xpPerAction: m.xp });
}

function finalizeBoost(boosts, b, issues, lineNo) {
  if (!b.name) return;
  if (!Number.isFinite(b.xpPercent) && !Number.isFinite(b.xpMultiplier)) {
    issues.push({ line: lineNo, message: `Boost '${b.name}' needs XP-Percent or XP-Multiplier.` });
    return;
  }
  boosts.push({ name: b.name, type: b.type || "General", xpPercent: numOrNull(b.xpPercent), xpMultiplier: numOrNull(b.xpMultiplier) });
}

function numOrNull(v) { return Number.isFinite(v) ? v : null; }

function buildStandardCurve() {
  const xpByLevel = [0, 0];
  let points = 0;
  for (let level = 2; ; level++) {
    const prior = level - 1;
    points += Math.floor(prior + 300 * Math.pow(2, prior / 7));
    const xp = Math.floor(points / 4);
    if (xp > MAX_XP) break;
    xpByLevel.push(xp);
  }
  return makeCurve("STANDARD", xpByLevel);
}

function buildInventionCurve() {
  const xpByLevel = [
    0,0,830,1861,2902,3980,5126,6390,7787,9400,11275,13605,16372,19656,23546,28138,33520,39809,47109,55535,64802,
    77190,90811,106221,123573,143025,164742,188893,215651,245196,277713,316311,358547,404634,454796,509259,568254,
    632019,700797,774834,854383,946227,1044569,1149696,1261903,1381488,1508756,1644015,1787581,1939773,2100917,
    2283490,2476369,2679907,2894505,3120508,3358307,3608290,3870846,4146374,4435275,4758122,5096111,5449685,
    5819299,6205407,6608473,7028964,7467354,7924122,8399751,8925664,9472665,10041285,10632061,11245538,11882262,
    12542789,13227679,13937496,14672812,15478994,16313404,17176661,18069395,18992239,19945833,20930821,21947856,
    22997593,24080695,25259906,26475754,27728955,29020233,30350318,31719944,33129852,34580790,36073511,37608773,
    39270442,40978509,42733789,44537107,46389292,48291180,50243611,52247435,54303504,56412678,58575823,60793812,
    63067521,65397835,67785643,70231841,72737330,75303019,77929820,80618654,83370445,86186124,89066630,92012904,
    95025896,98106559,101255855,104474750,107764216,111125230,114558777,118065845,121647430,125304532,129038159,
    132849323,136739041,140708338,144758242,148889790,153104021,157401983,161784728,166253312,170808801,175452262,
    180184770,185007406,189921255,194927409
  ];
  return makeCurve("INVENTION", xpByLevel);
}

function makeCurve(name, xpByLevel) {
  return {
    name,
    xpByLevel,
    maxXp: MAX_XP,
    maxReal: REAL_MAX_LEVEL,
    maxVirtual: xpByLevel.length - 1,
    xpForLevel(level) {
      const clamped = clamp(level, 1, this.maxVirtual);
      return this.xpByLevel[clamped] ?? this.xpByLevel[this.maxVirtual];
    },
    levelForXp(xp) {
      const clampedXp = clamp(xp, 0, MAX_XP);
      for (let lvl = this.maxVirtual; lvl >= 1; lvl--) {
        if (clampedXp >= this.xpByLevel[lvl]) return lvl;
      }
      return 1;
    },
  };
}
function renderAll() {
  ensureProfileSkillState();
  state.selectedSkillKey = state.profileData.selectedSkillKey ?? state.selectedSkillKey;
  const selected = state.skillByKey.get(state.selectedSkillKey);
  if (!selected || selected.locked) {
    state.selectedSkillKey = initialSkillKey();
    state.profileData.selectedSkillKey = state.selectedSkillKey;
  }
  refs.virtualToggle.checked = !!state.profileData.showVirtualLevels;
  if (refs.disableNotificationsToggle) refs.disableNotificationsToggle.checked = !!state.profileData.notificationsDisabled;
  setActiveCenterPane(state.profileData.centerPane === "goals" ? "goals" : "current", false);
  renderSkillsGrid();
  renderValidationPanel();
  if (!state.selectedSkillKey || !state.skillByKey.has(state.selectedSkillKey)) {
    state.selectedSkillKey = initialSkillKey();
  }
  renderDetail();
}

function renderValidationPanel() {
  if (!refs.validationCard || !refs.validationList) return;
  const issues = state.validationIssues || [];
  if (!issues.length) {
    refs.validationCard.style.display = "none";
    refs.validationList.innerHTML = "";
    return;
  }
  refs.validationCard.style.display = "block";
  refs.validationList.innerHTML = "";
  for (const issue of issues) {
    const row = document.createElement("div");
    row.className = "validation-item";
    const line = issue.line > 0 ? `:${issue.line}` : "";
    row.textContent = `${issue.scope}${line} - ${issue.message}`;
    refs.validationList.appendChild(row);
  }
}

function initialSkillKey() {
  const saved = state.profileData.selectedSkillKey;
  if (saved && state.skillByKey.has(saved) && !state.skillByKey.get(saved).locked) return saved;
  const attack = state.skills.find((s) => s.name.toLowerCase() === "attack" && !s.locked);
  if (attack) return attack.key;
  return state.skills.find((s) => !s.locked)?.key ?? null;
}

function selectedSkill() {
  const skill = state.skillByKey.get(state.selectedSkillKey) ?? null;
  if (!skill || skill.locked) return null;
  return skill;
}

function setSelectedSkillButtonState(prevKey, nextKey) {
  if (!refs.skillsGrid) return;
  if (prevKey) {
    const prevBtn = refs.skillsGrid.querySelector(`.skill-btn[data-skill-key="${CSS.escape(prevKey)}"]`);
    prevBtn?.classList.remove("selected");
  }
  if (nextKey) {
    const nextBtn = refs.skillsGrid.querySelector(`.skill-btn[data-skill-key="${CSS.escape(nextKey)}"]`);
    nextBtn?.classList.add("selected");
  }
}

function renderSkillsGrid() {
  refs.skillsGrid.innerHTML = "";
  const order = effectiveSkillOrder();
  let dragFromKey = null;

  for (const skill of order) {
    const button = refs.skillButtonTemplate.content.firstElementChild.cloneNode(true);
    button.dataset.skillKey = skill.key;
    button.draggable = true;
    if (skill.key === state.selectedSkillKey) button.classList.add("selected");
    if (skill.locked) button.classList.add("locked");

    const titleEl = button.querySelector(".skill-btn-title");
    titleEl.textContent = "";
    const titleText = document.createElement("span");
    titleText.textContent = skill.name;
    titleEl.appendChild(titleText);
    const icon = button.querySelector(".skill-btn-icon");
    icon.src = skill.iconCandidates[0] || "";
    icon.onerror = () => {
      const i = Number(icon.dataset.fallbackIndex || "1");
      if (i >= skill.iconCandidates.length) {
        icon.style.visibility = "hidden";
        return;
      }
      icon.dataset.fallbackIndex = String(i + 1);
      icon.src = skill.iconCandidates[i];
    };

    const evalResult = evaluateSkill(skill);
    const showVirtual = !!state.profileData.showVirtualLevels;
    const shownLevel = showVirtual ? evalResult.currentLevel : Math.min(evalResult.currentLevel, skill.curve.maxReal);
    const maxLevel = showVirtual ? skill.curve.maxVirtual : skill.curve.maxReal;
    const isMaxXp = evalResult.currentXp >= MAX_XP;

    button.classList.toggle("maxed", isMaxXp);
    button.querySelector(".skill-btn-level").textContent = isMaxXp ? "MAX" : `${shownLevel} / ${maxLevel}`;
    button.querySelector(".skill-btn-xp").textContent = isMaxXp ? "" : `${formatInt(evalResult.currentXp)} xp`;
    button.querySelector(".skill-btn-mode").textContent = skill.locked ? "[LOCKED]" : (evalResult.goalActive ? "[GOAL]" : "[NEXT]");

    const pct = evalResult.buttonProgress;
    const fill = button.querySelector(".skill-btn-progress-fill");
    fill.style.width = `${Math.round(pct * 100)}%`;
    fill.style.setProperty("--progress-base", progressColor(pct));
    fill.classList.toggle("goal-track", !!evalResult.goalActive);
    fill.classList.toggle("next-track", !evalResult.goalActive);

    button.addEventListener("click", () => {
      if (skill.locked) return;
      if (state.selectedSkillKey === skill.key) return;
      const prevKey = state.selectedSkillKey;
      state.selectedSkillKey = skill.key;
      state.profileData.selectedSkillKey = skill.key;
      persistProfile();
      setSelectedSkillButtonState(prevKey, skill.key);
      renderDetail();
    });

    button.addEventListener("dragstart", (event) => {
      dragFromKey = skill.key;
      button.classList.add("dragging");
      setDraggingCursorEnabled(true);
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", skill.key);
      }
    });

    button.addEventListener("dragover", (event) => {
      if (!dragFromKey || dragFromKey === skill.key) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    });

    button.addEventListener("dragenter", (event) => {
      if (!dragFromKey || dragFromKey === skill.key) return;
      event.preventDefault();
      button.classList.add("drop-target");
    });

    button.addEventListener("dragleave", () => {
      button.classList.remove("drop-target");
    });

    button.addEventListener("drop", (event) => {
      event.preventDefault();
      button.classList.remove("drop-target");
      if (!dragFromKey || dragFromKey === skill.key) return;
      reorderSkillButtons(dragFromKey, skill.key);
    });

    button.addEventListener("dragend", () => {
      dragFromKey = null;
      setDraggingCursorEnabled(false);
      refs.skillsGrid.querySelectorAll(".skill-btn.dragging,.skill-btn.drop-target")
        .forEach((el) => el.classList.remove("dragging", "drop-target"));
    });

    refs.skillsGrid.appendChild(button);
  }
}

function renderDetail() {
  const skill = selectedSkill();
  if (!skill) {
    refs.boostsWrap.innerHTML = `<div class="tab-content boosts-empty">This skill is locked.</div>`;
    refs.methodsWrap.innerHTML = `<div class="tab-content boosts-empty">This skill is locked.</div>`;
    if (refs.methodsHeaderControls) refs.methodsHeaderControls.innerHTML = "";
    if (refs.currentTitle) refs.currentTitle.textContent = "Current";
    if (refs.methodsTitle) refs.methodsTitle.textContent = "Methods";
    for (const el of [refs.currentXp, refs.goalStartLevel, refs.goalStartXp, refs.goalEndLevel, refs.goalEndXp, refs.goalTrackingEnabled, refs.useCurrentAsStartBtn, refs.resetSkillSettingsBtn]) {
      if (el) el.disabled = true;
    }
    return;
  }
  const skillState = getSkillState(skill.key);
  for (const el of [refs.currentXp, refs.goalStartLevel, refs.goalStartXp, refs.goalEndLevel, refs.goalEndXp, refs.goalTrackingEnabled, refs.useCurrentAsStartBtn, refs.resetSkillSettingsBtn]) {
    if (el) el.disabled = false;
  }

  state.suppressInput = true;
  try {
    const showVirtual = !!state.profileData.showVirtualLevels;
    const levelInputMax = showVirtual ? skill.curve.maxVirtual : skill.curve.maxReal;
    setRadio("goalStartBy", skillState.goalStartByXp ? "xp" : "level");
    const goalEndMode = skillState.goalEndByMode || (skillState.goalEndByMax ? "max" : (skillState.goalEndByXp ? "xp" : "level"));
    setRadio("goalEndBy", goalEndMode);

    refs.goalStartLevel.max = String(levelInputMax);
    refs.goalEndLevel.max = String(levelInputMax);

    refs.currentXp.value = String(skillState.currentXp);
    refs.goalStartLevel.value = String(skillState.goalStartLevelInput);
    refs.goalStartXp.value = String(skillState.goalStartXp);
    refs.goalEndLevel.value = String(skillState.goalEndLevelInput);
    refs.goalEndXp.value = String(skillState.goalEndXp);
    refs.goalTrackingEnabled.checked = !!skillState.goalTrackingEnabled;
  } finally {
    state.suppressInput = false;
  }

  renderBoostTabs(skill, skillState);
  renderMethodTabs(skill, skillState);
  updateCenterTabAvailability();
  recalcAndRender(false);
}

function renderBoostTabs(skill, skillState) {
  refs.boostsWrap.innerHTML = "";
  refs.boostsWrap.classList.remove("single-pane");
  if (!skill.boosts.length) {
    const empty = document.createElement("div");
    empty.className = "tab-content boosts-empty";
    empty.textContent = "No boosts defined in this skill file.";
    refs.boostsWrap.classList.add("single-pane");
    refs.boostsWrap.appendChild(empty);
    return;
  }

  const types = distinctTypes(skill.boosts.map((b) => b.type), "General");
  const tabList = document.createElement("div");
  tabList.className = "tab-list";
  const content = document.createElement("div");
  content.className = "tab-content boosts-content";
  refs.boostsWrap.append(tabList, content);

  let selected = skillState.selectedBoostType;
  if (!types.includes(selected)) selected = types[0];
  skillState.selectedBoostType = selected;

  for (const type of types) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `tab-btn${type === selected ? " active" : ""}`;
    btn.textContent = type;
    btn.addEventListener("click", () => {
      skillState.selectedBoostType = type;
      persistProfile();
      renderBoostTabs(skill, skillState);
    });
    tabList.appendChild(btn);
  }

  const wrap = document.createElement("div");
  wrap.className = "check-list";
  for (const boost of skill.boosts.filter((b) => b.type === selected)) {
    const id = boostId(boost);
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = skillState.enabledBoostIds.includes(id);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) skillState.enabledBoostIds.push(id);
      else skillState.enabledBoostIds = skillState.enabledBoostIds.filter((x) => x !== id);
      skillState.enabledBoostIds = [...new Set(skillState.enabledBoostIds)];
      persistProfile();
      recalcAndRender();
      renderSkillsGrid();
    });
    label.append(checkbox, document.createTextNode(boostLabel(boost)));
    wrap.appendChild(label);
  }
  content.appendChild(wrap);
}

function renderMethodTabs(skill, skillState) {
  refs.methodsWrap.innerHTML = "";
  if (refs.methodsHeaderControls) refs.methodsHeaderControls.innerHTML = "";
  const allTypes = distinctTypes(skill.methods.map((m) => m.type), "Default");
  const orderedTypes = applySavedOrder(allTypes, skillState.methodTabOrder);
  const ordered = [...orderedTypes, METHOD_ALL_TAB_LABEL];
  skillState.methodTabOrder = orderedTypes;
  skillState.methodSorts = normalizeMethodSorts(skillState.methodSorts);

  let selected = skillState.selectedMethodTab;
  if (!ordered.includes(selected)) selected = orderedTypes[0] ?? METHOD_ALL_TAB_LABEL;
  skillState.selectedMethodTab = selected;

  const tabList = document.createElement("div");
  tabList.className = "tab-list";
  const content = document.createElement("div");
  content.className = "tab-content";
  refs.methodsWrap.append(tabList, content);

  let dragFrom = null;
  for (const type of ordered) {
    const isAllTab = type === METHOD_ALL_TAB_LABEL;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `tab-btn${type === selected ? " active" : ""}`;
    btn.textContent = type;
    btn.draggable = !isAllTab;

    btn.addEventListener("click", () => {
      skillState.selectedMethodTab = type;
      persistProfile();
      renderMethodTabs(skill, skillState);
      recalcAndRender();
    });

    if (!isAllTab) {
      btn.addEventListener("dragstart", () => {
        dragFrom = type;
        setDraggingCursorEnabled(true);
      });
      btn.addEventListener("dragover", (e) => e.preventDefault());
      btn.addEventListener("drop", (e) => {
        e.preventDefault();
        if (!dragFrom || dragFrom === type) return;
        const list = [...skillState.methodTabOrder];
        const from = list.indexOf(dragFrom);
        const to = list.indexOf(type);
        if (from < 0 || to < 0) return;
        const moved = list.splice(from, 1)[0];
        list.splice(to, 0, moved);
        skillState.methodTabOrder = list;
        persistProfile();
        renderMethodTabs(skill, skillState);
        recalcAndRender();
      });
      btn.addEventListener("dragend", () => {
        dragFrom = null;
        setDraggingCursorEnabled(false);
      });
    }

    tabList.appendChild(btn);
  }

  const headerWrap = document.createElement("div");
  headerWrap.className = "method-table-header-wrap";
  const clearSortBtn = document.createElement("button");
  clearSortBtn.type = "button";
  clearSortBtn.className = "method-clear-sort-btn";
  clearSortBtn.textContent = "Clear Filters";
  clearSortBtn.disabled = !skillState.methodSorts.length;
  clearSortBtn.addEventListener("click", () => {
    if (!skillState.methodSorts.length) return;
    skillState.methodSorts = [];
    persistProfile();
    renderMethodTabs(skill, skillState);
    recalcAndRender(false);
  });
  const resetTabsBtn = document.createElement("button");
  resetTabsBtn.type = "button";
  resetTabsBtn.className = "method-clear-sort-btn";
  resetTabsBtn.textContent = "Reset Tabs";
  const defaultOrder = distinctTypes(skill.methods.map((m) => m.type), "Default");
  const savedOrder = Array.isArray(skillState.methodTabOrder) ? skillState.methodTabOrder : [];
  const normalizedSaved = applySavedOrder(defaultOrder, savedOrder);
  const isDefaultOrder = normalizedSaved.length === defaultOrder.length
    && normalizedSaved.every((value, index) => value === defaultOrder[index]);
  resetTabsBtn.disabled = isDefaultOrder;
  resetTabsBtn.addEventListener("click", () => {
    if (isDefaultOrder) return;
    skillState.methodTabOrder = [...defaultOrder];
    persistProfile();
    renderMethodTabs(skill, skillState);
    recalcAndRender(false);
  });
  if (refs.methodsHeaderControls) {
    refs.methodsHeaderControls.replaceChildren(clearSortBtn, resetTabsBtn);
  }

  const headerTable = document.createElement("table");
  headerTable.className = "method-table method-table-head";
  headerTable.innerHTML = `<thead><tr>
    ${renderMethodHeaderCell(skillState, "action", "Action")}
    ${renderMethodHeaderCell(skillState, "requiredLevel", "Req Lvl")}
    ${renderMethodHeaderCell(skillState, "xpPerAction", "XP / Action")}
    ${renderMethodHeaderCell(skillState, "actionsNeeded", "Actions Needed")}
  </tr></thead>`;
  const headerRow = headerTable.querySelector("thead");
  headerRow?.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const th = target?.closest("th[data-sort-key]");
    if (!th) return;
    const key = String(th.getAttribute("data-sort-key") || "");
    if (!key) return;
    cycleMethodSort(skillState, key);
    persistProfile();
    renderMethodTabs(skill, skillState);
    recalcAndRender(false);
  });
  headerWrap.appendChild(headerTable);

  const tableWrap = document.createElement("div");
  tableWrap.className = "method-table-wrap";
  const bodyTable = document.createElement("table");
  bodyTable.className = "method-table method-table-body";
  bodyTable.innerHTML = "<tbody></tbody>";
  tableWrap.appendChild(bodyTable);

  content.append(headerWrap, tableWrap);
  syncMethodTableHeaderGutter();
}
function recalcAndRender(refreshSkillsGrid = true) {
  if (state.suppressInput) return;
  const skill = selectedSkill();
  if (!skill) return;
  const skillState = getSkillState(skill.key);

  const currentByXp = true;
  let goalStartByXp = selectedRadio("goalStartBy") === "xp";
  let goalEndMode = selectedRadio("goalEndBy");
  let goalEndByXp = goalEndMode === "xp";
  let goalEndByMax = goalEndMode === "max";

  const showVirtual = !!state.profileData.showVirtualLevels;
  if (!showVirtual && convertGoalStartLevelToXpIfNeeded(skill, skillState, { useUiFields: true, modeFromUi: true })) {
    setRadio("goalStartBy", "xp");
    goalStartByXp = true;
  }
  if (!showVirtual && convertGoalEndLevelToXpIfNeeded(skill, skillState, { useUiFields: true, modeFromUi: true })) {
    setRadio("goalEndBy", "xp");
    goalEndMode = "xp";
    goalEndByXp = true;
    goalEndByMax = false;
  }
  const effectiveMaxLevel = showVirtual ? skill.curve.maxVirtual : skill.curve.maxReal;
  const goalStartLevelInput = normalizeLevel(refs.goalStartLevel.value, effectiveMaxLevel);
  const goalEndLevelInput = normalizeLevel(refs.goalEndLevel.value, effectiveMaxLevel);

  let currentXp = normalizeXp(refs.currentXp.value, skill.curve.maxXp);
  let goalStartXp = goalStartByXp ? normalizeXp(refs.goalStartXp.value, skill.curve.maxXp) : skill.curve.xpForLevel(goalStartLevelInput);
  let goalEndXp = goalEndByMax
    ? MAX_XP
    : (goalEndByXp ? normalizeXp(refs.goalEndXp.value, skill.curve.maxXp) : skill.curve.xpForLevel(goalEndLevelInput));
  if (goalEndXp < goalStartXp) goalEndXp = goalStartXp;

  const currentLevel = skill.curve.levelForXp(currentXp);
  const goalStartLevel = skill.curve.levelForXp(goalStartXp);
  const goalEndLevel = skill.curve.levelForXp(goalEndXp);
  const shownCurrentLevel = showVirtual ? currentLevel : Math.min(currentLevel, skill.curve.maxReal);
  const shownGoalStartLevel = showVirtual ? goalStartLevel : Math.min(goalStartLevel, skill.curve.maxReal);
  const shownGoalEndLevel = showVirtual ? goalEndLevel : Math.min(goalEndLevel, skill.curve.maxReal);
  const nextLevel = Math.min(effectiveMaxLevel, shownCurrentLevel + 1);

  const wasGoalTrackingChecked = refs.goalTrackingEnabled.checked;
  let goalTrackingEnabled = wasGoalTrackingChecked;
  const isCurrentMaxed = currentXp >= MAX_XP;
  if (isCurrentMaxed) {
    goalTrackingEnabled = false;
    refs.goalTrackingEnabled.checked = false;
    refs.goalTrackingEnabled.disabled = true;
    setActiveCenterPane("current");
    if (wasGoalTrackingChecked) {
      showBottomNotice("Current XP is MAX. Goal tracking was disabled automatically.");
    }
  } else {
    refs.goalTrackingEnabled.disabled = false;
  }
  updateCenterTabAvailability();
  const goalStartIsSet = !goalStartByXp || String(refs.goalStartXp.value).trim() !== "";
  const goalActive = goalTrackingEnabled && goalStartIsSet && goalEndXp >= currentXp;
  const atLevelCap = shownCurrentLevel >= effectiveMaxLevel;
  const xpToMax = Math.max(0, MAX_XP - currentXp);
  const nextLevelXp = atLevelCap ? currentXp : skill.curve.xpForLevel(shownCurrentLevel + 1);
  const xpToLevel = Math.max(0, nextLevelXp - currentXp);

  const enabledBoosts = skill.boosts.filter((b) => skillState.enabledBoostIds.includes(boostId(b)));
  const boostMultiplier = computeBoostMultiplier(enabledBoosts);

  refs.currentXp.disabled = false;
  refs.goalStartLevel.max = String(effectiveMaxLevel);
  refs.goalEndLevel.max = String(effectiveMaxLevel);
  refs.goalStartLevel.disabled = goalStartByXp;
  refs.goalStartXp.disabled = !goalStartByXp;
  refs.goalEndLevel.disabled = goalEndByXp || goalEndByMax;
  refs.goalEndXp.disabled = !goalEndByXp || goalEndByMax;

  if (refs.goalStartLevelLabel) refs.goalStartLevelLabel.style.display = goalStartByXp ? "none" : "";
  refs.goalStartLevel.style.display = goalStartByXp ? "none" : "";
  if (refs.goalStartXpLabel) refs.goalStartXpLabel.style.display = goalStartByXp ? "" : "none";
  refs.goalStartXp.style.display = goalStartByXp ? "" : "none";
  if (refs.goalStartResolvedLabel) refs.goalStartResolvedLabel.textContent = goalStartByXp ? "Resolved level" : "Resolved XP";

  if (refs.goalEndLevelLabel) refs.goalEndLevelLabel.style.display = goalEndByXp || goalEndByMax ? "none" : "";
  refs.goalEndLevel.style.display = goalEndByXp || goalEndByMax ? "none" : "";
  if (refs.goalEndXpLabel) refs.goalEndXpLabel.style.display = goalEndByXp ? "" : "none";
  refs.goalEndXp.style.display = goalEndByXp ? "" : "none";
  if (refs.goalEndResolvedLabel) refs.goalEndResolvedLabel.textContent = goalEndByXp ? "Resolved level" : "Resolved XP";

  const totalGoalXp = goalActive ? Math.max(0, goalEndXp - goalStartXp) : 0;
  const doneGoalXp = goalActive ? clamp(currentXp - goalStartXp, 0, totalGoalXp) : 0;
  const goalPercent = goalActive ? (totalGoalXp === 0 ? (currentXp >= goalEndXp ? 100 : 0) : Math.round((doneGoalXp * 100) / totalGoalXp)) : 0;
  const xpNeeded = goalActive ? Math.max(0, goalEndXp - currentXp) : 0;
  const methodsTarget = goalEndByMax ? "MAX" : (goalActive ? "goal" : (atLevelCap ? "MAX" : "level"));
  const methodsXpNeeded = goalEndByMax ? xpToMax : (goalActive ? xpNeeded : (atLevelCap ? xpToMax : xpToLevel));

  state.suppressInput = true;
  try {
    const activeEl = document.activeElement;
    const editingGoalStartLevel = activeEl === refs.goalStartLevel;
    const editingGoalStartXp = activeEl === refs.goalStartXp;
    const editingGoalEndLevel = activeEl === refs.goalEndLevel;
    const editingGoalEndXp = activeEl === refs.goalEndXp;

    if (!editingGoalStartLevel) refs.goalStartLevel.value = String(shownGoalStartLevel);
    if (!editingGoalEndLevel) refs.goalEndLevel.value = String(shownGoalEndLevel);
    refs.currentXp.value = String(currentXp);
    if (!editingGoalStartXp) refs.goalStartXp.value = String(goalStartXp);
    if (!editingGoalEndXp) refs.goalEndXp.value = String(goalEndXp);
  } finally {
    state.suppressInput = false;
  }

  skillState.currentXp = currentXp;
  skillState.currentByXp = currentByXp;
  skillState.currentLevelInput = currentLevel;
  skillState.goalStartXp = goalStartXp;
  skillState.goalStartByXp = goalStartByXp;
  skillState.goalStartLevelInput = shownGoalStartLevel;
  skillState.goalStartSet = goalStartIsSet;
  skillState.goalEndXp = goalEndXp;
  skillState.goalEndByXp = goalEndByXp;
  skillState.goalEndByMax = goalEndByMax;
  skillState.goalEndByMode = goalEndMode;
  skillState.goalEndLevelInput = shownGoalEndLevel;
  skillState.goalTrackingEnabled = goalTrackingEnabled;

  refs.goalStartResolved.textContent = goalStartByXp ? String(shownGoalStartLevel) : `${formatInt(goalStartXp)} XP`;
  refs.goalEndResolved.textContent = goalEndByXp
    ? String(shownGoalEndLevel)
    : (goalEndByMax ? `MAX (${formatInt(goalEndXp)} XP)` : `${formatInt(goalEndXp)} XP`);
  refs.goalStartLevelResolved.textContent = String(shownGoalStartLevel);
  refs.goalEndLevelResolved.textContent = goalEndByMax ? "MAX" : String(shownGoalEndLevel);
  if (refs.currentTitle) {
    refs.currentTitle.textContent = currentXp >= MAX_XP ? "Current (MAX)" : `Current (level ${shownCurrentLevel})`;
  }
  if (refs.methodsTitle) {
    if (currentXp >= MAX_XP) {
      refs.methodsTitle.textContent = "Methods";
    } else {
      const remaining = methodsXpNeeded;
      refs.methodsTitle.textContent = `Methods (${formatInt(remaining)} xp to ${methodsTarget})`;
    }
  }
  refs.boostFactor.textContent = `x${boostMultiplier.toFixed(2)}`;
  refs.xpNeeded.textContent = goalActive ? formatInt(xpNeeded) : "Goal disabled / not set";
  refs.goalProgressText.textContent = goalActive
    ? `${goalPercent}% (${formatInt(doneGoalXp)} / ${formatInt(totalGoalXp)} XP)`
    : "Using next-level progress";
  refs.goalProgressBar.style.width = `${goalPercent}%`;
  refs.goalProgressBar.style.setProperty("--progress-base", progressColor(goalPercent / 100));
  refs.goalProgressBar.classList.toggle("goal-track", !!goalActive);
  refs.goalProgressBar.classList.toggle("next-track", !goalActive);

  refs.goalStartCard.style.display = goalTrackingEnabled ? "block" : "none";
  refs.goalEndCard.style.display = goalTrackingEnabled ? "block" : "none";
  refs.goalStatsCard.style.display = goalTrackingEnabled ? "block" : "none";

  renderMethodRows(skill, {
    currentLevel,
    goalResolvedLevel: goalActive ? shownGoalEndLevel : nextLevel,
    xpNeeded: methodsXpNeeded,
    boostMultiplier,
  });

  persistProfile();
  if (refreshSkillsGrid) renderSkillsGrid();
}

function renderMethodRows(skill, calc) {
  hideWikiPreview();
  const skillState = getSkillState(skill.key);
  const selectedType = skillState.selectedMethodTab;
  const rows = [...skill.methods]
    .filter((m) => selectedType === METHOD_ALL_TAB_LABEL || m.type === selectedType)
    .map((m, index) => {
      const parsedAction = parseActionText(m.action);
      const effectiveXp = m.xpPerAction * calc.boostMultiplier;
      const actionsNeeded = calc.xpNeeded > 0 ? Math.ceil(calc.xpNeeded / effectiveXp) : 0;
      return {
        m,
        index,
        parsedAction,
        actionSort: methodSortName(parsedAction.displayName),
        requiredLevel: m.requiredLevel,
        xpPerAction: effectiveXp,
        actionsNeeded,
      };
    });

  const sorts = effectiveMethodSorts(skillState);
  if (sorts.length) {
    rows.sort((a, b) => {
      for (const sort of sorts) {
        const cmp = compareMethodRow(sort.key, a, b);
        if (cmp !== 0) return sort.dir === "asc" ? cmp : -cmp;
      }
      return a.index - b.index;
    });
  }

  const tbody = refs.methodsWrap.querySelector(".method-table-body tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  for (const row of rows) {
    const m = row.m;
    const tr = document.createElement("tr");
    if (m.requiredLevel <= calc.currentLevel) tr.classList.add("can-now");
    else if (m.requiredLevel <= calc.goalResolvedLevel) tr.classList.add("can-goal");

    const previewTitle = wikiActionTitle(row.parsedAction.displayName);
    const actionHtml = row.parsedAction.linkEnabled
      ? `<a href="${escapeHtml(wikiActionUrl(row.parsedAction.displayName))}" data-wiki-preview-title="${escapeHtml(previewTitle)}" target="_blank" rel="noopener noreferrer">${escapeHtml(row.parsedAction.displayName)}</a>`
      : escapeHtml(row.parsedAction.displayName);
    tr.innerHTML = `<td>${actionHtml}</td><td>${row.requiredLevel}</td><td>${formatNumber(row.xpPerAction)}</td><td>${formatInt(row.actionsNeeded)}</td>`;
    tbody.appendChild(tr);
  }
  syncMethodTableHeaderGutter();
}

function renderMethodHeaderCell(skillState, key, label) {
  const sorts = effectiveMethodSorts(skillState);
  const idx = sorts.findIndex((s) => s.key === key);
  const sort = idx >= 0 ? sorts[idx] : null;
  const marker = !sort ? "" : `${sort.dir === "asc" ? "▲" : "▼"}${idx + 1}`;
  return `<th class="sortable${sort ? " sorted" : ""}" data-sort-key="${escapeHtml(key)}">${escapeHtml(label)}${marker ? ` <span class="sort-marker">${marker}</span>` : ""}</th>`;
}

function cycleMethodSort(skillState, key) {
  const sorts = effectiveMethodSorts(skillState);
  const idx = sorts.findIndex((s) => s.key === key);
  if (idx < 0) {
    if (sorts.length >= 2) {
      sorts.shift();
    }
    sorts.push({ key, dir: "asc" });
  } else if (sorts[idx].dir === "asc") {
    sorts[idx].dir = "desc";
  } else {
    sorts.splice(idx, 1);
  }
  skillState.methodSorts = sorts;
}

function effectiveMethodSorts(skillState) {
  const userSorts = normalizeMethodSorts(skillState.methodSorts);
  if (userSorts.length) return userSorts;
  return skillState.selectedMethodTab === METHOD_ALL_TAB_LABEL
    ? [{ key: "requiredLevel", dir: "asc" }]
    : [];
}

function normalizeMethodSorts(input) {
  const validKeys = new Set(["action", "requiredLevel", "xpPerAction", "actionsNeeded"]);
  if (!Array.isArray(input)) return [];
  const out = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const key = String(raw.key || "");
    const dir = raw.dir === "desc" ? "desc" : "asc";
    if (!validKeys.has(key)) continue;
    if (out.some((x) => x.key === key)) continue;
    if (out.length >= 2) break;
    out.push({ key, dir });
  }
  return out;
}

function compareMethodRow(key, a, b) {
  if (key === "action") {
    return a.actionSort.localeCompare(b.actionSort, undefined, { sensitivity: "base" });
  }
  if (key === "requiredLevel") return a.requiredLevel - b.requiredLevel;
  if (key === "xpPerAction") return a.xpPerAction - b.xpPerAction;
  if (key === "actionsNeeded") return a.actionsNeeded - b.actionsNeeded;
  return 0;
}

function methodSortName(actionName) {
  return parseActionText(actionName).displayName
    .replace(/\([^)]*\)/g, " ")
    .replace(/^[^a-z0-9]+/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function parseActionText(actionName) {
  const raw = String(actionName || "").trim();
  if (raw.startsWith("-")) {
    return { displayName: raw.slice(1).trim(), linkEnabled: false };
  }
  return { displayName: raw, linkEnabled: true };
}

function wikiActionTitle(actionName) {
  return String(actionName || "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wikiActionUrl(actionName) {
  const cleaned = wikiActionTitle(actionName);
  return `https://runescape.wiki/w/${encodeURIComponent(cleaned)}`;
}

function syncMethodTableHeaderGutter() {
  const headerWrap = refs.methodsWrap.querySelector(".method-table-header-wrap");
  const tbody = refs.methodsWrap.querySelector(".method-table-body tbody");
  if (!headerWrap || !tbody) return;
  const activeScrollbarWidth = Math.max(0, tbody.offsetWidth - tbody.clientWidth);
  headerWrap.style.paddingRight = `${activeScrollbarWidth}px`;
}

function evaluateSkill(skill) {
  const s = getSkillState(skill.key);
  const showVirtual = !!state.profileData?.showVirtualLevels;
  const currentXp = clamp(s.currentXp ?? 0, 0, skill.curve.maxXp);
  const currentLevel = skill.curve.levelForXp(currentXp);
  const goalStartXp = clamp(s.goalStartXp ?? currentXp, 0, skill.curve.maxXp);
  const goalEndXp = clamp(Math.max(s.goalEndXp ?? 0, goalStartXp), 0, skill.curve.maxXp);
  const goalActive = !!s.goalTrackingEnabled && !!s.goalStartSet && goalEndXp >= currentXp;
  const levelCap = showVirtual ? skill.curve.maxVirtual : skill.curve.maxReal;

  let buttonProgress = 0;
  if (goalActive) {
    const total = Math.max(0, goalEndXp - goalStartXp);
    const done = clamp(currentXp - goalStartXp, 0, total);
    buttonProgress = total === 0 ? (currentXp >= goalEndXp ? 1 : 0) : done / total;
  } else {
    if (currentLevel >= levelCap) {
      const capXp = skill.curve.xpForLevel(levelCap);
      const span = Math.max(1, MAX_XP - capXp);
      buttonProgress = clamp((currentXp - capXp) / span, 0, 1);
    } else {
      const startXp = skill.curve.xpForLevel(currentLevel);
      const nextXp = skill.curve.xpForLevel(currentLevel + 1);
      const span = Math.max(1, nextXp - startXp);
      buttonProgress = clamp((currentXp - startXp) / span, 0, 1);
    }
  }

  return { currentXp, currentLevel, goalActive, buttonProgress };
}

function effectiveSkillOrder() {
  const used = new Set();
  const orderedKeys = [];
  for (const key of FIXED_SKILL_ORDER) {
    const skill = state.skillByKey.get(key);
    if (!skill || used.has(key)) continue;
    orderedKeys.push(skill.key);
    used.add(key);
  }
  for (const skill of state.skills) {
    if (!used.has(skill.key)) {
      orderedKeys.push(skill.key);
      used.add(skill.key);
    }
  }
  const useSavedOrder = !!state.profileData?.skillOrderCustomized;
  const saved = useSavedOrder && Array.isArray(state.profileData?.skillOrder) ? state.profileData.skillOrder : [];
  const finalKeys = applySavedOrder(orderedKeys, saved);
  return finalKeys
    .map((key) => state.skillByKey.get(key))
    .filter((skill) => !!skill);
}

function reorderSkillButtons(fromKey, toKey) {
  if (!state.profileData) return;
  const list = effectiveSkillOrder().map((s) => s.key);
  const from = list.indexOf(fromKey);
  const to = list.indexOf(toKey);
  if (from < 0 || to < 0 || from === to) return;
  const moved = list.splice(from, 1)[0];
  list.splice(to, 0, moved);
  state.profileData.skillOrder = list;
  state.profileData.skillOrderCustomized = true;
  persistProfile();
  renderSkillsGrid();
}

function ensureProfileSkillState() {
  if (!state.profileData.skills) state.profileData.skills = {};
  for (const skill of state.skills) {
    if (!state.profileData.skills[skill.key]) {
      state.profileData.skills[skill.key] = defaultSkillState(skill);
    }
  }
}

function getSkillState(skillKey) {
  ensureProfileSkillState();
  const skill = state.skillByKey.get(skillKey);
  if (!state.profileData.skills[skillKey]) {
    state.profileData.skills[skillKey] = defaultSkillState(skill);
  }
  return state.profileData.skills[skillKey];
}

function defaultSkillState(skill) {
  const defaultGoalEnd = Math.min(skill.curve.maxReal, skill.curve.maxVirtual);
  return {
    currentXp: 0,
    currentByXp: true,
    currentLevelInput: 1,
    goalStartXp: 0,
    goalStartByXp: true,
    goalStartLevelInput: 1,
    goalStartSet: false,
    goalEndXp: skill.curve.xpForLevel(defaultGoalEnd),
    goalEndByXp: false,
    goalEndByMax: false,
    goalEndByMode: "level",
    goalEndLevelInput: defaultGoalEnd,
    goalTrackingEnabled: false,
    enabledBoostIds: [],
    methodTabOrder: [],
    methodSorts: [],
    selectedMethodTab: null,
    selectedBoostType: null,
  };
}
function loadProfiles() {
  const raw = localStorage.getItem(`${STORAGE_PREFIX}.profiles`);
  const parsed = raw ? safeJson(raw) : null;
  state.profiles = Array.isArray(parsed) && parsed.length ? parsed : ["default"];
  if (!state.profiles.includes("default")) state.profiles.unshift("default");

  const selected = localStorage.getItem(`${STORAGE_PREFIX}.selectedProfile`) || "default";
  state.activeProfile = state.profiles.includes(selected) ? selected : state.profiles[0];
  state.profileData = loadProfileData(state.activeProfile);
}

function hydrateProfileUI() {
  refs.profileSelect.innerHTML = "";
  for (const name of state.profiles) {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    refs.profileSelect.appendChild(opt);
  }
  refs.profileSelect.value = state.activeProfile;
  refs.deleteProfileBtn.disabled = state.activeProfile === "default";
}

function saveProfiles() {
  if (trySetStorageItem(`${STORAGE_PREFIX}.profiles`, JSON.stringify(state.profiles), "Profiles save")) {
    setSaveStatus(`Saved ${new Date().toLocaleTimeString()}`);
  }
}

function loadProfileData(profileName) {
  const raw = localStorage.getItem(profileStorageKey(profileName));
  const parsed = raw ? safeJson(raw) : null;
  if (!parsed || typeof parsed !== "object") return createDefaultProfileData();
  if (parsed.centerPane !== "goals" && parsed.centerPane !== "current") {
    parsed.centerPane = "current";
  }
  if (typeof parsed.notificationsDisabled !== "boolean") {
    parsed.notificationsDisabled = false;
  }
  return parsed;
}

function createDefaultProfileData() {
  return {
    showVirtualLevels: false,
    notificationsDisabled: false,
    centerPane: "current",
    selectedSkillKey: null,
    skillOrderCustomized: false,
    skillOrder: [],
    skills: {},
  };
}

function saveProfileData(profileName, profileData) {
  if (trySetStorageItem(profileStorageKey(profileName), JSON.stringify(profileData), "Profile data save")) {
    setSaveStatus(`Saved ${new Date().toLocaleTimeString()}`);
  }
}

function persistProfile() {
  if (!state.activeProfile || !state.profileData) return;
  if (trySetStorageItem(profileStorageKey(state.activeProfile), JSON.stringify(state.profileData), "Profile data save")) {
    setSaveStatus(`Saved ${new Date().toLocaleTimeString()}`);
  }
}

function profileStorageKey(name) {
  return `${STORAGE_PREFIX}.profile.${name}`;
}

function backupStorageKeys() {
  const entries = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(STORAGE_PREFIX)) continue;
    const value = localStorage.getItem(key);
    if (value != null) {
      entries[key] = value;
    }
  }
  return entries;
}

function clearPrefixedStorage() {
  const toRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_PREFIX)) {
      toRemove.push(key);
    }
  }
  for (const key of toRemove) {
    localStorage.removeItem(key);
  }
  setSaveStatus(`Cleared ${new Date().toLocaleTimeString()}`);
}

function exportAppData() {
  const entries = backupStorageKeys();
  const summary = summarizeBackupEntries(entries);
  const payload = {
    schema: "rscalc.web.backup.v1",
    storagePrefix: STORAGE_PREFIX,
    exportedAt: new Date().toISOString(),
    summary,
    entries,
  };
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const stamp = payload.exportedAt.replaceAll(":", "-").replace("T", "_").replace("Z", "");
  anchor.href = url;
  anchor.download = `rscalc-backup-${stamp}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return summary;
}

async function importAppDataFromFile(file) {
  const text = await file.text();
  const parsed = safeJson(text);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Backup file is not valid JSON.");
  }
  if (parsed.schema !== "rscalc.web.backup.v1") {
    throw new Error("Unsupported backup schema.");
  }
  if (parsed.storagePrefix && parsed.storagePrefix !== STORAGE_PREFIX) {
    const ok = window.confirm(`Backup prefix '${parsed.storagePrefix}' differs from '${STORAGE_PREFIX}'. Import anyway?`);
    if (!ok) throw new Error("Import cancelled.");
  }
  const entries = parsed.entries;
  if (!entries || typeof entries !== "object" || Array.isArray(entries)) {
    throw new Error("Backup is missing entries.");
  }
  const summary = summarizeBackupEntries(entries);
  const preview = `Import preview:\n- Keys: ${summary.keyCount}\n- Profiles: ${summary.profileCount}\n- Profile names: ${summary.profileNames.join(", ") || "none"}\n\nThis will overwrite existing saved data for this app. Continue?`;
  if (!window.confirm(preview)) {
    throw new Error("Import cancelled.");
  }
  if (!summary.keyCount) {
    throw new Error("Backup has no valid keys.");
  }

  clearPrefixedStorage();

  for (const [key, value] of Object.entries(entries)) {
    if (!key.startsWith(STORAGE_PREFIX)) continue;
    if (typeof value !== "string") continue;
    trySetStorageItem(key, value, "Import save");
  }
  setSaveStatus(`Imported ${new Date().toLocaleTimeString()}`);
}

function summarizeBackupEntries(entries) {
  const keys = Object.keys(entries).filter((k) => k.startsWith(STORAGE_PREFIX) && typeof entries[k] === "string");
  const profilePrefix = `${STORAGE_PREFIX}.profile.`;
  const profileNames = keys
    .filter((k) => k.startsWith(profilePrefix))
    .map((k) => k.slice(profilePrefix.length))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
  return {
    keyCount: keys.length,
    profileCount: profileNames.length,
    profileNames,
  };
}

function selectedRadio(name) {
  return document.querySelector(`input[name='${name}']:checked`)?.value ?? "";
}

function setRadio(name, value) {
  const el = document.querySelector(`input[name='${name}'][value='${value}']`);
  if (el) el.checked = true;
}

function normalizeLevel(value, max) {
  const n = Number.parseInt(String(value || "").trim(), 10);
  return clamp(Number.isFinite(n) ? n : 1, 1, max);
}

function normalizeXp(value, max) {
  const n = Number.parseInt(String(value || "").trim(), 10);
  return clamp(Number.isFinite(n) ? n : 0, 0, max);
}

function normalizeNonNegativeInt(value) {
  const n = Number.parseInt(String(value || "").trim(), 10);
  return String(Math.max(0, Number.isFinite(n) ? n : 0));
}

function skillGoalStartMode(skillState) {
  return skillState.goalStartByXp ? "xp" : "level";
}

function skillGoalEndMode(skillState) {
  return skillState.goalEndByMode || (skillState.goalEndByMax ? "max" : (skillState.goalEndByXp ? "xp" : "level"));
}

function convertGoalStartLevelToXpIfNeeded(skill, skillState, options = {}) {
  if (!skill || !skillState || !skillState.goalTrackingEnabled) return false;
  const mode = options.modeFromUi ? selectedRadio("goalStartBy") : skillGoalStartMode(skillState);
  if (mode !== "level") return false;

  const useUiFields = !!options.useUiFields;
  const rawLevel = useUiFields ? refs.goalStartLevel?.value : skillState.goalStartLevelInput;
  const rawXp = useUiFields ? refs.goalStartXp?.value : skillState.goalStartXp;

  const levelParsed = Number.parseInt(String(rawLevel ?? "").trim(), 10);
  const xpStored = normalizeXp(rawXp, skill.curve.maxXp);
  const levelFromXp = skill.curve.levelForXp(xpStored);
  const goalStartLevel = clamp(Number.isFinite(levelParsed) ? levelParsed : levelFromXp, 1, skill.curve.maxVirtual);
  const realCapXp = skill.curve.xpForLevel(skill.curve.maxReal);
  const targetXp = Math.max(xpStored, skill.curve.xpForLevel(goalStartLevel));

  if (goalStartLevel <= skill.curve.maxReal && targetXp <= realCapXp) return false;

  skillState.goalStartXp = targetXp;
  skillState.goalStartByXp = true;
  skillState.goalStartLevelInput = Math.min(goalStartLevel, skill.curve.maxReal);
  return true;
}

function convertGoalEndLevelToXpIfNeeded(skill, skillState, options = {}) {
  if (!skill || !skillState || !skillState.goalTrackingEnabled) return false;
  const mode = options.modeFromUi ? selectedRadio("goalEndBy") : skillGoalEndMode(skillState);
  if (mode !== "level") return false;

  const useUiFields = !!options.useUiFields;
  const rawLevel = useUiFields ? refs.goalEndLevel?.value : skillState.goalEndLevelInput;
  const rawXp = useUiFields ? refs.goalEndXp?.value : skillState.goalEndXp;

  const levelParsed = Number.parseInt(String(rawLevel ?? "").trim(), 10);
  const xpStored = normalizeXp(rawXp, skill.curve.maxXp);
  const levelFromXp = skill.curve.levelForXp(xpStored);
  const goalEndLevel = clamp(Number.isFinite(levelParsed) ? levelParsed : levelFromXp, 1, skill.curve.maxVirtual);
  const realCapXp = skill.curve.xpForLevel(skill.curve.maxReal);
  const targetXp = Math.max(xpStored, skill.curve.xpForLevel(goalEndLevel));

  if (goalEndLevel <= skill.curve.maxReal && targetXp <= realCapXp) return false;

  skillState.goalEndXp = targetXp;
  skillState.goalEndByXp = true;
  skillState.goalEndByMax = false;
  skillState.goalEndByMode = "xp";
  return true;
}

function computeBoostMultiplier(boosts) {
  let percent = 0;
  let multi = 1;
  for (const b of boosts) {
    if (Number.isFinite(b.xpPercent)) percent += b.xpPercent;
    if (Number.isFinite(b.xpMultiplier)) multi *= b.xpMultiplier;
  }
  return multi * (1 + percent / 100);
}

function boostLabel(boost) {
  const parts = [];
  if (Number.isFinite(boost.xpPercent)) parts.push(`+${formatNumber(boost.xpPercent)}%`);
  if (Number.isFinite(boost.xpMultiplier)) parts.push(`x${formatNumber(boost.xpMultiplier)}`);
  return parts.length ? `${boost.name} (${parts.join(", ")})` : boost.name;
}

function boostId(boost) {
  return `${boost.type}|${boost.name}`;
}

function distinctTypes(items, preferredFirst) {
  const set = [];
  for (const value of items) {
    const v = (value || "").trim() || preferredFirst;
    if (!set.some((x) => x.toLowerCase() === v.toLowerCase())) set.push(v);
  }
  const preferredIdx = set.findIndex((x) => x.toLowerCase() === preferredFirst.toLowerCase());
  if (preferredIdx > 0) {
    const preferred = set.splice(preferredIdx, 1)[0];
    set.unshift(preferred);
  }
  return set;
}

function applySavedOrder(current, saved) {
  if (!Array.isArray(saved) || !saved.length) return [...current];
  const ordered = [];
  const lowerCurrent = current.map((x) => x.toLowerCase());
  for (const s of saved) {
    const i = lowerCurrent.indexOf(String(s).toLowerCase());
    if (i >= 0 && !ordered.includes(current[i])) ordered.push(current[i]);
  }
  for (const t of current) if (!ordered.includes(t)) ordered.push(t);
  return ordered;
}

function iconCandidatesForSkill(skillName, iconValue) {
  const key = normalizeKey(skillName);
  const list = [];
  if (iconValue) {
    if (iconValue.startsWith("http://") || iconValue.startsWith("https://") || iconValue.startsWith("/")) {
      list.push(iconValue);
    } else {
      list.push(new URL(`../skills/${iconValue}`, WEB_BASE_URL).href);
      list.push(new URL(`./skills/${iconValue}`, WEB_BASE_URL).href);
    }
  }
  list.push(new URL(`../skill_icons/${key}.png`, WEB_BASE_URL).href);
  list.push(new URL(`./skill_icons/${key}.png`, WEB_BASE_URL).href);
  list.push(`/skill_icons/${key}.png`);
  return [...new Set(list)];
}

async function fetchJson(url) {
  try {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchTextWithFallback(urls) {
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-cache" });
      if (res.ok) {
        debugLog("info", `Fetch ok: ${url}`);
        return await res.text();
      }
      debugLog("warn", `Fetch failed (${res.status}): ${url}`);
    } catch {
      debugLog("warn", `Fetch error: ${url}`);
    }
  }
  return null;
}

function safeJson(raw) {
  try { return JSON.parse(raw); } catch { return null; }
}

function sanitizeProfileName(input) {
  return String(input || "").trim().replace(/[^a-zA-Z0-9 _-]/g, "");
}

function toDisplayName(value) {
  return value
    .replace(/[-_]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function normalizeKey(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function formatInt(value) {
  return numberFormat.format(Math.trunc(value || 0));
}

function formatNumber(value) {
  return Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function progressColor(progress01) {
  const p = clamp(progress01, 0, 1);
  const r = Math.round(178 + (72 - 178) * p);
  const g = Math.round(42 + (160 - 42) * p);
  const b = Math.round(42 + (72 - 42) * p);
  return `rgb(${r}, ${g}, ${b})`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function decodeHtmlEntities(input) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = input;
  return textarea.value;
}

function renderMarkdown(markdown) {
  const lines = String(markdown || "").replace(/\r/g, "").split("\n");
  const html = [];
  let listType = "";
  let inCode = false;
  let codeLang = "";
  let codeLines = [];
  let paragraph = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${renderInlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  };
  const closeList = () => {
    if (!listType) return;
    html.push(listType === "ol" ? "</ol>" : "</ul>");
    listType = "";
  };
  const flushCode = () => {
    if (!inCode) return;
    const raw = codeLines.join("\n");
    html.push(renderCodeBlockHtml(raw, codeLang));
    codeLines = [];
    inCode = false;
    codeLang = "";
  };

  for (const line of lines) {
    const codeFence = line.trim().match(/^```(\w+)?\s*$/);
    if (codeFence) {
      flushParagraph();
      closeList();
      if (inCode) {
        flushCode();
      } else {
        inCode = true;
        codeLang = String(codeFence[1] || "").toLowerCase();
      }
      continue;
    }
    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      closeList();
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      closeList();
      const level = headingMatch[1].length;
      html.push(`<h${level}>${renderInlineMarkdown(headingMatch[2].trim())}</h${level}>`);
      continue;
    }

    const hrMatch = line.trim().match(/^(-{3,}|\*{3,}|_{3,})$/);
    if (hrMatch) {
      flushParagraph();
      closeList();
      html.push("<hr />");
      continue;
    }

    const ulMatch = line.match(/^(\s*)-\s+(.+)$/);
    if (ulMatch) {
      flushParagraph();
      if (listType !== "ul") {
        closeList();
        html.push("<ul>");
        listType = "ul";
      }
      const indent = String(ulMatch[1] || "").replace(/\t/g, "  ").length;
      const depth = Math.min(4, 1 + Math.floor((indent + 1) / 2));
      html.push(`<li class="md-depth-${depth}">${renderInlineMarkdown(ulMatch[2].trim())}</li>`);
      continue;
    }

    const olMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);
    if (olMatch) {
      flushParagraph();
      if (listType !== "ol") {
        closeList();
        html.push("<ol>");
        listType = "ol";
      }
      const indent = String(olMatch[1] || "").replace(/\t/g, "  ").length;
      const depth = Math.min(4, 1 + Math.floor((indent + 1) / 2));
      html.push(`<li class="md-depth-${depth}">${renderInlineMarkdown(olMatch[2].trim())}</li>`);
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  closeList();
  flushCode();
  return html.join("");
}

function renderInlineMarkdown(input) {
  let out = escapeHtml(String(input || ""));
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return out;
}

function renderCodeBlockHtml(raw, lang) {
  const code = simpleHighlightCode(raw, lang);
  const cls = lang ? ` class="lang-${escapeHtml(lang)}"` : "";
  return `<pre><code${cls}>${code}</code></pre>`;
}

function simpleHighlightCode(raw, lang) {
  let text = escapeHtml(String(raw || ""));
  const slots = [];
  const stash = (regex, className) => {
    text = text.replace(regex, (m) => {
      const id = slots.length;
      slots.push(`<span class="code-${className}">${m}</span>`);
      return `%%${id}%%`;
    });
  };

  stash(/\/\*[\s\S]*?\*\//g, "comment");
  stash(/(^|[^:])\/\/[^\n]*/gm, "comment");
  stash(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/g, "string");
  stash(/\b\d+(?:\.\d+)?\b/g, "number");
  stash(/\b(true|false|null|undefined)\b/g, "literal");

  const jsLike = !lang || ["js", "javascript", "ts", "typescript", "json", "ps1", "powershell", "bash", "sh"].includes(lang);
  if (jsLike) {
    stash(/\b(const|let|var|function|return|if|else|for|while|switch|case|break|continue|new|class|try|catch|throw|import|from|export|default|async|await|window)\b/g, "keyword");
  }

  text = text.replace(/%%(\d+)%%/g, (_, i) => slots[Number(i)] || "");
  return text;
}

async function fetchRs3HiscoreXp(playerName) {
  const encoded = encodeURIComponent(playerName);
  const configuredProxy = typeof window !== "undefined" ? String(window.RS3_IMPORT_PROXY || "").trim() : "";
  const legacyProxy = typeof window !== "undefined" ? String(window.WIKI_API_PROXY || "").trim() : "";
  const effectiveProxy = configuredProxy || legacyProxy;
  const configuredProxyUrl = effectiveProxy
    ? `${effectiveProxy}${effectiveProxy.includes("?") ? "&" : "?"}mode=hiscore&player=${encoded}`
    : null;
  const servicesUrl = `https://services.runescape.com/m=hiscore/index_lite.ws?player=${encoded}`;
  const secureUrl = `https://secure.runescape.com/m=hiscore/index_lite.ws?player=${encoded}`;
  const urls = [
    ...(configuredProxyUrl ? [configuredProxyUrl] : []),
    `./rs3_hiscore_proxy.php?player=${encoded}`,
    servicesUrl,
    secureUrl,
    `https://corsproxy.io/?${encodeURIComponent(servicesUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(secureUrl)}`,
    `https://cors.isomorphic-git.org/${servicesUrl}`,
    `https://cors.isomorphic-git.org/${secureUrl}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(servicesUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(secureUrl)}`,
  ];
  debugLog("info", `RS3 import attempting ${urls.length} source(s).`);

  let text = null;
  let lastError = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-cache", mode: "cors" });
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status}`);
        debugLog("warn", `RS3 source HTTP ${res.status}: ${url}`);
        continue;
      }
      text = await res.text();
      debugLog("info", `RS3 source success: ${url}`);
      break;
    } catch (err) {
      lastError = err;
      debugLog("warn", `RS3 source error: ${url}`);
    }
  }

  if (!text) {
    const reason = lastError instanceof Error ? lastError.message : "network/CORS blocked";
    throw new Error(`Unable to read RS3 hiscores (${reason}). Set window.RS3_IMPORT_PROXY (or window.WIKI_API_PROXY) to your worker/proxy URL for static hosting.`);
  }

  return parseRs3HiscoreLite(text);
}

function debugLog(level, message) {
  void level;
  void message;
}

function parseRs3HiscoreLite(text) {
  const lines = text.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  if (!lines.length) return new Map();

  let overallIdx = lines.findIndex((line) => {
    const parts = line.split(",", -1);
    if (parts.length < 3) return false;
    const rank = Number.parseInt(parts[0], 10);
    const level = Number.parseInt(parts[1], 10);
    const xp = Number.parseInt(parts[2], 10);
    return Number.isFinite(rank) && Number.isFinite(level) && Number.isFinite(xp);
  });
  if (overallIdx < 0) overallIdx = 0;

  const xpBySkill = new Map();
  let lineIndex = overallIdx + 1;
  for (const skillName of RS3_SKILL_ORDER) {
    const line = lines[lineIndex++] ?? "";
    const parts = line.split(",", -1);
    if (parts.length < 3) continue;
    const xp = Number.parseInt(parts[2], 10);
    if (Number.isFinite(xp) && xp >= 0) {
      xpBySkill.set(skillName, xp);
    }
  }
  return xpBySkill;
}
