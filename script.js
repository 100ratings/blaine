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

// ===============================
const cardImg = document.getElementById("card");

// ===============================
// FORCE
// ===============================
let forcedCard = "qh"; // default

// ===============================
const SPEED_START = 60;
const SPEED_FORCE = 420;
const SPEED_END   = 30;

// ===============================
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
function runDeck() {
  if (!running) return;

  if (index >= sequence.length) {
    running = false;
    clearTimer();

    timer = setTimeout(() => {
      cardImg.src = "cards/as.png";
      cardImg.style.opacity = 1;
      cardImg.style.transform = "translateY(-6px)";
    }, 120);

    return;
  }

  const currentCard = sequence[index];

  cardImg.style.transform = "translateY(22px)";

  timer = setTimeout(() => {
    cardImg.src = `cards/${currentCard}.png`;
    cardImg.style.transform = "translateY(-6px)";
    index++;
  }, 20);

  let delay = SPEED_START;

  if (currentCard === forcedCard) {
    delay = SPEED_FORCE;
  } else if (index > sequence.length * 0.65) {
    delay = SPEED_END;
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
  cardImg.style.transform = "translateY(-6px)";
  cardImg.src = "cards/as.png";

  sequence = prepareDeck(forcedCard);
  timer = setTimeout(runDeck, 140);
}

// ===============================
// TOQUE INICIA BARALHO
// ===============================
document.body.addEventListener("click", startDeck);
document.body.addEventListener("touchstart", startDeck);

// ===============================
// SWIPE INVISÍVEL (NÃO INICIA)
// ===============================
let swipeBuffer = [];
let startX = 0;
let startY = 0;

document.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener("touchend", e => {
  if (running) return; // ignora swipe durante animação

  const dx = e.changedTouches[0].clientX - startX;
  const dy = e.changedTouches[0].clientY - startY;

  if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;

  let dir;
  if (Math.abs(dx) > Math.abs(dy)) {
    dir = dx > 0 ? "R" : "L";
  } else {
    dir = dy > 0 ? "D" : "U";
  }

  swipeBuffer.push(dir);

  if (swipeBuffer.length === 3) {
    const card = decodeSwipe(swipeBuffer);
    if (card) forcedCard = card;
    swipeBuffer = [];
  }
}, { passive: true });

// ===============================
// DECODIFICA SWIPE → CARTA
// ===============================
function decodeSwipe([a, b, c]) {
  const valueMap = {
    "UR":"a","RU":"2","RR":"3","RD":"4",
    "DR":"5","DD":"6","DL":"7",
    "LD":"8","LL":"9","LU":"x",
    "UL":"j","UU":"q","UD":"k"
  };

  const suitMap = {
    "U":"s","R":"h","D":"c","L":"d"
  };

  const value = valueMap[a + b];
  const suit = suitMap[c];

  if (!value || !suit) return null;
  return value + suit;
}
