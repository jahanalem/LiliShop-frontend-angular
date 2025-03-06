import { ChangeDetectionStrategy, Component, inject, OnInit, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-user-layout',
  templateUrl: './user-layout.component.html',
  styleUrls: ['./user-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class UserLayoutComponent implements OnInit {

  private renderer2 = inject(Renderer2);

  constructor() {
  }
  
  ngOnInit(): void {
    this.renderer2.setStyle(document.body, 'overflow', 'auto');
  }
}
