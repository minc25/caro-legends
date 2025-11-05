import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // hoặc ghi rõ: "https://caro-legends.vercel.app"
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// 🧠 Socket.io logic
io.on("connection", (socket) => {
  console.log("🟢 Người chơi mới kết nối:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔴 Người chơi rời:", socket.id);
  });

  socket.on("player-move", (data) => {
    socket.broadcast.emit("opponent-move", data);
  });
});

// ❌ Không cần phục vụ index.html nữa
// app.use(express.static("dist"));
// app.get("*", (req, res) => {
//   res.sendFile(path.resolve(__dirname, "dist", "index.html"));
// });

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);
});
