
import { Observable } from 'rxjs';
import { BreadcrumbService } from 'xng-breadcrumb';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

@Component({
    selector: 'app-section-header',
    templateUrl: './section-header.component.html',
    styleUrls: ['./section-header.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class SectionHeaderComponent {
  breadcrumb$: Observable<any[]>;

  private bcService = inject(BreadcrumbService);

  constructor() {
    this.breadcrumb$ = this.bcService.breadcrumbs$;
  }
}
