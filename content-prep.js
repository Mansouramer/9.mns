/**
 * ===================================================
 * أداة التحضير الذكية الموحدة - ربط الداشبورد وتوليد الأهداف
 * ===================================================
 */

// ضع هنا رابط ملف بيانات الدروس أو API الخاص بالداشبورد على Vercel/GitHub
const DASHBOARD_API_URL = "https://your-dashboard-domain.vercel.app/api/lessons.json";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

window.addEventListener('load', async () => {
    
    // 1. إنشاء واجهة التحكم العائمة
    createFloatingControlUI();

    // 2. فحص حالة التشغيل
    chrome.storage.local.get(['autoPrepRunning', 'defaultStrategy', 'lessonsDB'], async (data) => {
        if (!data.autoPrepRunning) return;

        const currentUrl = window.location.href;
        const lessonsDB = data.lessonsDB || {};

        console.log("🤖 محرك التحضير الذكي يعمل الآن...");

        // ===================================================
        // المرحلة الأولى: صفحة الجدول الدراسي
        // ===================================================
        if (currentUrl.includes("/Schedule") || currentUrl.includes("/Teacher/Schedule")) {
            await delay(2500);

            let prepButtons = Array.from(document.querySelectorAll('a, button, .btn')).filter(el => {
                const text = el.innerText || el.textContent;
                return text.includes("قم بإعداد الدرس") || text.includes("إعداد الدرس");
            });

            if (prepButtons.length > 0) {
                console.log(`تم العثور على ${prepButtons.length} درس غير محضر. جاري فتح الأول...`);
                await delay(1000);
                prepButtons[0].click();
            } else {
                alert("🎉 تم الانتهاء من تحضير كافة حصص الأسبوع بنجاح!");
                chrome.storage.local.set({ autoPrepRunning: false });
                updateUIStatus(false);
            }
        }

        // ===================================================
        // المرحلة الثانية: صفحة تحضير الدرس
        // ===================================================
        else if (currentUrl.includes("/LessonPrep") || currentUrl.includes("/PrepareLesson") || currentUrl.includes("/Lesson")) {
            await delay(2000);

            // استخراج اسم الدرس الحالي من الصفحة
            let lessonTitleEl = document.querySelector('.lesson-title, h3, h4, #LessonName, .page-header');
            let lessonTitle = lessonTitleEl ? lessonTitleEl.innerText.trim() : "الدرس الحالي";

            // البحث عن بيانات الدرس المجلوبة من الداشبورد
            let matchedLesson = lessonsDB[lessonTitle] || null;

            // أ) تعبئة الاستراتيجية
            let strategySelect = document.querySelector('select[name*="Strategy"], select[id*="Strategy"]');
            if (strategySelect && strategySelect.options.length > 1) {
                strategySelect.value = data.defaultStrategy || strategySelect.options[1]?.value;
                strategySelect.dispatchEvent(new Event('change', { bubbles: true }));
            }

            await delay(800);

            // ب) تعبئة وتوليد الأهداف تلقائياً
            let goalField = document.querySelector('textarea[name*="Goal"], textarea[id*="Goal"], input[name*="Goal"], textarea[name*="Objective"]');
            if (goalField) {
                // استخدام الهدف من الداشبورد أو توليده تلقائياً فورياً
                let autoGoal = (matchedLesson && matchedLesson.goals) 
                    ? matchedLesson.goals 
                    : `أن يتعرف الطالب على مفاهيم درس (${lessonTitle})، ويتقن المهارات الأساسية المقررة بنجاح.`;

                goalField.value = autoGoal;
                goalField.dispatchEvent(new Event('input', { bubbles: true }));
            }

            await delay(800);

            // ج) تعبئة الواجب
            let homeworkSelect = document.querySelector('select[name*="Homework"], select[id*="Homework"]');
            if (homeworkSelect && homeworkSelect.options.length > 1) {
                homeworkSelect.selectedIndex = (matchedLesson && matchedLesson.homeworkIndex) ? matchedLesson.homeworkIndex : 1;
                homeworkSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }

            await delay(800);

            // د) تعبئة الإثراء
            let enrichmentSelect = document.querySelector('select[name*="Enrichment"], select[id*="Enrichment"]');
            if (enrichmentSelect && enrichmentSelect.options.length > 1) {
                enrichmentSelect.selectedIndex = (matchedLesson && matchedLesson.enrichmentIndex) ? matchedLesson.enrichmentIndex : 1;
                enrichmentSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }

            await delay(1500);

            // هـ) الحفظ التلقائي والعودة للجدول
            let saveButton = document.querySelector('button[type="submit"], #btnSave, .btn-primary, input[type="submit"]');
            if (saveButton) {
                console.log("جاري حفظ الدرس والعودة للجدول...");
                saveButton.click();
            }
        }
    });
});

