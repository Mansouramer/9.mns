/* ================= التصحيح الآلي والاختبارات ================= */
const subjectNames = {science:"مادة العلوم",math:"مادة الرياضيات",arabic:"مادة لغتي الجميلة",english:"مادة اللغة الإنجليزية",islamic:"الدراسات الإسلامية"};

const nafisQuestions = [
  {domain:"علوم الحياة",q:"ما العملية التي تتخلص بها الخلايا من الفضلات الناتجة عن العمليات الحيوية؟",options:["الإخراج الخلوي","التخمر","الانقسام المتساوي","البناء الضوئي"],correctLetter:"أ"},
  {domain:"الاستقصاء العلمي",q:"ما الأداة المخبرية المناسبة بدقة لقياس حجم سائل معين (كالحليب أو الماء)؟",options:["ميزان الحرارة","مسطرة القياس","المخبار المدرج","الميزان ذو الكفتين"],correctLetter:"ج"},
  {domain:"العلوم الفيزيائية",q:"يُعد الذهب من أفضل العناصر قابليةً للثني والطرق توصيلاً للكهرباء. ما اسم المجموعة التي ينتمي إليها؟",options:["الغازات النبيلة","الفلزات","أشباه الفلزات","اللافلزات"],correctLetter:"ب"},
  {domain:"علوم الحياة",q:"ما المنطقة الحيوية الواسعة التي تتميز بقلة أمطارها وتنوع حياتها النباتية والحيوانية المتحملة للجفاف؟",options:["المنطقة القطبية","الصحراء","الغابة المطيرة","التندرا الباردة"],correctLetter:"ب"},
  {domain:"علوم الأرض والفضاء",q:"أي الأجرام السماوية التالية يقع في مركز المجموعة الشمسية تماماً؟",options:["كوكب الأرض","الشمس","كوكب المريخ","القمر"],correctLetter:"ب"},
  {domain:"العلوم الفيزيائية",q:"ما الحالة التي تكون فيها جزيئات المادة متراصة وقوية جداً وذات شكل ثابت؟",options:["حالة البلازما","الحالة السائلة","الحالة الصلبة","الحالة الغازية"],correctLetter:"ج"},
  {domain:"الاستقصاء العلمي",q:"يريد طالب تحديد زمن تحلل أنواع مختلفة من الفواكه في التربة، فوضع قطعاً متساوية من الجزر والخيار والتفاح في أكياس بها نفس التربة. أي مما يلي يُعد 'المتغير المستقل' في هذه التجربة؟",options:["كتلة قطع الفواكه والخضروات","نوع الفواكه والخضروات (الجزر، الخيار، التفاح)","كمية التربة الرطبة في الأكياس","الزمن الكلي للتحلل"],correctLetter:"ب"},
  {domain:"العلوم الفيزيائية",q:"ما هي القوة غير المنظورة التي تسحب الأجسام نحو مركز كوكب الأرض؟",options:["قوة الجاذبية الأرضية","القوة الكهربائية","قوة المغناطيس","قوة الاحتكاك"],correctLetter:"أ"},
  {domain:"علوم الحياة",q:"يعيش طائران في موطن واحد، ويأكلان نفس الغذاء، إلا أن أحدهما ينشط في النهار والآخر في الليل. ماذا يسمى ذلك؟",options:["اختلاف الحيز البيئي للطائرين","اختلاف المنطقة الحيوية","توجد علاقة تكافل","توجد علاقة تنافس مدمرة"],correctLetter:"أ"},
  {domain:"العلوم الفيزيائية",q:"ماذا تسمى المنطقة المحيطة بالمغناطيس ويظهر فيها قوة تأثيره على المغناطيسات الأخرى؟",options:["المجال المغناطيسي","الكهرومغناطيسية","القوة المغناطيسية","خطوط القوة الوهمية"],correctLetter:"أ"}
];
const LETTERS = ['أ','ب','ج','د'];

let currentStudentIndex = 0, currentQuestionStep = 0, studentsList = [], activeQuestions = [], globalMaxScore = 20,
    currentModelName = "نموذج (د)", studentAnswers = {}, allClassResults = {}, advanceTimer = null;

function toggleNafis(){ $('nafisBox').hidden = $('selectExamType').value !== "اختبارات نافس الوطنية"; }
function onGradeChange(){ switchExamModel(); }
function syncGrading(){ $('selectGrade').value = currentGrade; toggleNafis(); switchExamModel(); }

