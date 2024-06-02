import { AppDataSource } from "@/database/data-source"
import * as dotenv from "dotenv"
import "reflect-metadata"
import { createServer } from "http";
import { Server } from "socket.io";
import app from "@/app"
import commentHandler from "./http/controllers/socket/commentHandler";
import likeHandler from "./http/controllers/socket/likeHandler";
import shareHandler from "./http/controllers/socket/shareHandler";
import AuthSocket from "./http/middlewares/AuthSocket";
import createDefaultPermission from "./database/seeds/permissions";
import createDefaultMenu from "./database/seeds/menu";
import { createPost } from "./database/seeds/post"

dotenv.config()

const PORT = process.env.APP_PORT || 3000

//handle socket
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: true,
  }
})
// const io = new Server(server);

// io.use((socket, next) => {
//   AuthSocket(socket, next)
// })
function getRandomMessage() {
  const messages = ['Hello!', 'How are you?', 'Welcome to the chat!', 'Socket.io is awesome!'];
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}

// Gửi tin nhắn ngẫu nhiên mỗi 3 giây
function sendRandomMessage(socket) {
  setInterval(() => {
    const randomMessage = getRandomMessage();
    socket.emit('randomMessage', randomMessage);
  }, 3000);
}
io.on("connection", (socket) => {
  console.log("WebSocket connected!")
  commentHandler(io, socket)
  likeHandler(io, socket)
  shareHandler(io, socket)
  sendRandomMessage(socket);
})
// io.engine.on("connection_error", (err) => {
//   console.log(err.req);      // the request object
//   console.log(err.code);     // the error code, for example 1
//   console.log(err.message);  // the error message, for example "Session ID unknown"
//   console.log(err.context);  // some additional error context
// });

AppDataSource.initialize()
  .then(async () => {
    console.log("Database connection success")
  })
  .then(()=>{
    createDefaultPermission()
    createDefaultMenu()
  })
  .catch((err) => console.error(err))

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

export default io