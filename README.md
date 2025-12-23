# Fin-Guard 🛡️

**Intelligent Portfolio Monitoring & Fraud Analytics Platform**

Fin-Guard is a **capstone-grade full-stack web application** for **investment portfolio management**, **market monitoring**, and **fraud analytics**.

It is designed to resemble a **real-world financial monitoring system**, featuring a **refresh-safe, event-driven frontend** and a **REST + real-time backend**.

---

## 🚀 Features

### 📊 Portfolio Management

* Create, view, and delete portfolios
* Portfolio-scoped holdings
* Holding-scoped transactions
* Persistent context across refresh (portfolio / holding)

### 📈 Dashboard & Market Analytics

* KPI summary (Investment, P/L, Risk)
* Portfolio history & asset allocation
* Market overview, heatmap, trending assets
* Watchlist tracking

### 🛡️ Fraud Analytics

* Fraud overview KPIs
* ML-based fraud analysis history
* User fraud case history
* Geo-risk & fraud score distribution
* Fraud test simulation

**Breadcrumb-aware fraud subviews:**

* Overview
* Analysis History
* Case History

### ⚡ Real-Time Updates

* Socket.IO integration
* Live updates for portfolios, holdings, and transactions
* Optional fraud alerts on transaction events

### 👤 User & Premium System

* JWT-based authentication
* Protected routes
* Premium feature gating
* Profile management

---

## 🧱 Tech Stack

### Frontend

* Vanilla JavaScript (ES Modules)
* Tailwind CSS
* Event-driven UI (no framework)
* Chart.js
* Socket.IO Client

### Backend

* Node.js + Express
* Sequelize ORM
* MySQL
* JWT Authentication
* Yahoo Finance API
* Socket.IO Server

---

## 📁 Project Structure

```
fin-guard/
│
├── public/
│   ├── index.html
│   └── js/
│       ├── core/          # auth, api, state, socket
│       ├── layout/        # navigation, breadcrumb, profile
│       ├── dashboard/     # dashboard & charts
│       ├── portfolio/     # portfolios, holdings, transactions
│       ├── market/        # market, watchlist, heatmap
│       ├── fraud/         # fraud analytics modules
│       ├── alerts/        # alerts & risk notifications
│       ├── premium/       # premium feature logic
│       └── user.js        # frontend entry point
│
├── src/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   └── app.js
│
├── server.js
├── package.json
├── .env
└── README.md
```

---

## 🧠 Frontend Architecture

### Design Principles

* **Single Source of Truth** (`core/state.js`)
* **Event-Driven UI** (`view:change`, `fraud:subview`)
* **Refresh-Safe Navigation**
* **Domain-Isolated Modules**
* **No Framework Lock-In**

---

## 🔁 Frontend View Flow

```mermaid
flowchart LR
    A[Sidebar Navigation] --> B[View Resolver]
    B --> C[Reset UI State]
    B --> D[Mount View]
    B --> E[Persist Navigation State]
    B --> F[Broadcast view:change]

    F --> G[Dashboard Handler]
    F --> H[Portfolio Handler]
    F --> I[Holdings Handler]
    F --> J[Transactions Handler]
    F --> K[Fraud Handler]
```

---

## 🗂️ State Management

```mermaid
classDiagram
    class State {
        currentView
        activePortfolioId
        activePortfolioName
        activeHoldingId
        activeHoldingSymbol
        fraudSubview
    }

    State --> sessionStorage
    State --> socket
```

---

## 🛡️ Fraud Analytics Subviews

```mermaid
stateDiagram-v2
    [*] --> Overview
    Overview --> Analysis
    Overview --> Cases
    Analysis --> Overview
    Cases --> Overview
```

---

## 🧩 Frontend Entry Point

### `public/js/user.js`

**Responsibilities:**

* Authentication check
* Socket initialization
* Navigation & breadcrumb bootstrap
* Module initialization
* View restoration
* Dashboard lazy loading

---

## 🔐 Authentication Flow

```mermaid
sequenceDiagram
    User->>Frontend: Load dashboard
    Frontend->>Auth Module: requireAuth()
    Auth Module->>Backend: Verify JWT
    Backend-->>Auth Module: Valid / Invalid
    Auth Module-->>Frontend: Allow / Redirect
```

---

## ⚙️ Environment Setup

### 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/fin-guard.git
cd fin-guard
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Configure Environment Variables

Create a `.env` file:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=capstonedb
JWT_SECRET=your_secret
```

### 4️⃣ Run Development Server

```bash
npm run dev
```

---

## 🧪 Development Notes

* Tailwind CDN is used for development
* Production should use Tailwind CLI / PostCSS
* Fraud ML logic is modular and extensible
* Yahoo Finance API warnings may appear at runtime

---

## 📌 Project Status

| Feature                 | Status |
| ----------------------- | ------ |
| Portfolio Management    | ✅      |
| Dashboard Analytics     | ✅      |
| Market Monitoring       | ✅      |
| Fraud Analytics         | ✅      |
| Real-Time Updates       | ✅      |
| Refresh Safety          | ✅      |
| Production Optimization | 🟡     |

---

## 👨‍💻 Author

Built as a **capstone-grade full-stack project** with emphasis on:

* Clean architecture
* Predictable UI behavior
* Real-world financial workflows
* Maintainability over frameworks

---

## 📄 License

This project is intended for **academic, learning, and demonstration purposes only**.

---
