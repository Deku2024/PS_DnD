import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonsterPage } from './monster-page';

describe('MonsterPage', () => {
  let component: MonsterPage;
  let fixture: ComponentFixture<MonsterPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonsterPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MonsterPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
