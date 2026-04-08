import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DmNotes } from './dm-notes';

describe('DmNotes', () => {
  let component: DmNotes;
  let fixture: ComponentFixture<DmNotes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DmNotes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DmNotes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
