/**
 * Law Offices of Jill McDonald — FLMB Tampa Division
 * Chapter 7 & Chapter 13 Petition Creation & Intake Suite
 * Mapped 1-to-1 to the 22-Page Client Bankruptcy Information Sheet
 */

const STORAGE_KEY_PETITION = "flmb_jill_mcdonald_petition_v1";
const STORAGE_KEY_STANDARDS = "flmb_ch13_custom_standards_v1";

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function fmtCurrency(val) {
  const n = Number(val) || 0;
  const sign = n < 0 ? "-" : "";
  return sign + "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtIntCurrency(val) {
  const n = Number(val) || 0;
  const sign = n < 0 ? "-" : "";
  return sign + "$" + Math.round(Math.abs(n)).toLocaleString("en-US");
}

// Load UST/IRS Standards (shared with index.html)
let standardsStore = clone(DEFAULT_STANDARDS_PRESETS);
try {
  const savedStd = localStorage.getItem(STORAGE_KEY_STANDARDS);
  if (savedStd) {
    const parsed = JSON.parse(savedStd);
    if (parsed && parsed["2026-mid"]) standardsStore = parsed;
  }
} catch (e) {
  console.warn("Could not load standards from localStorage", e);
}

// Page 5 Household Inventory Items (35 items from Intake Sheet Page 5)
const PAGE5_INVENTORY_ITEMS = [
  { key: "stove", label: "Stove / Cooking Unit", cat: "household" },
  { key: "refrigerator", label: "Refrigerator", cat: "household" },
  { key: "washerDryer", label: "Washer / Dryer", cat: "household" },
  { key: "microwave", label: "Microwave", cat: "household" },
  { key: "cookingUtensils", label: "Cooking Utensils", cat: "household" },
  { key: "silverware", label: "Silverware / Flatware", cat: "household" },
  { key: "livingRoomFurn", label: "Living Room Furniture", cat: "household" },
  { key: "diningRoomFurn", label: "Dining Room Furniture", cat: "household" },
  { key: "tableChairs", label: "Table and Chairs", cat: "household" },
  { key: "bedroomFurn", label: "Bedroom Furniture", cat: "household" },
  { key: "dresserNightstands", label: "Dresser / Nightstands", cat: "household" },
  { key: "lampsAccessories", label: "Lamps & Accessories", cat: "household" },
  { key: "deskOfficeFurn", label: "Desk / Office Furniture", cat: "household" },
  { key: "LawnMower", label: "Lawn Mower & Yard Tools", cat: "household" },
  { key: "swimmingPool", label: "Swimming Pool / Equipment", cat: "household" },
  { key: "televisions", label: "Television(s)", cat: "electronics" },
  { key: "vcrDvdCd", label: "VCR / DVD / Compact Disks", cat: "electronics" },
  { key: "stereoEquip", label: "All Other Stereo Equipment", cat: "electronics" },
  { key: "cellPhones", label: "Cell Phones", cat: "electronics" },
  { key: "computers", label: "Computer(s) & Printer(s)", cat: "electronics" },
  { key: "otherElectronics", label: "Other Electronics & Photo Equip", cat: "electronics" },
  { key: "allClothing", label: "All Clothing (Shoes, Coats, etc.)", cat: "apparel" },
  { key: "furs", label: "Furs", cat: "apparel" },
  { key: "weddingRings", label: "Wedding Rings", cat: "jewelry" },
  { key: "otherJewelry", label: "Other Jewelry / Watches", cat: "jewelry" },
  { key: "costumeJewelry", label: "Costume Jewelry", cat: "jewelry" },
  { key: "gunsFirearms", label: "Guns and Firearms", cat: "firearms" },
  { key: "paintingArt", label: "Painting / Art & Collectibles", cat: "collectibles" },
  { key: "carpentryTools", label: "Carpentry Tools", cat: "tools" },
  { key: "mechanicTools", label: "Mechanic Tools", cat: "tools" },
  { key: "boatsTrailersCamper", label: "Boats / Trailers / Camper (Pg 5)", cat: "recreation" }
];

// Page 10 Monthly Living Expenses (Schedule J items from Intake Sheet Page 10)
const PAGE10_SCHEDULE_J_ITEMS = [
  { key: "rent", label: "Rent Payment (If Not Owning Home)" },
  { key: "firstMortgage", label: "First Mortgage / Mobile Home Payment" },
  { key: "secondMortgage", label: "Second Mortgage / HELOC Payment" },
  { key: "thirdMortgageHoa", label: "Third Mortgage / HOA Assessment" },
  { key: "lotPayment", label: "Mobile Home Lot Payment" },
  { key: "realEstateTaxesSep", label: "Real Estate Taxes (If Not in Mortgage)" },
  { key: "homeInsuranceSep", label: "Homeowner's Insurance (If Not in Mortgage)" },
  { key: "homeMaintenance", label: "Monthly Home Maintenance & Repairs" },
  { key: "lawnPoolMaint", label: "Lawn & Pool Maintenance" },
  { key: "electricity", label: "Electricity" },
  { key: "gas", label: "Heating / Natural Gas" },
  { key: "waterSewer", label: "Water and Sewer" },
  { key: "garbage", label: "Garbage Pick-Up" },
  { key: "cellPhone", label: "Cell Phone Bill" },
  { key: "homePhoneInternet", label: "Home Phone & Internet" },
  { key: "cableTv", label: "Cable T.V. / Streaming" },
  { key: "food", label: "Food & Groceries (Monthly)" },
  { key: "clothing", label: "Clothing & Footwear (Monthly)" },
  { key: "laundry", label: "Laundry, Dry Cleaning, Soap" },
  { key: "personalCare", label: "Personal Care Items & Haircuts" },
  { key: "medicalOutPocket", label: "Medical & Dental (Not Paid by Ins.)" },
  { key: "healthInsuranceDir", label: "Health Insurance (Out-of-Pocket)" },
  { key: "lifeInsuranceDir", label: "Life Insurance (Other Than Employer)" },
  { key: "rentersInsurance", label: "Renters Insurance" },
  { key: "autoInsurance", label: "Auto Insurance" },
  { key: "otherInsurance", label: "Other Insurance" },
  { key: "gasoline", label: "Gasoline, Fuel & Auto Maintenance" },
  { key: "carPayment1", label: "Motor Vehicle Payment #1" },
  { key: "carPayment2", label: "Motor Vehicle Payment #2" },
  { key: "boatRvPayment", label: "Boat / RV Payment" },
  { key: "furnitureJewelryPmt", label: "Furniture / Jewelry Payments" },
  { key: "childCare", label: "Child Care / Daycare" },
  { key: "infantExpenses", label: "Infant Expenses" },
  { key: "schoolLunchExpenses", label: "School Lunch & School Expenses" },
  { key: "tuitionPayments", label: "Tuition Payments (Not Loans)" },
  { key: "studentLoanPmt", label: "Student Loan Repayment" },
  { key: "alimonyChildSupport", label: "Alimony or Child Support Paid" },
  { key: "paymentsOutsideHome", label: "Support for Family / Outside Home" },
  { key: "charitableGiving", label: "Charitable Giving (Tithing)" },
  { key: "pastDueTaxesPmt", label: "Past Due Taxes Payment" },
  { key: "unionProfDues", label: "Union & Professional Dues / Uniforms" },
  { key: "recreationBooks", label: "Recreation, Newspapers & Books" }
];

// Pages 11-21 Statement of Financial Affairs (SOFA) Questions
const SOFA_QUESTIONS = [
  { key: "priorSpouses", page: "Pg 11", title: "Former Spouses within Past 8 Years", prompt: "List names and marriage dates of past/present spouses.", warnIfYes: false },
  { key: "coOwnedProperty", page: "Pg 11", title: "Co-Ownership of Real Property / Timeshares / Future Interest", prompt: "Do you share ownership of real property with a non-spouse or own a timeshare?", warnIfYes: true, warnMsg: "Co-owned property or timeshare interest must be disclosed on Schedule A/B and evaluated for partition/liquidation risk." },
  { key: "propertyHeldForOther", page: "Pg 11", title: "Motor Vehicle or Property in Your Possession Titled to Someone Else", prompt: "Holding a car, truck, boat, or property titled in another person's name?", warnIfYes: false },
  { key: "installmentOrPmsi", page: "Pgs 12–13", title: "Installment Purchases, Rent-to-Own, or Personal Property Pledged as Collateral", prompt: "Buying furniture, appliances, tools, or jewelry on installment/rent-to-own or non-PMSI loan?", warnIfYes: true, warnMsg: "Check whether lender holds a valid security interest (Schedule D) or executory lease (Schedule G) and evaluate lien avoidance under 11 U.S.C. § 522(f)." },
  { key: "closedBankAccounts", page: "Pg 13", title: "Closed Bank or Financial Accounts Within Past 2 Years", prompt: "Have you closed any checking, savings, or financial accounts in the past 2 years?", warnIfYes: false },
  { key: "safeDepositOrPawn", page: "Pgs 14 & 17", title: "Safe Deposit Box, Storage Unit, Repairman, or Pawnbroker Holding Property", prompt: "Any rented safe deposit box (past 2 yrs) or property held by a storage unit/pawnbroker?", warnIfYes: false },
  { key: "roommateRelativesSupport", page: "Pg 15", title: "Roommate or Relative Contributions to Monthly Living Expenses", prompt: "Does a roommate or relative help pay part of your monthly living expenses?", warnIfYes: true, warnMsg: "Regular household contributions from roommates or relatives must be included on Schedule I Line 8h and Form 122A-1 / 122C-1 Line 8." },
  { key: "courtFinesOrBackSupport", page: "Pg 16", title: "Court Fines / Traffic Tickets or Back Child Support Arrears", prompt: "Owe any court fines/tickets or behind on child support payments?", warnIfYes: true, warnMsg: "Government fines/penalties (§ 523(a)(7)) and Domestic Support Obligations (§ 523(a)(5) / § 507(a)(1)) are non-dischargeable priority/excepted claims." },
  { key: "accidentsInheritanceClaims", page: "Pgs 16–18", title: "Personal Injury / Auto Accident, Inheritance, Life Ins. Recovery, or Unpaid Wages", prompt: "Involved in an accident, expecting an inheritance/insurance payout, or owed back wages/judgments?", warnIfYes: true, warnMsg: "CRITICAL ASSET ALERT: Any pending personal injury claim, unliquidated lawsuit, or inheritance within 180 days post-petition (§ 541(a)(5)) MUST be scheduled on Schedule A/B or judicial estoppel may bar recovery!" },
  { key: "preferencePayments", page: "Pg 18", title: "Unusual / Catch-Up Loan Payments to Creditors (> $600 in Past 90 Days)", prompt: "Made catch-up payments, paid off loans, or paid >$600 to a creditor in the past 90 days?", warnIfYes: true, warnMsg: "PREFERENCE ALERT (11 U.S.C. § 547): Payments > $600 to a creditor within 90 days before filing must be disclosed on SOFA Part 3 and may be recoverable by a Ch. 7 Trustee." },
  { key: "pendingLawsuitsGarnishments", page: "Pg 19", title: "Pending Lawsuits, Wage Garnishments, Repossessions, or Foreclosures", prompt: "Any lawsuits pending against you, wages garnished, or property repossessed/foreclosed in past year?", warnIfYes: true, warnMsg: "Pending lawsuits and active wage garnishments require immediate Notice of Bankruptcy filing and suggestion of bankruptcy in state court (Pinellas/Hillsborough Clerk)." },
  { key: "giftsOrInsiderTransfers", page: "Pg 19", title: "Gifts, Transfers of Property, or Debt Repayments to Family / Friends (Insiders)", prompt: "Transferred money/property to family or friends or paid them back on debts within the past 2 years?", warnIfYes: true, warnMsg: "INSIDER / FRAUDULENT TRANSFER ALERT (11 U.S.C. §§ 547, 548 & Fla. Stat. Ch. 726): Transfers or repayments to family/insiders within 1–4 years are scrutinized by FLMB Trustees!" },
  { key: "lossesGamblingTheftFire", page: "Pg 19", title: "Unusual Losses from Fire, Theft, Casualty, or Gambling", prompt: "Any losses from fire, theft, gambling, or disaster within the past year?", warnIfYes: false },
  { key: "priorBankruptcy8Yrs", page: "Pg 20", title: "Prior Bankruptcy Filing Within the Last 8 Years", prompt: "Have you filed Chapter 7, 13, or 11 bankruptcy within the past 8 years?", warnIfYes: true, warnMsg: "PRIOR DISCHARGE / AUTOMATIC STAY BAR CHECK: Verify 8-year bar for Ch. 7 (§ 727(a)(8)), 4-year bar for Ch. 7-to-Ch. 13 (§ 1328(f)(1)), and whether a Motion to Extend/Impose Automatic Stay (§ 362(c)(3)/(4)) must be filed within 30 days!" },
  { key: "priorAddresses", page: "Pg 20", title: "Lived at Any Other Address Within the Past 3 Years", prompt: "Have you lived at any other address besides your current address in the past 3 years?", warnIfYes: false }
];

