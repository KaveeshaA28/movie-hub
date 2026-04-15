// CineAccount - index.js

// AVATAR COLORS
const AVATAR_COLORS = [
    '#c9a84c', '#e74c3c', '#3498db', '#2ecc71',
    '#9b59b6', '#e67e22', '#1abc9c', '#e91e63',
    '#00bcd4', '#ff5722'
];

// INIT
document.addEventListener('DOMContentLoaded', function () {
    buildColorSwatches();
    setupPasswordStrength();
    setupUsernameHint();

    const session = getSession();
    if (session) {
        loadProfile(session);
        showProfile();
    }
});

// LOCAL STORAGE HELPERS
function getUsers() {
    return JSON.parse(localStorage.getItem('cine_users') || '[]');
}

function saveUsers(users) {
    localStorage.setItem('cine_users', JSON.stringify(users));
}

function getSession() {
    const s = sessionStorage.getItem('cine_session') || localStorage.getItem('cine_session');
    return s ? JSON.parse(s) : null;
}

function setSession(user, remember) {
    const data = JSON.stringify(user);
    sessionStorage.setItem('cine_session', data);
    if (remember) localStorage.setItem('cine_session', data);
}

function clearSession() {
    sessionStorage.removeItem('cine_session');
    localStorage.removeItem('cine_session');
}

// TAB SWITCHER
function switchTab(tab) {
    const loginForm    = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginTab     = document.getElementById('loginTab');
    const registerTab  = document.getElementById('registerTab');

    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        loginTab.classList.remove('active');
        registerTab.classList.add('active');
    }

    document.getElementById('loginError').innerText    = '';
    document.getElementById('registerError').innerText = '';
}

// SHOW / HIDE PAGES
function showAuth() {
    document.getElementById('authContainer').classList.remove('hidden');
    document.getElementById('profileContainer').classList.add('hidden');
}

function showProfile() {
    document.getElementById('authContainer').classList.add('hidden');
    document.getElementById('profileContainer').classList.remove('hidden');
}

// REGISTER
function handleRegister(e) {
    e.preventDefault();

    const firstName = document.getElementById('regFirstName').value.trim();
    const lastName  = document.getElementById('regLastName').value.trim();
    const username  = document.getElementById('regUsername').value.trim();
    const email     = document.getElementById('regEmail').value.trim().toLowerCase();
    const password  = document.getElementById('regPassword').value;
    const confirm   = document.getElementById('regConfirmPassword').value;
    const genre     = document.getElementById('regFavGenre').value;
    const errorEl   = document.getElementById('registerError');

    if (password.length < 6) {
        return showError(errorEl, 'Password must be at least 6 characters.');
    }
    if (password !== confirm) {
        return showError(errorEl, 'Passwords do not match.');
    }

    const users = getUsers();

    if (users.find(u => u.email === email)) {
        return showError(errorEl, 'An account with this email already exists.');
    }
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        return showError(errorEl, 'Username is already taken. Choose another.');
    }

    const newUser = {
        id:          Date.now().toString(),
        firstName,
        lastName,
        username,
        email,
        password,
        genre,
        bio:         '',
        avatarColor: AVATAR_COLORS[0],
        joinedAt:    new Date().toISOString(),
        stats: { movies: 0, favs: 0, watchlist: 0 },
        prefs: { email: true, watchlist: false, ratings: true, spoiler: false }
    };

    users.push(newUser);
    saveUsers(users);
    setSession(newUser, false);
    loadProfile(newUser);
    showProfile();
}

// LOGIN
function handleLogin(e) {
    e.preventDefault();

    const email    = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    const remember = document.getElementById('rememberMe').checked;
    const errorEl  = document.getElementById('loginError');

    const users = getUsers();
    const user  = users.find(u => u.email === email && u.password === password);

    if (!user) {
        return showError(errorEl, 'Incorrect email or password. Please try again.');
    }

    setSession(user, remember);
    loadProfile(user);
    showProfile();
}

// LOGOUT
function handleLogout() {
    if (confirm('Are you sure you want to sign out?')) {
        clearSession();
        showAuth();
        switchTab('login');
    }
}

