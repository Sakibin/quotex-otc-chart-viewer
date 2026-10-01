const { SYMBOLS, DEFAULT_HISTORY } = require('./config');

const marketState = new Map();

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function buildInitialCandles(symbol) {
  const basePrice = getBasePriceForSymbol(symbol);
  const now = Date.now();
  const candles = [];

  let previousClose = basePrice;
  for (let i = DEFAULT_HISTORY; i >= 0; i -= 1) {
    const timestamp = now - i * 60000;
    const direction = Math.random() > 0.5 ? 1 : -1;
    const drift = randomBetween(-basePrice * 0.0015, basePrice * 0.0015);
    const open = previousClose;
    const close = Math.max(0.0001, open + (direction * randomBetween(0.0005, 0.03)) + drift);
    const high = Math.max(open, close) + randomBetween(0.0003, 0.02);
    const low = Math.min(open, close) - randomBetween(0.0003, 0.02);

    candles.push({
      symbol,
      time: new Date(timestamp).toISOString(),
      open: Number(open.toFixed(5)),
      high: Number(high.toFixed(5)),
      low: Number(low.toFixed(5)),
      close: Number(close.toFixed(5)),
      volume: Math.floor(randomBetween(120, 900))
    });

    previousClose = close;
  }

  return candles;
}

function getBasePriceForSymbol(symbol) {
  const map = {
    EURUSD_otc: 1.0845,
    USDJPY_otc: 149.72,
    GBPUSD_otc: 1.2724,
    BTCUSD_otc: 67180.15,
    ETHUSD_otc: 3528.91,
    XAUUSD_otc: 2348.5,
    NAS100_otc: 19680.45
  };

  return map[symbol] || 100;
}

function initMarketData() {
  SYMBOLS.forEach((symbol) => {
    if (!marketState.has(symbol)) {
      marketState.set(symbol, {
        symbol,
        candles: buildInitialCandles(symbol)
      });
    }
  });

  return getAllMarkets();
}

function getCandlesForSymbol(symbol) {
  const state = marketState.get(symbol);
  if (!state) {
    return [];
  }

  return state.candles;
}

function getAllMarkets() {
  return Array.from(marketState.values()).map((entry) => ({
    symbol: entry.symbol,
    last: entry.candles[entry.candles.length - 1]?.close || 0,
    previous: entry.candles[entry.candles.length - 2]?.close || 0,
    change: entry.candles[entry.candles.length - 1]?.close - (entry.candles[entry.candles.length - 2]?.close || 0),
    volume: entry.candles.reduce((sum, candle) => sum + candle.volume, 0)
  }));
}

function tickMarket() {
  const updates = [];

  SYMBOLS.forEach((symbol) => {
    const state = marketState.get(symbol);
    if (!state) {
      return;
    }

    const previousClose = state.candles[state.candles.length - 1]?.close || getBasePriceForSymbol(symbol);
    const volatility = previousClose * 0.0015;
    const direction = Math.random() > 0.5 ? 1 : -1;
    const nextClose = Math.max(0.0001, previousClose + direction * randomBetween(volatility * 0.2, volatility));

    const newCandle = {
      symbol,
      time: new Date().toISOString(),
      open: Number(previousClose.toFixed(5)),
      high: Number(Math.max(previousClose, nextClose) + randomBetween(0.0004, volatility * 0.6)).toFixed(5),
      low: Number(Math.min(previousClose, nextClose) - randomBetween(0.0004, volatility * 0.6)).toFixed(5),
      close: Number(nextClose.toFixed(5)),
      volume: Math.floor(randomBetween(150, 1200))
    };

    state.candles.push({
      ...newCandle,
      high: Number(newCandle.high),
      low: Number(newCandle.low),
      close: Number(newCandle.close)
    });

    if (state.candles.length > DEFAULT_HISTORY + 20) {
      state.candles.shift();
    }

    updates.push({
      symbol,
      candle: state.candles[state.candles.length - 1]
    });
  });

  return updates;
}

function normalizeForChart(candle) {
  return {
    time: Math.floor(new Date(candle.time).getTime() / 1000),
    open: Number(candle.open),
    high: Number(candle.high),
    low: Number(candle.low),
    close: Number(candle.close),
    volume: candle.volume
  };
}

module.exports = {
  initMarketData,
  getAllMarkets,
  getCandlesForSymbol,
  tickMarket,
  normalizeForChart
};
