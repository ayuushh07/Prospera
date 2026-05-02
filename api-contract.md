# Prospera API Contract

These are the REST endpoints to implement in the real Node/Express backend.

| Method | Route | Purpose |
| --- | --- | --- |
| GET | /api/stocks?query=AAPL | Search stock symbols/company names |
| GET | /api/portfolio | Return cash, holdings, and portfolio value |
| POST | /api/orders | Create buy/sell transaction and update holdings |
| GET | /api/watchlist | Return saved watchlist symbols |
| POST | /api/watchlist | Add symbol to watchlist |
| DELETE | /api/watchlist/:symbol | Remove symbol from watchlist |
| GET | /api/transactions | Return recent transactions |

Example POST /api/orders body:

```json
{
  "symbol": "AAPL",
  "orderType": "buy",
  "shares": 3
}
```
