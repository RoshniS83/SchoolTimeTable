export const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat"];
export const WD_PERIODS = 9;
export const SAT_PERIODS = 5;
export const BREAK_WD = 4;   // break after period index 4 (between P4 and P5)
export const BREAK_SAT = 3;  // break after period index 3 (between P3 and P4)
// NOTE: Saturday P5 (index 4) is a NORMAL period, NOT a zero period.
// Zero period only applies to Mon–Fri (P9, index 8).

export const CLASS_TEACHERS = {
  "1A":"Shital R","1B":"Shweta C","1C":"Mansi B","1D":"Jaya A","1E":"Rupali","1F":"Arti B",
  "2A":"Jayashree C","2B":"Pallavi C","2C":"Shital M","2D":"Kalpana C",
  "3A":"Madhuri T","3B":"Sasmita P","3C":"Nimisha T","3D":"Usha B",
  "4A":"Varsha K","4B":"Vrushali B","4C":"Prajakta R","4D":"Ujwalla S",
  "5A":"Tejal M","5B":"Keyur G","5C":"Kirti J","5D":"Dhanashree S",
  "6A":"Manjula R","6B":"Vijaya J","6C":"Sunayana P",
  "7A":"Tushar B","7B":"Sonali K","7C":"Mohini K",
  "8A":"Vidya S","8B":"Deepa K","8C":"Pooja S",
  "9A":"Dipali C","9B":"Sharvari","9C":"Lata D",
  "10A":"Mamta J","10B":"Shalaka P",
  "11Comm":"Sunayana L","11Sci":"Sapna V",
  "12Comm":"Sanjeevani C","12Sci":"Vivek D"
};

export const ALL_CLASSES = [
  "1A","1B","1C","1D","1E","1F",
  "2A","2B","2C","2D",
  "3A","3B","3C","3D",
  "4A","4B","4C","4D",
  "5A","5B","5C","5D",
  "6A","6B","6C",
  "7A","7B","7C",
  "8A","8B","8C",
  "9A","9B","9C",
  "10A","10B",
  "11Comm","11Sci",
  "12Comm","12Sci"
];

// ── OPTIONAL SUBJECT GROUPS for 11th/12th ────────────────────────────────────
// For classes 11Comm, 11Sci, 12Comm, 12Sci the "Hindi/IT/PE" slot is actually
// 3 parallel groups. Each period in that slot, 3 teachers are simultaneously
// teaching 3 different groups of students in the same class:
//   Group A → Hindi (Mamta J)
//   Group B → IT    (Varsha T)
//   Group C → PE    (New PE Teacher)
//
// We model this as 3 separate virtual subjects:
//   "Optional-Hindi", "Optional-IT", "Optional-PE"
// Each is assigned the respective teacher and scheduled at the SAME period slot.
// In the UI we show them as a single "stacked" optional cell.

export const OPTIONAL_GROUPS = {
  "11Comm": [
    {sub:"Optional-Hindi", teacher:"Mamta J"},
    {sub:"Optional-IT",    teacher:"Varsha T"},
    {sub:"Optional-PE",    teacher:"New PE Teacher"},
  ],
  "11Sci": [
    {sub:"Optional-Hindi", teacher:"Mamta J"},
    {sub:"Optional-IT",    teacher:"Varsha T"},
    {sub:"Optional-PE",    teacher:"New PE Teacher"},
  ],
  "12Comm": [
    {sub:"Optional-Hindi", teacher:"Mamta J"},
    {sub:"Optional-IT",    teacher:"Varsha T"},
    {sub:"Optional-PE",    teacher:"New PE Teacher"},
  ],
  "12Sci": [
    {sub:"Optional-Hindi", teacher:"Mamta J"},
    {sub:"Optional-IT",    teacher:"Varsha T"},
    {sub:"Optional-PE",    teacher:"New PE Teacher"},
  ],
};

