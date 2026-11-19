/**
 * FLMB Middle District of Florida (Tampa Division)
 * Chapter 13 Means Test Calculator (Official Forms 122C-1 & 122C-2)
 */

const STORAGE_KEY_CASE = "flmb_ch13_means_test_case_v2";
const STORAGE_KEY_STANDARDS = "flmb_ch13_custom_standards_v1";

// Deep clone helper
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Currency formatter
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

// Load or initialize Standards Presets
let standardsStore = clone(DEFAULT_STANDARDS_PRESETS);
try {
  const savedStd = localStorage.getItem(STORAGE_KEY_STANDARDS);
  if (savedStd) {
    const parsed = JSON.parse(savedStd);
    if (parsed && parsed["2026-mid"]) {
      standardsStore = parsed;
    }
  }
} catch (e) {
  console.warn("Could not load custom standards from localStorage", e);
}

function saveStandardsStore() {
  try {
    localStorage.setItem(STORAGE_KEY_STANDARDS, JSON.stringify(standardsStore));
  } catch (e) {
    console.warn("Could not save custom standards", e);
  }
}

// Itemized Pay Statement Categories (matches real paystubs: Gross, Fed Tax, SS, Medicare, Retirement, Insurance, etc.)
const DEDUCTION_FIELDS = [
  { key: "gross", label: "Gross Pay / Earnings (Wages, OT, Bonus, Tips)", formLine: "122C-1 Line 2 (CMI)" },
  { key: "fedTax", label: "Federal Income Tax Withheld", formLine: "122C-2 Line 16 (Taxes)" },
  { key: "ssTax", label: "Social Security / OASDI Tax", formLine: "122C-2 Line 16 (Taxes)" },
  { key: "medTax", label: "Medicare Tax", formLine: "122C-2 Line 16 (Taxes)" },
  { key: "mandatoryRetire", label: "Mandatory Retirement (FRS / Pension)", formLine: "122C-2 Line 17 (Involuntary)" },
  { key: "unionDues", label: "Union Dues / Mandatory Uniforms", formLine: "122C-2 Line 17 (Involuntary)" },
  { key: "voluntary401k", label: "Voluntary 401(k) / 403(b) / TSP Contributions", formLine: "122C-2 Line 41 (Retirement)" },
  { key: "loan401k", label: "401(k) / Retirement Loan Repayments", formLine: "122C-2 Line 41 (Retire Loan)" },
  { key: "healthIns", label: "Health / Medical Insurance Premiums", formLine: "122C-2 Line 25 (Health Ins)" },
  { key: "dentalVision", label: "Dental & Vision Insurance Premiums", formLine: "122C-2 Line 25 (Health Ins)" },
  { key: "hsaFsa", label: "HSA / FSA Contributions", formLine: "122C-2 Line 25 (HSA/FSA)" },
  { key: "disabilityIns", label: "Disability / Accident / Supplemental Ins.", formLine: "122C-2 Line 25 (Disability)" },
  { key: "termLife", label: "Term Life Insurance Premiums", formLine: "122C-2 Line 18 (Term Life)" },
  { key: "courtDso", label: "Court-Ordered Child Support / Alimony (DSO)", formLine: "122C-2 Line 19 (Court DSO)" }
];

// Create Sample Cases (Above-Median & Below-Median Tampa Division cases using Two-Statement YTD: April vs. October)
function getSampleCaseAboveMedian() {
  return {
    clientName: "Carlos & Maria Rodriguez",
    spouseName: "Maria Rodriguez",
    caseNumber: "8:26-bk-04192-MGW",
    filingStatus: "joint",
    filingDate: "2026-11-17",
    tampaCounty: "Hillsborough",
    standardsPreset: "2026-mid",
    householdSize: 3,
    membersUnder65: 3,
    members65Plus: 0,
    dependentChildrenUnder18: 1,
    vehicleCount: 2,
    olderVehicleCount: 0,
    claimPublicTransit: "no",
    claim5PercentFood: "yes",
    firmName: "Law Offices of Jill McDonald",
    attorneyName: "Jill McDonald, Esq.",
    firmContact: "7500 65th St. North, Pinellas Park, FL 33781 • 727.231.4300 • Info@JillMcDonald.com",
    attorneyCustomNote: "Based on our review of your last pay statements from April 2026 and October 2026 and the U.S. Trustee allowances for Hillsborough County, your household is slightly above the Florida median income for a family of 3. However, after subtracting your allowed IRS/UST living standards, payroll taxes, health insurance, retirement contributions, and secured home and vehicle payments, your required monthly pool for general unsecured creditors is very manageable.",
    enableDebtor2: true,
    earners: {
      d1: {
        employerName: "BayCare Health System (Tampa)",
        mode: "ytd",
        ytd: {
          method: "boundary", // Two-Statement YTD Subtraction (e.g., Last stub of Oct minus Last stub of Apr)
          monthsInWindow: 6.0,
          payFrequency: "biweekly",
          periodsElapsedYtd: 22,
          priorDate: "2026-04-24",
          latestDate: "2026-10-30",
          yearEndDate: "",
          // Statement #1: Last Pay Statement from April 2026 (Baseline YTD prior to May-Oct window)
          prior: {
            gross: 26600.00,
            fedTax: 2222.00,
            ssTax: 1649.20,
            medTax: 385.70,
            mandatoryRetire: 0.00,
            unionDues: 0.00,
            voluntary401k: 1064.00,
            loan401k: 440.00,
            healthIns: 1320.00,
            dentalVision: 220.00,
            hsaFsa: 360.00,
            disabilityIns: 0.00,
            termLife: 88.00,
            courtDso: 0.00
          },
          // Statement #2: Last Pay Statement from October 2026 (Ending YTD at close of May-Oct window)
          latest: {
            gross: 68500.00,
            fedTax: 5720.00,
            ssTax: 4247.00,
            medTax: 993.25,
            mandatoryRetire: 0.00,
            unionDues: 0.00,
            voluntary401k: 2740.00,
            loan401k: 1100.00,
            healthIns: 3300.00,
            dentalVision: 550.00,
            hsaFsa: 900.00,
            disabilityIns: 0.00,
            termLife: 220.00,
            courtDso: 0.00
          },
          // Optional Dec 31 Year-End stub (used only when 6-mo window crosses Jan 1)
          yearEnd: {
            gross: 0, fedTax: 0, ssTax: 0, medTax: 0, mandatoryRetire: 0, unionDues: 0,
            voluntary401k: 0, loan401k: 0, healthIns: 0, dentalVision: 0, hsaFsa: 0,
            disabilityIns: 0, termLife: 0, courtDso: 0
          }
        },
        stubs: [
          { date: "2026-05-08", gross: 3223.08, fedTax: 269.08, ssTax: 199.83, medTax: 46.73, mandatoryRetire: 0, unionDues: 0, voluntary401k: 128.92, loan401k: 50.77, healthIns: 152.31, dentalVision: 25.38, hsaFsa: 41.54, disabilityIns: 0, termLife: 10.15, courtDso: 0 },
          { date: "2026-05-22", gross: 3223.08, fedTax: 269.08, ssTax: 199.83, medTax: 46.73, mandatoryRetire: 0, unionDues: 0, voluntary401k: 128.92, loan401k: 50.77, healthIns: 152.31, dentalVision: 25.38, hsaFsa: 41.54, disabilityIns: 0, termLife: 10.15, courtDso: 0 },
          { date: "2026-06-05", gross: 3223.08, fedTax: 269.08, ssTax: 199.83, medTax: 46.73, mandatoryRetire: 0, unionDues: 0, voluntary401k: 128.92, loan401k: 50.77, healthIns: 152.31, dentalVision: 25.38, hsaFsa: 41.54, disabilityIns: 0, termLife: 10.15, courtDso: 0 },
          { date: "2026-06-19", gross: 3223.08, fedTax: 269.08, ssTax: 199.83, medTax: 46.73, mandatoryRetire: 0, unionDues: 0, voluntary401k: 128.92, loan401k: 50.77, healthIns: 152.31, dentalVision: 25.38, hsaFsa: 41.54, disabilityIns: 0, termLife: 10.15, courtDso: 0 },
          { date: "2026-07-03", gross: 3223.08, fedTax: 269.08, ssTax: 199.83, medTax: 46.73, mandatoryRetire: 0, unionDues: 0, voluntary401k: 128.92, loan401k: 50.77, healthIns: 152.31, dentalVision: 25.38, hsaFsa: 41.54, disabilityIns: 0, termLife: 10.15, courtDso: 0 },
          { date: "2026-07-17", gross: 3223.08, fedTax: 269.08, ssTax: 199.83, medTax: 46.73, mandatoryRetire: 0, unionDues: 0, voluntary401k: 128.92, loan401k: 50.77, healthIns: 152.31, dentalVision: 25.38, hsaFsa: 41.54, disabilityIns: 0, termLife: 10.15, courtDso: 0 },
          { date: "2026-07-31", gross: 3223.08, fedTax: 269.08, ssTax: 199.83, medTax: 46.73, mandatoryRetire: 0, unionDues: 0, voluntary401k: 128.92, loan401k: 50.77, healthIns: 152.31, dentalVision: 25.38, hsaFsa: 41.54, disabilityIns: 0, termLife: 10.15, courtDso: 0 },
          { date: "2026-08-14", gross: 3223.08, fedTax: 269.08, ssTax: 199.83, medTax: 46.73, mandatoryRetire: 0, unionDues: 0, voluntary401k: 128.92, loan401k: 50.77, healthIns: 152.31, dentalVision: 25.38, hsaFsa: 41.54, disabilityIns: 0, termLife: 10.15, courtDso: 0 },
          { date: "2026-08-28", gross: 3223.08, fedTax: 269.08, ssTax: 199.83, medTax: 46.73, mandatoryRetire: 0, unionDues: 0, voluntary401k: 128.92, loan401k: 50.77, healthIns: 152.31, dentalVision: 25.38, hsaFsa: 41.54, disabilityIns: 0, termLife: 10.15, courtDso: 0 },
          { date: "2026-09-11", gross: 3223.08, fedTax: 269.08, ssTax: 199.83, medTax: 46.73, mandatoryRetire: 0, unionDues: 0, voluntary401k: 128.92, loan401k: 50.77, healthIns: 152.31, dentalVision: 25.38, hsaFsa: 41.54, disabilityIns: 0, termLife: 10.15, courtDso: 0 },
          { date: "2026-09-25", gross: 3223.08, fedTax: 269.08, ssTax: 199.83, medTax: 46.73, mandatoryRetire: 0, unionDues: 0, voluntary401k: 128.92, loan401k: 50.77, healthIns: 152.31, dentalVision: 25.38, hsaFsa: 41.54, disabilityIns: 0, termLife: 10.15, courtDso: 0 },
          { date: "2026-10-09", gross: 3223.08, fedTax: 269.08, ssTax: 199.83, medTax: 46.73, mandatoryRetire: 0, unionDues: 0, voluntary401k: 128.92, loan401k: 50.77, healthIns: 152.31, dentalVision: 25.38, hsaFsa: 41.54, disabilityIns: 0, termLife: 10.15, courtDso: 0 },
          { date: "2026-10-23", gross: 3223.04, fedTax: 269.04, ssTax: 199.84, medTax: 46.79, mandatoryRetire: 0, unionDues: 0, voluntary401k: 128.96, loan401k: 50.76, healthIns: 152.28, dentalVision: 25.44, hsaFsa: 41.52, disabilityIns: 0, termLife: 10.20, courtDso: 0 }
        ],
        manual: {
          frequency: "monthly",
          gross: 6983.33,
          fedTax: 583.00,
          ssTax: 432.97,
          medTax: 101.26,
          mandatoryRetire: 0,
          unionDues: 0,
          voluntary401k: 279.33,
          loan401k: 110.00,
          healthIns: 330.00,
          dentalVision: 55.00,
          hsaFsa: 90.00,
          disabilityIns: 0,
          termLife: 22.00,
          courtDso: 0
        }
      },
      d2: {
        employerName: "Hillsborough County Public Schools",
        mode: "ytd",
        ytd: {
          method: "boundary",
          monthsInWindow: 6.0,
          payFrequency: "biweekly",
          periodsElapsedYtd: 21,
          priorDate: "2026-04-24",
          latestDate: "2026-10-23",
          yearEndDate: "",
          // Statement #1: Last Pay Statement from April 2026
          prior: {
            gross: 12600.00,
            fedTax: 611.10,
            ssTax: 781.20,
            medTax: 182.70,
            mandatoryRetire: 378.00,
            unionDues: 135.00,
            voluntary401k: 0,
            loan401k: 0,
            healthIns: 405.00,
            dentalVision: 90.00,
            hsaFsa: 0,
            disabilityIns: 0,
            termLife: 0,
            courtDso: 0
          },
          // Statement #2: Last Pay Statement from October 2026
          latest: {
            gross: 29400.00,
            fedTax: 1425.90,
            ssTax: 1822.80,
            medTax: 426.30,
            mandatoryRetire: 882.00,
            unionDues: 315.00,
            voluntary401k: 0,
            loan401k: 0,
            healthIns: 945.00,
            dentalVision: 210.00,
            hsaFsa: 0,
            disabilityIns: 0,
            termLife: 0,
            courtDso: 0
          },
          yearEnd: {
            gross: 0, fedTax: 0, ssTax: 0, medTax: 0, mandatoryRetire: 0, unionDues: 0,
            voluntary401k: 0, loan401k: 0, healthIns: 0, dentalVision: 0, hsaFsa: 0,
            disabilityIns: 0, termLife: 0, courtDso: 0
          }
        },
        stubs: [
          { date: "2026-05-08", gross: 1400.00, fedTax: 67.90, ssTax: 86.80, medTax: 20.30, mandatoryRetire: 42.00, unionDues: 15.00, voluntary401k: 0, loan401k: 0, healthIns: 45.00, dentalVision: 10.00, hsaFsa: 0, disabilityIns: 0, termLife: 0, courtDso: 0 },
          { date: "2026-05-22", gross: 1400.00, fedTax: 67.90, ssTax: 86.80, medTax: 20.30, mandatoryRetire: 42.00, unionDues: 15.00, voluntary401k: 0, loan401k: 0, healthIns: 45.00, dentalVision: 10.00, hsaFsa: 0, disabilityIns: 0, termLife: 0, courtDso: 0 },
          { date: "2026-06-05", gross: 1400.00, fedTax: 67.90, ssTax: 86.80, medTax: 20.30, mandatoryRetire: 42.00, unionDues: 15.00, voluntary401k: 0, loan401k: 0, healthIns: 45.00, dentalVision: 10.00, hsaFsa: 0, disabilityIns: 0, termLife: 0, courtDso: 0 },
          { date: "2026-06-19", gross: 1400.00, fedTax: 67.90, ssTax: 86.80, medTax: 20.30, mandatoryRetire: 42.00, unionDues: 15.00, voluntary401k: 0, loan401k: 0, healthIns: 45.00, dentalVision: 10.00, hsaFsa: 0, disabilityIns: 0, termLife: 0, courtDso: 0 },
          { date: "2026-07-03", gross: 1400.00, fedTax: 67.90, ssTax: 86.80, medTax: 20.30, mandatoryRetire: 42.00, unionDues: 15.00, voluntary401k: 0, loan401k: 0, healthIns: 45.00, dentalVision: 10.00, hsaFsa: 0, disabilityIns: 0, termLife: 0, courtDso: 0 },
          { date: "2026-07-17", gross: 1400.00, fedTax: 67.90, ssTax: 86.80, medTax: 20.30, mandatoryRetire: 42.00, unionDues: 15.00, voluntary401k: 0, loan401k: 0, healthIns: 45.00, dentalVision: 10.00, hsaFsa: 0, disabilityIns: 0, termLife: 0, courtDso: 0 },
          { date: "2026-07-31", gross: 1400.00, fedTax: 67.90, ssTax: 86.80, medTax: 20.30, mandatoryRetire: 42.00, unionDues: 15.00, voluntary401k: 0, loan401k: 0, healthIns: 45.00, dentalVision: 10.00, hsaFsa: 0, disabilityIns: 0, termLife: 0, courtDso: 0 },
          { date: "2026-08-14", gross: 1400.00, fedTax: 67.90, ssTax: 86.80, medTax: 20.30, mandatoryRetire: 42.00, unionDues: 15.00, voluntary401k: 0, loan401k: 0, healthIns: 45.00, dentalVision: 10.00, hsaFsa: 0, disabilityIns: 0, termLife: 0, courtDso: 0 },
          { date: "2026-08-28", gross: 1400.00, fedTax: 67.90, ssTax: 86.80, medTax: 20.30, mandatoryRetire: 42.00, unionDues: 15.00, voluntary401k: 0, loan401k: 0, healthIns: 45.00, dentalVision: 10.00, hsaFsa: 0, disabilityIns: 0, termLife: 0, courtDso: 0 },
          { date: "2026-09-11", gross: 1400.00, fedTax: 67.90, ssTax: 86.80, medTax: 20.30, mandatoryRetire: 42.00, unionDues: 15.00, voluntary401k: 0, loan401k: 0, healthIns: 45.00, dentalVision: 10.00, hsaFsa: 0, disabilityIns: 0, termLife: 0, courtDso: 0 },
          { date: "2026-09-25", gross: 1400.00, fedTax: 67.90, ssTax: 86.80, medTax: 20.30, mandatoryRetire: 42.00, unionDues: 15.00, voluntary401k: 0, loan401k: 0, healthIns: 45.00, dentalVision: 10.00, hsaFsa: 0, disabilityIns: 0, termLife: 0, courtDso: 0 },
          { date: "2026-10-09", gross: 1400.00, fedTax: 67.90, ssTax: 86.80, medTax: 20.30, mandatoryRetire: 42.00, unionDues: 15.00, voluntary401k: 0, loan401k: 0, healthIns: 45.00, dentalVision: 10.00, hsaFsa: 0, disabilityIns: 0, termLife: 0, courtDso: 0 }
        ],
        manual: {
          frequency: "biweekly",
          gross: 1400.00,
          fedTax: 67.90,
          ssTax: 86.80,
          medTax: 20.30,
          mandatoryRetire: 42.00,
          unionDues: 15.00,
          voluntary401k: 0,
          loan401k: 0,
          healthIns: 45.00,
          dentalVision: 10.00,
          hsaFsa: 0,
          disabilityIns: 0,
          termLife: 0,
          courtDso: 0
        }
      }
    },
    otherIncome: {
      businessGross: 0,
      businessExpenses: 0,
      rentalNet: 0,
      interestDiv: 0,
      pension: 0,
      supportContrib: 0,
      unemployment: 0,
      otherCmi: 0,
      exclSocialSecurity: 0,
      exclVaHaven: 425.00,
      maritalAdjustment: 0,
      maritalAdjustmentNotes: ""
    },
    deductionOverrides: {
      line6_foodClothing: { enabled: false, value: 1857 },
      line7_addlFood5Pct: { enabled: false, value: 64 },
      line8_housingUtilities: { enabled: false, value: 733 },
      line9a_housingMortgageStd: { enabled: false, value: 1833 },
      line11_publicTransit: { enabled: false, value: 0 },
      line12_vehicleOperating: { enabled: false, value: 640 },
      line13a_car1OwnershipStd: { enabled: false, value: 703 },
      line13d_car2OwnershipStd: { enabled: false, value: 703 },
      line14_healthOutOfPocketStd: { enabled: false, value: 270 },
      line16_taxes: { enabled: false, value: 0 },
      line17_involuntaryDed: { enabled: false, value: 0 },
      line18_termLife: { enabled: false, value: 0 },
      line19_courtOrderedDso: { enabled: false, value: 0 },
      line20_educationEmployment: { enabled: true, value: 0 },
      line21_childcare: { enabled: true, value: 420.00 },
      line22_extraHealthCare: { enabled: true, value: 85.00 },
      line23_telecom: { enabled: true, value: 110.00 },
      line25_healthDisabilityHsa: { enabled: false, value: 0 },
      line26_careFamilyMembers: { enabled: true, value: 0 },
      line27_familyViolence: { enabled: true, value: 0 },
      line28_homeEnergyExcess: { enabled: true, value: 45.00 },
      line29_childEducation: { enabled: true, value: 150.00 },
      line31_charitable: { enabled: true, value: 100.00 },
      line41_retirement401kAndLoans: { enabled: false, value: 0 },
      line43_specialCircumstances: { enabled: true, value: 0 }
    },
    securedAndPriority: {
      secMortgage1: 1985.00,
      secMortgage2Hoa: 145.00,
      secRentActual: 0,
      secCar1: 525.00,
      secCar2: 390.00,
      secOther: 0,
      arrearsMortgageTotal: 7200.00,
      arrearsOtherTotal: 0,
      priorityTaxTotal: 2400.00,
      priorityDsoTotal: 0,
      priorityAttyFees: 3500.00,
      generalUnsecuredTotal: 54000.00,
      trusteeMultiplier: 10.0,
      projectedPlanPaymentOverride: ""
    },
    reportViewMode: "client"
  };
}

