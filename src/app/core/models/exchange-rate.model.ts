import { Currency } from './currency.model';

/*API Response interface*/
export interface ExchangeRateResponse {
  readonly success: boolean;
  readonly timestamp: number;
  readonly base: string;
  readonly date: string;
  readonly rates: Readonly<Record<string, number>>;
}

/*Error response*/
export interface ExchangeRateErrorResponse {
  readonly success: false;
  readonly error: {
    readonly code: number;
    readonly type: string;
    readonly info?: string;
  };
}

/*Conversion result*/
export interface ConversionResult {
  readonly from: Currency;
  readonly to: Currency;
  readonly amount: number;
  readonly convertedAmount: number;
  readonly rate: number;
  readonly timestamp: number;  
}

/*Normalised API error*/
export interface ApiError {
  readonly message: string;
  readonly statusCode?: number;
  readonly code?: string;
}