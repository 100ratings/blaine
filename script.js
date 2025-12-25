// ===============================
// BARALHO — MNEMONICA ROTACIONADA
// COMEÇANDO NO ÁS DE ESPADAS
// ===============================
const deck = [
  "as","5h","9s","2s","qh","3d","qc","8h","6s","5s","9h","kc",
  "2d","jh","3s","8s","6h","xc","5d","kd","2c","3h","8d","5c",
  "ks","jd","8c","xs","kh","jc","7s","xh","ad","4s","7h","4d",
  "ac","9c","js","qd","7d","qs","xd","6c","ah","9d","4c","2h",
  "7c","3c","4h","6d"
];

const cardImg = document.getElementById("card");

let forcedCard = "qh";

const SPEED_START = 90;
const SPEED_FORCE = 520;
const SPEED_END   = 38;

let sequence = [];
let index = 0;
let running = false;
let timer = null;

// ===============================
// PRÉ-CARREGAMENTO
// ===============================
deck.forEach(c => {
  const img = new Image();
  img.src = `cards/${c}.png`;
});

// ===============================
function prepareDeck(force) {
  let temp = deck.filter(c => c !== force);
  let middle = Math.floor(temp.length / 2);
  temp.splice(middle, 0, force);
  return temp;
}

// ===============================
function clearTimer() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

// ===============================
// QUEDA FRONTAL REAL (90° → 0°)
// ===============================
function dropCard(card) {
  // começa de lado (frente)
  cardImg.style.transform = "rotateY(90deg)";

  // micro delay para sensação física
  setTimeout(() => {
    cardImg.src = `cards/${card}.png`;
    cardImg.style.transform = "rotateY(0deg)";
  }, 34);
}

// ===============================
function runDeck() {
  if (!running) return;

  // FINAL — fecha o baralho
  if (index >= sequence.length) {
    running = false;
    clearTimer();

    timer = setTimeout(() => {
      cardImg.src = "cards/as.png";
      cardImg.style.transform = "rotateY(90deg)";
      cardImg.style.opacity = 1;
    }, 180);

    return;
  }

  const currentCard = sequence[index];

  dropCard(currentCard);
  index++;

  let delay = SPEED_START + Math.random() * 16;

  if (currentCard === forcedCard) {
    delay = SPEED_FORCE;
  } else if (index > sequence.length * 0.65) {
    delay = SPEED_END + Math.random() * 12;
  }

  timer = setTimeout(runDeck, delay);
}

// ===============================
function startDeck() {
  if (running) return;

  clearTimer();

  running = true;
  index = 0;

  cardImg.style.opacity = 1;
  cardImg.src = "cards/as.png";
  cardImg.style.transform = "rotateY(90deg)";

  sequence = prepareDeck(forcedCard);

  timer = setTimeout(runDeck, 240);
}

// ===============================
document.body.addEventListener("click", startDeck);
document.body.addEventListener("touchstart", startDeck);
