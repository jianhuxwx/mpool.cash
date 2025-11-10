import config from '../../config';
import { query } from '../../utils/axios-query';
import priceUpdater, { PriceFeed, PriceHistory } from '../price-updater';

class CoinbaseApi implements PriceFeed {
  public name: string = 'Coinbase';
  public currencies: string[] = ['USD', 'EUR', 'GBP'];
  public url: string;
  public urlHist: string;
  private baseSymbol: 'BTC' | 'BCH';

  constructor() {
    const isBitcoinCash = ['bitcoincash', 'bitcoincashtestnet'].includes(config.MEMPOOL.NETWORK);
    this.baseSymbol = isBitcoinCash ? 'BCH' : 'BTC';
    if (isBitcoinCash) {
      this.currencies = ['USD', 'EUR'];
    }
    this.url = `https://api.coinbase.com/v2/prices/${this.baseSymbol}-{CURRENCY}/spot`;
    this.urlHist = `https://api.exchange.coinbase.com/products/${this.baseSymbol}-{CURRENCY}/candles?granularity={GRANULARITY}`;
  }

  public async $fetchPrice(currency): Promise<number> {
    const response = await query(this.url.replace('{CURRENCY}', currency));
    if (response && response['data'] && response['data']['amount']) {
      return parseInt(response['data']['amount'], 10);
    } else {
      return -1;
    }
  }

  public async $fetchRecentPrice(currencies: string[], type: 'hour' | 'day'): Promise<PriceHistory> {
    const priceHistory: PriceHistory = {};

    for (const currency of currencies) {
      if (this.currencies.includes(currency) === false) {
        continue;
      }

      const response = await query(this.urlHist.replace('{GRANULARITY}', type === 'hour' ? '3600' : '86400').replace('{CURRENCY}', currency));
      const pricesRaw = response ? response : [];

      for (const price of pricesRaw as any[]) {
        if (priceHistory[price[0]] === undefined) {
          priceHistory[price[0]] = priceUpdater.getEmptyPricesObj();
        }
        priceHistory[price[0]][currency] = price[4];
      }
    }

    return priceHistory;
  }
}

export default CoinbaseApi;
