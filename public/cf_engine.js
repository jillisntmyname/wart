/**
 * Standalone Cloudflare Pages Bankruptcy Petition Engine (Pure JS: pdf-lib + JSZip)
 * Runs seamlessly on Cloudflare Pages (no external Python server required) while maintaining
 * full parity with Tampa Division MDFL rules, Arial/Helvetica 9 pt fonts, client /s/ e-signatures,
 * Debtorcc.org defaults, fixed Form B2030 Certification layout, FRBP 1007(f) SSN separation,
 * and MDFL Local Rule 1007-2 Creditor.txt formatting.
 */
"use strict";

window.CloudflarePetitionEngine = (() => {
  const MDFL_DIVISIONS = {
    "Tampa Division": new Set(["hardee", "hernando", "hillsborough", "manatee", "pasco", "pinellas", "polk", "sarasota"]),
    "Fort Myers Division": new Set(["charlotte", "collier", "desoto", "glades", "hendry", "lee"]),
    "Orlando Division": new Set(["brevard", "orange", "osceola", "seminole", "volusia"]),
    "Jacksonville Division": new Set([
      "baker", "bradford", "citrus", "clay", "columbia", "duval", "flagler", "hamilton",
      "lake", "marion", "nassau", "putnam", "st. johns", "st johns", "sumter", "suwannee", "union",
    ]),
  };

  const FORM_CATALOG = [
    { id: "B101", file: "form_b101.pdf", title: "Voluntary Petition for Individuals", chapters: ["7", "13"], required: true, order: 10 },
    { id: "B106AB", file: "form_b106ab.pdf", title: "Schedule A/B: Property", chapters: ["7", "13"], required: true, order: 20 },
    { id: "B106C", file: "b_106c_0425-form.pdf", title: "Schedule C: Property You Claim as Exempt", chapters: ["7", "13"], required: true, order: 30 },
    { id: "B106D", file: "form_b106d.pdf", title: "Schedule D: Secured Claims", chapters: ["7", "13"], required: true, order: 40 },
    { id: "B106EF", file: "form_b106ef.pdf", title: "Schedule E/F: Unsecured Claims", chapters: ["7", "13"], required: true, order: 50 },
    { id: "B106G", file: "form_b106g.pdf", title: "Schedule G: Executory Contracts & Leases", chapters: ["7", "13"], required: true, order: 60 },
    { id: "B106H", file: "form_b106h.pdf", title: "Schedule H: Your Codebtors", chapters: ["7", "13"], required: true, order: 70 },
    { id: "B106I", file: "form_b106i.pdf", title: "Schedule I: Your Income", chapters: ["7", "13"], required: true, order: 80 },
    { id: "B106J", file: "form_b106j.pdf", title: "Schedule J: Your Expenses", chapters: ["7", "13"], required: true, order: 90 },
    { id: "B106J2", file: "form_b106j2.pdf", title: "Schedule J-2: Separate Household Expenses (Debtor 2)", chapters: ["7", "13"], required: false, order: 95 },
    { id: "B106Sum", file: "form_b106sum.pdf", title: "Summary of Assets & Liabilities", chapters: ["7", "13"], required: true, order: 100 },
    { id: "B106Dec", file: "form_b106dec.pdf", title: "Declaration About Individual Debtor's Schedules", chapters: ["7", "13"], required: true, order: 110 },
    { id: "B107", file: "b_107_0425-form.pdf", title: "Statement of Financial Affairs (SOFA)", chapters: ["7", "13"], required: true, order: 120 },
    { id: "B108", file: "form_b108.pdf", title: "Statement of Intention (Chapter 7)", chapters: ["7"], required: true, order: 130 },
    { id: "B2030", file: null, title: "Disclosure of Compensation of Attorney (B2030)", chapters: ["7", "13"], required: true, order: 140 },
    { id: "B122A-1", file: "b_122a-1.pdf", title: "Ch. 7 Statement of Current Monthly Income", chapters: ["7"], required: true, order: 150 },
    { id: "B122A-1Supp", file: "form_b122a-1supp.pdf", title: "Ch. 7 Exemption from Presumption of Abuse", chapters: ["7"], required: false, order: 155 },
    { id: "B122A-2", file: "b_22a2.pdf", title: "Ch. 7 Means Test Calculation", chapters: ["7"], required: false, order: 160 },
    { id: "B122C-1", file: "b_22c1.pdf", title: "Ch. 13 Statement of Current Monthly Income & Commitment", chapters: ["13"], required: true, order: 150 },
    { id: "B122C-2", file: "b_122c-2_0425-form.pdf", title: "Ch. 13 Calculation of Disposable Income", chapters: ["13"], required: false, order: 160 },
    { id: "MDFL_CH13_PLAN", file: "Chapter13Plan_PDFFillable3.pdf", title: "MDFL Chapter 13 Model Plan (Local Form XFA)", chapters: ["13"], required: true, order: 170 },
    { id: "B103A", file: "form_b103a.pdf", title: "Application to Pay Filing Fee in Installments", chapters: ["7", "13"], required: false, order: 180 },
    { id: "B103B", file: "form_b103b.pdf", title: "Application to Waive Chapter 7 Filing Fee", chapters: ["7"], required: false, order: 185 },
    { id: "B101A", file: "form_b101a_0.pdf", title: "Initial Statement About an Eviction Judgment", chapters: ["7", "13"], required: false, order: 190 },
    { id: "B2020", file: "form_b2020_0.pdf", title: "Statement of Military Service", chapters: ["7", "13"], required: false, order: 195 },
    { id: "B2830", file: "form-2830_0425-form.pdf", title: "Ch. 13 DSO & §522(q) Certifications", chapters: ["13"], required: false, order: 200 },
    { id: "MDFL_MATRIX_VERIF", file: null, title: "Tampa Division Verification of Creditor Matrix", chapters: ["7", "13"], required: true, order: 210 },
    { id: "MDFL_MATRIX_PDF", file: null, title: "Creditor Mailing Matrix (3-Column PDF + Creditor.txt)", chapters: ["7", "13"], required: true, order: 220 },
    { id: "B121", file: "form_b121.pdf", title: "Statement About Social Security Numbers (SAVED SEPARATELY - RESTRICTED)", chapters: ["7", "13"], required: true, order: 999, restricted: true },
  ];

  const DEFAULT_SETTINGS = {
    clients_dir: "Browser Download (ZIP)",
    means_test_url: "/means-test/index.html",
    court_district: "Middle District of Florida",
    court_division: "Tampa Division",
    attorney: {
      name: "L. Jill McDonald",
      signature: "/s/ L. Jill McDonald",
      firm_name: "The Law Offices of Jill McDonald",
      street: "7500 65th St. North",
      city: "Pinellas Park",
      state: "FL",
      zip_code: "33781",
      phone: "(727) 231-4300",
      email: "Jill@jillmcdonald.com",
      info_email: "info@jillmcdonald.com",
      bar_number: "0052743",
      bar_state: "FL",
    },
    b2030_defaults: {
      ch7: {
        agreed_fee: 2000.0,
        received_prior: 2000.0,
        filing_fee: 338.0,
        credit_report_fee: 45.0,
        included_other: "$338 Court Filing Fee\n$45 Credit Reports",
        excluded_services: "Adversary Proceedings; Defense of any Post-Petition Motions Filed by Creditors; Reaffirmation Hearing Representation; Preliminary Hearings; or Trials.",
      },
      ch13: {
        agreed_fee: 5358.0,
        received_prior: 1858.0,
        filing_fee: 313.0,
        credit_report_fee: 45.0,
        included_other: "$313 Court Filing Fee\n$45 Credit Reports\nA post-confirmation monthly monitoring fee of $50 is expected.",
        excluded_services: "Adversary Proceedings; Defense of any Post-Petition Motions Filed by Creditors; Preliminary Hearings; or Trials.",
      },
    },
    fl_median_income: {
      effective_label: "US Trustee Florida Median Family Income (Effective July 15, 2026)",
      "1": 69876.0,
      "2": 86523.0,
      "3": 97540.0,
      "4": 114761.0,
      additional_person: 11100.0,
    },
    filing_fees: { ch7: 338.0, ch13: 313.0, amend_matrix: 38.0 },
    thresholds: {
      ch13_combined_debt_limit: 2750000.0,
      fl_vehicle_exemption: 5000.0,
      fl_personal_property_exemption: 1000.0,
      fl_wildcard_exemption: 4000.0,
      homestead_1215_cap: 214000.0,
    },
  };

  function r2(n) { return Math.round((Number(n) || 0) * 100) / 100; }
  function fmtMoney(n) { return (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function fmtDollar(n) { return "$" + fmtMoney(n); }
  function parseMoney(v) {
    const s = String(v || "").replace(/[$,\s]/g, "");
    const m = s.match(/-?\d+(?:\.\d+)?/);
    return m ? r2(parseFloat(m[0])) : 0;
  }
  function sanitizeToken(s) {
    return String(s || "").replace(/[<>:"/\\|?*]+/g, "").replace(/\s+/g, " ").trim();
  }
  function debtorFullName(p) {
    if (!p) return "";
    return [p.first_name, p.middle_name, p.last_name, p.suffix].filter(Boolean).join(" ").trim() || (p.full_name || "").trim();
  }
  function debtorEsig(p) {
    const nm = debtorFullName(p);
    return nm ? `/s/ ${nm}` : "";
  }
  function splitFullName(full) {
    const s = String(full || "").trim();
    if (!s) return ["", "", "", ""];
    const parts = s.split(/\s+/);
    if (parts.length === 1) return [parts[0], "", "", ""];
    if (parts.length === 2) return [parts[0], "", parts[1], ""];
    return [parts[0], parts.slice(1, -1).join(" "), parts[parts.length - 1], ""];
  }
  function splitDateMDY(d) {
    const m = String(d || "").trim().match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})$/);
    if (m) return [m[1].padStart(2, "0"), m[2].padStart(2, "0"), m[3].length === 2 ? "20" + m[3] : m[3]];
    const now = new Date();
    return [String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0"), String(now.getFullYear())];
  }
  function splitStreetNum(street) {
    const m = String(street || "").trim().match(/^(\d+[A-Za-z0-9\-/]*)\s+(.+)$/);
    return m ? [m[1], m[2]] : ["", String(street || "").trim()];
  }

  function makeClientFolderName(c) {
    const d1Last = sanitizeToken(c.debtor1?.last_name);
    const d1First = sanitizeToken(c.debtor1?.first_name);
    if (!d1Last && !d1First) return "Unnamed,Client";
    if (c.is_joint && (c.debtor2?.first_name || c.debtor2?.last_name)) {
      const d2Last = sanitizeToken(c.debtor2?.last_name);
      const d2First = sanitizeToken(c.debtor2?.first_name);
      if (!d2Last || d2Last.toLowerCase() === d1Last.toLowerCase()) {
        return `${d1Last},${d1First} & ${d2First}`.trim();
      }
      return `${d1Last},${d1First} & ${d2Last},${d2First}`.trim();
    }
    return `${d1Last},${d1First}`.replace(/^,|,$/g, "");
  }

  function detectDivision(county) {
    const c = String(county || "").toLowerCase().replace("county", "").trim();
    if (!c) return ["Unknown (enter county)", false];
    for (const [div, set] of Object.entries(MDFL_DIVISIONS)) {
      if (set.has(c)) return [div, div === "Tampa Division"];
    }
    return [`Outside MDFL (${county})`, false];
  }

  function getFlMedianIncome(hh, settings) {
    const tbl = settings?.fl_median_income || DEFAULT_SETTINGS.fl_median_income;
    const n = Math.max(1, parseInt(hh, 10) || 1);
    if (n <= 4) return Number(tbl[String(n)] || 69876);
    return Number(tbl["4"] || 114761) + (n - 4) * Number(tbl.additional_person || 11100);
  }

  function calculateTotals(c, settings) {
    const reTot = (c.real_estate || []).reduce((s, r) => s + Number(r.portion_owned_value || r.market_value || 0), 0);
    const vehTot = (c.vehicles || []).reduce((s, v) => s + Number(v.portion_owned_value || v.market_value || 0), 0);
    const pa = c.personal_assets || {};
    const p3 = (pa.household_goods_val || 0) + (pa.electronics_val || 0) + (pa.collectibles_val || 0) +
      (pa.sports_hobby_val || 0) + (pa.firearms_val || 0) + (pa.clothes_val || 0) +
      (pa.jewelry_val || 0) + (pa.animals_val || 0) + (pa.other_household_val || 0);
    const banks = (pa.bank_accounts || []).reduce((s, b) => s + Number(b.balance || 0), 0);
    const rets = (pa.retirement_accounts || []).reduce((s, b) => s + Number(b.balance || 0), 0);
    const p4 = (pa.cash_on_hand || 0) + banks + rets + (pa.security_deposit_rent_val || 0) +
      (pa.security_deposit_utility_val || 0) + (pa.tax_refund_val || 0) + (pa.life_insurance_cash_val || 0) +
      (pa.other_financial_val || 0) + (pa.annuities_val || 0) + (pa.stocks_bonds_val || 0);
    const p5 = (pa.tools_of_trade_val || 0) + (pa.inventory_val || 0) + (pa.other_business_val || 0);
    const p7 = pa.other_property_val || 0;
    const persTot = vehTot + p3 + p4 + p5 + p7;
    const allAssets = reTot + persTot;

    const secTot = (c.secured_creditors || []).reduce((s, x) => s + Number(x.claim_amount || 0), 0);
    const pri = (c.unsecured_creditors || []).filter((x) => x.priority);
    const nonp = (c.unsecured_creditors || []).filter((x) => !x.priority);
    const priTot = pri.reduce((s, x) => s + Number(x.total_claim || 0), 0);
    const nonpTot = nonp.reduce((s, x) => s + Number(x.total_claim || 0), 0);
    const totalLiab = secTot + priTot + nonpTot;

    const empTot = (inc = {}) => {
      const gross = Number(inc.monthly_gross_wages || 0) + Number(inc.monthly_overtime || 0);
      const deds = Number(inc.ded_taxes || 0) + Number(inc.ded_mandatory_ret || 0) + Number(inc.ded_voluntary_ret || 0) +
        Number(inc.ded_ret_loan || 0) + Number(inc.ded_insurance || 0) + Number(inc.ded_dso || 0) +
        Number(inc.ded_union || 0) + Number(inc.ded_other || 0);
      const take = Math.max(0, gross - deds);
      const oth = Number(inc.net_business_rental || 0) + Number(inc.interest_dividends || 0) + Number(inc.family_support || 0) +
        Number(inc.unemployment || 0) + Number(inc.social_security || 0) + Number(inc.gov_assistance || 0) +
        Number(inc.pension_retirement || 0) + Number(inc.other_income || 0);
      return { gross: r2(gross), deductions: r2(deds), take_home: r2(take), other_income: r2(oth), total: r2(take + oth) };
    };
    const d1Inc = empTot(c.income_debtor1);
    const d2Inc = empTot(c.income_debtor2);
    const combined10 = r2(d1Inc.total + (c.is_joint ? d2Inc.total : 0));
    const combinedInc = r2(combined10 + Number(c.household_contributions_monthly || 0));

    const e = c.expenses || {};
    const expKeys = [
      "rent_or_mortgage", "real_estate_taxes", "home_insurance", "home_maintenance", "hoa_dues",
      "additional_mortgage", "electricity_heat_gas", "water_sewer_garbage", "phone_cell_internet_cable",
      "other_utilities", "food_housekeeping", "childcare_education", "clothing_laundry", "personal_care",
      "medical_dental", "transportation", "entertainment_recreation", "charitable", "life_insurance",
      "health_insurance", "vehicle_insurance", "other_insurance", "taxes_other", "vehicle_payment_1",
      "vehicle_payment_2", "installment_other_1", "installment_other_2", "alimony_support", "support_others",
      "other_prop_mortgage", "other_prop_taxes", "other_prop_insurance", "other_prop_maintenance",
      "other_prop_hoa", "other_expense",
    ];
    const totalExp = r2(expKeys.reduce((s, k) => s + Number(e[k] || 0), 0));
    const netInc = r2(combinedInc - totalExp);

    const mt = c.means_test || {};
    const hhSize = Math.max(1, parseInt(c.household_size || mt.household_size || 1, 10));
    const median = mt.source === "external_site" && mt.fl_median_income > 0 ? Number(mt.fl_median_income) : getFlMedianIncome(hhSize, settings);
    let totalCmi = 0;
    if (mt.source === "external_site") {
      totalCmi = r2(mt.total_cmi || 0);
    } else {
      const i1 = c.income_debtor1 || {};
      const i2 = c.income_debtor2 || {};
      const c1 = (i1.monthly_gross_wages || 0) + (i1.monthly_overtime || 0) + (i1.family_support || 0) +
        (i1.net_business_rental || 0) + (i1.interest_dividends || 0) + (i1.unemployment || 0) +
        (i1.pension_retirement || 0) + (i1.other_income || 0) + (c.household_contributions_monthly || 0);
      const c2 = (c.is_joint || c.sofa?.marital_status === "Married")
        ? (i2.monthly_gross_wages || 0) + (i2.monthly_overtime || 0) + (i2.family_support || 0) +
          (i2.net_business_rental || 0) + (i2.interest_dividends || 0) + (i2.unemployment || 0) +
          (i2.pension_retirement || 0) + (i2.other_income || 0)
        : 0;
      totalCmi = r2(Math.max(0, c1 + c2 - Number(mt.marital_adjustment || 0)));
    }
    const annCmi = r2(totalCmi * 12);
    const above = annCmi > median;

    return {
      real_estate_total: r2(reTot), vehicles_total: r2(vehTot), personal_property_total: r2(persTot),
      all_assets_total: r2(allAssets), secured_total: r2(secTot), priority_total: r2(priTot),
      nonpriority_total: r2(nonpTot), total_liabilities: r2(totalLiab),
      d1_income: d1Inc, d2_income: d2Inc, combined_line10: combined10, combined_monthly_income: combinedInc,
      total_expenses: totalExp, monthly_net_income: netInc,
      household_size: hhSize, fl_median_income: r2(median), total_cmi: totalCmi,
      annualized_cmi: annCmi, above_median: above, commitment_years: above ? 5 : 3,
      creditor_count: (c.secured_creditors?.length || 0) + (c.unsecured_creditors?.length || 0),
    };
  }

  function autoApplyFloridaExemptions(c, settings) {
    const scheme = String(c.exemption_scheme || "FL").toUpperCase();
    const mult = c.is_joint ? 2 : 1;
    const pa = c.personal_assets || {};
    const out = [];

    if (scheme === "FEDERAL") {
      const homeCap = 31575 * mult;
      let homeUsed = 0;
      (c.real_estate || []).forEach((prop, idx) => {
        const val = Number(prop.portion_owned_value || prop.market_value || 0);
        if (prop.is_primary_residence && val > 0 && String(prop.intent || "").toLowerCase() !== "surrender") {
          const mort = (c.secured_creditors || [])
            .filter((sc) => prop.address && (sc.collateral_desc || "").toLowerCase().includes(prop.address.toLowerCase().slice(0, 12)))
            .reduce((s, sc) => s + Number(sc.claim_amount || 0), 0);
          const eq = mort > 0 ? Math.max(0, r2(val - mort)) : val;
          const cl = r2(Math.min(eq, Math.max(0, homeCap - homeUsed)));
          if (cl > 0) {
            homeUsed = r2(homeUsed + cl);
            out.push({
              schedule_ab_line: `1.${idx + 1}`,
              description: [prop.address, prop.city, `${prop.state} ${prop.zip_code}`.trim()].filter(Boolean).join(", ") || "Primary Residence",
              current_value: val, exemption_amount: cl, claim_100_percent: false,
              statute: "11 U.S.C. § 522(d)(1)", exemption_id: "fed_homestead",
            });
          }
        }
      });
      let vehRem = 5025 * mult;
      (c.vehicles || []).forEach((v, idx) => {
        const val = Number(v.portion_owned_value || v.market_value || 0);
        if (val <= 0 || String(v.intent || "").toLowerCase() === "surrender") return;
        const eq = Math.max(0, r2(val - Number(v.payoff || 0)));
        if (eq > 0 && vehRem > 0) {
          const cl = r2(Math.min(eq, vehRem));
          vehRem = r2(vehRem - cl);
          out.push({
            schedule_ab_line: `3.${idx + 1}`,
            description: `${v.year || ""} ${v.make || ""} ${v.model || ""}`.trim(),
            current_value: val, exemption_amount: cl, claim_100_percent: false,
            statute: "11 U.S.C. § 522(d)(2)", exemption_id: "fed_vehicle",
          });
        }
      });
      let wildRem = r2((1675 * mult) + Math.min(Math.max(0, homeCap - homeUsed), 15800 * mult));
      let hhRem = 16850 * mult;
      let jewelRem = 2125 * mult;
      const hhBuckets = [
        ["6", pa.household_goods_desc || "Misc. Household Goods", pa.household_goods_val || 0],
        ["7", pa.electronics_desc || "Electronics", pa.electronics_val || 0],
        ["11", pa.clothes_desc || "Clothing and Accessories", pa.clothes_val || 0],
        ["13", pa.animals_desc || "Pets / Animals", pa.animals_val || 0],
        ["14", pa.other_household_desc || "Other Household Items", pa.other_household_val || 0],
      ];
      for (const [ln, desc, val] of hhBuckets) {
        if (val <= 0) continue;
        let left = val;
        if (hhRem > 0) {
          const cl = r2(Math.min(val, hhRem));
          hhRem = r2(hhRem - cl);
          left = r2(val - cl);
          out.push({ schedule_ab_line: ln, description: String(desc).slice(0, 150), current_value: val, exemption_amount: cl, claim_100_percent: false, statute: "11 U.S.C. § 522(d)(3)", exemption_id: "fed_household" });
        }
        if (left > 0 && wildRem > 0) {
          const wcl = r2(Math.min(left, wildRem));
          wildRem = r2(wildRem - wcl);
          out.push({ schedule_ab_line: ln, description: String(desc).slice(0, 150), current_value: val, exemption_amount: wcl, claim_100_percent: false, statute: "11 U.S.C. § 522(d)(5)", exemption_id: "fed_wildcard" });
        }
      }
      if ((pa.jewelry_val || 0) > 0) {
        const jv = pa.jewelry_val;
        let left = jv;
        if (jewelRem > 0) {
          const cl = r2(Math.min(jv, jewelRem));
          jewelRem = r2(jewelRem - cl);
          left = r2(jv - cl);
          out.push({ schedule_ab_line: "12", description: String(pa.jewelry_desc || "Jewelry").slice(0, 150), current_value: jv, exemption_amount: cl, claim_100_percent: false, statute: "11 U.S.C. § 522(d)(4)", exemption_id: "fed_jewelry" });
        }
        if (left > 0 && wildRem > 0) {
          const wcl = r2(Math.min(left, wildRem));
          wildRem = r2(wildRem - wcl);
          out.push({ schedule_ab_line: "12", description: String(pa.jewelry_desc || "Jewelry").slice(0, 150), current_value: jv, exemption_amount: wcl, claim_100_percent: false, statute: "11 U.S.C. § 522(d)(5)", exemption_id: "fed_wildcard" });
        }
      }
      const wBuckets = [
        ["8", pa.collectibles_desc || "Collectibles", pa.collectibles_val || 0],
        ["9", pa.sports_hobby_desc || "Sports & Hobby Equipment", pa.sports_hobby_val || 0],
        ["10", pa.firearms_desc || "Firearms", pa.firearms_val || 0],
        ["16", "Cash on Hand", pa.cash_on_hand || 0],
      ];
      (pa.bank_accounts || []).forEach((b, i) => { if (b.balance > 0) wBuckets.push([`17.${i + 1}`, `${b.account_type}: ${b.institution}${b.account_last4 ? ` (x${b.account_last4})` : ""}`, b.balance]); });
      if (pa.security_deposit_rent_val > 0) wBuckets.push(["22", `Security Deposit: ${pa.security_deposit_landlord}`, pa.security_deposit_rent_val]);
      if (pa.tax_refund_val > 0) wBuckets.push(["28", pa.tax_refund_desc || "Tax Refund", pa.tax_refund_val]);
      for (const [ln, desc, val] of wBuckets) {
        if (val <= 0 || wildRem <= 0) continue;
        const wcl = r2(Math.min(val, wildRem));
        wildRem = r2(wildRem - wcl);
        out.push({ schedule_ab_line: ln, description: String(desc).slice(0, 150), current_value: val, exemption_amount: wcl, claim_100_percent: false, statute: "11 U.S.C. § 522(d)(5)", exemption_id: "fed_wildcard" });
      }
      (pa.retirement_accounts || []).forEach((r) => {
        if (r.balance > 0) out.push({ schedule_ab_line: "21", description: `${r.account_type}: ${r.institution}${r.account_last4 ? ` (x${r.account_last4})` : ""}`, current_value: r.balance, exemption_amount: r.balance, claim_100_percent: true, statute: "11 U.S.C. § 522(d)(12)", exemption_id: "fed_retirement" });
      });
      return out;
    }

    const th = settings?.thresholds || DEFAULT_SETTINGS.thresholds;
    let vehRem = Number(th.fl_vehicle_exemption || 5000) * mult;
    let persRem = Number(th.fl_personal_property_exemption || 1000) * mult;
    const wildCap = Number(th.fl_wildcard_exemption || 4000) * mult;
    let hasHomestead = false;

    (c.real_estate || []).forEach((prop, idx) => {
      const val = Number(prop.portion_owned_value || prop.market_value || 0);
      if (prop.is_primary_residence && val > 0 && String(prop.intent || "").toLowerCase() !== "surrender") {
        const mort = (c.secured_creditors || [])
          .filter((sc) => prop.address && (sc.collateral_desc || "").toLowerCase().includes(prop.address.toLowerCase().slice(0, 12)))
          .reduce((s, sc) => s + Number(sc.claim_amount || 0), 0);
        const eq = mort > 0 ? Math.max(0, r2(val - mort)) : val;
        hasHomestead = true;
        out.push({
          schedule_ab_line: `1.${idx + 1}`,
          description: [prop.address, prop.city, `${prop.state} ${prop.zip_code}`.trim()].filter(Boolean).join(", ") || "Primary Residence",
          current_value: val, exemption_amount: eq, claim_100_percent: false,
          statute: "Fla. Const. art. X § 4(a)(1); Fla. Stat. Ann. §§ 222.01, .02",
          exemption_id: "fl_homestead",
        });
      }
    });

    (c.vehicles || []).forEach((v, idx) => {
      const val = Number(v.portion_owned_value || v.market_value || 0);
      if (val <= 0 || String(v.intent || "").toLowerCase() === "surrender") return;
      const eq = Math.max(0, r2(val - Number(v.payoff || 0)));
      if (eq > 0 && vehRem > 0) {
        const cl = r2(Math.min(eq, vehRem));
        vehRem = r2(vehRem - cl);
        out.push({
          schedule_ab_line: `3.${idx + 1}`,
          description: `${v.year || ""} ${v.make || ""} ${v.model || ""}`.trim(),
          current_value: val, exemption_amount: cl, claim_100_percent: false,
          statute: "Fla. Stat. Ann. § 222.25(1)",
          exemption_id: "fl_vehicle",
        });
      }
    });

    let wildRem = hasHomestead ? 0 : wildCap;
    const buckets = [
      ["6", pa.household_goods_desc || "Misc. Household Goods", pa.household_goods_val || 0],
      ["7", pa.electronics_desc || "Electronics", pa.electronics_val || 0],
      ["8", pa.collectibles_desc || "Collectibles", pa.collectibles_val || 0],
      ["9", pa.sports_hobby_desc || "Sports & Hobby Equipment", pa.sports_hobby_val || 0],
      ["10", pa.firearms_desc || "Firearms", pa.firearms_val || 0],
      ["11", pa.clothes_desc || "Clothing and Accessories", pa.clothes_val || 0],
      ["12", pa.jewelry_desc || "Jewelry", pa.jewelry_val || 0],
      ["13", pa.animals_desc || "Pets / Animals", pa.animals_val || 0],
      ["14", pa.other_household_desc || "Other Household Items", pa.other_household_val || 0],
      ["16", "Cash on Hand", pa.cash_on_hand || 0],
    ];
    (pa.bank_accounts || []).forEach((b, i) => {
      if (b.balance > 0) buckets.push([`17.${i + 1}`, `${b.account_type}: ${b.institution}${b.account_last4 ? ` (x${b.account_last4})` : ""}`, b.balance]);
    });
    if (pa.security_deposit_rent_val > 0) buckets.push(["22", `Security Deposit: ${pa.security_deposit_landlord}`, pa.security_deposit_rent_val]);
    if (pa.tax_refund_val > 0) buckets.push(["28", pa.tax_refund_desc || "Tax Refund", pa.tax_refund_val]);

    for (const [lineNo, desc, val] of buckets) {
      if (val <= 0) continue;
      let left = val;
      if (persRem > 0) {
        const cl = r2(Math.min(val, persRem));
        persRem = r2(persRem - cl);
        left = r2(val - cl);
        out.push({
          schedule_ab_line: lineNo, description: String(desc).slice(0, 150),
          current_value: val, exemption_amount: cl, claim_100_percent: false,
          statute: "Fla. Const. art. X, § 4(a)(2)",
          exemption_id: "fl_personal",
        });
      }
      if (left > 0 && wildRem > 0) {
        const wcl = r2(Math.min(left, wildRem));
        wildRem = r2(wildRem - wcl);
        out.push({
          schedule_ab_line: lineNo, description: String(desc).slice(0, 150),
          current_value: val, exemption_amount: wcl, claim_100_percent: false,
          statute: "Fla. Stat. Ann. § 222.25(4) (Wildcard)",
          exemption_id: "fl_wildcard",
        });
      }
    }
    (pa.retirement_accounts || []).forEach((r) => {
      if (r.balance > 0) {
        out.push({
          schedule_ab_line: "21", description: `${r.account_type}: ${r.institution}${r.account_last4 ? ` (x${r.account_last4})` : ""}`,
          current_value: r.balance, exemption_amount: r.balance, claim_100_percent: true,
          statute: "Fla. Stat. Ann. § 222.21(2)",
          exemption_id: "fl_retirement",
        });
      }
    });
    if ((pa.life_insurance_cash_val || 0) > 0) {
      out.push({
        schedule_ab_line: "31", description: `Life Insurance: ${pa.life_insurance_company || ""}`.trim(),
        current_value: pa.life_insurance_cash_val, exemption_amount: pa.life_insurance_cash_val, claim_100_percent: true,
        statute: "Fla. Stat. Ann. § 222.14", exemption_id: "fl_life_annuity",
      });
    }
    return out;
  }

  function selectFormsForCase(c, settings) {
    const totals = calculateTotals(c, settings);
    const ch = String(c.chapter || "7");
    const sel = [];
    for (const f of FORM_CATALOG) {
      if (!f.chapters.includes(ch)) continue;
      const id = f.id;
      if (f.required) sel.push(id);
      else if (id === "B106J2" && c.is_joint && c.expenses?.separate_household_debtor2) sel.push(id);
      else if (id === "B122A-2" && ch === "7" && totals.above_median && !c.means_test?.exempt_from_means_test) sel.push(id);
      else if (id === "B122A-1Supp" && ch === "7" && c.means_test?.exempt_from_means_test) sel.push(id);
      else if (id === "B122C-2" && ch === "13" && totals.above_median) sel.push(id);
      else if (id === "B103A" && c.fee_payment_method === "installments") sel.push(id);
      else if (id === "B103B" && ch === "7" && c.fee_payment_method === "waiver") sel.push(id);
      else if (id === "B101A" && c.rents_residence && c.has_eviction_judgment) sel.push(id);
      else if (id === "B2020" && c.military_service) sel.push(id);
    }
    return sel;
  }

  function runComplianceChecks(c, settings) {
    const checks = [];
    const totals = calculateTotals(c, settings);
    const th = settings?.thresholds || DEFAULT_SETTINGS.thresholds;
    const [div, isTampa] = detectDivision(c.debtor1?.county);
    checks.push(
      isTampa
        ? { level: "ok", code: "VENUE", title: `Tampa Division Venue Confirmed (${c.debtor1.county} County)`, detail: "Sam M. Gibbons U.S. Courthouse, 801 N. Florida Ave., Suite 555, Tampa, FL 33602." }
        : { level: "warn", code: "VENUE", title: `Verify MDFL Division: ${div}`, detail: "Tampa Division covers Hardee, Hernando, Hillsborough, Manatee, Pasco, Pinellas, Polk, and Sarasota counties." }
    );
    if (String(c.chapter) === "13") {
      const lim = Number(th.ch13_combined_debt_limit || 2750000);
      checks.push(
        totals.total_liabilities > lim
          ? { level: "error", code: "CH13_LIMIT", title: `Exceeds Ch. 13 Debt Limit (${fmtDollar(lim)})`, detail: `Total scheduled debt is ${fmtDollar(totals.total_liabilities)} (H.R. 7730 Nov. 2026 limit: ${fmtDollar(lim)}).` }
          : { level: "ok", code: "CH13_LIMIT", title: `Within Ch. 13 Debt Limit (${fmtDollar(lim)})`, detail: `Total debt ${fmtDollar(totals.total_liabilities)} is within the H.R. 7730 limit.` }
      );
    }
    checks.push(
      totals.above_median
        ? { level: "warn", code: "MEANS_TEST", title: `Above FL Median Income (${fmtDollar(totals.annualized_cmi)} vs ${fmtDollar(totals.fl_median_income)})`, detail: String(c.chapter) === "7" ? "Form 122A-2 auto-selected." : "5-year commitment period (Form 122C-2 auto-selected)." }
        : { level: "ok", code: "MEANS_TEST", title: `Below FL Median Income (${fmtDollar(totals.annualized_cmi)} <= ${fmtDollar(totals.fl_median_income)})`, detail: String(c.chapter) === "7" ? "No presumption of abuse." : "3-year applicable commitment period." }
    );
    const _parseFlexDate = (raw) => {
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
      return null;
    };
    const ccDt = _parseFlexDate(c.credit_counseling_date);
    const filDt = _parseFlexDate(c.filing_date) || new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    if (!c.credit_counseling_completed) {
      checks.push({ level: "error", code: "CC_CERT", title: "Credit Counseling Certificate Required (11 U.S.C. § 109(h))", detail: "Complete briefing via Debtorcc.org within 180 days prior to filing." });
    } else if (!ccDt) {
      checks.push({ level: "warn", code: "CC_DATE_MISSING", title: "Credit Counseling Date Not Entered", detail: "Enter the Credit Counseling completion date on Tab 1 to verify the 180-day statutory window (11 U.S.C. § 109(h))." });
    } else {
      const days = Math.round((filDt.getTime() - ccDt.getTime()) / 86400000);
      const exp = new Date(ccDt.getTime() + 180 * 86400000);
      const expStr = `${String(exp.getMonth() + 1).padStart(2, "0")}/${String(exp.getDate()).padStart(2, "0")}/${exp.getFullYear()}`;
      if (days > 180) {
        checks.push({ level: "error", code: "CC_180_EXPIRED", title: `Credit Counseling EXPIRED (${days} days > 180-day limit)`, detail: `Certificate dated ${c.credit_counseling_date} expired on ${expStr}. Under 11 U.S.C. § 109(h), the debtor MUST retake credit counseling via Debtorcc.org before filing!` });
      } else if (days < 0) {
        checks.push({ level: "error", code: "CC_AFTER_FILING", title: `Credit Counseling Date (${c.credit_counseling_date}) is AFTER Filing Date`, detail: "Under 11 U.S.C. § 109(h), credit counseling must be completed on or before the filing date." });
      } else if (days >= 165) {
        checks.push({ level: "warn", code: "CC_EXPIRING_SOON", title: `Credit Counseling Expiring Soon (${days}/180 days — ${180 - days} day(s) left)`, detail: `Certificate expires on ${expStr}. File on or before ${expStr} or obtain a fresh certificate from Debtorcc.org.` });
      } else {
        checks.push({ level: "ok", code: "CC_CERT", title: `Credit Counseling Valid (${days} of 180 days — expires ${expStr})`, detail: `Certificate (${c.credit_counseling_agency || "Debtorcc.org"}) is within the 180-day window. File separately on CM/ECF.` });
      }
    }
    const scheme = String(c.exemption_scheme || "FL").toUpperCase();
    if (scheme !== "FL") {
      checks.push({
        level: "warn",
        code: "EXEMPT_OVERRIDE",
        title: `Exemption Override Active: ${scheme === "FEDERAL" ? "Federal 11 U.S.C. § 522(d)" : scheme + " State Exemptions"}`,
        detail: "Florida opt-out exemptions overridden. Confirm 730-day domicile eligibility under 11 U.S.C. § 522(b)(3)(A).",
      });
    }
    checks.push({
      level: c.debtor1?.ssn || c.debtor1?.ssn_last4 ? "ok" : "warn",
      code: "SSN_PRIVACY",
      title: c.debtor1?.ssn || c.debtor1?.ssn_last4 ? "FRBP 1007(f) SSN Separation Active" : "Debtor 1 SSN Missing",
      detail: "Form B121 (full SSN) is saved separately and EXCLUDED from the combined public petition PDF.",
    });
    return checks;
  }

  function collectMatrixEntries(c) {
    const raw = [];
    for (const sc of (c.secured_creditors || [])) raw.push([sc.name, sc.attn, sc.street, sc.city, sc.state, sc.zip_code]);
    for (const uc of (c.unsecured_creditors || [])) raw.push([uc.name, uc.attn, uc.street, uc.city, uc.state, uc.zip_code]);
    for (const ec of (c.executory_contracts || [])) raw.push([ec.name, "", ec.street, ec.city, ec.state, ec.zip_code]);
    for (const cb of (c.codebtors || [])) raw.push([cb.name, "", cb.street, cb.city, cb.state, cb.zip_code]);

    const seen = new Set();
    const out = [];
    for (const [name, attn, street, city, st, zp] of raw) {
      const nm = String(name || "").trim();
      if (!nm) continue;
      const csz = `${String(city || "").trim()}, ${String(st || "").trim().toUpperCase()} ${String(zp || "").trim()}`.replace(/^,|,$/g, "").trim();
      const key = `${nm.toLowerCase()}|${String(street || "").trim().toLowerCase()}|${csz.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const lines = [nm];
      if (attn && attn.trim()) lines.push(attn.trim());
      if (street && street.trim()) lines.push(street.trim());
      if (csz) lines.push(csz);
      out.push(lines);
    }
    out.sort((a, b) => a[0].toLowerCase().localeCompare(b[0].toLowerCase()));
    return out;
  }

  function buildMatrixPreview(c) {
    const entries = collectMatrixEntries(c);
    const blocks = [];
    const warnings = [];
    for (let blk of entries) {
      if (blk.length > 4) blk = [blk[0], blk[1], blk[2], blk[blk.length - 1]];
      const clean = blk.map((ln) => {
        const s = ln.replace(/\s+/g, " ").trim();
        if (s.length > 28) {
          warnings.push(`Line > 28 chars truncated: '${s}' -> '${s.slice(0, 28)}'`);
          return s.slice(0, 28).trimEnd();
        }
        return s;
      });
      blocks.push(clean.join("\r\n"));
    }
    return { count: blocks.length, text: blocks.join("\r\n\r\n") + (blocks.length ? "\r\n" : ""), warnings };
  }

  /**
   * Parse filled 'CIF - The ReAwakening.pdf' bytes in pure JS via pdf-lib
   */
  async function parseCifBytes(pdfBytes, filename, chapter, settings, blankCaseFactory) {
    const doc = await window.PDFLib.PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const form = doc.getForm();
    const fields = {};
    for (const f of form.getFields()) {
      const name = f.getName();
      let val = "";
      try {
        if (typeof f.getText === "function") val = (f.getText() || "").trim();
        else if (typeof f.isChecked === "function") val = f.isChecked() ? "Yes" : "";
        else if (typeof f.getSelected === "function") {
          const sel = f.getSelected();
          val = Array.isArray(sel) ? sel.join(", ") : String(sel || "");
        }
      } catch (_) {}
      if (val && (!fields[name] || fields[name] === "Off")) fields[name] = val;
    }

    const get = (...keys) => {
      for (const k of keys) {
        const v = String(fields[k] || "").trim();
        if (v && !["n/a", "na", "none", "off"].includes(v.toLowerCase())) return v;
      }
      return "";
    };
    const money = (...keys) => {
      for (const k of keys) {
        const v = parseMoney(fields[k]);
        if (v > 0) return v;
      }
      return 0;
    };

    const c = blankCaseFactory(chapter);
    c.cif_source_filename = filename;
    c.credit_counseling_agency = "Debtorcc.org";

    const d1Full = get("Your Name");
    const [f1, m1, l1, suf1] = splitFullName(d1Full);
    c.debtor1.full_name = d1Full;
    c.debtor1.first_name = f1;
    c.debtor1.middle_name = m1;
    c.debtor1.last_name = l1;
    c.debtor1.suffix = suf1;
    c.debtor1.dob = get("Date of Birth");
    c.debtor1.ssn = get("Social Security Number");
    const s1d = c.debtor1.ssn.replace(/\D/g, "");
    c.debtor1.ssn_last4 = s1d.length >= 4 ? s1d.slice(-4) : "";
    c.debtor1.street = get("Street Address");
    const csz1 = get("City State Zip");
    const cm1 = csz1.match(/^([^,]+),?\s+([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/);
    if (cm1) { c.debtor1.city = cm1[1].trim(); c.debtor1.state = cm1[2].toUpperCase(); c.debtor1.zip_code = cm1[3]; }
    else { c.debtor1.city = csz1; }
    c.debtor1.county = get("County of Residence");
    c.debtor1.length_at_address = get("Length of Time at Address");
    c.debtor1.mobile_phone = get("Mobile Phone", "Home Phone");
    c.debtor1.email = get("Email Address");

    const d2Full = get("Spouses Name");
    if (d2Full) {
      const [f2, m2, l2, suf2] = splitFullName(d2Full);
      c.debtor2.full_name = d2Full;
      c.debtor2.first_name = f2;
      c.debtor2.middle_name = m2;
      c.debtor2.last_name = l2;
      c.debtor2.suffix = suf2;
      c.debtor2.dob = get("Date of Birth_2");
      c.debtor2.ssn = get("Social Security Number_2");
      const s2d = c.debtor2.ssn.replace(/\D/g, "");
      c.debtor2.ssn_last4 = s2d.length >= 4 ? s2d.slice(-4) : "";
      c.sofa.marital_status = "Married";
    }

    // Employment & Expenses highlights
    c.income_debtor1.employer_name = get("Name of Employer");
    c.income_debtor1.occupation = get("Job Title");
    c.income_debtor1.how_long = get("Length of Employment");
    c.income_debtor1.employed = Boolean(c.income_debtor1.employer_name);
    c.income_debtor1.monthly_gross_wages = money("Gross Pay before taxes");
    c.income_debtor1.ded_taxes = money("Taxes");
    c.income_debtor1.ded_insurance = money("Health Insurance");

    c.expenses.rent_or_mortgage = money("Monthly Rent or Mortgage");
    c.expenses.electricity_heat_gas = money("Electric");
    c.expenses.water_sewer_garbage = money("WaterSewerTrash");
    c.expenses.phone_cell_internet_cable = r2(money("Cell Phone") + money("InternetCable"));
    c.expenses.food_housekeeping = money("FoodGroceries");
    c.expenses.vehicle_insurance = money("Auto Insurance");
    c.expenses.transportation = money("Gasoline  Vehicle Maintenance");

    const [divName] = detectDivision(c.debtor1.county);
    if (divName.includes("Division")) c.division = divName;
    c.exemptions = autoApplyFloridaExemptions(c, settings);
    c.selected_forms = selectFormsForCase(c, settings);
    if (!c.unsecured_creditors.length) {
      c.cif_raw_warnings.push("No unsecured creditors were on the CIF (uses separate Debt Sheets). Add creditors in Tab 3 or import CSV.");
    }
    return c;
  }

  function parseCreditorsCsv(csvText) {
    const lines = csvText.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return { secured: [], unsecured: [] };
    const parseRow = (ln) => {
      const out = [];
      let cur = "", inQ = false;
      for (let i = 0; i < ln.length; i++) {
        const ch = ln[i];
        if (ch === '"') inQ = !inQ;
        else if (ch === "," && !inQ) { out.push(cur.trim()); cur = ""; }
        else cur += ch;
      }
      out.push(cur.trim());
      return out;
    };
    const headers = parseRow(lines[0]).map((h) => h.toLowerCase());
    const pick = (row, ...keys) => {
      for (const k of keys) {
        const idx = headers.findIndex((h) => h.includes(k));
        if (idx >= 0 && row[idx]) return row[idx];
      }
      return "";
    };
    const secured = [], unsecured = [];
    for (let i = 1; i < lines.length; i++) {
      const row = parseRow(lines[i]);
      const name = pick(row, "creditor", "name", "company", "lender");
      if (!name) continue;
      const street = pick(row, "street", "address");
      const city = pick(row, "city");
      const state = pick(row, "state", "st").toUpperCase().slice(0, 2);
      const zip = pick(row, "zip", "postal");
      const acct = pick(row, "account", "acct", "last4").replace(/\D/g, "").slice(-4);
      const bal = parseMoney(pick(row, "balance", "amount", "claim", "total"));
      const dt = pick(row, "date", "incurred", "opened");
      const sched = pick(row, "schedule", "category").toLowerCase();
      const ctype = pick(row, "type", "description") || "CreditCard";
      if (sched === "d" || sched === "secured") {
        secured.push({ name, attn: "Attn: Bankruptcy", street, city, state, zip_code: zip, account_last4: acct, date_incurred: dt, collateral_desc: ctype, claim_amount: bal, collateral_value: 0, owner: "debtor1", intent: "Keep", notice_parties: [] });
      } else {
        const priority = sched === "e" || sched === "priority" || /tax|irs|child|dso|alimony/i.test(ctype);
        unsecured.push({
          priority, name, attn: "Attn: Bankruptcy", street, city, state, zip_code: zip,
          account_last4: acct, date_incurred: dt, total_claim: bal, priority_amount: priority ? bal : 0,
          owner: "debtor1", claim_type: priority ? (/tax|irs/i.test(ctype) ? "Taxes" : "DSO") : (/student/i.test(ctype) ? "StudentLoan" : "Other"),
          claim_type_specify: ctype, notice_parties: [],
        });
      }
    }
    return { secured, unsecured };
  }

  /* ==================== PDF-LIB GENERATION (ARIAL/HELVETICA 9 PT + /s/ E-SIGS) ==================== */
  async function loadTemplateDoc(filename) {
    const resp = await fetch(`/Templates/${filename}`);
    if (!resp.ok) throw new Error(`Could not load official template /Templates/${filename}`);
    const bytes = await resp.arrayBuffer();
    return window.PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
  }

  function safeSetText(form, name, val, helvFont) {
    if (val === undefined || val === null) return;
    try {
      const f = form.getTextField(name);
      f.setFontSize(9);
      f.setText(String(val));
      if (helvFont) f.updateAppearances(helvFont);
    } catch (_) {
      try {
        const dd = form.getDropdown(name);
        const opts = dd.getOptions();
        const match = opts.find((o) => o.trim().toLowerCase() === String(val).trim().toLowerCase());
        dd.select(match || String(val));
      } catch (__) {}
    }
  }

  function safeCheck(form, name) {
    try { form.getCheckBox(name).check(); } catch (_) {}
  }

  function fillCommonHeader(form, c, helvFont) {
    const d1 = debtorFullName(c.debtor1);
    const d2 = c.is_joint ? debtorFullName(c.debtor2) : "";
    for (const k of ["Debtor 1", "Debtor1.Name"]) safeSetText(form, k, d1, helvFont);
    for (const k of ["Debtor 2", "Debtor2.Name"]) safeSetText(form, k, d2, helvFont);
    for (const k of ["Case number", "Case number1"]) safeSetText(form, k, c.case_number || "", helvFont);
    safeSetText(form, "Bankruptcy District Information", c.district || "Middle District of Florida", helvFont);
  }

  async function buildB2030Bytes(c, settings) {
    const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
    const doc = await PDFDocument.create();
    const reg = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const ital = await doc.embedFont(StandardFonts.HelveticaOblique);
    const att = settings.attorney || DEFAULT_SETTINGS.attorney;
    const fee = c.attorney_fees || {};
    const bal = Math.max(0, r2((fee.agreed_fee || 0) - (fee.received_prior || 0)));
    const d1 = debtorFullName(c.debtor1);
    const d2 = c.is_joint ? debtorFullName(c.debtor2) : "";
    const titleName = d2 ? `${d1} and ${d2}` : d1;

    const p1 = doc.addPage([612, 792]);
    const fs = 9;
    const drawC = (pg, txt, y, font, sz) => pg.drawText(txt, { x: (612 - font.widthOfTextAtSize(txt, sz)) / 2, y, size: sz, font });
    p1.drawText("B2030 (Form 2030) (12/15)", { x: 54, y: 745, size: fs, font: reg });
    drawC(p1, "United States Bankruptcy Court", 716, bold, 12);
    drawC(p1, c.district || "Middle District of Florida", 701, reg, 10);
    p1.drawText("In re", { x: 54, y: 673, size: fs, font: bold });
    p1.drawText(titleName, { x: 90, y: 673, size: fs, font: bold });
    p1.drawText(`Case No.  ${c.case_number || ""}`, { x: 338, y: 659, size: fs, font: reg });
    p1.drawText(c.is_joint ? "Debtor(s)" : "Debtor", { x: 54, y: 631, size: fs, font: bold });
    p1.drawText(`Chapter      ${c.chapter}`, { x: 338, y: 631, size: fs, font: reg });
    drawC(p1, "DISCLOSURE OF COMPENSATION OF ATTORNEY FOR DEBTOR", 595, bold, 10.5);

    p1.drawText("1.  Pursuant to 11 U.S.C. § 329(a) and Fed. Bankr. P. 2016(b), I certify that I am the attorney for the above named debtor(s):", { x: 54, y: 565, size: fs, font: reg });
    const rows = [
      ["For legal services, I have agreed to accept", fmtDollar(fee.agreed_fee)],
      ["Prior to the filing of this statement I have received", fmtDollar(fee.received_prior)],
      ["Balance Due", fmtDollar(bal)],
    ];
    let y = 535;
    for (const [lbl, amt] of rows) {
      p1.drawText(lbl, { x: 79, y, size: fs, font: reg });
      p1.drawText(amt, { x: 558 - bold.widthOfTextAtSize(amt, fs), y, size: fs, font: bold });
      y -= 21;
    }
    p1.drawText(`2.  ${fmtDollar(fee.filing_fee_paid)} of the filing fee has been paid.`, { x: 54, y: y - 10, size: fs, font: reg });
    p1.drawText("3.  The source of the compensation paid to me was:  [X] Debtor   [ ] Other", { x: 54, y: y - 34, size: fs, font: reg });
    p1.drawText("4.  The source of compensation to be paid to me is:  [X] Debtor   [ ] Other", { x: 54, y: y - 56, size: fs, font: reg });
    p1.drawText("5.  [X] I have not agreed to share the above-disclosed compensation outside my law firm.", { x: 54, y: y - 78, size: fs, font: reg });
    p1.drawText("6.  Included legal services & fees:", { x: 54, y: y - 104, size: fs, font: reg });
    const incLines = String(fee.included_other || "").split(/\r?\n/);
    let iy = y - 120;
    for (const ln of incLines) { p1.drawText(ln, { x: 79, y: iy, size: fs, font: reg }); iy -= 13; }
    p1.drawText("7.  Excluded services:", { x: 54, y: iy - 12, size: fs, font: reg });
    p1.drawText(String(fee.excluded_services || "").slice(0, 95), { x: 79, y: iy - 27, size: fs, font: reg });
    drawC(p1, "Page 1 of 2", 40, reg, 8.5);

    // Page 2: Certification Box — firm name left-aligned at x=274 (3.8 in), generous 220pt height, zero overlap!
    const p2 = doc.addPage([612, 792]);
    p2.drawText("B2030 (Form 2030) (12/15)", { x: 54, y: 745, size: fs, font: reg });
    const boxTop = 684;
    const boxH = 220;
    p2.drawRectangle({ x: 79, y: boxTop - boxH, width: 454, height: boxH, borderWidth: 1, borderColor: rgb(0, 0, 0) });
    drawC(p2, "CERTIFICATION", boxTop - 22, bold, 10);
    drawC(p2, "I certify that the foregoing is a complete statement of any agreement or arrangement for payment to", boxTop - 42, reg, fs);
    drawC(p2, "me for representation of the debtor(s) in this bankruptcy proceeding.", boxTop - 55, reg, fs);

    p2.drawText(c.filing_date || "", { x: 112, y: boxTop - 86, size: fs, font: bold });
    p2.drawLine({ start: { x: 94, y: boxTop - 89 }, end: { x: 194, y: boxTop - 89 }, thickness: 0.75 });
    p2.drawText("Date", { x: 94, y: boxTop - 102, size: fs, font: ital });

    p2.drawText(att.signature || "/s/ L. Jill McDonald", { x: 274, y: boxTop - 86, size: fs, font: bold });
    p2.drawLine({ start: { x: 274, y: boxTop - 89 }, end: { x: 511, y: boxTop - 89 }, thickness: 0.75 });
    p2.drawText(att.name || "", { x: 274, y: boxTop - 102, size: fs, font: reg });
    p2.drawText("Signature of Attorney", { x: 274, y: boxTop - 115, size: fs, font: ital });

    const info = [
      `Bar Number: ${att.bar_number || ""}`,
      att.firm_name || "",
      att.street || "",
      `${att.city || ""}, ${att.state || "FL"} ${att.zip_code || ""}`,
      `Phone: ${att.phone || ""}`,
    ];
    let ry = boxTop - 122;
    for (const ln of info) {
      p2.drawText(ln, { x: 508 - reg.widthOfTextAtSize(ln, fs), y: ry, size: fs, font: reg });
      ry -= 12;
    }

    const firmY = boxTop - boxH + 24;
    p2.drawText(att.firm_name || "", { x: 274, y: firmY + 3, size: fs, font: bold });
    p2.drawLine({ start: { x: 274, y: firmY }, end: { x: 511, y: firmY }, thickness: 0.75 });
    p2.drawText("Name of law firm", { x: 274, y: firmY - 12, size: fs, font: ital });
    drawC(p2, "Page 2 of 2", 40, reg, 8.5);
    return doc.save();
  }

  async function buildVerificationMatrixBytes(c) {
    const { PDFDocument, StandardFonts } = window.PDFLib;
    const doc = await PDFDocument.create();
    const reg = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const pg = doc.addPage([612, 792]);
    const fs = 9;
    const drawC = (txt, y, font, sz) => pg.drawText(txt, { x: (612 - font.widthOfTextAtSize(txt, sz)) / 2, y, size: sz, font });
    drawC("IN THE UNITED STATES BANKRUPTCY COURT", 730, bold, 10);
    drawC((c.district || "MIDDLE DISTRICT OF FLORIDA").toUpperCase(), 716, bold, 10);
    drawC((c.division || "TAMPA DIVISION").toUpperCase(), 702, bold, 10);
    pg.drawText("IN RE:", { x: 54, y: 666, size: fs, font: reg });
    pg.drawText(debtorFullName(c.debtor1), { x: 98, y: 666, size: fs, font: bold });
    if (c.is_joint) pg.drawText(debtorFullName(c.debtor2), { x: 98, y: 650, size: fs, font: bold });
    pg.drawText(`CASE NO.  ${c.case_number || ""}`, { x: 342, y: 666, size: fs, font: reg });
    pg.drawText(`CHAPTER ${c.chapter}`, { x: 342, y: 642, size: fs, font: bold });
    drawC("VERIFICATION OF CREDITOR MATRIX", 580, bold, 10.5);
    drawC("The above named Debtor(s) hereby verifies that the attached list of creditors is true and correct to the best of his/her knowledge.", 552, reg, fs);
    pg.drawText(`Date   ${c.filing_date || ""}`, { x: 54, y: 508, size: fs, font: bold });
    pg.drawText(`Signature   ${debtorEsig(c.debtor1)}`, { x: 200, y: 508, size: fs, font: bold });
    if (c.is_joint) {
      pg.drawText(`Date   ${c.filing_date || ""}`, { x: 54, y: 472, size: fs, font: bold });
      pg.drawText(`Joint Debtor   ${debtorEsig(c.debtor2)}`, { x: 200, y: 472, size: fs, font: bold });
    }
    return doc.save();
  }

  async function buildMatrix3ColBytes(c) {
    const { PDFDocument, StandardFonts } = window.PDFLib;
    const doc = await PDFDocument.create();
    const reg = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const entries = collectMatrixEntries(c);
    const colsX = [40, 220, 400];
    let pg = doc.addPage([612, 792]);
    entries.forEach((blk, idx) => {
      if (idx > 0 && idx % 24 === 0) pg = doc.addPage([612, 792]);
      const slot = idx % 24;
      const x = colsX[slot % 3];
      const y = 735 - Math.floor(slot / 3) * 82;
      pg.drawText(blk[0].slice(0, 32), { x, y, size: 9, font: bold });
      blk.slice(1, 4).forEach((ln, li) => pg.drawText(ln.slice(0, 34), { x, y: y - (li + 1) * 11.5, size: 9, font: reg }));
    });
    if (!entries.length) pg.drawText("(No creditors listed)", { x: 54, y: 720, size: 9, font: reg });
    return doc.save();
  }

  async function fillOfficialTemplate(fid, c, settings, totals) {
    const cat = FORM_CATALOG.find((f) => f.id === fid);
    if (!cat || !cat.file) return null;
    const doc = await loadTemplateDoc(cat.file);
    const { StandardFonts } = window.PDFLib;
    const helv = await doc.embedFont(StandardFonts.Helvetica);
    const form = doc.getForm();
    fillCommonHeader(form, c, helv);

    const d1 = c.debtor1 || {};
    const d2 = c.debtor2 || {};
    const att = settings.attorney || DEFAULT_SETTINGS.attorney;
    const [mm, dd, yyyy] = splitDateMDY(c.filing_date);

    if (fid === "B101") {
      safeSetText(form, "District", "Middle", helv);
      safeSetText(form, "State", "Florida", helv);
      safeSetText(form, "Case number (if known)", c.case_number || "", helv);
      safeCheck(form, `Chapter ${c.chapter}`);
      safeCheck(form, `Chapter ${c.chapter}_2`);
      safeSetText(form, "First name", d1.first_name, helv);
      safeSetText(form, "Middle name", d1.middle_name, helv);
      safeSetText(form, "Last name", d1.last_name, helv);
      safeSetText(form, "First Name", d1.first_name, helv);
      safeSetText(form, "Middle Name", d1.middle_name, helv);
      safeSetText(form, "Last Name", d1.last_name, helv);
      safeSetText(form, "First Name_2", d1.first_name, helv);
      safeSetText(form, "Middle Name_2", d1.middle_name, helv);
      safeSetText(form, "Last Name_2", d1.last_name, helv);
      safeSetText(form, "First Name_3", d1.first_name, helv);
      safeSetText(form, "Middle Name_3", d1.middle_name, helv);
      safeSetText(form, "Last Name_3", d1.last_name, helv);
      const s1 = (d1.ssn_last4 || String(d1.ssn || "").replace(/\D/g, "").slice(-4)).padStart(4, " ");
      if (s1.trim()) ["xx", "undefined", "undefined_2", "undefined_3"].forEach((k, idx) => safeSetText(form, k, s1[idx], helv));
      const [num1, st1] = splitStreetNum(d1.street);
      safeSetText(form, "Number", num1, helv);
      safeSetText(form, "Street", st1, helv);
      safeSetText(form, "City", d1.city, helv);
      safeSetText(form, "State_2", d1.state, helv);
      safeSetText(form, "ZIP Code", d1.zip_code, helv);
      safeSetText(form, "County", d1.county, helv);
      safeCheck(form, "Over the last 180 days before filing this petition");
      if (c.is_joint) {
        safeSetText(form, "First name_2", d2.first_name, helv);
        safeSetText(form, "Middle name_2", d2.middle_name, helv);
        safeSetText(form, "Last name_2", d2.last_name, helv);
        const s2 = (d2.ssn_last4 || String(d2.ssn || "").replace(/\D/g, "").slice(-4)).padStart(4, " ");
        if (s2.trim()) ["xx_2", "undefined_4", "undefined_5", "undefined_6"].forEach((k, idx) => safeSetText(form, k, s2[idx], helv));
      }
      safeSetText(form, "MM", mm, helv); safeSetText(form, "DD", dd, helv); safeSetText(form, " YYYY", yyyy, helv);
      safeSetText(form, "MM_2", mm, helv); safeSetText(form, "DD_2", dd, helv); safeSetText(form, " YYYY_3", yyyy, helv);
      safeSetText(form, "Printed name", att.name, helv);
      safeSetText(form, "Firm name", att.firm_name, helv);
      const [an, as] = splitStreetNum(att.street);
      safeSetText(form, "Number_6", an, helv); safeSetText(form, "Street_6", as, helv);
      safeSetText(form, "City_6", att.city, helv); safeSetText(form, "State_7", att.state, helv);
      safeSetText(form, "ZIP Code_6", att.zip_code, helv);
      safeSetText(form, "Contact phone", att.phone, helv);
      safeSetText(form, "Email address", att.email, helv);
      safeSetText(form, "Bar number", att.bar_number, helv);
      safeSetText(form, "State_8", att.bar_state || "FL", helv);
      // Draw /s/ e-signatures on Page 7 signature lines (Helvetica 9 pt)
      const p7 = doc.getPage(6);
      p7.drawText(debtorEsig(d1), { x: 190, y: 792 - 237, size: 9, font: helv });
      if (c.is_joint) p7.drawText(debtorEsig(d2), { x: 400, y: 792 - 237, size: 9, font: helv });
      p7.drawText(att.signature || "/s/ L. Jill McDonald", { x: 190, y: 792 - 369, size: 9, font: helv });
    } else if (fid === "B106Dec") {
      safeSetText(form, "Debtor1.signature", debtorEsig(d1), helv);
      safeSetText(form, "Executed on", c.filing_date, helv);
      if (c.is_joint) {
        safeSetText(form, "Debtor2.signature", debtorEsig(d2), helv);
        safeSetText(form, "Debtor2.Executed on", c.filing_date, helv);
      }
    } else if (fid === "B107") {
      safeSetText(form, "Name to who you was paid 16a", att.firm_name, helv);
      safeSetText(form, "Name to who you was paid 16b", c.credit_counseling_agency || "Debtorcc.org", helv);
      safeSetText(form, "Signature of Debtor 1", debtorEsig(d1), helv);
      safeSetText(form, "Date signed Debtor 1", c.filing_date, helv);
      if (c.is_joint) {
        safeSetText(form, "Signature of Debtor 2", debtorEsig(d2), helv);
        safeSetText(form, "Date signed Debtor 2", c.filing_date, helv);
      }
    } else if (fid === "B108") {
      safeSetText(form, "Signature of Debtor 1", debtorEsig(d1), helv);
      safeSetText(form, "Date signed Debtor 1", c.filing_date, helv);
      if (c.is_joint) {
        safeSetText(form, "Signature of Debtor 2", debtorEsig(d2), helv);
        safeSetText(form, "Date signed Debtor 2", c.filing_date, helv);
      }
    } else if (fid === "B121") {
      safeSetText(form, "Debtor1.First name", d1.first_name, helv);
      safeSetText(form, "Debtor1.Middle name", d1.middle_name, helv);
      safeSetText(form, "Debtor1.Last name", d1.last_name, helv);
      safeSetText(form, "Debtor1a.SSNum", d1.ssn, helv);
      safeSetText(form, "Debtor1.signature", debtorEsig(d1), helv);
      safeSetText(form, "Executed on", c.filing_date, helv);
      if (c.is_joint) {
        safeSetText(form, "Debtor2.First name", d2.first_name, helv);
        safeSetText(form, "Debtor2.Middle name_2", d2.middle_name, helv);
        safeSetText(form, "Debtor2.Last name", d2.last_name, helv);
        safeSetText(form, "Debtor2a SSNum", d2.ssn, helv);
        safeSetText(form, "Debtor2.signature", debtorEsig(d2), helv);
        safeSetText(form, "Debtor2.Executed on", c.filing_date, helv);
      }
    } else if (fid === "B122A-1") {
      safeSetText(form, "Quest11", fmtMoney(totals.total_cmi), helv);
      safeSetText(form, "12B", fmtMoney(totals.annualized_cmi), helv);
      safeSetText(form, "13A", "Florida", helv);
      safeSetText(form, "13B", String(totals.household_size), helv);
      safeSetText(form, "13C", fmtMoney(totals.fl_median_income), helv);
      safeSetText(form, "Debtor1.sig", debtorEsig(d1), helv);
      safeSetText(form, "Debtor1.Date signed", c.filing_date, helv);
      if (c.is_joint) {
        safeSetText(form, "Debtor2.sig", debtorEsig(d2), helv);
        safeSetText(form, "Debtor2.Date signed", c.filing_date, helv);
      }
    } else if (fid === "B122C-1") {
      safeSetText(form, "undefined_38", fmtMoney(totals.total_cmi), helv);
      safeSetText(form, "undefined_40", fmtMoney(totals.annualized_cmi), helv);
      safeSetText(form, "16 Calculate the median family income that applies to you Follow these steps", "Florida", helv);
      safeSetText(form, "Fill in the number of people in your household", String(totals.household_size), helv);
      safeSetText(form, "undefined_41", fmtMoney(totals.fl_median_income), helv);
      safeSetText(form, "undefined_47", debtorEsig(d1), helv);
      safeSetText(form, "Date", c.filing_date, helv);
      if (c.is_joint) {
        safeSetText(form, "undefined_48", debtorEsig(d2), helv);
        safeSetText(form, "Date_2", c.filing_date, helv);
      }
    } else if (fid === "B103A") {
      safeSetText(form, "Debtor Sig.1", debtorEsig(d1), helv);
      safeSetText(form, "Debtor date.1", c.filing_date, helv);
      if (c.is_joint) {
        safeSetText(form, "Debtor Sig.2", debtorEsig(d2), helv);
        safeSetText(form, "Debtor date.2", c.filing_date, helv);
      }
      safeSetText(form, "Debtor attorney Sig.1", att.signature, helv);
      safeSetText(form, "Debtor attorney date.1", c.filing_date, helv);
    } else if (fid === "B106C") {
      const scheme = String(c.exemption_scheme || "FL").toUpperCase();
      try {
        form.getRadioGroup("1").select(scheme === "FEDERAL" ? "federal" : "state and federal");
      } catch (_) {}
      (c.exemptions || []).slice(0, 12).forEach((ex, i) => {
        const idx = i + 1;
        safeSetText(form, `Brief description.${idx}`, ex.description, helv);
        safeSetText(form, `Line.${idx}`, ex.schedule_ab_line, helv);
        safeSetText(form, `Current value.${idx}`, fmtMoney(ex.current_value), helv);
        safeSetText(form, `Specific laws.${idx}`, ex.statute, helv);
        if (!ex.claim_100_percent) safeSetText(form, `Amount.${idx}`, fmtMoney(ex.exemption_amount), helv);
      });
    } else if (fid === "B106Sum") {
      safeSetText(form, "1a", fmtMoney(totals.real_estate_total), helv);
      safeSetText(form, "1b", fmtMoney(totals.personal_property_total), helv);
      safeSetText(form, "1c", fmtMoney(totals.all_assets_total), helv);
      safeSetText(form, "3a", fmtMoney(totals.secured_total), helv);
      safeSetText(form, "3b", fmtMoney(totals.priority_total + totals.nonpriority_total), helv);
      safeSetText(form, "3c", fmtMoney(totals.total_liabilities), helv);
      safeSetText(form, "4", fmtMoney(totals.combined_monthly_income), helv);
      safeSetText(form, "5", fmtMoney(totals.total_expenses), helv);
    }

    return doc.save();
  }

  async function generatePetitionZip(c, settings) {
    const totals = calculateTotals(c, settings);
    const folder = makeClientFolderName(c);
    const selected = c.selected_forms?.length ? c.selected_forms : selectFormsForCase(c, settings);
    const ordered = [...selected].sort((a, b) => {
      const oa = FORM_CATALOG.find((x) => x.id === a)?.order ?? 500;
      const ob = FORM_CATALOG.find((x) => x.id === b)?.order ?? 500;
      return oa - ob;
    });

    const zip = new window.JSZip();
    const rootZip = zip.folder(folder);
    const indivZip = rootZip.folder("Individual_Forms");
    const mergedDoc = await window.PDFLib.PDFDocument.create();
    const files = [];
    let b121BlobUrl = null;

    for (const fid of ordered) {
      let bytes = null;
      let fname = `${fid}.pdf`;
      if (fid === "B2030") {
        fname = "14_Form_B2030_Attorney_Compensation.pdf";
        bytes = await buildB2030Bytes(c, settings);
      } else if (fid === "MDFL_MATRIX_VERIF") {
        fname = "21_Verification_of_Creditor_Matrix_Tampa.pdf";
        bytes = await buildVerificationMatrixBytes(c);
      } else if (fid === "MDFL_MATRIX_PDF") {
        fname = "22_Creditor_Mailing_Matrix_3Col.pdf";
        bytes = await buildMatrix3ColBytes(c);
      } else if (fid === "MDFL_CH13_PLAN") {
        const resp = await fetch("/Templates/Chapter13Plan_PDFFillable3.pdf");
        if (resp.ok) {
          const planBytes = new Uint8Array(await resp.arrayBuffer());
          rootZip.file("MDFL_Chapter_13_Model_Plan_XFA.pdf", planBytes);
          files.push({ id: fid, name: "MDFL_Chapter_13_Model_Plan_XFA.pdf", url: URL.createObjectURL(new Blob([planBytes], { type: "application/pdf" })), note: "MDFL XFA Plan (open in Adobe Acrobat)" });
        }
        continue;
      } else if (fid === "B121") {
        bytes = await fillOfficialTemplate("B121", c, settings, totals);
        if (bytes) {
          rootZip.file("Form_B121_RESTRICTED_SSN.pdf", bytes);
          b121BlobUrl = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
          files.push({ id: "B121", name: "Form_B121_RESTRICTED_SSN.pdf", url: b121BlobUrl, note: "RESTRICTED — file separately per FRBP 1007(f)" });
        }
        continue;
      } else {
        bytes = await fillOfficialTemplate(fid, c, settings, totals);
        fname = `Form_${fid}.pdf`;
      }

      if (!bytes) continue;
      indivZip.file(fname, bytes);
      files.push({ id: fid, name: fname, url: URL.createObjectURL(new Blob([bytes], { type: "application/pdf" })), note: "Editable individual PDF (9 pt + /s/ e-sigs)" });

      // Merge flattened copy into public packet (never includes B121!)
      try {
        const sub = await window.PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
        try { sub.getForm().flatten(); } catch (_) {}
        const copied = await mergedDoc.copyPages(sub, sub.getPageIndices());
        copied.forEach((p) => mergedDoc.addPage(p));
      } catch (_) {}
    }

    const matrix = buildMatrixPreview(c);
    rootZip.file("Creditor.txt", matrix.text);
    const credTxtUrl = URL.createObjectURL(new Blob([matrix.text], { type: "text/plain" }));
    files.push({ id: "CREDITOR_TXT", name: "Creditor.txt", url: credTxtUrl, note: `${matrix.count} creditors (MDFL LR 1007-2)` });

    const combinedBytes = await mergedDoc.save();
    const combinedName = `Petition_Packet_Ch${c.chapter}_${folder.replace(/\s+/g, "_")}.pdf`;
    rootZip.file(combinedName, combinedBytes);
    const combinedUrl = URL.createObjectURL(new Blob([combinedBytes], { type: "application/pdf" }));

    rootZip.file("case_data.json", JSON.stringify(c, null, 2));

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const zipUrl = URL.createObjectURL(zipBlob);
    const zipName = `${folder}.zip`;

    // Trigger instant download of <LastName,FirstName>.zip
    const a = document.createElement("a");
    a.href = zipUrl;
    a.download = zipName;
    a.click();

    return {
      folder_name: folder,
      client_dir: `${folder}/ (Downloaded as ${zipName})`,
      zip_url: zipUrl,
      zip_name: zipName,
      combined_pdf: combinedUrl,
      combined_pages: mergedDoc.getPageCount(),
      b121_restricted_pdf: b121BlobUrl,
      creditor_txt: credTxtUrl,
      matrix_count: matrix.count,
      files,
      totals,
    };
  }

  return {
    FORM_CATALOG,
    DEFAULT_SETTINGS,
    makeClientFolderName,
    detectDivision,
    calculateTotals,
    autoApplyFloridaExemptions,
    selectFormsForCase,
    runComplianceChecks,
    buildMatrixPreview,
    parseCifBytes,
    parseCreditorsCsv,
    generatePetitionZip,
  };
})();
