// === Sidebar Toggle ===
const sidebar = document.querySelector(".sidebar");
const toggleBtn = document.querySelector("#toggle-btn");

toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("close");
});

// === Dark Mode Toggle ===
const themeToggle = document.getElementById("theme-toggle");
const body = document.body;

themeToggle.addEventListener("click", () => {
    body.classList.toggle("dark");
    if (body.classList.contains("dark")) {
        themeToggle.innerHTML = "<i class='bx bx-sun'></i>";
        localStorage.setItem("theme", "dark");
    } else {
        themeToggle.innerHTML = "<i class='bx bx-moon'></i>";
        localStorage.setItem("theme", "light");
    }
    // Redraw Chart on Theme Change
    if (enrollmentChart) {
        updateChartTheme();
    }
});

// Load saved theme
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
    body.classList.add("dark");
    themeToggle.innerHTML = "<i class='bx bx-sun'></i>";
}

// === Navigation & Routing (SPA) ===
const navLinks = document.querySelectorAll(".nav-links a");
const pageViews = document.querySelectorAll(".page-view");

// === Initialization & Login Logic ===
let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
    // User Login Submission
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const emailInput = document.getElementById("loginEmail").value.trim();
            const passwordInput = document.getElementById("loginPassword").value.trim();

            loginToServer(emailInput, passwordInput);
        });
    }

    // Restore session (no need to download all users/passwords)
    const savedSession = sessionStorage.getItem("currentUser");
    if (savedSession) {
        currentUser = JSON.parse(savedSession);
        handleSuccessfulLogin(currentUser, false);
    }
});

async function loginToServer(identifier, password) {
    const errorMsg = document.getElementById("loginError");
    try {
        const res = await fetch(`${API_BASE}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier, password }),
        });

        const result = await res.json().catch(() => ({}));
        if (!res.ok || !result?.success || !result?.user) {
            if (errorMsg) {
                errorMsg.classList.add("show");
                setTimeout(() => errorMsg.classList.remove("show"), 500);
                setTimeout(() => errorMsg.classList.add("show"), 510);
            }
            return;
        }

        if (errorMsg) errorMsg.classList.remove("show");
        currentUser = result.user;
        sessionStorage.setItem("currentUser", JSON.stringify(currentUser));
        handleSuccessfulLogin(currentUser, true);
    } catch (e) {
        if (errorMsg) errorMsg.classList.add("show");
    }
}

function handleSuccessfulLogin(user, animate) {
    try {
        console.log("handleSuccessfulLogin triggered with:", user);

        // Hide Login Overlay
        const overlay = document.getElementById("login-overlay");
        console.log("Login overlay element:", overlay);
        if (overlay) {
            overlay.classList.remove("active");
            overlay.classList.add("hidden");
        }

        // Show App (Remove hidden class)
        document.body.classList.remove("app-hidden");
        console.log("Body classes after removing app-hidden:", document.body.className);

        // Update Profile UI
        const profileName = document.querySelector(".profile_name");
        const profileJob = document.querySelector(".job");
        if (profileName) profileName.textContent = user.name;
        if (profileJob) profileJob.textContent = user.role;

        // Filter sidebar based on Role
        document.querySelectorAll('.nav-links > li').forEach(li => {
            li.style.display = 'none'; // Hide all first
        });

        let defaultRoute = 'dashboard';

        if (user.roleCode === 'admin') {
            const adminViews = ['dashboard', 'students', 'instructors', 'courses', 'class-management', 'subjects', 'accounting', 'notifications', 'settings', 'roles'];
            document.querySelectorAll('.nav-links > li').forEach(li => {
                const target = li.querySelector('a')?.getAttribute('data-target');
                if (adminViews.includes(target)) li.style.display = 'block';
            });
            defaultRoute = 'dashboard';
        }
        else if (user.roleCode === 'teacher') {
            const teacherViews = ['teacher-dashboard', 'teacher-students', 'teacher-attendance', 'teacher-notifications'];
            document.querySelectorAll('.nav-links > li').forEach(li => {
                const target = li.querySelector('a')?.getAttribute('data-target');
                if (teacherViews.includes(target)) li.style.display = 'block';
            });
            defaultRoute = 'teacher-dashboard';
        }
        else if (user.roleCode === 'parent') {
            const parentViews = ['parent-dashboard', 'parent-children', 'parent-fees'];
            document.querySelectorAll('.nav-links > li').forEach(li => {
                const target = li.querySelector('a')?.getAttribute('data-target');
                if (parentViews.includes(target)) li.style.display = 'block';
            });
            defaultRoute = 'parent-dashboard';
        }
        else if (user.roleCode === 'accountant') {
            const accountantViews = ['accountant-dashboard', 'accountant-fees', 'accountant-reports'];
            document.querySelectorAll('.nav-links > li').forEach(li => {
                const target = li.querySelector('a')?.getAttribute('data-target');
                if (accountantViews.includes(target)) li.style.display = 'block';
            });
            defaultRoute = 'accountant-dashboard';
        }

        console.log("Navigating to default route:", defaultRoute);
        // Default route
        navigateTo(defaultRoute);
        
        // Load data after authentication
        loadDataFromDB();

        // تحديث الإشعارات فور تسجيل الدخول لتتناسب مع الصلاحية
        renderNotifications();
        renderTeacherViews();
        renderParentViews();
    } catch (err) {
        console.error("Error inside handleSuccessfulLogin:", err);
    }
}

// Logout Feature
document.querySelector(".profile-details .bx-log-out")?.addEventListener("click", () => {
    sessionStorage.removeItem("currentUser");
    currentUser = null;
    document.body.classList.add("app-hidden");
    const overlay = document.getElementById("login-overlay");
    if (overlay) overlay.classList.add("active");
    document.getElementById("loginForm").reset();
    document.getElementById("loginError").classList.remove("show");
});

function navigateTo(targetId) {
    if (!targetId) return;

    // Update active class on nav links
    document.querySelectorAll(".nav-links a.active").forEach(l => l.classList.remove("active"));
    const activeLink = document.querySelector(`.nav-links a[data-target="${targetId}"]`);
    if (activeLink) activeLink.classList.add("active");

    // Show target section, hide others
    pageViews.forEach(view => {
        if (view.id === targetId) {
            view.classList.add("active");
        } else {
            view.classList.remove("active");
        }
    });

    // Mobile Sidebar Close on Click
    if (window.innerWidth <= 768) {
        sidebar.classList.add("close");
    }
}

navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = link.getAttribute("data-target");
        navigateTo(targetId);
    });
});


// === Form Auto Calculations ===
function calculateRemaining() {
    const total = parseFloat(document.getElementById('studentTotalAmount')?.value) || 0;
    const paid = parseFloat(document.getElementById('studentPaidAmount')?.value) || 0;
    const remainingInput = document.getElementById('studentRemainingAmount');

    if (remainingInput) {
        remainingInput.value = Math.max(0, total - paid);
    }
}

function calculateEditRemaining() {
    const total = parseFloat(document.getElementById('editStudentTotalAmount')?.value) || 0;
    const paid = parseFloat(document.getElementById('editStudentPaidAmount')?.value) || 0;
    const remainingInput = document.getElementById('editStudentRemainingAmount');

    if (remainingInput) {
        remainingInput.value = Math.max(0, total - paid);
    }
}

// === Display Trainees in Course (Add Student Modal) ===
function displayCourseTrainees() {
    const infoDiv = document.getElementById('course-trainees-info');
    if (!infoDiv) return;

    const selectedOptions = Array.from(document.getElementById('studentCourse').selectedOptions);
    if (selectedOptions.length === 0) {
        infoDiv.innerHTML = '<p style="color: var(--text-muted); text-align: center;">الرجاء تحديد دورة لعرض المتدربين المسجلين فيها.</p>';
        return;
    }

    let infoHtml = '';
    const maxStudents = settingsData.maxStudentsPerCourse || 30;

    selectedOptions.forEach(option => {
        const courseTitle = option.value;
        const course = coursesData.find(c => c.title === courseTitle);
        if (!course) return;

        // Find students in this course by checking for the specific serial key
        const studentsInCourse = studentsData.filter(student => student.hasOwnProperty(`serial_${course.id}`));

        infoHtml += `<div style="margin-bottom: 15px; border-right: 3px solid var(--primary-color); padding-right: 10px;">`;
        infoHtml += `<strong>- دورة: ${course.title} (${studentsInCourse.length} / ${maxStudents} متدرب)</strong>`;

        if (studentsInCourse.length > 0) {
            infoHtml += `<ul style="list-style-type: none; padding-right: 5px; margin-top: 5px; max-height: 150px; overflow-y: auto; font-size: 13px;">`;
            // Sort students by their serial number in this course
            studentsInCourse.sort((a, b) => (a[`serial_${course.id}`] || 0) - (b[`serial_${course.id}`] || 0));
            
            studentsInCourse.forEach(student => {
                const serial = student[`serial_${course.id}`];
                infoHtml += `<li><span style="font-weight:600; color: var(--primary-color);">#${serial}</span>: ${student.name}</li>`;
            });
            infoHtml += `</ul>`;
        } else {
            infoHtml += `<p style="padding-right: 5px; margin-top: 5px; font-size: 13px;">لا يوجد متدربين مسجلين حالياً.</p>`;
        }
        infoHtml += `</div>`;
    });

    infoDiv.innerHTML = infoHtml;
}

// === Display Student Count in Class ===
function displayClassTraineesCount() {
    const classSelect = document.getElementById('studentClass');
    const infoDiv = document.getElementById('class-students-info');
    if (!classSelect || !infoDiv) return;

    const selectedClassId = classSelect.value;
    if (!selectedClassId) {
        infoDiv.innerHTML = '';
        return;
    }

    const selectedClass = coursesData.find(c => c.id === selectedClassId);
    if (selectedClass) {
        const maxStudents = selectedClass.capacity || settingsData.maxStudentsPerCourse || 30;
        const currentStudents = studentsData.filter(s => s.class_id === selectedClassId).length;
        const color = currentStudents >= maxStudents ? 'var(--danger-color)' : 'var(--primary-color)';
        infoDiv.innerHTML = `<div style="padding: 10px; background: var(--bg-hover); border-radius: 8px; border-right: 3px solid ${color}; font-size: 14px;"><strong>الطلاب المسجلين في الشعبة:</strong> ${currentStudents} / ${maxStudents} طالب</div>`;
    }
}

// === Filter Classes by Selected Course ===
function filterClassesForSelectedCourses() {
    const courseSelect = document.getElementById('studentCourse');
    const classSelect = document.getElementById('studentClass');
    if (!courseSelect || !classSelect) return;

    const selectedCourseTitles = Array.from(courseSelect.selectedOptions).map(opt => opt.value);
    
    if (selectedCourseTitles.length === 0) {
        classSelect.innerHTML = '<option value="">-- حدد الدورة أولاً --</option>';
        displayClassTraineesCount();
        return;
    }

    // جلب المواد الدراسية التابعة للدورات المحددة
    const selectedSubjects = selectedCourseTitles.map(title => {
        const course = coursesData.find(c => c.title === title);
        return course ? course.subject : null;
    }).filter(Boolean);

    // فلترة الشعب التي تشترك مع الدورة في نفس المادة الدراسية
    const classesList = coursesData.filter(c => c.duration === 'غير محدد' || c.title.includes(' - نسخة جديدة'));
    const filteredClasses = classesList.filter(c => selectedSubjects.includes(c.subject));

    if (filteredClasses.length > 0) {
        classSelect.innerHTML = `<option value="">-- حدد الشعبة --</option>` + filteredClasses.map(c => {
            const maxStudents = parseInt(c.capacity, 10) || parseInt(settingsData.maxStudentsPerCourse, 10) || 30;
            const currentStudents = studentsData.filter(s => s.class_id === c.id).length;
            const isFull = currentStudents >= maxStudents;
            return `<option value="${c.id}" ${isFull ? 'disabled style="color: var(--danger-color);"' : ''}>${c.title} ${isFull ? '(ممتلئة)' : ''}</option>`;
        }).join('');
    } else {
        classSelect.innerHTML = `<option value="">-- لا توجد شعب متاحة لهذه الدورة --</option>`;
    }
    displayClassTraineesCount();
}

// === Filter Classes by Selected Course in Edit Modal ===
function filterClassesForEditStudent() {
    const courseSelect = document.getElementById('editStudentCourse');
    const classSelect = document.getElementById('editStudentClass');
    if (!courseSelect || !classSelect) return;

    const selectedCourseTitles = Array.from(courseSelect.selectedOptions).map(opt => opt.value);
    
    if (selectedCourseTitles.length === 0) {
        classSelect.innerHTML = '<option value="">-- حدد الدورة أولاً --</option>';
        updateEditStudentSerial();
        return;
    }

    const selectedSubjects = selectedCourseTitles.map(title => {
        const course = coursesData.find(c => c.title === title);
        return course ? course.subject : null;
    }).filter(Boolean);

    const classesList = coursesData.filter(c => c.duration === 'غير محدد' || c.title.includes(' - نسخة جديدة'));
    const filteredClasses = classesList.filter(c => selectedSubjects.includes(c.subject));

    const currentClassId = classSelect.getAttribute('data-current-class');

    if (filteredClasses.length > 0) {
        classSelect.innerHTML = `<option value="">-- حدد الشعبة --</option>` + filteredClasses.map(c => {
            const maxStudents = parseInt(c.capacity, 10) || parseInt(settingsData.maxStudentsPerCourse, 10) || 30;
            const currentStudents = studentsData.filter(s => s.class_id === c.id).length;
            const isFull = currentStudents >= maxStudents && c.id !== currentClassId;
            return `<option value="${c.id}" ${isFull ? 'disabled style="color: var(--danger-color);"' : ''}>${c.title} ${isFull ? '(ممتلئة)' : ''}</option>`;
        }).join('');
        if (currentClassId && filteredClasses.find(c => c.id === currentClassId)) {
            classSelect.value = currentClassId;
        }
    } else {
        classSelect.innerHTML = `<option value="">-- لا توجد شعب متاحة لهذه الدورة --</option>`;
    }
    updateEditStudentSerial();
}

function updateEditStudentSerial() {
    const classSelect = document.getElementById('editStudentClass');
    const serialInput = document.getElementById('editStudentSerial');
    const studentId = document.getElementById('editStudentId')?.value;
    if (!classSelect || !serialInput) return;

    const selectedClassId = classSelect.value;
    if (!selectedClassId) {
        serialInput.value = "-";
        return;
    }

    const classStudents = studentsData.filter(s => s.class_id === selectedClassId);
    const existingIndex = classStudents.findIndex(s => s.id === studentId);
    if (existingIndex !== -1) {
        serialInput.value = existingIndex + 1;
    } else {
        serialInput.value = `سيعين كـ ${classStudents.length + 1}`;
    }
}

// === Modal Logic ===
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        populateSelectMenus(modalId);
        modal.classList.add("active");

        if (modalId === 'student-modal') {
            const studentCourseSelect = document.getElementById('studentCourse');
            const infoDiv = document.getElementById('course-trainees-info');

            // Clear previous info and reset state on open
            if (infoDiv) {
                infoDiv.innerHTML = '<p style="color: var(--text-muted); text-align: center;">الرجاء تحديد دورة لعرض المتدربين المسجلين فيها.</p>';
            }

            if (studentCourseSelect) {
                // To avoid attaching multiple listeners, we remove it first then add it
                studentCourseSelect.removeEventListener('change', displayCourseTrainees);
                studentCourseSelect.addEventListener('change', displayCourseTrainees);

                studentCourseSelect.removeEventListener('change', filterClassesForSelectedCourses);
                studentCourseSelect.addEventListener('change', filterClassesForSelectedCourses);
            }

            const studentClassSelect = document.getElementById('studentClass');
            if (studentClassSelect) {
                studentClassSelect.value = "";
                if (document.getElementById('class-students-info')) document.getElementById('class-students-info').innerHTML = '';
                studentClassSelect.removeEventListener('change', displayClassTraineesCount);
                studentClassSelect.addEventListener('change', displayClassTraineesCount);
            }
        }

        // Set default payment method for new accounting record
        if (modalId === 'add-accounting-modal') {
            const methodSelect = document.getElementById('accMethod');
            if (methodSelect) {
                methodSelect.value = 'نقدي';
            }
            
            // تصفير قائمة الطلبات عند فتح النافذة
            const accStudentSelect = document.getElementById('accStudentSelect');
            const accStudent = document.getElementById('accStudent');
            if (accStudentSelect) accStudentSelect.value = "";
            if (accStudent) { accStudent.style.display = "none"; accStudent.value = ""; }
        }
        
        if (modalId === 'add-role-modal') {
            if (typeof toggleRoleFields === 'function') toggleRoleFields();
        }
        if (modalId === 'edit-role-modal') {
            if (typeof toggleEditRoleFields === 'function') toggleEditRoleFields();
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove("active");
    }
}

