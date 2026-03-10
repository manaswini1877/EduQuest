const API_URL = 'http://localhost:3000/api';

// --- State Management ---
let state = {
    user: null, // {id, username, role}
    subjects: [],
    sections: [],
    currentSubjectId: null,
    currentSectionId: null,
    questions: [],
    currentQuestionIndex: 0,
    score: 0,
    timer: null,
    timeLeft: 15,
    isAnswered: false,
    authMode: 'login' // 'login' or 'register'
};

// --- DOM Elements ---
const screens = {
    auth: document.getElementById('auth-screen'),
    teacherDash: document.getElementById('teacher-dashboard'),
    studentDash: document.getElementById('student-dashboard'),
    quiz: document.getElementById('quiz-screen'),
    result: document.getElementById('result-screen')
};

// Auth Elements
const authForm = document.getElementById('auth-form');
const authSubtitle = document.getElementById('auth-subtitle');
const authBtn = document.getElementById('auth-btn');
const roleGroup = document.getElementById('role-group');
const switchToRegister = document.getElementById('switch-to-register');
const switchToLogin = document.getElementById('switch-to-login');

// Teacher Elements
const teacherLogoutBtn = document.getElementById('teacher-logout');
const teacherNavAdd = document.getElementById('teacher-nav-add');
const teacherNavProgress = document.getElementById('teacher-nav-progress');
const teacherViewAdd = document.getElementById('teacher-view-add');
const teacherViewProgress = document.getElementById('teacher-view-progress');
const addQuestionForm = document.getElementById('add-question-form');
const qSubjectSelect = document.getElementById('q-subject');
const qSectionSelect = document.getElementById('q-section');

// Student Elements
const studentLogoutBtn = document.getElementById('student-logout');
const studentSubjectView = document.getElementById('student-subject-view');
const studentSectionView = document.getElementById('student-section-view');
const subjectsContainer = document.getElementById('subjects-container');
const sectionsContainer = document.getElementById('sections-container');
const backToSubjectsBtn = document.getElementById('back-to-subjects');
const sectionViewTitle = document.getElementById('section-view-title');

// General
const toastEl = document.getElementById('toast');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    const storedUser = localStorage.getItem('quiz_user');
    if (storedUser) {
        state.user = JSON.parse(storedUser);
        routeUser();
    } else {
        showScreen('auth');
    }
});

// --- Auth Logic ---
switchToRegister.addEventListener('click', () => {
    state.authMode = 'register';
    document.querySelector('h1').textContent = 'Create Account';
    authSubtitle.textContent = 'Join Quiz Master today.';
    authBtn.innerHTML = '<span>Register</span>';
    roleGroup.classList.remove('hidden');
    switchToRegister.parentElement.classList.add('hidden');
    switchToLogin.parentElement.classList.remove('hidden');
});

switchToLogin.addEventListener('click', () => {
    state.authMode = 'login';
    document.querySelector('h1').textContent = 'Welcome Back';
    authSubtitle.textContent = 'Login to Quiz Master.';
    authBtn.innerHTML = '<span>Login</span>';
    roleGroup.classList.add('hidden');
    switchToLogin.parentElement.classList.add('hidden');
    switchToRegister.parentElement.classList.remove('hidden');
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('auth-username').value.trim();
    const password = document.getElementById('auth-password').value.trim();
    const role = document.getElementById('auth-role').value;

    if (!username || !password) return showToast('Please fill all fields');

    const endpoint = state.authMode === 'login' ? '/login' : '/register';
    const payload = state.authMode === 'login' ? { username, password } : { username, password, role };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Authentication failed');

        if (state.authMode === 'register') {
            showToast('Registration successful! Please login.');
            switchToLogin.click();
            authForm.reset();
        } else {
            showToast(data.message);
            state.user = data.user;
            localStorage.setItem('quiz_user', JSON.stringify(state.user));
            authForm.reset();
            routeUser();
        }

    } catch (error) {
        showToast(error.message);
    }
});

function handleLogout() {
    state.user = null;
    localStorage.removeItem('quiz_user');
    showScreen('auth');
}

teacherLogoutBtn.addEventListener('click', handleLogout);
studentLogoutBtn.addEventListener('click', handleLogout);

