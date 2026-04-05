window.updateCustomDropdownUI = function(value) {
    const globalCategory = document.getElementById('globalCategorySelect');
    if (globalCategory) globalCategory.value = value;
    notifyHomeRuntime();
};

window.renderTimerDropdown = function() {
    notifyHomeRuntime();
};

window.renderCategoryChips = function() {
    const container = document.getElementById('taskCategoryChips');
    if (!container) return;
    container.innerHTML = '';
    const currentInputRaw = document.getElementById('taskCategoryInput')?.value;
    const currentVal = currentInputRaw && currentInputRaw.trim() !== '' ? currentInputRaw : 'Livre';
    
    userCategories.forEach(cat => {
        const div = document.createElement('div');
        div.className = `cat-chip ${cat.name === currentVal ? 'active' : ''} ${isEditingCategories ? 'editing' : ''}`;
        div.setAttribute('data-val', cat.name);
        div.innerHTML = `<i class="fas ${cat.icon || 'fa-tag'}"></i> ${escapeHtml(cat.name)}`;
        
        if (isEditingCategories && cat.name !== 'Livre') {
            const delBtn = document.createElement('span');
            delBtn.className = 'cat-delete-btn';
            delBtn.innerHTML = '<i class="fas fa-times"></i>';
            delBtn.onclick = (e) => {
                e.stopPropagation();
                userCategories = userCategories.filter(c => c.name !== cat.name);
                saveUserCategories();
                renderCategoryChips();
                renderTimerDropdown();
                renderGoalCategoryOptions();
            };
            div.appendChild(delBtn);
        } else if (!isEditingCategories) {
            div.onclick = () => {
                document.querySelectorAll('#taskCategoryChips .cat-chip').forEach(c => c.classList.remove('active'));
                div.classList.add('active');
                document.getElementById('taskCategoryInput').value = cat.name;
            };
        }
        container.appendChild(div);
    });

    if (!isEditingCategories) {
        const addBtn = document.createElement('div');
        addBtn.className = 'cat-chip add-new';
        addBtn.innerHTML = '<i class="fas fa-plus"></i> Nova';
        addBtn.onclick = () => {
            const inputDiv = document.createElement('div');
            inputDiv.className = 'cat-chip';
            inputDiv.innerHTML = `<input type="text" id="newCatInput" placeholder="Nome..." style="background: transparent; border: none; outline: none; color: white; width: 80px; font-size: 0.8rem;">`;
            container.replaceChild(inputDiv, addBtn);
            const inp = document.getElementById('newCatInput');
            inp.focus();
            const finishAdd = () => {
                const val = inp.value.trim();
                if (val && !userCategories.find(c => c.name === val)) {
                    userCategories.push({ name: val, icon: 'fa-tag' });
                    saveUserCategories();
                    renderTimerDropdown();
                    renderGoalCategoryOptions();
                }
                renderCategoryChips();
            };
            inp.onblur = finishAdd;
            inp.onkeydown = (e) => { if (e.key === 'Enter') finishAdd(); if (e.key === 'Escape') renderCategoryChips(); };
        };
        container.appendChild(addBtn);
    }
};

window.toggleCategoryEdit = function() {
    isEditingCategories = !isEditingCategories;
    const btn = document.getElementById('btnEditCategories');
    if(btn) btn.style.color = isEditingCategories ? '#ef4444' : 'var(--text-secondary)';
    renderCategoryChips();
};

// ==========================================
// WIZARD ONBOARDING (V2)
// ==========================================
let wizSelectedCats = ['Trabalho'];