// === Relational Dropdown Logic ===
function populateSelectMenus(modalId) {
    // فصل الدورات التدريبية الأساسية عن الشعب لتخصيص كل قائمة منسدلة بما يناسبها
    const trainingCourses = coursesData.filter(c => c.duration !== 'غير محدد' && !c.title.includes(' - نسخة جديدة'));
    const classesList = coursesData.filter(c => c.duration === 'غير محدد' || c.title.includes(' - نسخة جديدة'));

    if (modalId === 'student-modal') {
        const courseSelect = document.getElementById('studentCourse');
        if (courseSelect) {
            courseSelect.innerHTML = trainingCourses.map(c => `<option value="${c.title}">${c.title} (${c.instructor})</option>`).join('');
        }
        const classSelect = document.getElementById('studentClass');
        if (classSelect) {
            classSelect.innerHTML = `<option value="">-- حدد الدورة أولاً --</option>`;
        }
    } else if (modalId === 'edit-student-modal') {
        const courseSelect = document.getElementById('editStudentCourse');
        if (courseSelect) {
            courseSelect.innerHTML = trainingCourses.map(c => `<option value="${c.title}">${c.title} (${c.instructor})</option>`).join('');
        }
        const classSelect = document.getElementById('editStudentClass');
        if (classSelect) {
            classSelect.innerHTML = `<option value="">-- حدد الدورة أولاً --</option>`;
        }
    } else if (modalId === 'add-role-modal') {
        const subjectSelect = document.getElementById('newRoleSubject');
        if (subjectSelect) {
            subjectSelect.innerHTML = `<option value="">-- حدد المادة --</option>` + subjectsData.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
        }
        const classSelect = document.getElementById('newRoleClass');
        if (classSelect) {
            classSelect.innerHTML = coursesData.filter(c => c.duration === 'غير محدد' || c.title.includes(' - نسخة جديدة')).map(c => `<option value="${c.id}">${c.title}</option>`).join('');
        }
        const studentSelect = document.getElementById('newRoleStudent');
        if (studentSelect) {
            studentSelect.innerHTML = studentsData.map(s => `<option value="${s.id}">${s.name} - ${s.course}</option>`).join('');
        }
    } else if (modalId === 'edit-role-modal') {
        const subjectSelect = document.getElementById('editRoleSubject');
        if (subjectSelect) {
            subjectSelect.innerHTML = `<option value="">-- حدد المادة --</option>` + subjectsData.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
        }
        const classSelect = document.getElementById('editRoleClass');
        if (classSelect) {
            classSelect.innerHTML = coursesData.filter(c => c.duration === 'غير محدد' || c.title.includes(' - نسخة جديدة')).map(c => `<option value="${c.id}">${c.title}</option>`).join('');
        }
        const studentSelect = document.getElementById('editRoleStudent');
        if (studentSelect) {
            studentSelect.innerHTML = studentsData.map(s => `<option value="${s.id}">${s.name} - ${s.course}</option>`).join('');
        }
    } else if (modalId === 'add-instructor-modal') {
        const subjectSelect = document.getElementById('instructorSubject');
        if (subjectSelect) {
            subjectSelect.innerHTML = `<option value="">-- حدد المادة --</option>` + subjectsData.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
         }
     } else if (modalId === 'add-course-modal') {
        const subjectSelect = document.getElementById('courseSubject');
        if (subjectSelect) {
            subjectSelect.innerHTML = `<option value="">-- حدد المادة --</option>` + subjectsData.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
        }
        const instSelect = document.getElementById('courseInstructor');
        if (instSelect) {
            instSelect.innerHTML = `<option value="">-- حدد المدرس --</option>` + instructorsData.map(i => `<option value="${i.name}">${i.name}</option>`).join('');
        }
    } else if (modalId === 'add-class-modal') {
        const subjectSelect = document.getElementById('classSubject');
        if (subjectSelect) {
            subjectSelect.innerHTML = `<option value="">-- حدد المادة --</option>` + subjectsData.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
        }
    }
}

function filterInstructorsForCourse() {
    const selectedSub = document.getElementById('courseSubject')?.value;
    const instSelect = document.getElementById('courseInstructor');
    if (!instSelect) return;

    if (!selectedSub) {
        instSelect.innerHTML = `<option value="">-- حدد المدرس --</option>` + instructorsData.map(i => `<option value="${i.name}">${i.name}</option>`).join('');
        return;
    }

    const filteredInsts = instructorsData.filter(i => i.spec === selectedSub);
    if (filteredInsts.length > 0) {
        instSelect.innerHTML = filteredInsts.map(i => `<option value="${i.name}">${i.name}</option>`).join('');
    } else {
        instSelect.innerHTML = `<option value="">-- لا يوجد مدرس لهذه المادة --</option>`;
    }
}

// Close modal on outside click
document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
            overlay.classList.remove("active");
        }
    });
});

// 1. Chart.js (Enrollments)
let enrollmentChart;

function initChart() {
    const canvasElement = document.getElementById('enrollmentChart');
    if (!canvasElement) return;

    if (enrollmentChart) {
        enrollmentChart.destroy();
    }

    const textColor = body.classList.contains('dark') ? '#fff' : '#111827';
    const gridColor = body.classList.contains('dark') ? '#374151' : '#E5E7EB';
    const arabicMonthsShort = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    enrollmentChart = new Chart(canvasElement, {
        type: 'bar',
        data: {
            labels: arabicMonthsShort,
            datasets: [{
                label: 'إحصائيات التحاق الطلاب',
                data: [], // Will be populated dynamically
                backgroundColor: 'rgba(79, 70, 229, 0.8)',
                borderColor: 'rgba(79, 70, 229, 1)',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: gridColor },
                    ticks: { color: textColor, font: { family: 'Cairo' } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: textColor, font: { family: 'Cairo' } }
                }
            },
            plugins: {
                legend: {
                    labels: { color: textColor, font: { family: 'Cairo' } }
                }
            }
        }
    });
}

function updateChartTheme() {
    if (!enrollmentChart) return;
    const textColor = body.classList.contains('dark') ? '#fff' : '#111827';
    const gridColor = body.classList.contains('dark') ? '#374151' : '#E5E7EB';

    enrollmentChart.options.scales.x.ticks.color = textColor;
    enrollmentChart.options.scales.y.ticks.color = textColor;
    enrollmentChart.options.scales.y.grid.color = gridColor;
    enrollmentChart.options.plugins.legend.labels.color = textColor;
    enrollmentChart.update();
}

function renderDashboardStats() {
    const totalStudentsEl = document.getElementById('total-students-stat');
    const totalInstructorsEl = document.getElementById('total-instructors-stat');
    const totalCoursesEl = document.getElementById('total-courses-stat');
    const monthlyRevenueEl = document.getElementById('monthly-revenue-stat');

    if (totalStudentsEl) totalStudentsEl.textContent = studentsData.length;
    if (totalInstructorsEl) totalInstructorsEl.textContent = instructorsData.length;
    if (totalCoursesEl) totalCoursesEl.textContent = coursesData.length;

    let monthlyRevenue = 0;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const arabicMonths = { 'يناير': 0, 'فبراير': 1, 'مارس': 2, 'أبريل': 3, 'مايو': 4, 'يونيو': 5, 'يوليو': 6, 'أغسطس': 7, 'سبتمبر': 8, 'أكتوبر': 9, 'نوفمبر': 10, 'ديسمبر': 11 };

    studentsData.forEach(student => {
        const dateParts = student.date.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).split(/[\s/]+/);
        if (dateParts.length === 3) {
            const month = arabicMonths[dateParts[1]];
            const year = parseInt(dateParts[2], 10);
            if (month === currentMonth && year === currentYear) {
                const paidAmount = parseFloat(student.paid.replace(/[^\d.-]/g, '')) || 0;
                monthlyRevenue += paidAmount;
            }
        }
    });

    if (monthlyRevenueEl) {
        const currency = settingsData.currency || 'دينار';
        monthlyRevenueEl.textContent = `${monthlyRevenue.toLocaleString()} ${currency}`;
    }

    updateEnrollmentChart();
}

function updateEnrollmentChart() {
    if (!enrollmentChart) return;

    const monthlyEnrollments = Array(12).fill(0);
    const currentYear = new Date().getFullYear();
    const arabicMonthsMap = { 'يناير': 0, 'فبراير': 1, 'مارس': 2, 'أبريل': 3, 'مايو': 4, 'يونيو': 5, 'يوليو': 6, 'أغسطس': 7, 'سبتمبر': 8, 'أكتوبر': 9, 'نوفمبر': 10, 'ديسمبر': 11 };

    studentsData.forEach(student => {
        const dateParts = student.date.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).split(/[\s/]+/);
        if (dateParts.length === 3 && parseInt(dateParts[2], 10) === currentYear) {
            const month = arabicMonthsMap[dateParts[1]];
            if (month !== undefined) monthlyEnrollments[month]++;
        }
    });

    enrollmentChart.data.datasets[0].data = monthlyEnrollments;
    enrollmentChart.update();
}

const API_BASE = "/api"; // التغيير هنا ليعمل على الإنترنت ومحلياً بدون مشاكل

// Global UI Data Arrays
let studentsData = [];
let rolesData = [];
let recentStudentsData = [];
let instructorsData = [];
let coursesData = [];
let subjectsData = [];
let accountingData = [];
let usersData = [];
let notificationsData = [];
let settingsData = {};
let attendanceData = [];

// === Backend Data Communication ===
async function loadDataFromDB() {
    try {
        const response = await fetch(`${API_BASE}/data`);
        if (response.ok) {
            const db = await response.json();

            studentsData = db.students || [];
            rolesData = db.roles || db.users || [];
            recentStudentsData = db.recentStudents || [];
            instructorsData = db.instructors || [];
            coursesData = db.courses || [];
            subjectsData = db.subjects || [];
            accountingData = db.accounting || [];
            usersData = db.users || [];
            notificationsData = db.notifications || [];
            settingsData = db.settings || {};
            attendanceData = db.attendance || [];

            renderStudents();
            renderRoles();
            renderRecentStudents();
            renderInstructors();
            renderCourses();
            renderSubjects();
            renderAccounting();
            renderFinancialStudents();
            renderNotifications();
            renderSettings();
            renderClassManagement();
            renderDashboardStats();
            renderAccountingStats();
            updateSubscriptionCards();
            renderTeacherViews();
            renderParentViews();
        } else {
            console.error("Failed to fetch data.");
            alert("تنبيه: لا يمكن جلب البيانات.");
        }
    } catch (e) {
        console.error("Network or parsing error:", e);
        alert("تنبيه: لا يمكن الاتصال بقاعدة البيانات. تأكد من أن متصفحك يدعم LocalStorage.");
    }
}

// Add Student functionality
document.getElementById('addStudentForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = document.getElementById('studentFullName')?.value || '';
    const email = document.getElementById('studentEmail')?.value || '';


    // Capture multiple selected courses
    const courseSelect = document.getElementById('studentCourse');
    const selectedCourses = Array.from(courseSelect.selectedOptions).map(opt => opt.value).join('، ');

    // Financial Data
    const totalAmount = parseFloat(document.getElementById('studentTotalAmount')?.value) || 0;
    const paidAmount = parseFloat(document.getElementById('studentPaidAmount')?.value) || 0;
    const remainingAmount = Math.max(0, totalAmount - paidAmount);

    // Status Logic
    let statusText = "مستمر";
    let statusCode = "active";
    if (paidAmount < totalAmount) {
        statusText = "مطالب بالسداد";
        statusCode = "pending";
    }

    const date = new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' });

    const classSelect = document.getElementById('studentClass');
    const selectedClassId = classSelect ? classSelect.value : null;

    // التحقق من سعة الشعبة قبل الحفظ
    if (selectedClassId) {
        const cls = coursesData.find(c => c.id === selectedClassId);
        if (cls) {
            const maxStudents = parseInt(cls.capacity, 10) || parseInt(settingsData.maxStudentsPerCourse, 10) || 30;
            const currentStudents = studentsData.filter(s => s.class_id === selectedClassId).length;
            if (currentStudents >= maxStudents) {
                alert("عذراً، الشعبة المحددة ممتلئة بالكامل. يرجى اختيار شعبة أخرى.");
                return; // إيقاف عملية الحفظ
            }
        }
    }

    const newStudent = {
        name: fullName,
        email: email,
        course: '', // سيتم ملؤه لاحقاً مع الأرقام التسلسلية
        date: date,
        total: `${totalAmount} دينار`,
        paid: `${paidAmount} دينار`,
        balance: `${remainingAmount} دينار`,
        class_id: selectedClassId,
        status: statusText,
        statusCode: statusCode
    };


    const newRecent = {
        name: fullName,
        course: selectedCourses,
        date: date,
        status: statusText,
        statusCode: statusCode
    };

    // Function to find course by title
    function findCourseByTitle(title) {
        return coursesData.find(c => c.title === title);
    }

    // Function to generate a new course ID
   function generateCourseId() {
        return 'Crs-' + Date.now();
    }

    let coursesWithSerials = [];

    // Update course student count and handle new course creation if needed
    selectedCourses.split('، ').forEach(selectedCourseTitle => {
        const course = findCourseByTitle(selectedCourseTitle.trim());
        if (course) {
            const currentStudentCount = parseInt(course.students, 10) || 0;
            let serialInCourse;

            if (currentStudentCount < 30) {
                serialInCourse = currentStudentCount + 1;
                course.students = serialInCourse; // تحديث عدد الطلاب في الدورة
                newStudent[`serial_${course.id}`] = serialInCourse; // تخزين الرقم التسلسلي الخام
                coursesWithSerials.push(`${course.title} (ر.ت: ${serialInCourse})`); // إضافة النص المنسق للعرض
            } else {
                // Create a new course if the limit is reached
                serialInCourse = 1; // هو أول طالب في الدورة الجديدة
                const newCourse = {
                    id: generateCourseId(),
                    title: `${course.title} - نسخة جديدة`, // Naming convention for new courses
                    subject: course.subject,
                    instructor: course.instructor,
                    duration: course.duration,
                    students: serialInCourse, // البدء بطالب واحد
                    img: course.img // You might want to handle image duplication differently
                };

                coursesData.push(newCourse);
                newStudent[`serial_${newCourse.id}`] = serialInCourse; // تخزين الرقم التسلسلي للدورة الجديدة
                coursesWithSerials.push(`${newCourse.title} (ر.ت: ${serialInCourse})`); // إضافة النص المنسق للعرض
            }
        } else {
            // في حال لم يتم العثور على الدورة، أضف العنوان فقط
            coursesWithSerials.push(selectedCourseTitle.trim());
        }
    });

    try {
        const res = await fetch(`${API_BASE}/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student: newStudent, recent: newRecent })
        });

        if (res.ok) {
            await loadDataFromDB();

            alert('تم إضافة الطالب بنجاح!');
            closeModal('student-modal');
            document.getElementById('addStudentForm').reset();
        }
    } catch (err) {
        alert("تعذر حفظ البيانات.");
    }
});

// Edit Student Logic

function editStudent(id) {
    const student = studentsData.find(s => s.id === id);
    if (!student) return;

    document.getElementById('editStudentId').value = student.id;
    document.getElementById('editStudentFullName').value = student.name;
    document.getElementById('editStudentEmail').value = student.email;

    // فتح النافذة أولاً لضمان تعبئة القوائم المنسدلة
    openModal('edit-student-modal');

    const courseSelect = document.getElementById('editStudentCourse');
    const coursesArray = student.course.split('،').map(c => c.trim());
    Array.from(courseSelect.options).forEach(opt => {
        opt.selected = coursesArray.includes(opt.value);
    });

    // ربط الشعبة بالطالب
    const classSelect = document.getElementById('editStudentClass');
    if (classSelect) {
        classSelect.setAttribute('data-current-class', student.class_id || '');
        
        courseSelect.removeEventListener('change', filterClassesForEditStudent);
        courseSelect.addEventListener('change', filterClassesForEditStudent);
        classSelect.removeEventListener('change', updateEditStudentSerial);
        classSelect.addEventListener('change', updateEditStudentSerial);

        filterClassesForEditStudent();
    }

    const totalNum = parseFloat(student.total ? student.total.replace(/[^\d.-]/g, '') : 0) || 0;
    const paidNum = parseFloat(student.paid ? student.paid.replace(/[^\d.-]/g, '') : 0) || 0;

    document.getElementById('editStudentTotalAmount').value = totalNum;
    document.getElementById('editStudentPaidAmount').value = paidNum;
    calculateEditRemaining();
}

document.getElementById('editStudentForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('editStudentId').value;
    const fullName = document.getElementById('editStudentFullName').value;
    const email = document.getElementById('editStudentEmail').value;

    const courseSelect = document.getElementById('editStudentCourse');
    const selectedCourses = Array.from(courseSelect.selectedOptions).map(opt => opt.value).join('، ');

    const classSelect = document.getElementById('editStudentClass');
    const selectedClassId = classSelect ? classSelect.value : null;

    const originalStudent = studentsData.find(s => s.id === id);

    // التحقق من سعة الشعبة في حال تم نقل الطالب لشعبة جديدة
    if (selectedClassId && (selectedClassId !== originalStudent.class_id)) {
        const cls = coursesData.find(c => c.id === selectedClassId);
        if (cls) {
            if (originalStudent.class_id) {
                const oldCls = coursesData.find(c => c.id === originalStudent.class_id);
                if (oldCls) {
                    oldCls.students = Math.max(0, (parseInt(oldCls.students, 10) || 0) - 1).toString();
                }
            }
        }
    }

    const totalAmount = parseFloat(document.getElementById('editStudentTotalAmount').value) || 0;
    const paidAmount = parseFloat(document.getElementById('editStudentPaidAmount').value) || 0;
    const remainingAmount = Math.max(0, totalAmount - paidAmount);

    let statusText = "مستمر";
    let statusCode = "active";
    if (paidAmount < totalAmount) {
        statusText = "مطالب بالسداد";
        statusCode = "pending";
    }

    const updates = {
        name: fullName,
        email: email,
        course: selectedCourses,
        class_id: selectedClassId,
        total: `${totalAmount} دينار`,
        paid: `${paidAmount} دينار`,
        balance: `${remainingAmount} دينار`,
        status: statusText,
        statusCode: statusCode
    };

    try {
        const res = await fetch(`${API_BASE}/students/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student: updates })
        });
        if (res.ok) {
            await loadDataFromDB();
            alert('تم تعديل بيانات الطالب بنجاح!');
            closeModal('edit-student-modal');
        } else {
            alert('فشل في التعديل');
        }
    } catch (e) {
        alert("خطأ في حفظ التعديلات");
    }
});

