const socket = io();

// DOM Elements
const navItems = document.querySelectorAll('.nav-item');
const viewSections = document.querySelectorAll('.view-section');
const pageTitle = document.getElementById('pageTitle');
const pageSubtitle = document.getElementById('pageSubtitle');
const currentTimeEl = document.getElementById('currentTime');
const toggleMobileMenuBtn = document.getElementById('toggleMobileMenu');
const sidebar = document.querySelector('.sidebar');

// Chart variables
let featuredChart = null;
let featuredCandleSeries = null;
let currentSymbol = 'EURUSD_otc';

const marketData = new Map();
let allMarketsData = [];

// Initialize
async function init() {
  setupNavigation();
  setupMobileMenu();
  updateClock();
  setInterval(updateClock, 1000);
  
  await loadMarketData();
  createFeaturedChart();
  setupSocketListeners();
  
  // Populate featured symbol select
  const featuredSelect = document.getElementById('featuredSymbolSelect');
  featuredSelect.addEventListener('change', (e) => {
    currentSymbol = e.target.value;
    loadChartData(currentSymbol);
  });
}

// Navigation
function setupNavigation() {
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const view = item.dataset.view;
      
      // Update active nav
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      
      // Update view
      viewSections.forEach(section => section.classList.remove('active'));
      document.getElementById(`view-${view}`).classList.add('active');
      
      // Update title
      const titles = {
        'overview': { title: 'Market Overview', subtitle: 'Real-time data analysis' },
        'markets': { title: 'All Markets', subtitle: 'Complete market grid view' },
        'analytics': { title: 'Analytics', subtitle: 'Market analysis and insights' },
        'settings': { title: 'Settings', subtitle: 'Configuration and system info' }
      };
      
      const titleData = titles[view];
      pageTitle.textContent = titleData.title;
      pageSubtitle.textContent = titleData.subtitle;
      
      // Close mobile menu
      if (sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
      }
    });
  });
}

// Mobile Menu
function setupMobileMenu() {
  toggleMobileMenuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.sidebar') && !e.target.closest('#toggleMobileMenu')) {
      sidebar.classList.remove('open');
    }
  });
}

// Clock
function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  currentTimeEl.textContent = `${hours}:${minutes}`;
}

