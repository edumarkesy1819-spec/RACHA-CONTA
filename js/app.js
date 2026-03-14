// Registro do Service Worker para PWA (Offline)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('ServiceWorker registrado com sucesso: ', registration.scope);
      })
      .catch((error) => {
        console.log('Falha ao registrar o ServiceWorker: ', error);
      });
  });
}

// Estado global (Configurações e utilitários)
const state = {
    history: JSON.parse(localStorage.getItem('racha_history')) || [],
    settings: JSON.parse(localStorage.getItem('racha_settings')) || { pixKey: '', friends: [] },
    currentRacha: JSON.parse(sessionStorage.getItem('current_racha')) || null
};

// Funções de formatação
const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

// Salvar no storage
const saveHistory = () => {
    localStorage.setItem('racha_history', JSON.stringify(state.history));
};

const saveSettings = () => {
    if (!state.settings.friends) state.settings.friends = [];
    localStorage.setItem('racha_settings', JSON.stringify(state.settings));
};

const saveCurrentRacha = (racha) => {
    sessionStorage.setItem('current_racha', JSON.stringify(racha));
    state.currentRacha = racha;
};

const clearCurrentRacha = () => {
    sessionStorage.removeItem('current_racha');
    state.currentRacha = null;
};

// Funções de Inicialização por Página
document.addEventListener('DOMContentLoaded', () => {
    if (!state.settings.friends) state.settings.friends = [];

    const isHistory = document.getElementById('screen-history') !== null;
    const isCalculator = document.getElementById('screen-calculator') !== null;
    const isCheckout = document.getElementById('screen-checkout') !== null;
    const isSettings = document.getElementById('screen-settings') !== null;

    if (isHistory) initHistory();
    if (isCalculator) initCalculator();
    if (isCheckout) initCheckout();
    if (isSettings) initSettings();
});

// =======================
// TELA 1: Histórico
// =======================
function initHistory() {
    const totalSpentEl = document.getElementById('history-total-spent');
    const historyListEl = document.getElementById('history-list');
    
    // Calcula o total gasto no mês corrente
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    let totalSpent = 0;
    let historyHtml = '';

    const validHistory = state.history.filter(item => {
        const d = new Date(item.date);
        if(d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            totalSpent += item.yourShare;
        }
        return true;
    });

    totalSpentEl.innerText = formatCurrency(totalSpent);

    if (validHistory.length === 0) {
        historyHtml = '<p class="text-center text-slate-500 py-8">Nenhum racha registrado ainda. Comece agora!</p>';
    } else {
        // Ordena por data (mais recente primeiro)
        validHistory.sort((a,b) => new Date(b.date) - new Date(a.date));
        
        validHistory.forEach(item => {
            const dateObj = new Date(item.date);
            const dateStr = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
            
            historyHtml += `
            <div class="px-4 mb-3">
                <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-50 dark:border-slate-700 flex items-stretch gap-4">
                    <div class="w-12 h-12 rounded-full bg-primary-light dark:bg-primary/20 flex items-center justify-center shrink-0">
                        <span class="material-symbols-outlined text-slate-800 dark:text-primary-light">receipt_long</span>
                    </div>
                    <div class="flex flex-col justify-between flex-1 min-w-0 py-0.5">
                        <div class="flex justify-between items-start mb-0.5">
                            <h4 class="font-bold text-slate-900 dark:text-white text-base truncate">${item.name || 'Conta Dinâmica'}</h4>
                        </div>
                        <p class="text-sm text-slate-500 dark:text-slate-400">${dateStr} • ${item.peopleCount} pessoas</p>
                        <div class="flex justify-between items-end mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Total: ${formatCurrency(item.total)}</p>
                            <p class="text-base font-bold text-primary dark:text-primary-light">Cada: ${formatCurrency(item.yourShare)}</p>
                        </div>
                    </div>
                </div>
            </div>`;
        });
    }

    historyListEl.innerHTML = historyHtml;
}