async function deleteStudent(id) {
    if (confirm('هل أنت متأكد من حذف هذا الطالب نهائياً؟')) {
        try {
            const res = await fetch(`${API_BASE}/students/${id}`, { method: 'DELETE' });
            if (res.ok) {
                await loadDataFromDB();
            }
        } catch (e) {
            alert("خطأ في الحذف");
        }
    }
}

// Roles Forms
document.getElementById('addRoleForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    addRole();
});

// === Role Rendering & Management ===
function renderRoles(data = rolesData) {
    const tbody = document.getElementById("roles-table-body");
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">لا توجد بيانات مطابقة للبحث</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map((r, index) => `
        <tr>
            <td>
                <div class="user-cell">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(r.name)}&background=random" alt="Avatar">
                    <div class="user-info">
                        <h4>${r.name}</h4>
                    </div>
                </div>
            </td>
            <td>${r.email}</td>
            <td>${r.date}</td>
            <td><span class="status-badge status-${r.statusCode}">${r.role}</span></td>
            <td>
                <select class="form-select" style="padding: 6px 10px; width: 140px;" onchange="updateRoleType('${r.email}', this.value)">
                    <option ${r.roleCode === 'admin' ? 'selected' : ''} value="admin">مدير النظام</option>
                    <option ${r.roleCode === 'teacher' ? 'selected' : ''} value="teacher">المدرس</option>
                    <option ${r.roleCode === 'parent' ? 'selected' : ''} value="parent">ولي الأمر</option>
                </select>
            </td>
            <td>
                <button class="btn-icon" title="تعديل" onclick="editRole('${r.email}')"><i class='bx bx-edit'></i></button>
                <button class="btn-icon" style="color: var(--danger-color);" title="حذف" onclick="deleteRole('${r.email}')"><i class='bx bx-trash'></i></button>
            </td>
        </tr>
    `).join('');
}

function filterRoles() {
    const searchTerm = document.getElementById('roles-search')?.value.toLowerCase() || '';
    const filterTerm = document.getElementById('roles-filter')?.value || 'all';

    const filteredData = rolesData.filter(r => {
        const matchesSearch = r.name.toLowerCase().includes(searchTerm) || r.email.toLowerCase().includes(searchTerm);
        const matchesFilter = filterTerm === 'all' || r.roleCode === filterTerm;
        return matchesSearch && matchesFilter;
    });

    renderRoles(filteredData);
}

function filterClassesForRole() {
    const subject = document.getElementById('newRoleSubject')?.value;
    const classSelect = document.getElementById('newRoleClass');
    if (!classSelect) return;
    
    const classesList = coursesData.filter(c => c.duration === 'غير محدد' || c.title.includes(' - نسخة جديدة'));
    const filtered = subject ? classesList.filter(c => c.subject === subject) : classesList;
    
    classSelect.innerHTML = filtered.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
}

function filterClassesForEditRole() {
    const subject = document.getElementById('editRoleSubject')?.value;
    const classSelect = document.getElementById('editRoleClass');
    if (!classSelect) return;
    
    const classesList = coursesData.filter(c => c.duration === 'غير محدد' || c.title.includes(' - نسخة جديدة'));
    const filtered = subject ? classesList.filter(c => c.subject === subject) : classesList;
    
    classSelect.innerHTML = filtered.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
}

function toggleRoleFields() {
    const type = document.getElementById('newRoleType')?.value;
    const subjectGroup = document.getElementById('roleSubjectGroup');
    const classGroup = document.getElementById('roleClassGroup');
    const studentGroup = document.getElementById('roleStudentGroup');
    const subjectSelect = document.getElementById('newRoleSubject');
    const classSelect = document.getElementById('newRoleClass');
    const studentSelect = document.getElementById('newRoleStudent');

    if (!type || !subjectGroup || !studentGroup) return;

    if (type === 'teacher') {
        subjectGroup.style.display = 'block';
        if (classGroup) classGroup.style.display = 'block';
        studentGroup.style.display = 'none';
        if (subjectSelect) subjectSelect.required = true;
        if (classSelect) classSelect.required = false;
        if (studentSelect) studentSelect.required = false;
    } else if (type === 'parent') {
        subjectGroup.style.display = 'none';
        if (classGroup) classGroup.style.display = 'none';
        studentGroup.style.display = 'block';
        if (subjectSelect) subjectSelect.required = false;
        if (classSelect) classSelect.required = false;
        if (studentSelect) studentSelect.required = true;
    } else {
        subjectGroup.style.display = 'none';
        if (classGroup) classGroup.style.display = 'none';
        studentGroup.style.display = 'none';
        if (subjectSelect) subjectSelect.required = false;
        if (classSelect) classSelect.required = false;
        if (studentSelect) studentSelect.required = false;
    }
}

document.getElementById('roles-search')?.addEventListener('input', filterRoles);
document.getElementById('roles-filter')?.addEventListener('change', filterRoles);

async function addRole() {
    const name = document.getElementById('newRoleName').value;
    const email = document.getElementById('newRoleEmail').value;
    const password = document.getElementById('newRolePassword').value;
    const type = document.getElementById('newRoleType').value;

    let roleName = type === 'admin' ? 'مدير النظام' : type === 'teacher' ? 'المدرس' : 'ولي الأمر';
    let statusCode = 'active';

    const newRole = {
        name: name,
        email: email,
        password: password,
        date: new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' }),
        role: roleName,
        roleCode: type,
        statusCode: statusCode
    };

    try {
        const response = await fetch(`${API_BASE}/roles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newRole)
        });

        const result = await response.json();
        if (!response.ok) {
            alert(result.error);
            return;
        }

        // إنشاء مدرس آلياً إذا كانت الصلاحية "معلم"
        if (type === 'teacher') {
            const spec = document.getElementById('newRoleSubject').value;
            const newInstructor = { id: 'Inst-' + Date.now(), name: name, spec: spec, phone: '', img: '' };
            try {
                await fetch(`${API_BASE}/update/instructors`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newInstructor)
                });
                
                // ربط الشعب بالمعلم
                const classOptions = document.getElementById('newRoleClass').selectedOptions;
                const classIds = Array.from(classOptions).map(opt => opt.value);
                for(let classId of classIds) {
                    const cls = coursesData.find(c => c.id === classId);
                    if(cls) {
                        await fetch(`${API_BASE}/courses/${classId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ instructor: name })
                        });
                    }
                }
            } catch (e) { console.error("Error creating instructor:", e); }
        }

        // ربط حساب ولي الأمر بالطلاب المعنيين (من خلال تحديث بريد الطالب لمطابقة بريد ولي الأمر)
        if (type === 'parent') {
            const studentOptions = document.getElementById('newRoleStudent').selectedOptions;
            const studentIds = Array.from(studentOptions).map(opt => opt.value);
            
            for (let studentId of studentIds) {
                const student = studentsData.find(s => s.id === studentId);
                if (student) {
                    const updates = { ...student, email: email };
                    try {
                        await fetch(`${API_BASE}/students/${studentId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ student: updates })
                        });
                    } catch (e) { console.error("Error linking student:", e); }
                }
            }
        }

        await loadDataFromDB(); // تحديث جميع البيانات لتعكس التغييرات
        closeModal('add-role-modal');
        document.getElementById('addRoleForm').reset();
        if (typeof toggleRoleFields === 'function') toggleRoleFields();
        alert('تم إضافة المستخدم بنجاح!');
    } catch (e) {
        alert("تعذر الحفظ.");
    }
}

async function deleteRole(email) {
    if (confirm('هل أنت متأكد من حذف هذا المستخدم وصلاحياته؟')) {
        try {
            const response = await fetch(`${API_BASE}/roles/${email}`, { method: 'DELETE' });
            if (response.ok) {
                const result = await response.json();
                rolesData = result.roles;
                renderRoles();
            }
        } catch (e) {
            alert("فشل الحذف.");
        }
    }
}

async function updateRoleType(email, newType) {
    let roleName = newType === 'admin' ? 'مدير النظام' : newType === 'teacher' ? 'المدرس' : 'ولي الأمر';
    let statusCode = 'active';

    try {
        const response = await fetch(`${API_BASE}/roles/${email}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roleCode: newType, role: roleName, statusCode: statusCode })
        });

        if (response.ok) {
            const result = await response.json();
            rolesData = result.roles;
            renderRoles();
            alert('تم تحديث الصلاحية بنجاح!');
        }
    } catch (e) {
        alert("تعذر حفظ التحديث.");
    }
}

function toggleEditRoleFields() {
    const type = document.getElementById('editRoleType')?.value;
    const subjectGroup = document.getElementById('editRoleSubjectGroup');
    const classGroup = document.getElementById('editRoleClassGroup');
    const studentGroup = document.getElementById('editRoleStudentGroup');
    const subjectSelect = document.getElementById('editRoleSubject');
    const classSelect = document.getElementById('editRoleClass');
    const studentSelect = document.getElementById('editRoleStudent');

    if (!type || !subjectGroup || !studentGroup) return;

    if (type === 'teacher') {
        subjectGroup.style.display = 'block';
        if (classGroup) classGroup.style.display = 'block';
        studentGroup.style.display = 'none';
        if (subjectSelect) subjectSelect.required = true;
        if (classSelect) classSelect.required = false;
        if (studentSelect) studentSelect.required = false;
    } else if (type === 'parent') {
        subjectGroup.style.display = 'none';
        if (classGroup) classGroup.style.display = 'none';
        studentGroup.style.display = 'block';
        if (subjectSelect) subjectSelect.required = false;
        if (classSelect) classSelect.required = false;
        if (studentSelect) studentSelect.required = true;
    } else {
        subjectGroup.style.display = 'none';
        if (classGroup) classGroup.style.display = 'none';
        studentGroup.style.display = 'none';
        if (subjectSelect) subjectSelect.required = false;
        if (classSelect) classSelect.required = false;
        if (studentSelect) studentSelect.required = false;
    }
}

function editRole(email) {
    const role = rolesData.find(r => r.email === email);
    if (!role) return;

    openModal('edit-role-modal');

    document.getElementById('editRoleOriginalEmail').value = role.email;
    document.getElementById('editRoleName').value = role.name;
    document.getElementById('editRoleEmail').value = role.email;
    const pw = document.getElementById('editRolePassword');
    if (pw) pw.value = '';
    document.getElementById('editRoleType').value = role.roleCode;

    toggleEditRoleFields();

    if (role.roleCode === 'teacher') {
        const inst = instructorsData.find(i => i.name === role.name);
        if (inst && document.getElementById('editRoleSubject')) {
            document.getElementById('editRoleSubject').value = inst.spec;
            filterClassesForEditRole();
        }
        
        const classSelect = document.getElementById('editRoleClass');
        if (classSelect) {
            const teacherClasses = coursesData.filter(c => c.instructor === role.name).map(c => c.id);
            Array.from(classSelect.options).forEach(opt => {
                opt.selected = teacherClasses.includes(opt.value);
            });
        }
    } else if (role.roleCode === 'parent') {
        const parentStudents = studentsData.filter(s => s.email === role.email).map(s => s.id);
        const studentSelect = document.getElementById('editRoleStudent');
        if (studentSelect) {
            Array.from(studentSelect.options).forEach(opt => {
                opt.selected = parentStudents.includes(opt.value);
            });
        }
    }
}

document.getElementById('editRoleForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const originalEmail = document.getElementById('editRoleOriginalEmail').value;
    const name = document.getElementById('editRoleName').value;
    const password = document.getElementById('editRolePassword').value;
    const type = document.getElementById('editRoleType').value;

    let roleName = type === 'admin' ? 'مدير النظام' : type === 'teacher' ? 'المدرس' : 'ولي الأمر';
    let statusCode = 'active';

    const updates = {
        name: name,
        password: password,
        role: roleName,
        roleCode: type,
        statusCode: statusCode
    };

    try {
        const response = await fetch(`${API_BASE}/roles/${originalEmail}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });

        if (!response.ok) {
            alert('فشل تحديث الصلاحية');
            return;
        }

        if (type === 'teacher') {
            const spec = document.getElementById('editRoleSubject').value;
            const originalRole = rolesData.find(r => r.email === originalEmail);
            const oldName = originalRole ? originalRole.name : name;
            const inst = instructorsData.find(i => i.name === oldName);
            if (inst) {
                await fetch(`${API_BASE}/instructors/${inst.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: name, spec: spec })
                });
            } else {
                const newInstructor = { id: 'Inst-' + Date.now(), name: name, spec: spec, phone: '', img: '' };
                await fetch(`${API_BASE}/update/instructors`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newInstructor)
                });
            }
            
            // تحديث الشعب المرتبطة بالمعلم
            const classOptions = document.getElementById('editRoleClass').selectedOptions;
            const selectedClassIds = Array.from(classOptions).map(opt => opt.value);
            
            const previousClasses = coursesData.filter(c => c.instructor === oldName);
            for (let c of previousClasses) {
                if (!selectedClassIds.includes(c.id)) {
                    await fetch(`${API_BASE}/courses/${c.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ instructor: 'غير محدد' })
                    });
                }
            }

            for (let classId of selectedClassIds) {
                await fetch(`${API_BASE}/courses/${classId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ instructor: name })
                });
            }
        }

        if (type === 'parent') {
            const studentOptions = document.getElementById('editRoleStudent').selectedOptions;
            const selectedStudentIds = Array.from(studentOptions).map(opt => opt.value);
            
            const previousStudents = studentsData.filter(s => s.email === originalEmail);
            for (let s of previousStudents) {
                if (!selectedStudentIds.includes(s.id)) {
                    await fetch(`${API_BASE}/students/${s.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ student: { ...s, email: '' } })
                    });
                }
            }

            for (let studentId of selectedStudentIds) {
                const student = studentsData.find(s => s.id === studentId);
                if (student && student.email !== originalEmail) {
                    await fetch(`${API_BASE}/students/${studentId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ student: { ...student, email: originalEmail } })
                    });
                }
            }
        }

        await loadDataFromDB();
        closeModal('edit-role-modal');
        alert('تم تعديل المستخدم بنجاح!');
    } catch (e) {
        alert("تعذر الحفظ.");
    }
});


// === Render Other UI Elements ===
function renderRecentStudents() {
    const tbody = document.getElementById("recent-students-tbody");
    if (!tbody) return;
    tbody.innerHTML = recentStudentsData.map(s => `
        <tr>
            <td>
                <div class="user-cell">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=random" alt="Avatar">
                    <div class="user-info">
                        <h4>${s.name}</h4>
                    </div>
                </div>
            </td>
            <td>${s.course}</td>
            <td>${s.date}</td>
            <td><span class="status-badge status-${s.statusCode}">${s.status}</span></td>
        </tr>
    `).join('');
}

function renderStudents() {
    const tbody = document.getElementById("students-table-body");
    if (!tbody) return;
    tbody.innerHTML = studentsData.map((s) => {
        let className = "غير محدد";
        let studentSerial = "-";

        // استخراج اسم الشعبة وحساب رقم التسلسل الخاص بالطالب
        if (s.class_id) {
            const cls = coursesData.find(c => c.id === s.class_id);
            if (cls) {
                className = cls.title;
                // حساب رقم الطالب بناءً على تاريخ وأولوية تسجيله في الشعبة المحددة
                const classStudents = studentsData.filter(student => student.class_id === s.class_id);
                const serialIndex = classStudents.findIndex(student => student.id === s.id);
                if (serialIndex !== -1) studentSerial = serialIndex + 1;
            }
        } else {
            // كحل بديل لاستخراج التسلسل من اسم الدورة مباشرة إن لم تكن هناك شعبة مرتبطة
            const match = s.course.match(/\(ر\.ت:\s*(\d+)\)/);
            if (match) {
                studentSerial = match[1];
            }
        }

        return `

        <tr>
            <td><strong>${s.id}</strong></td>

            <td>
                <div class="user-cell">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=random" alt="Avatar">
                    <div class="user-info">
                        <h4>${s.name}</h4>
                        <p>${s.email}</p>
                    </div>
                </div>
            </td>

            <td>${s.course}</td>
            <td><span class="badge" style="background: var(--bg-hover); color: var(--text-main); border: 1px solid var(--border-color);">${className}</span></td>
            <td><strong>${studentSerial}</strong></td>
            <td>${s.date}</td>
            <td dir="ltr" style="text-align: right; color: ${s.balance === '0 دينار' ? 'inherit' : 'var(--danger-color)'}; font-weight: bold;">
                المتبقي: ${s.balance || "0 دينار"}
            </td>
            <td><span class="status-badge status-${s.statusCode}">${s.status}</span></td>
            <td>
                <button class="btn-icon" title="طباعة الوصل" onclick="printReceipt('${s.id}')" style="color: var(--primary-color);"><i class='bx bx-printer'></i></button>
                <button class="btn-icon" title="تعديل" onclick="editStudent('${s.id}')"><i class='bx bx-edit'></i></button>
                <button class="btn-icon" title="حذف" style="color: var(--danger-color);" onclick="deleteStudent('${s.id}')"><i class='bx bx-trash'></i></button>
            </td>
        </tr>
    `}).join('');
}

// === Print Receipt Logic ===
function printReceipt(id) {
    const student = studentsData.find(s => s.id === id);
    if (!student) {
        alert("لم يتم العثور على بيانات الطالب!");
        return;
    }

    // Populate Print Container with Student Data
    document.getElementById('print-student-id').textContent = student.id;
    document.getElementById('print-student-name').textContent = student.name;
    document.getElementById('print-student-course').textContent = student.course;

    // حساب وعرض اسم الشعبة ورقم الطالب في الوصل
    let className = "غير محدد";
    let studentSerial = "-";
    if (student.class_id) {
        const cls = coursesData.find(c => c.id === student.class_id);
        if (cls) {
            className = cls.title;
            const classStudents = studentsData.filter(s => s.class_id === student.class_id);
            const serialIndex = classStudents.findIndex(s => s.id === student.id);
            if (serialIndex !== -1) studentSerial = serialIndex + 1;
        }
    } else {
        const match = student.course.match(/\(ر\.ت:\s*(\d+)\)/);
        if (match) {
            studentSerial = match[1];
        }
    }
    if (document.getElementById('print-student-class')) document.getElementById('print-student-class').textContent = className;
    if (document.getElementById('print-student-serial')) document.getElementById('print-student-serial').textContent = studentSerial;

    const today = new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    document.getElementById('print-date').textContent = today;

    // Financial Data
    document.getElementById('print-total-amount').textContent = student.total || '0 دينار';
    document.getElementById('print-paid-amount').textContent = student.paid || '0 دينار';

    // If balance includes a minus, or is plain $0, we ensure it shows properly
    const remainingText = student.balance || '0 دينار';
    document.getElementById('print-remaining-amount').textContent = remainingText;

    // Trigger Print Command
    window.print();
}

function renderInstructors() {
    const grid = document.getElementById("instructors-grid");
    if (!grid) return;
    grid.innerHTML = instructorsData.map(i => `
        <div class="card person-card">
            <div class="person-img-wrapper">
                <img src="${i.img || `https://ui-avatars.com/api/?name=${encodeURIComponent(i.name)}&background=random&size=150`}" alt="${i.name}">
            </div>
            <h3>${i.name}</h3>
            <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 15px;">${i.spec}</p>
            <div style="background: var(--bg-color); padding: 8px 16px; border-radius: 8px; display: inline-flex; align-items: center; gap: 8px; margin-bottom: 20px;">
                <i class='bx bx-phone' style="color: var(--primary-color);"></i>
                <span dir="ltr" style="font-weight: 600;">${i.phone || 'غير متوفر'}</span>
            </div>
            <div style="margin-top: auto; display: flex; justify-content: center; gap: 10px; width: 100%;">
                <button class="btn btn-icon" title="تعديل" onclick="editInstructor('${i.id}')"><i class='bx bx-edit'></i></button>
                <button class="btn btn-icon" title="حذف" style="color: var(--danger-color);" onclick="deleteInstructor('${i.id}')"><i class='bx bx-trash'></i></button>
            </div>
        </div>
    `).join('');
}

function editInstructor(id) {
    const instructor = instructorsData.find(i => i.id === id);
    if (!instructor) return;

    const idInput = document.getElementById('editInstructorId');
    const nameInput = document.getElementById('editInstructorName');
    const subjectInput = document.getElementById('editInstructorSubject');
    const phoneInput = document.getElementById('editInstructorPhone');

    if (idInput) idInput.value = instructor.id;
    if (nameInput) nameInput.value = instructor.name;
    if (phoneInput) phoneInput.value = instructor.phone || '';

    // تعبئة قائمة المواد وتحديد المادة الحالية للمدرس
    if (subjectInput) {
        subjectInput.innerHTML = `<option value="">-- حدد المادة --</option>` + 
            subjectsData.map(s => `<option value="${s.name}" ${s.name === instructor.spec ? 'selected' : ''}>${s.name}</option>`).join('');
    }

    openModal('edit-instructor-modal');
}

document.getElementById('editInstructorForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('editInstructorId').value;
    const name = document.getElementById('editInstructorName').value;
    const spec = document.getElementById('editInstructorSubject').value;
    const phone = document.getElementById('editInstructorPhone').value;

    const updates = { name, spec, phone };

    try {
        const res = await fetch(`${API_BASE}/instructors/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        
        if (res.ok) {
            const index = instructorsData.findIndex(i => i.id === id);
            if (index !== -1) {
                instructorsData[index] = { ...instructorsData[index], ...updates };
                renderInstructors();
            }
            closeModal('edit-instructor-modal');
            alert('تم تعديل بيانات المدرس بنجاح!');
        } else {
            alert('فشل في التعديل.');
        }
    } catch (e) {
        alert("خطأ في الحفظ.");
    }
});

