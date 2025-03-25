import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrintessEditorComponent } from './printess-editor.component';

describe('PrintessEditorComponent', () => {
  let component: PrintessEditorComponent;
  let fixture: ComponentFixture<PrintessEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrintessEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrintessEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
