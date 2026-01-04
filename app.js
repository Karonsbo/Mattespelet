// ===============================
// Hämta kategori och nivå
// ===============================
const params = new URLSearchParams(window.location.search);
const category = params.get("category") || "math";
const level = parseInt(params.get("level")) || 1;

let fullDeck = [];   // Hela kortleken från JSON
let deck = [];       // Kort kvar att visa
let currentCard = null;

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
  if(deck.length === 0) {
    // Göm aktivt kort
    activeCard.style.display = "none";
    // Visa placeholder
    document.getElementById("placeholderCard").style.display = "flex";

    // Knappen blir "Blanda om"
    nextBtn.textContent = "Blanda om";
    nextBtn.onclick = shuffleDeck;
    return;
  }

  // Exit-animation för översta kortet
  activeCard.classList.add("exit");

  setTimeout(() => {
    activeCard.classList.remove("exit", "flipped");
    currentCard = getRandomCard();
    renderCard(currentCard, questionRows, answerRows);

    activeCard.style.display = "flex";              // visa kortet igen
    document.getElementById("placeholderCard").style.display = "none"; // göm placeholder
  }, 600);
}



function shuffleDeck() {
  deck = [...fullDeck];
  currentCard = getRandomCard();
  renderCard(currentCard, questionRows, answerRows);

  activeCard.style.display = "flex";
  document.getElementById("placeholderCard").style.display = "none";

  nextBtn.textContent = "Nästa kort";
  nextBtn.onclick = nextCard;
}



function goBack() {
  window.location.href = "index.html";
}

