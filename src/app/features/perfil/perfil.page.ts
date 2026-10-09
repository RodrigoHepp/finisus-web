import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Router } from '@angular/router';
import { Observable, finalize } from 'rxjs';
import { PerfilUsuarioSolicitacaoResponse } from '../../infraestrutura/api/backend.dtos';
import { SessaoService } from '../../infraestrutura/sessao/sessao.service';
import { formatarDataCivil, mensagemErro, status } from '../../shared/apresentacao';
import { PerfilApi } from './perfil.api';
@Component({
  selector: 'fin-perfil-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
  ],
  templateUrl: './perfil.page.html',
})
export class PerfilPage {
  private readonly api = inject(PerfilApi);
  private readonly sessao = inject(SessaoService);
  private readonly router = inject(Router);
  private readonly referenciaDestruicao = inject(DestroyRef);
  readonly ocupado = signal(false);
  readonly erro = signal('');
  readonly sucesso = signal('');
  readonly solicitacoes = signal<PerfilUsuarioSolicitacaoResponse[]>([]);
  readonly aceita = signal(false);
  readonly carregado = signal(false);
  readonly confirmarInativacao = signal(false);
  readonly formulario = inject(FormBuilder).nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(150), Validators.pattern(/\S/)]],
    email: ['', [Validators.required, Validators.email]],
  });
  readonly privacidade = inject(FormBuilder).nonNullable.group({
    motivo: ['', [Validators.required, Validators.maxLength(500), Validators.pattern(/\S/)]],
  });
  readonly dataCivil = formatarDataCivil;
  readonly status = status;
  constructor() {
    this.carregar();
  }
  carregar() {
    this.executar(this.api.consultar(), (valor) => {
      this.formulario.reset({ nome: valor.nome ?? '', email: valor.email ?? '' });
      this.carregado.set(true);
    });
    this.api
      .consultarPreferencia()
      .pipe(takeUntilDestroyed(this.referenciaDestruicao))
      .subscribe({
        next: (v) => this.aceita.set(v.aceita),
        error: (e: unknown) => this.erro.set(mensagemErro(e)),
      });
    this.carregarSolicitacoes();
  }
  private carregarSolicitacoes() {
    this.api
      .solicitacoes()
      .pipe(takeUntilDestroyed(this.referenciaDestruicao))
      .subscribe({
        next: (v) => this.solicitacoes.set(v),
        error: (e: unknown) => this.erro.set(mensagemErro(e)),
      });
  }
  salvar() {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid || this.ocupado()) return;
    const enviado = this.formulario.getRawValue();
    this.executar(this.api.atualizar(enviado), (valor) => {
      if (JSON.stringify(this.formulario.getRawValue()) !== JSON.stringify(enviado)) {
        this.sucesso.set('Perfil atualizado. Há alterações posteriores ainda não salvas.');
        return;
      }
      this.formulario.reset({ nome: valor.nome ?? '', email: valor.email ?? '' });
      this.sucesso.set('Perfil atualizado.');
    });
  }
  consultarPreferencia(aceita: boolean) {
    if (this.ocupado()) return;
    this.executar(this.api.atualizarPreferencia(aceita), (v) => {
      this.aceita.set(v.aceita);
      this.sucesso.set('Preferência de participação atualizada.');
    });
  }
  baixarDados() {
    if (this.ocupado()) return;
    this.executar(this.api.exportar(), (valor) => {
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(valor, null, 2)], { type: 'application/json' }),
      );
      const a = document.createElement('a');
      a.href = url;
      a.download = 'finisus-dados.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      this.sucesso.set('Exportação preparada para download.');
    });
  }
  solicitarAnonimizacao() {
    this.privacidade.markAllAsTouched();
    if (this.privacidade.invalid || this.ocupado()) return;
    const enviado = this.privacidade.controls.motivo.value;
    this.executar(this.api.solicitarAnonimizacao(enviado), () => {
      this.sucesso.set(
        'Solicitação registrada. Os dados ainda não foram anonimizados. Acompanhe o estado abaixo.',
      );
      if (this.privacidade.controls.motivo.value === enviado) this.privacidade.reset();
      this.carregarSolicitacoes();
    });
  }
  inativar() {
    if (this.ocupado()) return;
    this.executar(this.api.inativar(), () => {
      this.sessao.encerrarSessao();
      void this.router.navigate(['/entrar']);
    });
  }
  private executar<T>(requisicao: Observable<T>, next: (valor: T) => void) {
    this.ocupado.set(true);
    this.erro.set('');
    this.sucesso.set('');
    requisicao
      .pipe(
        finalize(() => this.ocupado.set(false)),
        takeUntilDestroyed(this.referenciaDestruicao),
      )
      .subscribe({ next, error: (e: unknown) => this.erro.set(mensagemErro(e)) });
  }
  temAlteracoes() {
    return this.formulario.dirty || this.privacidade.dirty;
  }
}
