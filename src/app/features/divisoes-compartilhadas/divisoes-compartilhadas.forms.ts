import { inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Responsabilidade } from './divisoes-compartilhadas.api';
import { hoje } from '../../shared/apresentacao';

/** Editores tipados da jornada; HTTP e seleção permanecem no coordenador da página. */
export class FormulariosDivisoesCompartilhadas {
  private readonly fb = inject(FormBuilder);
  readonly participantes = this.fb.array([this.formularioParticipante()]);
  readonly formularioDivisao = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(120), Validators.pattern(/\S/)]],
    participantes: this.participantes,
  });
  readonly formularioPeriodo = this.fb.nonNullable.group({
    inicio: [hoje().slice(0, 8) + '01', Validators.required],
    fim: [hoje(), Validators.required],
  });
  readonly formularioAssociacao = this.fb.group({
    transacaoId: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    baseCompartilhada: this.fb.control<number | null>(null, Validators.min(0.01)),
  });
  readonly formularioConsulta = this.fb.group({
    transacaoId: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
  });
  readonly responsabilidades = this.fb.array<
    ReturnType<FormulariosDivisoesCompartilhadas['formularioResponsabilidade']>
  >([]);
  readonly formulariosAlocacao = this.fb.array([this.formularioAlocacao()]);
  readonly formularioReembolso = this.fb.group({
    transacaoId: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    recebedorId: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    valor: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
  });
  formularioParticipante(usuarioId: number | null = null, percentual: number | null = null) {
    return this.fb.group({
      usuarioId: this.fb.control(usuarioId, [Validators.required, Validators.min(1)]),
      percentual: this.fb.control(percentual, [Validators.min(0.01), Validators.max(100)]),
    });
  }
  formularioResponsabilidade() {
    return this.fb.group({
      usuarioId: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
      percentual: this.fb.control<number | null>(null, [Validators.min(0.01), Validators.max(100)]),
      valorDevido: this.fb.control<number | null>(null, Validators.min(0.01)),
    });
  }
  formularioAlocacao() {
    return this.fb.group({
      transacaoId: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
      valor: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    });
  }
  adicionarParticipante(): void {
    this.participantes.push(this.formularioParticipante());
    this.participantes.markAsDirty();
  }
  adicionarResponsabilidade(): void {
    this.responsabilidades.push(this.formularioResponsabilidade());
    this.responsabilidades.markAsDirty();
  }
  adicionarAlocacao(): void {
    this.formulariosAlocacao.push(this.formularioAlocacao());
    this.formulariosAlocacao.markAsDirty();
  }
  temAlteracoes(): boolean {
    return (
      this.formularioDivisao.dirty ||
      this.formularioAssociacao.dirty ||
      this.responsabilidades.dirty ||
      this.formulariosAlocacao.dirty ||
      this.formularioReembolso.dirty
    );
  }
  redefinirComandos(): void {
    this.formularioAssociacao.reset();
    this.formularioReembolso.reset();
    this.responsabilidades.clear();
    this.formulariosAlocacao.clear();
    this.formulariosAlocacao.push(this.formularioAlocacao());
    this.formularioDivisao.markAsPristine();
  }
  entradaResponsabilidades(informarErro: (mensagem: string) => void): Responsabilidade[] | null {
    this.responsabilidades.markAllAsTouched();
    if (this.responsabilidades.invalid) return null;
    const valores = this.responsabilidades.getRawValue();
    if (valores.some((valor) => valor.percentual === null && valor.valorDevido === null)) {
      informarErro(
        'Para cada responsabilidade, preencha percentual, valor devido ou ambos. Utilize a mesma modalidade em toda a lista.',
      );
      return null;
    }
    return valores.flatMap((valor) =>
      valor.usuarioId !== null
        ? [
            {
              usuarioId: valor.usuarioId,
              percentual: valor.percentual,
              valorDevido: valor.valorDevido,
            },
          ]
        : [],
    );
  }
}