export const TEACHER_SUBJECTS = [
  // Std 1-2 class teachers teach core
  {t:"Shital R",s:"Core",c:["1A"]},{t:"Shweta C",s:"Core",c:["1B"]},{t:"Mansi B",s:"Core",c:["1C"]},
  {t:"Jaya A",s:"Core",c:["1D"]},{t:"Rupali",s:"Core",c:["1E"]},{t:"Arti B",s:"Core",c:["1F"]},
  {t:"Jayashree C",s:"Core",c:["2A"]},{t:"Pallavi C",s:"Core",c:["2B"]},
  {t:"Shital M",s:"Core",c:["2C"]},{t:"Kalpana C",s:"Core",c:["2D"]},
  // English
  {t:"New Eng Teacher",s:"English",c:["9A","9B","9C","10A","10B","11Sci","11Comm","12Sci","12Comm"]},
  {t:"Mohini K",s:"English",c:["6A","7A","7B","7C","8A","8B","8C"]},
  {t:"Keyur G",s:"English",c:["4D","5A","5B","5C","5D","6B","6C"]},
  {t:"Madhuri B",s:"English",c:["3A","3B","3C","3D","4A","4B","4C"]},
  // Hindi (1-10)
  {t:"Mamta J",s:"Hindi",c:["10A","10B"]},
  // Mamta J also teaches Optional-Hindi for 11/12 (see OPTIONAL_GROUPS)
  {t:"Vidya S",s:"Hindi",c:["8A","8B","8C","9A","9B","9C"]},
  {t:"Sunayana P",s:"Hindi",c:["4D","6A","6B","6C","7A","7B","7C"]},
  {t:"Usha B",s:"Hindi",c:["3D","4A","4B","5A","5B","5C","5D"]},
  {t:"Ujwalla S",s:"Hindi",c:["2A","2B","3A","3B","3C","4C"]},
  {t:"New Hindi Teacher",s:"Hindi",c:["1A","1B","1C","1D","1E","1F","2C","2D"]},
  // Marathi
  {t:"Vijaya J",s:"Marathi",c:["7C","8A","8B","8C","9A","9B","9C","10A","10B"]},
  {t:"Pooja K",s:"Marathi",c:["1A","1B","1C","1D","1E","1F","4A","4B","4C","4D"]},
  {t:"Manjula R",s:"Marathi",c:["5A","5B","5C","5D","6A","6B","6C","7A","7B"]},
  {t:"Sonam M",s:"Marathi",c:["2A","2B","2C","2D","3A","3B","3C","3D"]},
  // Maths
  {t:"Rachna M",s:"Maths",c:["3A","3B","3C","3D","4A","4B"]},
  {t:"Prajakta R",s:"Maths",c:["4C","4D","5A","5B","5C","5D"]},
  {t:"Tushar B",s:"Maths",c:["7B","7C","8A","8B","8C"]},
  {t:"Pooja S",s:"Maths",c:["6A","6B","6C","7A"]},
  {t:"Dipali C",s:"Maths",c:["9A","9B","9C"]},
  {t:"Shalaka P",s:"Maths",c:["10A","10B","11Comm","11Sci","12Comm","12Sci"]},
  // Science (3-8)
  {t:"Varsha K",s:"Science",c:["3A","3B","3C","3D","4D"]},
  {t:"Tejal M",s:"Science",c:["4A","4B","4C","5A","5D"]},
  {t:"Kirti J",s:"Science",c:["5B","5C","6A","6B","6C"]},
  {t:"Deepa K",s:"Science",c:["7A","7B","7C","8B"]},
  {t:"Lata D",s:"Science",c:["8A","8C"]},
  // Physics
  {t:"Sharvari",s:"Physics",c:["9A","9B","9C","10A"]},
  {t:"Vivek D",s:"Physics",c:["10B","11Sci","12Sci"]},
  // Chemistry
  {t:"Sapna V",s:"Chemistry",c:["9A","9B","9C","11Sci"]},
  {t:"Sujata K",s:"Chemistry",c:["10A","10B","12Sci"]},
  // Biology
  {t:"Lata D",s:"Biology",c:["9A","9B","9C","11Sci"]},
  {t:"Sujata K",s:"Biology",c:["10A","10B","12Sci"]},
  // Deepa K removed for Biology 12Sci because Sujata K now holds it
  // SST (3-8)
  {t:"Sasmita P",s:"SST",c:["3A","3B","3C","3D","4A","4B","4C","4D"]},
  {t:"Reshma K",s:"SST",c:["5A","5B","5C","5D","6A","6B","6C"]},
  {t:"Archana K",s:"SST",c:["7A","7B","7C","8A","8B","8C"]},
  // History / Geography (9-10)
  {t:"Varsha D",s:"History",c:["9A","9B","9C","10A","10B"]},
  {t:"Varsha D",s:"Geography",c:["9A","9B","9C","10A","10B"]},
  // Economics
  {t:"Sanjeevani C",s:"Economics",c:["9A","9B","9C","12Comm"]},
  {t:"Sunayana L",s:"Economics",c:["10A","10B","11Comm","12Comm"]},
  // Commerce (11-12)
  {t:"Sanjeevani C",s:"Accounts",c:["11Comm","12Comm"]},
  {t:"Sunayana L",s:"BusinessStudies",c:["11Comm","12Comm"]},
  // IT (9-12) — FIX: Sonali K teaches IT (not Computer) for 9th std
  {t:"Varsha T",s:"IT",c:["10A","10B","11Comm","11Sci","12Comm","12Sci"]},
  {t:"Sonali K",s:"IT",c:["9A","9B","9C"]},
  // Computer (1-8) — renamed from old mixed usage
  {t:"Nimisha T",s:"Computer",c:["1A","1B","1C","1D","1E","1F","3A","3B","3C","3D"]},
  {t:"Computer NewTeacher",s:"Computer",c:["2A","2B","2C","2D","4A","4B","4C","4D"]},
  {t:"Dhanashree S",s:"Computer",c:["5A","5B","5C","5D","6A","6B","6C"]},
  {t:"Sonali K",s:"Computer",c:["7A","7B","7C","8A","8B","8C"]},
  // Robotics
  {t:"Dhanashree S",s:"Robotics",c:["1A","1B","1C","1D","1E","1F"]},
  {t:"Vaishali J",s:"Robotics",c:["2A","2B","2C","2D","3A","3B","3C","3D","4A","4B","4C","4D","5A","5B","5C","5D","6A","6B","6C","7A","7B","7C","8A","8B","8C"]},
  // Art
  {t:"Rasika K",s:"Art",c:["1A","1B","1C","1D","1E","1F","2A","2B","2C","2D","3A"]},
  {t:"Vaishali T",s:"Art",c:["3B","3C","3D","4A","4B","4C","4D","5A","5B","5C","5D","6A","6B","6C"]},
  {t:"Pallavi T",s:"Art",c:["7A","7B","7C","8A","8B","8C","9A","9B","9C","10A","10B"]},
  // PE (1-12)
  {t:"New PE Teacher2",s:"PE",c:["1A","1B","1C","1D","1E","1F","2A","2B","2C","2D","3A","3B","3C","3D","4C","4D"]},
  {t:"Ashish K",s:"PE",c:["4A","4B","5A","5B","5C","5D","6A","6B","6C","7A","7B","7C","8A","8B","8C"]},
  {t:"New PE Teacher",s:"PE",c:["9A","9B","9C","10A","10B"]},
  // New PE Teacher also handles Optional-PE for 11/12 (see OPTIONAL_GROUPS)
  // Library (1-10)
  {t:"Surekha G",s:"Library",c:[
    "1A","1B","1C","1D","1E","1F",
    "2A","2B","2C","2D",
    "3A","3B","3C","3D",
    "4A","4B","4C","4D",
    "5A","5B","5C","5D",
    "6A","6B","6C",
    "7A","7B","7C",
    "8A","8B","8C",
    "9A","9B","9C",
    "10A","10B"
  ]},
  // GK
  {t:"New GK Teacher",s:"GK",c:["3A","3B","3C","3D"]},
  {t:"Vrushali B",s:"GK",c:["4A","4B","4C","4D","5A","5B","5C","5D","6A","6B","6C","7A","7B","7C"]},
  // Music
  {t:"Akash S",s:"Music",c:["1A","1B","1C","1D","1E","1F","2A","2B","2C","2D","3A","3B","3C","3D","4A","4B","4C","4D"]},
  {t:"Sandesh J",s:"Music",c:["5A","5B","5C","5D","6A","6B","6C","7A","7B","7C","8A","8B","8C"]},
  // Aptitude Reasoning
  {t:"Savita P",s:"Aptitude Reasoning",c:["1A","1B","1C","1D","1E","1F","2A","2B","2C","2D","3A","3B","3C","3D","4A","4B","4C","4D","5A","5B","5C","5D","6A","6B","6C","7A","7B","7C","8A","8B","8C"]},
  // V.Ed (class teachers for 1-3)
  {t:"Shital R",s:"V.Ed",c:["1A"]},{t:"Shweta C",s:"V.Ed",c:["1B"]},{t:"Mansi B",s:"V.Ed",c:["1C"]},
  {t:"Jaya A",s:"V.Ed",c:["1D"]},{t:"Rupali",s:"V.Ed",c:["1E"]},{t:"Arti B",s:"V.Ed",c:["1F"]},
  {t:"Jayashree C",s:"V.Ed",c:["2A"]},{t:"Pallavi C",s:"V.Ed",c:["2B"]},{t:"Shital M",s:"V.Ed",c:["2C"]},{t:"Kalpana C",s:"V.Ed",c:["2D"]},
  {t:"Madhuri T",s:"V.Ed",c:["3A"]},{t:"Sasmita P",s:"V.Ed",c:["3B"]},{t:"Nimisha T",s:"V.Ed",c:["3C"]},{t:"Usha B",s:"V.Ed",c:["3D"]},
  // Optional subjects for 11/12 — combined into a single period with 3 teachers
  {t:"Mamta J,Varsha T,New PE Teacher",s:"IT/PE/Hindi",c:["11Comm","11Sci","12Comm","12Sci"]},
];

