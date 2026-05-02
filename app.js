const STOCKS = [
  { symbol: "AAPL", name: "Apple Inc.", price: 193.12, change: 1.22, history: [171, 176, 174, 180, 185, 181, 189, 193] },
  { symbol: "MSFT", name: "Microsoft Corp.", price: 421.64, change: 0.84, history: [388, 392, 401, 398, 406, 413, 419, 422] },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 889.45, change: 2.74, history: [705, 740, 720, 780, 810, 842, 860, 889] },
  { symbol: "TSLA", name: "Tesla Inc.", price: 177.67, change: -1.32, history: [221, 208, 197, 190, 185, 181, 179, 178] },
  { symbol: "AMZN", name: "Amazon.com Inc.", price: 184.88, change: 0.61, history: [161, 163, 170, 166, 174, 179, 182, 185] },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 156.33, change: -0.28, history: [145, 151, 153, 150, 154, 157, 158, 156] }
];

const DEFAULT_STATE = {
  cash: 10000,
  selectedSymbol: "AAPL",
  watchlist: ["AAPL", "MSFT"],
  holdings: {},
  transactions: []
};

let state = loadState();

const $ = (id) => document.getElementById(id);
const currency = (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
const selectedStock = () => STOCKS.find((stock) => stock.symbol === state.selectedSymbol) || STOCKS[0];

function loadState() {
  const stored = localStorage.getItem("prospera-state");
  return stored ? JSON.parse(stored) : structuredClone(DEFAULT_STATE);
}

function saveState() {
  localStorage.setItem("prospera-state", JSON.stringify(state));
}

function renderStocks(filter = "") {
  const query = filter.toLowerCase();
  const results = STOCKS.filter((stock) => stock.symbol.toLowerCase().includes(query) || stock.name.toLowerCase().includes(query));
  $("stockResults").innerHTML = results.map((stock) => `
    <button class="stock-card" data-symbol="${stock.symbol}">
      <strong>${stock.symbol} · ${currency(stock.price)}</strong>
      <span>${stock.name}</span>
      <span class="${stock.change >= 0 ? "positive" : "negative"}">${stock.change >= 0 ? "+" : ""}${stock.change}% today</span>
    </button>
  `).join("");

  document.querySelectorAll(".stock-card").forEach((card) => {
    card.addEventListener("click", () => {
      state.selectedSymbol = card.dataset.symbol;
      saveState();
      render();
    });
  });
}

function renderChart(stock) {
  const values = stock.history;
  const width = 600;
  const height = 220;
  const padding = 28;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const points = values.map((value, index) => {
    const x = padding + (index * (width - padding * 2)) / (values.length - 1);
    const y = height - padding - ((value - min) / (max - min || 1)) * (height - padding * 2);
    return `${x},${y}`;
  }).join(" ");

  $("priceChart").innerHTML = `
    <defs>
      <linearGradient id="lineGlow" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#49e284" stop-opacity=".35" />
        <stop offset="100%" stop-color="#49e284" stop-opacity="1" />
      </linearGradient>
    </defs>
    <polyline points="${points}" fill="none" stroke="url(#lineGlow)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
    ${values.map((value, index) => {
      const [x, y] = points.split(" ")[index].split(",");
      return `<circle cx="${x}" cy="${y}" r="4" fill="#49e284"><title>${currency(value)}</title></circle>`;
    }).join("")}
    <text x="28" y="34" fill="#8db59f" font-size="13">8-period simulated price history</text>
  `;
}

function renderPortfolio() {
  const rows = Object.entries(state.holdings).filter(([, shares]) => shares > 0);
  if (!rows.length) {
    $("holdingsList").innerHTML = `<p class="subtitle">No holdings yet. Submit a buy order to start the simulation.</p>`;
    return;
  }
  $("holdingsList").innerHTML = rows.map(([symbol, shares]) => {
    const stock = STOCKS.find((item) => item.symbol === symbol);
    return `
      <div class="list-item">
        <div><strong>${symbol}</strong><p class="subtitle">${shares} shares</p></div>
        <strong>${currency(shares * stock.price)}</strong>
      </div>
    `;
  }).join("");
}

function renderWatchlist() {
  if (!state.watchlist.length) {
    $("watchlist").innerHTML = `<p class="subtitle">Your watchlist is empty.</p>`;
    return;
  }
  $("watchlist").innerHTML = state.watchlist.map((symbol) => `<span class="pill" data-symbol="${symbol}">${symbol}</span>`).join("");
  document.querySelectorAll(".pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      state.selectedSymbol = pill.dataset.symbol;
      saveState();
      render();
    });
  });
}