function handleExamImageUpload(ev){
  const f = ev.target.files[0]; if(!f) return;
  $('selectExamType').value = "اختبارات نافس الوطنية"; toggleNafis();
  $('examKeywordInput').value = "اختبار نافس العلوم – النموذج المرفق (10 أسئلة)";
  activeQuestions = JSON.parse(JSON.stringify(nafisQuestions));
  globalMaxScore = activeQuestions.length * 2;
  $('imageUploadStatus').textContent = 'تم تحميل نموذج نافس الجاهز (10 أسئلة).';
  generateTestModel();
}

function clearAllExamAndAnalysisData(){
  if(!confirm("هل تريد حذف الاختبار الحالي وجميع نتائج الطلاب والتحليل والبدء من جديد؟")) return;
  ['mansour_last_exam_full_state','dashboardLatestExamResults','examResultsHistory','mansour_last_analysis_report'].forEach(k => localStorage.removeItem(k));
  const keys = []; for(let i=0;i<localStorage.length;i++){ const k = localStorage.key(i); if(k && k.startsWith('mansour_exam_state_')) keys.push(k); }
  keys.forEach(k => localStorage.removeItem(k));
  activeQuestions = []; allClassResults = {}; globalMaxScore = 20;
  $('paper').hidden = true; $('printExamRow').hidden = true; $('touchGradingCard').hidden = true; $('analysisPanel').hidden = true;
  $('imageUploadStatus').textContent = ''; $('examKeywordInput').value = '';
  filterStudentResults(); showToast('تم مسح البيانات السابقة');
}

function fetchStudentsForSelectedClass(){
  const grade = $('selectGrade').value, digit = $('selectClassDigit').value;
  let list = [];
  try{
    const parsed = JSON.parse(localStorage.getItem('mansour_students_science_' + grade + '_v5'));
    if(Array.isArray(parsed)) parsed.forEach(it => {
      const c = String(it.classCustom || '');
      if(digit === 'all' || c.includes(digit)) list.push({name:it.name, className:c || grade, phone:it.phone || ''});
    });
  }catch(e){}
  $('studentsNote').textContent = '';
  if(!list.length){
    const short = grade.replace(" الابتدائي","");
    const cls = digit === 'all' ? short : `${short} - فصل ${digit}`;
    list = [1,2,3].map(n => ({name:`طالب تجريبي (${n})`, className:cls, phone:''}));
    $('studentsNote').textContent = 'لا توجد بيانات طلاب لهذا الفصل، فاستُخدمت أسماء تجريبية.';
  }
  const m = new Map(); list.forEach(s => m.set(s.name, s));
  studentsList = Array.from(m.values());
}

function classLabel(){ const g = $('selectGrade').value.replace(" الابتدائي",""), d = $('selectClassDigit').value; return d === 'all' ? g : `${g} - فصل ${d}`; }
function paperMeta(keyword){
  const examType = $('selectExamType').value, grade = $('selectGrade').value, subj = $('selectSubject').value;
  $('printTestInfo').textContent = `الصف: ${grade} | المادة: ${subjectNames[subj]} | نوع الاختبار: ${examType}` + (keyword ? ` | ${keyword}` : '');
  $('printModelBadge').textContent = `رقم النموذج: ${currentModelName} | عدد الأسئلة: ${activeQuestions.length}`;
  $('printClassValue').textContent = classLabel();
}
function renderPaperQuestions(){
  $('generatedQuestionsList').innerHTML = activeQuestions.map((q,i) => `<div class="qrow"><b>س${i+1}: ${esc(q.q)}</b> <span class="dom">[${esc(q.domain)}]</span>
    <div class="opts">${q.options.map((o,k) => `<div class="opt"><i>${LETTERS[k]}</i>${esc(o)}</div>`).join('')}</div></div>`).join('');
  $('paper').hidden = false; $('printExamRow').hidden = false;
}

