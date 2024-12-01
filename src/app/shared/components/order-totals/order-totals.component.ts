import { ChangeDetectionStrategy, Component, input, OnInit } from '@angular/core';

@Component({
    selector: 'app-order-totals',
    templateUrl: './order-totals.component.html',
    styleUrls: ['./order-totals.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class OrderTotalsComponent implements OnInit {
  shippingPrice = input<number>(0);
  subtotal      = input<number>(0);
  total         = input<number>(0);

  constructor() { }

  ngOnInit(): void {
  }

}
