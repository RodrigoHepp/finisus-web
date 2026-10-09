import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule } from '@angular/material/paginator';
import { BehaviorSubject, catchError, Observable, merge, of, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TipoReferencia, ReferenciasApi } from '../infraestrutura/api/referencias.api';
import { Pagina } from '../infraestrutura/api/backend.dtos';
import { PROVIDER_PAGINADOR_PT_BR } from './paginador-pt-br';

interface Referencia {
  id: number;
  nome: string;
  ativo?: boolean;
}
type TipoReferenciaSeletor = TipoReferencia;
@Component({
  selector: 'fin-dialogo-referencia',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatPaginatorModule],
  providers: [PROVIDER_PAGINADOR_PT_BR],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h2 mat-dialog-title>{{ data.rotulo }}</h2>
    <mat-dialog-content>
      @if (carregando()) {
        <p role="status">Carregando opções…</p>
      }
      @if (erro()) {
        <p role="alert">
          Não foi possível carregar as opções.
          <button mat-button (click)="requisicao.next(pagina()?.pagina ?? 0)">
            Tentar novamente
          </button>
        </p>
      }
      <div class="opcoes">
        @for (opcao of pagina()?.conteudo ?? []; track opcao.id) {
          <button
            mat-button
            [disabled]="carregando() || opcao.ativo === false"
            (click)="dialog.close(opcao)"
          >
            {{ opcao.nome }}{{ opcao.ativo === false ? ' · Inativo' : '' }}
          </button>
        } @empty {
          @if (!carregando() && !erro()) {
            <p>Nenhuma opção nesta página.</p>
          }
        }
      </div>
      @if (pagina(); as p) {
        <mat-paginator
          [length]="p.totalElementos"
          [pageIndex]="p.pagina"
          [pageSize]="20"
          [hidePageSize]="true"
          (page)="requisicao.next($event.pageIndex)"
          aria-label="Páginas das opções"
        />
      }</mat-dialog-content
    ><mat-dialog-actions align="end"
      ><button mat-button [mat-dialog-close]="null">Cancelar</button></mat-dialog-actions
    >`,
  styles: `
    .opcoes {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 0.5rem;
    }
    .opcoes button {
      justify-content: flex-start;
      min-height: 44px;
    }
  `,
})
export class DialogoReferenciaComponent {
  readonly data = inject<{ tipo: TipoReferenciaSeletor; rotulo: string }>(MAT_DIALOG_DATA);
  readonly dialog = inject(MatDialogRef<DialogoReferenciaComponent, Referencia | null>);
  private readonly api = inject(ReferenciasApi);
  readonly requisicao = new BehaviorSubject(0);
  readonly pagina = signal<Pagina<Referencia> | null>(null);
  readonly carregando = signal(false);
  readonly erro = signal(false);
  constructor() {
    this.requisicao
      .pipe(
        tap(() => {
          this.carregando.set(true);
          this.erro.set(false);
        }),
        switchMap((pagina) =>
          this.opcoes(pagina).pipe(
            catchError(() => {
              this.erro.set(true);
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((pagina) => {
        this.pagina.set(pagina);
        this.carregando.set(false);
      });
  }
  private opcoes(pagina: number): Observable<Pagina<Referencia>> {
    return this.api.listar(this.data.tipo, pagina);
  }
}
@Component({
  selector: 'fin-seletor-referencia',
  standalone: true,
  imports: [MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="seletor">
    <span>{{ rotulo() }}{{ obrigatorio() ? ' *' : ' (opcional)' }}</span>
    <p>
      {{
        (idSelecionado() === controle().value ? nomeSelecionado() : '') ||
          (controle().value === null
            ? 'Nenhum registro selecionado'
            : 'Registro #' + controle().value)
      }}
    </p>
    <div>
      <button mat-stroked-button type="button" [disabled]="desabilitado()" (click)="selecionar()">
        Escolher {{ rotulo().toLowerCase() }}
      </button>
      @if (controle().value !== null) {
        <button
          mat-button
          type="button"
          [disabled]="desabilitado()"
          (click)="limpar()"
          [attr.aria-label]="'Limpar ' + rotulo()"
        >
          Limpar
        </button>
      }
    </div>
    @if (controle().touched && controle().invalid) {
      <p class="invalido" role="alert">Selecione um registro válido.</p>
    }
  </div>`,
  styles: `
    .seletor {
      padding: 0.75rem;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 10px;
      height: 100%;
      box-sizing: border-box;
    }
    .seletor span {
      font-size: 0.85rem;
    }
    .seletor p {
      margin: 0.6rem 0;
    }
    .invalido {
      color: var(--mat-sys-error);
    }
  `,
})
export class SeletorReferenciaComponent {
  readonly tipo = input.required<TipoReferenciaSeletor>();
  readonly rotulo = input.required<string>();
  readonly controle = input.required<FormControl<number | null>>();
  readonly obrigatorio = input(false);
  readonly desabilitado = input(false);
  readonly nomeSelecionado = signal('');
  readonly idSelecionado = signal<number | null>(null);
  private readonly detectorAlteracoes = inject(ChangeDetectorRef);
  constructor() {
    effect((aoLimpar) => {
      const subscription = merge(
        this.controle().valueChanges,
        this.controle().statusChanges,
      ).subscribe(() => this.detectorAlteracoes.markForCheck());
      aoLimpar(() => subscription.unsubscribe());
    });
  }
  private readonly dialog = inject(MatDialog);
  selecionar(): void {
    this.dialog
      .open<
        DialogoReferenciaComponent,
        { tipo: TipoReferenciaSeletor; rotulo: string },
        Referencia | null
      >(DialogoReferenciaComponent, {
        data: { tipo: this.tipo(), rotulo: this.rotulo() },
        width: '520px',
        restoreFocus: true,
      })
      .afterClosed()
      .subscribe((referencia) => {
        if (referencia) {
          this.controle().setValue(referencia.id);
          this.controle().markAsDirty();
          this.controle().markAsTouched();
          this.nomeSelecionado.set(referencia.nome);
          this.idSelecionado.set(referencia.id);
        }
      });
  }
  limpar(): void {
    this.controle().setValue(null);
    this.controle().markAsDirty();
    this.controle().markAsTouched();
    this.nomeSelecionado.set('');
    this.idSelecionado.set(null);
  }
}
