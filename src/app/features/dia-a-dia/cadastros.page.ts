import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, catchError, of, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Cadastro, TipoCadastro, DiaADiaApi, PaginaHttp } from './dia-a-dia.api';
import { IMPORTS_DIA_A_DIA, EstadoDiaADia } from './dia-a-dia.ui';
import { SeletorReferenciaComponent } from '../../shared/seletor-referencia.component';

@Component({
  selector: 'fin-cadastros-page',
  standalone: true,
  imports: [...IMPORTS_DIA_A_DIA, SeletorReferenciaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cadastros.page.html',
  styleUrl: './dia-a-dia.scss',
})
export class CadastrosPage extends EstadoDiaADia {
  private readonly api = inject(DiaADiaApi);
  readonly tipo = signal<TipoCadastro>('bancos');
  readonly tipos: TipoCadastro[] = ['bancos', 'categorias', 'itens', 'meios-pagamento'];
  readonly rotulos: Record<TipoCadastro, string> = {
    bancos: 'Bancos',
    categorias: 'Categorias',
    itens: 'Itens do catálogo',
    'meios-pagamento': 'Meios de pagamento',
  };
  readonly pagina = signal<PaginaHttp<Cadastro> | null>(null);
  readonly selecionado = signal<Cadastro | null>(null);
  readonly editando = signal(false);
  readonly idEdicao = signal<number | null>(null);
  private readonly consulta = new BehaviorSubject({ tipo: this.tipo(), pagina: 0 });
  readonly formulario = new FormGroup({
    nome: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(150)],
    }),
    codigo: new FormControl('', { nonNullable: true }),
    referencia: new FormControl<number | null>(null, Validators.min(1)),
  });
  constructor() {
    super();
    this.consulta
      .pipe(
        tap(() => {
          this.ocupado.set(true);
          this.erro.set('');
        }),
        switchMap((q) =>
          this.api.listarCadastros(q.tipo, q.pagina).pipe(
            catchError(() => {
              this.erro.set('Não foi possível carregar os cadastros. Tente novamente.');
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((pagina) => {
        this.pagina.set(pagina);
        this.ocupado.set(false);
      });
  }
  temAlteracoes(): boolean {
    return this.editando() && this.formulario.dirty;
  }
  alterarTipo(tipo: TipoCadastro): void {
    if (this.ocupado() || this.salvando()) return;
    const alteracao = () => {
      this.tipo.set(tipo);
      this.editando.set(false);
      this.selecionado.set(null);
      this.consulta.next({ tipo, pagina: 0 });
    };
    if (this.temAlteracoes())
      this.confirmar('Descartar as alterações e mudar o grupo de cadastros?', alteracao);
    else alteracao();
  }
  carregar(pagina = this.pagina()?.pagina ?? 0): void {
    this.consulta.next({ tipo: this.tipo(), pagina });
  }
  novoCadastro(): void {
    if (this.ocupado() || this.salvando()) return;
    const abrir = () => {
      this.idEdicao.set(null);
      this.configurar();
      this.formulario.reset();
      this.editando.set(true);
    };
    if (this.temAlteracoes())
      this.confirmar('Descartar o cadastro em edição e criar outro?', abrir);
    else abrir();
  }
  detalhar(linha: Cadastro): void {
    this.executar(this.api.consultarCadastro(this.tipo(), linha.id), (valor) =>
      this.selecionado.set(valor),
    );
  }
  editar(linha: Cadastro): void {
    if (this.ocupado() || this.salvando()) return;
    const abrir = () =>
      this.executar(this.api.consultarCadastro(this.tipo(), linha.id), (valor) => {
        this.selecionado.set(valor);
        this.idEdicao.set(valor.id);
        this.configurar();
        this.formulario.reset({
          nome: valor.nome,
          codigo: 'codigo' in valor ? valor.codigo : '',
          referencia: this.referencia(valor),
        });
        this.editando.set(true);
      });
    if (this.temAlteracoes())
      this.confirmar('Descartar as alterações e editar este cadastro?', abrir);
    else abrir();
  }
  private configurar(): void {
    this.formulario.controls.nome.setValidators([
      Validators.required,
      Validators.maxLength(this.limiteNome()),
    ]);
    this.formulario.controls.codigo.setValidators(
      this.tipo() === 'bancos' ? [Validators.required, Validators.maxLength(20)] : [],
    );
    this.formulario.controls.nome.updateValueAndValidity();
    this.formulario.controls.codigo.updateValueAndValidity();
  }
  private limiteNome(): number {
    if (this.tipo() === 'itens') return 300;
    if (this.tipo() === 'bancos') return 150;
    return 100;
  }
  salvar(): void {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid || this.ocupado() || this.salvando()) return;
    const v = this.formulario.getRawValue();
    const id = this.idEdicao();
    const tipo = this.tipo();
    const aoConcluir = (salvo: Cadastro) => {
      if (this.editando() && this.tipo() === tipo && this.idEdicao() === id) {
        this.idEdicao.set(salvo.id);
        if (JSON.stringify(this.formulario.getRawValue()) === JSON.stringify(v)) {
          this.formulario.markAsPristine();
          this.editando.set(false);
        }
      }
      this.selecionado.set(null);
      this.carregar();
    };
    switch (this.tipo()) {
      case 'bancos':
        this.executar(
          this.api.salvarCadastro('bancos', { nome: v.nome.trim(), codigo: v.codigo.trim() }, id),
          aoConcluir,
          true,
        );
        break;
      case 'categorias':
        this.executar(
          this.api.salvarCadastro(
            'categorias',
            { nome: v.nome.trim(), categoriaPaiId: v.referencia },
            id,
          ),
          aoConcluir,
          true,
        );
        break;
      case 'itens':
        this.executar(
          this.api.salvarCadastro(
            'itens',
            { nome: v.nome.trim(), categoriaPadraoId: v.referencia },
            id,
          ),
          aoConcluir,
          true,
        );
        break;
      case 'meios-pagamento':
        this.executar(
          this.api.salvarCadastro('meios-pagamento', { nome: v.nome.trim() }, id),
          aoConcluir,
          true,
        );
    }
  }
  doSistema(linha: Cadastro): boolean {
    return 'sistema' in linha && linha.sistema;
  }
  ativo(linha: Cadastro): boolean {
    return !('ativo' in linha) || linha.ativo;
  }
  referencia(linha: Cadastro): number | null {
    if ('categoriaPaiId' in linha) return linha.categoriaPaiId;
    if ('categoriaPadraoId' in linha) return linha.categoriaPadraoId;
    return null;
  }
  codigo(linha: Cadastro): string {
    return 'codigo' in linha ? linha.codigo : '';
  }
  inativar(linha: Cadastro): void {
    this.confirmar(`Inativar ${linha.nome}? O histórico financeiro será preservado.`, () =>
      this.executar(
        this.api.inativarCadastro(this.tipo(), linha.id),
        () => {
          this.selecionado.set(null);
          this.carregar();
        },
        true,
      ),
    );
  }
  cancelar(): void {
    if (this.ocupado() || this.salvando()) return;
    if (this.formulario.dirty)
      this.confirmar('Descartar as alterações deste formulário?', () => this.editando.set(false));
    else this.editando.set(false);
  }
}
