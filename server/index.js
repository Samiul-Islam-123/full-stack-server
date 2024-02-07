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
const uuid = require('uuid')
const { ExpressPeerServer } = require('peer');
const VideoStreamingCreateRoutes = require('./Routes/ServiceOperations/VideoStreaming/CreateRoutes');
const VideoStreamingReadRoute = require('./Routes/ServiceOperations/VideoStreaming/ReadRoute');



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

    app.use('/api/video-stream/', VideoStreamingCreateRoutes)
    app.use('/api/video-stream/', VideoStreamingReadRoute)
    
    function Generate_ID (){
      const ID = uuid.v4();
      return ID;
    }
    
    // Create an HTTP server
    const server = http.createServer(app);
    const peerServer = ExpressPeerServer(server, { debug: true, path: '/peerjs'  });
    
    app.use('/peerjs', peerServer);
    
    // Create a Socket.IO server attached to the HTTP server
    const io = socketIo(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });
    
    const users = {};
    
    const socketToRoom = {};



// Socket.IO logic
io.on('connection', (socket) => {


  socket.on("join room", roomID => {
    if (users[roomID]) {
        const length = users[roomID].length;
        if (length === 4) {
            socket.emit("room full");
            return;
        }
        users[roomID].push(socket.id);
    } else {
        users[roomID] = [socket.id];
    }
    socketToRoom[socket.id] = roomID;
    const usersInThisRoom = users[roomID].filter(id => id !== socket.id);

    socket.emit("all users", usersInThisRoom);
});

socket.on("sending signal", payload => {
    io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID });
});

socket.on("returning signal", payload => {
    io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id });
});




























// Handle new user connection
socket.on('join-room', (roomId, userId) => {
  socket.join(roomId);
  socket.to(roomId).broadcast.emit('user-connected', userId);

  // Handle user disconnect
  socket.on('disconnect', () => {
    socket.to(roomId).broadcast.emit('user-disconnected', userId);
  });
});



  console.log(`User connected: ${socket.id}`);

  socket.on('new-meeting_request', (userData)=>{
    const RoomID = Generate_ID();
    socket.emit('new-meeting_response', ({
      RoomID : RoomID,
      userData : userData,
      socketID : socket.id
    }))
  })













});

// Start the server
const PORT = process.env.PORT || 5500;
server.listen(PORT, async () => {
  console.log('Server is starting...');
  await Connect();
  console.log(`Server is running on port ${PORT}`);
});
