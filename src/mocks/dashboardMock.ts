/**
 * Mock data for dashboard — used when backend API is unavailable.
 * TODO: ลบไฟล์นี้เมื่อต่อ backend จริงแล้ว
 */

/* ── Filter options ── */
export const MOCK_HOSPITAL_ZONES = [
  { id: 1, name: "โซน 1" },
  { id: 2, name: "โซน 2" },
  { id: 3, name: "โซน 3" },
  { id: 4, name: "โซน 4" },
  { id: 5, name: "โซน 5" },
  { id: 6, name: "โซน 6" },
  { id: 7, name: "โซน 7" },
  { id: 8, name: "โซน 8" },
];

export const MOCK_HOSPITAL_SUB_TYPES = [
  { id: 1, name: "โรงพยาบาลศูนย์" },
  { id: 2, name: "โรงพยาบาลทั่วไป" },
  { id: 3, name: "โรงพยาบาลชุมชน" },
  { id: 4, name: "คลินิกชุมชนอบอุ่น" },
];

export const MOCK_HOSPITALS = [
  { id: 1, name: "รพ.ราชวิถี", affiliation: "กรมการแพทย์", serviceLevel: "ตติยภูมิ", zone: { id: 1, name: "โซน 1" }, subType: { id: 1, name: "โรงพยาบาลศูนย์" } },
  { id: 2, name: "รพ.ศิริราช", affiliation: "มหาวิทยาลัย", serviceLevel: "ตติยภูมิ", zone: { id: 1, name: "โซน 1" }, subType: { id: 1, name: "โรงพยาบาลศูนย์" } },
  { id: 3, name: "รพ.จุฬาลงกรณ์", affiliation: "สภากาชาดไทย", serviceLevel: "ตติยภูมิ", zone: { id: 2, name: "โซน 2" }, subType: { id: 1, name: "โรงพยาบาลศูนย์" } },
  { id: 4, name: "รพ.พระมงกุฎเกล้า", affiliation: "กองทัพบก", serviceLevel: "ตติยภูมิ", zone: { id: 2, name: "โซน 2" }, subType: { id: 1, name: "โรงพยาบาลศูนย์" } },
  { id: 5, name: "รพ.ตากสิน", affiliation: "กทม.", serviceLevel: "ทุติยภูมิ", zone: { id: 3, name: "โซน 3" }, subType: { id: 2, name: "โรงพยาบาลทั่วไป" } },
  { id: 6, name: "รพ.เจริญกรุงประชารักษ์", affiliation: "กทม.", serviceLevel: "ทุติยภูมิ", zone: { id: 3, name: "โซน 3" }, subType: { id: 2, name: "โรงพยาบาลทั่วไป" } },
  { id: 7, name: "รพ.หลวงพ่อทวีศักดิ์", affiliation: "กทม.", serviceLevel: "ทุติยภูมิ", zone: { id: 4, name: "โซน 4" }, subType: { id: 2, name: "โรงพยาบาลทั่วไป" } },
  { id: 8, name: "รพ.ลาดกระบังกรุงเทพมหานคร", affiliation: "กทม.", serviceLevel: "ทุติยภูมิ", zone: { id: 5, name: "โซน 5" }, subType: { id: 2, name: "โรงพยาบาลทั่วไป" } },
  { id: 9, name: "รพ.สิรินธร", affiliation: "กทม.", serviceLevel: "ทุติยภูมิ", zone: { id: 6, name: "โซน 6" }, subType: { id: 2, name: "โรงพยาบาลทั่วไป" } },
  { id: 10, name: "ศูนย์บริการสาธารณสุข 1", affiliation: "กทม.", serviceLevel: "ปฐมภูมิ", zone: { id: 7, name: "โซน 7" }, subType: { id: 4, name: "คลินิกชุมชนอบอุ่น" } },
];

/* ── StatisticReport (getStaticsAndDetails) ── */
export const MOCK_STATICS_AND_DETAILS = {
  data: {
    referralTypes: {
      opd: { total: 1245, referIn: 680, referOut: 565 },
      ipd: { total: 876, referIn: 432, referOut: 444 },
      emergency: { total: 523, referIn: 298, referOut: 225 },
    },
    statusStatistics: {
      accept: {
        total: 1520,
        percentage: "57.5",
        opd: 720, ipd: 500, emergency: 300,
        breakdown: {
          opd: 720, ipd: 500, emergency: 300,
          opdPercentage: "47.4", ipdPercentage: "32.9", emergencyPercentage: "19.7",
        },
      },
      reject: {
        total: 380,
        percentage: "14.4",
        opd: 180, ipd: 120, emergency: 80,
        breakdown: {
          opd: 180, ipd: 120, emergency: 80,
          opdPercentage: "47.4", ipdPercentage: "31.6", emergencyPercentage: "21.1",
        },
      },
      waiting: {
        total: 744,
        percentage: "28.1",
        opd: 345, ipd: 256, emergency: 143,
        breakdown: {
          opd: 345, ipd: 256, emergency: 143,
          opdPercentage: "46.4", ipdPercentage: "34.4", emergencyPercentage: "19.2",
        },
      },
    },
  },
};

