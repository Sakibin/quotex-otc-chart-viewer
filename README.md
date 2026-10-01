# Quotex OTC Chart Viewer

This project is a starter real-time market chart viewer for Quotex-style OTC instruments.

## Features

- live market stream simulation for OTC pairs
- candle collection and streaming service
- chart display using lightweight-charts
- simple UI with symbol selector
- REST endpoints for market and candle data

## Run locally

```bash
npm install
npm start
```

Then open:

```text
http://localhost:3000
```

## Project layout

```text
.
├── public/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── src/
│   ├── config.js
│   ├── server.js
│   └── services/
│       └── candleCollector.js
├── .gitignore
├── package.json
└── README.md
```

## Notes

This starter uses simulated OTC market data so you can quickly build a charting interface and streaming architecture. For real Quotex integration, replace the simulated candle generator with the official market feed or broker-supported WebSocket data.