/**
 * جلب بيانات الدروس تلقائياً من الداشبورد الخارجي
 */
async function syncDataFromDashboard() {
    const btnSync = document.getElementById('btnSyncDashboard');
    btnSync.innerText = "جاري المزامنة... ⏳";
    btnSync.disabled = true;

    try {
        const response = await fetch(DASHBOARD_API_URL);
        if (!response.ok) throw new Error("تعذر الاتصال بالداشبورد");

        const lessonsData = await response.json();

        chrome.storage.local.set({ lessonsDB: lessonsData }, () => {
            alert("✅ تم مزامنة خطة الدروس والأهداف من الداشبورد بنجاح!");
            btnSync.innerText = "🔄 مزامنة مع الداشبورد";
            btnSync.disabled = false;
        });
    } catch (error) {
        console.error("خطأ في المزامنة:", error);
        alert("⚠️ لم نتمكن من المزامنة تلقائياً. تأكد من رابط الداشبورد. سيتم وضع الأهداف المباشرة تلقائياً.");
        btnSync.innerText = "🔄 مزامنة مع الداشبورد";
        btnSync.disabled = false;
    }
}

/**
 * إنشاء واجهة التحكم العائمة فوق مدرستي
 */
function createFloatingControlUI() {
    if (document.getElementById('prep-floating-ui')) return;

    const uiBox = document.createElement('div');
    uiBox.id = 'prep-floating-ui';
    uiBox.style.cssText = `
        position: fixed; bottom: 20px; left: 20px; z-index: 999999;
        background: #ffffff; border: 2px solid #10b981; padding: 12px;
        border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        font-family: system-ui, sans-serif; direction: rtl; width: 270px; text-align: center;
    `;

    uiBox.innerHTML = `
        <h4 style="margin: 0 0 8px 0; color: #1e293b; font-size: 14px;">🤖 لوحة التحضير الذكية</h4>
        
        <select id="uiStrategySelect" style="width:100%; padding:6px; margin-bottom:8px; border-radius:6px; border:1px solid #ccc; font-size:12px;">
            <option value="التعلم التعاوني">التعلم التعاوني</option>
            <option value="العصف الذهني">العصف الذهني</option>
            <option value="التفكير الناقد">التفكير الناقد</option>
        </select>

        <button id="btnSyncDashboard" style="width:100%; padding:6px; background:#8b5cf6; color:#fff; border:none; border-radius:6px; font-weight:bold; cursor:pointer; font-size:12px; margin-bottom:6px;">
            🔄 مزامنة البيانات من الداشبورد
        </button>

        <button id="btnTogglePrep" style="width:100%; padding:8px; background:#10b981; color:#fff; border:none; border-radius:6px; font-weight:bold; cursor:pointer; font-size:13px;">
            بدء التحضير الشامل
        </button>
        
        <div id="prepStatusText" style="margin-top:6px; font-size:11px; color:#64748b;">الحالة: متوقف</div>
    `;

    document.body.appendChild(uiBox);

    chrome.storage.local.get(['autoPrepRunning'], (data) => updateUIStatus(data.autoPrepRunning));

    // زر المزامنة مع الداشبورد
    document.getElementById('btnSyncDashboard').addEventListener('click', () => {
        syncDataFromDashboard();
    });

    // زر البدء والإيقاف
    document.getElementById('btnTogglePrep').addEventListener('click', () => {
        chrome.storage.local.get(['autoPrepRunning'], (data) => {
            const nextState = !data.autoPrepRunning;
            const strategy = document.getElementById('uiStrategySelect').value;

            chrome.storage.local.set({
                autoPrepRunning: nextState,
                defaultStrategy: strategy
            }, () => {
                updateUIStatus(nextState);
                if (nextState) {
                    if (!window.location.href.includes("/Schedule")) {
                        window.location.href = "https://schools.madrasati.sa/Teacher/Schedule";
                    } else {
                        window.location.reload();
                    }
                }
            });
        });
    });
}

function updateUIStatus(isRunning) {
    const btn = document.getElementById('btnTogglePrep');
    const statusText = document.getElementById('prepStatusText');
    if (!btn || !statusText) return;

    if (isRunning) {
        btn.innerText = "إيقاف الأتمتة فوراً";
        btn.style.background = "#ef4444";
        statusText.innerText = "الحالة: جاري التحضير الذكي... ⏳";
        statusText.style.color = "#059669";
    } else {
        btn.innerText = "بدء التحضير الشامل";
        btn.style.background = "#10b981";
        statusText.innerText = "الحالة: متوقف";
        statusText.style.color = "#64748b";
    }
}
