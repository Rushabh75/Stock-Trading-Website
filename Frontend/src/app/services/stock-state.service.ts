import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, fromEvent, map, startWith, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

export interface ChartData {
  date: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}
export interface StockProfile {
  exchange?: string;
  ipo?: string;
  name: string;
  ticker: string;
  weburl?: string;
  logo?: string;
  finnhubIndustry?: string;
}

export interface StockQuote {
  ticker?: string;
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h?: number; // High price of the day
  l?: number; // Low price of the day
  o?: number; // Opening price
  pc?: number; // Previous close price
  t?: number; // Timestamp
}
export interface InsiderSentiment {
  symbol: string;
  year: number;
  month: number;
  change: number;
  mspr: number;
}
export interface Recommendation {
  buy: number;
  hold: number;
  period: string;
  sell: number;
  strongBuy: number;
  strongSell: number;
  symbol: string;
}
export interface WatchlistItem {
  userId?: string;
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
}
export interface Earnings{
}
export interface Historical{

}

@Injectable({
  providedIn: 'root'
})
export class StockStateService {
  private currentTickerSubject = new BehaviorSubject<string>('');
  private stockProfileSubject = new BehaviorSubject<StockProfile | null>(null);
  private stockQuoteSubject = new BehaviorSubject<StockQuote | null>(null); 
  private currentSearchSubject = new BehaviorSubject<string>('');
  private stockPeersSubject = new BehaviorSubject<string[] | null>(null);
  private stockNewsSubject = new BehaviorSubject<any[] | null>(null);
  stockNews$: any;
  private sentimentDataSubject = new BehaviorSubject<InsiderSentiment[] | null>(null);
  private apiUrl = 'https://backend3-419023.wl.r.appspot.com/api';
  private watchlistSubject = new BehaviorSubject<WatchlistItem[]>([]);
  currentTicker: string | undefined;
  private recommendationDataSubject = new BehaviorSubject<Recommendation[] | null>(null);
  private earningsDataSubject = new BehaviorSubject<Earnings[] | null>(null);
  private historicalDataSubject = new BehaviorSubject<Historical[] | null>(null);
  private currentSearchTerm = new BehaviorSubject<string>('');
  private lastSearchedTickerSource = new BehaviorSubject<string | null>(this.getTicker());
  lastSearchedTicker$ = this.lastSearchedTickerSource.asObservable();
  private blockTickerUpdates = false;
  


  



  constructor(private http: HttpClient) {}

  getTicker(): string | null {
    return localStorage.getItem('lastSearchedTicker') || '';
  }

  setTicker(ticker: string | null): void {
    if (this.blockTickerUpdates) return; 
    
    if (ticker === null || ticker === '') {
      localStorage.removeItem('lastSearchedTicker');
      this.lastSearchedTickerSource.next('');
    } else {
      localStorage.setItem('lastSearchedTicker', ticker);
      this.lastSearchedTickerSource.next(ticker);
    }
  }
  
  blockUpdates(): void {
    this.blockTickerUpdates = true;
  }
  
  allowUpdates(): void {
    this.blockTickerUpdates = false;
  }

  getTickerObservable(): Observable<string | null> {
    return this.lastSearchedTickerSource.asObservable();
  }

  watch(key: string): Observable<string | null> {
    return fromEvent(window, 'storage').pipe(
      map((event: any) => event.newValue),
      startWith(localStorage.getItem(key))
    );
  }

  setItem(key: string, value: string): void {
    localStorage.setItem(key, value);
    window.dispatchEvent(new StorageEvent('storage', {
      key: key,
      newValue: value,
    }));
  }

  getItem(key: string): string | null {
    return localStorage.getItem(key);
  }


  setCurrentSearchTerm(searchTerm: string): void {
    this.currentSearchTerm.next(searchTerm);
  }
  
  getCurrentSearchTerm(): Observable<string> {
    return this.currentSearchTerm.asObservable();
  }
  clearCurrentSearch(): void {
    this.currentSearchTerm.next(''); 
  }

