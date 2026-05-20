import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommerceComponent } from './commerce.component';

describe('CommerceComponent', () => {
  let component: CommerceComponent;
  let fixture: ComponentFixture<CommerceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommerceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommerceComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
