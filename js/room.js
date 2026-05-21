// ===== ROOM LOGIC =====

let currentUser = null
let currentCode = null
let whisperTarget = null
let lastMessageCount = 0
let pollInterval = null
let memberInterval = null

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {

  // Load session
  const session = load('wr_user')
  if (!session) {
    window.location.href = 'index.html'
    return
  }

  currentUser = session.username
  currentCode = session.code

  // Check room exists
  const rooms = load('wr_rooms') || {}
  if (!rooms[currentCode]) {
    window.location.href = 'index.html'
    return
  }

  // Update header
  updateMeta()

  // Load existing messages
  const msgs = rooms[currentCode].messages || []
  msgs.forEach(renderMessage)
  lastMessageCount = msgs.length

  // Render members
  renderMembers()

  // Scroll to bottom
  scrollToBottom()

  // Add join message
  addSystemMessage(`👋 You joined as ${currentUser}`)

  // Start polling
  pollInterval = setInterval(pollMessages, 1000)
  memberInterval = setInterval(renderMembers, 2000)

  // Blur chat on tab switch
  document.addEventListener('visibilitychange', () => {
    const msgs = document.getElementById('messages')
    if (document.hidden) {
      msgs.style.filter = 'blur(10px)'
    } else {
      msgs.style.filter = 'none'
    }
  })

  // Whisper input keyboard
  const wi = document.getElementById('whisper-input')
  if (wi) {
    wi.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendWhisper()
      if (e.key === 'Escape') cancelWhisper()
    })
  }

})

// ===== POLL MESSAGES =====
function pollMessages() {
  const rooms = load('wr_rooms') || {}
  if (!rooms[currentCode]) return

  const msgs = rooms[currentCode].messages || []

  if (msgs.length > lastMessageCount) {
    const newMsgs = msgs.slice(lastMessageCount)
    newMsgs.forEach(msg => {
      // Only render messages from others (own already rendered)
      if (msg.username !== currentUser) {
        renderMessage(msg)
      }
    })
    lastMessageCount = msgs.length
    scrollToBottom()
  }

  updateMeta()
}

// ===== SEND MESSAGE =====
function sendMessage() {
  const input = document.getElementById('msg-input')
  const text = input.value.trim()
  if (!text) return

  const msg = {
    id: Date.now(),
    username: currentUser,
    message: text,
    time: getTime(),
    type: 'normal'
  }

  // Save to localStorage
  const rooms = load('wr_rooms') || {}
  if (!rooms[currentCode]) return
  rooms[currentCode].messages.push(msg)
  save('wr_rooms', rooms)
  lastMessageCount = rooms[currentCode].messages.length

  // Render immediately
  renderMessage(msg)
  input.value = ''
  scrollToBottom()
}

// ===== RENDER MESSAGE =====
function renderMessage(msg) {
  const container = document.getElementById('messages')

  // System message
  if (msg.type === 'system') {
    const el = document.createElement('p')
    el.className = 'msg-system'
    el.textContent = msg.message
    container.appendChild(el)
    return
  }

  // Whisper hint
  if (msg.type === 'whisper') {
    const el = document.createElement('p')
    el.className = 'msg-whisper'
    el.textContent = msg.message
    container.appendChild(el)
    return
  }