  getCurrentTicker(): Observable<string> {
    return this.currentTickerSubject.asObservable();
  }

  get stockProfile$(): Observable<StockProfile | null> {
    return this.stockProfileSubject.asObservable();
  }

  get stockQuote$(): Observable<StockQuote | null> { 
    return this.stockQuoteSubject.asObservable();
  }
  get stockPeers$(): Observable<string[] | null> {
    return this.stockPeersSubject.asObservable();
  }

  get filteredCompanyNews$(): Observable<any[] | null> {
    return this.stockNewsSubject.asObservable();
  }
  getInsiderSentimentData(): Observable<InsiderSentiment[] | null> {
    return this.sentimentDataSubject.asObservable();
  }
  getRecommendationData(): Observable<Recommendation[] | null> {
    return this.recommendationDataSubject.asObservable();
  }
  getEarningsData(): Observable<Earnings[] | null> {
    return this.earningsDataSubject.asObservable();
  }
  getWatchlist(userId: string): Observable<WatchlistItem[]> {
    return this.http.get<WatchlistItem[]>(`${this.apiUrl}/watchlist/${userId}`);
  }
  
  addToWatchlist(userId: string, item: WatchlistItem): Observable<WatchlistItem> {
    return this.http.post<WatchlistItem>(`${this.apiUrl}/watchlist`, {...item, userId});
  }
  
  removeFromWatchlist(userId: string, symbol: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/watchlist/${userId}/${symbol}`);
  }
  
  isSymbolInWatchlist(userId: string, symbol: string): Observable<boolean> {
    return this.getWatchlist(userId).pipe(
      map((watchlist: WatchlistItem[]) => 
        watchlist.some(item => item.symbol === symbol)
      )
    );
  }
  refreshWatchlist(userId: string): void {
    const url = `https://backend3-419023.wl.r.appspot.com/api/watchlist/${userId}`;
    this.http.get<WatchlistItem[]>(url).subscribe({
      next: (watchlistItems) => {
        this.watchlistSubject.next(watchlistItems);
      },
      error: (error) => {
        console.error('Failed to refresh watchlist:', error);
      }
    });
  }


