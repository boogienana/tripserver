const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

const rooms = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', ({ roomCode, username, avatarUri }) => {
    socket.join(roomCode);
    socket.roomCode = roomCode;
    socket.username = username;

    if (!rooms[roomCode]) {
      rooms[roomCode] = {};
    }

    rooms[roomCode][socket.id] = {
      id: socket.id,
      username: username || 'Rider',
      avatarUri: avatarUri || null,
      latitude: 0,
      longitude: 0,
      speed: 0,
    };

    io.to(roomCode).emit('room-users', Object.values(rooms[roomCode]));
  });

  socket.on('update-location', ({ latitude, longitude, speed }) => {
    const roomCode = socket.roomCode;
    if (roomCode && rooms[roomCode] && rooms[roomCode][socket.id]) {
      rooms[roomCode][socket.id].latitude = latitude;
      rooms[roomCode][socket.id].longitude = longitude;
      rooms[roomCode][socket.id].speed = speed;

      io.to(roomCode).emit('room-users', Object.values(rooms[roomCode]));
    }
  });

  socket.on('disconnect', () => {
    const roomCode = socket.roomCode;
    if (roomCode && rooms[roomCode]) {
      delete rooms[roomCode][socket.id];
      if (Object.keys(rooms[roomCode]).length === 0) {
        delete rooms[roomCode];
      } else {
        io.to(roomCode).emit('room-users', Object.values(rooms[roomCode]));
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
