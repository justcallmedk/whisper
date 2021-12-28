const express = require('express'); // using express
const socketIO = require('socket.io');
const http = require('http')
const cors = require('cors');
const config = require('./config');

const port = process.env.PORT || config.socketPort // setting the port
let app = express();
app.use(cors());

let server = http.createServer(app)
let io = socketIO(server, {
  cors: {
    origin: ['http://localhost:3010'],
    methods: ['GET', 'POST']
  },
  path: '/socket/io'
});

server.listen(port);
console.log('server running on ' + port);

const generateCode = () => {
  return Math.random().toString(36).substring(2,8).toUpperCase().replaceAll('0','Z').replaceAll('O','X');
};

const MAX_SESSIONS_SIZE = 1000;
let sessions = {};
let idToCode = {};

io.on('connection', (socket)=>{

  socket.on('create', () => {
    if(Object.keys(sessions).length > MAX_SESSIONS_SIZE) {
      io.to(socket.id).emit('error','Maximum sessions reached');
      return;
    }

    let code;
    do {
      code = generateCode();
      if(!sessions[code]) {
        sessions[code] = {
          creator:socket.id
        }
      }
    } while (!sessions[code] );
    idToCode[socket.id] = code;
    io.to(socket.id).emit('created',code);
  });

  socket.on('join', (code) => {
    if(!sessions[code]) {
      io.to(socket.id).emit('error','invalid code');
      return;
    }

    sessions[code].guest = socket.id
    io.to(sessions[code].creator).emit('joined',sessions[code].guest);
    io.to(socket.id).emit('joined');
  });

  socket.on('send', (data) => {
    const code = data.code;
    if(!sessions[code]) {
      io.to(socket.id).emit('error','invalid code');
      return;
    }

    let to;
    if(sessions[code].creator === socket.id) {
      to = sessions[code].guest;
    }
    else if(sessions[code].guest === socket.id) {
      to = sessions[code].creator;
    }
    else {
      io.to(socket.id).emit('error','you are not welcome!');
      return;
    }
    io.to(to).emit('msg', data.msg);
  });

  //clean up
  socket.on('disconnect', () => {
    const code = idToCode[socket.id];
    if(!code) return;
    delete idToCode[socket.id];
    delete sessions[code];
  });

  socket.on('ping', () => {
    io.to(socket.id).emit('msg','pong');
  });
});
