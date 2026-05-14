import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DmFloatingMenu } from './dm-floating-menu.component';

describe('DmFloatingMenu', () => {
  let component: DmFloatingMenu;
  let fixture: ComponentFixture<DmFloatingMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DmFloatingMenu]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DmFloatingMenu);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
