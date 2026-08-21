export interface PrevisaoMensal {
  readonly anoMes: string;
  readonly categoriaId: number | null;
  readonly entrada: number;
  readonly saida: number;
}
