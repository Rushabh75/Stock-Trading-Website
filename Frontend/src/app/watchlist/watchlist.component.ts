import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StockProfile, StockQuote, StockStateService, WatchlistItem } from '../services/stock-state.service';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { Observable, Subscription, delay, forkJoin, map } from 'rxjs';


@Component({
  selector: 'app-watchlist',
  templateUrl: './watchlist.component.html',
  styleUrls: ['./watchlist.component.css']
})

export class WatchlistComponent implements OnInit {
  watchlist: WatchlistItem[] = [];
  private subscriptions = new Subscription();
  loading = false;

  constructor(private stockStateService: StockStateService, private router: Router) {}

  ngOnInit(): void {
    this.loadWatchlist();
    this.refreshWatchlist();
    this.stockStateService.watchlist$.subscribe(
      (watchlistItems) => {
        this.watchlist = watchlistItems;
      }
    );
  }
  refreshWatchlist() {
    const userId = 'rushabh75'; 
    this.stockStateService.refreshWatchlist(userId);
  }

  loadWatchlist(): void {
    this.loading = true;
    const userId = 'rushabh75'; 
    this.stockStateService.getWatchlist(userId).subscribe(watchlistItems => {
      const updates = watchlistItems.map(item => {
        const quoteRequest = this.stockStateService.fetchStockQuote1(item.symbol);
        const profileRequest = this.stockStateService.fetchStockProfile1(item.symbol);
  
        return forkJoin({ quote: quoteRequest, profile: profileRequest }).pipe(
          map(({ quote, profile }) => ({
            ...item,
            currentPrice: quote.c || 0,
            name: profile.name || 'N/A',
            change: quote.d || 0,
            changePercent: quote.dp || 0
          }))
        );
      });
  
      forkJoin(updates).subscribe(updatedWatchlist => {
        this.watchlist = updatedWatchlist;
        this.loading = false;
      }, error => {
        this.displayError('Error updating watchlist', error);
        this.loading = false;
      });
    }, error => {
      this.displayError('Error loading watchlist', error);
      this.loading = false;
    });
  }
  displayError(arg0: string, error: any) {
    throw new Error('Method not implemented.');
  }
  removeFromWatchlist(symbol: string): void {
    const userId = 'rushabh75';
    this.stockStateService.removeFromWatchlist(userId, symbol).subscribe({
      next: () => {
        this.watchlist = this.watchlist.filter(item => item.symbol !== symbol);
      },
      error: (error) => {
        console.error(`Failed to remove ${symbol} from watchlist:`, error);
      }
    });
  }

  getWatchlist(): WatchlistItem[] {
    const watchlistJSON = localStorage.getItem('watchlist');
    return watchlistJSON ? JSON.parse(watchlistJSON) : [];
  }

  viewStockDetails(symbol: string): void {
    // this.loading=true;
    this.stockStateService.updateCurrentTicker(symbol);
    // setTimeout(() => {
    //   // localStorage.setItem('lastSearchedTicker', symbol); 
      
    //   // this.loading = false;
    // }, 2000);
    this.router.navigate(['/search', symbol]); 
  }
}
