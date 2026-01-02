// API Base URL
const API_URL = window.location.origin + '/api';

// Check authentication
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token || !user.id) {
    window.location.href = '/';
}

// Socket.IO connection
const socket = io({
    auth: { token }
});

// Global state
let currentView = 'faculties';
let currentChat = null;
let currentChatType = null; // 'faculty' or 'private'
let onlineUsers = new Set();
let blockedUsers = new Set();

// Socket authentication
socket.emit('authenticate', token);

socket.on('authenticated', (data) => {
    console.log('Authenticated:', data.user);
    loadUserProfile();
    loadSettings();
});

socket.on('auth_error', (data) => {
    console.error('Auth error:', data.error);
    localStorage.clear();
    window.location.href = '/';
});

// Initialize
loadFaculties();
loadUserProfile();
loadSettings();

// Navigation
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        switchView(view);
    });
});

function switchView(view) {
    currentView = view;
    
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    // Update content
    document.querySelectorAll('.view-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(view + 'View').classList.add('active');
    
    // Load content based on view
    if (view === 'messages') {
        loadConversations();
    } else if (view === 'profile') {
        loadProfile();
    } else if (view === 'rules') {
        loadRules();
    }
}

// Load user profile (sidebar)
async function loadUserProfile() {
    try {
        const response = await fetch(`${API_URL}/user/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const user = data.user;
            document.getElementById('userName').textContent = user.name;
            document.getElementById('userFaculty').textContent = user.faculty;
            
            if (user.profilePicture) {
                document.getElementById('userAvatar').src = user.profilePicture;
            }
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

// Load faculties
function loadFaculties() {
    const faculties = [
        "Mexanika-riyaziyyat fakültəsi",
        "Tətbiqi riyaziyyat və kibernetika fakültəsi",
        "Fizika fakültəsi",
        "Kimya fakültəsi",
        "Biologiya fakültəsi",
        "Ekologiya və torpaqşünaslıq fakültəsi",
        "Coğrafiya fakültəsi",
        "Geologiya fakültəsi",
        "Filologiya fakültəsi",
        "Tarix fakültəsi",
        "Beynəlxalq münasibətlər və iqtisadiyyat fakültəsi",
        "Hüquq fakültəsi",
        "Jurnalistika fakültəsi",
        "İnformasiya və sənəd menecmenti fakültəsi",
        "Şərqşünaslıq fakültəsi",
        "Sosial elmlər və psixologiya fakültəsi"
    ];
    
    const container = document.getElementById('facultiesList');
    container.innerHTML = '';
    
    faculties.forEach(faculty => {
        const card = document.createElement('div');
        card.className = 'faculty-card';
        card.innerHTML = `
            <h3>${faculty}</h3>
            <p>Otağa daxil olun</p>
        `;
        card.addEventListener('click', () => openFacultyChat(faculty));
        container.appendChild(card);
    });
}

// Open faculty chat
function openFacultyChat(faculty) {
    currentChat = faculty;
    currentChatType = 'faculty';
    
    // Leave previous faculty room if any
    if (currentChat && currentChatType === 'faculty') {
        socket.emit('leave_faculty', currentChat);
    }
    
    // Join new faculty room
    socket.emit('join_faculty', faculty);
    
    // Update UI
    document.getElementById('chatRoomName').textContent = faculty;
    document.getElementById('chatRoomInfo').textContent = 'Qrup söhbəti';
    document.getElementById('chatPanel').classList.add('active');
    document.getElementById('topicOfDay').style.display = 'block';
    
    // Load messages
    loadFacultyMessages(faculty);
}

// Load faculty messages
async function loadFacultyMessages(faculty) {
    try {
        const response = await fetch(`${API_URL}/messages/faculty/${encodeURIComponent(faculty)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayMessages(data.messages);
        }
    } catch (error) {
        console.error('Error loading faculty messages:', error);
    }
}

// Socket: New faculty message
socket.on('new_faculty_message', (data) => {
    const { message, blockedBy } = data;
    
    // Don't show message if sender is blocked by current user
    if (blockedBy.includes(user.id)) {
        return;
    }
    
    // Only show if in the same faculty room
    if (currentChatType === 'faculty' && currentChat === message.roomId) {
        addMessageToUI(message);
    }
});

// Display messages
function displayMessages(messages) {
    const container = document.getElementById('chatMessages');
    container.innerHTML = '';
    
    messages.forEach(message => {
        addMessageToUI(message);
    });
    
    scrollToBottom();
}

// Add message to UI
function addMessageToUI(message) {
    const container = document.getElementById('chatMessages');
    const isOwn = message.senderId === user.id;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwn ? 'own' : ''}`;
    messageDiv.dataset.messageId = message.id;
    messageDiv.dataset.senderId = message.senderId;
    
    const avatar = document.createElement('img');
    avatar.src = message.sender.profilePicture || '/images/default-avatar.png';
    avatar.alt = message.sender.name;
    avatar.className = 'avatar';
    messageDiv.appendChild(avatar);
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    if (!isOwn) {
        const headerDiv = document.createElement('div');
        headerDiv.className = 'message-header';
        
        const senderSpan = document.createElement('span');
        senderSpan.className = 'message-sender';
        senderSpan.textContent = message.sender.name;
        headerDiv.appendChild(senderSpan);
        
        const infoSpan = document.createElement('span');
        infoSpan.className = 'message-info';
        infoSpan.textContent = `${message.sender.degree}, ${message.sender.course}-ci kurs`;
        headerDiv.appendChild(infoSpan);
        
        contentDiv.appendChild(headerDiv);
    }
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';
    
    // Add context menu button for group messages (not own)
    if (currentChatType === 'faculty' && !isOwn) {
        const menuBtn = document.createElement('button');
        menuBtn.className = 'message-menu';
        menuBtn.innerHTML = '⋮';
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showContextMenu(e, message.sender);
        });
        bubbleDiv.appendChild(menuBtn);
    }
    
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.textContent = message.content;
    bubbleDiv.appendChild(textDiv);
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = formatTime(message.createdAt);
    bubbleDiv.appendChild(timeDiv);
    
    contentDiv.appendChild(bubbleDiv);
    messageDiv.appendChild(contentDiv);
    
    container.appendChild(messageDiv);
    
    // Auto scroll to bottom if user is at bottom
    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
    if (isAtBottom) {
        scrollToBottom();
    }
}

// Format time
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Baku timezone offset
    const bakuOffset = 4 * 60; // UTC+4
    const localOffset = date.getTimezoneOffset();
    const offsetDiff = bakuOffset + localOffset;
    date.setMinutes(date.getMinutes() + offsetDiff);
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    if (diff < 24 * 60 * 60 * 1000) {
        return `${hours}:${minutes}`;
    } else {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${day}.${month} ${hours}:${minutes}`;
    }
}