function renderTransactions() {
  const recent = state.transactions.slice(0, 8);
  $("transactionsTable").innerHTML = recent.length ? recent.map((tx) => `
    <tr>
      <td>${tx.date}</td>
      <td>${tx.type.toUpperCase()}</td>
      <td>${tx.symbol}</td>
      <td>${tx.shares}</td>
      <td>${currency(tx.price)}</td>
      <td>${currency(tx.total)}</td>
    </tr>
  `).join("") : `<tr><td colspan="6">No transactions yet.</td></tr>`;
}

function handleTrade(event) {
  event.preventDefault();
  const stock = selectedStock();
  const shares = Number($("sharesInput").value);
  const type = $("orderType").value;
  const total = shares * stock.price;
  const message = $("orderMessage");
  message.classList.remove("error");

  if (!Number.isInteger(shares) || shares <= 0) {
    message.textContent = "Enter a whole number of shares.";
    message.classList.add("error");
    return;
  }

  if (type === "buy" && total > state.cash) {
    message.textContent = `Not enough cash. This order costs ${currency(total)}.`;
    message.classList.add("error");
    return;
  }

  if (type === "sell" && (state.holdings[stock.symbol] || 0) < shares) {
    message.textContent = `You do not own enough ${stock.symbol} shares to sell.`;
    message.classList.add("error");
    return;
  }

  state.cash += type === "buy" ? -total : total;
  state.holdings[stock.symbol] = (state.holdings[stock.symbol] || 0) + (type === "buy" ? shares : -shares);
  state.transactions.unshift({
    date: new Date().toLocaleString(),
    type,
    symbol: stock.symbol,
    shares,
    price: stock.price,
    total
  });
  saveState();
  message.textContent = `${type === "buy" ? "Bought" : "Sold"} ${shares} ${stock.symbol} shares for ${currency(total)}.`;
  render();
}

function render() {
  const stock = selectedStock();
  $("cashBalance").textContent = currency(state.cash);
  $("selectedName").textContent = stock.name;
  $("selectedSymbol").textContent = stock.symbol;
  $("selectedPrice").textContent = currency(stock.price);
  $("selectedChange").textContent = `${stock.change >= 0 ? "+" : ""}${stock.change}%`;
  $("selectedChange").className = stock.change >= 0 ? "positive" : "negative";
  $("watchlistBtn").textContent = state.watchlist.includes(stock.symbol) ? "Remove from Watchlist" : "Add to Watchlist";
  renderStocks($("stockSearch").value);
  renderChart(stock);
  renderPortfolio();
  renderWatchlist();
  renderTransactions();
}

$("stockSearch").addEventListener("input", (event) => renderStocks(event.target.value));
$("tradeForm").addEventListener("submit", handleTrade);
$("watchlistBtn").addEventListener("click", () => {
  const symbol = selectedStock().symbol;
  state.watchlist = state.watchlist.includes(symbol)
    ? state.watchlist.filter((item) => item !== symbol)
    : [...state.watchlist, symbol];
  saveState();
  render();
});
$("resetBtn").addEventListener("click", () => {
  localStorage.removeItem("prospera-state");
  state = structuredClone(DEFAULT_STATE);
  render();
});

render();