async function deleteInstructor(id) {
    if (confirm('هل أنت متأكد من حذف هذا المدرس نهائياً؟')) {
        try {
            const res = await fetch(`${API_BASE}/instructors/${id}`, { method: 'DELETE' });
            if (res.ok) {
                instructorsData = instructorsData.filter(i => i.id !== id);
                renderInstructors();
            } else {
                alert('حدث خطأ أثناء الحذف.');
            }
        } catch (e) {
            alert('خطأ في الحذف.');
        }
    }
}

function renderCourses() {
    const grid = document.getElementById("courses-grid");
    if (!grid) return;
    
    // عرض الدورات التدريبية الأساسية فقط في صفحة "الدورات التدريبية" لاستبعاد الشعب
    const trainingCourses = coursesData.filter(c => c.duration !== 'غير محدد' && !c.title.includes(' - نسخة جديدة'));
    grid.innerHTML = trainingCourses.map(c => `
        <div class="card course-card">
            <div class="course-img-wrapper">
                <img src="${c.img || 'https://via.placeholder.com/300x200'}" alt="${c.title}" class="course-img">
                <span class="course-subject-badge">${c.subject}</span>
            </div>
            <div class="card-body">
                <h3 class="course-title">${c.title}</h3>
                <div class="course-meta">
                    <span><i class='bx bx-user'></i> ${c.instructor}</span>
                    <span><i class='bx bx-time'></i> ${c.duration}</span>
                </div>
                <div class="course-footer d-flex justify-between align-center mt-4">
                    <div class="students-count">
                        <i class='bx bx-group'></i> <span>${c.students} متدرب</span>
                    </div>
                    <div class="course-actions" style="display: flex; gap: 5px;">
                        <button class="btn btn-icon" title="تعديل" onclick="editCourse('${c.id}')"><i class='bx bx-edit'></i></button>
                        <button class="btn btn-icon" title="حذف" style="color: var(--danger-color);" onclick="deleteCourse('${c.id}')"><i class='bx bx-trash'></i></button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// === Class Management Page ===
function renderClassManagement() {
    const container = document.getElementById("class-management-content");
    if (!container) return;

    // 1. Group courses by base name
    const courseGroups = {};
    // This regex will find the base name of a course, stripping " - نسخة جديدة" or " - مجموعة جديدة"
    const baseNameRegex = /^(.*?)(?:\s*-\s*(?:نسخة جديدة|مجموعة جديدة))?$/;

    coursesData.forEach(course => {
        const match = course.title.match(baseNameRegex);
        const baseName = match ? match[1].trim() : course.title.trim();
        
        if (!courseGroups[baseName]) {
            courseGroups[baseName] = [];
        }
        courseGroups[baseName].push(course);
    });

    // 2. Generate HTML from the groups
    let html = '';
    if (Object.keys(courseGroups).length === 0) {
        container.innerHTML = '<p style="text-align:center; padding: 20px;">لا توجد دورات لعرضها.</p>';
        return;
    }

    for (const groupName in courseGroups) {
        const classes = courseGroups[groupName];
        const totalStudentsInGroup = classes.reduce((sum, c) => sum + studentsData.filter(s => s.class_id === c.id).length, 0);

        html += `
            <div class="card class-group-card">
                <div class="card-header">
                    <h3>${groupName}</h3>
                    <div class="class-group-meta">
                        <span><i class='bx bx-sitemap'></i> ${classes.length} شعبة</span>
                        <span><i class='bx bx-group'></i> ${totalStudentsInGroup} متدرب</span>
                    </div>
                </div>
                <div class="card-body">
                    <ul class="class-list">
        `;

        classes.sort((a, b) => a.id.localeCompare(b.id));

        classes.forEach(cls => {
            const maxStudents = parseInt(cls.capacity, 10) || parseInt(settingsData.maxStudentsPerCourse, 10) || 30;
            const studentCount = studentsData.filter(s => s.class_id === cls.id).length;
            const isFull = studentCount >= maxStudents;
            const progress = Math.min(100, (studentCount / maxStudents) * 100);
            html += `
                <li class="class-item">
                    <div class="class-info">
                        <span class="class-title">${cls.title}</span>
                        <span class="class-instructor"><i class='bx bx-user'></i> ${cls.instructor}</span>
                    </div>
                    <div class="class-stats" style="display: flex; align-items: center; gap: 10px;">
                        <div>
                            <span class="class-students ${isFull ? 'full' : ''}">
                                <i class='bx bx-group'></i> ${studentCount} / ${maxStudents}
                            </span>
                            <div class="progress-bar">
                                <div class="progress" style="width: ${progress}%;"></div>
                            </div>
                        </div>
                        <div style="display: flex; gap: 5px;">
                            <button class="btn btn-icon" title="طباعة تقرير الشعبة" onclick="printClassReport('${cls.id}')" style="color: var(--primary-color); padding: 5px; border: 1px solid var(--border-color);"><i class='bx bx-printer'></i></button>
                            <button class="btn btn-icon" title="تعديل الشعبة" onclick="editClass('${cls.id}')" style="color: #f59e0b; padding: 5px; border: 1px solid var(--border-color);"><i class='bx bx-edit'></i></button>
                            <button class="btn btn-icon" title="حذف الشعبة" onclick="deleteClass('${cls.id}')" style="color: var(--danger-color); padding: 5px; border: 1px solid var(--border-color);"><i class='bx bx-trash'></i></button>
                        </div>
                    </div>
                </li>
            `;
        });

        html += `
                    </ul>
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

// === Print Class Report Logic ===
function printClassReport(classId) {
    const course = coursesData.find(c => c.id === classId);
    if (!course) {
        alert("لم يتم العثور على بيانات الشعبة!");
        return;
    }

    // Find students in this course
    let studentsInCourse = studentsData.filter(s => s.hasOwnProperty(`serial_${course.id}`));
    
    // Fallback for older data without serial keys
    if (studentsInCourse.length === 0) {
         studentsInCourse = studentsData.filter(s => s.course && s.course.includes(course.title));
    }
    
    // Sort students by their serial number if available
    studentsInCourse.sort((a, b) => (a[`serial_${course.id}`] || 0) - (b[`serial_${course.id}`] || 0));

    let reportHtml = `
        <div dir="rtl" style="font-family: 'Cairo', sans-serif; padding: 20px; max-width: 800px; margin: auto;">
            <div style="text-align: center; border-bottom: 2px solid #333; margin-bottom: 20px; padding-bottom: 10px;">
                <h2>${settingsData.instituteName || 'المركز التعليمي'}</h2>
                <h3>تقرير شعبة: ${course.title}</h3>
                <p><strong>المدرس:</strong> ${course.instructor} | <strong>عدد الطلاب:</strong> ${studentsInCourse.length} / ${settingsData.maxStudentsPerCourse || 30}</p>
            </div>
            <table style="width: 100%; border-collapse: collapse; text-align: right; font-size: 14px;">
                <thead>
                    <tr style="background-color: #f3f4f6;">
                        <th style="border: 1px solid #ddd; padding: 8px; width: 50px; text-align: center;">ر.ت</th>
                        <th style="border: 1px solid #ddd; padding: 8px;">اسم الطالب</th>
                        <th style="border: 1px solid #ddd; padding: 8px;">الرصيد المتبقي</th>
                        <th style="border: 1px solid #ddd; padding: 8px;">الحالة</th>
                    </tr>
                </thead>
                <tbody>
                    ${studentsInCourse.length > 0 ? studentsInCourse.map((student, index) => `
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${student[`serial_${course.id}`] || index + 1}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${student.name}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; color: ${student.balance === '0 دينار' ? 'inherit' : 'red'};">${student.balance || '0 دينار'}</td>
                            <td style="border: 1px solid #ddd; padding: 8px;">${student.status}</td>
                        </tr>
                    `).join('') : `<tr><td colspan="4" style="text-align: center; border: 1px solid #ddd; padding: 8px;">لا يوجد طلاب مسجلين في هذه الشعبة حالياً.</td></tr>`}
                </tbody>
            </table>
            <div style="margin-top: 30px; text-align: left; font-size: 12px; color: #666;">
                تاريخ الطباعة: ${new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date())}
            </div>
        </div>
    `;

    // Create a hidden iframe for clean printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
        <html>
        <head>
            <title>طباعة تقرير الشعبة</title>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Cairo', sans-serif; }
                @media print { @page { margin: 1cm; } }
            </style>
        </head>
        <body>${reportHtml}</body>
        </html>
    `);
    doc.close();

    iframe.contentWindow.focus();
    // Timeout to allow the Cairo font to load before opening print dialog
    setTimeout(() => {
        iframe.contentWindow.print();
        document.body.removeChild(iframe);
    }, 500);
}

// === Edit and Delete Class Logic ===
function editClass(id) {
    const cls = coursesData.find(c => c.id === id);
    if (!cls) return;

    document.getElementById('editClassId').value = cls.id;
    document.getElementById('editClassName').value = cls.title;
    document.getElementById('editClassCapacity').value = cls.capacity || settingsData.maxStudentsPerCourse || 30;

    const subjectSelect = document.getElementById('editClassSubject');
    if (subjectSelect) {
        subjectSelect.innerHTML = `<option value="">-- حدد المادة --</option>` +
            subjectsData.map(s => `<option value="${s.name}" ${s.name === cls.subject ? 'selected' : ''}>${s.name}</option>`).join('');
    }

    openModal('edit-class-modal');
}

async function deleteClass(id) {
    if (confirm('هل أنت متأكد من حذف هذه الشعبة نهائياً؟ ستيم إزالتها من سجلات النظام.')) {
        try {
            const res = await fetch(`${API_BASE}/courses/${id}`, { method: 'DELETE' });
            if (res.ok) {
                coursesData = coursesData.filter(c => c.id !== id);
                if (typeof renderClassManagement === 'function') renderClassManagement();
                if (typeof renderCourses === 'function') renderCourses();
            } else {
                alert('حدث خطأ أثناء الحذف.');
            }
        } catch (e) {
            alert('خطأ في الحذف.');
        }
    }
}

function editCourse(id) {
    const course = coursesData.find(c => c.id === id);
    if (!course) return;

    document.getElementById('editCourseId').value = course.id;
    document.getElementById('editCourseTitle').value = course.title;
    document.getElementById('editCourseDuration').value = course.duration;
    const subjectSelect = document.getElementById('editCourseSubject');
    if (subjectSelect) {
        subjectSelect.innerHTML = `<option value="">-- حدد المادة --</option>` +
            subjectsData.map(s => `<option value="${s.name}" ${s.name === course.subject ? 'selected' : ''}>${s.name}</option>`).join('');
    }

    const instSelect = document.getElementById('editCourseInstructor');
    if (instSelect) {
        const filteredInsts = instructorsData.filter(i => i.spec === course.subject);
        if (filteredInsts.length > 0) {
            instSelect.innerHTML = filteredInsts.map(i => `<option value="${i.name}" ${i.name === course.instructor ? 'selected' : ''}>${i.name}</option>`).join('');
        } else {
            instSelect.innerHTML = `<option value="">-- لا يوجد مدرس لهذه المادة --</option>`;
        }
    }

    openModal('edit-course-modal');
}

function filterInstructorsForEditCourse() {
    const selectedSub = document.getElementById('editCourseSubject')?.value;
    const instSelect = document.getElementById('editCourseInstructor');
    if (!instSelect) return;

    if (!selectedSub) {
        instSelect.innerHTML = `<option value="">-- حدد المدرس --</option>` + instructorsData.map(i => `<option value="${i.name}">${i.name}</option>`).join('');
        return;
    }

    const filteredInsts = instructorsData.filter(i => i.spec === selectedSub);
    if (filteredInsts.length > 0) {
        instSelect.innerHTML = filteredInsts.map(i => `<option value="${i.name}">${i.name}</option>`).join('');
    } else {
        instSelect.innerHTML = `<option value="">-- لا يوجد مدرس لهذه المادة --</option>`;
    }
}

document.getElementById('editCourseForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editCourseId').value;
    const title = document.getElementById('editCourseTitle').value;
    const subject = document.getElementById('editCourseSubject').value;
    const instructor = document.getElementById('editCourseInstructor').value;
    const duration = document.getElementById('editCourseDuration').value;
    const fileInput = document.getElementById('editCourseImg');

    let imgBase64 = "";
    const saveEditedCourse = async () => {
        
        const updates = { title, subject, instructor, duration };
        if (imgBase64) updates.img = imgBase64;
        
        try {
            const res = await fetch(`${API_BASE}/courses/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            if (res.ok) {
                const index = coursesData.findIndex(c => c.id === id);
                if (index !== -1) { coursesData[index] = { ...coursesData[index], ...updates }; renderCourses(); }
                closeModal('edit-course-modal');
                alert('تم تعديل الدورة بنجاح!');
            } else { alert('فشل في التعديل.'); }
        } catch (e) { alert("خطأ في الحفظ."); }
    };

    if (fileInput && fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = async function (event) { imgBase64 = event.target.result; await saveEditedCourse(); };
        reader.readAsDataURL(fileInput.files[0]);
    } else { await saveEditedCourse(); }
});