// ── Subject period counts per class ──────────────────────────────────────────
export function getSubjectPeriods(cls) {
  const g = parseInt(cls);
  if (g <= 2) return {
    English:8, Maths:7, EVS:7, Marathi:3, Hindi:3, GK:2,
    "V.Ed":2, Computer:3, Robotics:2, Art:2, PE:2, Music:2,
    Library:1, "Aptitude Reasoning":1
  };
  if (g === 3) return {
    English:5, Maths:7, EVS:5, SST:5, Marathi:3, Hindi:3, GK:2,
    "V.Ed":2, Computer:3, Robotics:2, Art:2, PE:2, Music:2,
    Library:1, "Aptitude Reasoning":1
  };
  if (g <= 8) return {
    English:5, Maths:7, Science:6, SST:5, Hindi:4, Marathi:3,
    Computer:3, GK:2, Robotics:2, Art:2, PE:2, Music:2,
    Library:1, "Aptitude Reasoning":1
  };
  if (g <= 10) return {
    Maths:6, English:5, History:4, Hindi:4, Geography:4,
    Physics:3, Chemistry:3, Biology:3, Marathi:3, IT:3,
    Art:2, PE:2, Economics:2, Library:1
  };
  // 11th / 12th: "IT/PE/Hindi" is a combined parallel group.
  if (cls.includes("Sci")) return {
    Physics:8, Chemistry:8, Biology:8, Maths:8, English:5,
    "IT/PE/Hindi":8
  };
  // 11Comm / 12Comm
  return {
    Accounts:11, BusinessStudies:11, Economics:10, English:5,
    "IT/PE/Hindi":8
  };
}

