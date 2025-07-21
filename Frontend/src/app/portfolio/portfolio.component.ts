import { Component, OnInit, Renderer2 } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StockStateService, StockProfile, StockQuote } from '../services/stock-state.service';
import { NavigationExtras, Router } from '@angular/router';
import { NgbAlert } from '@ng-bootstrap/ng-bootstrap';
import * as bootstrap from 'bootstrap';
import { Observable, Subject, Subscription, catchError, combineLatest, debounceTime, forkJoin, interval, map, of, startWith, switchMap, take } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

interface Stock {
  symbol: string;
  quantity: number;
  avgCost: number;
  totalcost:number; 
}

interface PortfolioStock extends Stock {
  currentPrice: number;
  name: string;
  change: number;
  avgc:number;
  marketValue: number;
}

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.css']
})
export class PortfolioComponent implements OnInit {
  portfolio: any[] = [];
  stockProfile: StockProfile | null = null;
  stockQuote: StockQuote | null = null;
  // walletBalance: number | null = null;
  userId: string = 'rushabh75'; 
  buyQuantityControl = new FormControl('');
  private quoteSubscription: Subscription | null=null;
  showBuyModal = false;
tickerToBuy: string = '';
currentPrice: number = 0;
  walletBalance!: number; 
quantityToBuy: number = 0;
totalPrice: number = 0;
portfolioSubscription?: Subscription;
tickerToSell: string = '';
quantityToSell: number = 0;
ownedQuantity: number = 0; 
sellTotal: number = 0;
loading = false;
private _success = new Subject<string>();
successMessage = '';
private _sellsuccess = new Subject<string>();
  sellsuccess = '';


  
  constructor(
    private stockStateService: StockStateService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.loading = true;
    setTimeout(()=>{
      this.loadWalletBalance();
      this.loadPortfolio();
      this._success.subscribe(message => this.successMessage = message);
      this._success.pipe(
      debounceTime(5000)  
    ).subscribe(() => this.successMessage = '');
    this._sellsuccess.subscribe(message => this.successMessage = message);
    this._sellsuccess.pipe(
      debounceTime(5000)  
    ).subscribe(() => this.successMessage = '');

    this.loading = false;},2000);
    // this.route.params.subscribe(params => {
    //   const ticker = params['ticker'];
    //   this.stockStateService.fetchStockProfile(ticker);
    // if (ticker) {
    //   this.stockStateService.stockProfile$.subscribe(profile => {
    //     this.stockProfile = profile;
    //   });
    //   this.stockStateService.fetchStockQuote(ticker);

    //   // Then set up an interval to fetch the stock quote every 15 seconds
    //   const intervalSubscription = interval(15000).pipe(
    //     startWith(0),
    //     switchMap(() => {
    //       this.stockStateService.fetchStockQuote(ticker);
    //       return this.stockStateService.stockQuote$;
    //     })
    //   ).subscribe(
    //     quote => {
    //       this.stockQuote = quote;
    //     }
    //   );
    // }
    // });
  }
  refreshComponent() {
    let navigationExtras: NavigationExtras = {
      queryParamsHandling: 'preserve',
      skipLocationChange: true
    };
  
    this.router.navigateByUrl('/portfolio', navigationExtras).then(() => {
      this.router.navigate([this.router.url]);
    });
  }

  
  loadWalletBalance(): void {
    this.stockStateService.fetchWallet(this.userId).subscribe({
      next: (wallet) => {
        this.walletBalance = wallet.balance;
      },
      error: (error) => this.displayError('Error fetching wallet data', error)
    });
  }
  