function stateKey(){ return `mansour_exam_state_${$('selectExamType').value}_${$('selectSubject').value}_${$('selectGrade').value}_${$('selectModelLetter').value}`; }
function switchExamModel(){
  currentModelName = $('selectModelLetter').value;
  let saved = null; try{ saved = JSON.parse(localStorage.getItem(stateKey())); }catch(e){}
  if(saved && saved.activeQuestions && saved.activeQuestions.length){
    activeQuestions = saved.activeQuestions; allClassResults = saved.allClassResults || {}; globalMaxScore = saved.globalMaxScore || 20;
    if(saved.examKeyword) $('examKeywordInput').value = saved.examKeyword;
    paperMeta(saved.examKeyword); renderPaperQuestions();
    filterStudentResults(); prepareGradesPrintSheet(); prepareAnalysisContent();
    return;
  }
  $('paper').hidden = true; $('printExamRow').hidden = true; $('examKeywordInput').value = '';
  activeQuestions = []; allClassResults = {};
  filterStudentResults();
}

function generateTestModel(){
  currentModelName = $('selectModelLetter').value;
  const keyword = $('examKeywordInput').value.trim() || `نموذج الصورة (${currentModelName})`;
  if(!activeQuestions || !activeQuestions.length){
    const n = Math.min(Number($('selectQuestionCount').value) || 10, nafisQuestions.length);
    activeQuestions = JSON.parse(JSON.stringify(nafisQuestions)).slice(0, n);
  }
  globalMaxScore = activeQuestions.length * 2;
  paperMeta(keyword); renderPaperQuestions();
  saveLatestExamState();
  $('paper').scrollIntoView({behavior:'smooth', block:'start'});
  showToast('تم توليد ورقة الاختبار');
}

function printGradesSheet(){ prepareGradesPrintSheet(); printSection('gradesSheet'); }

function startTouchGradingSession(){
  if(!activeQuestions.length) generateTestModel();
  fetchStudentsForSelectedClass();
  if(!studentsList.length){ alert('لا توجد قائمة طلاب'); return; }
  currentStudentIndex = 0; $('touchGradingCard').hidden = false;
  startNewStudentSession(); $('touchGradingCard').scrollIntoView({behavior:'smooth', block:'start'});
}
function startNewStudentSession(){ currentQuestionStep = 0; studentAnswers = {}; renderCurrentStepView(); }

function renderCurrentStepView(){
  const st = studentsList[currentStudentIndex], total = activeQuestions.length;
  $('studentHeader').innerHTML = `<span><b>${esc(st.name)}</b> <span class="tag">${esc(st.className)}</span></span>
    <span class="hint">الطالب <span dir="ltr">${currentStudentIndex+1} / ${studentsList.length}</span></span>`;
  $('progBar').style.width = ((currentQuestionStep+1)/total*100) + '%';
  const q = activeQuestions[currentQuestionStep], n = currentQuestionStep + 1, saved = studentAnswers[n] || '';
  $('singleQuestionContainer').innerHTML = `<div class="q-box"><span class="dm">${esc(q.domain)} · سؤال <span dir="ltr">${n} / ${total}</span></span>
    <h4>${esc(q.q)}</h4>
    <div class="ans">${LETTERS.map((L,k) => {
      let cls = '';
      if(saved){ if(L === q.correctLetter) cls = 'ok'; else if(L === saved) cls = 'no'; }
      return `<button type="button" class="${cls}" data-l="${L}" onclick="selectFastOpt(${n},'${L}')"><strong>${L}</strong><span>${esc(q.options[k])}</span></button>`;
    }).join('')}</div></div>`;
}
function selectFastOpt(n, L){
  if(advanceTimer) return;
  studentAnswers[n] = L;
  const q = activeQuestions[n-1];
  document.querySelectorAll('#singleQuestionContainer .ans button').forEach(b => {
    const l = b.dataset.l; b.classList.remove('ok','no');
    if(l === q.correctLetter) b.classList.add('ok'); else if(l === L) b.classList.add('no');
  });
  if(currentQuestionStep < activeQuestions.length - 1){
    advanceTimer = setTimeout(() => { advanceTimer = null; currentQuestionStep++; renderCurrentStepView(); }, 350);
  }
}
function prevQuestionStep(){ if(advanceTimer) return; if(currentQuestionStep > 0){ currentQuestionStep--; renderCurrentStepView(); } }
function nextQuestionStepOrFinish(){
  if(advanceTimer) return;
  if(currentQuestionStep < activeQuestions.length - 1){ currentQuestionStep++; renderCurrentStepView(); }
  else saveCurrentStudentAndProceed();
}
function skipStudent(){
  if(advanceTimer) return;
  currentStudentIndex++;
  if(currentStudentIndex < studentsList.length) startNewStudentSession(); else finishGradingSession();
}
function saveCurrentStudentAndProceed(){
  const st = studentsList[currentStudentIndex];
  let correct = 0; const domainStats = {}, missed = [];
  activeQuestions.forEach((q,i) => {
    const n = i + 1, dom = q.domain || "عام";
    if(!domainStats[dom]) domainStats[dom] = {total:0, correct:0};
    domainStats[dom].total++;
    if(studentAnswers[n] && studentAnswers[n] === q.correctLetter){ correct++; domainStats[dom].correct++; }
    else missed.push({qNum:n, qText:q.q, domain:dom});
  });
  allClassResults[st.name] = {score:correct*2, maxScore:activeQuestions.length*2, correct, className:st.className, phone:st.phone || '', domainStats, missed};
  updateLocalStorageAndResults();
  currentStudentIndex++;
  if(currentStudentIndex < studentsList.length){ showToast('تم حفظ درجة ' + st.name); startNewStudentSession(); }
  else finishGradingSession();
}
function finishGradingSession(){
  $('touchGradingCard').hidden = true; showToast('اكتملت جلسة التصحيح');
  $('results').scrollIntoView({behavior:'smooth', block:'start'});
}

