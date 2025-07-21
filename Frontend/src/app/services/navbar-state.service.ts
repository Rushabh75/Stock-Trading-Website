import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NavbarStateService {
  private isNavbarCollapsed = new BehaviorSubject<boolean>(true);

  isNavbarCollapsed$ = this.isNavbarCollapsed.asObservable();

  constructor() {}

  toggleNavbar() {
    this.isNavbarCollapsed.next(!this.isNavbarCollapsed.value);
  }
}
