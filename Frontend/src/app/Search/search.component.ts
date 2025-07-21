// src/app/search/search.component.ts
import { AfterViewInit, Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StockStateService, StockProfile, StockQuote, InsiderSentiment, Recommendation } from '../services/stock-state.service';
import { NgIfContext } from '@angular/common';
import { DatePipe } from '@angular/common';
import * as bootstrap from 'bootstrap';
import { interval, Subscription , startWith} from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { NgbAlert } from '@ng-bootstrap/ng-bootstrap';
import * as Highcharts from 'highcharts/highstock';
import { tick } from '@angular/core/testing';
import { Renderer2 } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Options } from 'highcharts/highstock';

import accesibility from 'highcharts/modules/accessibility';
import IndicatorsCore from 'highcharts/indicators/indicators';
import VBP from 'highcharts/indicators/volume-by-price';
import SMA from 'highcharts/indicators/indicators';

accesibility(Highcharts);
IndicatorsCore(Highcharts);
VBP(Highcharts);
SMA(Highcharts);



const userId = 'rushabh75';
export interface WatchlistItem {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
}

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit, OnDestroy {
  stockProfile: StockProfile | null = null;
  stockQuote: StockQuote | null = null;
  loading: TemplateRef<NgIfContext<StockProfile | null>> | null | undefined;
  isWatchlistSelected: boolean = false;
  stockPeers: string[] | null = null;
  // router: any;
  filteredNews: any[] | null = null;
  selectedNewsItem: any;
  sentimentSums: any;
  marketStatus: { message: string, color: string } = { message: '', color: 'black' };
  private subscription: Subscription = new Subscription();
  errorMessage: string | null = null;
  watchlistService: any;
  // userId: any;
  staticAlertClosed = false;
  successMessage = '';
  failedMessage = '';
  errorMessage1 = '';
  starClass: string = 'star-unselected';
  chartData: any[] = [];
  volumeData: any[] = [];
  maxVolume: number = 0;
  formattedDate: string = '';
  currentDate: Date = new Date();
  showBuyModal = false;
tickerToBuy: string = '';
currentPrice: number = 0;
  walletBalance!: number; 
quantityToBuy: number = 0;
totalPrice: number = 0;
private quoteSubscription: Subscription | null=null;
userId: string = 'rushabh75';
tickerToSell: string = '';
  ownedQuantity: number = 0; 
  sellQuantityControl = new FormControl('', [Validators.required, Validators.min(1)]);
  sellModalInstance?: bootstrap.Modal;
  portfolioSubscription?: Subscription;
  portfolio: any[] = [];
  
quantityToSell: number = 0;
sellTotal: number = 0;
  ChartOption!: Options;
  loading_history: boolean | undefined;
  Highcharts: typeof Highcharts = Highcharts;
  chartRef: any;
  chart1!:Highcharts.Options;
  chart2!:Highcharts.Options;
  chart3!:Highcharts.Options;
  chart4!:Highcharts.Options;
  recommendations: Recommendation[] = [];
  quotetime: number | undefined;
  hprice: any;
  hchart: any;
  hchartdata: any;
  isloading = false;
  private _success = new Subject<string>();
  private _failed = new Subject<string>();
  // successMessage = '';
  private _sellsuccess = new Subject<string>();
  sellsuccess = '';
  isTickerInWatchlist!: boolean;


  

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private stockStateService: StockStateService,
    private datePipe: DatePipe,
    private renderer: Renderer2
  ) {
    setInterval(() => {
      this.currentDate = new Date();
    }, 15000);
    this.success.subscribe(message => this.successMessage = message);
    this.success.pipe(
      debounceTime(5000)
    ).subscribe(() => this.successMessage = '');
    this._failed.subscribe(message => this.failedMessage = message);
    this._failed.pipe(
      debounceTime(5000)  
    ).subscribe(() => this.failedMessage = '');

    // Error message
    this.error.subscribe(message => this.errorMessage1 = message);
    this.error.pipe(
      debounceTime(5000)
    ).subscribe(() => this.errorMessage1 = '');
  }

  performSearch(ticker: string): void {
    this.subscription.unsubscribe();
    this.subscription = new Subscription();
    // Reset error message
    // this.errorMessage = null;
    // this.stockQuote = null;
    if (!ticker.trim()) {
      this.errorMessage = 'Please enter a stock ticker symbol';
      return;
    }
    this._success.subscribe(message => this.successMessage = message);
    this._success.pipe(
      debounceTime(5000)  
    ).subscribe(() => this.successMessage = '');
    this._failed.subscribe(message => this.failedMessage = message);
    this._failed.pipe(
      debounceTime(5000)  
    ).subscribe(() => this.failedMessage = '');
    
    this.stockStateService.fetchStockProfile(ticker);
    this.stockStateService.stockProfile$.subscribe(profile => {
        this.stockProfile = profile;
      });
    if (ticker) {
      this.stockStateService.fetchStockQuote(ticker);
      const intervalSubscription = interval(15000).pipe(
        startWith(0),
        switchMap(() => {
          this.stockStateService.fetchStockQuote(ticker);
          return this.stockStateService.stockQuote$;
        })
      ).subscribe(
        quote => {
          this.stockQuote = quote;
          this.updateMarketStatus();
        }
      );
      // this.stockStateService.fetchmainchart(ticker);
      
      this.stockStateService.fetchmainchart(ticker).subscribe({
        next: (data) => {
          this.plotChart(data, ticker);
        },
        error: (error) => {
          console.error('Error fetching chart data:', error);
        }
      });
      this.recommend(ticker);
      this.loadEarnings(ticker);
      setTimeout(() => {
        this.fetchAndUseQuote(ticker);
      }, 1000);
      // this.loadRecommendations(ticker);

      this.loadWalletBalance();
      

      this.subscription.add(intervalSubscription);

       this.stockStateService.fetchStockPeers(ticker);
       this.stockStateService.stockPeers$.subscribe(
        peers => this.stockPeers = peers
      );
      this.stockStateService.fetchFilteredCompanyNews(ticker);
      this.stockStateService.fetchInsiderSentiment(ticker);
    }
    this.stockStateService.filteredCompanyNews$.subscribe(
      news => this.filteredNews = news,
      error => console.error('Error fetching filtered company news:', error)
    );
    this.stockStateService.getInsiderSentimentData().subscribe(sentiments => {
      if (sentiments) {
        this.sentimentSums = this.stockStateService.calculateSums(sentiments);
      }
    });
    this.stockStateService.fetchPortfolio(userId).subscribe(portfolio => {
      this.portfolio = portfolio;
      this.isloading = false;
  });
  
  }
  fetchAndUseQuote(ticker: string): void {
    this.stockStateService.fetchhistorical(ticker, this.stockQuote?.t ).subscribe({
      next: (data) => {
        this.histchart(data, ticker);
      },
      error: (error) => {
        console.error('Error fetching chart data:', error);
      }
    });
    this._sellsuccess.subscribe(message => this.successMessage = message);
    this._sellsuccess.pipe(
      debounceTime(5000)  
    ).subscribe(() => this.successMessage = '');
  }

  @ViewChild('selfClosingAlert', { static: false }) selfClosingAlert: NgbAlert | undefined;
  
  private success = new Subject<string>();
  private error = new Subject<string>();

  public changeSuccessMessage(ticker: string, action: 'add' | 'remove'): void {
    const message = action === 'add' ?
      `${ticker} added to watchlist.` :
      `${ticker} removed from watchlist.`;
    
    if (action === 'add') {
      this.success.next(message);
    } else {
      this.error.next(message);
    }
  }
  

  ngOnInit(): void {
    this.isloading = true;
    this.route.params.subscribe((params: { [x: string]: any; }) => {
      this.stockQuote = null;
      const ticker = params['ticker'];
      if (ticker) {
          this.performSearch(ticker);
          this.stockStateService.isSymbolInWatchlist(this.userId, ticker).subscribe(isInWatchlist => {
            this.isTickerInWatchlist = isInWatchlist;
            this.starClass = isInWatchlist ? 'star-selected' : 'star-unselected';
          });
        
      } else {
        this.errorMessage = 'Please enter a valid ticker';
        this.isloading = false;
      }
    });
    // this.isloading = false;

  }
  
  recommend(ticker: string) {
    this.stockStateService.fetchRecommendation(ticker).subscribe((data: any[]) => {
      this.Chart(data); 
    });
  }
  loadEarnings(ticker: string): void {
    this.stockStateService.fetchearnings(ticker).subscribe({
      next: (data) => {
        this.ChartEarn(data);
      },
      error: (error) => console.error('Failed to load earnings', error),
    });
  }
  ChartEarn(chartData: any[]) {
    this.chart3 = {
      chart: {
        type: 'spline',
      },
      title: {
        text: 'Historical EPS Surprises',
      },
      xAxis: {
        categories: chartData.map(data => data.period),
      },
      yAxis: {
        title: {
          text: 'Quarterly EPS',
        },
      },
      tooltip: {
        shared: true,
        pointFormat: '{series.name}: <b>{point.y}</b><br/>',
        valueSuffix: ' EPS',
      },
      plotOptions: {
        spline: {
          marker: {
            enabled: true,
          },
        },
      },
      series: [{
        type: 'spline',
        name: 'Actual',
        data: chartData.map(data => data.actual),
      }, {
        type: 'spline', 
        name: 'Estimate',
        data: chartData.map(data => data.estimate),
    }] ,
    };
  }
  Chart(chartData: any[]) {
    const period = chartData.map(data => data.period);
    this.chart2 = {
      chart: {
        type: 'column',
        backgroundColor: 'white',
        marginBottom: 110 
      },
      title: {
        text: 'Recommendation Trends',
        align: 'center'
      },
      xAxis: {
        categories: period, 
        labels: {
          style: {
            fontSize: '10px' 
          },
          rotation:0,
           
        }
      },
      yAxis: {
        min: 0,
        title: {
          text: '#Analysis'
        }
      },
      legend: {
        align: 'center',
        verticalAlign: 'bottom',
        y: 0,
        floating: true,
        backgroundColor: 'white',
        itemWidth: 120,
        maxHeight:100,
        shadow: false
      },
      tooltip: {
        headerFormat: '<b>{point.x}</b><br/>',
        pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}'
      },
      plotOptions: {
        column: {
          stacking: 'normal',
          dataLabels: {
            enabled: true
          }
        }
      },
      series: [{
        type: 'column',
        name: 'Strong Buy',
        data: chartData.map(data => data.strongBuy),
        color: '#1a6334'
      }, {
        type: 'column',
        name: 'Buy',
        data: chartData.map(data => data.buy),
        color: '#25af51'
      }, {
        type: 'column',
        name: 'Hold',
        data: chartData.map(data => data.hold),
        color: '#b17e29'
      }, {
        type: 'column',
        name: 'Sell',
        data: chartData.map(data => data.sell),
        color: '#f15053'
      }, {
        type: 'column',
        name: 'Strong Sell',
        data: chartData.map(data => data.strongSell),
        color: '#752b2c'
    }]
    };
  }

  // loadRecommendations(ticker: string): void {
  //   this.stockStateService.fetchRecommendation(ticker).subscribe({
  //     next: (data) => {
  //       // Assuming 'data' is an array that can be directly mapped to Highcharts series
  //       // This is just an example to demonstrate; you'll need to adjust according to your actual data structure
  //       const series = data.map(item => {
  //         return {
  //           name: item.period, // or any other property that makes sense for your data
  //           data: [item.buy, item.hold, item.sell, item.strongBuy, item.strongSell] // Adjust according to your data structure
  //         };
  //       });
  
  //       // Now, use the series data to render the Highcharts chart
  //       this.chart2 = {
  //         chart: {
  //           type: 'column',
  //           backgroundColor: 'white',
  //           marginBottom: 100 
  //         },
  //         title: {
  //           text: 'Recommendation Trends',
  //           align: 'center'
  //         },
  //         xAxis: {
  //           categories: data.map(item=>{item.period}), 
  //         },
  //         yAxis: {
  //           min: 0,
  //           title: {
  //             text: '#Analysis'
  //           },
  //           stackLabels: {
  //             enabled: false
  //           }
  //         },
  //         legend: {
  //           align: 'center',
  //           x: 36,
  //           verticalAlign: 'top',
  //           y: 345,
  //           floating: true,
  //           backgroundColor:
  //           (Highcharts.defaultOptions.legend && Highcharts.defaultOptions.legend.backgroundColor) || 'white',
      
  //           borderColor: '#',
  //           borderWidth: 1,
  //           shadow: false
  //         },
  //         tooltip: {
  //           headerFormat: '<b>{point.x}</b><br/>',
  //           pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}'
  //         },
  //         plotOptions: {
  //           column: {
  //             stacking: 'normal',
  //             dataLabels: {
  //               enabled: true
  //             }
  //           }
  //         },
  //         series:  [{
  //           name: 'Strong Buy',
  //           data: chartData.map(data => data.strongBuy),
  //           color: '#1a6334'
  //         } as any,{
  //           name: 'Buy',
  //           data: chartData.map(data => data.buy),
  //           color: '#25af51'
  //         } as any, {
  //           name: 'Hold',
  //           data: chartData.map(data => data.hold),
  //           color: '#b17e29'
  //         } as any, {
  //           name: 'Sell',
  //           data: chartData.map(data => data.sell),
  //           color: '#f15053' 
  //         } as any, {
  //           name: 'Strong Sell',
  //           data: chartData.map(data => data.strongSell),
  //           color: '#752b2c' 
  //         } as any]
  //       });
      
  // }
  
  loadWalletBalance(): void {
    this.stockStateService.fetchWallet(this.userId).subscribe({
      next: (wallet) => {
        this.walletBalance = wallet.balance;
      },
      error: (error) => this.displayError('Error fetching wallet data', error)
    });
  }
  displayError(arg0: string, error: any): void {
    throw new Error('Method not implemented.');
  }

  // getCompanyStockChart(ticker: string): void {
  //   this.stockStateService.fetchmainchart().subscribe(data => {
  //     this.plotChart(data, ticker);
  //     console.log(data);
  //   });
  // }