// =======================
// TELA 2: Calculadora
// =======================
function initCalculator() {
    let currentTip = 10;
    let selectedFriends = ['Você'];
    let numPeople = 1;

    const inputName = document.getElementById('calc-name');
    const inputTotal = document.getElementById('calc-total');
    const btnCalculate = document.getElementById('btn-calculate');
    const peopleCount = document.getElementById('people-count');
    const friendsListEl = document.getElementById('calc-friends-list');
    const tipButtons = document.querySelectorAll('.tip-btn');
    const displayTotalPerson = document.getElementById('display-total-person');

    const renderFriendsSelection = () => {
        let friendsHtml = `
        <button class="px-4 py-2 rounded-full font-bold shadow-sm transition-colors bg-soft-dusty-pink dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-selection-pink/20 cursor-default">
            Você
        </button>`;

        state.settings.friends.forEach(f => {
            const isSelected = selectedFriends.includes(f.name);
            const bgClass = isSelected 
                ? 'bg-soft-dusty-pink dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-selection-pink/20 font-bold' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium';
            friendsHtml += `
            <button class="friend-sel-btn px-4 py-2 rounded-full shadow-sm transition-colors ${bgClass}" data-name="${f.name}">
                ${f.name}
            </button>`;
        });
        
        if(friendsListEl) friendsListEl.innerHTML = friendsHtml;
        
        document.querySelectorAll('.friend-sel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const name = e.currentTarget.dataset.name;
                if(selectedFriends.includes(name)) {
                    selectedFriends = selectedFriends.filter(n => n !== name);
                } else {
                    selectedFriends.push(name);
                }
                numPeople = selectedFriends.length;
                if(peopleCount) peopleCount.innerText = `${numPeople} Selecionado${numPeople > 1 ? 's' : ''}`;
                renderFriendsSelection();
                updateTotal();
            });
        });
    };

    const updateTotal = () => {
        const val = parseFloat(inputTotal.value || 0);
        let tipAmount = val * (currentTip / 100);
        let finalTotal = val + tipAmount;
        let perPerson = finalTotal / numPeople;
        
        if (displayTotalPerson) {
            displayTotalPerson.innerHTML = `<span class="text-2xl align-top mr-1">R$</span>${perPerson.toFixed(2).replace('.', ',')}`;
        }
        
        btnCalculate.disabled = val <= 0;
        if(btnCalculate.disabled) {
            btnCalculate.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            btnCalculate.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    };

    if(friendsListEl) renderFriendsSelection();

    // Eventos Gorjeta
    tipButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            tipButtons.forEach(b => {
                b.classList.remove('active-pink', 'font-bold', 'border', 'border-selection-pink/20', 'shadow-sm', 'text-slate-800');
                b.classList.add('bg-slate-100', 'dark:bg-slate-800', 'font-medium', 'text-slate-600', 'dark:text-slate-300');
            });
            const tbtn = e.currentTarget;
            tbtn.classList.add('active-pink', 'font-bold', 'border', 'border-selection-pink/20', 'shadow-sm', 'text-slate-800');
            tbtn.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'font-medium', 'text-slate-600', 'dark:text-slate-300');
            
            currentTip = parseFloat(tbtn.dataset.tip);
            updateTotal();
        });
    });

    inputTotal.addEventListener('input', updateTotal);

    // Calcular
    btnCalculate.addEventListener('click', () => {
        const val = parseFloat(inputTotal.value || 0);
        if (val <= 0) return;

        let tipAmount = val * (currentTip / 100);
        let finalTotal = val + tipAmount;
        let perPerson = finalTotal / numPeople;

        const currentRacha = {
            name: inputName.value.trim() || 'Sem nome do Local',
            billAmount: val,
            tipPercent: currentTip,
            tipAmount: tipAmount,
            total: finalTotal,
            peopleCount: numPeople,
            selectedFriends: selectedFriends,
            yourShare: perPerson,
            date: new Date().toISOString()
        };

        saveCurrentRacha(currentRacha);
        window.location.href = 'checkout.html';
    });

    updateTotal();
}