// LOAD PROFILE INTO UI
function loadProfile(user) {
    const initials = getInitials(user.firstName, user.lastName);
    const fullName = user.firstName + ' ' + user.lastName;

    setAvatarEl('sidebarAvatar', initials, user.avatarColor);
    setText('sidebarName',     fullName);
    setText('sidebarUsername', '@' + user.username);

    setText('overviewName',     user.firstName);
    setText('overviewFullName', fullName);
    setText('overviewEmail',    user.email);
    setText('overviewGenre',    user.genre ? '🎭 ' + user.genre : '');
    setAvatarEl('overviewAvatar', initials, user.avatarColor);

    setText('statMovies',    user.stats.movies);
    setText('statFavs',      user.stats.favs);
    setText('statWatchlist', user.stats.watchlist);
    setText('statDays',      getDaysSince(user.joinedAt));

    setText('detailUsername', '@' + user.username);
    setText('detailEmail',    user.email);
    setText('detailGenre',    user.genre || '—');
    setText('detailJoined',   formatDate(user.joinedAt));

    setValue('editFirstName', user.firstName);
    setValue('editLastName',  user.lastName);
    setValue('editUsername',  user.username);
    setValue('editEmail',     user.email);
    setValue('editBio',       user.bio || '');
    setValue('editGenre',     user.genre || '');

    setAvatarEl('avatarPreview', initials, user.avatarColor);
    updateSwatchSelection(user.avatarColor);

    setChecked('prefEmail',     user.prefs.email);
    setChecked('prefWatchlist', user.prefs.watchlist);
    setChecked('prefRatings',   user.prefs.ratings);
    setChecked('prefSpoiler',   user.prefs.spoiler);

    showSection('overview', document.querySelectorAll('.nav-item')[0]);
}

// EDIT PROFILE
function handleEditProfile(e) {
    e.preventDefault();

    const session = getSession();
    const users   = getUsers();
    const idx     = users.findIndex(u => u.id === session.id);
    if (idx === -1) return;

    const firstName = document.getElementById('editFirstName').value.trim();
    const lastName  = document.getElementById('editLastName').value.trim();
    const username  = document.getElementById('editUsername').value.trim();
    const email     = document.getElementById('editEmail').value.trim().toLowerCase();
    const bio       = document.getElementById('editBio').value.trim();
    const genre     = document.getElementById('editGenre').value;
    const successEl = document.getElementById('editSuccess');

    const usernameTaken = users.find(u => u.id !== session.id && u.username.toLowerCase() === username.toLowerCase());
    const emailTaken    = users.find(u => u.id !== session.id && u.email === email);

    if (usernameTaken) { return showError(successEl, 'Username already taken.'); }
    if (emailTaken)    { return showError(successEl, 'Email already in use.'); }

    users[idx].firstName   = firstName;
    users[idx].lastName    = lastName;
    users[idx].username    = username;
    users[idx].email       = email;
    users[idx].bio         = bio;
    users[idx].genre       = genre;
    users[idx].avatarColor = selectedColor || users[idx].avatarColor;

    saveUsers(users);
    setSession(users[idx], !!localStorage.getItem('cine_session'));
    loadProfile(users[idx]);

    successEl.innerText = '✓ Profile updated successfully!';
    setTimeout(() => { successEl.innerText = ''; }, 3000);
}

// CHANGE PASSWORD
function handleChangePassword(e) {
    e.preventDefault();

    const current   = document.getElementById('currentPassword').value;
    const newPass   = document.getElementById('newPassword').value;
    const confirm   = document.getElementById('confirmNewPassword').value;
    const errorEl   = document.getElementById('securityError');
    const successEl = document.getElementById('securitySuccess');

    errorEl.innerText   = '';
    successEl.innerText = '';

    const session = getSession();
    const users   = getUsers();
    const idx     = users.findIndex(u => u.id === session.id);

    if (users[idx].password !== current) {
        return showError(errorEl, 'Current password is incorrect.');
    }
    if (newPass.length < 6) {
        return showError(errorEl, 'New password must be at least 6 characters.');
    }
    if (newPass !== confirm) {
        return showError(errorEl, 'New passwords do not match.');
    }

    users[idx].password = newPass;
    saveUsers(users);
    setSession(users[idx], !!localStorage.getItem('cine_session'));

    document.getElementById('currentPassword').value    = '';
    document.getElementById('newPassword').value        = '';
    document.getElementById('confirmNewPassword').value = '';

    successEl.innerText = '✓ Password updated successfully!';
    setTimeout(() => { successEl.innerText = ''; }, 3000);
}

// DELETE ACCOUNT
function handleDeleteAccount() {
    if (!confirm('Are you absolutely sure? This cannot be undone.')) return;

    const session = getSession();
    let users     = getUsers();
    users         = users.filter(u => u.id !== session.id);
    saveUsers(users);
    clearSession();
    showAuth();
    switchTab('register');
}