/* ── StatisticCharts (getReportStatusStatistics) ── */
export const MOCK_REPORT_STATUS_STATISTICS = {
  data: {
    charts: {
      referralType: {
        data: [
          { name: "ส่งออก", value: 1234 },
          { name: "รับเข้า", value: 1410 },
          { name: "ส่งกลับ", value: 328 },
          { name: "รับกลับ", value: 215 },
        ],
      },
      ageGroups: {
        data: [
          { name: "0-10", value: 182, percentage: "4.7" },
          { name: "11-20", value: 245, percentage: "6.3" },
          { name: "21-30", value: 389, percentage: "10.0" },
          { name: "31-40", value: 456, percentage: "11.7" },
          { name: "41-50", value: 512, percentage: "13.2" },
          { name: "51-60", value: 623, percentage: "16.0" },
          { name: "61-70", value: 478, percentage: "12.3" },
          { name: "71-80", value: 312, percentage: "8.0" },
          { name: "81-90", value: 145, percentage: "3.7" },
          { name: "91+", value: 42, percentage: "1.1" },
        ],
      },
      departments: {
        data: [
          { name: "อายุรกรรม", value: 28.5 },
          { name: "ศัลยกรรม", value: 22.3 },
          { name: "กุมารเวชกรรม", value: 15.8 },
          { name: "สูติ-นรีเวชกรรม", value: 12.4 },
          { name: "ออร์โธปิดิกส์", value: 10.2 },
          { name: "จักษุวิทยา", value: 6.5 },
          { name: "อื่นๆ", value: 4.3 },
        ],
      },
      gender: {
        data: [
          { name: "ชาย", value: 1856 },
          { name: "หญิง", value: 1528 },
        ],
      },
    },
    tables: {
      rejectedDepartments: {
        data: [
          { name: "อายุรกรรม", hospitalName: "รพ.ราชวิถี", rejectedCount: 45, totalReferIn: 320, rejectionRate: 14.1 },
          { name: "ศัลยกรรม", hospitalName: "รพ.ศิริราช", rejectedCount: 38, totalReferIn: 285, rejectionRate: 13.3 },
          { name: "กุมารเวชกรรม", hospitalName: "รพ.จุฬาลงกรณ์", rejectedCount: 22, totalReferIn: 260, rejectionRate: 8.5 },
          { name: "ออร์โธปิดิกส์", hospitalName: "รพ.พระมงกุฎเกล้า", rejectedCount: 18, totalReferIn: 198, rejectionRate: 9.1 },
          { name: "สูติ-นรีเวชกรรม", hospitalName: "รพ.ตากสิน", rejectedCount: 15, totalReferIn: 175, rejectionRate: 8.6 },
        ],
      },
    },
  },
};

/* ── TopAdmissionRateHospital (getTop5HighestAcceptingHospitals) ── */
export const MOCK_TOP5_HOSPITALS = {
  top5HighestAcceptingHospitals: [
    { hospitalName: "รพ.ราชวิถี", hospitalSubType: "โรงพยาบาลศูนย์", serviceLevel: "ตติยภูมิ", hospitalAffiliation: "กรมการแพทย์", acceptanceRate: "92.5%", referIn: 320, referOut: 180, referBack: 45, total: 545 },
    { hospitalName: "รพ.ศิริราช", hospitalSubType: "โรงพยาบาลศูนย์", serviceLevel: "ตติยภูมิ", hospitalAffiliation: "มหาวิทยาลัย", acceptanceRate: "89.3%", referIn: 285, referOut: 210, referBack: 38, total: 533 },
    { hospitalName: "รพ.จุฬาลงกรณ์", hospitalSubType: "โรงพยาบาลศูนย์", serviceLevel: "ตติยภูมิ", hospitalAffiliation: "สภากาชาดไทย", acceptanceRate: "87.1%", referIn: 260, referOut: 195, referBack: 32, total: 487 },
    { hospitalName: "รพ.พระมงกุฎเกล้า", hospitalSubType: "โรงพยาบาลศูนย์", serviceLevel: "ตติยภูมิ", hospitalAffiliation: "กองทัพบก", acceptanceRate: "85.6%", referIn: 198, referOut: 152, referBack: 28, total: 378 },
    { hospitalName: "รพ.ตากสิน", hospitalSubType: "โรงพยาบาลทั่วไป", serviceLevel: "ทุติยภูมิ", hospitalAffiliation: "กทม.", acceptanceRate: "82.4%", referIn: 175, referOut: 130, referBack: 22, total: 327 },
  ],
};