function saveLatestExamState(){
  const st = {gradeKey:$('selectGrade').value, subjectKey:$('selectSubject').value, subjectName:subjectNames[$('selectSubject').value],
    examType:$('selectExamType').value, classDigit:$('selectClassDigit').value, currentModelName, examKeyword:$('examKeywordInput').value.trim(),
    activeQuestions, globalMaxScore, allClassResults, date:new Date().toLocaleDateString('en-GB')};
  localStorage.setItem(stateKey(), JSON.stringify(st));
  localStorage.setItem('mansour_last_exam_full_state', JSON.stringify(st));
}
function updateLocalStorageAndResults(){
  const examType = $('selectExamType').value, records = [];
  for(const n in allClassResults){ const d = allClassResults[n];
    records.push({name:n, className:d.className, score:d.score, maxScore:d.maxScore || globalMaxScore, examType:`${examType} - ${currentModelName}`, date:new Date().toLocaleDateString('en-GB')}); }
  localStorage.setItem('dashboardLatestExamResults', JSON.stringify(records));
  localStorage.setItem('examResultsHistory', JSON.stringify(records));
  saveLatestExamState(); filterStudentResults(); prepareGradesPrintSheet(); prepareAnalysisContent();
}

function filterStudentResults(){
  const q = $('searchStudentInput').value.toLowerCase().trim(), out = $('correctionOutput');
  const names = Object.keys(allClassResults);
  $('summaryBox').hidden = !names.length;
  if(names.length){
    let sum = 0, mast = 0;
    names.forEach(n => { const d = allClassResults[n], m = d.maxScore || globalMaxScore; sum += d.score; if(m && d.score/m >= .75) mast++; });
    $('sumCount').textContent = names.length; $('sumAvg').textContent = (sum/names.length).toFixed(1); $('sumMastered').textContent = mast;
  }
  const shown = names.filter(n => !q || n.toLowerCase().includes(q));
  if(!shown.length){ out.innerHTML = '<div class="empty">لا توجد نتائج بعد. صحّح طالباً واحداً على الأقل من جلسة التصحيح السريع.</div>'; return; }
  out.innerHTML = shown.map(n => {
    const d = allClassResults[n], m = d.maxScore || globalMaxScore;
    const msg = `مدرسة داوود بن عروة الثقفي الابتدائية\nولي الأمر الفاضل، نود إفادتكم بحصول الابن: ${n} (${d.className})\nعلى درجة الاختبار (${currentModelName}): ${d.score} / ${m}.\nمع تحيات المعلم: منصور عامر الرحيلي`;
    return `<div class="res"><span><b>${esc(n)}</b> <span class="tag">${esc(d.className)}</span></span>
      <span class="sc" dir="ltr">${d.score} / ${m}</span>
      <a class="btn wa sm noprint" target="_blank" href="${waLink(d.phone, msg)}">إرسال لولي الأمر</a></div>`;
  }).join('');
}
function prepareGradesPrintSheet(){
  $('sheetPrintMeta').textContent = `الصف: ${$('selectGrade').value} | المادة: ${subjectNames[$('selectSubject').value]} | نوع الاختبار: ${$('selectExamType').value} (${currentModelName}) | عدد الطلاب: ${Object.keys(allClassResults).length}`;
  let i = 1;
  $('sheetPrintTableBody').innerHTML = Object.keys(allClassResults).map(n => {
    const d = allClassResults[n], m = d.maxScore || globalMaxScore, p = m > 0 ? d.score/m*100 : 0;
    return `<tr><td>${i++}</td><td style="text-align:right;font-weight:700">${esc(n)}</td><td>${esc(d.className)}</td><td><b>${d.score}</b></td><td>${m}</td>
      <td style="font-weight:700">${p >= 75 ? 'متقن' : 'يحتاج دعم وتدخل علاجي'}</td></tr>`;
  }).join('');
}

