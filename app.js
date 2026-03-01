const STORAGE_PREFIX = "rscalc.web.v1";
const CHANGELOG_FILE = "./CHANGELOG.md";
const INSTRUCTIONS_FILE = "./INSTRUCTIONS.md";
const REPORT_ISSUE_URL = typeof window !== "undefined" ? String(window.REPORT_ISSUE_URL || "").trim() : "";
const MAX_XP = 200_000_000;
const REAL_MAX_LEVEL = 120;
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
  validationCard: document.getElementById("validationCard"),
  validationList: document.getElementById("validationList"),
  virtualToggle: document.getElementById("virtualToggle"),
  skillsGrid: document.getElementById("skillsGrid"),
  boostsWrap: document.getElementById("boostsWrap"),
  methodsWrap: document.getElementById("methodsWrap"),
  currentLevel: document.getElementById("currentLevel"),
  currentXp: document.getElementById("currentXp"),
  goalStartLevel: document.getElementById("goalStartLevel"),
  goalStartXp: document.getElementById("goalStartXp"),
  goalEndLevel: document.getElementById("goalEndLevel"),
  goalEndXp: document.getElementById("goalEndXp"),
  goalTrackingEnabled: document.getElementById("goalTrackingEnabled"),
  useCurrentAsStartBtn: document.getElementById("useCurrentAsStartBtn"),
  currentResolved: document.getElementById("currentResolved"),
  currentResolvedLevel: document.getElementById("currentResolvedLevel"),
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
};

const numberFormat = new Intl.NumberFormat("en-US");

initialize();

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
  window.addEventListener("resize", () => syncMethodTableHeaderGutter());
  const skills = await loadSkills();
  state.skills = skills;
  state.skillByKey = new Map(skills.map((s) => [s.key, s]));
  loadProfiles();
  hydrateProfileUI();
  renderAll();
  setSaveStatus("Ready");
}

function bindCenterTabEvents() {
  refs.centerTabCurrent?.addEventListener("click", () => setActiveCenterPane("current"));
  refs.centerTabGoals?.addEventListener("click", () => setActiveCenterPane("goals"));
}

