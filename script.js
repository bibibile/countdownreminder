document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('reminder-form');
    const itemNameInput = document.getElementById('item-name');
    const itemDescInput = document.getElementById('item-desc');
    const expiryDateInput = document.getElementById('expiry-date');
    const reminderList = document.getElementById('reminder-list');

    // Default to today
    const today = new Date().toISOString().split('T')[0];
    expiryDateInput.setAttribute('min', today);

    // Electron Window Controls
    const pinBtn = document.getElementById('pin-btn');
    const closeBtn = document.getElementById('close-btn');

    if (window.electronAPI) {
        pinBtn.addEventListener('click', async () => {
            const isPinned = await window.electronAPI.togglePin();
            if (isPinned) {
                pinBtn.classList.add('pinned');
                pinBtn.title = '取消固定';
            } else {
                pinBtn.classList.remove('pinned');
                pinBtn.title = '固定在最顶层';
            }
        });

        closeBtn.addEventListener('click', () => {
            window.electronAPI.closeApp();
        });
    }

    const showFormBtn = document.getElementById('show-form-btn');
    const formContainer = document.getElementById('form-container');
    const cancelAddBtn = document.getElementById('cancel-add-btn');

    showFormBtn.addEventListener('click', () => {
        formContainer.classList.remove('collapsed');
        showFormBtn.style.opacity = '0'; 
        showFormBtn.style.pointerEvents = 'none';
        itemNameInput.focus();
    });

    cancelAddBtn.addEventListener('click', () => {
        formContainer.classList.add('collapsed');
        showFormBtn.style.opacity = '1';
        showFormBtn.style.pointerEvents = 'auto';
        
        itemNameInput.value = '';
        itemDescInput.value = '';
        expiryDateInput.value = '';
        editingId = null;
    });

    let reminders = JSON.parse(localStorage.getItem('reminders')) || [];
    let editingId = null;

    function saveReminders() {
        localStorage.setItem('reminders', JSON.stringify(reminders));
    }

    function calculateStatus(expiryDateStr) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiryDate = new Date(expiryDateStr);
        expiryDate.setHours(0, 0, 0, 0);

        const diffTime = expiryDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { class: 'status-expired', text: `已过期 ${Math.abs(diffDays)} 天` };
        } else if (diffDays === 0) {
            return { class: 'status-warning', text: '今天到期' };
        } else if (diffDays <= 7) {
            return { class: 'status-warning', text: `还有 ${diffDays} 天到期` };
        } else {
            return { class: 'status-safe', text: `还有 ${diffDays} 天到期` };
        }
    }

    function renderReminders() {
        reminderList.innerHTML = '';

        if (reminders.length === 0) {
            reminderList.innerHTML = '<div class="empty-state">暂无提醒事项，赶快添加一个吧！</div>';
            return;
        }

        // Sort by closest expiry
        reminders.sort((a, b) => new Date(a.date) - new Date(b.date));

        reminders.forEach((reminder, index) => {
            const status = calculateStatus(reminder.date);
            const itemEl = document.createElement('div');
            itemEl.className = `reminder-item ${status.class}`;
            
            itemEl.innerHTML = `
                <div class="item-info">
                    <span class="item-name">${escapeHTML(reminder.name)}</span>
                    ${reminder.desc ? `<span class="item-desc">${escapeHTML(reminder.desc)}</span>` : ''}
                    <span class="item-status">${status.text} (${reminder.date})</span>
                </div>
                <div class="item-actions">
                    <button class="edit-btn" data-id="${reminder.id}" title="编辑这行">✎</button>
                    <button class="delete-btn" data-index="${index}" title="删除">×</button>
                </div>
            `;
            
            reminderList.appendChild(itemEl);
        });

        // Binding events to delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const idx = this.getAttribute('data-index');
                deleteReminder(idx);
            });
        });

        // Binding events to edit buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                editReminder(id);
            });
        });
    }

    function editReminder(id) {
        const reminder = reminders.find(r => r.id === id);
        if (!reminder) return;
        
        editingId = id;
        itemNameInput.value = reminder.name;
        itemDescInput.value = reminder.desc || '';
        expiryDateInput.value = reminder.date;
        
        // Open the form
        formContainer.classList.remove('collapsed');
        showFormBtn.style.opacity = '0';
        showFormBtn.style.pointerEvents = 'none';
        itemNameInput.focus();
    }

    function deleteReminder(index) {
        reminders.splice(index, 1);
        saveReminders();
        renderReminders();
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = itemNameInput.value.trim();
        const desc = itemDescInput.value.trim();
        const date = expiryDateInput.value;

        if (name && date) {
            if (editingId) {
                const index = reminders.findIndex(r => r.id === editingId);
                if (index !== -1) {
                    reminders[index].name = name;
                    reminders[index].desc = desc;
                    reminders[index].date = date;
                }
                editingId = null;
            } else {
                reminders.push({ id: Date.now(), name, desc, date });
            }
            saveReminders();
            renderReminders();
            
            itemNameInput.value = '';
            itemDescInput.value = '';
            expiryDateInput.value = '';

            // Collapse form on success
            formContainer.classList.add('collapsed');
            showFormBtn.style.opacity = '1';
            showFormBtn.style.pointerEvents = 'auto';
        }
    });

    // Simple XSS protection
    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag])
        );
    }

    // Init call
    renderReminders();
});
