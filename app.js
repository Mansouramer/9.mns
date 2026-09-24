/* ================= إدارة التطبيق العام والطلاب والدروس ================= */
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const TEACHER_NAME = "منصور عامر الرحيلي";
const SCHOOL_NAME = "مدرسة داوود بن عروة الثقفي";

/* خلفية النجوم */
(function stars(){
  const cv = $('stars'), ctx = cv.getContext('2d');
  function draw(){
    const w = cv.width = innerWidth, h = cv.height = innerHeight;
    ctx.clearRect(0,0,w,h);
    const n = Math.round(w*h/9000);
    for(let i=0;i<n;i++){
      const r = Math.random()<.08 ? 1.5 : Math.random()*.9+.3;
      ctx.globalAlpha = Math.random()*.7+.2;
      ctx.fillStyle = Math.random()<.15 ? '#bcd6ff' : '#ffffff';
      ctx.beginPath(); ctx.arc(Math.random()*w, Math.random()*h, r, 0, 6.283); ctx.fill();
    }
  }
  draw();
  let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(draw, 250); });
})();

/* نظام الرقم السري والقفل */
const PW_KEY='mansour_pw_hash_v1', PW_SALT='mansour_pw_salt_v1', REMEMBER_KEY='mansour_remember_v1', SESSION_KEY='mansour_session_v1';
let lockMode = 'login', failCount = 0, lockedUntil = 0, appBooted = false;

function cyrb53(str, seed=0){
  let h1=0xdeadbeef^seed, h2=0x41c6ce57^seed;
  for(let i=0,ch;i<str.length;i++){ch=str.charCodeAt(i);h1=Math.imul(h1^ch,2654435761);h2=Math.imul(h2^ch,1597334677);}
  h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);
  h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);
  return (4294967296*(2097151&h2)+(h1>>>0)).toString(16);
}
async function hashPw(pw, salt){
  const data = salt + '::' + pw;
  try{
    if(window.crypto && crypto.subtle){
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
      return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
    }
  }catch(e){}
  return 'w' + cyrb53(data) + cyrb53(data, 7);
}
function newSalt(){ return Math.random().toString(36).slice(2) + Date.now().toString(36); }

function initLock(){
  const hash = localStorage.getItem(PW_KEY);
  if(!hash){ setLockMode('setup'); return; }
  if(localStorage.getItem(REMEMBER_KEY) === hash || sessionStorage.getItem(SESSION_KEY) === hash){ unlock(); return; }
  setLockMode('login');
}
function setLockMode(mode){
  lockMode = mode;
  $('lock').hidden = false; document.body.classList.add('locked'); $('app').hidden = true;
  $('pw2').hidden = mode !== 'setup';
  $('pw1').value = ''; $('pw2').value = '';
  $('lockMsg').textContent = ''; $('lockMsg').className = 'lock-msg';
  $('pw1').placeholder = mode === 'setup' ? 'أنشئ رقماً سرياً (4 خانات على الأقل)' : 'الرقم السري';
  $('lockBtn').textContent = mode === 'setup' ? 'إنشاء الرقم السري والدخول' : 'دخول';
  $('lockSub').textContent = mode === 'setup' ? 'أول مرة؟ اختر الرقم السري الذي يحمي لوحتك' : 'مدرسة داوود بن عروة الثقفي';
  setTimeout(() => $('pw1').focus(), 50);
}
function lockMsg(t, ok){ $('lockMsg').textContent = t; $('lockMsg').className = 'lock-msg' + (ok ? ' ok' : ''); }
function shakeLock(){ $('lock').classList.remove('shake'); void $('lock').offsetWidth; $('lock').classList.add('shake'); }

async function submitLock(){
  const p1 = $('pw1').value;
  if(lockMode === 'setup'){
    if(p1.length < 4){ lockMsg('الرقم السري يجب أن لا يقل عن 4 خانات'); shakeLock(); return; }
    if(p1 !== $('pw2').value){ lockMsg('الرقمان غير متطابقين، أعد الكتابة'); shakeLock(); return; }
    const salt = newSalt(), h = await hashPw(p1, salt);
    localStorage.setItem(PW_SALT, salt); localStorage.setItem(PW_KEY, h);
    finishUnlock(h);
    return;
  }
  const now = Date.now();
  if(now < lockedUntil){ lockMsg(`محاولات كثيرة. انتظر ${Math.ceil((lockedUntil-now)/1000)} ثانية`); return; }
  const h = await hashPw(p1, localStorage.getItem(PW_SALT) || '');
  if(h === localStorage.getItem(PW_KEY)){ failCount = 0; finishUnlock(h); }
  else{
    failCount++;
    if(failCount >= 5){ lockedUntil = Date.now() + 30000; failCount = 0; lockMsg('محاولات كثيرة. انتظر 30 ثانية'); }
    else lockMsg('الرقم السري غير صحيح');
    $('pw1').value = ''; shakeLock();
  }
}
$('lockForm').addEventListener('submit', e => { e.preventDefault(); submitLock(); });
$('lockBtn').addEventListener('click', e => { e.preventDefault(); submitLock(); });
['pw1','pw2'].forEach(id => $(id).addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); submitLock(); } }));
function finishUnlock(h){
  sessionStorage.setItem(SESSION_KEY, h);
  if($('rememberDevice').checked) localStorage.setItem(REMEMBER_KEY, h);
  unlock();
}
function unlock(){
  $('lock').hidden = true; document.body.classList.remove('locked'); $('app').hidden = false;
  if(!appBooted){ appBooted = true; bootApp(); }
}
function lockNow(){
  sessionStorage.removeItem(SESSION_KEY); localStorage.removeItem(REMEMBER_KEY);
  $('rememberDevice').checked = false;
  setLockMode('login'); scrollTo(0,0);
}
async function changePassword(){
  const cur = $('curPw').value, nw = $('newPw').value;
  const h = await hashPw(cur, localStorage.getItem(PW_SALT) || '');
  if(h !== localStorage.getItem(PW_KEY)){ alert('الرقم السري الحالي غير صحيح'); return; }
  if(nw.length < 4){ alert('الرقم السري الجديد يجب أن لا يقل عن 4 خانات'); return; }
  const salt = newSalt(), nh = await hashPw(nw, salt);
  localStorage.setItem(PW_SALT, salt); localStorage.setItem(PW_KEY, nh);
  sessionStorage.setItem(SESSION_KEY, nh);
  if(localStorage.getItem(REMEMBER_KEY)) localStorage.setItem(REMEMBER_KEY, nh);
  $('curPw').value = ''; $('newPw').value = '';
  showToast('تم تغيير الرقم السري');
}

/* الصفوف والكواكب */
const GRADES = [
  {key:"الأول الابتدائي",  short:"الأول",  planet:"عطارد",  color:"#b9b4ad", r:38,  size:5,   dur:70,  start:200},
  {key:"الثاني الابتدائي", short:"الثاني", planet:"الزهرة", color:"#ffcf70", r:62,  size:7,   dur:100, start:40},
  {key:"الثالث الابتدائي", short:"الثالث", planet:"الأرض",  color:"#47b8ff", r:86,  size:7.5, dur:140, start:300},
  {key:"الرابع الابتدائي", short:"الرابع", planet:"المريخ", color:"#ff6b4a", r:110, size:6,   dur:180, start:120},
  {key:"الخامس الابتدائي", short:"الخامس", planet:"المشتري",color:"#e2a06b", r:134, size:11,  dur:230, start:250},
  {key:"السادس الابتدائي", short:"السادس", planet:"زحل",    color:"#b9a0ff", r:158, size:9,   dur:290, start:70}
];
const NONE = '__NONE__';
let currentGrade = localStorage.getItem('mansour_current_grade_science_v5') || GRADES[0].key;
if(!GRADES.some(g => g.key === currentGrade)) currentGrade = GRADES[0].key;
const gradeInfo = () => GRADES.find(g => g.key === currentGrade);

