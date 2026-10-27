/* Result rendering + PDF/Certificate */
function initResult() {
  const session = Session.requireRole('student');
  if (!session) return;
  const id = new URLSearchParams(location.search).get('id');
  const result = ResultsDB.all().find(r => r.id === id);
  if (!result) { toast('Result not found', 'error'); return; }
  if (result.studentId !== session.id) {
    toast('You cannot view another student’s result', 'error');
    setTimeout(() => location.href = 'dashboard.html', 900);
    return;
  }

  document.getElementById('quizTitle').textContent = result.quizTitle;
  document.getElementById('scoreValue').textContent = `${result.score} / ${result.total}`;
  document.getElementById('percentValue').textContent = result.percentage + '%';
  document.getElementById('correctValue').textContent = result.correct;
  document.getElementById('wrongValue').textContent = result.wrong;
  const status = document.getElementById('statusBadge');
  status.textContent = result.passed ? 'PASSED' : 'FAILED';
  status.className = 'badge ' + (result.passed ? 'pass' : 'fail');

  const review = document.getElementById('review');
  review.innerHTML = result.answers.map((a, i) => `
    <div class="card mb-2">
      <div class="question-num">Q${i + 1}</div>
      <div style="font-weight:600;margin-bottom:12px;">${escapeHtml(a.question)}</div>
      ${a.options.map((opt, oi) => {
        const isCorrect = oi === a.correctAnswer;
        const isSelected = oi === a.selected;
        let bg = 'rgba(255,255,255,0.05)';
        if (isCorrect) bg = 'rgba(6,214,160,0.25)';
        else if (isSelected) bg = 'rgba(239,71,111,0.25)';
        return `<div style="padding:10px 14px;border-radius:10px;margin-bottom:6px;background:${bg};border:1px solid var(--border);">
          ${String.fromCharCode(65 + oi)}. ${escapeHtml(opt)}
          ${isCorrect ? ' <i class="fa-solid fa-check" style="color:#06d6a0;"></i>' : ''}
          ${isSelected && !isCorrect ? ' <i class="fa-solid fa-xmark" style="color:#ef476f;"></i>' : ''}
        </div>`;
      }).join('')}
    </div>
  `).join('');

  window.__result = result;
}

function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }

async function downloadPDF() {
  const r = window.__result;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text('Exam Result', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Student: ${r.studentName}`, 20, 40);
  doc.text(`Quiz: ${r.quizTitle}`, 20, 50);
  doc.text(`Date: ${new Date(r.submittedAt).toLocaleString()}`, 20, 60);
  doc.text(`Score: ${r.score} / ${r.total}`, 20, 75);
  doc.text(`Percentage: ${r.percentage}%`, 20, 85);
  doc.text(`Correct: ${r.correct}   Wrong: ${r.wrong}`, 20, 95);
  doc.text(`Status: ${r.passed ? 'PASSED' : 'FAILED'}`, 20, 105);
  doc.setFontSize(11);
  let y = 125;
  doc.text('Answer Review', 20, 120);
  r.answers.forEach((a, i) => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFont(undefined, 'bold');
    const lines = doc.splitTextToSize(`Q${i + 1}. ${a.question}`, 170);
    doc.text(lines, 20, y); y += lines.length * 6;
    doc.setFont(undefined, 'normal');
    const yours = a.selected != null ? a.options[a.selected] : 'Not answered';
    doc.text(`Your answer: ${yours}`, 22, y); y += 6;
    doc.text(`Correct answer: ${a.options[a.correctAnswer]}`, 22, y); y += 10;
  });
  doc.save(`result_${r.quizTitle.replace(/\s+/g,'_')}.pdf`);
}

async function downloadCertificate() {
  const r = window.__result;
  if (!r.passed) { toast('Certificate available only for passing scores', 'error'); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  // border
  doc.setDrawColor(180, 140, 30); doc.setLineWidth(3);
  doc.rect(10, 10, W - 20, H - 20);
  doc.setLineWidth(0.5);
  doc.rect(16, 16, W - 32, H - 32);

  doc.setFont('helvetica', 'bold'); doc.setFontSize(32);
  doc.text('Certificate of Achievement', W/2, 45, { align: 'center' });

  doc.setFontSize(14); doc.setFont('helvetica', 'normal');
  doc.text('This certificate is proudly presented to', W/2, 70, { align: 'center' });

  doc.setFont('helvetica', 'bold'); doc.setFontSize(28);
  doc.text(r.studentName, W/2, 90, { align: 'center' });

  doc.setFont('helvetica', 'normal'); doc.setFontSize(13);
  const line = `for successfully completing "${r.quizTitle}" with a score of ${r.percentage}%.`;
  doc.text(line, W/2, 110, { align: 'center' });

  doc.setFontSize(11);
  doc.text(`Awarded on ${new Date(r.submittedAt).toLocaleDateString()}`, W/2, 130, { align: 'center' });

  doc.setFont('helvetica', 'italic'); doc.setFontSize(12);
  doc.text('Exam Portal', W/2, H - 30, { align: 'center' });

  doc.save(`certificate_${r.studentName.replace(/\s+/g,'_')}.pdf`);
}

function printResult() { window.print(); }
