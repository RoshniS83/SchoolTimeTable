// ─────────────────────────────────────────────────────────────────────────────
// FIXED COLOR SYSTEM
// Colors are permanent — same subject always same color everywhere in the app.
// ─────────────────────────────────────────────────────────────────────────────

// ── Subject colors ────────────────────────────────────────────────────────────
// bg = cell background, border = left accent, text = label color, hex = Excel fill
export const SUBJECT_COLORS = {
  // Core academic — blues
  Maths:              { bg:"#dbeafe", border:"#2563eb", text:"#1e3a8a", hex:"DBEAFE" },
  Physics:            { bg:"#e0f2fe", border:"#0284c7", text:"#0c4a6e", hex:"E0F2FE" },
  Chemistry:          { bg:"#f0f9ff", border:"#0ea5e9", text:"#075985", hex:"F0F9FF" },
  Biology:            { bg:"#d1fae5", border:"#059669", text:"#064e3b", hex:"D1FAE5" },
  Science:            { bg:"#ccfbf1", border:"#0d9488", text:"#134e4a", hex:"CCFBF1" },
  EVS:                { bg:"#d1fae5", border:"#10b981", text:"#065f46", hex:"D1FAE5" },

  // Languages — greens
  English:            { bg:"#dcfce7", border:"#16a34a", text:"#14532d", hex:"DCFCE7" },
  Hindi:              { bg:"#bbf7d0", border:"#15803d", text:"#14532d", hex:"BBF7D0" },
  Marathi:            { bg:"#d1fae5", border:"#059669", text:"#064e3b", hex:"D1FAE5" },
  "Optional-Hindi":   { bg:"#bbf7d0", border:"#15803d", text:"#14532d", hex:"BBF7D0" },

  // Social/Commerce — ambers/yellows
  SST:                { bg:"#fef3c7", border:"#d97706", text:"#78350f", hex:"FEF3C7" },
  History:            { bg:"#fef9c3", border:"#ca8a04", text:"#713f12", hex:"FEF9C3" },
  Geography:          { bg:"#fef08a", border:"#eab308", text:"#713f12", hex:"FEF08A" },
  Economics:          { bg:"#fef3c7", border:"#f59e0b", text:"#78350f", hex:"FEF3C7" },
  Accounts:           { bg:"#fffbeb", border:"#f59e0b", text:"#78350f", hex:"FFFBEB" },
  BusinessStudies:    { bg:"#fef9c3", border:"#ca8a04", text:"#713f12", hex:"FEF9C3" },

  // Tech — purples/indigos
  Computer:           { bg:"#ede9fe", border:"#7c3aed", text:"#3b0764", hex:"EDE9FE" },
  IT:                 { bg:"#e0e7ff", border:"#4f46e5", text:"#1e1b4b", hex:"E0E7FF" },
  Robotics:           { bg:"#ddd6fe", border:"#7c3aed", text:"#4c1d95", hex:"DDD6FE" },
  "Optional-IT":      { bg:"#e0e7ff", border:"#4f46e5", text:"#1e1b4b", hex:"E0E7FF" },

  // Activity/Arts — pinks/oranges (relaxing colors)
  Art:                { bg:"#fce7f3", border:"#db2777", text:"#831843", hex:"FCE7F3" },
  Music:              { bg:"#ffedd5", border:"#ea580c", text:"#7c2d12", hex:"FFEDD5" },
  PE:                 { bg:"#dcfce7", border:"#16a34a", text:"#14532d", hex:"DCFCE7" },
  "Optional-PE":      { bg:"#dcfce7", border:"#16a34a", text:"#14532d", hex:"DCFCE7" },
  Library:            { bg:"#fef9c3", border:"#eab308", text:"#713f12", hex:"FEF9C3" },
  GK:                 { bg:"#e0f2fe", border:"#0284c7", text:"#0c4a6e", hex:"E0F2FE" },
  "Aptitude Reasoning":{ bg:"#fdf4ff", border:"#a855f7", text:"#581c87", hex:"FDF4FF" },

  // Special
  "V.Ed":             { bg:"#f3e8ff", border:"#9333ea", text:"#581c87", hex:"F3E8FF" },
  Core:               { bg:"#dbeafe", border:"#2563eb", text:"#1e3a8a", hex:"DBEAFE" },
  "Zero Period":      { bg:"#f1f5f9", border:"#94a3b8", text:"#475569", hex:"F1F5F9" },
  Free:               { bg:"#f9fafb", border:"#e5e7eb", text:"#9ca3af", hex:"F9FAFB" },
};

// Default fallback
export const DEFAULT_SUBJECT_COLOR = { bg:"#f3f4f6", border:"#9ca3af", text:"#374151", hex:"F3F4F6" };

export function getSubjectColor(sub) {
  return SUBJECT_COLORS[sub] || DEFAULT_SUBJECT_COLOR;
}

// Convenience wrappers (backwards compat)
export function getSubColor(sub)  { return getSubjectColor(sub).bg; }
export function getSubBorder(sub) { return getSubjectColor(sub).border; }

