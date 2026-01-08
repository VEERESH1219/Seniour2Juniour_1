// ✅ AUTOMATIC IP CONFIGURATION
// This grabs the current address (e.g., http://192.168.1.5:5000) from the browser bar
const BASE_URL = window.location.origin;
const API_URL = `${BASE_URL}/api/auth`;
const LISTINGS_URL = `${BASE_URL}/api/listings`;

let allBooks = []; 
let socket = null; 
let currentChatRoom = null; 
let currentUserId = null;

// ✅ AUTO-CONNECT ON PAGE LOAD
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const userId = localStorage.getItem('userId');

    if (token && username && userId) {
        if (localStorage.getItem('role') === 'admin') showAdminDashboard();
        else showDashboard(username);
        initSocket(userId);
    }
});

// --- AUTHENTICATION ---
async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.user.username);
            localStorage.setItem('role', data.user.role); 
            localStorage.setItem('userId', data.user.id);
            initSocket(data.user.id);
            if (data.user.role === 'admin') showAdminDashboard();
            else showDashboard(data.user.username);
        } else {
            alert(data.message || "Login failed");
        }
    } catch (err) { 
        console.error("Login Error:", err);
        alert("Cannot connect to server. Ensure the backend is running on the same network."); 
    }
}

async function register() {
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    if (!username || !email || !password) return alert("Fill all fields.");

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        if (response.ok) { alert("Success! Login now."); showLogin(); }
        else { const d = await response.json(); alert(d.message || "Error"); }
    } catch (err) { console.error(err); }
}

function logout() {
    if(socket) socket.disconnect();
    localStorage.clear();
    window.location.reload();
}

// --- SOCKET & CHAT ---
function initSocket(userId) {
    if (socket) return; 
    currentUserId = parseInt(userId);
    
    // ✅ Auto-connect to the same host that served the page
    socket = io(BASE_URL); 

    socket.on('connect', () => console.log("⚡ Chat Connected"));
    
    socket.on('receive_message', (data) => {
        const chatBox = document.getElementById('chat-box');
        if (chatBox && !chatBox.classList.contains('hidden') && currentChatRoom === data.room) {
            appendMessage(data.content, data.sender_id === currentUserId);
        } else if (data.sender_id !== currentUserId) {
            showToastNotification(data.sender_id, data.sender_name, data.content);
        }
    });

    socket.on('load_history', (messages) => {
        const c = document.getElementById('chat-messages');
        if(c) { 
            c.innerHTML = ''; 
            messages.forEach(msg => appendMessage(msg.content, msg.sender_id === currentUserId)); 
            scrollToBottom(); 
        }
    });

    socket.on('inbox_data', (chats) => {
        const c = document.getElementById('inbox-list');
        if(!c) return;
        c.innerHTML = '';
        if (!chats || chats.length === 0) { c.innerHTML = '<p class="text-center text-gray-400 mt-10 text-xs">No messages.</p>'; return; }
        chats.forEach(chat => {
            c.innerHTML += `
                <div onclick="openChat(${chat.otherId}, '${chat.name}'); closeInbox();" class="bg-white p-4 mb-3 rounded-2xl shadow-sm border-l-4 border-indigo-500 cursor-pointer">
                    <h4 class="font-bold text-sm">${chat.name}</h4>
                    <p class="text-xs text-gray-500 truncate">${chat.lastMsg}</p>
                </div>`;
        });
    });
}

// --- UI HELPERS ---
function openInbox() {
    const uid = localStorage.getItem('userId');
    const modal = document.getElementById('inbox-modal');
    if (!uid) return alert("Login first");
    if (!socket) initSocket(uid);
    if(modal) { modal.classList.remove('hidden'); socket.emit('get_inbox', uid); }
}

function closeInbox() { 
    const m = document.getElementById('inbox-modal'); 
    if(m) m.classList.add('hidden'); 
}

function openChat(rid, rname) {
    if (!currentUserId) currentUserId = parseInt(localStorage.getItem('userId'));
    if (currentUserId === rid) return alert("Cannot chat with self");
    const uids = [currentUserId, rid].sort((a,b) => a-b);
    currentChatRoom = `chat_${uids[0]}_${uids[1]}`;
    const cb = document.getElementById('chat-box');
    if(cb) {
        cb.classList.remove('hidden');
        document.getElementById('chat-with-name').innerText = rname;
        document.getElementById('chat-messages').innerHTML = '<p class="text-center text-xs mt-2">Loading...</p>';
        socket.emit('join_room', { room: currentChatRoom });
    }
}

function sendChatMessage() {
    const inp = document.getElementById('chat-input');
    const msg = inp.value.trim();
    if (!msg || !socket) return;
    socket.emit('send_message', { room: currentChatRoom, sender_id: currentUserId, sender_name: localStorage.getItem('username'), content: msg });
    inp.value = '';
}

function showToastNotification(sid, sname, msg) {
    const t = document.getElementById('msg-toast');
    if(!t) return;
    document.getElementById('toast-sender').innerText = `From: ${sname}`;
    document.getElementById('toast-preview').innerText = msg;
    document.getElementById('toast-reply-btn').onclick = function() { openChat(sid, sname); closeToast(); };
    t.classList.remove('hidden'); setTimeout(() => closeToast(), 5000);
}