export function getTeacherForSubject(cls, sub) {
  const match = TEACHER_SUBJECTS.find(x => x.s === sub && x.c.includes(cls));
  return match ? match.t : null;
}

export function getAllTeacherNames() {
  const names = new Set();
  TEACHER_SUBJECTS.forEach(x => x.t.split(',').forEach(t => names.add(t.trim())));
  Object.values(CLASS_TEACHERS).forEach(n => names.add(n));
  return Array.from(names).sort();
}

// ── Colours ───────────────────────────────────────────────────────────────────
export const SUB_COLORS = {
  Maths:"#dbeafe", English:"#dcfce7", Hindi:"#fef9c3", Marathi:"#ede9fe",
  Science:"#d1fae5", Physics:"#dbeafe", Chemistry:"#fce7f3", Biology:"#dcfce7",
  SST:"#fef3c7", History:"#fef3c7", Geography:"#fef3c7", Economics:"#ede9fe",
  PE:"#d1fae5", Art:"#fce7f3", Music:"#ffedd5", Computer:"#dbeafe",
  IT:"#ede9fe", Library:"#fef9c3", Robotics:"#d1fae5", GK:"#dcfce7",
  "V.Ed":"#ede9fe", "Aptitude Reasoning":"#fef3c7", EVS:"#d1fae5",
  "IT/PE/Hindi":"#fef9c3",
  Accounts:"#dbeafe", BusinessStudies:"#dcfce7",
  "Zero Period":"#f1f5f9", Free:"#f9fafb", Core:"#dbeafe"
};
export const SUB_BORDER = {
  Maths:"#3b82f6", English:"#22c55e", Hindi:"#eab308", Marathi:"#8b5cf6",
  Science:"#10b981", Physics:"#3b82f6", Chemistry:"#ec4899", Biology:"#22c55e",
  SST:"#f59e0b", History:"#f59e0b", Geography:"#d97706", Economics:"#8b5cf6",
  PE:"#10b981", Art:"#ec4899", Music:"#f97316", Computer:"#3b82f6",
  IT:"#8b5cf6", Library:"#eab308", Robotics:"#10b981", GK:"#22c55e",
  "V.Ed":"#8b5cf6", "Aptitude Reasoning":"#f59e0b", EVS:"#10b981",
  "IT/PE/Hindi":"#eab308",
  Accounts:"#3b82f6", BusinessStudies:"#22c55e",
  "Zero Period":"#94a3b8", Free:"#d1d5db", Core:"#3b82f6"
};

