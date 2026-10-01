const socket = io();
const symbolSelect = document.getElementById('symbolSelect');
const statsGrid = document.getElementById('statsGrid');
const activeSymbol = document.getElementById('activeSymbol');
const priceBadge = document.getElementById('priceBadge');

let chart;
let candleSeries;
let currentSymbol = 'EURUSD_otc';

function formatPrice(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '--';

  if (value > 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (value > 1) return value.toLocaleString(undefined, { maximumFractionDigits: 5 });
  return value.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function formatPercent(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '--';
  return `${value >= 0 ? '+' : ''}${value.toFixed(4)}%`;
}

function updatePriceBadge(market) {
  const target = market || { last: 0, change: 0 };
  const tone = target.change >= 0 ? 'green' : 'red';

  priceBadge.textContent = `${formatPrice(target.last)} ${formatPercent((target.change / (target.previous || target.last || 1)) * 100)}`;
  priceBadge.style.background = tone === 'green' ? 'rgba(34, 197, 94, 0.14)' : 'rgba(239, 68, 68, 0.14)';
  priceBadge.style.color = tone === 'green' ? '#22c55e' : '#ef4444';
  priceBadge.style.borderColor = tone === 'green' ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.35)';
}

function renderStats(markets) {
  statsGrid.innerHTML = '';

  markets.slice(0, 4).forEach((market) => {
    const card = document.createElement('div');
    card.className = 'stat-card';
    card.innerHTML = `
      <p class="stat-label">${market.symbol}</p>
      <p class="stat-value">${formatPrice(market.last)}</p>
    `;
    statsGrid.appendChild(card);
  });
}

function createChart() {
  chart = LightweightCharts.createChart(document.getElementById('chart'), {
    layout: {
      background: { color: '#0d1729' },
      textColor: '#e5eefc',
      fontFamily: 'Inter, sans-serif'
    },
    grid: {
      vertLines: { color: 'rgba(148, 163, 184, 0.12)' },
      horzLines: { color: 'rgba(148, 163, 184, 0.12)' }
    },
    rightPriceScale: {
      borderColor: 'rgba(148, 163, 184, 0.15)'
    },
    timeScale: {
      borderColor: 'rgba(148, 163, 184, 0.15)',
      timeVisible: true,
      secondsVisible: false
    },
    crosshair: {
      mode: LightweightCharts.CrosshairMode.Normal
    }
  });

  candleSeries = chart.addCandlestickSeries({
    upColor: '#22c55e',
    downColor: '#ef4444',
    borderVisible: false,
    wickUpColor: '#22c55e',
    wickDownColor: '#ef4444'
  });
}

async function loadMarkets() {
  const response = await fetch('/api/markets');
  const markets = await response.json();

  symbolSelect.innerHTML = markets
    .map((market) => `<option value="${market.symbol}">${market.symbol}</option>`)
    .join('');

  symbolSelect.value = currentSymbol;
  renderStats(markets);

  const market = markets.find((item) => item.symbol === currentSymbol) || markets[0];
  if (market) {
    updatePriceBadge(market);
  }
}

async function loadCandles(symbol) {
  const response = await fetch(`/api/candles?symbol=${encodeURIComponent(symbol)}`);
  const candles = await response.json();

  if (!candleSeries) {
    createChart();
  }

  candleSeries.setData(candles);
  chart.timeScale().fitContent();

  const selectedMarket = (await fetch('/api/markets').then((res) => res.json())).find((item) => item.symbol === symbol);
  if (selectedMarket) {
    updatePriceBadge(selectedMarket);
  }
}

symbolSelect.addEventListener('change', async (event) => {
  currentSymbol = event.target.value;
  activeSymbol.textContent = currentSymbol;
  socket.emit('subscribe', currentSymbol);
  await loadCandles(currentSymbol);
});

socket.on('market:summary', async (markets) => {
  renderStats(markets);

  const selectedMarket = markets.find((market) => market.symbol === currentSymbol);
  if (selectedMarket) {
    updatePriceBadge(selectedMarket);
  }
});

socket.on('market:update', (payload) => {
  const { symbol, candle } = payload;
  if (symbol !== currentSymbol) return;

  candleSeries.update({
    time: candle.time,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close
  });

  const lastValue = candle.close;
  const previousValue = candle.open;
  const change = ((lastValue - previousValue) / previousValue) * 100;
  priceBadge.textContent = `${formatPrice(lastValue)} ${formatPercent(change)}`;
});

async function init() {
  await loadMarkets();
  activeSymbol.textContent = currentSymbol;
  socket.emit('subscribe', currentSymbol);
  await loadCandles(currentSymbol);
}

init();