// Page 22 Document Checklist Items
const PAGE22_CHECKLIST_ITEMS = [
  { key: "creditCounseling", label: "1. Certificate of Pre-Filing Credit Counseling (11 U.S.C. § 109(h))" },
  { key: "sixMonthsPaystubs", label: "2. Six (6) Months of Recent Paycheck Stubs (or April & October Boundary YTD Stubs)" },
  { key: "otherIncomeDocs", label: "3. Documents Showing Income from Sources Other Than Employment for Six (6) Months" },
  { key: "taxReturns2Yrs", label: "4. Federal Tax Returns for Past Two (2) Years and W-2s / 1099s" },
  { key: "bankStatements3Mos", label: "5. Complete Bank Statements for the Last Three (3) Months (All Pages)" },
  { key: "divorceDissolution", label: "6. Separation Agreements or Decrees of Dissolution / Divorce Within Past One (1) Year" },
  { key: "lawsuits2Yrs", label: "7. Copies of Any Lawsuits Filed By or Against Debtor Within the Past Two (2) Years" },
  { key: "billingStatementsOwed", label: "8. Current Billing Statements / Collection Letters Evidencing Money Owed" },
  { key: "summonsesComplaints", label: "9. Copies of All Summonses, Complaints, or Foreclosure Court Documents Served" },
  { key: "disabledVetSafeHarbor", label: "10. Verification of Disabled Veteran Status (If Asserting § 707(b)(2)(D) Safe Harbor)" }
];

// Sample Complete Intake Case (Pinellas Park / Law Offices of Jill McDonald)
function getSampleIntakeCase() {
  const inv = {};
  PAGE5_INVENTORY_ITEMS.forEach(item => { inv[item.key] = 0; });
  inv.stove = 75;
  inv.refrigerator = 120;
  inv.washerDryer = 110;
  inv.microwave = 20;
  inv.cookingUtensils = 25;
  inv.silverware = 15;
  inv.livingRoomFurn = 250;
  inv.diningRoomFurn = 125;
  inv.bedroomFurn = 225;
  inv.dresserNightstands = 80;
  inv.televisions = 110;
  inv.cellPhones = 150;
  inv.computers = 140;
  inv.allClothing = 200;
  inv.weddingRings = 350;
  inv.LawnMower = 65;

  const schJ = {};
  PAGE10_SCHEDULE_J_ITEMS.forEach(item => { schJ[item.key] = 0; });
  schJ.firstMortgage = 1685;
  schJ.thirdMortgageHoa = 95;
  schJ.homeMaintenance = 75;
  schJ.electricity = 245;
  schJ.waterSewer = 85;
  schJ.garbage = 25;
  schJ.cellPhone = 145;
  schJ.homePhoneInternet = 75;
  schJ.cableTv = 45;
  schJ.food = 825;
  schJ.clothing = 95;
  schJ.laundry = 40;
  schJ.personalCare = 65;
  schJ.medicalOutPocket = 110;
  schJ.autoInsurance = 235;
  schJ.gasoline = 290;
  schJ.carPayment1 = 445;
  schJ.carPayment2 = 310;
  schJ.childCare = 250;
  schJ.schoolLunchExpenses = 85;
  schJ.recreationBooks = 40;

  const sofa = {};
  SOFA_QUESTIONS.forEach(q => {
    sofa[q.key] = { answer: "no", details: "" };
  });
  sofa.pendingLawsuitsGarnishments = {
    answer: "yes",
    details: "Discover Bank v. Debtor, Case No. 26-004182-CO, Pinellas County Court (Complaint served Oct 2026)"
  };

  const docs = {};
  PAGE22_CHECKLIST_ITEMS.forEach(d => { docs[d.key] = true; });
  docs.disabledVetSafeHarbor = false;

  return {
    chapter: "7",
    filingType: "joint",
    filingDate: "2026-11-17",
    householdSize: 3,
    d1Name: "Michael Anthony Vance",
    d1Dob: "1982-04-14",
    d1Ssn: "xxx-xx-4821",
    d1Street: "7420 66th Street North",
    d1City: "Pinellas Park",
    d1State: "FL",
    d1Zip: "33781",
    county: "Pinellas",
    yearsAtAddress: 5.5,
    d1Phone: "(727) 555-0188",
    d1Email: "mvance82@example.com",
    mailingAddress: "",
    d2Name: "Sarah Marie Vance",
    d2Dob: "1984-09-22",
    d2Ssn: "xxx-xx-9034",
    d2Contact: "(727) 555-0189 • svance@example.com",
    dependents: [
      { name: "E.M.V. (Daughter)", age: 9, relationship: "Daughter", livesWith: "yes" },
      { name: "", age: "", relationship: "", livesWith: "yes" },
      { name: "", age: "", relationship: "", livesWith: "yes" },
      { name: "", age: "", relationship: "", livesWith: "yes" },
      { name: "", age: "", relationship: "", livesWith: "yes" }
    ],
    otherNamesUsed: "Sarah Marie Miller (Maiden Name, used prior to 2019)",
    incomeChangeNote: "Debtor 1 overtime hours were reduced in September 2026.",
    ownRealEstate: "yes",
    reIsPrimary: "yes",
    reType: "Single-Family House",
    reDeedNames: "Michael Anthony Vance and Sarah Marie Vance, Husband and Wife",
    reAddress: "7420 66th Street North, Pinellas Park, FL 33781",
    reValue: 335000,
    reMtg1Company: "Freedom Mortgage Corp., PO Box 8068, Virginia Beach, VA 23450",
    reMtg1Acct: "Acct #8832 • Orig 2020",
    reMtg1Monthly: 1685.00,
    reMtg1Payoff: 248500,
    reMtg1Arrears: 0,
    reForeclosure: "no",
    reIntent: "Retain",
    reMtg2Company: "",
    reMtg2Monthly: 0,
    reMtg2Payoff: 0,
    reMtg2Arrears: 0,
    reCollector: "",
    ownMobileHome: "no",
    homesteadRecent1215: "no",
    mhAttached: "no",
    mhLotRent: 0,
    mhDescription: "",
    inventory: inv,
    vehicles: [
      {
        type: "Automobile",
        year: "2021",
        make: "Honda",
        model: "CR-V EX",
        mileage: "58,400",
        condition: "Good",
        titleNames: "Michael A. Vance",
        lender: "Suncoast Credit Union, PO Box 11904, Tampa, FL 33680",
        acctNum: "9104",
        monthlyPmt: 445.00,
        monthsBehind: 0,
        value: 19500,
        payoff: 15200,
        intent: "Retain"
      },
      {
        type: "Automobile",
        year: "2019",
        make: "Toyota",
        model: "Corolla LE",
        mileage: "79,200",
        condition: "Good",
        titleNames: "Sarah M. Vance",
        lender: "Southeast Toyota Finance, PO Box 991817, Mobile, AL 36691",
        acctNum: "3319",
        monthlyPmt: 310.00,
        monthsBehind: 0,
        value: 12800,
        payoff: 8400,
        intent: "Retain"
      },
      {
        type: "Automobile",
        year: "",
        make: "",
        model: "",
        mileage: "",
        condition: "Fair",
        titleNames: "",
        lender: "",
        acctNum: "",
        monthlyPmt: 0,
        monthsBehind: 0,
        value: 0,
        payoff: 0,
        intent: "Retain"
      }
    ],
    bank1Name: "Suncoast Credit Union (Checking & Savings)",
    bank1Bal: 840.00,
    bank2Name: "Regions Bank (Checking)",
    bank2Bal: 315.00,
    securityDeposits: 0,
    retirementBal: 42800.00,
    wholeLifeCash: 0,
    stocksBonds: 0,
    taxRefund: 1200.00,
    claimsOwed: 0,
    // Pages 7-9 Income & Two-Statement YTD
    d1Employer: "Jabil Inc. — St. Petersburg, FL",
    d1JobTitle: "Logistics Coordinator • 5 Years",
    d1PayFreq: "biweekly",
    d1YtdCurrent: 49500.00,
    d1GrossLastYr: 57200.00,
    d1Gross2YrsAgo: 54800.00,
    d1BaselineYtd: 19800.00, // Last stub of April
    d1EndingYtd: 49500.00,   // Last stub of October -> $29,700 over 6 mos = $4,950/mo
    d1MoTaxes: 745.00,
    d1MoHealth: 365.00,
    d1MoRetire: 195.00,
    d1MoUnionDso: 0,
    d1MoSocSec: 0,
    d1MoOtherInc: 0,
    d2Employer: "Pinellas County Schools — Largo, FL",
    d2GrossLastYr: 28400.00,
    d2Gross2YrsAgo: 26900.00,
    d2BaselineYtd: 9600.00,  // Last stub of April
    d2EndingYtd: 24000.00,   // Last stub of October -> $14,400 over 6 mos = $2,400/mo
    d2MoTaxes: 285.00,
    d2MoHealth: 110.00,
    d2MoRetire: 72.00,
    bizGross: 0,
    bizExpenses: 0,
    bizTaxesFiled: "yes",
    unfiledTaxYears: "",
    scheduleJ: schJ,
    sofa: sofa,
    creditors: [
      { name: "Discover Bank", address: "PO Box 3025, New Albany, OH 43054", acct: "4412", type: "Unsecured Credit Card", amount: 14850.00 },
      { name: "Capital One, N.A.", address: "PO Box 30285, Salt Lake City, UT 84130", acct: "8819", type: "Unsecured Credit Card", amount: 9420.00 },
      { name: "BayCare Alliant Hospital", address: "PO Box 405893, Atlanta, GA 30384", acct: "2091", type: "Medical Bill", amount: 4680.00 },
      { name: "Synchrony Bank / CareCredit", address: "PO Box 965036, Orlando, FL 32896", acct: "7734", type: "Medical Credit Line", amount: 6150.00 },
      { name: "U.S. Dept. of Education / Nelnet", address: "PO Box 82561, Lincoln, NE 68501", acct: "5502", type: "Student Loan (Pg 16)", amount: 18900.00 }
    ],
    checklist: docs,
    outputMode: "petition"
  };
}

