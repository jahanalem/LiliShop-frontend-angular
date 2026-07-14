import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { TranslationKeys } from 'src/app/core/i18n/translation-keys';

@Component({
  imports: [TranslatePipe],
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
  protected readonly TranslationKeys = TranslationKeys;


  constructor() { }

  ngOnInit(): void {
  }

}
