/* Admin panel */
let editingId = null;

async function initAdmin() {
  const gate = document.getElementById('adminGate');
  const content = document.getElementById('adminContent');
  gate.classList.add('hidden');
  content.classList.remove('hidden');
  refreshAll();
  showTab('overview');
}

function showTab(name) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('btn-primary'));
  document.getElementById('tab-' + name).classList.remove('hidden');
  document.querySelector(`[data-tab="${name}"]`).classList.add('btn-primary');
  if (name === 'overview') renderCharts();
  if (name === 'students') renderStudents();
  if (name === 'results') renderResults();
  if (name === 'quizzes') renderQuizzes();
}

function refreshAll() {
  const quizzes = QuizzesDB.all();
  const students = UsersDB.all().filter(u => u.role === 'student');
  const results = ResultsDB.all();
  const avg = results.length ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length) : 0;
  document.getElementById('statQuizzes').textContent = quizzes.length;
  document.getElementById('statStudents').textContent = students.length;
  document.getElementById('statAttempts').textContent = results.length;
  document.getElementById('statAvg').textContent = avg + '%';
}

let charts = {};
function renderCharts() {
  const quizzes = QuizzesDB.all();
  const results = ResultsDB.all();
  Object.values(charts).forEach(c => c && c.destroy());
  charts = {};

  // Attempts per quiz
  const attemptsPerQuiz = quizzes.map(q => ({
    label: q.title,
    count: results.filter(r => r.quizId === q.id).length
  }));
  charts.attempts = new Chart(document.getElementById('chartAttempts'), {
    type: 'bar',
    data: {
      labels: attemptsPerQuiz.map(a => a.label),
      datasets: [{ label: 'Attempts', data: attemptsPerQuiz.map(a => a.count), backgroundColor: '#ffd166' }]
    },
    options: chartBase()
  });

  // Pass vs Fail
  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;
  charts.passfail = new Chart(document.getElementById('chartPassFail'), {
    type: 'doughnut',
    data: {
      labels: ['Passed', 'Failed'],
      datasets: [{ data: [passed, failed], backgroundColor: ['#06d6a0', '#ef476f'] }]
    },
    options: chartBase(true)
  });

  // Category distribution
  const catMap = {};
  quizzes.forEach(q => { catMap[q.category || 'Other'] = (catMap[q.category || 'Other'] || 0) + 1; });
  charts.categories = new Chart(document.getElementById('chartCategories'), {
    type: 'pie',
    data: {
      labels: Object.keys(catMap),
      datasets: [{ data: Object.values(catMap), backgroundColor: ['#6a11cb','#2575fc','#ff6a88','#ffd166','#06d6a0'] }]
    },
    options: chartBase(true)
  });

  // Score trend
  const sorted = [...results].sort((a,b) => a.submittedAt - b.submittedAt);
  charts.trend = new Chart(document.getElementById('chartTrend'), {
    type: 'line',
    data: {
      labels: sorted.map(r => new Date(r.submittedAt).toLocaleDateString()),
      datasets: [{
        label: 'Score %',
        data: sorted.map(r => r.percentage),
        borderColor: '#ffd166',
        backgroundColor: 'rgba(255,209,102,0.2)',
        tension: 0.35,
        fill: true
      }]
    },
    options: chartBase()
  });
}

function chartBase(legend = false) {
  return {
    responsive: true,
    plugins: { legend: { display: legend, labels: { color: '#fff' } } },
    scales: legend ? {} : {
      x: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' } },
      y: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' }, beginAtZero: true }
    }
  };
}

