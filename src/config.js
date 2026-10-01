const SYMBOLS = [
  'EURUSD_otc',
  'USDJPY_otc',
  'GBPUSD_otc',
  'USDCHF_otc',
  'AUDUSD_otc',
  'NZDUSD_otc',
  'CADJPY_otc',
  'EURJPY_otc',
  'EURGBP_otc',
  'GBPJPY_otc',
  'BTCUSD_otc',
  'ETHUSD_otc',
  'XAUUSD_otc',
  'XAGUSD_otc',
  'WTI_otc',
  'BRENT_otc',
  'NAS100_otc',
  'US30_otc',
  'SPX500_otc'
];

const DEFAULT_HISTORY = 1440; // 24 hours of 1-minute candles
const STREAM_INTERVAL_MS = 60000; // 1 minute
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || './data/quotex.db';

// Data source configuration
const DATA_SOURCE = process.env.DATA_SOURCE || 'mock'; // 'quotex-api', 'binance', 'mock'
const QUOTEX_API_URL = process.env.QUOTEX_API_URL || 'https://api.quotex.io';
const QUOTEX_API_KEY = process.env.QUOTEX_API_KEY || '';

// Database settings
const DB_CONFIG = {
  maxConnections: 10,
  enableWAL: true,
  batchInsertSize: 100
};

module.exports = {
  SYMBOLS,
  DEFAULT_HISTORY,
  STREAM_INTERVAL_MS,
  PORT,
  DB_PATH,
  DATA_SOURCE,
  QUOTEX_API_URL,
  QUOTEX_API_KEY,
  DB_CONFIG
};