// ── Class/Division colors ─────────────────────────────────────────────────────
// Used in teacher's master timetable — same class always same color
// Groups by standard: each std gets a hue family, divisions get shades within it
const CLASS_COLOR_MAP = {
  // Std 1 — sky blues
  "1A":{ bg:"#bfdbfe", border:"#3b82f6", text:"#1e3a8a", hex:"BFDBFE" },
  "1B":{ bg:"#93c5fd", border:"#2563eb", text:"#1e3a8a", hex:"93C5FD" },
  "1C":{ bg:"#60a5fa", border:"#1d4ed8", text:"#eff6ff", hex:"60A5FA" },
  "1D":{ bg:"#bfdbfe", border:"#3b82f6", text:"#1e3a8a", hex:"BFDBFE" },
  "1E":{ bg:"#93c5fd", border:"#2563eb", text:"#1e3a8a", hex:"93C5FD" },
  "1F":{ bg:"#60a5fa", border:"#1d4ed8", text:"#eff6ff", hex:"60A5FA" },
  // Std 2 — indigos
  "2A":{ bg:"#c7d2fe", border:"#6366f1", text:"#1e1b4b", hex:"C7D2FE" },
  "2B":{ bg:"#a5b4fc", border:"#4f46e5", text:"#1e1b4b", hex:"A5B4FC" },
  "2C":{ bg:"#818cf8", border:"#3730a3", text:"#eff6ff", hex:"818CF8" },
  "2D":{ bg:"#c7d2fe", border:"#6366f1", text:"#1e1b4b", hex:"C7D2FE" },
  // Std 3 — violets
  "3A":{ bg:"#ddd6fe", border:"#7c3aed", text:"#2e1065", hex:"DDD6FE" },
  "3B":{ bg:"#c4b5fd", border:"#6d28d9", text:"#2e1065", hex:"C4B5FD" },
  "3C":{ bg:"#a78bfa", border:"#5b21b6", text:"#ede9fe", hex:"A78BFA" },
  "3D":{ bg:"#ddd6fe", border:"#7c3aed", text:"#2e1065", hex:"DDD6FE" },
  // Std 4 — pinks
  "4A":{ bg:"#fbcfe8", border:"#db2777", text:"#500724", hex:"FBCFE8" },
  "4B":{ bg:"#f9a8d4", border:"#be185d", text:"#500724", hex:"F9A8D4" },
  "4C":{ bg:"#f472b6", border:"#9d174d", text:"#fdf2f8", hex:"F472B6" },
  "4D":{ bg:"#fbcfe8", border:"#db2777", text:"#500724", hex:"FBCFE8" },
  // Std 5 — roses
  "5A":{ bg:"#fecdd3", border:"#e11d48", text:"#4c0519", hex:"FECDD3" },
  "5B":{ bg:"#fda4af", border:"#be123c", text:"#4c0519", hex:"FDA4AF" },
  "5C":{ bg:"#fb7185", border:"#9f1239", text:"#fff1f2", hex:"FB7185" },
  "5D":{ bg:"#fecdd3", border:"#e11d48", text:"#4c0519", hex:"FECDD3" },
  // Std 6 — oranges
  "6A":{ bg:"#fed7aa", border:"#ea580c", text:"#431407", hex:"FED7AA" },
  "6B":{ bg:"#fdba74", border:"#c2410c", text:"#431407", hex:"FDBA74" },
  "6C":{ bg:"#fb923c", border:"#9a3412", text:"#fff7ed", hex:"FB923C" },
  // Std 7 — ambers
  "7A":{ bg:"#fde68a", border:"#d97706", text:"#451a03", hex:"FDE68A" },
  "7B":{ bg:"#fcd34d", border:"#b45309", text:"#451a03", hex:"FCD34D" },
  "7C":{ bg:"#fbbf24", border:"#92400e", text:"#fffbeb", hex:"FBBF24" },
  // Std 8 — limes
  "8A":{ bg:"#d9f99d", border:"#65a30d", text:"#1a2e05", hex:"D9F99D" },
  "8B":{ bg:"#bef264", border:"#4d7c0f", text:"#1a2e05", hex:"BEF264" },
  "8C":{ bg:"#a3e635", border:"#3f6212", text:"#1a2e05", hex:"A3E635" },
  // Std 9 — emeralds
  "9A":{ bg:"#a7f3d0", border:"#059669", text:"#022c22", hex:"A7F3D0" },
  "9B":{ bg:"#6ee7b7", border:"#047857", text:"#022c22", hex:"6EE7B7" },
  "9C":{ bg:"#34d399", border:"#065f46", text:"#022c22", hex:"34D399" },
  // Std 10 — teals
  "10A":{ bg:"#99f6e4", border:"#0d9488", text:"#042f2e", hex:"99F6E4" },
  "10B":{ bg:"#5eead4", border:"#0f766e", text:"#042f2e", hex:"5EEAD4" },
  // Std 11 — cyans
  "11Comm":{ bg:"#cffafe", border:"#0891b2", text:"#083344", hex:"CFFAFE" },
  "11Sci":{ bg:"#a5f3fc", border:"#0e7490", text:"#083344", hex:"A5F3FC" },
  // Std 12 — slates
  "12Comm":{ bg:"#e2e8f0", border:"#475569", text:"#0f172a", hex:"E2E8F0" },
  "12Sci":{ bg:"#cbd5e1", border:"#334155", text:"#0f172a", hex:"CBD5E1" },
};

const DEFAULT_CLASS_COLOR = { bg:"#f1f5f9", border:"#94a3b8", text:"#334155", hex:"F1F5F9" };

export function getClassColor(cls) {
  return CLASS_COLOR_MAP[cls] || DEFAULT_CLASS_COLOR;
}

// Export for Excel use
export { CLASS_COLOR_MAP };
