import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, switchMap } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { AvisoCapsLockComponent } from '../../../../shared/ui/aviso-caps-lock/aviso-caps-lock';
import { AuthService } from '../../../../core/auth/auth.service';
import { MensagemGlobalService } from '../../../../shared/ui/mensagem-global/mensagem-global.service';
import { IndicadorProcessamentoComponent } from '../../../../shared/ui/indicador-processamento/indicador-processamento';
import { CampoFormularioComponent } from '../../../../shared/ui/campo-formulario/campo-formulario';

type CampoLogin = 'email' | 'senha';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    TranslatePipe,
    IndicadorProcessamentoComponent,
    CampoFormularioComponent,
    AvisoCapsLockComponent,
  ],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly authApiService = inject(AuthApiService);
  private readonly authService = inject(AuthService);
  private readonly mensagemGlobalService = inject(MensagemGlobalService);
  private readonly translateService = inject(TranslateService);

  protected readonly formulario = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required]],
  });

  protected readonly formularioEnviado = signal(false);
  protected readonly senhaVisivel = signal(false);
  protected readonly capsLockAtivo = signal(false);
  protected readonly carregando = signal(false);
  protected readonly mensagem = signal<string | null>(null);

  protected enviar(): void {
    this.mensagem.set(null);
    this.formularioEnviado.set(true);

    if (this.formulario.invalid || this.carregando()) {
      return;
    }

    this.carregando.set(true);

    const credenciais = this.formulario.getRawValue();

    this.authApiService
      .login(credenciais)
      .pipe(
        switchMap((tokens) => this.authService.iniciarSessao(tokens)),
        finalize(() => this.carregando.set(false)),
      )
      .subscribe({
        next: (usuario) => {
          this.authService.concluirSessao(usuario);

          const retorno = this.activatedRoute.snapshot.queryParamMap.get('retorno');

          const destino =
            retorno && retorno.startsWith('/') && !retorno.startsWith('//')
              ? retorno
              : '/dashboard';

          void this.router.navigateByUrl(destino);
        },
        error: (erro: unknown) => {
          const mensagem = this.obterMensagemDeErro(erro);

          if (this.deveExibirMensagemGlobal(erro)) {
            this.mensagemGlobalService.erro(mensagem);
            return;
          }

          this.mensagem.set(mensagem);
        },
      });
  }

  protected alternarVisibilidadeDaSenha(): void {
    this.senhaVisivel.update((visivel) => !visivel);
  }

  protected atualizarEstadoDoCapsLock(evento: KeyboardEvent): void {
    this.capsLockAtivo.set(evento.getModifierState('CapsLock'));
  }

  protected ocultarAvisoDoCapsLock(): void {
    this.capsLockAtivo.set(false);
  }

  protected campoInvalido(campo: CampoLogin): boolean {
    const controle = this.formulario.controls[campo];

    return controle.invalid && this.formularioEnviado();
  }

  private obterMensagemDeErro(erro: unknown): string {
    if (erro instanceof HttpErrorResponse) {
      if (erro.status === 0) {
        return this.translateService.instant('COMPARTILHADO.MENSAGENS.ERRO_CONEXAO_BACKEND');
      }

      if (typeof erro.error?.detail === 'string' && erro.error.detail.trim()) {
        return erro.error.detail.trim();
      }

      if (erro.status === 401 || erro.status === 422) {
        return this.translateService.instant('AUTENTICACAO.LOGIN.CREDENCIAIS_INVALIDAS');
      }
    }

    return this.translateService.instant('AUTENTICACAO.LOGIN.ERRO');
  }

  private deveExibirMensagemGlobal(erro: unknown): boolean {
    return erro instanceof HttpErrorResponse && (erro.status === 0 || erro.status >= 500);
  }
}