// Scroll to bottom
function scrollToBottom() {
    const container = document.getElementById('chatMessages');
    container.scrollTop = container.scrollHeight;
}

// Send message
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendMessageBtn');

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Auto-resize textarea
messageInput.addEventListener('input', () => {
    messageInput.style.height = 'auto';
    messageInput.style.height = messageInput.scrollHeight + 'px';
});

function sendMessage() {
    const content = messageInput.value.trim();
    
    if (!content) return;
    
    if (currentChatType === 'faculty') {
        socket.emit('send_faculty_message', {
            faculty: currentChat,
            content
        });
    } else if (currentChatType === 'private') {
        socket.emit('send_private_message', {
            receiverId: currentChat,
            content
        });
    }
    
    messageInput.value = '';
    messageInput.style.height = 'auto';
}

// Socket error
socket.on('error', (data) => {
    alert(data.message);
});

// Context menu
function showContextMenu(event, sender) {
    const menu = document.getElementById('contextMenu');
    menu.style.display = 'block';
    menu.style.left = event.pageX + 'px';
    menu.style.top = event.pageY + 'px';
    
    // Remove old listeners
    const newMenu = menu.cloneNode(true);
    menu.parentNode.replaceChild(newMenu, menu);
    
    newMenu.querySelectorAll('.context-menu-item').forEach(item => {
        item.addEventListener('click', () => {
            const action = item.dataset.action;
            handleContextMenuAction(action, sender);
            newMenu.style.display = 'none';
        });
    });
    
    // Close menu on outside click
    setTimeout(() => {
        document.addEventListener('click', function closeMenu() {
            newMenu.style.display = 'none';
            document.removeEventListener('click', closeMenu);
        });
    }, 10);
}

async function handleContextMenuAction(action, sender) {
    if (action === 'private') {
        openPrivateChat(sender);
    } else if (action === 'block') {
        await blockUser(sender.id);
    } else if (action === 'report') {
        await reportUser(sender.id);
    }
}

// Open private chat
function openPrivateChat(sender) {
    currentChat = sender.id;
    currentChatType = 'private';
    
    socket.emit('start_private_chat', { userId: sender.id });
    
    document.getElementById('chatRoomName').textContent = sender.name;
    document.getElementById('chatRoomInfo').textContent = `${sender.faculty} - ${sender.degree}, ${sender.course}-ci kurs`;
    document.getElementById('chatPanel').classList.add('active');
    document.getElementById('topicOfDay').style.display = 'none';
    
    loadPrivateMessages(sender.id);
}