function toggleAnalysisBox(){
  const b = $('analysisPanel'); b.hidden = !b.hidden;
  if(!b.hidden){ prepareAnalysisContent(); b.scrollIntoView({behavior:'smooth', block:'start'}); }
}
const REMEDIAL = {
  "علوم الحياة":["مهارات ومفاهيم علوم الحياة (الكائنات الحية، الخلايا، والبيئة)","إعداد بطاقات رسومية توضيحية لأجزاء الكائنات الحية والعمليات الحيوية."],
  "العلوم الفيزيائية":["مهارات ومفاهيم العلوم الفيزيائية (المادة، الطاقة، والتغيرات)","تنفيذ تجارب عملية مبسطة داخل الفصل لتوضيح حالات المادة والتغيرات الفيزيائية والكيميائية."],
  "علوم الأرض والفضاء":["مهارات ومفاهيم علوم الأرض والفضاء (الكون، المجموعة الشمسية، وحركة الأرض)","استخدام مجسمات ونماذج توضيحية لدوران الأرض حول محورها وحول الشمس."],
  "الاستقصاء العلمي":["مهارات ومفاهيم الاستقصاء العلمي والتفكير الناقد","تدريب الطلاب على خطوات البحث العلمي وطرح تساؤلات تجريبية وتنمية مهارات الملاحظة والاستنتاج."]
};
function prepareAnalysisContent(){
  const box = $('analysisContentText');
  if(!Object.keys(allClassResults).length){ box.innerHTML = '<div class="empty">ارصد درجات الطلاب أولاً لعرض التحليل والخطط العلاجية.</div>'; return; }
  const agg = {};
  Object.values(allClassResults).forEach(s => { const ds = s.domainStats || {};
    for(const d in ds){ if(!agg[d]) agg[d] = {correct:0,total:0}; agg[d].correct += ds[d].correct; agg[d].total += ds[d].total; } });
  const weak = []; let rows = '';
  for(const d in agg){
    const pct = agg[d].total ? agg[d].correct/agg[d].total*100 : 0, ok = pct >= 75; if(!ok) weak.push(d);
    rows += `<tr><td><b>${esc(d)}</b></td><td>${agg[d].correct} / ${agg[d].total}</td>
      <td><div class="bar"><b style="width:${pct.toFixed(0)}%;background:${ok ? 'var(--good)' : 'var(--bad)'}"></b></div></td>
      <td style="color:${ok ? 'var(--good)' : 'var(--bad)'};font-weight:600">${pct.toFixed(1)}%</td>
      <td style="color:${ok ? 'var(--good)' : 'var(--bad)'}">${ok ? 'متقن' : 'يحتاج معالجة'}</td></tr>`;
  }
  const plans = weak.length ? weak.map((d,i) => { const r = REMEDIAL[d] || REMEDIAL["الاستقصاء العلمي"];
    return `<div class="plan"><b>${i+1}. الهدف غير المتقن:</b> ${esc(r[0])}<br><span class="a">الخطة العلاجية المقترحة:</span> ${esc(r[1])}</div>`; }).join('')
    : '<div class="plan" style="border-color:rgba(94,234,212,.4);background:rgba(94,234,212,.08);color:var(--good)">ممتاز! أتقن طلاب الفصل جميع المجالات ولا توجد فجوات تستدعي خطة علاجية.</div>';
  box.innerHTML = `<div class="tbl-wrap"><table><thead><tr><th>المجال</th><th>الإجابات الصحيحة</th><th>الإتقان</th><th>النسبة</th><th>التقييم</th></tr></thead><tbody>${rows}</tbody></table></div>
    <h4 style="margin:14px 0 8px;font-size:14px;color:var(--warn)">الخطط العلاجية الميدانية</h4>${plans}`;
}

