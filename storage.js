const KEY = "ncode-manager-v1";
const defaults = () => ({
  services: structuredClone(catalog),
  clients: [],
  quotes: [],
  subs: [],
  payments: [],
  settings: {
    name: "NCode",
    email: "",
    website: "",
    logo: "",
    terms:
      "Validità 15 giorni. Due cicli di revisioni inclusi. Costi esterni esclusi salvo accordi.",
    dark: false,
  },
  seq: 0,
});
let db;
try {
  db = JSON.parse(localStorage.getItem(KEY)) || defaults();
} catch {
  db = defaults();
}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
    return true;
  } catch (e) {
    alert("Salvataggio non riuscito: " + e.message);
    return false;
  }
}
const uid = () => crypto.randomUUID();
const money = (n) =>
  Number(n || 0).toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
  });
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const today = () => new Date().toLocaleDateString("sv-SE");