function appendMessage(text, isMe) {
    const c = document.getElementById('chat-messages');
    if(!c) return;
    const d = document.createElement('div');
    d.className = isMe ? "self-end bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm" : "self-start bg-white text-slate-700 px-4 py-2 rounded-xl border text-sm";
    d.innerText = text;
    c.appendChild(d);
    scrollToBottom();
}

function scrollToBottom() { 
    const c = document.getElementById('chat-messages'); 
    if(c) c.scrollTop = c.scrollHeight; 
}

function closeToast() { 
    const t = document.getElementById('msg-toast'); 
    if(t) t.classList.add('hidden'); 
}

function toggleChatWindow() { document.getElementById('chat-box').classList.toggle('hidden'); }
function toggleProfileMenu() { document.getElementById('profile-menu').classList.toggle('hidden'); }
function showRegister() { document.getElementById('login-form').classList.add('hidden'); document.getElementById('register-form').classList.remove('hidden'); }
function showLogin() { document.getElementById('register-form').classList.add('hidden'); document.getElementById('login-form').classList.remove('hidden'); }
function toggleSellForm() { document.getElementById('sell-book-section').classList.toggle('hidden'); }
function resetAndHideForm() { document.getElementById('sell-book-section').classList.add('hidden'); document.getElementById('edit-book-id').value = ''; }

// --- LISTINGS ---
async function loadListings() {
    try {
        const res = await fetch(LISTINGS_URL);
        allBooks = await res.json();
        allBooks.sort((a, b) => b.id - a.id);
        if(document.getElementById('dashboard-title')) document.getElementById('dashboard-title').innerText = ""; 
        filterBooks();
    } catch (e) { console.error(e); }
}

function filterBooks() {
    const term = document.getElementById('search-box').value.toLowerCase();
    const cont = document.getElementById('listings-container');
    const user = localStorage.getItem('username'); 
    const filtered = allBooks.filter(b => b.title.toLowerCase().includes(term) || b.username.toLowerCase().includes(term));
    
    cont.innerHTML = '';
    filtered.forEach((b, i) => {
        // ✅ AUTO IMAGE URL
        const img = b.image_url ? `${BASE_URL}${b.image_url}` : null;
        const imgHTML = img ? `<img src="${img}" class="w-full h-48 object-cover">` : `<div class="w-full h-48 bg-gray-100 flex items-center justify-center text-xs text-gray-400">No Image</div>`;
        
        const btn = b.username === user 
            ? `<button onclick="startEdit(${b.id})" class="text-indigo-600 font-bold text-xs">Edit</button>` 
            : `<button onclick="openChat(${b.user_id}, '${b.username}')" class="bg-indigo-600 text-white px-3 py-1 rounded text-xs">Chat</button>`;

        cont.innerHTML += `
            <div class="product-card bg-white p-4 rounded-2xl border animate-fade-down" style="animation-delay: ${i*0.05}s">
                <div class="overflow-hidden rounded-xl mb-3">${imgHTML}</div>
                <div class="flex justify-between items-start">
                    <h4 class="font-bold truncate w-2/3">${b.title}</h4>
                    <span class="text-indigo-600 font-bold text-sm">₹${b.price}</span>
                </div>
                <p class="text-[10px] text-gray-400 uppercase mt-1">Seller: ${b.username}</p>
                <div class="mt-2 pt-2 border-t flex justify-between items-center">${btn}</div>
            </div>`;
    });
}

function showDashboard(u) {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    document.getElementById('user-display').innerText = `Welcome, ${u}!`;
    document.getElementById('profile-initial').innerText = u.charAt(0).toUpperCase();
    loadListings();
}

function showAdminDashboard() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.remove('hidden');
    loadAdminData();
}

