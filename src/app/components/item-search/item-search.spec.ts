import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemSearch } from './item-search';

describe('ItemSearch', () => {
  let component: ItemSearch;
  let fixture: ComponentFixture<ItemSearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemSearch]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemSearch);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