function hexRgb(h){ const n = parseInt(h.slice(1),16); return [(n>>16)&255,(n>>8)&255,n&255].join(','); }
function applyGradeTheme(){
  const g = gradeInfo(), root = document.documentElement.style;
  root.setProperty('--accent', g.color); root.setProperty('--accent-rgb', hexRgb(g.color));
  $('gradeTitle').textContent = 'الصف ' + g.short;
  $('planetName').textContent = 'مدار ' + g.planet;
  $('curriculumTitle').textContent = 'مقرر العلوم – ' + currentGrade;
  document.querySelector('meta[name=theme-color]').setAttribute('content', '#05060f');
  document.querySelectorAll('#gradeChips .chip').forEach((c,i) => c.classList.toggle('active', GRADES[i].key === currentGrade));
  document.querySelectorAll('#orbit .orbit-line').forEach((c,i) => {
    c.setAttribute('stroke', GRADES[i].key === currentGrade ? g.color : 'rgba(255,255,255,.12)');
    c.setAttribute('stroke-opacity', GRADES[i].key === currentGrade ? '.7' : '1');
  });
  document.querySelectorAll('#orbit .active-ring').forEach((c,i) => c.setAttribute('opacity', GRADES[i].key === currentGrade ? '1' : '0'));
}

function buildOrbit(){
  let svg = `<defs>
    <radialGradient id="sunG" cx="40%" cy="38%"><stop offset="0" stop-color="#fff5cc"/><stop offset=".45" stop-color="#ffb547"/><stop offset="1" stop-color="#e2711d"/></radialGradient>
    <radialGradient id="shade" cx="35%" cy="32%" r="80%"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
    <filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="9"/></filter>
  </defs>
  <circle cx="180" cy="180" r="34" fill="#ffb547" opacity=".35" filter="url(#glow)"/>
  <circle cx="180" cy="180" r="17" fill="url(#sunG)"/>`;
  GRADES.forEach(g => { svg += `<circle class="orbit-line" cx="180" cy="180" r="${g.r}" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="1"/>`; });
  GRADES.forEach((g,i) => {
    const cx = 180 + g.r, s = g.size;
    const anim = reduceMotion ? '' : `<animateTransform attributeName="transform" type="rotate" from="${g.start} 180 180" to="${g.start+360} 180 180" dur="${g.dur}s" repeatCount="indefinite"/>`;
    const init = reduceMotion ? ` transform="rotate(${g.start} 180 180)"` : '';
    const ring = g.planet === 'زحل' ? `<ellipse cx="${cx}" cy="180" rx="${s*1.9}" ry="${s*.55}" fill="none" stroke="${g.color}" stroke-width="1.6" opacity=".85" transform="rotate(-22 ${cx} 180)"/>` : '';
    const pulse = reduceMotion ? '' : `<animate attributeName="r" values="${s+4};${s+7};${s+4}" dur="2.4s" repeatCount="indefinite"/>`;
    svg += `<g${init}>
      <g class="planet-g" data-i="${i}" tabindex="0" role="button" aria-label="الصف ${g.short} – ${g.planet}">
        <circle class="hit" cx="${cx}" cy="180" r="15"/>
        <circle class="active-ring" cx="${cx}" cy="180" r="${s+5}" fill="none" stroke="${g.color}" stroke-width="1.5" opacity="0">${pulse}</circle>
        <circle cx="${cx}" cy="180" r="${s}" fill="${g.color}"/>
        <circle cx="${cx}" cy="180" r="${s}" fill="url(#shade)"/>
        ${ring}
      </g>${anim}</g>`;
  });
  $('orbit').innerHTML = svg;
  $('orbit').querySelectorAll('.planet-g').forEach(el => {
    const go = () => changeGradeLevel(GRADES[+el.dataset.i].key);
    el.addEventListener('click', go);
    el.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); } });
  });
  $('gradeChips').innerHTML = GRADES.map((g,i) => `<button class="chip" onclick="changeGradeLevel('${g.key}')"><i style="background:${g.color}"></i>${g.short}</button>`).join('');
}

