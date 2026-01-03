// Hämta kategori från URL
const params = new URLSearchParams(window.location.search);
const category = params.get("category") || "math";

let questions = [];

fetch("questions.json")
  .then(res => res.json())
  .then(data => {
    questions = data[category];
    nextCard();
    setCardColor();
  });

function nextCard() {
  const q = questions[Math.floor(Math.random() * questions.length)];
  document.getElementById("question").innerText = q.q;
}

function setCardColor() {
  const colors = {
    math: "#4da6ff",
    history: "#ffcc66",
    science: "#99e699",
    default: "#ffffff"
  };
  document.getElementById("card").style.background = colors[category] || colors.default;
}
