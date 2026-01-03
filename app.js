const params = new URLSearchParams(window.location.search);
const category = params.get("category") || "math";
const level = parseInt(params.get("level")) || 1; // default = nivå 1

let questions = [];
let currentQuestion = null;

fetch("questions.json")
  .then(res => res.json())
  .then(data => {
    // filtrera frågor på vald nivå
    questions = data[category].filter(q => q.level === level);
    nextCard();
  });

// Flip kort
function flipCard() {
  const card = document.querySelector('.card');
  card.classList.toggle('flipped');
}

// Visa nästa kort
function nextCard() {
  const card = document.querySelector('.card');
  card.classList.remove('flipped');

  currentQuestion = questions[Math.floor(Math.random() * questions.length)];
  document.getElementById('cardFront').innerText = currentQuestion.q;
  document.getElementById('cardBack').innerText = currentQuestion.answer || "Facit saknas";

  const colorMap = {
    blue: "#4da6ff",
    pink: "#ff99cc",
    yellow: "#ffe066",
    purple: "#c299ff",
    green: "#99e699",
    orange: "#ffb366",
    default: "#888"
  };
  document.getElementById('cardFront').style.background = colorMap[currentQuestion.color] || colorMap.default;
}
