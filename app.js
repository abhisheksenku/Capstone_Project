// ==========================================================
//  Main Server (app.js)
// ==========================================================
require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const http = require("http");

// DB imports
const { connectMySQL } = require("./util/mysql");
const connectMongo = require("./util/mongo");

// Socket
const { initializeSocket } = require("./socket/index");

// Routes
const authRoutes = require("./routes/authRoutes");
// const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const premiumRoutes = require('./routes/premiumRoutes');
const fraudRoutes = require("./routes/fraudRoutes");

// Express app
const app = express();
const server = http.createServer(app);

// Attach sockets
const io = initializeSocket(server);
app.set("socket", io);
// LOAD ALL MODELS + ASSOCIATIONS FIRST
require("./models/mysql/associations");
// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// API routes
app.use("/api/auth", authRoutes);
// app.use('/api/admin',adminRoutes);
app.use('/api/user',userRoutes);
app.use('/api/premium', premiumRoutes);
app.use("/api/fraud", fraudRoutes);


// Frontend
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "views", "signup.html"))
);
app.get("/signup", (req, res) =>
  res.sendFile(path.join(__dirname, "views", "signup.html"))
);
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "admin.html"));
});
app.get("/user", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "user.html"));
});
app.get('/forgot-password',(req,res)=>{
    res.sendFile(path.join(__dirname,"views","forgotPassword.html"))
});
app.get('/reset-password/:token', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'reset-password.html'));
});
const PORT = process.env.PORT || 3000;

// ==========================================================
// START SERVER (MYSQL + MONGODB)
// ==========================================================

async function startServer() {
  try {
    // Connect Both DBs Before Starting App
    await connectMySQL();
    await connectMongo();

    server.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
