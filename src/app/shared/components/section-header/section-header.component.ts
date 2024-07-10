
import { Observable } from 'rxjs';
import { BreadcrumbService } from 'xng-breadcrumb';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-section-header',
  templateUrl: './section-header.component.html',
  styleUrls: ['./section-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SectionHeaderComponent implements OnInit {
  breadcrumb$: Observable<any[]> = this.bcService.breadcrumbs$;

  constructor(private bcService: BreadcrumbService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.breadcrumb$.subscribe(() => {
      this.cdr.markForCheck();
    });
  }
}