export function getSubColor(sub) { return SUB_COLORS[sub] || "#f3f4f6"; }
export function getSubBorder(sub) { return SUB_BORDER[sub] || "#9ca3af"; }

// Human-friendly label for optional subjects
export function subDisplayLabel(sub) {
  return sub;
}

// ── Class / Division colour palette ──────────────────────────────────────────
// Each standard gets a distinct hue; divisions (A/B/C…) get lighter shades.
// Used in teacher master timetable so you can instantly spot which class is which.
const STD_HUE = {
  1: { bg:"#fef9c3", border:"#ca8a04", text:"#713f12" },   // amber
  2: { bg:"#ffedd5", border:"#ea580c", text:"#7c2d12" },   // orange
  3: { bg:"#fce7f3", border:"#db2777", text:"#831843" },   // pink
  4: { bg:"#ede9fe", border:"#7c3aed", text:"#4c1d95" },   // violet
  5: { bg:"#dbeafe", border:"#2563eb", text:"#1e3a8a" },   // blue
  6: { bg:"#d1fae5", border:"#059669", text:"#064e3b" },   // emerald
  7: { bg:"#cffafe", border:"#0891b2", text:"#164e63" },   // cyan
  8: { bg:"#e0f2fe", border:"#0284c7", text:"#0c4a6e" },   // sky
  9: { bg:"#dcfce7", border:"#16a34a", text:"#14532d" },   // green
  10:{ bg:"#fef3c7", border:"#d97706", text:"#78350f" },   // yellow
  11:{ bg:"#fee2e2", border:"#dc2626", text:"#7f1d1d" },   // red
  12:{ bg:"#f3e8ff", border:"#9333ea", text:"#581c87" },   // purple
};

export function getClassColor(cls) {
  const g = parseInt(cls);
  return STD_HUE[g] || { bg:"#f3f4f6", border:"#9ca3af", text:"#374151" };
}

// ── Hex utilities for Excel export ───────────────────────────────────────────
// openpyxl / SheetJS need 6-char hex without '#'
export function hexToExcel(hex) {
  return (hex || "#f3f4f6").replace("#","").toUpperCase().padEnd(6,"0");
}

// Subject → Excel fill colour (ARGB format for SheetJS)
export function subExcelFill(sub) {
  const hex = (SUB_COLORS[sub] || "#f3f4f6").replace("#","");
  return "FF" + hex.toUpperCase().padEnd(6,"0");
}
export function subExcelBorder(sub) {
  const hex = (SUB_BORDER[sub] || "#9ca3af").replace("#","");
  return "FF" + hex.toUpperCase().padEnd(6,"0");
}
export function classExcelFill(cls) {
  const c = getClassColor(cls);
  return "FF" + hexToExcel(c.bg);
}
