// ===== BARALHO BASE =====
const deck = [
  "ac","2c","3c","4c","5c","6c","7c","8c","9c","xc","jc","qc","kc",
  "ad","2d","3d","4d","5d","6d","7d","8d","9d","xd","jd","qd","kd",
  "ah","2h","3h","4h","5h","6h","7h","8h","9h","xh","jh","qh","kh",
  "as","2s","3s","4s","5s","6s","7s","8s","9s","xs","js","qs","ks"
];

const cardImg = document.getElementById("card");

// ===== CONFIGURAÇÃO =====
let forcedCard = "qh"; // <<< MUDE A CARTA AQUI

const SPEED_START = 60;
const SPEED_FORCE = 420;
const SPEED_END   = 28;

// ===== ESTADO =====
let sequence = [];
let index = 0;
let running = false;

// ===== PREPARA O BARALHO =====
function prepareDeck(force) {
  let temp = deck.filter(c => c !== force);
  let middle = Math.floor(temp.length / 2);
  temp.splice(middle, 0, force);
  return temp;
}

// ===== ANIMAÇÃO =====
function runDeck() {
  if (!running) return;
  if (index >= sequence.length) {
    running = false;
    return;
  }

  cardImg.src = `cards/${sequence[index]}.png`;

  let delay = SPEED_START;

  if (sequence[index] === forcedCard) {
    delay = SPEED_FORCE;
  } else if (index > sequence.length / 2) {
    delay = SPEED_END;
  }

  index++;
  setTimeout(runDeck, delay);
}

// ===== START / RESTART =====
function startDeck() {
  if (running) return;

  running = true;
  index = 0;
  sequence = prepareDeck(forcedCard);

  cardImg.src = "cards/back.png";

  setTimeout(runDeck, 120);
}

// ===== INTERAÇÃO (CLIQUE / TOQUE) =====
document.body.addEventListener("click", startDeck);
document.body.addEventListener("touchstart", startDeck);