async function loadAdminData() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/users`, { headers: { 'Authorization': token } });
        if(res.ok) {
            const users = await res.json();
            document.getElementById('stat-total-users').innerText = users.length;
            const t = document.getElementById('admin-users-table');
            if(t) {
                t.innerHTML = '';
                users.forEach(u => {
                    const badge = u.role === 'admin' ? '🛡️ Admin' : '👤 User';
                    t.innerHTML += `
                        <tr class="border-b">
                            <td class="p-3 text-gray-400 text-xs">#${u.id}</td>
                            <td class="p-3 font-bold">${u.username} <span class="text-[10px] bg-gray-100 px-2 py-0.5 rounded ml-2 uppercase">${badge}</span></td>
                            <td class="p-3 text-right">${u.role !== 'admin' ? `<button onclick="deleteUser(${u.id})" class="text-red-500 hover:text-red-700">🗑</button>` : '<span class="text-xs text-gray-300 italic">Protected</span>'}</td>
                        </tr>`;
                });
            }
        }
        
        const resB = await fetch(LISTINGS_URL);
        const books = await resB.json();
        document.getElementById('stat-total-books').innerText = books.length;
        const c = document.getElementById('admin-listings-container');
        if(c) {
            c.innerHTML = '';
            books.forEach(b => {
                // ✅ ADMIN IMAGE URL FIX
                const adminImg = b.image_url ? `${BASE_URL}${b.image_url}` : null;
                const adminImgHTML = adminImg ? `<img src="${adminImg}" class="w-full h-32 object-cover rounded-xl mb-2">` : `<div class="h-32 bg-gray-50 flex items-center justify-center text-xs text-gray-300 rounded-xl mb-2">No Image</div>`;

                c.innerHTML += `
                    <div class="bg-white p-4 border rounded-2xl shadow-sm">
                        ${adminImgHTML}
                        <h4 class="font-bold truncate">${b.title}</h4>
                        <p class="text-[10px] text-gray-500 uppercase">By ${b.username}</p>
                        <button onclick="deleteListing(${b.id})" class="w-full bg-red-50 text-red-500 text-xs mt-3 py-2 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-colors">Force Delete</button>
                    </div>`;
            });
        }
    } catch(e) { console.error("Admin Load Error:", e); }
}

function toggleSection(s) {
    const u = document.getElementById('admin-section-users');
    const b = document.getElementById('admin-section-books');
    if(u) u.className = s === 'users' ? 'block bg-white p-6 rounded-3xl shadow-xl animate-fade-down' : 'hidden';
    if(b) b.className = s === 'books' ? 'block animate-fade-down' : 'hidden';
}

async function deleteUser(id) { if(confirm("Delete this user permanently?")) { await fetch(`${API_URL}/users/${id}`, { method: 'DELETE', headers: { 'Authorization': localStorage.getItem('token') } }); loadAdminData(); } }
async function deleteListing(id) { if(confirm("Permanently delete this product?")) { await fetch(`${LISTINGS_URL}/${id}`, { method: 'DELETE', headers: { 'Authorization': localStorage.getItem('token') } }); if(localStorage.getItem('role') === 'admin') loadAdminData(); else loadListings(); } }

function showMyListings() {
    const u = localStorage.getItem('username');
    const t = document.getElementById('dashboard-title');
    if(t) t.innerText = "📦 My Products";
    const c = document.getElementById('listings-container');
    const my = allBooks.filter(b => b.username === u);
    c.innerHTML = '';
    
    if (my.length === 0) {
        c.innerHTML = '<div class="col-span-full py-10 text-center text-gray-400">You haven\'t listed any products.</div>';
        return;
    }

    my.forEach((b,i) => {
        const img = b.image_url ? `${BASE_URL}${b.image_url}` : '';
        const imgHTML = img ? `<img src="${img}" class="w-full h-48 object-cover">` : '<div class="h-48 bg-gray-100 flex items-center justify-center">No Image</div>';
        c.innerHTML += `
            <div class="product-card bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 animate-fade-down">
                <div class="overflow-hidden rounded-xl mb-3">${imgHTML}</div>
                <h4 class="font-bold truncate">${b.title}</h4>
                <div class="flex gap-2 mt-3">
                    <button onclick="startEdit(${b.id})" class="flex-1 bg-white text-indigo-600 rounded-xl py-2 text-xs font-bold border border-indigo-100 shadow-sm hover:bg-indigo-600 hover:text-white transition-all">Edit</button>
                    <button onclick="deleteListing(${b.id})" class="flex-1 bg-white text-red-500 rounded-xl py-2 text-xs font-bold border border-red-100 shadow-sm hover:bg-red-500 hover:text-white transition-all">Delete</button>
                </div>
            </div>`;
    });
}

function startEdit(id) {
    const b = allBooks.find(book => book.id === id);
    if(!b) return;
    const f = document.getElementById('sell-book-section');
    if(f) { 
        f.classList.remove('hidden'); 
        document.getElementById('edit-book-id').value = b.id; 
        document.getElementById('book-title').value = b.title; 
        document.getElementById('book-price').value = b.price; 
        document.getElementById('book-desc').value = b.description||''; 
        document.getElementById('form-submit-btn').innerText="Update Listing"; 
        f.scrollIntoView({behavior:'smooth'}); 
    }
}

async function handleFormSubmit() {
    const id = document.getElementById('edit-book-id').value;
    const title = document.getElementById('book-title').value;
    const price = document.getElementById('book-price').value;
    const desc = document.getElementById('book-desc').value;
    const file = document.getElementById('book-image').files[0];
    if(!title || !price) return alert("Product Title and Price are required.");
    
    const fd = new FormData();
    fd.append('title', title); 
    fd.append('price', price); 
    fd.append('description', desc);
    if(file) fd.append('image', file);
    
    try {
        const res = await fetch(id ? `${LISTINGS_URL}/${id}` : LISTINGS_URL, { 
            method: id ? 'PUT' : 'POST', 
            headers: {'Authorization': localStorage.getItem('token')}, 
            body: fd 
        });
        if(res.ok) { 
            alert(id ? "Product updated successfully!" : "Product listed successfully!"); 
            resetAndHideForm(); 
            loadListings(); 
        }
    } catch(e) { 
        console.error("Form Submit Error:", e);
        alert("Failed to submit listing. Check server connection.");
    }
}
