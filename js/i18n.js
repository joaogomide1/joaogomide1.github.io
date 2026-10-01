/* Idiomas: o português fica no HTML; aqui estão só as traduções para inglês. */
window.I18N = (function () {
  'use strict';

  const EN = {
    'nav.about': 'About', 'nav.skills': 'Skills', 'nav.data': 'Data', 'nav.lab': 'Lab',
    'nav.projects': 'Projects', 'nav.exp': 'Experience', 'nav.contact': 'Contact',

    'hero.hi': 'Hi, I\'m',
    'hero.lead': 'I turn data into decisions and code into solutions.',
    'hero.cta1': 'See projects', 'hero.cta2': 'Contact',

    'about.eyebrow': '01 · About',
    'about.title': 'Data first, <em>code</em> always.',
    'about.p1': 'I study Information Systems at the <strong>Federal University of Goiás</strong> and run the data side of <strong>Grupo LEMA</strong>: Power BI dashboards, spreadsheets, paid ads and automations.',
    'about.p2': 'I was an IT intern at the <strong>Goiás State Department of Industry and Commerce</strong> (Oct 2024 – 2026), where I deployed more than 200 machines, worked with APIs in Postman and did QA with automated tests. I speak fluent English, with a Cambridge certificate.',
    'about.cv': 'Download résumé',
    'about.s1': 'machines deployed', 'about.s2': 'projects in this portfolio', 'about.s3': 'languages',

    'skills.eyebrow': '02 · Skills', 'skills.title': 'Everyday tools',
    'skills.g1': 'Data', 'skills.excel': 'Advanced Excel', 'skills.viz': 'Data visualization',
    'skills.g2': 'Programming', 'skills.ruby': 'Ruby (beginner)',
    'skills.g3': 'Tools & practices', 'skills.qa': 'QA and automated tests', 'skills.assets': 'IT asset management',
    'skills.ads': 'Paid ads', 'skills.en': 'Fluent English (Cambridge)',

    'data.eyebrow': '03 · Data projects', 'data.title': 'From raw data to decisions',
    'lema.h1': 'Month, day, year and quarter filters that update every visual.',
    'lema.h2': 'Total revenue and PIX payments by year.',
    'lema.h3': 'Expenses by category: labor, miscellaneous and each branch.',
    'lema.h4': 'KPIs: total revenue, total expenses and average revenue.',
    'lema.h5': 'Monthly targets with a traffic-light indicator: hit, close or missed.',
    'lema.h6': 'Revenue by payment method: PIX, bank slip, card, cash and check.',
    'lema.note': 'Values blurred to protect company data. Tap or hover over the numbers.',
    'lema.title': 'Financial dashboard · Grupo LEMA',
    'lema.desc': 'I centralized the company\'s data analysis in a single dashboard. Revenue, expenses and targets used to be scattered across spreadsheets; now they live in one place and decisions are easier.',
    'lema.modal': '<div><h4>Problem</h4><p>Revenue, expenses and targets lived in separate spreadsheets. Answering simple questions, like "did we hit this month\'s target?", took time.</p></div><div><h4>What I did</h4><p>Modeled the data and built a single dashboard with period filters, revenue and PIX by year, expenses by category, KPIs, monthly targets with a traffic-light indicator and revenue by payment method.</p></div><div><h4>Result</h4><p>The company\'s data analysis became centralized, and decision-making got easier and faster.</p></div>',
    'ui.details': 'See details', 'ui.more': 'Read more →',

    'etl.title': 'Weather ETL pipeline',
    'etl.desc': 'Pulls the forecast for 5 Brazilian capitals from the Open-Meteo API, cleans and transforms it with pandas, loads it into SQLite and checks the result with SQL.',
    'etl.modal': '<div><h4>Extract</h4><p>Calls the public Open-Meteo API for São Paulo, Rio de Janeiro, Brasília, Salvador and Manaus: max and min temperature and rain for the next 7 days.</p></div><div><h4>Transform</h4><p>Flattens the nested JSON into a table, renames columns, fixes types, handles nulls, adds average temperature and a "will rain" flag, and drops duplicates.</p></div><div><h4>Load</h4><p>Writes to SQLite idempotently (re-running replaces the data) and validates with a SQL query of average temperature and rain per city.</p></div>',

    'eletro.label': 'payback',
    'eletro.title': 'EV charging station feasibility',
    'eletro.desc': 'Analysis of an EV charging station\'s sessions: daily averages, monthly projection, energy cost and investment payback time.',
    'eletro.modal': '<div><h4>Problem</h4><p>A newly opened charging station needed to know its real revenue and how long the investment would take to pay off.</p></div><div><h4>What I did</h4><p>A Python script that groups sessions by day, computes averages of gross and net revenue, kWh and number of sessions, projects the month and estimates payback. I also built an Excel cash flow, an HTML panel and a Power BI guide.</p></div><div><h4>Result</h4><p>A clear payback projection, updatable every week of operation. Real figures are not shown.</p></div>',

    'gov.tag': 'Goiás State Government',
    'gov.title': 'Climate risk dashboard · Goiás Resiliente',
    'gov.desc': 'A data dashboard built for the state government. As a public-sector project, details are not shown here.',

    'lab.eyebrow': '04 · Lab', 'lab.title': 'Run the projects right here',
    'lab.lead': 'Two Python projects rebuilt in JavaScript to run in your browser.',

    'ag.tag': 'Computational Intelligence (IC) · UFG',
    'ag.title': 'Genetic algorithm · F6 function',
    'ag.desc': 'A population of 100 individuals starts scattered. Each generation, selection, crossover and mutation push the points toward the F6 global maximum at the center of the map.',
    'ag.how': 'How it works →',
    'ag.pop': 'Population', 'ag.gens': 'Generations', 'ag.cross': 'Crossover rate', 'ag.mut': 'Mutation rate',
    'ag.seed': 'Seed 42 (same result as the presentation)',
    'ag.run': 'Run', 'ag.reset': 'Reset',
    'ag.gen': 'Generation', 'ag.best': 'Best F6',
    'ag.max': 'Theoretical maximum: F6 = 1.0 at (0, 0).',
    'ag.map': 'F6 function map', 'ag.zoom': 'Zoom to center', 'ag.low': 'low fitness', 'ag.high': 'high',
    'ag.conv': 'Best fitness per generation',
    'ag.modal': '<div><h4>Encoding</h4><p>Each individual has 44 bits: 22 for x and 22 for y, mapped to the range −100 to 100.</p></div><div><h4>Evolution</h4><p>Roulette-wheel selection, one-point crossover (65%), bit-flip mutation (0.8%) and elitism: the best of each generation carries over.</p></div><div><h4>Result</h4><p>F6 = 0.9628 in 40 generations with seed 42. In another run with 400 generations it reached about 0.99. The maximum is 1.0.</p></div>',
    'ag.fig1': '40 generations · 0.9628', 'ag.fig2': '400 generations · ≈ 0.99',
    'ag.gui': 'The original project also has a Tkinter interface to tune parameters and see the logs and chart.',

    'g.title': 'Hand-gesture volume control',
    'g.desc': 'A menu controlled with your hand only: the number of fingers picks an option, the thumb confirms or cancels and, in volume mode, 1 to 5 fingers set the volume from 0% to 100%.',
    'g.s1': '<b>Menu:</b> hold up 1 finger for 3 s to pick <em>Volume control</em> (2 fingers = another function).',
    'g.s2': '<b>Confirm:</b> thumb up for 3 s confirms. Thumb down cancels.',
    'g.s3': '<b>Volume:</b> hold up 1 to 5 fingers for 3 s: 0%, 25%, 50%, 75% or 100%.',
    'g.vol': 'Music volume', 'g.start': 'Turn on camera', 'g.stop': 'Turn off',
    'g.privacy': 'The camera only turns on when you click. Nothing is recorded or sent. In the browser the gesture controls a sample track; in the original, the Windows volume.',
    'g.modal': '<div><h4>Detection</h4><p>The webcam is read with OpenCV and MediaPipe Hands finds 21 hand landmarks. A finger counts as raised when its tip is above its middle joint.</p></div><div><h4>State menu</h4><p>Holding the same number of fingers for 5 seconds picks an option. Thumb up confirms and thumb down cancels, avoiding accidental triggers.</p></div><div><h4>Action</h4><p>In volume mode, 1 to 5 fingers set the Windows volume from 0% to 100% through the pycaw library.</p></div>',

    'dev.eyebrow': '05 · Other projects', 'dev.title': 'Websites, automations and games',
    'fleury.title': 'Website · Fleury Cosméticos',
    'fleury.desc': 'Website for a handmade fragrance brand, with a catalog by product line and direct contact via WhatsApp.',
    'fleury.modal': '<div><h4>Goal</h4><p>Give a handmade fragrance and body splash brand an online presence and take customers straight to a sales conversation.</p></div><div><h4>What\'s in it</h4><p>A home page with the brand identity, a catalog by line (body splash, oil, lotion, liquid soap and lip gloss), an about section and contact.</p></div><div><h4>Details</h4><p>Responsive layout, tabbed catalog navigation and a floating WhatsApp button.</p></div>',
    'aviso.title': 'Automatic date alerts · LEMA',
    'aviso.desc': 'Every day, on Google\'s servers, it checks holidays and birthdays and sends an e-mail and WhatsApp alert 3 days ahead.',
    'aviso.modal': '<div><h4>Problem</h4><p>Holidays, special dates and team birthdays went by without anyone remembering in time.</p></div><div><h4>What I did</h4><p>A script that runs by itself every day on Google\'s servers, reads two spreadsheets and gathers the events of the next 3 days.</p></div><div><h4>Result</h4><p>Automatic e-mail and WhatsApp alerts, free and without depending on a computer being on.</p></div>',
    'jogo.wip': 'In development',
    'jogo.title': 'Mobile guessing game',
    'jogo.desc': 'A clue-based phone game, with categories such as person, place, thing and entertainment. In the design phase: game design document and prototypes.',
    'jogo.modal': '<div><h4>Concept</h4><p>One phone acts as the card and is passed around. Each card has 20 numbered clues, and guessing with fewer clues scores more points (20 − clues used).</p></div><div><h4>Own rules</h4><p>Special clues (move forward, move back, lose your turn), a timer per clue, sessions that keep players and scores, and a new Entertainment category: movies, series, anime and games.</p></div><div><h4>Status</h4><p>In design: game design document, Figma prototype and a clickable card prototype. No app code yet.</p></div>',

    'exp.eyebrow': '06 · Experience', 'exp.title': 'Journey',
    'exp.d1': 'Current',
    'exp.t1': 'Data & marketing · Grupo LEMA',
    'exp.p1': 'Power BI dashboards, spreadsheet management, paid ad campaigns, the company\'s Google profile and Apps Script automations.',
    'exp.t2': 'IT intern · Goiás State Department of Industry and Commerce',
    'exp.p2': 'Replacement of more than 200 machines (imaging, domain join and software), IT asset management, Postman work with JSON and XML, remote support via AnyDesk and software QA with automated tests.',
    'exp.d3': 'In progress',
    'exp.t3': 'Information Systems · UFG',
    'exp.p3': 'Genetic algorithm projects in the Computational Intelligence (IC) course and computer vision with gesture control.',
    'exp.t4': 'Data Analysis · Hashtag Treinamentos',
    'exp.p4': 'Data analysis course.',

    'contact.eyebrow': '07 · Contact', 'contact.title': 'Let\'s talk?',
    'contact.lead': 'Open to Data/BI and software development roles.',
    'footer.top': 'Back to top ↑'
  };

  const PT = {};
  const titles = { pt: document.title, en: 'João Pedro Gomide · Data & Python' };
  let lang = 'pt';

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.dataset.i18n;
    if (!(k in PT)) PT[k] = el.innerHTML;
  });

  function apply(l) {
    lang = l === 'en' ? 'en' : 'pt';
    document.documentElement.lang = lang === 'en' ? 'en' : 'pt-BR';
    document.title = titles[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const v = (lang === 'en' ? EN : PT)[el.dataset.i18n];
      if (v != null) el.innerHTML = v;
    });
    try { localStorage.setItem('lang', lang); } catch (e) { /* armazenamento bloqueado */ }
    document.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
  }

  let saved = null;
  try { saved = localStorage.getItem('lang'); } catch (e) { /* armazenamento bloqueado */ }
  if (saved === 'en') apply('en');

  document.getElementById('lang-btn').addEventListener('click', () => apply(lang === 'en' ? 'pt' : 'en'));

  return {
    t: (pt, en) => (lang === 'en' ? en : pt),
    get lang() { return lang; }
  };
})();
