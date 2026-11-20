/* MDFL Tampa Division Bankruptcy Petition Program — Frontend Controller */
"use strict";

const SESSION_DRAFT_KEY = "mdfl_active_working_case_v1";
const SESSION_EDITOR_KEY = "mdfl_editor_tab_id_v1";

function _getOrCreateEditorId() {
  try {
    let id = sessionStorage.getItem(SESSION_EDITOR_KEY);
    if (!id) {
      id = "Staff-" + Math.random().toString(36).slice(2, 6).toUpperCase();
      sessionStorage.setItem(SESSION_EDITOR_KEY, id);
    }
    return id;
  } catch (_) {
    return "Staff-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  }
}

const state = {
  settings: null,
  formCatalog: [],
  exemptionsCatalog: { schemes: [], by_scheme: {} },
  savedCases: [],
  browseModalFilter: "ALL",
  updates: null,
  updatesFilter: "ALL",
  manifest: null,
  caseData: null,
  baseCaseSnapshot: null,
  baseRevision: null,
  activeFolder: "",
  activeTab: "import",
  editorId: _getOrCreateEditorId(),
  dirty: false,
  autoSaveTimer: null,
  inputPersistTimer: null,
  savingInFlight: false,
  pendingResave: false,
  totals: {},
  compliance: [],
  folderName: "Unnamed,Client",
  matrixPreview: { count: 0, text: "", warnings: [] },
  calcTimer: null,
};

function todayMDY() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${d.getFullYear()}`;
}

function createBlankCase(chapter = "7") {
  const ch = String(chapter || "7");
  const bdef = (state && state.settings && state.settings.b2030_defaults && state.settings.b2030_defaults[`ch${ch}`]) || {};
  return {
    case_id: "",
    chapter: ch,
    is_joint: false,
    is_amended: false,
    case_number: "",
    filing_date: todayMDY(),
    district: "Middle District of Florida",
    division: "Tampa Division",
    fee_payment_method: "full",
    primarily_consumer_debts: true,
    ch7_assets_available_for_unsecured: false,
    rents_residence: false,
    has_eviction_judgment: false,
    sole_proprietor: false,
    sole_prop_name: "",
    sole_prop_address: "",
    hazardous_property: false,
    credit_counseling_completed: true,
    credit_counseling_agency: "Debtorcc.org",
    credit_counseling_date: "",
    credit_counseling_fee: 9.99,
    military_service: false,
    prior_bankruptcies: [],
    household_size: 1,
    household_contributions_desc: "",
    household_contributions_monthly: 0,
    income_expect_change: false,
    income_expect_change_explain: "",
    debtor1: {
      full_name: "", first_name: "", middle_name: "", last_name: "", suffix: "",
      dob: "", ssn: "", ssn_last4: "", ein: "",
      street: "", city: "", state: "FL", zip_code: "", county: "",
      length_at_address: "", home_phone: "", mobile_phone: "", email: "",
      different_mailing: false, mailing_street: "", mailing_po_box: "",
      mailing_city: "", mailing_state: "", mailing_zip: "",
      other_names: [], business_names: [], venue_180_days: true, venue_other_reason: "",
    },
    debtor2: {
      full_name: "", first_name: "", middle_name: "", last_name: "", suffix: "",
      dob: "", ssn: "", ssn_last4: "", ein: "",
      street: "", city: "", state: "FL", zip_code: "", county: "",
      length_at_address: "", home_phone: "", mobile_phone: "", email: "",
      different_mailing: false, mailing_street: "", mailing_po_box: "",
      mailing_city: "", mailing_state: "", mailing_zip: "",
      other_names: [], business_names: [], venue_180_days: true, venue_other_reason: "",
    },
    dependents: [],
    real_estate: [],
    vehicles: [],
    personal_assets: {
      household_goods_desc: "", household_goods_val: 0,
      electronics_desc: "", electronics_val: 0,
      collectibles_desc: "", collectibles_val: 0,
      sports_hobby_desc: "", sports_hobby_val: 0,
      firearms_desc: "", firearms_val: 0,
      clothes_desc: "Everyday Clothing and Accessories", clothes_val: 0,
      jewelry_desc: "", jewelry_val: 0,
      animals_desc: "", animals_val: 0,
      other_household_desc: "", other_household_val: 0,
      cash_on_hand: 0,
      bank_accounts: [],
      stocks_bonds_desc: "", stocks_bonds_val: 0,
      business_interests_desc: "", business_interests_val: 0,
      gov_bonds_desc: "", gov_bonds_val: 0,
      retirement_accounts: [],
      security_deposit_landlord: "", security_deposit_rent_val: 0,
      security_deposit_utility_name: "", security_deposit_utility_val: 0,
      annuities_desc: "", annuities_val: 0,
      education_ira_desc: "", education_ira_val: 0,
      trusts_future_desc: "", trusts_future_val: 0,
      ip_patents_desc: "", ip_patents_val: 0,
      tax_refund_desc: "", tax_refund_val: 0,
      family_support_owed_desc: "", family_support_owed_val: 0,
      other_owed_desc: "", other_owed_val: 0,
      life_insurance_company: "", life_insurance_beneficiary: "", life_insurance_cash_val: 0,
      inheritance_desc: "", inheritance_val: 0,
      claims_third_party_desc: "", claims_third_party_val: 0,
      other_financial_desc: "", other_financial_val: 0,
      tools_of_trade_desc: "", tools_of_trade_val: 0,
      inventory_desc: "", inventory_val: 0,
      other_business_desc: "", other_business_val: 0,
      other_property_desc: "", other_property_val: 0,
    },
    exemptions: [],
    exemption_scheme: "FL",
    override_exemption_caps: false,
    secured_creditors: [],
    unsecured_creditors: [],
    executory_contracts: [],
    codebtors: [],
    income_debtor1: blankIncome(),
    income_debtor2: blankIncome(),
    expenses: {
      separate_household_debtor2: false, expenses_include_others: false,
      rent_or_mortgage: 0, real_estate_taxes: 0, home_insurance: 0, home_maintenance: 0, hoa_dues: 0,
      additional_mortgage: 0, electricity_heat_gas: 0, water_sewer_garbage: 0, phone_cell_internet_cable: 0,
      other_utilities_desc: "", other_utilities: 0, food_housekeeping: 0, childcare_education: 0,
      clothing_laundry: 0, personal_care: 0, medical_dental: 0, transportation: 0,
      entertainment_recreation: 0, charitable: 0, life_insurance: 0, health_insurance: 0,
      vehicle_insurance: 0, other_insurance_desc: "", other_insurance: 0, taxes_other_desc: "", taxes_other: 0,
      vehicle_payment_1_desc: "", vehicle_payment_1: 0, vehicle_payment_2_desc: "", vehicle_payment_2: 0,
      installment_other_1_desc: "", installment_other_1: 0, installment_other_2_desc: "", installment_other_2: 0,
      alimony_support: 0, support_others_desc: "", support_others: 0,
      other_prop_mortgage: 0, other_prop_taxes: 0, other_prop_insurance: 0, other_prop_maintenance: 0, other_prop_hoa: 0,
      other_expense_desc: "", other_expense: 0, expect_change: false, expect_change_explain: "",
    },
    sofa: {
      marital_status: "Not married", prior_addresses: [], lived_community_property_state: false,
      community_state: "", other_income_ytd_source: "", other_income_ytd: 0,
      other_income_last_yr_source: "", other_income_last_yr: 0, other_income_2yr_source: "", other_income_2yr: 0,
      recent_payments_90d: [], insider_payments: [], lawsuits: [], repos_garnishments: [],
      gifts: [], losses: [], bankruptcy_payments: [], property_transfers: [],
      closed_accounts: [], safe_deposit_boxes: [], storage_units: [], property_held_for_others: [],
      environmental_notice: false, environmental_details: "", businesses: [],
    },
    means_test: {
      source: "calculated", household_size: 1, state: "Florida", fl_median_income: 65801,
      d1_cmi_wages: 0, d2_cmi_wages: 0, d1_cmi_alimony: 0, d2_cmi_alimony: 0,
      d1_cmi_contributions: 0, d2_cmi_contributions: 0, d1_cmi_business_net: 0, d2_cmi_business_net: 0,
      d1_cmi_rental_net: 0, d2_cmi_rental_net: 0, d1_cmi_interest: 0, d2_cmi_interest: 0,
      d1_cmi_unemployment: 0, d2_cmi_unemployment: 0, d1_cmi_pension: 0, d2_cmi_pension: 0,
      d1_cmi_other: 0, d2_cmi_other: 0, d1_social_security_excluded: 0, d2_social_security_excluded: 0,
      marital_adjustment: 0, total_cmi: 0, annualized_cmi: 0, above_median: false,
      presumption_of_abuse: false, exempt_from_means_test: false,
      commitment_years: 3, monthly_disposable_income: 0, external_notes: "",
    },
    attorney_fees: {
      agreed_fee: Number(bdef.agreed_fee ?? (ch === "7" ? 2000 : 5358)),
      received_prior: Number(bdef.received_prior ?? (ch === "7" ? 2000 : 1858)),
      filing_fee_paid: Number(bdef.filing_fee ?? (ch === "7" ? 338 : 313)),
      credit_report_fee: Number(bdef.credit_report_fee ?? 45),
      payment_date_1: "", payment_amount_1: 0, payment_date_2: "", payment_amount_2: 0,
      source_paid: "Debtor", source_to_be_paid: "Debtor",
      included_other: bdef.included_other ?? "",
      excluded_services: bdef.excluded_services ?? "",
    },
    selected_forms: [],
    case_notes: "",
    cif_source_filename: "",
    cif_raw_warnings: [],
  };
}

function blankIncome() {
  return {
    employed: false, occupation: "", employer_name: "", employer_street: "",
    employer_city: "", employer_state: "FL", employer_zip: "", how_long: "", pay_frequency: "Monthly",
    monthly_gross_wages: 0, monthly_overtime: 0, ded_taxes: 0, ded_mandatory_ret: 0,
    ded_voluntary_ret: 0, ded_ret_loan: 0, ded_insurance: 0, ded_dso: 0, ded_union: 0,
    ded_other_desc: "", ded_other: 0, net_business_rental: 0, interest_dividends: 0,
    family_support: 0, unemployment: 0, social_security: 0, gov_assistance_desc: "",
    gov_assistance: 0, pension_retirement: 0, other_income_desc: "", other_income: 0,
    ytd_gross: 0, last_year_gross: 0, two_years_ago_gross: 0,
    business_gross_monthly: 0, business_expenses_monthly: 0, rental_gross_monthly: 0, rental_expenses_monthly: 0,
  };
}

const $ = (id) => document.getElementById(id);
const num = (v) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const cleaned = String(v ?? "").replace(/[$,\s]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
};
const money = (v) =>
  "$" + Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ==================== AUTO-FORMATTING (DATES, CURRENCY, SSN) ==================== */
function formatDateInput(raw, liveTyping = false) {
  const s = String(raw || "").trim();
  if (!s) return "";

  if (liveTyping) {
    // Only auto-insert slashes if the user is entering digits/slashes (e.g., 11192026 -> 11/19/2026)
    const digits = s.replace(/\D/g, "").slice(0, 8);
    if (!digits) return s;
    // Allow partial month/year typing if user already typed a slash cleanly
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }

  // Finalize on blur / change / load
  // 1. ISO YYYY-MM-DD -> MM/DD/YYYY
  const iso = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (iso) {
    return `${iso[2].padStart(2, "0")}/${iso[3].padStart(2, "0")}/${iso[1]}`;
  }
  // 2. M/D/YYYY or M-D-YY -> MM/DD/YYYY
  const slash = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})$/);
  if (slash) {
    const mm = slash[1].padStart(2, "0");
    const dd = slash[2].padStart(2, "0");
    let yy = slash[3];
    if (yy.length === 2) {
      const n = parseInt(yy, 10);
      const cur2 = new Date().getFullYear() % 100;
      yy = String((n > cur2 + 5 ? 1900 : 2000) + n);
    }
    return `${mm}/${dd}/${yy}`;
  }
  // 2b. Explicit MM/YYYY (e.g., 11/2024 for creditor Date Incurred) -> preserve as MM/YYYY
  const my = s.match(/^(\d{1,2})[-/](\d{4})$/);
  if (my) {
    return `${my[1].padStart(2, "0")}/${my[2]}`;
  }
  // 3. Pure 8 digits MMDDYYYY (e.g., 11192026 -> 11/19/2026)
  const digits = s.replace(/\D/g, "");
  if (digits.length === 8) {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  }
  // 4. Pure 6 digits MMDDYY (e.g., 111926 -> 11/19/2026, 051278 -> 05/12/1978)
  if (digits.length === 6) {
    const n = parseInt(digits.slice(4, 6), 10);
    const cur2 = new Date().getFullYear() % 100;
    const yyyy = String((n > cur2 + 5 ? 1900 : 2000) + n);
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${yyyy}`;
  }
  // 5. Preserve MM/YYYY or YYYY for partial creditor dates
  return s;
}

function formatSsnInput(raw) {
  const digits = String(raw || "").replace(/\D/g, "").slice(0, 9);
  if (!digits) return "";
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

function formatCurrencyDisplay(raw) {
  const n = num(raw);
  const abs = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n < 0 ? `-$${abs}` : `$${abs}`;
}

function formatSingleField(el, liveTyping = false) {
  if (!el || !el.dataset || !el.dataset.format) return;
  const fmt = el.dataset.format;
  if (fmt === "date") {
    const next = formatDateInput(el.value, liveTyping);
    if (next !== el.value) el.value = next;
  } else if (fmt === "ssn") {
    const next = formatSsnInput(el.value);
    if (next !== el.value) el.value = next;
  } else if (fmt === "currency" && !liveTyping) {
    el.value = formatCurrencyDisplay(el.value);
  }
}

function formatAllFieldsInDOM(root = document) {
  root.querySelectorAll("input[data-format]").forEach((el) => {
    if (document.activeElement === el) return;
    formatSingleField(el, false);
  });
}

function setupAutoFormatters() {
  // Live typing for dates (11192026 -> 11/19/2026) and SSNs (123456789 -> 123-45-6789)
  document.addEventListener("input", (ev) => {
    const el = ev.target;
    if (!el || !el.dataset || !el.dataset.format) return;
    const fmt = el.dataset.format;
    if (ev.inputType && ev.inputType.startsWith("delete")) return; // Never fight Backspace/Delete
    if (fmt === "date") {
      // Only auto-slash when user is typing digits (don't disturb partial text like "2024" until >2 digits or paste)
      const digits = el.value.replace(/\D/g, "");
      if (digits.length === 8 || (digits.length >= 3 && !/[a-zA-Z]/.test(el.value))) {
        formatSingleField(el, true);
      }
    } else if (fmt === "ssn") {
      formatSingleField(el, true);
    }
  });

  // Focus on currency: strip $ and commas for effortless numeric entry (clear 0.00 so typing starts clean)
  document.addEventListener("focus", (ev) => {
    const el = ev.target;
    if (!el || !el.dataset || el.dataset.format !== "currency") return;
    const n = num(el.value);
    el.value = n === 0 ? "" : String(n);
    setTimeout(() => { try { el.select(); } catch (_) {} }, 0);
  }, true);

  // Capture-phase change & blur so formatted values are committed BEFORE inline onchange handlers read el.value
  document.addEventListener("change", (ev) => {
    const el = ev.target;
    if (el && el.dataset && el.dataset.format) formatSingleField(el, false);
  }, true);

  document.addEventListener("blur", (ev) => {
    const el = ev.target;
    if (el && el.dataset && el.dataset.format) formatSingleField(el, false);
  }, true);
}

function toast(msg, kind = "") {
  const el = $("toast");
  el.textContent = msg;
  el.className = "show" + (kind ? ` toast-${kind}` : "");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.className = ""; }, 3600);
}


/* ==================== CLOUDFLARE + SHARED PYTHON SERVER (E2E AES-256-GCM) ADAPTER ==================== */
const CF_SETTINGS_KEY = "mdfl_cf_settings_v1";
const CF_CASES_KEY = "mdfl_cf_saved_cases_v1";
const CF_PY_CONN_KEY = "mdfl_cf_python_conn_v1";
let cfServerHasFirmBackend = false;
let cfServerBackendSource = "none";
let cfServerBackendUpdatedAt = null;

function _cfLoadSettings() {
  const base = JSON.parse(JSON.stringify(window.CloudflarePetitionEngine.DEFAULT_SETTINGS));
  try {
    const saved = JSON.parse(localStorage.getItem(CF_SETTINGS_KEY) || "null");
    if (saved) Object.assign(base, saved);
  } catch (_) {}
  return base;
}

function _cfGetPythonConn() {
  try {
    return JSON.parse(localStorage.getItem(CF_PY_CONN_KEY) || "{}") || {};
  } catch (_) {
    return {};
  }
}

function _cfSetPythonConn(url, secret) {
  localStorage.setItem(CF_PY_CONN_KEY, JSON.stringify({ url: (url || "").trim(), secret: (secret || "").trim() }));
}

function _cfUsePythonRelay() {
  const conn = _cfGetPythonConn();
  return Boolean((conn.url && conn.url.trim()) || cfServerHasFirmBackend);
}

function _cfWrapBackendMeta(payloadObj) {
  const conn = _cfGetPythonConn();
  const out = Object.assign({}, payloadObj);
  if (conn.url) out._backend_url = conn.url;
  if (conn.secret) out._relay_secret = conn.secret;
  return out;
}

function _cfUpdateEngineBadges() {
  const conn = _cfGetPythonConn();
  const engPill = document.getElementById("hdr-engine");
  const badge = document.getElementById("py-conn-badge");
  const statusEl = document.getElementById("py-conn-status");

  if (conn.url) {
    if (engPill) { engPill.textContent = "Engine: Python PC (Custom URL)"; engPill.className = "pill pill-gold"; }
    if (badge) { badge.textContent = "Connected via Browser URL"; badge.className = "tag tag-ok"; }
    if (statusEl) statusEl.innerHTML = `<div class="alert alert-ok"><strong>Active Mode:</strong> Encrypted Cloudflare Relay &rarr; Python Server (<code>${esc(conn.url)}</code>). Uploads &amp; packets are AES-256-GCM encrypted in transit.</div>`;
  } else if (cfServerHasFirmBackend) {
    const isAuto = cfServerBackendSource === "kv-auto-registered";
    const whenTxt = cfServerBackendUpdatedAt ? ` (Auto-synced ${new Date(cfServerBackendUpdatedAt).toLocaleString()})` : "";
    if (engPill) { engPill.textContent = isAuto ? "Engine: Office PC (Auto-Synced)" : "Engine: Shared Office Python PC"; engPill.className = "pill pill-ok"; }
    if (badge) { badge.textContent = isAuto ? "Auto-Registered Office PC" : "Firm-Wide Shared Python Server"; badge.className = "tag tag-ok"; }
    if (statusEl) statusEl.innerHTML = `<div class="alert alert-ok"><strong>Active Mode:</strong> Automatically connected to your firm's <strong>Shared Office Python Server</strong>${isAuto ? " via <strong>Cloudflare KV Auto-Registration</strong>" + esc(whenTxt) : " (configured via Cloudflare Secret)"}. All staff share this connection automatically!</div>`;
  } else {
    if (engPill) { engPill.textContent = "Engine: Cloudflare Standalone"; engPill.className = "pill"; }
    if (badge) { badge.textContent = "Standalone Edge Mode"; badge.className = "tag tag-warn"; }
    if (statusEl) statusEl.innerHTML = `<div class="alert alert-info"><strong>Active Mode:</strong> Cloudflare Standalone (in-browser <code>pdf-lib</code>). To use the full Windows PyMuPDF + ReportLab engine and shared office <code>Clients\\</code> folders, enter your Cloudflare Tunnel URL below or set <code>PYTHON_BACKEND_URL</code> in Cloudflare Secrets.</div>`;
  }
}

function _cfLoadSavedCasesMap() {
  try { return JSON.parse(localStorage.getItem(CF_CASES_KEY) || "{}"); } catch (_) { return {}; }
}

function _cfListSavedCases() {
  const map = _cfLoadSavedCasesMap();
  return Object.entries(map).map(([folder, rec]) => {
    const c = rec.case || {};
    const mt = c.means_test || {};
    const cmiMo = Number(mt.total_cmi || 0);
    return {
      folder_name: folder,
      chapter: String(c.chapter || "7"),
      is_joint: Boolean(c.is_joint),
      debtor_name: rec.debtor_name || folder,
      case_number: String(c.case_number || ""),
      county: String(c.debtor1?.county || ""),
      has_means_test: Boolean(cmiMo > 0 || mt.source === "external_site"),
      cmi_monthly: cmiMo,
      updated_at: rec.updated_at || "",
      updated_ts: rec.updated_ts || 0,
      revision: Number(c.revision || 0),
      has_packet: false,
    };
  });
}