/* جدول الحصص */
const DAYS = ["الأحد","الإثنين","الثلاثاء","الأربعاء","الخميس"];
const predefinedClasses = ["لا توجد حصة","انتظار","نشاط / مراجعة"];
["الأول","الثاني","الثالث","الرابع","الخامس","السادس"].forEach(g => { for(let i=1;i<=6;i++) predefinedClasses.push(`${g} /${i}`); });
const fixedDayTemplate = [
  {period:"الحصة الأولى",  startTime:"07:00", duration:45, className:"الأول /1"},
  {period:"الحصة الثانية", startTime:"07:50", duration:45, className:"الثاني /1"},
  {period:"الحصة الثالثة", startTime:"08:40", duration:45, className:"الثالث /1"},
  {period:"الحصة الرابعة", startTime:"09:35", duration:45, className:"الرابع /1"},
  {period:"الحصة الخامسة", startTime:"10:25", duration:45, className:"الخامس /1"},
  {period:"الحصة السادسة", startTime:"11:15", duration:45, className:"السادس /1"},
  {period:"الحصة السابعة", startTime:"12:05", duration:40, className:"نشاط / مراجعة"}
];
const SCHED_KEY = 'mansour_school_schedule_v12';
let schoolSchedule;
function load(key, fallback){ try{ const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; }catch(e){ return fallback; } }
function loadSchedule(){
  const def = {}; DAYS.forEach(d => def[d] = JSON.parse(JSON.stringify(fixedDayTemplate)));
  schoolSchedule = load(SCHED_KEY, def);
}
function timeOptions(sel){
  let o=''; for(let h=6;h<=14;h++) for(let m=0;m<60;m+=5){ const t = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`; o += `<option value="${t}"${t===sel?' selected':''}>${t}</option>`; } return o;
}
function durOptions(sel){ return [45,40,35,30].map(d => `<option value="${d}"${+d===+sel?' selected':''}>${d} د</option>`).join(''); }
function classOptions(sel){
  let o='', found=false;
  predefinedClasses.forEach(c => { if(c===sel) found=true; o += `<option value="${esc(c)}"${c===sel?' selected':''}>${esc(c)}</option>`; });
  if(!found && sel) o += `<option value="${esc(sel)}" selected>${esc(sel)}</option>`;
  return o;
}
function todayName(){ const d = new Date().getDay(); return d>=0 && d<=4 ? DAYS[d] : null; }
function toggleSched(){
  const s = $('sched'); s.classList.toggle('open');
  $('schedChev').textContent = s.classList.contains('open') ? 'إخفاء ▴' : 'الجدول ▾';
  if(s.classList.contains('open')){ $('scheduleDaySelect').value = todayName() || DAYS[0]; renderScheduleTable(); }
}
function renderScheduleTable(){
  const day = $('scheduleDaySelect').value;
  const sel = 'style="width:100%;min-height:36px;padding:4px;font-size:12px;text-align:center"';
  $('scheduleTbody').innerHTML = (schoolSchedule[day] || []).map((p,i) => `<tr>
    <td><strong style="font-size:12px">${esc(p.period)}</strong></td>
    <td><select ${sel} onchange="updateScheduleItem('${day}',${i},'startTime',this.value)">${timeOptions(p.startTime)}</select></td>
    <td><select ${sel} onchange="updateScheduleItem('${day}',${i},'duration',this.value)">${durOptions(p.duration)}</select></td>
    <td><select ${sel} onchange="updateScheduleItem('${day}',${i},'className',this.value)">${classOptions(p.className)}</select></td></tr>`).join('');
}
function updateScheduleItem(day, idx, field, val){
  if(field === 'startTime' || field === 'duration'){
    DAYS.forEach(d => { if(schoolSchedule[d] && schoolSchedule[d][idx]) schoolSchedule[d][idx][field] = field==='duration' ? Number(val) : val; });
  } else if(schoolSchedule[day] && schoolSchedule[day][idx]) schoolSchedule[day][idx][field] = val;
  localStorage.setItem(SCHED_KEY, JSON.stringify(schoolSchedule));
  updateClock(); renderScheduleTable();
  showToast('تم تحديث الجدول');
}
let lastBeep = -1;
function playBell(){
  try{
    const ctx = new (window.AudioContext || window.webkitAudioContext)(), o = ctx.createOscillator(), g = ctx.createGain();
    o.type='sine'; o.frequency.setValueAtTime(880, ctx.currentTime);
    g.gain.setValueAtTime(.3, ctx.currentTime); g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime+1.2);
    o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime+1.2);
  }catch(e){}
}
function setClock(kicker, title, cls, time, frac){
  $('clockKicker').textContent = kicker; $('clockTitle').textContent = title; $('clockClass').textContent = cls;
  $('clockTime').textContent = time; $('clockArc').setAttribute('stroke-dashoffset', (213.6 * (1 - Math.max(0, Math.min(1, frac)))).toFixed(1));
}
function updateClock(){
  const now = new Date(), dayName = todayName();
  if(!dayName){ setClock('إجازة','عطلة نهاية الأسبوع','نلتقي الأحد بإذن الله','—',0); return; }
  const periods = schoolSchedule[dayName] || [];
  const cur = now.getHours()*60 + now.getMinutes(), secs = now.getSeconds();
  for(const p of periods){
    if(!p.startTime || p.className === 'لا توجد حصة') continue;
    const [h,m] = p.startTime.split(':').map(Number), start = h*60+m, dur = Number(p.duration)||45, end = start+dur;
    if(cur >= start && cur < end){
      const rem = end*60 - (cur*60+secs);
      setClock('الحصة الحالية', p.period, p.className, `${String(Math.floor(rem/60)).padStart(2,'0')}:${String(rem%60).padStart(2,'0')}`, 1 - rem/(dur*60));
      if(Math.floor(rem/60) === dur-1 && rem%60 >= 55 && lastBeep !== start){ playBell(); lastBeep = start; }
      return;
    } else if(cur < start){
      setClock('الحصة القادمة', p.period, p.className, `${start-cur} د`, 0); return;
    }
  }
  setClock('انتهى الدوام','أحسنت اليوم','','—',0);
}

/* بيانات المناهج */
const gradeScienceData = {
  "الأول الابتدائي":[
    {chapter:"الوحدة 1: النباتات من حولنا",title:"أجزاء النباتات",desc:"دراسة الجذور، الساق، الأوراق، والزهور ودور كل منها في حياة النبات."},
    {chapter:"الوحدة 1: النباتات من حولنا",title:"النباتات تنتج نباتات جديدة",desc:"التعرف على البذور وكيفية نموها لتصبح نباتات جديدة."},
    {chapter:"الوحدة 2: الحيوانات من حولنا",title:"أماكن عيش الحيوانات",desc:"استكشاف الموائل الطبيعية المختلفة للحيوانات."},
    {chapter:"الوحدة 2: الحيوانات من حولنا",title:"الحيوانات تنمو وتتغير",desc:"دراسة دورات حياة الحيوانات وكيف تتغير صغار الحيوانات عن آبائها."},
    {chapter:"الوحدة 3: أرضنا ومواردها",title:"ما الأرض؟ وماذا يوجد عليها؟",desc:"التعرف على اليابسة والماء والصخور المكونة لسطح الأرض."},
    {chapter:"الوحدة 3: أرضنا ومواردها",title:"الماء والهواء",desc:"أهمية الماء والهواء لحياة الكائنات الحية."},
    {chapter:"الوحدة 4: الطقس والفصول",title:"حالات الطقس المختلفة",desc:"ملاحظة الطقس اليومي وأثره على ملابسنا."},
    {chapter:"الوحدة 4: الطقس والفصول",title:"الفصول الأربعة",desc:"التعرف على التغيرات المناخية خلال السنة."}],
  "الثاني الابتدائي":[
    {chapter:"الوحدة 1: النباتات والحيوانات",title:"مخلوقات حية ومخلوقات غير حية",desc:"التفرقة بين الكائنات الحية والأشياء غير الحية."},
    {chapter:"الوحدة 1: النباتات والحيوانات",title:"حاجات المخلوقات الحية",desc:"دراسة الماء، الهواء، الغذاء، والمكان كاحتياجات أساسية."},
    {chapter:"الوحدة 2: موائل الكائنات الحية",title:"السلسلة الغذائية",desc:"كيف تحصل الحيوانات على طاقاتها من النباتات والحيوانات الأخرى."},
    {chapter:"الوحدة 2: موائل الكائنات الحية",title:"الصحاري والغابات",desc:"مقارنة الخصائص البيئية للبيئات الحارة والباردة والغابات المطيرة."},
    {chapter:"الوحدة 3: المادة من حولنا",title:"ما المادة؟",desc:"استكشاف خصائص الأجسام والصلابة واللون والكتلة والحجم."},
    {chapter:"الوحدة 3: المادة من حولنا",title:"حالات المادة",desc:"التمييز بين الحالات الصلبة والسائلة والغازية للمادة."},
    {chapter:"الوحدة 4: الطاقة والقوى",title:"الصوت والضوء",desc:"كيف ينتقل الصوت وكيف يتكون الضوء وتجارب الظلال."},
    {chapter:"الوحدة 4: الطاقة والقوى",title:"الحركة والقوى",desc:"استكشاف كيف تؤثر قوى الدفع والسحب في تغيير موضع الأجسام."}],
  "الثالث الابتدائي":[
    {chapter:"الوحدة 1: الوراثة والبيئة",title:"التكاثر ودورة حياة النباتات والحيوانات",desc:"مراحل نمو المخلوقات الحية والتشابه والاختلاف."},
    {chapter:"الوحدة 1: الوراثة والبيئة",title:"التكيف والبقاء في البيئات",desc:"كيف تتكيف الحيوانات والنباتات مع ظروف البرد الشديد أو الجفاف."},
    {chapter:"الوحدة 2: الأرض ومواردها",title:"الصخور والمعادن والتربة",desc:"أنواع التربة ومكوناتها واستخدامات الصخور والمعادن."},
    {chapter:"الوحدة 3: المخلوقات الحية تنمو وتتغير",title:"أجهزة جسم الإنسان",desc:"التعرف على الجهاز الهيكلي، العضلي، والهضمي والدورة الدموية."},
    {chapter:"الوحدة 3: المخلوقات الحية تنمو وتتغير",title:"الصحة الغذائية والرياضية",desc:"أهمية الغذاء المتوازن وممارسة الرياضة للحفاظ على صحة الأجسام."},
    {chapter:"الوحدة 4: الطاقة والكهرباء والمغناطيسية",title:"الدوائر الكهربائية البسيطة",desc:"كيف يضيء المصباح الكهربائي وتوصيل الدوائر بأمان."},
    {chapter:"الوحدة 4: الطاقة والكهرباء والمغناطيسية",title:"المغناطيس وقوته",desc:"استكشاف أقطاب المغناطيس وتنافرها وتجاذبها."}],
  "الرابع الابتدائي":[
    {chapter:"الوحدة 1: ممالك المخلوقات الحية",title:"الخلايا وتصنيف المخلوقات الحية",desc:"دراسة الخلايا وأساسيات تصنيف المخلوقات الحية."},
    {chapter:"الوحدة 2: المملكة الحيوانية",title:"الحيوانات اللافقارية والفقارية وأجهزتها",desc:"التعرف على خصائص الحيوانات اللافقارية والفقارية."},
    {chapter:"الوحدة 3: الأنظمة البيئية",title:"استكشاف والعلاقات والتغيرات في الأنظمة البيئية",desc:"دراسة مقدمة النظم البيئية وشبكات العلاقات الغذائية."},
    {chapter:"الوحدة 4: الأمراض والعدوى",title:"الأمراض المعدية وطرق انتقالها",desc:"مفاهيم الأمراض وكيفية الوقاية منها وانتقال العدوى."},
    {chapter:"الوحدة 5: التغذية والصحة",title:"الغذاء المتوازن والمحافظة على الصحة",desc:"دراسة الاحتياجات الغذائية السليمة والعناية بالصحّة العامة."},
    {chapter:"الوحدة 6: المادة والقوى والطاقة",title:"المادة وخصائصها والقوى والحركة",desc:"القياس، حالات المادة، المخاليط، والقوى والحركة."}],
  "الخامس الابتدائي":[
    {chapter:"الوحدة 1: ممالك المخلوقات الحية",title:"تصنيف المخلوقات الحية والنباتات",desc:"التصنيف العلمي ومكونات وخصائص النباتات."},
    {chapter:"الوحدة 2: الآباء والأبناء",title:"التكاثر ودورات الحياة",desc:"مفاهيم التكاثر الحيوي ومراحل دورات حياة الكائنات."},
    {chapter:"الوحدة 3: الأنظمة البيئية",title:"التفاعلات والدورات والتغيرات البيئية",desc:"العلاقات في الأنظمة البيئية والتكيف والبقاء."},
    {chapter:"الوحدة 4: أرضنا المتغيرة",title:"معالم سطح الأرض وعملياتها ومواردها",desc:"التضاريس، العمليات المؤثرة على سطح الأرض، ومصادر الطاقة."},
    {chapter:"الوحدة 5: المادة",title:"أنواع المادة والتغيرات الفيزيائية والكيميائية",desc:"العناصر، الفلزات واللافلزات، والتغيرات الفيزيائية والكيميائية."},
    {chapter:"الوحدة 6: الطاقة والقوى",title:"الشغل والآلات البسيطة والصوت والضوء",desc:"الطاقة، الآلات البسيطة، خصائص الصوت والضوء وتطبيقاتها."}],
  "السادس الابتدائي":[
    {chapter:"الوحدة 1: الخلايا والوراثة",title:"الخلية النباتية والحيوانية وانقسامها والوراثة",desc:"نظرية الخلية، مقارنة الخلايا، والانقسام الخلوي والوراثة."},
    {chapter:"الوحدة 2: عمليات الحياة",title:"عمليات الحياة في النباتات، المخلوقات الدقيقة، والإنسان",desc:"التنفس والهضم والدوران والإخراج والحركة والإحساس."},
    {chapter:"الوحدة 3: الأنظمة البيئية ومواردها",title:"السلاسل الغذائية ومقارنة الأنظمة والتربة",desc:"هرم الطاقة، السلاسل والشبكات، حماية موارد الأرض والتربة."},
    {chapter:"الوحدة 4: المادة والخصائص الكيميائية",title:"الأحماض والقواعد والتغيرات الكيميائية",desc:"مفاهيم الأحماض والقواعد وتفاعلاتها الكيميائية."},
    {chapter:"الوحدة 5: القوى والطاقة",title:"استعمال القوى والحركة وتسارعها",desc:"قوانين الحركة وقوى التسارع والاستعمالات التطبيقية."},
    {chapter:"الوحدة 6: الكهرباء والمغناطيسية",title:"الدوائر الكهربائية والتيار والمغناطيس",desc:"الدوائر الكهربائية، التيار، والمغناطيس والمولدات."}]
};

const defaultMotivations = [
  {id:"1",title:"1. عالم المستقبل المتميز",text:"🌟 عالم المستقبل المتميز 🌟\nعزيزي ولي الأمر، نفخر اليوم بتميز ابنكم وتألقه في حصة العلوم ومشاركته في التجارب العملية بحماس ونشاط. بوركت جهودكم!"},
  {id:"2",title:"2. تفوق ملحوظ في الملاحظة والاستنتاج",text:"🔬 تفوق ملحوظ في الملاحظة العلمية 🔬\nعزيزي ولي الأمر، أظهر ابنكم اليوم مهارات دقيقة في الملاحظة والتجريب واستنباط النتائج. أحسنت صنعاً!"},
  {id:"3",title:"3. دقة وإتقان في المفاهيم العلمية",text:"🌱 دقة وإتقان في المفاهيم والعلوم 🌱\nعزيزي ولي الأمر، تميز ابنكم اليوم باستيعابه العميق للحقائق العلمية وتوظيفها بذكاء. بارك الله في جهوده!"},
  {id:"4",title:"4. مشاركة نشطة وفعالة في حصة العلوم",text:"✋ مشاركة نشطة وتفاعل علمي متميز ✋\nعزيزي ولي الأمر، تميز ابنكم اليوم بحرصه العالي ومشاركته النشطة وإجاباته العلمية الموفقة داخل الصف."},
  {id:"5",title:"5. حصيلة استكشافية وتجارب ممتازة",text:"🧠 حصيلة استكشافية وتجارب ممتازة 🧠\nعزيزي ولي الأمر، أبدع ابنكم اليوم في تنفيذ التجارب الاستهلالية والاستكشافية بمهارة عالية. مبروك له!"},
  {id:"6",title:"6. تنظيم رائع للدفتر وواجبات مرتبة",text:"📝 تنظيم رائع للواجبات والأنشطة 📝\nعزيزي ولي الأمر، نشكر لكم متابعتكم المنزلية الواعية. لقد كان واجب ابنكم اليوم منظماً، دقيقاً، ومرتباً للغاية."},
  {id:"7",title:"7. حل ممتاز للتدريبات والتقويم",text:"✍️ حل ممتاز للتقويم والتدريبات\nعزيزي ولي الأمر، تميز أداء ابنكم اليوم بحل أسئلة التقويم والتدريبات العلمية بدقة عالية. دمت متميزاً يا بطل!"},
  {id:"8",title:"8. اهتمام رائع بالبيئة ومخلوقات الله",text:"🌍 اهتمام رائع بالبيئة والمحيط\nعزيزي ولي الأمر، أظهر ابنكم اليوم شغفاً واهتماماً لافتاً بدراسة الكائنات الحية وعناصر البيئة من حوله."},
  {id:"9",title:"9. مشروع علمي متميز ومبتكر",text:"🛠️ مشروع علمي متميز ومبتكر ومتقن\nعزيزي ولي الأمر، قدم ابنكم اليوم مشروعاً علمياً رائعاً ومنظماً ينم عن تفكير إبداعي ومهارة عالية."},
  {id:"10",title:"10. اجتهاد وحرص على إتقان العلوم",text:"⭐ اجتهاد وحرص عالٍ على إتقان العلوم\nعزيزي ولي الأمر، إن حرص ابنكم المستمر على الاستكشاف والتعلم في مادة العلوم محل تقديرنا الدائم."}
];

const K = {
  lessons:  () => 'mansour_custom_lessons_science_' + currentGrade + '_v5',
  students: () => 'mansour_students_science_' + currentGrade + '_v5',
  status:   () => 'mansour_lesson_status_science_' + currentGrade + '_v5',
  mastery:  () => 'mansour_lesson_mastery_science_' + currentGrade + '_v5',
  motiv:    'mansour_custom_motivations_science_v5'
};
let lessons = [], students = [], lessonStatus = {}, lessonMastery = {}, customMotivations = [];
let activeQueryClass = NONE, selectedStudentIndex = '', currentPage = 1, classList = [];
const ROWS = 12;

function loadGradeData(){
  lessons = load(K.lessons(), null) || JSON.parse(JSON.stringify(gradeScienceData[currentGrade]));
  students = load(K.students(), []);
  lessonStatus = load(K.status(), {});
  lessonMastery = load(K.mastery(), {});
  customMotivations = load(K.motiv, null) || defaultMotivations;
}
const saveStudents = () => localStorage.setItem(K.students(), JSON.stringify(students));
const saveLessons  = () => localStorage.setItem(K.lessons(), JSON.stringify(lessons));
const saveStatus   = () => localStorage.setItem(K.status(), JSON.stringify(lessonStatus));
const saveMastery  = () => localStorage.setItem(K.mastery(), JSON.stringify(lessonMastery));
const clsOf = s => s.classCustom || currentGrade;

let toastT;
function showToast(msg){
  const t = $('toast'); t.textContent = msg; t.style.display = 'block';
  clearTimeout(toastT); toastT = setTimeout(() => t.style.display = 'none', 2200);
}
function waLink(phone, msg){
  const p = String(phone || '').replace(/\D/g,'').replace(/^0+/,'');
  return `https://wa.me/${p ? '966' + p : ''}?text=${encodeURIComponent(msg)}`;
}

function showView(name){
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + name));
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.view === name));
  scrollTo({top:0});
  try{ sessionStorage.setItem('mansour_tab', name); }catch(e){}
}
function changeGradeLevel(grade){
  if(grade === currentGrade) return;
  currentGrade = grade;
  localStorage.setItem('mansour_current_grade_science_v5', grade);
  loadGradeData();
  activeQueryClass = NONE; selectedStudentIndex = ''; currentPage = 1;
  $('filterStudentNameInput').value = ''; $('bulkPanel').hidden = true; $('studentCard').hidden = true; $('studentSearchInput').value = '';
  applyGradeTheme(); renderLessons(); render(); syncGrading();
  showToast(`الصف ${gradeInfo().short} – مدار ${gradeInfo().planet}`);
}

