import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerSheet } from './player-sheet';

describe('PlayerSheet', () => {
  let component: PlayerSheet;
  let fixture: ComponentFixture<PlayerSheet>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerSheet]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayerSheet);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

