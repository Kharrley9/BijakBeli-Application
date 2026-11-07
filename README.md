# BijakBeli - Fresh Produce Price & Travel Comparison

> 🛒 A mobile app that compares fresh-produce prices at supermarkets across Malaysia
> and adds the cost of getting there, so buyers see which store is really the best value.

## Features

- **Price comparison**: real prices from PriceCatcher (KPDN, data.gov.my) at chain
  supermarkets (AEON BiG, Lotus's, MYDIN, Giant, Econsave and others)
- **Travel cost**: road distance, drive time and round-trip fuel cost (car or
  motorcycle) to each store; "best value" = item price + fuel
- **Nearby stores and malls**: map and distance-sorted list around the buyer's location
- **Price trend**: daily median price, by state where there is enough data
- **JOM Kongsi**: users report shelf prices; others confirm or dispute them
- **Promotions**: active deals at nearby stores

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native (Expo), TypeScript, NativeWind |
| Backend | Node.js, Express.js |
| Database | MongoDB (Atlas) |
| Auth | JWT + bcrypt |
| Data | PriceCatcher open data, OpenStreetMap (Nominatim, map tiles), OpenRouteService (optional) |

## Getting Started

### Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas)

### Server

```bash
cd server
npm install
cp .env.example .env      # then fill in MONGO_URI, JWT_SECRET, ...
npm run dev               # http://localhost:5000
```

### Prices

Stores and prices come from PriceCatcher. To refresh them with the latest month:

```bash
cd server
npm run import:prices:dry   # preview
npm run import:prices
```

On an empty database, build the catalogue first:
`node scripts/seedPriceCatcher.js`, then `node scripts/migrateFreshOnly.js`,
then `npm run import:prices`.

### Mobile

```bash
cd mobile
npm install
npx expo run:android      # custom dev build (see mobile/AGENTS.md)
```

## Project Structure

```
bijakbeli/
├── mobile/          # React Native (Expo) app
└── server/          # Express API
    └── scripts/     # PriceCatcher import and catalogue scripts
```

## Data attribution

Prices: PriceCatcher, KPDN, published on data.gov.my under CC BY 4.0.
Map data © OpenStreetMap contributors.

## License

MIT