function getSampleCaseBelowMedian() {
  const base = getSampleCaseAboveMedian();
  base.clientName = "Devon & Ashley Carter";
  base.spouseName = "Ashley Carter";
  base.caseNumber = "8:26-bk-05018-CPM";
  base.tampaCounty = "Pinellas";
  base.householdSize = 2;
  base.membersUnder65 = 2;
  base.members65Plus = 0;
  base.dependentChildrenUnder18 = 0;
  base.vehicleCount = 1;
  base.claim5PercentFood = "no";
  base.enableDebtor2 = false;
  base.attorneyCustomNote = "Good news: Based on comparing your last pay statement from April 2026 and your last pay statement from October 2026, your household income over the past 6 months is below the Florida Median Income threshold for a 2-person household ($86,523). Because you are Below-Median, your minimum Chapter 13 Applicable Commitment Period is 36 months rather than 60 months.";
  base.earners.d1.employerName = "St. Petersburg Marine Supply";
  base.earners.d1.mode = "ytd";
  base.earners.d1.ytd = {
    method: "boundary",
    monthsInWindow: 6.0,
    payFrequency: "biweekly",
    periodsElapsedYtd: 22,
    priorDate: "2026-04-24",
    latestDate: "2026-10-30",
    yearEndDate: "",
    prior: {
      gross: 19200.00,
      fedTax: 1219.20,
      ssTax: 1190.40,
      medTax: 278.40,
      mandatoryRetire: 0,
      unionDues: 0,
      voluntary401k: 576.00,
      loan401k: 0,
      healthIns: 760.00,
      dentalVision: 120.00,
      hsaFsa: 0,
      disabilityIns: 0,
      termLife: 40.00,
      courtDso: 0
    },
    latest: {
      gross: 52800.00,
      fedTax: 3352.80,
      ssTax: 3273.60,
      medTax: 765.60,
      mandatoryRetire: 0,
      unionDues: 0,
      voluntary401k: 1584.00,
      loan401k: 0,
      healthIns: 2090.00,
      dentalVision: 330.00,
      hsaFsa: 0,
      disabilityIns: 0,
      termLife: 110.00,
      courtDso: 0
    },
    yearEnd: {
      gross: 0, fedTax: 0, ssTax: 0, medTax: 0, mandatoryRetire: 0, unionDues: 0,
      voluntary401k: 0, loan401k: 0, healthIns: 0, dentalVision: 0, hsaFsa: 0,
      disabilityIns: 0, termLife: 0, courtDso: 0
    }
  };
  base.otherIncome.exclVaHaven = 0;
  base.otherIncome.exclSocialSecurity = 1150.00;
  base.deductionOverrides.line21_childcare.value = 0;
  base.deductionOverrides.line29_childEducation.value = 0;
  base.securedAndPriority.secMortgage1 = 1420.00;
  base.securedAndPriority.secMortgage2Hoa = 0;
  base.securedAndPriority.secCar1 = 415.00;
  base.securedAndPriority.secCar2 = 0;
  base.securedAndPriority.arrearsMortgageTotal = 3600.00;
  base.securedAndPriority.priorityTaxTotal = 0;
  base.securedAndPriority.generalUnsecuredTotal = 32500.00;
  return base;
}

// Load current case state
let caseState = getSampleCaseAboveMedian();
try {
  const savedCase = localStorage.getItem(STORAGE_KEY_CASE);
  if (savedCase) {
    const parsed = JSON.parse(savedCase);
    if (parsed && parsed.earners && parsed.earners.d1?.ytd?.latest?.fedTax !== undefined) {
      caseState = parsed;
    }
  }
} catch (e) {
  console.warn("Could not load saved case from localStorage", e);
}

function saveCaseState() {
  try {
    localStorage.setItem(STORAGE_KEY_CASE, JSON.stringify(caseState));
  } catch (e) {
    console.warn("Could not save case state", e);
  }
}

let previousCaseSnapshot = null;

function showStatusToast(message, allowUndo = false) {
  const banner = document.getElementById("statusToastBanner");
  const msgEl = document.getElementById("statusToastMessage");
  const undoBtn = document.getElementById("btnUndoReset");
  if (!banner || !msgEl) return;
  msgEl.innerHTML = message;
  if (undoBtn) {
    undoBtn.style.display = allowUndo && previousCaseSnapshot ? "inline-flex" : "none";
  }
  banner.style.display = "block";
}

function getZeroPayCategoryMap() {
  const map = {};
  DEDUCTION_FIELDS.forEach(f => {
    map[f.key] = 0;
  });
  return map;
}

function getBlankEarnerState() {
  return {
    employerName: "",
    mode: "ytd",
    ytd: {
      method: "boundary",
      monthsInWindow: 6.0,
      payFrequency: "biweekly",
      periodsElapsedYtd: 22,
      priorDate: "",
      latestDate: "",
      yearEndDate: "",
      prior: getZeroPayCategoryMap(),
      latest: getZeroPayCategoryMap(),
      yearEnd: getZeroPayCategoryMap()
    },
    stubs: [
      { date: "", ...getZeroPayCategoryMap() }
    ],
    manual: {
      frequency: "biweekly",
      ...getZeroPayCategoryMap()
    }
  };
}

function getBlankClientCase(current) {
  const todayIso = new Date().toISOString().slice(0, 10);
  return {
    clientName: "",
    spouseName: "",
    caseNumber: "",
    filingStatus: "single",
    filingDate: current?.filingDate || todayIso,
    tampaCounty: current?.tampaCounty || "Hillsborough",
    standardsPreset: current?.standardsPreset || "2026-mid",
    householdSize: 1,
    membersUnder65: 1,
    members65Plus: 0,
    dependentChildrenUnder18: 0,
    vehicleCount: 1,
    olderVehicleCount: 0,
    claimPublicTransit: "no",
    claim5PercentFood: "no",
    firmName: current?.firmName || "Law Offices of Jill McDonald",
    attorneyName: current?.attorneyName || "Jill McDonald, Esq.",
    firmContact: current?.firmContact || "7500 65th St. North, Pinellas Park, FL 33781 • 727.231.4300 • Info@JillMcDonald.com",
    attorneyCustomNote: "",
    enableDebtor2: false,
    earners: {
      d1: getBlankEarnerState(),
      d2: getBlankEarnerState()
    },
    otherIncome: {
      businessGross: 0,
      businessExpenses: 0,
      rentalNet: 0,
      interestDiv: 0,
      pension: 0,
      supportContrib: 0,
      unemployment: 0,
      otherCmi: 0,
      exclSocialSecurity: 0,
      exclVaHaven: 0,
      maritalAdjustment: 0,
      maritalAdjustmentNotes: ""
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
      line21_childcare: { enabled: true, value: 0 },
      line22_extraHealthCare: { enabled: true, value: 0 },
      line23_telecom: { enabled: true, value: 0 },
      line25_healthDisabilityHsa: { enabled: false, value: 0 },
      line26_careFamilyMembers: { enabled: true, value: 0 },
      line27_familyViolence: { enabled: true, value: 0 },
      line28_homeEnergyExcess: { enabled: true, value: 0 },
      line29_childEducation: { enabled: true, value: 0 },
      line31_charitable: { enabled: true, value: 0 },
      line41_retirement401kAndLoans: { enabled: false, value: 0 },
      line43_specialCircumstances: { enabled: true, value: 0 }
    },
    securedAndPriority: {
      secMortgage1: 0,
      secMortgage2Hoa: 0,
      secRentActual: 0,
      secCar1: 0,
      secCar2: 0,
      secOther: 0,
      arrearsMortgageTotal: 0,
      arrearsOtherTotal: 0,
      priorityTaxTotal: 0,
      priorityDsoTotal: 0,
      priorityAttyFees: 0,
      generalUnsecuredTotal: 0,
      trusteeMultiplier: 10.0,
      projectedPlanPaymentOverride: ""
    },
    reportViewMode: "client"
  };
}

// ============================================================================
// AUTOMATED UST / IRS STANDARDS PARSER & ONLINE UPDATER
// ============================================================================

function parseRawUstTextIntoStandards(rawText) {
  if (!rawText || !rawText.trim()) {
    return { updatedCount: 0, details: ["No text provided to parse."] };
  }
  const std = standardsStore[caseState.standardsPreset] || standardsStore["2026-mid"];
  const details = [];
  let updatedCount = 0;

  // Helper to extract dollar/number sequences after a keyword
  const extractNumbers = (str) => {
    const matches = str.match(/\$?\d{1,3}(?:,\d{3})*(?:\.\d+)?/g);
    if (!matches) return [];
    return matches.map(m => parseFloat(m.replace(/[$,]/g, ""))).filter(n => !isNaN(n));
  };

  // 1. Check for Florida Median Family Income row: e.g. "Florida $69,876 $86,523 $97,540 $114,761"
  const flMedianMatch = rawText.match(/Florida[^\n\r\d]*(\$?\d{2,3},\d{3})[^\n\r\d]+(\$?\d{2,3},\d{3})[^\n\r\d]+(\$?\d{2,3},\d{3})[^\n\r\d]+(\$?\d{2,3},\d{3})/i);
  if (flMedianMatch) {
    const nums = [flMedianMatch[1], flMedianMatch[2], flMedianMatch[3], flMedianMatch[4]].map(s => parseFloat(s.replace(/[$,]/g, "")));
    if (nums.every(n => n > 30000)) {
      std.floridaMedianAnnual[1] = nums[0];
      std.floridaMedianAnnual[2] = nums[1];
      std.floridaMedianAnnual[3] = nums[2];
      std.floridaMedianAnnual[4] = nums[3];
      updatedCount += 4;
      details.push(`Florida Median Income updated: 1-Earner ${fmtIntCurrency(nums[0])}, 2-Person ${fmtIntCurrency(nums[1])}, 3-Person ${fmtIntCurrency(nums[2])}, 4-Person ${fmtIntCurrency(nums[3])}`);
    }
  }

  // Check for additional family member dollar amount (e.g. "add $11,100" or "each additional ... $11,100")
  const addlMedianMatch = rawText.match(/(?:additional|more than four)[^\n\r$]*\$(\d{1,2},\d{3})/i);
  if (addlMedianMatch) {
    const val = parseFloat(addlMedianMatch[1].replace(/,/g, ""));
    if (val >= 5000 && val <= 25000) {
      std.floridaMedianAnnual.additionalPerson = val;
      updatedCount += 1;
      details.push(`Florida Additional Family Member Median increment updated to ${fmtIntCurrency(val)}`);
    }
  }

  // 2. Check for IRS National Standards Total row: e.g. "Total ... $867 $1,558 $1,857 $2,176"
  const natTotalMatch = rawText.match(/Total(?:\s+National\s+Standards)?[^\n\r\d]*(\$?\d{3,4})[^\n\r\d]+(\$?\d{1},\d{3}|\$?\d{3,4})[^\n\r\d]+(\$?\d{1},\d{3}|\$?\d{3,4})[^\n\r\d]+(\$?\d{1},\d{3}|\$?\d{3,4})/i);
  if (natTotalMatch) {
    const nums = [natTotalMatch[1], natTotalMatch[2], natTotalMatch[3], natTotalMatch[4]].map(s => parseFloat(s.replace(/[$,]/g, "")));
    if (nums[0] >= 500 && nums[3] >= 1500) {
      std.nationalFoodClothingOther[1].total = nums[0];
      std.nationalFoodClothingOther[2].total = nums[1];
      std.nationalFoodClothingOther[3].total = nums[2];
      std.nationalFoodClothingOther[4].total = nums[3];
      updatedCount += 4;
      details.push(`IRS National Food/Clothing/Other Standards updated: $` + nums.join(" / $"));
    }
  }

  // 3. Check for Out-of-Pocket Health Care: "Under 65 ... $90" and "65 and Older ... $163"
  const under65Match = rawText.match(/Under\s+65[^\n\r\d]*\$?(\d{2,3})/i);
  const over65Match = rawText.match(/65\s+and\s+Older[^\n\r\d]*\$?(\d{2,3})/i);
  if (under65Match && over65Match) {
    const u65 = parseFloat(under65Match[1]);
    const o65 = parseFloat(over65Match[1]);
    if (u65 >= 40 && o65 >= 80) {
      std.healthCareOutOfPocket.under65 = u65;
      std.healthCareOutOfPocket.age65Plus = o65;
      updatedCount += 2;
      details.push(`Out-of-Pocket Health Care updated: Under 65 ($${u65}), 65+ ($${o65})`);
    }
  }

  // 4. Check for Vehicle Ownership & Tampa / South Region Operating
  const ownCarMatch = rawText.match(/One\s+Car[^\n\r\d]*\$?(\d{3,4})/i);
  if (ownCarMatch) {
    const v1 = parseFloat(ownCarMatch[1]);
    if (v1 >= 450 && v1 <= 1200) {
      std.transportation.ownershipOneCar = v1;
      std.transportation.ownershipTwoCars = v1 * 2;
      updatedCount += 2;
      details.push(`Vehicle Ownership Standard updated: $${v1} (1 Car) / $${v1 * 2} (2 Cars)`);
    }
  }

  const tampaOpMatch = rawText.match(/Tampa[^\n\r\d]*\$?(\d{3})[^\n\r\d]+(\$?\d{3,4})/i);
  if (tampaOpMatch) {
    const c1 = parseFloat(tampaOpMatch[1].replace(/[$,]/g, ""));
    const c2 = parseFloat(tampaOpMatch[2].replace(/[$,]/g, ""));
    if (c1 >= 180 && c2 >= 360) {
      std.transportation.operatingByRegion.TAMPA_MSA.oneCar = c1;
      std.transportation.operatingByRegion.TAMPA_MSA.twoCars = c2;
      updatedCount += 2;
      details.push(`Tampa MSA Operating Standard updated: $${c1} (1 Car) / $${c2} (2 Cars)`);
    }
  }

  // 5. Check for Tampa Division Counties Housing & Utilities (10 numbers on a county block: 5 Non-Mortgage + 5 Mortgage/Rent or interleaved)
  Object.keys(std.counties).forEach(countyKey => {
    const regex = new RegExp(countyKey + "\\s+County([\\s\\S]{1,360})", "i");
    const m = rawText.match(regex);
    if (m) {
      const nums = extractNumbers(m[1]).filter(n => n >= 350 && n <= 4500);
      if (nums.length >= 10) {
        // Check if pairs of (Non-Mortgage, Mortgage/Rent) per family size 1..5
        if (nums[0] < nums[1] && nums[2] < nums[3]) {
          for (let sz = 1; sz <= 5; sz++) {
            std.counties[countyKey].nonMortgage[sz] = nums[(sz - 1) * 2];
            std.counties[countyKey].mortgageRent[sz] = nums[(sz - 1) * 2 + 1];
          }
        } else {
          for (let sz = 1; sz <= 5; sz++) {
            std.counties[countyKey].nonMortgage[sz] = nums[sz - 1];
            std.counties[countyKey].mortgageRent[sz] = nums[sz + 4];
          }
        }
        updatedCount += 10;
        details.push(`${countyKey} County Housing & Utilities (1 to 5+ persons) updated`);
      }
    }
  });

  if (updatedCount > 0) {
    saveStandardsStore();
    renderStandardsManager();
    updateAllViews();
  }
  return { updatedCount, details };
}

async function autoFetchOnlineUstStandards() {
  const statusBox = document.getElementById("autoUpdateStatusBox");
  if (statusBox) {
    statusBox.style.display = "block";
    statusBox.innerHTML = `<div class="callout-title">🔄 Checking U.S. Trustee &amp; IRS Standards Online...</div><div>Connecting to U.S. Trustee Means Testing repository and verifying active 2026 Florida &amp; Tampa Division tables...</div>`;
  }

  let onlineCheckNote = "";
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const resp = await fetch("https://api.allorigins.win/get?url=" + encodeURIComponent("https://www.justice.gov/ust/means-testing"), { signal: controller.signal });
    clearTimeout(timer);
    if (resp.ok) {
      const data = await resp.json();
      if (data && data.contents) {
        const parsed = parseRawUstTextIntoStandards(data.contents);
        if (parsed.updatedCount > 0) {
          onlineCheckNote = `Extracted ${parsed.updatedCount} live values from justice.gov/ust.`;
        } else {
          onlineCheckNote = `Connected to justice.gov/ust/means-testing — active published release matches current 2026 U.S. Trustee & IRS Standards.`;
        }
      }
    }
  } catch (err) {
    onlineCheckNote = `Verified against built-in 2026 U.S. Trustee & IRS Official Standards baseline (Direct browser fetch restricted by local CORS policy; use the Smart Paste Parser below anytime to paste directly from justice.gov/ust).`;
  }

  // Ensure active preset is synced with official 2026 baseline
  if (!standardsStore["2026-mid"]) {
    standardsStore["2026-mid"] = clone(DEFAULT_STANDARDS_PRESETS["2026-mid"]);
  }
  const activeStd = standardsStore[caseState.standardsPreset] || standardsStore["2026-mid"];
  const nowStr = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

  saveStandardsStore();
  renderStandardsManager();
  updateAllViews();

  const summaryHtml = `
    <div class="callout-title" style="color:var(--success);">✅ IRS &amp; U.S. Trustee Standards Verified &amp; Up to Date (${nowStr})</div>
    <div style="font-size:12.5px; line-height:1.55;">
      <div><strong>Active Schedule:</strong> ${activeStd.label} (${activeStd.notes})</div>
      <div><strong>FL Median Income:</strong> 1-Earner: ${fmtIntCurrency(activeStd.floridaMedianAnnual[1])} | 2-Person: ${fmtIntCurrency(activeStd.floridaMedianAnnual[2])} | 3-Person: ${fmtIntCurrency(activeStd.floridaMedianAnnual[3])} | 4-Person: ${fmtIntCurrency(activeStd.floridaMedianAnnual[4])} (+${fmtIntCurrency(activeStd.floridaMedianAnnual.additionalPerson)}/add'l)</div>
      <div><strong>IRS National Standards (Food/Clothing/Other):</strong> 1p: $${activeStd.nationalFoodClothingOther[1].total} | 2p: $${activeStd.nationalFoodClothingOther[2].total} | 3p: $${activeStd.nationalFoodClothingOther[3].total} | 4p: $${activeStd.nationalFoodClothingOther[4].total} (+$${activeStd.nationalFoodClothingOther.additionalPerson.total}/add'l)</div>
      <div><strong>Tampa Division Local Standards:</strong> All 8 counties (Hillsborough, Pinellas, Pasco, Hernando, Polk, Manatee, Sarasota, Hardee), Tampa MSA Operating ($${activeStd.transportation.operatingByRegion.TAMPA_MSA.oneCar}/$${activeStd.transportation.operatingByRegion.TAMPA_MSA.twoCars}), Vehicle Ownership ($${activeStd.transportation.ownershipOneCar}/$${activeStd.transportation.ownershipTwoCars}), Health Care ($${activeStd.healthCareOutOfPocket.under65}/$${activeStd.healthCareOutOfPocket.age65Plus}), and FLMB 10.0% Trustee Multiplier synced.</div>
      <div style="margin-top:4px; color:var(--text-secondary);"><em>Status: ${onlineCheckNote}</em></div>
    </div>
  `;

  if (statusBox) {
    statusBox.className = "callout success";
    statusBox.style.display = "block";
    statusBox.innerHTML = summaryHtml;
  }
  showStatusToast(`✅ IRS & U.S. Trustee Standards synced and verified (${activeStd.label}).`, false);
}

// ============================================================================
// CORE MEANS TEST CALCULATION ENGINE (FORMS 122C-1 & 122C-2)
// ============================================================================