async function deleteCourse(id) {
    if (confirm('هل أنت متأكد من حذف هذه الدورة نهائياً؟')) {
        try {
            const res = await fetch(`${API_BASE}/courses/${id}`, { method: 'DELETE' });
            if (res.ok) { coursesData = coursesData.filter(c => c.id !== id); renderCourses(); }
        } catch (e) { alert('خطأ في الحذف.'); }
    }
}

function renderSubjects() {
    const grid = document.getElementById("subjects-grid");
    if (!grid) return;
    grid.innerHTML = subjectsData.map(s => `
        <div class="card" style="padding: 20px; text-align: center;">
            <div style="background: var(--bg-hover); width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px;">
                <i class='bx bx-book-open' style="font-size: 30px; color: var(--primary-color);"></i>
            </div>
            <h3 style="margin-bottom: 10px;">${s.name}</h3>
            <p style="font-size: 14px; color: var(--text-muted); margin-bottom: 15px;">${s.desc}</p>
            <div style="display: flex; justify-content: center; gap: 10px; margin-top: 15px;">
                <button class="btn btn-icon" title="تعديل" onclick="editSubject('${s.id}')"><i class='bx bx-edit'></i></button>
                <button class="btn btn-icon" title="حذف" style="color: var(--danger-color);" onclick="deleteSubject('${s.id}')"><i class='bx bx-trash'></i></button>
            </div>
        </div>
    `).join('');
}

function editSubject(id) {
    const subject = subjectsData.find(s => s.id === id);
    if (!subject) return;

    // إنشاء نافذة التعديل تلقائياً في حال لم يتم إضافتها في ملف HTML مسبقاً
    let modal = document.getElementById('edit-subject-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'edit-subject-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px; border-radius: 16px; overflow: hidden; box-shadow: 0 15px 40px rgba(255, 255, 255, 0.69); border: 1px solid var(--border-color);">
                <div class="modal-header" style="background: linear-gradient(135deg, var(--primary-color), #8b5cf6); color: white; padding: 25px; border-bottom: none; display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0; font-size: 1.4rem; display: flex; align-items: center; gap: 10px; font-weight: 700;">
                        <i class='bx bx-edit-alt' style="font-size: 1.8rem; background: rgba(255, 255, 255, 0.88); padding: 8px; border-radius: 10px;"></i> 
                        تعديل المادة الدراسية
                    </h2>
                    <button type="button" class="btn-icon" onclick="closeModal('edit-subject-modal')" style="color: white; background: rgba(255, 255, 255, 0.53); border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; transition: all 0.3s; backdrop-filter: blur(5px);">
                        <i class='bx bx-x' style="font-size: 24px;"></i>
                    </button>
                </div>
                <div class="modal-body" style="padding: 30px;">
                    
                    <!-- الكارت المميز للتنبيه -->
                    <div style="background: var(--bg-hover); border-right: 4px solid var(--primary-color); padding: 15px 20px; border-radius: 10px; margin-bottom: 25px; display: flex; align-items: center; gap: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                        <div style="background: rgb(78, 70, 229); color: var(--primary-color); width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <i class='bx bx-info-circle' style="font-size: 24px;"></i>
                        </div>
                        <div>
                            <h4 style="margin: 0 0 5px 0; color: var(--text-main); font-size: 15px;">تحديث بيانات المادة</h4>
                            <p style="margin: 0; color: var(--text-muted); font-size: 13px;">تأكد من صحة البيانات، أي تغيير في اسم المادة سينعكس تلقائياً على كافة الدورات والشعب المرتبطة بها.</p>
                        </div>
                    </div>

                    <form id="editSubjectForm">
                        <input type="hidden" id="editSubjectId">
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-main);">
                                <i class='bx bx-book-bookmark' style="color: var(--primary-color); margin-left: 5px;"></i> اسم المادة
                            </label>
                            <input type="text" id="editSubjectName" class="form-input" required style="width: 100%; padding: 12px 15px; border-radius: 10px; border: 1px solid var(--border-color); font-size: 14px; background: var(--bg-color); color: var(--text-main); transition: all 0.3s; box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);">
                        </div>
                        <div class="form-group" style="margin-bottom: 25px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-main);">
                                <i class='bx bx-align-left' style="color: var(--primary-color); margin-left: 5px;"></i> وصف المادة
                            </label>
                            <textarea id="editSubjectDesc" class="form-input" rows="4" style="width: 100%; padding: 12px 15px; border-radius: 10px; border: 1px solid var(--border-color); font-size: 14px; background: var(--bg-color); color: var(--text-main); transition: all 0.3s; resize: vertical; box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);"></textarea>
                        </div>
                        <div style="display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid var(--border-color); padding-top: 25px;">
                            <button type="button" class="btn" onclick="closeModal('edit-subject-modal')" style="background: var(--bg-hover); color: var(--text-main); padding: 12px 25px; border-radius: 10px; border: none; cursor: pointer; font-weight: 600; transition: all 0.3s;">إلغاء</button>
                            <button type="submit" class="btn" style="background: linear-gradient(135deg, var(--primary-color), #8b5cf6); color: #fff; padding: 12px 25px; border-radius: 10px; border: none; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3); transition: all 0.3s;"><i class='bx bx-save' style="font-size: 18px;"></i> حفظ التعديلات</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("active"); });
    }

    const idInput = document.getElementById('editSubjectId');
    const nameInput = document.getElementById('editSubjectName');
    const descInput = document.getElementById('editSubjectDesc');

    if (idInput) idInput.value = subject.id;
    if (nameInput) nameInput.value = subject.name;
    if (descInput) descInput.value = subject.desc;

    openModal('edit-subject-modal');
}

