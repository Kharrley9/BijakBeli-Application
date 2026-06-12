# BijakBeli - Smart Grocery Price Comparison System

> 🛒 Compare grocery prices across supermarkets in Batu Pahat, Johor, Malaysia.

## Features

- **Price Comparison** — Compare prices across AEON Big, BP Mall & Square One Mall
- **Smart Shopping Lists** — Auto-calculate totals and find cheapest store
- **Budget Planner** — Set and track monthly grocery budgets
- **Promotions Tracker** — Never miss a deal
- **Savings Reports** — Visualize your savings over time
- **AI Recommendations** — Smart product and store suggestions

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
