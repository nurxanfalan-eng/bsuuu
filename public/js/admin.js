// API Base URL
const API_URL = window.location.origin + '/api';

// Check authentication
const adminToken = localStorage.getItem('adminToken');
const admin = JSON.parse(localStorage.getItem('admin') || '{}');

if (!adminToken || !admin.id) {
    window.location.href = '/';
}

// Initialize
document.getElementById('adminUsername').textContent = admin.username;

// Show admin management button only for super admin
if (admin.isSuperAdmin) {
    document.getElementById('adminManagementBtn').style.display = 'flex';
}

// Load dashboard on start
loadDashboard();

// Navigation
document.querySelectorAll('.admin-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        switchView(view);
    });
});

function switchView(view) {
    // Update nav buttons
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    // Update content
    document.querySelectorAll('.admin-view').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(view + 'View').classList.add('active');
    
    // Load content based on view
    if (view === 'dashboard') {
        loadDashboard();
    } else if (view === 'users') {
        loadUsers();
    } else if (view === 'reported') {
        loadReportedUsers();
    } else if (view === 'settings') {
        loadSettings();
    } else if (view === 'filter') {
        loadFilterWords();
    } else if (view === 'admins') {
        loadAdmins();
    }
}

// Load dashboard
async function loadDashboard() {
    try {
        const response = await fetch(`${API_URL}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('totalUsers').textContent = data.stats.totalUsers;
            document.getElementById('activeUsers').textContent = data.stats.activeUsers;
            document.getElementById('totalMessages').textContent = data.stats.totalMessages;
            document.getElementById('totalReports').textContent = data.stats.totalReports;
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Load users
async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/admin/users`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('userCount').textContent = data.totalUsers;
            displayUsers(data.users);
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.phone}</td>
            <td>${user.faculty.substring(0, 30)}...</td>
            <td>${user.degree}</td>
            <td>${user.course}</td>
            <td>${formatDate(user.createdAt)}</td>
            <td>
                <span class="status-badge ${user.isActive ? 'status-active' : 'status-inactive'}">
                    ${user.isActive ? 'Aktiv' : 'Deaktiv'}
                </span>
            </td>
            <td>
                <button class="btn ${user.isActive ? 'btn-danger' : 'btn-success'}" 
                        onclick="toggleUserStatus('${user.id}', ${!user.isActive})">
                    ${user.isActive ? 'Deaktiv et' : 'Aktivləşdir'}
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('az-AZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Toggle user status
async function toggleUserStatus(userId, isActive) {
    const confirmMsg = isActive ? 
        'Bu istifadəçini aktivləşdirmək istədiyinizə əminsiniz?' : 
        'Bu istifadəçini deaktiv etmək istədiyinizə əminsiniz?';
    
    if (!confirm(confirmMsg)) return;
    
    try {
        const response = await fetch(`${API_URL}/admin/users/toggle-status`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId, isActive })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(data.message);
            loadUsers();
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('Xəta baş verdi');
    }
}

// Load reported users
async function loadReportedUsers() {
    try {
        const response = await fetch(`${API_URL}/admin/reported-users`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayReportedUsers(data.reportedUsers);
        }
    } catch (error) {
        console.error('Error loading reported users:', error);
    }
}

function displayReportedUsers(users) {
    const tbody = document.getElementById('reportedUsersTableBody');
    tbody.innerHTML = '';
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Şikayət edilən istifadəçi yoxdur</td></tr>';
        return;
    }
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.phone}</td>
            <td>${user.faculty.substring(0, 30)}...</td>
            <td><strong>${user._count.reportedReports}</strong></td>
            <td>
                <span class="status-badge ${user.isActive ? 'status-active' : 'status-inactive'}">
                    ${user.isActive ? 'Aktiv' : 'Deaktiv'}
                </span>
            </td>
            <td>
                <button class="btn ${user.isActive ? 'btn-danger' : 'btn-success'}" 
                        onclick="toggleUserStatus('${user.id}', ${!user.isActive})">
                    ${user.isActive ? 'Deaktiv et' : 'Aktivləşdir'}
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Load settings
async function loadSettings() {
    try {
        const response = await fetch(`${API_URL}/admin/settings`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const settings = data.settings;
            document.getElementById('rulesTextarea').value = settings.rules || '';
            document.getElementById('topicInput').value = settings.topicOfDay || '';
            document.getElementById('groupExpiryInput').value = settings.groupMessageExpiry || '';
            document.getElementById('privateExpiryInput').value = settings.privateMessageExpiry || '';
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Save rules
document.getElementById('saveRulesBtn').addEventListener('click', async () => {
    const rules = document.getElementById('rulesTextarea').value;
    
    try {
        const response = await fetch(`${API_URL}/admin/settings`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ key: 'rules', value: rules })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(data.message);
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('Xəta baş verdi');
    }
});

// Save topic
document.getElementById('saveTopicBtn').addEventListener('click', async () => {
    const topic = document.getElementById('topicInput').value;
    
    try {
        const response = await fetch(`${API_URL}/admin/settings`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ key: 'topicOfDay', value: topic })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(data.message);
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('Xəta baş verdi');
    }
});

// Save group expiry
document.getElementById('saveGroupExpiryBtn').addEventListener('click', async () => {
    const expiry = document.getElementById('groupExpiryInput').value;
    
    try {
        const response = await fetch(`${API_URL}/admin/settings`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ key: 'groupMessageExpiry', value: expiry })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(data.message);
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('Xəta baş verdi');
    }
});

// Save private expiry
document.getElementById('savePrivateExpiryBtn').addEventListener('click', async () => {
    const expiry = document.getElementById('privateExpiryInput').value;
    
    try {
        const response = await fetch(`${API_URL}/admin/settings`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ key: 'privateMessageExpiry', value: expiry })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(data.message);
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('Xəta baş verdi');
    }
});

