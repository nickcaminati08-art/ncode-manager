const catalog = [];
function category(name, entries, period = "una tantum") {
  entries.forEach(([title, price]) =>
    catalog.push({
      id: "s" + catalog.length,
      category: name,
      title,
      price,
      period,
    }),
  );
}
category("Siti web", [
  ["Landing page", 249],
  ["Monopagina", 349],
  ["Sito 3 pagine", 499],
  ["Sito 5 pagine", 699],
  ["Sito 10 pagine", 1099],
  ["Premium", 1499],
  ["E-commerce", 1499],
  ["Restyling", 399],
  ["Applicazione web", 0],
]);
category("Design", [
  ["Pagina aggiuntiva", 79],
  ["Sezione aggiuntiva", 29],
  ["Animazioni avanzate", 99],
  ["Dark mode", 59],
  ["Galleria fotografica", 49],
  ["Slider immagini", 39],
  ["Video integrato", 29],
  ["Logo base", 79],
  ["Logo professionale", 149],
  ["Restyling logo", 69],
  ["Identità visiva", 249],
  ["Favicon", 19],
]);
category("Funzionalità", [
  ["WhatsApp", 19],
  ["Google Maps", 19],
  ["Modulo contatti", 49],
  ["Modulo preventivi", 99],
  ["Recensioni Google", 59],
  ["Menù digitale", 89],
  ["QR code", 19],
  ["Catalogo prodotti", 149],
  ["Prenotazioni", 149],
  ["Newsletter", 99],
  ["Blog", 149],
  ["Chatbot", 149],
  ["Lingua aggiuntiva", 149],
  ["Pagamenti online", 199],
  ["Area riservata", 0],
  ["Database", 0],
  ["Pannello amministrativo", 0],
  ["Gestionale", 0],
]);
category("SEO", [
  ["Search Console", 49],
  ["Analytics", 69],
  ["Creazione profilo Google", 89],
  ["Ottimizzazione profilo Google", 69],
  ["SEO locale", 149],
  ["Audit SEO", 149],
  ["SEO iniziale", 199],
  ["Analisi concorrenti", 99],
  ["Parole chiave", 79],
  ["Velocità sito", 99],
  ["Testi per pagina", 49],
  ["Articolo blog", 59],
]);
category("Grafica", [
  ["Biglietto da visita", 39],
  ["Volantino", 49],
  ["Brochure", 99],
  ["Presentazione", 99],
  ["Grafica social", 19],
  ["5 grafiche", 79],
  ["10 grafiche", 149],
  ["Copertine social", 39],
  ["Firma email", 29],
  ["Montaggio video", 79],
]);
category("Pubblicità", [
  ["Google Ads setup", 149],
  ["Meta Ads setup", 149],
  ["Tracciamento conversioni", 79],
  ["Grafica pubblicitaria", 39],
  ["Report", 49],
]);
category("Tecnica", [
  ["Dominio setup", 39],
  ["Hosting setup", 49],
  ["Email aziendale", 39],
  ["DNS", 29],
  ["Migrazione", 99],
  ["Cookie banner", 79],
  ["Backup", 39],
  ["Assistenza / ora", 40],
  ["Modifiche / ora", 40],
  ["Urgenza / ora", 70],
  ["Consulenza / ora", 49],
]);
category(
  "Abbonamenti",
  [
    ["Care Basic", 19],
    ["Care Plus", 49],
    ["Care Pro", 99],
    ["Gestione Google", 49],
    ["SEO continuativa", 99],
    ["Social 4 post", 99],
    ["Social 8 post", 179],
    ["Social 12 post", 249],
    ["Newsletter gestita", 79],
    ["Manutenzione e-commerce", 99],
    ["Gestione Google Ads", 149],
    ["Gestione Meta Ads", 149],
  ],
  "mensile",
);
category(
  "Hosting",
  [
    ["Hosting base", 79],
    ["Hosting professionale", 149],
  ],
  "annuale",
);
