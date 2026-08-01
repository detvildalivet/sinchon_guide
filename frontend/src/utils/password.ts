/**
 * Password policy for account signup — mirrors backend/services/password.py.
 * See that module's docstring for the full reasoning (why "letter" means any
 * Unicode letter, why whitespace counts as no class, why length is capped).
 * The two are kept in sync by hand; there is no shared source of truth.
 *
 * Policy: 8-20 characters, and at least 2 of 3 character classes present
 * (letter / digit / symbol).
 */

export const MIN_LENGTH = 8;
export const MAX_LENGTH = 20;

export type PasswordChecks = {
  length: boolean;
  variety: boolean;
};

const LENGTH_ERROR = `비밀번호는 ${MIN_LENGTH}자 이상 ${MAX_LENGTH}자 이하여야 합니다.`;
const VARIETY_ERROR = '비밀번호는 영문·숫자·기호 중 2종 이상을 포함해야 합니다.';

const LETTER_RE = /\p{L}/u;
const DIGIT_RE = /\p{N}/u;
const SPACE_RE = /\s/;

function classesOf(password: string): Set<'letter' | 'digit' | 'symbol'> {
  const found = new Set<'letter' | 'digit' | 'symbol'>();
  for (const ch of password) {
    if (LETTER_RE.test(ch)) {
      found.add('letter');
    } else if (DIGIT_RE.test(ch)) {
      found.add('digit');
    } else if (!SPACE_RE.test(ch)) {
      found.add('symbol');
    }
  }
  return found;
}

// Drives the live signup checklist — each field ticks independently as the
// user types, rather than collapsing straight to a single pass/fail.
export function checkPassword(password: string): PasswordChecks {
  return {
    length: password.length >= MIN_LENGTH && password.length <= MAX_LENGTH,
    variety: classesOf(password).size >= 2,
  };
}

// Drives submit-time validation — a single Korean error message, or null if
// the password is acceptable.
export function passwordError(password: string): string | null {
  const checks = checkPassword(password);
  if (!checks.length) {
    return LENGTH_ERROR;
  }
  if (!checks.variety) {
    return VARIETY_ERROR;
  }
  return null;
}
