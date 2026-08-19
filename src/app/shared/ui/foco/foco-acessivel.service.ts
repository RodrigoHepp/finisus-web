import { DOCUMENT } from '@angular/common';
import { Injectable, Injector, afterNextRender, inject } from '@angular/core';
import { FocusMonitor } from '@angular/cdk/a11y';

@Injectable({ providedIn: 'root' })
export class FocoAcessivelService {
  private readonly documento = inject(DOCUMENT);
  private readonly focusMonitor = inject(FocusMonitor);
  private readonly injector = inject(Injector);

  focarPorId(id: string): void {
    afterNextRender(
      () => {
        const elemento = this.documento.getElementById(id);

        if (elemento instanceof HTMLElement) {
          this.focusMonitor.focusVia(elemento, 'program');
        }
      },
      { injector: this.injector },
    );
  }
}
