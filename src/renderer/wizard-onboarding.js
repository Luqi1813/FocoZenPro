window.selectWizCategory = function(cat) {
    const el = event.currentTarget;
    if (wizSelectedCats.includes(cat)) {
        if (wizSelectedCats.length > 1) {
            wizSelectedCats = wizSelectedCats.filter(c => c !== cat);
            el.classList.remove('active');
        } else {
            customAlert('Aviso', 'Selecione pelo menos uma categoria.');
        }
    } else {
        wizSelectedCats.push(cat);
        el.classList.add('active');
    }
    const hiddenInp = document.getElementById('wizardCategoryInput');
    if(hiddenInp) hiddenInp.value = wizSelectedCats.join(',');
};

window.nextWizard = function(currentStep) {
    if (currentStep === 1) {
        const input = document.getElementById('wizardNameInput');
        if (!input.value.trim()) { customAlert('Aviso', 'Por favor, digite seu nome.'); return; }
        username = input.value.trim();
    }
    if (currentStep === 2) {
        if (wizSelectedCats.length > 0) {
             const primaryCat = wizSelectedCats[0];
             document.getElementById('globalCategorySelect').value = primaryCat;
             window.updateCustomDropdownUI(primaryCat);
        }
    }
    document.getElementById(`wizardStep${currentStep}`).classList.remove('active');
    document.getElementById(`wizardStep${currentStep + 1}`).classList.add('active');
    
    document.getElementById(`dot${currentStep}`).classList.remove('active');
    document.getElementById(`dot${currentStep + 1}`).classList.add('active');
};

window.prevWizard = function(currentStep) {
    document.getElementById(`wizardStep${currentStep}`).classList.remove('active');
    document.getElementById(`wizardStep${currentStep - 1}`).classList.add('active');
    
    document.getElementById(`dot${currentStep}`).classList.remove('active');
    document.getElementById(`dot${currentStep - 1}`).classList.add('active');
};

window.finishWizard = function() {
    if (storageService?.writeStorageValue) {
        storageService.writeStorageValue(storageKeys.USERNAME, username);
    } else {
        localStorage.setItem(storageKeys.USERNAME, username);
    }

    writeJsonStorage(storageKeys.WIZARD_CATEGORIES, wizSelectedCats);
    updateSidebarProfile();
    notifyStatsRuntime();
    notifyAssistantRuntime();
    document.getElementById('wizardModal').classList.remove('active');
};

// ==========================================
// ROTEAMENTO V2
// ==========================================