function renderLessons(){
  const opt = (v,t) => `<option value="${v}">${esc(t)}</option>`;
  const lessonOpts = lessons.map((l,i) => opt(i, `[${l.chapter}] ${l.title}`)).join('');
  $('curriculumSelect').innerHTML = opt('', 'اختر درساً للاطلاع على تفاصيله') + lessonOpts;
  $('selectLesson').innerHTML = opt('', 'اختر الدرس') + lessonOpts;
  $('bulkLesson').innerHTML = opt('', 'اختر درس الواجب') + lessons.map((l,i) => opt('lesson-' + i, `[${l.chapter}] ${l.title}`)).join('');
  $('selectMotivation').innerHTML = opt('', 'اختر الرسالة') + customMotivations.map((m,i) => opt('motiv-' + i, m.title)).join('');
  $('lessonDetail').hidden = true;

  let html = '', lastCh = null, done = 0;
  lessons.forEach((l,i) => {
    const ex = !!lessonStatus[i]; if(ex) done++;
    if(l.chapter !== lastCh){ lastCh = l.chapter; html += `<div class="chapter-h">${esc(l.chapter || 'دروس إضافية')}</div>`; }
    html += `<div class="lesson ${ex ? 'done' : ''}"><strong>${esc(l.title)}</strong><p>${esc(l.desc)}</p>
      <div class="acts"><button class="btn sm ${ex ? 'good' : 'warn'}" onclick="toggleLessonStatus(${i})">${ex ? 'منفَّذ' : 'قيد الانتظار'}</button>
      <button class="btn sm danger" onclick="deleteLesson(${i})">حذف</button></div></div>`;
  });
  $('lessonsTimeline').innerHTML = html || '<div class="empty">لا توجد دروس. أضف درساً من الأسفل.</div>';
  $('totalExecutedLessons').textContent = `${done} / ${lessons.length}`;
  $('barLessons').style.width = (lessons.length ? done/lessons.length*100 : 0) + '%';
  renderMasteryDropdown();
}
function onCurriculumChange(i){
  const b = $('lessonDetail');
  if(i === ''){ b.hidden = true; return; }
  const l = lessons[i]; b.hidden = false;
  b.innerHTML = `<strong>${esc(l.chapter)}</strong>\n${esc(l.title)}\n\n${esc(l.desc)}`;
}
function toggleLessonStatus(i){ lessonStatus[i] = !lessonStatus[i]; saveStatus(); renderLessons(); showToast('تم تحديث حالة الدرس'); }
function addNewLesson(){
  const title = $('newLessonTitle').value.trim(), desc =$('newLessonDesc').value.trim();
  if(!title){ alert('اكتب عنوان الدرس'); return; }
  lessons.push({chapter:'', title, desc: desc || 'لا توجد تفاصيل إضافية'}); saveLessons();
  $('newLessonTitle').value = '';$('newLessonDesc').value = '';
  renderLessons(); showToast('تمت إضافة الدرس');
}
function addBatchLessons(){
  const t = $('bulkLessonsInput').value.trim();
  if(!t){ alert('أدخل بيانات الدروس'); return; }
  let n = 0;
  t.split('\n').forEach(line => {
    if(!line.trim()) return;
    const p = line.split('|');
    if(p.length >= 2) lessons.push({chapter:p[0].trim(), title:p[1].trim(), desc:p[2] ? p[2].trim() : 'لا توجد تفاصيل إضافية'});
    else lessons.push({chapter:'', title:p[0].trim(), desc:'لا توجد تفاصيل إضافية'});
    n++;
  });
  saveLessons(); $('bulkLessonsInput').value = ''; renderLessons(); showToast(`تمت إضافة ${n} دروس`);
}
function deleteLesson(idx){
  if(!confirm('حذف هذا الدرس من المقرر؟')) return;
  lessons.splice(idx,1);
  const remap = obj => { const o = {}; Object.keys(obj).forEach(k => { k = +k; if(k < idx) o[k] = obj[k]; else if(k > idx) o[k-1] = obj[k]; }); return o; };
  lessonStatus = remap(lessonStatus);
  const nm = {}; Object.keys(lessonMastery).forEach(s => nm[s] = remap(lessonMastery[s] || {})); lessonMastery = nm;
  saveLessons(); saveStatus(); saveMastery(); renderLessons(); render(); showToast('تم حذف الدرس');
}

