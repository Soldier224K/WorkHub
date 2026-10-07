import * as chrono from 'chrono-node';

export interface ParsedCommand {
  spaceQuery?: string;
  start?: Date;
  end?: Date;
  action?: 'book' | 'checkin' | 'pass' | 'invite';
  guestName?: string;
}

export const parseCommand = (input: string): ParsedCommand => {
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();

  if (lower.startsWith('check in') || lower === 'checkin') {
    return { action: 'checkin' };
  }
  if (lower.startsWith('my pass') || lower === 'pass') {
    return { action: 'pass' };
  }

  // Parse invite e.g. "invite Sarah to B3"
  const inviteMatch = trimmed.match(/^invite\s+([A-Za-z0-9_\s]+?)\s+to\s+([A-Za-z0-9]+)/i);
  if (inviteMatch) {
    return {
      action: 'invite',
      guestName: inviteMatch[1].trim(),
      spaceQuery: inviteMatch[2].trim(),
    };
  }

  // Parse natural booking command: e.g. "A12 tomorrow 2-5" or "Desk B3 today 2pm to 4pm"
  const spaceMatch = trimmed.match(/^([A-Za-z]+(?:\s*[0-9]+)?|[A-Za-z0-9_\s]+?)\s+(today|tomorrow|next|on|\d{1,2}|at|from)/i);
  let spaceQuery = '';
  let timeText = trimmed;

  if (spaceMatch) {
    spaceQuery = spaceMatch[1].trim();
    timeText = trimmed.slice(spaceMatch[1].length).trim();
  } else {
    const firstWord = trimmed.split(' ')[0];
    spaceQuery = firstWord;
    timeText = trimmed.slice(firstWord.length).trim();
  }

  const results = chrono.parse(timeText);
  if (results.length > 0) {
    const result = results[0];
    let start = result.start.date();
    let end = result.end ? result.end.date() : new Date(start.getTime() + 60 * 60 * 1000);

    // Snap to 30 minute boundaries
    const startMinutes = start.getMinutes();
    start.setMinutes(startMinutes < 30 ? 0 : 30, 0, 0);

    const endMinutes = end.getMinutes();
    end.setMinutes(endMinutes < 30 ? 0 : 30, 0, 0);

    // Guarantee end > start
    if (end.getTime() <= start.getTime()) {
      end = new Date(start.getTime() + 60 * 60 * 1000);
    }

    return {
      action: 'book',
      spaceQuery,
      start,
      end,
    };
  }

  return {
    action: 'book',
    spaceQuery,
  };
};
