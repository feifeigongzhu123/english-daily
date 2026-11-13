(function () {
  "use strict";

  const $ = (selector, root) => (root || document).querySelector(selector);
  const $$ = (selector, root) => Array.prototype.slice.call((root || document).querySelectorAll(selector));

  const STORAGE = {
    settings: "yct.settings.v1",
    learned: "yct.learned.v1",
    checkins: "yct.checkins.v1",
    last: "yct.last.v1",
    review: "yct.review.v1"
  };

  const DEFAULT_SETTINGS = {
    voiceURI: "",
    style: "cheerful",
    gap: 900,
    layout: "compact",
    showZh: true,
    scoring: true,
    playScope: "unit",
    reviewMode: "listening",
    dailyGoal: 10,
    showForms: true,
    fontSize: "medium"
  };

  const STYLES = {
    cheerful: { label: "轻快", rate: 0.98, pitch: 1.08 },
    gentle: { label: "温柔", rate: 0.9, pitch: 1.02 },
    standard: { label: "标准", rate: 0.92, pitch: 1.0 },
    slow: { label: "慢速", rate: 0.78, pitch: 1.0 }
  };

  const TILE_PALETTE = [
    ["#fde7d8", "#f7cbb8"],
    ["#e3f4f0", "#b9e6dd"],
    ["#fdf2d8", "#f7dfa6"],
    ["#e9e4f8", "#d4c9f0"],
    ["#e6f0fb", "#c9ddf5"],
    ["#fbe4e6", "#f5c2c8"]
  ];

  const POS_LABELS = {
    n: "名词",
    v: "动词",
    adj: "形容词",
    adv: "副词",
    prep: "介词",
    pron: "代词",
    conj: "连词",
    num: "数词",
    phr: "短语",
    abbr: "缩写",
    int: "感叹词",
    det: "限定词",
    "v. aux": "助动词",
    "aux. v": "助动词"
  };

  const IRREGULAR_VERBS = {
    be: ["was/were", "been", "being", "is/are"],
    have: ["had", "had", "having", "has"],
    do: ["did", "done", "doing", "does"],
    say: ["said", "said", "saying", "says"],
    go: ["went", "gone", "going", "goes"],
    get: ["got", "got", "getting", "gets"],
    make: ["made", "made", "making", "makes"],
    know: ["knew", "known", "knowing", "knows"],
    think: ["thought", "thought", "thinking", "thinks"],
    take: ["took", "taken", "taking", "takes"],
    see: ["saw", "seen", "seeing", "sees"],
    come: ["came", "come", "coming", "comes"],
    give: ["gave", "given", "giving", "gives"],
    find: ["found", "found", "finding", "finds"],
    tell: ["told", "told", "telling", "tells"],
    feel: ["felt", "felt", "feeling", "feels"],
    become: ["became", "become", "becoming", "becomes"],
    leave: ["left", "left", "leaving", "leaves"],
    put: ["put", "put", "putting", "puts"],
    mean: ["meant", "meant", "meaning", "means"],
    keep: ["kept", "kept", "keeping", "keeps"],
    let: ["let", "let", "letting", "lets"],
    begin: ["began", "begun", "beginning", "begins"],
    show: ["showed", "shown", "showing", "shows"],
    hear: ["heard", "heard", "hearing", "hears"],
    run: ["ran", "run", "running", "runs"],
    hold: ["held", "held", "holding", "holds"],
    bring: ["brought", "brought", "bringing", "brings"],
    write: ["wrote", "written", "writing", "writes"],
    sit: ["sat", "sat", "sitting", "sits"],
    stand: ["stood", "stood", "standing", "stands"],
    lose: ["lost", "lost", "losing", "loses"],
    pay: ["paid", "paid", "paying", "pays"],
    meet: ["met", "met", "meeting", "meets"],
    set: ["set", "set", "setting", "sets"],
    lead: ["led", "led", "leading", "leads"],
    understand: ["understood", "understood", "understanding", "understands"],
    speak: ["spoke", "spoken", "speaking", "speaks"],
    read: ["read", "read", "reading", "reads"],
    spend: ["spent", "spent", "spending", "spends"],
    grow: ["grew", "grown", "growing", "grows"],
    win: ["won", "won", "winning", "wins"],
    buy: ["bought", "bought", "buying", "buys"],
    send: ["sent", "sent", "sending", "sends"],
    build: ["built", "built", "building", "builds"],
    fall: ["fell", "fallen", "falling", "falls"],
    cut: ["cut", "cut", "cutting", "cuts"],
    sell: ["sold", "sold", "selling", "sells"],
    teach: ["taught", "taught", "teaching", "teaches"],
    catch: ["caught", "caught", "catching", "catches"],
    fight: ["fought", "fought", "fighting", "fights"],
    throw: ["threw", "thrown", "throwing", "throws"],
    fly: ["flew", "flown", "flying", "flies"],
    forget: ["forgot", "forgotten", "forgetting", "forgets"],
    choose: ["chose", "chosen", "choosing", "chooses"],
    drive: ["drove", "driven", "driving", "drives"],
    eat: ["ate", "eaten", "eating", "eats"],
    drink: ["drank", "drunk", "drinking", "drinks"],
    sleep: ["slept", "slept", "sleeping", "sleeps"],
    wake: ["woke", "woken", "waking", "wakes"],
    wear: ["wore", "worn", "wearing", "wears"],
    swim: ["swam", "swum", "swimming", "swims"],
    sing: ["sang", "sung", "singing", "sings"],
    ring: ["rang", "rung", "ringing", "rings"],
    break: ["broke", "broken", "breaking", "breaks"],
    steal: ["stole", "stolen", "stealing", "steals"],
    hide: ["hid", "hidden", "hiding", "hides"],
    hit: ["hit", "hit", "hitting", "hits"],
    hurt: ["hurt", "hurt", "hurting", "hurts"],
    cost: ["cost", "cost", "costing", "costs"],
    shut: ["shut", "shut", "shutting", "shuts"],
    spread: ["spread", "spread", "spreading", "spreads"],
    ride: ["rode", "ridden", "riding", "rides"],
    rise: ["rose", "risen", "rising", "rises"],
    shake: ["shook", "shaken", "shaking", "shakes"],
    shine: ["shone", "shone", "shining", "shines"],
    shoot: ["shot", "shot", "shooting", "shoots"],
    sink: ["sank", "sunk", "sinking", "sinks"],
    smell: ["smelt", "smelt", "smelling", "smells"],
    spell: ["spelt", "spelt", "spelling", "spells"],
    stick: ["stuck", "stuck", "sticking", "sticks"],
    strike: ["struck", "struck", "striking", "strikes"],
    sweep: ["swept", "swept", "sweeping", "sweeps"],
    swear: ["swore", "sworn", "swearing", "swears"],
    tear: ["tore", "torn", "tearing", "tears"],
    weave: ["wove", "woven", "weaving", "weaves"],
    weep: ["wept", "wept", "weeping", "weeps"],
    wind: ["wound", "wound", "winding", "winds"],
    prefer: ["preferred", "preferred", "preferring", "prefers"],
    travel: ["travelled", "travelled", "travelling", "travels"],
    cancel: ["cancelled", "cancelled", "cancelling", "cancels"],
    control: ["controlled", "controlled", "controlling", "controls"]
  };

  const IRREGULAR_PLURALS = {
    man: "men",
    woman: "women",
    child: "children",
    foot: "feet",
    tooth: "teeth",
    goose: "geese",
    mouse: "mice",
    person: "people",
    sheep: "sheep",
    deer: "deer",
    fish: "fish"
  };

  const UNCOUNTABLE_NOUNS = new Set([
    "water", "milk", "bread", "rice", "music", "information", "advice", "news",
    "weather", "homework", "money", "time", "air", "food", "work", "health",
    "nature", "pollution", "traffic", "luggage", "furniture", "equipment",
    "knowledge", "courage", "patience", "beauty", "fun", "harm", "research",
    "progress", "practice", "training", "homework", "physics", "maths",
    "politics", "economics", "gymnastics", "athletics", "species", "series",
    "means", "aircraft", "clothes", "police", "people"
  ]);

  const IRREGULAR_ADJECTIVES = {
    good: ["better", "best"],
    bad: ["worse", "worst"],
    far: ["further", "furthest"],
    little: ["less", "least"],
    many: ["more", "most"],
    much: ["more", "most"]
  };

  const SAFE_ICON_MAP = {
    "🧑‍🎓": "🎓",
    "👨‍👩‍👧‍👦": "👪",
    "👨‍👩‍👧": "👪",
    "👨‍👩‍👦": "👪",
    "👩‍👩‍👧": "👪",
    "👨‍👨‍👦": "👪",
    "👨‍🚀": "🚀",
    "🧑‍🏫": "🏫",
    "👨‍🍳": "🍳",
    "👩‍⚕️": "🩺",
    "🧑‍🤝‍🧑": "🤝",
    "🏃‍♀️": "🏃",
    "🏊‍♀️": "🏊",
    "🚴‍♀️": "🚴"
  };

  function safeIcon(icon) {
    const value = String(icon || "");
    if (SAFE_ICON_MAP[value]) return SAFE_ICON_MAP[value];
    if (value.indexOf("\u200D") !== -1) return "📘";
    return value;
  }

  const app = $(".app");
  const stageSwitch = $("#stageSwitch");
  const bookSelect = $("#bookSelect");
  const unitSelect = $("#unitSelect");
  const bookMeta = $("#bookMeta");
  const unitProgressText = $("#unitProgressText");
  const tabs = $("#tabs");
  const views = $$(".view");

  const unitEyebrow = $("#unitEyebrow");
  const unitTitle = $("#unitTitle");
  const unitSub = $("#unitSub");
  const unitProgressPct = $("#unitProgressPct");
  const unitProgressBar = $("#unitProgressBar");
  const wordList = $("#wordList");
  const autoPlayBtn = $("#autoPlayBtn");
  const markAllBtn = $("#markAllBtn");

  const passageTitle = $("#passageTitle");
  const passagePlayBtn = $("#passagePlayBtn");
  const passageZhBtn = $("#passageZhBtn");
  const textbookBody = $("#textbookBody");
  const textbookZh = $("#textbookZh");
  const textbookEmpty = $("#textbookEmpty");
  const textbookSearch = $("#textbookSearch");
  const passageBody = $("#passageBody");
  const passageZh = $("#passageZh");
  const passageExamples = $("#passageExamples");
  const passageProgress = $("#passageProgress");

  const todayLine = $("#todayLine");
  const checkinBtn = $("#checkinBtn");
  const streakNum = $("#streakNum");
  const streakBig = $("#streakBig");
  const checkinHint = $("#checkinHint");
  const dailyGoalText = $("#dailyGoalText");
  const dailyGoalBar = $("#dailyGoalBar");
  const dailyGoalHint = $("#dailyGoalHint");
  const dailyGoalSelect = $("#dailyGoalSelect");
  const statStreak = $("#statStreak");
  const statTotal = $("#statTotal");
  const statWords = $("#statWords");
  const statUnits = $("#statUnits");
  const calendarTitle = $("#calendarTitle");
  const calendarGrid = $("#calendarGrid");
  const calPrev = $("#calPrev");
  const calNext = $("#calNext");
  const badges = $("#badges");
  const streakChip = $("#streakChip");

  const startReviewBtn = $("#startReviewBtn");
  const dueCount = $("#dueCount");
  const wrongCount = $("#wrongCount");
  const reviewedCount = $("#reviewedCount");
  const reviewModeChips = $("#reviewModeChips");
  const reviewWrongBtn = $("#reviewWrongBtn");
  const quizCard = $("#quizCard");
  const quizProgress = $("#quizProgress");
  const quizScore = $("#quizScore");
  const quizModeLabel = $("#quizModeLabel");
  const quizPrompt = $("#quizPrompt");
  const quizIpa = $("#quizIpa");
  const quizAudio = $("#quizAudio");
  const quizOptions = $("#quizOptions");
  const quizSpelling = $("#quizSpelling");
  const quizInput = $("#quizInput");
  const quizSubmit = $("#quizSubmit");
  const quizFeedback = $("#quizFeedback");
  const quizNext = $("#quizNext");

  const player = $("#player");
  const playerWord = $("#playerWord");
  const playerMeta = $("#playerMeta");
  const playerEq = $("#playerEq");
  const playerPrev = $("#playerPrev");
  const playerToggle = $("#playerToggle");
  const playerNext = $("#playerNext");
  const playerLoop = $("#playerLoop");
  const playerScope = $("#playerScope");
  const playerClose = $("#playerClose");
  const playerProgressBar = $("#playerProgressBar");

  const settingsBtn = $("#settingsBtn");
  const settingsBack = $("#settingsBack");
  const playScopeSelect = $("#playScopeSelect");
  const voiceSelect = $("#voiceSelect");
  const voicePreview = $("#voicePreview");
  const voiceHint = $("#voiceHint");
  const styleChips = $("#styleChips");
  const gapRange = $("#gapRange");
  const gapLabel = $("#gapLabel");
  const layoutToggle = $("#layoutToggle");
  const zhToggle = $("#zhToggle");
  const formsToggle = $("#formsToggle");
  const fontSizeChips = $("#fontSizeChips");
  const scoreToggle = $("#scoreToggle");
  const resetBtn = $("#resetBtn");
  const dataSummary = $("#dataSummary");

  const shadowModal = $("#shadowModal");
  const shadowTitle = $("#shadowTitle");
  const shadowIcon = $("#shadowIcon");
  const shadowIpa = $("#shadowIpa");
  const shadowMeaning = $("#shadowMeaning");
  const shadowText = $("#shadowText");
  const shadowTargets = $("#shadowTargets");
  const shadowPrompt = $("#shadowPrompt");
  const shadowResult = $("#shadowResult");
  const shadowScore = $("#shadowScore");
  const shadowHeard = $("#shadowHeard");
  const shadowTip = $("#shadowTip");
  const shadowPlayback = $("#shadowPlayback");
  const shadowListen = $("#shadowListen");
  const shadowRecord = $("#shadowRecord");
  const shadowDone = $("#shadowDone");

  const toastEl = $("#toast");
  const confettiLayer = $("#confetti");

  const books = (window.YCT_BOOKS || []).map(normalizeBook);

  const state = {
    stage: "junior",
    bookId: "",
    unitId: "",
    tab: "words",
    lastTab: "words",
    settings: loadSettings(),
    learned: loadObject(STORAGE.learned, {}),
    checkins: loadArray(STORAGE.checkins),
    review: loadObject(STORAGE.review, {}),
    reviewSession: null,
    calendarMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    passageZhVisible: false,
    shadowTargets: [],
    shadowSelected: 0,
    player: {
      queue: [],
      index: 0,
      playing: false,
      loop: false,
      scope: "unit",
      generation: 0
    }
  };

  const passagePlay = { playing: false, generation: 0 };
  let passageSentences = [];
  let passageExampleSentences = [];
  let textbookLines = [];
  let previewToken = 0;
  let toastTimer = null;

  const synth = window.speechSynthesis || null;
  const speechSupported = !!synth;
  let voices = [];
  let chosenVoice = null;

  let recognition = null;
  let recognitionToken = 0;
  let recognizing = false;
  let noSpeechAttempts = 0;

  let mediaRecorder = null;
  let mediaChunks = [];
  let mediaStream = null;
  let recordedUrl = "";

  let audioContext = null;

  /* ---------- Boot ---------- */

  function init() {
    if (!books.length) {
      if (bookMeta) bookMeta.textContent = "词库加载失败，请检查 js/data-*.js";
      return;
    }
    initState();
    bindEvents();
    renderAll();
    initSpeech();
    renderCheckin();
  }

  function initState() {
    const last = loadObject(STORAGE.last, null);
    let book = null;

    if (last && last.bookId && books.some((b) => b.id === last.bookId)) {
      book = books.find((b) => b.id === last.bookId);
      state.stage = book.stage;
    } else {
      book = books.find((b) => b.stage === "junior") || books[0];
      state.stage = book.stage;
    }

    state.bookId = book.id;
    const unit = last && last.unitId && book.units.some((u) => u.id === last.unitId)
      ? book.units.find((u) => u.id === last.unitId)
      : book.units[0];
    state.unitId = unit.id;
  }

  /* ---------- Data helpers ---------- */

  function normalizeBook(book) {
    return {
      id: book.id,
      stage: book.stage,
      name: book.name,
      short: book.short,
      series: book.series,
      units: book.units.map((unit) => {
        const wordIcons = window.YCT_WORD_ICONS || {};
        const words = unit.words.map((row) => {
          const key = book.id + "/" + unit.id + "/" + row[0];
          return {
            w: row[0],
            ipa: row[1],
            pos: row[2],
            cn: row[3],
            en: row[4],
            zh: row[5],
            icon: wordIcons[key] || safeIcon(row[6] || "📘"),
            extra: false
          };
        });
        const seen = new Set(words.map((word) => word.w.toLowerCase()));
        const extras = (window.YCT_EXTRA && window.YCT_EXTRA[book.id] && window.YCT_EXTRA[book.id][unit.id]) || [];
        extras.forEach((row) => {
          if (!Array.isArray(row) || !row[0] || !row[3]) return;
          const word = String(row[0]).trim();
          if (!word || seen.has(word.toLowerCase())) return;
          seen.add(word.toLowerCase());
          const key = book.id + "/" + unit.id + "/" + word;
          const example = window.YCT_EXTRA_EXAMPLES && window.YCT_EXTRA_EXAMPLES[key];
          words.push({
            w: word,
            ipa: row[1] || "",
            pos: row[2] || "",
            cn: row[3],
            en: example ? example[0] : "",
            zh: example ? example[1] : "",
            icon: wordIcons[key] || "",
            extra: true
          });
        });
        return {
          id: unit.id,
          name: unit.name,
          title: unit.title,
          passage: unit.passage,
          textbook: unit.textbook,
          words: words
        };
      })
    };
  }

  function currentBook() {
    return books.find((b) => b.id === state.bookId) || books.find((b) => b.stage === state.stage) || books[0];
  }

  function currentUnit() {
    const book = currentBook();
    return book.units.find((u) => u.id === state.unitId) || book.units[0];
  }

  function wordKey(bookId, unitId, word) {
    return bookId + "/" + unitId + "/" + word;
  }

  function isLearned(bookId, unitId, word) {
    return !!state.learned[wordKey(bookId, unitId, word)];
  }

  function learnedCountInUnit(book, unit) {
    return unit.words.filter((word) => isLearned(book.id, unit.id, word.w)).length;
  }

  function learnedCountTotal() {
    return Object.keys(state.learned).length;
  }

  function completedUnitCount() {
    let count = 0;
    books.forEach((book) => {
      book.units.forEach((unit) => {
        if (unit.words.length && learnedCountInUnit(book, unit) === unit.words.length) count += 1;
      });
    });
    return count;
  }

  function styleConfig() {
    return STYLES[state.settings.style] || STYLES.cheerful;
  }

  function wordRate() {
    return Math.max(0.6, styleConfig().rate * 0.96);
  }

  function sentenceRate() {
    return styleConfig().rate;
  }

  /* ---------- Render: library ---------- */

  function renderAll() {
    const book = currentBook();
    const unit = currentUnit();
    state.bookId = book.id;
    state.unitId = unit.id;

    $$(".stage-btn", stageSwitch).forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.stage === state.stage);
    });

    renderBookOptions();
    renderUnitOptions();
    renderBookMeta();
    renderUnitHeader();
    renderWords();
    renderPassage();
    renderCheckin();
    renderReview();
    updateLayoutUI();
    updateSettingsUI();
    updatePlayerUI();
  }

  function renderBookOptions() {
    const stageBooks = books.filter((b) => b.stage === state.stage);
    bookSelect.innerHTML = stageBooks.map((b) =>
      '<option value="' + escapeAttr(b.id) + '">' + escapeHTML(b.name) + " · " + escapeHTML(b.series) + "</option>"
    ).join("");
    bookSelect.value = state.bookId;
  }

  function renderUnitOptions() {
    const book = currentBook();
    unitSelect.innerHTML = book.units.map((u) =>
      '<option value="' + escapeAttr(u.id) + '">' + escapeHTML(u.name) + " · " + escapeHTML(u.title) + "</option>"
    ).join("");
    unitSelect.value = state.unitId;
  }

  function renderBookMeta() {
    const book = currentBook();
    const total = book.units.reduce((sum, unit) => sum + unit.words.length, 0);
    bookMeta.textContent = book.series + " · " + book.units.length + " 个单元 · " + total + " 个单词";
  }

  function renderUnitHeader() {
    const book = currentBook();
    const unit = currentUnit();
    unitEyebrow.textContent = unit.name + " · " + book.name;
    unitTitle.textContent = unit.title;
    unitSub.textContent = unit.words.length + " 个单词 · 点击 🔊 听发音，🎙️ 跟读";
    updateUnitProgress();
  }

  function updateUnitProgress() {
    const book = currentBook();
    const unit = currentUnit();
    const count = learnedCountInUnit(book, unit);
    const pct = unit.words.length ? Math.round((count / unit.words.length) * 100) : 0;
    unitProgressText.textContent = count + " / " + unit.words.length + " 已学";
    unitProgressPct.textContent = pct + "%";
    unitProgressBar.style.width = pct + "%";
    markAllBtn.textContent = unit.words.length && count === unit.words.length ? "取消全部标记" : "全部标记已学";
  }

  function updateLayoutUI() {
    const compact = state.settings.layout === "compact";
    app.classList.toggle("layout-compact", compact);
    app.classList.toggle("layout-comfortable", !compact);
    app.classList.toggle("hide-zh", !state.settings.showZh);
    app.classList.toggle("hide-forms", !state.settings.showForms);
    app.classList.toggle("font-small", state.settings.fontSize === "small");
    app.classList.toggle("font-medium", state.settings.fontSize === "medium");
    app.classList.toggle("font-large", state.settings.fontSize === "large");
  }

  /* ---------- Word forms and part of speech ---------- */

  const DOUBLE_VERBS = new Set([
    "stop", "plan", "shop", "chat", "drop", "hug", "nod", "clap", "skip",
    "jog", "rob", "rub", "occur", "refer", "regret", "permit", "admit",
    "commit", "prefer", "travel", "cancel", "control"
  ]);

  const DOUBLE_ADJECTIVES = new Set(["big", "hot", "sad", "thin", "fat", "wet", "red"]);

  function posWithChinese(pos) {
    const raw = String(pos || "").trim();
    if (!raw) return "";
    const labels = raw.split("/").map((part) => {
      const key = part.replace(/\.$/, "").trim().toLowerCase();
      if (key === "modal v") return "情态动词";
      return POS_LABELS[key] || "";
    }).filter(Boolean);
    return raw + (labels.length ? " " + labels.join("/") : "");
  }

  function regularPast(base) {
    if (DOUBLE_VERBS.has(base)) return base + base.slice(-1) + "ed";
    if (/e$/.test(base)) return base + "d";
    if (/[^aeiou]y$/.test(base)) return base.slice(0, -1) + "ied";
    return base + "ed";
  }

  function ingForm(base) {
    if (/ie$/.test(base)) return base.slice(0, -2) + "ying";
    if (/e$/.test(base) && !/ee$/.test(base)) return base.slice(0, -1) + "ing";
    if (DOUBLE_VERBS.has(base)) return base + base.slice(-1) + "ing";
    return base + "ing";
  }

  function thirdPerson(base) {
    if (/(s|x|z|ch|sh)$/.test(base)) return base + "es";
    if (/[^aeiou]y$/.test(base)) return base.slice(0, -1) + "ies";
    return base + "s";
  }

  function verbForms(word) {
    const base = word.toLowerCase();
    const irregular = IRREGULAR_VERBS[base];
    if (irregular) {
      return "过去式 " + irregular[0] + " · 过去分词 " + irregular[1] +
        " · 现在分词 " + irregular[2] + " · 三单 " + irregular[3];
    }
    return "过去式 " + regularPast(base) + " · 过去分词 " + regularPast(base) +
      " · 现在分词 " + ingForm(base) + " · 三单 " + thirdPerson(base);
  }

  function nounPlural(word) {
    if (/^[A-Z]/.test(word)) return "";
    const base = word.toLowerCase();
    if (UNCOUNTABLE_NOUNS.has(base)) return "";
    if (IRREGULAR_PLURALS[base]) return IRREGULAR_PLURALS[base];
    if (/(s|x|z|ch|sh)$/.test(base)) return base + "es";
    if (/[^aeiou]y$/.test(base)) return base.slice(0, -1) + "ies";
    if (/fe$/.test(base)) return base.slice(0, -2) + "ves";
    if (/f$/.test(base) && !/(roof|chief|belief|chef|safe)$/.test(base)) return base.slice(0, -1) + "ves";
    if (/o$/.test(base) && !/(photo|piano|radio|video|studio|kilo|zoo|kangaroo|bamboo|tattoo|portfolio|logo|memo|auto|solo)$/.test(base)) return base + "es";
    if (/is$/.test(base)) return base.slice(0, -2) + "es";
    return base + "s";
  }

  function adjectiveForms(word) {
    const base = word.toLowerCase();
    const irregular = IRREGULAR_ADJECTIVES[base];
    if (irregular) return "比较级 " + irregular[0] + " · 最高级 " + irregular[1];
    if (/[^aeiou]y$/.test(base)) {
      return "比较级 " + base.slice(0, -1) + "ier · 最高级 " + base.slice(0, -1) + "iest";
    }
    if (/e$/.test(base)) {
      return "比较级 " + base + "r · 最高级 " + base + "st";
    }
    if (DOUBLE_ADJECTIVES.has(base)) {
      const doubled = base + base.slice(-1);
      return "比较级 " + doubled + "er · 最高级 " + doubled + "est";
    }
    if (base.length <= 5 && !/ful$|ous$|ive$|able$|ible$|al$|ed$|ing$|est$|ern$/.test(base)) {
      return "比较级 " + base + "er · 最高级 " + base + "est";
    }
    return "比较级 more " + base + " · 最高级 most " + base;
  }

  function formsForWord(word) {
    if (!word || !word.w || word.w.indexOf(" ") !== -1) return "";
    const tags = String(word.pos || "").split("/").map((tag) => tag.trim().toLowerCase());
    const hasVerb = tags.indexOf("v.") !== -1 || tags.indexOf("v") !== -1;
    const hasNoun = tags.indexOf("n.") !== -1 || tags.indexOf("n") !== -1;
    const hasAdjective = tags.indexOf("adj.") !== -1 || tags.indexOf("adj") !== -1;
    const isModal = tags.some((tag) => tag.indexOf("modal") !== -1);
    if (!hasVerb && !hasNoun && !hasAdjective) return "";

    const parts = [];
    if (hasVerb && !isModal) parts.push(verbForms(word.w));
    if (hasNoun) {
      const plural = nounPlural(word.w);
      if (plural) parts.push("复数 " + plural);
    }
    if (hasAdjective) parts.push(adjectiveForms(word.w));
    return parts.filter(Boolean).join(" · ");
  }

  /* ---------- Render: words ---------- */

  function renderWords() {
    const book = currentBook();
    const unit = currentUnit();
    renderUnitHeader();

    wordList.innerHTML = unit.words.map((word, index) =>
      wordRowHTML(word, index, book.id, unit.id)
    ).join("");
  }

  function wordRowHTML(word, index, bookId, unitId) {
    const learned = isLearned(bookId, unitId, word.w);
    const colors = tileColors(word.w);
    const icon = word.icon || word.w.charAt(0).toUpperCase();
    const hasSentence = !!(word.en || word.zh);
    const badge = word.extra ? '<span class="word-badge">扩展</span>' : "";
    const posLabel = posWithChinese(word.pos);
    const forms = formsForWord(word);
    const formsHTML = forms ? '<div class="word-forms">' + escapeHTML(forms) + "</div>" : "";
    const sentenceHTML = hasSentence
      ? '<div class="word-sentence">' +
          (word.en ? '<span class="en">' + highlightWord(word.en, word.w) + "</span>" : "") +
          (word.zh ? '<span class="zh">' + escapeHTML(word.zh) + "</span>" : "") +
        "</div>"
      : "";
    const sentenceButton = word.en
      ? '<button class="mini-btn play-sentence" type="button" data-action="play-sentence" title="朗读例句" aria-label="朗读例句">💬</button>'
      : "";

    return (
      '<div class="word-row" data-index="' + index + '" style="--tile-a:' + colors[0] + ";--tile-b:" + colors[1] +
      ";animation-delay:" + Math.min(index * 18, 160) + 'ms">' +
        '<div class="word-icon' + (word.icon ? "" : " letter-icon") + '" aria-hidden="true">' + escapeHTML(icon) + "</div>" +
        '<div class="word-main">' +
          '<div class="word-top">' +
            '<span class="word-text">' + escapeHTML(word.w) + "</span>" +
            (word.ipa ? '<span class="ipa">' + escapeHTML(word.ipa) + "</span>" : "") +
            (posLabel ? '<span class="pos">' + escapeHTML(posLabel) + "</span>" : "") +
            '<span class="meaning">' + escapeHTML(word.cn) + "</span>" +
            badge +
          "</div>" +
          formsHTML +
          sentenceHTML +
        "</div>" +
        '<div class="word-actions">' +
          '<button class="mini-btn play-word" type="button" data-action="play-word" title="朗读单词" aria-label="朗读单词 ' + escapeAttr(word.w) + '">🔊</button>' +
          sentenceButton +
          '<button class="mini-btn shadow" type="button" data-action="shadow-word" title="跟读" aria-label="跟读 ' + escapeAttr(word.w) + '">🎙️</button>' +
          '<button class="mini-btn learned' + (learned ? " on" : "") + '" type="button" data-action="toggle-learned" title="标记已学" aria-label="标记已学">✓</button>' +
        "</div>" +
      "</div>"
    );
  }

  function highlightWord(sentence, word) {
    const safe = escapeHTML(sentence);
    const target = escapeHTML(word);
    try {
      const regex = new RegExp("\\b" + escapeRegExp(target) + "\\b", "i");
      return safe.replace(regex, (match) => "<mark>" + match + "</mark>");
    } catch (error) {
      return safe;
    }
  }

  function toggleLearned(word, button) {
    const key = wordKey(state.bookId, state.unitId, word.w);
    if (state.learned[key]) delete state.learned[key];
    else state.learned[key] = Date.now();

    saveObject(STORAGE.learned, state.learned);
    button.classList.toggle("on", !!state.learned[key]);
    updateUnitProgress();
    if (state.tab === "checkin") renderCheckin();
  }

  function toggleAllLearned() {
    const book = currentBook();
    const unit = currentUnit();
    if (!unit.words.length) return;

    const all = learnedCountInUnit(book, unit) === unit.words.length;
    unit.words.forEach((word) => {
      const key = wordKey(book.id, unit.id, word.w);
      if (all) delete state.learned[key];
      else state.learned[key] = Date.now();
    });

    saveObject(STORAGE.learned, state.learned);
    renderWords();
    renderCheckin();
    if (state.player.playing && currentQueueItem()) highlightQueueItem(currentQueueItem(), false);
    showToast(all ? "已取消本单元标记" : "本单元已全部标记");
  }

  /* ---------- Render: passage ---------- */

  function renderPassage() {
    const book = currentBook();
    const unit = currentUnit();
    passageTitle.textContent = unit.title;

    const textbook = unit.textbook;
    textbookLines = [];
    if (textbook && textbook.en) {
      textbookLines = textbook.en.split("\n").map((line) => {
        const text = line.trim();
        return {
          text: text,
          speech: text.replace(/^[^:]{1,24}:\s*/, "")
        };
      }).filter((line) => line.text);
      textbookBody.innerHTML = textbookLines.map((line, index) =>
        '<div class="textbook-line">' +
          '<button class="mini-btn" type="button" data-tb-play="' + index + '" title="朗读这一句" aria-label="朗读这一句">▶</button>' +
          '<span>' + escapeHTML(line.text) + "</span>" +
          '<button class="mini-btn" type="button" data-tb-shadow="' + index + '" title="跟读这一句" aria-label="跟读这一句">🎙️</button>' +
        "</div>"
      ).join("");
      textbookZh.textContent = textbook.zh || "中文译文暂未收录。";
      textbookZh.classList.toggle("hidden", !state.passageZhVisible);
      textbookEmpty.classList.add("hidden");
    } else {
      textbookBody.innerHTML = "";
      textbookZh.textContent = "";
      textbookZh.classList.add("hidden");
      textbookEmpty.classList.remove("hidden");
      const query = [book.series, book.name, unit.name, unit.title, "课文原文"].join(" ");
      textbookSearch.href = "https://www.baidu.com/s?wd=" + encodeURIComponent(query);
    }
    passageSentences = splitSentences(unit.passage.en);
    passageBody.innerHTML = passageSentences.map((sentence, index) =>
      '<div class="sentence" data-index="' + index + '">' +
        '<span class="sentence-index">' + (index + 1) + "</span>" +
        '<span class="sentence-text">' + escapeHTML(sentence) + "</span>" +
        '<span class="sentence-actions">' +
          '<button class="mini-btn" type="button" data-action="play-sentence" title="朗读这一句" aria-label="朗读这一句">▶</button>' +
          '<button class="mini-btn" type="button" data-action="shadow-sentence" title="跟读这一句" aria-label="跟读这一句">🎙️</button>' +
        "</span>" +
      "</div>"
    ).join("");

    passageZh.textContent = unit.passage.zh;
    passageZh.classList.toggle("hidden", !state.passageZhVisible);
    passageZhBtn.textContent = state.passageZhVisible ? "隐藏译文" : "显示译文";
    passageProgress.textContent = "0 / " + passageSentences.length + " 句";
    passagePlayBtn.innerHTML = '<span class="btn-icon">▶</span>播放全文';
    passagePlay.playing = false;

    const examples = unit.words.filter((word) => word.en).slice(0, 8);
    passageExampleSentences = examples.map((word) => word.en);
    passageExamples.innerHTML = examples.length
      ? examples.map((word, index) =>
          '<div class="passage-example">' +
            '<button class="mini-btn" type="button" data-example-play="' + index + '" title="朗读例句" aria-label="朗读例句">▶</button>' +
            '<span>' + highlightWord(word.en, word.w) + "</span>" +
            '<button class="mini-btn" type="button" data-example-shadow="' + index + '" title="跟读例句" aria-label="跟读例句">🎙️</button>' +
          "</div>"
        ).join("")
      : '<p class="passage-note">本单元暂无可跟读例句。</p>';
  }

  function splitSentences(text) {
    const matches = String(text).match(/[^.!?]+[.!?]+["']?/g);
    const list = matches ? matches.map((s) => s.trim()).filter(Boolean) : [String(text).trim()];
    return list.length ? list : [String(text)];
  }

  function highlightSentence(index, scroll) {
    $$(".sentence", passageBody).forEach((el) => {
      el.classList.toggle("active", Number(el.dataset.index) === index);
    });
    passageProgress.textContent = (index + 1) + " / " + passageSentences.length + " 句";
    if (scroll) {
      const el = passageBody.querySelector('.sentence[data-index="' + index + '"]');
      if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  async function playPassageSentence(index) {
    stopPlayer(true);
    stopPassage();
    const text = passageSentences[index];
    if (!text) return;
    const token = ++passagePlay.generation;
    highlightSentence(index, true);
    await speakAsync(text, sentenceRate());
    if (token === passagePlay.generation) {
      /* keep the active highlight so the reader can compare */
    }
  }

  async function playPassageAll() {
    if (passagePlay.playing) {
      stopPassage();
      return;
    }
    stopPlayer(true);
    const token = ++passagePlay.generation;
    passagePlay.playing = true;
    passagePlayBtn.innerHTML = '<span class="btn-icon">⏸</span>暂停';

    for (let i = 0; i < passageSentences.length; i += 1) {
      if (token !== passagePlay.generation || !passagePlay.playing) return;
      highlightSentence(i, true);
      await speakAsync(passageSentences[i], sentenceRate());
      if (token !== passagePlay.generation) return;
      await wait(430);
    }

    if (token === passagePlay.generation) {
      passagePlay.playing = false;
      passagePlayBtn.innerHTML = '<span class="btn-icon">▶</span>播放全文';
    }
  }

  function stopPassage() {
    const wasPlaying = passagePlay.playing;
    passagePlay.generation += 1;
    passagePlay.playing = false;
    if (wasPlaying) speechCancel();
    passagePlayBtn.innerHTML = '<span class="btn-icon">▶</span>播放全文';
    $$(".sentence.active", passageBody).forEach((el) => el.classList.remove("active"));
  }

  /* ---------- Render: check-in ---------- */

  function renderCheckin() {
    const now = new Date();
    const streak = calcStreak();
    const checkedToday = state.checkins.indexOf(dateKey(now)) !== -1;
    const learned = learnedCountTotal();
    const completed = completedUnitCount();
    const goal = state.settings.dailyGoal || 10;
    const studied = todayStudiedCount();
    const remaining = Math.max(0, goal - studied);
    const canCheckIn = !checkedToday && studied >= goal;

    todayLine.textContent = formatDate(now);
    streakNum.textContent = streak;
    streakBig.textContent = streak;
    statStreak.textContent = streak;
    statTotal.textContent = state.checkins.length;
    statWords.textContent = learned;
    statUnits.textContent = completed;

    dailyGoalText.textContent = studied + " / " + goal + " 个词";
    dailyGoalBar.style.width = Math.min(100, Math.round((studied / goal) * 100)) + "%";

    if (checkedToday) {
      dailyGoalHint.textContent = "今天已经完成目标并打卡，明天继续保持。";
    } else if (canCheckIn) {
      dailyGoalHint.textContent = "今日目标已完成，可以打卡了。";
    } else {
      dailyGoalHint.textContent = "还差 " + remaining + " 个词。去单词页标记已学，或到复习页做一组自测。";
    }

    checkinBtn.disabled = checkedToday || !canCheckIn;
    checkinBtn.innerHTML = checkedToday
      ? '<span class="btn-icon">✓</span>今日已打卡'
      : canCheckIn
        ? '<span class="btn-icon">✓</span>今日打卡'
        : "还差 " + remaining + " 个词";

    if (checkedToday) {
      checkinHint.textContent = "今天完成啦，明天继续";
    } else if (canCheckIn) {
      checkinHint.textContent = "目标达成，打卡记录今天的学习";
    } else if (streak > 0) {
      checkinHint.textContent = "已连续 " + streak + " 天，今天别断哦";
    } else {
      checkinHint.textContent = "从今天开始，积累语感";
    }

    renderCalendar();
    renderBadges(streak, learned);
  }

  function todayStudiedCount() {
    const today = dateKey(new Date());
    const keys = new Set();
    Object.keys(state.learned).forEach((key) => {
      const value = state.learned[key];
      if (typeof value === "number" && dateKey(new Date(value)) === today) {
        keys.add(key);
      }
    });
    Object.keys(state.review).forEach((key) => {
      const record = state.review[key];
      if (record && record.last === today) keys.add(key);
    });
    return keys.size;
  }

  function renderCalendar() {
    const year = state.calendarMonth.getFullYear();
    const month = state.calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const start = (firstDay.getDay() + 6) % 7;
    const days = new Date(year, month + 1, 0).getDate();
    const today = dateKey(new Date());
    const checked = new Set(state.checkins);

    calendarTitle.textContent = year + "年" + (month + 1) + "月";

    let html = "";
    for (let i = 0; i < start; i += 1) html += '<div class="calendar-day empty"></div>';
    for (let day = 1; day <= days; day += 1) {
      const key = dateKey(new Date(year, month, day));
      const classes = ["calendar-day"];
      if (checked.has(key)) classes.push("checked");
      if (key === today) classes.push("today");
      html += '<div class="' + classes.join(" ") + '">' + day +
        (checked.has(key) ? '<span class="check-mark">✓</span>' : "") +
        "</div>";
    }
    calendarGrid.innerHTML = html;
  }

  function renderBadges(streak, learned) {
    const items = [
      { icon: "🌱", label: "连续 3 天", ok: streak >= 3 },
      { icon: "🔥", label: "连续 7 天", ok: streak >= 7 },
      { icon: "🌟", label: "连续 14 天", ok: streak >= 14 },
      { icon: "🏆", label: "连续 30 天", ok: streak >= 30 },
      { icon: "📚", label: "单词 100 个", ok: learned >= 100 },
      { icon: "🚀", label: "单词 300 个", ok: learned >= 300 }
    ];
    badges.innerHTML = items.map((item) =>
      '<span class="badge' + (item.ok ? " earned" : "") + '">' + item.icon + " " + item.label + "</span>"
    ).join("");
  }

  function checkIn() {
    const key = dateKey(new Date());
    if (state.checkins.indexOf(key) !== -1) {
      showToast("今天已经打过卡啦，明天见～");
      return;
    }
    const goal = state.settings.dailyGoal || 10;
    const studied = todayStudiedCount();
    if (studied < goal) {
      showToast("今天还差 " + (goal - studied) + " 个词，先去学几个吧");
      return;
    }
    state.checkins.push(key);
    saveArray(STORAGE.checkins, state.checkins);
    state.calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    chime();
    confetti();
    renderCheckin();
    showToast("打卡成功！连续 " + calcStreak() + " 天");
  }

  function calcStreak() {
    const set = new Set(state.checkins);
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    if (!set.has(dateKey(day))) day.setDate(day.getDate() - 1);
    let count = 0;
    while (set.has(dateKey(day))) {
      count += 1;
      day.setDate(day.getDate() - 1);
    }
    return count;
  }

  function dateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  function formatDate(date) {
    const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
    return date.getFullYear() + "年" + (date.getMonth() + 1) + "月" + date.getDate() + "日 · 星期" + weekdays[date.getDay()];
  }

  /* ---------- Review and spaced repetition ---------- */

  function allReviewItems() {
    const items = [];
    books.forEach((book) => {
      book.units.forEach((unit) => {
        unit.words.forEach((word) => {
          if (!word.cn) return;
          items.push({
            bookId: book.id,
            bookName: book.name,
            unitId: unit.id,
            unitName: unit.name + " · " + unit.title,
            word: word
          });
        });
      });
    });
    return items;
  }

  function reviewKey(item) {
    return item.bookId + "/" + item.unitId + "/" + item.word.w;
  }

  function reviewStats() {
    const all = allReviewItems();
    const today = dateKey(new Date());
    let due = 0;
    let wrong = 0;
    let reviewed = 0;
    all.forEach((item) => {
      const record = state.review[reviewKey(item)];
      if (!record) return;
      reviewed += 1;
      if (record.due && record.due <= today) due += 1;
      if (record.lastWrong) wrong += 1;
    });
    return { all: all, due: due, wrong: wrong, reviewed: reviewed };
  }

  function updateReviewStats() {
    const stats = reviewStats();
    if (dueCount) dueCount.textContent = stats.due;
    if (wrongCount) wrongCount.textContent = stats.wrong;
    if (reviewedCount) reviewedCount.textContent = stats.reviewed;
  }

  function updateReviewModeChips() {
    if (!reviewModeChips) return;
    $$(".style-chip", reviewModeChips).forEach((button) => {
      button.classList.toggle("active", button.dataset.mode === state.settings.reviewMode);
    });
  }

  function renderReview() {
    updateReviewStats();
    updateReviewModeChips();
    if (!state.reviewSession) quizCard.classList.add("hidden");
  }

  function startReview(onlyWrong) {
    stopPlayer(true);
    stopPassage();
    const all = allReviewItems();
    const today = dateKey(new Date());
    let pool = [];

    if (onlyWrong) {
      pool = all.filter((item) => {
        const record = state.review[reviewKey(item)];
        return record && record.lastWrong;
      });
      if (!pool.length) {
        showToast("错词本是空的，先做一组自测吧");
        return;
      }
    } else {
      pool = all.filter((item) => {
        const record = state.review[reviewKey(item)];
        return record && record.due <= today;
      });

      const addUnique = (items) => {
        const keys = new Set(pool.map(reviewKey));
        items.forEach((item) => {
          const key = reviewKey(item);
          if (!keys.has(key)) {
            keys.add(key);
            pool.push(item);
          }
        });
      };

      if (pool.length < 10) {
        const book = currentBook();
        const unit = currentUnit();
        addUnique(all.filter((item) =>
          item.bookId === book.id && item.unitId === unit.id && !state.review[reviewKey(item)]
        ));
      }
      if (pool.length < 10) {
        const book = currentBook();
        addUnique(all.filter((item) => item.bookId === book.id && !state.review[reviewKey(item)]));
      }
      if (pool.length < 10) {
        addUnique(all.filter((item) => {
          const record = state.review[reviewKey(item)];
          return record && record.lastWrong;
        }));
      }
      if (pool.length < 10) {
        addUnique(all.filter((item) => !state.review[reviewKey(item)]));
      }
      if (pool.length < 10) {
        addUnique(all);
      }
    }

    const queue = shuffle(pool.slice()).slice(0, 10);
    if (!queue.length) {
      showToast("暂时没有可复习的单词");
      return;
    }

    state.reviewSession = {
      items: queue,
      index: 0,
      correct: 0,
      answered: false,
      mode: state.settings.reviewMode,
      onlyWrong: !!onlyWrong,
      finished: false
    };
    quizCard.classList.remove("hidden");
    quizCard.scrollIntoView({ block: "start", behavior: "smooth" });
    renderQuizQuestion();
  }

  function shuffle(list) {
    for (let i = list.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = list[i];
      list[i] = list[j];
      list[j] = temp;
    }
    return list;
  }

  function buildChoiceOptions(word) {
    const all = allReviewItems();
    const options = [word.cn];
    const seen = new Set(options);
    shuffle(all.slice()).forEach((item) => {
      if (options.length >= 4) return;
      const cn = item.word.cn;
      if (!cn || seen.has(cn)) return;
      seen.add(cn);
      options.push(cn);
    });
    return shuffle(options);
  }

  function currentReviewItem() {
    const session = state.reviewSession;
    if (!session) return null;
    return session.items[session.index] || null;
  }

  function renderQuizQuestion() {
    const session = state.reviewSession;
    if (!session) return;
    if (session.finished) return;
    if (session.index >= session.items.length) {
      finishReview();
      return;
    }

    const item = currentReviewItem();
    if (!item) {
      finishReview();
      return;
    }
    const word = item.word;
    const mode = state.settings.reviewMode;
    session.mode = mode;
    session.answered = false;

    quizProgress.textContent = (session.index + 1) + " / " + session.items.length;
    quizScore.textContent = session.correct + " 分";
    quizNext.classList.add("hidden");
    quizFeedback.classList.add("hidden");
    quizFeedback.innerHTML = "";
    quizAudio.classList.add("hidden");
    quizSpelling.classList.add("hidden");
    quizOptions.classList.remove("hidden");
    quizOptions.innerHTML = "";
    quizPrompt.classList.remove("hidden");
    quizIpa.classList.remove("hidden");

    if (mode === "spelling") {
      quizModeLabel.textContent = "看义拼写";
      quizPrompt.textContent = word.cn;
      const firstLetter = word.w.charAt(0).toUpperCase();
      quizIpa.textContent = (word.pos ? word.pos + " · " : "") + firstLetter + "… (" + word.w.length + " 个字母)";
      quizIpa.classList.remove("hidden");
      quizOptions.classList.add("hidden");
      quizSpelling.classList.remove("hidden");
      quizInput.value = "";
      setTimeout(() => quizInput.focus(), 80);
      return;
    }

    const options = buildChoiceOptions(word);
    quizOptions.innerHTML = options.map((cn) =>
      '<button class="quiz-option" type="button" data-cn="' + escapeAttr(cn) + '">' + escapeHTML(cn) + "</button>"
    ).join("");
    quizIpa.textContent = word.ipa || "";
    quizIpa.classList.toggle("hidden", !word.ipa);

    if (mode === "listening") {
      quizModeLabel.textContent = "听音选义";
      quizPrompt.textContent = "听一听，选择正确意思";
      quizIpa.classList.add("hidden");
      quizAudio.classList.remove("hidden");
      const sessionAtStart = session;
      const indexAtStart = session.index;
      setTimeout(() => {
        if (state.reviewSession === sessionAtStart && sessionAtStart.index === indexAtStart && !sessionAtStart.answered) {
          speakAsync(word.w, wordRate());
        }
      }, 320);
    } else {
      quizModeLabel.textContent = "看词选义";
      quizPrompt.textContent = word.w;
    }
  }

  function showQuizFeedback(correct, item, chosen) {
    const word = item.word;
    const parts = [];
    parts.push("<b>" + (correct ? "答对了！" : "再记一次") + "</b>");
    parts.push("<p>" + escapeHTML(word.w) + (word.ipa ? " " + escapeHTML(word.ipa) : "") + " · " + escapeHTML(word.cn) + "</p>");
    if (word.en) parts.push('<p class="quiz-example">' + highlightWord(word.en, word.w) + "</p>");
    if (!correct && chosen) parts.push('<p class="quiz-chosen">你的答案：' + escapeHTML(chosen) + "</p>");
    quizFeedback.innerHTML = parts.join("");
    quizFeedback.classList.remove("hidden");
    quizNext.classList.remove("hidden");
    quizNext.textContent = state.reviewSession && state.reviewSession.index >= state.reviewSession.items.length - 1
      ? "查看结果"
      : "下一题";
  }

  function answerChoice(chosen) {
    const session = state.reviewSession;
    if (!session || session.answered) return;
    const item = currentReviewItem();
    if (!item) return;
    session.answered = true;
    const correct = chosen === item.word.cn;
    if (correct) session.correct += 1;
    recordReview(item, correct);
    $$(".quiz-option", quizOptions).forEach((button) => {
      button.disabled = true;
      if (button.dataset.cn === item.word.cn) button.classList.add("correct");
      else if (button.dataset.cn === chosen) button.classList.add("wrong");
    });
    quizScore.textContent = session.correct + " 分";
    showQuizFeedback(correct, item, correct ? "" : chosen);
  }

  function answerSpelling() {
    const session = state.reviewSession;
    if (!session || session.answered) return;
    const item = currentReviewItem();
    if (!item) return;
    const value = quizInput.value.trim();
    if (!value) {
      quizInput.focus();
      return;
    }
    session.answered = true;
    const correct = value.toLowerCase() === item.word.w.toLowerCase();
    if (correct) session.correct += 1;
    recordReview(item, correct);
    quizScore.textContent = session.correct + " 分";
    quizSpelling.classList.add("hidden");
    quizOptions.classList.remove("hidden");
    quizOptions.innerHTML = "";
    showQuizFeedback(correct, item, "");
  }

  function recordReview(item, correct) {
    const key = reviewKey(item);
    const previous = state.review[key] || { box: 0, seen: 0, right: 0, wrong: 0 };
    const next = Object.assign({}, previous);
    next.seen = (previous.seen || 0) + 1;
    next.last = dateKey(new Date());
    if (correct) {
      next.right = (previous.right || 0) + 1;
      next.box = Math.min(5, (previous.box || 0) + 1);
      next.lastWrong = false;
      const intervals = [0, 1, 3, 7, 14, 30];
      next.due = addDays(intervals[next.box] || 1);
    } else {
      next.wrong = (previous.wrong || 0) + 1;
      next.box = 1;
      next.lastWrong = true;
      next.due = dateKey(new Date());
    }
    state.review[key] = next;
    saveObject(STORAGE.review, state.review);
    updateReviewStats();
    if (state.tab === "checkin") renderCheckin();
  }

  function addDays(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return dateKey(date);
  }

  function finishReview() {
    const session = state.reviewSession;
    if (!session) return;
    session.finished = true;
    updateReviewStats();
    quizProgress.textContent = session.items.length + " / " + session.items.length;
    quizScore.textContent = session.correct + " 分";
    quizModeLabel.textContent = "本组完成";
    quizPrompt.textContent = "答对 " + session.correct + " / " + session.items.length;
    quizIpa.textContent = "";
    quizIpa.classList.add("hidden");
    quizAudio.classList.add("hidden");
    quizSpelling.classList.add("hidden");
    quizFeedback.classList.add("hidden");
    quizNext.classList.add("hidden");
    quizOptions.classList.remove("hidden");
    quizOptions.innerHTML =
      '<button class="btn primary" type="button" data-quiz-action="again">再来一组</button>' +
      '<button class="btn ghost" type="button" data-quiz-action="close">返回单词</button>';
  }

  function setReviewMode(mode) {
    if (!["choice", "spelling", "listening"].includes(mode)) return;
    state.settings.reviewMode = mode;
    saveSettings();
    updateReviewModeChips();
    if (state.reviewSession && !state.reviewSession.finished) {
      showToast("下一题开始使用新的自测方式");
    }
  }

  /* ---------- Views and switching ---------- */

  function switchStage(stage) {
    if (state.stage === stage) return;
    const first = books.find((b) => b.stage === stage);
    if (!first) return;
    state.stage = stage;
    state.bookId = first.id;
    state.unitId = first.units[0].id;
    stopPlayer(true);
    stopPassage();
    saveLast();
    renderAll();
  }

  function switchBook(bookId) {
    const book = books.find((b) => b.id === bookId);
    if (!book || book.stage !== state.stage) return;
    state.bookId = book.id;
    state.unitId = book.units[0].id;
    stopPlayer(true);
    stopPassage();
    saveLast();
    renderAll();
  }

  function switchUnit(unitId) {
    const book = currentBook();
    if (!book.units.some((u) => u.id === unitId)) return;
    state.unitId = unitId;
    stopPlayer(true);
    stopPassage();
    saveLast();
    renderAll();
  }

  function switchTab(tab) {
    if (tab === "settings") {
      showSettings();
      return;
    }
    app.classList.remove("settings-mode");
    tabs.classList.remove("hidden");
    state.tab = tab;
    state.lastTab = tab;
    $$(".tab", tabs).forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tab));
    views.forEach((view) => view.classList.toggle("active", view.id === "view-" + tab));

    if (tab !== "passage") stopPassage();
    if (tab !== "words" && state.player.playing) pausePlayback();
    if (tab === "checkin") renderCheckin();
    if (tab === "review") renderReview();
    if (tab === "words" && state.player.queue.length) highlightQueueItem(currentQueueItem(), true);
  }

  /* ---------- Speech synthesis ---------- */

  function initSpeech() {
    if (!speechSupported) {
      showToast("当前浏览器不支持语音朗读，建议使用 Chrome 或 Edge");
      renderVoiceOptions();
      return;
    }
    loadVoices();
    synth.onvoiceschanged = loadVoices;
    try {
      synth.addEventListener("voiceschanged", loadVoices);
    } catch (error) {
      /* older browsers only support onvoiceschanged */
    }
  }

  function loadVoices() {
    if (!speechSupported) return;
    voices = (synth.getVoices() || []).filter((voice) => /^en/i.test(voice.lang));
    chosenVoice = pickVoice();
    renderVoiceOptions();
  }

  function pickVoice() {
    if (!voices.length) return null;
    const saved = state.settings.voiceURI;
    if (saved) {
      const found = voices.find((voice) => voice.voiceURI === saved);
      if (found) return found;
    }

    const preferences = [
      /aria.*natural|natural.*aria/i,
      /jenny.*natural|natural.*jenny/i,
      /natural/i,
      /neural/i,
      /google us english/i,
      /samantha/i,
      /zira/i,
      /susan/i,
      /female/i
    ];

    for (let i = 0; i < preferences.length; i += 1) {
      const match = voices.find((voice) => preferences[i].test(voice.name) && /^en(-|_)/i.test(voice.lang));
      if (match) return match;
    }

    return voices.find((voice) => /^en-US/i.test(voice.lang)) ||
      voices.find((voice) => /^en/i.test(voice.lang)) ||
      voices[0] ||
      null;
  }

  function renderVoiceOptions() {
    if (!voiceSelect) return;
    if (!voices.length) {
      voiceSelect.innerHTML = '<option value="">系统默认英语声音</option>';
      voiceSelect.disabled = true;
      if (voiceHint) {
        voiceHint.textContent = "当前系统未检测到英语语音。建议使用 Edge 浏览器，或在系统设置中安装英语语音包，朗读会更自然。";
      }
      return;
    }
    voiceSelect.disabled = false;
    if (voiceHint) {
      voiceHint.textContent = "推荐使用 Edge / Chrome，并选择带 Natural 或 Neural 的英语声音，朗读会更自然、更轻松。";
    }
    voiceSelect.innerHTML = voices.map((voice) =>
      '<option value="' + escapeAttr(voice.voiceURI) + '">' +
        escapeHTML(voice.name) + " · " + escapeHTML(voice.lang) +
      "</option>"
    ).join("");

    if (state.settings.voiceURI && voices.some((voice) => voice.voiceURI === state.settings.voiceURI)) {
      voiceSelect.value = state.settings.voiceURI;
    } else if (chosenVoice) {
      voiceSelect.value = chosenVoice.voiceURI;
    }
  }

  function speakAsync(text, rate) {
    return new Promise((resolve) => {
      const clean = String(text || "").trim();
      if (!clean) {
        resolve();
        return;
      }
      if (!speechSupported) {
        showToast("当前浏览器不支持语音朗读");
        resolve();
        return;
      }

      const style = styleConfig();
      const utterance = new SpeechSynthesisUtterance(clean);
      if (chosenVoice) {
        utterance.voice = chosenVoice;
        utterance.lang = chosenVoice.lang;
      } else {
        utterance.lang = "en-US";
      }
      utterance.rate = rate || style.rate;
      utterance.pitch = style.pitch;
      utterance.volume = 1;

      let finished = false;
      let fallback = null;
      const finish = () => {
        if (finished) return;
        finished = true;
        if (fallback) clearTimeout(fallback);
        resolve();
      };

      utterance.onend = finish;
      utterance.onerror = finish;

      try {
        synth.cancel();
      } catch (error) {
        /* ignore */
      }
      try {
        if (synth.paused) synth.resume();
      } catch (error) {
        /* ignore */
      }

      setTimeout(() => {
        if (finished) return;
        try {
          synth.speak(utterance);
        } catch (error) {
          finish();
        }
      }, 25);

      fallback = setTimeout(finish, Math.min(25000, Math.max(5000, clean.length * 190 + 2800)));
    });
  }

  function speechCancel() {
    if (!speechSupported) return;
    try {
      synth.cancel();
    } catch (error) {
      /* ignore */
    }
  }

  function previewSpeak(text) {
    stopPlayer(true);
    stopPassage();
    return speakAsync(text, styleConfig().rate);
  }

  /* ---------- Word playback ---------- */

  function buildQueue(scope) {
    const queue = [];
    if (scope === "stage") {
      books.filter((book) => book.stage === state.stage).forEach((book) => {
        book.units.forEach((unit) => {
          unit.words.forEach((word, index) => {
            queue.push({
              bookId: book.id,
              bookName: book.name,
              unitId: unit.id,
              unitName: unit.name + " · " + unit.title,
              wordIndex: index,
              word: word
            });
          });
        });
      });
      return queue;
    }

    const book = currentBook();
    const units = scope === "book" ? book.units : [currentUnit()];
    units.forEach((unit) => {
      unit.words.forEach((word, index) => {
        queue.push({
          bookId: book.id,
          bookName: book.name,
          unitId: unit.id,
          unitName: unit.name + " · " + unit.title,
          wordIndex: index,
          word: word
        });
      });
    });
    return queue;
  }

  function startAutoPlay() {
    stopPassage();
    const scope = state.settings.playScope || "unit";
    state.settings.playScope = scope;
    playerScope.value = scope;
    saveSettings();
    const queue = buildQueue(scope);
    if (!queue.length) {
      showToast("这个单元还没有单词");
      return;
    }
    state.player.queue = queue;
    state.player.scope = scope;
    state.player.index = 0;
    state.player.playing = true;
    player.classList.add("show");
    playQueue();
  }

  function currentQueueItem() {
    const queue = state.player.queue;
    if (!queue.length) return null;
    return queue[Math.min(state.player.index, queue.length - 1)];
  }

  async function playQueue() {
    const token = ++state.player.generation;
    const queue = state.player.queue;
    if (!queue.length) {
      state.player.playing = false;
      updatePlayerUI();
      return;
    }

    state.player.playing = true;
    updatePlayerUI();

    while (state.player.playing && state.player.index < queue.length && token === state.player.generation) {
      const item = queue[state.player.index];
      followQueueItem(item);
      updatePlayerUI();
      highlightQueueItem(item, true);

      await speakAsync(item.word.w, wordRate());
      if (token !== state.player.generation || !state.player.playing) return;

      if (item.word.en) {
        await wait(230);
        if (token !== state.player.generation || !state.player.playing) return;

        await speakAsync(item.word.en, sentenceRate());
        if (token !== state.player.generation || !state.player.playing) return;
      }

      await wait(state.settings.gap);
      if (token !== state.player.generation || !state.player.playing) return;

      if (state.player.index >= queue.length - 1) {
        if (state.player.loop) {
          state.player.index = 0;
        } else {
          state.player.index = queue.length;
          break;
        }
      } else {
        state.player.index += 1;
      }
      updatePlayerUI();
    }

    if (token === state.player.generation) {
      state.player.playing = false;
      updatePlayerUI();
      clearPlayingHighlights();
    }
  }

  function pausePlayback() {
    state.player.playing = false;
    state.player.generation += 1;
    speechCancel();
    updatePlayerUI();
  }

  function stopPlayer(hide) {
    const wasPlaying = state.player.playing;
    state.player.generation += 1;
    state.player.playing = false;
    if (wasPlaying) speechCancel();

    if (hide) {
      state.player.queue = [];
      state.player.index = 0;
      player.classList.remove("show");
    }
    updatePlayerUI();
    clearPlayingHighlights();
  }

  function followQueueItem(item) {
    if (!item) return;
    if (item.bookId !== state.bookId) {
      const book = books.find((entry) => entry.id === item.bookId);
      if (!book) return;
      state.bookId = book.id;
      state.stage = book.stage;
      state.unitId = item.unitId;
      renderBookOptions();
      renderUnitOptions();
      renderBookMeta();
      bookSelect.value = state.bookId;
      unitSelect.value = state.unitId;
      renderWords();
      renderPassage();
      saveLast();
      return;
    }

    if (item.unitId !== state.unitId) {
      state.unitId = item.unitId;
      unitSelect.value = item.unitId;
      renderWords();
      renderPassage();
      saveLast();
    }
  }

  function highlightQueueItem(item, scroll) {
    clearPlayingHighlights();
    if (!item || item.bookId !== state.bookId || item.unitId !== state.unitId) return;
    const row = wordList.querySelector('.word-row[data-index="' + item.wordIndex + '"]');
    if (!row) return;
    row.classList.add("playing");
    if (scroll && state.tab === "words") {
      row.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  function clearPlayingHighlights() {
    $$(".word-row.playing", wordList).forEach((row) => row.classList.remove("playing"));
  }

  async function previewWord(word, row, mode) {
    stopPlayer(true);
    stopPassage();
    const token = ++previewToken;
    clearPlayingHighlights();
    row.classList.add("playing");
    await speakAsync(mode === "sentence" ? word.en : word.w, mode === "sentence" ? sentenceRate() : wordRate());
    if (token === previewToken) {
      setTimeout(() => row.classList.remove("playing"), 380);
    }
  }

  function updatePlayerUI() {
    const queue = state.player.queue;
    const playing = state.player.playing;

    autoPlayBtn.innerHTML = playing
      ? '<span class="btn-icon">⏸</span>暂停'
      : '<span class="btn-icon">▶</span>自动播放';

    playerEq.classList.toggle("paused", !playing);
    playerToggle.textContent = playing ? "⏸" : "▶";
    playerToggle.setAttribute("aria-label", playing ? "暂停" : "播放");
    playerLoop.classList.toggle("loop-on", state.player.loop);

    if (!queue.length) {
      player.classList.remove("show");
      return;
    }

    const item = queue[Math.min(state.player.index, queue.length - 1)];
    player.classList.add("show");
    playerWord.textContent = item.word.w;
    const shownIndex = Math.min(state.player.index + 1, queue.length);
    const context = state.player.scope === "stage"
      ? item.bookName + " · " + item.unitName
      : item.unitName;
    playerMeta.textContent = context + " · " + shownIndex + " / " + queue.length;
    playerProgressBar.style.width = (shownIndex / queue.length) * 100 + "%";
  }

  function stepPlayer(delta) {
    if (!state.player.queue.length) return;
    const wasPlaying = state.player.playing;
    state.player.generation += 1;
    speechCancel();
    state.player.index = Math.max(0, Math.min(state.player.queue.length - 1, state.player.index + delta));
    if (wasPlaying) {
      playQueue();
    } else {
      updatePlayerUI();
      const item = currentQueueItem();
      if (item) {
        followQueueItem(item);
        highlightQueueItem(item, true);
      }
    }
  }

  function changeScope() {
    const wasPlaying = state.player.playing;
    const scope = playerScope.value || "unit";
    state.settings.playScope = scope;
    saveSettings();
    if (playScopeSelect) playScopeSelect.value = scope;
    state.player.generation += 1;
    speechCancel();
    state.player.playing = false;
    state.player.scope = scope;
    state.player.queue = buildQueue(scope);
    state.player.index = 0;
    updatePlayerUI();
    if (wasPlaying && state.player.queue.length) {
      state.player.playing = true;
      playQueue();
    } else if (state.player.queue.length) {
      const first = state.player.queue[0];
      followQueueItem(first);
      highlightQueueItem(first, true);
    }
  }

  /* ---------- Shadowing ---------- */

  function openShadowWord(word) {
    stopPlayer(true);
    stopPassage();
    const colors = tileColors(word.w);
    openShadow({
      icon: word.icon || word.w.charAt(0).toUpperCase(),
      title: word.w,
      ipa: word.ipa,
      meaning: word.pos + " " + word.cn,
      text: "",
      tileA: colors[0],
      tileB: colors[1],
      targets: word.en
        ? [
            { label: "🎙️ 读单词", text: word.w },
            { label: "🎙️ 读例句", text: word.en }
          ]
        : [{ label: "🎙️ 读单词", text: word.w }]
    });
  }

  function openShadowSentence(sentence) {
    stopPlayer(true);
    stopPassage();
    openShadow({
      icon: "🎧",
      title: "课文跟读",
      ipa: "",
      meaning: "",
      text: sentence,
      tileA: "#e3f4f0",
      tileB: "#b9e6dd",
      targets: [{ label: "🎙️ 读这一句", text: sentence }]
    });
  }

  function openShadow(config) {
    state.shadowTargets = config.targets || [];
    state.shadowSelected = 0;

    shadowTitle.textContent = config.title || "跟读练习";
    shadowIcon.textContent = config.icon || "🎙️";
    shadowIcon.style.setProperty("--tile-a", config.tileA || "#fde7d8");
    shadowIcon.style.setProperty("--tile-b", config.tileB || "#f7cbb8");

    shadowIpa.textContent = config.ipa || "";
    shadowIpa.classList.toggle("hidden", !config.ipa);
    shadowMeaning.textContent = config.meaning || "";
    shadowMeaning.classList.toggle("hidden", !config.meaning);
    shadowText.textContent = config.text || "";
    shadowText.classList.toggle("hidden", !config.text);

    shadowTargets.innerHTML = state.shadowTargets.map((target, index) =>
      '<button class="target-btn" type="button" data-target="' + index + '">' + escapeHTML(target.label) + "</button>"
    ).join("");

    shadowResult.classList.add("hidden");
    shadowPrompt.textContent = "点击下面的按钮，大声读出来";
    shadowListen.textContent = "🔊 先听一遍";
    noSpeechAttempts = 0;
    stopRecording(true);
    if (shadowPlayback) {
      shadowPlayback.innerHTML = "";
      shadowPlayback.classList.add("hidden");
    }
    if (shadowRecord) {
      shadowRecord.textContent = "🎙️ 录音回放";
      shadowRecord.classList.remove("record-attention");
    }
    openModal("shadowModal");
  }

  function startRecognition(text, button) {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      showToast("当前浏览器不支持语音识别，已切换为录音回放");
      updateShadowPrompt("当前浏览器不支持识别，正在准备录音回放…");
      startRecording();
      return;
    }

    const token = ++recognitionToken;
    if (recognizing && recognition) {
      try { recognition.abort(); } catch (error) { /* ignore */ }
    }
    if (mediaRecorder && mediaRecorder.state === "recording") {
      stopRecording(false);
    }
    speechCancel();

    recognition = new Recognition();
    recognition.lang = chosenVoice && /^en/i.test(chosenVoice.lang) ? chosenVoice.lang : "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    recognizing = true;
    setListening(button, true);
    shadowResult.classList.add("hidden");
    if (shadowPlayback) shadowPlayback.classList.add("hidden");
    updateShadowPrompt("正在听… 请大声朗读");

    let finalParts = [];
    let finalText = "";
    let recognitionError = "";

    recognition.onresult = (event) => {
      if (token !== recognitionToken) return;
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalParts[i] = transcript;
        else interim += transcript;
      }
      finalText = finalParts.filter(Boolean).join(" ").trim();
      if (interim) updateShadowPrompt("听到：" + interim.trim());
      if (finalText) finalizeShadow(text, finalText);
    };

    recognition.onerror = (event) => {
      if (token !== recognitionToken) return;
      recognitionError = event.error || "unknown";
      recognizing = false;
      setListening(button, false);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        showRecordingFallback("麦克风权限被拒绝。请在地址栏允许麦克风，或直接用录音回放。");
      } else if (event.error === "audio-capture") {
        showRecordingFallback("没有检测到麦克风，请检查设备后再试。");
      } else if (event.error === "network") {
        showRecordingFallback("语音识别服务连接失败（常见于网络限制），请用录音回放。");
      } else if (event.error === "language-not-supported") {
        showRecordingFallback("当前浏览器不支持英语识别，请用录音回放。");
      } else if (event.error === "no-speech") {
        noSpeechAttempts += 1;
        if (noSpeechAttempts >= 2) {
          showRecordingFallback("连续两次没有识别到内容。识别服务可能不可用，请用录音回放。");
        } else {
          updateShadowPrompt("没有听清，再读一次；如果仍不行，请用录音回放。");
        }
      } else if (event.error !== "aborted") {
        showRecordingFallback("识别服务暂时不可用，请用录音回放。");
      }
    };

    recognition.onend = () => {
      if (token !== recognitionToken) return;
      recognizing = false;
      setListening(button, false);
      if (recognitionError) return;
      if (!finalText && shadowResult.classList.contains("hidden")) {
        if (noSpeechAttempts >= 2) {
          showRecordingFallback("识别服务没有返回结果，请用录音回放。");
        } else {
          updateShadowPrompt("没有识别到内容。可以再试一次，或点「录音回放」。");
        }
      }
    };

    try {
      recognition.start();
    } catch (error) {
      recognizing = false;
      setListening(button, false);
      showRecordingFallback("无法启动语音识别，请用录音回放。");
    }
  }

  function showRecordingFallback(message) {
    updateShadowPrompt(message);
    if (shadowRecord) {
      shadowRecord.classList.add("record-attention");
      setTimeout(() => shadowRecord.classList.remove("record-attention"), 2600);
    }
  }

  async function startRecording() {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      stopRecording(false);
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
      updateShadowPrompt("当前浏览器不支持录音回放，请使用 Chrome 或 Edge。");
      return;
    }

    if (recognizing && recognition) {
      recognitionToken += 1;
      try { recognition.abort(); } catch (error) { /* ignore */ }
      recognizing = false;
    }
    speechCancel();

    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      if (error.name === "NotAllowedError") {
        updateShadowPrompt("麦克风权限被拒绝，请在浏览器地址栏允许麦克风。");
      } else if (error.name === "NotFoundError") {
        updateShadowPrompt("没有检测到麦克风，请检查设备。");
      } else {
        updateShadowPrompt("无法使用麦克风，请检查浏览器权限。");
      }
      return;
    }

    mediaChunks = [];
    let recorder;
    try {
      recorder = new MediaRecorder(mediaStream);
    } catch (error) {
      mediaStream.getTracks().forEach((track) => track.stop());
      mediaStream = null;
      updateShadowPrompt("录音初始化失败，请换用 Chrome 或 Edge。");
      return;
    }
    mediaRecorder = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size) mediaChunks.push(event.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(mediaChunks, { type: recorder.mimeType || "audio/webm" });
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
      recordedUrl = URL.createObjectURL(blob);
      shadowPlayback.innerHTML = "";
      const audio = document.createElement("audio");
      audio.controls = true;
      audio.preload = "auto";
      audio.src = recordedUrl;
      shadowPlayback.appendChild(audio);
      shadowPlayback.classList.remove("hidden");
      shadowResult.classList.add("hidden");
      updateShadowPrompt("录好了，点播放听听自己的发音，再和原音对比。");
      shadowRecord.textContent = "🎙️ 重新录音";
      if (mediaStream) mediaStream.getTracks().forEach((track) => track.stop());
      mediaStream = null;
      mediaRecorder = null;
    };

    recorder.start();
    shadowRecord.textContent = "⏹ 停止录音";
    updateShadowPrompt("正在录音… 读完点「停止录音」");
  }

  function stopRecording(clear) {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      if (clear) mediaRecorder.onstop = null;
      try { mediaRecorder.stop(); } catch (error) { /* ignore */ }
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      mediaStream = null;
    }
    mediaRecorder = null;
    if (shadowRecord) shadowRecord.textContent = "🎙️ 录音回放";
    if (clear) {
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
        recordedUrl = "";
      }
      if (shadowPlayback) {
        shadowPlayback.innerHTML = "";
        shadowPlayback.classList.add("hidden");
      }
    }
  }

  function finalizeShadow(target, heard) {
    const score = calcSimilarity(target, heard);
    const ring = shadowResult.querySelector(".score-ring");
    ring.classList.toggle("hidden", !state.settings.scoring);
    shadowScore.textContent = score;
    shadowHeard.textContent = "听到：" + heard;
    shadowTip.textContent = encouragement(score);
    shadowResult.classList.remove("hidden");
    noSpeechAttempts = 0;
    updateShadowPrompt("可以再读一次，挑战更高分。");
  }

  function setListening(button, listening) {
    if (!button) return;
    if (listening) {
      button.dataset.original = button.textContent;
      button.textContent = "🎧 正在听…";
      button.classList.add("listening");
      $$(".target-btn", shadowTargets).forEach((btn) => {
        if (btn !== button) btn.disabled = true;
      });
    } else {
      button.textContent = button.dataset.original || "🎙️ 跟读";
      button.classList.remove("listening");
      $$(".target-btn", shadowTargets).forEach((btn) => { btn.disabled = false; });
    }
  }

  function updateShadowPrompt(text) {
    shadowPrompt.textContent = text;
  }

  function calcSimilarity(target, heard) {
    const t = normalizeText(target);
    const h = normalizeText(heard);
    if (!h) return 0;
    if (t === h) return 100;

    const targetWords = t.split(" ").filter(Boolean);
    const heardWords = h.split(" ").filter(Boolean);

    if (targetWords.length === 1) {
      if (heardWords.indexOf(t) !== -1) return 100;
      if (h.indexOf(t) !== -1) return 92;
      const distance = levenshtein(Array.from(t), Array.from(h));
      return clamp(Math.round((1 - distance / Math.max(t.length, h.length)) * 100));
    }

    const distance = levenshtein(targetWords, heardWords);
    let score = Math.round((1 - distance / Math.max(targetWords.length, heardWords.length)) * 100);
    const matched = targetWords.filter((word) => heardWords.indexOf(word) !== -1).length;
    const coverage = targetWords.length ? matched / targetWords.length : 0;
    score = Math.max(score, Math.round(coverage * 90));
    return clamp(score);
  }

  function normalizeText(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function levenshtein(a, b) {
    const rows = a.length + 1;
    const cols = b.length + 1;
    const dp = [];
    for (let i = 0; i < rows; i += 1) {
      dp[i] = [i];
    }
    for (let j = 1; j < cols; j += 1) {
      dp[0][j] = j;
    }
    for (let i = 1; i < rows; i += 1) {
      for (let j = 1; j < cols; j += 1) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      }
    }
    return dp[rows - 1][cols - 1];
  }

  function clamp(value) {
    return Math.max(0, Math.min(100, value));
  }

  function encouragement(score) {
    if (score >= 90) return "太棒了，发音清晰又自然！";
    if (score >= 75) return "很不错，再读一遍会更流畅。";
    if (score >= 55) return "有进步，注意重音和连读。";
    return "别急，先点“先听一遍”，再慢慢跟读。";
  }

  function closeShadow() {
    recognitionToken += 1;
    if (recognizing && recognition) {
      try { recognition.abort(); } catch (error) { /* ignore */ }
    }
    recognizing = false;
    speechCancel();
    stopRecording(true);
    closeModal("shadowModal");
  }

  /* ---------- Settings ---------- */

  function showSettings() {
    if (state.tab !== "settings") state.lastTab = state.tab;
    if (state.player.playing) pausePlayback();
    stopPassage();
    state.tab = "settings";
    $$(".tab", tabs).forEach((button) => button.classList.remove("active"));
    views.forEach((view) => view.classList.toggle("active", view.id === "view-settings"));
    tabs.classList.add("hidden");
    app.classList.add("settings-mode");
    renderVoiceOptions();
    updateSettingsUI();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeSettings() {
    app.classList.remove("settings-mode");
    tabs.classList.remove("hidden");
    switchTab(state.lastTab || "words");
  }

  function updateSettingsUI() {
    if (!layoutToggle) return;
    layoutToggle.checked = state.settings.layout === "compact";
    zhToggle.checked = state.settings.showZh;
    formsToggle.checked = state.settings.showForms;
    scoreToggle.checked = state.settings.scoring;
    gapRange.value = String(state.settings.gap);
    gapLabel.textContent = state.settings.gap + "ms";
    if (playScopeSelect) playScopeSelect.value = state.settings.playScope;
    if (playerScope) playerScope.value = state.settings.playScope;
    if (dailyGoalSelect) dailyGoalSelect.value = String(state.settings.dailyGoal);

    if (dataSummary) {
      const unitCount = books.reduce((sum, book) => sum + book.units.length, 0);
      const wordCount = books.reduce((sum, book) =>
        sum + book.units.reduce((count, unit) => count + unit.words.length, 0), 0);
      dataSummary.textContent = "当前词库：" + books.length + " 册 · " + unitCount + " 个单元 · " + wordCount + " 个词条";
    }
    if (fontSizeChips) {
      $$(".style-chip", fontSizeChips).forEach((button) => {
        button.classList.toggle("active", button.dataset.size === state.settings.fontSize);
      });
    }

    styleChips.innerHTML = Object.keys(STYLES).map((key) =>
      '<button class="style-chip' + (key === state.settings.style ? " active" : "") + '" type="button" data-style="' +
      escapeAttr(key) + '">' + escapeHTML(STYLES[key].label) + "</button>"
    ).join("");

    if (!voiceSelect.disabled && chosenVoice) {
      const savedVoice = state.settings.voiceURI &&
        voices.some((voice) => voice.voiceURI === state.settings.voiceURI);
      voiceSelect.value = savedVoice ? state.settings.voiceURI : chosenVoice.voiceURI;
    }
    updateReviewModeChips();
  }

  function setStyle(style) {
    if (!STYLES[style]) return;
    state.settings.style = style;
    saveSettings();
    updateSettingsUI();
    previewSpeak("Hello! Let's read English together.");
  }

  function toggleLayout(compact) {
    state.settings.layout = compact ? "compact" : "comfortable";
    saveSettings();
    updateLayoutUI();
  }

  function resetProgress() {
    if (!window.confirm("确定要清空所有学习记录和打卡记录吗？此操作无法撤销。")) return;
    stopPlayer(true);
    stopPassage();
    state.learned = {};
    state.checkins = [];
    state.review = {};
    state.reviewSession = null;
    saveObject(STORAGE.learned, state.learned);
    saveArray(STORAGE.checkins, state.checkins);
    saveObject(STORAGE.review, state.review);
    if (quizCard) quizCard.classList.add("hidden");
    renderAll();
    showToast("学习记录已重置");
  }

  /* ---------- Modals ---------- */

  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    if (!document.querySelector(".modal.show")) document.body.classList.remove("modal-open");
  }

  /* ---------- Utilities ---------- */

  function tileColors(word) {
    let hash = 0;
    for (let i = 0; i < word.length; i += 1) {
      hash = (hash * 31 + word.charCodeAt(i)) >>> 0;
    }
    return TILE_PALETTE[hash % TILE_PALETTE.length];
  }

  function escapeHTML(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, (char) => {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function escapeAttr(value) {
    return escapeHTML(value);
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2400);
  }

  function confetti() {
    if (!confettiLayer) return;
    const colors = ["#e8613c", "#f2b544", "#2e9b8c", "#ff8a5c", "#57c4b3", "#fdece5"];
    for (let i = 0; i < 38; i += 1) {
      const piece = document.createElement("i");
      piece.className = "confetti-piece";
      piece.style.left = Math.random() * 100 + "%";
      piece.style.background = colors[i % colors.length];
      piece.style.setProperty("--drift", (Math.random() - 0.5) * 190 + "px");
      piece.style.animationDelay = Math.random() * 0.3 + "s";
      piece.style.transform = "rotate(" + Math.random() * 180 + "deg)";
      confettiLayer.appendChild(piece);
      setTimeout(() => piece.remove(), 2300);
    }
  }

  function chime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      audioContext = audioContext || new AudioCtx();
      if (audioContext.state === "suspended") audioContext.resume();
      const now = audioContext.currentTime;
      [660, 880, 1100].forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        const start = now + index * 0.08;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.045, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.38);
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.42);
      });
    } catch (error) {
      /* sound is optional */
    }
  }

  function saveSettings() {
    saveObject(STORAGE.settings, state.settings);
  }

  function saveLast() {
    saveObject(STORAGE.last, { bookId: state.bookId, unitId: state.unitId });
  }

  function loadSettings() {
    const saved = loadObject(STORAGE.settings, {});
    const settings = Object.assign({}, DEFAULT_SETTINGS, saved || {});
    if (!STYLES[settings.style]) settings.style = DEFAULT_SETTINGS.style;
    if (!["compact", "comfortable"].includes(settings.layout)) settings.layout = DEFAULT_SETTINGS.layout;
    if (!["unit", "book", "stage"].includes(settings.playScope)) settings.playScope = DEFAULT_SETTINGS.playScope;
    if (!["choice", "spelling", "listening"].includes(settings.reviewMode)) settings.reviewMode = DEFAULT_SETTINGS.reviewMode;
    settings.gap = Number(settings.gap) || DEFAULT_SETTINGS.gap;
    const goalOptions = [5, 10, 15, 20, 30];
    const goal = Number(settings.dailyGoal);
    settings.dailyGoal = goalOptions.includes(goal) ? goal : DEFAULT_SETTINGS.dailyGoal;
    if (!["small", "medium", "large"].includes(settings.fontSize)) {
      settings.fontSize = DEFAULT_SETTINGS.fontSize;
    }
    return settings;
  }

  function loadObject(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function loadArray(key) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function saveObject(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      /* storage can be unavailable in private mode */
    }
  }

  function saveArray(key, value) {
    saveObject(key, value);
  }

  /* ---------- Events ---------- */

  function bindEvents() {
    stageSwitch.addEventListener("click", (event) => {
      const button = event.target.closest(".stage-btn");
      if (button) switchStage(button.dataset.stage);
    });

    bookSelect.addEventListener("change", () => switchBook(bookSelect.value));
    unitSelect.addEventListener("change", () => switchUnit(unitSelect.value));

    tabs.addEventListener("click", (event) => {
      const button = event.target.closest(".tab");
      if (button) switchTab(button.dataset.tab);
    });

    wordList.addEventListener("click", (event) => {
      const row = event.target.closest(".word-row");
      if (!row) return;

      const index = Number(row.dataset.index);
      const word = currentUnit().words[index];
      if (!word) return;

      const actionButton = event.target.closest("[data-action]");
      if (!actionButton) {
        if (event.target.closest(".word-sentence")) previewWord(word, row, "sentence");
        else previewWord(word, row, "word");
        return;
      }

      const action = actionButton.dataset.action;
      if (action === "play-word") previewWord(word, row, "word");
      else if (action === "play-sentence") previewWord(word, row, "sentence");
      else if (action === "shadow-word") openShadowWord(word);
      else if (action === "toggle-learned") toggleLearned(word, actionButton);
    });

    autoPlayBtn.addEventListener("click", () => {
      if (state.player.playing) {
        pausePlayback();
        return;
      }
      if (state.player.queue.length) {
        if (state.player.index >= state.player.queue.length) state.player.index = 0;
        state.player.playing = true;
        playQueue();
      } else {
        startAutoPlay();
      }
    });

    markAllBtn.addEventListener("click", toggleAllLearned);

    passagePlayBtn.addEventListener("click", playPassageAll);

    passageZhBtn.addEventListener("click", () => {
      state.passageZhVisible = !state.passageZhVisible;
      passageZh.classList.toggle("hidden", !state.passageZhVisible);
      if (textbookZh) textbookZh.classList.toggle("hidden", !state.passageZhVisible);
      passageZhBtn.textContent = state.passageZhVisible ? "隐藏译文" : "显示译文";
    });

    passageBody.addEventListener("click", (event) => {
      const sentence = event.target.closest(".sentence");
      if (!sentence) return;
      const index = Number(sentence.dataset.index);
      const actionButton = event.target.closest("[data-action]");
      if (actionButton && actionButton.dataset.action === "shadow-sentence") {
        openShadowSentence(passageSentences[index]);
        return;
      }
      playPassageSentence(index);
    });

    passageExamples.addEventListener("click", (event) => {
      const playButton = event.target.closest("[data-example-play]");
      const shadowButton = event.target.closest("[data-example-shadow]");
      if (playButton) {
        const index = Number(playButton.dataset.examplePlay);
        const sentence = passageExampleSentences[index];
        if (!sentence) return;
        stopPassage();
        stopPlayer(true);
        speakAsync(sentence, sentenceRate());
        return;
      }
      if (shadowButton) {
        const index = Number(shadowButton.dataset.exampleShadow);
        const sentence = passageExampleSentences[index];
        if (sentence) openShadowSentence(sentence);
      }
    });

    textbookBody.addEventListener("click", (event) => {
      const playButton = event.target.closest("[data-tb-play]");
      const shadowButton = event.target.closest("[data-tb-shadow]");
      if (playButton) {
        const line = textbookLines[Number(playButton.dataset.tbPlay)];
        if (!line) return;
        stopPassage();
        stopPlayer(true);
        speakAsync(line.speech, sentenceRate());
        return;
      }
      if (shadowButton) {
        const line = textbookLines[Number(shadowButton.dataset.tbShadow)];
        if (line) openShadowSentence(line.speech);
      }
    });

    checkinBtn.addEventListener("click", checkIn);

    calPrev.addEventListener("click", () => {
      state.calendarMonth = new Date(state.calendarMonth.getFullYear(), state.calendarMonth.getMonth() - 1, 1);
      renderCalendar();
    });

    calNext.addEventListener("click", () => {
      state.calendarMonth = new Date(state.calendarMonth.getFullYear(), state.calendarMonth.getMonth() + 1, 1);
      renderCalendar();
    });

    streakChip.addEventListener("click", () => switchTab("checkin"));

    settingsBtn.addEventListener("click", () => {
      if (state.tab === "settings") closeSettings();
      else showSettings();
    });

    settingsBack.addEventListener("click", closeSettings);

    $$("[data-close]", shadowModal).forEach((button) => {
      button.addEventListener("click", closeShadow);
    });

    shadowDone.addEventListener("click", closeShadow);

    shadowModal.addEventListener("click", (event) => {
      if (event.target === shadowModal) closeShadow();
    });

    startReviewBtn.addEventListener("click", () => startReview(false));
    reviewWrongBtn.addEventListener("click", () => startReview(true));

    reviewModeChips.addEventListener("click", (event) => {
      const button = event.target.closest("[data-mode]");
      if (button) setReviewMode(button.dataset.mode);
    });

    quizOptions.addEventListener("click", (event) => {
      const actionButton = event.target.closest("[data-quiz-action]");
      if (actionButton) {
        if (actionButton.dataset.quizAction === "again") startReview(false);
        else switchTab("words");
        return;
      }
      const optionButton = event.target.closest(".quiz-option");
      if (optionButton) answerChoice(optionButton.dataset.cn);
    });

    quizAudio.addEventListener("click", () => {
      const item = currentReviewItem();
      if (item) speakAsync(item.word.w, wordRate());
    });

    quizSubmit.addEventListener("click", answerSpelling);

    quizInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        answerSpelling();
      }
    });

    quizNext.addEventListener("click", () => {
      const session = state.reviewSession;
      if (!session || !session.answered) return;
      if (session.index >= session.items.length - 1) {
        finishReview();
        return;
      }
      session.index += 1;
      renderQuizQuestion();
    });

    playScopeSelect.addEventListener("change", () => {
      playerScope.value = playScopeSelect.value;
      changeScope();
    });

    shadowTargets.addEventListener("click", (event) => {
      const button = event.target.closest(".target-btn");
      if (!button) return;
      const index = Number(button.dataset.target);
      const target = state.shadowTargets[index];
      if (!target) return;
      state.shadowSelected = index;
      startRecognition(target.text, button);
    });

    shadowRecord.addEventListener("click", startRecording);

    shadowListen.addEventListener("click", () => {
      const target = state.shadowTargets[state.shadowSelected] || state.shadowTargets[0];
      if (!target) return;
      if (mediaRecorder && mediaRecorder.state === "recording") stopRecording(false);
      if (recognizing && recognition) {
        recognitionToken += 1;
        try { recognition.abort(); } catch (error) { /* ignore */ }
        recognizing = false;
        $$(".target-btn", shadowTargets).forEach((button) => {
          button.classList.remove("listening");
          button.disabled = false;
          button.textContent = button.dataset.original || button.textContent;
        });
      }
      speechCancel();
      updateShadowPrompt("正在播放，注意听语音和语调");
      speakAsync(target.text, sentenceRate()).then(() => {
        updateShadowPrompt("轮到你了，按麦克风跟读");
      });
    });

    voiceSelect.addEventListener("change", () => {
      state.settings.voiceURI = voiceSelect.value;
      chosenVoice = voices.find((voice) => voice.voiceURI === voiceSelect.value) || chosenVoice;
      saveSettings();
    });

    voicePreview.addEventListener("click", () => {
      previewSpeak("Hello! Welcome to Ying Ci Tong. Let's learn English together.");
    });

    styleChips.addEventListener("click", (event) => {
      const button = event.target.closest(".style-chip");
      if (button) setStyle(button.dataset.style);
    });

    fontSizeChips.addEventListener("click", (event) => {
      const button = event.target.closest("[data-size]");
      if (!button) return;
      const size = button.dataset.size;
      if (!["small", "medium", "large"].includes(size)) return;
      state.settings.fontSize = size;
      saveSettings();
      updateLayoutUI();
      updateSettingsUI();
    });

    gapRange.addEventListener("input", () => {
      state.settings.gap = Number(gapRange.value);
      gapLabel.textContent = state.settings.gap + "ms";
      saveSettings();
    });

    dailyGoalSelect.addEventListener("change", () => {
      state.settings.dailyGoal = Number(dailyGoalSelect.value) || 10;
      saveSettings();
      updateSettingsUI();
      renderCheckin();
    });

    layoutToggle.addEventListener("change", () => {
      state.settings.layout = layoutToggle.checked ? "compact" : "comfortable";
      saveSettings();
      updateLayoutUI();
    });

    zhToggle.addEventListener("change", () => {
      state.settings.showZh = zhToggle.checked;
      saveSettings();
      app.classList.toggle("hide-zh", !state.settings.showZh);
    });

    formsToggle.addEventListener("change", () => {
      state.settings.showForms = formsToggle.checked;
      saveSettings();
      app.classList.toggle("hide-forms", !state.settings.showForms);
    });

    scoreToggle.addEventListener("change", () => {
      state.settings.scoring = scoreToggle.checked;
      saveSettings();
    });

    resetBtn.addEventListener("click", resetProgress);

    playerToggle.addEventListener("click", () => {
      if (state.player.playing) {
        pausePlayback();
        return;
      }
      if (!state.player.queue.length) {
        startAutoPlay();
        return;
      }
      if (state.player.index >= state.player.queue.length) state.player.index = 0;
      state.player.playing = true;
      playQueue();
    });

    playerPrev.addEventListener("click", () => stepPlayer(-1));
    playerNext.addEventListener("click", () => stepPlayer(1));

    playerLoop.addEventListener("click", () => {
      state.player.loop = !state.player.loop;
      updatePlayerUI();
    });

    playerScope.addEventListener("change", changeScope);

    playerClose.addEventListener("click", () => stopPlayer(true));

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (shadowModal.classList.contains("show")) closeShadow();
      else if (state.tab === "settings") closeSettings();
    });
  }

  init();
})();
