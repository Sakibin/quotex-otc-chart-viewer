const SYMBOLS = [
  'EURUSD_otc',
  'USDJPY_otc',
  'GBPUSD_otc',
  'BTCUSD_otc',
  'ETHUSD_otc',
  'XAUUSD_otc',
  'NAS100_otc'
];

const DEFAULT_HISTORY = 200;
const STREAM_INTERVAL_MS = 1000;
const PORT = process.env.PORT || 3000;

module.exports = {
  SYMBOLS,
  DEFAULT_HISTORY,
  STREAM_INTERVAL_MS,
  PORT
};
