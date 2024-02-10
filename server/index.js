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
const { v4: uuidv4 } = require('uuid');
const { ExpressPeerServer } = require('peer');
const VideoStreamingCreateRoutes = require('./Routes/ServiceOperations/VideoStreaming/CreateRoutes');
const VideoStreamingReadRoute = require('./Routes/ServiceOperations/VideoStreaming/ReadRoute');
const GeniusRoute = require('./Routes/ServiceOperations/Genius/GeniusRoutes');
const PostRoutes = require('./Routes/ServiceOperations/ProjectManagement/PostRoutes');
const FetchRoute = require('./Routes/ServiceOperations/ProjectManagement/FetchRoutes');
const AuthUtils = require('./Utils/AuthUtils');
const TeamDataModel = require('./Database/Models/ProjectManagement/TeamDataModel');
const ChatModel = require('./Database/Models/ProjectManagement/ChatModel');


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

    app.use('/api/genius', GeniusRoute);

    app.use('/api/project-management', PostRoutes)
    app.use('/api/project-management', FetchRoute)
    
    
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



    var usersMapBoard = [];//this array will keep track of users watching the live board

// Socket.IO logic
io.on('connection', (socket) => {

//events for handling Chats
socket.on('join-chat-room', async(data)=>{
  const token = data.token;
  const decodedtoken = await AuthUtils.decodeToken(token);
  socket.join(data.roomID);
  console.log('user joined')
  socket.emit('userData', decodedtoken)
  io.to(data.roomID).emit('user-joined', {
    message : `${decodedtoken.username} Joined the Room`
  })
})

socket.on('chat-message', async(data)=>{
  //console.log(data)  
  const token = data.token;
  const decodedtoken = await AuthUtils.decodeToken(token);
  io.to(data.roomID).emit('chat-broadcasting', {
    data : data,
    userData : decodedtoken
  })
  //save the chat to database
 try{
  const currentChat = new ChatModel({
    Team : data.roomID,
    sender : decodedtoken.user_id,
    content : data.content,
    timestamp : data.timestamp
  })
  await currentChat.save();
  console.log("Chats saved")
 }
 catch(error){
  io.to(data.roomID).emit('chat-broadcasting', {
    message : "Error occured while saving chats"
  })
 }
})


//events for handling live whiteBoard

socket.on('create-live-room', ()=>{
const roomId = uuidv4();
socket.emit('roomID', roomId);
})

socket.on('join-live-room', async(data)=>{
  let roomId=data.roomId;
  const decodedtoken = await AuthUtils.decodeToken(data.token);
  socket.join(roomId);
  usersMapBoard.push({
    username : decodedtoken.username,
    roomId : roomId,
    timestamp : new Date().getTime()
  })
  io.to(roomId).emit('user-joined-live-room', {
    username: decodedtoken.username,
    roomID : roomId,
    message :  `${decodedtoken.username} joined the room`
  })
})

socket.on('req-live-members', (roomId)=>{
  let membersList = usersMapBoard.filter((item) => item.roomId === roomId );
  io.to(roomId).emit('live-members', membersList)
})

socket.on('drawing', (data)=>{
  io.to(data.roomId).emit('get-drawing', data)
})



//event for sending and accepting join requests in real time
socket.on("request-join-team", async(data)=>{
  const token = data.token;
  const decodedtoken = await AuthUtils.decodeToken(token);
  const senderID = decodedtoken.user_id;
  const receiverID = data.receiverID;
  const TeamID = data.TeamID;
  try{
    const currentTeamData = await TeamDataModel.findOne({
        _id : TeamID
    });
    if(currentTeamData)
        {
           currentTeamData.Members.push({
                user : receiverID,
                role : "Teammate"
            })

            await currentTeamData.save();
           io.emit('response-join-team', {
            success : true,
            message : "member added"
           })
        }

        else{
          socket.emit('response-join-team', {
            success : true,
            message : "No teams found"
           })
        }
}
catch(error){
    console.error(error);
    return socket.emit('response-join-team', {
      success : false,
      message : "An error occured while sending join request"
     })
}
}) 

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
    // Find and remove the disconnected user from the array
   console.log('disconnected')
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