//   recommend(data:any, ticker: string){
//     console.log(data);
// }
histchart(data: any, ticker:string):void{
  console.log(data);
  this.hprice = data;
  this.hchart = this.hprice.results.map((item: any)=>{
    return {price: item.c, time: item.t}
  });

  this.hchartdata = this.hchart.map((point:{time:any;price:any})=> [point.time, point.price]);

  this.chart4 = {
    title: {
      text: 'Stock Price Chart' 
    },
    xAxis: {
      type: 'datetime', 
      title: {
        text: 'Time' 
      }
    },
    yAxis: {
      title: {
        text: 'Price' 
      }
    },
    series: [{
      name: 'Stock Price',
      type: 'line', 
      data: this.hchartdata, 
      marker: {
        enabled: false
      },
      color: this.getPriceDirection(this.stockQuote?.d) === 'increase' ? 'green' : 'red'
  }]
};

}

  
  plotChart(data: any, ticker: string): void {
    (async () => {
    // console.log(data);
    let ohlc: any[] = [], volume: any[] = [];
    data.forEach((item: any) => {
      let tempTime = new Date(item.t); 
      let correctTime = tempTime.getTime(); 
      ohlc.push([
        item.t, // The corrected time
        item.o, // open
        item.h, // high
        item.l, // low
        item.c  // close
      ]);
      volume.push([
        item.t, // The corrected time again
        item.v        // volume
      ]);
    });
    
    console.log(ohlc);
    this.chart1 = {

    //   chart: {
    //     type: 'candlestick',
    //     height: '700px',
    //     width:null,
    //     backgroundColor: '#FAFAFA',
    //     reflow: true,
    // },
    
    rangeSelector: {
        enabled: true,
        selected: 2,
        buttons: [{
            type: 'month',
            count: 1,
            text: '1m'
        }, {
            type: 'month',
            count: 3,
            text: '3m'
        }, {
            type: 'month',
            count: 6,
            text: '6m'
        }, {
            type: 'ytd',
            text: 'YTD'
        }, {
            type: 'all',
            text: 'All'
        }]
    },
    navigator: {
        enabled: true
    },
    scrollbar: {
        enabled: true
    },
    title: {
        text: this.stockProfile?.ticker + ' Historical'
    },
    subtitle: {
        text: 'With SMA and Volume by Price technical indicators'
    },
    xAxis:[{
      type:'datetime'
    }],
    yAxis: [{
        startOnTick: false,
        endOnTick: false,
        opposite:true,
        labels: {
            align: 'right',
            x: -3
        },
        title: {
            text: 'OHLC'
        },
        height: '60%',
        lineWidth: 2,
    }, {
      opposite:true,
        labels: {
            align: 'right',
            x: -3
        },
        title: {
            text: 'Volume'
        },
        top: '65%',
        height: '35%',
        offset: 0,
        lineWidth: 2
    }],
    tooltip: {
        split: true
    },
    series: [{
        type: 'candlestick',
        name: this.stockProfile?.ticker,
        id: 'stock',
        zIndex: 2,
        data: ohlc 
    }, {
        type: 'column',
        name: 'Volume',
        id: 'volume',
        data: volume, 
        yAxis: 1,
        color: '#4d4fd1',
    }, {
        type: 'vbp',
        linkedTo: 'stock',
        params: {
            volumeSeriesID: 'volume'
        },
        dataLabels: {
            enabled: false
        },
        zoneLines: {
            enabled: false
        }
    }, {
        type: 'sma',
        linkedTo: 'stock',
        zIndex: 1,
        marker: {
            enabled: false
        }
    }]
  }

  })();
  }

  
  toggleWatchlist(ticker: string): void {
    this.stockStateService.isSymbolInWatchlist(this.userId, ticker).subscribe(isInWatchlist => {
      if (isInWatchlist) {
        this.stockStateService.removeFromWatchlist(this.userId, ticker).subscribe(() => {
          this.stockStateService.refreshWatchlist(this.userId); 
          this._failed.next(`${ticker} removed to Watchlist`); 
          this.starClass = 'star-unselected';
        });
      } else {
        const itemToAdd: WatchlistItem = {
          symbol: ticker,
          name: this.stockProfile?.name || '',
          currentPrice: this.stockQuote?.c || 0,
          change: this.stockQuote?.d || 0,
          changePercent: this.stockQuote?.dp || 0
        };
        this.stockStateService.addToWatchlist(this.userId, itemToAdd).subscribe(() => {
          this.stockStateService.refreshWatchlist(this.userId); 
          this._success.next(`${ticker} added to Watchlist`); 
          this.starClass = 'star-selected';
        });
        
      }
    });
  }

