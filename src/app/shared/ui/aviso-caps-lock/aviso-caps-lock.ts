import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-aviso-caps-lock',
  imports: [MatIconModule, TranslatePipe],
  templateUrl: './aviso-caps-lock.html',
  styleUrl: './aviso-caps-lock.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvisoCapsLockComponent {}