function renderStudents() {
  const students = UsersDB.all().filter(u => u.role === 'student');
  const results = ResultsDB.all();
  const el = document.getElementById('studentsTable');
  if (!students.length) { el.innerHTML = '<div class="card text-center">No students registered.</div>'; return; }
  const rows = students.map(s => {
    const rs = results.filter(r => r.studentId === s.id);
    const avg = rs.length ? Math.round(rs.reduce((a,r) => a + r.percentage, 0) / rs.length) : 0;
    return `<tr><td>${escapeHtml(s.name)}</td><td>${escapeHtml(s.email)}</td><td>${rs.length}</td><td>${avg}%</td><td>${new Date(s.createdAt).toLocaleDateString()}</td></tr>`;
  }).join('');
  el.innerHTML = `<div class="card table-wrap"><table class="table"><thead><tr><th>Name</th><th>Email</th><th>Attempts</th><th>Avg</th><th>Joined</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderResults() {
  const results = ResultsDB.all().slice().sort((a,b) => b.submittedAt - a.submittedAt);
  const el = document.getElementById('resultsTable');
  if (!results.length) { el.innerHTML = '<div class="card text-center">No attempts yet.</div>'; return; }
  const rows = results.map(r => `
    <tr>
      <td>${escapeHtml(r.studentName)}</td>
      <td>${escapeHtml(r.quizTitle)}</td>
      <td>${r.score}/${r.total}</td>
      <td>${r.percentage}%</td>
      <td><span class="badge ${r.passed ? 'pass' : 'fail'}">${r.passed ? 'Pass' : 'Fail'}</span></td>
      <td>${new Date(r.submittedAt).toLocaleString()}</td>
    </tr>
  `).join('');
  el.innerHTML = `<div class="card table-wrap"><table class="table"><thead><tr><th>Student</th><th>Quiz</th><th>Score</th><th>%</th><th>Status</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function exportResultsCSV() {
  const results = ResultsDB.all().slice().sort((a, b) => b.submittedAt - a.submittedAt);
  if (!results.length) return toast('No results available to export', 'error');
  const quote = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const rows = [
    ['Student', 'Email', 'Quiz', 'Score', 'Total', 'Percentage', 'Status', 'Submitted At'],
    ...results.map(r => {
      const user = UsersDB.all().find(u => u.id === r.studentId);
      return [r.studentName, user?.email || '', r.quizTitle, r.score, r.total, r.percentage, r.passed ? 'Pass' : 'Fail', new Date(r.submittedAt).toLocaleString()];
    })
  ];
  const csv = '\uFEFF' + rows.map(row => row.map(quote).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `exam-results-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  toast('Results exported to CSV', 'success');
}

function renderQuizzes() {
  const quizzes = QuizzesDB.all();
  const results = ResultsDB.all();
  const el = document.getElementById('quizzesTable');
  if (!quizzes.length) { el.innerHTML = '<div class="card text-center">No quizzes yet.</div>'; return; }
  el.innerHTML = quizzes.map(q => {
    const rs = results.filter(r => r.quizId === q.id);
    const avg = rs.length ? Math.round(rs.reduce((a,r) => a + r.percentage, 0) / rs.length) : 0;
    const highest = rs.length ? Math.max(...rs.map(r => r.percentage)) : 0;
    const lowest = rs.length ? Math.min(...rs.map(r => r.percentage)) : 0;
    const passPct = rs.length ? Math.round(rs.filter(r => r.passed).length / rs.length * 100) : 0;
    return `<div class="card mb-2">
      <div class="flex-between">
        <div>
          <div style="font-weight:700;font-size:1.1rem;">${escapeHtml(q.title)}</div>
          <div style="opacity:.8;font-size:.85rem;">${escapeHtml(q.category || 'General')} • ${q.questions.length} Qs • ${q.duration} min</div>
        </div>
        <div class="flex">
          <button class="btn" onclick="editQuiz('${q.id}')"><i class="fa-solid fa-pen"></i> Edit</button>
          <button class="btn btn-danger" onclick="deleteQuiz('${q.id}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
      <div class="grid grid-4 mt-2" style="font-size:.85rem;">
        <div>Attempts: <b>${rs.length}</b></div>
        <div>Avg: <b>${avg}%</b></div>
        <div>Highest: <b>${highest}%</b></div>
        <div>Lowest: <b>${lowest}%</b></div>
        <div>Pass Rate: <b>${passPct}%</b></div>
      </div>
    </div>`;
  }).join('');
}

/* Quiz editor */
function openQuizEditor(id = null) {
  editingId = id;
  const quiz = id ? QuizzesDB.find(id) : { title: '', category: '', duration: 5, questions: [] };
  document.getElementById('editorTitle').textContent = id ? 'Edit Quiz' : 'Create Quiz';
  document.getElementById('qTitle').value = quiz.title;
  document.getElementById('qCategory').value = quiz.category || '';
  document.getElementById('qDuration').value = quiz.duration;
  window.__editorQuestions = JSON.parse(JSON.stringify(quiz.questions));
  renderQuestionsEditor();
  document.getElementById('quizModal').classList.remove('hidden');
}

function closeQuizEditor() {
  document.getElementById('quizModal').classList.add('hidden');
  editingId = null;
}

function addQuestion() {
  window.__editorQuestions.push({ question: '', options: ['', '', '', ''], correctAnswer: 0 });
  renderQuestionsEditor();
}

function removeQuestion(i) {
  window.__editorQuestions.splice(i, 1);
  renderQuestionsEditor();
}

function renderQuestionsEditor() {
  const list = document.getElementById('questionsList');
  list.innerHTML = window.__editorQuestions.map((q, i) => `
    <div class="card mb-2">
      <div class="flex-between mb-2">
        <b>Question ${i + 1}</b>
        <button class="btn btn-danger" onclick="removeQuestion(${i})"><i class="fa-solid fa-trash"></i></button>
      </div>
      <input class="form-control mb-2" placeholder="Question text" value="${escapeAttr(q.question)}" oninput="window.__editorQuestions[${i}].question=this.value">
      ${q.options.map((o, oi) => `
        <div class="flex mb-2" style="align-items:center;">
          <input type="radio" name="correct_${i}" ${q.correctAnswer === oi ? 'checked' : ''} onchange="window.__editorQuestions[${i}].correctAnswer=${oi}">
          <input class="form-control" placeholder="Option ${String.fromCharCode(65 + oi)}" value="${escapeAttr(o)}" oninput="window.__editorQuestions[${i}].options[${oi}]=this.value">
        </div>
      `).join('')}
    </div>
  `).join('');
}

function escapeAttr(s) { return String(s || '').replace(/"/g, '&quot;'); }
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}

async function saveQuiz() {
  const title = document.getElementById('qTitle').value.trim();
  const category = document.getElementById('qCategory').value.trim();
  const duration = parseInt(document.getElementById('qDuration').value, 10);
  const questions = window.__editorQuestions;
  if (!title) return toast('Title required', 'error');
  if (!duration || duration < 1) return toast('Duration must be at least 1 minute', 'error');
  if (!questions.length) return toast('Add at least one question', 'error');
  for (const q of questions) {
    if (!q.question.trim()) return toast('All questions need text', 'error');
    if (q.options.some(o => !o.trim())) return toast('All options need text', 'error');
  }
  const payload = { title, category, duration, questions };
  const savedQuiz = editingId
    ? { ...QuizzesDB.find(editingId), ...payload }
    : { id: Storage.uid(), createdAt: Date.now(), ...payload };
  if (editingId) QuizzesDB.update(editingId, payload);
  else QuizzesDB.add(savedQuiz);
  toast('Quiz saved', 'success');
  closeQuizEditor();
  refreshAll();
  renderQuizzes();
}

function editQuiz(id) { openQuizEditor(id); }
async function deleteQuiz(id) {
  if (!confirm('Delete this quiz? Existing results will remain.')) return;
  QuizzesDB.remove(id);
  toast('Quiz deleted', 'info');
  refreshAll();
  renderQuizzes();
}
