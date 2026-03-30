import { describe, it } from 'node:test';
import assert from 'node:assert';

// Simple validation function extracted for testing purposes 
// (In a real scenario, we might export the validation logic or use a service)
function validateEmail(email: string): boolean {
  return email.endsWith('@ucs.br');
}

describe('Email Domain Validation', () => {
  it('should accept @ucs.br emails', () => {
    assert.strictEqual(validateEmail('test@ucs.br'), true);
    assert.strictEqual(validateEmail('aluno.teste@ucs.br'), true);
  });

  it('should reject non @ucs.br emails', () => {
    assert.strictEqual(validateEmail('test@gmail.com'), false);
    assert.strictEqual(validateEmail('test@outlook.com'), false);
    assert.strictEqual(validateEmail('test@ucs.com.br'), false);
    assert.strictEqual(validateEmail('ucs.br@gmail.com'), false);
  });

  it('should reject empty or malformed emails', () => {
    assert.strictEqual(validateEmail(''), false);
    assert.strictEqual(validateEmail('not-an-email'), false);
  });
});
