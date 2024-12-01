import { ChangeDetectionStrategy, Component, input, OnInit } from '@angular/core';

@Component({
    selector: 'app-paging-header',
    templateUrl: './paging-header.component.html',
    styleUrls: ['./paging-header.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class PagingHeaderComponent implements OnInit {
  pageNumber = input<number>(1);
  pageSize   = input<number>(1);
  totalCount = input<number>(0);

  constructor() { }

  ngOnInit(): void {
  }

  getStartItem(): number {
    return (this.pageNumber() - 1) * this.pageSize() + 1;
  }

  getEndItem(): number {
    return Math.min(this.pageNumber() * this.pageSize(), this.totalCount());
  }

  hasResults(): boolean {
    return this.totalCount() > 0;
  }

  noResults(): boolean {
    return this.totalCount() === 0;
  }
}
