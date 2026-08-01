/**
 * @format
 *
 * Tests for src/utils/password.ts. Case table intentionally mirrors
 * backend/tests/test_password.py so the two implementations of the same
 * policy are checked against the same examples (there's no shared source
 * of truth between the languages, so this is how parity is enforced).
 */
import { MAX_LENGTH, MIN_LENGTH, checkPassword, passwordError } from '../src/utils/password';

describe('passwords with two classes are accepted', () => {
  const accepted = [
    'sinchon12', // letter + digit
    'Guide!!!', // letter + symbol
    '신촌가이드좋아요1', // Korean letters + digit
    '12345678!', // digit + symbol
    'a'.repeat(MIN_LENGTH - 2) + '1!', // exactly at the short end, 2 classes
    'A'.repeat(MAX_LENGTH - 1) + '1', // exactly at the long end, 2 classes
  ];

  test.each(accepted)('%s', password => {
    expect(passwordError(password)).toBeNull();
    const checks = checkPassword(password);
    expect(checks.length).toBe(true);
    expect(checks.variety).toBe(true);
  });
});

describe('single-class passwords are rejected', () => {
  const rejected = [
    'aaaaaaaa', // letters only — the motivating case
    'abcdefgh',
    '12345678',
    '!!!!!!!!',
    '        ', // whitespace only — no class at all
  ];

  test.each(rejected)('%s', password => {
    const error = passwordError(password);
    expect(error).not.toBeNull();
    expect(error).toContain('2종');
    expect(checkPassword(password).variety).toBe(false);
  });
});

describe('too-short passwords are rejected', () => {
  const tooShort = ['a1', 'a1!', 'a'.repeat(MIN_LENGTH - 1)];

  test.each(tooShort)('%s', password => {
    const error = passwordError(password);
    expect(error).not.toBeNull();
    expect(error).toContain(String(MIN_LENGTH));
    expect(checkPassword(password).length).toBe(false);
  });
});

test('too-long password is rejected', () => {
  const password = 'a1'.repeat(MAX_LENGTH / 2 + 1); // 2 classes, but over MAX_LENGTH
  expect(password.length).toBeGreaterThan(MAX_LENGTH);
  const error = passwordError(password);
  expect(error).not.toBeNull();
  expect(error).toContain(String(MAX_LENGTH));
  expect(checkPassword(password).length).toBe(false);
});
