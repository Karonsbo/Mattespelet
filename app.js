// === PARAMETRAR ===
const params = new URLSearchParams(window.location.search);
const category = params.get("category") || "math";
const level = parseInt(params.get("level")) || 1;

// AKTIVT RÄKNESÄTT (styrt av fysisk tärning)
let activeType = "addition"; 

let deck = [];
let currentCard = null;

// === LADDA FRÅGOR ===
fetch("questions.json")
  .then(res => res.json())
  .then(data => {
    deck = data[category].filter(card => card.level === level);
    nextCard();
  });

// === NÄSTA KORT ===
function nextCard() {
  const cardEl = document.querySelector(".card");
  cardEl.classList.remove("flipped");

  currentCard = deck[Math.floor(Math.random() * deck.length)];
  showQuestion();
}

// === VISA FRÅGA ===
function showQuestion() {
  const q = currentCard[activeType];

  document.getElementById("questionText").innerText = q.q;
  document.getElementById("answerText").innerText = q.a;

  setActiveSlice(activeType);
}

// === FLIP ===
function flipCard() {
  document.querySelector(".card").classList.toggle("flipped");
}

// === VISUELL MARKERING AV TÄRNINGENS VAL ===
function setActiveSlice(type) {
  document.querySelectorAll(".slice").forEach(s =>
    s.classList.remove("active")
  );

  const activeSlice = document.querySelector(`.slice.${type}`);
  if (activeSlice) activeSlice.classList.add("active");
}

/* 
  VALFRITT: manuellt test av färg
  window.setType("division")
*/
window.setType = function(type) {
  activeType = type;
  showQuestion();
};