// PREFERENCES
function savePref() {
    const session = getSession();
    const users   = getUsers();
    const idx     = users.findIndex(u => u.id === session.id);
    if (idx === -1) return;

    users[idx].prefs = {
        email:     document.getElementById('prefEmail').checked,
        watchlist: document.getElementById('prefWatchlist').checked,
        ratings:   document.getElementById('prefRatings').checked,
        spoiler:   document.getElementById('prefSpoiler').checked
    };

    saveUsers(users);
    setSession(users[idx], !!localStorage.getItem('cine_session'));

    const successEl     = document.getElementById('prefSuccess');
    successEl.innerText = '✓ Preferences saved!';
    setTimeout(() => { successEl.innerText = ''; }, 2000);
}

// SECTION NAVIGATION
function showSection(name, clickedEl) {
    document.querySelectorAll('.profile-section').forEach(s => {
        s.classList.remove('active-section');
    });
    document.querySelectorAll('.nav-item').forEach(n => {
        n.classList.remove('active');
    });

    const section = document.getElementById('section-' + name);
    if (section) section.classList.add('active-section');
    if (clickedEl) clickedEl.classList.add('active');

    return false;
}

// PASSWORD VISIBILITY TOGGLE
function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type    = 'text';
        btn.innerText = '🙈';
    } else {
        input.type    = 'password';
        btn.innerText = '👁';
    }
}

// PASSWORD STRENGTH METER
function setupPasswordStrength() {
    const input = document.getElementById('regPassword');
    if (!input) return;

    input.addEventListener('input', function () {
        const val   = input.value;
        const fill  = document.getElementById('strengthFill');
        const text  = document.getElementById('strengthText');
        const score = getPasswordScore(val);

        const levels = [
            { pct: '0%',   color: 'transparent', label: '' },
            { pct: '25%',  color: '#e74c3c',      label: 'Weak' },
            { pct: '50%',  color: '#e67e22',      label: 'Fair' },
            { pct: '75%',  color: '#f1c40f',      label: 'Good' },
            { pct: '100%', color: '#2ecc71',      label: 'Strong' }
        ];

        const level           = levels[score];
        fill.style.width      = level.pct;
        fill.style.background = level.color;
        text.innerText        = level.label;
        text.style.color      = level.color;
    });
}

function getPasswordScore(pass) {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6)  score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return Math.min(score, 4);
}

// USERNAME HINT
function setupUsernameHint() {
    const input = document.getElementById('regUsername');
    if (!input) return;

    input.addEventListener('input', function () {
        const val   = input.value.trim();
        const hint  = document.getElementById('usernameHint');
        const users = getUsers();

        if (!val) { hint.innerText = ''; return; }

        if (users.find(u => u.username.toLowerCase() === val.toLowerCase())) {
            hint.innerText   = '✗ Username taken';
            hint.style.color = '#e74c3c';
        } else {
            hint.innerText   = '✓ Username available';
            hint.style.color = '#2ecc71';
        }
    });
}

// AVATAR COLOR SWATCHES
let selectedColor = null;

function buildColorSwatches() {
    const container = document.getElementById('colorSwatches');
    if (!container) return;

    AVATAR_COLORS.forEach(function (color) {
        const swatch          = document.createElement('div');
        swatch.className      = 'color-swatch';
        swatch.style.background = color;
        swatch.title          = color;

        swatch.addEventListener('click', function () {
            selectedColor = color;
            updateSwatchSelection(color);
            const session  = getSession();
            const initials = session ? getInitials(session.firstName, session.lastName) : '?';
            setAvatarColor('avatarPreview', color);
        });

        container.appendChild(swatch);
    });
}

function updateSwatchSelection(color) {
    document.querySelectorAll('.color-swatch').forEach(function (s) {
        s.classList.toggle('selected',
            s.style.background === hexToRgb(color) ||
            s.style.background === color
        );
    });
    selectedColor = color;
}

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${r}, ${g}, ${b})`;
}

function setAvatarColor(id, color) {
    const el = document.getElementById(id);
    if (el) el.style.background = color;
}

// DOM HELPERS
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
}

function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
}

function setChecked(id, value) {
    const el = document.getElementById(id);
    if (el) el.checked = value;
}

function setAvatarEl(id, initials, color) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerText        = initials;
    el.style.background = color;
}

function showError(el, msg) {
    if (el) {
        el.innerText     = msg;
        el.style.display = 'block';
    }
}

// UTILITIES
function getInitials(first, last) {
    return ((first || '?')[0] + (last || '?')[0]).toUpperCase();
}

function getDaysSince(isoDate) {
    const ms = Date.now() - new Date(isoDate).getTime();
    return Math.max(1, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function formatDate(isoDate) {
    return new Date(isoDate).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
}