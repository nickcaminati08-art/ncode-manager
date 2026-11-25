const $ = (id) => document.getElementById(id);
const pages = [
  "Dashboard",
  "Preventivi",
  "Clienti",
  "Listino prezzi",
  "Abbonamenti",
  "Pagamenti",
  "Impostazioni",
];
let page = 0,
  draft = null;
const statuses = ["Bozza", "In attesa", "Accettato", "Rifiutato"];
function theme() {
  db.settings.dark = !db.settings.dark;
  save();
  document.body.classList.toggle("dark", db.settings.dark);
}
function go(i) {
  page = i;
  $("title").textContent = pages[i];
  $("nav").innerHTML = pages
    .map(
      (p, j) =>
        `<button class="${i === j ? "active" : ""}" onclick="go(${j})">${p}</button>`,
    )
    .join("");
  [dashboard, quotes, clients, services, subs, payments, settings][i]();
}
function table(headers, rows) {
  return `<div class="scroll"><table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.join("") || '<tr><td colspan="10">Nessun dato</td></tr>'}</tbody></table></div>`;
}
function field(label, id, value = "", type = "text") {
  return `<div><label for="${id}">${label}</label><input id="${id}" type="${type}" value="${esc(value)}"></div>`;
}
function options(arr, value) {
  return arr
    .map(
      (x) =>
        `<option value="${esc(x[0])}" ${String(x[0]) === String(value) ? "selected" : ""}>${esc(x[1])}</option>`,
    )
    .join("");
}
function totals(q) {
  let sums = { "una tantum": 0, mensile: 0, annuale: 0 };
  q.items.forEach((x) => (sums[x.period] += Number(x.price) * Number(x.qty)));
  let base = sums["una tantum"],
    discount =
      q.discountType === "€"
        ? Math.min(base, Math.max(0, q.discount))
        : (base * Math.min(100, Math.max(0, q.discount))) / 100;
  let net = base - discount,
    vat = (net * q.vat) / 100,
    total = net + vat;
  return {
    base,
    discount,
    net,
    vat,
    total,
    deposit: (total * q.deposit) / 100,
    monthly: sums.mensile * (1 + q.vat / 100),
    annual: sums.annuale * (1 + q.vat / 100),
  };
}
function dashboard() {
  let accepted = db.quotes.filter((q) => q.status === "Accettato");
  let paid = db.payments.reduce((s, p) => s + p.amount, 0);
  let outstanding = accepted.reduce(
    (s, q) =>
      s +
      Math.max(
        0,
        totals(q).total -
          db.payments
            .filter((p) => p.quote === q.id)
            .reduce((a, p) => a + p.amount, 0),
      ),
    0,
  );
  let mrr = db.subs
    .filter((s) => s.active)
    .reduce((a, s) => a + s.price / (s.period === "annuale" ? 12 : 1), 0);
  $("view").innerHTML = `<div class="grid">${[
    ["Incassi registrati", money(paid)],
    ["Preventivi", db.quotes.length],
    ["Clienti", db.clients.length],
    ["Canoni mensili equivalenti", money(mrr)],
    ["Accettati", accepted.length],
    ["Saldo da ricevere", money(outstanding)],
  ]
    .map(
      ([a, b]) =>
        `<div class="panel metric"><small>${a}</small><strong>${b}</strong></div>`,
    )
    .join(
      "",
    )}</div><div class="panel"><h3>Incassi ultimi 6 mesi</h3>${Array.from(
    { length: 6 },
    (_, i) => {
      let d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - 5 + i);
      let key = d.toLocaleDateString("sv-SE").slice(0, 7);
      let v = db.payments
        .filter((p) => p.date.startsWith(key))
        .reduce((a, p) => a + p.amount, 0);
      return `<div class="row"><span>${key}</span><div style="background:#004cff;height:12px;max-width:${Math.min(100, (v / Math.max(1, paid)) * 100)}%"></div><span>${money(v)}</span></div>`;
    },
  ).join(
    "",
  )}</div><div class="panel"><h3>Ultimi preventivi</h3><button onclick="newQuote()">+ Nuovo preventivo</button>${quoteTable(db.quotes.slice(-5).reverse())}</div>`;
}
function quoteTable(qs) {
  return table(
    ["Numero", "Cliente", "Totale", "Stato", "Azioni"],
    qs.map(
      (q) =>
        `<tr><td>${esc(q.number)}</td><td>${esc(q.clientName)}</td><td>${money(totals(q).total)}</td><td>${esc(q.status)}</td><td><button onclick="editQuote('${q.id}')">Apri</button> <button class="secondary" onclick="printQuote('${q.id}')">PDF</button></td></tr>`,
    ),
  );
}
function quotes() {
  $("view").innerHTML =
    `<div class="panel"><button onclick="newQuote()">+ Nuovo preventivo</button>${quoteTable(db.quotes.slice().reverse())}</div>`;
}
function newQuote() {
  go(1);
  draft = {
    id: uid(),
    number: "",
    date: today(),
    client: "",
    clientName: "",
    clientDetails: "",
    items: [],
    discount: 0,
    discountType: "%",
    vat: 0,
    deposit: 50,
    status: "Bozza",
    notes: db.settings.terms,
  };
  editor();
}
function editQuote(id) {
  go(1);
  draft = structuredClone(db.quotes.find((q) => q.id === id));
  editor();
}
function editor() {
  $("view").innerHTML =
    `<div class="panel"><div class="row"><div><label>Cliente</label><select onchange="chooseClient(this.value)">${options([["", "Cliente manuale"], ...db.clients.map((c) => [c.id, c.name])], draft.client)}</select></div>${field("Ragione sociale", "qname", draft.clientName)}${field("Data", "qdate", draft.date, "date")}<div><label>Stato</label><select id="qstatus">${options(
      statuses.map((s) => [s, s]),
      draft.status,
    )}</select></div></div>${field("Recapiti / P.IVA / indirizzo", "qdetails", draft.clientDetails)}</div><div class="split"><div class="panel"><h3>Configura servizi</h3><input placeholder="Cerca nel listino" oninput="filterServices(this.value)"><div class="row"><select id="pick"></select><button onclick="addService()">+ Aggiungi</button><button class="secondary" onclick="addCustom()">+ Personalizzato</button></div><div id="items"></div><label>Condizioni e note</label><textarea id="qnotes">${esc(draft.notes)}</textarea></div><div class="panel sticky"><h3>Riepilogo</h3><div class="row">${field("Sconto", "discount", draft.discount, "number")}<select id="dtype">${options(
      [
        ["%", "%"],
        ["€", "€"],
      ],
      draft.discountType,
    )}</select></div>${field("IVA % (se applicabile)", "vat", draft.vat, "number")}${field("Acconto %", "deposit", draft.deposit, "number")}<div id="sum"></div><div class="row"><button onclick="saveQuote()">Salva preventivo</button><button class="secondary" onclick="printDraft()">Esporta PDF</button></div><button class="danger" onclick="deleteQuote()">Elimina</button></div></div>`;
  filterServices("");
  renderItems();
  ["discount", "dtype", "vat", "deposit"].forEach(
    (id) => ($(id).oninput = summary),
  );
  summary();
}
function sync() {
  draft.clientName = $("qname").value;
  draft.clientDetails = $("qdetails").value;
  draft.date = $("qdate").value;
  draft.status = $("qstatus").value;
  draft.notes = $("qnotes").value;
  draft.discount = Math.max(0, Number($("discount").value) || 0);
  draft.discountType = $("dtype").value;
  draft.vat = Math.min(100, Math.max(0, Number($("vat").value) || 0));
  draft.deposit = Math.min(100, Math.max(0, Number($("deposit").value) || 0));
}
function chooseClient(id) {
  draft.client = id;
  let c = db.clients.find((c) => c.id === id);
  if (c) {
    $("qname").value = c.name;
    $("qdetails").value = [c.vat, c.email, c.phone, c.address]
      .filter(Boolean)
      .join(" | ");
  }
  sync();
}
function filterServices(s) {
  $("pick").innerHTML = options(
    db.services
      .filter((x) =>
        (x.category + " " + x.title).toLowerCase().includes(s.toLowerCase()),
      )
      .map((x) => [
        x.id,
        x.category +
          " · " +
          x.title +
          " · " +
          (x.price ? money(x.price) : "su preventivo") +
          " / " +
          x.period,
      ]),
    "",
  );
}
function addService() {
  let s = db.services.find((x) => x.id === $("pick").value);
  if (s) {
    draft.items.push({ ...s, qty: 1 });
    renderItems();
    summary();
  }
}
function addCustom() {
  draft.items.push({
    title: "Servizio personalizzato",
    price: 0,
    qty: 1,
    period: "una tantum",
  });
  renderItems();
  summary();
}
function changeItem(i, k, v) {
  draft.items[i][k] = ["price", "qty"].includes(k)
    ? Math.max(0, Number(v) || 0)
    : v;
  summary();
}
function renderItems() {
  $("items").innerHTML = draft.items
    .map(
      (x, i) =>
        `<div class="panel"><input aria-label="Servizio" value="${esc(x.title)}" oninput="changeItem(${i},'title',this.value)"><div class="row"><div><label>Prezzo unitario</label><input type="number" min="0" step="0.01" value="${x.price}" oninput="changeItem(${i},'price',this.value)"></div><div><label>Quantità</label><input type="number" min="0" value="${x.qty}" oninput="changeItem(${i},'qty',this.value)"></div><select onchange="changeItem(${i},'period',this.value)">${options(
          ["una tantum", "mensile", "annuale"].map((p) => [p, p]),
          x.period,
        )}</select><button class="danger" onclick="draft.items.splice(${i},1);renderItems();summary()">×</button></div></div>`,
    )
    .join("");
}
function summary() {
  sync();
  let t = totals(draft);
  $("sum").innerHTML =
    `<p>Subtotale: ${money(t.base)}</p><p>Sconto: −${money(t.discount)}</p><p>IVA: ${money(t.vat)}</p><small>Totale realizzazione</small><div class="total">${money(t.total)}</div><p>Acconto: ${money(t.deposit)}</p><p>Saldo: ${money(t.total - t.deposit)}</p><p>Mensile: ${money(t.monthly)}</p><p>Annuale: ${money(t.annual)}</p><p>Primo anno: ${money(t.total + 12 * t.monthly + t.annual)}</p>`;
}
function saveQuote() {
  sync();
  if (!draft.clientName.trim() || !draft.items.length || !draft.date) {
    alert("Inserisci cliente, data e servizi");
    return false;
  }
  if (!draft.number) {
    db.seq++;
    draft.number =
      "NC-" + new Date().getFullYear() + "-" + String(db.seq).padStart(4, "0");
  }
  let i = db.quotes.findIndex((q) => q.id === draft.id);
  if (i < 0) db.quotes.push(structuredClone(draft));
  else db.quotes[i] = structuredClone(draft);
  if (save()) {
    alert("Preventivo salvato");
    return true;
  }
  return false;
}
function deleteQuote() {
  if (confirm("Eliminare il preventivo?")) {
    db.quotes = db.quotes.filter((q) => q.id !== draft.id);
    save();
    go(1);
  }
}
function printDraft() {
  if (saveQuote()) printQuote(draft.id);
}
function printQuote(id) {
  let q = db.quotes.find((q) => q.id === id),
    t = totals(q),
    s = db.settings;
  $("print").innerHTML =
    `${s.logo ? `<img src="${esc(s.logo)}" style="max-width:160px;max-height:90px">` : ""}<h1 style="color:#004cff">${esc(s.name)}</h1><p>${esc(s.email)} · ${esc(s.website)}</p><h2>Preventivo ${esc(q.number)}</h2><p>${esc(q.date)} | ${esc(q.clientName)}</p><p>${esc(q.clientDetails)}</p>${table(
      ["Servizio", "Quantità", "Prezzo", "Periodicità", "Importo"],
      q.items.map(
        (x) =>
          `<tr><td>${esc(x.title)}</td><td>${x.qty}</td><td>${money(x.price)}</td><td>${esc(x.period)}</td><td>${money(x.qty * x.price)}</td></tr>`,
      ),
    )}<p>Subtotale ${money(t.base)} · Sconto ${money(t.discount)} · IVA ${money(t.vat)}</p><h2>Totale ${money(t.total)}</h2><p>Acconto ${money(t.deposit)} · Saldo ${money(t.total - t.deposit)}</p><p>Canone mensile ${money(t.monthly)} · Annuale ${money(t.annual)}</p><p>Totale primo anno ${money(t.total + t.monthly * 12 + t.annual)}</p><p style="white-space:pre-wrap">${esc(q.notes)}</p>`;
  window.print();
}
const schemas = {
  clients: [
    ["name", "Ragione sociale"],
    ["vat", "Partita IVA / CF"],
    ["email", "Email"],
    ["phone", "Telefono"],
    ["address", "Indirizzo"],
    ["notes", "Note"],
  ],
  services: [
    ["title", "Servizio"],
    ["category", "Categoria"],
    ["price", "Prezzo", "number"],
    ["period", "Periodicità", "period"],
  ],
  subs: [
    ["client", "Cliente", "client"],
    ["title", "Servizio"],
    ["price", "Canone lordo", "number"],
    ["period", "Periodicità", "period"],
    ["renewal", "Prossimo rinnovo", "date"],
    ["active", "Attivo", "bool"],
  ],
  payments: [
    ["quote", "Preventivo", "quote"],
    ["title", "Descrizione"],
    ["amount", "Importo incassato", "number"],
    ["date", "Data", "date"],
  ],
};
const labels = {
  clients: "Cliente",
  services: "Servizio",
  subs: "Abbonamento",
  payments: "Pagamento",
};
function clients() {
  records("clients");
}
function services() {
  records("services");
}
function subs() {
  records("subs");
}
function payments() {
  records("payments");
}
function records(type, query = "") {
  let schema = schemas[type];
  $("view").innerHTML =
    `<div class="panel"><div class="row"><button onclick="recordEdit('${type}')">+ ${labels[type]}</button><input id="search" placeholder="Cerca" value="${esc(query)}"></div><div id="recordTable"></div></div><div id="recordForm"></div>`;
  function draw() {
    let q = $("search").value.toLowerCase();
    $("recordTable").innerHTML = table(
      [...schema.map((x) => x[1]), "Azioni"],
      db[type]
        .filter((r) => JSON.stringify(r).toLowerCase().includes(q))
        .map(
          (r) =>
            `<tr>${schema.map(([k, l, t]) => `<td>${esc(t === "number" ? money(r[k]) : t === "bool" ? (r[k] ? "Sì" : "No") : t === "client" ? db.clients.find((c) => c.id === r[k])?.name || "Cliente rimosso" : t === "quote" ? db.quotes.find((c) => c.id === r[k])?.number || "—" : r[k])}</td>`).join("")}<td><button onclick="recordEdit('${type}','${r.id}')">Modifica</button> <button class="danger" onclick="recordDelete('${type}','${r.id}')">×</button></td></tr>`,
        ),
    );
  }
  $("search").oninput = draw;
  draw();
}
function recordEdit(type, id) {
  let r = db[type].find((x) => x.id === id) || {
    id: uid(),
    date: today(),
    renewal: today(),
    active: true,
    period: type === "subs" ? "mensile" : "una tantum",
  };
  let schema = schemas[type];
  $("recordForm").innerHTML =
    `<form class="panel" id="rf"><h3>${labels[type]}</h3><div class="grid">${schema
      .map(([k, l, t]) => {
        let choices =
          t === "period"
            ? (type === "subs"
                ? ["mensile", "annuale"]
                : ["una tantum", "mensile", "annuale"]
              ).map((p) => [p, p])
            : t === "bool"
              ? [
                  ["true", "Sì"],
                  ["false", "No"],
                ]
              : t === "client"
                ? db.clients.map((c) => [c.id, c.name])
                : t === "quote"
                  ? [
                      ["", "Non associato"],
                      ...db.quotes.map((q) => [
                        q.id,
                        q.number + " · " + q.clientName,
                      ]),
                    ]
                  : null;
        return choices
          ? `<div><label>${l}</label><select id="r_${k}">${options(choices, r[k])}</select></div>`
          : field(l, "r_" + k, r[k] ?? "", t || "text");
      })
      .join(
        "",
      )}</div><div class="row"><button type="submit">Salva</button><button type="button" class="secondary" onclick="document.getElementById('recordForm').innerHTML=''">Annulla</button></div></form>`;
  $("rf").onsubmit = (e) => {
    e.preventDefault();
    schema.forEach(([k, l, t]) => {
      let v = $("r_" + k).value;
      r[k] =
        t === "number"
          ? Math.max(0, Number(v) || 0)
          : t === "bool"
            ? v === "true"
            : v;
    });
    if (
      (type === "clients" && !r.name.trim()) ||
      (type !== "clients" && !r.title.trim()) ||
      (type === "subs" && !r.client) ||
      (type === "payments" && !r.date)
    ) {
      alert("Compila i campi obbligatori");
      return;
    }
    let i = db[type].findIndex((x) => x.id === r.id);
    if (i < 0) db[type].push(r);
    else db[type][i] = r;
    save();
    records(type);
  };
  $("rf").scrollIntoView({ behavior: "smooth" });
}
function recordDelete(type, id) {
  if (confirm("Eliminare questo elemento?")) {
    db[type] = db[type].filter((x) => x.id !== id);
    save();
    records(type);
  }
}
function settings() {
  let s = db.settings;
  $("view").innerHTML =
    `<div class="panel"><h3>Identità NCode</h3><div class="grid">${field("Nome", "brand", s.name)}${field("Email", "email", s.email)}${field("Sito web", "website", s.website)}</div><label>Logo (PNG/JPEG)</label><input type="file" id="logo" accept="image/png,image/jpeg"><label>Condizioni commerciali</label><textarea id="terms">${esc(s.terms)}</textarea><button onclick="saveSettings()">Salva impostazioni</button></div><div class="panel"><h3>Backup e ripristino</h3><p>I dati sono locali a questo browser. Esporta regolarmente un backup e conservalo in un luogo protetto.</p><button onclick="backup()">Scarica backup JSON</button><label>Ripristina backup (sostituisce tutti i dati)</label><input type="file" accept=".json" onchange="restore(this.files[0])"></div><div class="panel"><h3>Installazione PWA</h3><p>Su Chrome o Edge usa il menu Installa app. Su iPhone apri Safari, Condividi, Aggiungi alla schermata Home.</p><p>Nessun login o sincronizzazione nella versione locale.</p></div>`;
}
async function saveSettings() {
  let s = db.settings;
  s.name = $("brand").value;
  s.email = $("email").value;
  s.website = $("website").value;
  s.terms = $("terms").value;
  let f = $("logo").files[0];
  if (f) {
    if (!["image/png", "image/jpeg"].includes(f.type) || f.size > 500000) {
      alert("Logo PNG/JPEG massimo 500 KB");
      return;
    }
    s.logo = await new Promise((resolve, reject) => {
      let r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(f);
    });
  }
  if (save()) alert("Impostazioni salvate");
}
function backup() {
  let url = URL.createObjectURL(
    new Blob([JSON.stringify(db, null, 2)], { type: "application/json" }),
  );
  let a = document.createElement("a");
  a.href = url;
  a.download = "NCode-backup-" + today() + ".json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function restore(f) {
  if (!f) return;
  try {
    let x = JSON.parse(await f.text());
    if (
      !["services", "clients", "quotes", "subs", "payments"].every((k) =>
        Array.isArray(x[k]),
      ) ||
      !x.settings ||
      !Number.isInteger(x.seq)
    )
      throw Error("Formato non valido");
    if (confirm("Sostituire tutti i dati locali?")) {
      db = x;
      save();
      document.body.classList.toggle("dark", !!db.settings.dark);
      go(6);
    }
  } catch (e) {
    alert("Backup non valido: " + e.message);
  }
}
let installEvent;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  installEvent = e;
  $("install").hidden = false;
});
$("install").onclick = async () => {
  if (installEvent) {
    await installEvent.prompt();
    installEvent = null;
    $("install").hidden = true;
  }
};
window.addEventListener("appinstalled", () => {
  $("install").hidden = true;
});
if ("serviceWorker" in navigator)
  navigator.serviceWorker.register("./sw.js").catch(console.error);
document.body.classList.toggle("dark", !!db.settings.dark);
go(0);