// Load filter words
async function loadFilterWords() {
    try {
        const response = await fetch(`${API_URL}/admin/filter-words`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayFilterWords(data.words);
        }
    } catch (error) {
        console.error('Error loading filter words:', error);
    }
}

function displayFilterWords(words) {
    const container = document.getElementById('filterWordsList');
    container.innerHTML = '';
    
    if (words.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px;">Filtr sözləri yoxdur</p>';
        return;
    }
    
    words.forEach(word => {
        const item = document.createElement('div');
        item.className = 'filter-word-item';
        item.innerHTML = `
            <span class="filter-word-text">${word.word}</span>
            <button class="btn-delete" onclick="deleteFilterWord('${word.id}')">✕</button>
        `;
        container.appendChild(item);
    });
}

// Add filter word
document.getElementById('addFilterWordBtn').addEventListener('click', async () => {
    const word = document.getElementById('filterWordInput').value.trim();
    
    if (!word) {
        alert('Söz daxil edilməlidir');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/admin/filter-words`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ word })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(data.message);
            document.getElementById('filterWordInput').value = '';
            loadFilterWords();
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('Xəta baş verdi');
    }
});

// Delete filter word
async function deleteFilterWord(wordId) {
    if (!confirm('Bu sözü silmək istədiyinizə əminsiniz?')) return;
    
    try {
        const response = await fetch(`${API_URL}/admin/filter-words/${wordId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(data.message);
            loadFilterWords();
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('Xəta baş verdi');
    }
}

// Load admins (Super Admin only)
async function loadAdmins() {
    try {
        const response = await fetch(`${API_URL}/admin/admins`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayAdmins(data.admins);
        }
    } catch (error) {
        console.error('Error loading admins:', error);
    }
}

function displayAdmins(admins) {
    const tbody = document.getElementById('adminsTableBody');
    tbody.innerHTML = '';
    
    if (admins.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px;">Alt admin yoxdur</td></tr>';
        return;
    }
    
    admins.forEach(admin => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${admin.username}</td>
            <td>${formatDate(admin.createdAt)}</td>
            <td>
                <button class="btn btn-danger" onclick="deleteAdmin('${admin.id}')">Sil</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Create admin
document.getElementById('createAdminBtn').addEventListener('click', async () => {
    const username = document.getElementById('newAdminUsername').value.trim();
    const password = document.getElementById('newAdminPassword').value;
    
    if (!username || !password) {
        alert('İstifadəçi adı və şifrə daxil edilməlidir');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/admin/admins`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(data.message);
            document.getElementById('newAdminUsername').value = '';
            document.getElementById('newAdminPassword').value = '';
            loadAdmins();
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('Xəta baş verdi');
    }
});

// Delete admin
async function deleteAdmin(adminId) {
    if (!confirm('Bu admini silmək istədiyinizə əminsiniz?')) return;
    
    try {
        const response = await fetch(`${API_URL}/admin/admins/${adminId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(data.message);
            loadAdmins();
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('Xəta baş verdi');
    }
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('Çıxış etmək istədiyinizə əminsiniz?')) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('admin');
        window.location.href = '/';
    }
});
