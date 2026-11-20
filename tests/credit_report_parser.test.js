"use strict";
const assert = require("assert");
const parser = require("../public/credit_report_parser.js");

const SAMPLE_EXPERIAN = `
Annual Credit Report - Experian
Accounts
Account Info
Account Name
PENNYMAC LOAN SERVICES
Account Number
800123XXXXX
Account Type
Mortgage
Responsibility
Joint with JANE DOE
Date Opened
05/15/2019
Status
Open/Never late.
Balance
$245,800
Monthly Payment
$1,840
Payment History
Contact Info
Address
PO BOX 514387,
LOS ANGELES CA 90051

Account Info
Account Name
ALLY FINANCIAL
Account Number
551234XXXXX
Account Type
Auto Loan
Responsibility
Individual
Date Opened
09/10/2023
Status
Open/Never late.
Balance
$18,450
Monthly Payment
$465
Contact Info
Address
PO BOX 380901,
BLOOMINGTON MN 55438

Account Info
Account Name
SANTANDER CONSUMER USA
Account Number
991122XXXXX
Account Type
Auto Loan
Responsibility
Individual
Date Opened
02/01/2021
Status
Repossession / Charge-off
Balance
$7,200
Monthly Payment
-
Contact Info
Address
PO BOX 961245,
FORT WORTH TX 76161

Account Info
Account Name
CAPITAL ONE
Account Number
414709XXXXXXXXXX
Account Type
Credit Card
Responsibility
Authorized user
Date Opened
04/01/2018
Status
Open/Never late.
Balance
$3,100
Monthly Payment
$65
Contact Info
Address
PO BOX 31293,
SALT LAKE CITY UT 84131
`;

const SAMPLE_TRANSUNION = `
Your TransUnion Credit Report
Accounts
Account Name
Account Number
PENNYMAC LOAN SERVICES
8001234****
Address
PO BOX 514387 LOS ANGELES, CA 90051
Monthly Payment
$1,840
Date Opened
05/15/2019
Responsibility
Joint Account
Account Type
Mortgage Account
Loan Type
CONVENTIONAL REAL ESTATE MTG
Balance
$246,100
Pay Status
Current Account

Account Name
Account Number
MIDLAND CREDIT MGMT
445566****
Address
350 CAMINO DE LA REINA SAN DIEGO, CA 92108
Monthly Payment
$0
Date Opened
06/12/2025
Responsibility
Individual Account
Account Type
Collection Account
Loan Type
COLLECTION AGENCY/ATTORNEY
Original Creditor
SYNCHRONY BANK / LOWES
Balance
$2,340
Pay Status
In Collection

Account Name
Account Number
NELNET
778899****
Address
PO BOX 82561 LINCOLN, NE 68501
Monthly Payment
$215
Date Opened
08/20/2014
Responsibility
Individual Account
Account Type
Installment Account
Loan Type
STUDENT LOAN
Balance
$28,900
Pay Status
Current Account

Account Name
Account Number
FL DOR CHILD SUPPORT
110022****
Address
PO BOX 8030 TALLAHASSEE, FL 32314
Monthly Payment
$550
Date Opened
01/05/2022
Responsibility
Individual Account
Account Type
Installment Account
Loan Type
CHILD SUPPORT
Balance
$4,200
Pay Status
Past Due 60 Days
`;

const SAMPLE_EQUIFAX = `
Prepared for:
JOHN DOE
Date: November 20, 2026
Confirmation # 1234567890
PENNYMAC LOAN SERVICES
PO BOX 514387, LOS ANGELES, CA 90051-4387 | (800) 777-4001
Date Reported: 11/10/2026 | Balance: $245,950
Account Number: *9876 | Owner: Joint Account
Loan/Account Type: Conventional Re Mortgage | Status: Pays As Agreed
Date Opened: 05/15/2019
Scheduled Payment Amount: $1,840

ALLY FINANCIAL
PO BOX 380901, BLOOMINGTON, MN 55438 | (888) 925-2559
Date Reported: 11/10/2026 | Balance: $18,450
Account Number: *4321 | Owner: Individual Account
Loan/Account Type: Auto | Status: Pays As Agreed
Date Opened: 09/10/2023
Scheduled Payment Amount: $465

TAMPA GENERAL HOSPITAL
PO BOX 1289, TAMPA, FL 33601 | (813) 844-7000
Date Reported: 10/15/2026 | Balance: $1,480
Account Number: *5544 | Owner: Individual Account
Loan/Account Type: Medical Debt | Status: Past Due
Date Opened: 03/01/2025

OLD PAID CARD - Closed
PO BOX 1000, WILMINGTON, DE 19850 | (800) 555-0100
Date Reported: 01/01/2023 | Balance: $0
Account Number: *1111 | Owner: Individual Account
Loan/Account Type: Credit Card | Status: Pays As Agreed
Date Opened: 01/01/2015
Date Closed: 01/01/2023
`;

