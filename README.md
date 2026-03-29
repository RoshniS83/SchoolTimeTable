# DCPEMS School Timetable Manager

A React + Vite app for managing school timetables, built for DCPEMS.

## Features
- 🔐 Role-based login (Admin PIN + Teacher name select)
- 📋 Class-wise timetable (grid + list view)
- 👤 Teacher-wise timetable
- 🙋 Personal timetable with WhatsApp share
- ✅ Free teachers per period
- 🔄 Substitution finder (rule-based, AI-ready)
- 🖨️ Print / PDF export on every view
- 💾 Timetable persisted in localStorage

---

## Local Development

```bash
npm install
npm run dev
```
Open http://localhost:5173

---

## Deploy to Vercel (Free)

### Option A — Vercel CLI (fastest)
```bash
npm install -g vercel
vercel
```
Follow prompts. Done!

### Option B — GitHub + Vercel Dashboard
1. Push this folder to a GitHub repo
2. Go to https://vercel.com → New Project → Import your repo
3. Framework preset: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`
6. Click **Deploy**

---

## Change Admin PIN
Edit `src/hooks/useAuth.jsx`, line:
```js
const ADMIN_PIN = '1234';
```
Change to a secure PIN before deploying.

---

## Adding AI Substitution (Future)
The substitution engine is in `src/utils/timetableEngine.js` → `getSubstituteRanking()`.
Replace the rule-based logic with a call to the Anthropic API (already hooked up in the component via `SubstitutionPanel.jsx`).

---

## File Structure
```
src/
  App.jsx                    # Main app + all views
  index.css                  # Global styles
  data/
    schoolData.js            # All teachers, classes, subjects
  utils/
    timetableEngine.js       # Generation + substitution logic
  hooks/
    useLocalStorage.js       # Persistence hook
    useAuth.jsx              # Auth context
  components/
    LoginScreen.jsx          # Login UI
    SubstitutionPanel.jsx    # Substitution finder
    TimetableGrid.jsx        # Reusable table (optional)
```