// Format helpers
function formatPrice(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '--';
  if (value > 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (value > 1) return value.toLocaleString(undefined, { maximumFractionDigits: 5 });
  return value.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function formatPercent(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '--';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

// Load market data
async function loadMarketData() {
  try {
    const response = await fetch('/api/markets');
    allMarketsData = await response.json();
    
    updateStatsCards();
    updateMarketsTable();
    updateMarketsGrid();
    updateAnalytics();
  } catch (error) {
    console.error('Error loading market data:', error);
  }
}

// Update stats cards
function updateStatsCards() {
  const totalMarkets = allMarketsData.length;
  const gainers = allMarketsData.filter(m => m.change >= 0).length;
  const losers = allMarketsData.filter(m => m.change < 0).length;
  const totalVolume = allMarketsData.reduce((sum, m) => sum + (m.volume || 0), 0);
  
  document.getElementById('totalMarkets').textContent = totalMarkets;
  document.getElementById('gainersCount').textContent = gainers;
  document.getElementById('losersCount').textContent = losers;
  document.getElementById('totalDataPoints').textContent = totalVolume.toLocaleString();
}

// Update markets table
function updateMarketsTable() {
  const tbody = document.getElementById('marketsTableBody');
  tbody.innerHTML = '';
  
  allMarketsData.slice(0, 10).forEach(market => {
    const row = document.createElement('tr');
    const changePercent = market.previous ? ((market.change / market.previous) * 100) : 0;
    const changeClass = market.change >= 0 ? 'price-up' : 'price-down';
    const changeIcon = market.change >= 0 ? '📈' : '📉';
    
    row.innerHTML = `
      <td><span class="symbol-cell">${market.symbol}</span></td>
      <td class="${changeClass}">${formatPrice(market.last)}</td>
      <td class="${changeClass} hide-mobile">${formatPercent(changePercent)}</td>
      <td class="hide-mobile">${market.volume.toLocaleString()}</td>
      <td><span class="status-badge live">${changeIcon} Live</span></td>
    `;
    
    tbody.appendChild(row);
  });
}

// Update markets grid
function updateMarketsGrid() {
  const grid = document.getElementById('marketsGrid');
  grid.innerHTML = '';
  
  allMarketsData.forEach(market => {
    const changePercent = market.previous ? ((market.change / market.previous) * 100) : 0;
    const changeClass = market.change >= 0 ? 'up' : 'down';
    const changeIcon = market.change >= 0 ? '📈' : '📉';
    
    const card = document.createElement('div');
    card.className = 'market-card';
    card.innerHTML = `
      <div class="market-card-header">
        <span class="market-card-symbol">${market.symbol}</span>
        <span style="font-size: 1.2rem;">${changeIcon}</span>
      </div>
      <div class="market-card-price">${formatPrice(market.last)}</div>
      <div class="market-card-change ${changeClass}">${formatPercent(changePercent)}</div>
    `;
    
    card.addEventListener('click', () => {
      document.querySelector('[data-view="overview"]').click();
      document.getElementById('featuredSymbolSelect').value = market.symbol;
      currentSymbol = market.symbol;
      loadChartData(market.symbol);
    });
    
    grid.appendChild(card);
  });
}

// Update analytics
function updateAnalytics() {
  const gainers = allMarketsData.filter(m => m.change > 0).sort((a, b) => b.change - a.change).slice(0, 5);
  const losers = allMarketsData.filter(m => m.change < 0).sort((a, b) => a.change - b.change).slice(0, 5);
  
  // Top gainers
  const gainersDiv = document.getElementById('topGainers');
  gainersDiv.innerHTML = '';
  gainers.forEach(market => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <span class="list-item-symbol">${market.symbol}</span>
      <span class="list-item-value gain">${formatPercent((market.change / market.previous) * 100)}</span>
    `;
    gainersDiv.appendChild(item);
  });
  
  // Top losers
  const losersDiv = document.getElementById('topLosers');
  losersDiv.innerHTML = '';
  losers.forEach(market => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <span class="list-item-symbol">${market.symbol}</span>
      <span class="list-item-value loss">${formatPercent((market.change / market.previous) * 100)}</span>
    `;
    losersDiv.appendChild(item);
  });
  
  // Collector status
  const statusDiv = document.getElementById('collectorStatus');
  statusDiv.innerHTML = `
    <div class="status-item">
      <span>Markets Tracked</span>
      <span class="status-item-value good">${allMarketsData.length}</span>
    </div>
    <div class="status-item">
      <span>Data Points</span>
      <span class="status-item-value good">Live</span>
    </div>
    <div class="status-item">
      <span>Last Update</span>
      <span class="status-item-value good">Now</span>
    </div>
  `;
}

// Create featured chart
function createFeaturedChart() {
  const container = document.getElementById('featuredChart');
  featuredChart = LightweightCharts.createChart(container, {
    layout: {
      background: { color: '#0a0e27' },
      textColor: '#e4e6eb',
      fontFamily: 'Inter, sans-serif'
    },
    grid: {
      vertLines: { color: '#1a1f42' },
      horzLines: { color: '#1a1f42' }
    },
    rightPriceScale: {
      borderColor: '#2a2f52'
    },
    timeScale: {
      borderColor: '#2a2f52',
      timeVisible: true
    }
  });
  
  featuredCandleSeries = featuredChart.addCandlestickSeries({
    upColor: '#31a24c',
    downColor: '#f02849',
    borderVisible: false,
    wickUpColor: '#31a24c',
    wickDownColor: '#f02849'
  });
  
  loadChartData(currentSymbol);
}

// Load chart data
async function loadChartData(symbol) {
  try {
    const response = await fetch(`/api/candles?symbol=${encodeURIComponent(symbol)}`);
    const candles = await response.json();
    
    if (featuredCandleSeries && candles.length > 0) {
      featuredCandleSeries.setData(candles.map(c => ({
        time: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close
      })));
      featuredChart.timeScale().fitContent();
      
      // Update chart info
      const lastCandle = candles[candles.length - 1];
      const prevCandle = candles[candles.length - 2];
      
      document.getElementById('currentPrice').textContent = formatPrice(lastCandle.close);
      document.getElementById('priceChange').textContent = formatPercent((lastCandle.close - prevCandle.close) / prevCandle.close * 100);
      document.getElementById('currentVolume').textContent = lastCandle.volume.toLocaleString();
    }
  } catch (error) {
    console.error('Error loading chart data:', error);
  }
}

// Socket listeners
function setupSocketListeners() {
  socket.on('market:summary', (markets) => {
    allMarketsData = markets;
    updateStatsCards();
    updateMarketsTable();
    updateAnalytics();
  });
  
  socket.on('market:update', (payload) => {
    const { symbol, candle } = payload;
    
    if (symbol === currentSymbol && featuredCandleSeries) {
      featuredCandleSeries.update({
        time: candle.time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close
      });
      
      document.getElementById('currentPrice').textContent = formatPrice(candle.close);
      document.getElementById('currentVolume').textContent = candle.volume.toLocaleString();
    }
  });
}

// Search functionality
document.getElementById('searchMarkets').addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  const rows = document.querySelectorAll('.markets-table tbody tr');
  
  rows.forEach(row => {
    const symbol = row.querySelector('.symbol-cell').textContent.toLowerCase();
    row.style.display = symbol.includes(query) ? '' : 'none';
  });
});

// Save settings
document.getElementById('saveSettings').addEventListener('click', () => {
  alert('Settings saved successfully!');
});

// Start
init();
