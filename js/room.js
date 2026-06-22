// ===== ROOM LOGIC =====

let currentUser = null
let currentCode = null
let whisperTarget = null
let lastMessageCount = 0
let pollInterval = null
let memberInterval = null
let typingTimer = null
let timerInterval = null
let timeLeft = 60 * 60 // 60 minutes in seconds

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

  // Set timer from room creation time
  const createdAt = rooms[currentCode].createdAt
  const elapsed = Math.floor((Date.now() - createdAt) / 1000)
  timeLeft = Math.max(0, (60 * 60) - elapsed)

  // If room already expired
  if (timeLeft <= 0) {
    destroyRoom()
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

  // Start self-destruct timer
  updateTimerDisplay()
  timerInterval = setInterval(() => {
    timeLeft--
    updateTimerDisplay()
    if (timeLeft <= 0) {
      clearInterval(timerInterval)
      destroyRoom()
    }
  }, 1000)

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

  // Typing indicator on message input
  const msgInput = document.getElementById('msg-input')
  if (msgInput) {
    msgInput.addEventListener('input', () => {
      showTyping()
    })
  }

})

// ===== TIMER =====
function updateTimerDisplay() {
  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  document.getElementById('timer-text').textContent = display

  // Turn red when under 5 minutes
  const timerBox = document.getElementById('timer-box')
  if (timeLeft <= 300) {
    timerBox.classList.add('timer-danger')
  }

  // Flash when under 1 minute
  if (timeLeft <= 60) {
    timerBox.classList.add('timer-critical')
  }
}

function destroyRoom() {
  clearInterval(pollInterval)
  clearInterval(memberInterval)
  clearInterval(timerInterval)

  // Delete room from localStorage
  const rooms = load('wr_rooms') || {}
  delete rooms[currentCode]
  save('wr_rooms', rooms)

  // Clear session
  clear('wr_user')

  // Step 1 — Red flash overlay
  const flash = document.createElement('div')
  flash.className = 'red-flash'
  document.body.appendChild(flash)

  // Step 2 — Shake the screen
  document.body.classList.add('screen-shake')
  setTimeout(() => document.body.classList.remove('screen-shake'), 500)

  // Step 3 — Show destroyed modal after short delay
  setTimeout(() => {
    document.getElementById('destroy-modal').style.display = 'flex'
  }, 400)
}

// ===== POLL MESSAGES =====
function pollMessages() {
  const rooms = load('wr_rooms') || {}
  if (!rooms[currentCode]) return

  const msgs = rooms[currentCode].messages || []

  if (msgs.length > lastMessageCount) {
    const newMsgs = msgs.slice(lastMessageCount)
    newMsgs.forEach(msg => {
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

  const rooms = load('wr_rooms') || {}
  if (!rooms[currentCode]) return
  rooms[currentCode].messages.push(msg)
  save('wr_rooms', rooms)
  lastMessageCount = rooms[currentCode].messages.length

  renderMessage(msg)
  input.value = ''
  scrollToBottom()
}

// ===== RENDER MESSAGE =====
function renderMessage(msg) {
  const container = document.getElementById('messages')

  if (msg.type === 'system') {
    const el = document.createElement('p')
    el.className = 'msg-system'
    el.textContent = msg.message
    container.appendChild(el)
    return
  }

  if (msg.type === 'whisper') {
    const el = document.createElement('p')
    el.className = 'msg-whisper'
    el.textContent = msg.message
    container.appendChild(el)
    return
  }

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

  const sentEl = document.createElement('p')
  sentEl.className = 'msg-whisper'
  sentEl.textContent = `🤫 You whispered to ${whisperTarget}: ${text}`
  document.getElementById('messages').appendChild(sentEl)

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
    rooms[currentCode].messages = rooms[currentCode].messages.filter(
      m => m.username !== currentUser
    )
    rooms[currentCode].members = rooms[currentCode].members.filter(
      m => m !== currentUser
    )
    save('wr_rooms', rooms)
  }

  clearInterval(pollInterval)
  clearInterval(memberInterval)
  clearInterval(timerInterval)
  clear('wr_user')
  window.location.href = 'safe.html'
}

// ===== TYPING INDICATOR =====
function showTyping() {
  const indicator = document.getElementById('typing-indicator')
  indicator.textContent = `${currentUser} is typing...`
  clearTimeout(typingTimer)
  typingTimer = setTimeout(() => {
    indicator.textContent = ''
  }, 1500)
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

// ===== SCREENSHOT DETECTION =====

function showScreenshotWarning() {
  // Don't show if already showing
  if (document.getElementById('screenshot-warning')) return

  const overlay = document.createElement('div')
  overlay.className = 'screenshot-warning'
  overlay.id = 'screenshot-warning'

  overlay.innerHTML = `
    <p class="screenshot-warning-icon">🚫</p>
    <h3 class="screenshot-warning-title">Screenshot Detected</h3>
    <p class="screenshot-warning-sub">
      Screenshots are not allowed in WhisperRoom.
      This incident has been noted.
    </p>
    <button class="screenshot-warning-btn" onclick="dismissWarning()">
      I Understand
    </button>
  `

  document.body.appendChild(overlay)
}

function dismissWarning() {
  const el = document.getElementById('screenshot-warning')
  if (el) el.remove()
}

// Detect Print Screen key
document.addEventListener('keyup', (e) => {
  if (e.key === 'PrintScreen') {
    showScreenshotWarning()
    // Clear clipboard so screenshot is blank
    navigator.clipboard.writeText('').catch(() => {})
  }
})

// Detect Ctrl+P (print / save as PDF)
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'p') {
    e.preventDefault()
    showScreenshotWarning()
  }
})