// =======================
// TELA 3: Checkout/PIX
// =======================
function initCheckout() {
    const racha = state.currentRacha;
    if (!racha) {
        window.location.href = 'history.html';
        return;
    }

    const summaryTotalEl = document.getElementById('checkout-summary-total');
    const perPersonEl = document.getElementById('checkout-per-person');
    const debtListEl = document.getElementById('checkout-debt-list');
    const btnFinish = document.getElementById('btn-finish');
    const inputPix = document.getElementById('settings-pix');
    
    // Atualizar UI Geral
    summaryTotalEl.innerText = formatCurrency(racha.total);
    perPersonEl.innerText = formatCurrency(racha.yourShare) + ' por pessoa';

    if (inputPix && state.settings.pixKey) {
        inputPix.value = state.settings.pixKey;
    }

    // Gerar Lista
    let listHtml = '';
    
    if (racha.peopleCount === 1) {
        listHtml = '<p class="text-slate-500 text-center py-4">Total individual. Nada a dividir.</p>';
    } else {
        const others = racha.selectedFriends.filter(f => f !== 'Você');
        others.forEach(friendName => {
            listHtml += `
            <div class="flex items-center gap-4 bg-light-muted-blue dark:bg-slate-800 px-4 min-h-[80px] py-3 rounded-xl shadow-sm border border-transparent dark:border-slate-700">
                <div class="flex-1 flex flex-col justify-center">
                    <p class="text-slate-900 dark:text-slate-100 text-base font-bold">${friendName} deve a você</p>
                    <p class="text-soft-muted-blue dark:text-blue-400 text-sm font-bold mt-0.5">${formatCurrency(racha.yourShare)}</p>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                    <button onclick="copyPixOrMessage(${racha.yourShare.toFixed(2)}, '${friendName}')" class="rounded-lg h-9 px-3 bg-soft-dusty-pink text-slate-900 text-sm font-medium shadow-sm transition-colors active:scale-95">
                        Copiar Msg
                    </button>
                    <button onclick="shareWhatsapp(${racha.yourShare.toFixed(2)}, '${racha.name}', '${friendName}')" class="rounded-lg bg-white/50 dark:bg-slate-900 size-10 flex items-center justify-center text-slate-900 dark:text-slate-100 active:scale-95 shadow-sm">
                        <span class="material-symbols-outlined text-xl">share</span>
                    </button>
                </div>
            </div>`;
        });
    }
    
    if (debtListEl) debtListEl.innerHTML += listHtml;

    // Salvar e Finalizar
    btnFinish.addEventListener('click', () => {
        // Atualiza a chave PIX nas settings caso editada na tela
        if (inputPix && inputPix.value !== state.settings.pixKey) {
            state.settings.pixKey = inputPix.value;
            saveSettings();
        }

        // Salva histórico
        state.history.push(racha);
        saveHistory();
        
        clearCurrentRacha();
        window.location.href = 'history.html';
    });
}

// =======================
// TELA 4: Ajustes
// =======================
function initSettings() {
    const inputPix = document.getElementById('settings-pix-input');
    const inputFriend = document.getElementById('settings-friend-input');
    const btnAddFriend = document.getElementById('btn-add-friend');
    const friendsListEl = document.getElementById('settings-friends-list');

    // Carregar PIX
    if(inputPix) {
        inputPix.value = state.settings.pixKey || '';
        inputPix.addEventListener('blur', () => {
            state.settings.pixKey = inputPix.value.trim();
            saveSettings();
        });
    }

    // Renderizar Lista de Amigos
    const renderFriends = () => {
        if(!friendsListEl) return;
        
        if (state.settings.friends.length === 0) {
            friendsListEl.innerHTML = '<p class="text-slate-400 text-sm py-2">Nenhum amigo salvo.</p>';
            return;
        }

        let html = '';
        state.settings.friends.forEach((f, idx) => {
            html += `
            <div class="flex items-center gap-1 bg-soft-dusty-pink dark:bg-slate-700 px-4 py-2 rounded-full shadow-sm">
                <span class="text-slate-900 dark:text-slate-100 font-medium">${f.name}</span>
                <button class="remove-friend-btn flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors ml-1" data-idx="${idx}">
                    <span class="material-symbols-outlined text-[18px]">close</span>
                </button>
            </div>`;
        });
        friendsListEl.innerHTML = html;

        // Listeners para remover
        document.querySelectorAll('.remove-friend-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.idx);
                state.settings.friends.splice(idx, 1);
                saveSettings();
                renderFriends();
            });
        });
    };

    // Adicionar Amigo
    if(btnAddFriend && inputFriend) {
        const addFriend = () => {
            const name = inputFriend.value.trim();
            if(name.length > 0 && !state.settings.friends.some(f => f.name.toLowerCase() === name.toLowerCase())) {
                state.settings.friends.push({ name: name });
                saveSettings();
                inputFriend.value = '';
                renderFriends();
            }
        };

        btnAddFriend.addEventListener('click', addFriend);
        inputFriend.addEventListener('keypress', (e) => {
            if(e.key === 'Enter') addFriend();
        });
    }

    renderFriends();
}

// Funções Utilitárias Globais
window.copyPixOrMessage = (amount, friendName = 'Galera') => {
    let pix = state.settings.pixKey || document.getElementById('settings-pix')?.value || '[Sua Chave PIX]';
    let text = `Opa ${friendName}, o valor do racha ficou ${formatCurrency(amount)}. Minha chave PIX é: ${pix}`;
    
    navigator.clipboard.writeText(text).then(() => {
        alert("Mensagem copiada para a área de transferência!");
    });
}

window.shareWhatsapp = (amount, local, friendName = 'Galera') => {
    let pix = state.settings.pixKey || document.getElementById('settings-pix')?.value || '[Sua Chave PIX]';
    let text = `Opa ${friendName}! A conta no *${local}* deu ${formatCurrency(state.currentRacha.total)} (com gorjeta). Dividindo certinho, ficou *${formatCurrency(amount)}* para cada. %0A%0ASegue minha chave Pix: ${pix}`;
    
    window.open(`https://wa.me/?text=${text}`, '_blank');
}
