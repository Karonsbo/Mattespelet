// ===============================
// Hämta kategori och nivå
// ===============================
const params = new URLSearchParams(window.location.search);
const category = params.get("category") || "math";
const level = parseInt(params.get("level")) || 1;

let history = []; // Stores previously shown cards
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

// Hämta ljud
const nextCardSound = new Audio('sounds/next-card.mp3');
nextCardSound.volume = 0.2;

const flipCardSound = new Audio('sounds/flip-card.mp3');
flipCardSound.volume = 0.2;

const swooshSound = new Audio('sounds/swoosh.mp3');
swooshSound.volume = 0.2;

const failSound = new Audio('sounds/fail.mp3');
failSound.volume = 0.2;

const successSound = new Audio('sounds/success.mp3');
successSound.volume = 0.1;

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
    deck = [...fullDeckMath];
    currentCard = getRandomCard();
    renderMathCard();
  } else {
    deck = [
      ...fullDeckChance.neutral,
      ...fullDeckChance.positive,
      ...fullDeckChance.negative
    ];
    currentCard = getRandomChanceCard();

    if (currentCard) {
      renderChanceCard(currentCard, questionRows, answerRows);
    } else {
      console.warn("Chanskort-decket är tomt!");
      activeCard.style.display = "none";
      document.getElementById("placeholderCard").style.display = "flex";
    }
  }

  activeCard.style.display = "flex";
  document.getElementById("placeholderCard").style.display = "none";
  activeCard.classList.remove("flipped");
}



function renderMathCard() {
    if (!currentCard) {
    console.warn("Inget kort att rendera!");
    activeCard.style.display = "none";
    document.getElementById("placeholderCard").style.display = "flex";
    return;
  }
  
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

function launchConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#ff0', '#0f0', '#0ff', '#f0f'],
    shapes: ['circle', 'square']
  });
}


function scaleCardContent(container) {
  const card = container.closest('.card');

  // Vit yta = kortets content-area minus padding + border
  const cardStyles = getComputedStyle(card.querySelector('.front'));
  const paddingTop = parseFloat(cardStyles.paddingTop);
  const paddingBottom = parseFloat(cardStyles.paddingBottom);
  const borderTop = parseFloat(cardStyles.borderTopWidth);
  const borderBottom = parseFloat(cardStyles.borderBottomWidth);

  const availableHeight = card.clientHeight - paddingTop - paddingBottom - borderTop - borderBottom;

  // Reset scale innan mätning
  container.style.transform = "scale(1)";
  
  // Mät höjden på allt innehåll
  const contentHeight = container.scrollHeight;

  // Om innehållet är större än ytan, skala ned
  if (contentHeight > availableHeight) {
    const scale = availableHeight / contentHeight;
    container.style.transformOrigin = "top";
    container.style.transform = `scale(${scale})`;
  }
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

  const outClass = slideLeftNext ? "exit-left" : "exit-right";
  const inClass  = slideLeftNext ? "enter-right" : "enter-left";

  // Play sound
  swooshSound.currentTime = 0; // rewind to start
  swooshSound.play().catch(e => console.warn("Sound play failed:", e));

  // 1) Lägg på exit-animation
  activeCard.classList.add(outClass);

  // 2) Lyssna på när exit-animationen är klar
  const onExitEnd = (e) => {
    if (e.target !== activeCard) return;
    activeCard.removeEventListener('animationend', onExitEnd);

    // 3) Rensa klasser & flip
    activeCard.classList.remove(outClass, "flipped");

    // 4) Växla aktiv hög
    activeCategory = (activeCategory === "math") ? "chance" : "math";

    // 5) Uppdatera knapptext
    if (toggleBtn) {
      toggleBtn.textContent = (activeCategory === "math") ? "Visa chanskort" : "Visa frågekort";
    }

    // 6) Bygg och rendera första kortet i nya högen
    buildDeck();

    // 7) Force reflow för Safari
    void activeCard.offsetHeight;

    // 8) Lägg på enter-animation
    activeCard.classList.add(inClass);

    // 9) Ta bort enter-animation när klar
    const onEnterEnd = (e) => {
      if (e.target !== activeCard) return;
      activeCard.classList.remove(inClass);
      activeCard.removeEventListener('animationend', onEnterEnd);
    };
    activeCard.addEventListener('animationend', onEnterEnd);

    // 10) Växla riktning nästa gång
    slideLeftNext = !slideLeftNext;
  };

  activeCard.addEventListener('animationend', onExitEnd);
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
    if (!q) return; // <-- hoppa över om kortet inte har den typen

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

  // Play sound
  flipCardSound.currentTime = 0; // rewind to start
  flipCardSound.play().catch(e => console.warn("Sound play failed:", e));

  if (activeCategory === "chance") {
    const onFlipEnd = (e) => {
      if (e.target !== activeCard || !activeCard.classList.contains("flipped")) return;

      if (currentCard?.type === "positive") {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        // Play sound
        successSound.currentTime = 0; // rewind to start
        successSound.play().catch(e => console.warn("Sound play failed:", e));

      } 
      else if (currentCard?.type === "negative") {
        setTimeout(() => {
          activeCard.classList.add('negative-flash-bg');
          activeCard.addEventListener('animationend', function handler() {
            activeCard.classList.remove('negative-flash-bg');
            activeCard.removeEventListener('animationend', handler);
          });
        }, 100); // slight delay for flip

        // Play sound
        failSound.currentTime = 0; // rewind to start
        failSound.play().catch(e => console.warn("Sound play failed:", e));
      }

      activeCard.removeEventListener('transitionend', onFlipEnd);
    };

    activeCard.addEventListener('transitionend', onFlipEnd);
  }
}