// استخدام Event Delegation لضمان استجابة زر الحفظ دائماً
document.addEventListener('submit', async (e) => {
    if (e.target && e.target.id === 'editSubjectForm') {
        e.preventDefault();
        const id = document.getElementById('editSubjectId').value;
        const name = document.getElementById('editSubjectName').value;
        const desc = document.getElementById('editSubjectDesc').value;

        const updates = { name, desc };
        try {
            const res = await fetch(`${API_BASE}/subjects/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            if (res.ok) {
                await loadDataFromDB(); 
                closeModal('edit-subject-modal');
                alert('تم تعديل المادة الدراسية بنجاح!');
            } else {
                const errorData = await res.json();
                alert(errorData.message || 'فشل في التعديل.');
            }
        } catch (err) {
            alert("خطأ في الحفظ.");
        }
    }

    // حدث تعديل السجل المالي (Event Delegation)
    if (e.target && e.target.id === 'editAccountingForm') {
        e.preventDefault();
        const id = document.getElementById('editAccId').value;
        const receipt = document.getElementById('editAccReceipt').value;
        const student = document.getElementById('editAccStudent').value;
        const amount = document.getElementById('editAccAmount').value;
        const method = document.getElementById('editAccMethod').value;
        const statusCode = document.getElementById('editAccStatus').value;
        const notes = document.getElementById('editAccNotes').value;
        const status = statusCode === 'active' ? 'مدفوع' : (statusCode === 'pending' ? 'مدفوع جزئي' : 'ملغى');

        const updates = { receipt, student, amount, method, statusCode, status, notes };
        try {
            const res = await fetch(`${API_BASE}/accounting/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            if (res.ok) {
                await loadDataFromDB(); 
                closeModal('edit-accounting-modal');
                alert('تم تعديل السجل المالي بنجاح!');
            } else { alert('فشل في التعديل.'); }
        } catch (err) { alert("خطأ في الحفظ."); }
    }
});

async function deleteSubject(id) {
    if (confirm('هل أنت متأكد من حذف هذه المادة الدراسية نهائياً؟')) {
        try {
            const res = await fetch(`${API_BASE}/subjects/${id}`, { method: 'DELETE' });
            if (res.ok) {
                subjectsData = subjectsData.filter(s => s.id !== id);
                renderSubjects();
            } else {
                const errorData = await res.json();
                alert(errorData.message || 'حدث خطأ أثناء الحذف.');
            }
        } catch (e) {
            alert('خطأ في الحذف.');
        }
    }
}

function renderFinancialStudents() {
    const tbody = document.getElementById("accounting-students-table-body");
    if (!tbody) return;

    // عرض الأحدث أولاً
    const sortedStudents = [...studentsData].reverse();

    tbody.innerHTML = sortedStudents.map(s => {
        let className = "غير محدد";
        if (s.class_id) {
            const cls = coursesData.find(c => c.id === s.class_id);
            if (cls) className = cls.title;
        }

        return `
            <tr>
                <td>
                    <div class="user-cell">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=random" alt="Avatar">
                        <div class="user-info">
                            <h4>${s.name}</h4>
                        </div>
                    </div>
                </td>
                <td>${s.course} <br><small style="color: var(--text-muted);">${className}</small></td>
                <td>${s.date}</td>
                <td>${s.total || '0 دينار'}</td>
                <td style="color: var(--primary-color); font-weight: bold;">${s.paid || '0 دينار'}</td>
                <td style="color: ${s.balance === '0 دينار' || !s.balance ? 'inherit' : 'var(--danger-color)'}; font-weight: bold;">${s.balance || '0 دينار'}</td>
                <td><span class="status-badge status-${s.statusCode}">${s.status}</span></td>
                <td>
                    <button class="btn-icon" title="تعديل" onclick="editStudent('${s.id}')" style="color: #f59e0b;"><i class='bx bx-edit'></i></button>
                    <button class="btn-icon" title="حذف" style="color: var(--danger-color);" onclick="deleteStudent('${s.id}')"><i class='bx bx-trash'></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderAccounting() {
    const tbody = document.getElementById("accounting-table-body");
    if (!tbody) return;
    const sortedAccounting = [...accountingData].sort((a, b) => b.id.localeCompare(a.id));

    tbody.innerHTML = sortedAccounting.map(a => `
        <tr>
            <td><strong>${a.receipt}</strong></td>
            <td>${a.student}</td>
            <td dir="ltr" style="text-align: right; font-weight: bold;">${a.amount}</td>
            <td>${a.date}</td>
            <td>${a.method}</td>
            <td>${a.notes || '-'}</td>
            <td><span class="status-badge status-${a.statusCode}">${a.status}</span></td>
            <td>
                <button class="btn-icon" title="تعديل" onclick="editAccounting('${a.id}')" style="color: #f59e0b;"><i class='bx bx-edit'></i></button>
                <button class="btn-icon" title="حذف" style="color: var(--danger-color);" onclick="deleteAccounting('${a.id}')"><i class='bx bx-trash'></i></button>
            </td>
        </tr>
    `).join('');
}

function editAccounting(id) {
    const acc = accountingData.find(a => a.id === id);
    if (!acc) return;

    // إنشاء نافذة التعديل تلقائياً بتصميم حديث
    let modal = document.getElementById('edit-accounting-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'edit-accounting-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px; border-radius: 16px; overflow: hidden; box-shadow: 0 15px 40px rgba(0,0,0,0.2); border: 1px solid var(--border-color);">
                <div class="modal-header" style="background: linear-gradient(135deg, var(--primary-color), #10b981); color: white; padding: 25px; border-bottom: none; display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0; font-size: 1.4rem; display: flex; align-items: center; gap: 10px; font-weight: 700;">
                        <i class='bx bx-wallet' style="font-size: 1.8rem; background: rgba(255,255,255,0.2); padding: 8px; border-radius: 10px;"></i>
                        تعديل السجل المالي
                    </h2>
                    <button type="button" class="btn-icon" onclick="closeModal('edit-accounting-modal')" style="color: white; background: rgba(255,255,255,0.2); border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; transition: all 0.3s;">
                        <i class='bx bx-x' style="font-size: 24px;"></i>
                    </button>
                </div>
                <div class="modal-body" style="padding: 30px;">
                    <form id="editAccountingForm">
                        <input type="hidden" id="editAccId">
                        <div class="form-group" style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-main);">رقم الوصل</label>
                            <input type="text" id="editAccReceipt" class="form-input" required style="width: 100%; padding: 12px 15px; border-radius: 10px; border: 1px solid var(--border-color);">
                        </div>
                        <div class="form-group" style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-main);">الطلب</label>
                            <select id="editAccStudentSelect" class="form-select" style="width: 100%; padding: 12px 15px; border-radius: 10px; border: 1px solid var(--border-color);" onchange="const inp = document.getElementById('editAccStudent'); if(this.value === 'اخرى') { inp.style.display = 'block'; inp.value = ''; inp.focus(); } else { inp.style.display = 'none'; inp.value = this.value; }">
                                <option value="اشتراك الانترنت">اشتراك الانترنت</option>
                                <option value="اشتراك المولد">اشتراك المولد</option>
                                <option value="اخرى">اخرى (طالب أو غيره)</option>
                            </select>
                            <input type="text" id="editAccStudent" class="form-input" required style="width: 100%; padding: 12px 15px; border-radius: 10px; border: 1px solid var(--border-color); display: none; margin-top: 10px;">
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-main);">المبلغ</label>
                                <input type="text" id="editAccAmount" class="form-input" required style="width: 100%; padding: 12px 15px; border-radius: 10px; border: 1px solid var(--border-color);">
                            </div>
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-main);">طريقة الدفع</label>
                            <input type="text" id="editAccMethod" class="form-input" value="نقدي" readonly style="width: 100%; padding: 12px 15px; border-radius: 10px; border: 1px solid var(--border-color); background-color: var(--bg-body); cursor: not-allowed;">
                            </div>
                        </div>
                    <div class="form-group" style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-main);">الحالة</label>
                            <select id="editAccStatus" class="form-select" style="width: 100%; padding: 12px 15px; border-radius: 10px; border: 1px solid var(--border-color);">
                                <option value="active">مدفوع</option>
                                <option value="pending">مدفوع جزئي</option>
                            </select>
                        </div>
                    <div class="form-group" style="margin-bottom: 25px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-main);">ملاحظات</label>
                        <input type="text" id="editAccNotes" class="form-input" style="width: 100%; padding: 12px 15px; border-radius: 10px; border: 1px solid var(--border-color);" placeholder="ملاحظات إضافية...">
                    </div>
                        <div style="display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid var(--border-color); padding-top: 25px;">
                            <button type="button" class="btn" onclick="closeModal('edit-accounting-modal')" style="background: var(--bg-hover); color: var(--text-main); padding: 12px 25px; border-radius: 10px; border: none; cursor: pointer; font-weight: 600;">إلغاء</button>
                            <button type="submit" class="btn" style="background: linear-gradient(135deg, var(--primary-color), #10b981); color: #fff; padding: 12px 25px; border-radius: 10px; border: none; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 8px;"><i class='bx bx-save'></i> حفظ التعديلات</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("active"); });
    }

    document.getElementById('editAccId').value = acc.id;
    document.getElementById('editAccReceipt').value = acc.receipt;
    document.getElementById('editAccAmount').value = acc.amount;
    document.getElementById('editAccMethod').value = acc.method;
    document.getElementById('editAccStatus').value = acc.statusCode;
    document.getElementById('editAccNotes').value = acc.notes || '';

    // تحديد الطلب المحفوظ مسبقاً في القائمة المنسدلة
    const editStudentSelect = document.getElementById('editAccStudentSelect');
    const editStudentInput = document.getElementById('editAccStudent');
    if (['اشتراك الانترنت', 'اشتراك المولد'].includes(acc.student)) {
        editStudentSelect.value = acc.student;
        editStudentInput.style.display = 'none';
    } else {
        editStudentSelect.value = 'اخرى';
        editStudentInput.style.display = 'block';
    }
    editStudentInput.value = acc.student;

    openModal('edit-accounting-modal');
}

async function deleteAccounting(id) {
    if (confirm('هل أنت متأكد من حذف هذا السجل المالي نهائياً؟')) {
        try {
            const res = await fetch(`${API_BASE}/accounting/${id}`, { method: 'DELETE' });
            if (res.ok) {
                await loadDataFromDB();
            } else { alert('حدث خطأ أثناء الحذف.'); }
        } catch (e) { alert('خطأ في الحذف.'); }
    }
}

function renderAccountingStats() {
    let totalExpected = 0;
    let totalCollected = 0;
    let totalLate = 0;

    let weeklyRev = 0, weeklyExp = 0;
    let monthlyRev = 0, monthlyExp = 0;
    
    const now = Date.now();
    const weekLimit = 7 * 24 * 60 * 60 * 1000;
    const monthLimit = 30 * 24 * 60 * 60 * 1000;

    // دالة مساعدة لاستخراج الطابع الزمني للتحقق من الفترة
    const parseDateToTimestamp = (dateStr, idStr) => {
        let ts = 0;
        const parts = (idStr || "").split('-');
        if (parts.length > 1) {
            const parsedTs = parseInt(parts[1], 10);
            if (!isNaN(parsedTs) && parsedTs > 1577836800000) ts = parsedTs;
        }
        if (!ts && dateStr) {
            const arabicMonthsMap = { 'يناير': 0, 'فبراير': 1, 'مارس': 2, 'أبريل': 3, 'مايو': 4, 'يونيو': 5, 'يوليو': 6, 'يوليوز': 6, 'أغسطس': 7, 'سبتمبر': 8, 'أكتوبر': 9, 'نوفمبر': 10, 'ديسمبر': 11 };
            const cleanStr = dateStr.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
            const dateParts = cleanStr.split(/[\s/.-]+/);
            if (dateParts.length >= 3) {
                let day = parseInt(dateParts[0], 10);
                let monthStr = dateParts[1];
                let year = parseInt(dateParts[2], 10);
                if (day > 1000) { year = day; day = parseInt(dateParts[2], 10); }
                
                let month = arabicMonthsMap[monthStr];
                if (month === undefined) {
                    const mNum = parseInt(monthStr, 10);
                    if (!isNaN(mNum) && mNum >= 1 && mNum <= 12) { month = mNum - 1; }
                }
                if (!isNaN(day) && month !== undefined && !isNaN(year)) {
                    ts = new Date(year, month, day).getTime();
                }
            }
        }
        return ts;
    };

    // حساب المبالغ من سجلات الطلاب
    studentsData.forEach(s => {
        const total = parseFloat(s.total ? s.total.replace(/[^\d.-]/g, '') : 0) || 0;
        const paid = parseFloat(s.paid ? s.paid.replace(/[^\d.-]/g, '') : 0) || 0;
        const balance = parseFloat(s.balance ? s.balance.replace(/[^\d.-]/g, '') : 0) || 0;

        totalExpected += total;
        totalCollected += paid;
        totalLate += balance;
        
        // حسابات دورية للطلاب (إيرادات فقط)
        const recordTs = parseDateToTimestamp(s.date, s.id);
        if (recordTs > 0) {
            const diff = now - recordTs;
            if (diff <= weekLimit) weeklyRev += paid;
            if (diff <= monthLimit) monthlyRev += paid;
        }
    });

    // حساب المبالغ من سجلات المالية العامة (إيرادات ومصروفات)
    accountingData.forEach(a => {
        const recordTs = parseDateToTimestamp(a.date, a.id);
        let amount = parseFloat((a.amount || "").toString().replace(/[^\d.-]/g, '')) || 0;
        
        // تمييز الصرفيات (مبلغ سالب، أو كلمة مصروف في البيان/الملاحظات)
        const isExpense = (a.amount || "").toString().includes('-') || (a.student || "").includes('مصروف') || (a.notes || "").includes('مصروف');
        amount = Math.abs(amount); // توحيد القيمة للجمع

        if (recordTs > 0) {
            const diff = now - recordTs;
            if (diff <= weekLimit) { if (isExpense) weeklyExp += amount; else weeklyRev += amount; }
            if (diff <= monthLimit) { if (isExpense) monthlyExp += amount; else monthlyRev += amount; }
        }
    });

    const currency = settingsData.currency || 'دينار';
    const formatMoney = (val) => `${val.toLocaleString()} ${currency}`;

    // تحديث واجهة قسم المالية
    const elExpected = document.getElementById('acc-total-expected');
    const elLate = document.getElementById('acc-total-late');
    const elCollected = document.getElementById('acc-total-collected');
    const elTotalIncome = document.getElementById('acc-total-income');
    const elTotalPending = document.getElementById('acc-total-pending');
    
    // عناصر الكروت الدورية الجديدة
    const elWeeklyRev = document.getElementById('acc-weekly-rev');
    const elWeeklyExp = document.getElementById('acc-weekly-exp');
    const elMonthlyRev = document.getElementById('acc-monthly-rev');
    const elMonthlyExp = document.getElementById('acc-monthly-exp');

    if (elWeeklyRev) elWeeklyRev.textContent = formatMoney(weeklyRev);
    if (elWeeklyExp) elWeeklyExp.textContent = formatMoney(weeklyExp);
    if (elMonthlyRev) elMonthlyRev.textContent = formatMoney(monthlyRev);
    if (elMonthlyExp) elMonthlyExp.textContent = formatMoney(monthlyExp);

    if (elExpected) elExpected.textContent = formatMoney(totalExpected);
    if (elLate) elLate.textContent = formatMoney(totalLate);
    if (elCollected) elCollected.textContent = formatMoney(totalCollected);
    if (elTotalIncome) elTotalIncome.textContent = formatMoney(totalCollected);
    if (elTotalPending) elTotalPending.textContent = formatMoney(totalLate);
}

// === Print Financial Reports Logic ===
function printFinancialReport(type) {
    const now = Date.now();
    let title = "";
    let timeLimit = 0;

    if (type === 'weekly') {
        title = "التقرير المالي الأسبوعي";
        timeLimit = 7 * 24 * 60 * 60 * 1000; // 7 أيام
    } else if (type === 'monthly') {
        title = "التقرير المالي الشهري";
        timeLimit = 30 * 24 * 60 * 60 * 1000; // 30 يوماً
    }

    const arabicMonthsMap = { 
        'يناير': 0, 'فبراير': 1, 'مارس': 2, 'أبريل': 3, 'مايو': 4, 'يونيو': 5, 
        'يوليو': 6, 'يوليوز': 6, 'أغسطس': 7, 'سبتمبر': 8, 'أكتوبر': 9, 'نوفمبر': 10, 'ديسمبر': 11 
    };

    // دالة موحدة للتحقق من تاريخ السجل (سواء طالب أو حركة مالية)
    const isWithinTimeLimit = (dateStr, idStr) => {
        let recordTimestamp = 0;
        
        const parts = (idStr || "").split('-');
        if (parts.length > 1) {
            const ts = parseInt(parts[1], 10);
            if (!isNaN(ts) && ts > 1577836800000) recordTimestamp = ts;
        }
        
        if (!recordTimestamp && dateStr) {
            const cleanStr = dateStr.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
            const dateParts = cleanStr.split(/[\s/.-]+/);
            
            if (dateParts.length >= 3) {
                let day = parseInt(dateParts[0], 10);
                let monthStr = dateParts[1];
                let year = parseInt(dateParts[2], 10);
                
                if (day > 1000) { year = day; day = parseInt(dateParts[2], 10); }
                
                let month = arabicMonthsMap[monthStr];
                if (month === undefined) {
                    const mNum = parseInt(monthStr, 10);
                    if (!isNaN(mNum) && mNum >= 1 && mNum <= 12) { month = mNum - 1; }
                }
                
                if (!isNaN(day) && month !== undefined && !isNaN(year)) {
                    recordTimestamp = new Date(year, month, day).getTime();
                }
            }
        }
        
        if (recordTimestamp > 0) return (now - recordTimestamp) <= timeLimit;
        return false;
    };

    // فلترة كلا الجدولين (المالية والطلاب)
    const filteredAcc = accountingData.filter(a => isWithinTimeLimit(a.date, a.id)).sort((a, b) => b.id.localeCompare(a.id));
    const filteredStudents = studentsData.filter(s => isWithinTimeLimit(s.date, s.id)).sort((a, b) => b.id.localeCompare(a.id));

    let accTotal = 0;
    filteredAcc.forEach(a => {
        const isExp = a.type === 'expense' || (a.amount || "").toString().includes('-') || (a.student || "").includes('مصروف') || (a.notes || "").includes('مصروف');
        const amountNum = parseFloat((a.amount || "").toString().replace(/[^\d.-]/g, '')) || 0;
        accTotal += isExp ? -Math.abs(amountNum) : Math.abs(amountNum);
    });

    let stuPaidTotal = 0;
    filteredStudents.forEach(s => {
        stuPaidTotal += parseFloat((s.paid || "").toString().replace(/[^\d.-]/g, '')) || 0;
    });

    const grandTotal = accTotal + stuPaidTotal;
    const currency = settingsData.currency || 'دينار';
    let reportHtml = `
        <div class="report-container">
            <div class="header">
                <div class="header-logo-container">
                    ${settingsData.logo ? `<img src="${settingsData.logo}" class="header-logo" alt="Logo">` : `<div style="font-size:24px; font-weight:800; color:#1e3a8a;">${settingsData.instituteName || 'المركز التعليمي'}</div>`}
                </div>
                <div class="header-title">
                    <h1>${title}</h1>
                    <p>تاريخ الإصدار: ${new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date())}</p>
                </div>
            </div>

            <div class="summary-cards">
                <div class="card primary">
                    <h3>إجمالي الإيرادات (المحصلة)</h3>
                    <p>${grandTotal.toLocaleString()} <small>${currency}</small></p>
                </div>
                <div class="card">
                    <h3>إيرادات الحركات العامة</h3>
                    <p>${accTotal.toLocaleString()} <small>${currency}</small></p>
                </div>
                <div class="card">
                    <h3>إيرادات رسوم الطلاب</h3>
                    <p>${stuPaidTotal.toLocaleString()} <small>${currency}</small></p>
                </div>
            </div>

            <h2 class="section-title">■ سجل الحركات المالية (العامة)</h2>
            <table>
                <thead>
                    <tr>
                        <th style="width: 15%;">الوصل</th>
                        <th>البيان / الطلب</th>
                        <th style="width: 15%;">التاريخ</th>
                        <th style="width: 15%;">المبلغ</th>
                        <th style="width: 12%; text-align: center;">الحالة</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredAcc.length > 0 ? filteredAcc.map(a => {
                        const isExp = a.type === 'expense' || (a.amount || "").toString().includes('-') || (a.student || "").includes('مصروف') || (a.notes || "").includes('مصروف');
                        const displayAmt = isExp && !a.amount.toString().includes('-') ? '-' + a.amount : a.amount;
                        return `
                        <tr>
                            <td style="font-weight: 700;">${a.receipt || '-'}</td>
                            <td>${a.student}</td>
                            <td>${a.date}</td>
                            <td class="${isExp ? 'text-rose' : 'text-emerald'}">${displayAmt}</td>
                            <td style="text-align: center;">${a.status}</td>
                        </tr>
                        `;
                    }).join('') : `<tr><td colspan="5" style="text-align: center; padding: 20px;">لا توجد حركات مالية عامة في هذه الفترة.</td></tr>`}
                </tbody>
            </table>

            <h2 class="section-title">■ سجل الرسوم الدراسية (الطلاب)</h2>
            <table>
                <thead>
                    <tr>
                        <th style="width: 15%;">رقم التسجيل</th>
                        <th>اسم الطالب</th>
                        <th>الدورة</th>
                        <th style="width: 15%;">التاريخ</th>
                        <th style="width: 15%;">المدفوع</th>
                        <th style="width: 15%;">المتبقي</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredStudents.length > 0 ? filteredStudents.map(s => {
                        const isDebt = s.balance && s.balance !== '0 دينار' && s.balance !== '0';
                        return `
                        <tr>
                            <td style="font-weight: 700;">${(s.id || "").substring(0, 10)}</td>
                            <td style="font-weight: 600;">${s.name}</td>
                            <td>${s.course}</td>
                            <td>${s.date}</td>
                            <td class="text-emerald">${s.paid}</td>
                            <td class="${isDebt ? 'text-rose' : ''}">${s.balance || '0'}</td>
                        </tr>
                        `;
                    }).join('') : `<tr><td colspan="6" style="text-align: center; padding: 20px;">لا توجد تسجيلات طلاب في هذه الفترة.</td></tr>`}
                </tbody>
            </table>
            <div style="margin-top: 40px; text-align: center; color: #9ca3af; font-size: 12px;">نهاية التقرير المالي • تم إنشاء هذا التقرير آلياً من نظام إدارة المركز</div>
        </div>
    `;

    const printStyles = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
            body { font-family: 'Cairo', sans-serif; direction: rtl; color: #1f2937; background: #fff; margin: 0; padding: 0; }
            .report-container { max-width: 1000px; margin: 0 auto; padding: 20px; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
            .header-logo { max-height: 70px; object-fit: contain; }
            .header-title { text-align: left; }
            .header-title h1 { margin: 0; color: #1e3a8a; font-size: 26px; font-weight: 800; }
            .header-title p { margin: 5px 0 0; color: #6b7280; font-size: 13px; }
            .summary-cards { display: flex; gap: 15px; margin-bottom: 30px; }
            .card { flex: 1; background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #e5e7eb; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .card.primary { background: linear-gradient(135deg, #4f46e5, #3b82f6) !important; color: white !important; border: none; }
            .card.primary h3, .card.primary p, .card.primary small { color: white !important; }
            .card h3 { margin: 0 0 10px; font-size: 15px; color: #4b5563; font-weight: 600; }
            .card p { margin: 0; font-size: 22px; font-weight: 800; color: #111827; }
            .section-title { font-size: 18px; color: #1e3a8a; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 15px; margin-top: 30px; font-weight: 700; }
            table { width: 100%; border-collapse: separate; border-spacing: 0; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; font-size: 13px; }
            thead { background-color: #f1f5f9; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            th { padding: 12px; text-align: right; font-weight: 700; color: #374151; border-bottom: 1px solid #e5e7eb; }
            td { padding: 12px; border-bottom: 1px solid #e5e7eb; color: #4b5563; }
            tbody tr:last-child td { border-bottom: none; }
            tbody tr:nth-child(even) { background-color: #f9fafb; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .text-emerald { color: #10b981; font-weight: 700; direction: ltr; display: inline-block; }
            .text-rose { color: #e11d48; font-weight: 700; direction: ltr; display: inline-block; }
            @media print {
                body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                .report-container { width: 100%; max-width: none; padding: 0; }
                .card { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
            }
        </style>
    `;

    // إنشاء نافذة طباعة مخفية
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute'; iframe.style.top = '-9999px'; iframe.style.left = '-9999px';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`<html><head><title>${title}</title>${printStyles}</head><body>${reportHtml}</body></html>`);
    doc.close();

    iframe.contentWindow.focus();
    setTimeout(() => { iframe.contentWindow.print(); document.body.removeChild(iframe); }, 500);
}

// === Subscriptions Logic ===
function updateSubscriptionCards() {
    const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const arabicMonthsMap = { 'يناير': 0, 'فبراير': 1, 'مارس': 2, 'أبريل': 3, 'مايو': 4, 'يونيو': 5, 'يوليو': 6, 'أغسطس': 7, 'سبتمبر': 8, 'أكتوبر': 9, 'نوفمبر': 10, 'ديسمبر': 11 };

    function calculateNextMonth(dateString) {
        if (!dateString) return "-";
        const dateParts = dateString.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).split(/[\s/.-]+/);
        
        if (dateParts.length >= 3) {
            let day = dateParts[0];
            let monthStr = dateParts[1];
            let year = parseInt(dateParts[2], 10);
            let monthIndex = arabicMonthsMap[monthStr];
            
            if (monthIndex !== undefined && !isNaN(year)) {
                monthIndex++; 
                if (monthIndex > 11) { monthIndex = 0; year++; }
                return `${day} ${arabicMonths[monthIndex]} ${year}`;
            }
        }
        return "بعد شهر"; // مسار بديل إذا اختلف التنسيق
    }

    // تحديث كارت الإنترنت
    const netSubs = accountingData.filter(a => a.student === 'اشتراك الانترنت');
    if (netSubs.length > 0) {
        netSubs.sort((a, b) => a.id.localeCompare(b.id)); // جلب الأحدث
        const lastRec = netSubs[netSubs.length - 1];
        
        const elDate = document.getElementById('net-sub-date');
        const elDue = document.getElementById('net-sub-due');
        const elAmount = document.getElementById('net-sub-amount');
        
        if (elDate) elDate.textContent = lastRec.date;
        if (elAmount) elAmount.textContent = isNaN(lastRec.amount) ? lastRec.amount : `${lastRec.amount} دينار`;
        if (elDue) elDue.textContent = calculateNextMonth(lastRec.date);
    }

    // تحديث كارت المولد
    const genSubs = accountingData.filter(a => a.student === 'اشتراك المولد');
    if (genSubs.length > 0) {
        genSubs.sort((a, b) => a.id.localeCompare(b.id)); // جلب الأحدث
        const lastRec = genSubs[genSubs.length - 1];
        
        const elDate = document.getElementById('gen-sub-date');
        const elDue = document.getElementById('gen-sub-due');
        const elAmount = document.getElementById('gen-sub-amount');
        
        if (elDate) elDate.textContent = lastRec.date;
        if (elAmount) elAmount.textContent = isNaN(lastRec.amount) ? lastRec.amount : `${lastRec.amount} دينار`;
        if (elDue) elDue.textContent = calculateNextMonth(lastRec.date);
    }
}

