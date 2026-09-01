/**
 * ===================================================
 * أداة التحضير التلقائي الشاملة والذكية لمنصة مدرستي
 * ===================================================
 */

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

window.addEventListener('load', async () => {
    createFloatingControlUI();

    chrome.storage.local.get(['autoPrepRunning', 'defaultStrategy'], async (data) => {
        if (!data.autoPrepRunning) return;

        const currentUrl = window.location.href;
        console.log("🤖 محرك التحضير الآلي يعمل الآن في الصفحة:", currentUrl);

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
                console.log(`تم العثور على ${prepButtons.length} درس بانتظار التحضير. جاري الانتقال للدرس الأول...`);
                await delay(1000);
                prepButtons[0].click();
            } else {
                alert("🎉 تم الانتهاء من تحضير كافة حصص الجدول بنجاح!");
                chrome.storage.local.set({ autoPrepRunning: false });
                updateUIStatus(false);
            }
        }

        // ===================================================
        // المرحلة الثانية: صفحة تحضير الدرس (توليد وتعبئة آلية)
        // ===================================================
        else if (currentUrl.includes("/LessonPrep") || currentUrl.includes("/PrepareLesson") || currentUrl.includes("/Lesson")) {
            await delay(2000);

            // استخراج اسم الدرس الحالي المكتوب بالصفحة
            let lessonTitleEl = document.querySelector('.lesson-title, h3, h4, #LessonName, .page-header');
            let lessonName = lessonTitleEl ? lessonTitleEl.innerText.trim() : "المقرر الدراسي";

            console.log("جاري تحضير الدرس وتوليد الأهداف لـ:", lessonName);

            // أ) اختيار استراتيجية التدريس
            let strategySelect = document.querySelector('select[name*="Strategy"], select[id*="Strategy"]');
            if (strategySelect && strategySelect.options.length > 1) {
                strategySelect.value = data.defaultStrategy || strategySelect.options[1]?.value;
                strategySelect.dispatchEvent(new Event('change', { bubbles: true }));
            }

            await delay(800);

            // ب) توليد وتعبئة هدف تعليمي ذكي تلقائياً بناءً على اسم الدرس
            let goalInput = document.querySelector('textarea[name*="Goal"], textarea[id*="Goal"], input[name*="Goal"], textarea[name*="Objective"]');
            if (goalInput) {
                let autoGoal = `أن يتعرف الطالب على المفاهيم والمهارات الأساسية لدرس (${lessonName}) ويطبقها بنجاح.`;
                goalInput.value = autoGoal;
                goalInput.dispatchEvent(new Event('input', { bubbles: true }));
            }

            await delay(800);

            // ج) اختيار أول واجب متاح في القائمة المنسدلة
            let homeworkSelect = document.querySelector('select[name*="Homework"], select[id*="Homework"]');
            if (homeworkSelect && homeworkSelect.options.length > 1) {
                homeworkSelect.selectedIndex = 1;
                homeworkSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }

            await delay(800);

            // د) اختيار أول إثراء متاح في القائمة المنسدلة
            let enrichmentSelect = document.querySelector('select[name*="Enrichment"], select[id*="Enrichment"]');
            if (enrichmentSelect && enrichmentSelect.options.length > 1) {
                enrichmentSelect.selectedIndex = 1;
                enrichmentSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }

            await delay(1500);

            // هـ) الضغط التلقائي على زر الحفظ للعودة للجدول وتحضير الحصة التالية
            let saveButton = document.querySelector('button[type="submit"], #btnSave, .btn-primary, input[type="submit"]');
            if (saveButton) {
                console.log("تمت التعبئة والتوليد بنجاح، جاري ضغط زر الحفظ والعودة للجدول...");
                saveButton.click();
            } else {
                console.warn("لم يتم العثور على زر الحفظ، يُرجى التحقق من المحدّدات.");
            }
        }
    });
});

/**
 * إنشاء واجهة التحكم العائمة فوق صفحة مدرستي
 */
function createFloatingControlUI() {
    if (document.getElementById('prep-floating-ui')) return;

    const uiBox = document.createElement('div');
    uiBox.id = 'prep-floating-ui';
    uiBox.style.cssText = `
        position: fixed; bottom: 20px; left: 20px; z-index: 999999;
        background: #ffffff; border: 2px solid #10b981; padding: 15px;
        border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        font-family: system-ui, sans-serif; direction: rtl; width: 260px; text-align: center;
    `;

    uiBox.innerHTML = `
        <h4 style="margin: 0 0 10px 0; color: #1e293b; font-size: 15px;">🤖 لوحة التحضير التلقائي</h4>
        <div style="margin-bottom: 10px;">
            <select id="uiStrategySelect" style="width:100%; padding:6px; border-radius:6px; border:1px solid #ccc; font-size:12px;">
                <option value="التعلم التعاوني">التعلم التعاوني</option>
                <option value="العصف الذهني">العصف الذهني</option>
                <option value="التفكير الناقد">التفكير الناقد</option>
            </select>
        </div>
        <button id="btnTogglePrep" style="width:100%; padding:8px; background:#10b981; color:#fff; border:none; border-radius:6px; font-weight:bold; cursor:pointer; font-size:13px;">
            بدء التحضير الشامل
        </button>
        <div id="prepStatusText" style="margin-top:8px; font-size:11px; color:#64748b;">الحالة: متوقف</div>
    `;

    document.body.appendChild(uiBox);

    chrome.storage.local.get(['autoPrepRunning'], (data) => {
        updateUIStatus(data.autoPrepRunning);
    });

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
        statusText.innerText = "الحالة: جاري التحضير التلقائي... ⏳";
        statusText.style.color = "#059669";
    } else {
        btn.innerText = "بدء التحضير الشامل";
        btn.style.background = "#10b981";
        statusText.innerText = "الحالة: متوقف";
        statusText.style.color = "#64748b";
    }
}