function render(){
  let ach = 0;
  students.forEach((s,si) => lessons.forEach((l,li) => { if(lessonMastery[si] && lessonMastery[si][li]) ach++; }));
  const total = students.length * lessons.length, pct = total ? Math.round(ach/total*100) : 0;
  const sum = f => students.reduce((a,s) => a + (Number(s[f]) || 0), 0);
  $('totalStudents').textContent = students.length;
  $('totalSkills').textContent = pct + '%'; $('barSkills').style.width = pct + '\%';$('totalParticipation').textContent = sum('participation');
  $('totalHomework').textContent = sum('homework');$('totalAbsence').textContent = sum('absence');
  $('totalProjects').textContent = sum('projects');$('totalMessagesSent').textContent = sum('messages');
  renderStudents(); renderClasses(); renderMasteryTable(); renderExamsTable();
  if(selectedStudentIndex !== '' && students[selectedStudentIndex]) fillStudentCard(selectedStudentIndex);
}

function addStudent(){
  const name = $('studentName').value.trim(), sClass = $('studentClassCustom').value.trim() \vert{}\vert{} currentGrade, phone =$('studentPhone').value.trim();
  if(!name){ alert('أدخل اسم الطالب'); return; }
  if(phone && !/^\d{10}$/.test(phone)){ alert('رقم الجوال يجب أن يكون 10 أرقام'); return; }
  students.push({name, classCustom:sClass, phone, absence:0, participation:0, homework:0, projects:0, messages:0, exam1:0, exam2:0});
  saveStudents(); $('studentName').value = '';$('studentPhone').value = '';
  render(); showToast('تمت إضافة الطالب');
}
function renderStudents(){
  const box = $('studentsList'), q =$('filterStudentNameInput').value.trim().toLowerCase();
  let list;
  if(q) list = students.filter(s => s.name.toLowerCase().includes(q));
  else if(activeQueryClass === NONE){
    box.innerHTML = '<div class="empty" style="grid-column:1/-1">اختر فصلاً من الأعلى أو ابحث بالاسم لعرض الطلاب.</div>';
    $('pageInfo').textContent = '0'; return;
  } else list = students.filter(s => clsOf(s) === activeQueryClass);

  const pages = Math.ceil(list.length / ROWS) || 1;
  if(currentPage > pages) currentPage = pages;
  const from = (currentPage-1)*ROWS, part = list.slice(from, from+ROWS);
  if(!part.length){ box.innerHTML = '<div class="empty" style="grid-column:1/-1">لا يوجد طلاب مطابقون.</div>'; $('pageInfo').textContent = '0'; return; }

  const stepper = (cls, label, gi, f, v) => `<div class="metric ${cls}"><div class="m-l">${label}</div><div class="stepper">
    <button aria-label="إنقاص" onclick="stepField(${gi},'${f}',-1)">−</button><b>${v||0}</b><button aria-label="زيادة" onclick="stepField(${gi},'${f}',1)">+</button></div></div>`;
  box.innerHTML = part.map(s => {
    const gi = students.indexOf(s);
    return `<div class="s-card">
      <div class="s-head"><div><strong>${esc(s.name)}</strong> <span class="tag">${esc(clsOf(s))}</span></div>
        <div class="acts noprint"><button class="btn sm ghost" onclick="quickTransfer(${gi})">نقل</button><button class="btn sm danger" onclick="deleteStudent(${gi})">حذف</button></div></div>
      <div class="metrics">
        ${stepper('m-abs','الغياب',gi,'absence',s.absence)}
        ${stepper('m-par','المشاركة',gi,'participation',s.participation)}
        ${stepper('m-hw','الواجبات',gi,'homework',s.homework)}
        ${stepper('m-pr','التجارب',gi,'projects',s.projects)}
      </div>
      <input type="tel" class="phone-in noprint" maxlength="10" inputmode="numeric" value="${esc(s.phone||'')}" placeholder="جوال ولي الأمر 05xxxxxxxx" style="margin-top:8px" oninput="updatePhone(${gi},this.value)">
    </div>`;
  }).join('');
  $('pageInfo').textContent = `${from+1}–${Math.min(from+ROWS, list.length)} من ${list.length}`;
}
function stepField(i, f, d){ students[i][f] = Math.max(0, (Number(students[i][f]) || 0) + d); saveStudents(); render(); }
function updatePhone(i, v){ students[i].phone = v.trim(); saveStudents(); }
function changePage(d){ currentPage = Math.max(1, currentPage + d); renderStudents(); }
function onSearchStudents(){
  currentPage = 1;
  if($('filterStudentNameInput').value.trim()){ activeQueryClass = NONE; renderClasses(); }
  renderStudents();
}
function reindexAfterRemoval(removeSet){
  const map = {}; let n = 0;
  students.forEach((s,i) => { if(!removeSet.has(i)) map[i] = n++; });
  const nm = {}; Object.keys(lessonMastery).forEach(k => { if(map[k] !== undefined) nm[map[k]] = lessonMastery[k]; });
  lessonMastery = nm;
}
function deleteStudent(i){
  if(!confirm('حذف هذا الطالب؟')) return;
  reindexAfterRemoval(new Set([i]));
  students.splice(i,1);
  if(selectedStudentIndex === i){ selectedStudentIndex = ''; $('studentCard').hidden = true; }
  else if(selectedStudentIndex > i) selectedStudentIndex--;
  saveStudents(); saveMastery(); render(); showToast('تم حذف الطالب');
}
function renderClasses(){
  const set = new Set(); students.forEach(s => set.add(clsOf(s)));
  classList = Array.from(set);
  $('classList').innerHTML = classList.map((c,i) => `<div class="class-pill ${activeQueryClass === c ? 'active' : ''}">
    <button class="go" onclick="filterByClass(${i})">${esc(c)} (${students.filter(s => clsOf(s) === c).length})</button>
    <button class="del" aria-label="حذف الفصل" onclick="deleteClass(${i})">حذف</button></div>`).join('') || '<span class="hint">لا توجد فصول بعد. أضف أول طالب.</span>';
  const opts = (first) => first + classList.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
  const keep = (id, html) => { const el = $(id), v = el.value; el.innerHTML = html; if(classList.includes(v) || v === 'ALL') el.value = v; };
  keep('examClassSelect', opts('<option value="">اختر الفصل</option>'));
  keep('masteryClassSelect', opts('<option value="">كل الفصول</option>'));
  keep('bulkTargetClass', opts('<option value="ALL">كل الفصول</option>'));
  keep('transferTarget', opts('<option value="">اختر الفصل المستهدف</option>'));
}
function filterByClass(i){
  const c = classList[i];
  if(activeQueryClass === c) activeQueryClass = NONE; else { activeQueryClass = c; $('filterStudentNameInput').value = ''; }
  currentPage = 1; renderClasses(); renderStudents();
}
function deleteClass(i){
  const c = classList[i];
  if(!confirm(`حذف جميع طلاب الفصل (${c})؟`)) return;
  const rm = new Set(); students.forEach((s,si) => { if(clsOf(s) === c) rm.add(si); });
  reindexAfterRemoval(rm);
  students = students.filter((s,si) => !rm.has(si));
  selectedStudentIndex = ''; $('studentCard').hidden = true;
  if(activeQueryClass === c) activeQueryClass = NONE;
  saveStudents(); saveMastery(); render(); showToast('تم حذف الفصل');
}
function quickTransfer(i){
  const s = students[i];
  const t = prompt(`اكتب اسم الفصل الجديد للطالب (المتاح: ${classList.join('، ')}):`, clsOf(s));
  if(t && t.trim()){ s.classCustom = t.trim(); saveStudents(); render(); showToast(`تم نقل ${s.name} إلى ${s.classCustom}`); }
}

