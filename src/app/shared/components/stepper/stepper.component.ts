import { CdkStepper } from '@angular/cdk/stepper';
import { ChangeDetectionStrategy, Component, input, OnInit } from '@angular/core';

@Component({
  selector: 'app-stepper',
  templateUrl: './stepper.component.html',
  styleUrls: ['./stepper.component.scss'],
  providers: [{ provide: CdkStepper, useExisting: StepperComponent }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StepperComponent extends CdkStepper implements OnInit {
  linearModeSelected = input<boolean>(false);

  ngOnInit(): void {
    this.linear = this.linearModeSelected();
  }

  onClick(index: number): void {
    this.selectedIndex = index;
  }

}
