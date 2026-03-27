import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalvationThrows } from './salvation-throws';

describe('SalvationThrows', () => {
  let component: SalvationThrows;
  let fixture: ComponentFixture<SalvationThrows>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalvationThrows]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalvationThrows);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
