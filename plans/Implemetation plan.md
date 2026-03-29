# Implementation Plan: Classes Master Timetable & Excel Export

This plan implements a full "Classes Master Timetable" UI matching the Teacher Master view, alongside robust Excel `.xlsx` downloading for both master tables.

## User Review Required

> [!WARNING]  
> **Dependency Addition**  
> To create beautifully formatted `.xlsx` files that retain the specific cell background and text colors from your timetables (like the blue for Maths, green for Science), the standard array-to-csv method isn't enough.
> 
> I propose installing **`exceljs`** and **`file-saver`**. `exceljs` allows writing rich Excel sheets with exact background coloring (utilizing the hex codes you already mapped in `schoolData.js`), borders, aligned text, and automatic column widths directly from the browser. 
> 
> Do you approve the addition of `exceljs` and `file-saver` to `package.json`?

## Proposed Changes

---

### UI & Navigation (`src/App.jsx`)
- **Add to Sidebar Navigation**: Introduce a new navigation item: `Classes Master` alongside `Teacher Master Timetable`.
- **Classes Master View**: Duplicate the tabular structure of the existing Master Timetable but invert the rendering. 
  - **Rows**: The 40 distinct classes (1A to 12Sci).
  - **Columns**: Days and Periods.
  - **Cells**: Displaying the `Subject` and the assigned `Teacher`.
- **Download Buttons**: Add a 📥 **Download Excel** button next to the "Print / PDF" buttons on both Master views.

### Logic & Export Capabilities
- **New File `src/utils/excelExport.js`**: Create a helper script containing two main functions:
  1. `exportTeacherMaster(masterData, ...)`
  2. `exportClassMaster(timetable, ...)`
- **Styling**: Both functions will map the JS data into `exceljs` spreadsheet cells, applying the specific background colors, borders, and text labels (including the `subDisplayLabel` and 'Z' for zero periods). The output perfectly mirrors the visual grid.

## Open Questions

- Should the downloaded Excel file contain just the one sheet of the timetable, or do you want a 2-sheet workbook containing both the Teacher Master and the Class Master simultaneously whenever either is downloaded? (Currently planning 1 sheet per download matching what they are viewing).

## Verification Plan

- Run `npm install` for `exceljs` and `file-saver`.
- Verify the web UI renders the new "Classes Master Timetable" segment.
- Manually trigger the Excel download button and verify the `.xlsx` file cleanly opens in Microsoft Excel/Google Sheets with correct structural layout and styling.






# Personal Timetable Visibility Fix

I noticed why the shared 11th and 12th subjects weren't appearing in the personal timetables for Mamta J, Varsha T, and the PE teacher. 

While the actual engine correctly allocated constraints by parsing names, the **viewer utility functions** responsible for reading the final generated timetable data and displaying it in the UI were still strictly checking: `if (slot.teacher === "Mamta J")`. 

Because the slot teacher was literally `"Mamta J,Varsha T,New PE Teacher"`, the strict equality meant the UI filtered it out completely, making it invisible on their personal views!

## The Fix
I updated the following display utilities:
- `getTeacherTimetable`
- `buildMasterTimetable`
- `getFreeTeachersAtSlot`
- `getSubstituteRanking`

Instead of strict equality, they now parse the `slot.teacher` attribute into an array on-the-fly, allowing any teacher in a comma-separated string to claim their ownership of the period visually.

## Multiple Classes Enhancement
Previously, if a teacher taught multiple classes at exactly the same time, the Teacher Master Timetable would randomly pick just *one* of the class names to display in the cell (e.g. `11Comm`). 
I've upgraded `buildMasterTimetable` to seamlessly join array values! Now, the Master Timetable will correctly display `11Comm, 11Sci, 12Comm, 12Sci` right inside that one cell under Mamta J's column!

### Verification
You do **not** need to regenerate the timetable for this fix to apply! Just click the **Personal View** tab or **Teacher Master** tab right now, and you will see the changes instantly populated for Mamta J and Varsha T.
