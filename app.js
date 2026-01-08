// ===============================
// Hämta kategori och nivå
// ===============================
const params = new URLSearchParams(window.location.search);
const category = params.get("category") || "math";
const level = parseInt(params.get("level")) || 1;

let fullDeck = [];   // Hela kortleken från JSON
let deck = [];       // Kort kvar att visa
let currentCard = null;


// Aktiv hög: 'math' eller 'chance'
let activeCategory = 'math';

// Separata fullDecks
let fullDeckMath = [];
let fullDeckChance = { neutral: [], positive: [], negative: [] };

// Sannolikheter för chanskort (neutral > positiv > negativ)
const chanceWeights = { neutral: 0.6, positive: 0.3, negative: 0.1 };

// Växlande anim-riktning för "Byt korthög": först vänster, nästa gång höger, osv.
let slideLeftNext = true;

// Toggle-knappen
const toggleBtn = document.querySelector('.toggle-deck');



// DOM-element
const activeCard = document.getElementById("activeCard");
const questionRows = document.getElementById("questionRows");
const answerRows = document.getElementById("answerRows");
const nextBtn = document.querySelector(".next-card");

// ===============================
// Hämta frågor från JSON
// ===============================
fetch("questions.json")
  .then(res => res.json())
  .then(data => {
    fullDeck = data[category].filter(card => card.level === level);
    if(fullDeck.length === 0) return;

    // Starta spelet
    shuffleDeck();
  });

  
fetch("questions.json")
  .then(res => res.json())
  .then(data => {
    // Mata in mattehög (filtrerat på level som idag)
    fullDeckMath = data["math"].filter(card => card.level === level);

    // Mata in chanskort (utan level)
    if (data["chance"]) {
      fullDeckChance.neutral  = data["chance"].filter(c => c.type === "neutral");
      fullDeckChance.positive = data["chance"].filter(c => c.type === "positive");
      fullDeckChance.negative = data["chance"].filter(c => c.type === "negative");
    }

    if (fullDeckMath.length === 0 && 
        fullDeckChance.neutral.length + fullDeckChance.positive.length + fullDeckChance.negative.length === 0) {
      return;
    }

    // Starta på mattehög som default
    buildDeck();
    // Initiera label på toggle-knappen
    if (toggleBtn) toggleBtn.textContent = "Visa chanskort";
    if (toggleBtn) toggleBtn.onclick = toggleDeckCategory;
  });

  
function buildDeck() {
  if (activeCategory === 'math') {
    deck = [...fullDeckMath];                     // samma som idag (lista med kort)
    currentCard = getRandomCard();                // din existerande funktion
    renderMathCard();
  } else {
    // För chanskort använder vi viktad slump per typ och tar från respektive lista (utan repetition)
    deck = [ 
      ...fullDeckChance.neutral, 
      ...fullDeckChance.positive, 
      ...fullDeckChance.negative 
    ];
    currentCard = getRandomChanceCard();
    renderChanceCard(currentCard, questionRows, answerRows);
  }

  activeCard.style.display = "flex";
  document.getElementById("placeholderCard").style.display = "none";
  activeCard.classList.remove("flipped"); // börja med framsidan
}


function renderMathCard() {
  renderCard(currentCard, questionRows, answerRows); // din befintliga renderCard
  activeCard.classList.remove("chance");             // säkerställ rätt stil
}


function renderChanceCard(card, questionContainer, answerContainer) {
  // Sätt stil för chanskort
  activeCard.classList.add("chance");

  // FRONT: stor frågetecken
  questionContainer.innerHTML = `<div class="question-mark">?</div>`;

  // BACK: chanskortets beskrivning
  const typeClass = card.type || "neutral";
  answerContainer.innerHTML = `
    <div class="chance-row ${typeClass}">
      <span>${card.text}</span>
    </div>
  `;
}



function weightedPick() {
  const r = Math.random();
  const pNeutral = chanceWeights.neutral;
  const pPositive = pNeutral + chanceWeights.positive;
  if (r < pNeutral) return "neutral";
  if (r < pPositive) return "positive";
  return "negative";
}

function getRandomChanceCard() {
  if (deck.length === 0) return null;

  // Försök välja typ enligt vikt
  let pickType = weightedPick();
  let pool = fullDeckChance[pickType];

  // Om vald typ är slut, välj första typ som fortfarande har kort kvar
  if (!pool || pool.length === 0) {
    for (const t of ["neutral", "positive", "negative"]) {
      if (fullDeckChance[t].length > 0) {
        pool = fullDeckChance[t];
        pickType = t;
        break;
      }
    }
  }

  if (!pool || pool.length === 0) return null;

  // Plocka slumpkort ur vald typ och ta bort så det inte upprepas
  const index = Math.floor(Math.random() * pool.length);
  const card = pool[index];
  pool.splice(index, 1);
  // Uppdatera "deck" (används bara för att veta om högen är slut)
  deck.splice(deck.indexOf(card), 1);
  return card;
}


