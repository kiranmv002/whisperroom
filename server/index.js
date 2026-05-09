const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
require('dotenv').config()

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

app.use(cors())
app.use(express.json())

// Store rooms in memory for now
const rooms = {}

// Generate 6-digit code
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++)
    code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

// Create room API
app.post('/create-room', (req, res) => {
  const code = generateCode()
  rooms[code] = {
    members: [],
    messages: [],
    createdAt: Date.now(),
    expiresIn: 60 // minutes
  }
  console.log(`Room created: ${code}`)
  res.json({ code })
})

// Check if room exists
app.get('/room/:code', (req, res) => {
  const { code } = req.params
  if (rooms[code]) {
    res.json({ exists: true, members: rooms[code].members })
  } else {
    res.json({ exists: false })
  }
})

// Socket connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  // Join room
  socket.on('join-room', ({ code, username }) => {
    if (!rooms[code]) {
      socket.emit('error', { message: 'Room not found' })
      return
    }
    socket.join(code)
    socket.roomCode = code
    socket.username = username
    rooms[code].members.push(username)

    // Tell everyone someone joined
    io.to(code).emit('user-joined', {
      username,
      members: rooms[code].members
    })
    console.log(`${username} joined room ${code}`)
  })

  // Leave room
  socket.on('disconnect', () => {
    const { roomCode, username } = socket
    if (roomCode && rooms[roomCode]) {
      rooms[roomCode].members = rooms[roomCode].members.filter(
        m => m !== username
      )
      io.to(roomCode).emit('user-left', {
        username,
        members: rooms[roomCode].members
      })
    }
    console.log('User disconnected:', socket.id)
  })
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => console.log(`Server running on port ${PORT}`))