function getBlankIntakeCase(current) {
  const sample = getSampleIntakeCase();
  const inv = {};
  PAGE5_INVENTORY_ITEMS.forEach(item => { inv[item.key] = 0; });
  const schJ = {};
  PAGE10_SCHEDULE_J_ITEMS.forEach(item => { schJ[item.key] = 0; });
  const sofa = {};
  SOFA_QUESTIONS.forEach(q => { sofa[q.key] = { answer: "no", details: "" }; });
  const docs = {};
  PAGE22_CHECKLIST_ITEMS.forEach(d => { docs[d.key] = false; });

  return {
    ...sample,
    filingDate: new Date().toISOString().slice(0, 10),
    householdSize: 1,
    d1Name: "",
    d1Dob: "",
    d1Ssn: "",
    d1Street: "",
    d1City: "",
    d1State: "FL",
    d1Zip: "",
    county: current?.county || "Pinellas",
    yearsAtAddress: 3.0,
    d1Phone: "",
    d1Email: "",
    mailingAddress: "",
    d2Name: "",
    d2Dob: "",
    d2Ssn: "",
    d2Contact: "",
    dependents: [
      { name: "", age: "", relationship: "", livesWith: "yes" },
      { name: "", age: "", relationship: "", livesWith: "yes" },
      { name: "", age: "", relationship: "", livesWith: "yes" },
      { name: "", age: "", relationship: "", livesWith: "yes" },
      { name: "", age: "", relationship: "", livesWith: "yes" }
    ],
    otherNamesUsed: "",
    incomeChangeNote: "",
    ownRealEstate: "no",
    reDeedNames: "",
    reAddress: "",
    reValue: 0,
    reMtg1Company: "",
    reMtg1Acct: "",
    reMtg1Monthly: 0,
    reMtg1Payoff: 0,
    reMtg1Arrears: 0,
    reMtg2Company: "",
    reMtg2Monthly: 0,
    reMtg2Payoff: 0,
    reMtg2Arrears: 0,
    reCollector: "",
    ownMobileHome: "no",
    mhLotRent: 0,
    mhDescription: "",
    inventory: inv,
    vehicles: [1, 2, 3].map(() => ({
      type: "Automobile", year: "", make: "", model: "", mileage: "", condition: "Good",
      titleNames: "", lender: "", acctNum: "", monthlyPmt: 0, monthsBehind: 0, value: 0, payoff: 0, intent: "Retain"
    })),
    bank1Name: "",
    bank1Bal: 0,
    bank2Name: "",
    bank2Bal: 0,
    securityDeposits: 0,
    retirementBal: 0,
    wholeLifeCash: 0,
    stocksBonds: 0,
    taxRefund: 0,
    claimsOwed: 0,
    d1Employer: "",
    d1JobTitle: "",
    d1YtdCurrent: 0,
    d1GrossLastYr: 0,
    d1Gross2YrsAgo: 0,
    d1BaselineYtd: 0,
    d1EndingYtd: 0,
    d1MoTaxes: 0,
    d1MoHealth: 0,
    d1MoRetire: 0,
    d1MoUnionDso: 0,
    d1MoSocSec: 0,
    d1MoOtherInc: 0,
    d2Employer: "",
    d2GrossLastYr: 0,
    d2Gross2YrsAgo: 0,
    d2BaselineYtd: 0,
    d2EndingYtd: 0,
    d2MoTaxes: 0,
    d2MoHealth: 0,
    d2MoRetire: 0,
    bizGross: 0,
    bizExpenses: 0,
    bizTaxesFiled: "yes",
    unfiledTaxYears: "",
    scheduleJ: schJ,
    sofa: sofa,
    creditors: [
      { name: "", address: "", acct: "", type: "Unsecured Credit Card", amount: 0 }
    ],
    checklist: docs
  };
}

let petState = getSampleIntakeCase();
let previousPetSnapshot = null;

try {
  const saved = localStorage.getItem(STORAGE_KEY_PETITION);
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed && parsed.inventory) petState = parsed;
  }
} catch (e) {
  console.warn("Could not load petition state", e);
}

function savePetState() {
  try {
    localStorage.setItem(STORAGE_KEY_PETITION, JSON.stringify(petState));
  } catch (e) {
    console.warn("Could not save petition state", e);
  }
}

function showPetToast(msg, allowUndo = false) {
  const banner = document.getElementById("petToastBanner");
  const msgEl = document.getElementById("petToastMessage");
  const undoBtn = document.getElementById("btnPetUndo");
  if (!banner || !msgEl) return;
  msgEl.innerHTML = msg;
  if (undoBtn) undoBtn.style.display = allowUndo && previousPetSnapshot ? "inline-flex" : "none";
  banner.style.display = "block";
}

// ============================================================================
// CORE PETITION, EXEMPTIONS, MEANS TEST & WATCHDOG ANALYZER
// ============================================================================

