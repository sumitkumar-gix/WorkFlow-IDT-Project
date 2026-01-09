// --- Select DOM Elements ---
const input = document.getElementById('todo-input');
const addBtn = document.getElementById('add-btn');
const list = document.getElementById('todo-list');
const prioritySelect = document.getElementById('priority-select');
const dateInput = document.getElementById('date-input');
const themeToggle = document.getElementById('theme-toggle');
const micBtn = document.getElementById('mic-btn');
const timerDisplay = document.getElementById('timer');
const startTimerBtn = document.getElementById('start-timer');
const resetTimerBtn = document.getElementById('reset-timer');

// --- Load Data ---
let todos = JSON.parse(localStorage.getItem('todos')) || [];

// --- THEME TOGGLE LOGIC ---
// Check saved theme or default to dark
if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
}

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    themeToggle.innerHTML = isLight ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

// --- POMODORO TIMER LOGIC ---
let timerInterval;
let timeLeft = 25 * 60; // 25 minutes in seconds
let isTimerRunning = false;

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

startTimerBtn.addEventListener('click', () => {
    if (isTimerRunning) {
        clearInterval(timerInterval);
        startTimerBtn.textContent = "Start Focus";
        isTimerRunning = false;
    } else {
        startTimerBtn.textContent = "Pause";
        isTimerRunning = true;
        timerInterval = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateTimerDisplay();
            } else {
                clearInterval(timerInterval);
                alert("Pomodoro Complete! Take a break.");
                isTimerRunning = false;
                startTimerBtn.textContent = "Start Focus";
            }
        }, 1000);
    }
});

resetTimerBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    isTimerRunning = false;
    timeLeft = 25 * 60;
    updateTimerDisplay();
    startTimerBtn.textContent = "Start Focus";
});

// --- VOICE INPUT LOGIC ---
if ('webkitSpeechRecognition' in window) {
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';

    micBtn.addEventListener('click', () => {
        recognition.start();
        micBtn.classList.add('listening');
    });

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        input.value = transcript;
        micBtn.classList.remove('listening');
        // Optional: Auto-add if you want
        // addTodo(); 
    };

    recognition.onerror = () => {
        micBtn.classList.remove('listening');
        alert("Voice input error. Try again.");
    };
} else {
    micBtn.style.display = 'none'; // Hide if not supported
}

// --- TODO LIST LOGIC ---

function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

function smartParse(text) {
    let priority = prioritySelect.value;
    let cleanText = text;
    // Default to date picker value if set, otherwise today
    let dueDate = dateInput.value ? new Date(dateInput.value).toLocaleDateString() : new Date().toLocaleDateString();

    // Priority Detection
    if (text.toLowerCase().includes('#high')) { priority = 'high'; cleanText = cleanText.replace('#high', ''); }
    else if (text.toLowerCase().includes('#medium')) { priority = 'medium'; cleanText = cleanText.replace('#medium', ''); }
    else if (text.toLowerCase().includes('#low')) { priority = 'low'; cleanText = cleanText.replace('#low', ''); }

    // Date Keyword Detection (overrides picker if keyword found)
    if (text.toLowerCase().includes('tomorrow')) {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        dueDate = d.toLocaleDateString();
        cleanText = cleanText.replace('tomorrow', '');
    }

    return { text: cleanText.trim(), priority, dueDate };
}

function addTodo() {
    const rawText = input.value.trim();
    if (!rawText) return;

    const { text, priority, dueDate } = smartParse(rawText);

    const todo = {
        id: Date.now(),
        text: text,
        completed: false,
        priority: priority,
        date: dueDate
    };

    todos.push(todo);
    input.value = '';
    dateInput.value = ''; // Reset date picker
    saveTodos();
    render();
}

function toggleComplete(id) {
    todos = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveTodos();
    render();
}

function deleteTodo(id) {
    todos = todos.filter(t => t.id !== id);
    saveTodos();
    render();
}

function updateProgress(completed, total) {
    const circle = document.querySelector('.progress-ring__circle');
    const numbers = document.getElementById('numbers');
    numbers.innerText = `${completed} / ${total}`;
    
    const radius = 30; 
    const circumference = 2 * Math.PI * radius; 
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    
    if (total === 0) {
        circle.style.strokeDashoffset = circumference;
    } else {
        const percentage = completed / total;
        circle.style.strokeDashoffset = circumference - (percentage * circumference);
    }
}

function render() {
    list.innerHTML = '';
    let completedCount = 0;

    todos.forEach(todo => {
        if (todo.completed) completedCount++;
        const li = document.createElement('li');
        li.className = `priority-${todo.priority} ${todo.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <div style="display:flex; align-items:center;">
                <input type="checkbox" ${todo.completed ? 'checked' : ''} onchange="toggleComplete(${todo.id})">
                <div class="task-content">
                    <span class="task-text">${todo.text}</span>
                    <span class="task-date"><i class="far fa-calendar-alt"></i> ${todo.date}</span>
                </div>
            </div>
            <button class="delete-btn" onclick="deleteTodo(${todo.id})"><i class="fas fa-trash"></i></button>
        `;
        list.appendChild(li);
    });
    updateProgress(completedCount, todos.length);
}

// Event Listeners
addBtn.addEventListener('click', addTodo);
input.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTodo(); });

// Initial Render
render();