// Hämta kategori från URL
const params = new URLSearchParams(window.location.search);
const category = params.get("category") || "math";

let questions = [];
let currentQuestion = null;

// Ladda frågor
fetch("questions.json")
  .then(res => res.json())
  .then(data => {
    questions = data[category];
    nextCard();
    setCardColor();
  });

// Flip kort
function flipCard() {
  const card = document.querySelector('.card');
  card.classList.toggle('flipped');
}

// Nästa kort
function nextCard() {
  const card = document.querySelector('.card');
  card.classList.remove('flipped'); // reset

  currentQuestion = questions[Math.floor(Math.random() * questions.length)];
  document.getElementById('cardFront').innerText = currentQuestion.q;
  document.getElementById('cardBack').innerText = currentQuestion.answer || "Facit saknas";
}

// Sätt färg beroende på kategori
function setCardColor() {
  const colors = {
    math: "#4da6ff",
    history: "#ffcc66",
    science: "#99e699",
    creative: "#ff9966",
    clock: "#c299ff",
    default: "#888"
  };
  document.getElementById('cardFront').style.background = colors[category] || colors.default;
}
