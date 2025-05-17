(() => {
    const API_BASE = 'http://localhost:8000/api';
    const USERS_BASE = API_BASE + '/users';
    const ADMIN_BASE = API_BASE + '/admin';
    const BOOKING_BASE = API_BASE + '/bookings';
    const appContainer = document.getElementById('app');
    const navControls = document.getElementById('nav-controls');

    async function api(path, method = 'GET', body) {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${path}`, {
            method,
            headers,
            body: body && JSON.stringify(body),
        });
        const text = await res.text();
        if (!res.ok) throw new Error(text || res.statusText);
        return text ? JSON.parse(text) : {};
    }

    async function login(email, password) {
        const data = await api(USERS_BASE + '/login', 'POST', {
            email,
            password,
        });
        console.log(data);
        localStorage.setItem('token', data.data.ACCESS_TOKEN);
        renderApp();
    }

    async function register(name, email, password, role) {
        await api(USERS_BASE + '/register', 'POST', {
            name,
            email,
            password,
            role,
        });
        alert('تم إنشاء الحساب بنجاح. يمكنك تسجيل الدخول.');
        showLoginForm();
    }

    function logout() {
        localStorage.removeItem('token');
        renderApp();
    }

    async function loadEvents() {
        return api(USERS_BASE + '/events', 'GET');
    }

    async function bookEvent(eventId) {
        await api(BOOKING_BASE + `/${eventId}`, 'POST');
        alert('تم حجز الفعالية بنجاح.');
        renderEventsList();
    }

    async function createEvent(ev) {
        return api(ADMIN_BASE + '/events', 'POST', ev);
    }
    async function updateEvent(id, ev) {
        return api(ADMIN_BASE + `/events/${id}`, 'PUT', ev);
    }
    async function deleteEvent(id) {
        return api(ADMIN_BASE + `/events/${id}`, 'DELETE');
    }

    function formatDate(dateStr) {
        const d = new Date(dateStr);
        return isNaN(d)
            ? dateStr
            : d.toLocaleDateString('ar-EG', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
              });
    }

    function setNav() {
        navControls.innerHTML = '';
        const token = localStorage.getItem('token');
        if (!token) {
            const loginBtn = document.createElement('button');
            loginBtn.textContent = 'تسجيل الدخول';
            loginBtn.onclick = showLoginForm;
            const registerBtn = document.createElement('button');
            registerBtn.textContent = 'إنشاء حساب';
            registerBtn.onclick = showRegisterForm;
            navControls.append(loginBtn, registerBtn);
        } else {
            const welcome = document.createElement('span');
            welcome.textContent = `مرحباً`;
            navControls.appendChild(welcome);
            const homeBtn = document.createElement('button');
            homeBtn.textContent = 'الفعاليات';
            homeBtn.onclick = renderEventsList;
            navControls.appendChild(homeBtn);
            const eventsControlPanel = document.createElement('button');
            eventsControlPanel.textContent = 'لوحة التحكم';
            eventsControlPanel.onclick = renderEventsControlPanel;
            navControls.appendChild(eventsControlPanel);
            const logoutBtn = document.createElement('button');
            logoutBtn.textContent = 'تسجيل الخروج';
            logoutBtn.onclick = logout;
            navControls.appendChild(logoutBtn);
        }
    }

    function clearApp() {
        appContainer.innerHTML = '';
    }

    function showLoginForm() {
        clearApp();
        const sec = document.createElement('section');
        sec.innerHTML = `
      <h2>تسجيل الدخول</h2>
      <div class="error-msg" id="loginErr"></div>
      <form id="loginForm">
        <input type="email" id="loginEmail" placeholder="البريد الإلكتروني" required />
        <input type="password" id="loginPass" placeholder="كلمة المرور" required />
        <button type="submit">تسجيل الدخول</button>
      </form>
    `;
        appContainer.appendChild(sec);
        document.getElementById('loginForm').onsubmit = async (e) => {
            e.preventDefault();
            try {
                await login(
                    document.getElementById('loginEmail').value,
                    document.getElementById('loginPass').value
                );
            } catch (err) {
                document.getElementById('loginErr').textContent = err.message;
            }
        };
    }

    function showRegisterForm() {
        clearApp();
        const sec = document.createElement('section');
        sec.innerHTML = `
      <h2>إنشاء حساب جديد</h2>
      <div class="error-msg" id="regErr"></div>
      <form id="regForm">
        <input type="text" id="regUser" placeholder="اسم المستخدم" minlength="3" required />
        <input type="email" id="regEmail" placeholder="البريد الإلكتروني" required />
        <input type="password" id="regPass" placeholder="كلمة المرور" minlength="6" required />
        <select id="regRole">
          <option value="user">مستخدم عادي</option>
          <option value="admin">مشرف (Admin)</option>
        </select>
        <button type="submit">إنشاء الحساب</button>
      </form>
    `;
        appContainer.appendChild(sec);
        document.getElementById('regForm').onsubmit = async (e) => {
            e.preventDefault();
            try {
                await register(
                    document.getElementById('regUser').value,
                    document.getElementById('regEmail').value,
                    document.getElementById('regPass').value,
                    document.getElementById('regRole').value
                );
            } catch (err) {
                document.getElementById('regErr').textContent = err.message;
            }
        };
    }

    async function renderEventsList() {
        clearApp();
        try {
            const eventsResponse = await loadEvents();
            const events = eventsResponse.data;
            const sec = document.createElement('section');
            sec.innerHTML = '<h2>الفعاليات المتاحة</h2>';
            const grid = document.createElement('div');
            grid.className = 'event-grid';
            events.forEach((ev) => {
                const card = document.createElement('article');
                card.className = 'event-card';
                card.innerHTML = `
          <img src="${ev?.image}" alt="${ev?.name}" />
          <div class="event-content">
            <h3>${ev?.name ? ev.name : ''}</h3>
            <div>${ev?.category ? ev.category : ''}</div>
            <div>${ev?.description ? ev.description : ''}</div>
            <div>${ev?.date ? formatDate(ev?.date) : ''} - ${
                    ev?.venue ? ev.venue : ''
                }</div>
            <div>السعر: ${ev?.price} ج.م</div>
          </div>
        `;
                const btn = document.createElement('button');
                btn.textContent = 'احجز الآن';
                btn.onclick = () => bookEvent(ev._id);
                card.appendChild(btn);
                grid.appendChild(card);
            });
            sec.appendChild(grid);
            appContainer.appendChild(sec);
        } catch (err) {
            appContainer.textContent = 'خطأ في تحميل الفعاليات.';
        }
    }

    function renderEventsControlPanel() {
        clearApp();
        const sec = document.createElement('section');
        sec.innerHTML = '<h2>لوحة التحكم للمسؤول</h2>';
        const form = document.createElement('form');
        form.id = 'adminForm';
        form.innerHTML = `
      <input type="text" id="evtName" placeholder="اسم الفعالية" required />
      <textarea id="evtDesc" placeholder="الوصف" required></textarea>
      <input type="text" id="evtCat" placeholder="التصنيف" required />
      <input type="date" id="evtDate" required />
      <input type="text" id="evtLoc" placeholder="المكان" required />
      <input type="number" id="evtPrice" placeholder="السعر" min="0" required />
      <input type="url" id="evtImg" placeholder="رابط الصورة" required />
      <button type="submit">إضافة / تحديث الفعالية</button>
    `;
        sec.appendChild(form);

        const list = document.createElement('div');
        list.id = 'adminList';
        sec.appendChild(list);
        appContainer.appendChild(sec);

        let editingId = null;

        async function refreshList() {
            try {
                const eventsResponse = await loadEvents();
                const events = eventsResponse.data;
                list.innerHTML = '';
                events.forEach((ev) => {
                    const row = document.createElement('div');
                    row.dataset.id = ev._id;
                    row.className = 'admin-row';
                    row.innerHTML = `
                        <span>${ev.name ? ev.name : ''}</span> -
                        <span>${ev.category ? ev.category : ''}</span> -
                        <span>${ev.description ? ev.description : ''}</span> -
                        <span>${ev.date ? formatDate(ev.date) : ''}</span> -

                        <span>${ev.venue ? ev.venue : ''}</span> -
                        
                        <span>${ev.price ? ev.price : ''}</span> -

                        <button data-id="${ev._id}" class="edit">تعديل</button>
                        <button data-id="${ev._id}" class="del">حذف</button>
                    `;
                    list.appendChild(row);
                });
                list.querySelectorAll('.edit').forEach(
                    (btn) =>
                        (btn.onclick = async () => {
                            console.log('edit', btn.dataset.id);
                            const id = btn.dataset.id;
                            const eventsResponse = await loadEvents();
                            const ev = eventsResponse.data.find(
                                (e) => e._id === id
                            );
                            editingId = id;
                            console.log('editingId', editingId);
                            console.log('ev', ev);
                            document.getElementById('evtName').value = ev?.name;
                            document.getElementById('evtDesc').value =
                                ev?.description;
                            document.getElementById('evtCat').value =
                                ev?.category;
                            const dateObj = new Date(ev?.date);
                            const formattedDate = dateObj
                                .toISOString()
                                .split('T')[0];
                            document.getElementById('evtDate').value =
                                formattedDate;
                            document.getElementById('evtLoc').value = ev?.venue;
                            document.getElementById('evtPrice').value =
                                ev?.price;
                            document.getElementById('evtImg').value = ev?.image;
                        })
                );
                list.querySelectorAll('.del').forEach(
                    (btn) =>
                        (btn.onclick = async () => {
                            if (confirm('هل تريد الحذف؟')) {
                                await deleteEvent(btn.dataset.id);
                                refreshList();
                            }
                        })
                );
            } catch {
                list.textContent = 'خطأ في تحميل القائمة.';
            }
        }

        form.onsubmit = async (e) => {
            e.preventDefault();
            const ev = {
                name: document.getElementById('evtName').value,
                description: document.getElementById('evtDesc').value,
                category: document.getElementById('evtCat').value,
                date: document.getElementById('evtDate').value,
                venue: document.getElementById('evtLoc').value,
                price: Number(document.getElementById('evtPrice').value),
                image: document.getElementById('evtImg').value,
            };
            try {
                if (editingId) {
                    await updateEvent(editingId, ev);
                    editingId = null;
                } else {
                    await createEvent(ev);
                }
                form.reset();
                refreshList();
                alert('تم الحفظ');
            } catch (err) {
                alert('خطأ: ' + err.message);
            }
        };

        refreshList();
    }
    function renderApp() {
        setNav();
        if (!isLoggedIn()) {
            showLoginForm();
        } else {
            renderEventsList();
        }
    }

    function isLoggedIn() {
        return !!localStorage.getItem('token');
    }

    // Initialize app
    (async () => {
        const token = localStorage.getItem('token');

        setNav();
        if (!token) showLoginForm();
        else renderEventsList();
    })();
})();
