const { toSlotKeys, isSlotAligned, slotToDate, formatDateToSlotKey } = require('../../src/shared/slots');

describe('Unit: Slots Helper & Engine', () => {
  test('correctly identifies 30-minute aligned dates', () => {
    expect(isSlotAligned(new Date('2026-10-04T10:00:00.000Z'))).toBe(true);
    expect(isSlotAligned(new Date('2026-10-04T10:30:00.000Z'))).toBe(true);
    expect(isSlotAligned(new Date('2026-10-04T10:15:00.000Z'))).toBe(false);
    expect(isSlotAligned(new Date('2026-10-04T10:00:05.000Z'))).toBe(false);
  });

  test('generates expected slot keys for 2-hour duration', () => {
    const start = '2026-10-04T10:00:00.000Z';
    const end = '2026-10-04T12:00:00.000Z';
    const keys = toSlotKeys(start, end);

    expect(keys).toEqual([
      '2026-10-04T10:00',
      '2026-10-04T10:30',
      '2026-10-04T11:00',
      '2026-10-04T11:30',
    ]);
  });

  test('back-to-back bookings share zero slot keys', () => {
    const slotKeys1 = toSlotKeys('2026-10-04T10:00:00.000Z', '2026-10-04T11:00:00.000Z');
    const slotKeys2 = toSlotKeys('2026-10-04T11:00:00.000Z', '2026-10-04T12:00:00.000Z');

    const overlap = slotKeys1.filter((k) => slotKeys2.includes(k));
    expect(overlap).toHaveLength(0);
  });

  test('rejects unaligned booking start or end', () => {
    expect(() => {
      toSlotKeys('2026-10-04T10:15:00.000Z', '2026-10-04T11:00:00.000Z');
    }).toThrow(/30-minute/);
  });

  test('rejects end time before start time', () => {
    expect(() => {
      toSlotKeys('2026-10-04T12:00:00.000Z', '2026-10-04T10:00:00.000Z');
    }).toThrow(/strictly after/);
  });
});