getStarClass(symbol: string): void {
  this.stockStateService.isSymbolInWatchlist(userId,symbol).subscribe(isInWatchlist => {
    this.starClass = isInWatchlist ? 'star-selected' : 'star-unselected';
  });
}

  getPriceChangeClass(change?: number): string {
    if (change === undefined) {
      return 'default-class'; 
    }
    return change >= 0 ? 'price-increase' : 'price-decrease';
  }
  getPriceDirection(change?: number): 'increase' | 'decrease' | null {
    if (change === undefined) return null;
    return change >= 0 ? 'increase' : 'decrease';
  }
  
onPeerSelected(ticker: string): void {
  this.stockQuote = null; 
  this.isloading = true; 

  setTimeout(() => {
    this.stockStateService.setTicker(ticker); 
    this.stockStateService.updateCurrentTicker(ticker); 
    this.isloading = false; 
  }, 2000);
}

  selectNewsItem(newsItem: any): void {
  this.openNewsModal(newsItem);
}

openNewsModal(newsItem: any): void {
  this.selectedNewsItem = newsItem;
  const modalElement = document.getElementById('newsModal');
  if (modalElement) {
    const myModal = new bootstrap.Modal(modalElement);
    myModal.show();
  } else {
    console.error('Modal element not found!');
  }
}
  openTwitterShare(): void {
    if (this.selectedNewsItem) {
      const tweetText = encodeURIComponent(`${this.selectedNewsItem.headline} ${this.selectedNewsItem.url}`);
      const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}&hashtags=example,demo&via=twitterdev&related=twitterapi,twitter`;
    
      window.open(twitterUrl, '_blank');
    }
  }
  openFacebookShare(): void {
    if (this.selectedNewsItem) {
      const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.selectedNewsItem.url)}`;
  
      window.open(facebookUrl, '_blank');
    }
  }
  formatDate(timestamp: number): string {
    // Convert timestamp to milliseconds and format
    const date = new Date(timestamp * 1000);
    return this.datePipe.transform(date, 'MMMM dd, yyyy') || '';
  }
  
  updateMarketStatus(): void {
    if (!this.stockQuote || !this.stockQuote.t) {
      this.marketStatus = { message: 'Market status unknown', color: 'grey' };
      return;
    }
    const marketInfo = this.isMarketOpen(this.stockQuote.t);
    this.marketStatus.message = marketInfo.message;
    this.marketStatus.color = marketInfo.color;
  }
  formatDateToYYYYMMDDHHMMSS(marketTime: Date) {
    const pad = (num: number) => num < 10 ? '0' + num : num;
  
    const year = marketTime.getFullYear();
    const month = pad(marketTime.getMonth() + 1); 
    const day = pad(marketTime.getDate());
  
    const hours = pad(marketTime.getHours());
    const minutes = pad(marketTime.getMinutes());
    const seconds = pad(marketTime.getSeconds());
  
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  isMarketOpen(stockQuoteTimestamp: number): { message: string, color: string } {
    const marketTime = new Date(stockQuoteTimestamp * 1000);
    const currentTime = new Date();
    
    const formattedDate = this.formatDateToYYYYMMDDHHMMSS(marketTime);
  
    const isOpen = marketTime.getHours() === currentTime.getHours() &&
                   marketTime.getUTCDate() === currentTime.getUTCDate() &&
                   marketTime.getUTCMonth() === currentTime.getUTCMonth() &&
                   marketTime.getUTCFullYear() === currentTime.getUTCFullYear();
  
    if (isOpen) {
      return { message: 'Market is open', color: 'green' };
    } else {
      return { message: `Market closed on ${formattedDate}`, color: 'red' };
    }
  }

  openBuyModal(ticker: string): void {
    this.tickerToBuy = ticker;
    console.log("Buy Function");

    if (this.quoteSubscription) {
      this.quoteSubscription.unsubscribe();
    }

    this.quoteSubscription = this.stockStateService.stockQuote$.subscribe((quote) => {
      if (quote) {
        this.currentPrice = quote.c;
        const modalElement = document.getElementById('buyModal');
        if (modalElement) {
          const buyModal = new bootstrap.Modal(modalElement);
          buyModal.show();
        } else {
          console.error('Buy modal element not found!');
        }
      } else {
        console.log("Quote not found");
      }
    });

    this.stockStateService.fetchStockQuote(ticker);
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
        // Handle successful purchase
        this.walletBalance -= this.totalPrice; 
        this.showBuyModal = false; 
        
      }, error => {
        
      });
      this.closeBuyModal();
      this._success.next('Stock purchased successfully!');
      // this.router.navigateByUrl(this.tickerToBuy);
      this.performSearch(this.tickerToBuy);
    }
  }
  
  checkIfBuyDisabled(): boolean {
    return this.totalPrice > this.walletBalance || this.quantityToBuy <= 0;
  }
  isTickerInPortfolio(ticker: string): boolean {
    return this.portfolio.some(stock => stock.symbol === ticker);
  }
  openSellModal(ticker: string): void {
    this.tickerToSell = ticker;
    
    const stock = this.portfolio.find(s => s.symbol === ticker);
    console.log(ticker);
    console.log(this.portfolio);
    if (!stock) {
      console.error('Stock not found in portfolio:', ticker);
      return;
    }
  
    this.ownedQuantity = stock.quantity;
    console.log("Sell Function: Selling", ticker, "Owned Quantity:", this.ownedQuantity);
  
    if (this.quoteSubscription) {
      this.quoteSubscription.unsubscribe();
    }
  
    this.quoteSubscription = this.stockStateService.stockQuote$.subscribe((quote) => {
      if (quote) {
        this.currentPrice = quote.c;
        const modalElement = document.getElementById('sellModal');
        if (modalElement) {
          const sellModal = new bootstrap.Modal(modalElement);
          sellModal.show();
        } else {
          console.error('Sell modal element not found!');
        }
      } else {
        console.log("Quote not found");
      }
    });
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
      this._failed.next('Stock Sold Successfully');
      this.performSearch(this.tickerToSell);
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
    }
  }

  loadPortfolio(): void {
    this.portfolioSubscription = this.stockStateService.fetchPortfolio(this.userId).subscribe(portfolioData => {
      this.portfolio = portfolioData;
    }, error => {
      console.error('Error fetching portfolio data', error);
      this.portfolio = []; 
    });
  }
  

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.quoteSubscription?.unsubscribe();
  }
}
