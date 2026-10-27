/* Quiz runtime */
let quiz = null;
let currentIdx = 0;
let answers = [];
let timer = null;
let attemptId = null;
const AUTOSAVE_KEY = 'ep_quiz_autosave';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function initQuiz() {
  const session = Session.requireRole('student');
  if (!session) return;

  const params = new URLSearchParams(location.search);
  const quizId = params.get('id');
  attemptId = params.get('attempt') || `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const original = QuizzesDB.find(quizId);
  if (!original) { toast('Quiz not found', 'error'); setTimeout(() => location.href = 'dashboard.html', 800); return; }

  // A new dashboard start creates a fresh random order.
  // Refreshing the same attempt restores that exact order and its answers.
  const saved = Storage.get(AUTOSAVE_KEY, null);
  const canResume = saved &&
    saved.quizId === quizId &&
    saved.userId === session.id &&
    saved.attemptId === attemptId &&
    Date.now() - saved.ts < 2 * 3600 * 1000 &&
    saved.quiz &&
    Array.isArray(saved.quiz.questions);

  if (canResume) {
    quiz = saved.quiz;
    answers = Array.isArray(saved.answers) && saved.answers.length === quiz.questions.length
      ? saved.answers
      : new Array(quiz.questions.length).fill(null);
  } else {
    quiz = {
      ...original,
      questions: shuffle(original.questions).map(q => {
        const indexedOptions = q.options.map((option, originalIndex) => ({ option, originalIndex }));
        const shuffledOptions = shuffle(indexedOptions);
        return {
          question: q.question,
          options: shuffledOptions.map(item => item.option),
          correctAnswer: shuffledOptions.findIndex(item => item.originalIndex === q.correctAnswer)
        };
      })
    };
    answers = new Array(quiz.questions.length).fill(null);
    saveAttempt();
  }

  document.getElementById('quizTitle').textContent = quiz.title;
  timer = new CountdownTimer(quiz.duration * 60, updateTimer, autoSubmit);
  timer.start();
  render();
}

function updateTimer(sec) {
  const el = document.getElementById('timer');
  el.textContent = formatTime(sec);
  el.classList.toggle('warning', sec <= 60 && sec > 20);
  el.classList.toggle('danger', sec <= 20);
}

function render() {
  const q = quiz.questions[currentIdx];
  document.getElementById('qNum').textContent = `Question ${currentIdx + 1} of ${quiz.questions.length}`;
  document.getElementById('qText').textContent = q.question;
  const opts = document.getElementById('options');
  opts.innerHTML = q.options.map((o, i) => `
    <div class="option ${answers[currentIdx] === i ? 'selected' : ''}" onclick="selectOption(${i})">
      <span class="letter">${String.fromCharCode(65 + i)}</span>
      <span>${escapeHtml(o)}</span>
    </div>
  `).join('');

  const pct = ((currentIdx + 1) / quiz.questions.length) * 100;
  document.getElementById('progressFill').style.width = pct + '%';

  document.getElementById('prevBtn').disabled = currentIdx === 0;
  document.getElementById('nextBtn').classList.toggle('hidden', currentIdx === quiz.questions.length - 1);
  document.getElementById('submitBtn').classList.toggle('hidden', currentIdx !== quiz.questions.length - 1);

  const nav = document.getElementById('qNav');
  nav.innerHTML = quiz.questions.map((_, i) =>
    `<button class="${answers[i] != null ? 'answered' : ''} ${i === currentIdx ? 'current' : ''}" onclick="goTo(${i})">${i + 1}</button>`
  ).join('');
}

function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }

function selectOption(i) {
  answers[currentIdx] = i;
  autoSave();
  render();
}
function goTo(i) { currentIdx = i; render(); }
function next() { if (currentIdx < quiz.questions.length - 1) { currentIdx++; render(); } }
function prev() { if (currentIdx > 0) { currentIdx--; render(); } }

function saveAttempt() {
  const s = Session.current();
  const params = new URLSearchParams(location.search);
  Storage.set(AUTOSAVE_KEY, {
    userId: s.id,
    quizId: params.get('id'),
    attemptId,
    quiz,
    answers,
    ts: Date.now()
  });
}

function autoSave() { saveAttempt(); }

function submit() {
  const unanswered = answers.filter(a => a == null).length;
  if (unanswered > 0) {
    if (!confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) return;
  }
  finalize(false);
}

function autoSubmit() {
  toast('Time up! Auto-submitting…', 'info');
  finalize(true);
}

async function finalize(autoSubmitted) {
  timer.stop();
  const session = Session.current();
  let correct = 0;
  const review = quiz.questions.map((q, i) => {
    const isCorrect = answers[i] === q.correctAnswer;
    if (isCorrect) correct++;
    return {
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      selected: answers[i]
    };
  });
  const total = quiz.questions.length;
  const percentage = Math.round((correct / total) * 100);
  const result = {
    id: Storage.uid(),
    studentId: session.id,
    studentName: session.name,
    quizId: quiz.id,
    quizTitle: quiz.title,
    total,
    correct,
    wrong: total - correct,
    score: correct,
    percentage,
    passed: percentage >= 50,
    autoSubmitted,
    answers: review,
    submittedAt: Date.now()
  };
  ResultsDB.add(result);
  Storage.remove(AUTOSAVE_KEY);
  location.href = `result.html?id=${result.id}`;
}
