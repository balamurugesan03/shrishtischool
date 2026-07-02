// Each student scans 5 times a day, in this fixed order — the Nth scan
// of the day always maps to the Nth step here, regardless of clock time.
const SCAN_SEQUENCE = [
  { label: 'Entered',            type: 'IN',  breakLabel: null },
  { label: 'Mid Morning Break',  type: 'OUT', breakLabel: 'Mid Morning Break' },
  { label: 'Lunch Break',        type: 'OUT', breakLabel: 'Lunch Break' },
  { label: 'Afternoon Break',    type: 'OUT', breakLabel: 'Afternoon Break' },
  { label: 'Left',               type: 'OUT', breakLabel: null },
];

// scanIndex is 0-based (0 = first scan of the day). Cycles back to
// 'Entered' if a student somehow scans more than 5 times in a day.
function getScanStep(scanIndex) {
  return SCAN_SEQUENCE[scanIndex % SCAN_SEQUENCE.length];
}

module.exports = { SCAN_SEQUENCE, getScanStep };