function renderMasteryDropdown(){
  const sel = $('masteryLessonSelect'), v = sel.value;
  sel.innerHTML = '<option value="">اختر الدرس</option>' + lessons.map((l,i) => `<option value="${i}">${esc('[' + l.chapter + '] ' + l.title)}</option>`).join('');
  if(lessons[v]) sel.value = v;
}
function renderMasteryTable(){
  const li = $('masteryLessonSelect').value, cls =$('masteryClassSelect').value, tb = $('masteryTbody'), sum =$('masterySummary');
  if(li === ''){ tb.innerHTML = '<tr><td colspan="4" class="hint" style="padding:16px">اختر الدرس من القائمة.</td></tr>'; sum.hidden = true; return; }
  const list = cls ? students.filter(s => clsOf(s) === cls) : students;
  if(!list.length){ tb.innerHTML = '<tr><td colspan="4" class="hint" style="padding:16px">لا يوجد طلاب.</td></tr>'; sum.hidden = true; return; }
  sum.hidden = false; let m = 0;
  tb.innerHTML = list.map(s => {
    const gi = students.indexOf(s), ok = !!(lessonMastery[gi] && lessonMastery[gi][li]); if(ok) m++;
    return `<tr><td><strong>${esc(s.name)}</strong></td><td><span class="tag">${esc(clsOf(s))}</span></td>
      <td class="${ok ? 'st-ok' : 'st-re'}">${ok ? 'متقن' : 'مراجعة'}</td>
      <td class="noprint"><button class="btn sm ${ok ? 'warn' : 'good'}" onclick="toggleMastery(${gi},${li})">${ok ? 'إلى مراجعة' : 'إلى متقن'}</button></td></tr>`;
  }).join('');
  $('countMastered').textContent = m; $('countReview').textContent = list.length - m;
}
function toggleMastery(si, li){
  if(!lessonMastery[si]) lessonMastery[si] = {};
  lessonMastery[si][li] = !lessonMastery[si][li];
  saveMastery(); render(); showToast('تم تحديث حالة الإتقان');
}

