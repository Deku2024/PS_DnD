import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonsterSearch } from './monster-search.component';

describe('MonsterSearch', () => {
  let component: MonsterSearch;
  let fixture: ComponentFixture<MonsterSearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonsterSearch]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MonsterSearch);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
