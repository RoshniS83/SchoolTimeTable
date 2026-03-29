import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { DAYS, WD_PERIODS, SAT_PERIODS, BREAK_WD, BREAK_SAT } from '../data/schoolData.js';
import { getSubColor, getSubBorder } from '../data/schoolData.js';

const nP = d => d === "Sat" ? SAT_PERIODS : WD_PERIODS;
const brk = d => d === "Sat" ? BREAK_SAT : BREAK_WD;

function PeriodLabel({ pi, day }) {
  const periods = nP(day);
  if (pi === periods - 1) return 'Zero';
  return `P${pi + 1}`;
}

export function TimetableGrid({ timetable, cls, title, showTeacher = true }) {
  const printRef = useRef();
  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: title || 'Timetable' });

  const th = {
    padding: '7px 10px',
    background: '#f8fafc',
    border: '1px solid #e5e7eb',
    fontWeight: 600,
    fontSize: 12,
    color: '#374151',
    whiteSpace: 'nowrap',
    textAlign: 'center',
  };
  const td = {
    padding: 4,
    border: '1px solid #e5e7eb',
    minWidth: 90,
    verticalAlign: 'top',
  };
  const breakTd = {
    padding: '4px 0',
    border: '1px solid #e5e7eb',
    background: '#f8fafc',
    textAlign: 'center',
    fontSize: 11,
    color: '#9ca3af',
    letterSpacing: 2,
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }} className="no-print">
        <button
          onClick={handlePrint}
          style={{
            padding: '6px 16px', borderRadius: 7, border: '1px solid #e5e7eb',
            background: '#fff', cursor: 'pointer', fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
          }}
        >
          🖨️ Print / PDF
        </button>
      </div>
      <div ref={printRef} className="print-area" style={{ overflowX: 'auto' }}>
        {title && (
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 10, padding: '0 2px' }}>
            {title}
          </div>
        )}
        <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%', minWidth: 600 }}>
          <thead>
            <tr>
              <th style={{ ...th, width: 70 }}>Period</th>
              {DAYS.map(d => <th key={d} style={th}>{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: WD_PERIODS }).map((_, pi) => (
              <React.Fragment key={pi}>
                {pi === BREAK_WD && (
                  <tr>
                    <td colSpan={7} style={breakTd}>— BREAK —</td>
                  </tr>
                )}
                <tr>
                  <td style={{
                    ...td, background: '#f8fafc', fontWeight: 600,
                    fontSize: 12, textAlign: 'center', color: '#374151'
                  }}>
                    {pi === WD_PERIODS - 1 ? 'Zero' : `P${pi + 1}`}
                  </td>
                  {DAYS.map(d => {
                    const periods = nP(d);
                    if (pi >= periods) {
                      return <td key={d} style={{ ...td, background: '#f9fafb', textAlign: 'center' }}>
                        <span style={{ color: '#d1d5db', fontSize: 11 }}>—</span>
                      </td>;
                    }
                    const slot = cls
                      ? timetable?.[cls]?.[d]?.[pi]
                      : timetable?.[d]?.[pi];
                    return (
                      <td key={d} style={td}>
                        {slot && slot.sub !== 'Free' ? (
                          <div style={{
                            background: getSubColor(slot.sub),
                            borderLeft: `3px solid ${getSubBorder(slot.sub)}`,
                            borderRadius: 5,
                            padding: '4px 6px',
                            minHeight: 38,
                          }}>
                            <div style={{ fontWeight: 600, fontSize: 11 }}>
                              {slot.cls || slot.sub}
                            </div>
                            <div style={{ fontSize: 10, color: '#6b7280', marginTop: 1 }}>
                              {slot.cls ? slot.sub : (showTeacher ? slot.teacher : '')}
                            </div>
                            {slot.isZero && (
                              <div style={{ fontSize: 9, color: '#94a3b8' }}>Zero Period</div>
                            )}
                          </div>
                        ) : (
                          <div style={{ padding: '4px 6px', color: '#d1d5db', fontSize: 11, textAlign: 'center' }}>
                            Free
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
