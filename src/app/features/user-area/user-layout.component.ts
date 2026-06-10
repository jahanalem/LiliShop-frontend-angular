import { SharedModule } from 'src/app/shared/shared.module';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChangeDetectionStrategy, Component, inject, OnInit, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-user-layout',
  templateUrl: './user-layout.component.html',
  styleUrls: ['./user-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [SharedModule, CommonModule, RouterModule]
})
export class UserLayoutComponent implements OnInit {

  private renderer2 = inject(Renderer2);

  constructor() {
  }
  
  ngOnInit(): void {
    this.renderer2.setStyle(document.body, 'overflow', 'auto');
  }
}
