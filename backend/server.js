const express = require("express");
const dotenv = require("dotenv");
const app = express();
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const path = require("path");

dotenv.config();
connectDB();
const PORT = process.env.PORT || 8080;

app.use(express.json());

 app.use("/user", userRoutes);
 app.use("/chat", chatRoutes);
 app.use("/message", messageRoutes);

// *********** Deployment ************
//app.use("/api/user", userRoutes);
//app.use("/api/chat", chatRoutes);
//app.use("/api/message", messageRoutes);
const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
  console.log("Running in production");
  app.use(express.static(path.join(__dirname1, "/frontend/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname1, "frontend", "dist", "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("This is the homepage");
  });
}
// *********** Deployment ************

app.use(notFound);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Server is listening to port ${PORT}`);
});

const io = require("socket.io")(server, {
  pingTimeout: 60000, // 1 minute timeout
  cors: {
    origin: "https://talktide-8k88.onrender.com",
  },
});

io.on("connection", (socket) => {
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageReceived) => {
    const chat = newMessageReceived.chat;
    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id == newMessageReceived.sender._id) return;

      socket.in(user._id).emit("message received", newMessageReceived);
    });
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});