// Load private messages
async function loadPrivateMessages(userId) {
    try {
        const response = await fetch(`${API_URL}/messages/private/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayMessages(data.messages);
        }
    } catch (error) {
        console.error('Error loading private messages:', error);
    }
}

// Socket: New private message
socket.on('new_private_message', (data) => {
    const { message } = data;
    
    // Only show if in the same private chat
    if (currentChatType === 'private' && 
        (currentChat === message.senderId || currentChat === message.receiverId)) {
        addMessageToUI(message);
    }
});

// Block user
async function blockUser(userId) {
    if (!confirm('Bu istifadəçini əngəlləmək istədiyinizə əminsiniz?')) return;
    
    try {
        const response = await fetch(`${API_URL}/user/block`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId })
        });
        
        if (response.ok) {
            alert('İstifadəçi əngəlləndi');
            blockedUsers.add(userId);
            
            // Close chat if currently open
            if (currentChatType === 'private' && currentChat === userId) {
                closeChat();
            }
        } else {
            const data = await response.json();
            alert(data.error);
        }
    } catch (error) {
        alert('Xəta baş verdi');
    }
}

// Report user
async function reportUser(userId) {
    if (!confirm('Bu istifadəçini şikayət etmək istədiyinizə əminsiniz?')) return;
    
    try {
        const response = await fetch(`${API_URL}/user/report`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId })
        });
        
        if (response.ok) {
            alert('Şikayət göndərildi');
        } else {
            const data = await response.json();
            alert(data.error);
        }
    } catch (error) {
        alert('Xəta baş verdi');
    }
}

// Close chat
document.getElementById('closeChatBtn').addEventListener('click', closeChat);

function closeChat() {
    document.getElementById('chatPanel').classList.remove('active');
    currentChat = null;
    currentChatType = null;
}

// Load conversations
async function loadConversations() {
    try {
        const response = await fetch(`${API_URL}/messages/conversations`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayConversations(data.conversations);
        }
    } catch (error) {
        console.error('Error loading conversations:', error);
    }
}

function displayConversations(conversations) {
    const container = document.getElementById('conversationsList');
    container.innerHTML = '';
    
    if (conversations.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px;">Hələ ki mesajınız yoxdur</p>';
        return;
    }
    
    conversations.forEach(conv => {
        const item = document.createElement('div');
        item.className = 'conversation-item';
        item.innerHTML = `
            <img src="${conv.user.profilePicture || '/images/default-avatar.png'}" alt="${conv.user.name}" class="avatar">
            <div class="conversation-info">
                <h4>${conv.user.name}</h4>
                <p>${conv.user.faculty} - ${conv.user.degree}, ${conv.user.course}-ci kurs</p>
            </div>
        `;
        item.addEventListener('click', () => openPrivateChat(conv.user));
        container.appendChild(item);
    });
}

// Load profile
async function loadProfile() {
    try {
        const response = await fetch(`${API_URL}/user/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const user = data.user;
            
            if (user.profilePicture) {
                document.getElementById('profilePicture').src = user.profilePicture;
            }
            
            const infoContainer = document.getElementById('profileInfo');
            infoContainer.innerHTML = `
                <div class="profile-info-item">
                    <label>Ad Soyad:</label>
                    <span>${user.name}</span>
                </div>
                <div class="profile-info-item">
                    <label>Email:</label>
                    <span>${user.email}</span>
                </div>
                <div class="profile-info-item">
                    <label>Telefon:</label>
                    <span>${user.phone}</span>
                </div>
                <div class="profile-info-item">
                    <label>Fakültə:</label>
                    <span>${user.faculty}</span>
                </div>
                <div class="profile-info-item">
                    <label>Dərəcə:</label>
                    <span>${user.degree}</span>
                </div>
                <div class="profile-info-item">
                    <label>Kurs:</label>
                    <span>${user.course}</span>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Change profile picture
document.getElementById('changeProfilePictureBtn').addEventListener('click', () => {
    document.getElementById('profilePictureInput').click();
});

document.getElementById('profilePictureInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    try {
        const response = await fetch(`${API_URL}/user/profile-picture`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('profilePicture').src = data.user.profilePicture;
            document.getElementById('userAvatar').src = data.user.profilePicture;
            alert('Profil şəkli yeniləndi');
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('Xəta baş verdi');
    }
});

// Load settings (rules and topic)
async function loadSettings() {
    try {
        const response = await fetch(`${API_URL}/settings/public`);
        const data = await response.json();
        
        if (response.ok) {
            const settings = data.settings;
            
            if (settings.topicOfDay) {
                document.getElementById('topicText').textContent = settings.topicOfDay;
            }
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Load rules
async function loadRules() {
    try {
        const response = await fetch(`${API_URL}/settings/public`);
        const data = await response.json();
        
        if (response.ok) {
            const rules = data.settings.rules || 'Qaydalar hələ əlavə edilməyib.';
            document.getElementById('rulesContent').textContent = rules;
        }
    } catch (error) {
        console.error('Error loading rules:', error);
    }
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('Çıxış etmək istədiyinizə əminsiniz?')) {
        localStorage.clear();
        window.location.href = '/';
    }
});

// Create default avatar if not exists
const defaultAvatarPath = '/images/default-avatar.png';
// In production, you should have an actual default avatar image
