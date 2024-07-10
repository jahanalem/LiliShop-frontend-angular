import { ChangeDetectionStrategy, Component, input, OnInit, output } from '@angular/core';
import { PageChangedEvent } from 'ngx-bootstrap/pagination';

@Component({
  selector: 'app-pager',
  templateUrl: './pager.component.html',
  styleUrls: ['./pager.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PagerComponent implements OnInit {
  pageSize   = input<number>(6);
  totalCount = input<number>(0);
  pageNumber = input<number>(1);
  //@Output() pageChanged = new EventEmitter<number>();
  pageChanged = output<number>();

  constructor() { }

  ngOnInit(): void {
  }

  onPagerChange(event: PageChangedEvent) {
    this.pageChanged.emit(event.page);
  }
}