function avgExams(list){
  let a = 0, b = 0; list.forEach(s => { a += Number(s.exam1) || 0; b += Number(s.exam2) || 0; });
  $('avgExam1').textContent = (a/list.length).toFixed(1) + ' / 20';$('avgExam2').textContent = (b/list.length).toFixed(1) + ' / 20';
}
function renderExamsTable(){
  const cls = $('examClassSelect').value, tb = $('examsTbody'), box =$('examsAnalysis');
  if(!cls){ tb.innerHTML = '<tr><td colspan="4" class="hint" style="padding:16px">اختر الفصل من القائمة.</td></tr>'; box.hidden = true; return; }
  const list = students.filter(s => clsOf(s) === cls);
  if(!list.length){ tb.innerHTML = '<tr><td colspan="4" class="hint" style="padding:16px">لا يوجد طلاب في هذا الفصل.</td></tr>'; box.hidden = true; return; }
  box.hidden = false;
  tb.innerHTML = list.map(s => {
    const gi = students.indexOf(s);
    const msg = `عزيزي ولي أمر الطالب ${s.name}، نود إفادتكم بدرجات اختبارات مادة العلوم:\n- اختبار الفترة الأولى: ${s.exam1||0}/20\n- اختبار الفترة الثانية: ${s.exam2||0}/20`;
    return `<tr><td><strong>${esc(s.name)}</strong></td>
      <td><input class="score" type="text" inputmode="numeric" value="${s.exam1||0}" oninput="updateExam(${gi},'exam1',this)"></td>
      <td><input class="score" type="text" inputmode="numeric" value="${s.exam2||0}" oninput="updateExam(${gi},'exam2',this)"></td>
      <td class="noprint"><a class="btn sm wa" href="${waLink(s.phone, msg)}" target="_blank" onclick="bumpMessages(${gi})">إرسال</a></td></tr>`;
  }).join('');
  avgExams(list);
}
function updateExam(i, f, el){
  let v = Number(String(el.value).replace(/[^\d.]/g,'')) || 0; if(v > 20){ v = 20; el.value = 20; }
  students[i][f] = v; saveStudents();
  const cls = $('examClassSelect').value; if(cls) avgExams(students.filter(s => clsOf(s) === cls));
}

function filterStudentDropdown(){
  const k = $('studentSearchInput').value.trim().toLowerCase(), box =$('studentDropdown');
  if(!k){ box.style.display = 'none'; return; }
  const m = students.filter(s => s.name.toLowerCase().includes(k));
  if(!m.length){ box.style.display = 'none'; return; }
  box.style.display = 'block';
  box.innerHTML = m.slice(0,30).map(s => `<div class="dd-item" data-i="${students.indexOf(s)}"><strong>${esc(s.name)}</strong><span class="tag">${esc(clsOf(s))}</span></div>`).join('');
  box.querySelectorAll('.dd-item').forEach(el => el.onclick = () => {
    const i = +el.dataset.i; selectStudent(i); box.style.display = 'none'; $('studentSearchInput').value = students[i].name;
  });
}
document.addEventListener('click', e => { if(!e.target.closest('.dd')) $('studentDropdown').style.display = 'none'; });
function selectStudent(i){ selectedStudentIndex = i; $('studentCard').hidden = false; fillStudentCard(i); updateLessonMsg(); updateMotivationMsg(); }
function masteredCount(i){ let n = 0; lessons.forEach((l,li) => { if(lessonMastery[i] && lessonMastery[i][li]) n++; }); return n; }
function fillStudentCard(i){
  const s = students[i]; if(!s) return;
  $('selName').textContent = s.name; $('selClass').textContent = clsOf(s);
  $('sdParticipation').textContent = s.participation \vert{}\vert{} 0; $('sdHomework').textContent = s.homework || 0;
  $('sdAbsence').textContent = s.absence \vert{}\vert{} 0; $('sdSkills').textContent = masteredCount(i);
  $('sdProjects').textContent = s.projects \vert{}\vert{} 0; $('sdMessages').textContent = s.messages || 0;
  $('sdPhone').textContent = s.phone || 'لا يوجد';
}
function transferSelected(){
  if(selectedStudentIndex === '') return;
  const t = $('transferTarget').value; if(!t){ alert('اختر الفصل المستهدف'); return; }
  students[selectedStudentIndex].classCustom = t; saveStudents(); render();
  showToast(`تم نقل الطالب إلى ${t}`);
}
function updateLessonMsg(){
  if(selectedStudentIndex === '') return;
  const s = students[selectedStudentIndex], li = $('selectLesson').value, pv = $('lessonMsgPreview'), btn =$('waLessonBtn');
  if(li === ''){ pv.textContent = 'اختر الدرس لتظهر الرسالة.'; btn.href = '#'; return; }
  const l = lessons[li];
  const msg = `عزيزي ولي أمر الطالب / ${s.name}\nتناولنا اليوم في مادة العلوم درس:\n📘 (${l.chapter}) - ${l.title}\n💡 المفاهيم والتجارب: ${l.desc}\nمع تقديرنا، المعلم: ${TEACHER_NAME}`;
  pv.textContent = msg; btn.href = waLink(s.phone, msg);
}
function updateMotivationMsg(){
  if(selectedStudentIndex === '') return;
  const s = students[selectedStudentIndex], v = $('selectMotivation').value, pv = $('motivationMsgPreview'), btn =$('waMotivBtn');
  if(v === ''){ pv.textContent = 'اختر الرسالة لعرض نصها.'; btn.href = '#'; return; }
  const text = customMotivations[v.split('-')[1]].text;
  const msg = `إلى ولي أمر الطالب / ${s.name}\n\n${text}\n\nمع خالص الشكر، المعلم: ${TEACHER_NAME}`;
  pv.textContent = msg; btn.href = waLink(s.phone, msg);
}
function sendVia(a){
  if(a.getAttribute('href') === '#'){ alert('اختر الرسالة أولاً'); return false; }
  bumpMessages(selectedStudentIndex); return true;
}
function sendFullReport(){
  if(selectedStudentIndex === '') return;
  const s = students[selectedStudentIndex];
  const msg = `تقرير الطالب / ${s.name} (${clsOf(s)})\n- المشاركات: ${s.participation||0}\n- الواجبات: ${s.homework||0}\n- الغياب: ${s.absence||0}\n- الدروس المتقنة: ${masteredCount(selectedStudentIndex)} من ${lessons.length}\nمع تحيات المعلم: ${TEACHER_NAME}`;
  bumpMessages(selectedStudentIndex);
  window.open(waLink(s.phone, msg), '_blank');
}
function addNewMotivation(){
  const t = $('newMotivationTitle').value.trim(), x =$('newMotivationText').value.trim();
  if(!t || !x){ alert('اكتب عنوان الرسالة ونصها'); return; }
  customMotivations.push({id:Date.now().toString(), title:t, text:x});
  localStorage.setItem(K.motiv, JSON.stringify(customMotivations));
  $('newMotivationTitle').value = '';$('newMotivationText').value = '';
  renderLessons(); showToast('تم حفظ الرسالة');
}
function bumpMessages(i){
  if(i === '' || !students[i]) return;
  students[i].messages = (students[i].messages || 0) + 1; saveStudents();
  $('totalMessagesSent').textContent = students.reduce((a,s) => a + (s.messages||0), 0);
  if(selectedStudentIndex === i) $('sdMessages').textContent = students[i].messages;
}

