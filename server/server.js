const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");

const app = express();
const connectDB = require("./Service/ConnectDBService");

const userRoute = require("./Router/UserRoute");
const userAdminRoute = require("./Router/UserAdminRoute");
const authRoute = require("./Router/AuthRoute");
const commentRoute = require("./Router/CommentRoute");

// middleware
app.use(cors());
app.use(express.json());

// connect DB
connectDB();

// Serve FE static
app.use(express.static(path.join(__dirname, "../client")));

// API routes
app.use("/auth/admin", userAdminRoute);
app.use("/api/authUser", userRoute);
app.use("/api", userRoute);
app.use("/api/auth", authRoute);
app.use("/api/comments", commentRoute);

app.use((req, res) => {
  res
    .status(404)
    .sendFile(path.join(__dirname, "../client/view/pages/404.html"));
});

// start server
app.listen(process.env.PORT, () => {
  console.log(`Server listening on port ${process.env.PORT}`);

});
