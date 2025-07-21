import { Component, EventEmitter, Output } from '@angular/core';
import { NavbarStateService } from '../services/navbar-state.service';
import { StockStateService, StockProfile, StockQuote, InsiderSentiment, Recommendation } from '../services/stock-state.service';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  currentTicker: string | null = null;
  isSearchInitiallyActive: boolean = true;

  constructor(private navbarStateService: NavbarStateService,
    private stockStateService: StockStateService) {
    this.stockStateService.getCurrentTicker().subscribe(ticker => {
      this.currentTicker = ticker;
    });
  }

  toggleNavbar() {
    this.navbarStateService.toggleNavbar();
  }
  getSearchRoute(): string[] {
    if (this.currentTicker) {
      return ['/search', this.currentTicker];
    }
    return ['/search/home'];
  }
  closeNavbar(): void {
    // Using Bootstrap's collapse method to hide the navbar
    this.isSearchInitiallyActive = false;
    const navbarMenu = document.getElementById('navbarNavDropdown');
    if (navbarMenu) {
      navbarMenu.classList.remove('show');
    }
  }
  
}