  get watchlist$(): Observable<WatchlistItem[]> {
    return this.watchlistSubject.asObservable();
  }
  fetchWallet(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/wallet/${userId}`);
  }

  fetchPortfolio(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/portfolio/${userId}`);
  }

  buyStock(userId: string, symbol: string, quantity: number, purchasePrice: number): Observable<any> {
    const url = `${this.apiUrl}/portfolio/buy`;
    const body = { userId, symbol, quantity, purchasePrice };
    return this.http.post(url, body);
  }

  sellStock(userId: string, symbol: string, quantity: number, sellPrice: number): Observable<any> {
    const url = `${this.apiUrl}/portfolio/sell`;
    const body = { userId, symbol, quantity, sellPrice };
    return this.http.post(url, body);
  }

  initWallet(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/wallet/init/${userId}`, {});
  }


  currentSearch$ = this.currentSearchSubject.asObservable();

  updateCurrentTicker(ticker: string): void {
    this.currentTickerSubject.next(ticker);
  }

  updateCurrentSearch(searchValue: string): void {
    this.currentSearchSubject.next(searchValue);
    this.stockQuoteSubject.next(null);
    this.stockPeersSubject.next([]);

    this.fetchStockQuote(searchValue);
    this.fetchStockPeers(searchValue);
  }

  fetchStockProfile(ticker: string): void {
    const url = `https://backend3-419023.wl.r.appspot.com/api/stock-profile?ticker=${ticker}`;
    this.http.get<StockProfile>(url).subscribe(profile => {
      this.stockProfileSubject.next(profile);
    }, error => {
      console.error('Error fetching stock profile:', error);
      this.stockProfileSubject.next(null);
    });
  }

  fetchStockQuote(ticker: string): void {
    this.currentTicker = ticker;
    const url = `https://backend3-419023.wl.r.appspot.com/api/stock-quote?symbol=${ticker}`;
    this.http.get<StockQuote>(url).subscribe(quote => {
      this.stockQuoteSubject.next({ ...quote, ticker: this.currentTicker });
    }, error => {
      console.error('Error fetching stock quote:', error);
      this.stockQuoteSubject.next(null);
    });
  }
  fetchStockQuote1(symbol: string): Observable<StockQuote> {
    return this.http.get<StockQuote>(`https://backend3-419023.wl.r.appspot.com/api/stock-quote?symbol=${symbol}`);
}

  fetchStockProfile1(symbol: string): Observable<StockProfile> {
      return this.http.get<StockProfile>(`https://backend3-419023.wl.r.appspot.com/api/stock-profile?ticker=${symbol}`);
  }
  fetchStockPeers(ticker: string): void {
    const url = `https://backend3-419023.wl.r.appspot.com/api/stock-peers?ticker=${ticker}`;
    this.http.get<string[]>(url).subscribe(peers => {
      this.stockPeersSubject.next(peers);
    }, error => {
      console.error('Error fetching stock peers:', error);
      this.stockPeersSubject.next(null);
    });
  }

  fetchFilteredCompanyNews(ticker: string): void {
    const url = `https://backend3-419023.wl.r.appspot.com/api/filtered-company-news/${ticker}`;
    this.http.get<any[]>(url).subscribe(news => {
      this.stockNewsSubject.next(news);
    }, error => {
      console.error('Error fetching filtered company news:', error);
      this.stockNewsSubject.next(null);
    });
  }
  fetchInsiderSentiment(ticker: string): void {
    const url = `https://backend3-419023.wl.r.appspot.com/api/stock/insider-sentiment?ticker=${ticker}`;
    this.http.get<{ data: InsiderSentiment[] }>(url).subscribe(
      response => {
        this.sentimentDataSubject.next(response.data);
      },
      error => {
        console.error('Error fetching insider sentiment:', error);
        this.sentimentDataSubject.next(null);
      }
    );
  }
  calculateSums(sentiments: InsiderSentiment[]) {
    const sums = {
      totalChange: parseFloat(sentiments.reduce((sum, item) => sum + item.change, 0).toFixed(2)),
      totalMspr: parseFloat(sentiments.reduce((sum, item) => sum + item.mspr, 0).toFixed(2)),
      positiveChange: parseFloat(sentiments.filter(item => item.change > 0).reduce((sum, item) => sum + item.change, 0).toFixed(2)),
      negativeChange: parseFloat(sentiments.filter(item => item.change < 0).reduce((sum, item) => sum + item.change, 0).toFixed(2)),
      positiveMspr: parseFloat(sentiments.filter(item => item.mspr > 0).reduce((sum, item) => sum + item.mspr, 0).toFixed(2)),
      negativeMspr: parseFloat(sentiments.filter(item => item.mspr < 0).reduce((sum, item) => sum + item.mspr, 0).toFixed(2))
    };
    return sums;
  }

  fetchmainchart(ticker: string): Observable<ChartData[]> { 
    const url = `https://backend3-419023.wl.r.appspot.com/api/mainchart/${ticker}`;
    return this.http.get<ChartData[]>(url);
  }

  fetchhistorical(ticker: string, quotetime: any): Observable<ChartData[]> { 
    console.log(quotetime);
    const url = `https://backend3-419023.wl.r.appspot.com/api/historical/${ticker}/${quotetime}`;
    return this.http.get<ChartData[]>(url);
  }
  fetchRecommendation(ticker: string): Observable<Recommendation[]> {
    const url = `https://backend3-419023.wl.r.appspot.com/api/stock/recommendation/${ticker}`;
    return this.http.get<Recommendation[]>(url);
    
  }
  fetchearnings(ticker: string): Observable<Earnings[]> {
    const url = `https://backend3-419023.wl.r.appspot.com/api/stock/earnings/${ticker}`;
    return this.http.get<Earnings[]>(url);
    
  }
  
  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error);
    return throwError('An error occurred while fetching chart data.');
  }
}
