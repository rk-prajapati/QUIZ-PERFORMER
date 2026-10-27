/* Student dashboard */
async function initDashboard() {
  const session = Session.requireRole('student');
  if (!session) return;
  document.getElementById('welcome').textContent = `Welcome, ${session.name}!`;

  const quizzes = QuizzesDB.all();
  const myResults = ResultsDB.byStudent(session.id);
  const attemptedIds = new Set(myResults.map(r => r.quizId));
  const avg = myResults.length ? Math.round(myResults.reduce((s, r) => s + r.percentage, 0) / myResults.length) : 0;

  document.getElementById('statAvailable').textContent = quizzes.length;
  document.getElementById('statCompleted').textContent = attemptedIds.size;
  document.getElementById('statAttempts').textContent = myResults.length;
  document.getElementById('statAvg').textContent = avg + '%';

  renderQuizList(quizzes, attemptedIds);
  renderHistory(myResults);

  document.getElementById('search').oninput = (e) => {
    const q = e.target.value.toLowerCase();
    const cat = document.getElementById('category').value;
    let filtered = quizzes.filter(x => x.title.toLowerCase().includes(q));
    if (cat) filtered = filtered.filter(x => x.category === cat);
    renderQuizList(filtered, attemptedIds);
  };
  document.getElementById('category').onchange = () => document.getElementById('search').dispatchEvent(new Event('input'));

  const cats = [...new Set(quizzes.map(q => q.category).filter(Boolean))];
  document.getElementById('category').innerHTML = '<option value="">All categories</option>' + cats.map(c => `<option>${c}</option>`).join('');
}

function renderQuizList(list, attemptedIds) {
  const el = document.getElementById('quizList');
  if (!list.length) { el.innerHTML = '<div class="card text-center">No quizzes match.</div>'; return; }
  el.innerHTML = list.map(q => `
    <div class="card">
      <div class="flex-between mb-2">
        <div>
          <div style="font-size:1.1rem;font-weight:700;">${q.title}</div>
          <div style="opacity:.8;font-size:.85rem;">${q.category || 'General'} • ${q.questions.length} Qs • ${q.duration} min</div>
        </div>
        ${attemptedIds.has(q.id) ? '<span class="badge">Completed</span>' : ''}
      </div>
      <button type="button" onclick="startQuiz('${q.id}')" class="btn btn-primary btn-block"><i class="fa-solid fa-play"></i> Start Random Quiz</button>
    </div>
  `).join('');
}

function startQuiz(quizId) {
  const attemptId = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  location.href = `quiz.html?id=${encodeURIComponent(quizId)}&attempt=${attemptId}`;
}

function renderHistory(results) {
  const el = document.getElementById('history');
  if (!results.length) { el.innerHTML = '<div class="card text-center">No attempts yet.</div>'; return; }
  const rows = results.slice().sort((a,b) => b.submittedAt - a.submittedAt).map(r => `
    <tr>
      <td>${r.quizTitle}</td>
      <td>${r.score}/${r.total}</td>
      <td>${r.percentage}%</td>
      <td><span class="badge ${r.passed ? 'pass' : 'fail'}">${r.passed ? 'Pass' : 'Fail'}</span></td>
      <td>${new Date(r.submittedAt).toLocaleDateString()}</td>
      <td><a href="result.html?id=${r.id}" class="btn" style="padding:6px 12px;font-size:.85rem;">View</a></td>
    </tr>
  `).join('');
  el.innerHTML = `<div class="card table-wrap"><table class="table"><thead><tr><th>Quiz</th><th>Score</th><th>%</th><th>Status</th><th>Date</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