function openSubscriptionModal(type) {
    openModal('add-accounting-modal');
    // تعبئة البيانات تلقائياً بعد فتح النافذة
    setTimeout(() => {
        const select = document.getElementById('accStudentSelect');
        const input = document.getElementById('accStudent');
        if (select) { select.value = type; if (input) { input.style.display = 'none'; input.value = type; } }
        
        const dateInput = document.getElementById('accDate');
        if (dateInput) { dateInput.value = new Intl.DateTimeFormat('ar-EG', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date()); }
    }, 50);
}

// === Notifications Logic ===
function renderNotifications() {
    const notifDropdown = document.getElementById('notif-dropdown');
    const notifBadge = document.getElementById('notif-badge');
    const notifList = document.getElementById('notif-list');
    const parentNotifList = document.getElementById('parent-notifications-list');
    const teacherNotifList = document.getElementById('teacher-notifications-list');

    let userNotifs = [...notificationsData];

    // فلترة الإشعارات بناءً على صلاحية المستخدم
    if (currentUser) {
        if (currentUser.roleCode === 'teacher') {
            // استخراج الشعب التي يدرسها هذا المعلم فقط
            const teacherClasses = coursesData.filter(c => c.instructor === currentUser.name).map(c => 'شعبة: ' + c.title);
            userNotifs = userNotifs.filter(n => 
                n.target === 'الجميع' || 
                n.target === 'المدرسين' || 
                teacherClasses.includes(n.target)
            );
        } else if (currentUser.roleCode === 'parent') {
            const parentStudents = studentsData.filter(s => s.email === currentUser.email);
            const childrenNames = parentStudents.map(s => 'طالب: ' + s.name);
            const childrenClasses = parentStudents.map(s => {
                const cls = coursesData.find(c => c.id === s.class_id);
                return cls ? 'شعبة: ' + cls.title : null;
            }).filter(Boolean);

            userNotifs = userNotifs.filter(n => 
                n.target === 'الجميع' || n.target === 'الطلاب' || 
                childrenClasses.includes(n.target) || childrenNames.includes(n.target)
            );
        }
    }

    if (notifBadge) notifBadge.textContent = userNotifs.length;

    const noNotifsHtml = '<div style="text-align: center; padding: 20px; color: var(--text-muted);">لا توجد إشعارات جديدة</div>';
    const noDropdownHtml = '<div class="dropdown-item text-center">لا توجد إشعارات جديدة</div>';

    if (userNotifs.length === 0) {
        if (notifList) notifList.innerHTML = noDropdownHtml;
        if (parentNotifList) parentNotifList.innerHTML = noNotifsHtml;
        if (teacherNotifList) teacherNotifList.innerHTML = noNotifsHtml;
        return;
    }

    // Sort by newest first
    const sortedNotifs = userNotifs.reverse();

    // Render for dropdown
    if (notifList) {
        notifList.innerHTML = '';
        sortedNotifs.forEach(notif => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.innerHTML = `
            <div class="notif-title">${notif.title} <span class="badge" style="background:var(--primary-color);font-size:10px;padding:2px 6px">${notif.target}</span></div>
            <div class="notif-msg">${notif.message}</div>
            <span class="notif-meta">${notif.date}</span>
        `;
            notifList.appendChild(item);
        });
    }

    // Render for parent dashboard
    if (parentNotifList) {
        parentNotifList.innerHTML = '';
        // Only show up to 5 recent notifications on the dashboard for cleaner UI
        sortedNotifs.slice(0, 5).forEach(notif => {
            const item = document.createElement('div');
            item.style.padding = '15px';
            item.style.borderBottom = '1px solid var(--border-color)';
            item.style.cursor = 'default'; // explicitly default
            item.innerHTML = `
            <div style="font-weight: 700; color: var(--text-main); margin-bottom: 5px;">${notif.title}</div>
            <div style="font-size: 14px; color: var(--text-muted); line-height: 1.4;">${notif.message}</div>
            <div style="font-size: 12px; color: var(--text-light); margin-top: 8px;"><i class='bx bx-time-five'></i> ${notif.date}</div>
        `;
            parentNotifList.appendChild(item);
        });
        if (parentNotifList.lastChild) {
            parentNotifList.lastChild.style.borderBottom = 'none';
        }
    }
    
    // Render for teacher dashboard
    if (teacherNotifList) {
        teacherNotifList.innerHTML = '';
        sortedNotifs.slice(0, 5).forEach(notif => {
            const item = document.createElement('div');
            item.style.padding = '15px';
            item.style.borderBottom = '1px solid var(--border-color)';
            item.style.cursor = 'default';
            item.innerHTML = `
            <div style="font-weight: 700; color: var(--text-main); margin-bottom: 5px;">${notif.title} <span class="badge" style="background:var(--primary-color);font-size:10px;padding:2px 6px;float:left;">${notif.target}</span></div>
            <div style="font-size: 14px; color: var(--text-muted); line-height: 1.4;">${notif.message}</div>
            <div style="font-size: 12px; color: var(--text-light); margin-top: 8px;"><i class='bx bx-time-five'></i> ${notif.date}</div>
        `;
            teacherNotifList.appendChild(item);
        });
        if (teacherNotifList.lastChild) {
            teacherNotifList.lastChild.style.borderBottom = 'none';
        }
    }
}

// === Teacher Views Logic ===
function renderTeacherViews() {
    if (!currentUser || currentUser.roleCode !== 'teacher') return;

    // استخراج الشعب الخاصة بالمعلم
    const teacherClasses = coursesData.filter(c => c.instructor === currentUser.name && (c.duration === 'غير محدد' || c.title.includes(' - نسخة جديدة')));
    const teacherClassIds = teacherClasses.map(c => c.id);

    // استخراج الطلاب المسجلين في هذه الشعب حصراً
    const teacherStudents = studentsData.filter(s => teacherClassIds.includes(s.class_id));

    // تحديث الكروت الإحصائية العلوية
    const totalStudentsEl = document.getElementById('teacher-total-students');
    const totalClassesEl = document.getElementById('teacher-total-classes');
    if (totalStudentsEl) totalStudentsEl.textContent = teacherStudents.length;
    if (totalClassesEl) totalClassesEl.textContent = teacherClasses.length;

    // تحديث قائمة الشعب في اللوحة الرئيسية
    const classesListEl = document.getElementById('teacher-classes-list');
    if (classesListEl) {
        if (teacherClasses.length === 0) {
            classesListEl.innerHTML = '<li style="padding: 20px; text-align: center; color: var(--text-muted);">لا توجد شعب تابعة لك حالياً</li>';
        } else {
            classesListEl.innerHTML = teacherClasses.map(c => {
                const studentCount = studentsData.filter(s => s.class_id === c.id).length;
                return `
                    <li style="padding: 15px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                        <div style="font-weight: 600; color: var(--text-main);">${c.title} <br><small style="color: var(--text-muted); font-weight: normal; font-size: 12px;">${c.subject}</small></div>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <span class="badge" style="background: var(--bg-hover); color: var(--primary-color); border: 1px solid var(--primary-color); font-size: 13px;"><i class='bx bx-group'></i> ${studentCount} طالب</span>
                            <button class="btn btn-primary" style="padding: 6px 12px; font-size: 13px; border-radius: 8px; display: flex; align-items: center; gap: 5px;" onclick="goToAttendancePage('${c.id}')"><i class='bx bx-calendar-check'></i> تحضير</button>
                        </div>
                    </li>
                `;
            }).join('');
            if (classesListEl.lastElementChild) classesListEl.lastElementChild.style.borderBottom = 'none';
        }
    }

    // تحديث القائمة المنسدلة في صفحة التحضير
    const attClassSelect = document.getElementById('attendance-page-class-select');
    if (attClassSelect) {
        const currentVal = attClassSelect.value;
        attClassSelect.innerHTML = '<option value="">-- اختر الشعبة --</option>' + teacherClasses.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
        if (currentVal && teacherClassIds.includes(currentVal)) {
            attClassSelect.value = currentVal;
        }
    }

    // تحديث القائمة المنسدلة في صفحة إرسال الإشعارات للمعلم
    const teacherNotifClass = document.getElementById('teacherNotifClass');
    if (teacherNotifClass) {
        teacherNotifClass.innerHTML = '<option value="">-- حدد الشعبة --</option>' + teacherClasses.map(c => `<option value="${c.title}">${c.title}</option>`).join('');
    }

    // تحديث جدول الطلاب وقائمة الفلترة
    const tbody = document.getElementById('teacher-students-table-body');
    const filterSelect = document.getElementById('teacher-class-filter');
    
    if (filterSelect) {
        const currentFilter = filterSelect.value;
        filterSelect.innerHTML = '<option value="all">جميع الشعب</option>' + teacherClasses.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
        if (teacherClassIds.includes(currentFilter) || currentFilter === 'all') {
            filterSelect.value = currentFilter;
        }
    }

    const renderStudentsTable = () => {
        if (!tbody) return;
        const searchTerm = (document.getElementById('teacher-student-search')?.value || '').toLowerCase();
        const selectedClassId = document.getElementById('teacher-class-filter')?.value || 'all';

        const filteredStudents = teacherStudents.filter(s => {
            const matchName = s.name.toLowerCase().includes(searchTerm);
            const matchClass = selectedClassId === 'all' || s.class_id === selectedClassId;
            return matchName && matchClass;
        });

        if (filteredStudents.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">لا يوجد طلاب مطابقين</td></tr>';
            return;
        }

        tbody.innerHTML = filteredStudents.map(s => {
            const cls = teacherClasses.find(c => c.id === s.class_id);
            const className = cls ? cls.title : 'غير محدد';
            return `
                <tr>
                    <td>
                        <div class="user-cell">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=random" alt="Avatar">
                            <div class="user-info">
                                <h4>${s.name}</h4>
                                <p>${s.email}</p>
                            </div>
                        </div>
                    </td>
                    <td>${s.course}</td>
                    <td><span class="badge" style="background: var(--bg-hover); color: var(--text-main); border: 1px solid var(--border-color);">${className}</span></td>
                    <td>${s.date}</td>
                    <td>
                        <button class="btn-icon" title="عرض التفاصيل" onclick="alert('سيتم تفعيل عرض تفاصيل الطالب قريباً')" style="color: var(--primary-color);"><i class='bx bx-show'></i></button>
                    </td>
                </tr>
            `;
        }).join('');
    };

    renderStudentsTable();

    // ربط مستمعي الأحداث للبحث والفلترة
    const searchInput = document.getElementById('teacher-student-search');
    if (filterSelect && !filterSelect.dataset.listener) {
        filterSelect.addEventListener('change', renderStudentsTable);
        filterSelect.dataset.listener = "true";
    }
    if (searchInput && !searchInput.dataset.listener) {
        searchInput.addEventListener('input', renderStudentsTable);
        searchInput.dataset.listener = "true";
    }
}

