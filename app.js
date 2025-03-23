class FinanceManager {
    constructor() {
        this.wallets = [];
        this.currencies = [];
        this.transactions = [];
        this.currentDate = new Date();
        this.elements = {};

        // Inicializar
        this.initializeElements();
        this.loadFromLocalStorage();
        
        // Cargar porcentajes de distribución
        this.loadDistributionPercentages();
        
        // Actualizar la UI con los datos cargados
        this.updateUI();
        
        // Mostrar mensaje de bienvenida en consola
        console.log('FinanceManager inicializado correctamente');
        
        // Asegurar que la lista de monedas se muestre
        this.showCurrenciesList();
        
        // Si no hay monedas, mostrar un mensaje para agregar
        if (this.currencies.length === 0) {
            this.showAddCurrencyPrompt();
        }
        
        // Configurar eventos
        this.setupEventListeners();
    }

    initializeElements() {
        this.walletsList = document.getElementById('walletsList');
        this.transactionForm = document.getElementById('transactionForm');
        this.transactionType = document.getElementById('transactionType');
        this.walletSelect = document.getElementById('walletSelect');
        this.categorySelect = document.getElementById('categorySelect');
        this.addWalletBtn = document.getElementById('addWalletBtn');
        this.addCurrencyBtn = document.getElementById('addCurrencyBtn');
        this.currenciesList = document.getElementById('currenciesList');
        
        // Referencias a elementos del historial
        this.showHistoryBtn = document.getElementById('showHistoryBtn');
        this.transactionHistory = document.getElementById('transactionHistory');
        this.closeHistoryBtn = document.getElementById('closeHistoryBtn');
        this.historyList = document.getElementById('historyList');
        this.walletFilter = document.getElementById('walletFilter');
        this.typeFilter = document.getElementById('typeFilter');
        this.dateFromFilter = document.getElementById('dateFromFilter');
        this.dateToFilter = document.getElementById('dateToFilter');

        // Referencias a botones de la barra de navegación
        this.navRegisterBtn = document.getElementById('navRegisterBtn');
        this.navTransferBtn = document.getElementById('navTransferBtn');
        
        // Establecer el año actual en el encabezado
        document.getElementById('year').textContent = new Date().getFullYear();
    }

    setupEventListeners() {
        this.addWalletBtn.addEventListener('click', () => this.addNewWallet());
        this.addCurrencyBtn.addEventListener('click', () => this.showAddCurrencyDialog());
        this.showHistoryBtn.addEventListener('click', () => this.toggleTransactionHistory(true));
        this.closeHistoryBtn.addEventListener('click', () => this.toggleTransactionHistory(false));
        
        // Eventos para los botones de la barra de navegación
        this.navRegisterBtn.addEventListener('click', () => this.showRegisterDialog());
        this.navTransferBtn.addEventListener('click', () => this.showTransferDialog());
        
        // Evento para la calculadora de distribución
        document.getElementById('distributionCalculatorLink').addEventListener('click', () => this.showDistributionCalculator());
        
        // Configurar eventos para los filtros del historial
        this.walletFilter.addEventListener('change', () => this.updateTransactionHistory());
        this.typeFilter.addEventListener('change', () => this.updateTransactionHistory());
        this.dateFromFilter.addEventListener('change', () => this.updateTransactionHistory());
        this.dateToFilter.addEventListener('change', () => this.updateTransactionHistory());
    }

    // Método para mostrar/ocultar el historial de transacciones
    toggleTransactionHistory(show) {
        if (show) {
            this.transactionHistory.style.display = 'flex';
            this.populateWalletFilter();
            this.setDefaultDateFilters();
            this.updateTransactionHistory();
        } else {
            this.transactionHistory.style.display = 'none';
        }
    }

    // Método para llenar el filtro de billeteras
    populateWalletFilter() {
        this.walletFilter.innerHTML = '<option value="all">Todas las billeteras</option>';
        this.wallets.forEach(wallet => {
            const option = document.createElement('option');
            option.value = wallet.id;
            option.textContent = `${wallet.name} (${wallet.currency})`;
            this.walletFilter.appendChild(option);
        });
    }

    // Establecer fechas predeterminadas (último mes)
    setDefaultDateFilters() {
        const today = new Date();
        const lastMonth = new Date();
        lastMonth.setMonth(today.getMonth() - 1);
        
        this.dateFromFilter.value = this.formatDateForInput(lastMonth);
        this.dateToFilter.value = this.formatDateForInput(today);
    }

    // Formatear fecha para inputs de tipo date
    formatDateForInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Actualizar la lista de transacciones según los filtros
    updateTransactionHistory() {
        const walletId = this.walletFilter.value;
        const type = this.typeFilter.value;
        const dateFrom = this.dateFromFilter.value ? new Date(this.dateFromFilter.value) : null;
        const dateTo = this.dateToFilter.value ? new Date(this.dateToFilter.value) : null;
        
        // Si hay fecha hasta, ajustarla para incluir todo el día
        if (dateTo) {
            dateTo.setHours(23, 59, 59, 999);
        }
        
        // Filtrar transacciones
        let filteredTransactions = [...this.transactions];
        
        // Filtrar solo las transacciones reales (excluir creaciones de categorías)
        filteredTransactions = filteredTransactions.filter(t => 
            t.type === 'income' || 
            t.type === 'expense' || 
            t.type === 'transfer_in' || 
            t.type === 'transfer_out'
        );
        
        // Ordenar por fecha (más recientes primero)
        filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Aplicar filtros
        if (walletId !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => t.walletId.toString() === walletId);
        }
        
        if (type !== 'all') {
            if (type === 'transfer') {
                filteredTransactions = filteredTransactions.filter(t => 
                    t.type === 'transfer_in' || t.type === 'transfer_out'
                );
            } else {
                filteredTransactions = filteredTransactions.filter(t => t.type === type);
            }
        }
        
        if (dateFrom) {
            filteredTransactions = filteredTransactions.filter(t => new Date(t.date) >= dateFrom);
        }
        
        if (dateTo) {
            filteredTransactions = filteredTransactions.filter(t => new Date(t.date) <= dateTo);
        }
        
        // Mostrar las transacciones
        this.renderTransactionHistory(filteredTransactions);
    }

    // Renderizar la lista de transacciones
    renderTransactionHistory(transactions) {
        this.historyList.innerHTML = '';
        
        if (transactions.length === 0) {
            const noTransactions = document.createElement('div');
            noTransactions.className = 'no-transactions';
            noTransactions.textContent = 'No hay transacciones que coincidan con los filtros seleccionados.';
            this.historyList.appendChild(noTransactions);
            return;
        }
        
        transactions.forEach(transaction => {
            const wallet = this.wallets.find(w => w.id.toString() === transaction.walletId);
            if (!wallet) return; // Omitir si la billetera ya no existe
            
            const item = document.createElement('div');
            item.className = 'history-item';
            
            // Determinar el tipo y clase de transacción
            let typeText = '';
            let typeClass = '';
            let amountClass = '';
            let amountPrefix = '';
            
            if (transaction.type === 'income') {
                typeText = 'Ingreso';
                typeClass = 'type-income';
                amountClass = 'amount-positive';
                amountPrefix = '+';
            } else if (transaction.type === 'expense') {
                typeText = 'Egreso';
                typeClass = 'type-expense';
                amountClass = 'amount-negative';
                amountPrefix = '-';
            } else if (transaction.type === 'transfer_in') {
                typeText = 'Transferencia Recibida';
                typeClass = 'type-transfer';
                amountClass = 'amount-positive';
                amountPrefix = '+';
            } else if (transaction.type === 'transfer_out') {
                typeText = 'Transferencia Enviada';
                typeClass = 'type-transfer';
                amountClass = 'amount-negative';
                amountPrefix = '-';
            }
            
            // Formatear fecha
            const date = new Date(transaction.date);
            const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            
            // Construir el HTML de la transacción
            item.innerHTML = `
                <div class="transaction-details">
                    <span class="transaction-type ${typeClass}">${typeText}</span>
                    <div class="transaction-amount ${amountClass}">${amountPrefix}${transaction.amount.toFixed(2)} ${wallet.currency}</div>
                    <div class="transaction-wallet">Billetera: ${wallet.name}</div>
                    ${transaction.category ? `<div class="transaction-category">Categoría: ${transaction.category}</div>` : ''}
                    <div class="transaction-description">Descripción: ${transaction.description || 'Sin descripción'}</div>
                    <div class="transaction-date">Fecha: ${formattedDate}</div>
                </div>
                <div class="transaction-actions">
                    <button class="delete-transaction-btn" data-id="${transaction.id || transaction.date}">
                        <i class="fas fa-undo"></i> Revertir
                    </button>
                </div>
            `;
            
            // Agregar evento al botón de eliminar
            const deleteBtn = item.querySelector('.delete-transaction-btn');
            deleteBtn.addEventListener('click', () => this.confirmRevertTransaction(transaction));
            
            this.historyList.appendChild(item);
        });
    }

    // Mostrar diálogo de confirmación para revertir una transacción
    confirmRevertTransaction(transaction) {
        const wallet = this.wallets.find(w => w.id.toString() === transaction.walletId);
        if (!wallet) return;
        
        let message = '';
        
        if (transaction.type === 'income') {
            message = `¿Estás seguro que deseas revertir este ingreso de ${transaction.amount.toFixed(2)} ${wallet.currency}?`;
        } else if (transaction.type === 'expense') {
            message = `¿Estás seguro que deseas revertir este egreso de ${transaction.amount.toFixed(2)} ${wallet.currency}?`;
        } else if (transaction.type === 'transfer_in' || transaction.type === 'transfer_out') {
            message = '¿Estás seguro que deseas revertir esta transferencia? Se restaurarán los saldos de ambas billeteras.';
        }
        
        const html = `
            <div class="overlay" id="revertOverlay">
                <div class="confirm-dialog">
                    <h3>Revertir Transacción</h3>
                    <p>${message}</p>
                    <div class="confirm-dialog-buttons">
                        <button class="cancel" id="cancelRevert">Cancelar</button>
                        <button class="confirm" id="confirmRevert">Revertir</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', html);
        
        const overlay = document.getElementById('revertOverlay');
        const cancelBtn = document.getElementById('cancelRevert');
        const confirmBtn = document.getElementById('confirmRevert');
        
        const closeDialog = () => {
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        };
        
        cancelBtn.onclick = closeDialog;
        
        confirmBtn.onclick = () => {
            this.revertTransaction(transaction);
            closeDialog();
        };
    }

    // Revertir una transacción
    revertTransaction(transaction) {
        const transactionId = transaction.id;
        const wallet = this.wallets.find(w => w.id.toString() === transaction.walletId);
        
        if (!wallet) {
            this.showSuccessMessage('No se puede revertir: la billetera ya no existe', 'error');
            return;
        }
        
        // Revertir el saldo de la billetera según el tipo de transacción
        if (transaction.type === 'income') {
            // Descontar el ingreso
            wallet.balance -= transaction.amount;
        } else if (transaction.type === 'expense') {
            // Devolver el egreso
            wallet.balance += transaction.amount;
        } else if (transaction.type === 'transfer_in' || transaction.type === 'transfer_out') {
            // Para transferencias, necesitamos encontrar la transacción relacionada usando el ID común
            
            // Encontrar la otra parte de la transferencia
            const relatedType = transaction.type === 'transfer_in' ? 'transfer_out' : 'transfer_in';
            const relatedTransaction = this.transactions.find(t => 
                t.id === transactionId && t.type === relatedType
            );
            
            if (relatedTransaction) {
                const otherWallet = this.wallets.find(w => w.id.toString() === relatedTransaction.walletId);
                
                if (otherWallet) {
                    // Revertir ambos lados de la transferencia
                    if (transaction.type === 'transfer_in') {
                        wallet.balance -= transaction.amount; // Receptor devuelve
                        otherWallet.balance += relatedTransaction.amount; // Emisor recupera
                    } else {
                        wallet.balance += transaction.amount; // Emisor recupera
                        otherWallet.balance -= relatedTransaction.amount; // Receptor devuelve
                    }
                    
                    // Eliminar la transacción relacionada
                    this.transactions = this.transactions.filter(t => 
                        !(t.id === transactionId && t.type === relatedType)
                    );
                }
            }
        }
        
        // Eliminar la transacción
        this.transactions = this.transactions.filter(t => 
            !(t.id === transactionId && t.type === transaction.type && t.walletId === transaction.walletId)
        );
        
        // Guardar cambios y actualizar UI
        this.saveToLocalStorage();
        this.updateUI();
        this.updateTransactionHistory();
        
        this.showSuccessMessage('Transacción revertida correctamente');
    }

    addNewWallet() {
        if (this.currencies.length === 0) {
            alert('Primero debes crear una moneda en Flujo de Caja Anual');
            return;
        }

        const html = `
            <div class="overlay" id="walletOverlay">
                <div class="confirm-dialog wallet-dialog">
                    <div class="dialog-header">
                        <h3>Nueva Billetera</h3>
                        <p class="dialog-subtitle">Complete los datos de la billetera</p>
                    </div>
                    
                    <form id="walletForm">
                        <div class="form-group">
                            <label for="walletName">
                                <i class="fas fa-wallet"></i>
                                Nombre de la billetera
                            </label>
                            <input type="text" 
                                   id="walletName" 
                                   required 
                                   placeholder="Ej: Cuenta Bancaria"
                                   autocomplete="off">
                        </div>

                        <div class="form-group">
                            <label for="walletCurrency">
                                <i class="fas fa-coins"></i>
                                Moneda
                            </label>
                            <select id="walletCurrency" required>
                                <option value="">Seleccione una moneda</option>
                                ${this.currencies.map(currency => 
                                    `<option value="${currency.code}">${currency.code} - ${currency.name}</option>`
                                ).join('')}
                            </select>
                        </div>

                        <div class="form-group">
                            <label>
                                <i class="fas fa-palette"></i>
                                Color de la billetera
                            </label>
                            <div class="color-selector">
                                <div class="predefined-colors">
                                    ${[
                                        '#2196F3', '#4CAF50', '#F44336', '#FFC107', 
                                        '#9C27B0', '#FF5722', '#607D8B', '#E91E63',
                                        '#3F51B5', '#009688', '#795548', '#673AB7'
                                    ].map(color => `
                                        <div class="color-option" 
                                             style="background-color: ${color};"
                                             data-color="${color}">
                                        </div>
                                    `).join('')}
                                </div>
                                <div class="custom-color">
                                    <input type="text" 
                                           id="customColorHex" 
                                           placeholder="#000000"
                                           pattern="^#[0-9A-Fa-f]{6}$"
                                           title="Código de color hexadecimal (ej: #FF0000)">
                                    <input type="color" 
                                           id="colorPicker"
                                           value="#2196F3">
                                </div>
                            </div>
                        </div>

                        <div class="dialog-buttons">
                            <button type="button" class="cancel-btn" id="cancelWallet">
                                <i class="fas fa-times"></i>
                                Cancelar
                            </button>
                            <button type="submit" class="confirm-btn">
                                <i class="fas fa-check"></i>
                                Crear Billetera
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);

        const overlay = document.getElementById('walletOverlay');
        const form = document.getElementById('walletForm');
        const cancelBtn = document.getElementById('cancelWallet');
        const colorPicker = document.getElementById('colorPicker');
        const customColorHex = document.getElementById('customColorHex');
        const colorOptions = document.querySelectorAll('.color-option');

        // Manejar selección de colores predefinidos
        colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remover selección previa
                colorOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                
                const color = option.dataset.color;
                colorPicker.value = color;
                customColorHex.value = color;
            });
        });

        // Sincronizar color picker con input hexadecimal
        colorPicker.addEventListener('input', (e) => {
            customColorHex.value = e.target.value;
            // Remover selección de colores predefinidos
            colorOptions.forEach(opt => opt.classList.remove('selected'));
        });

        // Validar y sincronizar input hexadecimal
        customColorHex.addEventListener('input', (e) => {
            const value = e.target.value;
            if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                colorPicker.value = value;
                // Remover selección de colores predefinidos
                colorOptions.forEach(opt => opt.classList.remove('selected'));
            }
        });

        const closeDialog = () => {
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        };

        cancelBtn.onclick = closeDialog;

        form.onsubmit = (e) => {
            e.preventDefault();
            
            const wallet = {
                id: Date.now(),
                name: document.getElementById('walletName').value,
                currency: document.getElementById('walletCurrency').value,
                balance: 0,
                color: colorPicker.value
            };

            this.wallets.push(wallet);
            this.saveToLocalStorage();
            this.updateUI();
            closeDialog();
        };
    }

    handleTransaction(e) {
        e.preventDefault();

        // Verificar que se haya seleccionado una categoría
        const categorySelect = document.getElementById('categorySelect');
        if (!categorySelect.value) {
            alert('Debe seleccionar una categoría para registrar el movimiento');
            return;
        }

        const transaction = {
            id: Date.now() + Math.random().toString(36).substr(2, 5), // ID único
            type: this.transactionType.value,
            walletId: this.walletSelect.value,
            category: categorySelect.value, // Añadir la categoría al objeto de transacción
            amount: parseFloat(document.getElementById('amount').value),
            description: document.getElementById('description').value,
            date: new Date().toISOString()
        };

        const wallet = this.wallets.find(w => w.id === parseInt(transaction.walletId));
        if (wallet) {
            wallet.balance += transaction.type === 'income' ? transaction.amount : -transaction.amount;
        }

        this.transactions.push(transaction);
        this.saveToLocalStorage();
        this.updateUI();
        this.transactionForm.reset();
    }

    updateCategoryOptions() {
        const typeSelect = document.getElementById('transactionType');
        const categorySelect = document.getElementById('categorySelect');
        const type = typeSelect.value;

        // Limpiar el select
        categorySelect.innerHTML = '<option value="">Seleccione categoría</option>';

        // Obtener las categorías eliminadas
        const deletedCategoriesJSON = localStorage.getItem('deletedCategories');
        const deletedCategories = deletedCategoriesJSON ? JSON.parse(deletedCategoriesJSON) : {};
        const deletedUSDCategories = deletedCategories['USD'] || [];
        const deletedARSCategories = deletedCategories['ARS'] || [];

        if (type === 'income') {
            // Filtrar las categorías eliminadas
            const filteredCategories = this.categories.income.filter(category => 
                !deletedUSDCategories.includes(category) && 
                !deletedARSCategories.includes(category)
            );
            
            // Ordenar alfabéticamente las categorías
            const sortedCategories = [...filteredCategories].sort();
            sortedCategories.forEach(cat => {
                const option = new Option(cat, cat);
                categorySelect.add(option);
            });
        } else if (type === 'expense') {
            // Crear y agregar grupo de inversiones
            const investmentGroup = document.createElement('optgroup');
            investmentGroup.label = 'Inversiones';
            const sortedInvestments = [...this.categories.expense.investment].sort();
            sortedInvestments.forEach(cat => {
                investmentGroup.appendChild(new Option(cat, cat));
            });
            categorySelect.appendChild(investmentGroup);

            // Crear y agregar grupo de gastos
            const expensesGroup = document.createElement('optgroup');
            expensesGroup.label = 'Gastos';
            const sortedExpenses = [...this.categories.expense.expenses].sort();
            sortedExpenses.forEach(cat => {
                expensesGroup.appendChild(new Option(cat, cat));
            });
            categorySelect.appendChild(expensesGroup);
        }
    }

    addOptGroup(label, options) {
        const group = document.createElement('optgroup');
        group.label = label;
        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt;
            option.textContent = opt;
            group.appendChild(option);
        });
        this.categorySelect.appendChild(group);
    }

    addCategoryOption(category) {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        this.categorySelect.appendChild(option);
    }

    updateUI() {
        this.updateWalletsList();
        this.updateWalletSelect();
        this.updateCashFlowTable();
    }

    updateWalletsList() {
        this.walletsList.innerHTML = '';
        this.wallets.forEach(wallet => {
            const card = document.createElement('div');
            card.className = 'wallet-card';
            card.style.backgroundColor = wallet.color;
            card.innerHTML = `
                <button class="delete-wallet" data-wallet-id="${wallet.id}">
                    <i class="fas fa-times"></i>
                </button>
                <div class="wallet-name">${wallet.name}</div>
                <div class="wallet-balance">${wallet.balance.toFixed(2)} ${wallet.currency}</div>
            `;
            
            const deleteBtn = card.querySelector('.delete-wallet');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.confirmDeleteWallet(wallet);
            });
            
            this.walletsList.appendChild(card);
        });
    }

    confirmDeleteWallet(wallet) {
        const html = `
            <div class="overlay" id="deleteOverlay">
                <div class="confirm-dialog">
                    <h3>Eliminar Billetera</h3>
                    <p>¿Estás seguro que deseas eliminar la billetera "${wallet.name}"?</p>
                    <p>Esta acción no se puede deshacer y se eliminarán todas las transacciones asociadas.</p>
                    <div class="confirm-dialog-buttons">
                        <button class="cancel" id="cancelDelete">Cancelar</button>
                        <button class="confirm" id="confirmDelete">Eliminar</button>
                    </div>
                </div>
            </div>
        `;

        // Agregar el HTML al body
        document.body.insertAdjacentHTML('beforeend', html);

        // Obtener referencias a los elementos
        const overlay = document.getElementById('deleteOverlay');
        const cancelBtn = document.getElementById('cancelDelete');
        const confirmBtn = document.getElementById('confirmDelete');

        // Función para eliminar el diálogo
        const closeDialog = () => {
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        };

        // Evento para el botón cancelar
        cancelBtn.onclick = closeDialog;

        // Evento para el botón eliminar
        confirmBtn.onclick = () => {
            // Eliminar la billetera
            this.wallets = this.wallets.filter(w => w.id !== wallet.id);
            this.transactions = this.transactions.filter(t => t.walletId !== wallet.id.toString());
            
            // Actualizar storage y UI
            this.saveToLocalStorage();
            this.updateUI();
            
            // Cerrar el diálogo
            closeDialog();
        };
    }

    updateWalletSelect() {
        this.walletSelect.innerHTML = '<option value="">Seleccione billetera</option>';
        this.wallets.forEach(wallet => {
            const option = document.createElement('option');
            option.value = wallet.id;
            option.textContent = `${wallet.name} (${wallet.currency})`;
            this.walletSelect.appendChild(option);
        });
    }

    getRandomColor() {
        const colors = ['#003087', '#F0B90B', '#26A17B', '#FF4B4B', '#4CAF50', '#2196F3'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    formatCurrency(amount, currencyCode) {
        // Redondear a 2 decimales
        const roundedAmount = parseFloat(amount).toFixed(2);
        
        // Formatear con el símbolo de la moneda
        return `${roundedAmount} ${currencyCode}`;
    }

    saveToLocalStorage() {
        // Asegurar que el storage esté limpio antes de guardar
        localStorage.removeItem('wallets');
        localStorage.removeItem('transactions');
        localStorage.removeItem('currencies');

        // Ahora guardar los datos actualizados
        localStorage.setItem('wallets', JSON.stringify(this.wallets));
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
        localStorage.setItem('currencies', JSON.stringify(this.currencies));
        
        // Imprimir en consola para debug
        console.log('Datos guardados en localStorage:', {
            wallets: this.wallets,
            transactions: this.transactions,
            currencies: this.currencies
        });
    }
    
    loadFromLocalStorage() {
        const walletsJson = localStorage.getItem('wallets');
        const transactionsJson = localStorage.getItem('transactions');
        const currenciesJson = localStorage.getItem('currencies');
        
        if (walletsJson) this.wallets = JSON.parse(walletsJson);
        if (transactionsJson) this.transactions = JSON.parse(transactionsJson);
        if (currenciesJson) this.currencies = JSON.parse(currenciesJson);
        
        // Imprimir en consola para debug
        console.log('Datos cargados desde localStorage:', {
            wallets: this.wallets,
            transactions: this.transactions,
            currencies: this.currencies
        });
    }

    // Agregar este método para mostrar el diálogo de transferencia
    showTransferDialog() {
        const html = `
            <div class="overlay" id="transferOverlay">
                <div class="confirm-dialog transfer-dialog">
                    <h3>Transferir entre Billeteras</h3>
                    <form id="transferForm">
                        <div class="form-group">
                            <label>Desde:</label>
                            <select id="fromWallet" required>
                                <option value="">Seleccione billetera origen</option>
                                ${this.wallets.map(w => `
                                    <option value="${w.id}">${w.name} (${w.balance.toFixed(2)} ${w.currency})</option>
                                `).join('')}
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Hacia:</label>
                            <select id="toWallet" required>
                                <option value="">Seleccione billetera destino</option>
                                ${this.wallets.map(w => `
                                    <option value="${w.id}">${w.name} (${w.balance.toFixed(2)} ${w.currency})</option>
                                `).join('')}
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Monto:</label>
                            <input type="number" id="transferAmount" required min="0" step="0.01">
                        </div>

                        <div class="form-group">
                            <label>Descripción:</label>
                            <input type="text" id="transferDescription" placeholder="Opcional">
                        </div>

                        <div class="confirm-dialog-buttons">
                            <button type="button" class="cancel" id="cancelTransfer">Cancelar</button>
                            <button type="submit" class="confirm">Transferir</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);

        const overlay = document.getElementById('transferOverlay');
        const form = document.getElementById('transferForm');
        const cancelBtn = document.getElementById('cancelTransfer');
        const fromSelect = document.getElementById('fromWallet');
        const toSelect = document.getElementById('toWallet');

        const closeDialog = () => {
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        };

        cancelBtn.onclick = closeDialog;

        form.onsubmit = (e) => {
            e.preventDefault();
            
            const fromWalletId = parseInt(fromSelect.value);
            const toWalletId = parseInt(toSelect.value);
            const amount = parseFloat(document.getElementById('transferAmount').value);
            const description = document.getElementById('transferDescription').value;

            if (fromWalletId === toWalletId) {
                alert('No puedes transferir a la misma billetera');
                return;
            }

            const fromWallet = this.wallets.find(w => w.id === fromWalletId);
            if (fromWallet.balance < amount) {
                alert('Saldo insuficiente');
                return;
            }

            // Realizar la transferencia
            this.executeTransfer(fromWalletId, toWalletId, amount, description);
            closeDialog();
        };
    }

    executeTransfer(fromId, toId, amount, description) {
        // Actualizar balances
        const fromWallet = this.wallets.find(w => w.id === fromId);
        const toWallet = this.wallets.find(w => w.id === toId);

        fromWallet.balance -= amount;
        toWallet.balance += amount;

        // Generar un ID de transacción único para ambas partes de la transferencia
        const transactionId = Date.now() + Math.random().toString(36).substr(2, 5);
        const timestamp = new Date().toISOString();
        
        this.transactions.push({
            id: transactionId, // Mismo ID para ambas partes de la transferencia
            type: 'transfer_out',
            walletId: fromId.toString(),
            amount: amount,
            description: `Transferencia a ${toWallet.name}: ${description}`,
            date: timestamp
        });

        this.transactions.push({
            id: transactionId, // Mismo ID para ambas partes de la transferencia
            type: 'transfer_in',
            walletId: toId.toString(),
            amount: amount,
            description: `Transferencia desde ${fromWallet.name}: ${description}`,
            date: timestamp
        });

        this.saveToLocalStorage();
        this.updateUI();
    }

    showRegisterDialog() {
        const html = `
            <div class="overlay" id="registerOverlay">
                <div class="confirm-dialog register-dialog">
                    <div class="dialog-header">
                        <h3>Registrar Movimiento</h3>
                    </div>
                    
                    <form id="registerForm">
                        <div class="form-group">
                            <label>Tipo de Movimiento</label>
                            <select id="registerTransactionType" required>
                                <option value="">Seleccione tipo</option>
                                <option value="income">Ingreso</option>
                                <option value="expense">Egreso</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Billetera</label>
                            <select id="registerWalletSelect" required>
                                <option value="">Seleccione billetera</option>
                                ${this.wallets.map(w => `
                                    <option value="${w.id}">${w.name} (${w.currency})</option>
                                `).join('')}
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Categoría</label>
                            <select id="registerCategorySelect" required>
                                <option value="">Seleccione categoría</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>
                                <i class="fas fa-dollar-sign"></i>
                                Monto
                            </label>
                            <input type="number" id="registerAmount" required min="0" step="0.01">
                        </div>

                        <div class="form-group">
                            <label>
                                <i class="fas fa-comment"></i>
                                Descripción
                            </label>
                            <input type="text" id="registerDescription" placeholder="Opcional">
                        </div>

                        <div class="dialog-buttons">
                            <button type="button" class="cancel-btn" id="cancelRegister">
                                <i class="fas fa-times"></i>
                                Cancelar
                            </button>
                            <button type="submit" class="confirm-btn">
                                <i class="fas fa-check"></i>
                                Registrar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);

        const overlay = document.getElementById('registerOverlay');
        const form = document.getElementById('registerForm');
        const cancelBtn = document.getElementById('cancelRegister');
        const typeSelect = document.getElementById('registerTransactionType');
        const walletSelect = document.getElementById('registerWalletSelect');
        const categorySelect = document.getElementById('registerCategorySelect');

        // Evento para actualizar las categorías cuando cambia el tipo de transacción
        typeSelect.addEventListener('change', () => {
            this.updateRegisterCategoryOptions(typeSelect.value, categorySelect);
        });

        // Actualizar las categorías también cuando cambia la billetera
        walletSelect.addEventListener('change', () => {
            if (typeSelect.value) {
                this.updateRegisterCategoryOptions(typeSelect.value, categorySelect);
            }
        });

        cancelBtn.onclick = () => overlay.remove();

        form.onsubmit = (e) => {
            e.preventDefault();
            
            // Verificar que se haya seleccionado una categoría
            if (!categorySelect.value) {
                alert('Debe seleccionar una categoría para registrar el movimiento');
                return;
            }
            
            const transaction = {
                id: Date.now() + Math.random().toString(36).substr(2, 5), // ID único
                type: typeSelect.value,
                walletId: walletSelect.value,
                category: categorySelect.value,
                amount: parseFloat(document.getElementById('registerAmount').value),
                description: document.getElementById('registerDescription').value,
                date: new Date().toISOString()
            };

            const wallet = this.wallets.find(w => w.id === parseInt(transaction.walletId));
            if (transaction.type === 'income') {
                wallet.balance += transaction.amount;
            } else {
                if (wallet.balance < transaction.amount) {
                    alert('Saldo insuficiente');
                    return;
                }
                wallet.balance -= transaction.amount;
            }

            this.transactions.push(transaction);
            this.saveToLocalStorage();
            this.updateUI();
            
            // Mostrar mensaje de éxito
            const successMessage = document.createElement('div');
            successMessage.className = 'success-message';
            successMessage.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <span>Transacción registrada con éxito</span>
            `;
            
            document.body.appendChild(successMessage);
            
            // Eliminar mensaje después de 3 segundos
            setTimeout(() => {
                if (successMessage.parentNode) {
                    successMessage.parentNode.removeChild(successMessage);
                }
            }, 3000);
            
            overlay.remove();
        };
    }

    updateRegisterCategoryOptions(type, categorySelect) {
        // Limpiar el select
        categorySelect.innerHTML = '<option value="">Seleccione categoría</option>';

        // Obtener las categorías eliminadas
        const deletedCategoriesJSON = localStorage.getItem('deletedCategories');
        const deletedCategories = deletedCategoriesJSON ? JSON.parse(deletedCategoriesJSON) : {};
        
        // Obtener la moneda seleccionada en el formulario
        const walletSelect = document.getElementById('registerWalletSelect');
        const selectedWalletId = walletSelect.value;
        if (!selectedWalletId) return;
        
        // Determinar la moneda de la billetera seleccionada
        const selectedWallet = this.wallets.find(w => w.id === parseInt(selectedWalletId));
        if (!selectedWallet) return;
        
        const currencyCode = selectedWallet.currency;
        const deletedCurrencyCategories = deletedCategories[currencyCode] || [];

        if (type === 'income') {
            // Conjunto para almacenar todas las categorías (evitar duplicados)
            const categories = new Set();
            
            // Añadir categorías de transacciones existentes
            this.transactions.forEach(transaction => {
                if (transaction.type === 'income') {
                    const wallet = this.wallets.find(w => w.id.toString() === transaction.walletId);
                    if (wallet && wallet.currency === currencyCode && transaction.category) {
                        // Solo añadir si no está en la lista de eliminadas
                        if (!deletedCurrencyCategories.includes(transaction.category)) {
                            categories.add(transaction.category);
                        }
                    }
                }
            });
            
            // No agregamos categorías predefinidas para ninguna moneda
            
            // Obtener categorías personalizadas para esta moneda
            const customCategoriesJSON = localStorage.getItem('customCategories') || '{}';
            const customCategories = JSON.parse(customCategoriesJSON);
            const currencyCustomCategories = customCategories[currencyCode] || [];
            
            // Añadir categorías personalizadas para esta moneda
            currencyCustomCategories
                .filter(cat => !deletedCurrencyCategories.includes(cat))
                .forEach(cat => categories.add(cat));
            
            // Convertir a array y ordenar
            const sortedCategories = Array.from(categories).sort();
            
            if (sortedCategories.length === 0) {
                categorySelect.innerHTML += '<option value="">No hay categorías disponibles</option>';
                categorySelect.disabled = true;
            } else {
                categorySelect.disabled = false;
                sortedCategories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category;
                    categorySelect.appendChild(option);
                });
            }
            
            // Mostrar botón para añadir categoría personalizada
            const addCategoryBtn = document.getElementById('addIncomeCategory');
            addCategoryBtn.style.display = 'block';
            addCategoryBtn.dataset.currency = currencyCode;
            
        } else if (type === 'expense') {
            // Implementación para gastos...
            // ...
        }
    }

    showAddCurrencyDialog() {
        const html = `
            <div class="overlay" id="currencyOverlay">
                <div class="confirm-dialog">
                    <h3>Agregar Nueva Moneda</h3>
                    <form id="currencyForm">
                        <div class="form-group">
                            <label>Código de Moneda:</label>
                            <input type="text" id="currencyCode" required placeholder="Ej: USD, EUR, ARS" maxlength="3">
                        </div>
                        <div class="form-group">
                            <label>Nombre de Moneda:</label>
                            <input type="text" id="currencyName" required placeholder="Ej: Dólar Estadounidense">
                        </div>
                        <div class="confirm-dialog-buttons">
                            <button type="button" class="cancel">Cancelar</button>
                            <button type="submit" class="confirm">Agregar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);

        const overlay = document.getElementById('currencyOverlay');
        const form = document.getElementById('currencyForm');
        const cancelBtn = form.querySelector('.cancel');

        cancelBtn.onclick = () => overlay.remove();

        form.onsubmit = (e) => {
            e.preventDefault();
            const code = document.getElementById('currencyCode').value.toUpperCase();
            const name = document.getElementById('currencyName').value;

            if (this.currencies.some(c => c.code === code)) {
                alert('Esta moneda ya existe');
                return;
            }

            this.currencies.push({ code, name });
            this.saveToLocalStorage();
            
            // Actualizar la interfaz y mostrar explícitamente la lista de monedas
            this.updateUI();
            this.showCurrenciesList();
            this.showSuccessMessage(`Moneda ${code} agregada correctamente`);
            
            overlay.remove();
        };
    }

    showCurrenciesList() {
        console.log('Mostrando lista de monedas:', this.currencies);
        const currenciesList = document.getElementById('currenciesList');
        
        // Limpiar la lista de monedas
        currenciesList.innerHTML = '';
        
        // Si no hay monedas, mostrar un mensaje
        if (this.currencies.length === 0) {
            currenciesList.innerHTML = `
                <div class="currency-tag no-currency">
                    <span>No hay monedas agregadas</span>
                </div>
            `;
            return;
        }
        
        // Agregar cada moneda como una etiqueta
        this.currencies.forEach(currency => {
            const currencyTag = document.createElement('div');
            currencyTag.className = 'currency-tag';
            currencyTag.innerHTML = `
                <span class="currency-code">${currency.code}</span>
                <button class="delete-currency-btn" data-currency="${currency.code}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            currenciesList.appendChild(currencyTag);
        });

        // Agregar eventos a los botones de eliminar
        document.querySelectorAll('.delete-currency-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const currencyCode = btn.dataset.currency;
                console.log(`Botón eliminar moneda clickeado: ${currencyCode}`);
                this.confirmDeleteCurrency(currencyCode);
            });
        });
    }

    confirmDeleteCurrency(currencyCode) {
        // Verificar si hay billeteras asociadas con esta moneda
        const walletsWithCurrency = this.wallets.filter(wallet => wallet.currency === currencyCode);
        
        let message = `<p>¿Estás seguro que deseas eliminar la moneda "${currencyCode}"?</p>`;
        
        if (walletsWithCurrency.length > 0) {
            message += `<p class="warning-text">ADVERTENCIA: Existen ${walletsWithCurrency.length} billeteras con esta moneda. Al eliminarla, perderás todas estas billeteras y sus transacciones asociadas.</p>`;
            
            // Listar las billeteras que se eliminarán
            message += '<p>Billeteras que se eliminarán:</p><ul>';
            walletsWithCurrency.forEach(wallet => {
                message += `<li>${wallet.name} (${this.formatCurrency(wallet.balance, currencyCode)})</li>`;
            });
            message += '</ul>';
        }
        
        const html = `
            <div class="overlay" id="deleteCurrencyOverlay">
                <div class="confirm-dialog">
                    <h3>Eliminar Moneda</h3>
                    ${message}
                    <div class="confirm-dialog-buttons">
                        <button class="cancel" id="cancelDeleteCurrency">Cancelar</button>
                        <button class="confirm" id="confirmDeleteCurrency">Eliminar</button>
                    </div>
                </div>
            </div>
        `;

        // Eliminar diálogo existente si hay alguno
        const existingOverlay = document.getElementById('deleteCurrencyOverlay');
        if (existingOverlay) {
            existingOverlay.parentNode.removeChild(existingOverlay);
        }

        // Agregar el HTML al body
        document.body.insertAdjacentHTML('beforeend', html);

        // Obtener referencias a los elementos
        const overlay = document.getElementById('deleteCurrencyOverlay');
        const cancelBtn = document.getElementById('cancelDeleteCurrency');
        const confirmBtn = document.getElementById('confirmDeleteCurrency');

        // Función para eliminar el diálogo
        const closeDialog = () => {
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        };

        // Evento para el botón cancelar
        cancelBtn.onclick = closeDialog;

        // Evento para el botón eliminar
        confirmBtn.onclick = () => {
            console.log(`Confirmación de eliminación para moneda: ${currencyCode}`);
            
            // Eliminar la moneda
            this.deleteCurrency(currencyCode);
            
            // Cerrar el diálogo antes de actualizar la UI
            closeDialog();
        };
    }
    
    deleteCurrency(currencyCode) {
        console.log(`Iniciando eliminación de moneda: ${currencyCode}`);
        console.log(`Estado antes de eliminar - Monedas:`, this.currencies);
        
        // 1. Eliminar todas las billeteras con esta moneda
        const walletsToDelete = this.wallets.filter(wallet => wallet.currency === currencyCode);
        console.log(`Billeteras a eliminar:`, walletsToDelete);
        
        walletsToDelete.forEach(wallet => {
            // Eliminar todas las transacciones asociadas a esta billetera
            this.transactions = this.transactions.filter(transaction => 
                !(transaction.walletId === wallet.id || 
                  (transaction.type === 'transfer' && transaction.toWalletId === wallet.id))
            );
        });
        
        // Eliminar las billeteras con esta moneda
        this.wallets = this.wallets.filter(wallet => wallet.currency !== currencyCode);
        
        // 2. Eliminar la moneda de la lista de monedas
        this.currencies = this.currencies.filter(currency => currency.code !== currencyCode);
        
        console.log(`Estado después de eliminar - Monedas:`, this.currencies);
        
        // 3. Eliminar categorías específicas de esta moneda
        // Eliminar categorías personalizadas
        const customCategoriesJSON = localStorage.getItem('customCategories') || '{}';
        const customCategories = JSON.parse(customCategoriesJSON);
        if (customCategories[currencyCode]) {
            delete customCategories[currencyCode];
            localStorage.setItem('customCategories', JSON.stringify(customCategories));
            console.log(`Categorías personalizadas eliminadas para moneda ${currencyCode}`);
        }
        
        // Eliminar categorías eliminadas (historial)
        const deletedCategoriesJSON = localStorage.getItem('deletedCategories') || '{}';
        const deletedCategories = JSON.parse(deletedCategoriesJSON);
        if (deletedCategories[currencyCode]) {
            delete deletedCategories[currencyCode];
            localStorage.setItem('deletedCategories', JSON.stringify(deletedCategories));
            console.log(`Historial de categorías eliminadas limpiado para moneda ${currencyCode}`);
        }
        
        // Eliminar gastos fijos personalizados
        const customFixedExpensesJSON = localStorage.getItem('customFixedExpenses') || '{}';
        const customFixedExpenses = JSON.parse(customFixedExpensesJSON);
        if (customFixedExpenses[currencyCode]) {
            delete customFixedExpenses[currencyCode];
            localStorage.setItem('customFixedExpenses', JSON.stringify(customFixedExpenses));
            console.log(`Gastos fijos personalizados eliminados para moneda ${currencyCode}`);
        }
        
        // 4. Actualizar la interfaz de usuario
        this.saveToLocalStorage();
        this.showSuccessMessage(`Moneda ${currencyCode} eliminada correctamente`);
        this.updateUI();
        
        // 5. Mostrar la lista de monedas actualizada
        setTimeout(() => {
            this.showCurrenciesList();
        }, 500); // Pequeño retraso para asegurar que la UI se actualiza
    }

    updateCashFlowTable() {
        const table = document.getElementById('cashFlowTable');
        if (!table) return;

        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const yearElem = document.getElementById('year');
        if (yearElem) yearElem.textContent = currentDate.getFullYear();

        // Limpiar la tabla existente
        table.innerHTML = '';
        
        // Configurar el estilo de la tabla
        table.style.width = '100%';
        table.style.tableLayout = 'fixed';
        
        // Crear estructura base de la tabla con colgroup para controlar anchos
        const colgroup = document.createElement('colgroup');
        colgroup.innerHTML = `
            <col style="width: 200px">
            <col span="12" style="width: calc((100% - 200px) / 12)">
        `;
        table.appendChild(colgroup);
        
        // Crear cabecera con meses
        const thead = document.createElement('thead');
        
        // Fila con el título
        const headerRow = document.createElement('tr');
        const headerCell = document.createElement('th');
        headerCell.textContent = 'Flujo de Caja Anual';
        headerCell.style.textAlign = 'left';
        headerRow.appendChild(headerCell);
        
        // Celdas vacías para meses en la fila de título
        for (let i = 0; i < 12; i++) {
            const emptyCell = document.createElement('th');
            headerRow.appendChild(emptyCell);
        }
        
        // Fila con los nombres de los meses
        const monthsRow = document.createElement('tr');
        const emptyCell = document.createElement('th');
        monthsRow.appendChild(emptyCell);
        
        const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
        for (let i = 0; i < 12; i++) {
            const monthCell = document.createElement('th');
            monthCell.textContent = months[i];
            if (i === currentMonth) {
                monthCell.classList.add('current-month');
            }
            monthsRow.appendChild(monthCell);
        }
        
        thead.appendChild(headerRow);
        thead.appendChild(monthsRow);
        table.appendChild(thead);
        
        // Crear contenedor principal para los grupos de moneda
        const mainBody = document.createElement('tbody');
        table.appendChild(mainBody);
        
        // Función para formatear montos
        const formatAmount = (amount, currencySymbol = '') => {
            if (amount <= 0) return '0.00';
            return amount.toFixed(2) + (currencySymbol ? ` ${currencySymbol}` : '');
        };
        
        // Crear un array para almacenar temporalmente las entradas por moneda
        const entriesByCurrency = {};
        // Objeto para almacenar los totales mensuales por moneda
        const totalsByCurrency = {};
        
        // Primer paso: generar todas las entradas de cada moneda y guardarlas temporalmente
        this.currencies.forEach(currency => {
            const rows = [];
            const monthlyTotals = {
                income: new Array(12).fill(0),
                expense: new Array(12).fill(0)
            };
            totalsByCurrency[currency.code] = monthlyTotals;
            
            // Calcular totales por mes
            this.transactions.forEach(transaction => {
                const wallet = this.wallets.find(w => w.id.toString() === transaction.walletId);
                if (wallet && wallet.currency === currency.code) {
                    const transactionDate = new Date(transaction.date);
                    const month = transactionDate.getMonth();
                    const year = transactionDate.getFullYear();
                    
                    if (year === currentDate.getFullYear()) {
                        if (transaction.type === 'income' || transaction.type === 'transfer_in') {
                            monthlyTotals.income[month] += transaction.amount;
                        } else if (transaction.type === 'expense' || transaction.type === 'transfer_out') {
                            monthlyTotals.expense[month] += transaction.amount;
                        }
                    }
                }
            });

            // SECCIÓN DE ENTRADAS
            // Cabecera de la moneda
            const currencyHeader = document.createElement('tr');
            currencyHeader.className = 'currency-header';
            currencyHeader.setAttribute('data-currency', currency.code);
            
            const currencyHeaderCell = document.createElement('td');
            currencyHeaderCell.textContent = `ENTRADAS ${currency.code}`;
            currencyHeaderCell.colSpan = 13;
            currencyHeader.appendChild(currencyHeaderCell);
            rows.push(currencyHeader);
            
            // Obtener todas las categorías de ingreso para esta moneda
            const incomeCategories = new Set();
            
            // Añadir categorías desde las transacciones
            this.transactions.forEach(transaction => {
                const wallet = this.wallets.find(w => w.id.toString() === transaction.walletId);
                if (wallet && wallet.currency === currency.code && 
                    (transaction.type === 'income' || transaction.type === 'transfer_in')) {
                    if (transaction.category) {
                        incomeCategories.add(transaction.category);
                    } else if (transaction.description) {
                        incomeCategories.add(transaction.description);
                    }
                }
            });
            
            // Verificar si hay categorías eliminadas
            const deletedCategoriesJSON = localStorage.getItem('deletedCategories');
            const deletedCategories = deletedCategoriesJSON ? JSON.parse(deletedCategoriesJSON) : {};
            const deletedCurrencyCategories = deletedCategories[currency.code] || [];
            
            // Obtener categorías personalizadas para esta moneda
            const customCategoriesJSON = localStorage.getItem('customCategories') || '{}';
            const customCategories = JSON.parse(customCategoriesJSON);
            const currencyCustomCategories = customCategories[currency.code] || [];
            
            // Añadir categorías personalizadas que no estén eliminadas
            currencyCustomCategories
                .filter(cat => !deletedCurrencyCategories.includes(cat))
                .forEach(cat => {
                    incomeCategories.add(cat);
                });
            
            // No agregamos categorías predefinidas para ninguna moneda
            
            // Convertir a array y ordenar
            const sortedIncomeCategories = Array.from(incomeCategories).sort();
            
            // Crear un objeto para acumular los totales por categoría y mes
            const categoryTotals = {};
            sortedIncomeCategories.forEach(category => {
                categoryTotals[category] = new Array(12).fill(0);
            });
            
            // Calcular totales por categoría
            this.transactions.forEach(transaction => {
                const wallet = this.wallets.find(w => w.id.toString() === transaction.walletId);
                if (wallet && wallet.currency === currency.code && 
                    (transaction.type === 'income' || transaction.type === 'transfer_in')) {
                    const transactionDate = new Date(transaction.date);
                    const month = transactionDate.getMonth();
                    const year = transactionDate.getFullYear();
                    
                    if (year === currentDate.getFullYear()) {
                        const category = transaction.category || transaction.description || 'Sin categoría';
                        if (categoryTotals[category]) {
                            categoryTotals[category][month] += transaction.amount;
                        }
                    }
                }
            });
            
            // Crear filas para cada categoría de ingreso
            sortedIncomeCategories.forEach(category => {
                const categoryRow = document.createElement('tr');
                categoryRow.className = 'income-row';
                categoryRow.setAttribute('data-currency', currency.code);
                
                const categoryCell = document.createElement('td');
                categoryCell.className = 'concept-cell';
                
                // Contenedor flex para el nombre de categoría y el botón de eliminar
                const cellContent = document.createElement('div');
                cellContent.className = 'category-cell-content';
                
                // Texto de la categoría
                const categoryName = document.createElement('span');
                categoryName.textContent = category;
                cellContent.appendChild(categoryName);
                
                // Botón de eliminar
                const deleteButton = document.createElement('button');
                deleteButton.className = 'delete-category-button';
                deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
                deleteButton.onclick = (e) => {
                    e.stopPropagation();
                    this.confirmDeleteCategory(category, currency.code);
                };
                cellContent.appendChild(deleteButton);
                
                categoryCell.appendChild(cellContent);
                categoryRow.appendChild(categoryCell);
                
                // Agregar celdas con montos por mes
                for (let i = 0; i < 12; i++) {
                    const amountCell = document.createElement('td');
                    amountCell.className = 'amount-cell';
                    amountCell.textContent = formatAmount(categoryTotals[category] ? categoryTotals[category][i] : 0);
                    
                    if (i === currentMonth) {
                        amountCell.classList.add('current-month');
                    }
                    
                    categoryRow.appendChild(amountCell);
                }
                
                rows.push(categoryRow);
            });
            
            // Guardar las filas de entrada para esta moneda
            entriesByCurrency[currency.code] = rows;
        });
        
        // Segundo paso: ordenar y añadir las entradas al cuerpo de la tabla
        
        // 1. Primero añadir las entradas de todas las monedas ARS (si existen)
        const arsMonedas = this.currencies.filter(c => c.code === 'ARS');
        arsMonedas.forEach(currency => {
            if (entriesByCurrency[currency.code]) {
                entriesByCurrency[currency.code].forEach(row => {
                    mainBody.appendChild(row);
                });
                
                // Agregar un solo botón "+" para añadir nueva categoría ARS al final
                const addCategoryRow = document.createElement('tr');
                addCategoryRow.className = 'add-category-row';
                addCategoryRow.setAttribute('data-currency', currency.code);
                
                const addCategoryCell = document.createElement('td');
                addCategoryCell.className = 'concept-cell';
                
                const addButton = document.createElement('button');
                addButton.className = 'add-category-button';
                addButton.innerHTML = '<i class="fas fa-plus"></i> Agregar categoría';
                addButton.onclick = () => this.showAddCategoryDialog(currency.code);
                
                addCategoryCell.appendChild(addButton);
                addCategoryRow.appendChild(addCategoryCell);
                
                // Agregar celdas vacías para los meses
                for (let i = 0; i < 12; i++) {
                    const emptyCell = document.createElement('td');
                    addCategoryRow.appendChild(emptyCell);
                }
                
                mainBody.appendChild(addCategoryRow);
            }
        });
        
        // 2. Luego, añadir USD con su espaciador y totales
        const usdMonedas = this.currencies.filter(c => c.code === 'USD');
        usdMonedas.forEach(currency => {
            if (entriesByCurrency[currency.code]) {
                entriesByCurrency[currency.code].forEach(row => {
                    mainBody.appendChild(row);
                });
                
                // Agregar un solo botón "+" para añadir nueva categoría USD al final
                const addCategoryRow = document.createElement('tr');
                addCategoryRow.className = 'add-category-row';
                addCategoryRow.setAttribute('data-currency', currency.code);
                
                const addCategoryCell = document.createElement('td');
                addCategoryCell.className = 'concept-cell';
                
                const addButton = document.createElement('button');
                addButton.className = 'add-category-button';
                addButton.innerHTML = '<i class="fas fa-plus"></i> Agregar categoría';
                addButton.onclick = () => this.showAddCategoryDialog(currency.code);
                
                addCategoryCell.appendChild(addButton);
                addCategoryRow.appendChild(addCategoryCell);
                
                // Agregar celdas vacías para los meses
                for (let i = 0; i < 12; i++) {
                    const emptyCell = document.createElement('td');
                    addCategoryRow.appendChild(emptyCell);
                }
                
                mainBody.appendChild(addCategoryRow);
            }
        });
        
        // 3. Finalmente, añadir entradas de otras monedas que no sean USD ni ARS
        const otrasMonedas = this.currencies.filter(c => c.code !== 'USD' && c.code !== 'ARS');
        otrasMonedas.forEach(currency => {
            if (entriesByCurrency[currency.code]) {
                entriesByCurrency[currency.code].forEach(row => {
                    mainBody.appendChild(row);
                });
                
                // Agregar botón "+" para añadir nueva categoría a esta moneda
                const addCategoryRow = document.createElement('tr');
                addCategoryRow.className = 'add-category-row';
                addCategoryRow.setAttribute('data-currency', currency.code);
                
                const addCategoryCell = document.createElement('td');
                addCategoryCell.className = 'concept-cell';
                
                const addButton = document.createElement('button');
                addButton.className = 'add-category-button';
                addButton.innerHTML = '<i class="fas fa-plus"></i> Agregar categoría';
                addButton.onclick = () => this.showAddCategoryDialog(currency.code);
                
                addCategoryCell.appendChild(addButton);
                addCategoryRow.appendChild(addCategoryCell);
                
                // Agregar celdas vacías para los meses
                for (let i = 0; i < 12; i++) {
                    const emptyCell = document.createElement('td');
                    addCategoryRow.appendChild(emptyCell);
                }
                
                mainBody.appendChild(addCategoryRow);
            }
        });
        
        // Agregar espacio separador después de todas las monedas con más altura
        const separatorRow = document.createElement('tr');
        separatorRow.className = 'separator-row bigger-separator';
        const separatorCell = document.createElement('td');
        separatorCell.colSpan = 13;
        separatorRow.appendChild(separatorCell);
        mainBody.appendChild(separatorRow);
        
        // Agregar un encabezado para la sección de totales
        const totalsHeader = document.createElement('tr');
        totalsHeader.className = 'section-header';
        const totalsHeaderCell = document.createElement('td');
        totalsHeaderCell.textContent = 'RESUMEN DE INGRESOS';
        totalsHeaderCell.colSpan = 13;
        totalsHeader.appendChild(totalsHeaderCell);
        mainBody.appendChild(totalsHeader);
        
        // Filas de totales para cada moneda existente
        this.currencies.forEach(currency => {
            // Crear fila de total para esta moneda
            const totalRow = document.createElement('tr');
            totalRow.className = 'total-row';
            
            const totalCell = document.createElement('td');
            totalCell.textContent = `Total Ingresos ${currency.code}`;
            totalCell.className = 'concept-cell';
            totalRow.appendChild(totalCell);
            
            // Obtener los totales de ingresos para esta moneda
            const currencyTotals = totalsByCurrency[currency.code] ? totalsByCurrency[currency.code].income : new Array(12).fill(0);
            
            // Agregar celdas con totales por mes
            for (let i = 0; i < 12; i++) {
                const totalCell = document.createElement('td');
                totalCell.className = 'amount-cell';
                
                // Mostrar el símbolo adecuado para la moneda
                let currencySymbol = '';
                if (currency.code === 'ARS') {
                    currencySymbol = '$';
                } else if (currency.code === 'USD') {
                    currencySymbol = '$';
                }
                
                totalCell.textContent = formatAmount(currencyTotals[i], currencySymbol);
                
                if (i === currentMonth) {
                    totalCell.classList.add('current-month');
                }
                
                totalRow.appendChild(totalCell);
            }
            
            mainBody.appendChild(totalRow);
        });
        
        // Agregar otro separador después de los totales de ingresos con más altura
        const afterTotalsSeparator = document.createElement('tr');
        afterTotalsSeparator.className = 'separator-row bigger-separator';
        const afterTotalsSeparatorCell = document.createElement('td');
        afterTotalsSeparatorCell.colSpan = 13;
        afterTotalsSeparator.appendChild(afterTotalsSeparatorCell);
        mainBody.appendChild(afterTotalsSeparator);

        // Agregar sección de porcentajes de inversión
        const percentagesHeader = document.createElement('tr');
        percentagesHeader.className = 'section-header percentages-header';
        const percentagesHeaderCell = document.createElement('td');
        percentagesHeaderCell.colSpan = 13;
        percentagesHeaderCell.textContent = 'DISTRIBUCIÓN DE PORCENTAJES';
        percentagesHeader.appendChild(percentagesHeaderCell);
        mainBody.appendChild(percentagesHeader);
        
        // Cargar los porcentajes guardados
        const savedPercentages = this.loadDistributionPercentages();
        
        // Verificar que los porcentajes fueron cargados correctamente
        console.log('Porcentajes cargados en updateCashFlowTable:', savedPercentages);
        
        // Definir los porcentajes que vamos a mostrar
        const percentageCategories = [
            { name: `${savedPercentages.investment}% Inversión`, key: 'investment', value: savedPercentages.investment },
            { name: `${savedPercentages.savings}% Ahorro Neto`, key: 'savings', value: savedPercentages.savings },
            { name: `${savedPercentages.expenses}% Gastos`, key: 'expenses', value: savedPercentages.expenses },
            { name: `${savedPercentages.targetSavings}% Ahorro con Objetivo`, key: 'targetSavings', value: savedPercentages.targetSavings }
        ];
        
        // Crear filas para cada porcentaje
        percentageCategories.forEach(category => {
            const percentageRow = document.createElement('tr');
            percentageRow.className = 'percentage-row';
            percentageRow.setAttribute('data-category', category.key);
            
            const percentageCell = document.createElement('td');
            percentageCell.textContent = category.name;
            percentageCell.className = 'concept-cell';
            percentageRow.appendChild(percentageCell);
            
            // Agregar celdas con valores calculados para cada mes
            for (let i = 0; i < 12; i++) {
                const valueCell = document.createElement('td');
                valueCell.className = 'amount-cell percentage-cell';
                
                // Inicializamos en cero
                let monthValue = 0;
                
                // Calculamos el valor para cada moneda y lo sumamos
                this.currencies.forEach(currency => {
                    const incomeTotals = totalsByCurrency[currency.code] ? 
                        totalsByCurrency[currency.code].income[i] : 0;
                    
                    // Calcular la parte correspondiente según el porcentaje
                    const categoryAmount = incomeTotals * (category.value / 100);
                    monthValue += categoryAmount;
                });
                
                // Formatear el valor con 2 decimales y símbolo de moneda
                let displayValue = monthValue.toFixed(2);
                
                // Si hay monedas, mostramos el símbolo de la primera moneda (simplificación)
                if (this.currencies.length > 0) {
                    const primaryCurrency = this.currencies[0].code;
                    const currencySymbol = primaryCurrency === 'ARS' || primaryCurrency === 'USD' ? '$' : primaryCurrency;
                    displayValue = `${displayValue} ${currencySymbol}`;
                }
                
                valueCell.textContent = displayValue;
                
                if (i === currentMonth) {
                    valueCell.classList.add('current-month');
                }
                
                percentageRow.appendChild(valueCell);
            }
            
            mainBody.appendChild(percentageRow);
        });
        
        // Agregar botón para editar porcentajes
        const editPercentagesRow = document.createElement('tr');
        editPercentagesRow.className = 'edit-percentages-row';
        
        const editCell = document.createElement('td');
        editCell.className = 'concept-cell';
        
        const editButton = document.createElement('button');
        editButton.className = 'edit-percentages-button';
        editButton.innerHTML = '<i class="fas fa-sliders-h"></i> Ajustar distribución';
        editButton.onclick = () => this.showDistributionCalculator();
        
        editCell.appendChild(editButton);
        editPercentagesRow.appendChild(editCell);
        
        // Agregar celdas vacías para los meses
        for (let i = 0; i < 12; i++) {
            const emptyCell = document.createElement('td');
            editPercentagesRow.appendChild(emptyCell);
        }
        
        mainBody.appendChild(editPercentagesRow);
        
        // Agregar espacio separador con más altura
        const beforeFixedExpensesSeparator = document.createElement('tr');
        beforeFixedExpensesSeparator.className = 'separator-row bigger-separator';
        const beforeFixedExpensesSeparatorCell = document.createElement('td');
        beforeFixedExpensesSeparatorCell.colSpan = 13;
        beforeFixedExpensesSeparator.appendChild(beforeFixedExpensesSeparatorCell);
        mainBody.appendChild(beforeFixedExpensesSeparator);
        
        // Crear un objeto para almacenar filas de gastos fijos por moneda
        const fixedExpensesByCurrency = {};
        
        // Preparar filas de gastos fijos para cada moneda
        this.currencies.forEach(currency => {
            const rows = [];
            
            // Cabecera de la moneda
            const currencyHeader = document.createElement('tr');
            currencyHeader.className = 'currency-header';
            currencyHeader.setAttribute('data-currency', currency.code);
            
            const currencyHeaderCell = document.createElement('td');
            currencyHeaderCell.textContent = `SALIDAS FIJAS ${currency.code}`;
            currencyHeaderCell.colSpan = 13;
            currencyHeader.appendChild(currencyHeaderCell);
            rows.push(currencyHeader);
            
            // Obtener categorías de gastos fijos para esta moneda
            const fixedExpenseCategories = new Set();
            
            // No usamos categorías predefinidas para ninguna moneda
            
            // Obtener categorías eliminadas para esta moneda
            const deletedFixedExpensesJSON = localStorage.getItem('deletedFixedExpenses') || '{}';
            const deletedFixedExpenses = JSON.parse(deletedFixedExpensesJSON);
            const deletedCurrencyFixedExpenses = deletedFixedExpenses[currency.code] || [];
            
            // Obtener categorías personalizadas para esta moneda
            const customFixedExpensesJSON = localStorage.getItem('customFixedExpenses') || '{}';
            const customFixedExpenses = JSON.parse(customFixedExpensesJSON);
            const customCurrencyFixedExpenses = customFixedExpenses[currency.code] || [];
            
            // Agregar categorías personalizadas para esta moneda
            customCurrencyFixedExpenses.forEach(cat => {
                fixedExpenseCategories.add(cat);
            });
            
            // Buscar en transacciones existentes
            this.transactions.forEach(transaction => {
                const wallet = this.wallets.find(w => w.id.toString() === transaction.walletId);
                if (wallet && wallet.currency === currency.code && transaction.type === 'expense') {
                    const category = transaction.category || transaction.description;
                    
                    // Incluir cualquier categoría personalizada para esta moneda
                    if (customCurrencyFixedExpenses.includes(category)) {
                        fixedExpenseCategories.add(category);
                    }
                }
            });
            
            // Convertir a array y ordenar
            const sortedFixedExpenseCategories = Array.from(fixedExpenseCategories).sort();
            
            if (sortedFixedExpenseCategories.length === 0) {
                const emptyRow = document.createElement('tr');
                emptyRow.className = 'empty-category-row';
                const emptyCell = document.createElement('td');
                emptyCell.colSpan = 13;
                emptyCell.textContent = ``;
                emptyCell.style.textAlign = 'center';
                emptyRow.appendChild(emptyCell);
                rows.push(emptyRow);
            } else {
                // Crear un objeto para acumular los gastos fijos por categoría y mes
                const fixedExpenseTotals = {};
                sortedFixedExpenseCategories.forEach(category => {
                    fixedExpenseTotals[category] = new Array(12).fill(0);
                });
                
                // Calcular totales por categoría
                this.transactions.forEach(transaction => {
                    const wallet = this.wallets.find(w => w.id.toString() === transaction.walletId);
                    if (wallet && wallet.currency === currency.code && transaction.type === 'expense') {
                        const category = transaction.category || transaction.description;
                        if (fixedExpenseTotals[category]) {
                            const transactionDate = new Date(transaction.date);
                            const month = transactionDate.getMonth();
                            const year = transactionDate.getFullYear();
                            
                            if (year === currentDate.getFullYear()) {
                                fixedExpenseTotals[category][month] += transaction.amount;
                            }
                        }
                    }
                });
                
                // Crear filas para cada categoría de gasto fijo
                sortedFixedExpenseCategories.forEach(category => {
                    const categoryRow = document.createElement('tr');
                    categoryRow.className = 'expense-row';
                    categoryRow.setAttribute('data-currency', currency.code);
                    
                    const categoryCell = document.createElement('td');
                    categoryCell.className = 'concept-cell';
                    
                    // Contenedor flex para el nombre de categoría y el botón de eliminar
                    const cellContent = document.createElement('div');
                    cellContent.className = 'category-cell-content';
                    
                    // Texto de la categoría
                    const categoryName = document.createElement('span');
                    categoryName.textContent = category;
                    cellContent.appendChild(categoryName);
                    
                    // Botón de eliminar
                    const deleteButton = document.createElement('button');
                    deleteButton.className = 'delete-category-button';
                    deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
                    deleteButton.onclick = (e) => {
                        e.stopPropagation();
                        this.confirmDeleteFixedExpenseCategory(category, currency.code);
                    };
                    cellContent.appendChild(deleteButton);
                    
                    categoryCell.appendChild(cellContent);
                    categoryRow.appendChild(categoryCell);
                    
                    // Agregar celdas con valores por mes
                    for (let i = 0; i < 12; i++) {
                        const valueCell = document.createElement('td');
                        valueCell.className = 'amount-cell';
                        
                        // Determinar el símbolo de moneda
                        let currencySymbol = '';
                        if (currency.code === 'ARS') {
                            currencySymbol = '$';
                        } else if (currency.code === 'USD') {
                            currencySymbol = '$';
                        }
                        
                        // Mostrar el valor real si existe, de lo contrario mostrar 0.00
                        const monthlyAmount = fixedExpenseTotals[category][i];
                        valueCell.textContent = monthlyAmount > 0 ? formatAmount(monthlyAmount, currencySymbol) : `0.00`;
                        
                        if (i === currentMonth) {
                            valueCell.classList.add('current-month');
                        }
                        
                        categoryRow.appendChild(valueCell);
                    }
                    
                    rows.push(categoryRow);
                });
            }
            
            // Añadir botón para agregar categoría
            const addCategoryRow = document.createElement('tr');
            addCategoryRow.className = 'add-category-row';
            addCategoryRow.setAttribute('data-currency', currency.code);
            
            const addCategoryCell = document.createElement('td');
            addCategoryCell.className = 'concept-cell';
            
            const addButton = document.createElement('button');
            addButton.className = 'add-category-button';
            addButton.innerHTML = '<i class="fas fa-plus"></i> Agregar categoría';
            addButton.onclick = () => this.showAddFixedExpenseDialog(currency.code);
            
            addCategoryCell.appendChild(addButton);
            addCategoryRow.appendChild(addCategoryCell);
            
            // Agregar celdas vacías para los meses
            for (let i = 0; i < 12; i++) {
                const emptyCell = document.createElement('td');
                addCategoryRow.appendChild(emptyCell);
            }
            
            rows.push(addCategoryRow);
            
            // Guardar las filas para esta moneda
            fixedExpensesByCurrency[currency.code] = rows;
        });
        
        // Agregar las filas al cuerpo de la tabla en el mismo orden que las entradas
        // 1. Primero añadir las salidas fijas de ARS (si existen)
        const arsFixedExpenses = this.currencies.filter(c => c.code === 'ARS');
        arsFixedExpenses.forEach(currency => {
            if (fixedExpensesByCurrency[currency.code]) {
                fixedExpensesByCurrency[currency.code].forEach(row => {
                    mainBody.appendChild(row);
                });
            }
        });
        
        // 2. Luego, añadir USD 
        const usdFixedExpenses = this.currencies.filter(c => c.code === 'USD');
        usdFixedExpenses.forEach(currency => {
            if (fixedExpensesByCurrency[currency.code]) {
                fixedExpensesByCurrency[currency.code].forEach(row => {
                    mainBody.appendChild(row);
                });
            }
        });
        
        // 3. Finalmente, añadir salidas fijas de otras monedas que no sean USD ni ARS
        const otrasFixedExpenses = this.currencies.filter(c => c.code !== 'USD' && c.code !== 'ARS');
        otrasFixedExpenses.forEach(currency => {
            if (fixedExpensesByCurrency[currency.code]) {
                fixedExpensesByCurrency[currency.code].forEach(row => {
                    mainBody.appendChild(row);
                });
            }
        });
        
        // Agregar espacio separador después de todas las monedas con más altura
        const afterFixedExpensesSeparator = document.createElement('tr');
        afterFixedExpensesSeparator.className = 'separator-row bigger-separator';
        const afterFixedExpensesSeparatorCell = document.createElement('td');
        afterFixedExpensesSeparatorCell.colSpan = 13;
        afterFixedExpensesSeparator.appendChild(afterFixedExpensesSeparatorCell);
        mainBody.appendChild(afterFixedExpensesSeparator);

        // AHORA colocamos la sección de egresos totales DESPUÉS de las salidas fijas
        const expensesHeader = document.createElement('tr');
        expensesHeader.className = 'section-header';
        const expensesHeaderCell = document.createElement('td');
        expensesHeaderCell.textContent = 'RESUMEN DE EGRESOS';
        expensesHeaderCell.colSpan = 13;
        expensesHeader.appendChild(expensesHeaderCell);
        mainBody.appendChild(expensesHeader);
        
        // Crear una fila de "TOTAL EGRESOS" para cada moneda
        this.currencies.forEach(currency => {
            const expensesRow = document.createElement('tr');
            expensesRow.className = 'total-row';
            const expenseCell = document.createElement('td');
            expenseCell.textContent = `Total Egresos ${currency.code}`;
            expenseCell.className = 'concept-cell';
            expensesRow.appendChild(expenseCell);

            // Obtener los totales de egresos para esta moneda
            const currencyExpenseTotals = totalsByCurrency[currency.code] ? 
                totalsByCurrency[currency.code].expense : new Array(12).fill(0);

            // Agregar celdas con total de egresos
            for (let i = 0; i < 12; i++) {
                const totalCell = document.createElement('td');
                totalCell.className = 'amount-cell';
                
                // Mostrar el símbolo adecuado para la moneda
                let currencySymbol = '';
                if (currency.code === 'ARS') {
                    currencySymbol = '$';
                } else if (currency.code === 'USD') {
                    currencySymbol = '$';
                }
                
                totalCell.textContent = formatAmount(currencyExpenseTotals[i], currencySymbol);
                
                if (i === currentMonth) {
                    totalCell.classList.add('current-month');
                }
                
                expensesRow.appendChild(totalCell);
            }

            mainBody.appendChild(expensesRow);
        });
        
        // Agregar separador final después de los egresos totales
        const finalSeparator = document.createElement('tr');
        finalSeparator.className = 'separator-row';
        const finalSeparatorCell = document.createElement('td');
        finalSeparatorCell.colSpan = 13;
        finalSeparator.appendChild(finalSeparatorCell);
        mainBody.appendChild(finalSeparator);
    }

    // Método para mostrar el diálogo de añadir categoría
    showAddCategoryDialog(currencyCode) {
        const dialog = document.createElement('div');
        dialog.className = 'add-category-dialog';
        
        const title = document.createElement('h3');
        title.textContent = `Añadir categoría para ${currencyCode}`;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Nombre de la categoría';
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container';
        
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancelar';
        cancelButton.onclick = () => {
            document.body.removeChild(dialog);
        };
        
        const saveButton = document.createElement('button');
        saveButton.textContent = 'Guardar';
        saveButton.className = 'save-button';
        saveButton.onclick = () => {
            const categoryName = input.value.trim();
            if (categoryName) {
                // Verificar si la categoría estaba en la lista de eliminadas
                let deletedCategoriesJSON = localStorage.getItem('deletedCategories');
                let deletedCategories = deletedCategoriesJSON ? JSON.parse(deletedCategoriesJSON) : {};
                
                // Si la categoría estaba eliminada para esta moneda, eliminarla de la lista de eliminadas
                if (deletedCategories[currencyCode] && deletedCategories[currencyCode].includes(categoryName)) {
                    deletedCategories[currencyCode] = deletedCategories[currencyCode].filter(cat => cat !== categoryName);
                    localStorage.setItem('deletedCategories', JSON.stringify(deletedCategories));
                    this.showSuccessMessage(`Categoría "${categoryName}" restaurada correctamente`);
                }
                
                // Guardar la nueva categoría en localStorage
                let customCategories = JSON.parse(localStorage.getItem('customCategories') || '{}');
                if (!customCategories[currencyCode]) {
                    customCategories[currencyCode] = [];
                }
                
                // Añadir solo si no existe ya
                if (!customCategories[currencyCode].includes(categoryName)) {
                    customCategories[currencyCode].push(categoryName);
                    localStorage.setItem('customCategories', JSON.stringify(customCategories));
                }
                
                // Actualizar la tabla de flujo de caja
                this.updateCashFlowTable();
                
                // Actualizar el listado de categorías en el formulario de registro
                this.updateRegisterCategoryOptions();
                
                document.body.removeChild(dialog);
            } else {
                alert('Por favor, ingrese un nombre para la categoría');
            }
        };
        
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(saveButton);
        
        dialog.appendChild(title);
        dialog.appendChild(input);
        dialog.appendChild(buttonContainer);
        
        document.body.appendChild(dialog);
        input.focus();
    }

    confirmDeleteCategory(category, currencyCode) {
        console.log(`Iniciando eliminación de categoría: ${category} para moneda: ${currencyCode}`);
        
        const html = `
            <div class="overlay" id="deleteCategoryOverlay">
                <div class="confirm-dialog">
                    <h3>Eliminar Categoría</h3>
                    <p>¿Estás seguro que deseas eliminar la categoría "${category}"?</p>
                    <div class="confirm-dialog-buttons">
                        <button class="cancel" id="cancelDeleteCategory">Cancelar</button>
                        <button class="confirm" id="confirmDeleteCategory">Eliminar</button>
                    </div>
                </div>
            </div>
        `;

        // Eliminar diálogo existente si hay alguno
        const existingOverlay = document.getElementById('deleteCategoryOverlay');
        if (existingOverlay) {
            existingOverlay.parentNode.removeChild(existingOverlay);
        }

        // Agregar el HTML al body
        document.body.insertAdjacentHTML('beforeend', html);

        // Obtener referencias a los elementos
        const overlay = document.getElementById('deleteCategoryOverlay');
        const cancelBtn = document.getElementById('cancelDeleteCategory');
        const confirmBtn = document.getElementById('confirmDeleteCategory');

        // Función para eliminar el diálogo
        const closeDialog = () => {
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        };

        // Evento para el botón cancelar
        cancelBtn.onclick = closeDialog;

        // Evento para el botón eliminar
        confirmBtn.onclick = () => {
            console.log(`Confirmación de eliminación para categoría: ${category}`);
            
            // Eliminar la categoría
            this.removeCategory(category, currencyCode);
            
            // Actualizar storage y UI
            this.saveToLocalStorage();
            
            // Cerrar el diálogo antes de actualizar la UI
            closeDialog();
            
            // Actualizar UI con un pequeño retraso para asegurar que los cambios se reflejen
            setTimeout(() => {
                this.updateUI();
                this.updateCashFlowTable();
                console.log(`UI actualizada después de eliminar categoría: ${category}`);
            }, 100);
        };
    }

    removeCategory(category, currencyCode) {
        console.log(`Ejecutando removeCategory para: ${category}, moneda: ${currencyCode}`);
        
        // Filtrar las transacciones para eliminar aquellas que coincidan con la categoría
        // y pertenezcan a una billetera de la moneda especificada
        const transaccionesPrevias = this.transactions.length;
        this.transactions = this.transactions.filter(transaction => {
            // Primero verificar la billetera para determinar la moneda
            const wallet = this.wallets.find(w => w.id.toString() === transaction.walletId);
            if (!wallet || wallet.currency !== currencyCode) {
                // Mantener la transacción si no es de la moneda especificada
                return true;
            }
            
            // Eliminar si la categoría coincide
            if (transaction.category === category) {
                return false;
            }
            
            // Eliminar también si la descripción coincide exactamente con el nombre de la categoría
            if (transaction.description === category || 
                transaction.description === `Categoría ${category} añadida`) {
                return false;
            }
            
            // Mantener el resto de transacciones
            return true;
        });
        console.log(`Transacciones filtradas: de ${transaccionesPrevias} a ${this.transactions.length}`);
        
        // Verificar si es una categoría predefinida según la moneda
        let isDefaultCategory = false;
        
        // No hay categorías predefinidas para ninguna moneda
        
        // Para cualquier moneda, añadir a la lista de categorías eliminadas
        // Obtener las categorías eliminadas del localStorage
        const deletedCategoriesJSON = localStorage.getItem('deletedCategories');
        const deletedCategories = deletedCategoriesJSON ? JSON.parse(deletedCategoriesJSON) : {};
        
        // Inicializar el array para la moneda si no existe
        if (!deletedCategories[currencyCode]) {
            deletedCategories[currencyCode] = [];
        }
        
        // Si es una categoría por defecto o queremos forzar su eliminación permanente
        if (isDefaultCategory || true) {
            // Agregar la categoría si no está ya en la lista
            if (!deletedCategories[currencyCode].includes(category)) {
                deletedCategories[currencyCode].push(category);
                localStorage.setItem('deletedCategories', JSON.stringify(deletedCategories));
                console.log(`Categoría ${category} añadida a deletedCategories para ${currencyCode}`);
            }
        } else {
            // Si es una categoría personalizada, verificar si está en la lista de categorías personalizadas
            let customCategories = JSON.parse(localStorage.getItem('customCategories') || '{}');
            if (customCategories[currencyCode]) {
                customCategories[currencyCode] = customCategories[currencyCode].filter(cat => cat !== category);
                localStorage.setItem('customCategories', JSON.stringify(customCategories));
                console.log(`Categoría ${category} eliminada de customCategories para ${currencyCode}`);
            }
        }
        
        // Actualizar las categorías cargadas
        this.loadCategories();
        
        // Mostrar mensaje de éxito
        this.showSuccessMessage(`Categoría "${category}" eliminada correctamente`);
        console.log(`Categoría "${category}" eliminada correctamente`);
    }

    loadCategories() {
        // Obtener las categorías eliminadas para todas las monedas
        const deletedCategoriesJSON = localStorage.getItem('deletedCategories');
        const deletedCategories = deletedCategoriesJSON ? JSON.parse(deletedCategoriesJSON) : {};
        
        // Crear un conjunto para todas las categorías eliminadas de todas las monedas
        const allDeletedCategories = new Set();
        
        // Recolectar todas las categorías eliminadas de todas las monedas
        Object.values(deletedCategories).forEach(categories => {
            categories.forEach(category => allDeletedCategories.add(category));
        });
        
        // Filtrar las categorías eliminadas del array de categorías de ingresos
        this.categories.income = this.categories.income.filter(category => 
            !allDeletedCategories.has(category)
        );
    }

    // Método para mostrar el diálogo de añadir categoría
    showAddFixedExpenseDialog(currencyCode) {
        const dialog = document.createElement('div');
        dialog.className = 'add-category-dialog';
        
        const title = document.createElement('h3');
        title.textContent = `Añadir Categoría de Gasto Fijo para ${currencyCode}`;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Nombre de la categoría';
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container';
        
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancelar';
        cancelButton.onclick = () => {
            document.body.removeChild(dialog);
        };
        
        const saveButton = document.createElement('button');
        saveButton.textContent = 'Guardar';
        saveButton.className = 'save-button';
        saveButton.onclick = () => {
            const categoryName = input.value.trim();
            if (categoryName) {
                // Verificar si la categoría estaba en la lista de eliminadas
                let deletedFixedExpensesJSON = localStorage.getItem('deletedFixedExpenses');
                let deletedFixedExpenses = deletedFixedExpensesJSON ? JSON.parse(deletedFixedExpensesJSON) : {};
                
                // Si la categoría estaba eliminada para esta moneda, eliminarla de la lista de eliminadas
                if (deletedFixedExpenses[currencyCode] && deletedFixedExpenses[currencyCode].includes(categoryName)) {
                    deletedFixedExpenses[currencyCode] = deletedFixedExpenses[currencyCode].filter(cat => cat !== categoryName);
                    localStorage.setItem('deletedFixedExpenses', JSON.stringify(deletedFixedExpenses));
                    this.showSuccessMessage(`Categoría de gasto fijo "${categoryName}" restaurada correctamente`);
                }
                
                // Guardar la nueva categoría en localStorage
                let customFixedExpenses = JSON.parse(localStorage.getItem('customFixedExpenses') || '{}');
                
                // Asegurarse de que exista el array para esta moneda
                if (!customFixedExpenses[currencyCode]) {
                    customFixedExpenses[currencyCode] = [];
                }
                
                // Añadir solo si no existe ya
                if (!customFixedExpenses[currencyCode].includes(categoryName)) {
                    customFixedExpenses[currencyCode].push(categoryName);
                    localStorage.setItem('customFixedExpenses', JSON.stringify(customFixedExpenses));
                    
                    // Actualizar la tabla de flujo de caja
                    this.updateCashFlowTable();
                }
                
                document.body.removeChild(dialog);
                this.showSuccessMessage(`Categoría de gasto fijo "${categoryName}" para ${currencyCode} añadida correctamente`);
            } else {
                alert('Por favor, ingrese un nombre para la categoría');
            }
        };
        
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(saveButton);
        
        dialog.appendChild(title);
        dialog.appendChild(input);
        dialog.appendChild(buttonContainer);
        
        document.body.appendChild(dialog);
        input.focus();
    }

    // Método modificado para eliminar categorías con soporte para monedas
    confirmDeleteFixedExpenseCategory(category, currencyCode) {
        console.log(`Iniciando eliminación de categoría de gasto fijo: ${category} para moneda: ${currencyCode}`);
        
        const html = `
            <div class="overlay" id="deleteFixedCategoryOverlay">
                <div class="confirm-dialog">
                    <h3>Eliminar Categoría de Gasto Fijo</h3>
                    <p>¿Estás seguro que deseas eliminar la categoría "${category}" para ${currencyCode}?</p>
                    <div class="confirm-dialog-buttons">
                        <button class="cancel" id="cancelDeleteFixedCategory">Cancelar</button>
                        <button class="confirm" id="confirmDeleteFixedCategory">Eliminar</button>
                    </div>
                </div>
            </div>
        `;

        // Eliminar diálogo existente si hay alguno
        const existingOverlay = document.getElementById('deleteFixedCategoryOverlay');
        if (existingOverlay) {
            existingOverlay.parentNode.removeChild(existingOverlay);
        }

        // Agregar el HTML al body
        document.body.insertAdjacentHTML('beforeend', html);

        // Obtener referencias a los elementos
        const overlay = document.getElementById('deleteFixedCategoryOverlay');
        const cancelBtn = document.getElementById('cancelDeleteFixedCategory');
        const confirmBtn = document.getElementById('confirmDeleteFixedCategory');

        // Función para eliminar el diálogo
        const closeDialog = () => {
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        };

        // Evento para el botón cancelar
        cancelBtn.onclick = closeDialog;

        // Evento para el botón eliminar
        confirmBtn.onclick = () => {
            console.log(`Confirmación de eliminación para categoría de gasto fijo: ${category}`);
            
            // Eliminar la categoría
            this.removeFixedExpenseCategory(category, currencyCode);
            
            // Actualizar storage
            this.saveToLocalStorage();
            
            // Cerrar el diálogo antes de actualizar la UI
            closeDialog();
            
            // Actualizar UI con un pequeño retraso para asegurar que los cambios se reflejen
            setTimeout(() => {
                this.updateUI();
                this.updateCashFlowTable();
                console.log(`UI actualizada después de eliminar categoría de gasto fijo: ${category}`);
            }, 100);
        };
    }

    // Método modificado para eliminar categorías con soporte para monedas
    removeFixedExpenseCategory(category, currencyCode) {
        console.log(`Ejecutando removeFixedExpenseCategory para: ${category}, moneda: ${currencyCode}`);
        
        // Verificar si la categoría es parte del conjunto predefinido para esta moneda
        let isDefaultCategory = false;
        
        // No hay categorías predefinidas para ninguna moneda
        
        // Añadir a la lista de categorías eliminadas
        // Obtener las categorías eliminadas del localStorage
        const deletedFixedExpensesJSON = localStorage.getItem('deletedFixedExpenses');
        const deletedFixedExpenses = deletedFixedExpensesJSON ? JSON.parse(deletedFixedExpensesJSON) : {};
        
        // Inicializar el array para la moneda si no existe
        if (!deletedFixedExpenses[currencyCode]) {
            deletedFixedExpenses[currencyCode] = [];
        }
        
        // Si es una categoría por defecto o queremos forzar su eliminación permanente
        if (isDefaultCategory || true) {
            // Agregar la categoría si no está ya en la lista
            if (!deletedFixedExpenses[currencyCode].includes(category)) {
                deletedFixedExpenses[currencyCode].push(category);
                localStorage.setItem('deletedFixedExpenses', JSON.stringify(deletedFixedExpenses));
                console.log(`Categoría de gasto fijo ${category} añadida a deletedFixedExpenses para ${currencyCode}`);
            }
        } else {
            // Si es una categoría personalizada, verificar si está en la lista de categorías personalizadas
            let customFixedExpenses = JSON.parse(localStorage.getItem('customFixedExpenses') || '{}');
            if (customFixedExpenses[currencyCode]) {
                customFixedExpenses[currencyCode] = customFixedExpenses[currencyCode].filter(cat => cat !== category);
                localStorage.setItem('customFixedExpenses', JSON.stringify(customFixedExpenses));
                console.log(`Categoría de gasto fijo ${category} eliminada de customFixedExpenses para ${currencyCode}`);
            }
        }
        
        // Actualizar la tabla de flujo de caja
        this.updateCashFlowTable();
        
        // Mostrar mensaje de éxito
        this.showSuccessMessage(`Categoría de gasto fijo "${category}" eliminada correctamente`);
        console.log(`Categoría de gasto fijo "${category}" eliminada correctamente`);
    }

    // Método auxiliar para mostrar mensajes de éxito
    showSuccessMessage(message) {
        console.log(`Mostrando mensaje de éxito: ${message}`);
        
        // Eliminar mensaje existente si hay alguno
        const existingMessage = document.querySelector('.success-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'success-message';
        messageDiv.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(messageDiv);
        
        // Eliminar el mensaje después de 3 segundos
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 3000);
    }

    showAddCurrencyPrompt() {
        const currenciesList = document.getElementById('currenciesList');
        const promptDiv = document.createElement('div');
        promptDiv.className = 'currency-prompt';
        promptDiv.innerHTML = `
            <span>⬅️ Haga clic en el botón para agregar su primera moneda</span>
        `;
        currenciesList.appendChild(promptDiv);
        
        // Resaltar el botón de agregar moneda
        const addCurrencyBtn = document.getElementById('addCurrencyBtn');
        addCurrencyBtn.classList.add('highlight-btn');
        
        // Quitar resaltado después de 5 segundos
        setTimeout(() => {
            addCurrencyBtn.classList.remove('highlight-btn');
            if (promptDiv.parentNode) {
                promptDiv.parentNode.removeChild(promptDiv);
            }
        }, 5000);
    }

    // Método para mostrar la calculadora de distribución
    showDistributionCalculator() {
        const overlay = document.getElementById('distributionCalculatorOverlay');
        overlay.style.display = 'flex';
        
        // Limpiar event listeners anteriores si existen
        if (this.closeCalculatorListener) {
            document.getElementById('closeCalculatorBtn').removeEventListener('click', this.closeCalculatorListener);
        }
        
        if (this.calculateDistributionListener) {
            document.getElementById('calculateDistributionBtn').removeEventListener('click', this.calculateDistributionListener);
        }
        
        // Crear nuevos event listeners y guardar referencias
        this.closeCalculatorListener = () => {
            overlay.style.display = 'none';
        };
        
        this.calculateDistributionListener = () => this.calculateDistribution();
        
        // Añadir eventos
        document.getElementById('closeCalculatorBtn').addEventListener('click', this.closeCalculatorListener);
        document.getElementById('calculateDistributionBtn').addEventListener('click', this.calculateDistributionListener);
        
        // Cargar los porcentajes guardados
        const percentages = this.loadDistributionPercentages();
        
        console.log('Cargando porcentajes en la calculadora:', percentages);
        
        // Establecer los valores en los campos
        document.getElementById('investmentPercentage').value = percentages.investment;
        document.getElementById('savingsPercentage').value = percentages.savings;
        document.getElementById('expensesPercentage').value = percentages.expenses;
        document.getElementById('targetSavingsPercentage').value = percentages.targetSavings;
        
        // Limpiar event listeners de los inputs
        const percentageInputs = [
            document.getElementById('investmentPercentage'),
            document.getElementById('savingsPercentage'),
            document.getElementById('expensesPercentage'),
            document.getElementById('targetSavingsPercentage'),
            document.getElementById('totalAmount')
        ];
        
        // Remover listeners anteriores si existen
        if (this.inputListeners) {
            this.inputListeners.forEach((listener, index) => {
                if (percentageInputs[index]) {
                    percentageInputs[index].removeEventListener('input', listener);
                }
            });
        }
        
        // Crear nuevos listeners
        this.inputListeners = percentageInputs.map(input => {
            const listener = () => this.updateDistributionCalculator();
            input.addEventListener('input', listener);
            return listener;
        });
        
        // Inicializar cálculos
        this.updateDistributionCalculator();
    }
    
    // Método para actualizar los cálculos y la barra de porcentaje
    updateDistributionCalculator() {
        const investmentPercentage = parseInt(document.getElementById('investmentPercentage').value) || 0;
        const savingsPercentage = parseInt(document.getElementById('savingsPercentage').value) || 0;
        const expensesPercentage = parseInt(document.getElementById('expensesPercentage').value) || 0;
        const targetSavingsPercentage = parseInt(document.getElementById('targetSavingsPercentage').value) || 0;
        
        const totalPercentage = investmentPercentage + savingsPercentage + expensesPercentage + targetSavingsPercentage;
        document.getElementById('totalPercentage').textContent = totalPercentage;
        
        // Actualizar la barra de porcentaje
        document.getElementById('investmentSegment').style.width = `${investmentPercentage}%`;
        document.getElementById('savingsSegment').style.width = `${savingsPercentage}%`;
        document.getElementById('expensesSegment').style.width = `${expensesPercentage}%`;
        document.getElementById('targetSavingsSegment').style.width = `${targetSavingsPercentage}%`;
        
        // Cambiar el color si el total no es 100%
        const totalElement = document.getElementById('totalPercentage');
        if (totalPercentage !== 100) {
            totalElement.style.color = '#dc3545';
        } else {
            totalElement.style.color = '#28a745';
        }
        
        // Si hay un monto, calcular los montos correspondientes sin mostrar alertas
        const totalAmount = parseFloat(document.getElementById('totalAmount').value) || 0;
        if (totalAmount > 0) {
            this.calculateDistributionSilent();
        }
    }
    
    // Método para calcular la distribución sin mostrar alertas (usado durante la edición)
    calculateDistributionSilent() {
        const totalAmount = parseFloat(document.getElementById('totalAmount').value) || 0;
        if (!totalAmount) return;
        
        const investmentPercentage = parseInt(document.getElementById('investmentPercentage').value) || 0;
        const savingsPercentage = parseInt(document.getElementById('savingsPercentage').value) || 0;
        const expensesPercentage = parseInt(document.getElementById('expensesPercentage').value) || 0;
        const targetSavingsPercentage = parseInt(document.getElementById('targetSavingsPercentage').value) || 0;
        
        // Calcular los montos (incluso si no suman 100%)
        const investmentAmount = (totalAmount * investmentPercentage / 100).toFixed(2);
        const savingsAmount = (totalAmount * savingsPercentage / 100).toFixed(2);
        const expensesAmount = (totalAmount * expensesPercentage / 100).toFixed(2);
        const targetSavingsAmount = (totalAmount * targetSavingsPercentage / 100).toFixed(2);
        
        // Actualizar los resultados en la interfaz
        document.getElementById('investmentAmount').textContent = investmentAmount;
        document.getElementById('savingsAmount').textContent = savingsAmount;
        document.getElementById('expensesAmount').textContent = expensesAmount;
        document.getElementById('targetSavingsAmount').textContent = targetSavingsAmount;
    }
    
    // Método para calcular la distribución basada en los porcentajes (con validación)
    calculateDistribution() {
        const totalAmount = parseFloat(document.getElementById('totalAmount').value) || 0;
        if (!totalAmount) {
            alert('Por favor, ingrese un monto total válido.');
            return;
        }
        
        const investmentPercentage = parseInt(document.getElementById('investmentPercentage').value) || 0;
        const savingsPercentage = parseInt(document.getElementById('savingsPercentage').value) || 0;
        const expensesPercentage = parseInt(document.getElementById('expensesPercentage').value) || 0;
        const targetSavingsPercentage = parseInt(document.getElementById('targetSavingsPercentage').value) || 0;
        
        const totalPercentage = investmentPercentage + savingsPercentage + expensesPercentage + targetSavingsPercentage;
        if (totalPercentage !== 100) {
            alert('La suma de los porcentajes debe ser 100%. Por favor, ajuste los valores.');
            return;
        }
        
        // Calcular los montos
        const investmentAmount = (totalAmount * investmentPercentage / 100).toFixed(2);
        const savingsAmount = (totalAmount * savingsPercentage / 100).toFixed(2);
        const expensesAmount = (totalAmount * expensesPercentage / 100).toFixed(2);
        const targetSavingsAmount = (totalAmount * targetSavingsPercentage / 100).toFixed(2);
        
        // Actualizar los resultados en la interfaz
        document.getElementById('investmentAmount').textContent = investmentAmount;
        document.getElementById('savingsAmount').textContent = savingsAmount;
        document.getElementById('expensesAmount').textContent = expensesAmount;
        document.getElementById('targetSavingsAmount').textContent = targetSavingsAmount;
        
        // Guardar los porcentajes en localStorage
        const percentages = {
            investment: investmentPercentage,
            savings: savingsPercentage,
            expenses: expensesPercentage,
            targetSavings: targetSavingsPercentage
        };
        
        this.saveDistributionPercentages(percentages);
        
        console.log('Porcentajes guardados en calculateDistribution:', percentages);
        
        // Mostrar animación de éxito
        const amountResults = document.querySelectorAll('.amount-result');
        amountResults.forEach(result => {
            result.style.animation = 'none';
            setTimeout(() => {
                result.style.animation = 'fadeIn 0.5s ease';
            }, 10);
        });
        
        // Mostrar mensaje de éxito
        this.showSuccessMessage('Distribución guardada correctamente');
        
        // Actualizar la tabla de flujo de caja con la nueva distribución
        this.updateCashFlowTable();
        
        // Cerrar el diálogo después de 2 segundos
        setTimeout(() => {
            const overlay = document.getElementById('distributionCalculatorOverlay');
            if (overlay) {
                overlay.style.display = 'none';
            }
        }, 2000);
    }
    
    // Método para guardar los porcentajes de distribución
    saveDistributionPercentages(percentages) {
        // Guardar en este.percentages para usarlo en el resto de la aplicación
        this.distributionPercentages = percentages;
        
        // Guardar en localStorage
        localStorage.setItem('distributionPercentages', JSON.stringify(percentages));
        
        console.log('Porcentajes de distribución guardados en localStorage:', percentages);
    }
    
    // Método para cargar los porcentajes de distribución guardados
    loadDistributionPercentages() {
        const percentagesJSON = localStorage.getItem('distributionPercentages');
        
        if (percentagesJSON) {
            this.distributionPercentages = JSON.parse(percentagesJSON);
        } else {
            // Valores predeterminados si no hay nada guardado
            this.distributionPercentages = {
                investment: 25,
                savings: 25,
                expenses: 40,
                targetSavings: 10
            };
        }
        
        console.log('Porcentajes de distribución cargados:', this.distributionPercentages);
        return this.distributionPercentages;
    }
    
    // Método para reiniciar la calculadora
    resetDistribution() {
        // Cargar los valores predeterminados desde los valores iniciales
        const defaults = {
            investment: 25,
            savings: 25,
            expenses: 40,
            targetSavings: 10
        };
        
        // Establecer los valores en los campos
        document.getElementById('totalAmount').value = '';
        document.getElementById('investmentPercentage').value = defaults.investment;
        document.getElementById('savingsPercentage').value = defaults.savings;
        document.getElementById('expensesPercentage').value = defaults.expenses;
        document.getElementById('targetSavingsPercentage').value = defaults.targetSavings;
        
        // Resetear los resultados
        document.getElementById('investmentAmount').textContent = '0.00';
        document.getElementById('savingsAmount').textContent = '0.00';
        document.getElementById('expensesAmount').textContent = '0.00';
        document.getElementById('targetSavingsAmount').textContent = '0.00';
        
        // Actualizar la vista
        this.updateDistributionCalculator();
    }
}

new FinanceManager();

console.log('Monedas:', JSON.parse(localStorage.getItem('financeData')).currencies);
console.log('Billeteras:', JSON.parse(localStorage.getItem('financeData')).wallets);
console.log('Transacciones:', JSON.parse(localStorage.getItem('financeData')).transactions); 