function setActiveCenterPane(pane) {
  const isCurrent = pane === "current";
  refs.centerTabCurrent?.classList.toggle("active", isCurrent);
  refs.centerTabGoals?.classList.toggle("active", !isCurrent);
  refs.centerPaneCurrent?.classList.toggle("active", isCurrent);
  refs.centerPaneGoals?.classList.toggle("active", !isCurrent);
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
    localStorage.setItem(`${STORAGE_PREFIX}.selectedProfile`, selected);
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
    localStorage.setItem(`${STORAGE_PREFIX}.selectedProfile`, cleaned);
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
    localStorage.setItem(`${STORAGE_PREFIX}.selectedProfile`, state.activeProfile);
    state.profileData = loadProfileData(state.activeProfile);
    hydrateProfileUI();
    renderAll();
  });

  refs.virtualToggle.addEventListener("change", () => {
    state.profileData.showVirtualLevels = refs.virtualToggle.checked;
    persistProfile();
    renderSkillsGrid();
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
}

function bindInputEvents() {
  for (const el of [refs.currentLevel, refs.currentXp, refs.goalStartLevel, refs.goalStartXp, refs.goalEndLevel, refs.goalEndXp]) {
    el.addEventListener("input", () => recalcAndRender());
  }

  document.querySelectorAll("input[name='currentBy'],input[name='goalStartBy'],input[name='goalEndBy']")
    .forEach((el) => el.addEventListener("change", () => recalcAndRender()));

  refs.goalTrackingEnabled.addEventListener("change", () => recalcAndRender());

  refs.useCurrentAsStartBtn.addEventListener("click", () => {
    const skill = selectedSkill();
    if (!skill) return;
    const by = selectedRadio("currentBy");
    if (by === "xp") {
      setRadio("goalStartBy", "xp");
      refs.goalStartXp.value = normalizeNonNegativeInt(refs.currentXp.value);
      refs.goalStartLevel.value = skill.curve.levelForXp(Number(refs.goalStartXp.value || 0));
    } else {
      setRadio("goalStartBy", "level");
      refs.goalStartLevel.value = normalizeLevel(refs.currentLevel.value, skill.curve.maxVirtual);
      refs.goalStartXp.value = skill.curve.xpForLevel(Number(refs.goalStartLevel.value));
    }
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

    button.querySelector(".skill-btn-level").textContent = `${shownLevel} / ${maxLevel}`;
    button.querySelector(".skill-btn-xp").textContent = `${formatInt(evalResult.currentXp)} xp`;
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
    for (const el of [refs.currentLevel, refs.currentXp, refs.goalStartLevel, refs.goalStartXp, refs.goalEndLevel, refs.goalEndXp, refs.goalTrackingEnabled, refs.useCurrentAsStartBtn, refs.resetSkillSettingsBtn]) {
      if (el) el.disabled = true;
    }
    return;
  }
  const skillState = getSkillState(skill.key);
  if (skillState.goalTrackingEnabled) setActiveCenterPane("goals");
  for (const el of [refs.currentLevel, refs.currentXp, refs.goalStartLevel, refs.goalStartXp, refs.goalEndLevel, refs.goalEndXp, refs.goalTrackingEnabled, refs.useCurrentAsStartBtn, refs.resetSkillSettingsBtn]) {
    if (el) el.disabled = false;
  }

  state.suppressInput = true;
  try {
    setRadio("currentBy", skillState.currentByXp ? "xp" : "level");
    setRadio("goalStartBy", skillState.goalStartByXp ? "xp" : "level");
    setRadio("goalEndBy", skillState.goalEndByXp ? "xp" : "level");

    refs.currentLevel.max = String(skill.curve.maxVirtual);
    refs.goalStartLevel.max = String(skill.curve.maxVirtual);
    refs.goalEndLevel.max = String(skill.curve.maxVirtual);

    refs.currentLevel.value = String(skillState.currentLevelInput);
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
  content.className = "tab-content";
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
  const allTypes = distinctTypes(skill.methods.map((m) => m.type), "Default");
  const ordered = applySavedOrder(allTypes, skillState.methodTabOrder);
  skillState.methodTabOrder = ordered;

  let selected = skillState.selectedMethodTab;
  if (!ordered.includes(selected)) selected = ordered[0] ?? "Default";
  skillState.selectedMethodTab = selected;

  const tabList = document.createElement("div");
  tabList.className = "tab-list";
  const content = document.createElement("div");
  content.className = "tab-content";
  refs.methodsWrap.append(tabList, content);

  let dragFrom = null;
  for (const type of ordered) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `tab-btn${type === selected ? " active" : ""}`;
    btn.textContent = type;
    btn.draggable = true;

    btn.addEventListener("click", () => {
      skillState.selectedMethodTab = type;
      persistProfile();
      renderMethodTabs(skill, skillState);
      recalcAndRender();
    });

    btn.addEventListener("dragstart", () => { dragFrom = type; });
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

    tabList.appendChild(btn);
  }

  const headerWrap = document.createElement("div");
  headerWrap.className = "method-table-header-wrap";
  const headerTable = document.createElement("table");
  headerTable.className = "method-table method-table-head";
  headerTable.innerHTML = "<thead><tr><th>Action</th><th>Req Lvl</th><th>XP / Action</th><th>Actions Needed</th></tr></thead>";
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

  const currentByXp = selectedRadio("currentBy") === "xp";
  const goalStartByXp = selectedRadio("goalStartBy") === "xp";
  const goalEndByXp = selectedRadio("goalEndBy") === "xp";

  const currentLevelInput = normalizeLevel(refs.currentLevel.value, skill.curve.maxVirtual);
  const goalStartLevelInput = normalizeLevel(refs.goalStartLevel.value, skill.curve.maxVirtual);
  const goalEndLevelInput = normalizeLevel(refs.goalEndLevel.value, skill.curve.maxVirtual);

  let currentXp = currentByXp ? normalizeXp(refs.currentXp.value, skill.curve.maxXp) : skill.curve.xpForLevel(currentLevelInput);
  let goalStartXp = goalStartByXp ? normalizeXp(refs.goalStartXp.value, skill.curve.maxXp) : skill.curve.xpForLevel(goalStartLevelInput);
  let goalEndXp = goalEndByXp ? normalizeXp(refs.goalEndXp.value, skill.curve.maxXp) : skill.curve.xpForLevel(goalEndLevelInput);
  if (goalEndXp < goalStartXp) goalEndXp = goalStartXp;

  const currentLevel = skill.curve.levelForXp(currentXp);
  const goalStartLevel = skill.curve.levelForXp(goalStartXp);
  const goalEndLevel = skill.curve.levelForXp(goalEndXp);

  const goalTrackingEnabled = refs.goalTrackingEnabled.checked;
  updateCenterTabAvailability();
  const goalStartIsSet = !goalStartByXp || String(refs.goalStartXp.value).trim() !== "";
  const goalActive = goalTrackingEnabled && goalStartIsSet && goalEndXp >= currentXp;

  const enabledBoosts = skill.boosts.filter((b) => skillState.enabledBoostIds.includes(boostId(b)));
  const boostMultiplier = computeBoostMultiplier(enabledBoosts);

  refs.currentLevel.disabled = currentByXp;
  refs.currentXp.disabled = !currentByXp;
  refs.goalStartLevel.disabled = goalStartByXp;
  refs.goalStartXp.disabled = !goalStartByXp;
  refs.goalEndLevel.disabled = goalEndByXp;
  refs.goalEndXp.disabled = !goalEndByXp;

  const totalGoalXp = goalActive ? Math.max(0, goalEndXp - goalStartXp) : 0;
  const doneGoalXp = goalActive ? clamp(currentXp - goalStartXp, 0, totalGoalXp) : 0;
  const goalPercent = goalActive ? (totalGoalXp === 0 ? (currentXp >= goalEndXp ? 100 : 0) : Math.round((doneGoalXp * 100) / totalGoalXp)) : 0;
  const xpNeeded = goalActive ? Math.max(0, goalEndXp - currentXp) : 0;

  state.suppressInput = true;
  try {
    refs.currentLevel.value = String(currentLevel);
    refs.goalStartLevel.value = String(goalStartLevel);
    refs.goalEndLevel.value = String(goalEndLevel);
    refs.currentXp.value = String(currentXp);
    refs.goalStartXp.value = String(goalStartXp);
    refs.goalEndXp.value = String(goalEndXp);
  } finally {
    state.suppressInput = false;
  }

  skillState.currentXp = currentXp;
  skillState.currentByXp = currentByXp;
  skillState.currentLevelInput = currentLevel;
  skillState.goalStartXp = goalStartXp;
  skillState.goalStartByXp = goalStartByXp;
  skillState.goalStartLevelInput = goalStartLevel;
  skillState.goalStartSet = goalStartIsSet;
  skillState.goalEndXp = goalEndXp;
  skillState.goalEndByXp = goalEndByXp;
  skillState.goalEndLevelInput = goalEndLevel;
  skillState.goalTrackingEnabled = goalTrackingEnabled;

  refs.currentResolved.textContent = `${formatInt(currentXp)} XP`;
  refs.goalStartResolved.textContent = `${formatInt(goalStartXp)} XP`;
  refs.goalEndResolved.textContent = `${formatInt(goalEndXp)} XP`;
  refs.currentResolvedLevel.textContent = String(currentLevel);
  refs.goalStartLevelResolved.textContent = String(goalStartLevel);
  refs.goalEndLevelResolved.textContent = String(goalEndLevel);
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
    goalResolvedLevel: goalTrackingEnabled ? goalEndLevel : currentLevel,
    xpNeeded,
    boostMultiplier,
  });

  persistProfile();
  if (refreshSkillsGrid) renderSkillsGrid();
}

