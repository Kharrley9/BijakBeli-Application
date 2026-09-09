# BijakBeli - Smart Grocery Price & Travel Comparison

> 🛒 Compare grocery prices **and travel distance** across supermarkets and grocery
> stores across Malaysia. Built for traders and small retailers who buy stock in bulk
> and want to cut both the shelf price and the cost of getting there.

## Features

- **Price Comparison** — Compare item prices across stores nationwide
- **Travel Comparison** — See the distance and estimated drive time to every store,
  and the nearest store alongside the cheapest one, from your GPS location or a saved
  business location
- **Nearby Stores** — Map + distance-sorted list of stores around you
- **Smart Shopping Lists** — Auto-calculate basket totals and find the cheapest store
- **Budget Planner** — Set and track monthly grocery budgets
- **Promotions Tracker** — Never miss a deal
- **Savings Reports** — Visualize your savings over time

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB |
| Auth | JWT + bcrypt |

## Getting Started

### Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas)

### Installation

```bash
# Install all dependencies
npm run install:all

# Seed database with sample data
npm run seed

# Start development servers
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Project Structure

```
bijakbeli/
├── client/          # React frontend
├── server/          # Express backend
├── database/        # Database schemas documentation
├── scripts/         # Seed & utility scripts
├── docs/            # Documentation
└── tests/           # Test files
```

## License

MIT
