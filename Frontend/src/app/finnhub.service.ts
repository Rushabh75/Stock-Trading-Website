import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FinnhubService {
  private baseUrl: string = 'https://finnhub.io/api/v1/search';
  private apiKey: string = 'cn40h9pr01qtsta4c4l0cn40h9pr01qtsta4c4lg'; // Your API Key

  constructor(private http: HttpClient) { }

  searchCompany(query: string): Observable<any> {
    const url = `${this.baseUrl}?q=${encodeURIComponent(query)}&token=${this.apiKey}`;
    return this.http.get(url);
  }
}
