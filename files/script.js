// ============================================
//  LiveChat — Client Script
// ============================================

const socket = io();

// DOM Elements
const loginScreen   = document.getElementById('login-screen');
const chatApp       = document.getElementById('chat-app');
const usernameInput = document.getElementById('username-input');
const joinBtn       = document.getElementById('join-btn');
const messageInput  = document.getElementById('message-input');
const sendBtn       = document.getElementById('send-btn');
const messagesArea  = document.getElementById('messages');
const userList      = document.getElementById('user-list');
const userCount     = document.getElementById('user-count');
const headerUsername = document.getElementById('header-username');

let myUsername = '';

// ============================================
//  JOIN CHAT
// ============================================
function joinChat() {
  const name = usernameInput.value.trim();
  if (!name) {
    usernameInput.style.borderColor = '#ff4757';
    usernameInput.focus();
    setTimeout(() => { usernameInput.style.borderColor = ''; }, 1200);
    return;
  }

  myUsername = name;
  headerUsername.textContent = name;

  loginScreen.classList.add('hidden');
  chatApp.classList.remove('hidden');

  socket.emit('user_join', name);
  messageInput.focus();
}

joinBtn.addEventListener('click', joinChat);

usernameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') joinChat();
});

// ============================================
//  SEND MESSAGE
// ============================================
function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) {
    messageInput.classList.add('shake');
    setTimeout(() => messageInput.classList.remove('shake'), 300);
    return;
  }
  socket.emit('send_message', { text });
  messageInput.value = '';
  messageInput.focus();
}

sendBtn.addEventListener('click', sendMessage);

messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// ============================================
//  RECEIVE MESSAGE
// ============================================
socket.on('receive_message', (data) => {
  const isSelf = data.username === myUsername;
  renderMessage(data, isSelf);
  scrollToBottom();
});

// ============================================
//  SYSTEM MESSAGES (join/leave)
// ============================================
socket.on('system_message', (data) => {
  renderSystemMessage(data);
  scrollToBottom();
});

// ============================================
//  UPDATE USER LIST
// ============================================
socket.on('update_users', (users) => {
  userList.innerHTML = '';
  userCount.textContent = users.length;

  users.forEach((username) => {
    const li = document.createElement('li');
    const isMe = username === myUsername;

    if (isMe) li.classList.add('is-me');

    li.innerHTML = `
      <span class="dot"></span>
      <span class="uname">${escapeHTML(username)}</span>
      ${isMe ? '<span class="you-tag">you</span>' : ''}
    `;
    userList.appendChild(li);
  });
});

// ============================================
//  RENDER HELPERS
// ============================================
function renderMessage(data, isSelf) {
  const div = document.createElement('div');
  div.classList.add('msg', isSelf ? 'self' : 'other');

  const time = formatTime(data.timestamp);

  div.innerHTML = `
    <div class="msg-meta">
      <span class="msg-username">${escapeHTML(data.username)}</span>
      <span class="msg-time">${time}</span>
    </div>
    <div class="msg-bubble">${escapeHTML(data.text)}</div>
  `;

  messagesArea.appendChild(div);
}

function renderSystemMessage(data) {
  const div = document.createElement('div');
  div.classList.add('msg-system', data.type);

  const time = formatTime(data.timestamp);
  div.innerHTML = `<span>${escapeHTML(data.text)} · ${time}</span>`;

  messagesArea.appendChild(div);
}

// ============================================
//  UTILITIES
// ============================================
function scrollToBottom() {
  requestAnimationFrame(() => {
    messagesArea.scrollTop = messagesArea.scrollHeight;
  });
}

function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
