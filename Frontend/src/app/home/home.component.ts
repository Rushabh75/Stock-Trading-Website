import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, Subscribable, Subscription, of } from 'rxjs';
import { startWith, map, debounceTime, switchMap, filter, distinctUntilChanged, tap, finalize } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { NavbarStateService } from '../services/navbar-state.service';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { ActivatedRoute, Router } from '@angular/router';
import { StockStateService } from '../services/stock-state.service';
import { Location } from '@angular/common';

interface StockOption {
  description: string;
  displaySymbol: string;
  symbol: string;
  type?: string; 
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  tickerControl = new FormControl();
  filteredOptions: Observable<StockOption[]> | undefined; 
  isNavbarCollapsed: boolean = true;
  navbarSubscription: Subscription;
  errorMessage: string | null = null;
  isLoading = false;

  constructor(private stockStateService: StockStateService, 
              private location: Location,
              private activatedRoute: ActivatedRoute,
              private router: Router,
              private http: HttpClient, private navbarStateService: NavbarStateService) 
              {
              this.navbarSubscription = new Subscription();
  }

  ngOnInit() {
    this.updateSearchFromPath();
    this.extractTickerFromUrl();
    setTimeout(()=>{
    console.log(this.tickerControl)},2000);
    this.activatedRoute.paramMap.subscribe(params => {
      const ticker = params.get('ticker');
      if (ticker && ticker !== 'home') {
        this.tickerControl.setValue(ticker);
      } else {
        this.tickerControl.reset();
      }
    });
  
    this.filteredOptions = this.tickerControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => value ? this.searchStock(value) : of([]))
    );
    
    this.navbarSubscription = this.navbarStateService.isNavbarCollapsed$.subscribe((state) => {
      this.isNavbarCollapsed = state;
    });
  
    this.stockStateService.getCurrentTicker().subscribe(ticker => {
      if (ticker) {
        this.tickerControl.setValue(ticker, { emitEvent: false });
      }
    });
  }
  extractTickerFromUrl(): void {
    const path = this.location.path();
    const pathSegments = path.split('/');
    const tickerIndex = pathSegments.findIndex(segment => segment === 'search') + 1;
    if (tickerIndex > 0 && tickerIndex < pathSegments.length) {
      const ticker = pathSegments[tickerIndex];
      if (ticker.toLowerCase() !== 'home') {
        this.tickerControl.setValue(ticker);
      }
    }
  }
  displayFn(stock?: StockOption): string {
    return stock && stock.displaySymbol ? stock.displaySymbol : '';
  }

  searchStock(query: string): Observable<any[]> {
    this.isLoading = true; // Start loading
    return this.http.get<any[]>(`https://backend3-419023.wl.r.appspot.com/api/search`, { params: { q: query } }).pipe(
      finalize(() => {
        this.isLoading = false; 
      })
    );
  }
  updateSearchFromPath() {
    const path = this.location.path();
    const ticker = path.split('/')[2]; 
    if (ticker && ticker !== 'home') {
      this.tickerControl.setValue(ticker);
    } else {
      this.tickerControl.reset();
    }
  }
  
  search1(): void {
    setTimeout(() => {
    const tickerSymbol = typeof this.tickerControl.value === 'string' ? this.tickerControl.value : this.tickerControl.value.symbol;
    if (tickerSymbol) {
      this.stockStateService.updateCurrentTicker(tickerSymbol);
      this.router.navigate(['/search', tickerSymbol]);
    }
    },1000);
    
  }
  search(): void {
    setTimeout(() => {
      const tickerSymbol = typeof this.tickerControl.value === 'string' ? this.tickerControl.value : this.tickerControl.value.symbol;
      if (tickerSymbol) {
        this.stockStateService.setCurrentSearchTerm(tickerSymbol); 
        this.stockStateService.updateCurrentTicker(tickerSymbol);
        this.router.navigate(['/search', tickerSymbol]);
      } else {
        this.errorMessage = 'Please enter a valid ticker';
      }
    }, 1000);
  }
  onOptionSelected(event: MatAutocompleteSelectedEvent): void {
    const tickerSymbol = event.option.value.symbol;
    this.search();
  }
  clear(): void {
    this.tickerControl.reset();
    this.clearErrorMessage();
    this.stockStateService.updateCurrentTicker('');
    this.router.navigate(['/search/home']);
  }
  clearErrorMessage(): void {
    this.errorMessage = null;
  }

  ngOnDestroy() {
    this.navbarSubscription.unsubscribe();
  }
}