/* ── MostReferredDisease (getTop10MostReferredDiseases) ── */
export const MOCK_TOP10_DISEASES = {
  top10MostReferredDiseases: [
    { icd10_code: "I21", disease_name: "Acute myocardial infarction", count: 245, percentage: "9.3", acceptance_rate: "94.2" },
    { icd10_code: "I63", disease_name: "Cerebral infarction", count: 198, percentage: "7.5", acceptance_rate: "91.8" },
    { icd10_code: "J18", disease_name: "Pneumonia", count: 176, percentage: "6.7", acceptance_rate: "88.5" },
    { icd10_code: "K80", disease_name: "Cholelithiasis", count: 152, percentage: "5.8", acceptance_rate: "90.1" },
    { icd10_code: "S72", disease_name: "Fracture of femur", count: 138, percentage: "5.2", acceptance_rate: "87.3" },
    { icd10_code: "E11", disease_name: "Type 2 diabetes mellitus", count: 125, percentage: "4.7", acceptance_rate: "85.6" },
    { icd10_code: "N18", disease_name: "Chronic kidney disease", count: 112, percentage: "4.2", acceptance_rate: "82.4" },
    { icd10_code: "J44", disease_name: "COPD", count: 98, percentage: "3.7", acceptance_rate: "86.9" },
    { icd10_code: "I50", disease_name: "Heart failure", count: 87, percentage: "3.3", acceptance_rate: "89.7" },
    { icd10_code: "C34", disease_name: "Malignant neoplasm of bronchus and lung", count: 76, percentage: "2.9", acceptance_rate: "78.5" },
  ],
};

/* ── ReferralReasons (getTop5Cause) ── */
export const MOCK_TOP5_CAUSE = {
  top5Cause: [
    { causeName: "ต้องการแพทย์เฉพาะทาง", count: 320, hospitalName: "รพ.ราชวิถี", supportedTypes: ["OPD", "IPD"] },
    { causeName: "ต้องการแพทย์เฉพาะทาง", count: 280, hospitalName: "รพ.ศิริราช", supportedTypes: ["OPD", "IPD", "ER"] },
    { causeName: "เครื่องมือ/อุปกรณ์ไม่เพียงพอ", count: 245, hospitalName: "รพ.จุฬาลงกรณ์", supportedTypes: ["IPD", "ER"] },
    { causeName: "เครื่องมือ/อุปกรณ์ไม่เพียงพอ", count: 198, hospitalName: "รพ.ตากสิน", supportedTypes: ["OPD"] },
    { causeName: "เตียงเต็ม", count: 176, hospitalName: "รพ.พระมงกุฎเกล้า", supportedTypes: ["IPD"] },
    { causeName: "เตียงเต็ม", count: 152, hospitalName: "รพ.ราชวิถี", supportedTypes: ["IPD", "ER"] },
    { causeName: "ผู้ป่วยร้องขอ", count: 130, hospitalName: "รพ.ศิริราช", supportedTypes: ["OPD", "IPD"] },
    { causeName: "ผู้ป่วยร้องขอ", count: 98, hospitalName: "รพ.จุฬาลงกรณ์", supportedTypes: ["OPD"] },
    { causeName: "ใกล้บ้านผู้ป่วย", count: 85, hospitalName: "รพ.ลาดกระบังกรุงเทพมหานคร", supportedTypes: ["OPD", "IPD"] },
    { causeName: "ใกล้บ้านผู้ป่วย", count: 72, hospitalName: "รพ.สิรินธร", supportedTypes: ["OPD"] },
  ],
};

/* ── FrequentReasons (getTop5CommonReasons) ── */
export const MOCK_TOP5_COMMON_REASONS = {
  top5CommonReasons: [
    { reason: "ไม่มีแพทย์เฉพาะทาง", count: 285, hospitalName: "รพ.ตากสิน", supportedTypes: ["OPD", "IPD"] },
    { reason: "ไม่มีแพทย์เฉพาะทาง", count: 230, hospitalName: "รพ.เจริญกรุงประชารักษ์", supportedTypes: ["IPD", "ER"] },
    { reason: "เตียง ICU เต็ม", count: 198, hospitalName: "รพ.ราชวิถี", supportedTypes: ["IPD"] },
    { reason: "เตียง ICU เต็ม", count: 165, hospitalName: "รพ.พระมงกุฎเกล้า", supportedTypes: ["IPD", "ER"] },
    { reason: "ห้องผ่าตัดไม่ว่าง", count: 142, hospitalName: "รพ.ศิริราช", supportedTypes: ["IPD"] },
    { reason: "ห้องผ่าตัดไม่ว่าง", count: 118, hospitalName: "รพ.จุฬาลงกรณ์", supportedTypes: ["IPD"] },
    { reason: "ผู้ป่วยปฏิเสธการรักษา", count: 95, hospitalName: "รพ.สิรินธร", supportedTypes: ["OPD", "IPD"] },
    { reason: "ผู้ป่วยปฏิเสธการรักษา", count: 78, hospitalName: "รพ.หลวงพ่อทวีศักดิ์", supportedTypes: ["OPD"] },
    { reason: "รอผลตรวจนาน", count: 65, hospitalName: "รพ.ลาดกระบังกรุงเทพมหานคร", supportedTypes: ["OPD"] },
    { reason: "รอผลตรวจนาน", count: 52, hospitalName: "รพ.ตากสิน", supportedTypes: ["OPD", "IPD"] },
  ],
};
