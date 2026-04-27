// Common Utilities
const API_URL = '/api';

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// Authentication handlers
function getToken() {
    return localStorage.getItem('token');
}

function getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

function adminLogout() {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin-login.html';
}

// Fetch Wrapper with Token
async function fetchAPI(endpoint, options = {}) {
    const token = endpoint.includes('/admin') ? localStorage.getItem('adminToken') : getToken();
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });

    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            // Unauthorized, clear tokens
            if(endpoint.includes('/admin')) {
                localStorage.removeItem('adminToken');
                window.location.href = '/admin-login.html';
            } else {
                localStorage.removeItem('token');
                window.location.href = '/login.html';
            }
        }
        throw new Error(data.message || 'Something went wrong');
    }

    return data;
}