function analyzePetition() {
  const std = standardsStore["2026-mid"];
  const countyKey = std.counties[petState.county] ? petState.county : "Pinellas";
  const countyData = std.counties[countyKey];
  const isJoint = petState.filingType === "joint";
  const hhSize = Math.max(1, parseInt(petState.householdSize, 10) || 1);

  // Lookback months from filingDate
  let fDate = petState.filingDate ? new Date(petState.filingDate + "T12:00:00") : new Date();
  if (isNaN(fDate.getTime())) fDate = new Date();
  const endMo = new Date(fDate.getFullYear(), fDate.getMonth(), 0);
  const startMo = new Date(endMo.getFullYear(), endMo.getMonth() - 5, 1);
  const baseMo = new Date(startMo.getFullYear(), startMo.getMonth() - 1, 1);
  const fmtMoShort = (dt) => dt.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  const baselineMonthLabel = fmtMoShort(baseMo);
  const endingMonthLabel = fmtMoShort(endMo);

  // 1. Real Estate & Homestead Exemption Analysis (Schedule A/B Part 1 & Schedule C)
  const ownsRe = petState.ownRealEstate === "yes";
  const reVal = ownsRe ? (Number(petState.reValue) || 0) : 0;
  const reMtgTotal = ownsRe ? ((Number(petState.reMtg1Payoff) || 0) + (Number(petState.reMtg2Payoff) || 0)) : 0;
  const reArrearsTotal = ownsRe ? ((Number(petState.reMtg1Arrears) || 0) + (Number(petState.reMtg2Arrears) || 0)) : 0;
  const reEquity = Math.max(0, reVal - reMtgTotal);
  const claimsHomestead = ownsRe && petState.reIsPrimary === "yes" && petState.reIntent === "Retain";
  // 11 U.S.C. § 522(p) cap if acquired within 1,215 days ($214,000 per debtor adjusted cap)
  const homesteadCapPerDebtor = 214000 * (isJoint ? 2 : 1);
  const exemptHomestead = claimsHomestead
    ? (petState.homesteadRecent1215 === "yes" ? Math.min(reEquity, homesteadCapPerDebtor) : reEquity)
    : 0;
  const nonExemptRealEstate = Math.max(0, reEquity - exemptHomestead);

  // 2. Household Inventory (Page 5) & Financial Assets
  const totalInventoryVal = Object.values(petState.inventory || {}).reduce((acc, v) => acc + (Number(v) || 0), 0);
  const cashAndBanks = (Number(petState.bank1Bal) || 0) + (Number(petState.bank2Bal) || 0) + (Number(petState.securityDeposits) || 0);
  const retirementTotal = Number(petState.retirementBal) || 0; // 100% exempt under Fla. Stat. § 222.21
  const wholeLifeCash = Number(petState.wholeLifeCash) || 0;   // 100% exempt under Fla. Stat. § 222.14
  const nonExemptibleFinancial = (Number(petState.stocksBonds) || 0) + (Number(petState.taxRefund) || 0) + (Number(petState.claimsOwed) || 0);

  // 3. Motor Vehicles & Florida $5,000 per debtor Motor Vehicle Exemption (Fla. Stat. § 222.25(1))
  const vehicleExemptionCapPerCar = 5000;
  let totalVehicleValue = 0;
  let totalVehicleDebt = 0;
  let totalVehicleExempt = 0;
  let totalVehicleNonExempt = 0;

  const vehicleBreakdown = (petState.vehicles || []).map((v, idx) => {
    const val = Number(v.value) || 0;
    const debt = Number(v.payoff) || 0;
    const eq = Math.max(0, val - debt);
    // Up to $5,000 exemption per debtor
    const maxCarEx = (idx === 0 || isJoint) ? vehicleExemptionCapPerCar : 0;
    const claimedEx = Math.min(eq, maxCarEx);
    const excessEq = Math.max(0, eq - claimedEx);
    totalVehicleValue += val;
    totalVehicleDebt += debt;
    totalVehicleExempt += claimedEx;
    totalVehicleNonExempt += excessEq;
    return { ...v, val, debt, eq, claimedEx, excessEq };
  });

  // 4. Florida Personal Property Constitutional Exemption ($1,000/debtor) + Wildcard ($4,000/debtor if NOT claiming Homestead)
  const flConstitutionalPersonalPropAllowance = 1000 * (isJoint ? 2 : 1);
  const flWildcardAllowance = !claimsHomestead ? (4000 * (isJoint ? 2 : 1)) : 0;
  const totalPersonalPropExemptionPool = flConstitutionalPersonalPropAllowance + flWildcardAllowance;

  const personalPropPoolNeeded = totalInventoryVal + cashAndBanks + nonExemptibleFinancial + totalVehicleNonExempt;
  const personalPropExemptUsed = Math.min(personalPropPoolNeeded, totalPersonalPropExemptionPool);
  const nonExemptPersonalProp = Math.max(0, personalPropPoolNeeded - personalPropExemptUsed);
  const totalNonExemptEquity = nonExemptRealEstate + nonExemptPersonalProp;

  const totalAssets = reVal + totalVehicleValue + totalInventoryVal + cashAndBanks + retirementTotal + wholeLifeCash + nonExemptibleFinancial;

  // 5. Liabilities (Schedule D Secured + Schedule E/F Unsecured)
  const totalSecuredDebt = reMtgTotal + totalVehicleDebt;
  const totalUnsecuredDebt = (petState.creditors || []).reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
  const totalLiabilities = totalSecuredDebt + totalUnsecuredDebt;

  // 6. Income (Two-Statement YTD: Ending YTD minus Baseline YTD ÷ 6) & Schedule I vs. Schedule J
  const d1SixMoGross = Math.max(0, (Number(petState.d1EndingYtd) || 0) - (Number(petState.d1BaselineYtd) || 0));
  const d1MonthlyGross = d1SixMoGross / 6.0;
  const d2SixMoGross = Math.max(0, (Number(petState.d2EndingYtd) || 0) - (Number(petState.d2BaselineYtd) || 0));
  const d2MonthlyGross = d2SixMoGross / 6.0;
  const netBizMonthly = Math.max(0, (Number(petState.bizGross) || 0) - (Number(petState.bizExpenses) || 0));
  const otherIncMonthly = Number(petState.d1MoOtherInc) || 0;
  const socSecExcluded = Number(petState.d1MoSocSec) || 0;

  const totalMonthlyCmi = d1MonthlyGross + d2MonthlyGross + netBizMonthly + otherIncMonthly;
  const annualizedCmi = totalMonthlyCmi * 12.0;

  let flMedianAnnual = 0;
  if (hhSize <= 4) flMedianAnnual = std.floridaMedianAnnual[hhSize];
  else flMedianAnnual = std.floridaMedianAnnual[4] + (hhSize - 4) * std.floridaMedianAnnual.additionalPerson;
  const isAboveMedian = annualizedCmi > flMedianAnnual;

  // Schedule I Net Take-Home Pay (includes Social Security)
  const totalPayrollDeductions =
    (Number(petState.d1MoTaxes) || 0) +
    (Number(petState.d1MoHealth) || 0) +
    (Number(petState.d1MoRetire) || 0) +
    (Number(petState.d1MoUnionDso) || 0) +
    (Number(petState.d2MoTaxes) || 0) +
    (Number(petState.d2MoHealth) || 0) +
    (Number(petState.d2MoRetire) || 0);

  const scheduleIMonthlyNet = totalMonthlyCmi + socSecExcluded - totalPayrollDeductions;
  const scheduleJMonthlyTotal = Object.values(petState.scheduleJ || {}).reduce((acc, v) => acc + (Number(v) || 0), 0);
  const scheduleJNetMonthlyIncome = scheduleIMonthlyNet - scheduleJMonthlyTotal;

  // 7. Means Test Calculation (Forms 122A-2 / 122C-2)
  const natFood = hhSize <= 4
    ? std.nationalFoodClothingOther[hhSize].total
    : std.nationalFoodClothingOther[4].total + (hhSize - 4) * std.nationalFoodClothingOther.additionalPerson.total;
  const countyHhKey = Math.min(5, hhSize);
  const housingUtilitiesNonMtg = countyData.nonMortgage[countyHhKey];
  const housingMtgStd = countyData.mortgageRent[countyHhKey];
  const ongoingHomeSecured = (Number(petState.reMtg1Monthly) || 0) + (Number(petState.reMtg2Monthly) || 0) + (Number(petState.scheduleJ?.thirdMortgageHoa) || 0);
  const netHousingStd = Math.max(0, housingMtgStd - ongoingHomeSecured);

  const activeCars = vehicleBreakdown.filter(v => v.year || v.make || v.val > 0).length;
  const opRegion = std.transportation.operatingByRegion[countyData.msaRegion];
  const vehicleOperatingStd = activeCars === 0 ? 0 : (activeCars === 1 ? opRegion.oneCar : opRegion.twoCars);
  const car1LoanPmt = Number(vehicleBreakdown[0]?.monthlyPmt) || 0;
  const car2LoanPmt = Number(vehicleBreakdown[1]?.monthlyPmt) || 0;
  const netCar1OwnStd = car1LoanPmt > 0 ? Math.max(0, std.transportation.ownershipOneCar - car1LoanPmt) : 0;
  const netCar2OwnStd = car2LoanPmt > 0 ? Math.max(0, std.transportation.ownershipOneCar - car2LoanPmt) : 0;
  const healthOutPocketStd = hhSize * std.healthCareOutOfPocket.under65;

  const totalIrsStandards =
    natFood + housingUtilitiesNonMtg + netHousingStd + vehicleOperatingStd + netCar1OwnStd + netCar2OwnStd + healthOutPocketStd;

  const totalSecuredAndArrearsMonthly =
    ongoingHomeSecured + car1LoanPmt + car2LoanPmt + (reArrearsTotal / 60.0);

  const extraNecessaryMonthly =
    (Number(petState.d1MoTaxes) || 0) + (Number(petState.d2MoTaxes) || 0) +
    (Number(petState.d1MoHealth) || 0) + (Number(petState.d2MoHealth) || 0) +
    (Number(petState.d1MoUnionDso) || 0) +
    (Number(petState.scheduleJ?.childCare) || 0) +
    (Number(petState.scheduleJ?.medicalOutPocket) || 0) +
    (Number(petState.scheduleJ?.charitableGiving) || 0);

  const ch13RetireDeduction = (Number(petState.d1MoRetire) || 0) + (Number(petState.d2MoRetire) || 0);

  const ch7DisposableMonthly = totalMonthlyCmi - (totalIrsStandards + extraNecessaryMonthly + totalSecuredAndArrearsMonthly);
  const ch13DisposableMonthly = ch7DisposableMonthly - ch13RetireDeduction;

  // 8. Official Form Changes & Case Audit Watchdog Alerts
  const alerts = [];

  // Standing Form & Statutory Watchdog Notices
  alerts.push({
    level: "info",
    category: "Statutory Exemption Update",
    title: "Florida $5,000 Motor Vehicle Exemption Applied (Fla. Stat. § 222.25(1))",
    desc: "Active statutory cap of $5,000 per debtor ($10,000 joint) is automatically applied on Schedule C (replacing legacy $1,000 limit)."
  });
  alerts.push({
    level: "info",
    category: "Official Forms & UST Standards",
    title: `Official Forms 101–122 & ${std.label} Active`,
    desc: "All Official Bankruptcy Forms (Form 101, Schedules A/B–J, Form 107 SOFA, Forms 122A/122C) and 2026 U.S. Trustee / IRS standards for the FLMB Tampa Division are verified current."
  });

  // Case-Specific Watchdog Warnings from the 22-Page Intake Sheet
  if ((Number(petState.yearsAtAddress) || 0) < 2.0) {
    alerts.push({
      level: "warn",
      category: "Intake Page 1 — Domicile / Exemptions",
      title: "Less Than 2 Years (730 Days) at Current Florida Address (11 U.S.C. § 522(b)(3)(A))",
      desc: `Client reported ${petState.yearsAtAddress} years at current address. Verify continuous Florida domicile for the past 730 days; otherwise prior state's exemptions or Federal exemptions apply!`
    });
  }

  if (petState.bizTaxesFiled === "no" || (petState.unfiledTaxYears && petState.unfiledTaxYears.trim().toLowerCase() !== "none" && petState.unfiledTaxYears.trim() !== "")) {
    alerts.push({
      level: "danger",
      category: "Intake Page 9 / 21 — Unfiled Tax Returns",
      title: "Unfiled Federal Income Tax Returns Detected (11 U.S.C. §§ 521(e)(2) & 1308)",
      desc: `Unfiled tax years noted (${petState.unfiledTaxYears || "See Page 9"}). Most recent tax return must be provided to the Trustee at least 7 days before the § 341 Meeting of Creditors, and past 4 years must be filed for Chapter 13 confirmation!`
    });
  }

  if (totalNonExemptEquity > 0) {
    alerts.push({
      level: "warn",
      category: "Intake Pages 3–6 — Non-Exempt Equity",
      title: `${fmtCurrency(totalNonExemptEquity)} in Estimated Non-Exempt Equity Detected (Schedule C Audit)`,
      desc: `In Chapter 7, ${fmtCurrency(totalNonExemptEquity)} is exposed to turnover/buyback with the FLMB Chapter 7 Trustee. In Chapter 13, unsecured creditors must receive at least ${fmtCurrency(totalNonExemptEquity)} under the § 1325(a)(4) Best Interests of Creditors test.`
    });
  }

  if (petState.chapter === "7" && isAboveMedian && ch7DisposableMonthly > 182.50) {
    alerts.push({
      level: "danger",
      category: "Official Form 122A-2 — Ch. 7 Presumption of Abuse",
      title: `Above-Median Income with Positive Ch. 7 Disposable Income (${fmtCurrency(ch7DisposableMonthly)}/mo)`,
      desc: "Presumption of abuse arises under 11 U.S.C. § 707(b)(2). Consider switching to Chapter 13 or documenting Special Circumstances / non-consumer debt."
    });
  }

  // Add SOFA triggered warnings
  SOFA_QUESTIONS.forEach(q => {
    const ans = petState.sofa?.[q.key]?.answer;
    if (ans === "yes" && q.warnIfYes) {
      alerts.push({
        level: "warn",
        category: `Intake ${q.page} — SOFA Disclosure`,
        title: q.title,
        desc: `${q.warnMsg} (Client Details: "${petState.sofa[q.key].details || "Yes checked"}")`
      });
    }
  });

  return {
    std,
    countyData,
    isJoint,
    hhSize,
    baselineMonthLabel,
    endingMonthLabel,
    reVal,
    reMtgTotal,
    reArrearsTotal,
    reEquity,
    claimsHomestead,
    exemptHomestead,
    nonExemptRealEstate,
    totalInventoryVal,
    cashAndBanks,
    retirementTotal,
    wholeLifeCash,
    nonExemptibleFinancial,
    vehicleBreakdown,
    totalVehicleValue,
    totalVehicleDebt,
    totalVehicleExempt,
    totalVehicleNonExempt,
    flConstitutionalPersonalPropAllowance,
    flWildcardAllowance,
    totalPersonalPropExemptionPool,
    personalPropExemptUsed,
    nonExemptPersonalProp,
    totalNonExemptEquity,
    totalAssets,
    totalSecuredDebt,
    totalUnsecuredDebt,
    totalLiabilities,
    d1MonthlyGross,
    d2MonthlyGross,
    netBizMonthly,
    otherIncMonthly,
    socSecExcluded,
    totalMonthlyCmi,
    annualizedCmi,
    flMedianAnnual,
    isAboveMedian,
    totalPayrollDeductions,
    scheduleIMonthlyNet,
    scheduleJMonthlyTotal,
    scheduleJNetMonthlyIncome,
    totalIrsStandards,
    extraNecessaryMonthly,
    totalSecuredAndArrearsMonthly,
    ch13RetireDeduction,
    ch7DisposableMonthly,
    ch13DisposableMonthly,
    alerts
  };
}

// ============================================================================
// UI RENDERING FUNCTIONS
// ============================================================================

function syncStaticInputs() {
  const map = [
    ["petChapter", "chapter"],
    ["petFilingType", "filingType"],
    ["petFilingDate", "filingDate"],
    ["petHouseholdSize", "householdSize"],
    ["petD1Name", "d1Name"],
    ["petD1Dob", "d1Dob"],
    ["petD1Ssn", "d1Ssn"],
    ["petD1Street", "d1Street"],
    ["petD1City", "d1City"],
    ["petD1State", "d1State"],
    ["petD1Zip", "d1Zip"],
    ["petCounty", "county"],
    ["petYearsAtAddress", "yearsAtAddress"],
    ["petD1Phone", "d1Phone"],
    ["petD1Email", "d1Email"],
    ["petMailingAddress", "mailingAddress"],
    ["petD2Name", "d2Name"],
    ["petD2Dob", "d2Dob"],
    ["petD2Ssn", "d2Ssn"],
    ["petD2Contact", "d2Contact"],
    ["petOtherNamesUsed", "otherNamesUsed"],
    ["petIncomeChangeNote", "incomeChangeNote"],
    ["petOwnRealEstate", "ownRealEstate"],
    ["petReIsPrimary", "reIsPrimary"],
    ["petReType", "reType"],
    ["petReDeedNames", "reDeedNames"],
    ["petReAddress", "reAddress"],
    ["petReValue", "reValue"],
    ["petReMtg1Company", "reMtg1Company"],
    ["petReMtg1Acct", "reMtg1Acct"],
    ["petReMtg1Monthly", "reMtg1Monthly"],
    ["petReMtg1Payoff", "reMtg1Payoff"],
    ["petReMtg1Arrears", "reMtg1Arrears"],
    ["petReForeclosure", "reForeclosure"],
    ["petReIntent", "reIntent"],
    ["petReMtg2Company", "reMtg2Company"],
    ["petReMtg2Monthly", "reMtg2Monthly"],
    ["petReMtg2Payoff", "reMtg2Payoff"],
    ["petReMtg2Arrears", "reMtg2Arrears"],
    ["petReCollector", "reCollector"],
    ["petOwnMobileHome", "ownMobileHome"],
    ["petHomesteadRecent1215", "homesteadRecent1215"],
    ["petMhAttached", "mhAttached"],
    ["petMhLotRent", "mhLotRent"],
    ["petMhDescription", "mhDescription"],
    ["petBank1Name", "bank1Name"],
    ["petBank1Bal", "bank1Bal"],
    ["petBank2Name", "bank2Name"],
    ["petBank2Bal", "bank2Bal"],
    ["petSecurityDeposits", "securityDeposits"],
    ["petRetirementBal", "retirementBal"],
    ["petWholeLifeCash", "wholeLifeCash"],
    ["petStocksBonds", "stocksBonds"],
    ["petTaxRefund", "taxRefund"],
    ["petClaimsOwed", "claimsOwed"],
    ["petD1Employer", "d1Employer"],
    ["petD1JobTitle", "d1JobTitle"],
    ["petD1PayFreq", "d1PayFreq"],
    ["petD1YtdCurrent", "d1YtdCurrent"],
    ["petD1GrossLastYr", "d1GrossLastYr"],
    ["petD1Gross2YrsAgo", "d1Gross2YrsAgo"],
    ["petD1BaselineYtd", "d1BaselineYtd"],
    ["petD1EndingYtd", "d1EndingYtd"],
    ["petD1MoTaxes", "d1MoTaxes"],
    ["petD1MoHealth", "d1MoHealth"],
    ["petD1MoRetire", "d1MoRetire"],
    ["petD1MoUnionDso", "d1MoUnionDso"],
    ["petD1MoSocSec", "d1MoSocSec"],
    ["petD1MoOtherInc", "d1MoOtherInc"],
    ["petD2Employer", "d2Employer"],
    ["petD2GrossLastYr", "d2GrossLastYr"],
    ["petD2Gross2YrsAgo", "d2Gross2YrsAgo"],
    ["petD2BaselineYtd", "d2BaselineYtd"],
    ["petD2EndingYtd", "d2EndingYtd"],
    ["petD2MoTaxes", "d2MoTaxes"],
    ["petD2MoHealth", "d2MoHealth"],
    ["petD2MoRetire", "d2MoRetire"],
    ["petBizGross", "bizGross"],
    ["petBizExpenses", "bizExpenses"],
    ["petBizTaxesFiled", "bizTaxesFiled"],
    ["petUnfiledTaxYears", "unfiledTaxYears"]
  ];
  map.forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el && document.activeElement !== el) {
      el.value = petState[key] ?? "";
    }
  });
}

