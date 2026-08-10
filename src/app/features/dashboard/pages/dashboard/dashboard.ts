import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-dashboard',
  imports: [MatCardModule, TranslatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {}
