import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'app-user-layout',
    templateUrl: './user-layout.component.html',
    styleUrls: ['./user-layout.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class UserLayoutComponent {
  constructor() {

  }
}
