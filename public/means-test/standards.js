/**
 * Official U.S. Trustee / IRS Means Testing Standards Data
 * U.S. Bankruptcy Court - Middle District of Florida, Tampa Division (FLMB)
 * Counties: Hillsborough, Pinellas, Pasco, Hernando, Polk, Manatee, Sarasota, Hardee
 */

const DEFAULT_STANDARDS_PRESETS = {
  "2026-mid": {
    id: "2026-mid",
    label: "Current UST / IRS Standards (Effective Mid-2026)",
    effectiveDate: "2026-07-15",
    notes: "Census Bureau Median Family Income effective July 15, 2026; IRS Collection Financial Standards effective June 29, 2026.",
    floridaMedianAnnual: {
      1: 69876,
      2: 86523,
      3: 97540,
      4: 114761,
      additionalPerson: 11100
    },
    nationalFoodClothingOther: {
      1: { food: 496, housekeeping: 44, apparel: 98, personalCare: 54, misc: 175, total: 867, fivePercentCap: 30 },
      2: { food: 893, housekeeping: 85, apparel: 175, personalCare: 90, misc: 315, total: 1558, fivePercentCap: 53 },
      3: { food: 1064, housekeeping: 101, apparel: 209, personalCare: 107, misc: 376, total: 1857, fivePercentCap: 64 },
      4: { food: 1247, housekeeping: 118, apparel: 245, personalCare: 125, misc: 441, total: 2176, fivePercentCap: 75 },
      additionalPerson: { food: 228, housekeeping: 22, apparel: 45, personalCare: 23, misc: 79, total: 397, fivePercentCap: 14 }
    },
    healthCareOutOfPocket: {
      under65: 90,
      age65Plus: 163
    },
    transportation: {
      ownershipOneCar: 703,
      ownershipTwoCars: 1406,
      publicTransportation: 220,
      olderVehicleAdditionalOperating: 200,
      operatingByRegion: {
        "TAMPA_MSA": {
          label: "Tampa MSA (Hillsborough, Pinellas, Pasco, Hernando)",
          oneCar: 320,
          twoCars: 640
        },
        "SOUTH_REGION": {
          label: "South Region Non-MSA (Polk, Manatee, Sarasota, Hardee)",
          oneCar: 291,
          twoCars: 582
        }
      }
    },
    chapter13AdminMultiplier: 10.0, // 10.0% Middle District of Florida UST Schedule
    childEducationCapMonthlyPerChild: 187.50, // $2,250 / year statutory cap per child under 18
    counties: {
      "Hillsborough": {
        name: "Hillsborough County",
        fips: "12057",
        msaRegion: "TAMPA_MSA",
        nonMortgage: { 1: 592, 2: 695, 3: 733, 4: 817, 5: 830 },
        mortgageRent: { 1: 1481, 2: 1740, 3: 1833, 4: 2044, 5: 2077 }
      },
      "Pinellas": {
        name: "Pinellas County",
        fips: "12103",
        msaRegion: "TAMPA_MSA",
        nonMortgage: { 1: 635, 2: 746, 3: 786, 4: 876, 5: 891 },
        mortgageRent: { 1: 1391, 2: 1633, 3: 1721, 4: 1919, 5: 1949 }
      },
      "Pasco": {
        name: "Pasco County",
        fips: "12101",
        msaRegion: "TAMPA_MSA",
        nonMortgage: { 1: 605, 2: 710, 3: 749, 4: 835, 5: 848 },
        mortgageRent: { 1: 1308, 2: 1536, 3: 1618, 4: 1804, 5: 1834 }
      },
      "Hernando": {
        name: "Hernando County",
        fips: "12053",
        msaRegion: "TAMPA_MSA",
        nonMortgage: { 1: 553, 2: 650, 3: 685, 4: 763, 5: 776 },
        mortgageRent: { 1: 1097, 2: 1288, 3: 1357, 4: 1514, 5: 1538 }
      },
      "Polk": {
        name: "Polk County",
        fips: "12105",
        msaRegion: "SOUTH_REGION",
        nonMortgage: { 1: 610, 2: 716, 3: 755, 4: 841, 5: 855 },
        mortgageRent: { 1: 1191, 2: 1399, 3: 1474, 4: 1644, 5: 1670 }
      },
      "Manatee": {
        name: "Manatee County",
        fips: "12081",
        msaRegion: "SOUTH_REGION",
        nonMortgage: { 1: 605, 2: 710, 3: 748, 4: 834, 5: 848 },
        mortgageRent: { 1: 1505, 2: 1768, 3: 1863, 4: 2077, 5: 2110 }
      },
      "Sarasota": {
        name: "Sarasota County",
        fips: "12115",
        msaRegion: "SOUTH_REGION",
        nonMortgage: { 1: 597, 2: 701, 3: 739, 4: 824, 5: 837 },
        mortgageRent: { 1: 1425, 2: 1674, 3: 1764, 4: 1967, 5: 1999 }
      },
      "Hardee": {
        name: "Hardee County",
        fips: "12049",
        msaRegion: "SOUTH_REGION",
        nonMortgage: { 1: 592, 2: 696, 3: 733, 4: 818, 5: 831 },
        mortgageRent: { 1: 799, 2: 938, 3: 989, 4: 1102, 5: 1120 }
      }
    }
  },
  "2025-spring": {
    id: "2025-spring",
    label: "Prior 2025 UST / IRS Standards (Effective April/May 2025)",
    effectiveDate: "2025-05-15",
    notes: "Prior year 2025 UST / IRS Standards for historical case comparison.",
    floridaMedianAnnual: {
      1: 67638,
      2: 83962,
      3: 94439,
      4: 111085,
      additionalPerson: 11100
    },
    nationalFoodClothingOther: {
      1: { food: 480, housekeeping: 42, apparel: 95, personalCare: 52, misc: 170, total: 839, fivePercentCap: 29 },
      2: { food: 849, housekeeping: 81, apparel: 166, personalCare: 86, misc: 299, total: 1481, fivePercentCap: 51 },
      3: { food: 1005, housekeeping: 95, apparel: 197, personalCare: 101, misc: 355, total: 1753, fivePercentCap: 60 },
      4: { food: 1220, housekeeping: 115, apparel: 240, personalCare: 122, misc: 432, total: 2129, fivePercentCap: 73 },
      additionalPerson: { food: 226, housekeeping: 21, apparel: 44, personalCare: 23, misc: 80, total: 394, fivePercentCap: 14 }
    },
    healthCareOutOfPocket: {
      under65: 84,
      age65Plus: 149
    },
    transportation: {
      ownershipOneCar: 662,
      ownershipTwoCars: 1324,
      publicTransportation: 217,
      olderVehicleAdditionalOperating: 200,
      operatingByRegion: {
        "TAMPA_MSA": {
          label: "Tampa MSA (Hillsborough, Pinellas, Pasco, Hernando)",
          oneCar: 309,
          twoCars: 618
        },
        "SOUTH_REGION": {
          label: "South Region Non-MSA (Polk, Manatee, Sarasota, Hardee)",
          oneCar: 281,
          twoCars: 562
        }
      }
    },
    chapter13AdminMultiplier: 10.0,
    childEducationCapMonthlyPerChild: 187.50,
    counties: {
      "Hillsborough": {
        name: "Hillsborough County",
        fips: "12057",
        msaRegion: "TAMPA_MSA",
        nonMortgage: { 1: 575, 2: 675, 3: 712, 4: 793, 5: 806 },
        mortgageRent: { 1: 1438, 2: 1689, 3: 1780, 4: 1984, 5: 2017 }
      },
      "Pinellas": {
        name: "Pinellas County",
        fips: "12103",
        msaRegion: "TAMPA_MSA",
        nonMortgage: { 1: 617, 2: 724, 3: 763, 4: 850, 5: 865 },
        mortgageRent: { 1: 1350, 2: 1585, 3: 1671, 4: 1863, 5: 1892 }
      },
      "Pasco": {
        name: "Pasco County",
        fips: "12101",
        msaRegion: "TAMPA_MSA",
        nonMortgage: { 1: 587, 2: 689, 3: 727, 4: 811, 5: 823 },
        mortgageRent: { 1: 1270, 2: 1491, 3: 1571, 4: 1751, 5: 1781 }
      },
      "Hernando": {
        name: "Hernando County",
        fips: "12053",
        msaRegion: "TAMPA_MSA",
        nonMortgage: { 1: 537, 2: 631, 3: 665, 4: 741, 5: 753 },
        mortgageRent: { 1: 1065, 2: 1250, 3: 1317, 4: 1470, 5: 1493 }
      },
      "Polk": {
        name: "Polk County",
        fips: "12105",
        msaRegion: "SOUTH_REGION",
        nonMortgage: { 1: 592, 2: 695, 3: 733, 4: 817, 5: 830 },
        mortgageRent: { 1: 1156, 2: 1358, 3: 1431, 4: 1596, 5: 1621 }
      },
      "Manatee": {
        name: "Manatee County",
        fips: "12081",
        msaRegion: "SOUTH_REGION",
        nonMortgage: { 1: 587, 2: 689, 3: 726, 4: 810, 5: 823 },
        mortgageRent: { 1: 1461, 2: 1717, 3: 1809, 4: 2017, 5: 2049 }
      },
      "Sarasota": {
        name: "Sarasota County",
        fips: "12115",
        msaRegion: "SOUTH_REGION",
        nonMortgage: { 1: 580, 2: 681, 3: 717, 4: 800, 5: 813 },
        mortgageRent: { 1: 1383, 2: 1625, 3: 1713, 4: 1910, 5: 1941 }
      },
      "Hardee": {
        name: "Hardee County",
        fips: "12049",
        msaRegion: "SOUTH_REGION",
        nonMortgage: { 1: 575, 2: 676, 3: 712, 4: 794, 5: 807 },
        mortgageRent: { 1: 776, 2: 911, 3: 960, 4: 1070, 5: 1087 }
      }
    }
  }
};