async function cfApiAdapter(url, opts = {}) {
  const eng = window.CloudflarePetitionEngine;
  const settings = _cfLoadSettings();

  if (url.startsWith("/api/updates")) {
    if (url.includes("check-median-income")) {
      const apply = url.includes("apply=true");
      if (_cfUsePythonRelay()) {
        return window.PetitionCrypto.securePost("check-median-income", _cfWrapBackendMeta({ apply }));
      }
      return {
        checked_at: new Date().toLocaleString(),
        source_url: "https://www.justice.gov/ust/means-testing",
        current: settings.fl_median_income,
        official: null,
        changed: false,
        applied: false,
        status: "manual_check",
        note: "Connect your Shared Office Python Server to auto-fetch live US Trustee tables, or verify at justice.gov/ust/means-testing.",
      };
    }
    if (url.includes("check-forms") || url.includes("sync-forms")) {
      if (_cfUsePythonRelay()) {
        const sub = url.includes("sync-forms") ? "sync-forms" : "check-forms";
        return window.PetitionCrypto.securePost(sub, _cfWrapBackendMeta({}));
      }
      return {
        checked_at: new Date().toLocaleString(),
        total_checked: eng.FORM_CATALOG.filter((f) => f.file).length,
        updates_available: 0,
        updated_count: 0,
        forms: eng.FORM_CATALOG.filter((f) => f.file).map((f) => ({
          file: f.file, status: "up_to_date", local_size: 0, remote_size: null,
          note: "Served from GitHub -> Cloudflare /Templates/ (Connect Python server for live auto-updater)",
        })),
      };
    }
    const resp = await fetch("/api/updates");
    if (resp.ok) return resp.json();
    return { fetched_at: new Date().toLocaleString(), tampa_court_info: {}, announcements: [] };
  }

  if (url === "/api/bootstrap") {
    let updates = { fetched_at: "", tampa_court_info: {}, announcements: [] };
    try { const r = await fetch("/api/updates"); if (r.ok) updates = await r.json(); } catch (_) {}
    try {
      const hs = await window.PetitionCrypto.handshake();
      cfServerHasFirmBackend = hs.backend_mode === "encrypted-python-relay";
      cfServerBackendSource = hs.backend_source || "none";
      cfServerBackendUpdatedAt = hs.backend_updated_at || null;
      const pill = document.getElementById("hdr-e2e");
      if (pill) {
        pill.textContent = hs.requires_passphrase ? "🔒 E2E: AES-256-GCM (Firm Key)" : "🔒 E2E: AES-256-GCM (ECDH)";
        pill.className = "pill pill-ok";
      }
    } catch (_) {}
    _cfUpdateEngineBadges();

    let savedCases = _cfListSavedCases();
    if (_cfUsePythonRelay()) {
      try {
        const r = await window.PetitionCrypto.securePost("cases-list", _cfWrapBackendMeta({}));
        if (r && Array.isArray(r.saved_cases)) savedCases = r.saved_cases;
      } catch (_) {}
    }

    const filesMap = {};
    eng.FORM_CATALOG.filter((f) => f.file).forEach((f) => { filesMap[f.file] = { size: 0, source_page: `/Templates/${f.file}` }; });
    return {
      settings,
      form_catalog: eng.FORM_CATALOG,
      exemptions_catalog: window.EXEMPTIONS_CATALOG || { schemes: [], by_scheme: {} },
      saved_cases: savedCases,
      updates,
      manifest: { last_checked: new Date().toISOString().slice(0, 19), files: filesMap },
    };
  }

  if (url === "/api/settings") {
    if ((opts.method || "GET").toUpperCase() === "POST") {
      const incoming = JSON.parse(opts.body || "{}");
      const merged = Object.assign(settings, incoming);
      localStorage.setItem(CF_SETTINGS_KEY, JSON.stringify(merged));
      return merged;
    }
    return settings;
  }

  if (url === "/api/calculate") {
    const c = JSON.parse(opts.body || "{}");
    return {
      totals: eng.calculateTotals(c, settings),
      recommended_forms: eng.selectFormsForCase(c, settings),
      compliance: eng.runComplianceChecks(c, settings),
      folder_name: eng.makeClientFolderName(c),
      matrix_preview: eng.buildMatrixPreview(c),
    };
  }

  if (url === "/api/auto-exemptions") {
    const c = JSON.parse(opts.body || "{}");
    return { exemptions: eng.autoApplyFloridaExemptions(c, settings) };
  }

  if (url === "/api/import-cif") {
    const fd = opts.body;
    const file = fd.get("file");
    const chapter = fd.get("chapter") || "7";
    const arrBuf = await file.arrayBuffer();
    const pdfBase64 = window.PetitionCrypto.b64Encode(new Uint8Array(arrBuf));
    const secResp = await window.PetitionCrypto.securePost(
      "cif-intake",
      _cfWrapBackendMeta({ filename: file.name, chapter: String(chapter), pdf_base64: pdfBase64 })
    );
    // If routed to shared Python server, return the full 1,381-widget parsed CaseData directly!
    if (secResp.case) return secResp;
    const verifiedBytes = window.PetitionCrypto.b64Decode(secResp.pdf_base64);
    const parsedCase = await eng.parseCifBytes(verifiedBytes, file.name, chapter, settings, createBlankCase);
    return {
      case: parsedCase,
      totals: eng.calculateTotals(parsedCase, settings),
      recommended_forms: eng.selectFormsForCase(parsedCase, settings),
      compliance: eng.runComplianceChecks(parsedCase, settings),
      folder_name: eng.makeClientFolderName(parsedCase),
      matrix_preview: eng.buildMatrixPreview(parsedCase),
    };
  }

  if (url === "/api/import-creditors") {
    const fd = opts.body;
    const file = fd.get("file");
    if (_cfUsePythonRelay()) {
      const arrBuf = await file.arrayBuffer();
      const b64 = window.PetitionCrypto.b64Encode(new Uint8Array(arrBuf));
      return window.PetitionCrypto.securePost(
        "import-creditors",
        _cfWrapBackendMeta({ filename: file.name, file_base64: b64 })
      );
    }
    const text = await file.text();
    const res = eng.parseCreditorsCsv(text);
    return { source: "csv", secured: res.secured, unsecured: res.unsecured, count: res.secured.length + res.unsecured.length };
  }

  if (url.startsWith("/api/generate")) {
    const c = JSON.parse(opts.body || "{}");
    const wantZip = url.includes("return_zip=true");
    if (_cfUsePythonRelay()) {
      const pyRes = await window.PetitionCrypto.securePost("generate", _cfWrapBackendMeta({ case_data: c, include_zip: wantZip }));
      // Only download ZIP if the user explicitly checked the optional ZIP checkbox!
      if (wantZip && pyRes.zip_base64) {
        const zipBytes = window.PetitionCrypto.b64Decode(pyRes.zip_base64);
        const zipBlob = new Blob([zipBytes], { type: "application/zip" });
        pyRes.zip_url = URL.createObjectURL(zipBlob);
        pyRes.zip_name = pyRes.zip_name || `${pyRes.folder_name || "Petition_Packet"}.zip`;
        const a = document.createElement("a");
        a.href = pyRes.zip_url;
        a.download = pyRes.zip_name;
        a.click();
      }
      return pyRes;
    }
    const out = await eng.generatePetitionZip(c, settings);
    out.compliance = eng.runComplianceChecks(c, settings);
    out.saved_cases = _cfListSavedCases();
    return out;
  }

  if (url === "/api/cases/save") {
    const raw = JSON.parse(opts.body || "{}");
    if (_cfUsePythonRelay()) {
      const envPayload = raw && raw.case ? raw : { case: raw };
      return window.PetitionCrypto.securePost("cases-save", _cfWrapBackendMeta(envPayload));
    }
    const c = raw && raw.case ? raw.case : raw;
    const folder = eng.makeClientFolderName(c);
    const map = _cfLoadSavedCasesMap();
    const prevRev = Number(map[folder]?.case?.revision || 0);
    c.revision = prevRev + 1;
    c.last_saved_at = new Date().toLocaleString();
    map[folder] = {
      case: c,
      debtor_name: `${c.debtor1?.first_name || ""} ${c.debtor1?.last_name || ""}`.trim() || folder,
      updated_at: c.last_saved_at,
    };
    localStorage.setItem(CF_CASES_KEY, JSON.stringify(map));
    return {
      folder_name: folder,
      path: `Browser Storage/${folder}`,
      revision: c.revision,
      last_saved_at: c.last_saved_at,
      merged: false,
      merged_fields: [],
      case: c,
      saved_cases: _cfListSavedCases(),
    };
  }

  if (url === "/api/cases") {
    if (_cfUsePythonRelay()) {
      return window.PetitionCrypto.securePost("cases-list", _cfWrapBackendMeta({}));
    }
    return { saved_cases: _cfListSavedCases() };
  }

  if (url.startsWith("/api/cases/")) {
    const folder = decodeURIComponent(url.replace("/api/cases/", ""));
    if (_cfUsePythonRelay()) {
      return window.PetitionCrypto.securePost("cases-load", _cfWrapBackendMeta({ folder_name: folder }));
    }
    const rec = _cfLoadSavedCasesMap()[folder];
    if (!rec) throw new Error("Saved case not found in browser storage.");
    const c = rec.case;
    return {
      case: c,
      totals: eng.calculateTotals(c, settings),
      recommended_forms: eng.selectFormsForCase(c, settings),
      compliance: eng.runComplianceChecks(c, settings),
      folder_name: eng.makeClientFolderName(c),
      matrix_preview: eng.buildMatrixPreview(c),
    };
  }

  if (url.startsWith("/api/load-sample-case")) {
    const u = new URL(url, window.location.origin);
    const ch = u.searchParams.get("chapter") || "7";
    const joint = u.searchParams.get("joint") === "true";
    const c = createBlankCase(ch);
    c.is_joint = joint;
    c.household_size = joint ? 3 : 2;
    c.credit_counseling_agency = "Debtorcc.org";
    c.debtor1 = Object.assign(c.debtor1, {
      full_name: "Jordan Michael Alvarez", first_name: "Jordan", middle_name: "Michael", last_name: "Alvarez",
      dob: "04/18/1979", ssn: "123-45-6789", ssn_last4: "6789",
      street: "4210 Park Blvd N", city: "Pinellas Park", state: "FL", zip_code: "33781", county: "Pinellas",
      length_at_address: "6 years", mobile_phone: "(727) 555-0142", email: "jordan.alvarez@example.com",
    });
    if (joint) {
      c.debtor2 = Object.assign(c.debtor2, {
        full_name: "Elena Marie Alvarez", first_name: "Elena", middle_name: "Marie", last_name: "Alvarez",
        dob: "09/22/1981", ssn: "987-65-4321", ssn_last4: "4321",
        street: "4210 Park Blvd N", city: "Pinellas Park", state: "FL", zip_code: "33781", county: "Pinellas",
      });
      c.sofa.marital_status = "Married";
    }
    c.income_debtor1.employed = true;
    c.income_debtor1.occupation = "Logistics Coordinator";
    c.income_debtor1.employer_name = "Tampa Bay Supply Co.";
    c.income_debtor1.monthly_gross_wages = 4650;
    c.income_debtor1.ded_taxes = 810;
    c.expenses.rent_or_mortgage = 1845;
    c.expenses.food_housekeeping = 550;
    c.unsecured_creditors = [
      { priority: false, name: "Capital One", attn: "Attn: Bankruptcy", street: "PO Box 30285", city: "Salt Lake City", state: "UT", zip_code: "84130-0285", account_last4: "3104", date_incurred: "08/2019", total_claim: 8450, priority_amount: 0, owner: "debtor1", claim_type: "Other", claim_type_specify: "CreditCard", notice_parties: [] },
    ];
    c.exemptions = eng.autoApplyFloridaExemptions(c, settings);
    c.selected_forms = eng.selectFormsForCase(c, settings);
    return {
      case: c,
      totals: eng.calculateTotals(c, settings),
      recommended_forms: eng.selectFormsForCase(c, settings),
      compliance: eng.runComplianceChecks(c, settings),
      folder_name: eng.makeClientFolderName(c),
      matrix_preview: eng.buildMatrixPreview(c),
    };
  }

  throw new Error("Unsupported Cloudflare route: " + url);
}

async function api(url, opts = {}) {
  if (window.CloudflarePetitionEngine) {
    return cfApiAdapter(url, opts);
  }
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || `Request failed (${res.status})`);
  }
  return data;
}

/* ==================== BOOTSTRAP ==================== */
async function init() {
  state.caseData = createBlankCase("7");
  setupAutoFormatters();
  setupMeansTestBridge();
  setupTabs();
  setupStaticHandlers();
  renderAllCaseUI();
  try {
    const boot = await api("/api/bootstrap");
    state.settings = boot.settings;
    state.formCatalog = boot.form_catalog || [];
    state.exemptionsCatalog = boot.exemptions_catalog || { schemes: [], by_scheme: {} };
    state.savedCases = boot.saved_cases || [];
    state.updates = boot.updates;
    state.manifest = boot.manifest;
    state.caseData = createBlankCase("7");
    populateExemptionSchemesDropdown();
    populateSettingsUI();
    renderSavedCases();
    renderUpdates();
    renderTemplatesManifest();

    // Restore active working draft across page refreshes so F5 NEVER wipes out entered data!
    const restored = restoreWorkingSession();
    renderAllCaseUI();
    await recalculate(!restored);
    if (restored) {
      pushCaseToMeansTest({ replaceAll: true, silent: true });
      if (state.activeTab && state.activeTab !== "import") {
        switchTab(state.activeTab);
      }
      if (state.activeFolder) {
        checkAndSyncRemoteChanges();
      }
      setAutoSaveBadge(
        state.dirty ? "Restored Draft (Auto-Saving...)" : `Restored (${state.activeFolder || "Working Draft"})`,
        state.dirty ? "pill-gold" : "pill-ok"
      );
      if (state.dirty && hasSaveableClientName(state.caseData)) {
        scheduleAutoSave(800);
      }
    }
    startConcurrentSyncPoller();
  } catch (err) {
    toast("Startup error: " + err.message, "err");
  }
}

function setupTabs() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      $(`tab-${btn.dataset.tab}`).classList.add("active");
      state.activeTab = btn.dataset.tab;
      persistWorkingSession();
      if (btn.dataset.tab === "means") {
        pushCaseToMeansTest({ replaceAll: false, silent: true });
      }
    });
  });
}

function switchTab(name) {
  const btn = document.querySelector(`.tab-btn[data-tab="${name}"]`);
  if (btn) btn.click();
}

/* ==================== READ / WRITE SCALAR FIELDS ==================== */
function populateScalarsFromCase() {
  const c = state.caseData;
  $("f-chapter").value = c.chapter || "7";
  $("import-chapter").value = c.chapter || "7";
  $("f-is-joint").checked = !!c.is_joint;
  $("f-filing-date").value = c.filing_date || todayMDY();
  $("f-case-number").value = c.case_number || "";
  $("f-fee-method").value = c.fee_payment_method || "full";
  $("f-household-size").value = c.household_size || 1;
  $("f-cc-agency").value = c.credit_counseling_agency || "";
  $("f-cc-date").value = c.credit_counseling_date || "";
  $("f-cc-fee").value = c.credit_counseling_fee ?? 0;
  $("f-cc-done").checked = !!c.credit_counseling_completed;
  $("f-consumer-debts").checked = !!c.primarily_consumer_debts;
  $("f-rents").checked = !!c.rents_residence;
  $("f-eviction").checked = !!c.has_eviction_judgment;
  $("f-military").checked = !!c.military_service;
  $("f-sole-prop").checked = !!c.sole_proprietor;
  if ($("f-case-notes")) $("f-case-notes").value = c.case_notes || "";

  const d1 = c.debtor1 || {};
  $("d1-first").value = d1.first_name || "";
  $("d1-middle").value = d1.middle_name || "";
  $("d1-last").value = d1.last_name || "";
  $("d1-suffix").value = d1.suffix || "";
  $("d1-dob").value = d1.dob || "";
  $("d1-ssn").value = d1.ssn || "";
  $("d1-street").value = d1.street || "";
  $("d1-city").value = d1.city || "";
  $("d1-state").value = d1.state || "FL";
  $("d1-zip").value = d1.zip_code || "";
  $("d1-county").value = d1.county || "";
  $("d1-len").value = d1.length_at_address || "";
  $("d1-phone").value = d1.mobile_phone || d1.home_phone || "";
  $("d1-email").value = d1.email || "";

  const d2 = c.debtor2 || {};
  $("d2-first").value = d2.first_name || "";
  $("d2-middle").value = d2.middle_name || "";
  $("d2-last").value = d2.last_name || "";
  $("d2-suffix").value = d2.suffix || "";
  $("d2-dob").value = d2.dob || "";
  $("d2-ssn").value = d2.ssn || "";
  $("d2-street").value = d2.street || "";
  $("d2-city").value = d2.city || "";
  $("d2-state").value = d2.state || "";
  $("d2-zip").value = d2.zip_code || "";
  $("d2-county").value = d2.county || "";
  $("d2-phone").value = d2.mobile_phone || d2.home_phone || "";
  $("d2-email").value = d2.email || "";
  $("card-debtor2").style.opacity = c.is_joint ? "1" : "0.65";
  $("d2-status-note").textContent = c.is_joint ? "Joint Debtor Active" : 'Enable "Joint Filing" above for couples';

  const pa = c.personal_assets || {};
  $("pa-hh-desc").value = pa.household_goods_desc || "";
  $("pa-hh-val").value = pa.household_goods_val || 0;
  $("pa-el-desc").value = pa.electronics_desc || "";
  $("pa-el-val").value = pa.electronics_val || 0;
  $("pa-col-desc").value = pa.collectibles_desc || "";
  $("pa-col-val").value = pa.collectibles_val || 0;
  $("pa-spt-desc").value = pa.sports_hobby_desc || "";
  $("pa-spt-val").value = pa.sports_hobby_val || 0;
  $("pa-arm-desc").value = pa.firearms_desc || "";
  $("pa-arm-val").value = pa.firearms_val || 0;
  $("pa-cl-desc").value = pa.clothes_desc || "";
  $("pa-cl-val").value = pa.clothes_val || 0;
  $("pa-jw-desc").value = pa.jewelry_desc || "";
  $("pa-jw-val").value = pa.jewelry_val || 0;
  $("pa-pet-desc").value = pa.animals_desc || "";
  $("pa-pet-val").value = pa.animals_val || 0;
  $("pa-othhh-desc").value = pa.other_household_desc || "";
  $("pa-othhh-val").value = pa.other_household_val || 0;
  $("pa-cash").value = pa.cash_on_hand || 0;
  $("pa-sec-ll").value = pa.security_deposit_landlord || "";
  $("pa-sec-val").value = pa.security_deposit_rent_val || 0;
  $("pa-tax-desc").value = pa.tax_refund_desc || "";
  $("pa-tax-val").value = pa.tax_refund_val || 0;
  $("pa-life-co").value = pa.life_insurance_company || "";
  $("pa-life-val").value = pa.life_insurance_cash_val || 0;
  $("pa-oth-desc").value = pa.other_property_desc || pa.other_financial_desc || "";
  $("pa-oth-val").value = (pa.other_property_val || 0) + (pa.other_financial_val || 0);

  if ($("f-exemption-scheme")) $("f-exemption-scheme").value = (c.exemption_scheme || "FL").toUpperCase();
  if ($("f-override-exempt-caps")) $("f-override-exempt-caps").checked = !!c.override_exemption_caps;

  const i1 = c.income_debtor1 || {};
  $("i1-employed").checked = !!i1.employed;
  $("i1-occ").value = i1.occupation || "";
  $("i1-emp").value = i1.employer_name || "";
  $("i1-long").value = i1.how_long || "";
  $("i1-freq").value = i1.pay_frequency || "";
  $("i1-gross").value = i1.monthly_gross_wages || 0;
  $("i1-ot").value = i1.monthly_overtime || 0;
  $("i1-tax").value = i1.ded_taxes || 0;
  $("i1-ins").value = i1.ded_insurance || 0;
  $("i1-ret").value = (i1.ded_mandatory_ret || 0) + (i1.ded_voluntary_ret || 0);
  $("i1-othded").value = (i1.ded_other || 0) + (i1.ded_union || 0) + (i1.ded_dso || 0);
  $("i1-ss").value = i1.social_security || 0;
  $("i1-pen").value = i1.pension_retirement || 0;
  $("i1-biz").value = i1.net_business_rental || 0;
  $("i1-other").value = i1.other_income || 0;
  $("i1-ytd").value = i1.ytd_gross || 0;
  $("i1-ly").value = i1.last_year_gross || 0;
  $("i1-2y").value = i1.two_years_ago_gross || 0;

  const i2 = c.income_debtor2 || {};
  $("i2-employed").checked = !!i2.employed;
  $("i2-occ").value = i2.occupation || "";
  $("i2-emp").value = i2.employer_name || "";
  $("i2-long").value = i2.how_long || "";
  $("i2-freq").value = i2.pay_frequency || "";
  $("i2-gross").value = i2.monthly_gross_wages || 0;
  $("i2-ot").value = i2.monthly_overtime || 0;
  $("i2-tax").value = i2.ded_taxes || 0;
  $("i2-ins").value = i2.ded_insurance || 0;
  $("i2-ret").value = (i2.ded_mandatory_ret || 0) + (i2.ded_voluntary_ret || 0);
  $("i2-othded").value = (i2.ded_other || 0) + (i2.ded_union || 0) + (i2.ded_dso || 0);
  $("i2-ss").value = i2.social_security || 0;
  $("i2-pen").value = i2.pension_retirement || 0;
  $("i2-ytd").value = i2.ytd_gross || 0;
  $("i2-ly").value = i2.last_year_gross || 0;
  $("f-hh-contrib").value = c.household_contributions_monthly || 0;
  $("f-hh-contrib-desc").value = c.household_contributions_desc || "";

  const e = c.expenses || {};
  $("e-sep-hh").checked = !!e.separate_household_debtor2;
  $("e-rent").value = e.rent_or_mortgage || 0;
  $("e-retax").value = e.real_estate_taxes || 0;
  $("e-homeins").value = e.home_insurance || 0;
  $("e-maint").value = e.home_maintenance || 0;
  $("e-hoa").value = e.hoa_dues || 0;
  $("e-elec").value = e.electricity_heat_gas || 0;
  $("e-water").value = e.water_sewer_garbage || 0;
  $("e-phone").value = e.phone_cell_internet_cable || 0;
  $("e-food").value = e.food_housekeeping || 0;
  $("e-child").value = e.childcare_education || 0;
  $("e-cloth").value = e.clothing_laundry || 0;
  $("e-pcare").value = e.personal_care || 0;
  $("e-med").value = e.medical_dental || 0;
  $("e-trans").value = e.transportation || 0;
  $("e-ent").value = e.entertainment_recreation || 0;
  $("e-char").value = e.charitable || 0;
  $("e-life").value = e.life_insurance || 0;
  $("e-health").value = e.health_insurance || 0;
  $("e-vehins").value = e.vehicle_insurance || 0;
  $("e-car1").value = e.vehicle_payment_1 || 0;
  $("e-car2").value = e.vehicle_payment_2 || 0;
  $("e-alimony").value = e.alimony_support || 0;
  $("e-othdesc").value = e.other_expense_desc || "";
  $("e-oth").value = e.other_expense || 0;

  $("sofa-marital").value = c.sofa?.marital_status || "Not married";
  $("sofa-pa-count").textContent = (c.sofa?.prior_addresses || []).length;
  $("sofa-law-count").textContent = (c.sofa?.lawsuits || []).length;
  $("sofa-repo-count").textContent = (c.sofa?.repos_garnishments || []).length;
  $("sofa-closed-count").textContent = (c.sofa?.closed_accounts || []).length;

  const af = c.attorney_fees || {};
  $("fee-agreed").value = af.agreed_fee ?? 0;
  $("fee-received").value = af.received_prior ?? 0;
  $("fee-filing").value = af.filing_fee_paid ?? 0;
  $("fee-cr").value = af.credit_report_fee ?? 0;
  $("fee-inc-other").value = af.included_other || "";
  $("fee-excluded").value = af.excluded_services || "";

  const mt = c.means_test || {};
  $("mt-source").value = mt.source || "calculated";
  $("mt-marital-adj").value = mt.marital_adjustment || 0;
  $("mt-total-cmi").value = mt.total_cmi || 0;
  $("mt-disposable").value = mt.monthly_disposable_income || 0;
  $("mt-exempt").checked = !!mt.exempt_from_means_test;
  $("mt-notes").value = mt.external_notes || "";
  $("mt-site-url").value = state.settings?.means_test_url || "";
  formatAllFieldsInDOM();
  updateCreditCounselingWarning();
}

function syncScalarsToCase() {
  const c = state.caseData;
  c.chapter = $("f-chapter").value;
  c.is_joint = $("f-is-joint").checked;
  c.filing_date = $("f-filing-date").value.trim();
  c.case_number = $("f-case-number").value.trim();
  c.fee_payment_method = $("f-fee-method").value;
  c.household_size = Math.max(1, parseInt($("f-household-size").value || "1", 10));
  c.credit_counseling_agency = $("f-cc-agency").value.trim();
  c.credit_counseling_date = $("f-cc-date").value.trim();
  c.credit_counseling_fee = num($("f-cc-fee").value);
  c.credit_counseling_completed = $("f-cc-done").checked;
  c.primarily_consumer_debts = $("f-consumer-debts").checked;
  c.rents_residence = $("f-rents").checked;
  c.has_eviction_judgment = $("f-eviction").checked;
  c.military_service = $("f-military").checked;
  c.sole_proprietor = $("f-sole-prop").checked;
  if ($("f-case-notes")) c.case_notes = $("f-case-notes").value;

  const d1 = c.debtor1;
  d1.first_name = $("d1-first").value.trim();
  d1.middle_name = $("d1-middle").value.trim();
  d1.last_name = $("d1-last").value.trim();
  d1.suffix = $("d1-suffix").value.trim();
  d1.full_name = [d1.first_name, d1.middle_name, d1.last_name, d1.suffix].filter(Boolean).join(" ");
  d1.dob = $("d1-dob").value.trim();
  d1.ssn = $("d1-ssn").value.trim();
  const s1dig = d1.ssn.replace(/\D/g, "");
  d1.ssn_last4 = s1dig.length >= 4 ? s1dig.slice(-4) : d1.ssn_last4;
  d1.street = $("d1-street").value.trim();
  d1.city = $("d1-city").value.trim();
  d1.state = $("d1-state").value.trim().toUpperCase() || "FL";
  d1.zip_code = $("d1-zip").value.trim();
  d1.county = $("d1-county").value.trim();
  d1.length_at_address = $("d1-len").value.trim();
  d1.mobile_phone = $("d1-phone").value.trim();
  d1.email = $("d1-email").value.trim();

  const d2 = c.debtor2;
  d2.first_name = $("d2-first").value.trim();
  d2.middle_name = $("d2-middle").value.trim();
  d2.last_name = $("d2-last").value.trim();
  d2.suffix = $("d2-suffix").value.trim();
  d2.full_name = [d2.first_name, d2.middle_name, d2.last_name, d2.suffix].filter(Boolean).join(" ");
  d2.dob = $("d2-dob").value.trim();
  d2.ssn = $("d2-ssn").value.trim();
  const s2dig = d2.ssn.replace(/\D/g, "");
  d2.ssn_last4 = s2dig.length >= 4 ? s2dig.slice(-4) : d2.ssn_last4;
  d2.street = $("d2-street").value.trim();
  d2.city = $("d2-city").value.trim();
  d2.state = $("d2-state").value.trim().toUpperCase();
  d2.zip_code = $("d2-zip").value.trim();
  d2.county = $("d2-county").value.trim();
  d2.mobile_phone = $("d2-phone").value.trim();
  d2.email = $("d2-email").value.trim();
  $("card-debtor2").style.opacity = c.is_joint ? "1" : "0.65";
  $("d2-status-note").textContent = c.is_joint ? "Joint Debtor Active" : 'Enable "Joint Filing" above for couples';

  const pa = c.personal_assets;
  pa.household_goods_desc = $("pa-hh-desc").value.trim();
  pa.household_goods_val = num($("pa-hh-val").value);
  pa.electronics_desc = $("pa-el-desc").value.trim();
  pa.electronics_val = num($("pa-el-val").value);
  pa.collectibles_desc = $("pa-col-desc").value.trim();
  pa.collectibles_val = num($("pa-col-val").value);
  pa.sports_hobby_desc = $("pa-spt-desc").value.trim();
  pa.sports_hobby_val = num($("pa-spt-val").value);
  pa.firearms_desc = $("pa-arm-desc").value.trim();
  pa.firearms_val = num($("pa-arm-val").value);
  pa.clothes_desc = $("pa-cl-desc").value.trim();
  pa.clothes_val = num($("pa-cl-val").value);
  pa.jewelry_desc = $("pa-jw-desc").value.trim();
  pa.jewelry_val = num($("pa-jw-val").value);
  pa.animals_desc = $("pa-pet-desc").value.trim();
  pa.animals_val = num($("pa-pet-val").value);
  pa.other_household_desc = $("pa-othhh-desc").value.trim();
  pa.other_household_val = num($("pa-othhh-val").value);
  pa.cash_on_hand = num($("pa-cash").value);
  pa.security_deposit_landlord = $("pa-sec-ll").value.trim();
  pa.security_deposit_rent_val = num($("pa-sec-val").value);
  pa.tax_refund_desc = $("pa-tax-desc").value.trim();
  pa.tax_refund_val = num($("pa-tax-val").value);
  pa.life_insurance_company = $("pa-life-co").value.trim();
  pa.life_insurance_cash_val = num($("pa-life-val").value);
  pa.other_property_desc = $("pa-oth-desc").value.trim();
  pa.other_property_val = num($("pa-oth-val").value);
  pa.other_financial_val = 0;

  if ($("f-exemption-scheme")) c.exemption_scheme = $("f-exemption-scheme").value || "FL";
  if ($("f-override-exempt-caps")) c.override_exemption_caps = $("f-override-exempt-caps").checked;

  // Keep any Real Estate linked to Debtor 1's address automatically synchronized
  let syncedAnyRe = false;
  (c.real_estate || []).forEach((r) => {
    if (r.use_debtor_address) {
      if (r.address !== d1.street || r.city !== d1.city || r.state !== d1.state || r.zip_code !== d1.zip_code || r.county !== d1.county) {
        r.address = d1.street;
        r.city = d1.city;
        r.state = d1.state || "FL";
        r.zip_code = d1.zip_code;
        r.county = d1.county;
        syncedAnyRe = true;
      }
    }
  });
  if (syncedAnyRe) renderRealEstate();

  const i1 = c.income_debtor1;
  i1.employed = $("i1-employed").checked;
  i1.occupation = $("i1-occ").value.trim();
  i1.employer_name = $("i1-emp").value.trim();
  i1.how_long = $("i1-long").value.trim();
  i1.pay_frequency = $("i1-freq").value.trim();
  i1.monthly_gross_wages = num($("i1-gross").value);
  i1.monthly_overtime = num($("i1-ot").value);
  i1.ded_taxes = num($("i1-tax").value);
  i1.ded_insurance = num($("i1-ins").value);
  i1.ded_mandatory_ret = num($("i1-ret").value);
  i1.ded_voluntary_ret = 0;
  i1.ded_other = num($("i1-othded").value);
  i1.ded_union = 0; i1.ded_dso = 0;
  i1.social_security = num($("i1-ss").value);
  i1.pension_retirement = num($("i1-pen").value);
  i1.net_business_rental = num($("i1-biz").value);
  i1.other_income = num($("i1-other").value);
  i1.ytd_gross = num($("i1-ytd").value);
  i1.last_year_gross = num($("i1-ly").value);
  i1.two_years_ago_gross = num($("i1-2y").value);

  const i2 = c.income_debtor2;
  i2.employed = $("i2-employed").checked;
  i2.occupation = $("i2-occ").value.trim();
  i2.employer_name = $("i2-emp").value.trim();
  i2.how_long = $("i2-long").value.trim();
  i2.pay_frequency = $("i2-freq").value.trim();
  i2.monthly_gross_wages = num($("i2-gross").value);
  i2.monthly_overtime = num($("i2-ot").value);
  i2.ded_taxes = num($("i2-tax").value);
  i2.ded_insurance = num($("i2-ins").value);
  i2.ded_mandatory_ret = num($("i2-ret").value);
  i2.ded_voluntary_ret = 0;
  i2.ded_other = num($("i2-othded").value);
  i2.ded_union = 0; i2.ded_dso = 0;
  i2.social_security = num($("i2-ss").value);
  i2.pension_retirement = num($("i2-pen").value);
  i2.ytd_gross = num($("i2-ytd").value);
  i2.last_year_gross = num($("i2-ly").value);
  c.household_contributions_monthly = num($("f-hh-contrib").value);
  c.household_contributions_desc = $("f-hh-contrib-desc").value.trim();

  const e = c.expenses;
  e.separate_household_debtor2 = $("e-sep-hh").checked;
  e.rent_or_mortgage = num($("e-rent").value);
  e.real_estate_taxes = num($("e-retax").value);
  e.home_insurance = num($("e-homeins").value);
  e.home_maintenance = num($("e-maint").value);
  e.hoa_dues = num($("e-hoa").value);
  e.electricity_heat_gas = num($("e-elec").value);
  e.water_sewer_garbage = num($("e-water").value);
  e.phone_cell_internet_cable = num($("e-phone").value);
  e.food_housekeeping = num($("e-food").value);
  e.childcare_education = num($("e-child").value);
  e.clothing_laundry = num($("e-cloth").value);
  e.personal_care = num($("e-pcare").value);
  e.medical_dental = num($("e-med").value);
  e.transportation = num($("e-trans").value);
  e.entertainment_recreation = num($("e-ent").value);
  e.charitable = num($("e-char").value);
  e.life_insurance = num($("e-life").value);
  e.health_insurance = num($("e-health").value);
  e.vehicle_insurance = num($("e-vehins").value);
  e.vehicle_payment_1 = num($("e-car1").value);
  e.vehicle_payment_2 = num($("e-car2").value);
  e.alimony_support = num($("e-alimony").value);
  e.other_expense_desc = $("e-othdesc").value.trim();
  e.other_expense = num($("e-oth").value);

  c.sofa.marital_status = $("sofa-marital").value;

  const af = c.attorney_fees;
  af.agreed_fee = num($("fee-agreed").value);
  af.received_prior = num($("fee-received").value);
  af.filing_fee_paid = num($("fee-filing").value);
  af.credit_report_fee = num($("fee-cr").value);
  af.included_other = $("fee-inc-other").value;
  af.excluded_services = $("fee-excluded").value;

  const mt = c.means_test;
  mt.source = $("mt-source").value;
  mt.marital_adjustment = num($("mt-marital-adj").value);
  mt.total_cmi = num($("mt-total-cmi").value);
  mt.monthly_disposable_income = num($("mt-disposable").value);
  mt.exempt_from_means_test = $("mt-exempt").checked;
  mt.external_notes = $("mt-notes").value;
  updateCreditCounselingWarning();
}