function renderDynamicSections(a) {
  // Dependents Table (Page 2)
  const depBody = document.getElementById("dependentsTableBody");
  if (depBody && !depBody.contains(document.activeElement)) {
    depBody.innerHTML = (petState.dependents || []).map((dep, i) => `
      <tr>
        <td class="mono">${i + 1}</td>
        <td><input type="text" class="table-input dep-input" data-idx="${i}" data-key="name" value="${dep.name || ""}" placeholder="Name / Initials" /></td>
        <td><input type="number" class="table-input dep-input" data-idx="${i}" data-key="age" value="${dep.age ?? ""}" style="width:70px;" /></td>
        <td>
          <select class="table-input dep-input" data-idx="${i}" data-key="relationship">
            <option value="" ${!dep.relationship ? "selected" : ""}>--Select--</option>
            <option value="Son" ${dep.relationship === "Son" ? "selected" : ""}>Son</option>
            <option value="Daughter" ${dep.relationship === "Daughter" ? "selected" : ""}>Daughter</option>
            <option value="Stepchild" ${dep.relationship === "Stepchild" ? "selected" : ""}>Stepchild</option>
            <option value="Grandchild" ${dep.relationship === "Grandchild" ? "selected" : ""}>Grandchild</option>
            <option value="Parent" ${dep.relationship === "Parent" ? "selected" : ""}>Parent</option>
            <option value="Other Dependent" ${dep.relationship === "Other Dependent" ? "selected" : ""}>Other</option>
          </select>
        </td>
        <td>
          <select class="table-input dep-input" data-idx="${i}" data-key="livesWith">
            <option value="yes" ${dep.livesWith === "yes" ? "selected" : ""}>YES</option>
            <option value="no" ${dep.livesWith === "no" ? "selected" : ""}>NO</option>
          </select>
        </td>
      </tr>
    `).join("");
  }

  // Homestead Callout (Page 3 & 4)
  const hsBox = document.getElementById("homesteadExemptionCallout");
  if (hsBox) {
    hsBox.innerHTML = `
      <div class="callout-title">Florida Homestead &amp; Wildcard Exemption Impact (Art. X, § 4, Fla. Const. vs. Fla. Stat. § 222.25(4))</div>
      <div>
        ${a.claimsHomestead
          ? `Client is retaining Primary Residence (${fmtCurrency(a.reVal)} value minus ${fmtCurrency(a.reMtgTotal)} mortgage = <strong>${fmtCurrency(a.reEquity)} equity</strong>).
             <strong>${fmtCurrency(a.exemptHomestead)}</strong> is protected under the Florida Homestead Exemption.
             Because Homestead is claimed, the $4,000/debtor statutory Wildcard exemption does <em>not</em> apply (Constitutional personal property limit is <strong>${fmtCurrency(a.flConstitutionalPersonalPropAllowance)}</strong>).`
          : `Client is <strong>not</strong> claiming a Florida Homestead Exemption. Therefore, client qualifies for the <strong>${fmtCurrency(a.flWildcardAllowance)} Florida Wildcard Personal Property Exemption (Fla. Stat. § 222.25(4))</strong> in addition to the <strong>${fmtCurrency(a.flConstitutionalPersonalPropAllowance)} Constitutional Exemption</strong> (Total Personal Property Protection Pool: <strong>${fmtCurrency(a.totalPersonalPropExemptionPool)}</strong>)!`
        }
      </div>
    `;
  }

  // Page 5 Household Inventory Grid
  const invGrid = document.getElementById("householdInventoryGrid");
  if (invGrid && !invGrid.contains(document.activeElement)) {
    invGrid.innerHTML = PAGE5_INVENTORY_ITEMS.map(item => `
      <div class="inventory-item">
        <label>${item.label}</label>
        <div class="input-prefix-wrap" style="width:98px;">
          <span class="input-prefix">$</span>
          <input type="number" step="1" class="inv-input" data-key="${item.key}" value="${Number(petState.inventory?.[item.key]) || 0}" />
        </div>
      </div>
    `).join("");
  }
  const invBadge = document.getElementById("inventoryTotalBadge");
  if (invBadge) invBadge.textContent = `Total Household Inventory: ${fmtCurrency(a.totalInventoryVal)}`;

  // Page 6 Motor Vehicles
  const vehBody = document.getElementById("vehiclesContainerBody");
  if (vehBody && !vehBody.contains(document.activeElement)) {
    vehBody.innerHTML = a.vehicleBreakdown.map((v, i) => `
      <div style="border:1px solid var(--border-color); border-radius:6px; padding:12px; margin-bottom:12px; background:#f8fafc;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <strong style="color:var(--primary);">Motor Vehicle #${i + 1} (Page 6)</strong>
          <span class="badge ${v.excessEq > 0 ? "badge-manual" : "badge-success"}">
            Equity: ${fmtCurrency(v.eq)} | FL Exempt (§ 222.25(1)): ${fmtCurrency(v.claimedEx)}
          </span>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Year / Make / Model</label>
            <div style="display:flex; gap:4px;">
              <input type="text" class="form-control veh-input" data-idx="${i}" data-key="year" value="${v.year || ""}" placeholder="Year" style="width:65px;" />
              <input type="text" class="form-control veh-input" data-idx="${i}" data-key="make" value="${v.make || ""}" placeholder="Make" />
              <input type="text" class="form-control veh-input" data-idx="${i}" data-key="model" value="${v.model || ""}" placeholder="Model" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Mileage &amp; Name(s) on Title</label>
            <div style="display:flex; gap:4px;">
              <input type="text" class="form-control veh-input" data-idx="${i}" data-key="mileage" value="${v.mileage || ""}" placeholder="Miles" style="width:90px;" />
              <input type="text" class="form-control veh-input" data-idx="${i}" data-key="titleNames" value="${v.titleNames || ""}" placeholder="Titled To" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Lender Name &amp; Address (If Financed)</label>
            <input type="text" class="form-control veh-input" data-idx="${i}" data-key="lender" value="${v.lender || ""}" placeholder="Auto Lender Name &amp; Address" />
          </div>
          <div class="form-group">
            <label class="form-label">Fair Market Value ($) vs. Payoff ($)</label>
            <div style="display:flex; gap:6px;">
              <input type="number" class="form-control mono veh-input" data-idx="${i}" data-key="value" value="${v.val}" placeholder="Value $" title="Current Fair Market Value" />
              <input type="number" class="form-control mono veh-input" data-idx="${i}" data-key="payoff" value="${v.debt}" placeholder="Payoff $" title="Loan Payoff Balance" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Monthly Payment ($) &amp; Intent (Form 108)</label>
            <div style="display:flex; gap:6px;">
              <input type="number" step="0.01" class="form-control mono veh-input" data-idx="${i}" data-key="monthlyPmt" value="${v.monthlyPmt || 0}" placeholder="Mo Pmt $" />
              <select class="form-control veh-input" data-idx="${i}" data-key="intent">
                <option value="Retain" ${v.intent === "Retain" ? "selected" : ""}>Keep (Retain)</option>
                <option value="Surrender" ${v.intent === "Surrender" ? "selected" : ""}>Surrender</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    `).join("");
  }

  // Exemption Audit Box
  const exBox = document.getElementById("exemptionAuditSummaryBox");
  if (exBox) {
    exBox.className = a.totalNonExemptEquity > 0 ? "callout warn" : "callout success";
    exBox.innerHTML = `
      <div class="callout-title">Schedule C Florida Exemption Audit Summary</div>
      <div style="font-size:12.5px; line-height:1.55;">
        <div><strong>Personal Property Pool (Const. + Wildcard):</strong> ${fmtCurrency(a.personalPropExemptUsed)} used of ${fmtCurrency(a.totalPersonalPropExemptionPool)} allowed</div>
        <div><strong>Motor Vehicle Exemption (§ 222.25(1)):</strong> ${fmtCurrency(a.totalVehicleExempt)} protected ($5,000/debtor statutory limit)</div>
        <div><strong>Retirement (§ 222.21):</strong> ${fmtCurrency(a.retirementTotal)} (100% Exempt) | <strong>Homestead:</strong> ${fmtCurrency(a.exemptHomestead)}</div>
        <div style="margin-top:4px; font-weight:700;">Estimated Total Non-Exempt Equity Exposed: ${fmtCurrency(a.totalNonExemptEquity)}</div>
      </div>
    `;
  }

  // Update dynamic YTD labels on Page 7/8
  const l1Base = document.getElementById("lblD1BaselineYtd");
  const l1End = document.getElementById("lblD1EndingYtd");
  const l2Base = document.getElementById("lblD2BaselineYtd");
  const l2End = document.getElementById("lblD2EndingYtd");
  if (l1Base) l1Base.textContent = `Statement #1: Last Stub of ${a.baselineMonthLabel} (Baseline YTD $)`;
  if (l1End) l1End.textContent = `Statement #2: Last Stub of ${a.endingMonthLabel} (Ending YTD $)`;
  if (l2Base) l2Base.textContent = `Spouse Last Stub of ${a.baselineMonthLabel} (Baseline YTD $)`;
  if (l2End) l2End.textContent = `Spouse Last Stub of ${a.endingMonthLabel} (Ending YTD $)`;

  // Page 10 Schedule J Grid
  const schJGrid = document.getElementById("scheduleJExpensesGrid");
  if (schJGrid && !schJGrid.contains(document.activeElement)) {
    schJGrid.innerHTML = PAGE10_SCHEDULE_J_ITEMS.map(item => `
      <div class="inventory-item">
        <label>${item.label}</label>
        <div class="input-prefix-wrap" style="width:105px;">
          <span class="input-prefix">$</span>
          <input type="number" step="0.01" class="schj-input" data-key="${item.key}" value="${Number(petState.scheduleJ?.[item.key]) || 0}" />
        </div>
      </div>
    `).join("");
  }
  const schJBadge = document.getElementById("schJTotalBadge");
  if (schJBadge) schJBadge.textContent = `Schedule J Total: ${fmtCurrency(a.scheduleJMonthlyTotal)}/mo`;

  // Pages 11-21 SOFA Questions
  const sofaContainer = document.getElementById("sofaQuestionsContainer");
  if (sofaContainer && !sofaContainer.contains(document.activeElement)) {
    sofaContainer.innerHTML = SOFA_QUESTIONS.map(q => {
      const item = petState.sofa?.[q.key] || { answer: "no", details: "" };
      const isYes = item.answer === "yes";
      return `
        <div class="sofa-question ${isYes && q.warnIfYes ? "flagged" : ""}">
          <div class="sofa-header">
            <div>
              <span class="page-ref-badge">${q.page}</span>
              <strong style="margin-left:6px; font-size:13px;">${q.title}</strong>
              <div style="font-size:12px; color:var(--text-secondary); margin-top:2px;">${q.prompt}</div>
            </div>
            <select class="form-control sofa-ans-select" data-key="${q.key}" style="width:105px; font-weight:700;">
              <option value="no" ${!isYes ? "selected" : ""}>NO</option>
              <option value="yes" ${isYes ? "selected" : ""}>YES</option>
            </select>
          </div>
          ${isYes ? `
            <div style="margin-top:8px;">
              <input type="text" class="form-control sofa-detail-input" data-key="${q.key}" value="${item.details || ""}" placeholder="Enter dates, parties, amounts, and details for Official Form 107..." />
              ${q.warnIfYes ? `<div style="font-size:11.5px; color:#b45309; margin-top:4px; font-weight:600;">⚠️ ${q.warnMsg}</div>` : ""}
            </div>
          ` : ""}
        </div>
      `;
    }).join("");
  }

  // Schedule E/F Creditor List Table
  const credBody = document.getElementById("creditorListTableBody");
  if (credBody && !credBody.contains(document.activeElement)) {
    credBody.innerHTML = (petState.creditors || []).map((c, idx) => `
      <tr>
        <td><input type="text" class="table-input cred-input" data-idx="${idx}" data-key="name" value="${c.name || ""}" placeholder="Creditor Name" /></td>
        <td><input type="text" class="table-input cred-input" data-idx="${idx}" data-key="address" value="${c.address || ""}" placeholder="PO Box / Street, City, ST Zip" /></td>
        <td><input type="text" class="table-input cred-input" data-idx="${idx}" data-key="acct" value="${c.acct || ""}" placeholder="1234" style="width:70px;" /></td>
        <td>
          <select class="table-input cred-input" data-idx="${idx}" data-key="type">
            <option value="Unsecured Credit Card" ${c.type === "Unsecured Credit Card" ? "selected" : ""}>Credit Card (Sch F)</option>
            <option value="Medical Bill" ${c.type === "Medical Bill" ? "selected" : ""}>Medical Bill (Sch F)</option>
            <option value="Personal Loan / Line" ${c.type === "Personal Loan / Line" ? "selected" : ""}>Personal Loan (Sch F)</option>
            <option value="Student Loan (Pg 16)" ${c.type === "Student Loan (Pg 16)" ? "selected" : ""}>Student Loan (Sch F)</option>
            <option value="Priority Tax (Sch E)" ${c.type === "Priority Tax (Sch E)" ? "selected" : ""}>Priority Tax (Sch E)</option>
            <option value="Priority Child Support (Sch E)" ${c.type === "Priority Child Support (Sch E)" ? "selected" : ""}>Priority DSO (Sch E)</option>
            <option value="Court Fine / Ticket (Pg 16)" ${c.type === "Court Fine / Ticket (Pg 16)" ? "selected" : ""}>Court Fine (Pg 16)</option>
          </select>
        </td>
        <td><input type="number" step="0.01" class="table-input cred-input" data-idx="${idx}" data-key="amount" value="${Number(c.amount) || 0}" style="width:110px;" /></td>
        <td><button type="button" class="btn btn-danger-ghost btn-sm btn-del-cred" data-idx="${idx}">✕</button></td>
      </tr>
    `).join("");
  }

  // Page 22 Document Checklist
  const docBody = document.getElementById("documentChecklistBody");
  if (docBody) {
    let doneCount = 0;
    docBody.innerHTML = PAGE22_CHECKLIST_ITEMS.map(item => {
      const checked = !!petState.checklist?.[item.key];
      if (checked) doneCount++;
      return `
        <label class="checklist-row ${checked ? "completed" : ""}" style="cursor:pointer;">
          <span style="font-size:13px; font-weight:600;">${item.label}</span>
          <input type="checkbox" class="doc-check-input" data-key="${item.key}" ${checked ? "checked" : ""} />
        </label>
      `;
    }).join("");
    const progBadge = document.getElementById("docChecklistProgressBadge");
    if (progBadge) progBadge.textContent = `${doneCount} / ${PAGE22_CHECKLIST_ITEMS.length} Received`;
  }

  // Watchdog Detail Panel (Tab 7) & Top Watchdog Banner
  const warnAlerts = a.alerts.filter(x => x.level === "warn" || x.level === "danger");
  const wBadge = document.getElementById("watchdogCountBadge");
  const wSum = document.getElementById("watchdogSummaryText");
  if (wBadge && wSum) {
    wBadge.textContent = warnAlerts.length > 0 ? `${warnAlerts.length} Case Alert(s)` : "All Checks Passed";
    wBadge.className = warnAlerts.length > 0 ? "badge badge-danger" : "badge badge-success";
    wSum.textContent = warnAlerts.length > 0
      ? `Watchdog Alert: ${warnAlerts[0].title} (${warnAlerts.length} total case/form alerts — click to review)`
      : `Official Forms 101–122, FL Statutory Exemptions ($5,000 Auto / Wildcard), and 2026 UST Standards Verified.`;
  }

  const wPanel = document.getElementById("watchdogDetailPanel");
  if (wPanel) {
    wPanel.innerHTML = a.alerts.map(al => `
      <div class="callout ${al.level === "danger" ? "warn" : al.level === "warn" ? "warn" : "success"}" style="margin-bottom:10px;">
        <div class="callout-title">[${al.category}] ${al.title}</div>
        <div style="font-size:12.5px;">${al.desc}</div>
      </div>
    `).join("");
  }
}