// ===============================
// Nästa kort med exit-animation

function nextCard() {
  if (!currentCard) return;

  // Play sound first
  nextCardSound.currentTime = 0;
  nextCardSound.play().catch(e => console.warn("Sound play failed:", e));

  // Save history
  history.push(currentCard);

  // Force next frame before adding animation
  requestAnimationFrame(() => {
    activeCard.classList.add("exit");

    setTimeout(() => {
      activeCard.classList.remove("exit", "flipped");

      if (activeCategory === 'math') {
        if (deck.length === 0) {
          activeCard.style.display = "none";
          document.getElementById("placeholderCard").style.display = "flex";
          nextBtn.textContent = "Blanda om";
          nextBtn.onclick = shuffleDeck;
          return;
        }
        currentCard = getRandomCard();
        renderMathCard();
      } else {
        if (deck.length === 0) {
          activeCard.style.display = "none";
          document.getElementById("placeholderCard").style.display = "flex";
          nextBtn.textContent = "Blanda om";
          nextBtn.onclick = shuffleDeck;
          return;
        }
        currentCard = getRandomChanceCard();
        renderChanceCard(currentCard, questionRows, answerRows);
      }

      activeCard.style.display = "flex";
      document.getElementById("placeholderCard").style.display = "none";
    }, 600);
  });
}


function prevCard() {
  if (history.length === 0) return; // nothing to go back to

  // Play sound immediately
  nextCardSound.currentTime = 0; // rewind to start
  nextCardSound.play().catch(e => console.warn("Sound play failed:", e));

  // Push current card back into deck so it can be reshown
  if (currentCard) deck.push(currentCard);

  const previousCard = history.pop();

  // Use the same exit animation as nextCard
  activeCard.classList.add("exit");

  setTimeout(() => {
    activeCard.classList.remove("exit", "flipped");
    currentCard = previousCard;

    // Render based on active category
    if (activeCategory === 'math') {
      renderMathCard();
    } else {
      renderChanceCard(currentCard, questionRows, answerRows);
    }

    activeCard.style.display = "flex";
    document.getElementById("placeholderCard").style.display = "none";
  }, 600);
}


function updateGameInfoLabel() {
  const params = new URLSearchParams(window.location.search);
  const category = params.get('category');
  const level = params.get('level');

  if (!category || !level) return;

  const categoryNames = {
    math: 'Matte',
    history: 'Historia',
    biology: 'Biologi',
    science: 'Vetenskap'
  };

  const levelNames = {
    1: 'Lätt',
    2: 'Medel',
    3: 'Svår'
  };

  const label = document.getElementById('gameInfo');
  label.textContent = `${categoryNames[category] ?? category} · ${levelNames[level] ?? level}`;
}

