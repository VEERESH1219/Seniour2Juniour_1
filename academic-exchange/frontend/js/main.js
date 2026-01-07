const API_URL = "http://localhost:5000/api/auth";
const LISTINGS_URL = "http://localhost:5000/api/listings";

let allBooks = []; 

// --- 1. AUTHENTICATION ---

async function register() {
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    if (!username || !email || !password) return alert("Please fill in all fields.");

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        if (response.ok) {
            alert("Registration Successful! Please Login.");
            showLogin(); 
        } else {
            const data = await response.json();
            alert(data.message || "Registration failed");
        }
    } catch (err) { alert("Server error. Is the backend running?"); }
}

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
            if (data.user.role === 'admin') showAdminDashboard();
            else showDashboard(data.user.username);
        } else {
            alert(data.message || "Login failed");
        }
    } catch (err) { alert("Server error. Is backend running?"); }
}

function logout() {
    localStorage.clear();
    window.location.reload();
}

// --- 2. NAVIGATION ---

function showRegister() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
}
function showLogin() {
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
}

// --- 3. DASHBOARD LOGIC ---

function showDashboard(username) {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    document.getElementById('user-display').innerText = `Welcome, ${username}!`;
    document.getElementById('profile-initial').innerText = username.charAt(0).toUpperCase();
    loadListings();
}

function toggleProfileMenu() {
    document.getElementById('profile-menu').classList.toggle('hidden');
}

// ✅ NEW: Open form in "Create Mode"
function toggleSellForm() {
    const form = document.getElementById('sell-book-section');
    if (form.classList.contains('hidden')) {
        // Reset to Create Mode
        document.getElementById('edit-book-id').value = ''; 
        document.getElementById('form-title').innerText = "📘 Post a New Book";
        document.getElementById('form-submit-btn').innerText = "Submit Listing";
        document.getElementById('form-submit-btn').classList.replace('bg-blue-600', 'bg-green-600');
        
        // Clear inputs
        document.getElementById('book-title').value = '';
        document.getElementById('book-price').value = '';
        document.getElementById('book-desc').value = '';
        document.getElementById('book-image').value = '';
        
        form.classList.remove('hidden');
    } else {
        form.classList.add('hidden');
    }
}

// ✅ NEW: Close and Clean Form
function resetAndHideForm() {
    document.getElementById('sell-book-section').classList.add('hidden');
}

// --- 4. LISTING OPERATIONS ---

async function loadListings() {
    try {
        document.getElementById('dashboard-title').innerText = "🛍️ Recent Books";
        const response = await fetch(LISTINGS_URL);
        allBooks = await response.json();
        allBooks.sort((a, b) => b.id - a.id);
        filterBooks();
    } catch (err) { console.error(err); }
}

// ✅ NEW: START EDIT MODE
function startEdit(id) {
    const book = allBooks.find(b => b.id === id);
    if (!book) return;

    // 1. Show Form
    const form = document.getElementById('sell-book-section');
    form.classList.remove('hidden');

    // 2. Fill Data
    document.getElementById('edit-book-id').value = book.id;
    document.getElementById('book-title').value = book.title;
    document.getElementById('book-price').value = book.price;
    document.getElementById('book-desc').value = book.description || '';

    // 3. Change UI to "Edit Mode"
    document.getElementById('form-title').innerText = "✏️ Edit Book Details";
    const btn = document.getElementById('form-submit-btn');
    btn.innerText = "Update Listing";
    btn.classList.remove('bg-green-600');
    btn.classList.add('bg-blue-600');

    // 4. Scroll to form
    form.scrollIntoView({ behavior: 'smooth' });
}

// ✅ NEW: HANDLE SUBMIT (Decides Create vs Update)
async function handleFormSubmit() {
    const id = document.getElementById('edit-book-id').value;
    const title = document.getElementById('book-title').value;
    const price = document.getElementById('book-price').value;
    const desc = document.getElementById('book-desc').value;
    const fileInput = document.getElementById('book-image');
    const token = localStorage.getItem('token');

    if (!title || !price) return alert("Please fill in title and price");

    const formData = new FormData();
    formData.append('title', title);
    formData.append('price', price);
    formData.append('description', desc);
    if (fileInput.files[0]) formData.append('image', fileInput.files[0]);

    // DECIDE: POST (Create) or PUT (Update)
    const url = id ? `${LISTINGS_URL}/${id}` : LISTINGS_URL;
    const method = id ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Authorization': token },
            body: formData 
        });

        if (response.ok) {
            alert(id ? "Book Updated!" : "Book Posted!");
            resetAndHideForm();
            // Refresh the correct view
            if (document.getElementById('dashboard-title').innerText.includes("My Products")) {
                showMyListings(); // Refresh "My Products" list if we are there
            } else {
                loadListings(); // Otherwise refresh main list
            }
            // Update local data cache
            const res = await fetch(LISTINGS_URL);
            allBooks = await res.json();
            allBooks.sort((a, b) => b.id - a.id);
        } else {
            alert("Operation failed");
        }
    } catch (err) { console.error(err); }
}

