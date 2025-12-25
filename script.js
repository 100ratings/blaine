// ===============================
// BARALHO — MNEMONICA ROTACIONADA
// ===============================
const deck = [
  "as","5h","9s","2s","qh","3d","qc","8h","6s","5s","9h","kc",
  "2d","jh","3s","8s","6h","xc","5d","kd","2c","3h","8d","5c",
  "ks","jd","8c","xs","kh","jc","7s","xh","ad","4s","7h","4d",
  "ac","9c","js","qd","7d","qs","xd","6c","ah","9d","4c","2h",
  "7c","3c","4h","6d"
];

const cardImg = document.getElementById("card");

// ===============================
// FORCE STATE
// ===============================
let forcedCard = getRandomCard();
let pendingForcedCard = null;
let forceRepeatCount = 0;

// ===============================
// TIMING
// ===============================
const SPEED_START = 90;
const SPEED_FORCE = 520;
const SPEED_END   = 38;

// ===============================
let sequence = [];
let index = 0;
let running = false;
let timer = null;

// ===============================
// PRÉ-CARREGA IMAGENS
// ===============================
deck.forEach(c => {
  const img = new Image();
  img.src = `cards/${c}.png`;
});

// ===============================
// RANDOM FORCE
// ===============================
function getRandomCard() {
  return deck[Math.floor(Math.random() * deck.length)];
}

// ===============================
function prepareDeck(force) {
  let temp = deck.filter(c => c !== force);
  let middle = Math.floor(temp.length / 2);

  // se for force ativo, coloca duas vezes
  if (forceRepeatCount > 0) {
    temp.splice(middle, 0, force, force);
    forceRepeatCount--;
  } else {
    temp.splice(middle, 0, force);
  }

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
function dropCard(card) {
  cardImg.style.transform = "rotateY(90deg)";

  setTimeout(() => {
    cardImg.src = `cards/${card}.png`;
    cardImg.style.transform = "rotateY(0deg)";
  }, 34);
}

// ===============================
function runDeck() {
  if (!running) return;

  if (index >= sequence.length) {
    running = false;
    clearTimer();

    setTimeout(() => {
      cardImg.src = "cards/as.png";
      cardImg.style.transform = "rotateY(90deg)";
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

  // aplica force pendente
  if (pendingForcedCard) {
    forcedCard = pendingForcedCard;
    forceRepeatCount = 1;
    pendingForcedCard = null;
  } else if (forceRepeatCount === 0) {
    forcedCard = getRandomCard();
  }

  cardImg.src = "cards/as.png";
  cardImg.style.transform = "rotateY(90deg)";

  sequence = prepareDeck(forcedCard);
  timer = setTimeout(runDeck, 240);
}

// ===============================
// SWIPE INPUT (INVISÍVEL)
// ===============================
let swipeBuffer = [];
let startX = 0;
let startY = 0;

document.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
});

document.addEventListener("touchend", e => {
  const dx = e.changedTouches[0].clientX - startX;
  const dy = e.changedTouches[0].clientY - startY;

  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  if (absX < 30 && absY < 30) return;

  let dir;
  if (absX > absY) dir = dx > 0 ? "R" : "L";
  else dir = dy > 0 ? "D" : "U";

  swipeBuffer.push(dir);

  if (swipeBuffer.length === 3) {
    pendingForcedCard = decodeSwipe(swipeBuffer);
    swipeBuffer = [];
  }
});

// ===============================
// DECODE SWIPE → CARTA
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

  return value && suit ? value + suit : getRandomCard();
}

// ===============================
document.body.addEventListener("click", startDeck);
document.body.addEventListener("touchstart", startDeck);