/* ==================== 180-DAY CREDIT COUNSELING WARNING ==================== */
function _parseDateMDY(raw) {
  const s = String(raw || "").trim();
  if (!s) return null;
  let m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (m) {
    let yr = parseInt(m[3], 10);
    if (yr < 100) yr += yr > (new Date().getFullYear() % 100) + 5 ? 1900 : 2000;
    const d = new Date(yr, parseInt(m[1], 10) - 1, parseInt(m[2], 10));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) {
    const d = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const digits = s.replace(/\D/g, "");
  if (digits.length === 8) {
    const d = new Date(parseInt(digits.slice(4, 8), 10), parseInt(digits.slice(0, 2), 10) - 1, parseInt(digits.slice(2, 4), 10));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function updateCreditCounselingWarning() {
  const box = $("cc-date-warning");
  if (!box) return;
  const ccRaw = $("f-cc-date")?.value || state.caseData?.credit_counseling_date || "";
  const filRaw = $("f-filing-date")?.value || state.caseData?.filing_date || "";
  const ccDone = $("f-cc-done") ? $("f-cc-done").checked : !!state.caseData?.credit_counseling_completed;

  if (!ccDone) {
    box.innerHTML = `<div class="alert alert-err" style="margin-bottom:0;"><strong>Credit Counseling Required (11 U.S.C. &sect; 109(h)):</strong> Debtor must complete pre-filing credit counseling (e.g., Debtorcc.org) within 180 days prior to filing.</div>`;
    return;
  }
  const ccDt = _parseDateMDY(ccRaw);
  if (!ccDt) {
    box.innerHTML = "";
    return;
  }
  const today = new Date();
  const filDt = _parseDateMDY(filRaw) || new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.round((filDt.getTime() - ccDt.getTime()) / 86400000);
  const exp = new Date(ccDt.getTime() + 180 * 86400000);
  const expStr = `${String(exp.getMonth() + 1).padStart(2, "0")}/${String(exp.getDate()).padStart(2, "0")}/${exp.getFullYear()}`;
  const ccStr = `${String(ccDt.getMonth() + 1).padStart(2, "0")}/${String(ccDt.getDate()).padStart(2, "0")}/${ccDt.getFullYear()}`;
  const filStr = `${String(filDt.getMonth() + 1).padStart(2, "0")}/${String(filDt.getDate()).padStart(2, "0")}/${filDt.getFullYear()}`;

  if (days > 180) {
    box.innerHTML = `<div class="alert alert-err" style="margin-bottom:0;"><strong>&#9888; CREDIT COUNSELING EXPIRED (${days} days &gt; 180-day limit under 11 U.S.C. &sect; 109(h)):</strong> Certificate dated <strong>${esc(ccStr)}</strong> expired on <strong>${esc(expStr)}</strong> (filing date: ${esc(filStr)}). The debtor <strong>MUST</strong> retake credit counseling via Debtorcc.org before filing!</div>`;
  } else if (days < 0) {
    box.innerHTML = `<div class="alert alert-err" style="margin-bottom:0;"><strong>&#9888; INVALID CREDIT COUNSELING DATE:</strong> Completion date (<strong>${esc(ccStr)}</strong>) is AFTER the filing date (<strong>${esc(filStr)}</strong>). Under 11 U.S.C. &sect; 109(h), counseling must be completed on or before filing.</div>`;
  } else if (days >= 165) {
    box.innerHTML = `<div class="alert alert-warn" style="margin-bottom:0;"><strong>&#9888; Credit Counseling Expiring Soon:</strong> <strong>${days} of 180 days</strong> elapsed (${180 - days} day(s) remaining). Certificate dated ${esc(ccStr)} expires on <strong>${esc(expStr)}</strong>.</div>`;
  } else {
    box.innerHTML = `<div class="alert alert-ok" style="margin-bottom:0; padding:6px 12px; font-size:12px;">&#10003; Credit Counseling Valid: <strong>${days} of 180 days</strong> elapsed (Certificate ${esc(ccStr)} valid through <strong>${esc(expStr)}</strong>).</div>`;
  }
}

/* ==================== AUTO-SAVE, REFRESH PERSISTENCE & MULTI-USER MERGE ==================== */
function hasSaveableClientName(c) {
  if (!c || !c.debtor1) return false;
  return Boolean((c.debtor1.last_name || "").trim() || (c.debtor1.first_name || "").trim() || (c.debtor1.full_name || "").trim());
}

function setAutoSaveBadge(text, cls = "") {
  const el = $("hdr-autosave");
  if (!el) return;
  el.textContent = text;
  el.className = "pill" + (cls ? " " + cls : "");
}

function persistWorkingSession() {
  if (!state.caseData) return;
  try {
    sessionStorage.setItem(SESSION_DRAFT_KEY, JSON.stringify({
      caseData: state.caseData,
      baseCaseSnapshot: state.baseCaseSnapshot,
      baseRevision: state.baseRevision,
      activeFolder: state.activeFolder,
      activeTab: state.activeTab,
      dirty: state.dirty,
      savedAt: Date.now(),
    }));
  } catch (_) {}
}

function restoreWorkingSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_DRAFT_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);
    if (!saved || !saved.caseData || typeof saved.caseData !== "object") return false;
    // Merge onto a fresh blank case so any newly added schema fields exist
    const blank = createBlankCase(saved.caseData.chapter || "7");
    state.caseData = Object.assign(blank, saved.caseData);
    state.caseData.debtor1 = Object.assign(blank.debtor1, saved.caseData.debtor1 || {});
    state.caseData.debtor2 = Object.assign(blank.debtor2, saved.caseData.debtor2 || {});
    state.caseData.personal_assets = Object.assign(blank.personal_assets, saved.caseData.personal_assets || {});
    state.caseData.income_debtor1 = Object.assign(blank.income_debtor1, saved.caseData.income_debtor1 || {});
    state.caseData.income_debtor2 = Object.assign(blank.income_debtor2, saved.caseData.income_debtor2 || {});
    state.caseData.expenses = Object.assign(blank.expenses, saved.caseData.expenses || {});
    state.caseData.sofa = Object.assign(blank.sofa, saved.caseData.sofa || {});
    state.caseData.means_test = Object.assign(blank.means_test, saved.caseData.means_test || {});
    state.caseData.attorney_fees = Object.assign(blank.attorney_fees, saved.caseData.attorney_fees || {});
    state.baseCaseSnapshot = saved.baseCaseSnapshot || null;
    state.baseRevision = saved.baseRevision ?? null;
    state.activeFolder = saved.activeFolder || "";
    state.activeTab = saved.activeTab || "import";
    state.dirty = !!saved.dirty;
    return true;
  } catch (_) {
    return false;
  }
}

function clearWorkingSession() {
  try { sessionStorage.removeItem(SESSION_DRAFT_KEY); } catch (_) {}
  state.baseCaseSnapshot = null;
  state.baseRevision = null;
  state.activeFolder = "";
  state.dirty = false;
  clearTimeout(state.autoSaveTimer);
  setAutoSaveBadge("Auto-Save: Ready", "");
}

function markDirtyAndScheduleAutoSave() {
  state.dirty = true;
  persistWorkingSession();
  if (hasSaveableClientName(state.caseData)) {
    setAutoSaveBadge("Auto-Save: Pending...", "pill-gold");
    scheduleAutoSave(1800);
  } else {
    setAutoSaveBadge("Tab Draft Saved (Enter Name for Folder)", "");
  }
}

function scheduleAutoSave(delayMs = 1800) {
  clearTimeout(state.autoSaveTimer);
  state.autoSaveTimer = setTimeout(() => {
    if (state.dirty && hasSaveableClientName(state.caseData)) {
      saveDraft({ silent: true });
    }
  }, delayMs);
}

function renderAllCaseUIPreservingFocus() {
  const activeEl = document.activeElement;
  const activeId = activeEl && activeEl.id ? activeEl.id : null;
  const activeVal = activeId && "value" in activeEl ? activeEl.value : null;
  const selStart = activeId && typeof activeEl.selectionStart === "number" ? activeEl.selectionStart : null;
  const selEnd = activeId && typeof activeEl.selectionEnd === "number" ? activeEl.selectionEnd : null;

  renderAllCaseUI();

  if (activeId) {
    const restored = $(activeId);
    if (restored) {
      if (activeVal !== null && restored.value !== activeVal) {
        // Keep the user's in-progress typing in the single field they're actively editing
        restored.value = activeVal;
      }
      try {
        restored.focus();
        if (selStart !== null && selEnd !== null && typeof restored.setSelectionRange === "function") {
          restored.setSelectionRange(selStart, selEnd);
        }
      } catch (_) {}
    }
  }
}

async function checkAndSyncRemoteChanges() {
  if (!state.activeFolder || state.savingInFlight || document.hidden) return;
  try {
    const res = await api("/api/cases");
    const list = res.saved_cases || [];
    state.savedCases = list;
    const match = list.find((item) => item.folder_name === state.activeFolder);
    if (!match || match.revision === undefined || state.baseRevision === null) return;
    if (Number(match.revision) > Number(state.baseRevision)) {
      if (state.dirty) {
        // Both coworker and this user edited -> trigger server 3-way merge automatically!
        await saveDraft({ silent: true });
      } else {
        // Only coworker edited -> seamlessly pull their newer revision!
        const loaded = await api(`/api/cases/${encodeURIComponent(state.activeFolder)}`);
        if (loaded && loaded.case) {
          state.caseData = loaded.case;
          state.baseCaseSnapshot = JSON.parse(JSON.stringify(loaded.case));
          state.baseRevision = Number(loaded.case.revision || match.revision);
          state.totals = loaded.totals || state.totals;
          state.compliance = loaded.compliance || state.compliance;
          state.matrixPreview = loaded.matrix_preview || state.matrixPreview;
          renderAllCaseUIPreservingFocus();
          updateHeaderAndMetrics();
          renderCompliance();
          renderMatrixPreview();
          renderSavedCases();
          persistWorkingSession();
          const tStr = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
          setAutoSaveBadge(`Synced Coworker Edits (${tStr}, Rev #${state.baseRevision})`, "pill-ok");
          toast(`Synced coworker's updates to ${state.activeFolder} (Rev #${state.baseRevision})`, "ok");
        }
      }
    }
  } catch (_) {}
}

function startConcurrentSyncPoller() {
  if (startConcurrentSyncPoller._started) return;
  startConcurrentSyncPoller._started = true;
  setInterval(() => {
    checkAndSyncRemoteChanges();
  }, 15000);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (state.dirty) {
        syncScalarsToCase();
        persistWorkingSession();
        if (hasSaveableClientName(state.caseData)) saveDraft({ silent: true });
      }
    } else {
      checkAndSyncRemoteChanges();
    }
  });
  window.addEventListener("beforeunload", () => {
    if (state.caseData) {
      try { syncScalarsToCase(); } catch (_) {}
      persistWorkingSession();
    }
  });
}

function scheduleRecalc(resetForms = false) {
  syncScalarsToCase();
  markDirtyAndScheduleAutoSave();
  clearTimeout(state.calcTimer);
  state.calcTimer = setTimeout(() => recalculate(resetForms), 180);
}

async function recalculate(resetForms = false) {
  try {
    const res = await api("/api/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state.caseData),
    });
    state.totals = res.totals || {};
    state.compliance = res.compliance || [];
    state.folderName = res.folder_name || "Unnamed,Client";
    state.matrixPreview = res.matrix_preview || { count: 0, text: "", warnings: [] };
    if (resetForms || !state.caseData.selected_forms || state.caseData.selected_forms.length === 0) {
      state.caseData.selected_forms = res.recommended_forms || [];
    }
    updateHeaderAndMetrics();
    renderCompliance();
    renderFormsChecklist(res.recommended_forms || []);
    renderMatrixPreview();
  } catch (err) {
    console.error("Recalc failed:", err);
  }
}

function updateHeaderAndMetrics() {
  const c = state.caseData;
  const t = state.totals;
  $("hdr-folder").textContent = `Folder: ${state.folderName}`;
  $("hdr-chapter").textContent = `Chapter ${c.chapter}${c.is_joint ? " (Joint)" : ""}`;
  $("gen-folder-preview").textContent = `Clients/${state.folderName}`;
  $("forms-chapter-lbl").textContent = `Chapter ${c.chapter}`;
  $("badge-creditors").textContent = String((c.secured_creditors?.length || 0) + (c.unsecured_creditors?.length || 0));
  $("badge-forms").textContent = String((c.selected_forms || []).length);

  const errs = state.compliance.filter((x) => x.level === "error").length;
  const warns = state.compliance.filter((x) => x.level === "warn").length;
  const pill = $("hdr-compliance");
  if (errs > 0) {
    pill.className = "pill pill-err";
    pill.textContent = `${errs} Error(s), ${warns} Warn`;
  } else if (warns > 0) {
    pill.className = "pill pill-warn";
    pill.textContent = `${warns} Warning(s)`;
  } else {
    pill.className = "pill pill-ok";
    pill.textContent = "Tampa Ready";
  }

  // Venue badge
  const venueChk = state.compliance.find((x) => x.code === "VENUE");
  if (venueChk) {
    $("tampa-venue-badge").textContent = venueChk.level === "ok" ? "Tampa Division Confirmed" : venueChk.title;
    $("tampa-venue-badge").className = venueChk.level === "ok" ? "tag tag-ok" : "tag tag-warn";
  }

  // Assets stats
  const totalExempt = (c.exemptions || []).reduce((s, x) => s + Number(x.exemption_amount || 0), 0);
  $("assets-stats").innerHTML = `
    <div class="stat-box"><div class="stat-label">Real Estate</div><div class="stat-val">${money(t.real_estate_total)}</div></div>
    <div class="stat-box"><div class="stat-label">Vehicles</div><div class="stat-val">${money(t.vehicles_total)}</div></div>
    <div class="stat-box"><div class="stat-label">Personal Property</div><div class="stat-val">${money(t.personal_property_total)}</div></div>
    <div class="stat-box"><div class="stat-label">Total Assets</div><div class="stat-val">${money(t.all_assets_total)}</div></div>
    <div class="stat-box stat-ok"><div class="stat-label">FL Exemptions Claimed</div><div class="stat-val">${money(totalExempt)}</div></div>
  `;

  // Creditors stats
  $("creditors-stats").innerHTML = `
    <div class="stat-box"><div class="stat-label">Secured (Sch. D)</div><div class="stat-val">${money(t.secured_total)}</div></div>
    <div class="stat-box"><div class="stat-label">Priority (Sch. E)</div><div class="stat-val">${money(t.priority_total)}</div></div>
    <div class="stat-box"><div class="stat-label">Nonpriority (Sch. F)</div><div class="stat-val">${money(t.nonpriority_total)}</div></div>
    <div class="stat-box"><div class="stat-label">Total Liabilities</div><div class="stat-val">${money(t.total_liabilities)}</div></div>
    <div class="stat-box"><div class="stat-label">Matrix Creditors</div><div class="stat-val">${state.matrixPreview.count || 0}</div></div>
  `;

  // Budget stats
  const netCls = (t.monthly_net_income || 0) >= 0 ? "stat-ok" : "stat-warn";
  $("budget-stats").innerHTML = `
    <div class="stat-box"><div class="stat-label">Debtor 1 Net Income</div><div class="stat-val">${money(t.d1_income?.total)}</div></div>
    <div class="stat-box"><div class="stat-label">Debtor 2 Net Income</div><div class="stat-val">${money(c.is_joint ? t.d2_income?.total : 0)}</div></div>
    <div class="stat-box"><div class="stat-label">Combined Monthly (Sch. I)</div><div class="stat-val">${money(t.combined_monthly_income)}</div></div>
    <div class="stat-box"><div class="stat-label">Monthly Expenses (Sch. J)</div><div class="stat-val">${money(t.total_expenses)}</div></div>
    <div class="stat-box ${netCls}"><div class="stat-label">Monthly Net Income</div><div class="stat-val">${money(t.monthly_net_income)}</div></div>
  `;

  // Means Test stats
  const mtCls = t.above_median ? "stat-warn" : "stat-ok";
  const mtResultLabel =
    c.chapter === "7"
      ? t.above_median ? "Above Median (122A-2 Req.)" : "Below Median (Passes)"
      : t.above_median ? "5-Yr Plan (122C-2 Req.)" : "3-Yr Plan (Below Median)";
  $("means-stats").innerHTML = `
    <div class="stat-box"><div class="stat-label">Household Size</div><div class="stat-val">${t.household_size || 1}</div></div>
    <div class="stat-box"><div class="stat-label">Monthly CMI (Excl. SS)</div><div class="stat-val">${money(t.total_cmi)}</div></div>
    <div class="stat-box"><div class="stat-label">Annualized CMI</div><div class="stat-val">${money(t.annualized_cmi)}</div></div>
    <div class="stat-box"><div class="stat-label">FL Median Income</div><div class="stat-val">${money(t.fl_median_income)}</div></div>
    <div class="stat-box ${mtCls}"><div class="stat-label">Means Test Outcome</div><div class="stat-val" style="font-size:15px;">${mtResultLabel}</div></div>
  `;
  $("mt-source-badge").textContent = c.means_test.source === "external_site" ? "Imported from Means Test Site" : "Calculated from Schedule I";
}

/* ==================== RENDER DYNAMIC LISTS ==================== */
function renderAllCaseUI() {
  populateScalarsFromCase();
  renderCifWarnings();
  renderDependents();
  renderPriorBankruptcies();
  renderRealEstate();
  renderVehicles();
  renderBankAccounts();
  renderRetirementAccounts();
  renderExemptions();
  renderSecuredCreditors();
  renderUnsecuredCreditors();
  renderContracts();
  renderCodebtors();
}

function renderCifWarnings() {
  const ws = state.caseData.cif_raw_warnings || [];
  $("cif-warnings").innerHTML = ws.length
    ? ws.map((w) => `<div class="alert alert-warn">${esc(w)}</div>`).join("")
    : "";
}

function renderDependents() {
  const arr = state.caseData.dependents || [];
  $("dependents-list").innerHTML = arr.length
    ? arr.map((d, i) => `
      <div class="grid-4" style="align-items:end;">
        <div class="field"><label>Relationship</label><input type="text" value="${esc(d.relationship)}" onchange="updateArr('dependents',${i},'relationship',this.value)"/></div>
        <div class="field"><label>Age</label><input type="text" value="${esc(d.age)}" onchange="updateArr('dependents',${i},'age',this.value)"/></div>
        <div class="field"><label>Internal Ref Name (Private)</label><input type="text" value="${esc(d.name)}" onchange="updateArr('dependents',${i},'name',this.value)"/></div>
        <div class="field"><button class="btn btn-danger btn-sm" onclick="removeArr('dependents',${i})">Remove</button></div>
      </div>`).join("")
    : '<div class="muted">No dependents added.</div>';
}

function renderPriorBankruptcies() {
  const arr = state.caseData.prior_bankruptcies || [];
  $("prior-bk-list").innerHTML = arr.length
    ? arr.map((p, i) => `
      <div class="grid-4" style="align-items:end;">
        <div class="field"><label>District</label><input type="text" value="${esc(p.district)}" onchange="updateArr('prior_bankruptcies',${i},'district',this.value)"/></div>
        <div class="field"><label>Date Filed</label><input type="text" data-format="date" maxlength="10" placeholder="MM/DD/YYYY" value="${esc(formatDateInput(p.date_filed, false))}" onchange="updateArr('prior_bankruptcies',${i},'date_filed',this.value)"/></div>
        <div class="field"><label>Case Number</label><input type="text" value="${esc(p.case_number)}" onchange="updateArr('prior_bankruptcies',${i},'case_number',this.value)"/></div>
        <div class="field"><button class="btn btn-danger btn-sm" onclick="removeArr('prior_bankruptcies',${i})">Remove</button></div>
      </div>`).join("")
    : '<div class="muted">No prior bankruptcy filings in the past 8 years.</div>';
}

const COUNTY_APPRAISER_LINKS = {
  pinellas:     { label: "Look Up on PCPAO.gov",        url: "https://www.pcpao.gov/quick-search", source: "Pinellas County Property Appraiser (PCPAO.gov)" },
  hillsborough: { label: "Look Up on HCPAFL.org",       url: "https://gis.hcpafl.org/propertysearch/", source: "Hillsborough County Property Appraiser (HCPAFL.org)" },
  pasco:        { label: "Look Up on PascoPA.com",      url: "https://search.pascopa.com/", source: "Pasco County Property Appraiser (PascoPA.com)" },
  manatee:      { label: "Look Up on ManateePAO.gov",   url: "https://www.manateepao.gov/search/", source: "Manatee County Property Appraiser (ManateePAO.gov)" },
  sarasota:     { label: "Look Up on SC-PA.com",        url: "https://www.sc-pa.com/propertysearch", source: "Sarasota County Property Appraiser (SC-PA.com)" },
  polk:         { label: "Look Up on PolkPA.org",       url: "https://www.polkpa.org/CamaDisplay.aspx", source: "Polk County Property Appraiser (PolkPA.org)" },
  hernando:     { label: "Look Up on HernandoPA",       url: "https://www.hernandopa-fl.us/propertysearch/", source: "Hernando County Property Appraiser" },
  hardee:       { label: "Look Up on Hardee PA",        url: "https://www.qpublic.net/fl/hardee/search.html", source: "Hardee County Property Appraiser" },
};

function getPropertyAppraiserInfo(countyRaw) {
  const key = String(countyRaw || "").toLowerCase().replace(/\s*county\s*/g, "").trim();
  if (COUNTY_APPRAISER_LINKS[key]) return COUNTY_APPRAISER_LINKS[key];
  // Default to Pinellas County PCPAO.gov per Tampa Division / firm practice
  return COUNTY_APPRAISER_LINKS.pinellas;
}