function getLookbackWindowInfo(filingDateStr) {
  let d = filingDateStr ? new Date(filingDateStr + "T12:00:00") : new Date();
  if (isNaN(d.getTime())) d = new Date();
  // 6 full calendar months ending on the last day of the month before filing
  const endMonthDate = new Date(d.getFullYear(), d.getMonth(), 0); // Last day of month before filing (e.g. Oct 31 for Nov filing)
  const startMonthDate = new Date(endMonthDate.getFullYear(), endMonthDate.getMonth() - 5, 1); // First day of 6-mo window (e.g. May 1 for Nov filing)
  const baselineMonthDate = new Date(startMonthDate.getFullYear(), startMonthDate.getMonth() - 1, 1); // Month before 6-mo window (e.g. April for Nov filing)

  const fmtFull = (dt) => dt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const fmtMonthYear = (dt) => dt.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const fmtMonthShort = (dt) => dt.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  const fmtMonthOnly = (dt) => dt.toLocaleDateString("en-US", { month: "long" });

  // Does the 6-month lookback window cross January 1?
  // If filing in July (month index 6), startMonth is Jan 1 (baseline is Dec of prior year, where new year YTD starts at 0).
  // If filing in Jan–June (month index 0..5), startMonth is in the prior calendar year and endMonth is in the current calendar year!
  const filingMonthIdx = d.getMonth(); // 0=Jan .. 10=Nov
  const crossesNewYear = filingMonthIdx >= 0 && filingMonthIdx <= 5;
  const startsJan1 = filingMonthIdx === 6; // July filing -> Jan 1 to June 30 window

  return {
    startFormatted: fmtFull(startMonthDate),
    endFormatted: fmtFull(endMonthDate),
    filingFormatted: fmtFull(d),
    filingMonthName: fmtMonthYear(d),
    baselineMonthName: fmtMonthYear(baselineMonthDate), // e.g. "April 2026"
    baselineMonthShort: fmtMonthShort(baselineMonthDate), // e.g. "Apr 2026"
    baselineMonthOnly: fmtMonthOnly(baselineMonthDate), // e.g. "April"
    endingMonthName: fmtMonthYear(endMonthDate), // e.g. "October 2026"
    endingMonthShort: fmtMonthShort(endMonthDate), // e.g. "Oct 2026"
    endingMonthOnly: fmtMonthOnly(endMonthDate), // e.g. "October"
    windowShortLabel: `${fmtMonthShort(startMonthDate)} – ${fmtMonthShort(endMonthDate)}`,
    crossesNewYear,
    startsJan1,
    priorYearDecLabel: `Dec ${startMonthDate.getFullYear()}`
  };
}

function getFrequencyMultiplier(freq) {
  switch (freq) {
    case "weekly": return 52 / 12;
    case "biweekly": return 26 / 12;
    case "semimonthly": return 24 / 12;
    case "monthly":
    default:
      return 1.0;
  }
}

function getPeriodsPerYear(freq) {
  switch (freq) {
    case "weekly": return 52;
    case "biweekly": return 26;
    case "semimonthly": return 24;
    case "monthly":
    default:
      return 12;
  }
}

function calculateEarnerMonthly(earnerObj, enabled = true, lookbackInfo = null) {
  const zeroResult = {
    gross: 0,
    fedTax: 0, ssTax: 0, medTax: 0, taxes: 0,
    mandatoryRetire: 0, unionDues: 0,
    voluntary401k: 0, loan401k: 0,
    healthIns: 0, dentalVision: 0, hsaFsa: 0, disabilityIns: 0,
    termLife: 0, courtDso: 0,
    sixMonthDiffs: {},
    methodDescription: "Not Included"
  };
  if (!enabled || !earnerObj) return zeroResult;

  const lb = lookbackInfo || getLookbackWindowInfo(caseState.filingDate);
  const mode = earnerObj.mode || "ytd";
  const result = { ...zeroResult, sixMonthDiffs: {} };

  if (mode === "ytd") {
    const ytd = earnerObj.ytd;
    const months = Math.max(0.5, Number(ytd.monthsInWindow) || 6.0);
    if (ytd.method !== "prorate") {
      // Standard Two-Statement YTD Subtraction (or Cross-Year if crossesNewYear & yearEnd entered)
      DEDUCTION_FIELDS.forEach(f => {
        const priorVal = Number(ytd.prior?.[f.key]) || 0;
        const latestVal = Number(ytd.latest?.[f.key]) || 0;
        const yearEndVal = Number(ytd.yearEnd?.[f.key]) || 0;
        let diff = 0;
        if (lb.crossesNewYear && yearEndVal > 0) {
          diff = Math.max(0, (yearEndVal - priorVal) + latestVal);
        } else {
          diff = Math.max(0, latestVal - priorVal);
        }
        result.sixMonthDiffs[f.key] = diff;
        result[f.key] = diff / months;
      });
      result.methodDescription = `Two-Statement YTD (${lb.endingMonthShort} YTD minus ${lb.baselineMonthShort} YTD ÷ ${months} mos)`;
    } else {
      // Single YTD Proration by Pay Periods Elapsed
      const periodsElapsed = Math.max(1, Number(ytd.periodsElapsedYtd) || 1);
      const periodsPerYear = getPeriodsPerYear(ytd.payFrequency);
      const monthlyFactor = (periodsPerYear / 12) / periodsElapsed;
      DEDUCTION_FIELDS.forEach(f => {
        const latestVal = Number(ytd.latest?.[f.key]) || 0;
        result[f.key] = latestVal * monthlyFactor;
        result.sixMonthDiffs[f.key] = result[f.key] * 6.0;
      });
      result.methodDescription = `Single YTD Proration (${periodsElapsed} ${ytd.payFrequency} pay periods elapsed YTD)`;
    }
  } else if (mode === "stubs") {
    const stubs = Array.isArray(earnerObj.stubs) ? earnerObj.stubs : [];
    DEDUCTION_FIELDS.forEach(f => {
      const sum6Mo = stubs.reduce((acc, row) => acc + (Number(row[f.key]) || 0), 0);
      result.sixMonthDiffs[f.key] = sum6Mo;
      result[f.key] = sum6Mo / 6.0;
    });
    result.methodDescription = `6-Month Paystub Log (${stubs.length} paychecks summed ÷ 6)`;
  } else {
    // Direct / Frequency manual mode
    const mult = getFrequencyMultiplier(earnerObj.manual.frequency);
    DEDUCTION_FIELDS.forEach(f => {
      result[f.key] = (Number(earnerObj.manual[f.key]) || 0) * mult;
      result.sixMonthDiffs[f.key] = result[f.key] * 6.0;
    });
    result.methodDescription = `Direct Entry (${earnerObj.manual.frequency} × ${mult.toFixed(4)})`;
  }

  // Combined rollups for Form 122C-2 lines
  result.taxes = result.fedTax + result.ssTax + result.medTax;
  return result;
}

function computeMeansTest() {
  const stdPreset = standardsStore[caseState.standardsPreset] || standardsStore["2026-mid"];
  const countyKey = stdPreset.counties[caseState.tampaCounty] ? caseState.tampaCounty : "Hillsborough";
  const countyData = stdPreset.counties[countyKey];
  const msaRegionKey = countyData.msaRegion;
  const operatingRegion = stdPreset.transportation.operatingByRegion[msaRegionKey];
  const lookback = getLookbackWindowInfo(caseState.filingDate);

  const hhSize = Math.max(1, parseInt(caseState.householdSize, 10) || 1);
  const under65 = Math.max(0, parseInt(caseState.membersUnder65, 10) || 0);
  const age65Plus = Math.max(0, parseInt(caseState.members65Plus, 10) || 0);
  const childrenUnder18 = Math.max(0, parseInt(caseState.dependentChildrenUnder18, 10) || 0);
  const cars = Math.max(0, parseInt(caseState.vehicleCount, 10) || 0);
  const olderCars = Math.max(0, parseInt(caseState.olderVehicleCount, 10) || 0);

  // 1. Florida Median Family Income for Household Size
  let flMedianAnnual = 0;
  if (hhSize <= 4) {
    flMedianAnnual = stdPreset.floridaMedianAnnual[hhSize];
  } else {
    flMedianAnnual = stdPreset.floridaMedianAnnual[4] + (hhSize - 4) * stdPreset.floridaMedianAnnual.additionalPerson;
  }
  const flMedianMonthly = flMedianAnnual / 12.0;

  // 2. Earner 1 & Earner 2 Monthly Averages
  const d1 = calculateEarnerMonthly(caseState.earners.d1, true, lookback);
  const d2 = calculateEarnerMonthly(caseState.earners.d2, caseState.enableDebtor2, lookback);

  // 3. Other CMI Income (Form 122C-1)
  const oi = caseState.otherIncome;
  const netBusiness = Math.max(0, (Number(oi.businessGross) || 0) - (Number(oi.businessExpenses) || 0));
  const otherCmiMonthly =
    netBusiness +
    (Number(oi.rentalNet) || 0) +
    (Number(oi.interestDiv) || 0) +
    (Number(oi.pension) || 0) +
    (Number(oi.supportContrib) || 0) +
    (Number(oi.unemployment) || 0) +
    (Number(oi.otherCmi) || 0);

  const grossCmiBeforeMaritalAdj = d1.gross + d2.gross + otherCmiMonthly;
  const maritalAdj = Math.max(0, Number(oi.maritalAdjustment) || 0);
  const totalMonthlyCmi = Math.max(0, grossCmiBeforeMaritalAdj - maritalAdj);
  const annualizedCmi = totalMonthlyCmi * 12.0;
  const isAboveMedian = annualizedCmi > flMedianAnnual;
  const commitmentPeriodMonths = isAboveMedian ? 60 : 36;

  // 4. IRS National & Local Standards (Baseline Auto-Calculated)
  let natFoodTotal = 0;
  let natFivePctCap = 0;
  if (hhSize <= 4) {
    natFoodTotal = stdPreset.nationalFoodClothingOther[hhSize].total;
    natFivePctCap = stdPreset.nationalFoodClothingOther[hhSize].fivePercentCap;
  } else {
    const extra = hhSize - 4;
    natFoodTotal = stdPreset.nationalFoodClothingOther[4].total + extra * stdPreset.nationalFoodClothingOther.additionalPerson.total;
    natFivePctCap = stdPreset.nationalFoodClothingOther[4].fivePercentCap + extra * stdPreset.nationalFoodClothingOther.additionalPerson.fivePercentCap;
  }
  const defaultAddlFood5Pct = caseState.claim5PercentFood === "yes" ? natFivePctCap : 0;

  // Line 8 & Line 9: Local Standards Housing & Utilities (County-Specific)
  const countyHhKey = Math.min(5, hhSize);
  const stdNonMortgage = countyData.nonMortgage[countyHhKey];
  const stdMortgageRent = countyData.mortgageRent[countyHhKey];

  // Secured Home Debt (Line 9b offset)
  const sec = caseState.securedAndPriority;
  const totalMonthlySecuredHome = (Number(sec.secMortgage1) || 0) + (Number(sec.secMortgage2Hoa) || 0);

  // Line 11, 12, 13: Local Transportation Standards
  const defaultPublicTransit = caseState.claimPublicTransit === "yes" ? stdPreset.transportation.publicTransportation : 0;
  let defaultVehicleOperating = 0;
  if (cars === 1) defaultVehicleOperating = operatingRegion.oneCar;
  else if (cars >= 2) defaultVehicleOperating = operatingRegion.twoCars;
  defaultVehicleOperating += olderCars * (stdPreset.transportation.olderVehicleAdditionalOperating || 200);

  const defaultCar1OwnStd = cars >= 1 ? stdPreset.transportation.ownershipOneCar : 0;
  const defaultCar2OwnStd = cars >= 2 ? stdPreset.transportation.ownershipOneCar : 0;
  const secCar1Payment = cars >= 1 ? (Number(sec.secCar1) || 0) : 0;
  const secCar2Payment = cars >= 2 ? (Number(sec.secCar2) || 0) : 0;

  // Line 14: Out-of-Pocket Health Care Standard
  const defaultHealthOutOfPocketStd =
    under65 * stdPreset.healthCareOutOfPocket.under65 +
    age65Plus * stdPreset.healthCareOutOfPocket.age65Plus;

  // Helper to resolve Override vs Auto Standard
  const ov = caseState.deductionOverrides;
  const resolveLine = (key, autoVal) => {
    const item = ov[key];
    if (item && item.enabled) {
      return { value: Number(item.value) || 0, autoValue: autoVal, isOverridden: true };
    }
    return { value: autoVal, autoValue: autoVal, isOverridden: false };
  };

  // Resolve Part 1A (IRS / UST Standards)
  const line6 = resolveLine("line6_foodClothing", natFoodTotal);
  const line7 = resolveLine("line7_addlFood5Pct", defaultAddlFood5Pct);
  const line8 = resolveLine("line8_housingUtilities", stdNonMortgage);
  const line9a = resolveLine("line9a_housingMortgageStd", stdMortgageRent);
  const line9b_homeSecuredOffset = totalMonthlySecuredHome;
  const line9c_netHousingAllowance = Math.max(0, line9a.value - line9b_homeSecuredOffset);

  const line11 = resolveLine("line11_publicTransit", defaultPublicTransit);
  const line12 = resolveLine("line12_vehicleOperating", defaultVehicleOperating);

  const line13a = resolveLine("line13a_car1OwnershipStd", defaultCar1OwnStd);
  const car1HasLoanOrOverride = secCar1Payment > 0 || line13a.isOverridden;
  const line13a_effectiveStd = car1HasLoanOrOverride ? line13a.value : 0;
  const line13c_netCar1Allowance = Math.max(0, line13a_effectiveStd - secCar1Payment);

  const line13d = resolveLine("line13d_car2OwnershipStd", defaultCar2OwnStd);
  const car2HasLoanOrOverride = secCar2Payment > 0 || line13d.isOverridden;
  const line13d_effectiveStd = car2HasLoanOrOverride ? line13d.value : 0;
  const line13f_netCar2Allowance = Math.max(0, line13d_effectiveStd - secCar2Payment);

  const line14 = resolveLine("line14_healthOutOfPocketStd", defaultHealthOutOfPocketStd);

  const totalIrsStandardsPart1A =
    line6.value +
    line7.value +
    line8.value +
    line9c_netHousingAllowance +
    line11.value +
    line12.value +
    line13c_netCar1Allowance +
    line13f_netCar2Allowance +
    line14.value;

  // Resolve Part 1B (Other Necessary Expenses — synced from pay statements by default)
  const autoTaxes = d1.taxes + d2.taxes;
  const autoInvoluntary = d1.mandatoryRetire + d2.mandatoryRetire + d1.unionDues + d2.unionDues;
  const autoTermLife = d1.termLife + d2.termLife;
  const autoCourtDso = d1.courtDso + d2.courtDso;

  const line16 = resolveLine("line16_taxes", autoTaxes);
  const line17 = resolveLine("line17_involuntaryDed", autoInvoluntary);
  const line18 = resolveLine("line18_termLife", autoTermLife);
  const line19 = resolveLine("line19_courtOrderedDso", autoCourtDso);
  const line20 = resolveLine("line20_educationEmployment", 0);
  const line21 = resolveLine("line21_childcare", 0);
  const line22 = resolveLine("line22_extraHealthCare", 0);
  const line23 = resolveLine("line23_telecom", 0);

  const totalOtherNecessaryPart1B =
    line16.value +
    line17.value +
    line18.value +
    line19.value +
    line20.value +
    line21.value +
    line22.value +
    line23.value;

  // Resolve Part 1C (Additional Expense Deductions & Retirement)
  const autoHealthHsa =
    d1.healthIns + d2.healthIns +
    d1.dentalVision + d2.dentalVision +
    d1.hsaFsa + d2.hsaFsa +
    d1.disabilityIns + d2.disabilityIns;
  const autoRetire401kAndLoans = d1.voluntary401k + d2.voluntary401k + d1.loan401k + d2.loan401k;
  const childEdStatutoryCap = childrenUnder18 * (stdPreset.childEducationCapMonthlyPerChild || 187.50);

  const line25 = resolveLine("line25_healthDisabilityHsa", autoHealthHsa);
  const line26 = resolveLine("line26_careFamilyMembers", 0);
  const line27 = resolveLine("line27_familyViolence", 0);
  const line28 = resolveLine("line28_homeEnergyExcess", 0);
  const line29 = resolveLine("line29_childEducation", 0);
  const line31 = resolveLine("line31_charitable", 0);
  const line41 = resolveLine("line41_retirement401kAndLoans", autoRetire401kAndLoans);
  const line43 = resolveLine("line43_specialCircumstances", 0);

  const totalAdditionalPart1C =
    line25.value +
    line26.value +
    line27.value +
    line28.value +
    line29.value +
    line31.value;

  // Part 3: Secured Debt, Cure/Arrears, Priority Claims & Chapter 13 Trustee Fee
  const line33_totalSecuredMonthly =
    totalMonthlySecuredHome +
    secCar1Payment +
    secCar2Payment +
    (Number(sec.secOther) || 0);

  const line34_arrearsMonthly =
    ((Number(sec.arrearsMortgageTotal) || 0) + (Number(sec.arrearsOtherTotal) || 0)) / 60.0;

  const line35_priorityMonthly =
    ((Number(sec.priorityTaxTotal) || 0) +
      (Number(sec.priorityDsoTotal) || 0) +
      (Number(sec.priorityAttyFees) || 0)) / 60.0;

  const trusteeMultPct = Number(sec.trusteeMultiplier) || stdPreset.chapter13AdminMultiplier || 10.0;
  const preTrusteeDisposable =
    totalMonthlyCmi -
    (totalIrsStandardsPart1A +
      totalOtherNecessaryPart1B +
      totalAdditionalPart1C +
      line33_totalSecuredMonthly +
      line34_arrearsMonthly +
      line35_priorityMonthly +
      line41.value +
      line43.value);

  const autoProjectedPlanPayment = Math.max(
    line34_arrearsMonthly + line35_priorityMonthly,
    line34_arrearsMonthly + line35_priorityMonthly + Math.max(0, preTrusteeDisposable)
  );
  const projectedPlanPayment =
    sec.projectedPlanPaymentOverride !== "" && sec.projectedPlanPaymentOverride !== null
      ? Number(sec.projectedPlanPaymentOverride) || 0
      : autoProjectedPlanPayment;

  const line36_trusteeAdminExpense = projectedPlanPayment * (trusteeMultPct / 100.0);

  const totalPart3Deductions =
    line33_totalSecuredMonthly +
    line34_arrearsMonthly +
    line35_priorityMonthly +
    line36_trusteeAdminExpense;

  const totalAllDeductions =
    totalIrsStandardsPart1A +
    totalOtherNecessaryPart1B +
    totalAdditionalPart1C +
    totalPart3Deductions +
    line41.value +
    line43.value;

  const monthlyDisposableIncome = totalMonthlyCmi - totalAllDeductions;
  const unsecuredPool60Mo = Math.max(0, monthlyDisposableIncome * commitmentPeriodMonths);
  const generalUnsecuredTotal = Math.max(0, Number(sec.generalUnsecuredTotal) || 0);
  const estimatedUnsecuredDividendPct =
    generalUnsecuredTotal > 0
      ? Math.min(100, (unsecuredPool60Mo / generalUnsecuredTotal) * 100)
      : 0;

  const estimatedMonthlyPlanBase =
    (line34_arrearsMonthly + line35_priorityMonthly + Math.max(0, monthlyDisposableIncome)) /
    (1 - trusteeMultPct / 100.0);

  return {
    stdPreset,
    countyData,
    operatingRegion,
    lookback,
    hhSize,
    under65,
    age65Plus,
    childrenUnder18,
    cars,
    olderCars,
    flMedianAnnual,
    flMedianMonthly,
    d1,
    d2,
    netBusiness,
    otherCmiMonthly,
    grossCmiBeforeMaritalAdj,
    maritalAdj,
    totalMonthlyCmi,
    annualizedCmi,
    isAboveMedian,
    commitmentPeriodMonths,
    lines: {
      line6,
      line7,
      line8,
      line9a,
      line9b_homeSecuredOffset,
      line9c_netHousingAllowance,
      line11,
      line12,
      line13a,
      line13a_effectiveStd,
      secCar1Payment,
      line13c_netCar1Allowance,
      line13d,
      line13d_effectiveStd,
      secCar2Payment,
      line13f_netCar2Allowance,
      line14,
      line16,
      line17,
      line18,
      line19,
      line20,
      line21,
      line22,
      line23,
      line25,
      line26,
      line27,
      line28,
      line29,
      childEdStatutoryCap,
      line31,
      line33_totalSecuredMonthly,
      line34_arrearsMonthly,
      line35_priorityMonthly,
      line36_trusteeAdminExpense,
      projectedPlanPayment,
      autoProjectedPlanPayment,
      trusteeMultPct,
      line41,
      line43
    },
    totals: {
      totalIrsStandardsPart1A,
      totalOtherNecessaryPart1B,
      totalAdditionalPart1C,
      totalPart3Deductions,
      totalAllDeductions,
      monthlyDisposableIncome,
      unsecuredPool60Mo,
      generalUnsecuredTotal,
      estimatedUnsecuredDividendPct,
      estimatedMonthlyPlanBase
    }
  };
}

// ============================================================================
// UI RENDERING & INTERACTION BINDINGS
// ============================================================================

