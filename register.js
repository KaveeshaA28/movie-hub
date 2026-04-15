// register.js — CineAccount Create Account

let currentStep = 1;
let selectedGender = '';
let selectedGenre  = '';

// STEP NAVIGATION
function nextStep(from) {
    if (!validateStep(from)) return;
    goStep(from + 1);
}

function prevStep(from) {
    goStep(from - 1);
}

function goStep(n) {
    // Hide current step
    const currentEl = n <= 4
        ? document.getElementById('step' + currentStep)
        : null;
    if (currentEl) currentEl.classList.remove('active-step');

    // Mark left tracker
    const prevDot = document.getElementById('st' + currentStep);
    if (prevDot) { prevDot.classList.remove('active'); prevDot.classList.add('done'); }

    currentStep = n;

    // Show new step
    const nextEl = n <= 3
        ? document.getElementById('step' + n)
        : document.getElementById('stepSuccess');
    if (nextEl) nextEl.classList.add('active-step');

    // Update left tracker active
    const currDot = document.getElementById('st' + n);
    if (currDot) { currDot.classList.remove('done'); currDot.classList.add('active'); }

    // Update progress
    updateProgress(n);

    // Scroll to top
    document.querySelector('.right-panel').scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgress(step) {
    const pcts = { 1: '33%', 2: '66%', 3: '99%', 4: '100%' };
    const fill = document.getElementById('progressFill');
    if (fill) fill.style.width = pcts[step] || '33%';

    [1, 2, 3].forEach(i => {
        const pill = document.getElementById('pill' + i);
        if (!pill) return;
        pill.classList.remove('active', 'done');
        if (i === step) pill.classList.add('active');
        if (i  <  step) pill.classList.add('done');
    });
}

// VALIDATION
function validateStep(step) {
    let ok = true;

    if (step === 1) {
        const fn = getVal('s1FirstName');
        const ln = getVal('s1LastName');
        if (!fn) { showErr('e1FirstName', 'First name is required.'); ok = false; }
        else      { clearErr('e1FirstName'); }
        if (!ln) { showErr('e1LastName', 'Last name is required.'); ok = false; }
        else      { clearErr('e1LastName'); }
    }

    if (step === 2) {
        const un   = getVal('s2Username');
        const em   = getVal('s2Email');
        const pw   = getVal('s2Password');
        const conf = getVal('s2Confirm');

        if (!un || un.length < 3) {
            showErr('e2Username', 'Username must be at least 3 characters.'); ok = false;
        } else { clearErr('e2Username'); }

        if (!em || !em.includes('@')) {
            showErr('e2Email', 'Enter a valid email address.'); ok = false;
        } else { clearErr('e2Email'); }

        if (pw.length < 6) {
            showErr('e2Password', 'Password must be at least 6 characters.'); ok = false;
        } else { clearErr('e2Password'); }

        if (pw !== conf) {
            showErr('e2Confirm', 'Passwords do not match.'); ok = false;
        } else if (conf) { clearErr('e2Confirm'); }

        // Check duplicates
        if (ok) {
            const users = getUsers();
            if (users.find(u => u.username.toLowerCase() === un.toLowerCase())) {
                showErr('e2Username', 'Username already taken.'); ok = false;
            }
            if (users.find(u => u.email === em.toLowerCase())) {
                showErr('e2Email', 'Email already registered.'); ok = false;
            }
        }
    }

    return ok;
}

// CREATE ACCOUNT
function createAccount() {
    const agreed = document.getElementById('agreeTerms').checked;
    const errBox = document.getElementById('s3Error');

    if (!agreed) {
        errBox.innerText = 'Please agree to the Terms of Service to continue.';
        return;
    }
    errBox.innerText = '';

    const newUser = {
        id:          Date.now().toString(),
        firstName:   getVal('s1FirstName'),
        lastName:    getVal('s1LastName'),
        dob:         getVal('s1Dob'),
        country:     getVal('s1Country'),
        gender:      selectedGender,
        username:    getVal('s2Username'),
        email:       getVal('s2Email').toLowerCase(),
        password:    getVal('s2Password'),
        genre:       selectedGenre,
        bio:         getVal('s3Bio'),
        avatarColor: '#c9a84c',
        joinedAt:    new Date().toISOString(),
        stats:       { movies: 0, favs: 0, watchlist: 0 },
        prefs: {
            email:     document.getElementById('pEmail').checked,
            watchlist: false,
            ratings:   document.getElementById('pRatings').checked,
            spoiler:   document.getElementById('pSpoiler').checked
        }
    };

    // Save to localStorage
    const users = getUsers();
    users.push(newUser);
    saveUsers(users);

    // Set session
    sessionStorage.setItem('cine_session', JSON.stringify(newUser));

    // Show success screen
    buildSuccessCard(newUser);
    goStep(4);
}

function buildSuccessCard(user) {
    const card = document.getElementById('successCard');
    if (!card) return;
    card.innerHTML = `
        <div style="line-height:2.2; text-align:left;">
            <span style="color:var(--text-dim); font-size:12px; letter-spacing:0.1em; text-transform:uppercase;">Name</span><br>
            <strong style="color:var(--gold); font-size:15px;">${user.firstName} ${user.lastName}</strong><br>
            <span style="color:var(--text-dim); font-size:12px; letter-spacing:0.1em; text-transform:uppercase;">Username</span><br>
            <strong style="color:var(--gold); font-size:15px;">@${user.username}</strong><br>
            <span style="color:var(--text-dim); font-size:12px; letter-spacing:0.1em; text-transform:uppercase;">Email</span><br>
            <strong style="color:var(--gold); font-size:15px;">${user.email}</strong>
            ${user.genre ? `<br><span style="color:var(--text-dim); font-size:12px; letter-spacing:0.1em; text-transform:uppercase;">Favourite Genre</span><br>
            <strong style="color:var(--gold); font-size:15px;">🎭 ${user.genre}</strong>` : ''}
        </div>
    `;
}

// GENRE SELECTOR
function pickGenre(el) {
    document.querySelectorAll('.genre-chip').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    selectedGenre = el.getAttribute('data-g');
}

// GENDER SELECTOR
function selectGender(el) {
    document.querySelectorAll('.gchip').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    selectedGender = el.getAttribute('data-val');
}

// USERNAME LIVE CHECK
function checkUsername() {
    const v     = getVal('s2Username');
    const hint  = document.getElementById('unHint');
    const badge = document.getElementById('unBadge');
    if (!v) { hint.innerText = ''; badge.innerText = ''; return; }

    const users = getUsers();
    const taken = users.find(u => u.username.toLowerCase() === v.toLowerCase());

    if (taken) {
        hint.innerText    = '✗ Username is taken';
        hint.style.color  = '#e74c3c';
        badge.innerText   = '✗';
        badge.style.color = '#e74c3c';
    } else {
        hint.innerText    = '✓ Username is available';
        hint.style.color  = '#2ecc71';
        badge.innerText   = '✓';
        badge.style.color = '#2ecc71';
    }
}

// PASSWORD STRENGTH
function checkStrength() {
    const pw    = getVal('s2Password');
    const bar   = document.getElementById('sBar');
    const label = document.getElementById('sLabel');
    const score = getScore(pw);

    const levels = [
        { w: '0%',   c: 'transparent', t: '' },
        { w: '25%',  c: '#e74c3c',     t: 'Weak' },
        { w: '50%',  c: '#e67e22',     t: 'Fair' },
        { w: '75%',  c: '#f1c40f',     t: 'Good' },
        { w: '100%', c: '#2ecc71',     t: 'Strong' }
    ];

    const lv = levels[score];
    bar.style.width      = lv.w;
    bar.style.background = lv.c;
    label.innerText      = lv.t;
    label.style.color    = lv.c;
}

function getScore(pw) {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 6)  s++;
    if (pw.length >= 10) s++;
    if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return Math.min(s, 4);
}

// TOGGLE PASSWORD VISIBILITY
function togglePass(id, btn) {
    const input = document.getElementById(id);
    if (input.type === 'password') {
        input.type    = 'text';
        btn.innerText = '🙈';
    } else {
        input.type    = 'password';
        btn.innerText = '👁';
    }
}

// STORAGE
function getUsers() {
    return JSON.parse(localStorage.getItem('cine_users') || '[]');
}
function saveUsers(users) {
    localStorage.setItem('cine_users', JSON.stringify(users));
}

// DOM HELPERS
function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}
function showErr(id, msg) {
    const el = document.getElementById(id);
    if (el) el.innerText = msg;
}
function clearErr(id) {
    const el = document.getElementById(id);
    if (el) el.innerText = '';
}
