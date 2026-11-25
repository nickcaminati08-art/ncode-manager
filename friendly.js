/* =========================================
   NCODE MANAGER 1.3
   SMART WORKSPACE
========================================= */

(() => {

    const originalGo = go;
    const originalDashboard = dashboard;
    const originalEditor = editor;
    const originalSaveQuote = saveQuote;

    let currentStep = 1;
    let menuOpen = false;

    const icons = {

        home: `<path d="m3 10 9-7 9 7v11H3z"/>
               <path d="M9 21v-8h6v8"/>`,

        file: `<path d="M6 3h9l4 4v14H6z"/>
               <path d="M14 3v5h5M9 12h7M9 16h7"/>`,

        plus: `<path d="M12 5v14M5 12h14"/>`,

        users: `<circle cx="12" cy="8" r="4"/>
                <path d="M4 21v-2a8 8 0 0 1 16 0v2"/>`,

        menu: `<circle cx="5" cy="12" r="1"/>
               <circle cx="12" cy="12" r="1"/>
               <circle cx="19" cy="12" r="1"/>`,

        wallet: `<rect x="3" y="5" width="18"
                 height="14" rx="3"/>
                 <path d="M3 10h18M7 15h4"/>`,

        check: `<path d="m5 12 4 4L19 6"/>`,

        arrow: `<path d="M5 12h14m-6-6 6 6-6 6"/>`

    };

    function icon(name) {

        return `
            <svg viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true">

                ${icons[name] || icons.file}

            </svg>
        `;

    }

    /* =====================================
       NOTIFICHE
    ===================================== */

    function toast(message, type = "success") {

        let container = document.querySelector(
            ".toast-container"
        );

        if (!container) {

            container = document.createElement("div");
            container.className = "toast-container";
            container.setAttribute("role", "status");

            document.body.appendChild(container);

        }

        const notification = document.createElement("div");

        notification.className = `smart-toast ${type}`;

        notification.innerHTML = `
            <div class="toast-icon">
                ${icon(type === "success" ? "check" : "file")}
            </div>

            <div class="toast-content">
                <strong></strong>
                <small>NCode Manager</small>
            </div>
        `;

        notification.querySelector("strong").textContent =
            message;

        container.appendChild(notification);

        setTimeout(() => {

            notification.classList.add("toast-out");

            setTimeout(() => notification.remove(), 300);

        }, 3000);

    }

    window.ncodeToast = toast;

    /* =====================================
       NAVIGAZIONE MOBILE
    ===================================== */

    function createMobileNav() {

        document.getElementById("mobileNav")?.remove();

        const nav = document.createElement("div");

        nav.id = "mobileNav";
        nav.className = "mobile-navigation";

        nav.innerHTML = `

            <button data-page="0" onclick="go(0)">
                ${icon("home")}
                <span>Home</span>
            </button>

            <button data-page="1" onclick="go(1)">
                ${icon("file")}
                <span>Preventivi</span>
            </button>

            <button class="mobile-create"
                onclick="openQuickMenu()">

                <div class="create-circle">
                    ${icon("plus")}
                </div>

                <span>Nuovo</span>

            </button>

            <button data-page="2" onclick="go(2)">
                ${icon("users")}
                <span>Clienti</span>
            </button>

            <button onclick="openMoreMenu()"
                data-more="true">

                ${icon("menu")}
                <span>Altro</span>

            </button>

        `;

        document.body.appendChild(nav);

        updateMobileNav();

    }

    function updateMobileNav() {

        document.querySelectorAll(
            "#mobileNav button"
        ).forEach(button => {

            const active =
                button.dataset.page === String(page) ||
                (button.dataset.more === "true" && page >= 3);

            button.classList.toggle("active", active);

        });

    }

    /* =====================================
       MENU A COMPARSA
    ===================================== */

    function closeSheet() {

        const overlay = document.querySelector(
            ".smart-overlay"
        );

        if (!overlay) return;

        overlay.remove();

        document.body.classList.remove("sheet-open");

        menuOpen = false;

    }

    window.closeSmartSheet = closeSheet;

    function openSheet(title, content) {

        closeSheet();

        menuOpen = true;

        const overlay = document.createElement("div");

        overlay.className = "smart-overlay";

        overlay.innerHTML = `

            <div class="smart-sheet"
                role="dialog"
                aria-modal="true"
                aria-label="${title}">

                <div class="sheet-handle"></div>

                <div class="sheet-heading">

                    <h3>${title}</h3>

                    <button class="sheet-close"
                        aria-label="Chiudi"
                        onclick="closeSmartSheet()">

                        &times;

                    </button>

                </div>

                ${content}

            </div>

        `;

        overlay.addEventListener("click", event => {

            if (event.target === overlay) {
                closeSheet();
            }

        });

        document.body.appendChild(overlay);

        document.body.classList.add("sheet-open");

        overlay.querySelector(".sheet-close").focus();

    }

    window.openMoreMenu = function () {

        const entries = [

            [3, "Listino prezzi", "file"],
            [4, "Abbonamenti", "file"],
            [5, "Pagamenti", "wallet"],
            [6, "Impostazioni", "menu"]

        ];

        openSheet(

            "Il tuo workspace",

            entries.map(([id, label, symbol]) => `

                <button class="sheet-option"
                    onclick="closeSmartSheet(); go(${id})">

                    <div class="action-icon">
                        ${icon(symbol)}
                    </div>

                    <span>${label}</span>

                    ${icon("arrow")}

                </button>

            `).join("")

        );

    };

    window.quickRecord = function (type) {

        closeSheet();

        const pagesMap = {

            clients: 2,
            services: 3,
            subs: 4,
            payments: 5

        };

        go(pagesMap[type]);

        recordEdit(type);

    };

    window.openQuickMenu = function () {

        openSheet("Cosa vuoi creare?", `

            <button class="sheet-option"
                onclick="closeSmartSheet(); newQuote()">

                <div class="action-icon">
                    ${icon("file")}
                </div>

                <span>
                    <strong>Nuovo preventivo</strong>
                    <small>Configura un'offerta</small>
                </span>

                ${icon("arrow")}

            </button>

            <button class="sheet-option"
                onclick="quickRecord('clients')">

                <div class="action-icon">
                    ${icon("users")}
                </div>

                <span>
                    <strong>Nuovo cliente</strong>
                    <small>Aggiungi un contatto</small>
                </span>

                ${icon("arrow")}

            </button>

            <button class="sheet-option"
                onclick="quickRecord('payments')">

                <div class="action-icon">
                    ${icon("wallet")}
                </div>

                <span>
                    <strong>Registra pagamento</strong>
                    <small>Aggiorna i tuoi incassi</small>
                </span>

                ${icon("arrow")}

            </button>

            <button class="sheet-option"
                onclick="quickRecord('subs')">

                <div class="action-icon">
                    ${icon("file")}
                </div>

                <span>
                    <strong>Nuovo abbonamento</strong>
                    <small>Gestisci un canone ricorrente</small>
                </span>

                ${icon("arrow")}

            </button>

        `);

    };

    document.addEventListener("keydown", event => {

        if (event.key === "Escape" && menuOpen) {
            closeSheet();
        }

    });

    /* =====================================
       DASHBOARD
    ===================================== */

    dashboard = function () {

        originalDashboard();

        const view = $("view");

        const hour = new Date().getHours();

        const greeting = hour < 12
            ? "Buongiorno"
            : hour < 18
                ? "Buon pomeriggio"
                : "Buonasera";

        const welcome = document.createElement("div");

        welcome.className = "welcome-banner";

        welcome.innerHTML = `

            <div class="welcome-content">

                <span class="welcome-label">
                    IL TUO BUSINESS
                </span>

                <h2>${greeting}! 👋</h2>

                <p>
                    Tutto quello che ti serve per
                    gestire NCode, in un unico posto.
                </p>

                <button onclick="newQuote()">
                    ${icon("plus")}
                    Nuovo preventivo
                </button>

            </div>

            <div class="welcome-decoration">
                NC
            </div>

        `;

        view.prepend(welcome);

        const actions = document.createElement("div");

        actions.className = "quick-actions";

        actions.innerHTML = `

            <h3>Azioni rapide</h3>

            <div class="quick-grid">

                <button onclick="newQuote()">
                    <div class="action-icon">
                        ${icon("file")}
                    </div>
                    <strong>Preventivo</strong>
                    <small>Crea un'offerta</small>
                </button>

                <button onclick="quickRecord('clients')">
                    <div class="action-icon">
                        ${icon("users")}
                    </div>
                    <strong>Cliente</strong>
                    <small>Aggiungi contatto</small>
                </button>

                <button onclick="quickRecord('payments')">
                    <div class="action-icon">
                        ${icon("wallet")}
                    </div>
                    <strong>Pagamento</strong>
                    <small>Registra incasso</small>
                </button>

            </div>

        `;

        const metrics = view.querySelector(".grid");

        metrics.after(actions);

        const metricIcons = [

            "wallet",
            "file",
            "users",
            "wallet",
            "check",
            "wallet"

        ];

        view.querySelectorAll(".metric").forEach(
            (metric, index) => {

                const element = document.createElement("div");

                element.className = "metric-icon";

                element.innerHTML = icon(metricIcons[index]);

                metric.prepend(element);

            }
        );

    };

    /* =====================================
       PREVENTIVI GUIDATI
    ===================================== */

    const stepNames = [

        "Cliente",
        "Servizi",
        "Prezzi",
        "Riepilogo"

    ];

    editor = function () {

        originalEditor();

        currentStep = 1;

        const view = $("view");

        const clientPanel = view.querySelector(".panel");
        const split = view.querySelector(".split");

        const servicePanel = split.children[0];
        const pricePanel = split.children[1];

        clientPanel.dataset.wizardStep = "1";
        servicePanel.dataset.wizardStep = "2";
        pricePanel.dataset.wizardStep = "3";

        const wizard = document.createElement("div");

        wizard.className = "wizard-header";

        wizard.innerHTML = `

            <div class="wizard-heading">

                <div>
                    <small>CONFIGURATORE</small>
                    <h3 id="wizardTitle"></h3>
                </div>

                <span id="wizardCount"></span>

            </div>

            <div class="wizard-progress">

                ${stepNames.map((name, index) => `

                    <div class="wizard-indicator"
                        data-indicator="${index + 1}">

                        <div class="wizard-line"></div>
                        <small>${name}</small>

                    </div>

                `).join("")}

            </div>

        `;

        view.prepend(wizard);

        const summaryPanel = document.createElement("div");

        summaryPanel.className = "panel";
        summaryPanel.dataset.wizardStep = "4";

        summaryPanel.innerHTML = `

            <h3>Il tuo preventivo è quasi pronto</h3>

            <div id="friendlySummary"></div>

            <div class="row">

                <button onclick="saveQuote()">
                    Salva preventivo
                </button>

                <button class="secondary"
                    onclick="printDraft()">

                    Esporta PDF

                </button>

            </div>

            <button class="danger"
                onclick="deleteQuote()">

                Elimina preventivo

            </button>

        `;

        view.appendChild(summaryPanel);

        pricePanel.querySelectorAll(
            "button"
        ).forEach(button => {

            button.hidden = true;

        });

        const footer = document.createElement("div");

        footer.className = "wizard-footer";

        footer.innerHTML = `

            <button class="secondary"
                id="wizardBack"
                onclick="wizardMove(-1)">

                Indietro

            </button>

            <button id="wizardNext"
                onclick="wizardMove(1)">

                Continua
                ${icon("arrow")}

            </button>

        `;

        view.appendChild(footer);

        updateWizard();

    };

    function updateWizard() {

        document.querySelectorAll(
            "[data-wizard-step]"
        ).forEach(panel => {

            panel.hidden =
                Number(panel.dataset.wizardStep) !== currentStep;

        });

        document.querySelectorAll(
            "[data-indicator]"
        ).forEach(indicator => {

            indicator.classList.toggle(

                "completed",

                Number(indicator.dataset.indicator) <= currentStep

            );

        });

        $("wizardTitle").textContent =
            stepNames[currentStep - 1];

        $("wizardCount").textContent =
            `${currentStep} di 4`;

        $("wizardBack").disabled = currentStep === 1;

        $("wizardNext").hidden = currentStep === 4;

        const split = $("view").querySelector(".split");

        split.hidden = currentStep === 1 || currentStep === 4;

        split.classList.add("wizard-split");

        if (currentStep === 4) {

            sync();

            const t = totals(draft);

            $("friendlySummary").innerHTML = `

                <div class="summary-client">

                    <small>CLIENTE</small>

                    <h3>${esc(draft.clientName)}</h3>

                    <p>${esc(draft.clientDetails)}</p>

                </div>

                ${draft.items.map(item => `

                    <div class="summary-service">

                        <div>

                            <strong>${esc(item.title)}</strong>

                            <small>
                                Quantità: ${item.qty}
                                · ${esc(item.period)}
                            </small>

                        </div>

                        <strong>
                            ${money(item.price * item.qty)}
                        </strong>

                    </div>

                `).join("")}

                <div class="summary-total">

                    <small>Totale realizzazione</small>

                    <strong>${money(t.total)}</strong>

                    <p>Acconto: ${money(t.deposit)}</p>

                    <p>Saldo: ${money(t.total - t.deposit)}</p>

                    <p>Canone mensile: ${money(t.monthly)}</p>

                    <p>Canone annuale: ${money(t.annual)}</p>

                </div>

            `;

        }

    }

    window.wizardMove = function (direction) {

        sync();

        if (direction > 0 && currentStep === 1) {

            if (!draft.clientName.trim() || !draft.date) {

                toast("Inserisci cliente e data", "warning");

                return;

            }

        }

        if (direction > 0 && currentStep === 2) {

            if (!draft.items.length) {

                toast("Aggiungi almeno un servizio", "warning");

                return;

            }

        }

        currentStep = Math.max(

            1,

            Math.min(4, currentStep + direction)

        );

        updateWizard();

        window.scrollTo({

            top: 0,
            behavior: "smooth"

        });

    };

    /* =====================================
       RICERCA PREVENTIVI
    ===================================== */

    quotes = function () {

        $("view").innerHTML = `

            <div class="panel">

                <div class="friendly-toolbar">

                    <input id="quoteSearch"
                        placeholder="Cerca un preventivo..."
                        aria-label="Cerca preventivo">

                    <select id="quoteFilter"
                        aria-label="Filtra per stato">

                        <option value="">Tutti gli stati</option>

                        ${statuses.map(status => `

                            <option value="${status}">
                                ${status}
                            </option>

                        `).join("")}

                    </select>

                    <button onclick="newQuote()">
                        + Nuovo preventivo
                    </button>

                </div>

                <div id="filteredQuotes"></div>

            </div>

        `;

        function drawQuotes() {

            const query = $("quoteSearch").value
                .toLowerCase();

            const status = $("quoteFilter").value;

            const filtered = db.quotes.filter(q => {

                const text = `${q.number} ${q.clientName}`
                    .toLowerCase();

                return text.includes(query) &&
                    (!status || q.status === status);

            });

            $("filteredQuotes").innerHTML =
                quoteTable(filtered.slice().reverse());

            decorateStatuses();

        }

        $("quoteSearch").oninput = drawQuotes;
        $("quoteFilter").onchange = drawQuotes;

        drawQuotes();

    };

    /* =====================================
       STATI COLORATI
    ===================================== */

    function decorateStatuses() {

        const statusClasses = {

            "Bozza": "draft",
            "In attesa": "pending",
            "Accettato": "accepted",
            "Rifiutato": "rejected"

        };

        document.querySelectorAll(
            "#view td"
        ).forEach(cell => {

            if (cell.dataset.label !== "Stato") return;

            const value = cell.textContent.trim();

            if (!statusClasses[value]) return;

            const badge = document.createElement("span");

            badge.className =
                `status-pill ${statusClasses[value]}`;

            badge.textContent = value;

            cell.replaceChildren(badge);

        });

    }

    /* =====================================
       SALVATAGGIO
    ===================================== */

    saveQuote = function () {

        sync();

        if (!draft.clientName.trim() ||
            !draft.items.length ||
            !draft.date) {

            toast("Completa tutti i campi", "warning");

            return false;

        }

        if (!draft.number) {

            db.seq++;

            draft.number =
                "NC-" +
                new Date().getFullYear() +
                "-" +
                String(db.seq).padStart(4, "0");

        }

        const index = db.quotes.findIndex(
            q => q.id === draft.id
        );

        if (index < 0) {

            db.quotes.push(structuredClone(draft));

        } else {

            db.quotes[index] = structuredClone(draft);

        }

        if (save()) {

            toast("Preventivo salvato correttamente");

            return true;

        }

        return false;

    };

    /* =====================================
       CAMBIO PAGINA
    ===================================== */

    go = function (index) {

        closeSheet();

        originalGo(index);

        updateMobileNav();

        decorateStatuses();

    };

    createMobileNav();

    go(page);

})();