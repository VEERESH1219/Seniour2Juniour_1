const API_URL = "http://localhost:5000/api/auth";
const LISTINGS_URL = "http://localhost:5000/api/listings";

let allBooks = []; 

// --- NAVIGATION ---
function showRegister() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
    clearError();
}

function showLogin() {
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
    clearError();
}

function showError(msg) {
    const el = document.getElementById('error-msg');
    el.innerText = msg;
    el.classList.remove('hidden');
}

function clearError() {
    const el = document.getElementById('error-msg');
    el.classList.add('hidden');
    el.innerText = "";
}

// --- AUTH ---
async function register() {
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await response.json();
        if (response.ok) {
            alert("Registration Successful! Please Login.");
            showLogin();
        } else {
            showError(data.message || "Registration failed");
        }
    } catch (err) {
        showError("Server error. Is the backend running?");
    }
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
            showDashboard(data.user.username);
        } else {
            showError(data.message || "Login failed");
        }
    } catch (err) {
        showError("Server error. Is the backend running?");
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.reload();
}

// --- DASHBOARD ---
function showDashboard(username) {
    clearError();
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    document.getElementById('user-display').innerText = `Welcome, ${username}!`;
    loadListings();
}

// --- MARKETPLACE LOGIC ---
async function loadListings() {
    try {
        const response = await fetch(LISTINGS_URL);
        allBooks = await response.json();
        filterBooks(); 
    } catch (err) {
        console.error("Failed to load books:", err);
    }
}

async function addListing() {
    const title = document.getElementById('book-title').value;
    const price = document.getElementById('book-price').value;
    const description = document.getElementById('book-desc').value;
    const fileInput = document.getElementById('book-image'); // This must match HTML ID
    const token = localStorage.getItem('token');

    if (!title || !price) return alert("Please fill in title and price");

    // USE FORMDATA FOR IMAGES
    const formData = new FormData();
    formData.append('title', title);
    formData.append('price', price);
    formData.append('description', description);
    
    // Check if user selected a file
    if (fileInput && fileInput.files[0]) {
        formData.append('image', fileInput.files[0]);
    }

    try {
        const response = await fetch(LISTINGS_URL, {
            method: 'POST',
            headers: { 
                'Authorization': token 
            },
            body: formData 
        });

        if (response.ok) {
            alert("Book Posted!");
            document.getElementById('book-title').value = '';
            document.getElementById('book-price').value = '';
            document.getElementById('book-desc').value = '';
            if(fileInput) fileInput.value = ''; 
            loadListings();
        } else {
            const err = await response.json();
            alert("Failed: " + (err.error || "Unknown Error"));
        }
    } catch (err) {
        console.error("Error posting:", err);
    }
}

async function deleteListing(id) {
    if(!confirm("Delete this book?")) return;
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${LISTINGS_URL}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': token }
        });
        if (response.ok) loadListings();
    } catch (err) {
        console.error("Error deleting:", err);
    }
}

function filterBooks() {
    const searchText = document.getElementById('search-box').value.toLowerCase();
    const sortValue = document.getElementById('sort-box').value;
    const container = document.getElementById('listings-container');
    const currentUser = localStorage.getItem('username'); 

    let filtered = allBooks.filter(book => 
        book.title.toLowerCase().includes(searchText) || 
        (book.description && book.description.toLowerCase().includes(searchText))
    );

    if (sortValue === 'price-low') filtered.sort((a, b) => a.price - b.price);
    else if (sortValue === 'price-high') filtered.sort((a, b) => b.price - a.price);
    else filtered.sort((a, b) => b.id - a.id);

    container.innerHTML = ''; 

    if (filtered.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center col-span-3 mt-4">No books found.</p>';
        return;
    }

    filtered.forEach(book => {
        // 1. HANDLE IMAGE HTML (Must be INSIDE the loop)
        const imageHTML = book.image_url 
            ? `<img src="http://localhost:5000${book.image_url}" class="w-full h-48 object-cover rounded mb-2">` 
            : `<div class="w-full h-48 bg-gray-200 rounded mb-2 flex items-center justify-center text-gray-400">No Image</div>`;

        // 2. CHECK OWNER
        const isOwner = book.username === currentUser;
        const actionButton = isOwner 
            ? `<button onclick="deleteListing(${book.id})" class="text-red-500 hover:underline text-sm font-semibold">🗑 Delete</button>`
            : `<a href="mailto:${book.email}?subject=${book.title}" class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">✉ Contact</a>`;

        // 3. GENERATE CARD
        container.innerHTML += `
            <div class="bg-white p-4 rounded shadow border border-gray-200 flex flex-col justify-between hover:shadow-lg transition">
                ${imageHTML}
                <div>
                    <div class="flex justify-between items-start">
                        <h4 class="font-bold text-lg text-blue-900 truncate">${book.title}</h4>
                        <span class="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">₹${book.price}</span>
                    </div>
                    <p class="text-gray-600 text-sm mt-1 truncate">${book.description || ''}</p>
                    <p class="text-xs text-gray-400 mt-2">Seller: ${book.username}</p>
                </div>
                <div class="mt-4 pt-2 border-t flex justify-between items-center">${actionButton}</div>
            </div>`;
    });
}
