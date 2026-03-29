import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { DAYS, subDisplayLabel, subExcelFill, classExcelFill } from '../data/schoolData.js';
import { nPeriods, isZeroPeriodSlot } from './timetableEngine.js';

const applyStyle = (cell, fgColorHex, bold = false) => {
  cell.font = { name: 'Calibri', size: 10, bold, color: { argb: 'FF1E293B' } };
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  cell.border = {
    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
  };
  if (fgColorHex) {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: fgColorHex }
    };
  }
};

export const exportTeacherMasterToExcel = async (masterData) => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Teacher Master');

  // Build Headers
  const baseHeaders = ['Teacher'];
  DAYS.forEach(d => {
    const np = nPeriods(d);
    for (let p = 0; p < np; p++) {
      const isZ = isZeroPeriodSlot(d, p);
      baseHeaders.push(`${isZ ? 'Z' : 'P' + (p+1)}\n${d}`);
    }
  });
  baseHeaders.push('Total');
  const headerRow = ws.addRow(baseHeaders);
  headerRow.height = 30;
  headerRow.eachCell((cell, i) => {
    applyStyle(cell, i === 1 ? 'FFF8FAFC' : i === baseHeaders.length ? 'FFDBEAFE' : 'FFF1F5F9', true);
    if (i === baseHeaders.length) cell.font.color = { argb: 'FF1D4ED8' };
  });

  // Build Data Rows
  masterData.forEach(row => {
    const rowValues = [row.name];
    DAYS.forEach(d => {
      const np = nPeriods(d);
      for (let p = 0; p < np; p++) {
        const slot = row.days[d][p];
        if (slot) {
          rowValues.push(`${slot.cls}\n${subDisplayLabel(slot.sub)}`);
        } else {
          rowValues.push('—');
        }
      }
    });
    rowValues.push(row.total);
    const r = ws.addRow(rowValues);
    r.height = 36;
    
    // Apply styling per cell
    r.eachCell((cell, colNum) => {
      // rowValues mapped cells only
      if (colNum === 1) {
        applyStyle(cell, 'FFFFFFFF', true);
        cell.alignment.horizontal = 'left';
      } else if (colNum === baseHeaders.length) {
        applyStyle(cell, 'FFEFF6FF', true);
        cell.font.color = { argb: 'FF1D4ED8' };
      } else {
        // Data cell logic
        let cursor = 2;
        let found = false;
        DAYS.forEach(d => {
          if (found) return;
          const np = nPeriods(d);
          for(let p = 0; p < np; p++){
            if (cursor === colNum) {
               const slot = row.days[d][p];
               if (slot) {
                 applyStyle(cell, subExcelFill(slot.sub));
               } else {
                 applyStyle(cell, 'FFFFFFFF');
                 cell.font.color = { argb: 'FFCBD5E1' };
               }
               found = true;
            }
            cursor++;
          }
        });
      }
    });
  });

  // Adjust column widths
  ws.getColumn(1).width = 18;
  for (let i = 2; i < baseHeaders.length; i++) ws.getColumn(i).width = 12;
  ws.getColumn(baseHeaders.length).width = 8;

  const buffer = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), 'Teacher_Master_Timetable.xlsx');
};

export const exportClassMasterToExcel = async (timetable, allClassNames) => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Class Master');

  // Build Headers
  const baseHeaders = ['Class / Section'];
  DAYS.forEach(d => {
    const np = nPeriods(d);
    for(let p=0; p<np; p++) {
      const isZ = isZeroPeriodSlot(d, p);
      baseHeaders.push(`${isZ ? 'Z' : 'P' + (p+1)}\n${d}`);
    }
  });
  const headerRow = ws.addRow(baseHeaders);
  headerRow.height = 30;
  headerRow.eachCell((cell, i) => {
    applyStyle(cell, i === 1 ? 'FFF8FAFC' : 'FFF1F5F9', true);
  });

  // Build Data
  allClassNames.forEach(cls => {
    const rowValues = [cls];
    DAYS.forEach(d => {
      const np = nPeriods(d);
      for(let p=0; p<np; p++) {
        const slot = timetable[cls]?.[d]?.[p];
        if (slot && slot.sub !== 'Free') {
          rowValues.push(`${subDisplayLabel(slot.sub)}\n${slot.teacher}`);
        } else {
          rowValues.push('—');
        }
      }
    });
    const r = ws.addRow(rowValues);
    r.height = 36;
    
    r.eachCell((cell, colNum) => {
      if (colNum === 1) {
        applyStyle(cell, classExcelFill(cls), true);
      } else {
        let cursor = 2;
        let found = false;
        DAYS.forEach(d => {
          if(found) return;
          const np = nPeriods(d);
          for(let p=0; p<np; p++){
            if (cursor === colNum) {
               const slot = timetable[cls]?.[d]?.[p];
               if (slot && slot.sub !== 'Free') {
                 applyStyle(cell, subExcelFill(slot.sub));
               } else {
                 applyStyle(cell, 'FFFFFFFF');
                 cell.font.color = { argb: 'FFCBD5E1' };
               }
               found = true;
            }
            cursor++;
          }
        });
      }
    });
  });

  ws.getColumn(1).width = 16;
  for (let i = 2; i <= baseHeaders.length; i++) ws.getColumn(i).width = 14;

  const buffer = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), 'Class_Master_Timetable.xlsx');
};
