import express from "express";
import http from "http";
import { Server } from "socket.io";

import axios from "axios";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const rooms = new Map();

io.on("connection", (socket) => {
  console.log("user created", socket.id);
  let currentRoom = null;
  let currentuser = null;

  socket.on("join", ({ roomName, userName }) => {
    if (currentRoom) {
      socket.leave(currentRoom);
      rooms.get(currentRoom).delete(currentuser);
      io.to(currentRoom).emit(
        "user joined",
        Arrays.from(rooms.get(currentRoom))
      );
    }

    currentRoom = roomName;
    currentuser = userName;

    socket.join(roomName);
    if (!rooms.has(roomName)) {
      rooms.set(roomName, new Set());
    }
    rooms.get(roomName).add(userName);
    io.to(roomName).emit("user joined", Array.from(rooms.get(currentRoom)));
  });
  socket.on("codeChange", ({ roomName, code }) => {
    socket.to(roomName).emit("codeupdate", code);
  });

  socket.on("Leave", () => {
    if (currentRoom && currentuser) {
      rooms.get(currentRoom).delete(currentuser);
      io.to(currentRoom).emit(
        "user joined",
        Array.from(rooms.get(currentRoom))
      );

      socket.leave(currentRoom);
      currentRoom = null;
      currentuser = null;
    }
  });
  socket.on("typing", ({ roomName, userName }) => {
    socket.to(roomName).emit("user-typing", userName);
  });
  socket.on("languageChange", ({ roomName, language }) => {
    io.to(roomName).emit("languageUpdate", language);
  });
  socket.on("compileCode", async ({ code, roomName, language, version }) => {
    if (rooms.has(roomName)) {
      const room = rooms.get(roomName);
      const response = await axios.post(
        "https://emkc.org/api/v2/piston/execute",
        {
          language,
          version,
          files: [
            {
              content: code,
            },
          ],
        }
      );

      room.output = response.data.run.output;
      io.to(roomName).emit("codeResponse", response.data);
    }
  });

  socket.on("disconnect", () => {
    if (currentRoom && currentuser) {
      rooms.get(currentRoom).delete(currentuser);
      io.to(currentRoom).emit(
        "user joined",
        Array.from(rooms.get(currentRoom))
      );
    }
    console.log("user disconnected", socket.id);
  });
});
const port = process.env.PORT || 5000;

server.listen(port, () => {
  console.log("server is running.......");
});
