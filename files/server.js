const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Store connected users: { socketId -> username }
const onlineUsers = {};

io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);

  // User joins with a username
  socket.on('user_join', (username) => {
    onlineUsers[socket.id] = username;

    // Notify everyone that this user joined
    io.emit('system_message', {
      text: `${username} joined the chat`,
      type: 'join',
      timestamp: new Date().toISOString()
    });

    // Send updated user list to everyone
    io.emit('update_users', Object.values(onlineUsers));

    console.log(`${username} joined. Total users: ${Object.keys(onlineUsers).length}`);
  });

  // Handle incoming chat message
  socket.on('send_message', (data) => {
    const username = onlineUsers[socket.id];
    if (!username || !data.text || data.text.trim() === '') return;

    const messageData = {
      username,
      text: data.text.trim(),
      timestamp: new Date().toISOString(),
      socketId: socket.id
    };

    // Broadcast to ALL connected clients (including sender)
    io.emit('receive_message', messageData);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const username = onlineUsers[socket.id];
    if (username) {
      delete onlineUsers[socket.id];

      io.emit('system_message', {
        text: `${username} left the chat`,
        type: 'leave',
        timestamp: new Date().toISOString()
      });

      io.emit('update_users', Object.values(onlineUsers));
      console.log(`${username} disconnected. Total users: ${Object.keys(onlineUsers).length}`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Chat server running on port ${PORT}`);
});
