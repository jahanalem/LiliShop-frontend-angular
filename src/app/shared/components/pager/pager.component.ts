import { ChangeDetectionStrategy, Component, input, OnInit, output } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';

@Component({
    selector: 'app-pager',
    templateUrl: './pager.component.html',
    styleUrls: ['./pager.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class PagerComponent implements OnInit {
  pageSize   = input<number>(6);
  totalCount = input<number>(0);
  pageNumber = input<number>(1);
  pageSizeOptions = [5, 10, 25, 50];

  pageChanged = output<{ pageNumber: number, pageSize: number }>();

  constructor() { }

  ngOnInit(): void {
  }

  onPagerChange(event: PageEvent) {
    const newPageNumber = event.pageIndex + 1; // MatPaginator uses zero-based index for pages
    const newPageSize = event.pageSize;
    this.pageChanged.emit({ pageNumber: newPageNumber, pageSize: newPageSize });
  }
}
