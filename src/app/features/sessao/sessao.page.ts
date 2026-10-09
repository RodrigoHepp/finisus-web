import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { SessaoService } from '../../infraestrutura/sessao/sessao.service';
import { mensagemErro } from '../../shared/apresentacao';

@Component({
  selector: 'fin-sessao-page',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, RouterLink],
  templateUrl: './sessao.page.html',
  styleUrl: './sessao.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessaoPage {
  private readonly sessao = inject(SessaoService);
  private readonly router = inject(Router);
  private readonly rota = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly ocupado = signal(false);
  readonly erro = signal('');
  readonly mostrarSenha = signal(false);
  readonly formulario = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required]],
  });

  enviar(): void {
    if (this.ocupado()) return;
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) return;
    this.ocupado.set(true);
    this.erro.set('');
    this.sessao
      .login(this.formulario.getRawValue())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.ocupado.set(false)),
      )
      .subscribe({
        next: () => {
          const urlRetorno = this.rota.snapshot.queryParamMap.get('retorno');
          void this.router.navigateByUrl(
            urlRetorno?.startsWith('/') && !urlRetorno.startsWith('//')
              ? urlRetorno
              : '/visao-geral',
          );
        },
        error: (erro: unknown) =>
          this.erro.set(
            erro instanceof HttpErrorResponse && erro.status === 401
              ? 'Não foi possível entrar. Confira seu e-mail e senha. Cinco senhas inválidas consecutivas bloqueiam o usuário.'
              : mensagemErro(erro),
          ),
      });
  }
}
