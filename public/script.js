
    let questions = [];
    let currentQ = 0;
    let score = 0;
    let topic = "";

    async function startQuiz() {
      topic = document.getElementById('topicInput').value;
      if (!topic) return alert("Please enter a topic");

      const btn = document.querySelector('#start-view button');
      btn.innerText = "Consulting Gemini AI...";
      btn.disabled = true;

      try {
        const res = await fetch('/api/generate-quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic })
        });
        questions = await res.json();

        document.getElementById('start-view').classList.add('hidden');
        document.getElementById('quiz-view').classList.remove('hidden');
        showQuestion();
      } catch (e) {
        alert("Error connecting to AI. Please check your API limits or console.");
        btn.innerText = "Generate Assessment";
        btn.disabled = false;
      }
    }

    function showQuestion() {
      const q = questions[currentQ];
      document.getElementById('question-text').innerText = q.question;
      const container = document.getElementById('options-container');
      container.innerHTML = '';

      q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => handleAnswer(opt === q.answer);
        container.appendChild(btn);
      });
    }

    function handleAnswer(isCorrect) {
      if (isCorrect) score++;
      currentQ++;
      if (currentQ < questions.length) {
        showQuestion();
      } else {
        showResults();
      }
    }

    async function showResults() {
      document.getElementById('quiz-view').classList.add('hidden');
      document.getElementById('result-view').classList.remove('hidden');
      document.getElementById('final-score').innerText = score;

      // Generate Stats
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic, userScore: score, totalQuestions: questions.length })
        });
        const data = await res.json();
        document.getElementById('feedback-text').innerText = data.feedback;
        renderChart(data.stats);
      } catch (e) {
        console.error(e);
      }
    }
    // --- Tool Switching Logic ---
function switchTool(toolName) {
    // Hide all tools
    document.getElementById('quiz-tool').classList.add('hidden');
    document.getElementById('future-tool').classList.add('hidden');
    
    // Update Buttons
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    // Show selected
    if(toolName === 'quiz') {
        document.getElementById('quiz-tool').classList.remove('hidden');
        document.querySelector('button[onclick="switchTool(\'quiz\')"]').classList.add('active');
    } else {
        document.getElementById('future-tool').classList.remove('hidden');
        document.querySelector('button[onclick="switchTool(\'future\')"]').classList.add('active');
    }
}

// --- NEW FEATURE: Future Skills Logic ---
async function getFutureSkills() {
    const role = document.getElementById('futureInput').value;
    if(!role) return alert("Enter a job role");

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

        // Render Results
        document.getElementById('future-results').classList.remove('hidden');
        document.getElementById('future-advice').innerText = data.advice;

        // Helper to fill lists
        const fillList = (id, items) => {
            document.getElementById(id).innerHTML = items.map(i => `<li>${i}</li>`).join('');
        };

        fillList('list-core', data.core_skills);
        fillList('list-future', data.future_skills);
        fillList('list-trends', data.trends);

        btn.innerText = "Predict Another Role";
        btn.disabled = false;

    } catch (e) {
        console.error(e);
        alert("AI Error. Try again.");
        btn.innerText = "Predict Future";
        btn.disabled = false;
    }
}

// --- EXISTING: Quiz Logic (Kept same as before) ---
let questions = [];
let currentQ = 0;
let score = 0;
let topic = "";

async function startQuiz() {
    topic = document.getElementById('topicInput').value;
    if (!topic) return alert("Please enter a topic");
    
    const btn = document.querySelector('#start-view button');
    btn.innerText = "Generating...";
    
    try {
        const res = await fetch('/api/generate-quiz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic })
        });
        questions = await res.json();
        
        document.getElementById('start-view').classList.add('hidden');
        document.getElementById('quiz-view').classList.remove('hidden');
        showQuestion();
    } catch (e) { alert("Error"); btn.innerText = "Start Assessment"; }
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
    
    const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ topic, userScore: score, totalQuestions: questions.length })
    });
    const data = await res.json();
    
    document.getElementById('ai-role').innerText = data.role;
    document.getElementById('ai-salary').innerText = data.salary;
    document.getElementById('roadmap-container').innerHTML = data.roadmap.map((s,i)=>`<div class="roadmap-item"><div class="week-num">Week ${i+1}</div><div>${s}</div></div>`).join('');
    
    new Chart(document.getElementById('skillChart').getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(data.stats),
            datasets: [{ data: Object.values(data.stats), backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'], borderWidth: 0 }]
        },
        options: { cutout: '80%', plugins: { legend: { display: false } } }
    });
}

    function renderChart(stats) {
      const ctx = document.getElementById('skillChart').getContext('2d');
      const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: Object.keys(stats),
          datasets: [{
            data: Object.values(stats),
            backgroundColor: colors,
            borderWidth: 0,
            hoverOffset: 10
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '80%',
          borderRadius: 10,
          plugins: { legend: { display: false } }
        }
      });
    }