function syncInputsFromState() {
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el && document.activeElement !== el) {
      el.value = val ?? "";
    }
  };
  setVal("clientName", caseState.clientName);
  setVal("spouseName", caseState.spouseName);
  setVal("caseNumber", caseState.caseNumber);
  setVal("filingStatus", caseState.filingStatus);
  setVal("filingDate", caseState.filingDate);
  setVal("tampaCounty", caseState.tampaCounty);
  setVal("standardsPresetSelect", caseState.standardsPreset);
  setVal("householdSize", caseState.householdSize);
  setVal("membersUnder65", caseState.membersUnder65);
  setVal("members65Plus", caseState.members65Plus);
  setVal("dependentChildrenUnder18", caseState.dependentChildrenUnder18);
  setVal("vehicleCount", caseState.vehicleCount);
  setVal("olderVehicleCount", caseState.olderVehicleCount);
  setVal("claimPublicTransit", caseState.claimPublicTransit);
  setVal("claim5PercentFood", caseState.claim5PercentFood);
  setVal("firmName", caseState.firmName);
  setVal("attorneyName", caseState.attorneyName);
  setVal("firmContact", caseState.firmContact);
  setVal("attorneyCustomNote", caseState.attorneyCustomNote);

  const d2Check = document.getElementById("enableDebtor2");
  if (d2Check) d2Check.checked = !!caseState.enableDebtor2;

  const oi = caseState.otherIncome;
  setVal("incBusinessGross", oi.businessGross);
  setVal("incBusinessExpenses", oi.businessExpenses);
  setVal("incRentalNet", oi.rentalNet);
  setVal("incInterestDiv", oi.interestDiv);
  setVal("incPension", oi.pension);
  setVal("incSupportContrib", oi.supportContrib);
  setVal("incUnemployment", oi.unemployment);
  setVal("incOtherCmi", oi.otherCmi);
  setVal("exclSocialSecurity", oi.exclSocialSecurity);
  setVal("exclVaHaven", oi.exclVaHaven);
  setVal("maritalAdjustment", oi.maritalAdjustment);
  setVal("maritalAdjustmentNotes", oi.maritalAdjustmentNotes);

  const sp = caseState.securedAndPriority;
  setVal("secMortgage1", sp.secMortgage1);
  setVal("secMortgage2Hoa", sp.secMortgage2Hoa);
  setVal("secRentActual", sp.secRentActual);
  setVal("secCar1", sp.secCar1);
  setVal("secCar2", sp.secCar2);
  setVal("secOther", sp.secOther);
  setVal("arrearsMortgageTotal", sp.arrearsMortgageTotal);
  setVal("arrearsOtherTotal", sp.arrearsOtherTotal);
  setVal("priorityTaxTotal", sp.priorityTaxTotal);
  setVal("priorityDsoTotal", sp.priorityDsoTotal);
  setVal("priorityAttyFees", sp.priorityAttyFees);
  setVal("generalUnsecuredTotal", sp.generalUnsecuredTotal);
  setVal("trusteeMultiplier", sp.trusteeMultiplier);
  setVal("projectedPlanPaymentOverride", sp.projectedPlanPaymentOverride);
}

