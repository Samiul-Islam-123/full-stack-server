const express = require('express');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const routes = require('./Routes/GoogleAuth/GoogleAuth');
const cors = require('cors');
const dotenv = require('dotenv');
const SignupRoute = require('./Routes/Manual/Signup');
const Connect = require('./Database/Connection');
const LoginRoute = require('./Routes/Manual/Login');
const VerificationRoute = require('./Routes/Manual/Verification');
const ResetPasswordRoute = require('./Routes/Manual/PasswordReset');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
app.use(express.json());
app.use(cors());
dotenv.config();

// Set up Passport Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/',
      scope: ['profile', 'email'],
    },
    function (accessToken, refreshToken, profile, callback) {
      callback(null, profile);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Use express-session middleware
app.use(session({ secret: 'your-secret-key', resave: true, saveUninitialized: true }));

// Initialize Passport and restore authentication state if available
app.use(passport.initialize());
app.use(passport.session());

// Include your routes
app.use('/auth', routes);
app.use('/auth/manual', SignupRoute);
app.use('/auth/manual', LoginRoute);
app.use('/auth/manual', VerificationRoute);
app.use('/auth/manual', ResetPasswordRoute);

// Create an HTTP server
const server = http.createServer(app);

// Create a Socket.IO server attached to the HTTP server
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Socket.IO logic
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // WebRTC signaling for creating room
  socket.on('create-room-request', () => {
    socket.join(socket.id);

    // Send room ID to the client
    socket.emit('create-room-response', {
      roomID: socket.id,
    });
  });

  // WebRTC signaling for joining a room
  socket.on('join-room-request', (roomID) => {
    socket.join(roomID);

    // Notify the room that a user has joined
    io.to(roomID).emit('join-room-response', {
      message: 'User joined',
      roomID: roomID,
    });
  });

  // WebRTC signaling for offer
  socket.on('offer', (data) => {
	console.log(data.roomID)
    io.to(data.roomID).emit('offer', {
      signal: data.signal,
      callerID: socket.id,
	  msg : "Test"
    });
  });

  // WebRTC signaling for answer
  socket.on('answer', (data) => {
    io.to(data.roomID).emit('answer', {
      signal: data.signal,
      calleeID: socket.id,
    });
  });

  // WebRTC signaling for ICE candidates
  socket.on('ice-candidate', (data) => {
    io.to(data.roomID).emit('ice-candidate', {
      candidate: data.candidate,
      senderID: socket.id,
    });
  });

  // Handle user disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    // Perform necessary cleanup or notify others if needed
  });
});

// Start the server
const PORT = process.env.PORT || 5500;
server.listen(PORT, async () => {
  console.log('Server is starting...');
  await Connect();
  console.log(`Server is running on port ${PORT}`);
});