function renderPrintablePetitionAndClientReport(a) {
  const container = document.getElementById("petitionPrintableOutput");
  if (!container) return;

  document.querySelectorAll("[data-outmode]").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-outmode") === petState.outputMode);
  });

  if (petState.outputMode === "client") {
    container.innerHTML = `
      <div class="report-letterhead">
        <div class="letterhead-firm">
          <h2>Law Offices of Jill McDonald</h2>
          <p>7500 65th St. North, Pinellas Park, FL 33781</p>
          <p>727.231.4300 • Info@JillMcDonald.com</p>
        </div>
        <div class="letterhead-meta">
          <div><strong>Prepared For:</strong> ${petState.d1Name || "Client"} ${petState.d2Name ? `&amp; ${petState.d2Name}` : ""}</div>
          <div><strong>Court Venue:</strong> U.S. Bankruptcy Court, M.D. Fla. (Tampa Division)</div>
          <div><strong>Selected Chapter:</strong> Chapter ${petState.chapter}</div>
          <div><strong>Target Filing Date:</strong> ${petState.filingDate}</div>
        </div>
      </div>

      <div class="report-banner">
        <div style="font-size:18px; font-weight:800; color:#1e3a8a;">
          Your Personal Chapter ${petState.chapter} Bankruptcy Petition &amp; Means Test Summary
        </div>
        <div style="font-size:13px; color:#334155; margin-top:4px;">
          Prepared from your Client Bankruptcy Information Sheet — Plain-English Explanation of Your Income, Property Protections, and Plan Options
        </div>
      </div>

      <div class="report-summary-grid">
        <div class="report-stat-box">
          <div class="stat-title">6-Mo Avg Income vs. FL Median</div>
          <div class="stat-num">${fmtIntCurrency(a.annualizedCmi)}<span style="font-size:12px;">/yr</span></div>
          <div class="stat-desc">FL Median (${a.hhSize}p): ${fmtIntCurrency(a.flMedianAnnual)} (${a.isAboveMedian ? "Above Median" : "Below Median"})</div>
        </div>
        <div class="report-stat-box">
          <div class="stat-title">Protected vs. Exposed Property</div>
          <div class="stat-num">${fmtCurrency(a.totalAssets - a.totalNonExemptEquity)}</div>
          <div class="stat-desc">Non-Exempt Equity: <strong>${fmtCurrency(a.totalNonExemptEquity)}</strong></div>
        </div>
        <div class="report-stat-box">
          <div class="stat-title">Monthly Budget (Sch I vs. Sch J)</div>
          <div class="stat-num">${fmtCurrency(a.scheduleJNetMonthlyIncome)}<span style="font-size:12px;">/mo</span></div>
          <div class="stat-desc">Take-Home: ${fmtCurrency(a.scheduleIMonthlyNet)} | Living Exp: ${fmtCurrency(a.scheduleJMonthlyTotal)}</div>
        </div>
      </div>

      <div class="report-section">
        <h3>1. How We Calculated Your Income Using Your ${a.baselineMonthLabel} and ${a.endingMonthLabel} Pay Statements</h3>
        <p class="report-prose">
          Bankruptcy law looks at your average gross income over the past 6 full calendar months. By subtracting the Year-to-Date (YTD) income on your last pay statement from <strong>${a.baselineMonthLabel}</strong> from the YTD income on your last pay statement from <strong>${a.endingMonthLabel}</strong> and dividing by 6, your household Current Monthly Income (CMI) is <strong>${fmtCurrency(a.totalMonthlyCmi)}/month (${fmtCurrency(a.annualizedCmi)}/year)</strong>.
          ${a.isAboveMedian
            ? `Because this is above the Florida Median Income of <strong>${fmtIntCurrency(a.flMedianAnnual)}</strong> for a household of ${a.hhSize}, we applied your allowed IRS and ${a.countyData.name} living expense standards, resulting in a Means Test disposable income figure of <strong>${fmtCurrency(petState.chapter === "7" ? a.ch7DisposableMonthly : a.ch13DisposableMonthly)}/mo</strong>.`
            : `Because your annualized income is below the Florida Median Income of <strong>${fmtIntCurrency(a.flMedianAnnual)}</strong> for a household of ${a.hhSize}, you pass the first step of the Means Test with a presumption of no abuse!`
          }
        </p>
      </div>

      <div class="report-section">
        <h3>2. How Florida Law Protects Your Home, Vehicles, and Household Belongings (Schedule C)</h3>
        <p class="report-prose">
          Based on the Yard Sale Values on Page 5 and your home and vehicle information on Pages 3–6 of your intake packet:
        </p>
        <ul style="margin-left:20px; font-size:13.5px; line-height:1.65;">
          <li><strong>Real Estate / Homestead:</strong> ${a.claimsHomestead ? `Your home equity of ${fmtCurrency(a.reEquity)} is protected under the Florida Constitutional Homestead Exemption.` : `You are not claiming a Homestead exemption, which unlocks Florida's $4,000 per debtor Wildcard Personal Property Exemption.`}</li>
          <li><strong>Motor Vehicles:</strong> Florida law (Fla. Stat. § 222.25(1)) protects up to <strong>$5,000 of equity per debtor</strong> in your vehicles (${fmtCurrency(a.totalVehicleExempt)} applied).</li>
          <li><strong>Household Goods &amp; Bank Accounts:</strong> Your household inventory (${fmtCurrency(a.totalInventoryVal)}) and bank accounts (${fmtCurrency(a.cashAndBanks)}) are covered up to <strong>${fmtCurrency(a.totalPersonalPropExemptionPool)}</strong> under Florida's personal property exemptions.</li>
          <li><strong>Retirement Accounts:</strong> Your 401(k)/pension/IRA balance of <strong>${fmtCurrency(a.retirementTotal)}</strong> is 100% exempt under Florida law.</li>
        </ul>
      </div>

      <div class="report-section">
        <h3>3. Document Checklist Status (Page 22 of Your Intake Packet)</h3>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr><th>Required Document</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${PAGE22_CHECKLIST_ITEMS.map(d => `
                <tr>
                  <td>${d.label}</td>
                  <td><span class="badge ${petState.checklist?.[d.key] ? "badge-success" : "badge-manual"}">${petState.checklist?.[d.key] ? "✓ Received" : "Pending"}</span></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
    return;
  }

  // Full Official Petition Draft Package (Forms 101, 106Sum, 106A/B, 106C, 106D, 106E/F, 106I, 106J, 107, 108, 122)
  container.innerHTML = `
    <!-- PAGE 1: OFFICIAL FORM 101 VOLUNTARY PETITION -->
    <div class="petition-page">
      <div class="petition-form-header">
        <div>
          <div class="petition-form-num">Official Form 101 • United States Bankruptcy Court</div>
          <div class="petition-form-title">Voluntary Petition for Individuals Filing for Bankruptcy</div>
          <div style="font-size:13px; color:#334155; font-weight:600;">Middle District of Florida — Tampa Division</div>
        </div>
        <div style="text-align:right; font-size:12px;">
          <div><strong>Chapter ${petState.chapter}</strong> (${petState.filingType === "joint" ? "Joint Petition" : "Individual Petition"})</div>
          <div>Prepared by: <strong>Law Offices of Jill McDonald</strong></div>
          <div>7500 65th St. North, Pinellas Park, FL 33781</div>
        </div>
      </div>

      <div class="table-wrap" style="margin-bottom:16px;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Form 101 Field</th>
              <th>Debtor 1 Information</th>
              <th>Debtor 2 (Spouse) Information</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Lines 1–2: Full Legal Name</strong></td>
              <td><strong>${petState.d1Name || "—"}</strong></td>
              <td><strong>${petState.filingType === "joint" ? (petState.d2Name || "—") : "N/A (Non-Filing)"}</strong></td>
            </tr>
            <tr>
              <td><strong>Lines 3–4: Other Names Used (Past 8 Yrs)</strong></td>
              <td colspan="2">${petState.otherNamesUsed || "None"}</td>
            </tr>
            <tr>
              <td><strong>Line 5: Last 4 Digits of SSN / ITIN</strong></td>
              <td class="mono">${petState.d1Ssn || "xxx-xx-____"}</td>
              <td class="mono">${petState.filingType === "joint" ? (petState.d2Ssn || "xxx-xx-____") : "—"}</td>
            </tr>
            <tr>
              <td><strong>Lines 7–8: Residence &amp; Venue County</strong></td>
              <td>${petState.d1Street}, ${petState.d1City}, ${petState.d1State} ${petState.d1Zip}<br/><strong>County: ${a.countyData.name} (FIPS ${a.countyData.fips})</strong></td>
              <td>${petState.mailingAddress ? `Mailing: ${petState.mailingAddress}` : "Same as Debtor 1 Physical Address"}</td>
            </tr>
            <tr>
              <td><strong>Line 12: Prior Bankruptcies (Past 8 Yrs)</strong></td>
              <td colspan="2">${petState.sofa?.priorBankruptcy8Yrs?.answer === "yes" ? `YES — ${petState.sofa.priorBankruptcy8Yrs.details}` : "No prior bankruptcy filings in the last 8 years"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- OFFICIAL FORM 106Sum: SUMMARY OF ASSETS & LIABILITIES -->
      <div class="petition-form-header" style="margin-top:20px;">
        <div>
          <div class="petition-form-num">Official Form 106Sum</div>
          <div class="petition-form-title">Summary of Your Assets and Liabilities and Certain Statistical Information</div>
        </div>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Schedule / Form Reference</th>
              <th>Summary Description</th>
              <th style="text-align:right;">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><strong>Schedule A/B, Part 1</strong></td><td>Real Estate / Primary Residence Total Value</td><td style="text-align:right;" class="mono">${fmtCurrency(a.reVal)}</td></tr>
            <tr><td><strong>Schedule A/B, Parts 2–7</strong></td><td>Personal Property (Vehicles ${fmtCurrency(a.totalVehicleValue)} + Inventory ${fmtCurrency(a.totalInventoryVal)} + Financial ${fmtCurrency(a.cashAndBanks + a.retirementTotal + a.nonExemptibleFinancial)})</td><td style="text-align:right;" class="mono">${fmtCurrency(a.totalAssets - a.reVal)}</td></tr>
            <tr><td><strong>Line 1c: Total Assets</strong></td><td><strong>Combined Real &amp; Personal Property Value</strong></td><td style="text-align:right; font-weight:700;" class="mono">${fmtCurrency(a.totalAssets)}</td></tr>
            <tr><td><strong>Schedule C</strong></td><td>Total Property Claimed as Exempt (Florida Constitutional &amp; Statutory Exemptions)</td><td style="text-align:right; color:var(--success);" class="mono">${fmtCurrency(a.totalAssets - a.totalNonExemptEquity)}</td></tr>
            <tr><td><strong>Schedule D</strong></td><td>Total Secured Claims (Mortgages + Vehicle Loans)</td><td style="text-align:right;" class="mono">${fmtCurrency(a.totalSecuredDebt)}</td></tr>
            <tr><td><strong>Schedule E/F</strong></td><td>Total Priority &amp; Nonpriority Unsecured Claims</td><td style="text-align:right;" class="mono">${fmtCurrency(a.totalUnsecuredDebt)}</td></tr>
            <tr><td><strong>Line 3d: Total Liabilities</strong></td><td><strong>Combined Secured &amp; Unsecured Liabilities</strong></td><td style="text-align:right; font-weight:700;" class="mono">${fmtCurrency(a.totalLiabilities)}</td></tr>
            <tr><td><strong>Schedule I (Line 12)</strong></td><td>Combined Monthly Take-Home Income</td><td style="text-align:right;" class="mono">${fmtCurrency(a.scheduleIMonthlyNet)}/mo</td></tr>
            <tr><td><strong>Schedule J (Line 22c / 23c)</strong></td><td>Combined Monthly Expenses (${fmtCurrency(a.scheduleJMonthlyTotal)}) &rarr; <strong>Monthly Net Income</strong></td><td style="text-align:right; font-weight:700;" class="mono">${fmtCurrency(a.scheduleJNetMonthlyIncome)}/mo</td></tr>
            <tr><td><strong>Form 122A / 122C</strong></td><td>6-Month Lookback Annualized CMI (${fmtCurrency(a.annualizedCmi)}) vs. FL Median (${fmtIntCurrency(a.flMedianAnnual)})</td><td style="text-align:right; font-weight:700;">${a.isAboveMedian ? "ABOVE MEDIAN" : "BELOW MEDIAN"}</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- PAGE 2: SCHEDULES A/B, C, D & E/F -->
    <div class="petition-page">
      <div class="petition-form-header">
        <div>
          <div class="petition-form-num">Official Forms 106A/B, 106C, 106D, 106E/F &amp; 108</div>
          <div class="petition-form-title">Schedules of Property, Florida Exemptions, Secured &amp; Unsecured Creditors</div>
        </div>
      </div>

      <h4 style="margin-bottom:8px; color:#1e3a8a;">Schedules A/B, C &amp; D: Real Estate, Motor Vehicles &amp; Personal Property Exemptions</h4>
      <div class="table-wrap" style="margin-bottom:16px;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Property Description</th>
              <th>Florida Exemption Statute (Sch. C)</th>
              <th style="text-align:right;">Value (Sch A/B)</th>
              <th style="text-align:right;">Lien (Sch D)</th>
              <th style="text-align:right;">Exempt (Sch C)</th>
              <th>Intent (Form 108)</th>
            </tr>
          </thead>
          <tbody>
            ${petState.ownRealEstate === "yes" ? `
              <tr>
                <td><strong>${petState.reType}:</strong> ${petState.reAddress}<br/><span style="font-size:11px; color:#475569;">Lender: ${petState.reMtg1Company} (${petState.reMtg1Acct})</span></td>
                <td>${a.claimsHomestead ? "Art. X, § 4(a)(1), Fla. Const. (Homestead)" : "Non-Homestead"}</td>
                <td style="text-align:right;" class="mono">${fmtCurrency(a.reVal)}</td>
                <td style="text-align:right;" class="mono">${fmtCurrency(a.reMtgTotal)}</td>
                <td style="text-align:right;" class="mono">${fmtCurrency(a.exemptHomestead)}</td>
                <td><strong>${petState.reIntent}</strong></td>
              </tr>
            ` : ""}
            ${a.vehicleBreakdown.filter(v => v.year || v.make || v.val > 0).map(v => `
              <tr>
                <td><strong>${v.year} ${v.make} ${v.model}</strong> (${v.mileage} mi)<br/><span style="font-size:11px; color:#475569;">Lender: ${v.lender || "Free & Clear"}</span></td>
                <td>Fla. Stat. § 222.25(1) ($5,000 Auto)</td>
                <td style="text-align:right;" class="mono">${fmtCurrency(v.val)}</td>
                <td style="text-align:right;" class="mono">${fmtCurrency(v.debt)}</td>
                <td style="text-align:right;" class="mono">${fmtCurrency(v.claimedEx)}</td>
                <td><strong>${v.intent}</strong></td>
              </tr>
            `).join("")}
            <tr>
              <td><strong>Page 5 Household Goods &amp; Furnishings</strong> (Yard Sale Value Inventory)</td>
              <td>Art. X, § 4(a)(2), Fla. Const. ${!a.claimsHomestead ? "+ § 222.25(4) Wildcard" : ""}</td>
              <td style="text-align:right;" class="mono">${fmtCurrency(a.totalInventoryVal)}</td>
              <td style="text-align:right;" class="mono">$0.00</td>
              <td style="text-align:right;" class="mono">${fmtCurrency(Math.min(a.totalInventoryVal, a.personalPropExemptUsed))}</td>
              <td>Retain</td>
            </tr>
            <tr>
              <td><strong>Checking &amp; Savings Accounts:</strong> ${petState.bank1Name || "Bank 1"} &amp; ${petState.bank2Name || "Bank 2"}</td>
              <td>Art. X, § 4(a)(2), Fla. Const. / § 222.25(4)</td>
              <td style="text-align:right;" class="mono">${fmtCurrency(a.cashAndBanks)}</td>
              <td style="text-align:right;" class="mono">$0.00</td>
              <td style="text-align:right;" class="mono">${fmtCurrency(Math.max(0, a.personalPropExemptUsed - a.totalInventoryVal))}</td>
              <td>Retain</td>
            </tr>
            <tr>
              <td><strong>Retirement / 401(k) / Pension Plans</strong> (Pages 7, 14, 15)</td>
              <td>Fla. Stat. § 222.21 &amp; 11 U.S.C. § 522(b)(3)(C)</td>
              <td style="text-align:right;" class="mono">${fmtCurrency(a.retirementTotal)}</td>
              <td style="text-align:right;" class="mono">$0.00</td>
              <td style="text-align:right;" class="mono">${fmtCurrency(a.retirementTotal)}</td>
              <td>Retain</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h4 style="margin-bottom:8px; color:#1e3a8a;">Schedule E/F: Priority &amp; Nonpriority Unsecured Claims</h4>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Creditor Name</th>
              <th>Notice Address</th>
              <th>Acct #</th>
              <th>Classification</th>
              <th style="text-align:right;">Claim Amount</th>
            </tr>
          </thead>
          <tbody>
            ${(petState.creditors || []).map(c => `
              <tr>
                <td><strong>${c.name || "—"}</strong></td>
                <td>${c.address || "—"}</td>
                <td class="mono">${c.acct || "—"}</td>
                <td>${c.type}</td>
                <td style="text-align:right;" class="mono">${fmtCurrency(c.amount)}</td>
              </tr>
            `).join("")}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4">Total Schedule E/F Priority &amp; Unsecured Claims:</td>
              <td style="text-align:right;">${fmtCurrency(a.totalUnsecuredDebt)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `;
}

function downloadCreditorMatrixTxt() {
  const lines = [];
  if (petState.reMtg1Company) lines.push(petState.reMtg1Company.split(",").map(s => s.trim()).join("\n") + "\n");
  if (petState.reMtg2Company) lines.push(petState.reMtg2Company.split(",").map(s => s.trim()).join("\n") + "\n");
  if (petState.reCollector) lines.push(petState.reCollector.split(",").map(s => s.trim()).join("\n") + "\n");
  (petState.vehicles || []).forEach(v => {
    if (v.lender) lines.push(v.lender.split(",").map(s => s.trim()).join("\n") + "\n");
  });
  (petState.creditors || []).forEach(c => {
    if (c.name) {
      lines.push(`${c.name}\n${(c.address || "").split(",").map(s => s.trim()).join("\n")}\n`);
    }
  });
  const content = lines.join("\n");
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeName = (petState.d1Name || "flmb_client").replace(/[^a-z0-9]/gi, "_").toLowerCase();
  a.download = `${safeName}_flmb_creditor_matrix.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function updatePetitionWorkspace() {
  savePetState();
  syncStaticInputs();
  const a = analyzePetition();

  // Update KPI Ribbon
  document.getElementById("petKpiChapter").textContent = `Chapter ${petState.chapter}`;
  document.getElementById("petKpiVenue").textContent = `${a.countyData.name} (FLMB Tampa)`;
  document.getElementById("petKpiCmiAnnual").textContent = `${fmtIntCurrency(a.annualizedCmi)} / yr`;
  document.getElementById("petKpiMedianSub").textContent = `FL Median (${a.hhSize}p): ${fmtIntCurrency(a.flMedianAnnual)}`;

  const medPill = document.getElementById("petKpiMedianPill");
  if (medPill) {
    medPill.classList.toggle("status-pass", !a.isAboveMedian);
    medPill.classList.toggle("status-warn", a.isAboveMedian);
  }

  document.getElementById("petKpiTotalAssets").textContent = fmtCurrency(a.totalAssets);
  document.getElementById("petKpiNonExemptSub").textContent = `Non-Exempt Equity: ${fmtCurrency(a.totalNonExemptEquity)}`;
  document.getElementById("petKpiTotalDebt").textContent = fmtCurrency(a.totalLiabilities);
  document.getElementById("petKpiDebtSplit").textContent = `Sec: ${fmtIntCurrency(a.totalSecuredDebt)} | Unsec: ${fmtIntCurrency(a.totalUnsecuredDebt)}`;
  document.getElementById("petKpiNetSchJ").textContent = `${fmtCurrency(a.scheduleJNetMonthlyIncome)}/mo`;
  document.getElementById("petKpiSchISchJSub").textContent = `Sch I: ${fmtIntCurrency(a.scheduleIMonthlyNet)} | Sch J: ${fmtIntCurrency(a.scheduleJMonthlyTotal)}`;

  const recTitle = document.getElementById("petKpiRecTitle");
  const recSub = document.getElementById("petKpiRecSub");
  if (recTitle && recSub) {
    if (petState.chapter === "7") {
      if (!a.isAboveMedian || a.ch7DisposableMonthly <= 0) {
        recTitle.textContent = "Ch. 7 Qualifies";
        recSub.textContent = a.totalNonExemptEquity > 0 ? `Watch ${fmtIntCurrency(a.totalNonExemptEquity)} Non-Exempt Equity` : "No Presumption of Abuse";
      } else {
        recTitle.textContent = "Ch. 13 Recommended";
        recSub.textContent = `Ch. 7 MDI is +${fmtCurrency(a.ch7DisposableMonthly)}/mo`;
      }
    } else {
      recTitle.textContent = `Ch. 13 (${a.isAboveMedian ? "60" : "36"}-Mo Plan)`;
      recSub.textContent = `122C-2 MDI: ${fmtCurrency(a.ch13DisposableMonthly)}/mo`;
    }
  }

  renderDynamicSections(a);
  renderPrintablePetitionAndClientReport(a);
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".nav-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-tab");
      document.querySelectorAll(".nav-tab").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(target)?.classList.add("active");
    });
  });

  document.getElementById("btnOpenWatchdogTab")?.addEventListener("click", () => {
    document.querySelector('.nav-tab[data-tab="panel-pet-p22"]')?.click();
  });

  document.getElementById("btnPetNewClient")?.addEventListener("click", () => {
    previousPetSnapshot = clone(petState);
    petState = getBlankIntakeCase(petState);
    updatePetitionWorkspace();
    showPetToast("✨ Cleared all 22-page intake fields for a new client.", true);
  });

  document.getElementById("btnPetUndo")?.addEventListener("click", () => {
    if (previousPetSnapshot) {
      petState = clone(previousPetSnapshot);
      previousPetSnapshot = null;
      updatePetitionWorkspace();
      showPetToast("↩ Restored previous client intake packet.", false);
    }
  });

  document.getElementById("btnPetDismissToast")?.addEventListener("click", () => {
    const b = document.getElementById("petToastBanner");
    if (b) b.style.display = "none";
  });

  document.getElementById("btnPetLoadSample")?.addEventListener("click", () => {
    previousPetSnapshot = clone(petState);
    petState = getSampleIntakeCase();
    updatePetitionWorkspace();
    showPetToast("Loaded sample Pinellas Park Joint Intake Case (Michael & Sarah Vance).", true);
  });

  document.getElementById("btnPetCheckUpdates")?.addEventListener("click", () => {
    document.querySelector('.nav-tab[data-tab="panel-pet-p22"]')?.click();
    showPetToast("✅ Verified: Official Bankruptcy Forms 101–122, Florida $5,000 Auto Exemption (§ 222.25(1)), and 2026 UST/IRS Standards are active and up to date.", false);
  });

  document.getElementById("btnPetExportJson")?.addEventListener("click", () => {
    const str = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(petState, null, 2));
    const dl = document.createElement("a");
    dl.setAttribute("href", str);
    const safeName = (petState.d1Name || "jill_mcdonald_intake").replace(/[^a-z0-9]/gi, "_").toLowerCase();
    dl.setAttribute("download", `${safeName}_petition_intake.json`);
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
  });

  document.getElementById("inputPetImportJson")?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (parsed && parsed.inventory) {
          petState = parsed;
          updatePetitionWorkspace();
          showPetToast("✅ Imported client intake & petition file.", false);
        }
      } catch (err) {
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  });

  document.getElementById("btnDownloadMatrixTxt")?.addEventListener("click", downloadCreditorMatrixTxt);
  document.getElementById("btnExportMatrixFromReport")?.addEventListener("click", downloadCreditorMatrixTxt);

  document.getElementById("btnPrintPetitionPkg")?.addEventListener("click", () => {
    document.querySelector('.nav-tab[data-tab="panel-pet-output"]')?.click();
    window.print();
  });
  document.getElementById("btnPrintFromReportTab")?.addEventListener("click", () => window.print());

  document.querySelectorAll("[data-outmode]").forEach(btn => {
    btn.addEventListener("click", () => {
      petState.outputMode = btn.getAttribute("data-outmode");
      updatePetitionWorkspace();
    });
  });

  document.getElementById("btnZeroInventory")?.addEventListener("click", () => {
    previousPetSnapshot = clone(petState);
    PAGE5_INVENTORY_ITEMS.forEach(i => { petState.inventory[i.key] = 0; });
    updatePetitionWorkspace();
    showPetToast("Page 5 Household Inventory reset to $0.00.", true);
  });

  document.getElementById("btnZeroScheduleJ")?.addEventListener("click", () => {
    previousPetSnapshot = clone(petState);
    PAGE10_SCHEDULE_J_ITEMS.forEach(i => { petState.scheduleJ[i.key] = 0; });
    updatePetitionWorkspace();
    showPetToast("Page 10 Monthly Living Expenses (Schedule J) reset to $0.00.", true);
  });

  document.getElementById("btnAddUnsecuredCreditor")?.addEventListener("click", () => {
    petState.creditors.push({ name: "", address: "", acct: "", type: "Unsecured Credit Card", amount: 0 });
    updatePetitionWorkspace();
  });

  // Delegated Input & Change Listeners
  document.body.addEventListener("input", (e) => {
    const t = e.target;
    if (t.id && t.id.startsWith("pet")) {
      const mapKey = t.id.charAt(3).toLowerCase() + t.id.slice(4);
      if (mapKey in petState) {
        petState[mapKey] = t.value;
        updatePetitionWorkspace();
      }
      return;
    }
    if (t.classList.contains("dep-input")) {
      const idx = parseInt(t.getAttribute("data-idx"), 10);
      const key = t.getAttribute("data-key");
      petState.dependents[idx][key] = t.value;
      updatePetitionWorkspace();
      return;
    }
    if (t.classList.contains("inv-input")) {
      const key = t.getAttribute("data-key");
      petState.inventory[key] = parseFloat(t.value) || 0;
      updatePetitionWorkspace();
      return;
    }
    if (t.classList.contains("veh-input")) {
      const idx = parseInt(t.getAttribute("data-idx"), 10);
      const key = t.getAttribute("data-key");
      petState.vehicles[idx][key] = (key === "value" || key === "payoff" || key === "monthlyPmt") ? (parseFloat(t.value) || 0) : t.value;
      updatePetitionWorkspace();
      return;
    }
    if (t.classList.contains("schj-input")) {
      const key = t.getAttribute("data-key");
      petState.scheduleJ[key] = parseFloat(t.value) || 0;
      updatePetitionWorkspace();
      return;
    }
    if (t.classList.contains("sofa-detail-input")) {
      const key = t.getAttribute("data-key");
      petState.sofa[key].details = t.value;
      updatePetitionWorkspace();
      return;
    }
    if (t.classList.contains("cred-input")) {
      const idx = parseInt(t.getAttribute("data-idx"), 10);
      const key = t.getAttribute("data-key");
      petState.creditors[idx][key] = key === "amount" ? (parseFloat(t.value) || 0) : t.value;
      updatePetitionWorkspace();
      return;
    }
  });

  document.body.addEventListener("change", (e) => {
    const t = e.target;
    if (t.classList.contains("sofa-ans-select")) {
      const key = t.getAttribute("data-key");
      petState.sofa[key].answer = t.value;
      updatePetitionWorkspace();
      return;
    }
    if (t.classList.contains("doc-check-input")) {
      const key = t.getAttribute("data-key");
      petState.checklist[key] = t.checked;
      updatePetitionWorkspace();
      return;
    }
  });

  document.body.addEventListener("click", (e) => {
    const delBtn = e.target.closest(".btn-del-cred");
    if (delBtn) {
      const idx = parseInt(delBtn.getAttribute("data-idx"), 10);
      petState.creditors.splice(idx, 1);
      updatePetitionWorkspace();
    }
  });

  updatePetitionWorkspace();
});
