import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { finalize } from 'rxjs';
import { SessaoService } from '../../infraestrutura/sessao/sessao.service';
import { mensagemErro } from '../../shared/apresentacao';
import { AcessoUsuariosApi } from './acesso-usuarios.api';

@Component({
  selector: 'fin-acesso-usuarios-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './acesso-usuarios.page.html',
})
export class AcessoUsuariosPage {
  readonly sessao = inject(SessaoService);
  private readonly api = inject(AcessoUsuariosApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  readonly criando = signal(false);
  readonly desbloqueando = signal(false);
  readonly erroCriacao = signal('');
  readonly erroDesbloqueio = signal('');
  readonly sucessoCriacao = signal('');
  readonly sucessoDesbloqueio = signal('');
  readonly cadastro = this.fb.group({
    nome: ['', [Validators.required, Validators.maxLength(150), Validators.pattern(/\S/)]],
    email: ['', [Validators.required, Validators.email]],
    senha: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(128),
        Validators.pattern(/\S/),
      ],
    ],
  });
  readonly desbloqueio = this.fb.group({
    usuarioId: [
      null as number | null,
      [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)],
    ],
  });
  temAlteracoes(): boolean {
    return this.cadastro.dirty || this.desbloqueio.dirty;
  }
  criar(): void {
    if (this.criando() || !this.sessao.temPermissao('USUARIO_CADASTRAR')) return;
    this.cadastro.markAllAsTouched();
    if (this.cadastro.invalid) return;
    const valor = this.cadastro.getRawValue();
    this.criando.set(true);
    this.erroCriacao.set('');
    this.sucessoCriacao.set('');
    this.cadastro.disable();
    this.api
      .criar(valor)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.criando.set(false);
          this.cadastro.enable();
        }),
      )
      .subscribe({
        next: (usuario) => {
          this.cadastro.reset();
          this.sucessoCriacao.set(
            `Usuário ${usuario.nome} criado (ID ${usuario.id}). O novo usuário deve entrar com suas próprias credenciais. Ele não recebeu permissões administrativas.`,
          );
        },
        error: (erro: unknown) => this.erroCriacao.set(mensagemErro(erro)),
      });
  }
  desbloquear(): void {
    if (this.desbloqueando() || !this.sessao.temPermissao('USUARIO_DESBLOQUEAR')) return;
    this.desbloqueio.markAllAsTouched();
    if (this.desbloqueio.invalid) return;
    const id = this.desbloqueio.getRawValue().usuarioId;
    if (id === null || !Number.isSafeInteger(id) || id < 1) return;
    if (
      !window.confirm(
        `Desbloquear o usuário ${id}? As tentativas serão zeradas e todas as sessões anteriores serão invalidadas. O usuário precisará entrar novamente.`,
      )
    )
      return;
    this.desbloqueando.set(true);
    this.erroDesbloqueio.set('');
    this.sucessoDesbloqueio.set('');
    this.desbloqueio.disable();
    this.api
      .desbloquear(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.desbloqueando.set(false);
          this.desbloqueio.enable();
        }),
      )
      .subscribe({
        next: () => {
          this.desbloqueio.reset();
          this.sucessoDesbloqueio.set(
            `Usuário ${id} desbloqueado. As sessões anteriores foram invalidadas; ele precisa entrar novamente.`,
          );
        },
        error: (erro: unknown) => this.erroDesbloqueio.set(mensagemErro(erro)),
      });
  }
}
