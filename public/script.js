// --- Tool Switching Logic ---
function switchTool(toolName) {
    document.getElementById('quiz-tool').classList.add('hidden');
    document.getElementById('future-tool').classList.add('hidden');
    
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    if(toolName === 'quiz') {
        document.getElementById('quiz-tool').classList.remove('hidden');
        document.querySelectorAll('.nav-btn')[0].classList.add('active');
    } else {
        document.getElementById('future-tool').classList.remove('hidden');
        document.querySelectorAll('.nav-btn')[1].classList.add('active');
    }
}

// --- TOOL 2: Future Skills Logic ---
async function getFutureSkills() {
    const role = document.getElementById('futureInput').value;
    if(!role) return alert("Please enter a job role");

    const btn = document.querySelector('#future-tool button');
    btn.innerText = "Analyzing Trends...";
    btn.disabled = true;

    try {
        const res = await fetch('/api/future-skills', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ role })
        });
        const data = await res.json();

        document.getElementById('future-results').classList.remove('hidden');
        document.getElementById('future-advice').innerText = data.advice;

        const fill = (id, items) => document.getElementById(id).innerHTML = items.map(i => `<li>${i}</li>`).join('');
        fill('list-core', data.core_skills);
        fill('list-future', data.future_skills);
        fill('list-trends', data.trends);

        btn.innerText = "Predict Another Role";
        btn.disabled = false;
    } catch (e) {
        console.error(e);
        alert("AI Error. Check console.");
        btn.innerText = "Predict Future";
        btn.disabled = false;
    }
}

// --- TOOL 1: Quiz Logic ---
let questions = [];
let currentQ = 0;
let score = 0;
let topic = "";

async function startQuiz() {
    topic = document.getElementById('topicInput').value;
    if(!topic) return alert("Please enter a topic");

    const btn = document.querySelector('#start-view button');
    btn.innerText = "Generating Quiz...";
    btn.disabled = true;

    try {
        const res = await fetch('/api/generate-quiz', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ topic })
        });
        questions = await res.json();
        
        document.getElementById('start-view').classList.add('hidden');
        document.getElementById('quiz-view').classList.remove('hidden');
        showQuestion();
    } catch (e) {
        alert("Error connecting to AI.");
        btn.innerText = "Start Assessment";
        btn.disabled = false;
    }
}

function showQuestion() {
    const q = questions[currentQ];
    document.getElementById('q-counter').innerText = `${currentQ + 1}/${questions.length}`;
    document.getElementById('question-text').innerText = q.question;
    const container = document.getElementById('options-container');
    container.innerHTML = '';
    
    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => {
            if(opt === q.answer) score++;
            currentQ++;
            if(currentQ < questions.length) showQuestion();
            else showResults();
        };
        container.appendChild(btn);
    });
}

async function showResults() {
    document.getElementById('quiz-view').classList.add('hidden');
    document.getElementById('result-view').classList.remove('hidden');
    document.getElementById('final-score').innerText = Math.round((score/questions.length)*100) + "%";

    try {
        const res = await fetch('/api/analyze', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ topic, userScore: score, totalQuestions: questions.length })
        });
        const data = await res.json();
        
        document.getElementById('ai-role').innerText = data.role;
        document.getElementById('ai-salary').innerText = data.salary;
        document.getElementById('roadmap-container').innerHTML = data.roadmap.map((week, i) => `
            <div class="roadmap-item">
                <div class="week-num">Week ${i+1}</div>
                <div class="week-task">${week}</div>
            </div>
        `).join('');

        const ctx = document.getElementById('skillChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(data.stats),
                datasets: [{
                    data: Object.values(data.stats),
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
                    borderWidth: 0
                }]
            },
            options: { cutout: '80%', plugins: { legend: { display: false } } }
        });
    } catch(e) { console.error(e); }
}