function showMyListings() {
    const currentUser = localStorage.getItem('username');
    const container = document.getElementById('listings-container');
    document.getElementById('dashboard-title').innerText = "📦 My Products";

    const myBooks = allBooks.filter(book => book.username === currentUser);
    container.innerHTML = '';
    
    if (myBooks.length === 0) {
        container.innerHTML = '<p class="text-gray-500 col-span-3 text-center py-10">No listings yet.</p>';
        return;
    }

    myBooks.forEach(book => {
        const img = book.image_url ? `http://localhost:5000${book.image_url}` : null;
        const imgHTML = img 
            ? `<img src="${img}" class="w-full h-48 object-cover rounded mb-2">`
            : `<div class="w-full h-48 bg-gray-200 rounded mb-2 flex items-center justify-center text-gray-400">No Image</div>`;

        container.innerHTML += `
            <div class="bg-blue-50 p-4 rounded shadow border border-blue-200 hover:shadow-lg transition">
                ${imgHTML}
                <div class="flex justify-between items-start">
                    <h4 class="font-bold text-lg text-blue-900 truncate">${book.title}</h4>
                    <span class="text-green-700 font-bold bg-green-100 px-2 py-1 rounded text-xs">₹${book.price}</span>
                </div>
                <div class="flex gap-2 mt-4 pt-2 border-t">
                    <button onclick="startEdit(${book.id})" class="flex-1 bg-yellow-500 text-white py-1 rounded text-sm font-bold hover:bg-yellow-600">✏️ Edit</button>
                    <button onclick="deleteListing(${book.id})" class="flex-1 bg-red-500 text-white py-1 rounded text-sm font-bold hover:bg-red-600">🗑 Delete</button>
                </div>
            </div>`;
    });
}

function filterBooks() {
    const searchText = document.getElementById('search-box').value.toLowerCase();
    const container = document.getElementById('listings-container');
    const currentUser = localStorage.getItem('username'); 

    let filtered = allBooks.filter(book => book.title.toLowerCase().includes(searchText));
    container.innerHTML = '';

    filtered.forEach(book => {
        const img = book.image_url ? `http://localhost:5000${book.image_url}` : null;
        const imgHTML = img 
            ? `<img src="${img}" class="w-full h-48 object-cover rounded mb-2">`
            : `<div class="w-full h-48 bg-gray-200 rounded mb-2 flex items-center justify-center text-gray-400">No Image</div>`;
        
        const actionBtn = book.username === currentUser 
            ? `<button onclick="startEdit(${book.id})" class="text-yellow-600 font-bold text-sm">✏️ Edit</button>`
            : `<a href="mailto:${book.email}" class="bg-blue-600 text-white px-3 py-1 rounded text-sm">Contact</a>`;

        container.innerHTML += `
            <div class="bg-white p-4 rounded shadow border hover:shadow-lg transition">
                ${imgHTML}
                <h4 class="font-bold text-lg text-blue-900 truncate">${book.title}</h4>
                <span class="text-green-700 font-bold">₹${book.price}</span>
                <div class="mt-4 pt-2 border-t flex justify-between items-center">${actionBtn}</div>
            </div>`;
    });
}

async function deleteListing(id) {
    if(!confirm("Delete this listing?")) return;
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const res = await fetch(`${LISTINGS_URL}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token }
    });
    if(res.ok) {
        // Remove from local array
        allBooks = allBooks.filter(b => b.id !== id);
        // Refresh view
        if (role === 'admin') loadAdminData();
        else if (document.getElementById('dashboard-title').innerText.includes("My Products")) showMyListings();
        else loadListings();
    }
}

// --- 5. ADMIN ---
function showAdminDashboard() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.remove('hidden');
    loadAdminData();
}

async function loadAdminData() {
    // (Same Admin Load Logic as before...)
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/users`, { headers: { 'Authorization': token } });
        if(res.ok) {
            const users = await res.json();
            document.getElementById('stat-total-users').innerText = users.length;
            const table = document.getElementById('admin-users-table');
            table.innerHTML = '';
            users.forEach(u => {
                table.innerHTML += `<tr class="border-b"><td class="p-2">#${u.id}</td><td class="p-2 font-bold">${u.username}</td><td class="p-2 text-blue-600">${u.email}</td><td class="p-2 text-right"><button onclick="deleteUser(${u.id})" class="text-red-500 font-bold">🗑</button></td></tr>`;
            });
        }
    } catch(e) {}
    try {
        const res = await fetch(LISTINGS_URL);
        const books = await res.json();
        document.getElementById('stat-total-books').innerText = books.length;
        const container = document.getElementById('admin-listings-container');
        container.innerHTML = '';
        books.forEach(book => {
             container.innerHTML += `<div class="bg-white p-4 border rounded shadow"><h4 class="font-bold text-blue-900">${book.title}</h4><button onclick="deleteListing(${book.id})" class="w-full bg-red-500 text-white py-1 rounded mt-2">Force Delete</button></div>`;
        });
    } catch(e) {}
}

function toggleSection(section) {
    if(section === 'users') {
        document.getElementById('admin-section-users').classList.remove('hidden');
        document.getElementById('admin-section-books').classList.add('hidden');
    } else {
        document.getElementById('admin-section-books').classList.remove('hidden');
        document.getElementById('admin-section-users').classList.add('hidden');
    }
}
async function deleteUser(id) {
    if(!confirm("Delete User?")) return;
    await fetch(`${API_URL}/users/${id}`, { method: 'DELETE', headers: { 'Authorization': localStorage.getItem('token') } });
    loadAdminData();
}