// --- Routing & Dashboards ---
function routeUser() {
    if (!state.user) return showScreen('auth');

    if (state.user.role === 'teacher') {
        showScreen('teacherDash');
        loadTeacherDashboard();
    } else {
        showScreen('studentDash');
        loadStudentDashboard();
    }
}

async function loadSubjects() {
    try {
        const response = await fetch(`${API_URL}/subjects`);
        if (!response.ok) throw new Error('Failed to fetch subjects');
        state.subjects = await response.json();
    } catch (error) {
        showToast('Error loading subjects');
    }
}

// --- Teacher Logic ---
teacherNavAdd.addEventListener('click', () => {
    teacherNavAdd.classList.add('active');
    teacherNavProgress.classList.remove('active');
    teacherViewAdd.classList.add('active');
    teacherViewAdd.classList.remove('hidden');
    teacherViewProgress.classList.remove('active');
    teacherViewProgress.classList.add('hidden');
});

teacherNavProgress.addEventListener('click', () => {
    teacherNavProgress.classList.add('active');
    teacherNavAdd.classList.remove('active');
    teacherViewProgress.classList.add('active');
    teacherViewProgress.classList.remove('hidden');
    teacherViewAdd.classList.remove('active');
    teacherViewAdd.classList.add('hidden');

    loadTeacherProgress();
});

async function loadTeacherDashboard() {
    await loadSubjects();

    qSubjectSelect.innerHTML = '<option value="" disabled selected>Select Subject</option>';
    qSectionSelect.innerHTML = '<option value="" disabled selected>Select Section</option>';
    qSectionSelect.disabled = true;

    state.subjects.forEach(sub => {
        qSubjectSelect.innerHTML += `<option value="${sub.id}">${sub.name}</option>`;
    });
}

qSubjectSelect.addEventListener('change', async (e) => {
    const subjectId = e.target.value;
    qSectionSelect.innerHTML = '<option value="" disabled selected>Loading...</option>';
    qSectionSelect.disabled = true;

    try {
        const response = await fetch(`${API_URL}/subjects/${subjectId}/sections`);
        const sections = await response.json();

        qSectionSelect.innerHTML = '<option value="" disabled selected>Select Section</option>';
        sections.forEach(sec => {
            qSectionSelect.innerHTML += `<option value="${sec.id}">${sec.name} (${sec.difficulty})</option>`;
        });
        qSectionSelect.disabled = false;
    } catch (error) {
        showToast('Error loading sections');
    }
});

addQuestionForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
        section_id: qSectionSelect.value,
        question: document.getElementById('q-text').value.trim(),
        option_a: document.getElementById('q-opt-a').value.trim(),
        option_b: document.getElementById('q-opt-b').value.trim(),
        option_c: document.getElementById('q-opt-c').value.trim(),
        option_d: document.getElementById('q-opt-d').value.trim(),
        correct_option: document.getElementById('q-correct').value,
        teacher_id: state.user.id
    };

    try {
        const response = await fetch(`${API_URL}/questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        showToast('Question added successfully!');

        document.getElementById('q-text').value = '';
        document.getElementById('q-opt-a').value = '';
        document.getElementById('q-opt-b').value = '';
        document.getElementById('q-opt-c').value = '';
        document.getElementById('q-opt-d').value = '';
        document.getElementById('q-correct').value = '';

    } catch (error) {
        showToast(error.message);
    }
});

async function loadTeacherProgress() {
    const tbody = document.getElementById('progress-tbody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading progress...</td></tr>';

    try {
        const response = await fetch(`${API_URL}/progress`);
        const data = await response.json();

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No student records found.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(row => `
            <tr>
                <td><strong>${row.username}</strong></td>
                <td>${row.subject_name}</td>
                <td>${row.section_name}</td>
                <td><strong>${row.score}</strong>/${row.total}</td>
                <td>${new Date(row.date).toLocaleDateString()}</td>
            </tr>
        `).join('');
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Error loading progress.</td></tr>';
    }
}


// --- Student Logic ---
async function loadStudentDashboard() {
    document.getElementById('student-name').textContent = state.user.username;

    studentSubjectView.classList.remove('hidden');
    studentSectionView.classList.add('hidden');

    subjectsContainer.innerHTML = '<div class="subject-card loading">Loading subjects...</div>';

    await loadSubjects();
    subjectsContainer.innerHTML = '';

    if (state.subjects.length === 0) {
        subjectsContainer.innerHTML = '<div class="subject-card loading">No subjects available yet.</div>';
        return;
    }

    state.subjects.forEach(sub => {
        const card = document.createElement('div');
        card.className = 'subject-card';
        card.innerHTML = `
            <div class="subject-info">${sub.name}</div>
            <div class="subject-count">Select a section</div>
        `;
        card.onclick = () => loadStudentSections(sub.id, sub.name);
        subjectsContainer.appendChild(card);
    });
}

backToSubjectsBtn.addEventListener('click', () => {
    studentSectionView.classList.add('hidden');
    studentSubjectView.classList.remove('hidden');
});

async function loadStudentSections(subjectId, subjectName) {
    state.currentSubjectId = subjectId;
    sectionViewTitle.textContent = `${subjectName} Sections`;

    studentSubjectView.classList.add('hidden');
    studentSectionView.classList.remove('hidden');

    sectionsContainer.innerHTML = '<div style="text-align:center; padding: 20px;">Loading sections...</div>';

    try {
        const response = await fetch(`${API_URL}/subjects/${subjectId}/sections`);
        const sections = await response.json();
        state.sections = sections;

        sectionsContainer.innerHTML = '';
        sections.forEach((sec, idx) => {
            const item = document.createElement('div');
            item.className = 'section-item';

            const diffClass = sec.difficulty === 'easy' ? '#a7f3d0' : (sec.difficulty === 'medium' ? '#fde047' : '#fca5a5');

            item.innerHTML = `
                <div class="section-details">
                    <div class="section-name">${sec.name}</div>
                    <div class="section-difficulty" style="color: ${diffClass};">${sec.difficulty.toUpperCase()}</div>
                </div>
                <div>→</div>
            `;
            item.onclick = () => startSectionQuiz(sec.id, sec.difficulty);
            sectionsContainer.appendChild(item);
        });

    } catch (error) {
        sectionsContainer.innerHTML = '<div style="text-align:center; padding: 20px;">Failed to load.</div>';
    }
}

async function startSectionQuiz(sectionId, difficulty) {
    state.currentSectionId = sectionId;

    try {
        showToast('Loading quiz...');
        const response = await fetch(`${API_URL}/sections/${sectionId}/questions`);
        if (!response.ok) throw new Error('Failed to fetch questions');

        const qList = await response.json();
        if (qList.length === 0) return showToast('No questions available in this section yet!');

        // Let's inject difficulty into the question objects for the UI
        state.questions = qList.map(q => ({ ...q, difficulty }));
        state.currentQuestionIndex = 0;
        state.score = 0;

        showScreen('quiz');
        loadQuestion();
    } catch (error) {
        showToast(error.message);
    }
}

// --- Quiz Taking Logic ---
function loadQuestion() {
    state.isAnswered = false;
    const question = state.questions[state.currentQuestionIndex];

    document.getElementById('question-counter').textContent = `Q ${state.currentQuestionIndex + 1}/${state.questions.length}`;

    const diffBadge = document.getElementById('difficulty-badge');
    diffBadge.textContent = question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1);
    diffBadge.className = `badge ${question.difficulty}`;

    document.getElementById('question-text').textContent = question.question;

    const progress = ((state.currentQuestionIndex) / state.questions.length) * 100;
    document.getElementById('progress-bar').style.width = `${progress}%`;

    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';

    const optionsMap = { 'A': question.option_a, 'B': question.option_b, 'C': question.option_c, 'D': question.option_d };

    ['A', 'B', 'C', 'D'].forEach(key => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = `<span>${optionsMap[key]}</span><span class="indicator"></span>`;
        btn.onclick = () => selectOption(btn, key, question.correct_option);
        optionsContainer.appendChild(btn);
    });

    document.getElementById('next-btn').disabled = true;
    startTimer();
}

function startTimer() {
    if (state.timer) clearInterval(state.timer);

    const currentDiff = state.questions[state.currentQuestionIndex].difficulty;
    state.timeLeft = currentDiff === 'easy' ? 10 : (currentDiff === 'medium' ? 15 : 20);

    document.getElementById('question-counter').innerHTML += ` &nbsp;⌚ <span id="time-left">${state.timeLeft}s</span>`;

    state.timer = setInterval(() => {
        state.timeLeft--;
        const timeSpan = document.getElementById('time-left');
        if (timeSpan) timeSpan.textContent = `${state.timeLeft}s`;

        if (state.timeLeft <= 0) {
            clearInterval(state.timer);
            handleTimeOut();
        }
    }, 1000);
}

function selectOption(selectedBtn, selectedKey, correctKey) {
    if (state.isAnswered) return;

    clearInterval(state.timer);
    state.isAnswered = true;

    const buttons = document.querySelectorAll('.option-btn');

    if (selectedKey === correctKey) {
        selectedBtn.classList.add('correct');
        selectedBtn.querySelector('.indicator').innerHTML = '&#10003;';
        state.score++;
    } else {
        selectedBtn.classList.add('wrong');
        selectedBtn.querySelector('.indicator').innerHTML = '&#10007;';

        buttons.forEach((btn, index) => {
            if (['A', 'B', 'C', 'D'][index] === correctKey) {
                btn.classList.add('correct');
                btn.querySelector('.indicator').innerHTML = '&#10003;';
            }
        });
    }

    buttons.forEach(btn => btn.style.cursor = 'default');
    document.getElementById('next-btn').disabled = false;
}

function handleTimeOut() {
    state.isAnswered = true;
    const correctKey = state.questions[state.currentQuestionIndex].correct_option;
    const buttons = document.querySelectorAll('.option-btn');

    buttons.forEach((btn, index) => {
        btn.style.cursor = 'default';
        if (['A', 'B', 'C', 'D'][index] === correctKey) {
            btn.classList.add('correct');
            btn.querySelector('.indicator').innerHTML = '&#10003;';
        }
    });

    showToast('Time is up!');
    document.getElementById('next-btn').disabled = false;
}

document.getElementById('next-btn').addEventListener('click', () => {
    if (state.currentQuestionIndex < state.questions.length - 1) {
        state.currentQuestionIndex++;
        loadQuestion();
    } else {
        finishQuiz();
    }
});

async function finishQuiz() {
    if (state.timer) clearInterval(state.timer);
    document.getElementById('progress-bar').style.width = '100%';

    const total = state.questions.length;
    document.getElementById('final-score').textContent = state.score;
    document.getElementById('final-total').textContent = `/ ${total}`;

    const percentage = (state.score / total) * 100;
    document.querySelector('.score-circle').style.setProperty('--progress', `${percentage}%`);

    const messageEl = document.getElementById('result-message');
    const iconEl = document.getElementById('celebration-icon');

    if (percentage >= 80) {
        messageEl.textContent = "Excellent work!"; iconEl.textContent = '👑';
    } else if (percentage >= 50) {
        messageEl.textContent = "Good job! Keep practicing."; iconEl.textContent = '👍';
    } else {
        messageEl.textContent = "Time to brush up on your skills!"; iconEl.textContent = '📚';
    }

    showScreen('result');
    // We no longer fetch a generic "subject leaderboard". We could do section-specifc.
    document.getElementById('subject-leaderboard').innerHTML = '<p style="color:var(--text-muted); padding-top:20px;">Score tracking complete. Your teacher can view your progress.</p>';

    // Save score
    try {
        await fetch(`${API_URL}/scores`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: state.user.id,
                section_id: state.currentSectionId,
                score: state.score,
                total: total
            })
        });
    } catch (error) {
        console.error('Error saving score:', error);
    }
}


document.getElementById('restart-btn').addEventListener('click', () => {
    // restart the same section quiz
    const sec = state.sections.find(s => s.id === state.currentSectionId);
    startSectionQuiz(state.currentSectionId, sec ? sec.difficulty : 'medium');
});

document.getElementById('home-btn').addEventListener('click', routeUser);

// --- Utilities ---
function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenName].classList.add('active');
}

function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 3000);
}
