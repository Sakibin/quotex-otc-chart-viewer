const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { PORT, STREAM_INTERVAL_MS } = require('./config');
const {
  initMarketData,
  getAllMarkets,
  getCandlesForSymbol,
  tickMarket,
  normalizeForChart
} = require('./services/candleCollector');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const marketData = initMarketData();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Quotex OTC chart service is running',
    symbols: marketData.length
  });
});

app.get('/api/markets', (req, res) => {
  res.json(getAllMarkets());
});

app.get('/api/candles', (req, res) => {
  const symbol = req.query.symbol || 'EURUSD_otc';
  const candles = getCandlesForSymbol(symbol);
  res.json(candles.map(normalizeForChart));
});

app.get('/api/markets/:symbol', (req, res) => {
  const symbol = req.params.symbol;
  const candles = getCandlesForSymbol(symbol);

  if (!candles || candles.length === 0) {
    return res.status(404).json({ error: 'Market not found' });
  }

  const last = candles[candles.length - 1];
  res.json({
    symbol,
    last,
    candles: candles.map(normalizeForChart)
  });
});

io.on('connection', (socket) => {
  socket.emit('market:ready', {
    message: 'Connected to chart stream',
    markets: getAllMarkets()
  });

  socket.on('subscribe', (symbol) => {
    if (symbol) {
      socket.join(symbol);
      socket.emit('subscribed', { symbol });
    }
  });
});

setInterval(() => {
  const updates = tickMarket();

  if (!updates || updates.length === 0) {
    return;
  }

  updates.forEach((entry) => {
    io.to(entry.symbol).emit('market:update', {
      symbol: entry.symbol,
      candle: normalizeForChart(entry.candle)
    });
  });

  io.emit('market:summary', getAllMarkets());
}, STREAM_INTERVAL_MS);

server.listen(PORT, () => {
  console.log(`Quotex OTC chart viewer running on http://localhost:${PORT}`);
});