// === Parent Views Logic ===
function renderParentViews() {
    if (!currentUser || currentUser.roleCode !== 'parent') return;

    // جلب أبناء ولي الأمر (نقوم بمطابقة بريد الطالب مع بريد ولي الأمر كطريقة ربط افتراضية)
    const children = studentsData.filter(s => s.email === currentUser.email);

    const countEl = document.getElementById('parent-children-count');
    if (countEl) countEl.textContent = children.length;

    const container = document.getElementById('parent-children-list');
    if (!container) return;

    if (children.length === 0) {
        container.innerHTML = `
            <div class="card">
                <div class="card-body" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <i class='bx bx-face' style="font-size: 48px; color: var(--primary-color); margin-bottom: 15px;"></i>
                    <h3>سجل الأبناء الأكاديمي</h3>
                    <p>لم يتم العثور على أبناء مسجلين مرتبطين ببريدك الإلكتروني (${currentUser.email}).</p>
                </div>
            </div>`;
        return;
    }

    container.innerHTML = children.map(child => {
        // استخراج سجل الحضور الخاص بهذا الطالب من السجلات العامة
        const childAttendance = attendanceData.flatMap(att => {
            const record = att.records.find(r => r.student_id === child.id);
            return record ? { date: att.date, status: record.status, notes: record.notes } : [];
        }).sort((a, b) => new Date(b.date) - new Date(a.date)); // الأحدث أولاً

        const presentCount = childAttendance.filter(a => a.status === 'present').length;
        const absentCount = childAttendance.filter(a => a.status === 'absent').length;
        const excusedCount = childAttendance.filter(a => a.status === 'excused').length;

        return `
        <div class="card mb-4" style="border-right: 4px solid var(--primary-color); box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
            <div class="card-header d-flex justify-between align-center" style="background: rgba(79, 70, 229, 0.03); border-bottom: 1px solid var(--border-color);">
                <h3 style="margin: 0; display: flex; align-items: center; gap: 10px; color: var(--primary-color);">
                    <i class='bx bx-user-circle' style="font-size: 24px;"></i> ${child.name}
                </h3>
                <span class="badge" style="background: var(--bg-color); color: var(--text-main); border: 1px solid var(--border-color);">${child.course}</span>
            </div>
            <div class="card-body">
                <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 20px; gap: 15px;">
                    <div style="background: #ecfdf5; padding: 15px; border-radius: 12px; text-align: center; border: 1px solid #a7f3d0;">
                        <div style="color: #059669; font-weight: 900; font-size: 24px;">${presentCount}</div>
                        <div style="font-size: 13px; color: #065f46; font-weight: 600;">مرات الحضور</div>
                    </div>
                    <div style="background: #fef2f2; padding: 15px; border-radius: 12px; text-align: center; border: 1px solid #fecaca;">
                        <div style="color: #dc2626; font-weight: 900; font-size: 24px;">${absentCount}</div>
                        <div style="font-size: 13px; color: #991b1b; font-weight: 600;">مرات الغياب</div>
                    </div>
                    <div style="background: #fffbeb; padding: 15px; border-radius: 12px; text-align: center; border: 1px solid #fde68a;">
                        <div style="color: #d97706; font-weight: 900; font-size: 24px;">${excusedCount}</div>
                        <div style="font-size: 13px; color: #92400e; font-weight: 600;">الإجازات</div>
                    </div>
                </div>
                
                <h4 style="margin-bottom: 15px; font-size: 15px; border-bottom: 2px solid var(--bg-hover); padding-bottom: 8px;">سجل التحضير التفصيلي</h4>
                ${childAttendance.length > 0 ? `
                <div class="table-responsive" style="max-height: 250px; overflow-y: auto;">
                    <table class="data-table" style="font-size: 13px; margin: 0;">
                        <thead style="position: sticky; top: 0; background: var(--bg-hover);">
                            <tr>
                                <th>التاريخ</th>
                                <th>الحالة</th>
                                <th>ملاحظات المدرس</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${childAttendance.map(att => {
                                let statusBadge = '';
                                if (att.status === 'present') statusBadge = '<span class="badge" style="background:#d1fae5; color:#065f46; padding: 4px 10px;">حاضر</span>';
                                else if (att.status === 'absent') statusBadge = '<span class="badge" style="background:#fee2e2; color:#991b1b; padding: 4px 10px;">غائب</span>';
                                else if (att.status === 'excused') statusBadge = '<span class="badge" style="background:#fef3c7; color:#92400e; padding: 4px 10px;">مجاز</span>';
                                return `
                                <tr>
                                    <td style="font-weight: 600;">${att.date}</td>
                                    <td>${statusBadge}</td>
                                    <td style="color: var(--text-muted);">${att.notes || '-'}</td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                ` : `<p style="text-align: center; color: var(--text-muted); font-size: 14px; padding: 20px; background: var(--bg-hover); border-radius: 8px;">لا توجد سجلات حضور وغياب حالياً.</p>`}
            </div>
        </div>
        `;
    }).join('');
}

function goToAttendancePage(classId) {
    navigateTo('teacher-attendance');
    const select = document.getElementById('attendance-page-class-select');
    if (select) {
        select.value = classId;
        loadClassAttendance();
    }
}

function loadClassAttendance() {
    const classId = document.getElementById('attendance-page-class-select')?.value;
    let dateVal = document.getElementById('attendance-page-date')?.value;
    const tbody = document.getElementById('attendance-page-students-list');

    if (!tbody) return;

    if (!classId) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: var(--text-muted);">الرجاء تحديد شعبة وتاريخ</td></tr>';
        return;
    }

    if (!dateVal) {
        document.getElementById('attendance-page-date').valueAsDate = new Date();
        dateVal = document.getElementById('attendance-page-date').value;
    }

    const classStudents = studentsData.filter(s => s.class_id === classId);
    if (classStudents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: var(--text-muted);">لا يوجد طلاب مسجلين في هذه الشعبة</td></tr>';
        return;
    }

    // التحقق من وجود سجل حضور مسبق لنفس التاريخ والشعبة
    const existingRecord = attendanceData.find(a => a.class_id === classId && a.date === dateVal);

    tbody.innerHTML = classStudents.map(s => {
        let status = 'present';
        let notes = '';

        if (existingRecord) {
            const studentRec = existingRecord.records.find(r => r.student_id === s.id);
            if (studentRec) {
                status = studentRec.status;
                notes = studentRec.notes || '';
            }
        }

        return `
            <tr data-student-id="${s.id}">
                <td style="font-weight: 600;">${s.name}</td>
                <td style="text-align: center;">
                    <input type="radio" name="page_att_${s.id}" value="present" ${status === 'present' ? 'checked' : ''} style="transform: scale(1.4); cursor: pointer; accent-color: var(--primary-color);">
                </td>
                <td style="text-align: center;">
                    <input type="radio" name="page_att_${s.id}" value="absent" ${status === 'absent' ? 'checked' : ''} style="transform: scale(1.4); cursor: pointer; accent-color: var(--danger-color);">
                </td>
                <td style="text-align: center;">
                    <input type="radio" name="page_att_${s.id}" value="excused" ${status === 'excused' ? 'checked' : ''} style="transform: scale(1.4); cursor: pointer; accent-color: #f59e0b;">
                </td>
                <td>
                    <input type="text" class="form-input page-input-notes" value="${notes}" placeholder="أضف ملاحظة..." style="padding: 6px 10px; font-size: 12px; width: 100%;">
                </td>
            </tr>
        `;
    }).join('');
}

function savePageAttendance() {
    const classId = document.getElementById('attendance-page-class-select').value;
    const date = document.getElementById('attendance-page-date').value;
    
    if (!classId) { alert('يرجى تحديد الشعبة'); return; }
    if (!date) { alert('يرجى تحديد تاريخ التحضير'); return; }
    
    const rows = document.querySelectorAll('#attendance-page-students-list tr[data-student-id]');
    const attendanceRecords = [];
    const absentStudents = [];

    rows.forEach(row => {
        const studentId = row.getAttribute('data-student-id');
        const statusInput = row.querySelector(`input[name="page_att_${studentId}"]:checked`);
        const notesInput = row.querySelector('.page-input-notes');

        if (studentId && statusInput) {
            attendanceRecords.push({
                student_id: studentId,
                status: statusInput.value,
                notes: notesInput ? notesInput.value : ""
            });
            
            if (statusInput.value === 'absent') {
                const student = studentsData.find(s => s.id === studentId);
                if (student) absentStudents.push(student);
            }
        }
    });

    if (attendanceRecords.length === 0) {
        alert('لا يوجد طلاب لتسجيل حضورهم.');
        return;
    }

    const payload = {
        id: 'Att-' + Date.now(),
        class_id: classId,
        date: date,
        records: attendanceRecords
    };

    fetch(`${API_BASE}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(res => res.json())
        .then(async data => {
            if (data.success) { 
                // إرسال إشعارات غياب للطلاب المتغيبين
                const newNotifs = [];
                absentStudents.forEach((student, index) => {
                    const message = `تم تسجيل غياب للطالب ${student.name} بتاريخ ${date}.`;
                    const exists = notificationsData.some(n => n.target === 'طالب: ' + student.name && n.message.includes(date));
                    if (!exists) {
                        newNotifs.push({
                            id: 'N-' + Date.now() + index,
                            title: 'إشعار غياب',
                            target: 'طالب: ' + student.name,
                            message: message + ` يرجى متابعة الأمر.`,
                            date: new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date())
                        });
                    }
                });
                
                if (newNotifs.length > 0) {
                    notificationsData.push(...newNotifs);
                    await fetch(`${API_BASE}/update/notifications`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(notificationsData)
                    });
                }

                alert('تم حفظ سجل التحضير بنجاح!'); 
                await loadDataFromDB(); // لتحديث البيانات وعرضها فوراً عند ولي الأمر
                loadClassAttendance();
            }
            else { alert(data.error || 'فشل في حفظ البيانات.'); }
    })
    .catch(err => { alert('تعذر الحفظ.'); console.error(err); });
}

document.addEventListener("DOMContentLoaded", () => {
    initChart();

    // Toggle Dropdown
    const notifBtn = document.getElementById('notif-btn');
    const notifDropdown = document.getElementById('notif-dropdown');
    notifBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (notifDropdown) notifDropdown.classList.toggle('show');
    });

    // Hide dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (notifBtn && notifDropdown && !notifBtn.contains(e.target) && !notifDropdown.contains(e.target)) {
            notifDropdown.classList.remove('show');
        }
    });

    // Handle Instructor Form Submission
    document.getElementById('add-instructor-modal')?.querySelector('form')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('instructorName').value;
        const spec = document.getElementById('instructorSubject').value;
        const phone = document.getElementById('instructorPhone').value;
        const fileInput = document.getElementById('instructorImg');
        
        let imgBase64 = "";

        if (fileInput && fileInput.files && fileInput.files[0]) {
            const reader = new FileReader();
            reader.onload = async function (event) {
                imgBase64 = event.target.result;
                await saveInstructor();
            };
            reader.readAsDataURL(fileInput.files[0]);
        } else {
            await saveInstructor();
        }

        async function saveInstructor() {
            const newInstructor = { id: 'Inst-' + Date.now(), name, spec, phone, img: imgBase64 };
            
            instructorsData.push(newInstructor);
            renderInstructors();
            closeModal('add-instructor-modal');
            document.getElementById('addInstructorForm').reset();

            try {
                await fetch(`${API_BASE}/update/instructors`, {
                    method: 'POST',
             headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newInstructor)
                });
            } catch (err) { console.error(err); }
        }
    });

    // Handle Course Form Submission
    document.getElementById('addCourseForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('courseTitle').value;
        const subject = document.getElementById('courseSubject').value;
        const instructor = document.getElementById('courseInstructor').value;
        const duration = document.getElementById('courseDuration').value;
        const fileInput = document.getElementById('courseImg');

        let imgBase64 = "https://via.placeholder.com/300x200";
        if (fileInput.files && fileInput.files[0]) {
            const reader = new FileReader();
            reader.onload = async function (e) {
                imgBase64 = e.target.result;
                await saveCourse();
            };
            reader.readAsDataURL(fileInput.files[0]);
        } else {
            await saveCourse();
        }

        async function saveCourse() {
            const newCourse = {
                id: 'Crs-' + Date.now(),
                title: title,
                subject: subject,
                instructor: instructor,
                duration: duration,
                students: "0",
                img: imgBase64
            };
            coursesData.push(newCourse);
            renderCourses();
            closeModal('add-course-modal');
            document.getElementById('addCourseForm').reset();

            try {
                await fetch(`${API_BASE}/update/courses`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newCourse)
                });
            } catch (err) {
                console.error(err);
            }
        }
    });

    // Handle Edit Class Form Submission
    document.getElementById('editClassForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('editClassId').value;
        const title = document.getElementById('editClassName').value;
        const subject = document.getElementById('editClassSubject').value;
        const capacity = document.getElementById('editClassCapacity').value;

        const updates = { title, subject, capacity };

        try {
            const res = await fetch(`${API_BASE}/courses/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            if (res.ok) {
                const index = coursesData.findIndex(c => c.id === id);
                if (index !== -1) { coursesData[index] = { ...coursesData[index], ...updates }; }
                if (typeof renderClassManagement === 'function') renderClassManagement();
                if (typeof renderCourses === 'function') renderCourses();
                closeModal('edit-class-modal');
            } else { alert('فشل في التعديل.'); }
        } catch (e) { alert("خطأ في الحفظ."); }
    });

    // التعامل مع إضافة شعبة جديدة
    document.getElementById('addClassForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('className').value;
        const subject = document.getElementById('classSubject').value;
        const capacity = document.getElementById('classCapacity').value;

        const newClass = {
            id: 'Crs-' + Date.now(),
            title: title,
            subject: subject,
            instructor: 'غير محدد',
            duration: 'غير محدد',

            students: '0',
            capacity: capacity,
            img: "https://via.placeholder.com/300x200"
        };

        coursesData.push(newClass);
        if (typeof renderClassManagement === 'function') renderClassManagement();
        if (typeof renderCourses === 'function') renderCourses();
        if (typeof renderCourses === 'function') renderCourses(); // Keep it to update courses list if needed
        closeModal('add-class-modal');
        document.getElementById('addClassForm').reset();

        try {
            await fetch(`${API_BASE}/update/courses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newClass)
            });
            alert('تم إضافة الشعبة بنجاح!');
        } catch (err) {
            console.error(err);
            alert('فشل إضافة الشعبة.');
            loadDataFromDB()
        }
    });

    document.getElementById('addStudentToClassForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        alert("سيتم تفعيل خاصية ربط الطلاب بالشعب في التحديث القادم.");
        closeModal('add-student-to-class-modal');
    });

    // Handle Subject Form Submission
    document.getElementById('addSubjectForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('subjectName').value;
        const desc = document.getElementById('subjectDesc').value;

        const newSubject = {
            id: 'Sub-' + Date.now(),
            name,
            desc
        };

        // Optimistic UI update
        subjectsData.push(newSubject);
        renderSubjects();
        closeModal('add-subject-modal');
        e.target.reset();

        // Persist
        try {
            await fetch(`${API_BASE}/update/subjects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSubject)
            });
        } catch (err) {
            console.error(err);
        }
    });

    // Handle Form Submission
    document.getElementById('notificationForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('notifTitle').value;
        let target = document.getElementById('notifTarget').value;
        const message = document.getElementById('notifMessage').value;
        
        if (target === 'شعبة محددة') {
            const classVal = document.getElementById('notifClass').value;
            target = 'شعبة: ' + classVal;
        }

        const date = new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date());

        const newNotif = { id: 'N-' + Date.now(), title, target, message, date };

        // Optimistic UI update
        notificationsData.push(newNotif);
        renderNotifications();
        e.target.reset();
        
        const classGroup = document.getElementById('notifClassGroup');
        const classSelect = document.getElementById('notifClass');
        if (classGroup) classGroup.style.display = 'none';
        if (classSelect) classSelect.required = false;

        // Persist to server
        try {
            const response = await fetch(`${API_BASE}/update/notifications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(notificationsData)
            });

            if (!response.ok) {
                throw new Error('فشل حفظ الإشعار');
            }
            alert('تم إرسال الإشعار بنجاح!');

        } catch (error) {
            console.error("Error saving notification:", error);
            // Revert 
            notificationsData.pop();
            renderNotifications();
            alert('حدث خطأ أثناء حفظ الإشعار. يرجى المحاولة مرة أخرى.');
        }
    });

    // Handle Teacher Notification Form Submission
    document.getElementById('teacherNotificationForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('teacherNotifTitle').value;
        const classVal = document.getElementById('teacherNotifClass').value;
        const message = document.getElementById('teacherNotifMessage').value;
        
        const target = 'شعبة: ' + classVal;
        const date = new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date());

        const newNotif = { id: 'N-' + Date.now(), title, target, message, date };

        // Optimistic UI update
        notificationsData.push(newNotif);
        renderNotifications();
        e.target.reset();
        
        // Persist to server
        try {
            const response = await fetch(`${API_BASE}/update/notifications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(notificationsData)
            });

            if (!response.ok) throw new Error('فشل حفظ الإشعار');
            alert('تم إرسال الإشعار بنجاح إلى طلاب الشعبة المحددة!');
        } catch (error) {
            console.error("Error saving notification:", error);
            notificationsData.pop();
            renderNotifications();
            alert('حدث خطأ أثناء حفظ الإشعار. يرجى المحاولة مرة أخرى.');
        }
    });

    loadDataFromDB(); // Call this to start loading data
});

// Settings Form Logic
function applyGlobalSettings() {
    if (!settingsData) return;

    // Apply Institute Name everywhere
    const name = settingsData.instituteName || "أكاديمية المعرفة";
    const sidebarText = document.getElementById("sidebar-logo-text");
    const receiptName = document.getElementById("receipt-institute-name");

    if (sidebarText) sidebarText.textContent = name;
    if (receiptName) receiptName.textContent = name;

    // Apply Logo everywhere
    const sidebarImg = document.getElementById("sidebar-logo-img");
    const sidebarIcon = document.getElementById("sidebar-logo-icon");
    const receiptImg = document.getElementById("receipt-logo-img");

    if (settingsData.logo) {
        if (sidebarImg) { sidebarImg.src = settingsData.logo; sidebarImg.style.display = 'block'; }
        if (sidebarIcon) { sidebarIcon.style.display = 'none'; }
        if (receiptImg) { receiptImg.src = settingsData.logo; receiptImg.style.display = 'block'; }
    } else {
        if (sidebarImg) { sidebarImg.style.display = 'none'; }
        if (sidebarIcon) { sidebarIcon.style.display = 'block'; }
        if (receiptImg) { receiptImg.style.display = 'none'; }
    }
}

function renderSettings() {
    applyGlobalSettings(); // Also run on view load

    if (!settingsData) return;
    const nameInput = document.getElementById("settingInstituteName");
    const phoneInput = document.getElementById("settingPhone");
    const currencySelect = document.getElementById("settingCurrency");

    if (nameInput) nameInput.value = settingsData.instituteName || '';
    if (phoneInput) phoneInput.value = settingsData.phone || '';
    if (currencySelect) currencySelect.value = settingsData.currency || 'IQD';
}

async function saveSettings(showLoading = false) {
    const instituteName = document.getElementById('settingInstituteName')?.value || 'أكاديمية المعرفة';
    const phone = document.getElementById('settingPhone')?.value || '';
    const currency = document.getElementById('settingCurrency')?.value || 'IQD';
    const logoFile = document.getElementById('settingLogo')?.files[0];

    const newSettings = {
        instituteName: instituteName,
        phone: phone,
        currency: currency,
        logo: settingsData.logo // Default to existing logo unless changed
    };

    let btn, originalText;
    if (showLoading) {
        btn = document.querySelector('#settingsForm button');
        if (btn) {
            originalText = btn.innerHTML;
            btn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> جاري الحفظ...";
        }
    }

    const finalizeSave = async () => {
        try {
            const res = await fetch(`${API_BASE}/update/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSettings)
            });

            if (res.ok) {
                settingsData = newSettings;
                applyGlobalSettings();
                if (showLoading && btn) btn.innerHTML = originalText;
                alert("تم حفظ الإعدادات بنجاح!");
            } else {
                console.error('فشل في حفظ الإعدادات تلقائياً.');
                if (showLoading && btn) btn.innerHTML = originalText;
                alert("حدث خطأ أثناء الحفظ.");
            }
        } catch (err) {
            console.error("تعذر الحفظ.");
            if (showLoading && btn) btn.innerHTML = originalText;
        }
    };

    if (logoFile) {
        const reader = new FileReader();
        reader.onloadend = async function () {
            newSettings.logo = reader.result;
            await finalizeSave();
        }
        reader.readAsDataURL(logoFile);
    } else {
        await finalizeSave();
    }
}

// Auto-save when inputs change
const settingsInputs = document.querySelectorAll('#settingsForm .form-input, #settingsForm .form-select');
settingsInputs.forEach(input => {
    input.addEventListener('change', () => saveSettings(false));
});

// Keep submit listener just in case user clicks the button
document.getElementById('settingsForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveSettings(true);
});

// ==========================================
// General Data Persistence (Instructors, Courses, Accounting)
// ==========================================

// Add Accounting Record
document.getElementById('addAccountingForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const receipt = document.getElementById('accReceipt').value;
    const student = document.getElementById('accStudent').value;
    const amount = document.getElementById('accAmount').value;
    const date = document.getElementById('accDate').value;
    const method = document.getElementById('accMethod').value;
    const statusVal = document.getElementById('accStatus').value;
    const notes = document.getElementById('accNotes').value;
    
    let statusText = statusVal === 'active' ? 'مدفوع' : (statusVal === 'pending' ? 'مدفوع جزئي' : 'ملغى');
    const newRecord = {
        receipt,
        student,
        amount,
        date,
        method,
        notes,
        status: statusText,
        statusCode: statusVal
    };

    try {
        const res = await fetch(`${API_BASE}/update/accounting`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newRecord)
        });

        if (res.ok) {
            await loadDataFromDB();
            closeModal('add-accounting-modal');
            document.getElementById('addAccountingForm').reset();
            alert('تم إضافة السجل المالي بنجاح!');
        } else {
            alert('فشل في عملية الحفظ.');
        }
    } catch (err) {
        alert('تعذر الحفظ.');
    }
});

// ==========================================
// Database Management (Export / Import)
// ==========================================
function exportDatabase() {
    const data = localStorage.getItem(DB_KEY);
    if (!data) {
        alert("لا توجد بيانات لتصديرها.");
        return;
    }
    
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    
    const date = new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()).replace(/\//g, '-');
    a.href = url;
    a.download = `panda_database_${date}.json`; // اسم الملف الذي سيتم تحميله
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importDatabase(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // التأكد من أن الملف هو بالفعل قاعدة بيانات النظام
            if (importedData && importedData.students && importedData.roles) {
                if (confirm("تحذير: سيتم مسح البيانات الحالية واستبدالها بالبيانات المستوردة. هل أنت متأكد من رغبتك بالاستمرار؟")) {
                    localStorage.setItem(DB_KEY, JSON.stringify(importedData));
                    alert("تم استعادة قاعدة البيانات بنجاح! سيتم تحديث الصفحة لتطبيق التغييرات.");
                    window.location.reload();
                }
            } else {
                alert("ملف قاعدة البيانات غير صالح أو معطوب.");
            }
        } catch (err) {
            alert("حدث خطأ أثناء قراءة الملف. يرجى التأكد من اختيار ملف JSON صحيح.");
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // إعادة تعيين الحقل لتتمكن من اختيار نفس الملف مرة أخرى إن أردت
}