  loadPortfolio(): void {
    this.loading = true;
    this.stockStateService.fetchPortfolio(this.userId).subscribe(portfolio => {
      const updates = portfolio.map(stock => {
        const quoteRequest = this.stockStateService.fetchStockQuote1(stock.symbol);
        const profileRequest = this.stockStateService.fetchStockProfile1(stock.symbol);

        return forkJoin({ quote: quoteRequest, profile: profileRequest }).pipe(
          map(({ quote, profile }) => ({
            ...stock,
            currentPrice: quote.c || 0,
            name: profile.name || 'N/A',
            change: (quote.c || 0) - ((stock.totalCost) / (stock.quantity)),
            marketValue: (quote.c || 0) * (stock.quantity),
            avgc: (stock.totalCost) / (stock.quantity) 
          }))
        );
      });

      forkJoin(updates).subscribe(updatedPortfolio => {
        this.portfolio = updatedPortfolio;
        this.loading = false;
      }, error => {
        this.displayError('Error updating portfolio', error);
        this.loading = false;
      });
    }, error => {
      this.displayError('Error loading portfolio', error);
      this.loading = false;
    });
}

calculatePortfolioValues(): void {
 
}
  
openBuyModal(ticker: string): void {
  this.tickerToBuy = ticker;

  const stock = this.portfolio.find(s => s.symbol === ticker);

  if (!stock) {
    console.error('Stock not found in portfolio:', ticker);
    return;
  }

  this.currentPrice = stock.currentPrice;

  const modalElement = document.getElementById('buyModal');
  if (modalElement) {
    const buyModal = new bootstrap.Modal(modalElement);
    buyModal.show();
  } else {
    console.error('Buy modal element not found!');
  }
}
closeBuyModal(): void {
  console.log("Close");
  const modalElement = this.renderer.selectRootElement('#buyModal', true);
if (modalElement) {
  const buyModal = bootstrap.Modal.getInstance(modalElement);
  if (buyModal) {
    buyModal.hide();
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.removeStyle(document.body, 'padding-right');
    this.renderer.removeStyle(document.body, 'overflow');
  } else {
    console.error('No Bootstrap modal instance found for the element.');
    
  }
}
  if (this.quoteSubscription) {
    this.quoteSubscription.unsubscribe();
  }
  
}
calculateTotalPrice(): void {
  this.totalPrice = this.quantityToBuy * this.currentPrice;
}

onQuantityChange(event: Event): void {
  const value = (event.target as HTMLInputElement).value;
  this.quantityToBuy = value ? parseInt(value) : 0;
  this.calculateTotalPrice();
}

onBuyConfirm(): void {
  if (this.totalPrice <= this.walletBalance) {
    const userId = 'rushabh75'; 
    this.stockStateService.buyStock(userId, this.tickerToBuy, this.quantityToBuy, this.currentPrice).subscribe(() => {
      
      this.walletBalance -= this.totalPrice; 
      this.showBuyModal = false; 
      
    }, error => {
      
    });
    this.closeBuyModal();
    this._success.next('Stock purchased successfully!');
    
    setTimeout(()=>{
    this.loadWalletBalance();
    this.loadPortfolio();
    this.router.navigateByUrl(`/portfolio`);
    
  },1000);
  }
}

checkIfBuyDisabled(): boolean {
  return this.totalPrice > this.walletBalance || this.quantityToBuy <= 0;
}
openSellModal(ticker: string): void {
  this.tickerToSell = ticker;
  const stock = this.portfolio.find(s => s.symbol === ticker);

  if (!stock) {
    console.error('Stock not found in portfolio:', ticker);
    return;
  }
  this.ownedQuantity = stock.quantity;
  this.currentPrice = stock.currentPrice; 

  console.log("Sell Function: Selling", ticker, "Owned Quantity:", this.ownedQuantity, "at current price:", this.currentPrice);

  const modalElement = document.getElementById('sellModal');
  if (modalElement) {
    const sellModal = new bootstrap.Modal(modalElement);
    sellModal.show();
  } else {
    console.error('Sell modal element not found!');
  }
}

calculateSellTotal(): void {
  this.sellTotal = this.quantityToSell * this.currentPrice;
}

onSellConfirm(): void {
  if (this.quantityToSell > 0 && this.quantityToSell <= this.ownedQuantity) {
    const userId = 'rushabh75';
    this.stockStateService.sellStock(userId, this.tickerToSell, this.quantityToSell, this.currentPrice).subscribe({
      next: () => {
        
        console.log('Stock sold successfully');
        this.loadPortfolio();
        
        const modalElement = document.getElementById('sellModal');
        if (modalElement) {
          const sellModal = bootstrap.Modal.getInstance(modalElement);
          if (sellModal) {
            sellModal.hide();
          }
        }
      },
      error: (error) => {
      }
    });
    this.closeSellModal();
    setTimeout(()=>{
      this.loadWalletBalance();
      this.loadPortfolio();
    },2000);
    this._sellsuccess.next('Stock Sold Successfully');
  } else {
    console.error('Invalid sell quantity');
  }
}

closeSellModal(): void {
    console.log("Close Sell Modal");
    const modalElement = this.renderer.selectRootElement('#sellModal', true);
    if (modalElement) {
      const sellModal = bootstrap.Modal.getInstance(modalElement);
      if (sellModal) {
        sellModal.hide();
        this.renderer.removeClass(document.body, 'modal-open');
        this.renderer.removeStyle(document.body, 'padding-right');
        this.renderer.removeStyle(document.body, 'overflow');
      } else {
        console.error('No Bootstrap modal instance found for the sell modal element.');
      }
    }
    this.quantityToSell = 0;
    this.sellTotal = 0;
    
    if (this.quoteSubscription) {
      this.quoteSubscription.unsubscribe();
      // this.sellQuoteSubscription = null;
    }
  }

  

  
  displayError(message: string, error: any): void {
    console.error(message, error);
    this.showMessage(`${message}: ${error.message}`);
  }
  
  showMessage(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }
  openSearchDetails(ticker: string): void {
    setTimeout(() => {
      // localStorage.setItem('lastSearchedTicker', ticker); 
      this.stockStateService.updateCurrentTicker(ticker);
      // this.loading = false;
    }, 2000);
    this.router.navigateByUrl(`/search/${ticker}`);
  }

}