document.addEventListener('DOMContentLoaded', updateGameInfoLabel);


function shuffleDeck() {
  if (activeCategory === 'math') {
    deck = [...fullDeckMath];
    currentCard = getRandomCard();
    renderMathCard();
  } else {
    // Reset chance deck
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

  // ✅ Reset the next button text and handler
  nextBtn.innerHTML = '<i class="fas fa-arrow-right"></i>'; 
  nextBtn.onclick = nextCard;
}


// ================================
// SPÅGUMMA MENU
// ================================
function showFortuneMenu() {
  const menuDiv = document.getElementById('fortuneMenu');
  const menuContent = document.getElementById('fortuneMenuContent');

  // Clear previous content
  menuContent.innerHTML = '';

  // Load JSON
  fetch('fortuneMenu.json')
    .then(res => res.json())
    .then(data => {
      // Separate in-game and out-game items
      const inGameItems = data.filter(item => item.type === 'in-game');
      const outGameItems = data.filter(item => item.type === 'out-game');

      // Add in-game subtitle
      if (inGameItems.length > 0) {
        const sub = document.createElement('h3');
        sub.textContent = "Spelrelaterade föremål";
        menuContent.appendChild(sub);

        inGameItems.forEach(item => {
          menuContent.appendChild(createMenuItem(item));
        });
      }

      // Divider image
      if (outGameItems.length > 0) {
        const divider = document.createElement('div');
        divider.className = 'menu-divider';
        const dividerImg = document.createElement('img');
        dividerImg.src = 'images/divider.png';
        dividerImg.alt = 'divider';
        divider.appendChild(dividerImg);
        //menuContent.appendChild(divider);

        // Subtitle
        const sub2 = document.createElement('h3');
        sub2.textContent = "Föremål utanför spelet";
        menuContent.appendChild(sub2);

        outGameItems.forEach(item => {
          menuContent.appendChild(createMenuItem(item));
        });
      }

      menuDiv.style.display = 'flex';
    })
    .catch(err => console.error('Error loading fortuneMenu.json:', err));
}

function createMenuItem(item) {
  const row = document.createElement('div');
  row.className = 'menu-item';
  row.style.position = 'relative';

  // Item image
  const img = document.createElement('img');
  img.src = item.image || 'images/placeholder.png';
  img.alt = item.name;
  row.appendChild(img);

  // Info container
  const info = document.createElement('div');
  info.className = 'item-info';

  const title = document.createElement('h4');
  title.textContent = item.name;
  info.appendChild(title);

  const desc = document.createElement('p');
  desc.textContent = item.description;
  info.appendChild(desc);

  if (item.level) {
    const levelInfo = document.createElement('p');
    levelInfo.style.fontStyle = 'italic';
    levelInfo.style.fontSize = '0.85rem';
    levelInfo.textContent = `Gäller nivå: ${item.level}`;
    info.appendChild(levelInfo);
  }

  row.appendChild(info);

  // Cost badge
  const coins = item.cost?.coins ?? 0;
  const diamonds = item.cost?.diamonds ?? 0;

  if (coins > 0 || diamonds > 0) {
    const costBadge = document.createElement('div');
    costBadge.className = 'cost-badge';

    const createCostItem = (src, amount) => {
      const span = document.createElement('span');
      span.className = 'cost-item';
      span.innerHTML = `<img src="${src}" class="cost-icon"><span class="cost-number">×${amount}</span>`;
      return span;
    };

    if (coins > 0) costBadge.appendChild(createCostItem('images/coin.png', coins));
    if (diamonds > 0) costBadge.appendChild(createCostItem('images/gem.png', diamonds));

    row.appendChild(costBadge);
  }

  return row;
}





// Close menu
function closeFortuneMenu() {
  document.getElementById('fortuneMenu').style.display = 'none';
}




function goBack() {
  window.location.href = "index.html";
}