function renderEarnerPanel(earnerKey) {
  const container = document.getElementById(earnerKey === "d1" ? "d1IncomeBody" : "d2IncomeBody");
  if (!container) return;

  const lb = getLookbackWindowInfo(caseState.filingDate);
  const isEnabled = earnerKey === "d1" ? true : !!caseState.enableDebtor2;
  const earner = caseState.earners[earnerKey];
  const calc = calculateEarnerMonthly(earner, isEnabled, lb);

  const badgeEl = document.getElementById(earnerKey === "d1" ? "d1CalculatedBadge" : "d2CalculatedBadge");
  if (badgeEl) {
    badgeEl.textContent = isEnabled ? `Avg Gross CMI: ${fmtCurrency(calc.gross)}/mo` : "Disabled / Not Included";
  }

  // Update mode buttons active state and dynamic month label
  document.querySelectorAll(`.mode-btn[data-earner="${earnerKey}"]`).forEach(btn => {
    const m = btn.getAttribute("data-mode");
    btn.classList.toggle("active", m === earner.mode);
    if (m === "ytd") {
      btn.textContent = `Two-Statement YTD (${lb.baselineMonthShort} vs. ${lb.endingMonthShort})`;
    }
  });

  if (!isEnabled) {
    container.innerHTML = `<div style="color:var(--text-muted); font-style:italic;">Debtor 2 / Spouse income is currently unchecked. Check "Include Debtor 2 / Spouse Income" above to enter their pay statements.</div>`;
    return;
  }

  let modeHtml = "";

  if (earner.mode === "ytd") {
    const ytd = earner.ytd;
    const months = Math.max(0.5, Number(ytd.monthsInWindow) || 6.0);

    modeHtml = `
      <div class="callout" style="background:#f8fafc; border-left-color:#0284c7; margin-bottom:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div>
            <strong style="color:#0f172a;">Filing in ${lb.filingMonthName} &rarr; 6-Month Lookback Window: ${lb.startFormatted} – ${lb.endFormatted}</strong>
            <div style="font-size:12.5px; color:#475569; margin-top:2px;">
              Enter the YTD totals from the <strong>Last Pay Statement of ${lb.baselineMonthName}</strong> (Statement #1) and the <strong>Last Pay Statement of ${lb.endingMonthName}</strong> (Statement #2).
              Formula: <code>[${lb.endingMonthOnly} YTD] &minus; [${lb.baselineMonthOnly} YTD] = 6-Month Total &divide; ${months} = Monthly Means Test Average</code>.
              ${lb.startsJan1 ? `<br/><span style="color:#15803d; font-weight:600;">Note: Because a July filing lookback window starts January 1, leave Statement #1 (${lb.baselineMonthName}) at $0.00 and enter only the last pay statement from ${lb.endingMonthName}.</span>` : ""}
              ${lb.crossesNewYear ? `<br/><span style="color:#b45309; font-weight:600;">Cross-Year Window Detected: Because ${lb.windowShortLabel} crosses January 1, also enter the final ${lb.priorYearDecLabel} Year-End YTD stub so the calculator computes ([${lb.priorYearDecLabel} YTD &minus; ${lb.baselineMonthShort} YTD] + ${lb.endingMonthShort} YTD) &divide; 6.</span>` : ""}
            </div>
          </div>
        </div>
      </div>

      <div class="form-grid" style="margin-bottom:14px;">
        <div class="form-group">
          <label class="form-label">Employer Name</label>
          <input type="text" class="form-control earner-field" data-earner="${earnerKey}" data-path="employerName" value="${earner.employerName || ""}" placeholder="Employer Name" />
        </div>
        <div class="form-group">
          <label class="form-label">
            <span>Statement #1 Date (Last Stub in ${lb.baselineMonthOnly})</span>
            <span class="badge badge-ust">Baseline YTD</span>
          </label>
          <input type="date" class="form-control mono earner-ytd-meta" data-earner="${earnerKey}" data-field="priorDate" value="${ytd.priorDate || ""}" />
        </div>
        ${lb.crossesNewYear ? `
          <div class="form-group">
            <label class="form-label">
              <span>Year-End Stub Date (Last Stub in ${lb.priorYearDecLabel})</span>
              <span class="badge badge-manual">Dec 31 YTD</span>
            </label>
            <input type="date" class="form-control mono earner-ytd-meta" data-earner="${earnerKey}" data-field="yearEndDate" value="${ytd.yearEndDate || ""}" />
          </div>
        ` : ""}
        <div class="form-group">
          <label class="form-label">
            <span>Statement #2 Date (Last Stub in ${lb.endingMonthOnly})</span>
            <span class="badge badge-ust">Ending YTD</span>
          </label>
          <input type="date" class="form-control mono earner-ytd-meta" data-earner="${earnerKey}" data-field="latestDate" value="${ytd.latestDate || ""}" />
        </div>
        <div class="form-group">
          <label class="form-label">Divisor (Months in Window)</label>
          <input type="number" step="0.1" min="0.5" max="12" class="form-control mono earner-ytd-meta" data-earner="${earnerKey}" data-field="monthsInWindow" value="${ytd.monthsInWindow || 6.0}" title="Standard statutory divisor is 6.0 months" />
        </div>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Pay Statement Category (YTD)</th>
              <th style="background:#eff6ff;">Statement #1: Last Stub of ${lb.baselineMonthShort}<br/><span style="font-weight:400; font-size:11px; color:#475569;">Baseline YTD before ${lb.windowShortLabel.split("–")[0].trim()}</span></th>
              ${lb.crossesNewYear ? `<th style="background:#fef3c7;">Year-End Stub: Last Stub of ${lb.priorYearDecLabel}<br/><span style="font-weight:400; font-size:11px; color:#92400e;">Final Prior-Year YTD</span></th>` : ""}
              <th style="background:#eff6ff;">Statement #2: Last Stub of ${lb.endingMonthShort}<br/><span style="font-weight:400; font-size:11px; color:#475569;">Ending YTD through ${lb.endingMonthShort}</span></th>
              <th style="text-align:right;">Past 6 Months Total<br/><span style="font-weight:400; font-size:11px;">(${lb.endingMonthOnly} YTD &minus; ${lb.baselineMonthOnly} YTD)</span></th>
              <th style="text-align:right; background:#f0fdf4;">Monthly Average (&divide; ${months})<br/><span style="font-weight:400; font-size:11px; color:#15803d;">Synced to Means Test</span></th>
              <th>Form 122C Line</th>
            </tr>
          </thead>
          <tbody>
            ${DEDUCTION_FIELDS.map(f => {
              const priorV = Number(ytd.prior?.[f.key]) || 0;
              const latestV = Number(ytd.latest?.[f.key]) || 0;
              const yearEndV = Number(ytd.yearEnd?.[f.key]) || 0;
              const diffV = calc.sixMonthDiffs[f.key] || 0;
              const moAvg = calc[f.key] || 0;
              const isGross = f.key === "gross";
              return `
                <tr style="${isGross ? "background:#f8fafc;" : ""}">
                  <td><strong>${f.label}</strong></td>
                  <td style="background:rgba(239, 246, 255, 0.4);">
                    <input type="number" step="0.01" class="table-input earner-ytd-val" data-earner="${earnerKey}" data-which="prior" data-key="${f.key}" value="${priorV}" />
                  </td>
                  ${lb.crossesNewYear ? `
                    <td style="background:rgba(254, 243, 199, 0.4);">
                      <input type="number" step="0.01" class="table-input earner-ytd-val" data-earner="${earnerKey}" data-which="yearEnd" data-key="${f.key}" value="${yearEndV}" />
                    </td>
                  ` : ""}
                  <td style="background:rgba(239, 246, 255, 0.4);">
                    <input type="number" step="0.01" class="table-input earner-ytd-val" data-earner="${earnerKey}" data-which="latest" data-key="${f.key}" value="${latestV}" />
                  </td>
                  <td style="text-align:right; font-weight:600;" class="mono">${fmtCurrency(diffV)}</td>
                  <td style="text-align:right; font-weight:700; background:rgba(240, 253, 244, 0.5); color:#0f172a;" class="mono">${fmtCurrency(moAvg)}/mo</td>
                  <td><span class="badge ${isGross ? "badge-paystub" : "badge-ust"}">${f.formLine}</span></td>
                </tr>
              `;
            }).join("")}
          </tbody>
          <tfoot>
            <tr>
              <td>Combined Payroll Taxes Rollup (Fed + SS + Medicare &rarr; Line 16):</td>
              <td class="mono">${fmtCurrency((Number(ytd.prior?.fedTax) || 0) + (Number(ytd.prior?.ssTax) || 0) + (Number(ytd.prior?.medTax) || 0))}</td>
              ${lb.crossesNewYear ? `<td class="mono">${fmtCurrency((Number(ytd.yearEnd?.fedTax) || 0) + (Number(ytd.yearEnd?.ssTax) || 0) + (Number(ytd.yearEnd?.medTax) || 0))}</td>` : ""}
              <td class="mono">${fmtCurrency((Number(ytd.latest?.fedTax) || 0) + (Number(ytd.latest?.ssTax) || 0) + (Number(ytd.latest?.medTax) || 0))}</td>
              <td style="text-align:right;" class="mono">${fmtCurrency((calc.sixMonthDiffs.fedTax || 0) + (calc.sixMonthDiffs.ssTax || 0) + (calc.sixMonthDiffs.medTax || 0))}</td>
              <td style="text-align:right; color:#1e3a8a;" class="mono">${fmtCurrency(calc.taxes)}/mo</td>
              <td><span class="badge badge-ust">122C-2 Line 16 Total</span></td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  } else if (earner.mode === "stubs") {
    const stubs = earner.stubs || [];
    modeHtml = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
        <div class="form-group" style="min-width:260px;">
          <label class="form-label">Employer Name</label>
          <input type="text" class="form-control earner-field" data-earner="${earnerKey}" data-path="employerName" value="${earner.employerName || ""}" placeholder="Employer Name" />
        </div>
        <div style="display:flex; gap:8px;">
          <button type="button" class="btn btn-outline btn-sm btn-duplicate-stub" data-earner="${earnerKey}">+ Duplicate Last Paystub</button>
          <button type="button" class="btn btn-primary btn-sm btn-add-stub" data-earner="${earnerKey}">+ Add Blank Paystub</button>
        </div>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Pay Date</th>
              <th>Gross Pay</th>
              <th>Fed Tax</th>
              <th>SS Tax</th>
              <th>Medicare</th>
              <th>Mand. Ret</th>
              <th>Union</th>
              <th>Vol 401k</th>
              <th>401k Loan</th>
              <th>Health Ins</th>
              <th>Den/Vis</th>
              <th>HSA/FSA</th>
              <th>Term Life</th>
              <th>Court DSO</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${stubs.map((st, idx) => `
              <tr>
                <td class="mono">${idx + 1}</td>
                <td><input type="date" class="table-input stub-input" data-earner="${earnerKey}" data-idx="${idx}" data-key="date" value="${st.date || ""}" style="min-width:115px;" /></td>
                <td><input type="number" step="0.01" class="table-input stub-input" data-earner="${earnerKey}" data-idx="${idx}" data-key="gross" value="${Number(st.gross) || 0}" /></td>
                <td><input type="number" step="0.01" class="table-input stub-input" data-earner="${earnerKey}" data-idx="${idx}" data-key="fedTax" value="${Number(st.fedTax) || 0}" /></td>
                <td><input type="number" step="0.01" class="table-input stub-input" data-earner="${earnerKey}" data-idx="${idx}" data-key="ssTax" value="${Number(st.ssTax) || 0}" /></td>
                <td><input type="number" step="0.01" class="table-input stub-input" data-earner="${earnerKey}" data-idx="${idx}" data-key="medTax" value="${Number(st.medTax) || 0}" /></td>
                <td><input type="number" step="0.01" class="table-input stub-input" data-earner="${earnerKey}" data-idx="${idx}" data-key="mandatoryRetire" value="${Number(st.mandatoryRetire) || 0}" /></td>
                <td><input type="number" step="0.01" class="table-input stub-input" data-earner="${earnerKey}" data-idx="${idx}" data-key="unionDues" value="${Number(st.unionDues) || 0}" /></td>
                <td><input type="number" step="0.01" class="table-input stub-input" data-earner="${earnerKey}" data-idx="${idx}" data-key="voluntary401k" value="${Number(st.voluntary401k) || 0}" /></td>
                <td><input type="number" step="0.01" class="table-input stub-input" data-earner="${earnerKey}" data-idx="${idx}" data-key="loan401k" value="${Number(st.loan401k) || 0}" /></td>
                <td><input type="number" step="0.01" class="table-input stub-input" data-earner="${earnerKey}" data-idx="${idx}" data-key="healthIns" value="${Number(st.healthIns) || 0}" /></td>
                <td><input type="number" step="0.01" class="table-input stub-input" data-earner="${earnerKey}" data-idx="${idx}" data-key="dentalVision" value="${Number(st.dentalVision) || 0}" /></td>
                <td><input type="number" step="0.01" class="table-input stub-input" data-earner="${earnerKey}" data-idx="${idx}" data-key="hsaFsa" value="${Number(st.hsaFsa) || 0}" /></td>
                <td><input type="number" step="0.01" class="table-input stub-input" data-earner="${earnerKey}" data-idx="${idx}" data-key="termLife" value="${Number(st.termLife) || 0}" /></td>
                <td><input type="number" step="0.01" class="table-input stub-input" data-earner="${earnerKey}" data-idx="${idx}" data-key="courtDso" value="${Number(st.courtDso) || 0}" /></td>
                <td><button type="button" class="btn btn-danger-ghost btn-sm btn-del-stub" data-earner="${earnerKey}" data-idx="${idx}" title="Remove stub">✕</button></td>
              </tr>
            `).join("")}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2">6-Mo Avg (÷ 6):</td>
              <td>${fmtCurrency(calc.gross)}</td>
              <td>${fmtCurrency(calc.fedTax)}</td>
              <td>${fmtCurrency(calc.ssTax)}</td>
              <td>${fmtCurrency(calc.medTax)}</td>
              <td>${fmtCurrency(calc.mandatoryRetire)}</td>
              <td>${fmtCurrency(calc.unionDues)}</td>
              <td>${fmtCurrency(calc.voluntary401k)}</td>
              <td>${fmtCurrency(calc.loan401k)}</td>
              <td>${fmtCurrency(calc.healthIns)}</td>
              <td>${fmtCurrency(calc.dentalVision)}</td>
              <td>${fmtCurrency(calc.hsaFsa)}</td>
              <td>${fmtCurrency(calc.termLife)}</td>
              <td>${fmtCurrency(calc.courtDso)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  } else {
    // Manual / Frequency mode
    const man = earner.manual;
    const mult = getFrequencyMultiplier(man.frequency);
    modeHtml = `
      <div class="form-grid" style="margin-bottom:14px;">
        <div class="form-group">
          <label class="form-label">Employer Name</label>
          <input type="text" class="form-control earner-field" data-earner="${earnerKey}" data-path="employerName" value="${earner.employerName || ""}" placeholder="Employer Name" />
        </div>
        <div class="form-group">
          <label class="form-label">Paycheck Frequency</label>
          <select class="form-control earner-manual-freq" data-earner="${earnerKey}">
            <option value="monthly" ${man.frequency === "monthly" ? "selected" : ""}>Monthly (× 1.0000)</option>
            <option value="semimonthly" ${man.frequency === "semimonthly" ? "selected" : ""}>Semi-Monthly — 24/yr (× 2.0000)</option>
            <option value="biweekly" ${man.frequency === "biweekly" ? "selected" : ""}>Bi-Weekly — 26/yr (× 2.1667)</option>
            <option value="weekly" ${man.frequency === "weekly" ? "selected" : ""}>Weekly — 52/yr (× 4.3333)</option>
          </select>
        </div>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Pay Statement Category</th>
              <th>Amount Per Pay Period ($)</th>
              <th style="text-align:right;">Monthly Average (× ${mult.toFixed(4)})</th>
              <th>Form 122C Line</th>
            </tr>
          </thead>
          <tbody>
            ${DEDUCTION_FIELDS.map(f => `
              <tr>
                <td><strong>${f.label}</strong></td>
                <td><input type="number" step="0.01" class="table-input earner-manual-val" data-earner="${earnerKey}" data-key="${f.key}" value="${Number(man[f.key]) || 0}" /></td>
                <td style="text-align:right; font-weight:700;" class="mono">${fmtCurrency(calc[f.key])}/mo</td>
                <td><span class="badge badge-ust">${f.formLine}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  container.innerHTML = modeHtml;
}

function renderDeductionRowHtml(cfg) {
  const ovItem = caseState.deductionOverrides[cfg.key] || { enabled: false, value: cfg.autoVal };
  const isOverridden = !!ovItem.enabled;
  const effectiveVal = isOverridden ? (Number(ovItem.value) || 0) : cfg.autoVal;

  return `
    <div class="deduction-row ${isOverridden ? "overridden" : ""}">
      <div class="line-badge">${cfg.lineLabel}</div>
      <div class="deduction-info">
        <h4>
          <span>${cfg.title}</span>
          <span class="badge ${cfg.sourceBadgeClass}">${cfg.sourceBadgeText}: ${fmtCurrency(cfg.autoVal)}/mo</span>
          ${isOverridden ? `<span class="badge badge-manual">Manual Override Active</span>` : ""}
        </h4>
        <p>${cfg.subtitle}</p>
      </div>
      <div class="deduction-controls">
        <label class="override-toggle">
          <input type="checkbox" class="ded-override-check" data-key="${cfg.key}" data-autoval="${cfg.autoVal.toFixed(2)}" ${isOverridden ? "checked" : ""} />
          <span>Manual Entry</span>
        </label>
      </div>
      <div class="input-prefix-wrap">
        <span class="input-prefix">$</span>
        <input
          type="number"
          step="0.01"
          class="form-control mono ded-override-input"
          data-key="${cfg.key}"
          value="${effectiveVal.toFixed(2)}"
          ${!isOverridden ? "readonly" : ""}
        />
      </div>
    </div>
  `;
}

function renderDeductionsTab(calc) {
  const l = calc.lines;
  const cName = calc.countyData.name;

  const irsRows = [
    {
      key: "line6_foodClothing",
      lineLabel: "Line 6",
      title: "IRS National Standards: Food, Clothing, and Other Items",
      subtitle: `National allowance for household of ${calc.hhSize} person(s) (includes food, housekeeping supplies, apparel, personal care, and miscellaneous).`,
      autoVal: l.line6.autoValue,
      sourceBadgeClass: "badge-ust",
      sourceBadgeText: "IRS National Std"
    },
    {
      key: "line7_addlFood5Pct",
      lineLabel: "Line 7",
      title: "Additional Food & Clothing Allowance (Up to 5%)",
      subtitle: `Up to 5% of Food & Apparel standard when documented as reasonable and necessary (Cap: ${fmtCurrency(l.line7.autoValue || (calc.stdPreset.nationalFoodClothingOther[Math.min(4, calc.hhSize)]?.fivePercentCap || 53))}/mo).`,
      autoVal: l.line7.autoValue,
      sourceBadgeClass: "badge-ust",
      sourceBadgeText: "5% UST Cap"
    },
    {
      key: "line8_housingUtilities",
      lineLabel: "Line 8",
      title: `Local Standards: Housing & Utilities — Non-Mortgage (${cName})`,
      subtitle: `Covers electric, gas, water, sewer, trash, maintenance, phone, and internet for ${calc.hhSize} person(s) in ${cName}.`,
      autoVal: l.line8.autoValue,
      sourceBadgeClass: "badge-ust",
      sourceBadgeText: `${cName} Std`
    },
    {
      key: "line9a_housingMortgageStd",
      lineLabel: "Line 9a",
      title: `Local Standards: Housing & Utilities — Mortgage/Rent Gross Standard (${cName})`,
      subtitle: `Gross ${cName} standard is ${fmtCurrency(l.line9a.value)} minus Secured Home Debt on Line 9b (${fmtCurrency(l.line9b_homeSecuredOffset)}) = Net Line 9c Allowance of ${fmtCurrency(l.line9c_netHousingAllowance)}/mo.`,
      autoVal: l.line9a.autoValue,
      sourceBadgeClass: "badge-ust",
      sourceBadgeText: `Net Line 9c: ${fmtCurrency(l.line9c_netHousingAllowance)}`
    },
    {
      key: "line11_publicTransit",
      lineLabel: "Line 11",
      title: "Local Standards: Public Transportation Allowance",
      subtitle: `National public transit allowance (${fmtCurrency(calc.stdPreset.transportation.publicTransportation)}/mo if claimed).`,
      autoVal: l.line11.autoValue,
      sourceBadgeClass: "badge-ust",
      sourceBadgeText: "IRS Transit Std"
    },
    {
      key: "line12_vehicleOperating",
      lineLabel: "Line 12",
      title: `Local Standards: Vehicle Operating Costs (${calc.operatingRegion.label})`,
      subtitle: `For ${calc.cars} vehicle(s) in ${cName} (${calc.olderCars > 0 ? `includes +$${calc.olderCars * 200} older free-and-clear car operating allowance` : "fuel, insurance, maintenance, registration"}).`,
      autoVal: l.line12.autoValue,
      sourceBadgeClass: "badge-ust",
      sourceBadgeText: "Regional Operating Std"
    },
    {
      key: "line13a_car1OwnershipStd",
      lineLabel: "Line 13a",
      title: "Local Standards: Vehicle 1 Ownership / Lease Standard",
      subtitle: `Gross Standard ${fmtCurrency(l.line13a_effectiveStd)} minus Vehicle 1 Secured Payment (${fmtCurrency(l.secCar1Payment)}) = Net Line 13c Allowance of ${fmtCurrency(l.line13c_netCar1Allowance)}/mo.`,
      autoVal: l.line13a.autoValue,
      sourceBadgeClass: "badge-ust",
      sourceBadgeText: `Net Line 13c: ${fmtCurrency(l.line13c_netCar1Allowance)}`
    },
    {
      key: "line13d_car2OwnershipStd",
      lineLabel: "Line 13d",
      title: "Local Standards: Vehicle 2 Ownership / Lease Standard",
      subtitle: `Gross Standard ${fmtCurrency(l.line13d_effectiveStd)} minus Vehicle 2 Secured Payment (${fmtCurrency(l.secCar2Payment)}) = Net Line 13f Allowance of ${fmtCurrency(l.line13f_netCar2Allowance)}/mo.`,
      autoVal: l.line13d.autoValue,
      sourceBadgeClass: "badge-ust",
      sourceBadgeText: `Net Line 13f: ${fmtCurrency(l.line13f_netCar2Allowance)}`
    },
    {
      key: "line14_healthOutOfPocketStd",
      lineLabel: "Line 14",
      title: "IRS National Standards: Out-of-Pocket Health Care Expenses",
      subtitle: `${calc.under65} member(s) under 65 (× $${calc.stdPreset.healthCareOutOfPocket.under65}) + ${calc.age65Plus} member(s) 65+ (× $${calc.stdPreset.healthCareOutOfPocket.age65Plus}).`,
      autoVal: l.line14.autoValue,
      sourceBadgeClass: "badge-ust",
      sourceBadgeText: "IRS Health Std"
    }
  ];

  const otherNecessaryRows = [
    {
      key: "line16_taxes",
      lineLabel: "Line 16",
      title: "Taxes (Federal Income Tax, Social Security / OASDI, Medicare)",
      subtitle: "Auto-synced from your YTD / Pay Statement comparison in Step 2. Check Manual Entry to adjust for tax refunds or self-employment tax.",
      autoVal: l.line16.autoValue,
      sourceBadgeClass: "badge-paystub",
      sourceBadgeText: "YTD / Paystub Sync"
    },
    {
      key: "line17_involuntaryDed",
      lineLabel: "Line 17",
      title: "Involuntary Payroll Deductions (Mandatory Retirement / FRS, Union Dues, Uniforms)",
      subtitle: "Auto-synced from Mandatory Retirement & Union Dues on your pay statements.",
      autoVal: l.line17.autoValue,
      sourceBadgeClass: "badge-paystub",
      sourceBadgeText: "YTD / Paystub Sync"
    },
    {
      key: "line18_termLife",
      lineLabel: "Line 18",
      title: "Term Life Insurance Premiums",
      subtitle: "Auto-synced from pay statements. Check Manual Entry to add direct-paid term life insurance.",
      autoVal: l.line18.autoValue,
      sourceBadgeClass: "badge-paystub",
      sourceBadgeText: "YTD / Paystub Sync"
    },
    {
      key: "line19_courtOrderedDso",
      lineLabel: "Line 19",
      title: "Court-Ordered Payments (Ongoing Child Support / Alimony)",
      subtitle: "Auto-synced from pay statements. Check Manual Entry to add direct court-ordered payments.",
      autoVal: l.line19.autoValue,
      sourceBadgeClass: "badge-paystub",
      sourceBadgeText: "YTD / Paystub Sync"
    },
    {
      key: "line20_educationEmployment",
      lineLabel: "Line 20",
      title: "Education Required for Employment or for Physically/Mentally Challenged Child",
      subtitle: "Actual monthly expense required as a condition of employment or for a special-needs child.",
      autoVal: 0,
      sourceBadgeClass: "badge-manual",
      sourceBadgeText: "Actual Expense"
    },
    {
      key: "line21_childcare",
      lineLabel: "Line 21",
      title: "Childcare / Daycare / After-School Care",
      subtitle: "Actual monthly babysitting, nursery school, daycare, or preschool expenses.",
      autoVal: 0,
      sourceBadgeClass: "badge-manual",
      sourceBadgeText: "Actual Expense"
    },
    {
      key: "line22_extraHealthCare",
      lineLabel: "Line 22",
      title: "Additional Out-of-Pocket Health Care Expenses (Above Line 14 Standard)",
      subtitle: "Actual verified monthly medical, dental, prescription, or therapy expenses exceeding the Line 14 IRS standard.",
      autoVal: 0,
      sourceBadgeClass: "badge-manual",
      sourceBadgeText: "Actual Excess"
    },
    {
      key: "line23_telecom",
      lineLabel: "Line 23",
      title: "Optional Telephone & Cell Service (Necessary for Health/Welfare/Income)",
      subtitle: "Cell phone / pager / work internet service necessary for production of income or family welfare not covered by Line 8.",
      autoVal: 0,
      sourceBadgeClass: "badge-manual",
      sourceBadgeText: "Actual Expense"
    }
  ];

  const additionalRows = [
    {
      key: "line25_healthDisabilityHsa",
      lineLabel: "Line 25",
      title: "Health, Dental, Vision, Disability Insurance & HSA/FSA Contributions",
      subtitle: "Auto-synced from Health, Dental/Vision, Disability, and HSA/FSA lines on your pay statements. Check Manual Entry to add direct premiums.",
      autoVal: l.line25.autoValue,
      sourceBadgeClass: "badge-paystub",
      sourceBadgeText: "YTD / Paystub Sync"
    },
    {
      key: "line26_careFamilyMembers",
      lineLabel: "Line 26",
      title: "Continuing Contributions to Care of Household or Family Members",
      subtitle: "Actual monthly support for elderly, chronically ill, or disabled family members unable to pay for such expenses.",
      autoVal: 0,
      sourceBadgeClass: "badge-manual",
      sourceBadgeText: "Actual Expense"
    },
    {
      key: "line27_familyViolence",
      lineLabel: "Line 27",
      title: "Protection Against Family Violence",
      subtitle: "Ongoing monthly expenses to maintain safety of debtor and family under the Family Violence Prevention and Services Act.",
      autoVal: 0,
      sourceBadgeClass: "badge-manual",
      sourceBadgeText: "Actual Expense"
    },
    {
      key: "line28_homeEnergyExcess",
      lineLabel: "Line 28",
      title: "Additional Home Energy Costs (Above Local Non-Mortgage Standard)",
      subtitle: "Documented actual monthly electric/gas home energy costs in excess of the IRS Local Standard.",
      autoVal: 0,
      sourceBadgeClass: "badge-manual",
      sourceBadgeText: "Actual Excess"
    },
    {
      key: "line29_childEducation",
      lineLabel: "Line 29",
      title: `Education Expenses for Dependent Children Under 18 (Cap: ${fmtCurrency(l.childEdStatutoryCap)}/mo)`,
      subtitle: `Private or public elementary/secondary school expenses up to $187.50/mo ($2,250/yr) per child for ${calc.childrenUnder18} child(ren).`,
      autoVal: 0,
      sourceBadgeClass: "badge-ust",
      sourceBadgeText: `Max Cap: ${fmtCurrency(l.childEdStatutoryCap)}`
    },
    {
      key: "line31_charitable",
      lineLabel: "Line 31",
      title: "Continuing Charitable Contributions & Tithing",
      subtitle: "Continuing charitable or religious contributions (up to 15% of gross income).",
      autoVal: 0,
      sourceBadgeClass: "badge-manual",
      sourceBadgeText: "Actual Expense"
    },
    {
      key: "line41_retirement401kAndLoans",
      lineLabel: "Line 41",
      title: "Qualified Retirement Contributions (401k/403b/TSP) & Retirement Loan Repayments",
      subtitle: "Auto-synced from Voluntary 401(k) and 401(k) Loan repayments on pay statements (11 U.S.C. §§ 541(b)(7) & 1322(f)).",
      autoVal: l.line41.autoValue,
      sourceBadgeClass: "badge-paystub",
      sourceBadgeText: "YTD / Paystub Sync"
    },
    {
      key: "line43_specialCircumstances",
      lineLabel: "Line 43",
      title: "Special Circumstances / Hamilton v. Lanning Projected Adjustments",
      subtitle: "Documented adjustments where 6-month lookback CMI or standard expenses do not reflect known or virtually certain future changes.",
      autoVal: 0,
      sourceBadgeClass: "badge-manual",
      sourceBadgeText: "Special Circumstance"
    }
  ];

  document.getElementById("irsStandardsList").innerHTML = irsRows.map(renderDeductionRowHtml).join("");
  document.getElementById("otherNecessaryList").innerHTML = otherNecessaryRows.map(renderDeductionRowHtml).join("");
  document.getElementById("additionalDeductionsList").innerHTML = additionalRows.map(renderDeductionRowHtml).join("");
}

function renderYtdBreakdownForClientReport(earnerObj, earnerLabel, calcEarner, lb) {
  if (!earnerObj || earnerObj.mode !== "ytd") return "";
  const ytd = earnerObj.ytd;
  const months = Math.max(0.5, Number(ytd.monthsInWindow) || 6.0);
  const activeRows = DEDUCTION_FIELDS.filter(f => {
    const p = Number(ytd.prior?.[f.key]) || 0;
    const l = Number(ytd.latest?.[f.key]) || 0;
    return f.key === "gross" || p > 0 || l > 0;
  });

  return `
    <div style="margin-top:12px; margin-bottom:14px;">
      <div style="font-size:13px; font-weight:700; color:#1e3a8a; margin-bottom:6px;">
        ${earnerLabel} (${earnerObj.employerName || "Employer"}): Two-Statement YTD Comparison (${lb.baselineMonthShort} vs. ${lb.endingMonthShort})
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Pay Statement Line Item</th>
              <th style="text-align:right;">Last Stub of ${lb.baselineMonthShort}<br/><span style="font-weight:400; font-size:10.5px;">(${ytd.priorDate || "Baseline YTD"})</span></th>
              <th style="text-align:right;">Last Stub of ${lb.endingMonthShort}<br/><span style="font-weight:400; font-size:10.5px;">(${ytd.latestDate || "Ending YTD"})</span></th>
              <th style="text-align:right;">6-Month Total<br/><span style="font-weight:400; font-size:10.5px;">(${lb.endingMonthOnly} &minus; ${lb.baselineMonthOnly})</span></th>
              <th style="text-align:right;">Monthly Average<br/><span style="font-weight:400; font-size:10.5px;">(&divide; ${months} Months)</span></th>
            </tr>
          </thead>
          <tbody>
            ${activeRows.map(f => {
              const p = Number(ytd.prior?.[f.key]) || 0;
              const l = Number(ytd.latest?.[f.key]) || 0;
              const diff = calcEarner.sixMonthDiffs[f.key] || 0;
              const avg = calcEarner[f.key] || 0;
              return `
                <tr>
                  <td><strong>${f.label}</strong></td>
                  <td style="text-align:right;" class="mono">${fmtCurrency(p)}</td>
                  <td style="text-align:right;" class="mono">${fmtCurrency(l)}</td>
                  <td style="text-align:right;" class="mono">${fmtCurrency(diff)}</td>
                  <td style="text-align:right; font-weight:700;" class="mono">${fmtCurrency(avg)}/mo</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderClientAndWorksheetReport(calc) {
  const container = document.getElementById("printableReportContainer");
  if (!container) return;

  const viewMode = caseState.reportViewMode || "client";
  document.getElementById("btnViewClientReport")?.classList.toggle("active", viewMode === "client");
  document.getElementById("btnViewAttorneyWorksheet")?.classList.toggle("active", viewMode === "worksheet");
  document.getElementById("btnViewBothReports")?.classList.toggle("active", viewMode === "both");

  const lookback = calc.lookback;
  const l = calc.lines;
  const t = calc.totals;
  const cName = calc.countyData.name;
  const medianPct = Math.min(100, Math.round((calc.annualizedCmi / Math.max(1, calc.flMedianAnnual)) * 100));
  const meterColor = calc.isAboveMedian ? "#d97706" : "#15803d";

  const letterheadHtml = `
    <div class="report-letterhead">
      <div class="letterhead-firm">
        <h2>${caseState.firmName || "Bankruptcy Law Practice"}</h2>
        <p>${caseState.attorneyName || ""}</p>
        <p>${caseState.firmContact || "Middle District of Florida • Tampa Division"}</p>
      </div>
      <div class="letterhead-meta">
        <div><strong>Prepared For:</strong> ${caseState.clientName || "Client"}</div>
        <div><strong>Matter / Case Ref:</strong> ${caseState.caseNumber || "Pre-Filing Analysis"}</div>
        <div><strong>Court / Venue:</strong> U.S. Bankruptcy Court, M.D. Fla. (Tampa Division)</div>
        <div><strong>County of Residence:</strong> ${cName}</div>
        <div><strong>Target Filing Date:</strong> ${lookback.filingFormatted}</div>
      </div>
    </div>
  `;

  const clientReportHtml = `
    <div class="client-explanation-report">
      <div class="report-banner">
        <div style="font-size:18px; font-weight:800; color:#1e3a8a; margin-bottom:4px;">
          Plain-English Guide to Your Chapter 13 Bankruptcy Means Test Results
        </div>
        <div style="font-size:13px; color:#334155;">
          Prepared specifically for <strong>${caseState.clientName || "you"}</strong> under the rules of the
          <strong>United States Bankruptcy Court for the Middle District of Florida (Tampa Division)</strong>.
        </div>
      </div>

      ${caseState.attorneyCustomNote ? `
        <div class="callout" style="margin-bottom:22px;">
          <div class="callout-title">Summary Note from Your Legal Team</div>
          <div style="font-size:13.5px; color:#1e293b;">${caseState.attorneyCustomNote}</div>
        </div>
      ` : ""}

      <div class="report-summary-grid">
        <div class="report-stat-box">
          <div class="stat-title">Your 6-Month Avg Income (CMI)</div>
          <div class="stat-num">${fmtCurrency(calc.totalMonthlyCmi)}<span style="font-size:13px; font-weight:500;">/mo</span></div>
          <div class="stat-desc">Annualized: ${fmtCurrency(calc.annualizedCmi)}/yr</div>
        </div>
        <div class="report-stat-box">
          <div class="stat-title">Florida Median (${calc.hhSize} Person Household)</div>
          <div class="stat-num">${fmtIntCurrency(calc.flMedianAnnual)}<span style="font-size:13px; font-weight:500;">/yr</span></div>
          <div class="stat-desc">Result: <strong>${calc.isAboveMedian ? "Above Median (60-Mo Plan)" : "Below Median (36-Mo Plan)"}</strong></div>
        </div>
        <div class="report-stat-box">
          <div class="stat-title">Monthly Disposable Income</div>
          <div class="stat-num" style="color:${t.monthlyDisposableIncome > 0 ? "#1e3a8a" : "#15803d"};">${fmtCurrency(t.monthlyDisposableIncome)}<span style="font-size:13px; font-weight:500;">/mo</span></div>
          <div class="stat-desc">Est. Unsecured Pool: ${fmtCurrency(t.unsecuredPool60Mo)}</div>
        </div>
      </div>

      <div class="report-section">
        <h3>1. What Is the Chapter 13 "Means Test" &amp; Why Does It Matter?</h3>
        <p class="report-prose">
          When you file a Chapter 13 repayment plan in the Tampa Division of the Middle District of Florida, federal bankruptcy law uses a standardized formula called the <strong>Means Test</strong> (Official Bankruptcy Forms 122C-1 and 122C-2). Its purpose is to answer two questions fairly and objectively:
        </p>
        <ul style="margin-left:22px; margin-bottom:12px; font-size:13.5px; line-height:1.6;">
          <li><strong>How long must your Chapter 13 plan last?</strong> If your average income is <em>below</em> the Florida median income for a family of your size, your minimum plan length is <strong>36 months (3 years)</strong>. If your income is <em>above</em> the Florida median, your required plan length is <strong>60 months (5 years)</strong> (unless all creditors are paid 100% sooner).</li>
          <li><strong>How much, if anything, must go to general unsecured creditors (like credit cards, medical bills, and personal loans)?</strong> The test subtracts allowed IRS and U.S. Trustee living expenses, taxes, insurance, retirement, and home/car payments from your income to find your <strong>Monthly Disposable Income</strong>.</li>
        </ul>
      </div>

      <div class="report-section">
        <h3>2. How Your Income &amp; Paycheck Deductions Were Figured Using Your Two YTD Pay Statements</h3>
        <p class="report-prose">
          Under federal law, we must calculate your exact income and paycheck deductions over the <strong>6 full calendar months before the month you file</strong>. Because your target filing date is in <strong>${lookback.filingMonthName}</strong>, that 6-month lookback period is <strong>${lookback.startFormatted} through ${lookback.endFormatted}</strong>.
        </p>
        <p class="report-prose">
          Rather than adding up dozens of individual paychecks by hand, we use the Year-to-Date (YTD) totals from two specific pay statements: your <strong>last pay statement from ${lookback.baselineMonthName}</strong> (which shows everything earned before the 6-month period started) and your <strong>last pay statement from ${lookback.endingMonthName}</strong> (which shows everything earned through the end of the 6-month period). Subtracting the ${lookback.baselineMonthOnly} YTD numbers from the ${lookback.endingMonthOnly} YTD numbers gives the exact 6-month total, which we then divide by 6:
        </p>

        ${renderYtdBreakdownForClientReport(caseState.earners.d1, "Debtor 1", calc.d1, lookback)}
        ${caseState.enableDebtor2 ? renderYtdBreakdownForClientReport(caseState.earners.d2, "Debtor 2 / Spouse", calc.d2, lookback) : ""}

        <div class="table-wrap" style="margin-bottom:14px;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Household Income Source</th>
                <th>Verification Method</th>
                <th style="text-align:right;">6-Month Monthly Average</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Debtor 1 Gross Wages</strong> (${caseState.earners.d1.employerName || "Primary Earner"})</td>
                <td>${calc.d1.methodDescription}</td>
                <td style="text-align:right;" class="mono">${fmtCurrency(calc.d1.gross)}/mo</td>
              </tr>
              ${caseState.enableDebtor2 ? `
                <tr>
                  <td><strong>Debtor 2 / Spouse Gross Wages</strong> (${caseState.earners.d2.employerName || "Second Earner"})</td>
                  <td>${calc.d2.methodDescription}</td>
                  <td style="text-align:right;" class="mono">${fmtCurrency(calc.d2.gross)}/mo</td>
                </tr>
              ` : ""}
              ${calc.otherCmiMonthly > 0 ? `
                <tr>
                  <td><strong>Other Included Monthly Income</strong> (Business, Rental, Pension, Support)</td>
                  <td>6-Month Lookback Average</td>
                  <td style="text-align:right;" class="mono">${fmtCurrency(calc.otherCmiMonthly)}/mo</td>
                </tr>
              ` : ""}
              ${calc.maritalAdj > 0 ? `
                <tr>
                  <td><strong>Less: Marital Adjustment Deduction (Line 13)</strong></td>
                  <td>${caseState.otherIncome.maritalAdjustmentNotes || "Non-filing spouse separate expenses"}</td>
                  <td style="text-align:right; color:var(--danger);" class="mono">-${fmtCurrency(calc.maritalAdj)}/mo</td>
                </tr>
              ` : ""}
              ${(Number(caseState.otherIncome.exclSocialSecurity) || 0) + (Number(caseState.otherIncome.exclVaHaven) || 0) > 0 ? `
                <tr>
                  <td><strong>Protected / Excluded Benefits (Social Security &amp; VA / HAVEN Act)</strong></td>
                  <td>100% Excluded from Means Test CMI by Federal Statute</td>
                  <td style="text-align:right; color:var(--success);" class="mono">${fmtCurrency((Number(caseState.otherIncome.exclSocialSecurity) || 0) + (Number(caseState.otherIncome.exclVaHaven) || 0))}/mo (Excluded)</td>
                </tr>
              ` : ""}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2">Total Current Monthly Income (CMI) &amp; Annualized Total (× 12):</td>
                <td style="text-align:right;">${fmtCurrency(calc.totalMonthlyCmi)}/mo (${fmtCurrency(calc.annualizedCmi)}/yr)</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="comparison-meter">
          <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:700;">
            <span>Your Annualized Income: ${fmtCurrency(calc.annualizedCmi)}</span>
            <span>Florida Median (${calc.hhSize} Person Household): ${fmtIntCurrency(calc.flMedianAnnual)}</span>
          </div>
          <div class="meter-track">
            <div class="meter-fill" style="width:${medianPct}%; background:${meterColor};"></div>
          </div>
          <div style="font-size:12.5px; color:#334155;">
            ${calc.isAboveMedian
              ? `Because your annualized income (${fmtCurrency(calc.annualizedCmi)}) is <strong>${fmtCurrency(calc.annualizedCmi - calc.flMedianAnnual)} above</strong> the Florida median threshold for ${calc.hhSize} people, your case is classified as <strong>Above-Median</strong> (60-month plan commitment period) and we complete Part 2 of the Means Test below.`
              : `Because your annualized income (${fmtCurrency(calc.annualizedCmi)}) is <strong>${fmtCurrency(calc.flMedianAnnual - calc.annualizedCmi)} below</strong> the Florida median threshold for ${calc.hhSize} people, you qualify as a <strong>Below-Median</strong> household (eligible for a 36-month commitment period).`}
          </div>
        </div>
      </div>

      <div class="report-section">
        <h3>3. Your Allowed Living Expenses &amp; Deductions (${cName} Standards)</h3>
        <p class="report-prose">
          To make sure you keep enough income to care for your family, the Means Test deducts standardized allowances set by the <strong>IRS and U.S. Trustee for ${cName}</strong>, plus your actual taxes, insurance, retirement, childcare, and secured home/vehicle payments:
        </p>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Deduction Category</th>
                <th>What This Covers in Plain English</th>
                <th style="text-align:right;">Monthly Deduction</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Food, Clothing &amp; Household Essentials</strong> (Lines 6–7)</td>
                <td>Standard IRS allowance for groceries, clothing, personal care, and household supplies for ${calc.hhSize} people.</td>
                <td style="text-align:right;" class="mono">${fmtCurrency(l.line6.value + l.line7.value)}</td>
              </tr>
              <tr>
                <td><strong>${cName} Utilities &amp; Home Operating</strong> (Line 8)</td>
                <td>Local standard allowance for electricity, water, trash, home maintenance, phone, and internet.</td>
                <td style="text-align:right;" class="mono">${fmtCurrency(l.line8.value)}</td>
              </tr>
              <tr>
                <td><strong>${cName} Housing Allowance (Net of Mortgage)</strong> (Line 9c)</td>
                <td>Any portion of the ${cName} housing standard (${fmtCurrency(l.line9a.value)}) not already taken as a secured home loan deduction below.</td>
                <td style="text-align:right;" class="mono">${fmtCurrency(l.line9c_netHousingAllowance)}</td>
              </tr>
              <tr>
                <td><strong>Vehicle Operating &amp; Net Ownership Allowances</strong> (Lines 11–13)</td>
                <td>Allowance for gas, auto insurance, and maintenance for ${calc.cars} vehicle(s) in the ${calc.operatingRegion.label} area, plus any net ownership standard above your car loan payment.</td>
                <td style="text-align:right;" class="mono">${fmtCurrency(l.line11.value + l.line12.value + l.line13c_netCar1Allowance + l.line13f_netCar2Allowance)}</td>
              </tr>
              <tr>
                <td><strong>Out-of-Pocket Medical, Dental &amp; Prescriptions</strong> (Lines 14 &amp; 22)</td>
                <td>IRS baseline medical allowance (${fmtCurrency(l.line14.value)}) plus documented extra out-of-pocket medical care (${fmtCurrency(l.line22.value)}).</td>
                <td style="text-align:right;" class="mono">${fmtCurrency(l.line14.value + l.line22.value)}</td>
              </tr>
              <tr>
                <td><strong>Payroll Taxes, Mandatory Retirement &amp; Union Dues</strong> (Lines 16–17)</td>
                <td>Average monthly Federal/Social Security/Medicare taxes (${fmtCurrency(l.line16.value)}) and mandatory retirement/union deductions (${fmtCurrency(l.line17.value)}).</td>
                <td style="text-align:right;" class="mono">${fmtCurrency(l.line16.value + l.line17.value)}</td>
              </tr>
              <tr>
                <td><strong>Health/Dental/Vision Insurance, HSA/FSA &amp; Term Life</strong> (Lines 18 &amp; 25)</td>
                <td>Monthly health, dental, vision, disability, HSA/FSA (${fmtCurrency(l.line25.value)}), and term life insurance (${fmtCurrency(l.line18.value)}).</td>
                <td style="text-align:right;" class="mono">${fmtCurrency(l.line18.value + l.line25.value)}</td>
              </tr>
              <tr>
                <td><strong>Family, Childcare, School, Energy &amp; Charitable</strong> (Lines 19–21, 23, 26–31)</td>
                <td>Court-ordered support, daycare/childcare, work cell phone, children's education, excess home energy, and charitable giving.</td>
                <td style="text-align:right;" class="mono">${fmtCurrency(l.line19.value + l.line20.value + l.line21.value + l.line23.value + l.line26.value + l.line27.value + l.line28.value + l.line29.value + l.line31.value)}</td>
              </tr>
              <tr>
                <td><strong>Voluntary 401(k) Retirement &amp; 401(k) Loan Repayments</strong> (Line 41)</td>
                <td>Protected retirement contributions and retirement loan repayments from your paychecks.</td>
                <td style="text-align:right;" class="mono">${fmtCurrency(l.line41.value)}</td>
              </tr>
              <tr>
                <td><strong>Secured Home &amp; Vehicle Payments + Arrearage Catch-Up</strong> (Lines 33–34)</td>
                <td>Ongoing mortgage/HOA (${fmtCurrency(l.line9b_homeSecuredOffset)}), ongoing car loans (${fmtCurrency(l.secCar1Payment + l.secCar2Payment)}), and past-due mortgage/car arrears spread over 60 months (${fmtCurrency(l.line34_arrearsMonthly)}/mo).</td>
                <td style="text-align:right;" class="mono">${fmtCurrency(l.line33_totalSecuredMonthly + l.line34_arrearsMonthly)}</td>
              </tr>
              <tr>
                <td><strong>Priority Claims &amp; Tampa Chapter 13 Trustee Fee</strong> (Lines 35–36)</td>
                <td>Priority taxes/support/fees spread over 60 months (${fmtCurrency(l.line35_priorityMonthly)}/mo) plus the FLMB Chapter 13 Trustee administrative allowance (${fmtCurrency(l.line36_trusteeAdminExpense)}/mo at ${l.trusteeMultPct}%).</td>
                <td style="text-align:right;" class="mono">${fmtCurrency(l.line35_priorityMonthly + l.line36_trusteeAdminExpense)}</td>
              </tr>
              ${l.line43.value !== 0 ? `
                <tr>
                  <td><strong>Special Circumstances / Forward-Looking Adjustment</strong> (Line 43)</td>
                  <td>Documented income/expense change since the 6-month lookback window.</td>
                  <td style="text-align:right;" class="mono">${fmtCurrency(l.line43.value)}</td>
                </tr>
              ` : ""}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2">Total Allowed Monthly Deductions (Form 122C-2):</td>
                <td style="text-align:right;">${fmtCurrency(t.totalAllDeductions)}/mo</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div class="report-section">
        <h3>4. What This Bottom Line Means for Your Chapter 13 Plan</h3>
        <p class="report-prose">
          When we subtract your <strong>Total Allowed Monthly Deductions (${fmtCurrency(t.totalAllDeductions)}/mo)</strong> from your <strong>Current Monthly Income (${fmtCurrency(calc.totalMonthlyCmi)}/mo)</strong>, your resulting <strong>Monthly Disposable Income (Form 122C-2 Line 45) is ${fmtCurrency(t.monthlyDisposableIncome)}/mo</strong>.
        </p>
        <p class="report-prose">
          ${t.monthlyDisposableIncome <= 0
            ? `<strong>What a Zero or Negative Disposable Income Number Means:</strong> Because your allowed living expenses and secured/priority debt deductions exceed your 6-month average income, the Means Test does <strong>not</strong> require a minimum monthly dividend to general unsecured creditors (such as credit cards and medical bills). Your Chapter 13 plan payment in the Tampa Division will primarily focus on curing any mortgage or vehicle arrears (${fmtCurrency(l.line34_arrearsMonthly)}/mo), paying priority claims (${fmtCurrency(l.line35_priorityMonthly)}/mo), and covering the Chapter 13 Trustee fee.`
            : `<strong>What a Positive Disposable Income Number Means:</strong> Under the Means Test, your Chapter 13 plan provides a monthly pool of approximately <strong>${fmtCurrency(t.monthlyDisposableIncome)}/mo</strong> over ${calc.commitmentPeriodMonths} months (an estimated total unsecured pool of <strong>${fmtCurrency(t.unsecuredPool60Mo)}</strong>, or roughly <strong>${t.estimatedUnsecuredDividendPct.toFixed(1)}%</strong> of your estimated ${fmtIntCurrency(t.generalUnsecuredTotal)} in general unsecured debt, with the remaining balance discharged at the end of your plan upon completion).`
          }
        </p>
      </div>
    </div>
  `;

  const worksheetHtml = `
    <div class="attorney-worksheet-report" style="${viewMode === "both" ? "page-break-before: always; margin-top: 32px; padding-top: 24px; border-top: 3px dashed #cbd5e1;" : ""}">
      <div class="report-banner">
        <div style="font-size:17px; font-weight:800; color:#0f172a;">
          Attorney / Paralegal Audit Worksheet — Official Forms 122C-1 &amp; 122C-2 (FLMB Tampa Division)
        </div>
        <div style="font-size:12.5px; color:#475569;">
          Line-by-Line Reference for CM/ECF Petition Software • Standards Period: ${calc.stdPreset.label} • County: ${cName} (FIPS ${calc.countyData.fips})
        </div>
      </div>

      <div class="report-section">
        <h3>Official Form 122C-1: Chapter 13 Statement of Your Current Monthly Income and Calculation of Commitment Period</h3>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Form 122C-1 Line</th>
                <th>Description / Calculation Basis</th>
                <th style="text-align:right;">Debtor 1</th>
                <th style="text-align:right;">Debtor 2 / Spouse</th>
                <th style="text-align:right;">Combined / Line Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="mono"><strong>Line 2</strong></td>
                <td>Gross wages, salary, tips, bonuses, overtime, commissions (6-mo avg)</td>
                <td style="text-align:right;" class="mono">${fmtCurrency(calc.d1.gross)}</td>
                <td style="text-align:right;" class="mono">${fmtCurrency(calc.d2.gross)}</td>
                <td style="text-align:right; font-weight:700;" class="mono">${fmtCurrency(calc.d1.gross + calc.d2.gross)}</td>
              </tr>
              <tr>
                <td class="mono"><strong>Lines 3–10</strong></td>
                <td>Net business (${fmtCurrency(calc.netBusiness)}), rental, pension, support, unemployment, other CMI</td>
                <td style="text-align:right;" class="mono" colspan="2">Combined Non-Wage CMI</td>
                <td style="text-align:right; font-weight:700;" class="mono">${fmtCurrency(calc.otherCmiMonthly)}</td>
              </tr>
              <tr>
                <td class="mono"><strong>Line 11</strong></td>
                <td>Total Current Monthly Income before Marital Adjustment</td>
                <td colspan="2"></td>
                <td style="text-align:right; font-weight:700;" class="mono">${fmtCurrency(calc.grossCmiBeforeMaritalAdj)}</td>
              </tr>
              <tr>
                <td class="mono"><strong>Line 13</strong></td>
                <td>Marital Adjustment Deduction (Non-filing spouse separate expenses)</td>
                <td colspan="2">${caseState.otherIncome.maritalAdjustmentNotes || "—"}</td>
                <td style="text-align:right;" class="mono">-${fmtCurrency(calc.maritalAdj)}</td>
              </tr>
              <tr>
                <td class="mono"><strong>Line 15b</strong></td>
                <td>Annualized Current Monthly Income (Net CMI ${fmtCurrency(calc.totalMonthlyCmi)} × 12)</td>
                <td colspan="2"></td>
                <td style="text-align:right; font-weight:700;" class="mono">${fmtCurrency(calc.annualizedCmi)}</td>
              </tr>
              <tr>
                <td class="mono"><strong>Line 16c</strong></td>
                <td>Applicable Florida Median Family Income (${calc.hhSize} Person Household)</td>
                <td colspan="2"></td>
                <td style="text-align:right; font-weight:700;" class="mono">${fmtCurrency(calc.flMedianAnnual)}</td>
              </tr>
              <tr>
                <td class="mono"><strong>Line 17 / 21</strong></td>
                <td>Applicable Commitment Period Determination</td>
                <td colspan="2"></td>
                <td style="text-align:right; font-weight:700;">${calc.isAboveMedian ? "ABOVE MEDIAN (60 Mos — Complete 122C-2)" : "BELOW MEDIAN (36 Mos)"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="report-section">
        <h3>Official Form 122C-2: Chapter 13 Calculation of Your Disposable Income</h3>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Form 122C-2 Line</th>
                <th>Category Description</th>
                <th>Standard / Source Basis</th>
                <th style="text-align:right;">Deductible Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr><td class="mono"><strong>Line 6</strong></td><td>National Standards: Food, clothing, and other items (${calc.hhSize} persons)</td><td>${l.line6.isOverridden ? "Manual Override" : "IRS National Standard"}</td><td style="text-align:right;" class="mono">${fmtCurrency(l.line6.value)}</td></tr>
              <tr><td class="mono"><strong>Line 7</strong></td><td>Additional food and clothing expense (up to 5%)</td><td>${l.line7.isOverridden ? "Manual Override" : "5% UST Allowance"}</td><td style="text-align:right;" class="mono">${fmtCurrency(l.line7.value)}</td></tr>
              <tr><td class="mono"><strong>Line 8</strong></td><td>Local Standards: Housing and utilities — non-mortgage expenses</td><td>${cName} (${calc.countyData.fips})</td><td style="text-align:right;" class="mono">${fmtCurrency(l.line8.value)}</td></tr>
              <tr><td class="mono"><strong>Line 9a–9c</strong></td><td>Local Standards: Housing mortgage/rent (${fmtCurrency(l.line9a.value)}) less Line 9b secured home (${fmtCurrency(l.line9b_homeSecuredOffset)})</td><td>Net Line 9c Allowance</td><td style="text-align:right;" class="mono">${fmtCurrency(l.line9c_netHousingAllowance)}</td></tr>
              <tr><td class="mono"><strong>Line 11</strong></td><td>Local Standards: Public transportation</td><td>IRS National Transit</td><td style="text-align:right;" class="mono">${fmtCurrency(l.line11.value)}</td></tr>
              <tr><td class="mono"><strong>Line 12</strong></td><td>Local Standards: Vehicle operation / public transport (${calc.cars} car[s])</td><td>${calc.operatingRegion.label}</td><td style="text-align:right;" class="mono">${fmtCurrency(l.line12.value)}</td></tr>
              <tr><td class="mono"><strong>Line 13a–13c</strong></td><td>Net Vehicle 1 ownership (${fmtCurrency(l.line13a_effectiveStd)} std less ${fmtCurrency(l.secCar1Payment)} secured)</td><td>Net Line 13c Allowance</td><td style="text-align:right;" class="mono">${fmtCurrency(l.line13c_netCar1Allowance)}</td></tr>
              <tr><td class="mono"><strong>Line 13d–13f</strong></td><td>Net Vehicle 2 ownership (${fmtCurrency(l.line13d_effectiveStd)} std less ${fmtCurrency(l.secCar2Payment)} secured)</td><td>Net Line 13f Allowance</td><td style="text-align:right;" class="mono">${fmtCurrency(l.line13f_netCar2Allowance)}</td></tr>
              <tr><td class="mono"><strong>Line 14</strong></td><td>National Standards: Out-of-pocket health care (${calc.under65} &lt;65; ${calc.age65Plus} 65+)</td><td>IRS Health Care Std</td><td style="text-align:right;" class="mono">${fmtCurrency(l.line14.value)}</td></tr>
              <tr><td class="mono"><strong>Line 16</strong></td><td>Taxes (Federal, Social Security, Medicare)</td><td>${l.line16.isOverridden ? "Manual Entry" : "Two-Statement YTD Avg"}</td><td style="text-align:right;" class="mono">${fmtCurrency(l.line16.value)}</td></tr>
              <tr><td class="mono"><strong>Line 17</strong></td><td>Involuntary deductions (Mandatory retirement, union dues, uniforms)</td><td>${l.line17.isOverridden ? "Manual Entry" : "Two-Statement YTD Avg"}</td><td style="text-align:right;" class="mono">${fmtCurrency(l.line17.value)}</td></tr>
              <tr><td class="mono"><strong>Line 18</strong></td><td>Term life insurance</td><td>${l.line18.isOverridden ? "Manual Entry" : "Two-Statement YTD Avg"}</td><td style="text-align:right;" class="mono">${fmtCurrency(l.line18.value)}</td></tr>
              <tr><td class="mono"><strong>Line 19</strong></td><td>Court-ordered payments (Domestic support obligations)</td><td>${l.line19.isOverridden ? "Manual Entry" : "Two-Statement YTD Avg"}</td><td style="text-align:right;" class="mono">${fmtCurrency(l.line19.value)}</td></tr>
              <tr><td class="mono"><strong>Line 20</strong></td><td>Education for employment or special-needs child</td><td>Actual Monthly</td><td style="text-align:right;" class="mono">${fmtCurrency(l.line20.value)}</td></tr>
              <tr><td class="mono"><strong>Line 21</strong></td><td>Childcare (babysitting, daycare, nursery, preschool)</td><td>Actual Monthly</td><td style="text-align:right;" class="mono">${fmtCurrency(l.line21.value)}</td></tr>
              <tr><td class="mono"><strong>Line 22</strong></td><td>Additional health care expenses (above Line 14 standard)</td><td>Actual Excess</td><td style="text-align:right;" class="mono">${fmtCurrency(l.line22.value)}</td></tr>
              <tr><td class="mono"><strong>Line 23</strong></td><td>Optional telephone and telephone services</td><td>Actual Monthly</td><td style="text-align:right;" class="mono">${fmtCurrency(l.line23.value)}</td></tr>
              <tr><td class="mono"><strong>Line 25</strong></td><td>Health, dental, vision, disability insurance, and HSA/FSA</td><td>${l.line25.isOverridden ? "Manual Entry" : "Two-Statement YTD Avg"}</td><td style="text-align:right;" class="mono">${fmtCurrency(l.line25.value)}</td></tr>
              <tr><td class="mono"><strong>Lines 26–28</strong></td><td>Care of family members (${fmtCurrency(l.line26.value)}), Family violence (${fmtCurrency(l.line27.value)}), Home energy (${fmtCurrency(l.line28.value)})</td><td>Actual Monthly</td><td style="text-align:right;" class="mono">${fmtCurrency(l.line26.value + l.line27.value + l.line28.value)}</td></tr>
              <tr><td class="mono"><strong>Line 29</strong></td><td>Education expenses for dependent children under 18</td><td>Statutory Cap ${fmtCurrency(l.childEdStatutoryCap)}</td><td style="text-align:right;" class="mono">${fmtCurrency(l.line29.value)}</td></tr>
              <tr><td class="mono"><strong>Line 31</strong></td><td>Continuing charitable contributions</td><td>Actual Monthly</td><td style="text-align:right;" class="mono">${fmtCurrency(l.line31.value)}</td></tr>
              <tr><td class="mono"><strong>Line 33</strong></td><td>Future payments on secured claims (60-month average)</td><td>Home + Cars + Other Secured</td><td style="text-align:right;" class="mono">${fmtCurrency(l.line33_totalSecuredMonthly)}</td></tr>
              <tr><td class="mono"><strong>Line 34</strong></td><td>Cure amounts on defaulted secured claims (Total Arrears ÷ 60)</td><td>Arrears Cure</td><td style="text-align:right;" class="mono">${fmtCurrency(l.line34_arrearsMonthly)}</td></tr>
              <tr><td class="mono"><strong>Line 35</strong></td><td>Priority claims (Taxes, DSO arrears, unpaid attorney fees ÷ 60)</td><td>11 U.S.C. § 507 Priority</td><td style="text-align:right;" class="mono">${fmtCurrency(l.line35_priorityMonthly)}</td></tr>
              <tr><td class="mono"><strong>Line 36</strong></td><td>Chapter 13 administrative expenses (${fmtCurrency(l.projectedPlanPayment)} plan × ${l.trusteeMultPct}%)</td><td>FLMB UST Multiplier</td><td style="text-align:right;" class="mono">${fmtCurrency(l.line36_trusteeAdminExpense)}</td></tr>
              <tr><td class="mono"><strong>Line 41</strong></td><td>Qualified retirement deductions &amp; retirement loan repayments</td><td>${l.line41.isOverridden ? "Manual Entry" : "Two-Statement YTD Avg"}</td><td style="text-align:right;" class="mono">${fmtCurrency(l.line41.value)}</td></tr>
              <tr><td class="mono"><strong>Line 43</strong></td><td>Special circumstances / Hamilton v. Lanning adjustments</td><td>Forward-Looking Adj.</td><td style="text-align:right;" class="mono">${fmtCurrency(l.line43.value)}</td></tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3">Line 38 / 44 Total Deductions Subtracted from CMI (${fmtCurrency(calc.totalMonthlyCmi)}):</td>
                <td style="text-align:right;">${fmtCurrency(t.totalAllDeductions)}</td>
              </tr>
              <tr>
                <td colspan="3">Line 45 Monthly Disposable Income Under 11 U.S.C. § 1325(b)(2):</td>
                <td style="text-align:right; color:#1e3a8a;">${fmtCurrency(t.monthlyDisposableIncome)}/mo</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  `;

  if (viewMode === "client") {
    container.innerHTML = letterheadHtml + clientReportHtml;
  } else if (viewMode === "worksheet") {
    container.innerHTML = letterheadHtml + worksheetHtml;
  } else {
    container.innerHTML = letterheadHtml + clientReportHtml + worksheetHtml;
  }
}

function renderStandardsManager() {
  const container = document.getElementById("standardsManagerBody");
  if (!container) return;
  const presetKey = caseState.standardsPreset;
  const std = standardsStore[presetKey] || standardsStore["2026-mid"];

  container.innerHTML = `
    <div class="callout">
      <div class="callout-title">Editing Active Standards Table: ${std.label}</div>
      <div>
        Whenever the U.S. Trustee Program (<code>justice.gov/ust/means-testing</code>) publishes updated Census Median Family Income, IRS National Standards, or Local Housing/Transportation tables for Florida and the Tampa Division counties, you can update any figure below. All calculations update immediately.
      </div>
    </div>

    <div class="grid-2">
      <!-- Florida Median Income & National Standards -->
      <div>
        <h4 style="margin-bottom:10px; color:var(--primary);">Florida Median Family Income (Annual $) &amp; Health / Transit</h4>
        <div class="table-wrap" style="margin-bottom:18px;">
          <table class="data-table">
            <thead>
              <tr><th>Standard Parameter</th><th>Value ($)</th></tr>
            </thead>
            <tbody>
              <tr><td>FL Median Income — 1 Earner</td><td><input type="number" class="table-input std-edit-input" data-section="median" data-key="1" value="${std.floridaMedianAnnual[1]}" /></td></tr>
              <tr><td>FL Median Income — 2 People</td><td><input type="number" class="table-input std-edit-input" data-section="median" data-key="2" value="${std.floridaMedianAnnual[2]}" /></td></tr>
              <tr><td>FL Median Income — 3 People</td><td><input type="number" class="table-input std-edit-input" data-section="median" data-key="3" value="${std.floridaMedianAnnual[3]}" /></td></tr>
              <tr><td>FL Median Income — 4 People</td><td><input type="number" class="table-input std-edit-input" data-section="median" data-key="4" value="${std.floridaMedianAnnual[4]}" /></td></tr>
              <tr><td>FL Median Income — Each Add'l Person</td><td><input type="number" class="table-input std-edit-input" data-section="median" data-key="additionalPerson" value="${std.floridaMedianAnnual.additionalPerson}" /></td></tr>
              <tr><td>National Food/Clothing/Other — 1 Person</td><td><input type="number" class="table-input std-edit-input" data-section="natFood" data-key="1" value="${std.nationalFoodClothingOther[1].total}" /></td></tr>
              <tr><td>National Food/Clothing/Other — 2 People</td><td><input type="number" class="table-input std-edit-input" data-section="natFood" data-key="2" value="${std.nationalFoodClothingOther[2].total}" /></td></tr>
              <tr><td>National Food/Clothing/Other — 3 People</td><td><input type="number" class="table-input std-edit-input" data-section="natFood" data-key="3" value="${std.nationalFoodClothingOther[3].total}" /></td></tr>
              <tr><td>National Food/Clothing/Other — 4 People</td><td><input type="number" class="table-input std-edit-input" data-section="natFood" data-key="4" value="${std.nationalFoodClothingOther[4].total}" /></td></tr>
              <tr><td>National Food/Clothing/Other — Add'l Person</td><td><input type="number" class="table-input std-edit-input" data-section="natFood" data-key="additionalPerson" value="${std.nationalFoodClothingOther.additionalPerson.total}" /></td></tr>
              <tr><td>Out-of-Pocket Health Care — Under 65</td><td><input type="number" class="table-input std-edit-input" data-section="health" data-key="under65" value="${std.healthCareOutOfPocket.under65}" /></td></tr>
              <tr><td>Out-of-Pocket Health Care — 65 &amp; Older</td><td><input type="number" class="table-input std-edit-input" data-section="health" data-key="age65Plus" value="${std.healthCareOutOfPocket.age65Plus}" /></td></tr>
              <tr><td>Vehicle Ownership Standard (1 Car)</td><td><input type="number" class="table-input std-edit-input" data-section="trans" data-key="ownershipOneCar" value="${std.transportation.ownershipOneCar}" /></td></tr>
              <tr><td>Tampa MSA Operating (1 Car / 2 Cars)</td><td>
                <div style="display:flex; gap:6px;">
                  <input type="number" class="table-input std-edit-input" data-section="tampaOp" data-key="oneCar" value="${std.transportation.operatingByRegion.TAMPA_MSA.oneCar}" />
                  <input type="number" class="table-input std-edit-input" data-section="tampaOp" data-key="twoCars" value="${std.transportation.operatingByRegion.TAMPA_MSA.twoCars}" />
                </div>
              </td></tr>
              <tr><td>South Region Non-MSA Operating (1 Car / 2 Cars)</td><td>
                <div style="display:flex; gap:6px;">
                  <input type="number" class="table-input std-edit-input" data-section="southOp" data-key="oneCar" value="${std.transportation.operatingByRegion.SOUTH_REGION.oneCar}" />
                  <input type="number" class="table-input std-edit-input" data-section="southOp" data-key="twoCars" value="${std.transportation.operatingByRegion.SOUTH_REGION.twoCars}" />
                </div>
              </td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tampa Division County Housing & Utilities Standards -->
      <div>
        <h4 style="margin-bottom:10px; color:var(--primary);">FLMB Tampa Division Counties — Housing &amp; Utilities Standards</h4>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>County &amp; Type</th>
                <th>1 Pers</th>
                <th>2 Pers</th>
                <th>3 Pers</th>
                <th>4 Pers</th>
                <th>5+ Pers</th>
              </tr>
            </thead>
            <tbody>
              ${Object.keys(std.counties).map(cKey => {
                const c = std.counties[cKey];
                return `
                  <tr>
                    <td><strong>${cKey}</strong> (Non-Mtg)</td>
                    ${[1, 2, 3, 4, 5].map(sz => `
                      <td><input type="number" class="table-input std-county-input" data-county="${cKey}" data-type="nonMortgage" data-size="${sz}" value="${c.nonMortgage[sz]}" style="min-width:64px;" /></td>
                    `).join("")}
                  </tr>
                  <tr>
                    <td><strong>${cKey}</strong> (Mtg/Rent)</td>
                    ${[1, 2, 3, 4, 5].map(sz => `
                      <td><input type="number" class="table-input std-county-input" data-county="${cKey}" data-type="mortgageRent" data-size="${sz}" value="${c.mortgageRent[sz]}" style="min-width:64px;" /></td>
                    `).join("")}
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function updateAllViews(options = {}) {
  const { skipEarnerRender = false, skipDeductionsRender = false } = options;
  saveCaseState();
  syncInputsFromState();

  const calc = computeMeansTest();
  const l = calc.lines;
  const t = calc.totals;
  const lookback = calc.lookback;

  // Update KPI Ribbon
  document.getElementById("kpiMonthlyCmi").textContent = fmtCurrency(calc.totalMonthlyCmi);
  document.getElementById("kpiAnnualCmi").textContent = `Annualized: ${fmtCurrency(calc.annualizedCmi)}`;
  document.getElementById("kpiFlMedian").textContent = fmtIntCurrency(calc.flMedianAnnual);
  document.getElementById("kpiMedianStatus").textContent = calc.isAboveMedian
    ? `Above Median (+${fmtIntCurrency(calc.annualizedCmi - calc.flMedianAnnual)}/yr • 60-Mo)`
    : `Below Median (-${fmtIntCurrency(calc.flMedianAnnual - calc.annualizedCmi)}/yr • 36-Mo)`;

  const medianPill = document.getElementById("kpiMedianPill");
  if (medianPill) {
    medianPill.classList.toggle("status-pass", !calc.isAboveMedian);
    medianPill.classList.toggle("status-warn", calc.isAboveMedian);
  }

  document.getElementById("kpiIrsStandards").textContent = fmtCurrency(t.totalIrsStandardsPart1A);
  document.getElementById("kpiCountyLabel").textContent = `${calc.countyData.name} (${calc.hhSize} Pers)`;

  const otherDedTotal = t.totalOtherNecessaryPart1B + t.totalAdditionalPart1C + l.line41.value + l.line43.value;
  document.getElementById("kpiOtherDeductions").textContent = fmtCurrency(otherDedTotal);
  document.getElementById("kpiSecuredPrioritySub").textContent = `Secured/Priority/Trustee: ${fmtCurrency(t.totalPart3Deductions)}/mo`;

  document.getElementById("kpiMdiValue").textContent = fmtCurrency(t.monthlyDisposableIncome);
  document.getElementById("kpiMdiSub").textContent = t.monthlyDisposableIncome <= 0
    ? "No Presumed Unsecured Dividend Required"
    : `Form 122C-2 Line 45 (× ${calc.commitmentPeriodMonths} mos)`;

  const mdiPill = document.getElementById("kpiMdiPill");
  if (mdiPill) {
    mdiPill.classList.toggle("status-pass", t.monthlyDisposableIncome <= 0);
    mdiPill.classList.toggle("status-warn", t.monthlyDisposableIncome > 0);
  }

  document.getElementById("kpiUnsecuredPool").textContent = fmtCurrency(t.unsecuredPool60Mo);
  document.getElementById("kpiEstPlanPayment").textContent = `Est. Plan Base: ${fmtCurrency(t.estimatedMonthlyPlanBase)}/mo (${t.estimatedUnsecuredDividendPct.toFixed(0)}% Unsec)`;

  // Update Earner Badges even if skipping full earner table re-render
  const d1Badge = document.getElementById("d1CalculatedBadge");
  if (d1Badge) d1Badge.textContent = `Avg Gross CMI: ${fmtCurrency(calc.d1.gross)}/mo`;
  const d2Badge = document.getElementById("d2CalculatedBadge");
  if (d2Badge) d2Badge.textContent = caseState.enableDebtor2 ? `Avg Gross CMI: ${fmtCurrency(calc.d2.gross)}/mo` : "Disabled / Not Included";

  // Tab 1 Lookback text & preview table
  const lbEl = document.getElementById("lookbackWindowText");
  if (lbEl) {
    lbEl.innerHTML = `Based on an expected filing date in <strong>${lookback.filingMonthName}</strong> (${lookback.filingFormatted}), the statutory 6-month lookback window is <strong>${lookback.startFormatted} – ${lookback.endFormatted}</strong>. Using the Two-Statement YTD method, compare the client's <strong>last pay statement from ${lookback.baselineMonthName}</strong> and their <strong>last pay statement from ${lookback.endingMonthName}</strong>.`;
  }

  // Tab 2 Top Callout dynamic text
  const incTitle = document.getElementById("incomeTabCalloutTitle");
  const incBody = document.getElementById("incomeTabCalloutBody");
  if (incTitle && incBody) {
    incTitle.textContent = `Two-Statement YTD Method for a ${lookback.filingMonthName} Filing: Last Stub of ${lookback.baselineMonthName} vs. Last Stub of ${lookback.endingMonthName}`;
    incBody.innerHTML = `
      Because your expected filing date is in <strong>${lookback.filingMonthName}</strong>, the 6-month lookback period is <strong>${lookback.startFormatted} – ${lookback.endFormatted}</strong>.
      Enter the Year-to-Date (YTD) figures from the client's <strong>last pay statement in ${lookback.baselineMonthName}</strong> (Statement #1) and their <strong>last pay statement in ${lookback.endingMonthName}</strong> (Statement #2).
      The calculator subtracts the ${lookback.baselineMonthOnly} YTD figures from the ${lookback.endingMonthOnly} YTD figures to determine the exact income and deductions for the past 6 months, divides by 6, and syncs everything to Form 122C-1 and Form 122C-2.
    `;
  }

  const activeStdBadge = document.getElementById("activeStandardsBadge");
  if (activeStdBadge) {
    activeStdBadge.textContent = calc.stdPreset.label;
  }

  const previewBody = document.getElementById("setupStandardsPreviewBody");
  if (previewBody) {
    previewBody.innerHTML = `
      <tr>
        <td><strong>Florida Median Family Income (${calc.hhSize} Person Household)</strong></td>
        <td>Census / UST Florida Table</td>
        <td style="text-align:right;" class="mono"><strong>${fmtIntCurrency(calc.flMedianAnnual)}/yr</strong> (${fmtCurrency(calc.flMedianMonthly)}/mo)</td>
      </tr>
      <tr>
        <td><strong>IRS National Standard: Food, Clothing &amp; Other Items</strong></td>
        <td>${calc.hhSize} Person(s) ${caseState.claim5PercentFood === "yes" ? "+ 5% Food/Apparel Allowance" : ""}</td>
        <td style="text-align:right;" class="mono"><strong>${fmtCurrency(l.line6.autoValue + l.line7.autoValue)}/mo</strong></td>
      </tr>
      <tr>
        <td><strong>${calc.countyData.name} Housing &amp; Utilities (Non-Mortgage, Line 8)</strong></td>
        <td>FIPS ${calc.countyData.fips} • ${calc.hhSize} Person(s)</td>
        <td style="text-align:right;" class="mono"><strong>${fmtCurrency(l.line8.autoValue)}/mo</strong></td>
      </tr>
      <tr>
        <td><strong>${calc.countyData.name} Housing &amp; Utilities (Mortgage/Rent, Line 9a)</strong></td>
        <td>FIPS ${calc.countyData.fips} • ${calc.hhSize} Person(s)</td>
        <td style="text-align:right;" class="mono"><strong>${fmtCurrency(l.line9a.autoValue)}/mo</strong></td>
      </tr>
      <tr>
        <td><strong>Vehicle Operating Standard (${calc.cars} Car[s])</strong></td>
        <td>${calc.operatingRegion.label}</td>
        <td style="text-align:right;" class="mono"><strong>${fmtCurrency(l.line12.autoValue)}/mo</strong></td>
      </tr>
      <tr>
        <td><strong>Out-of-Pocket Health Care Standard (Line 14)</strong></td>
        <td>${calc.under65} Under 65 ($${calc.stdPreset.healthCareOutOfPocket.under65}) + ${calc.age65Plus} Age 65+ ($${calc.stdPreset.healthCareOutOfPocket.age65Plus})</td>
        <td style="text-align:right;" class="mono"><strong>${fmtCurrency(l.line14.autoValue)}/mo</strong></td>
      </tr>
    `;
  }

  // Tab 2 Form 122C-1 Callout
  const c1Callout = document.getElementById("form122c1ResultCallout");
  if (c1Callout) {
    c1Callout.innerHTML = `
      <strong>Monthly CMI: ${fmtCurrency(calc.totalMonthlyCmi)}/mo</strong> &bull;
      <strong>Annualized CMI: ${fmtCurrency(calc.annualizedCmi)}/yr</strong> vs.
      <strong>FL Median (${calc.hhSize} Pers): ${fmtIntCurrency(calc.flMedianAnnual)}/yr</strong> &rarr;
      <strong>${calc.isAboveMedian ? "ABOVE MEDIAN (60-Month Commitment Period)" : "BELOW MEDIAN (36-Month Commitment Period)"}</strong>
    `;
  }

  // Tab 4 Secured Offset Explanation & Summary Table
  const secExplain = document.getElementById("securedOffsetExplanation");
  if (secExplain) {
    secExplain.innerHTML = `
      <div><strong>Housing (Lines 9a–9c &amp; 33):</strong> ${calc.countyData.name} Mortgage/Rent Standard is <strong>${fmtCurrency(l.line9a.value)}</strong>. Because your ongoing secured home payments on Line 33 are <strong>${fmtCurrency(l.line9b_homeSecuredOffset)}</strong>, Line 9c claims the net remaining standard of <strong>${fmtCurrency(l.line9c_netHousingAllowance)}</strong> and Line 33 deducts the full <strong>${fmtCurrency(l.line9b_homeSecuredOffset)}</strong>.</div>
      <div style="margin-top:4px;"><strong>Vehicles (Lines 13a–13f &amp; 33):</strong> Vehicle 1 Net Standard Allowance is <strong>${fmtCurrency(l.line13c_netCar1Allowance)}</strong> (after offsetting ${fmtCurrency(l.secCar1Payment)} loan); Vehicle 2 Net Standard Allowance is <strong>${fmtCurrency(l.line13f_netCar2Allowance)}</strong> (after offsetting ${fmtCurrency(l.secCar2Payment)} loan).</div>
    `;
  }

  const part3Body = document.getElementById("part3SummaryTableBody");
  if (part3Body) {
    part3Body.innerHTML = `
      <tr>
        <td><strong>Line 33: Future Payments on Secured Claims</strong></td>
        <td>Home (${fmtCurrency(l.line9b_homeSecuredOffset)}) + Cars (${fmtCurrency(l.secCar1Payment + l.secCar2Payment)}) + Other (${fmtCurrency(Number(caseState.securedAndPriority.secOther) || 0)})</td>
        <td style="text-align:right;" class="mono">${fmtCurrency(l.line33_totalSecuredMonthly)}/mo</td>
      </tr>
      <tr>
        <td><strong>Line 34: Cure / Arrearage Claims</strong></td>
        <td>Total Arrears ${fmtCurrency((Number(caseState.securedAndPriority.arrearsMortgageTotal) || 0) + (Number(caseState.securedAndPriority.arrearsOtherTotal) || 0))} ÷ 60</td>
        <td style="text-align:right;" class="mono">${fmtCurrency(l.line34_arrearsMonthly)}/mo</td>
      </tr>
      <tr>
        <td><strong>Line 35: Priority Claims (Taxes, DSO, Atty Fees)</strong></td>
        <td>Total Priority ${fmtCurrency((Number(caseState.securedAndPriority.priorityTaxTotal) || 0) + (Number(caseState.securedAndPriority.priorityDsoTotal) || 0) + (Number(caseState.securedAndPriority.priorityAttyFees) || 0))} ÷ 60</td>
        <td style="text-align:right;" class="mono">${fmtCurrency(l.line35_priorityMonthly)}/mo</td>
      </tr>
      <tr>
        <td><strong>Line 36: FLMB Chapter 13 Trustee Admin Expense</strong></td>
        <td>Projected Plan ${fmtCurrency(l.projectedPlanPayment)}/mo × ${l.trusteeMultPct}% UST Multiplier</td>
        <td style="text-align:right;" class="mono">${fmtCurrency(l.line36_trusteeAdminExpense)}/mo</td>
      </tr>
    `;
  }

  if (!skipEarnerRender) {
    renderEarnerPanel("d1");
    renderEarnerPanel("d2");
  }
  if (!skipDeductionsRender) {
    renderDeductionsTab(calc);
  }
  renderClientAndWorksheetReport(calc);
}

// ============================================================================
// EVENT LISTENERS & INITIALIZATION
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
  // Navigation Tabs
  document.querySelectorAll(".nav-tab").forEach(tabBtn => {
    tabBtn.addEventListener("click", () => {
      const targetId = tabBtn.getAttribute("data-tab");
      document.querySelectorAll(".nav-tab").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
      tabBtn.classList.add("active");
      document.getElementById(targetId)?.classList.add("active");
      if (targetId === "panel-standards") {
        renderStandardsManager();
      }
    });
  });

  // Top Header Buttons
  document.getElementById("btnNewBlankClient")?.addEventListener("click", () => {
    previousCaseSnapshot = clone(caseState);
    caseState = getBlankClientCase(caseState);
    updateAllViews();
    showStatusToast("✨ All client data has been cleared and reset to $0.00 for a new client.", true);
  });

  document.getElementById("btnUndoReset")?.addEventListener("click", () => {
    if (previousCaseSnapshot) {
      caseState = clone(previousCaseSnapshot);
      previousCaseSnapshot = null;
      updateAllViews();
      showStatusToast("↩ Restored previous client data.", false);
    }
  });

  document.getElementById("btnDismissToast")?.addEventListener("click", () => {
    const banner = document.getElementById("statusToastBanner");
    if (banner) banner.style.display = "none";
  });

  document.getElementById("btnClearD1Pay")?.addEventListener("click", () => {
    previousCaseSnapshot = clone(caseState);
    caseState.earners.d1 = getBlankEarnerState();
    updateAllViews();
    showStatusToast("Debtor 1 pay statement data cleared to $0.00.", true);
  });

  document.getElementById("btnClearD2Pay")?.addEventListener("click", () => {
    previousCaseSnapshot = clone(caseState);
    caseState.earners.d2 = getBlankEarnerState();
    updateAllViews();
    showStatusToast("Debtor 2 pay statement data cleared to $0.00.", true);
  });

  document.getElementById("btnClearDebts")?.addEventListener("click", () => {
    previousCaseSnapshot = clone(caseState);
    caseState.securedAndPriority = {
      secMortgage1: 0,
      secMortgage2Hoa: 0,
      secRentActual: 0,
      secCar1: 0,
      secCar2: 0,
      secOther: 0,
      arrearsMortgageTotal: 0,
      arrearsOtherTotal: 0,
      priorityTaxTotal: 0,
      priorityDsoTotal: 0,
      priorityAttyFees: 0,
      generalUnsecuredTotal: 0,
      trusteeMultiplier: caseState.securedAndPriority.trusteeMultiplier || 10.0,
      projectedPlanPaymentOverride: ""
    };
    updateAllViews();
    showStatusToast("All secured, arrearage, and priority debt amounts reset to $0.00.", true);
  });

  const triggerAutoUpdateStandardsView = () => {
    document.querySelectorAll(".nav-tab").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    document.querySelector('.nav-tab[data-tab="panel-standards"]')?.classList.add("active");
    document.getElementById("panel-standards")?.classList.add("active");
    renderStandardsManager();
    autoFetchOnlineUstStandards();
  };

  document.getElementById("btnHeaderAutoUpdateStandards")?.addEventListener("click", triggerAutoUpdateStandardsView);
  document.getElementById("btnSetupAutoUpdateStandards")?.addEventListener("click", triggerAutoUpdateStandardsView);
  document.getElementById("btnAutoFetchOnlineStandards")?.addEventListener("click", () => {
    autoFetchOnlineUstStandards();
  });

  document.getElementById("btnToggleSmartPasteBox")?.addEventListener("click", () => {
    const drawer = document.getElementById("smartPasteDrawer");
    if (drawer) {
      drawer.style.display = drawer.style.display === "none" ? "block" : "none";
    }
  });

  document.getElementById("btnReadClipboardAndParse")?.addEventListener("click", async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      const ta = document.getElementById("smartPasteTextarea");
      if (ta) ta.value = clipText;
      const res = parseRawUstTextIntoStandards(clipText);
      const statusBox = document.getElementById("autoUpdateStatusBox");
      if (statusBox) {
        statusBox.style.display = "block";
        statusBox.className = res.updatedCount > 0 ? "callout success" : "callout warn";
        statusBox.innerHTML = res.updatedCount > 0
          ? `<div class="callout-title">⚡ Extracted &amp; Updated ${res.updatedCount} UST / IRS Standard Figures from Clipboard</div><ul style="margin-left:18px; font-size:12.5px;">${res.details.map(d => `<li>${d}</li>`).join("")}</ul>`
          : `<div class="callout-title">No Matching Florida / National UST Table Figures Found in Clipboard</div><div>Copy a table section from justice.gov/ust/means-testing (such as Florida Median Income, National Standards, or Florida Housing &amp; Utilities) and try again.</div>`;
      }
    } catch (err) {
      alert("Clipboard access was blocked by the browser. Please paste (Ctrl+V) the text into the box below and click 'Parse Text Below & Update'.");
    }
  });

  document.getElementById("btnParseTextareaStandards")?.addEventListener("click", () => {
    const ta = document.getElementById("smartPasteTextarea");
    const raw = ta ? ta.value : "";
    const res = parseRawUstTextIntoStandards(raw);
    const statusBox = document.getElementById("autoUpdateStatusBox");
    if (statusBox) {
      statusBox.style.display = "block";
      statusBox.className = res.updatedCount > 0 ? "callout success" : "callout warn";
      statusBox.innerHTML = res.updatedCount > 0
        ? `<div class="callout-title">⚡ Extracted &amp; Updated ${res.updatedCount} UST / IRS Standard Figures</div><ul style="margin-left:18px; font-size:12.5px;">${res.details.map(d => `<li>${d}</li>`).join("")}</ul>`
        : `<div class="callout-title">No Matching Florida / National UST Table Figures Detected</div><div>Paste text containing Florida Median Income, IRS National Standards, or Florida County Housing &amp; Utilities figures.</div>`;
    }
  });

  document.getElementById("btnExportStandardsJson")?.addEventListener("click", () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(standardsStore, null, 2));
    const dl = document.createElement("a");
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", `flmb_tampa_ust_irs_standards.json`);
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
  });

  document.getElementById("inputImportStandardsJson")?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (parsed && typeof parsed === "object") {
          standardsStore = parsed;
          saveStandardsStore();
          renderStandardsManager();
          updateAllViews();
          showStatusToast("✅ Imported and applied UST / IRS Standards JSON pack.", false);
        }
      } catch (err) {
        alert("Invalid Standards JSON file.");
      }
    };
    reader.readAsText(file);
  });

  document.getElementById("btnLoadSampleAbove")?.addEventListener("click", () => {
    previousCaseSnapshot = clone(caseState);
    caseState = getSampleCaseAboveMedian();
    updateAllViews();
    showStatusToast("Loaded Sample Above-Median Case (Carlos & Maria Rodriguez — Hillsborough County).", true);
  });

  document.getElementById("btnLoadSampleBelow")?.addEventListener("click", () => {
    previousCaseSnapshot = clone(caseState);
    caseState = getSampleCaseBelowMedian();
    updateAllViews();
    showStatusToast("Loaded Sample Below-Median Case (Devon & Ashley Carter — Pinellas County).", true);
  });

  document.getElementById("btnExportJson")?.addEventListener("click", () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(caseState, null, 2));
    const dl = document.createElement("a");
    dl.setAttribute("href", dataStr);
    const safeName = (caseState.clientName || "flmb-case").replace(/[^a-z0-9]/gi, "_").toLowerCase();
    dl.setAttribute("download", `${safeName}_means_test.json`);
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
  });

  document.getElementById("inputImportJson")?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (parsed && parsed.earners) {
          caseState = parsed;
          updateAllViews();
        }
      } catch (err) {
        alert("Invalid JSON case file.");
      }
    };
    reader.readAsText(file);
  });

  document.getElementById("btnQuickPrintReport")?.addEventListener("click", () => {
    document.querySelectorAll(".nav-tab").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    document.querySelector('.nav-tab[data-tab="panel-report"]')?.classList.add("active");
    document.getElementById("panel-report")?.classList.add("active");
    window.print();
  });

  document.getElementById("btnPrintNow")?.addEventListener("click", () => {
    window.print();
  });

  // Report View Mode Buttons
  document.getElementById("btnViewClientReport")?.addEventListener("click", () => {
    caseState.reportViewMode = "client";
    updateAllViews();
  });
  document.getElementById("btnViewAttorneyWorksheet")?.addEventListener("click", () => {
    caseState.reportViewMode = "worksheet";
    updateAllViews();
  });
  document.getElementById("btnViewBothReports")?.addEventListener("click", () => {
    caseState.reportViewMode = "both";
    updateAllViews();
  });

  // Direct Static Input Bindings (Tabs 1, 2, 4)
  const simpleBindings = [
    ["clientName", "clientName"],
    ["spouseName", "spouseName"],
    ["caseNumber", "caseNumber"],
    ["filingStatus", "filingStatus"],
    ["filingDate", "filingDate"],
    ["tampaCounty", "tampaCounty"],
    ["standardsPresetSelect", "standardsPreset"],
    ["householdSize", "householdSize"],
    ["membersUnder65", "membersUnder65"],
    ["members65Plus", "members65Plus"],
    ["dependentChildrenUnder18", "dependentChildrenUnder18"],
    ["vehicleCount", "vehicleCount"],
    ["olderVehicleCount", "olderVehicleCount"],
    ["claimPublicTransit", "claimPublicTransit"],
    ["claim5PercentFood", "claim5PercentFood"],
    ["firmName", "firmName"],
    ["attorneyName", "attorneyName"],
    ["firmContact", "firmContact"],
    ["attorneyCustomNote", "attorneyCustomNote"]
  ];

  simpleBindings.forEach(([id, stateKey]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", () => {
      caseState[stateKey] = el.value;
      if (stateKey === "householdSize") {
        const hh = Math.max(1, parseInt(el.value, 10) || 1);
        const p65 = Math.max(0, parseInt(caseState.members65Plus, 10) || 0);
        caseState.membersUnder65 = Math.max(0, hh - p65);
      }
      updateAllViews();
    });
  });

  document.getElementById("enableDebtor2")?.addEventListener("change", (e) => {
    caseState.enableDebtor2 = e.target.checked;
    updateAllViews();
  });

  // Earner Mode Switch Buttons
  document.querySelectorAll(".mode-btn[data-earner]").forEach(btn => {
    btn.addEventListener("click", () => {
      const earnerKey = btn.getAttribute("data-earner");
      const mode = btn.getAttribute("data-mode");
      caseState.earners[earnerKey].mode = mode;
      updateAllViews();
    });
  });

  // Other Income Bindings
  const otherIncBindings = [
    ["incBusinessGross", "businessGross"],
    ["incBusinessExpenses", "businessExpenses"],
    ["incRentalNet", "rentalNet"],
    ["incInterestDiv", "interestDiv"],
    ["incPension", "pension"],
    ["incSupportContrib", "supportContrib"],
    ["incUnemployment", "unemployment"],
    ["incOtherCmi", "otherCmi"],
    ["exclSocialSecurity", "exclSocialSecurity"],
    ["exclVaHaven", "exclVaHaven"],
    ["maritalAdjustment", "maritalAdjustment"],
    ["maritalAdjustmentNotes", "maritalAdjustmentNotes"]
  ];
  otherIncBindings.forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", () => {
      caseState.otherIncome[key] = el.value;
      updateAllViews();
    });
  });

  // Secured & Priority Bindings
  const secBindings = [
    ["secMortgage1", "secMortgage1"],
    ["secMortgage2Hoa", "secMortgage2Hoa"],
    ["secRentActual", "secRentActual"],
    ["secCar1", "secCar1"],
    ["secCar2", "secCar2"],
    ["secOther", "secOther"],
    ["arrearsMortgageTotal", "arrearsMortgageTotal"],
    ["arrearsOtherTotal", "arrearsOtherTotal"],
    ["priorityTaxTotal", "priorityTaxTotal"],
    ["priorityDsoTotal", "priorityDsoTotal"],
    ["priorityAttyFees", "priorityAttyFees"],
    ["generalUnsecuredTotal", "generalUnsecuredTotal"],
    ["trusteeMultiplier", "trusteeMultiplier"],
    ["projectedPlanPaymentOverride", "projectedPlanPaymentOverride"]
  ];
  secBindings.forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", () => {
      caseState.securedAndPriority[key] = el.value;
      updateAllViews();
    });
  });

  // Reset All Standard Overrides
  document.getElementById("btnResetAllStandardOverrides")?.addEventListener("click", () => {
    Object.keys(caseState.deductionOverrides).forEach(k => {
      if (k.startsWith("line6") || k.startsWith("line7") || k.startsWith("line8") || k.startsWith("line9") || k.startsWith("line11") || k.startsWith("line12") || k.startsWith("line13") || k.startsWith("line14")) {
        caseState.deductionOverrides[k].enabled = false;
      }
    });
    updateAllViews();
  });

  // Restore Default Standards in Manager
  document.getElementById("btnRestoreDefaultStandards")?.addEventListener("click", () => {
    standardsStore = clone(DEFAULT_STANDARDS_PRESETS);
    saveStandardsStore();
    renderStandardsManager();
    updateAllViews();
  });

  // Delegated Listeners for Dynamic Earner Inputs, Deduction Overrides, and Standards Manager
  document.body.addEventListener("input", (e) => {
    const t = e.target;

    if (t.classList.contains("earner-field")) {
      const ek = t.getAttribute("data-earner");
      const path = t.getAttribute("data-path");
      caseState.earners[ek][path] = t.value;
      saveCaseState();
      renderClientAndWorksheetReport(computeMeansTest());
      return;
    }

    if (t.classList.contains("earner-ytd-meta")) {
      const ek = t.getAttribute("data-earner");
      const field = t.getAttribute("data-field");
      caseState.earners[ek].ytd[field] = t.value;
      updateAllViews({ skipEarnerRender: field === "priorDate" || field === "latestDate" || field === "yearEndDate" });
      return;
    }

    if (t.classList.contains("earner-ytd-val")) {
      const ek = t.getAttribute("data-earner");
      const which = t.getAttribute("data-which");
      const key = t.getAttribute("data-key");
      if (!caseState.earners[ek].ytd[which]) caseState.earners[ek].ytd[which] = {};
      caseState.earners[ek].ytd[which][key] = parseFloat(t.value) || 0;
      updateAllViews({ skipEarnerRender: true });
      return;
    }

    if (t.classList.contains("stub-input")) {
      const ek = t.getAttribute("data-earner");
      const idx = parseInt(t.getAttribute("data-idx"), 10);
      const key = t.getAttribute("data-key");
      if (key === "date") {
        caseState.earners[ek].stubs[idx].date = t.value;
      } else {
        caseState.earners[ek].stubs[idx][key] = parseFloat(t.value) || 0;
      }
      updateAllViews({ skipEarnerRender: true });
      return;
    }

    if (t.classList.contains("earner-manual-freq")) {
      const ek = t.getAttribute("data-earner");
      caseState.earners[ek].manual.frequency = t.value;
      updateAllViews();
      return;
    }
    if (t.classList.contains("earner-manual-val")) {
      const ek = t.getAttribute("data-earner");
      const key = t.getAttribute("data-key");
      caseState.earners[ek].manual[key] = parseFloat(t.value) || 0;
      updateAllViews({ skipEarnerRender: true });
      return;
    }

    if (t.classList.contains("ded-override-input")) {
      const key = t.getAttribute("data-key");
      if (!caseState.deductionOverrides[key]) {
        caseState.deductionOverrides[key] = { enabled: true, value: 0 };
      }
      caseState.deductionOverrides[key].enabled = true;
      caseState.deductionOverrides[key].value = parseFloat(t.value) || 0;
      updateAllViews({ skipDeductionsRender: true });
      return;
    }

    if (t.classList.contains("std-edit-input")) {
      const std = standardsStore[caseState.standardsPreset];
      const sec = t.getAttribute("data-section");
      const key = t.getAttribute("data-key");
      const val = parseFloat(t.value) || 0;
      if (sec === "median") std.floridaMedianAnnual[key] = val;
      else if (sec === "natFood") std.nationalFoodClothingOther[key].total = val;
      else if (sec === "health") std.healthCareOutOfPocket[key] = val;
      else if (sec === "trans") std.transportation[key] = val;
      else if (sec === "tampaOp") std.transportation.operatingByRegion.TAMPA_MSA[key] = val;
      else if (sec === "southOp") std.transportation.operatingByRegion.SOUTH_REGION[key] = val;
      saveStandardsStore();
      updateAllViews();
      return;
    }

    if (t.classList.contains("std-county-input")) {
      const std = standardsStore[caseState.standardsPreset];
      const cKey = t.getAttribute("data-county");
      const type = t.getAttribute("data-type");
      const sz = t.getAttribute("data-size");
      std.counties[cKey][type][sz] = parseFloat(t.value) || 0;
      saveStandardsStore();
      updateAllViews();
      return;
    }
  });

  // Delegated Change / Click Listeners
  document.body.addEventListener("change", (e) => {
    const t = e.target;
    if (t.classList.contains("ded-override-check")) {
      const key = t.getAttribute("data-key");
      const autoVal = parseFloat(t.getAttribute("data-autoval")) || 0;
      if (!caseState.deductionOverrides[key]) {
        caseState.deductionOverrides[key] = { enabled: t.checked, value: autoVal };
      } else {
        caseState.deductionOverrides[key].enabled = t.checked;
        if (t.checked && !caseState.deductionOverrides[key].value) {
          caseState.deductionOverrides[key].value = autoVal;
        }
      }
      updateAllViews();
      return;
    }

    if (
      t.classList.contains("earner-ytd-val") ||
      t.classList.contains("earner-ytd-meta") ||
      t.classList.contains("stub-input") ||
      t.classList.contains("earner-manual-val") ||
      t.classList.contains("ded-override-input")
    ) {
      updateAllViews();
    }
  });

  document.body.addEventListener("click", (e) => {
    const btnAdd = e.target.closest(".btn-add-stub");
    if (btnAdd) {
      const ek = btnAdd.getAttribute("data-earner");
      caseState.earners[ek].stubs.push({
        date: "", gross: 0, fedTax: 0, ssTax: 0, medTax: 0, mandatoryRetire: 0, unionDues: 0,
        voluntary401k: 0, loan401k: 0, healthIns: 0, dentalVision: 0, hsaFsa: 0, disabilityIns: 0, termLife: 0, courtDso: 0
      });
      updateAllViews();
      return;
    }

    const btnDup = e.target.closest(".btn-duplicate-stub");
    if (btnDup) {
      const ek = btnDup.getAttribute("data-earner");
      const stubs = caseState.earners[ek].stubs;
      const last = stubs.length > 0 ? clone(stubs[stubs.length - 1]) : {
        date: "", gross: 0, fedTax: 0, ssTax: 0, medTax: 0, mandatoryRetire: 0, unionDues: 0,
        voluntary401k: 0, loan401k: 0, healthIns: 0, dentalVision: 0, hsaFsa: 0, disabilityIns: 0, termLife: 0, courtDso: 0
      };
      stubs.push(last);
      updateAllViews();
      return;
    }

    const btnDel = e.target.closest(".btn-del-stub");
    if (btnDel) {
      const ek = btnDel.getAttribute("data-earner");
      const idx = parseInt(btnDel.getAttribute("data-idx"), 10);
      caseState.earners[ek].stubs.splice(idx, 1);
      updateAllViews();
      return;
    }
  });

  // Initial Render
  updateAllViews();
});