window.toggleRealEstateUseDebtorAddr = (idx, checked) => {
  const r = state.caseData.real_estate[idx];
  if (!r) return;
  r.use_debtor_address = !!checked;
  if (checked) {
    syncScalarsToCase();
    const d1 = state.caseData.debtor1 || {};
    r.address = d1.street || "";
    r.city = d1.city || "";
    r.state = d1.state || "FL";
    r.zip_code = d1.zip_code || "";
    r.county = d1.county || "";
    if (!r.value_source || r.value_source === "County Property Appraiser Just/Market Value") {
      r.value_source = getPropertyAppraiserInfo(r.county).source;
    }
    toast("Pulled Debtor 1's address into Property #" + (idx + 1), "ok");
  }
  renderRealEstate();
  scheduleRecalc(false);
};

window.lookupPropertyAppraiser = (idx) => {
  const r = state.caseData.real_estate[idx];
  if (!r) return;
  const info = getPropertyAppraiserInfo(r.county || state.caseData.debtor1?.county);
  const street = (r.address || "").trim();
  if (street && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(street).then(
      () => toast(`Copied "${street}" to clipboard — paste into ${info.label.replace("Look Up on ", "")}!`, "ok"),
      () => {}
    );
  }
  window.open(info.url, "_blank", "noopener");
};

