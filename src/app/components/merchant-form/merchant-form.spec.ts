import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MerchantForm } from './merchant-form';

describe('MerchantForm', () => {
  let component: MerchantForm;
  let fixture: ComponentFixture<MerchantForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MerchantForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MerchantForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