function renderMethodRows(skill, calc) {
  const skillState = getSkillState(skill.key);
  const selectedType = skillState.selectedMethodTab;
  const rows = [...skill.methods]
    .filter((m) => m.type === selectedType)
    .sort((a, b) => (a.requiredLevel - b.requiredLevel) || a.action.localeCompare(b.action));

  const tbody = refs.methodsWrap.querySelector(".method-table-body tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  for (const m of rows) {
    const tr = document.createElement("tr");
    if (m.requiredLevel <= calc.currentLevel) tr.classList.add("can-now");
    else if (m.requiredLevel <= calc.goalResolvedLevel) tr.classList.add("can-goal");

    const effectiveXp = m.xpPerAction * calc.boostMultiplier;
    const actions = calc.xpNeeded > 0 ? Math.ceil(calc.xpNeeded / effectiveXp) : 0;
    tr.innerHTML = `<td>${escapeHtml(m.action)}</td><td>${m.requiredLevel}</td><td>${formatNumber(effectiveXp)}</td><td>${formatInt(actions)}</td>`;
    tbody.appendChild(tr);
  }
  syncMethodTableHeaderGutter();
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
  const currentXp = clamp(s.currentXp ?? 0, 0, skill.curve.maxXp);
  const currentLevel = skill.curve.levelForXp(currentXp);
  const goalStartXp = clamp(s.goalStartXp ?? currentXp, 0, skill.curve.maxXp);
  const goalEndXp = clamp(Math.max(s.goalEndXp ?? 0, goalStartXp), 0, skill.curve.maxXp);
  const goalActive = !!s.goalTrackingEnabled && !!s.goalStartSet && goalEndXp >= currentXp;

  let buttonProgress = 0;
  if (goalActive) {
    const total = Math.max(0, goalEndXp - goalStartXp);
    const done = clamp(currentXp - goalStartXp, 0, total);
    buttonProgress = total === 0 ? (currentXp >= goalEndXp ? 1 : 0) : done / total;
  } else {
    if (currentLevel >= skill.curve.maxVirtual) {
      buttonProgress = 1;
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
    currentByXp: false,
    currentLevelInput: 1,
    goalStartXp: 0,
    goalStartByXp: true,
    goalStartLevelInput: 1,
    goalStartSet: false,
    goalEndXp: skill.curve.xpForLevel(defaultGoalEnd),
    goalEndByXp: false,
    goalEndLevelInput: defaultGoalEnd,
    goalTrackingEnabled: false,
    enabledBoostIds: [],
    methodTabOrder: [],
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
  localStorage.setItem(`${STORAGE_PREFIX}.profiles`, JSON.stringify(state.profiles));
  setSaveStatus(`Saved ${new Date().toLocaleTimeString()}`);
}

function loadProfileData(profileName) {
  const raw = localStorage.getItem(profileStorageKey(profileName));
  const parsed = raw ? safeJson(raw) : null;
  return parsed && typeof parsed === "object" ? parsed : createDefaultProfileData();
}

function createDefaultProfileData() {
  return {
    showVirtualLevels: false,
    selectedSkillKey: null,
    skillOrderCustomized: false,
    skillOrder: [],
    skills: {},
  };
}

function saveProfileData(profileName, profileData) {
  localStorage.setItem(profileStorageKey(profileName), JSON.stringify(profileData));
  setSaveStatus(`Saved ${new Date().toLocaleTimeString()}`);
}

function persistProfile() {
  if (!state.activeProfile || !state.profileData) return;
  localStorage.setItem(profileStorageKey(state.activeProfile), JSON.stringify(state.profileData));
  setSaveStatus(`Saved ${new Date().toLocaleTimeString()}`);
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
    localStorage.setItem(key, value);
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
  let inList = false;
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
    if (!inList) return;
    html.push("</ul>");
    inList = false;
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

    const listMatch = line.match(/^(\s*)-\s+(.+)$/);
    if (listMatch) {
      flushParagraph();
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      const indent = String(listMatch[1] || "").replace(/\t/g, "  ").length;
      const depth = Math.min(4, 1 + Math.floor((indent + 1) / 2));
      html.push(`<li class="md-depth-${depth}">${renderInlineMarkdown(listMatch[2].trim())}</li>`);
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