function bulkBase(){
  const v = $('bulkLesson').value, d = $('bulkDetails').value.trim(), n =$('bulkNote').value.trim();
  if(!v) return null;
  const l = lessons[v.split('-')[1]];
  let m = `أولياء الأمور الأفاضل، واجب مادة العلوم للدرس:\n📘 (${l.chapter}) - ${l.title}\n`;
  m += d ? `📝 المطلوب: ${d}\n` : `📝 المطلوب: حل تدريبات الدرس في الكتاب.\n`;
  if(n) m += `📌 ملاحظات: ${n}\n`;
  return m + `\nمع خالص الشكر، المعلم: ${TEACHER_NAME}`;
}
function updateBulkPreview(){ $('bulkPreview').textContent = bulkBase() || 'اختر الدرس وأدخل تفاصيل الواجب لتظهر الرسالة هنا.'; }
function prepareBulk(){
  const base = bulkBase(); if(!base){ alert('اختر درس الواجب أولاً'); return; }
  const cls = $('bulkTargetClass').value;
  let list = cls === 'ALL' ? students : students.filter(s => clsOf(s) === cls);
  list = list.filter(s => s.phone && s.phone.trim());
  if(!list.length){ alert('لا توجد أرقام جوال مسجلة للطلاب المستهدفين'); return; }
  $('bulkList').innerHTML = list.map(s => {
    const gi = students.indexOf(s);
    return `<div class="send-row"><span><strong>${esc(s.name)}</strong> <span class="tag">${esc(clsOf(s))}</span></span>
      <a class="btn sm wa" target="_blank" href="${waLink(s.phone, 'ولي أمر الطالب / ' + s.name + '\n\n' + base)}" onclick="markSent(${gi},this)">إرسال</a></div>`;
  }).join('');
  $('bulkPanel').hidden = false; showToast(`جاهزة روابط ${list.length} ولي أمر`);
}
function markSent(i, el){ bumpMessages(i); el.textContent = 'تم'; el.style.background = '#6b7280'; }

function printSection(id){
  if(id === 'paper' && !activeQuestions.length){ alert('ولّد ورقة الاختبار أولاً'); return; }
  document.querySelectorAll('.printing').forEach(e => e.classList.remove('printing'));
  $(id).classList.add('printing'); window.print();
}
window.addEventListener('afterprint', () => document.querySelectorAll('.printing').forEach(e => e.classList.remove('printing')));

function exportExcel(){
  if(!students.length){ alert('لا توجد بيانات لتصديرها'); return; }
  const rows = students.map((s,i) => ({"م":i+1,"اسم الطالب":s.name,"الصف":clsOf(s),"رقم الجوال":s.phone||'',"الغياب":s.absence||0,"المشاركة":s.participation||0,"الواجبات":s.homework||0,"التجارب":s.projects||0,"الرسائل":s.messages||0,"اختبار 1":s.exam1||0,"اختبار 2":s.exam2||0}));
  const ws = XLSX.utils.json_to_sheet(rows); ws['!views'] = [{rightToLeft:true}];
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "سجل طلاب العلوم");
  XLSX.writeFile(wb, `سجل_العلوم_${currentGrade}.xlsx`); showToast('تم تصدير ملف Excel');
}
function downloadBlob(content, type, name){
  const url = URL.createObjectURL(new Blob([content], {type})), a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function exportCSV(){
  if(!students.length){ alert('لا توجد بيانات لتصديرها'); return; }
  let csv = "\uFEFFاسم الطالب,الصف,رقم الجوال,الغياب,المشاركة,الواجبات,التجارب,اختبار 1,اختبار 2\n";
  students.forEach(s => { csv += `"${String(s.name).replace(/"/g,'""')}","${String(clsOf(s)).replace(/"/g,'""')}","${s.phone||''}",${s.absence||0},${s.participation||0},${s.homework||0},${s.projects||0},${s.exam1||0},${s.exam2||0}\n`; });
  downloadBlob(csv, 'text/csv;charset=utf-8;', `GoogleSheets_${currentGrade}.csv`); showToast('تم التصدير');
}
function importExcel(ev){
  const f = ev.target.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = e => {
    try{
      const wb = XLSX.read(new Uint8Array(e.target.result), {type:'array'});
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      if(!rows.length){ alert('ملف Excel فارغ أو غير مطابق'); return; }
      let n = 0;
      rows.forEach(w => {
        const name = w["اسم الطالب"] || w["اسم الطالبة"] || w["الاسم"] || '';
        if(!String(name).trim()) return;
        students.push({
          name:String(name).trim(), classCustom:String(w["الصف"] || w["الصف/الشعبة"] || currentGrade).trim(),
          phone:String(w["رقم الجوال"] || w["الجوال"] || '').trim(),
          absence:Number(w["الغياب"]||0), participation:Number(w["المشاركة"]||w["المشاركات"]||0), homework:Number(w["الواجبات"]||0),
          projects:Number(w["التجارب"]||0), messages:Number(w["الرسائل"]||0),
          exam1:Number(w["اختبار 1"]||0), exam2:Number(w["اختبار 2"]||0)
        }); n++;
      });
      saveStudents(); render(); showToast(`تم استيراد ${n} طالب`);
    }catch(err){ alert('تعذّرت قراءة ملف Excel'); }
    finally{ ev.target.value = ''; }
  };
  r.readAsArrayBuffer(f);
}

const SECRET_KEYS = [PW_KEY, PW_SALT, REMEMBER_KEY];
function backupAll(){
  const data = {};
  for(let i=0;i<localStorage.length;i++){
    const k = localStorage.key(i);
    if(k.startsWith('mansour_') && !SECRET_KEYS.includes(k)) data[k] = localStorage.getItem(k);
  }
  downloadBlob(JSON.stringify({__mansour_backup:2, created:new Date().toISOString(), data}), 'application/json', `نسخة_احتياطية_العلوم_${new Date().toISOString().slice(0,10)}.json`);
  localStorage.setItem('mansour_last_backup_date', Date.now().toString());
  $('backupBanner').hidden = true; showToast('تم حفظ النسخة الاحتياطية');
}
function restoreBackup(ev){
  const f = ev.target.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = e => {
    try{
      const j = JSON.parse(e.target.result);
      if(!confirm('سيتم استبدال البيانات الحالية بمحتوى النسخة. هل تريد المتابعة؟')) return;
      if(j && j.__mansour_backup && j.data){
        Object.keys(j.data).forEach(k => { if(k.startsWith('mansour_') && !SECRET_KEYS.includes(k)) localStorage.setItem(k, j.data[k]); });
      } else { alert('ملف النسخة غير صالح'); return; }
      alert('تم استرجاع البيانات بنجاح'); location.reload();
    }catch(err){ alert('تعذّرت قراءة ملف النسخة'); }
    finally{ ev.target.value = ''; }
  };
  r.readAsText(f);
}
function checkBackupReminder(){
  const last = Number(localStorage.getItem('mansour_last_backup_date') || 0);
  const hasData = Object.keys(localStorage).some(k => k.startsWith('mansour_students_'));
  if(hasData && (!last || Date.now() - last > 7*86400000)) $('backupBanner').hidden = false;
}

const isStandalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; });
async function installPWA(){
  if(isStandalone()){ showToast('التطبيق مثبّت بالفعل'); return; }
  if(deferredPrompt){
    deferredPrompt.prompt();
    try{ const c = await deferredPrompt.userChoice; if(c.outcome === 'accepted') showToast('تم تثبيت اللوحة'); }catch(e){}
    deferredPrompt = null; return;
  }
  $('installHelp').hidden = false;
}

function bootApp(){
  localStorage.setItem('mansour_current_grade_science_v5', currentGrade);
  loadSchedule(); loadGradeData();
  buildOrbit(); applyGradeTheme();
  renderLessons(); render(); syncGrading();
  updateClock(); setInterval(updateClock, 1000);
  checkBackupReminder();
  if(isStandalone()){ $('installTop').hidden = true; $('pwaInstallBtn').hidden = true; }
  try{ const t = sessionStorage.getItem('mansour_tab'); if(t) showView(t); }catch(e){}
}
(function(){ const g = GRADES.find(x => x.key === currentGrade) || GRADES[0]; document.documentElement.style.setProperty('--accent', g.color); document.documentElement.style.setProperty('--accent-rgb', hexRgb(g.color)); })();
initLock();