function toggleDeckCategory() {
  if (!activeCard) return;

  // Bestäm riktning denna gång
  const outClass = slideLeftNext ? "exit-left" : "exit-right";
  const inClass  = slideLeftNext ? "enter-right" : "enter-left";

  // 1) Nuvarande kort glider ut
  activeCard.classList.add(outClass);

  // Lyssna på när exit-animationen är klar
  const onExitEnd = () => {
    activeCard.removeEventListener('transitionend', onExitEnd);

    // 2) Rensa utklass + flip
    activeCard.classList.remove(outClass, "flipped");

    // 3) Växla aktiv hög
    activeCategory = (activeCategory === "math") ? "chance" : "math";

    // 4) Uppdatera knapptext
    if (toggleBtn) {
      toggleBtn.textContent = (activeCategory === "math") 
        ? "Visa chanskort" 
        : "Visa frågekort";
    }

    // 5) Bygg och rendera första kortet i nya högen
    buildDeck();

    // 6) Force reflow för iOS/Safari så animationen triggas
    activeCard.offsetHeight;

    // 7) Lägg på in-animation
    activeCard.classList.add(inClass);

    // Ta bort klassen när animationen är klar (animationend-event)
    const onEnterEnd = () => {
      activeCard.classList.remove(inClass);
      activeCard.removeEventListener('animationend', onEnterEnd);
    };
    activeCard.addEventListener('animationend', onEnterEnd);

    // 8) Invertera riktning till nästa gång
    slideLeftNext = !slideLeftNext;
  };

  // Lyssna på exit-animationens slut
  activeCard.addEventListener('transitionend', onExitEnd);
}



// ===============================
// Slumpa kort utan repetition
// ===============================
function getRandomCard() {
  if(deck.length === 0) return null;
  const index = Math.floor(Math.random() * deck.length);
  const card = deck[index];

  // Ta bort kortet från deck så det inte dyker upp igen
  deck.splice(index, 1);
  return card;
}

// ===============================
// Rendera ett kort
// ===============================
function renderCard(cardData, questionContainer, answerContainer) {
  questionContainer.innerHTML = "";
  answerContainer.innerHTML = "";

  const types = ["addition", "subtraktion", "multiplikation", "division", "klockan", "kreativ"];

  types.forEach(type => {
    const q = cardData[type];

    // Fråga
    const rowQ = document.createElement("div");
    rowQ.className = "row-card";

    const triQ = document.createElement("div");
    triQ.className = `triangle ${type}`;
    rowQ.appendChild(triQ);

    const spanQ = document.createElement("span");
    spanQ.textContent = q.q;
    rowQ.appendChild(spanQ);

    questionContainer.appendChild(rowQ);

    // Facit
    const rowA = document.createElement("div");
    rowA.className = "row-card";

    const triA = document.createElement("div");
    triA.className = `triangle ${type}`;
    rowA.appendChild(triA);

    const spanA = document.createElement("span");
    spanA.textContent = q.a;
    rowA.appendChild(spanA);

    answerContainer.appendChild(rowA);
  });
}

// ===============================
// Vänd kort (X-flip)
function flipCard() {
  activeCard.classList.toggle("flipped");
}

// ===============================
// Nästa kort med exit-animation

function nextCard() {
  if (activeCategory === 'math') {
    if (deck.length === 0) {
      activeCard.style.display = "none";
      document.getElementById("placeholderCard").style.display = "flex";
      nextBtn.textContent = "Blanda om";
      nextBtn.onclick = shuffleDeck;
      return;
    }
    // Din befintliga exit-animation för "nästa" kort
    activeCard.classList.add("exit");
    setTimeout(() => {
      activeCard.classList.remove("exit", "flipped");
      currentCard = getRandomCard();
      renderMathCard();
      activeCard.style.display = "flex";
      document.getElementById("placeholderCard").style.display = "none";
    }, 600);
  } else {
    // CHANSKORT
    if (deck.length === 0) {
      activeCard.style.display = "none";
      document.getElementById("placeholderCard").style.display = "flex";
      nextBtn.textContent = "Blanda om";
      nextBtn.onclick = shuffleDeck;
      return;
    }
    activeCard.classList.add("exit");
    setTimeout(() => {
      activeCard.classList.remove("exit", "flipped");
      currentCard = getRandomChanceCard();
      renderChanceCard(currentCard, questionRows, answerRows);
      activeCard.style.display = "flex";
      document.getElementById("placeholderCard").style.display = "none";
    }, 600);
  }
}

function shuffleDeck() {
  if (activeCategory === 'math') {
    deck = [...fullDeckMath];
    currentCard = getRandomCard();
    renderMathCard();
  } else {
    // “Återställ” chanskort: kopiera arrays igen (antar att du inte vill permanent ta bort kort)
    deck = [
      ...fullDeckChance.neutral,
      ...fullDeckChance.positive,
      ...fullDeckChance.negative
    ];
    currentCard = getRandomChanceCard();
    renderChanceCard(currentCard, questionRows, answerRows);
  }

  activeCard.style.display = "flex";
  document.getElementById("placeholderCard").style.display = "none";
  nextBtn.textContent = "Nästa kort";
  nextBtn.onclick = nextCard;
}


function goBack() {
  window.location.href = "index.html";
}
