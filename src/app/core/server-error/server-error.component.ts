import { Router } from '@angular/router';
import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';

@Component({
  selector: 'app-server-error',
  templateUrl: './server-error.component.html',
  styleUrls: ['./server-error.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ServerErrorComponent implements OnInit {
  error = signal<any>(null);

  constructor(private router: Router) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state ?? null;
    if (state && state['error']) {
      this.error.set(state['error']);
    }
  }

  ngOnInit(): void {
  }

}
