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

  // Normal message
  const isMine = msg.username === currentUser
  const wrap = document.createElement('div')
  wrap.className = `msg-wrap ${isMine ? 'mine' : 'theirs'}`

  wrap.innerHTML = `
    <p class="msg-name">${escapeHTML(msg.username)}</p>
    <div class="msg-bubble">${escapeHTML(msg.message)}</div>
    <p class="msg-time">${msg.time}</p>
  `
  container.appendChild(wrap)
}

// ===== ADD SYSTEM MESSAGE =====
function addSystemMessage(text) {
  const el = document.createElement('p')
  el.className = 'msg-system'
  el.textContent = text
  document.getElementById('messages').appendChild(el)
  scrollToBottom()
}

// ===== RENDER MEMBERS =====
function renderMembers() {
  const rooms = load('wr_rooms') || {}
  if (!rooms[currentCode]) return

  const members = rooms[currentCode].members || []
  const list = document.getElementById('member-list')
  list.innerHTML = ''

  members.forEach(m => {
    const div = document.createElement('div')
    div.className = 'member-item'

    const name = document.createElement('p')
    name.className = 'member-name'
    name.textContent = m === currentUser ? `${m} (you)` : m
    div.appendChild(name)

    // Whisper button for other members
    if (m !== currentUser) {
      const btn = document.createElement('button')
      btn.className = 'whisper-btn'
      btn.textContent = '🤫 whisper'
      btn.onclick = () => startWhisper(m)
      div.appendChild(btn)
    }

    list.appendChild(div)
  })
}

// ===== UPDATE META =====
function updateMeta() {
  const rooms = load('wr_rooms') || {}
  if (!rooms[currentCode]) return
  const count = rooms[currentCode].members.length
  document.getElementById('room-meta').textContent =
    `Code: ${currentCode} · ${count} member${count !== 1 ? 's' : ''}`
}

// ===== WHISPER =====
function startWhisper(username) {
  whisperTarget = username
  document.getElementById('whisper-bar').style.display = 'flex'
  document.getElementById('whisper-label').textContent = `🤫 To ${username}:`
  document.getElementById('whisper-input').focus()
}

function sendWhisper() {
  const input = document.getElementById('whisper-input')
  const text = input.value.trim()
  if (!text || !whisperTarget) return

  // Show sent whisper to yourself only
  const sentEl = document.createElement('p')
  sentEl.className = 'msg-whisper'
  sentEl.textContent = `🤫 You whispered to ${whisperTarget}: ${text}`
  document.getElementById('messages').appendChild(sentEl)

  // Save whisper hint to room (others see hint not content)
  const rooms = load('wr_rooms') || {}
  if (rooms[currentCode]) {
    rooms[currentCode].messages.push({
      id: Date.now(),
      type: 'whisper',
      username: currentUser,
      message: `🤫 ${currentUser} whispered to ${whisperTarget}...`,
      time: getTime()
    })
    save('wr_rooms', rooms)
    lastMessageCount = rooms[currentCode].messages.length
  }

  input.value = ''
  cancelWhisper()
  scrollToBottom()
}

function cancelWhisper() {
  whisperTarget = null
  document.getElementById('whisper-bar').style.display = 'none'
  document.getElementById('whisper-input').value = ''
}

// ===== PANIC =====
function showPanicModal() {
  document.getElementById('panic-modal').style.display = 'flex'
}

function hidePanicModal() {
  document.getElementById('panic-modal').style.display = 'none'
}

function panicExit() {
  const rooms = load('wr_rooms') || {}
  if (rooms[currentCode]) {
    // Delete all messages from this user
    rooms[currentCode].messages = rooms[currentCode].messages.filter(
      m => m.username !== currentUser
    )
    // Remove from members
    rooms[currentCode].members = rooms[currentCode].members.filter(
      m => m !== currentUser
    )
    save('wr_rooms', rooms)
  }

  // Stop polling
  clearInterval(pollInterval)
  clearInterval(memberInterval)

  // Clear session
  clear('wr_user')

  // Go to safe page
  window.location.href = 'safe.html'
}

// ===== HELPERS =====
function scrollToBottom() {
  const msgs = document.getElementById('messages')
  msgs.scrollTop = msgs.scrollHeight
}

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
