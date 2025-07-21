import { TestBed } from '@angular/core/testing';

import { NavbarStateService } from './navbar-state.service';

describe('NavbarStateService', () => {
  let service: NavbarStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NavbarStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
