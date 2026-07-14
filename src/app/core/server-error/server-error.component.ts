
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { ChangeDetectionStrategy, Component, OnInit, signal, inject } from '@angular/core';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { TranslationKeys } from 'src/app/core/i18n/translation-keys';

@Component({
    selector: 'app-server-error',
    templateUrl: './server-error.component.html',
    styleUrls: ['./server-error.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
  imports: [TranslatePipe, RouterModule]
})
export class ServerErrorComponent implements OnInit {
  protected readonly TranslationKeys = TranslationKeys;

  private router = inject(Router);

  error = signal<any>(null);

  constructor() {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state ?? null;
    if (state && state['error']) {
      this.error.set(state['error']);
    }
  }

  ngOnInit(): void {
  }

}