function buildKbbUrl(v) {
  const slug = (s) => String(s || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const yr = String(v.year || "").replace(/\D/g, "");
  const mk = slug(v.make);
  const md = slug(v.model);
  if (yr.length === 4 && mk && md) {
    return `https://www.kbb.com/${mk}/${md}/${yr}/`;
  }
  return "https://www.kbb.com/whats-my-car-worth/";
}

function renderRealEstate() {
  const arr = state.caseData.real_estate || [];
  $("real-estate-list").innerHTML = arr.length
    ? arr.map((r, i) => {
      const paInfo = getPropertyAppraiserInfo(r.county || state.caseData.debtor1?.county);
      const locked = r.use_debtor_address ? 'readonly style="background:#f1f5f9;"' : "";
      return `
      <div class="subcard">
        <div class="subcard-head" style="flex-wrap:wrap; gap:8px;">
          <div style="display:flex; align-items:center; gap:14px; flex-wrap:wrap;">
            <strong>Property #${i + 1} ${r.is_primary_residence ? "(Primary Homestead)" : ""}</strong>
            <label class="check-row" style="font-size:12px; color:var(--navy); font-weight:600;">
              <input type="checkbox" ${r.use_debtor_address ? "checked" : ""} onchange="toggleRealEstateUseDebtorAddr(${i}, this.checked)" />
              Use Debtor 1's Address Automatically
            </label>
          </div>
          <div class="btn-group">
            <button type="button" class="btn btn-secondary btn-sm" onclick="lookupPropertyAppraiser(${i})" title="Copies street address to clipboard and opens Property Appraiser search">${esc(paInfo.label)} &nearr;</button>
            <button type="button" class="btn btn-danger btn-sm" onclick="removeArr('real_estate',${i})">Remove</button>
          </div>
        </div>
        <div class="grid-4">
          <div class="field"><label>Street Address</label><input type="text" ${locked} value="${esc(r.address)}" onchange="updateArr('real_estate',${i},'address',this.value)"/></div>
          <div class="field"><label>City</label><input type="text" ${locked} value="${esc(r.city)}" onchange="updateArr('real_estate',${i},'city',this.value)"/></div>
          <div class="field"><label>State / ZIP</label><input type="text" ${locked} value="${esc(r.zip_code)}" onchange="updateArr('real_estate',${i},'zip_code',this.value)"/></div>
          <div class="field"><label>County</label><input type="text" ${locked} value="${esc(r.county)}" onchange="updateArr('real_estate',${i},'county',this.value);renderRealEstate();"/></div>
          <div class="field">
            <label style="display:flex; justify-content:space-between; align-items:center;">
              <span>Market Value ($)</span>
              <a href="${esc(paInfo.url)}" target="_blank" rel="noopener" onclick="lookupPropertyAppraiser(${i});return false;" style="font-size:11px; color:var(--navy); text-decoration:underline;">PCPAO / PA &nearr;</a>
            </label>
            <input type="text" inputmode="decimal" data-format="currency" value="${esc(formatCurrencyDisplay(r.market_value))}" onchange="updateArrNum('real_estate',${i},'market_value',this.value);updateArrNum('real_estate',${i},'portion_owned_value',this.value)"/>
          </div>
          <div class="field"><label>Value Source</label><input type="text" value="${esc(r.value_source)}" onchange="updateArr('real_estate',${i},'value_source',this.value)"/></div>
          <div class="field"><label>Intent</label>
            <select onchange="updateArr('real_estate',${i},'intent',this.value)">
              <option value="Keep" ${r.intent === "Keep" ? "selected" : ""}>Keep</option>
              <option value="Surrender" ${r.intent === "Surrender" ? "selected" : ""}>Surrender</option>
            </select>
          </div>
          <div class="field" style="justify-content:center;">
            <label class="check-row"><input type="checkbox" ${r.is_primary_residence ? "checked" : ""} onchange="updateArr('real_estate',${i},'is_primary_residence',this.checked);renderRealEstate();"/> Primary Residence</label>
          </div>
        </div>
      </div>`;
    }).join("")
    : '<div class="muted">No real estate listed. Click <strong>"+ Add from Debtor 1 Address"</strong> to pull the debtor\'s home automatically.</div>';
}

function renderVehicles() {
  const arr = state.caseData.vehicles || [];
  $("vehicles-list").innerHTML = arr.length
    ? arr.map((v, i) => {
      const kbbUrl = buildKbbUrl(v);
      return `
      <div class="subcard">
        <div class="subcard-head" style="flex-wrap:wrap; gap:8px;">
          <strong>Vehicle #${i + 1}: ${esc(`${v.year} ${v.make} ${v.model}`.trim() || "New Vehicle")}</strong>
          <div class="btn-group">
            <a class="btn btn-secondary btn-sm" href="${esc(kbbUrl)}" target="_blank" rel="noopener" title="Look up private-party/trade-in value on Kelley Blue Book">Look Up on KBB.com &nearr;</a>
            <button type="button" class="btn btn-danger btn-sm" onclick="removeArr('vehicles',${i})">Remove</button>
          </div>
        </div>
        <div class="grid-4">
          <div class="field"><label>Year</label><input type="text" value="${esc(v.year)}" onchange="updateArr('vehicles',${i},'year',this.value);renderVehicles();"/></div>
          <div class="field"><label>Make</label><input type="text" value="${esc(v.make)}" onchange="updateArr('vehicles',${i},'make',this.value);renderVehicles();"/></div>
          <div class="field"><label>Model</label><input type="text" value="${esc(v.model)}" onchange="updateArr('vehicles',${i},'model',this.value);renderVehicles();"/></div>
          <div class="field"><label>Mileage</label><input type="text" value="${esc(v.mileage)}" onchange="updateArr('vehicles',${i},'mileage',this.value)"/></div>
          <div class="field">
            <label style="display:flex; justify-content:space-between; align-items:center;">
              <span>Market Value ($)</span>
              <a href="${esc(kbbUrl)}" target="_blank" rel="noopener" style="font-size:11px; color:var(--navy); text-decoration:underline;">KBB.com &nearr;</a>
            </label>
            <input type="text" inputmode="decimal" data-format="currency" value="${esc(formatCurrencyDisplay(v.market_value))}" onchange="updateArrNum('vehicles',${i},'market_value',this.value);updateArrNum('vehicles',${i},'portion_owned_value',this.value)"/>
          </div>
          <div class="field"><label>Loan Payoff ($)</label><input type="text" inputmode="decimal" data-format="currency" value="${esc(formatCurrencyDisplay(v.payoff))}" onchange="updateArrNum('vehicles',${i},'payoff',this.value)"/></div>
          <div class="field"><label>Intent (Ch. 7 / 13)</label>
            <select onchange="updateArr('vehicles',${i},'intent',this.value)">
              ${["Keep", "Reaffirm", "Redeem", "Surrender"].map((o) => `<option value="${o}" ${v.intent === o ? "selected" : ""}>${o}</option>`).join("")}
            </select>
          </div>
          <div class="field"><label>Value Source</label><input type="text" value="${esc(v.value_source)}" onchange="updateArr('vehicles',${i},'value_source',this.value)"/></div>
        </div>
      </div>`;
    }).join("")
    : '<div class="muted">No vehicles listed.</div>';
}

function renderBankAccounts() {
  const arr = state.caseData.personal_assets.bank_accounts || [];
  $("bank-accounts-list").innerHTML = arr.length
    ? arr.map((b, i) => `
      <div style="display:grid; grid-template-columns: 110px 1.4fr 110px 120px auto; gap:8px; align-items:end; margin-bottom:8px;">
        <div class="field" style="margin-bottom:0;"><label>Type</label>
          <select onchange="updateSubArr('bank_accounts',${i},'account_type',this.value)">
            ${["Checking", "Savings", "CD", "Other"].map((t) => `<option value="${t}" ${b.account_type === t ? "selected" : ""}>${t}</option>`).join("")}
          </select>
        </div>
        <div class="field" style="margin-bottom:0;"><label>Bank / Credit Union</label><input type="text" value="${esc(b.institution)}" placeholder="e.g., Bank of America" onchange="updateSubArr('bank_accounts',${i},'institution',this.value)"/></div>
        <div class="field" style="margin-bottom:0;"><label>Acct # (Last 4)</label><input type="text" value="${esc(b.account_last4)}" placeholder="e.g., 4821" onchange="updateSubArr('bank_accounts',${i},'account_last4',this.value)"/></div>
        <div class="field" style="margin-bottom:0;"><label>Balance ($)</label><input type="text" inputmode="decimal" data-format="currency" value="${esc(formatCurrencyDisplay(b.balance))}" onchange="updateSubArrNum('bank_accounts',${i},'balance',this.value)"/></div>
        <div class="field" style="margin-bottom:0;"><button type="button" class="btn btn-danger btn-sm" onclick="removeSubArr('bank_accounts',${i})">&times;</button></div>
      </div>`).join("")
    : '<div class="muted">No bank accounts listed.</div>';
}

function renderRetirementAccounts() {
  const arr = state.caseData.personal_assets.retirement_accounts || [];
  $("retirement-accounts-list").innerHTML = arr.length
    ? arr.map((r, i) => `
      <div style="display:grid; grid-template-columns: 110px 1.4fr 110px 120px auto; gap:8px; align-items:end; margin-bottom:8px;">
        <div class="field" style="margin-bottom:0;"><label>Type</label>
          <select onchange="updateSubArr('retirement_accounts',${i},'account_type',this.value)">
            ${["401(k)", "IRA", "Pension", "Retirement", "Other"].map((t) => `<option value="${t}" ${r.account_type === t ? "selected" : ""}>${t}</option>`).join("")}
          </select>
        </div>
        <div class="field" style="margin-bottom:0;"><label>Institution</label><input type="text" value="${esc(r.institution)}" placeholder="e.g., Fidelity / Vanguard" onchange="updateSubArr('retirement_accounts',${i},'institution',this.value)"/></div>
        <div class="field" style="margin-bottom:0;"><label>Acct # (Last 4)</label><input type="text" value="${esc(r.account_last4)}" placeholder="e.g., 9104" onchange="updateSubArr('retirement_accounts',${i},'account_last4',this.value)"/></div>
        <div class="field" style="margin-bottom:0;"><label>Balance ($)</label><input type="text" inputmode="decimal" data-format="currency" value="${esc(formatCurrencyDisplay(r.balance))}" onchange="updateSubArrNum('retirement_accounts',${i},'balance',this.value)"/></div>
        <div class="field" style="margin-bottom:0;"><button type="button" class="btn btn-danger btn-sm" onclick="removeSubArr('retirement_accounts',${i})">&times;</button></div>
      </div>`).join("")
    : '<div class="muted">No retirement accounts listed.</div>';
}

function populateExemptionSchemesDropdown() {
  const sel = $("f-exemption-scheme");
  if (!sel) return;
  const schemes = state.exemptionsCatalog?.schemes || [];
  if (!schemes.length) return;
  const cur = (state.caseData?.exemption_scheme || sel.value || "FL").toUpperCase();
  sel.innerHTML = schemes
    .map((s) => `<option value="${esc(s.code)}">${esc(s.name)}</option>`)
    .join("");
  sel.value = schemes.some((s) => s.code === cur) ? cur : "FL";
}

function getActiveSchemeCode() {
  return ((state.caseData && state.caseData.exemption_scheme) || "FL").toUpperCase();
}

function getActiveSchemeExemptions() {
  const code = getActiveSchemeCode();
  const byScheme = state.exemptionsCatalog?.by_scheme || {};
  return byScheme[code] || byScheme.FL || [];
}

function formatExemptionCapBadge(item, isJoint) {
  if (!item) return "";
  if (item.unlimited) return "100% / Unlimited";
  const lim = isJoint ? (item.limit_joint ?? item.limit_single) : item.limit_single;
  if (lim === null || lim === undefined) return "State Statutory Cap";
  return `${money(lim)}${isJoint ? " (Joint)" : " (Single)"}`;
}

function findExemptionCatalogEntry(ex) {
  const active = getActiveSchemeExemptions();
  const byScheme = state.exemptionsCatalog?.by_scheme || {};
  const allFallback = [...active, ...(byScheme.FL || []), ...(byScheme.FEDERAL || [])];
  if (ex.exemption_id) {
    const exact = allFallback.find((item) => item.id === ex.exemption_id);
    if (exact) return exact;
  }
  const st = String(ex.statute || "").toLowerCase().trim();
  if (!st) return null;
  // Exact or substring match against statute text
  const byStatute = active.find((item) => {
    const is = item.statute.toLowerCase();
    return st === is || st.includes(is) || is.includes(st);
  });
  if (byStatute) return byStatute;
  // Helpful FL / Federal keyword fallbacks for legacy/imported rows
  if (st.includes("222.25(4)")) return allFallback.find((x) => x.id === "fl_wildcard") || null;
  if (st.includes("222.25(1)")) return allFallback.find((x) => x.id === "fl_vehicle") || null;
  if (st.includes("222.05")) return allFallback.find((x) => x.id === "fl_homestead_leasehold") || null;
  if (st.includes("4(a)(1)") || st.includes("222.01")) return allFallback.find((x) => x.id === "fl_homestead") || null;
  if (st.includes("4(a)(2)")) return allFallback.find((x) => x.id === "fl_personal") || null;
  if (st.includes("222.21(1)")) return allFallback.find((x) => x.id === "fl_us_pension") || null;
  if (st.includes("222.21")) return allFallback.find((x) => x.id === "fl_retirement") || null;
  if (st.includes("222.14")) return allFallback.find((x) => x.id === "fl_life_annuity") || null;
  if (st.includes("222.11(2)(c)")) return allFallback.find((x) => x.id === "fl_wages_non_hoh") || null;
  if (st.includes("222.11")) return allFallback.find((x) => x.id === "fl_wages_hoh") || null;
  if (st.includes("222.25(3)")) return allFallback.find((x) => x.id === "fl_eitc") || null;
  if (st.includes("222.26(1)")) return allFallback.find((x) => x.id === "fl_med_debt_vehicle") || null;
  if (st.includes("222.26(2)")) return allFallback.find((x) => x.id === "fl_med_debt_personal") || null;
  if (st.includes("522(d)(1)")) return allFallback.find((x) => x.id === "fed_homestead") || null;
  if (st.includes("522(d)(2)")) return allFallback.find((x) => x.id === "fed_vehicle") || null;
  if (st.includes("522(d)(3)")) return allFallback.find((x) => x.id === "fed_household") || null;
  if (st.includes("522(d)(4)")) return allFallback.find((x) => x.id === "fed_jewelry") || null;
  if (st.includes("522(d)(5)")) return allFallback.find((x) => x.id === "fed_wildcard") || null;
  if (st.includes("522(d)(12)")) return allFallback.find((x) => x.id === "fed_retirement") || null;
  return null;
}

function renderExemptionCapMeters() {
  const el = $("exempt-cap-meters");
  if (!el) return;
  const c = state.caseData;
  const scheme = getActiveSchemeCode();
  const mult = c.is_joint ? 2 : 1;
  const exs = c.exemptions || [];
  const totalExempt = exs.reduce((s, x) => s + Number(x.exemption_amount || 0), 0);

  if (scheme === "FL") {
    const th = state.settings?.thresholds || {};
    const vehCap = Number(th.fl_vehicle_exemption || 5000) * mult;
    const persCap = Number(th.fl_personal_property_exemption || 1000) * mult;
    const wildCap = Number(th.fl_wildcard_exemption || 4000) * mult;
    const hasHome = exs.some((x) => (x.exemption_id || "").startsWith("fl_homestead") || /4\(a\)\(1\)|4\(b\)|222\.01|222\.05|homestead/i.test(x.statute || ""));
    const vehUsed = exs.filter((x) => x.exemption_id === "fl_vehicle" || /222\.25\(1\)/.test(x.statute || "")).reduce((s, x) => s + Number(x.exemption_amount || 0), 0);
    const persUsed = exs.filter((x) => x.exemption_id === "fl_personal" || /4\(a\)\(2\)/.test(x.statute || "")).reduce((s, x) => s + Number(x.exemption_amount || 0), 0);
    const wildUsed = exs.filter((x) => x.exemption_id === "fl_wildcard" || /222\.25\(4\)/.test(x.statute || "")).reduce((s, x) => s + Number(x.exemption_amount || 0), 0);
    const effWildCap = hasHome ? 0 : wildCap;

    el.innerHTML = `
      <div class="stat-card"><div class="stat-label">FL Homestead (Art. X § 4(a)(1))</div><div class="stat-val" style="font-size:16px;">${hasHome ? "Claimed (Unlimited)" : "Not Claimed"}</div><div class="stat-sub">${hasHome ? "Wildcard (§ 222.25(4)) unavailable" : "Wildcard ($" + wildCap.toLocaleString() + ") unlocked!"}</div></div>
      <div class="stat-card" style="${vehUsed > vehCap ? "border-color:#dc2626;" : ""}"><div class="stat-label">FL Vehicle (§ 222.25(1))</div><div class="stat-val" style="font-size:16px;${vehUsed > vehCap ? "color:#dc2626;" : ""}">${money(vehUsed)} / ${money(vehCap)}</div><div class="stat-sub">${money(Math.max(0, vehCap - vehUsed))} remaining</div></div>
      <div class="stat-card" style="${persUsed > persCap ? "border-color:#dc2626;" : ""}"><div class="stat-label">FL Personal Prop (§ 4(a)(2))</div><div class="stat-val" style="font-size:16px;${persUsed > persCap ? "color:#dc2626;" : ""}">${money(persUsed)} / ${money(persCap)}</div><div class="stat-sub">${money(Math.max(0, persCap - persUsed))} remaining</div></div>
      <div class="stat-card" style="${wildUsed > effWildCap ? "border-color:#dc2626;" : ""}"><div class="stat-label">FL Wildcard (§ 222.25(4))</div><div class="stat-val" style="font-size:16px;${wildUsed > effWildCap ? "color:#dc2626;" : ""}">${money(wildUsed)} / ${money(effWildCap)}</div><div class="stat-sub">Total Schedule C: ${money(totalExempt)}</div></div>
    `;
  } else if (scheme === "FEDERAL") {
    const homeCap = 31575 * mult;
    const vehCap = 5025 * mult;
    const hhCap = 16850 * mult;
    const homeUsed = exs.filter((x) => x.exemption_id === "fed_homestead" || /522\(d\)\(1\)/.test(x.statute || "")).reduce((s, x) => s + Number(x.exemption_amount || 0), 0);
    const vehUsed = exs.filter((x) => x.exemption_id === "fed_vehicle" || /522\(d\)\(2\)/.test(x.statute || "")).reduce((s, x) => s + Number(x.exemption_amount || 0), 0);
    const hhUsed = exs.filter((x) => x.exemption_id === "fed_household" || /522\(d\)\(3\)/.test(x.statute || "")).reduce((s, x) => s + Number(x.exemption_amount || 0), 0);
    const wildUsed = exs.filter((x) => x.exemption_id === "fed_wildcard" || /522\(d\)\(5\)/.test(x.statute || "")).reduce((s, x) => s + Number(x.exemption_amount || 0), 0);
    const wildCap = (1675 * mult) + Math.min(Math.max(0, homeCap - homeUsed), 15800 * mult);

    el.innerHTML = `
      <div class="stat-card" style="${homeUsed > homeCap ? "border-color:#dc2626;" : ""}"><div class="stat-label">Fed. Homestead (§ 522(d)(1))</div><div class="stat-val" style="font-size:16px;">${money(homeUsed)} / ${money(homeCap)}</div><div class="stat-sub">Apr. 1, 2025 adjusted cap</div></div>
      <div class="stat-card" style="${vehUsed > vehCap ? "border-color:#dc2626;" : ""}"><div class="stat-label">Fed. Vehicle (§ 522(d)(2))</div><div class="stat-val" style="font-size:16px;">${money(vehUsed)} / ${money(vehCap)}</div><div class="stat-sub">${money(Math.max(0, vehCap - vehUsed))} remaining</div></div>
      <div class="stat-card" style="${hhUsed > hhCap ? "border-color:#dc2626;" : ""}"><div class="stat-label">Fed. Household (§ 522(d)(3))</div><div class="stat-val" style="font-size:16px;">${money(hhUsed)} / ${money(hhCap)}</div><div class="stat-sub">${money(Math.max(0, hhCap - hhUsed))} remaining</div></div>
      <div class="stat-card" style="${wildUsed > wildCap ? "border-color:#dc2626;" : ""}"><div class="stat-label">Fed. Wildcard (§ 522(d)(5))</div><div class="stat-val" style="font-size:16px;">${money(wildUsed)} / ${money(wildCap)}</div><div class="stat-sub">Total Schedule C: ${money(totalExempt)}</div></div>
    `;
  } else {
    const schObj = (state.exemptionsCatalog?.schemes || []).find((s) => s.code === scheme);
    el.innerHTML = `
      <div class="stat-card"><div class="stat-label">Active Exemption Override</div><div class="stat-val" style="font-size:16px;">${esc(schObj?.name || scheme)}</div><div class="stat-sub">730-Day Domicile Override (11 U.S.C. § 522(b)(3)(A))</div></div>
      <div class="stat-card"><div class="stat-label">Total Schedule C Claimed</div><div class="stat-val" style="font-size:16px;">${money(totalExempt)}</div><div class="stat-sub">${exs.length} exemption row(s) listed</div></div>
    `;
  }
}

function renderExemptionCatalogDirectory() {
  const cardsEl = $("exempt-catalog-cards");
  const countEl = $("exempt-catalog-count");
  if (!cardsEl) return;
  const items = getActiveSchemeExemptions();
  const q = ($("exempt-catalog-search")?.value || "").trim().toLowerCase();
  const filtered = q
    ? items.filter((it) => `${it.title} ${it.statute} ${it.category} ${it.blurb}`.toLowerCase().includes(q))
    : items;
  if (countEl) countEl.textContent = String(items.length);
  const isJoint = !!state.caseData?.is_joint;

  cardsEl.innerHTML = filtered.length
    ? filtered.map((it) => `
      <div style="border:1px solid var(--border); border-radius:8px; padding:10px 12px; background:var(--surface-alt); display:flex; flex-direction:column; justify-content:space-between; gap:6px;">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; margin-bottom:4px;">
            <span class="tag" style="font-size:10px;">${esc(it.category)}</span>
            <span class="tag tag-ok" style="font-size:10px;">${esc(formatExemptionCapBadge(it, isJoint))}</span>
          </div>
          <div style="font-weight:700; color:var(--navy); font-size:13px;">${esc(it.title)}</div>
          <div style="font-size:11px; color:#475569; font-family:monospace; margin:2px 0 5px;">${esc(it.statute)}</div>
          <div style="font-size:12px; color:#334155; line-height:1.4;">${esc(it.blurb)}</div>
        </div>
        <div style="text-align:right; margin-top:4px;">
          <button type="button" class="btn btn-secondary btn-sm" onclick="addExemptionFromCatalog('${esc(it.id)}')">+ Add to Schedule C</button>
        </div>
      </div>`).join("")
    : '<div class="muted">No exemptions match that search filter.</div>';
}

window.addExemptionFromCatalog = (exId) => {
  const items = getActiveSchemeExemptions();
  const it = items.find((x) => x.id === exId);
  if (!it) return;
  const isJoint = !!state.caseData?.is_joint;
  const cap = isJoint ? (it.limit_joint ?? it.limit_single) : it.limit_single;
  state.caseData.exemptions.push({
    schedule_ab_line: "",
    description: it.category || it.title,
    current_value: 0,
    exemption_amount: cap || 0,
    claim_100_percent: !!it.unlimited,
    statute: it.statute,
    exemption_id: it.id,
    override_amount: false,
  });
  renderExemptions();
  scheduleRecalc(false);
  toast(`Added "${it.title}" to Schedule C`, "ok");
};

window.applyExemptionChoice = (idx, exemptionId) => {
  const arr = state.caseData.exemptions || [];
  const ex = arr[idx];
  if (!ex) return;
  if (!exemptionId || exemptionId === "__custom__") {
    ex.exemption_id = "";
    ex.override_amount = true;
    renderExemptions();
    scheduleRecalc(false);
    return;
  }
  const items = getActiveSchemeExemptions();
  const it = items.find((x) => x.id === exemptionId);
  if (!it) return;
  ex.exemption_id = it.id;
  ex.statute = it.statute;
  const isJoint = !!state.caseData?.is_joint;
  const cap = isJoint ? (it.limit_joint ?? it.limit_single) : it.limit_single;

  // Stack-aware: subtract any exemptions already claimed on sibling rows for this same asset
  const key = _exemptionAssetKey(ex);
  let otherExempted = 0;
  if (key) {
    arr.forEach((row, rIdx) => {
      if (rIdx !== idx && _exemptionAssetKey(row) === key) {
        otherExempted += row.claim_100_percent ? Number(row.current_value || 0) : Number(row.exemption_amount || 0);
      }
    });
  }
  const val = Number(ex.current_value || 0);
  const remaining = Math.max(0, round2(val - otherExempted));

  if (it.unlimited) {
    ex.claim_100_percent = otherExempted === 0;
    if (remaining > 0) ex.exemption_amount = remaining;
    else if (val > 0 && otherExempted === 0) ex.exemption_amount = val;
  } else {
    ex.claim_100_percent = false;
    if (remaining > 0 && cap !== null && cap !== undefined) {
      ex.exemption_amount = Math.min(remaining, cap);
    } else if (remaining > 0) {
      ex.exemption_amount = remaining;
    }
  }
  renderExemptions();
  scheduleRecalc(false);
};

window.updateExemptionAmt = (idx, rawVal) => {
  const ex = state.caseData.exemptions[idx];
  if (!ex) return;
  ex.exemption_amount = num(rawVal);
  ex.override_amount = true;
  renderExemptionCapMeters();
  scheduleRecalc(false);
};

function syncAllAssetsToExemptions() {
  syncScalarsToCase();
  const c = state.caseData;
  const pa = c.personal_assets || {};
  const existingLines = new Set((c.exemptions || []).map((x) => String(x.schedule_ab_line || "").trim()));
  const candidates = [];

  (c.real_estate || []).forEach((r, i) => {
    const val = Number(r.portion_owned_value || r.market_value || 0);
    if (val > 0) {
      const addr = [r.address, r.city, `${r.state || ""} ${r.zip_code || ""}`.trim()].filter(Boolean).join(", ") || `Property #${i + 1}`;
      candidates.push([`1.${i + 1}`, addr, val]);
    }
  });
  (c.vehicles || []).forEach((v, i) => {
    const val = Number(v.portion_owned_value || v.market_value || 0);
    if (val > 0) {
      candidates.push([`3.${i + 1}`, `${v.year || ""} ${v.make || ""} ${v.model || ""}`.trim() || `Vehicle #${i + 1}`, val]);
    }
  });

  const flatPersonal = [
    ["6", pa.household_goods_desc || "Household Goods", pa.household_goods_val],
    ["7", pa.electronics_desc || "Electronics", pa.electronics_val],
    ["8", pa.collectibles_desc || "Collectibles", pa.collectibles_val],
    ["9", pa.sports_hobby_desc || "Sports & Hobby Equipment", pa.sports_hobby_val],
    ["10", pa.firearms_desc || "Firearms", pa.firearms_val],
    ["11", pa.clothes_desc || "Clothing", pa.clothes_val],
    ["12", pa.jewelry_desc || "Jewelry", pa.jewelry_val],
    ["13", pa.animals_desc || "Pets / Animals", pa.animals_val],
    ["14", pa.other_household_desc || "Other Household Items", pa.other_household_val],
    ["16", "Cash on Hand", pa.cash_on_hand],
    ["22", pa.security_deposit_landlord ? `Security Deposit: ${pa.security_deposit_landlord}` : "Security Deposit", pa.security_deposit_rent_val],
    ["28", pa.tax_refund_desc || "Tax Refund", pa.tax_refund_val],
    ["31", pa.life_insurance_company ? `Life Insurance: ${pa.life_insurance_company}` : "Life Insurance Cash Value", pa.life_insurance_cash_val],
    ["53", pa.other_property_desc || "Other Property / Financial Assets", pa.other_property_val],
  ];
  flatPersonal.forEach(([ln, desc, val]) => {
    if (Number(val || 0) > 0) candidates.push([ln, desc, Number(val)]);
  });
  (pa.bank_accounts || []).forEach((b, i) => {
    if (Number(b.balance || 0) > 0) {
      const sfx = b.account_last4 ? ` (x${b.account_last4})` : "";
      candidates.push([`17.${i + 1}`, `${b.account_type || "Account"}: ${b.institution || ""}${sfx}`.trim(), Number(b.balance)]);
    }
  });
  (pa.retirement_accounts || []).forEach((r, i) => {
    if (Number(r.balance || 0) > 0) {
      const sfx = r.account_last4 ? ` (x${r.account_last4})` : "";
      candidates.push([`21.${i + 1}`, `${r.account_type || "Retirement"}: ${r.institution || ""}${sfx}`.trim(), Number(r.balance)]);
    }
  });

  let added = 0;
  for (const [ln, desc, val] of candidates) {
    if (existingLines.has(ln)) continue;
    c.exemptions.push({
      schedule_ab_line: ln,
      description: desc,
      current_value: val,
      exemption_amount: 0,
      claim_100_percent: false,
      statute: "",
      exemption_id: "",
      override_amount: false,
    });
    existingLines.add(ln);
    added += 1;
  }
  renderExemptions();
  scheduleRecalc(false);
  toast(added ? `Synced ${added} asset(s) to Schedule C — pick an exemption from each row's dropdown.` : "All scheduled assets are already listed on Schedule C.", added ? "ok" : "");
}

function _exemptionAssetKey(ex) {
  const ln = String(ex.schedule_ab_line || "").trim().toLowerCase();
  if (ln) return `line:${ln}`;
  const desc = String(ex.description || "").trim().toLowerCase();
  return desc ? `desc:${desc}` : "";
}

window.stackExemptionRow = (idx) => {
  const arr = state.caseData.exemptions || [];
  const base = arr[idx];
  if (!base) return;
  const key = _exemptionAssetKey(base);

  // Find all existing stacked rows for this same asset so we insert right after them and compute remaining balance
  let lastSiblingIdx = idx;
  let totalExempted = 0;
  const usedIds = new Set();
  arr.forEach((row, rIdx) => {
    if (key ? _exemptionAssetKey(row) === key : rIdx === idx) {
      lastSiblingIdx = rIdx;
      totalExempted += row.claim_100_percent ? Number(row.current_value || 0) : Number(row.exemption_amount || 0);
      if (row.exemption_id) usedIds.add(row.exemption_id);
    }
  });

  const assetVal = Number(base.current_value || 0);
  const remaining = Math.max(0, round2(assetVal - totalExempted));

  // Suggest a sensible second exemption statute in the active scheme
  const scheme = getActiveSchemeCode();
  const catalog = getActiveSchemeExemptions();
  let suggested = null;
  const prefOrder = scheme === "FEDERAL"
    ? ["fed_wildcard", "fed_household", "fed_jewelry", "fed_vehicle"]
    : scheme === "FL"
      ? ["fl_wildcard", "fl_personal", "fl_vehicle", "fl_tbe", "fl_wages_hoh"]
      : catalog.map((c) => c.id);
  for (const cid of prefOrder) {
    if (!usedIds.has(cid)) {
      suggested = catalog.find((c) => c.id === cid) || null;
      if (suggested) break;
    }
  }

  const newRow = {
    schedule_ab_line: base.schedule_ab_line || "",
    description: base.description || "",
    current_value: assetVal,
    exemption_amount: remaining,
    claim_100_percent: false,
    statute: suggested ? suggested.statute : "",
    exemption_id: suggested ? suggested.id : "",
    override_amount: false,
  };
  arr.splice(lastSiblingIdx + 1, 0, newRow);
  renderExemptions();
  scheduleRecalc(false);
  toast(
    remaining > 0
      ? `Stacked additional exemption on "${base.description || base.schedule_ab_line || "asset"}" (${money(remaining)} remaining)`
      : `Stacked additional exemption row on "${base.description || base.schedule_ab_line || "asset"}"`,
    "ok"
  );
};

window.updateExemptionAssetVal = (idx, rawVal) => {
  const arr = state.caseData.exemptions || [];
  const ex = arr[idx];
  if (!ex) return;
  const newVal = num(rawVal);
  const key = _exemptionAssetKey(ex);
  ex.current_value = newVal;
  // Keep sibling stacked rows for the same asset showing the same Current Value
  if (key) {
    arr.forEach((row) => {
      if (_exemptionAssetKey(row) === key) row.current_value = newVal;
    });
  }
  renderExemptions();
  scheduleRecalc(false);
};

function renderExemptions() {
  renderExemptionCapMeters();
  renderExemptionCatalogDirectory();
  const arr = state.caseData.exemptions || [];
  const catalog = getActiveSchemeExemptions();
  const isJoint = !!state.caseData?.is_joint;

  // Group rows by asset to compute per-asset stacked totals & show clear visual grouping
  const groups = new Map();
  arr.forEach((ex, i) => {
    const key = _exemptionAssetKey(ex) || `__row_${i}`;
    if (!groups.has(key)) {
      groups.set(key, { indices: [], totalExempt: 0, any100: false, value: Number(ex.current_value || 0) });
    }
    const g = groups.get(key);
    g.indices.push(i);
    if (ex.claim_100_percent) g.any100 = true;
    g.totalExempt += ex.claim_100_percent ? Number(ex.current_value || 0) : Number(ex.exemption_amount || 0);
    if (Number(ex.current_value || 0) > g.value) g.value = Number(ex.current_value || 0);
  });

  $("exemptions-tbody").innerHTML = arr.length
    ? arr.map((ex, i) => {
      const key = _exemptionAssetKey(ex) || `__row_${i}`;
      const g = groups.get(key);
      const posInGroup = g.indices.indexOf(i);
      const isStackedChild = posInGroup > 0;
      const stackCount = g.indices.length;

      const matched = findExemptionCatalogEntry(ex);
      const selectedId = matched ? matched.id : "__custom__";
      const opts = [
        `<option value="__custom__" ${selectedId === "__custom__" ? "selected" : ""}>-- Custom / Manual Statute Override --</option>`,
        ...catalog.map((it) => {
          const capTxt = formatExemptionCapBadge(it, isJoint);
          return `<option value="${esc(it.id)}" ${selectedId === it.id ? "selected" : ""}>[${esc(it.category)}] ${esc(it.title)} (${esc(capTxt)})</option>`;
        }),
      ].join("");
      const blurbHtml = matched
        ? `<div style="font-size:11px; color:#475569; margin-top:4px; line-height:1.35; background:#f8fafc; border-left:3px solid var(--gold); padding:4px 7px; border-radius:4px;">${esc(matched.blurb)}</div>`
        : `<div style="font-size:11px; color:#64748b; margin-top:4px;">Manual / custom statute override — enter any statute &amp; amount freely.</div>`;

      // Per-asset coverage summary badge on the first row of each asset group
      let coverageHtml = "";
      if (!isStackedChild && g.value > 0) {
        const covered = g.any100 ? g.value : round2(g.totalExempt);
        const diff = round2(g.value - covered);
        const prefix = stackCount > 1 ? `${stackCount} stacked exemptions: ` : "";
        if (diff > 0.005) {
          coverageHtml = `<div style="font-size:11px; margin-top:4px; color:#b45309; font-weight:600;">${prefix}${money(covered)} / ${money(g.value)} (${money(diff)} unexempted)</div>`;
        } else if (diff < -0.005 && !g.any100) {
          coverageHtml = `<div style="font-size:11px; margin-top:4px; color:#dc2626; font-weight:600;">${prefix}${money(covered)} / ${money(g.value)} (Over by ${money(Math.abs(diff))})</div>`;
        } else {
          coverageHtml = `<div style="font-size:11px; margin-top:4px; color:#15803d; font-weight:600;">${prefix}100% Covered (${money(covered)})</div>`;
        }
      } else if (isStackedChild) {
        coverageHtml = `<div style="font-size:11px; margin-top:4px; color:var(--navy); font-weight:600;">&#8627; Stacked Exemption #${posInGroup + 1} on same asset</div>`;
      }

      const rowStyle = isStackedChild ? ' style="background:#f8fafc;"' : "";
      const firstCellStyle = isStackedChild
        ? 'vertical-align:top; border-left:3px solid var(--navy); padding-left:8px;'
        : 'vertical-align:top;';

      return `
      <tr${rowStyle}>
        <td style="${firstCellStyle}"><input type="text" value="${esc(ex.schedule_ab_line)}" onchange="updateArr('exemptions',${i},'schedule_ab_line',this.value);renderExemptions();"/></td>
        <td style="vertical-align:top;">
          <input type="text" value="${esc(ex.description)}" onchange="updateArr('exemptions',${i},'description',this.value)"/>
          ${coverageHtml}
        </td>
        <td style="vertical-align:top;"><input type="text" inputmode="decimal" data-format="currency" value="${esc(formatCurrencyDisplay(ex.current_value))}" onchange="updateExemptionAssetVal(${i}, this.value)"/></td>
        <td style="vertical-align:top;">
          <select style="width:100%;" onchange="applyExemptionChoice(${i}, this.value)">${opts}</select>
          ${blurbHtml}
        </td>
        <td style="vertical-align:top;">
          <input type="text" inputmode="decimal" data-format="currency" value="${esc(formatCurrencyDisplay(ex.exemption_amount))}" onchange="updateExemptionAmt(${i}, this.value);renderExemptions();"/>
        </td>
        <td style="text-align:center; vertical-align:top; padding-top:10px;">
          <input type="checkbox" ${ex.claim_100_percent ? "checked" : ""} onchange="updateArr('exemptions',${i},'claim_100_percent',this.checked);renderExemptions();"/>
        </td>
        <td style="vertical-align:top;">
          <input type="text" value="${esc(ex.statute)}" onchange="updateArr('exemptions',${i},'statute',this.value);renderExemptionCapMeters();"/>
        </td>
        <td style="vertical-align:top; white-space:nowrap;">
          <button type="button" class="btn btn-secondary btn-sm" onclick="stackExemptionRow(${i})" title="Add another stacked exemption statute to this same asset">+ Stack</button>
          <button type="button" class="btn btn-danger btn-sm" onclick="removeArr('exemptions',${i})" title="Remove this exemption row">&times;</button>
        </td>
      </tr>`;
    }).join("")
    : '<tr><td colspan="8" class="muted">Click <strong>"Auto-Apply Exemptions"</strong> or <strong>"Sync All Assets &rarr; Schedule C"</strong> to assign exemptions per asset.</td></tr>';
}

window.moveCreditorClass = (fromList, idx, targetClass) => {
  const c = state.caseData;
  if (!c) return;
  const labelMap = {
    secured: "Secured (Schedule D)",
    priority: "Priority Unsecured (Schedule E)",
    nonpriority: "Nonpriority Unsecured (Schedule F)",
  };

  if (fromList === "secured") {
    if (targetClass === "secured") return;
    const item = c.secured_creditors.splice(idx, 1)[0];
    if (!item) return;
    const isPri = targetClass === "priority";
    const desc = String(item.collateral_desc || "");
    const claimType = isPri
      ? (/tax|irs/i.test(desc + " " + item.name) ? "Taxes" : /dso|child|alimony|support/i.test(desc + " " + item.name) ? "DSO" : "Other")
      : (/student|navient|mohela|nelnet|edfinancial|aidvantage/i.test(desc + " " + item.name) ? "StudentLoan" : "Other");
    c.unsecured_creditors.push({
      priority: isPri,
      name: item.name || "",
      attn: item.attn || "Attn: Bankruptcy",
      street: item.street || "",
      city: item.city || "",
      state: item.state || "",
      zip_code: item.zip_code || "",
      account_last4: item.account_last4 || "",
      date_incurred: item.date_incurred || "",
      total_claim: Number(item.claim_amount || 0),
      priority_amount: isPri ? Number(item.claim_amount || 0) : 0,
      owner: item.owner || "debtor1",
      claim_type: claimType,
      claim_type_specify: desc || (isPri ? "Priority Claim" : "CreditCard"),
      contingent: !!item.contingent,
      unliquidated: !!item.unliquidated,
      disputed: !!item.disputed,
      notice_parties: item.notice_parties || [],
    });
    renderSecuredCreditors();
    renderUnsecuredCreditors();
    scheduleRecalc(false);
    toast(`Moved "${item.name || "Creditor"}" → ${labelMap[targetClass]}`, "ok");
    return;
  }

  if (fromList === "unsecured") {
    const item = c.unsecured_creditors[idx];
    if (!item) return;
    if (targetClass === "secured") {
      c.unsecured_creditors.splice(idx, 1);
      c.secured_creditors.push({
        name: item.name || "",
        attn: item.attn || "Attn: Bankruptcy",
        street: item.street || "",
        city: item.city || "",
        state: item.state || "",
        zip_code: item.zip_code || "",
        account_last4: item.account_last4 || "",
        date_incurred: item.date_incurred || "",
        collateral_desc: item.claim_type_specify || item.claim_type || "",
        claim_amount: Number(item.total_claim || 0),
        collateral_value: 0,
        owner: item.owner || "debtor1",
        lien_type: "agreement",
        intent: "Keep",
        contingent: !!item.contingent,
        unliquidated: !!item.unliquidated,
        disputed: !!item.disputed,
        notice_parties: item.notice_parties || [],
      });
      renderSecuredCreditors();
      renderUnsecuredCreditors();
      scheduleRecalc(false);
      toast(`Moved "${item.name || "Creditor"}" → ${labelMap.secured}`, "ok");
      return;
    }

    const isPri = targetClass === "priority";
    item.priority = isPri;
    item.priority_amount = isPri ? Number(item.total_claim || 0) : 0;
    const validTypes = isPri ? ["Taxes", "DSO", "DUI", "Other"] : ["Other", "StudentLoan", "Divorce", "Pension"];
    if (!validTypes.includes(item.claim_type)) {
      item.claim_type = isPri ? "Taxes" : "Other";
    }
    renderUnsecuredCreditors();
    scheduleRecalc(false);
    toast(`Moved "${item.name || "Creditor"}" → ${labelMap[targetClass]}`, "ok");
  }
};

function renderSecuredCreditors() {
  const arr = state.caseData.secured_creditors || [];
  $("secured-list").innerHTML = arr.length
    ? arr.map((sc, i) => `
      <div class="subcard">
        <div class="subcard-head" style="flex-wrap:wrap; gap:8px;">
          <strong>[SECURED Sch. D] #${i + 1}: ${esc(sc.name || "New Secured Creditor")}</strong>
          <div class="btn-group" style="align-items:center;">
            <select style="font-size:12px; padding:4px 8px;" title="Move creditor to another schedule" onchange="moveCreditorClass('secured',${i},this.value)">
              <option value="secured" selected>Secured (Schedule D)</option>
              <option value="priority">Move &rarr; Priority (Schedule E)</option>
              <option value="nonpriority">Move &rarr; Nonpriority (Schedule F)</option>
            </select>
            <button type="button" class="btn btn-danger btn-sm" onclick="removeArr('secured_creditors',${i})">Remove</button>
          </div>
        </div>
        <div class="grid-4">
          <div class="field"><label>Creditor Name</label><input type="text" value="${esc(sc.name)}" onchange="updateArr('secured_creditors',${i},'name',this.value)"/></div>
          <div class="field"><label>Attention Line</label><input type="text" value="${esc(sc.attn)}" onchange="updateArr('secured_creditors',${i},'attn',this.value)"/></div>
          <div class="field"><label>Street / PO Box</label><input type="text" value="${esc(sc.street)}" onchange="updateArr('secured_creditors',${i},'street',this.value)"/></div>
          <div class="field"><label>City</label><input type="text" value="${esc(sc.city)}" onchange="updateArr('secured_creditors',${i},'city',this.value)"/></div>
          <div class="field"><label>State</label><input type="text" value="${esc(sc.state)}" onchange="updateArr('secured_creditors',${i},'state',this.value.toUpperCase())"/></div>
          <div class="field"><label>ZIP</label><input type="text" value="${esc(sc.zip_code)}" onchange="updateArr('secured_creditors',${i},'zip_code',this.value)"/></div>
          <div class="field"><label>Acct Last 4</label><input type="text" maxlength="4" value="${esc(sc.account_last4)}" onchange="updateArr('secured_creditors',${i},'account_last4',this.value)"/></div>
          <div class="field"><label>Date Incurred</label><input type="text" data-format="date" maxlength="10" placeholder="MM/DD/YYYY" value="${esc(formatDateInput(sc.date_incurred, false))}" onchange="updateArr('secured_creditors',${i},'date_incurred',this.value)"/></div>
          <div class="field"><label>Collateral Description</label><input type="text" value="${esc(sc.collateral_desc)}" onchange="updateArr('secured_creditors',${i},'collateral_desc',this.value)"/></div>
          <div class="field"><label>Claim Amount ($)</label><input type="text" inputmode="decimal" data-format="currency" value="${esc(formatCurrencyDisplay(sc.claim_amount))}" onchange="updateArrNum('secured_creditors',${i},'claim_amount',this.value)"/></div>
          <div class="field"><label>Collateral Value ($)</label><input type="text" inputmode="decimal" data-format="currency" value="${esc(formatCurrencyDisplay(sc.collateral_value))}" onchange="updateArrNum('secured_creditors',${i},'collateral_value',this.value)"/></div>
          <div class="field"><label>Intent (Form 108)</label>
            <select onchange="updateArr('secured_creditors',${i},'intent',this.value)">
              ${["Keep", "Reaffirm", "Redeem", "Surrender"].map((o) => `<option value="${o}" ${sc.intent === o ? "selected" : ""}>${o}</option>`).join("")}
            </select>
          </div>
        </div>
      </div>`).join("")
    : '<div class="muted">No secured creditors listed.</div>';
}

function renderUnsecuredCreditors() {
  const arr = state.caseData.unsecured_creditors || [];
  $("unsecured-list").innerHTML = arr.length
    ? arr.map((uc, i) => `
      <div class="subcard">
        <div class="subcard-head" style="flex-wrap:wrap; gap:8px;">
          <div>
            <strong>${uc.priority ? "[PRIORITY Sch. E]" : "[NONPRIORITY Sch. F]"} #${i + 1}: ${esc(uc.name || "New Creditor")}</strong>
          </div>
          <div class="btn-group" style="align-items:center;">
            <select style="font-size:12px; padding:4px 8px;" title="Move creditor to another schedule" onchange="moveCreditorClass('unsecured',${i},this.value)">
              <option value="secured">Move &rarr; Secured (Schedule D)</option>
              <option value="priority" ${uc.priority ? "selected" : ""}>Priority (Schedule E)</option>
              <option value="nonpriority" ${!uc.priority ? "selected" : ""}>Nonpriority (Schedule F)</option>
            </select>
            <button type="button" class="btn btn-danger btn-sm" onclick="removeArr('unsecured_creditors',${i})">Remove</button>
          </div>
        </div>
        <div class="grid-4">
          <div class="field"><label>Creditor Name</label><input type="text" value="${esc(uc.name)}" onchange="updateArr('unsecured_creditors',${i},'name',this.value)"/></div>
          <div class="field"><label>Attention Line</label><input type="text" value="${esc(uc.attn)}" onchange="updateArr('unsecured_creditors',${i},'attn',this.value)"/></div>
          <div class="field"><label>Street / PO Box</label><input type="text" value="${esc(uc.street)}" onchange="updateArr('unsecured_creditors',${i},'street',this.value)"/></div>
          <div class="field"><label>City</label><input type="text" value="${esc(uc.city)}" onchange="updateArr('unsecured_creditors',${i},'city',this.value)"/></div>
          <div class="field"><label>State</label><input type="text" value="${esc(uc.state)}" onchange="updateArr('unsecured_creditors',${i},'state',this.value.toUpperCase())"/></div>
          <div class="field"><label>ZIP</label><input type="text" value="${esc(uc.zip_code)}" onchange="updateArr('unsecured_creditors',${i},'zip_code',this.value)"/></div>
          <div class="field"><label>Acct Last 4</label><input type="text" maxlength="4" value="${esc(uc.account_last4)}" onchange="updateArr('unsecured_creditors',${i},'account_last4',this.value)"/></div>
          <div class="field"><label>Total Claim ($)</label><input type="text" inputmode="decimal" data-format="currency" value="${esc(formatCurrencyDisplay(uc.total_claim))}" onchange="updateArrNum('unsecured_creditors',${i},'total_claim',this.value)"/></div>
          <div class="field"><label>Schedule Class</label>
            <select onchange="moveCreditorClass('unsecured',${i},this.value)">
              <option value="secured">Secured (Schedule D)</option>
              <option value="priority" ${uc.priority ? "selected" : ""}>Priority (Schedule E)</option>
              <option value="nonpriority" ${!uc.priority ? "selected" : ""}>Nonpriority (Schedule F)</option>
            </select>
          </div>
          <div class="field"><label>Debt Type</label>
            <select onchange="updateArr('unsecured_creditors',${i},'claim_type',this.value)">
              ${(uc.priority ? ["Taxes", "DSO", "DUI", "Other"] : ["Other", "StudentLoan", "Divorce", "Pension"]).map((o) => `<option value="${o}" ${uc.claim_type === o ? "selected" : ""}>${o}</option>`).join("")}
            </select>
          </div>
          <div class="field"><label>Specify (e.g. CreditCard / Medical)</label><input type="text" value="${esc(uc.claim_type_specify)}" onchange="updateArr('unsecured_creditors',${i},'claim_type_specify',this.value)"/></div>
          <div class="field"><label>Date Incurred</label><input type="text" data-format="date" maxlength="10" placeholder="MM/DD/YYYY" value="${esc(formatDateInput(uc.date_incurred, false))}" onchange="updateArr('unsecured_creditors',${i},'date_incurred',this.value)"/></div>
        </div>
      </div>`).join("")
    : '<div class="muted">No unsecured creditors yet. Add manually or import a CSV / Credit Report PDF above.</div>';
}

function renderContracts() {
  const arr = state.caseData.executory_contracts || [];
  $("contracts-list").innerHTML = arr.length
    ? arr.map((ec, i) => `
      <div class="subcard">
        <div class="subcard-head"><strong>Lease / Contract #${i + 1}</strong><button class="btn btn-danger btn-sm" onclick="removeArr('executory_contracts',${i})">Remove</button></div>
        <div class="grid-2">
          <div class="field"><label>Landlord / Counterparty Name</label><input type="text" value="${esc(ec.name)}" onchange="updateArr('executory_contracts',${i},'name',this.value)"/></div>
          <div class="field"><label>Description</label><input type="text" value="${esc(ec.description)}" onchange="updateArr('executory_contracts',${i},'description',this.value)"/></div>
          <div class="field"><label>Street</label><input type="text" value="${esc(ec.street)}" onchange="updateArr('executory_contracts',${i},'street',this.value)"/></div>
          <div class="field"><label>City / ST / ZIP</label><input type="text" value="${esc(`${ec.city} ${ec.state} ${ec.zip_code}`.trim())}" onchange="updateCityStZip('executory_contracts',${i},this.value)"/></div>
        </div>
      </div>`).join("")
    : '<div class="muted">No executory contracts or unexpired leases.</div>';
}

function renderCodebtors() {
  const arr = state.caseData.codebtors || [];
  $("codebtors-list").innerHTML = arr.length
    ? arr.map((cb, i) => `
      <div class="subcard">
        <div class="subcard-head"><strong>Codebtor #${i + 1}</strong><button class="btn btn-danger btn-sm" onclick="removeArr('codebtors',${i})">Remove</button></div>
        <div class="grid-2">
          <div class="field"><label>Codebtor Name</label><input type="text" value="${esc(cb.name)}" onchange="updateArr('codebtors',${i},'name',this.value)"/></div>
          <div class="field"><label>Street</label><input type="text" value="${esc(cb.street)}" onchange="updateArr('codebtors',${i},'street',this.value)"/></div>
          <div class="field"><label>City / ST / ZIP</label><input type="text" value="${esc(`${cb.city} ${cb.state} ${cb.zip_code}`.trim())}" onchange="updateCityStZip('codebtors',${i},this.value)"/></div>
          <div class="field"><label>Schedule D or E/F Line #</label><input type="text" value="${esc(cb.schedule_d_line || cb.schedule_ef_line)}" onchange="updateArr('codebtors',${i},'schedule_ef_line',this.value)"/></div>
        </div>
      </div>`).join("")
    : '<div class="muted">No non-filing codebtors listed.</div>';
}

/* Global helpers invoked from inline onchange handlers */
window.updateArr = (key, idx, field, val) => {
  state.caseData[key][idx][field] = val;
  scheduleRecalc(false);
};
window.updateArrNum = (key, idx, field, val) => {
  state.caseData[key][idx][field] = num(val);
  scheduleRecalc(false);
};
window.removeArr = (key, idx) => {
  state.caseData[key].splice(idx, 1);
  renderAllCaseUI();
  scheduleRecalc(false);
};
window.updateSubArr = (key, idx, field, val) => {
  state.caseData.personal_assets[key][idx][field] = val;
  scheduleRecalc(false);
};
window.updateSubArrNum = (key, idx, field, val) => {
  state.caseData.personal_assets[key][idx][field] = num(val);
  scheduleRecalc(false);
};
window.removeSubArr = (key, idx) => {
  state.caseData.personal_assets[key].splice(idx, 1);
  renderAllCaseUI();
  scheduleRecalc(false);
};
window.updateCityStZip = (key, idx, raw) => {
  const m = raw.trim().match(/^(.+?)[,\s]+([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/);
  if (m) {
    state.caseData[key][idx].city = m[1].replace(/,$/, "").trim();
    state.caseData[key][idx].state = m[2].toUpperCase();
    state.caseData[key][idx].zip_code = m[3];
  } else {
    state.caseData[key][idx].city = raw.trim();
  }
  scheduleRecalc(false);
};

/* ==================== COMPLIANCE, FORMS & MATRIX ==================== */
function renderCompliance() {
  $("compliance-list").innerHTML = state.compliance
    .map((chk) => `
      <div class="compliance-item ${chk.level}">
        <div class="compliance-dot"></div>
        <div>
          <strong>${esc(chk.title)}</strong>
          <div class="muted">${esc(chk.detail)}</div>
        </div>
      </div>`).join("");
}

function renderFormsChecklist(recommended = []) {
  const ch = String(state.caseData.chapter || "7");
  const selectedSet = new Set(state.caseData.selected_forms || []);
  const recSet = new Set(recommended);
  const forms = state.formCatalog.filter((f) => f.chapters.includes(ch));

  $("forms-checklist").innerHTML = forms
    .map((f) => {
      const checked = selectedSet.has(f.id);
      const badge = f.restricted
        ? '<span class="tag tag-restricted">RESTRICTED (Separate)</span>'
        : f.required
          ? '<span class="tag tag-req">Required</span>'
          : recSet.has(f.id)
            ? '<span class="tag tag-tampa">Auto-Triggered</span>'
            : '<span class="tag">Optional</span>';
      return `
        <label class="form-check-card ${checked ? "selected" : ""}">
          <input type="checkbox" ${checked ? "checked" : ""} onchange="toggleForm('${f.id}', this.checked)" />
          <div>
            <div><strong>${esc(f.id)}</strong> ${badge}</div>
            <div class="muted">${esc(f.title)}</div>
          </div>
        </label>`;
    }).join("");
}

window.toggleForm = (fid, checked) => {
  const set = new Set(state.caseData.selected_forms || []);
  if (checked) set.add(fid); else set.delete(fid);
  state.caseData.selected_forms = Array.from(set);
  $("badge-forms").textContent = String(state.caseData.selected_forms.length);
  renderFormsChecklist([]);
};

function renderMatrixPreview() {
  const mp = state.matrixPreview || { count: 0, text: "", warnings: [] };
  $("matrix-count-tag").textContent = `${mp.count} Creditors`;
  $("matrix-warnings").innerHTML = (mp.warnings || []).length
    ? `<div class="alert alert-warn"><strong>MDFL 28-Char Truncation Notice:</strong><br/>${mp.warnings.slice(0, 6).map(esc).join("<br/>")}</div>`
    : "";
  $("matrix-preview").textContent = mp.text || "(No creditors listed yet)";
}

/* ==================== SAVED CASES & BROWSE MODAL ==================== */
function _filterCasesList(list, query = "", filter = "ALL", sortMode = "recent") {
  const q = String(query || "").trim().toLowerCase();
  let out = (list || []).filter((sc) => {
    if (filter === "CH7" && String(sc.chapter) !== "7") return false;
    if (filter === "CH13" && String(sc.chapter) !== "13") return false;
    if (filter === "MT" && !sc.has_means_test) return false;
    if (filter === "PDF" && !sc.has_packet) return false;
    if (q) {
      const hay = `${sc.folder_name || ""} ${sc.debtor_name || ""} ${sc.case_number || ""} ${sc.county || ""} ch${sc.chapter || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  out = [...out];
  if (sortMode === "az") {
    out.sort((a, b) => String(a.folder_name || "").localeCompare(String(b.folder_name || "")));
  } else if (sortMode === "za") {
    out.sort((a, b) => String(b.folder_name || "").localeCompare(String(a.folder_name || "")));
  } else if (sortMode === "chapter") {
    out.sort((a, b) => Number(a.chapter || 7) - Number(b.chapter || 7) || String(a.folder_name || "").localeCompare(String(b.folder_name || "")));
  } else {
    out.sort((a, b) => Number(b.updated_ts || 0) - Number(a.updated_ts || 0));
  }
  return out;
}

function renderSavedCases() {
  const el = $("saved-cases-list");
  const countTag = $("saved-cases-count-tag");
  const foot = $("saved-cases-footer");
  const total = (state.savedCases || []).length;
  if (countTag) countTag.textContent = String(total);

  if (!total) {
    el.innerHTML = '<div class="muted">No saved client folders yet. Import a CIF, type Debtor 1\'s name (auto-saves), or click <strong>"Open .json File"</strong>.</div>';
    if (foot) foot.innerHTML = "";
    renderBrowseCasesModal();
    return;
  }

  const quickQ = $("saved-cases-quick-search")?.value || "";
  const filtered = _filterCasesList(state.savedCases, quickQ, "ALL", "recent");
  const previewLimit = 6;
  const shown = filtered.slice(0, previewLimit);

  el.innerHTML = shown.length
    ? shown
      .map((sc) => `
        <div class="saved-case-row">
          <div>
            <strong>${esc(sc.folder_name)}</strong>
            <span class="tag tag-req">Ch. ${esc(sc.chapter)}${sc.is_joint ? " Jt" : ""}</span>
            ${sc.has_means_test ? '<span class="tag" style="background:#e0f2fe;color:#0369a1;">Means Test</span>' : ""}
            ${sc.has_packet ? '<span class="tag tag-ok">PDF Ready</span>' : ""}
            <div class="muted">${esc(sc.debtor_name)}${sc.case_number ? ` &bull; ${esc(sc.case_number)}` : ""} &bull; Updated ${esc(sc.updated_at)}</div>
          </div>
          <div class="btn-group">
            <button type="button" class="btn btn-secondary btn-sm" onclick="openSavedCase('${esc(sc.folder_name)}')">Open</button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="openSavedCase('${esc(sc.folder_name)}', 'means')" title="Open this case directly in the Means Test tab">MT</button>
          </div>
        </div>`).join("")
    : '<div class="muted">No client folders match that filter.</div>';

  if (foot) {
    if (filtered.length > previewLimit) {
      foot.innerHTML = `<button type="button" class="btn btn-secondary btn-sm" style="width:100%;" onclick="openBrowseCasesModal('ALL')">Browse All ${filtered.length} Saved Cases &amp; Means Tests&hellip;</button>`;
    } else if (total > 0) {
      foot.innerHTML = `<div class="muted" style="text-align:right;">Showing ${shown.length} of ${total} saved case(s)</div>`;
    } else {
      foot.innerHTML = "";
    }
  }
  renderBrowseCasesModal();
}

function renderBrowseCasesModal() {
  const tbody = $("modal-cases-tbody");
  if (!tbody) return;
  const totalEl = $("modal-cases-total");
  const showingEl = $("modal-cases-showing");
  const total = (state.savedCases || []).length;
  if (totalEl) totalEl.textContent = String(total);

  const q = $("modal-cases-search")?.value || "";
  const sortMode = $("modal-cases-sort")?.value || "recent";
  const rows = _filterCasesList(state.savedCases, q, state.browseModalFilter || "ALL", sortMode);

  if (showingEl) {
    showingEl.textContent = `Showing ${rows.length} of ${total} saved client case(s)`;
  }

  tbody.innerHTML = rows.length
    ? rows.map((sc) => `
      <tr>
        <td>
          <strong>${esc(sc.folder_name)}</strong>
          <div class="muted">${esc(sc.debtor_name)}</div>
        </td>
        <td>
          <span class="tag tag-req">Ch. ${esc(sc.chapter)}${sc.is_joint ? " Joint" : ""}</span>
        </td>
        <td>
          <div>${sc.case_number ? `<code>${esc(sc.case_number)}</code>` : '<span class="muted">—</span>'}</div>
          <div class="muted">${sc.county ? esc(sc.county) + " County" : ""}</div>
        </td>
        <td>
          ${sc.has_means_test ? `<span class="tag" style="background:#e0f2fe;color:#0369a1;">MT${sc.cmi_monthly ? " (" + money(sc.cmi_monthly) + "/mo)" : ""}</span> ` : ""}
          ${sc.has_packet ? '<span class="tag tag-ok">PDF Ready</span> ' : ""}
          ${sc.revision ? `<span class="muted">Rev #${sc.revision}</span>` : ""}
        </td>
        <td class="muted">${esc(sc.updated_at || "—")}</td>
        <td style="white-space:nowrap;">
          <button type="button" class="btn btn-primary btn-sm" onclick="openSavedCase('${esc(sc.folder_name)}')">Open Case</button>
          <button type="button" class="btn btn-gold btn-sm" onclick="openSavedCase('${esc(sc.folder_name)}', 'means')">Means Test</button>
        </td>
      </tr>`).join("")
    : '<tr><td colspan="6" class="muted" style="text-align:center; padding:24px;">No matching cases found. Try clearing filters or click <strong>"Browse PC / SynologyDrive (.json)"</strong> above.</td></tr>';
}

window.openBrowseCasesModal = async (defaultFilter = "ALL") => {
  state.browseModalFilter = defaultFilter || "ALL";
  const bar = $("modal-cases-filter-bar");
  if (bar) {
    bar.querySelectorAll(".filter-pill").forEach((b) => {
      b.classList.toggle("active", b.dataset.filter === state.browseModalFilter);
    });
  }
  const modal = $("browse-cases-modal");
  if (modal) modal.classList.remove("hidden");
  renderBrowseCasesModal();
  if ($("modal-cases-search")) {
    $("modal-cases-search").focus();
    $("modal-cases-search").select();
  }
  // Background refresh list so newly created coworker cases appear immediately
  try {
    const res = await api("/api/cases");
    state.savedCases = res.saved_cases || state.savedCases;
    renderSavedCases();
  } catch (_) {}
};

function closeBrowseCasesModal() {
  const modal = $("browse-cases-modal");
  if (modal) modal.classList.add("hidden");
}

window.openSavedCase = async (folderName, targetTab = null) => {
  try {
    const res = await api(`/api/cases/${encodeURIComponent(folderName)}`);
    applyServerCaseResponse(res);
    closeBrowseCasesModal();
    if (targetTab) {
      switchTab(targetTab);
    }
    toast(`Opened client folder: ${folderName}${targetTab === "means" ? " (Means Test)" : ""}`, "ok");
  } catch (err) {
    toast(err.message, "err");
  }
};

async function handleBrowseJsonFile(file) {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object") {
      throw new Error("Selected JSON file is empty or invalid.");
    }

    // Detect Means Test exported .json vs. Petition case_data.json
    const isMeansTestJson = Boolean(parsed.earners || parsed.securedAndPriority || parsed.tampaCounty || parsed.standardsPreset);
    if (isMeansTestJson) {
      // Load into embedded Means Test calculator AND automatically flow client info + CMI into Petition!
      localStorage.setItem(FLMB_MT_STORAGE_KEY, JSON.stringify(parsed));
      const iframe = $("mt-iframe");
      if (iframe && iframe.contentWindow && _mtIframeReady) {
        iframe.contentWindow.postMessage({ type: "PETITION_PUSH_TO_MEANS_TEST", payload: parsed, replaceAll: true }, "*");
        // Trigger immediate pull after Means Test renders the loaded file
        setTimeout(() => {
          try {
            const win = iframe.contentWindow;
            if (win && typeof win.computeMeansTest === "function") {
              applyMeansTestSnapshotToPetition(parsed, win.computeMeansTest(), { silent: false });
            }
          } catch (_) {}
        }, 250);
      } else if (iframe) {
        const url = $("mt-site-url").value.trim() || state.settings?.means_test_url || "/means-test/index.html";
        iframe.src = url + (url.includes("?") ? "&" : "?") + "_mtfile=" + Date.now();
      }
      closeBrowseCasesModal();
      switchTab("means");
      toast(`Loaded Means Test file "${file.name}" and synced to Petition!`, "ok");
      return;
    }

    // Otherwise treat as Petition case_data.json
    const blank = createBlankCase(parsed.chapter || "7");
    const mergedCase = Object.assign(blank, parsed);
    mergedCase.debtor1 = Object.assign(blank.debtor1, parsed.debtor1 || {});
    mergedCase.debtor2 = Object.assign(blank.debtor2, parsed.debtor2 || {});
    mergedCase.personal_assets = Object.assign(blank.personal_assets, parsed.personal_assets || {});
    mergedCase.income_debtor1 = Object.assign(blank.income_debtor1, parsed.income_debtor1 || {});
    mergedCase.income_debtor2 = Object.assign(blank.income_debtor2, parsed.income_debtor2 || {});
    mergedCase.expenses = Object.assign(blank.expenses, parsed.expenses || {});
    mergedCase.sofa = Object.assign(blank.sofa, parsed.sofa || {});
    mergedCase.means_test = Object.assign(blank.means_test, parsed.means_test || {});
    mergedCase.attorney_fees = Object.assign(blank.attorney_fees, parsed.attorney_fees || {});

    state.caseData = mergedCase;
    state.baseCaseSnapshot = JSON.parse(JSON.stringify(mergedCase));
    state.baseRevision = Number(mergedCase.revision || 0);
    renderAllCaseUI();
    await recalculate(false);
    state.activeFolder = state.folderName !== "Unnamed,Client" ? state.folderName : "";
    pushCaseToMeansTest({ replaceAll: true, silent: true });
    markDirtyAndScheduleAutoSave();
    closeBrowseCasesModal();
    toast(`Opened Petition case from "${file.name}"`, "ok");
  } catch (err) {
    toast("Could not open JSON file: " + err.message, "err");
  }
}

function applyServerCaseResponse(res) {
  state.caseData = res.case;
  state.baseCaseSnapshot = JSON.parse(JSON.stringify(res.case));
  state.baseRevision = Number(res.case?.revision || 0);
  state.activeFolder = res.folder_name && res.folder_name !== "Unnamed,Client" ? res.folder_name : "";
  state.dirty = false;
  state.totals = res.totals || {};
  state.compliance = res.compliance || [];
  state.folderName = res.folder_name || "Unnamed,Client";
  state.matrixPreview = res.matrix_preview || { count: 0, text: "", warnings: [] };
  renderAllCaseUI();
  updateHeaderAndMetrics();
  renderCompliance();
  renderFormsChecklist(res.recommended_forms || []);
  renderMatrixPreview();
  persistWorkingSession();
  setAutoSaveBadge(
    state.baseRevision > 0 ? `Synced (Rev #${state.baseRevision})` : "Auto-Save: Ready",
    state.baseRevision > 0 ? "pill-ok" : ""
  );
  // Automatically push newly loaded / imported client straight into the embedded Means Test
  pushCaseToMeansTest({ replaceAll: true, silent: true });
}

/* ==================== UPDATES & TEMPLATES ==================== */
function renderUpdates() {
  const u = state.updates;
  if (!u) return;
  const info = u.tampa_court_info || {};
  $("tampa-court-stats").innerHTML = `
    <div class="stat-box"><div class="stat-label">Ch. 7 Filing Fee</div><div class="stat-val">${esc(info.ch7_fee || "$338.00")}</div></div>
    <div class="stat-box"><div class="stat-label">Ch. 13 Filing Fee</div><div class="stat-val">${esc(info.ch13_fee || "$313.00")}</div></div>
    <div class="stat-box"><div class="stat-label">Ch. 13 Debt Limit</div><div class="stat-val" style="font-size:15px;">${esc(info.ch13_debt_limit || "$2,750,000")}</div></div>
    <div class="stat-box"><div class="stat-label">Local Rules Effective</div><div class="stat-val" style="font-size:16px;">${esc(info.local_rules_effective || "Aug 15, 2025")}</div></div>
  `;
  $("tampa-upcoming-banner").innerHTML = `
    <strong>Tampa Division Courthouse:</strong> ${esc(info.courthouse || "")} (${esc(info.phone || "")})<br/>
    <strong>Upcoming Changes:</strong> ${esc(info.upcoming_changes || "")}
  `;
  $("updates-fetched-at").textContent = `Last updated: ${u.fetched_at || "—"}`;

  const list = (u.announcements || []).filter((a) =>
    state.updatesFilter === "ALL" ? true : (a.tags || []).includes(state.updatesFilter)
  );
  $("announcements-list").innerHTML = list.length
    ? list.map((a) => `
      <div class="ann-item ${a.is_tampa ? "tampa" : ""}">
        <div class="ann-meta">
          <strong>${esc(a.date)}</strong>
          ${(a.tags || []).map((t) => `<span class="tag ${t === "Tampa Division" ? "tag-tampa" : ""}">${esc(t)}</span>`).join("")}
        </div>
        <a class="ann-title" href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.title)}</a>
      </div>`).join("")
    : '<div class="muted">No announcements match this filter.</div>';
}

function renderTemplatesManifest(checkResult = null) {
  const tbody = $("templates-tbody");
  if (checkResult && checkResult.forms) {
    $("templates-status-banner").innerHTML = `
      <div class="alert ${checkResult.updates_available > 0 ? "alert-warn" : "alert-ok"}">
        Checked <strong>${checkResult.total_checked}</strong> official forms at ${esc(checkResult.checked_at)} &bull;
        Updates available: <strong>${checkResult.updates_available}</strong> &bull;
        Downloaded/Updated: <strong>${checkResult.updated_count}</strong>
      </div>`;
    tbody.innerHTML = checkResult.forms.map((f) => {
      const cls = f.status === "up_to_date" || f.status === "updated" ? "tag-ok" : f.status === "update_available" ? "tag-warn" : "tag-restricted";
      return `
        <tr>
          <td><code>${esc(f.file)}</code></td>
          <td><span class="tag ${cls}">${esc(f.status)}</span></td>
          <td>${f.local_size ? f.local_size.toLocaleString() + " B" : "—"}</td>
          <td>${f.remote_size ? f.remote_size.toLocaleString() + " B" : "—"}</td>
          <td>${esc(f.note || "")}</td>
        </tr>`;
    }).join("");
    return;
  }

  const files = state.manifest?.files || {};
  const names = Object.keys(files).sort();
  $("templates-status-banner").innerHTML = `<div class="muted" style="margin-bottom:8px;">${names.length} official templates tracked in <code>Templates/manifest.json</code> (Last checked: ${esc(state.manifest?.last_checked || "—")})</div>`;
  tbody.innerHTML = names.map((name) => {
    const f = files[name];
    return `
      <tr>
        <td><code>${esc(name)}</code></td>
        <td><span class="tag tag-ok">Installed</span></td>
        <td>${Number(f.size || 0).toLocaleString()} B</td>
        <td>—</td>
        <td>${f.source_page ? `<a href="${esc(f.source_page)}" target="_blank" rel="noopener">Official Source</a>` : "Local / Reference"}</td>
      </tr>`;
  }).join("");
}

/* ==================== SETTINGS ==================== */
function populateSettingsUI() {
  const s = state.settings;
  if (!s) return;
  const a = s.attorney || {};
  $("set-att-name").value = a.name || "";
  $("set-att-sig").value = a.signature || "";
  $("set-att-firm").value = a.firm_name || "";
  $("set-att-bar").value = a.bar_number || "";
  $("set-att-street").value = a.street || "";
  $("set-att-city").value = a.city || "";
  $("set-att-state").value = a.state || "FL";
  $("set-att-zip").value = a.zip_code || "";
  $("set-att-phone").value = a.phone || "";
  $("set-att-email").value = a.email || "";

  $("set-clients-dir").value = s.clients_dir || "";
  $("set-mt-url").value = s.means_test_url || "";
  $("mt-site-url").value = s.means_test_url || "";
  $("set-fee-ch7").value = s.filing_fees?.ch7 ?? 338;
  $("set-fee-ch13").value = s.filing_fees?.ch13 ?? 313;
  $("set-ch13-limit").value = s.thresholds?.ch13_combined_debt_limit ?? 2750000;
  $("set-fl-veh").value = s.thresholds?.fl_vehicle_exemption ?? 5000;
  $("set-fl-pers").value = s.thresholds?.fl_personal_property_exemption ?? 1000;
  $("set-fl-wild").value = s.thresholds?.fl_wildcard_exemption ?? 4000;

  const m = s.fl_median_income || {};
  $("set-med-1").value = m["1"] ?? 65801;
  $("set-med-2").value = m["2"] ?? 81548;
  $("set-med-3").value = m["3"] ?? 94340;
  $("set-med-4").value = m["4"] ?? 111895;
  $("set-med-add").value = m.additional_person ?? 11100;

  $("set-b7-agreed").value = s.b2030_defaults?.ch7?.agreed_fee ?? 2000;
  $("set-b7-rec").value = s.b2030_defaults?.ch7?.received_prior ?? 2000;
  $("set-b13-agreed").value = s.b2030_defaults?.ch13?.agreed_fee ?? 5358;
  $("set-b13-rec").value = s.b2030_defaults?.ch13?.received_prior ?? 1858;
  formatAllFieldsInDOM($("tab-settings") || document);
}

/* ==================== EVENT HANDLERS ==================== */
function setupStaticHandlers() {
  // Auto-recalc when scalar inputs change
  const scalarContainer = document.querySelector("main.container");
  scalarContainer.addEventListener("change", (ev) => {
    const id = ev.target.id || "";
    if (!id || id.startsWith("set-") || id === "import-chapter" || id === "mt-site-url" || id === "mt-import-json") return;
    if (id === "f-chapter") {
      applyChapterDefaultsToCase($("f-chapter").value);
      scheduleRecalc(true);
      pushCaseToMeansTest({ replaceAll: false, silent: true });
      return;
    }
    if (id === "f-is-joint") {
      syncScalarsToCase();
      renderExemptions();
    }
    if (id === "f-exemption-scheme" || id === "f-override-exempt-caps") {
      syncScalarsToCase();
      renderExemptions();
      scheduleRecalc(false);
      return;
    }
    const triggerFormRefresh = ["f-is-joint", "f-fee-method", "f-rents", "f-eviction", "f-military", "e-sep-hh", "mt-exempt", "f-household-size"].includes(id);
    scheduleRecalc(triggerFormRefresh);

    // Tightly auto-sync Petition edits -> Means Test whenever names, filing info, income, or expenses change
    const mtSyncIds = [
      "f-is-joint", "f-filing-date", "f-case-number", "f-household-size", "f-rents",
      "d1-first", "d1-middle", "d1-last", "d1-suffix", "d1-county",
      "d2-first", "d2-middle", "d2-last", "d2-suffix", "sofa-marital", "f-hh-contrib",
    ];
    if (mtSyncIds.includes(id) || id.startsWith("i1-") || id.startsWith("i2-") || id.startsWith("e-") || id.startsWith("fee-")) {
      pushCaseToMeansTest({ replaceAll: false, silent: true });
    }
  });

  if ($("exempt-catalog-search")) {
    $("exempt-catalog-search").addEventListener("input", () => renderExemptionCatalogDirectory());
  }

  // Instant keystroke persistence so refreshing mid-typing NEVER loses data + live CC 180-day warning
  scalarContainer.addEventListener("input", (ev) => {
    const id = ev.target.id || "";
    if (!id || id.startsWith("set-") || id === "import-chapter" || id === "mt-site-url" || id === "mt-import-json" || id === "exempt-catalog-search") return;
    if (id === "f-cc-date" || id === "f-filing-date") {
      updateCreditCounselingWarning();
    }
    clearTimeout(state.inputPersistTimer);
    state.inputPersistTimer = setTimeout(() => {
      syncScalarsToCase();
      markDirtyAndScheduleAutoSave();
    }, 250);
  });

  // CIF Dropzone
  const dz = $("cif-dropzone");
  const cifInput = $("cif-file-input");
  dz.addEventListener("click", () => cifInput.click());
  dz.addEventListener("dragover", (e) => { e.preventDefault(); dz.classList.add("dragover"); });
  dz.addEventListener("dragleave", () => dz.classList.remove("dragover"));
  dz.addEventListener("drop", (e) => {
    e.preventDefault();
    dz.classList.remove("dragover");
    if (e.dataTransfer.files?.length) handleCifUpload(e.dataTransfer.files[0]);
  });
  cifInput.addEventListener("change", () => {
    if (cifInput.files?.length) handleCifUpload(cifInput.files[0]);
    cifInput.value = "";
  });

  // Quick Case Actions
  $("btn-new-case").addEventListener("click", () => {
    clearWorkingSession();
    state.caseData = createBlankCase($("import-chapter").value);
    renderAllCaseUI();
    recalculate(true);
    pushCaseToMeansTest({ replaceAll: true, silent: true });
    toast("Started new blank case");
  });
  $("btn-sample-ch7").addEventListener("click", () => loadSample("7", false));
  $("btn-sample-ch13").addEventListener("click", () => loadSample("13", true));
  $("btn-refresh-cases").addEventListener("click", async () => {
    const res = await api("/api/cases");
    state.savedCases = res.saved_cases || [];
    renderSavedCases();
    toast("Refreshed saved cases");
  });

  // Browse All Entered Cases & Means Tests (Modal + PC/SynologyDrive .json File Picker)
  if ($("btn-hdr-browse-cases")) $("btn-hdr-browse-cases").addEventListener("click", () => openBrowseCasesModal("ALL"));
  if ($("btn-browse-cases")) $("btn-browse-cases").addEventListener("click", () => openBrowseCasesModal("ALL"));
  if ($("btn-mt-browse-cases")) $("btn-mt-browse-cases").addEventListener("click", () => openBrowseCasesModal("MT"));
  if ($("btn-close-browse-modal")) $("btn-close-browse-modal").addEventListener("click", closeBrowseCasesModal);
  if ($("btn-close-browse-modal-foot")) $("btn-close-browse-modal-foot").addEventListener("click", closeBrowseCasesModal);
  if ($("browse-cases-modal")) {
    $("browse-cases-modal").addEventListener("click", (e) => {
      if (e.target === $("browse-cases-modal")) closeBrowseCasesModal();
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && $("browse-cases-modal") && !$("browse-cases-modal").classList.contains("hidden")) {
      closeBrowseCasesModal();
    }
  });
  if ($("saved-cases-quick-search")) $("saved-cases-quick-search").addEventListener("input", () => renderSavedCases());
  if ($("modal-cases-search")) $("modal-cases-search").addEventListener("input", () => renderBrowseCasesModal());
  if ($("modal-cases-sort")) $("modal-cases-sort").addEventListener("change", () => renderBrowseCasesModal());
  if ($("modal-cases-filter-bar")) {
    $("modal-cases-filter-bar").addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-pill");
      if (!btn) return;
      $("modal-cases-filter-bar").querySelectorAll(".filter-pill").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.browseModalFilter = btn.dataset.filter || "ALL";
      renderBrowseCasesModal();
    });
  }
  if ($("btn-modal-refresh-cases")) {
    $("btn-modal-refresh-cases").addEventListener("click", async () => {
      const res = await api("/api/cases");
      state.savedCases = res.saved_cases || [];
      renderSavedCases();
      toast("Refreshed saved cases list", "ok");
    });
  }
  const triggerJsonBrowse = () => $("case-json-file-input")?.click();
  if ($("btn-browse-json-file")) $("btn-browse-json-file").addEventListener("click", triggerJsonBrowse);
  if ($("btn-modal-browse-json")) $("btn-modal-browse-json").addEventListener("click", triggerJsonBrowse);
  if ($("case-json-file-input")) {
    $("case-json-file-input").addEventListener("change", () => {
      const f = $("case-json-file-input").files?.[0];
      if (f) handleBrowseJsonFile(f);
      $("case-json-file-input").value = "";
    });
  }

  // Dynamic Add Buttons
  $("btn-add-dep").addEventListener("click", () => {
    state.caseData.dependents.push({ name: "", age: "", relationship: "Child", lives_with: true });
    renderDependents();
  });
  $("btn-add-prior-bk").addEventListener("click", () => {
    state.caseData.prior_bankruptcies.push({ chapter: "7", district: "Middle District of Florida", date_filed: "", case_number: "", discharged: false });
    renderPriorBankruptcies();
    scheduleRecalc(false);
  });
  $("btn-add-re-from-d1").addEventListener("click", () => {
    syncScalarsToCase();
    const d1 = state.caseData.debtor1 || {};
    const paInfo = getPropertyAppraiserInfo(d1.county);
    state.caseData.real_estate.push({
      address: d1.street || "", city: d1.city || "", state: d1.state || "FL",
      zip_code: d1.zip_code || "", county: d1.county || "",
      property_type: "Single-family home", is_primary_residence: true,
      use_debtor_address: true,
      owner: state.caseData.is_joint ? "both" : "debtor1",
      ownership_nature: "Fee Simple", market_value: 0, portion_owned_value: 0,
      value_source: paInfo.source, intent: "Keep",
    });
    renderRealEstate();
    toast(d1.street ? `Added property using Debtor 1's address (${d1.street})` : "Added property linked to Debtor 1's address (fill Debtor 1 address in Tab 1 to auto-populate)", "ok");
  });
  $("btn-add-re").addEventListener("click", () => {
    const county = state.caseData.debtor1.county || "";
    state.caseData.real_estate.push({
      address: "", city: "", state: "FL", zip_code: "", county,
      property_type: "Single-family home", is_primary_residence: state.caseData.real_estate.length === 0,
      use_debtor_address: false,
      owner: state.caseData.is_joint ? "both" : "debtor1",
      ownership_nature: "Fee Simple", market_value: 0, portion_owned_value: 0,
      value_source: getPropertyAppraiserInfo(county).source, intent: "Keep",
    });
    renderRealEstate();
  });
  $("btn-add-veh").addEventListener("click", () => {
    state.caseData.vehicles.push({
      vehicle_type: "Automobile", year: "", make: "", model: "", mileage: "",
      owner: "debtor1", market_value: 0, portion_owned_value: 0, value_source: "KBB.com", intent: "Keep", payoff: 0,
    });
    renderVehicles();
  });
  $("btn-add-bank").addEventListener("click", () => {
    state.caseData.personal_assets.bank_accounts.push({ account_type: "Checking", institution: "", account_last4: "", balance: 0 });
    renderBankAccounts();
  });
  $("btn-add-ret").addEventListener("click", () => {
    state.caseData.personal_assets.retirement_accounts.push({ account_type: "401(k)", institution: "", account_last4: "", balance: 0 });
    renderRetirementAccounts();
  });
  $("btn-sync-assets-exempt").addEventListener("click", () => syncAllAssetsToExemptions());
  $("btn-add-exemption").addEventListener("click", () => {
    const scheme = getActiveSchemeCode();
    const defaultStatute = scheme === "FEDERAL" ? "11 U.S.C. § 522(d)(5)" : "Fla. Const. art. X, § 4(a)(2)";
    const defaultId = scheme === "FEDERAL" ? "fed_wildcard" : "fl_personal";
    state.caseData.exemptions.push({
      schedule_ab_line: "", description: "", current_value: 0, exemption_amount: 0,
      claim_100_percent: false, statute: defaultStatute, exemption_id: defaultId, override_amount: false,
    });
    renderExemptions();
  });
  $("btn-auto-exemptions").addEventListener("click", async () => {
    syncScalarsToCase();
    try {
      const res = await api("/api/auto-exemptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state.caseData),
      });
      state.caseData.exemptions = res.exemptions || [];
      renderExemptions();
      await recalculate(false);
      const sch = getActiveSchemeCode();
      toast(`Applied ${state.caseData.exemptions.length} ${sch === "FEDERAL" ? "Federal § 522(d)" : sch === "FL" ? "Florida" : sch} statutory exemption(s)`, "ok");
    } catch (err) {
      toast(err.message, "err");
    }
  });

  // Creditors Add & Import
  $("btn-import-cred-trigger").addEventListener("click", () => $("cred-file-input").click());
  $("cred-file-input").addEventListener("change", () => {
    if ($("cred-file-input").files?.length) handleCreditorUpload($("cred-file-input").files[0]);
    $("cred-file-input").value = "";
  });
  $("btn-add-secured").addEventListener("click", () => {
    state.caseData.secured_creditors.push({
      name: "", attn: "Attn: Bankruptcy", street: "", city: "", state: "", zip_code: "",
      account_last4: "", date_incurred: "", collateral_desc: "", claim_amount: 0, collateral_value: 0,
      owner: "debtor1", lien_type: "agreement", intent: "Keep", notice_parties: [],
    });
    renderSecuredCreditors();
  });
  $("btn-add-priority").addEventListener("click", () => {
    state.caseData.unsecured_creditors.push({
      priority: true, name: "", attn: "Attn: Bankruptcy", street: "", city: "", state: "", zip_code: "",
      account_last4: "", date_incurred: "", total_claim: 0, priority_amount: 0,
      owner: "debtor1", claim_type: "Taxes", claim_type_specify: "IRS / Taxes", notice_parties: [],
    });
    renderUnsecuredCreditors();
  });
  $("btn-add-nonpriority").addEventListener("click", () => {
    state.caseData.unsecured_creditors.push({
      priority: false, name: "", attn: "Attn: Bankruptcy", street: "", city: "", state: "", zip_code: "",
      account_last4: "", date_incurred: "", total_claim: 0, priority_amount: 0,
      owner: "debtor1", claim_type: "Other", claim_type_specify: "CreditCard", notice_parties: [],
    });
    renderUnsecuredCreditors();
  });
  $("btn-add-contract").addEventListener("click", () => {
    state.caseData.executory_contracts.push({ name: "", street: "", city: "", state: "FL", zip_code: "", description: "Residential Lease", assume_lease: true });
    renderContracts();
  });
  $("btn-add-codebtor").addEventListener("click", () => {
    state.caseData.codebtors.push({ name: "", street: "", city: "", state: "FL", zip_code: "", schedule_d_line: "", schedule_ef_line: "", schedule_g_line: "" });
    renderCodebtors();
  });

  // B2030 reset
  $("btn-reset-b2030").addEventListener("click", () => {
    applyChapterDefaultsToCase($("f-chapter").value);
    populateScalarsFromCase();
    toast("Applied chapter B2030 fee defaults", "ok");
  });

  // Means Test Site Native Integration (flmb-ch13-means-test)
  $("btn-push-mt").addEventListener("click", pushCaseToMeansTest);
  $("btn-pull-mt").addEventListener("click", pullResultsFromMeansTest);
  $("btn-reload-mt-iframe").addEventListener("click", () => {
    const url = $("mt-site-url").value.trim() || state.settings?.means_test_url || "/means-test/index.html";
    $("mt-iframe").src = url + (url.includes("?") ? "&" : "?") + "_ts=" + Date.now();
  });
  $("btn-save-mt-url").addEventListener("click", async () => {
    const url = $("mt-site-url").value.trim() || "/means-test/index.html";
    state.settings = await api("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ means_test_url: url }),
    });
    $("set-mt-url").value = url;
    $("mt-iframe").src = url;
    toast("Saved Means Test site URL", "ok");
  });
  $("btn-open-mt-site").addEventListener("click", () => {
    const url = $("mt-site-url").value.trim() || state.settings?.means_test_url || "/means-test/index.html";
    window.open(url, "_blank", "noopener");
  });
  $("btn-export-mt-json").addEventListener("click", async () => {
    syncScalarsToCase();
    const payload = buildFlmbMeansTestCasePayload();
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    toast("Copied FLMB Means Test Case JSON to clipboard!", "ok");
  });
  $("btn-apply-mt-json").addEventListener("click", async () => {
    try {
      const parsed = JSON.parse($("mt-import-json").value || "{}");
      state.caseData.means_test.source = "external_site";
      if (parsed.total_cmi != null) state.caseData.means_test.total_cmi = num(parsed.total_cmi);
      if (parsed.marital_adjustment != null) state.caseData.means_test.marital_adjustment = num(parsed.marital_adjustment);
      if (parsed.monthly_disposable_income != null) state.caseData.means_test.monthly_disposable_income = num(parsed.monthly_disposable_income);
      if (parsed.household_size != null) state.caseData.household_size = parseInt(parsed.household_size, 10) || state.caseData.household_size;
      if (parsed.notes) state.caseData.means_test.external_notes = String(parsed.notes);
      populateScalarsFromCase();
      await recalculate(true);
      toast("Applied Means Test JSON to petition forms!", "ok");
    } catch (err) {
      toast("Invalid JSON: " + err.message, "err");
    }
  });

  // Forms & Generate
  $("btn-recheck-compliance").addEventListener("click", () => recalculate(false));
  $("btn-reset-forms").addEventListener("click", () => {
    recalculate(true);
    toast("Reset to auto-selected forms for Chapter " + state.caseData.chapter);
  });
  $("btn-save-draft").addEventListener("click", saveDraft);
  $("btn-save-only").addEventListener("click", saveDraft);
  $("btn-quick-generate").addEventListener("click", () => { switchTab("generate"); generatePacket(); });
  $("btn-generate-main").addEventListener("click", generatePacket);

  // Updates & Templates
  $("btn-refresh-updates").addEventListener("click", async () => {
    toast("Fetching live MDFL announcements...");
    try {
      state.updates = await api("/api/updates?refresh=true");
      renderUpdates();
      toast("Refreshed MDFL Tampa Division announcements!", "ok");
    } catch (err) {
      toast(err.message, "err");
    }
  });
  $("updates-filter-bar").addEventListener("click", (e) => {
    if (!e.target.classList.contains("filter-pill")) return;
    document.querySelectorAll(".filter-pill").forEach((b) => b.classList.remove("active"));
    e.target.classList.add("active");
    state.updatesFilter = e.target.dataset.filter;
    renderUpdates();
  });
  $("btn-check-forms").addEventListener("click", () => runTemplateCheck(false));
  $("btn-sync-forms").addEventListener("click", () => runTemplateCheck(true));
  if ($("btn-check-median")) $("btn-check-median").addEventListener("click", () => runMedianCheck(false));
  if ($("btn-apply-median")) $("btn-apply-median").addEventListener("click", () => runMedianCheck(true));

  // Settings Save
  $("btn-save-settings").addEventListener("click", saveSettingsFromUI);
}

function applyChapterDefaultsToCase(ch) {
  const bdef = state.settings?.b2030_defaults?.[`ch${ch}`];
  if (!bdef) return;
  const af = state.caseData.attorney_fees;
  af.agreed_fee = Number(bdef.agreed_fee ?? af.agreed_fee);
  af.received_prior = Number(bdef.received_prior ?? af.received_prior);
  af.filing_fee_paid = Number(bdef.filing_fee ?? af.filing_fee_paid);
  af.credit_report_fee = Number(bdef.credit_report_fee ?? af.credit_report_fee);
  af.included_other = bdef.included_other ?? "";
  af.excluded_services = bdef.excluded_services ?? "";
}

async function handleCifUpload(file) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("chapter", $("import-chapter").value || "7");
  toast(`Importing ${file.name}...`);
  try {
    const res = await api("/api/import-cif", { method: "POST", body: fd });
    applyServerCaseResponse(res);
    // Immediately auto-save newly imported CIF to the client folder so a refresh never loses it
    if (hasSaveableClientName(state.caseData)) {
      markDirtyAndScheduleAutoSave();
    }
    toast(`Imported CIF -> Folder: ${state.folderName}`, "ok");
  } catch (err) {
    toast(err.message, "err");
  }
}

async function handleCreditorUpload(file) {
  const fd = new FormData();
  fd.append("file", file);
  toast(`Parsing creditors from ${file.name}...`);
  try {
    const res = await api("/api/import-creditors", { method: "POST", body: fd });
    if (res.secured?.length) state.caseData.secured_creditors.push(...res.secured);
    if (res.unsecured?.length) state.caseData.unsecured_creditors.push(...res.unsecured);
    renderSecuredCreditors();
    renderUnsecuredCreditors();
    markDirtyAndScheduleAutoSave();
    await recalculate(false);
    $("cred-import-status").innerHTML = `<div class="alert alert-ok">Imported <strong>${res.count}</strong> creditor(s) from <code>${esc(file.name)}</code>.</div>`;
    toast(`Imported ${res.count} creditor(s)!`, "ok");
  } catch (err) {
    $("cred-import-status").innerHTML = `<div class="alert alert-err">${esc(err.message)}</div>`;
    toast(err.message, "err");
  }
}

async function loadSample(chapter, joint) {
  try {
    const res = await api(`/api/load-sample-case?chapter=${chapter}&joint=${joint}`, { method: "POST" });
    applyServerCaseResponse(res);
    toast(`Loaded Tampa Division Sample Ch. ${chapter}${joint ? " (Joint)" : ""}`, "ok");
  } catch (err) {
    toast(err.message, "err");
  }
}

async function saveDraft(opts = {}) {
  const silent = Boolean(opts && typeof opts === "object" && opts.silent);
  if (state.savingInFlight) {
    state.pendingResave = true;
    return;
  }
  syncScalarsToCase();
  if (silent && !hasSaveableClientName(state.caseData)) {
    persistWorkingSession();
    return;
  }

  state.savingInFlight = true;
  clearTimeout(state.autoSaveTimer);
  setAutoSaveBadge("Auto-Save: Saving...", "pill-gold");

  try {
    const payload = {
      case: state.caseData,
      base_case: state.baseCaseSnapshot,
      base_revision: state.baseRevision,
      editor_id: state.editorId,
    };
    const res = await api("/api/cases/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.case) {
      state.baseCaseSnapshot = JSON.parse(JSON.stringify(res.case));
      state.baseRevision = Number(res.revision ?? res.case.revision ?? 0);
      if (res.merged) {
        // Merge coworker edits cleanly into our UI without interrupting active input focus!
        state.caseData = res.case;
        if (res.totals) state.totals = res.totals;
        if (res.compliance) state.compliance = res.compliance;
        if (res.matrix_preview) state.matrixPreview = res.matrix_preview;
        renderAllCaseUIPreservingFocus();
        updateHeaderAndMetrics();
        renderCompliance();
        renderMatrixPreview();
      } else {
        state.caseData.revision = state.baseRevision;
        state.caseData.last_saved_at = res.last_saved_at || "";
      }
    } else {
      state.baseCaseSnapshot = JSON.parse(JSON.stringify(state.caseData));
      if (res.revision != null) state.baseRevision = Number(res.revision);
    }

    state.activeFolder = res.folder_name || state.activeFolder;
    state.folderName = res.folder_name || state.folderName;
    state.dirty = false;
    state.savedCases = res.saved_cases || state.savedCases;
    renderSavedCases();
    persistWorkingSession();

    const tStr = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const revTxt = state.baseRevision ? ` (Rev #${state.baseRevision})` : "";
    if (res.merged) {
      setAutoSaveBadge(`Merged Coworker Edits ${tStr}${revTxt}`, "pill-ok");
      toast(`Auto-saved & merged concurrent coworker edits on ${res.folder_name}${revTxt}`, "ok");
    } else {
      setAutoSaveBadge(`Auto-Saved ${tStr}${revTxt}`, "pill-ok");
      if (!silent) toast(`Saved draft to Clients/${res.folder_name}${revTxt}`, "ok");
    }
  } catch (err) {
    setAutoSaveBadge("Auto-Save: Retry Pending", "pill-warn");
    if (!silent) toast(err.message, "err");
  } finally {
    state.savingInFlight = false;
    if (state.pendingResave) {
      state.pendingResave = false;
      scheduleAutoSave(500);
    }
  }
}

async function generatePacket() {
  syncScalarsToCase();
  const btn = $("btn-generate-main");
  const wantZip = Boolean($("opt-download-zip")?.checked);
  btn.disabled = true;
  btn.textContent = "Generating Official PDFs...";
  try {
    const res = await api(`/api/generate${wantZip ? "?return_zip=true" : ""}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state.caseData),
    });
    if (wantZip && res.zip_base64 && !res.zip_url) {
      const bin = atob(res.zip_base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      res.zip_url = URL.createObjectURL(new Blob([bytes], { type: "application/zip" }));
      res.zip_name = res.zip_name || `${res.folder_name || "Petition_Packet"}.zip`;
      const a = document.createElement("a");
      a.href = res.zip_url;
      a.download = res.zip_name;
      a.click();
    }
    state.savedCases = res.saved_cases || state.savedCases;
    renderSavedCases();
    if (res.compliance) {
      state.compliance = res.compliance;
      renderCompliance();
    }
    const dl = (p) => (String(p || "").startsWith("blob:") ? p : `/api/download-file?path=${encodeURIComponent(p)}`);
    $("generate-result").innerHTML = `
      <div class="alert alert-ok">
        <strong>Petition Packet Generated Successfully!</strong><br/>
        Client Folder: <code>${esc(res.client_dir)}</code> (${res.combined_pages} public pages, ${res.matrix_count} matrix creditors)
      </div>
      <div class="btn-group" style="margin-bottom: 12px;">
        ${res.processed_by === "python-server" ? "" : `<a class="btn btn-primary" href="${dl(res.combined_pdf)}" target="_blank">Open Combined Public Petition PDF</a>`}
        ${res.b121_restricted_pdf && res.processed_by !== "python-server" ? `<a class="btn btn-danger" href="${dl(res.b121_restricted_pdf)}" target="_blank">Open Restricted Form B121 (SSN)</a>` : ""}
        ${res.processed_by === "python-server" ? `<span class="tag tag-ok">Saved Directly to Office Clients Folder${res.zip_url ? " + ZIP Downloaded" : ""}</span>` : `<a class="btn btn-secondary" href="${dl(res.creditor_txt)}" target="_blank">View Creditor.txt</a>`}
        ${res.zip_url ? `<a class="btn btn-gold" href="${res.zip_url}" download="${esc(res.zip_name || "Petition_Packet.zip")}">Download Full Client Folder (.zip)</a>` : `<button class="btn btn-gold" onclick="openFolderInExplorer('${esc(res.client_dir.replace(/\\/g, "\\\\"))}')">Open Client Folder in Explorer</button>`}
      </div>
      <details open>
        <summary style="cursor:pointer;font-weight:600;color:var(--navy);margin-bottom:8px;">All Generated Files (${res.files.length})</summary>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Form</th><th>File</th><th>Note</th><th></th></tr></thead>
            <tbody>
              ${res.files.map((f) => `
                <tr>
                  <td><strong>${esc(f.id)}</strong></td>
                  <td><code>${esc(f.name)}</code></td>
                  <td class="muted">${esc(f.note || "Editable individual PDF")}</td>
                  <td><a class="btn btn-secondary btn-sm" href="${f.url ? f.url : dl(f.path)}" target="_blank">Open</a></td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>
      </details>
    `;
    toast(`Generated packet in ${res.folder_name}!`, "ok");
  } catch (err) {
    $("generate-result").innerHTML = `<div class="alert alert-err">${esc(err.message)}</div>`;
    toast(err.message, "err");
  } finally {
    btn.disabled = false;
    btn.textContent = "Generate Complete Petition Packet";
  }
}

window.openFolderInExplorer = async (folderPath) => {
  try {
    await api("/api/open-folder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: folderPath }),
    });
  } catch (err) {
    toast(err.message, "err");
  }
};

async function runMedianCheck(apply) {
  const btn = apply ? $("btn-apply-median") : $("btn-check-median");
  if (btn) btn.disabled = true;
  toast(apply ? "Updating Florida Median Income from US Trustee..." : "Checking justice.gov for latest Florida Median Income...");
  try {
    const res = await api(`/api/updates/check-median-income?apply=${apply ? "true" : "false"}`, { method: "POST" });
    const cls = res.status === "up_to_date" || res.status === "updated" ? "alert-ok" : res.status === "update_available" ? "alert-warn" : "alert-info";
    const fmtTbl = (t) => t ? `1-Person: <strong>${money(t["1"])}</strong> | 2: <strong>${money(t["2"])}</strong> | 3: <strong>${money(t["3"])}</strong> | 4: <strong>${money(t["4"])}</strong> (+${money(t.additional_person)}/ea)` : "—";
    if ($("median-update-status")) {
      $("median-update-status").innerHTML = `
        <div class="alert ${cls}">
          <strong>${esc(res.note || res.status)}</strong> (Checked ${esc(res.checked_at || "")})<br/>
          Current App Table: ${fmtTbl(res.current)}<br/>
          ${res.official ? `Latest Official UST: ${fmtTbl(res.official)}<br/>` : ""}
          <a href="${esc(res.source_url || "https://www.justice.gov/ust/means-testing")}" target="_blank" rel="noopener">View Official US Trustee Source</a>
        </div>`;
    }
    if (res.applied && res.current) {
      state.settings.fl_median_income = res.current;
      populateSettingsUI();
      await recalculate(false);
    }
    toast(res.note || "Median income check finished.", "ok");
  } catch (err) {
    if ($("median-update-status")) $("median-update-status").innerHTML = `<div class="alert alert-err">${esc(err.message)}</div>`;
    toast(err.message, "err");
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function runTemplateCheck(download) {
  const btn = download ? $("btn-sync-forms") : $("btn-check-forms");
  btn.disabled = true;
  toast(download ? "Checking & downloading updated official PDFs..." : "Checking official uscourts.gov & flmb.uscourts.gov forms...");
  try {
    const res = await api(download ? "/api/updates/sync-forms" : "/api/updates/check-forms", { method: "POST" });
    renderTemplatesManifest(res);
    toast(download ? `Updated ${res.updated_count} template(s)!` : `Check complete: ${res.updates_available} update(s) found.`, "ok");
  } catch (err) {
    toast(err.message, "err");
  } finally {
    btn.disabled = false;
  }
}

async function saveSettingsFromUI() {
  const payload = {
    clients_dir: $("set-clients-dir").value.trim(),
    means_test_url: $("set-mt-url").value.trim(),
    attorney: {
      name: $("set-att-name").value.trim(),
      signature: $("set-att-sig").value.trim(),
      firm_name: $("set-att-firm").value.trim(),
      bar_number: $("set-att-bar").value.trim(),
      street: $("set-att-street").value.trim(),
      city: $("set-att-city").value.trim(),
      state: $("set-att-state").value.trim(),
      zip_code: $("set-att-zip").value.trim(),
      phone: $("set-att-phone").value.trim(),
      email: $("set-att-email").value.trim(),
    },
    filing_fees: {
      ch7: num($("set-fee-ch7").value),
      ch13: num($("set-fee-ch13").value),
    },
    thresholds: {
      ch13_combined_debt_limit: num($("set-ch13-limit").value),
      fl_vehicle_exemption: num($("set-fl-veh").value),
      fl_personal_property_exemption: num($("set-fl-pers").value),
      fl_wildcard_exemption: num($("set-fl-wild").value),
    },
    fl_median_income: {
      "1": num($("set-med-1").value),
      "2": num($("set-med-2").value),
      "3": num($("set-med-3").value),
      "4": num($("set-med-4").value),
      additional_person: num($("set-med-add").value),
    },
    b2030_defaults: {
      ch7: { agreed_fee: num($("set-b7-agreed").value), received_prior: num($("set-b7-rec").value) },
      ch13: { agreed_fee: num($("set-b13-agreed").value), received_prior: num($("set-b13-rec").value) },
    },
  };
  try {
    state.settings = await api("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    $("mt-site-url").value = state.settings.means_test_url || "";
    await recalculate(false);
    toast("Settings saved!", "ok");
  } catch (err) {
    toast(err.message, "err");
  }
}

/* ==================== NATIVE FLMB MEANS TEST BRIDGE (flmb-ch13-means-test) ==================== */
const FLMB_MT_STORAGE_KEY = "flmb_ch13_means_test_case_v2";

function _zeroPayMap() {
  return {
    gross: 0, fedTax: 0, ssTax: 0, medTax: 0, mandatoryRetire: 0, unionDues: 0,
    voluntary401k: 0, loan401k: 0, healthIns: 0, dentalVision: 0, hsaFsa: 0,
    disabilityIns: 0, termLife: 0, courtDso: 0,
  };
}

function _toIsoDate(mdy) {
  const m = String(mdy || "").trim().match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})$/);
  if (m) {
    const yr = m[3].length === 2 ? "20" + m[3] : m[3];
    return `${yr}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  }
  return new Date().toISOString().slice(0, 10);
}

function _matchTampaCounty(rawCounty) {
  const valid = ["Hillsborough", "Pinellas", "Pasco", "Hernando", "Polk", "Manatee", "Sarasota", "Hardee"];
  const low = String(rawCounty || "").toLowerCase().replace("county", "").trim();
  return valid.find((v) => v.toLowerCase() === low) || "Pinellas";
}

function buildFlmbMeansTestCasePayload() {
  syncScalarsToCase();
  const c = state.caseData;
  const att = state.settings?.attorney || {};
  const d1Name = [c.debtor1.first_name, c.debtor1.middle_name, c.debtor1.last_name, c.debtor1.suffix].filter(Boolean).join(" ") || c.debtor1.full_name || "";
  const d2Name = [c.debtor2.first_name, c.debtor2.middle_name, c.debtor2.last_name, c.debtor2.suffix].filter(Boolean).join(" ") || c.debtor2.full_name || "";
  const hhSize = Math.max(1, parseInt(c.household_size, 10) || 1);
  const childrenUnder18 = (c.dependents || []).filter((d) => {
    const age = parseInt(d.age, 10);
    return Number.isFinite(age) ? age < 18 : true;
  }).length;

  const mapEarner = (inc) => {
    const gross = Number(inc.monthly_gross_wages || 0) + Number(inc.monthly_overtime || 0);
    return {
      employerName: inc.employer_name || "",
      mode: "manual",
      ytd: {
        method: "boundary",
        monthsInWindow: 6.0,
        payFrequency: "biweekly",
        periodsElapsedYtd: 22,
        priorDate: "",
        latestDate: "",
        yearEndDate: "",
        prior: _zeroPayMap(),
        latest: _zeroPayMap(),
        yearEnd: _zeroPayMap(),
      },
      stubs: [{ date: "", ..._zeroPayMap() }],
      manual: {
        frequency: "monthly",
        gross: gross,
        fedTax: Number(inc.ded_taxes || 0),
        ssTax: 0,
        medTax: 0,
        mandatoryRetire: Number(inc.ded_mandatory_ret || 0),
        unionDues: Number(inc.ded_union || 0),
        voluntary401k: Number(inc.ded_voluntary_ret || 0),
        loan401k: Number(inc.ded_ret_loan || 0),
        healthIns: Number(inc.ded_insurance || 0),
        dentalVision: 0,
        hsaFsa: 0,
        disabilityIns: 0,
        termLife: 0,
        courtDso: Number(inc.ded_dso || 0),
      },
    };
  };

  // Secured & Priority rollups
  const mortgages = (c.secured_creditors || []).filter((sc) =>
    /mortg|home|real|condo|park|blvd|st|ave|rd|dr|ln/i.test(sc.collateral_desc || "") || /mortg/i.test(sc.name || "")
  );
  const secMortgage1 = mortgages[0]?.monthly_payment || c.expenses.rent_or_mortgage || 0;
  const secMortgage2Hoa = (mortgages[1]?.monthly_payment || 0) + Number(c.expenses.hoa_dues || 0);
  const arrearsMortgageTotal = mortgages.reduce((s, m) => s + Number(m.arrears || 0), 0);

  const vehiclesKept = (c.vehicles || []).filter((v) => String(v.intent || "").toLowerCase() !== "surrender");
  const secCar1 = vehiclesKept[0]?.monthly_payment || c.expenses.vehicle_payment_1 || 0;
  const secCar2 = vehiclesKept[1]?.monthly_payment || c.expenses.vehicle_payment_2 || 0;

  const priTaxes = (c.unsecured_creditors || []).filter((u) => u.priority && u.claim_type === "Taxes").reduce((s, u) => s + Number(u.total_claim || 0), 0);
  const priDso = (c.unsecured_creditors || []).filter((u) => u.priority && u.claim_type === "DSO").reduce((s, u) => s + Number(u.total_claim || 0), 0);
  const genUnsec = (c.unsecured_creditors || []).filter((u) => !u.priority).reduce((s, u) => s + Number(u.total_claim || 0), 0);
  const attyBal = Math.max(0, Number(c.attorney_fees.agreed_fee || 0) - Number(c.attorney_fees.received_prior || 0));

  const filingStatus = c.is_joint
    ? "joint"
    : c.sofa?.marital_status === "Married"
      ? "married_separate_living_together"
      : "single";

  return {
    clientName: d1Name,
    spouseName: d2Name,
    caseNumber: c.case_number || "",
    filingStatus,
    filingDate: _toIsoDate(c.filing_date),
    tampaCounty: _matchTampaCounty(c.debtor1.county),
    standardsPreset: "2026-mid",
    householdSize: hhSize,
    membersUnder65: hhSize,
    members65Plus: 0,
    dependentChildrenUnder18: childrenUnder18,
    vehicleCount: Math.min(2, vehiclesKept.length || (secCar1 > 0 ? 1 : 0)),
    olderVehicleCount: 0,
    claimPublicTransit: "no",
    claim5PercentFood: "no",
    firmName: att.firm_name || "Law Offices of Jill McDonald",
    attorneyName: att.name || "L. Jill McDonald",
    firmContact: `${att.street || "7500 65th St. North"}, ${att.city || "Pinellas Park"}, ${att.state || "FL"} ${att.zip_code || "33781"} • ${att.phone || "(727) 231-4300"} • ${att.info_email || att.email || "Info@JillMcDonald.com"}`,
    attorneyCustomNote: "",
    enableDebtor2: !!c.is_joint,
    earners: {
      d1: mapEarner(c.income_debtor1),
      d2: mapEarner(c.income_debtor2),
    },
    otherIncome: {
      businessGross: Number(c.income_debtor1.business_gross_monthly || c.income_debtor1.net_business_rental || 0),
      businessExpenses: Number(c.income_debtor1.business_expenses_monthly || 0),
      rentalNet: Number(c.income_debtor1.rental_gross_monthly || 0) - Number(c.income_debtor1.rental_expenses_monthly || 0),
      interestDiv: Number(c.income_debtor1.interest_dividends || 0) + (c.is_joint ? Number(c.income_debtor2.interest_dividends || 0) : 0),
      pension: Number(c.income_debtor1.pension_retirement || 0) + (c.is_joint ? Number(c.income_debtor2.pension_retirement || 0) : 0),
      supportContrib: Number(c.income_debtor1.family_support || 0) + Number(c.household_contributions_monthly || 0),
      unemployment: Number(c.income_debtor1.unemployment || 0) + (c.is_joint ? Number(c.income_debtor2.unemployment || 0) : 0),
      otherCmi: Number(c.income_debtor1.other_income || 0) + (c.is_joint ? Number(c.income_debtor2.other_income || 0) : 0),
      exclSocialSecurity: Number(c.income_debtor1.social_security || 0) + (c.is_joint ? Number(c.income_debtor2.social_security || 0) : 0),
      exclVaHaven: 0,
      maritalAdjustment: Number(c.means_test.marital_adjustment || 0),
      maritalAdjustmentNotes: "",
    },
    deductionOverrides: {
      line6_foodClothing: { enabled: false, value: 0 },
      line7_addlFood5Pct: { enabled: false, value: 0 },
      line8_housingUtilities: { enabled: false, value: 0 },
      line9a_housingMortgageStd: { enabled: false, value: 0 },
      line11_publicTransit: { enabled: false, value: 0 },
      line12_vehicleOperating: { enabled: false, value: 0 },
      line13a_car1OwnershipStd: { enabled: false, value: 0 },
      line13d_car2OwnershipStd: { enabled: false, value: 0 },
      line14_healthOutOfPocketStd: { enabled: false, value: 0 },
      line16_taxes: { enabled: false, value: 0 },
      line17_involuntaryDed: { enabled: false, value: 0 },
      line18_termLife: { enabled: false, value: 0 },
      line19_courtOrderedDso: { enabled: false, value: 0 },
      line20_educationEmployment: { enabled: true, value: 0 },
      line21_childcare: { enabled: true, value: Number(c.expenses.childcare_education || 0) },
      line22_extraHealthCare: { enabled: true, value: 0 },
      line23_telecom: { enabled: true, value: 0 },
      line25_healthDisabilityHsa: { enabled: false, value: 0 },
      line26_careFamilyMembers: { enabled: true, value: 0 },
      line27_familyViolence: { enabled: true, value: 0 },
      line28_homeEnergyExcess: { enabled: true, value: 0 },
      line29_childEducation: { enabled: true, value: 0 },
      line31_charitable: { enabled: true, value: Number(c.expenses.charitable || 0) },
      line41_retirement401kAndLoans: { enabled: false, value: 0 },
      line43_specialCircumstances: { enabled: true, value: 0 },
    },
    securedAndPriority: {
      secMortgage1,
      secMortgage2Hoa,
      secRentActual: c.rents_residence ? Number(c.expenses.rent_or_mortgage || 0) : 0,
      secCar1,
      secCar2,
      secOther: 0,
      arrearsMortgageTotal,
      arrearsOtherTotal: 0,
      priorityTaxTotal: priTaxes,
      priorityDsoTotal: priDso,
      priorityAttyFees: attyBal,
      generalUnsecuredTotal: genUnsec,
      trusteeMultiplier: 10.0,
      projectedPlanPaymentOverride: "",
    },
    reportViewMode: "client",
  };
}

let _mtIframeReady = false;
let _mtAutoSyncTimer = null;

function _splitPersonFullName(fullStr) {
  const s = String(fullStr || "").trim().replace(/\s+/g, " ");
  if (!s) return { first: "", middle: "", last: "", suffix: "", full: "" };
  const parts = s.split(" ");
  let suffix = "";
  if (parts.length > 2 && /^(jr\.?|sr\.?|ii|iii|iv|v)$/i.test(parts[parts.length - 1])) {
    suffix = parts.pop();
  }
  const first = parts[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1] : "";
  const middle = parts.length > 2 ? parts.slice(1, -1).join(" ") : "";
  return { first, middle, last, suffix, full: s };
}

function _isoToMdy(iso) {
  const m = String(iso || "").trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[2]}/${m[3]}/${m[1]}` : "";
}

function setupMeansTestBridge() {
  window.addEventListener("message", (ev) => {
    const msg = ev.data;
    if (!msg || typeof msg !== "object") return;
    if (msg.type === "FLMB_MEANS_TEST_READY") {
      _mtIframeReady = true;
      pushCaseToMeansTest({ replaceAll: true, silent: true });
      return;
    }
    if (msg.type === "FLMB_MEANS_TEST_UPDATE" && msg.caseState && msg.calc) {
      _mtIframeReady = true;
      applyMeansTestSnapshotToPetition(msg.caseState, msg.calc, { silent: true });
    }
  });
}

function pushCaseToMeansTest(opts = {}) {
  const replaceAll = opts && typeof opts === "object" && "replaceAll" in opts ? !!opts.replaceAll : true;
  const silent = opts && typeof opts === "object" && "silent" in opts ? !!opts.silent : false;
  try {
    const payload = buildFlmbMeansTestCasePayload();
    if (replaceAll) {
      localStorage.setItem(FLMB_MT_STORAGE_KEY, JSON.stringify(payload));
    }
    const iframe = $("mt-iframe");
    if (iframe && iframe.contentWindow && _mtIframeReady) {
      iframe.contentWindow.postMessage({ type: "PETITION_PUSH_TO_MEANS_TEST", payload, replaceAll }, "*");
    } else if (iframe && replaceAll) {
      localStorage.setItem(FLMB_MT_STORAGE_KEY, JSON.stringify(payload));
    }
    if (!silent) {
      $("mt-sync-status").innerHTML = `
        <div class="alert alert-ok">
          <strong>Synced "${esc(payload.clientName || "Client")}"${payload.spouseName ? ` &amp; "${esc(payload.spouseName)}"` : ""} (${esc(payload.tampaCounty)} County, HH Size ${payload.householdSize}) &rarr; Means Test!</strong>
        </div>`;
      toast("Synced case data to FLMB Means Test!", "ok");
    }
  } catch (err) {
    if (!silent) toast("Push error: " + err.message, "err");
  }
}

function applyMeansTestSnapshotToPetition(mtCase, calc, opts = {}) {
  const silent = !!opts.silent;
  const c = state.caseData;
  if (!c || !calc) return;
  const oi = mtCase.otherIncome || {};

  // 1. Sync Debtor 1 & Debtor 2 names (exact 1-to-1 match!)
  const mtD1 = String(mtCase.clientName || "").trim();
  const curD1 = [c.debtor1.first_name, c.debtor1.middle_name, c.debtor1.last_name, c.debtor1.suffix].filter(Boolean).join(" ").trim();
  if (mtD1 && mtD1 !== "Client" && mtD1 !== curD1) {
    const p1 = _splitPersonFullName(mtD1);
    c.debtor1.first_name = p1.first;
    c.debtor1.middle_name = p1.middle;
    c.debtor1.last_name = p1.last;
    c.debtor1.suffix = p1.suffix;
    c.debtor1.full_name = p1.full;
  }
  const mtD2 = String(mtCase.spouseName || "").trim();
  const curD2 = [c.debtor2.first_name, c.debtor2.middle_name, c.debtor2.last_name, c.debtor2.suffix].filter(Boolean).join(" ").trim();
  if (mtD2 && mtD2 !== curD2) {
    const p2 = _splitPersonFullName(mtD2);
    c.debtor2.first_name = p2.first;
    c.debtor2.middle_name = p2.middle;
    c.debtor2.last_name = p2.last;
    c.debtor2.suffix = p2.suffix;
    c.debtor2.full_name = p2.full;
  }

  // 2. Sync Case Metadata (Case #, Filing Date, Tampa County, Joint Status, Household Size, Employers)
  if (mtCase.caseNumber !== undefined && String(mtCase.caseNumber).trim() !== c.case_number) {
    c.case_number = String(mtCase.caseNumber || "").trim();
  }
  const mdy = _isoToMdy(mtCase.filingDate);
  if (mdy && mdy !== c.filing_date) {
    c.filing_date = mdy;
  }
  if (mtCase.tampaCounty && mtCase.tampaCounty !== c.debtor1.county) {
    c.debtor1.county = mtCase.tampaCounty;
  }
  const mtJoint = mtCase.filingStatus === "joint" || !!mtCase.enableDebtor2;
  if (mtJoint !== !!c.is_joint) {
    c.is_joint = mtJoint;
  }
  if (calc.hhSize && calc.hhSize !== c.household_size) {
    c.household_size = calc.hhSize;
  }
  if (mtCase.earners?.d1?.employerName) {
    c.income_debtor1.employer_name = mtCase.earners.d1.employerName;
    c.income_debtor1.employed = true;
  }
  if (mtCase.earners?.d2?.employerName) {
    c.income_debtor2.employer_name = mtCase.earners.d2.employerName;
    c.income_debtor2.employed = true;
  }

  // 3. Sync Schedule I gross wages/deductions automatically if Schedule I is currently blank and Means Test has figures
  if (Number(c.income_debtor1.monthly_gross_wages || 0) === 0 && Number(calc.d1?.gross || 0) > 0) {
    c.income_debtor1.monthly_gross_wages = round2(calc.d1.gross);
    c.income_debtor1.employed = true;
  }
  if (c.is_joint && Number(c.income_debtor2.monthly_gross_wages || 0) === 0 && Number(calc.d2?.gross || 0) > 0) {
    c.income_debtor2.monthly_gross_wages = round2(calc.d2.gross);
    c.income_debtor2.employed = true;
  }

  // 4. Sync Full Means Test Calculation into Official Forms 122A-1 / 122A-2 / 122C-1 / 122C-2
  const mt = c.means_test;
  mt.source = "external_site";
  mt.household_size = calc.hhSize;
  mt.fl_median_income = Number(calc.flMedianAnnual || 0);
  mt.d1_cmi_wages = round2(calc.d1?.gross || 0);
  mt.d2_cmi_wages = round2(calc.d2?.gross || 0);
  mt.d1_cmi_business_net = round2(calc.netBusiness || 0);
  mt.d1_cmi_rental_net = round2(oi.rentalNet || 0);
  mt.d1_cmi_interest = round2(oi.interestDiv || 0);
  mt.d1_cmi_contributions = round2(oi.supportContrib || 0);
  mt.d1_cmi_unemployment = round2(oi.unemployment || 0);
  mt.d1_cmi_pension = round2(oi.pension || 0);
  mt.d1_cmi_other = round2(oi.otherCmi || 0);
  mt.d1_social_security_excluded = round2(oi.exclSocialSecurity || 0);
  mt.marital_adjustment = round2(calc.maritalAdj || 0);
  mt.total_cmi = round2(calc.totalMonthlyCmi || 0);
  mt.annualized_cmi = round2(calc.annualizedCmi || 0);
  mt.above_median = !!calc.isAboveMedian;
  mt.commitment_years = calc.commitmentPeriodMonths === 60 ? 5 : 3;
  mt.monthly_disposable_income = round2(calc.totals?.monthlyDisposableIncome || 0);
  mt.external_notes =
    `Auto-Synced from FLMB Means Test (${calc.stdPreset?.label || "2026-mid"}, ${calc.countyData?.name || ""}) | ` +
    `CMI: ${money(mt.total_cmi)}/mo | Annualized: ${money(mt.annualized_cmi)} vs FL Median ${money(mt.fl_median_income)} | ` +
    `IRS/UST Deductions: ${money(calc.totals?.totalAllDeductions || 0)}/mo | ` +
    `Line 45 Monthly Disposable Income: ${money(mt.monthly_disposable_income)}/mo (${calc.commitmentPeriodMonths}-mo commitment)`;

  populateScalarsFromCase();
  markDirtyAndScheduleAutoSave();

  const ts = new Date().toLocaleTimeString();
  const statusEl = $("mt-sync-status");
  if (statusEl) {
    statusEl.innerHTML = `
      <div class="alert alert-ok" style="margin-bottom:8px;">
        <strong>Auto-Synced to Petition Forms (${ts}):</strong>
        Monthly CMI <strong>${money(mt.total_cmi)}</strong> &bull;
        Annualized <strong>${money(mt.annualized_cmi)}</strong> vs FL Median (HH ${calc.hhSize}): <strong>${money(mt.fl_median_income)}</strong> &bull;
        <strong>${calc.isAboveMedian ? "Above Median (" + calc.commitmentPeriodMonths + "-mo / 122A-2 or 122C-2 Auto-Selected)" : "Below Median (" + calc.commitmentPeriodMonths + "-mo)"}</strong> &bull;
        Line 45 MDI: <strong>${money(mt.monthly_disposable_income)}/mo</strong>
      </div>`;
  }
  const pill = $("mt-live-sync-pill");
  if (pill) pill.textContent = `🔄 Live Synced (${ts})`;

  clearTimeout(_mtAutoSyncTimer);
  _mtAutoSyncTimer = setTimeout(() => {
    recalculate(true);
  }, silent ? 280 : 0);

  if (!silent) toast("Synced Means Test results into Petition Forms!", "ok");
}

async function pullResultsFromMeansTest() {
  try {
    const iframe = $("mt-iframe");
    const win = iframe?.contentWindow;
    if (!win || typeof win.computeMeansTest !== "function") {
      throw new Error("Means Test calculator iframe is not loaded yet. Wait a second or click 'Reload Embedded Calculator'.");
    }
    const calc = win.computeMeansTest();
    const mtCase = win.caseState || JSON.parse(localStorage.getItem(FLMB_MT_STORAGE_KEY) || "{}");
    applyMeansTestSnapshotToPetition(mtCase, calc, { silent: false });
  } catch (err) {
    $("mt-sync-status").innerHTML = `<div class="alert alert-err">${esc(err.message)}</div>`;
    toast(err.message, "err");
  }
}

function round2(v) {
  return Math.round((Number(v) || 0) * 100) / 100;
}

document.addEventListener("DOMContentLoaded", () => {
  init();

  const conn = _cfGetPythonConn();
  if (document.getElementById("set-py-url")) document.getElementById("set-py-url").value = conn.url || "";
  if (document.getElementById("set-py-secret")) document.getElementById("set-py-secret").value = conn.secret || "";

  const e2ePill = document.getElementById("hdr-e2e");
  if (e2ePill && window.PetitionCrypto) {
    e2ePill.addEventListener("click", async () => {
      try {
        toast("Testing AES-256-GCM encryption handshake with Cloudflare...");
        const pong = await window.PetitionCrypto.securePost("ping", _cfWrapBackendMeta({ check: "MDFL-E2E-TEST", ts: Date.now() }));
        toast(`Verified! Encrypted on PC -> Decrypted on ${pong.decrypted_on}`, "ok");
      } catch (err) {
        toast("E2E Test: " + err.message, "err");
      }
    });
  }

  const engPill = document.getElementById("hdr-engine");
  if (engPill) engPill.addEventListener("click", () => switchTab("settings"));

  const btnSavePy = document.getElementById("btn-save-py-conn");
  if (btnSavePy) {
    btnSavePy.addEventListener("click", async () => {
      const u = (document.getElementById("set-py-url").value || "").trim();
      const s = (document.getElementById("set-py-secret").value || "").trim();
      _cfSetPythonConn(u, s);
      _cfUpdateEngineBadges();
      toast(u ? "Saved Python Server Tunnel URL!" : "Cleared custom URL (using firm default / standalone).", "ok");
      try {
        const res = await api("/api/cases");
        state.savedCases = res.saved_cases || [];
        renderSavedCases();
      } catch (_) {}
    });
  }

  const btnClearPy = document.getElementById("btn-clear-py-conn");
  if (btnClearPy) {
    btnClearPy.addEventListener("click", () => {
      _cfSetPythonConn("", "");
      if (document.getElementById("set-py-url")) document.getElementById("set-py-url").value = "";
      if (document.getElementById("set-py-secret")) document.getElementById("set-py-secret").value = "";
      _cfUpdateEngineBadges();
      toast("Cleared browser Python override.", "ok");
    });
  }

  const btnTestPy = document.getElementById("btn-test-py-conn");
  if (btnTestPy) {
    btnTestPy.addEventListener("click", async () => {
      const u = (document.getElementById("set-py-url").value || "").trim();
      const s = (document.getElementById("set-py-secret").value || "").trim();
      if (u) _cfSetPythonConn(u, s);
      _cfUpdateEngineBadges();
      const st = document.getElementById("py-conn-status");
      if (st) st.innerHTML = `<div class="alert alert-info">Testing AES-256-GCM encrypted route: Browser &rarr; Cloudflare Worker &rarr; Office Python Server...</div>`;
      try {
        const res = await window.PetitionCrypto.securePost("ping-backend", _cfWrapBackendMeta({}));
        if (st) {
          st.innerHTML = `<div class="alert alert-ok"><strong>Connected Successfully!</strong><br/>Engine: ${esc(res.engine)}<br/>Multi-User Ready: <strong>Yes</strong> &bull; Relay Secret Protected: <strong>${res.relay_secret_active ? "Yes" : "Optional"}</strong><br/>Clients Folder on Host PC: <code>${esc(res.clients_dir || "")}</code><br/>Route: ${esc(res.connected_via || "")}</div>`;
        }
        toast("Connected to Shared Office Python Server!", "ok");
      } catch (err) {
        if (st) st.innerHTML = `<div class="alert alert-err"><strong>Connection Failed:</strong> ${esc(err.message)}</div>`;
        toast("Python server test failed: " + err.message, "err");
      }
    });
  }
});