const res = parser.parseMultipleReportTexts([
  { filename: "Experian.pdf", text: SAMPLE_EXPERIAN, owner: "debtor1" },
  { filename: "TransUnion.pdf", text: SAMPLE_TRANSUNION, owner: "debtor1" },
  { filename: "Equifax.pdf", text: SAMPLE_EQUIFAX, owner: "debtor1" },
]);

// Raw = 4 EX + 4 TU + 4 EQ = 12; PennyMac merged across all 3 (2 dups) + Ally merged across EX & EQ (1 dup) = 3 dups -> 9 unique
assert.strictEqual(res.raw_count, 12, `Expected 12 raw, got ${res.raw_count}`);
assert.strictEqual(res.duplicates_merged, 3, `Expected 3 merged dups, got ${res.duplicates_merged}`);
assert.strictEqual(res.unique_count, 9, `Expected 9 unique, got ${res.unique_count}`);

const byName = (sub) => res.tradelines.find((t) => t.creditor_name.toLowerCase().includes(sub));

// 1. PennyMac Mortgage -> Schedule D, merged [EX, TU, EQ], highest balance $246,100, Equifax trailing last4 9876, owner both
const pm = byName("pennymac");
assert.strictEqual(pm.schedule, "D");
assert.strictEqual(pm.category, "secured_mortgage");
assert.strictEqual(pm.balance, 246100);
assert.strictEqual(pm.account_last4, "9876");
assert.strictEqual(pm.owner, "both");
assert.strictEqual(pm.bureaus.length, 3);
assert.strictEqual(pm.city, "LOS ANGELES");
assert.strictEqual(pm.state, "CA");

// 2. Ally Auto Loan -> Schedule D, merged [EX, EQ], Equifax trailing last4 4321
const ally = byName("ally");
assert.strictEqual(ally.schedule, "D");
assert.strictEqual(ally.category, "secured_auto");
assert.strictEqual(ally.account_last4, "4321");
assert.strictEqual(ally.bureaus.length, 2);

// 3. Santander Repo Deficiency -> Reclassified from Auto Loan to Schedule F Unsecured!
const sant = byName("santander");
assert.strictEqual(sant.schedule, "F");
assert.strictEqual(sant.category, "unsecured_other");
assert.ok(sant.claim_type_specify.toLowerCase().includes("deficiency"));

// 4. Midland Collection -> Schedule F + Original Creditor captured for notice_parties!
const mid = byName("midland");
assert.strictEqual(mid.schedule, "F");
assert.strictEqual(mid.category, "unsecured_collection");
assert.strictEqual(mid.original_creditor, "SYNCHRONY BANK / LOWES");
const conv = parser.tradelinesToPetitionCreditors([mid]);
assert.strictEqual(conv.unsecured[0].notice_parties[0].name, "SYNCHRONY BANK / LOWES");

// 5. Nelnet Student Loan -> Schedule F StudentLoan
const nel = byName("nelnet");
assert.strictEqual(nel.schedule, "F");
assert.strictEqual(nel.claim_type, "StudentLoan");

// 6. FL DOR Child Support -> Schedule E Priority DSO
const dso = byName("fl dor");
assert.strictEqual(dso.schedule, "E");
assert.strictEqual(dso.category, "priority_dso");
assert.strictEqual(dso.claim_type, "DSO");

// 7. Tampa General Hospital -> Schedule F Medical
const med = byName("tampa general");
assert.strictEqual(med.schedule, "F");
assert.strictEqual(med.category, "unsecured_medical");

// 8. Capital One Authorized User -> skipped by default
const cap = byName("capital one");
assert.strictEqual(cap.is_authorized_user, true);
assert.strictEqual(cap.include_default, false);

// 9. Closed $0 card -> skipped by default, " - Closed" stripped from name
const old = byName("old paid");
assert.strictEqual(old.creditor_name, "OLD PAID CARD");
assert.strictEqual(old.is_closed, true);
assert.strictEqual(old.include_default, false);

// 10. Non-destructive existing-case match hint works without modifying existing case
const hint = parser.findExistingMatchHint(pm, {
  secured_creditors: [{ name: "PennyMac", account_last4: "9876", claim_amount: 245000 }],
  unsecured_creditors: [],
});
assert.ok(hint.includes("Sch. D"), `Expected existing match hint, got: ${hint}`);

console.log("ALL 10 CREDIT REPORT PARSER & CLASSIFICATION ASSERTIONS PASSED!");
