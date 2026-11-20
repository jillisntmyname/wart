/* MDFL Tampa Division — Credit Report PDF Parser (Equifax, Experian, TransUnion & Generic)
 * Runs 100% locally in the browser using pdf.js — zero client PII ever leaves the device.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.CreditReportParser = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const STATE_CODES = new Set([
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL",
    "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT",
    "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI",
    "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC", "PR",
  ]);

  const STREET_SUFFIXES =
    "ST|STREET|AVE|AVENUE|BLVD|BOULEVARD|RD|ROAD|DR|DRIVE|LN|LANE|CT|COURT|" +
    "CIR|CIRCLE|PL|PLACE|PKWY|PARKWAY|HWY|HIGHWAY|WAY|TER|TERRACE|TRL|TRAIL|" +
    "LOOP|SQ|SQUARE|PIKE|EXPY|EXPRESSWAY|FWY|FREEWAY|PLZ|PLAZA|CTR|CENTER|" +
    "STE|SUITE|UNIT|APT|FL|FLOOR|BLDG|BUILDING|BOX";

  const DIR_TOKENS = new Set(["N", "S", "E", "W", "NE", "NW", "SE", "SW", "NORTH", "SOUTH", "EAST", "WEST"]);

  function cleanStr(s) {
    return String(s || "").replace(/\x0b/g, " ").replace(/\s+/g, " ").trim().replace(/^,+|,+$/g, "").trim();
  }

  function extractMoneyStrict(val) {
    const s = String(val || "").trim();
    if (!s || /^(-+|- - -|n\/a|not reported)$/i.test(s)) return 0;
    const m = s.match(/\$?\s*([\d,]+(?:\.\d{1,2})?)/);
    if (!m) return 0;
    const n = parseFloat(m[1].replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
  }

  function extractAcctDisplayLast4(raw) {
    const s = String(raw || "").trim();
    if (!s) return "";
    const mEnd = s.match(/(\d{4})\s*$/);
    if (mEnd) return mEnd[1];
    const digits = s.replace(/\D/g, "");
    if (digits.length >= 4) return digits.slice(-4);
    return digits;
  }

  function hasTrailingUnmaskedLast4(raw) {
    return /\d{4}\s*$/.test(String(raw || "").trim());
  }

  function parseAddressBlock(rawLines) {
    const cleaned = [];
    for (const raw of rawLines || []) {
      const noPhone = String(raw || "").split(/\|\s*\(?/)[0];
      const ln = cleanStr(noPhone);
      if (!ln || /^(-+|- - -|not reported|n\/a)$/i.test(ln)) continue;
      cleaned.push(ln);
    }
    if (!cleaned.length) return { attn: "Attn: Bankruptcy", street: "", city: "", state: "", zip_code: "" };

    let attn = "Attn: Bankruptcy";
    if (cleaned.length >= 2 && /^(?:ATTN\b|C\/O\b|BANKRUPTCY\b|CORRESPONDENCE\b)/i.test(cleaned[0])) {
      attn = cleaned.shift();
    }

    const joined = cleaned.join(", ").replace(/,\s*,+/g, ", ").replace(/^[\s,]+|[\s,]+$/g, "");
    let stZipM = joined.match(/(?:,|\s)+([A-Z]{2}),?\s+(\d{5}(?:-\d{4})?)\s*$/);
    if (!stZipM || !STATE_CODES.has(stZipM[1])) {
      stZipM = joined.match(/(?:,|\s)+([A-Za-z]{2}),?\s+(\d{5}(?:-\d{4})?)\s*$/);
      if (!stZipM || !STATE_CODES.has(stZipM[1].toUpperCase())) {
        return { attn, street: joined.slice(0, 80), city: "", state: "", zip_code: "" };
      }
    }

    const state = stZipM[1].toUpperCase();
    const zip_code = stZipM[2];
    const beforeSt = joined.slice(0, stZipM.index).replace(/^[\s,]+|[\s,]+$/g, "");

    // Case 1: Multi-line where last line is "CITY ST ZIP" (Experian)
    if (cleaned.length >= 2) {
      const lastLn = cleaned[cleaned.length - 1];
      const mLast = lastLn.match(/^([A-Za-z .'-]+?)[,\s]+([A-Za-z]{2}),?\s+(\d{5}(?:-\d{4})?)$/);
      if (mLast && STATE_CODES.has(mLast[2].toUpperCase())) {
        const cityCand = mLast[1].replace(/^[\s,]+|[\s,]+$/g, "");
        if (cityCand && !/^(?:\d+|P\.?\s*O\.?\s*BOX\b|POB\b|LOCKBOX\b)/i.test(cityCand)) {
          const street = cleaned.slice(0, -1).join(", ").replace(/^[\s,]+|[\s,]+$/g, "");
          return { attn, street, city: cityCand, state, zip_code };
        }
      }
    }

    // Case 2: Comma-separated "STREET, CITY" (Equifax)
    if (beforeSt.includes(",")) {
      const parts = beforeSt.split(",").map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        const city = parts[parts.length - 1];
        const streetParts = [];
        for (const p of parts.slice(0, -1)) {
          if (!streetParts.includes(p)) streetParts.push(p);
        }
        return { attn, street: streetParts.join(", "), city, state, zip_code };
      }
    }

    // Case 3a: PO BOX <num> <CITY> (TransUnion single-line)
    const poM = beforeSt.match(/^((?:P\.?\s*O\.?\s*BOX|POB|LOCKBOX)\s+[A-Z0-9-]+)\s+([A-Za-z .'-]+)$/i);
    if (poM) {
      return { attn, street: poM[1].trim(), city: poM[2].trim(), state, zip_code };
    }

    // Case 3b: Street suffix + optional dir/suite + CITY
    const sufRe = new RegExp(
      `^(.+?\\b(?:${STREET_SUFFIXES})\\.?(?:\\s+(?:N|S|E|W|NE|NW|SE|SW))?(?:\\s+(?:STE|SUITE|APT|UNIT|FL|BLDG|#)\\s*[A-Z0-9-]+)?)\\s+([A-Za-z .'-]+)$`,
      "i"
    );
    const sufM = beforeSt.match(sufRe);
    if (sufM) {
      return { attn, street: sufM[1].trim(), city: sufM[2].trim(), state, zip_code };
    }

    // Case 3c: Split after last numeric token
    const toks = beforeSt.split(/\s+/);
    if (toks.length >= 2) {
      let lastDigitIdx = -1;
      for (let i = 0; i < toks.length; i++) {
        if (/\d/.test(toks[i])) lastDigitIdx = i;
      }
      if (lastDigitIdx >= 0 && lastDigitIdx < toks.length - 1) {
        const rem = toks.slice(lastDigitIdx + 1);
        if (rem.length === 1) {
          return { attn, street: toks.slice(0, lastDigitIdx + 1).join(" "), city: rem[0], state, zip_code };
        }
        if (rem.length === 2 && !DIR_TOKENS.has(rem[0].toUpperCase())) {
          return { attn, street: toks.slice(0, lastDigitIdx + 1).join(" "), city: rem.join(" "), state, zip_code };
        }
        return { attn, street: toks.slice(0, -1).join(" "), city: toks[toks.length - 1], state, zip_code };
      }
    }

    return { attn, street: beforeSt, city: "", state, zip_code };
  }

  // =========================================================================
  // BUREAU DETECTION
  // =========================================================================
  function detectBureau(fullText, filename) {
    const low = String(fullText || "").toLowerCase();
    const fname = String(filename || "").toLowerCase();
    if (
      low.includes("annual credit report - experian") ||
      low.includes("usa.experian.com") ||
      low.includes("contact experian") ||
      (low.includes("account info") && low.includes("contact info") && low.includes("experian"))
    ) {
      return "experian";
    }
    if (
      low.includes("your transunion credit report") ||
      low.includes("transunion is now including") ||
      (low.includes("pay status") && low.includes("loan type") && low.includes("transunion"))
    ) {
      return "transunion";
    }
    if (
      low.includes("-efx-acr-") ||
      low.includes("loan/account type:") ||
      (low.includes("date reported:") && low.includes("equifax")) ||
      low.includes("equifax information services")
    ) {
      return "equifax";
    }
    if (fname.includes("experian")) return "experian";
    if (fname.includes("transunion") || fname.includes("trans_union")) return "transunion";
    if (fname.includes("equifax") || fname.includes("efx")) return "equifax";
    return "generic";
  }

  // =========================================================================
  // BANKRUPTCY CLASSIFICATION (SCHEDULE D vs E vs F)
  // =========================================================================
  function classifyTradeline(tl) {
    const combined = [tl.account_type_raw, tl.loan_type_raw, tl.creditor_name, tl.status_raw, tl.remarks]
      .join(" ")
      .toLowerCase();
    const typeOnly = `${tl.account_type_raw || ""} ${tl.loan_type_raw || ""}`.toLowerCase();
    const statusLow = `${tl.status_raw || ""} ${tl.remarks || ""}`.toLowerCase();
    const respLow = String(tl.responsibility_raw || "").toLowerCase();

    tl.flags = Array.isArray(tl.flags) ? tl.flags : [];

    if (respLow.includes("authorized")) {
      tl.is_authorized_user = true;
      tl.flags.push("Authorized User — verify contractual liability");
    } else if (/joint|co-maker|cosigner|co-signer|shared/.test(respLow)) {
      tl.owner = "both";
      tl.has_codebtor_hint = true;
      tl.flags.push("Joint / Co-signed account");
    }

    if (statusLow.includes("dispute")) {
      tl.is_disputed = true;
      tl.flags.push("Disputed on credit report");
    }

    const isClosedStatus = Boolean(
      tl.date_closed ||
        /\b(closed|paid\s*,?\s*closed|paid\s+in\s+full|paid\s+as\s+agreed.*closed|transferred|refinanc)/i.test(statusLow)
    );
    if (isClosedStatus && tl.balance <= 0) {
      tl.is_closed = true;
    }

    const isRepoOrDef = /\b(repossession|repossessed|voluntary surrender|collateral released|deficiency|charge[- ]?off)\b/i.test(
      statusLow
    );

    if (/\b(child support|family support|alimony|domestic support|fl dor|state disbursement)\b/i.test(combined)) {
      tl.schedule = "E";
      tl.category = "priority_dso";
      tl.claim_type = "DSO";
      tl.claim_type_specify = "Domestic Support Obligation";
    } else if (/\b(internal revenue|irs\b|tax\s+debt|federal tax|state tax)\b/i.test(combined) && !combined.includes("lien")) {
      tl.schedule = "E";
      tl.category = "priority_tax";
      tl.claim_type = "Taxes";
      tl.claim_type_specify = "Taxes";
    } else if (
      /\b(collection|debt buyer|factoring company|placed for collection)\b/i.test(typeOnly) ||
      (statusLow.includes("collection") && !typeOnly.includes("credit card"))
    ) {
      tl.schedule = "F";
      tl.category = "unsecured_collection";
      tl.claim_type = "Other";
      tl.claim_type_specify = tl.original_creditor ? `Collection (Orig: ${tl.original_creditor})` : "Collection";
    } else if (
      /\b(mortgage|mtg\b|real estate|home equity|heloc|deed of trust|fha\b|va real estate|second mortgage|mobile home|manufactured home)\b/i.test(
        typeOnly
      )
    ) {
      if (isRepoOrDef && statusLow.includes("foreclosure collateral sold")) {
        tl.schedule = "F";
        tl.category = "unsecured_other";
        tl.claim_type = "Other";
        tl.claim_type_specify = "Mortgage Deficiency";
        tl.flags.push("Foreclosure sold — reclassified as unsecured deficiency");
      } else {
        tl.schedule = "D";
        tl.category = "secured_mortgage";
        tl.lien_type = "agreement";
        if (typeOnly.includes("equity") || typeOnly.includes("heloc")) {
          tl.collateral_desc = "Real Estate (Home Equity / HELOC)";
        } else if (typeOnly.includes("mobile") || typeOnly.includes("manufactured")) {
          tl.collateral_desc = "Mobile / Manufactured Home";
        } else {
          tl.collateral_desc = "Real Estate / Mortgage";
        }
      }
    } else if (
      /\b(auto\b|auto loan|automobile|motor vehicle|vehicle|motorcycle|recreational|rv\b|boat|marine|trailer)\b/i.test(typeOnly)
    ) {
      if (isRepoOrDef) {
        tl.schedule = "F";
        tl.category = "unsecured_other";
        tl.claim_type = "Other";
        tl.claim_type_specify = "Auto Repo Deficiency";
        tl.flags.push("Repossessed / surrendered — reclassified as unsecured deficiency");
      } else {
        tl.schedule = "D";
        tl.category = "secured_auto";
        tl.lien_type = "agreement";
        tl.collateral_desc = "Vehicle / Auto Loan";
      }
    } else if (
      /\b(secured credit|secured card|secured loan|secured|furniture|appliance|lease[- ]to[- ]own|collateral|equipment|jewelry)\b/i.test(
        typeOnly
      )
    ) {
      tl.schedule = "D";
      tl.category = "secured_other";
      tl.lien_type = "agreement";
      tl.collateral_desc = (tl.loan_type_raw || tl.account_type_raw || "Secured Collateral").trim();
      tl.flags.push("Verify security interest / PMSI collateral");
    } else if (/\b(tax lien|judgment lien|mechanic.?s lien)\b/i.test(combined)) {
      tl.schedule = "D";
      tl.category = "secured_other";
      tl.lien_type = combined.includes("tax") ? "statutory" : "judgment";
      tl.collateral_desc = "Statutory / Judgment Lien";
    } else if (
      /\b(student|education|educational|nelnet|navient|mohela|aidvantage|edfinancial|sallie mae|dept of ed)\b/i.test(combined)
    ) {
      tl.schedule = "F";
      tl.category = "unsecured_student";
      tl.claim_type = "StudentLoan";
      tl.claim_type_specify = "Student Loan";
      tl.flags.push("Student loan (presumptively nondischargeable)");
    } else if (
      /\b(medical|hospital|healthcare|clinic|dental|radiology|ambulance|physician|laboratory|quest diag)\b/i.test(combined)
    ) {
      tl.schedule = "F";
      tl.category = "unsecured_medical";
      tl.claim_type = "Other";
      tl.claim_type_specify = "Medical";
    } else if (
      /\b(credit card|flexible spending|charge account|charge card|revolving|line of credit|retail|store card|business card)\b/i.test(
        typeOnly
      )
    ) {
      tl.schedule = "F";
      tl.category = "unsecured_card";
      tl.claim_type = "Other";
      tl.claim_type_specify = "CreditCard";
    } else {
      tl.schedule = "F";
      tl.category = "unsecured_other";
      tl.claim_type = "Other";
      const rawSpec = (tl.loan_type_raw || tl.account_type_raw || "PersonalLoan").trim();
      tl.claim_type_specify = rawSpec ? rawSpec.slice(0, 40) : "PersonalLoan";
    }

    if (tl.is_closed && tl.balance <= 0) {
      tl.include_default = false;
      tl.skip_reason = "Closed ($0 balance)";
    } else if (tl.balance <= 0) {
      tl.include_default = false;
      tl.skip_reason = "Open ($0 balance)";
    } else if (tl.is_authorized_user) {
      tl.include_default = false;
      tl.skip_reason = "Authorized User";
    } else {
      tl.include_default = true;
      tl.skip_reason = "";
    }

    if (!tl.street && !tl.city) {
      tl.flags.push("Missing mailing address");
    }

    return tl;
  }

  function makeTradeline(init) {
    return {
      creditor_name: "",
      attn: "Attn: Bankruptcy",
      street: "",
      city: "",
      state: "",
      zip_code: "",
      account_number_raw: "",
      account_last4: "",
      date_opened: "",
      date_closed: "",
      balance: 0,
      monthly_payment: 0,
      past_due: 0,
      credit_limit: 0,
      high_balance: 0,
      account_type_raw: "",
      loan_type_raw: "",
      status_raw: "",
      responsibility_raw: "",
      original_creditor: "",
      remarks: "",
      schedule: "F",
      category: "unsecured_card",
      collateral_desc: "",
      lien_type: "agreement",
      claim_type: "Other",
      claim_type_specify: "CreditCard",
      owner: "debtor1",
      is_closed: false,
      is_authorized_user: false,
      is_disputed: false,
      has_codebtor_hint: false,
      include_default: true,
      skip_reason: "",
      flags: [],
      bureaus: [],
      source_files: [],
      ...init,
    };
  }

  // =========================================================================
  // BUREAU 1: EXPERIAN PARSER
  // =========================================================================
  const EX_NOISE_RE =
    /^(?:\d{1,2}\/\d{1,2}\/\d{2,4},\s*\d{1,2}:\d{2}\s*[AP]M|Annual Credit Report\s*-\s*Experian|https?:\/\/usa\.experian\.com\/.*|\d+\/\d+|[\ue000-\uf8ff]+)$/i;

  const EX_LABELS = new Set([
    "Account Name", "Account Number", "Account Type", "Responsibility", "Interest Type",
    "Date Opened", "Status", "Status Updated", "Balance", "Balance Updated",
    "Recent Payment", "Monthly Payment", "Original Balance", "Credit Limit",
    "Highest Balance", "Terms", "On Record Until", "Original Creditor",
    "Comments", "Past Due Amount", "Amount Past Due",
  ]);

  function parseExperianText(fullText, filename, defaultOwner) {
    const rawLines = [];
    for (const ln of String(fullText || "").replace(/\x0b/g, "\n").split(/\r?\n/)) {
      const s = ln.trim();
      if (!s || EX_NOISE_RE.test(s)) continue;
      rawLines.push(s);
    }

    let startIdx = rawLines.indexOf("Account Info");
    if (startIdx < 0) startIdx = 0;
    let endIdx = rawLines.length;
    for (let i = startIdx; i < rawLines.length; i++) {
      if (rawLines[i] === "Soft Inquiries" || rawLines[i] === "Important Messages" || rawLines[i] === "Contact Experian") {
        endIdx = i;
        break;
      }
    }
    const section = rawLines.slice(startIdx, endIdx);
    const blockStarts = [];
    for (let i = 0; i < section.length; i++) {
      if (section[i] === "Account Info") blockStarts.push(i);
    }

    const results = [];
    for (let b = 0; b < blockStarts.length; b++) {
      const sPos = blockStarts[b];
      const ePos = b + 1 < blockStarts.length ? blockStarts[b + 1] : section.length;
      const block = section.slice(sPos, ePos);

      const fields = {};
      const addrLines = [];
      let inHistory = false;
      let i = 0;
      while (i < block.length) {
        const ln = block[i];
        if (ln === "Payment History" || ln === "Balance Histories") {
          inHistory = true;
          i++;
          continue;
        }
        if (!inHistory && EX_LABELS.has(ln)) {
          const val = i + 1 < block.length ? block[i + 1] : "";
          if (EX_LABELS.has(val) || val === "Payment History" || val === "Balance Histories" || val === "Contact Info") {
            i++;
          } else {
            if (!(ln in fields)) fields[ln] = val;
            i += 2;
          }
          continue;
        }
        if (ln === "Contact Info") {
          let j = i + 1;
          while (j < block.length && block[j] !== "Address") {
            if (block[j] === "Payment History" || block[j] === "Account Info") break;
            j++;
          }
          if (j < block.length && block[j] === "Address") {
            for (let k = j + 1; k < block.length; k++) {
              const cand = block[k];
              if (
                /^(?:19|20)\d{2}$/.test(cand) ||
                cand === "Phone Number" || cand === "Phone" || cand === "Payment History" ||
                cand === "Account Info" || cand === "Current / Terms met" ||
                /^\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}$/.test(cand)
              ) {
                break;
              }
              addrLines.push(cand);
              if (/\b[A-Z]{2},?\s+\d{5}(?:-\d{4})?\s*$/.test(cand)) break;
              if (addrLines.length >= 4) break;
            }
          }
          break;
        }
        i++;
      }

      const name = (fields["Account Name"] || "").trim();
      if (!name) continue;
      const addr = parseAddressBlock(addrLines);
      const acctRaw = fields["Account Number"] || "";
      results.push(
        classifyTradeline(
          makeTradeline({
            creditor_name: name,
            ...addr,
            account_number_raw: acctRaw,
            account_last4: extractAcctDisplayLast4(acctRaw),
            date_opened: fields["Date Opened"] || "",
            balance: extractMoneyStrict(fields["Balance"]),
            monthly_payment: extractMoneyStrict(fields["Monthly Payment"]),
            past_due: extractMoneyStrict(fields["Past Due Amount"] || fields["Amount Past Due"]),
            credit_limit: extractMoneyStrict(fields["Credit Limit"]),
            high_balance: extractMoneyStrict(fields["Highest Balance"] || fields["Original Balance"]),
            account_type_raw: fields["Account Type"] || "",
            status_raw: fields["Status"] || "",
            responsibility_raw: fields["Responsibility"] || "",
            original_creditor: fields["Original Creditor"] || "",
            remarks: fields["Comments"] || "",
            owner: defaultOwner,
            bureaus: ["experian"],
            source_files: filename ? [filename] : [],
          })
        )
      );
    }
    return results;
  }

  // =========================================================================
  // BUREAU 2: TRANSUNION PARSER
  // =========================================================================
  const TU_LABELS = new Set([
    "Account Name", "Account Number", "Address", "Phone", "Monthly Payment",
    "Date Opened", "Responsibility", "Account Type", "Loan Type", "Balance",
    "Date Updated", "Payment Received", "Last Payment Made", "High Balance",
    "High Balance (Hist.)", "Credit Limit", "Credit Limit (Hist.)", "Pay Status",
    "Terms", "Date Paid", "Date Closed", "Past Due", "Maximum Delinquency",
    "Estimated month and year that this item will be removed", "Remarks",
    "Original Creditor", "Original Charge-Off", "Payment History",
  ]);

  function parseTransunionText(fullText, filename, defaultOwner) {
    const normalized = String(fullText || "").replace(/\x0b/g, "");
    const rawLines = normalized.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    let endIdx = rawLines.length;
    for (let i = 0; i < rawLines.length; i++) {
      if (i > 100 && (rawLines[i] === "Inquiries" || rawLines[i] === "Regular Inquiries" || rawLines[i] === "Account Review Inquiries")) {
        endIdx = i;
        break;
      }
    }
    const section = rawLines.slice(0, endIdx);

    const starts = [];
    for (let i = 0; i < section.length - 1; i++) {
      if (section[i] === "Account Name" && section[i + 1] === "Account Number") {
        starts.push(i);
      }
    }

    const results = [];
    for (let idx = 0; idx < starts.length; idx++) {
      const sPos = starts[idx];
      const ePos = idx + 1 < starts.length ? starts[idx + 1] : section.length;
      let block = section.slice(sPos, ePos);
      const phIdx = block.indexOf("Payment History");
      if (phIdx >= 0) block = block.slice(0, phIdx);

      let addrPos = block.length;
      for (let j = 2; j < block.length; j++) {
        if (TU_LABELS.has(block[j])) {
          addrPos = j;
          break;
        }
      }
      const headerVals = block.slice(2, addrPos);
      if (!headerVals.length) continue;
      const name = headerVals[0];
      const acctRaw = headerVals.slice(1).join("").replace(/\s+/g, "");

      const fields = {};
      let curLabel = null;
      for (const ln of block.slice(addrPos)) {
        if (TU_LABELS.has(ln)) {
          curLabel = ln;
          if (!fields[curLabel]) fields[curLabel] = [];
        } else if (curLabel) {
          fields[curLabel].push(ln);
        }
      }

      const val = (label) => {
        const parts = fields[label] || [];
        if (!parts.length) return "";
        let out = parts[0];
        for (let pIdx = 1; pIdx < parts.length; pIdx++) {
          const p = parts[pIdx];
          const lastWord = out.split(/\s+/).pop() || "";
          if (p.length <= 3 || (out && !out.endsWith(" ") && /^[a-z]/.test(p) && lastWord.length >= 4)) {
            out += p;
          } else {
            out += " " + p;
          }
        }
        return out.replace(/\s+/g, " ").trim();
      };

      const addr = parseAddressBlock(fields["Address"] || []);
      results.push(
        classifyTradeline(
          makeTradeline({
            creditor_name: name,
            ...addr,
            account_number_raw: acctRaw,
            account_last4: extractAcctDisplayLast4(acctRaw),
            date_opened: val("Date Opened"),
            date_closed: val("Date Closed"),
            balance: extractMoneyStrict(val("Balance")),
            monthly_payment: extractMoneyStrict(val("Monthly Payment")),
            past_due: extractMoneyStrict(val("Past Due")),
            credit_limit: extractMoneyStrict(val("Credit Limit") || val("Credit Limit (Hist.)")),
            high_balance: extractMoneyStrict(val("High Balance") || val("High Balance (Hist.)")),
            account_type_raw: val("Account Type"),
            loan_type_raw: val("Loan Type"),
            status_raw: val("Pay Status"),
            responsibility_raw: val("Responsibility"),
            original_creditor: val("Original Creditor"),
            remarks: val("Remarks"),
            owner: defaultOwner,
            bureaus: ["transunion"],
            source_files: filename ? [filename] : [],
          })
        )
      );
    }
    return results;
  }

  // =========================================================================
  // BUREAU 3: EQUIFAX PARSER
  // =========================================================================
  const EQ_HEADER_NOISE_RE =
    /^(?:Prepared for:|Date:\s+[A-Z][a-z]+\s+\d|Confirmation\s*#|Page\s+\d+\s+of\s+\d+|\d{5,}-DISC|Revolving Accounts|Mortgage Accounts|Installment Accounts|Other Accounts|Collections|Closed Accounts|Account Details|Account Info|Credit Accounts|Narrative Code|Narrative Code Description|\d{3}\s*$)/i;

  const EQ_KV_LINE_RE =
    /^(?:Date\s|Account\s|Balance:|Credit Limit:|High Credit:|Loan\/|Status:|Owner:|Terms\s|Months\s|Scheduled\s|Amount\s|Deferred\s|Actual\s|Charge Off\s|Balloon\s|Activity\s|Narrative\s|Term\s|Original\s)/i;

  function parseEquifaxText(fullText, filename, defaultOwner) {
    const rawLines = String(fullText || "").replace(/\x0b/g, "\n").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    let endIdx = rawLines.length;
    for (let i = 0; i < rawLines.length; i++) {
      if (i > 100 && (rawLines[i] === "Hard Inquiries" || rawLines[i] === "Soft Inquiries")) {
        endIdx = i;
        break;
      }
    }
    const section = rawLines.slice(0, endIdx);

    const anchors = [];
    for (let i = 0; i < section.length; i++) {
      if (section[i].startsWith("Date Reported:") && section[i].includes("Balance:")) {
        anchors.push(i);
      }
    }

    const results = [];
    for (let aIdx = 0; aIdx < anchors.length; aIdx++) {
      const pos = anchors[aIdx];
      const nextPos = aIdx + 1 < anchors.length ? anchors[aIdx + 1] : section.length;

      const headerLines = [];
      for (let j = pos - 1; j >= Math.max(0, pos - 7); j--) {
        const cand = section[j];
        if (
          EQ_HEADER_NOISE_RE.test(cand) ||
          EQ_KV_LINE_RE.test(cand) ||
          cand === "Payment History" || cand === "No Data Available" || cand === "24 Month History" || cand === "Narrative Codes" ||
          /^(?:19|20)\d{2}$/.test(cand) ||
          /^\d{2}\/\d{2}$/.test(cand) ||
          /^Prepared for:/i.test(cand)
        ) {
          break;
        }
        if (j >= 1 && section[j - 1].startsWith("Prepared for:")) break;
        headerLines.unshift(cand);
      }
      if (!headerLines.length) continue;

      let name = headerLines[0];
      let addrLines = headerLines.slice(1);
      while (addrLines.length >= 2 && !/(\d|P\.?\s*O\.?\s*BOX|LOCKBOX|\|)/i.test(addrLines[0])) {
        name = addrLines[0];
        addrLines = addrLines.slice(1);
      }

      const closedFromName = /\s*-\s*Closed\s*$/i.test(name);
      name = name.replace(/\s*-\s*Closed\s*$/i, "").trim();

      const body = section.slice(pos, Math.min(nextPos, pos + 35));
      const kv = {};
      for (const ln of body) {
        if (ln === "Payment History" || ln === "24 Month History" || ln === "Narrative Code") break;
        for (const seg of ln.split("|").map((s) => s.trim())) {
          const colon = seg.indexOf(":");
          if (colon > 0) {
            const k = seg.slice(0, colon).trim();
            const v = seg.slice(colon + 1).trim();
            if (k && !(k in kv)) kv[k] = v;
          }
        }
      }

      const addr = parseAddressBlock(addrLines);
      const acctRaw = kv["Account Number"] || "";
      let statusRaw = kv["Status"] || "";
      if (closedFromName && !statusRaw.toLowerCase().includes("closed")) {
        statusRaw = `${statusRaw} (Closed)`.trim();
      }

      results.push(
        classifyTradeline(
          makeTradeline({
            creditor_name: name,
            ...addr,
            account_number_raw: acctRaw,
            account_last4: extractAcctDisplayLast4(acctRaw),
            date_opened: kv["Date Opened"] || "",
            date_closed: kv["Date Closed"] || "",
            balance: extractMoneyStrict(kv["Balance"]),
            monthly_payment: extractMoneyStrict(kv["Scheduled Payment Amount"]),
            past_due: extractMoneyStrict(kv["Amount Past Due"]),
            credit_limit: extractMoneyStrict(kv["Credit Limit"]),
            high_balance: extractMoneyStrict(kv["High Credit"]),
            account_type_raw: kv["Loan/Account Type"] || kv["Account Type"] || "",
            status_raw: statusRaw,
            responsibility_raw: kv["Owner"] || "",
            original_creditor: kv["Original Creditor"] || kv["Creditor Name"] || "",
            remarks: kv["Comments"] || kv["Activity Designator"] || "",
            owner: defaultOwner,
            bureaus: ["equifax"],
            source_files: filename ? [filename] : [],
          })
        )
      );
    }
    return results;
  }

  // =========================================================================
  // GENERIC FALLBACK PARSER
  // =========================================================================
  function parseGenericPdfText(fullText, filename, defaultOwner) {
    const lines = String(fullText || "").split(/\r?\n/).map((l) => l.trim());
    const cszRe = /^([A-Za-z .'-]+),?\s+([A-Z]{2}),?\s+(\d{5}(?:-\d{4})?)$/;
    const results = [];

    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(cszRe);
      if (!m || !STATE_CODES.has(m[2])) continue;
      const prev = lines.slice(Math.max(0, i - 3), i).filter(Boolean);
      if (prev.length < 2) continue;
      let street = prev[prev.length - 1];
      let name = prev[prev.length - 2];
      let attn = "Attn: Bankruptcy";
      if (prev.length === 3 && /attn|bankruptcy|correspondence|c\/o|srvs/i.test(prev[prev.length - 2])) {
        attn = prev[prev.length - 2];
        name = prev[prev.length - 3];
      }
      if (/jill mcdonald|bankruptcy court|middle district|debtor|consumer financial/i.test(name)) continue;
      if (name.length < 2 || name.length > 70) continue;

      const win = lines.slice(Math.max(0, i - 6), Math.min(lines.length, i + 10)).join("\n");
      const balM =
        win.match(/(?:Balance|Amount|Total Claim|Owed|Past Due)[^$\d]{0,15}\$?\s*([\d,]+(?:\.\d{2})?)/i) ||
        win.match(/\$\s*([\d,]+\.\d{2})/);
      const acctM = win.match(/(?:Account|Acct)[^A-Za-z0-9]{0,12}([X*#\-\d]{4,20})\b/i);
      const dateM = win.match(/(?:Opened|Incurred|Date)[^\d]{0,12}(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}\/\d{4})/i);
      const typeM = win.match(/(?:Account Type|Loan Type|Type)[:\s]+([^\n|]{3,40})/i);

      const acctRaw = acctM ? acctM[1] : "";
      results.push(
        classifyTradeline(
          makeTradeline({
            creditor_name: name,
            attn,
            street,
            city: m[1].trim().replace(/,+$/, ""),
            state: m[2],
            zip_code: m[3],
            account_number_raw: acctRaw,
            account_last4: extractAcctDisplayLast4(acctRaw),
            date_opened: dateM ? dateM[1] : "",
            balance: balM ? extractMoneyStrict(balM[1]) : 0,
            account_type_raw: typeM ? typeM[1].trim() : "",
            owner: defaultOwner,
            bureaus: ["generic"],
            source_files: filename ? [filename] : [],
          })
        )
      );
    }
    return results;
  }

  // =========================================================================
  // CROSS-BUREAU DEDUPLICATION & BEST-FIELD MERGING
  // =========================================================================
  const CANONICAL_ALIASES = [
    [/\b(jpmcb|jp\s*morgan\s*chase|chase\s*card|chase\s*bank|chase\s*auto|chase\s*home|chase\s*mortgage)\b/i, "CHASE"],
    [/\b(apple\s*card|goldman\s*sachs|gs\s*bank)\b/i, "APPLE_GS_BANK"],
    [/\b(cap(?:ital)?\s*one)\b/i, "CAPITAL_ONE"],
    [/\b(amex|american\s*express)\b/i, "AMEX"],
    [/\b(bank\s*of\s*america|bofa|bk\s*of\s*amer)\b/i, "BANK_OF_AMERICA"],
    [/\b(wells\s*fargo|wf\s*home|wf\s*auto|wf\s*card)\b/i, "WELLS_FARGO"],
    [/\b(citi\s*bank|citicards?|cbna|citi\s*retail)\b/i, "CITI"],
    [/\b(discover\s*(?:bank|fin|card)?)\b/i, "DISCOVER"],
    [/\b(synchrony|syncb)\b/i, "SYNCHRONY"],
    [/\b(barclays?|barclaycard)\b/i, "BARCLAYS"],
    [/\b(ally\s*(?:bank|fin(?:ancial|cl)?))\b/i, "ALLY"],
    [/\b(toyota\s*(?:motor|fin(?:ancial)?))\b/i, "TOYOTA_FIN"],
    [/\b(honda\s*(?:fin|american))\b/i, "HONDA_FIN"],
    [/\b(ford\s*(?:motor\s*)?credit)\b/i, "FORD_CREDIT"],
    [/\b(gm\s*financial|americredit)\b/i, "GM_FINANCIAL"],
    [/\b(suncoast\s*c(?:redit\s*)?u(?:nion)?)\b/i, "SUNCOAST_CU"],
    [/\b(achieva\s*c(?:redit\s*)?u(?:nion)?)\b/i, "ACHIEVA_CU"],
    [/\b(navy\s*fed(?:eral)?)\b/i, "NAVY_FEDERAL"],
    [/\b(usaa)\b/i, "USAA"],
    [/\b(us\s*bank)\b/i, "US_BANK"],
    [/\b(pnc\s*bank)\b/i, "PNC"],
    [/\b(td\s*bank|td\s*auto)\b/i, "TD_BANK"],
    [/\b(pennymac)\b/i, "PENNYMAC"],
    [/\b(mr\.?\s*cooper|nationstar)\b/i, "MR_COOPER"],
    [/\b(rocket\s*mortgage|quicken\s*loans)\b/i, "ROCKET_MTG"],
    [/\b(freedom\s*mortgage)\b/i, "FREEDOM_MTG"],
    [/\b(midland\s*(?:credit|funding))\b/i, "MIDLAND"],
    [/\b(portfolio\s*recovery|pra\s*group)\b/i, "PORTFOLIO_RECOVERY"],
    [/\b(lvnv\s*funding)\b/i, "LVNV"],
  ];

  const STOP_WORDS = new Set([
    "na", "n", "a", "llc", "inc", "corp", "co", "bank", "services", "svc", "svcs",
    "usa", "us", "financial", "fin", "credit", "card", "cards", "group", "the",
  ]);

  function canonicalCreditor(name) {
    const low = String(name || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
    for (const [re, canon] of CANONICAL_ALIASES) {
      if (re.test(low)) return canon;
    }
    const toks = low.split(" ").filter((t) => t && !STOP_WORDS.has(t));
    return (toks.length ? toks : low.split(" ")).slice(0, 2).join("_").toUpperCase();
  }

  function normalizeYM(dateStr) {
    const s = String(dateStr || "").trim();
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (m) {
      let yr = parseInt(m[3], 10);
      if (yr < 100) yr += yr < 50 ? 2000 : 1900;
      return `${String(yr).padStart(4, "0")}-${String(parseInt(m[1], 10)).padStart(2, "0")}`;
    }
    const m2 = s.match(/^(\d{1,2})\/(\d{4})$/);
    if (m2) return `${m2[2]}-${String(parseInt(m2[1], 10)).padStart(2, "0")}`;
    return "";
  }

  function acctDigitsCompatible(aRaw, bRaw) {
    const a = String(aRaw || "").toUpperCase().replace(/[^0-9X*]/g, "");
    const b = String(bRaw || "").toUpperCase().replace(/[^0-9X*]/g, "");
    if (!a || !b) return null;
    const aTail = a.match(/(\d{4})$/);
    const bTail = b.match(/(\d{4})$/);
    if (aTail && bTail) return aTail[1] === bTail[1];
    const aHead = a.match(/^(\d{4,})/);
    const bHead = b.match(/^(\d{4,})/);
    if (aHead && bHead) {
      const n = Math.min(aHead[1].length, bHead[1].length, 6);
      return aHead[1].slice(0, n) === bHead[1].slice(0, n);
    }
    return null;
  }

  function categoryBucket(cat) {
    if (cat === "secured_mortgage") return "mortgage";
    if (cat === "secured_auto") return "auto";
    if (String(cat || "").startsWith("unsecured_card")) return "card";
    if (cat === "unsecured_student") return "student";
    return "other";
  }

  function isSameTradeline(a, b) {
    if (canonicalCreditor(a.creditor_name) !== canonicalCreditor(b.creditor_name)) return false;

    const sameBureau = a.bureaus.some((x) => b.bureaus.includes(x));
    const ymA = normalizeYM(a.date_opened);
    const ymB = normalizeYM(b.date_opened);
    if (ymA && ymB && ymA !== ymB) return false;

    const acctCmp = acctDigitsCompatible(a.account_number_raw, b.account_number_raw);
    if (acctCmp === false) return false;

    const sameOpenMonth = Boolean(ymA && ymB && ymA === ymB);
    const sameExactDate = Boolean(a.date_opened && b.date_opened && a.date_opened === b.date_opened);
    const sameBucket = categoryBucket(a.category) === categoryBucket(b.category);

    if (sameBureau) return Boolean(acctCmp === true && sameExactDate && sameBucket);
    if (acctCmp === true && (sameOpenMonth || sameBucket)) return true;
    if (acctCmp === null && sameOpenMonth && (sameBucket || a.category === "unsecured_other" || b.category === "unsecured_other")) {
      return true;
    }
    if (acctCmp === null && a.balance > 0 && b.balance > 0 && Math.abs(a.balance - b.balance) <= 5 && sameBucket) {
      return true;
    }
    return false;
  }

  const CAT_SPEC = {
    secured_mortgage: 10, secured_auto: 10, priority_dso: 10, priority_tax: 10,
    unsecured_student: 9, unsecured_collection: 8, unsecured_medical: 8,
    secured_other: 7, unsecured_card: 6, unsecured_other: 3,
  };

  function addrScore(tl) {
    return (tl.street ? 3 : 0) + (tl.city ? 2 : 0) + (tl.state ? 1 : 0) + (tl.zip_code ? 2 : 0);
  }

  function mergeTwo(base, other) {
    if (addrScore(other) > addrScore(base)) {
      base.attn = other.attn || base.attn;
      base.street = other.street;
      base.city = other.city;
      base.state = other.state;
      base.zip_code = other.zip_code;
    }
    if (hasTrailingUnmaskedLast4(other.account_number_raw) && !hasTrailingUnmaskedLast4(base.account_number_raw)) {
      base.account_last4 = other.account_last4;
      base.account_number_raw = other.account_number_raw;
    } else if (!base.account_last4 && other.account_last4) {
      base.account_last4 = other.account_last4;
    }
    if (other.balance > base.balance) base.balance = other.balance;
    if (other.monthly_payment > base.monthly_payment) base.monthly_payment = other.monthly_payment;
    if (other.past_due > base.past_due) base.past_due = other.past_due;
    if (!base.date_opened && other.date_opened) base.date_opened = other.date_opened;
    if (!base.date_closed && other.date_closed) base.date_closed = other.date_closed;
    if (!base.original_creditor && other.original_creditor) base.original_creditor = other.original_creditor;

    if ((CAT_SPEC[other.category] || 0) > (CAT_SPEC[base.category] || 0)) {
      base.schedule = other.schedule;
      base.category = other.category;
      base.collateral_desc = other.collateral_desc;
      base.lien_type = other.lien_type;
      base.claim_type = other.claim_type;
      base.claim_type_specify = other.claim_type_specify;
      base.account_type_raw = other.account_type_raw || base.account_type_raw;
      base.loan_type_raw = other.loan_type_raw || base.loan_type_raw;
    }

    if (other.owner === "both" || base.owner === "both") base.owner = "both";
    if (other.is_disputed) base.is_disputed = true;
    if (other.is_authorized_user && !/individual/i.test(base.responsibility_raw || "")) {
      base.is_authorized_user = true;
    }
    if (other.is_closed && base.balance <= 0) base.is_closed = true;
    else if (base.balance > 0) base.is_closed = false;

    if (base.is_closed && base.balance <= 0) {
      base.include_default = false;
      base.skip_reason = "Closed ($0 balance)";
    } else if (base.balance <= 0) {
      base.include_default = false;
      base.skip_reason = "Open ($0 balance)";
    } else if (base.is_authorized_user) {
      base.include_default = false;
      base.skip_reason = "Authorized User";
    } else {
      base.include_default = true;
      base.skip_reason = "";
    }

    for (const b of other.bureaus) if (!base.bureaus.includes(b)) base.bureaus.push(b);
    for (const sf of other.source_files) if (!base.source_files.includes(sf)) base.source_files.push(sf);
    const mergedFlags = Array.from(new Set([...base.flags, ...other.flags].filter((f) => f !== "Missing mailing address")));
    if (!base.street && !base.city) mergedFlags.push("Missing mailing address");
    base.flags = mergedFlags;
    return base;
  }

  function deduplicateTradelines(tradelines) {
    const merged = [];
    let dupsMerged = 0;
    for (const tl of tradelines) {
      let matched = false;
      for (const existing of merged) {
        if (isSameTradeline(existing, tl)) {
          mergeTwo(existing, tl);
          dupsMerged++;
          matched = true;
          break;
        }
      }
      if (!matched) merged.push(tl);
    }
    return { merged, dupsMerged };
  }

  // =========================================================================
  // PDF.JS STREAM-ORDER LINE EXTRACTOR (Browser)
  // =========================================================================
  async function extractPdfTextFromBytes(uint8Array) {
    const pdfjs = (typeof window !== "undefined" && window.pdfjsLib) || null;
    if (!pdfjs) {
      throw new Error("PDF text engine (pdf.js) failed to load. Check internet connection or use local Python server.");
    }
    const loadingTask = pdfjs.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;
    const pages = [];

    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      const lines = [];
      let curLine = "";
      let prevY = null;
      let prevEndX = null;

      for (const item of content.items) {
        if (typeof item.str !== "string") continue;
        const txt = item.str;
        const tr = item.transform || [1, 0, 0, 1, 0, 0];
        const x = tr[4];
        const y = tr[5];
        const w = item.width || 0;

        if (!txt.trim()) {
          if (item.hasEOL && curLine.trim()) {
            lines.push(curLine.trim());
            curLine = "";
            prevY = null;
            prevEndX = null;
          }
          continue;
        }

        let startNewLine = false;
        if (prevY !== null) {
          const dy = Math.abs(y - prevY);
          const gap = prevEndX !== null ? x - prevEndX : 0;
          const isPipeJoin = txt.trim().startsWith("|") || curLine.trim().endsWith("|");
          if (dy > 2.5 || x < (prevEndX || 0) - 25 || (gap > 22 && !isPipeJoin)) {
            startNewLine = true;
          }
        }

        if (startNewLine && curLine.trim()) {
          lines.push(curLine.trim());
          curLine = "";
        }

        if (curLine && !curLine.endsWith(" ") && !txt.startsWith(" ")) {
          const gap = prevEndX !== null && prevY !== null && Math.abs(y - prevY) <= 2.5 ? x - prevEndX : 10;
          curLine += gap > 1.2 ? " " + txt : txt;
        } else {
          curLine += txt;
        }

        prevY = y;
        prevEndX = x + w;

        if (item.hasEOL && curLine.trim()) {
          lines.push(curLine.trim());
          curLine = "";
          prevY = null;
          prevEndX = null;
        }
      }
      if (curLine.trim()) lines.push(curLine.trim());
      pages.push(lines.join("\n"));
    }
    return pages.join("\n");
  }

  // =========================================================================
  // PUBLIC PARSE & CONVERT APIS
  // =========================================================================
  function parseCreditReportText(fullText, filename, defaultOwner) {
    const owner =
      defaultOwner ||
      (/debtor2|spouse/i.test(String(filename || "")) ? "debtor2" : "debtor1");
    const bureau = detectBureau(fullText, filename);
    let items;
    if (bureau === "experian") items = parseExperianText(fullText, filename, owner);
    else if (bureau === "transunion") items = parseTransunionText(fullText, filename, owner);
    else if (bureau === "equifax") items = parseEquifaxText(fullText, filename, owner);
    else items = parseGenericPdfText(fullText, filename, owner);
    return { bureau, items };
  }

  function parseMultipleReportTexts(entries) {
    const allRaw = [];
    const fileSummaries = [];
    for (const entry of entries) {
      const { bureau, items } = parseCreditReportText(entry.text, entry.filename, entry.owner);
      allRaw.push(...items);
      fileSummaries.push({
        filename: entry.filename,
        bureau,
        tradelines_found: items.length,
      });
    }
    const { merged, dupsMerged } = deduplicateTradelines(allRaw);
    const { secured, unsecured } = tradelinesToPetitionCreditors(merged.filter((t) => t.include_default));
    return {
      source: "credit_report_pdf",
      files: fileSummaries,
      raw_count: allRaw.length,
      unique_count: merged.length,
      duplicates_merged: dupsMerged,
      active_count: merged.filter((t) => t.include_default).length,
      skipped_count: merged.filter((t) => !t.include_default).length,
      tradelines: merged,
      secured,
      unsecured,
      count: secured.length + unsecured.length,
    };
  }

  async function parseCreditReportPdfFiles(fileEntries) {
    // fileEntries: [{ filename, bytes: Uint8Array, owner?: "debtor1"|"debtor2" }]
    const textEntries = [];
    for (const fe of fileEntries) {
      const text = await extractPdfTextFromBytes(fe.bytes);
      textEntries.push({ filename: fe.filename, text, owner: fe.owner });
    }
    return parseMultipleReportTexts(textEntries);
  }

  function tradelinesToPetitionCreditors(tradelines) {
    const secured = [];
    const unsecured = [];
    for (const tl of tradelines) {
      const noticeParties = [];
      if (tl.original_creditor && tl.original_creditor.toLowerCase() !== (tl.creditor_name || "").toLowerCase()) {
        noticeParties.push({
          name: tl.original_creditor,
          attn: "Original Creditor",
          street: "",
          city: "",
          state: "",
          zip_code: "",
          account_last4: tl.account_last4 || "",
          ref_line: "",
          ref_part: tl.schedule === "E" ? "Part 1" : "Part 2",
        });
      }

      if (tl.schedule === "D") {
        secured.push({
          name: tl.creditor_name || "",
          attn: tl.attn || "Attn: Bankruptcy",
          street: tl.street || "",
          city: tl.city || "",
          state: tl.state || "",
          zip_code: tl.zip_code || "",
          account_last4: tl.account_last4 || "",
          date_incurred: tl.date_opened || "",
          collateral_desc: tl.collateral_desc || "Secured Collateral",
          claim_amount: Number(tl.balance || 0),
          collateral_value: 0,
          owner: tl.owner || "debtor1",
          lien_type: tl.lien_type || "agreement",
          contingent: false,
          unliquidated: false,
          disputed: Boolean(tl.is_disputed),
          intent: "Keep",
          monthly_payment: Number(tl.monthly_payment || 0),
          arrears: Number(tl.past_due || 0),
          notice_parties: noticeParties,
        });
      } else {
        const isPriority = tl.schedule === "E";
        unsecured.push({
          priority: isPriority,
          name: tl.creditor_name || "",
          attn: tl.attn || "Attn: Bankruptcy",
          street: tl.street || "",
          city: tl.city || "",
          state: tl.state || "",
          zip_code: tl.zip_code || "",
          account_last4: tl.account_last4 || "",
          date_incurred: tl.date_opened || "",
          total_claim: Number(tl.balance || 0),
          priority_amount: isPriority ? Number(tl.balance || 0) : 0,
          owner: tl.owner || "debtor1",
          claim_type: tl.claim_type || "Other",
          claim_type_specify: tl.claim_type_specify || "CreditCard",
          contingent: false,
          unliquidated: false,
          disputed: Boolean(tl.is_disputed),
          offset: false,
          notice_parties: noticeParties,
        });
      }
    }
    return { secured, unsecured };
  }

  /** Non-destructive helper: check if a parsed tradeline matches any existing creditor in caseData (hint only!). */
  function findExistingMatchHint(tl, caseData) {
    if (!caseData) return "";
    const canon = canonicalCreditor(tl.creditor_name);
    const l4 = String(tl.account_last4 || "").trim();
    const allExisting = [
      ...(caseData.secured_creditors || []).map((c) => ({ ...c, _sch: "Sch. D" })),
      ...(caseData.unsecured_creditors || []).map((c) => ({ ...c, _sch: c.priority ? "Sch. E" : "Sch. F" })),
    ];
    for (const ex of allExisting) {
      if (!ex.name) continue;
      if (canonicalCreditor(ex.name) === canon) {
        const exL4 = String(ex.account_last4 || "").trim();
        if (l4 && exL4 && l4 === exL4) {
          return `Possible match in ${ex._sch} (${ex.name} *${exL4})`;
        }
        const exAmt = Number(ex.claim_amount || ex.total_claim || 0);
        if (tl.balance > 0 && exAmt > 0 && Math.abs(tl.balance - exAmt) <= 50) {
          return `Possible match in ${ex._sch} (${ex.name}, $${exAmt.toLocaleString()})`;
        }
      }
    }
    return "";
  }

  return {
    detectBureau,
    parseAddressBlock,
    classifyTradeline,
    canonicalCreditor,
    parseCreditReportText,
    parseMultipleReportTexts,
    parseCreditReportPdfFiles,
    tradelinesToPetitionCreditors,
    findExistingMatchHint,
  };
});
