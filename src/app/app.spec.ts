import { describe, it, expect } from 'vitest';
import { formatarMoeda, formatarDataCivil } from './shared/apresentacao';
describe('Apresentação financeira', () => {
  it('preserva null e zero', () => {
    expect(formatarMoeda(null)).toBe('Não informado');
    expect(formatarMoeda(0)).toContain('0,00');
  });
  it('mantém data civil', () => expect(formatarDataCivil('2026-10-07')).toBe('07/10/2026'));
});
