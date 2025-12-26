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

const deckEl = document.getElementById("deck");
const cardImg = document.getElementById("card");
const indicator = document.getElementById("swipe-indicator");

// ===============================
// FORCE STATE
// - padrão: aleatório toda rodada
// - após swipe: força por 2 rodadas
// ===============================
let forcedOverride = null;
let forcedRunsLeft = 0;

// ===============================
// ANIMAÇÃO (cai pra frente)
// ===============================
// 0deg = face reta; ~78deg = quase “em pé”, parece caindo pra frente
const EDGE_T = "translateY(-6px) rotateX(78deg)";
const FACE_T = "translateY(-6px) rotateX(0deg)";

const CLOSE_DUR = 70;       // fechar (voltar pra inclinado)
const OPEN_DUR  = 140;      // cair pra frente
const OPEN_DUR_FORCE = 220; // cair mais gostoso no force

const BASE_DELAY  = 170;    // ritmo normal
const END_DELAY   = 120;    // acelera no final
const FORCE_DELAY = 520;    // pausa no force

// ===============================
let sequence = [];
let index = 0;
let running = false;
let timer = null;
let forceThisRun = null;

// ===============================
// PRÉ-CARREGAMENTO (evita travada inicial)
// ===============================
deck.forEach(c => {
  const img = new Image();
  img.src = `cards/${c}.png`;
});

// ===============================
function getRandomCard() {
  return deck[Math.floor(Math.random() * deck.length)];
}

function pickForceForRun() {
  if (forcedRunsLeft > 0 && forcedOverride) {
    const c = forcedOverride;
    forcedRunsLeft--;
    if (forcedRunsLeft === 0) forcedOverride = null;
    return c;
  }
  return getRandomCard();
}

function prepareDeck(force) {
  const temp = deck.filter(c => c !== force);
  const middle = Math.floor(temp.length / 2);
  temp.splice(middle, 0, force);
  return temp;
}

function clearTimer() {
  if (timer) { clearTimeout(timer); timer = null; }
}

// ===============================
// INDICADOR
// ===============================
let indicatorTimeout = null;

function showIndicator(text, ok = true) {
  if (indicatorTimeout) clearTimeout(indicatorTimeout);

  indicator.textContent = text;
  indicator.classList.remove("ok", "bad");
  indicator.classList.add("show", ok ? "ok" : "bad");

  indicatorTimeout = setTimeout(() => {
    indicator.classList.remove("show", "ok", "bad");
  }, 1200);
}

// ===============================
// ANIMAÇÃO POR CARTA: inclina → troca → cai pra frente
// ===============================
function animateToCard(cardCode, isForceStep) {
  cardImg.style.setProperty("--dur", `${CLOSE_DUR}ms`);
  cardImg.style.transform = EDGE_T;

  setTimeout(() => {
    cardImg.src = `cards/${cardCode}.png`;

    const open = isForceStep ? OPEN_DUR_FORCE : OPEN_DUR;
    cardImg.style.setProperty("--dur", `${open}ms`);
    cardImg.style.transform = FACE_T;
  }, CLOSE_DUR);
}

// FINAL: fecha pra não entregar a última, troca pra A♠, abre
function resetToAce() {
  cardImg.style.setProperty("--dur", `${CLOSE_DUR}ms`);
  cardImg.style.transform = EDGE_T;

  setTimeout(() => {
    cardImg.src = "cards/as.png";
    cardImg.style.setProperty("--dur", `${OPEN_DUR}ms`);
    cardImg.style.transform = FACE_T;
  }, CLOSE_DUR);
}

// ===============================
function runDeck() {
  if (!running) return;

  if (index >= sequence.length) {
    running = false;
    clearTimer();
    resetToAce();
    return;
  }

  const currentCard = sequence[index];
  const isForceStep = (currentCard === forceThisRun);

  animateToCard(currentCard, isForceStep);
  index++;

  let delay = BASE_DELAY;
  if (isForceStep) delay = FORCE_DELAY;
  else if (index > sequence.length * 0.65) delay = END_DELAY;

  const minDelay = CLOSE_DUR + (isForceStep ? OPEN_DUR_FORCE : OPEN_DUR) + 18;
  delay = Math.max(delay, minDelay);

  timer = setTimeout(runDeck, delay);
}

function startDeck() {
  if (running) return;

  clearTimer();
  running = true;
  index = 0;

  forceThisRun = pickForceForRun();
  sequence = prepareDeck(forceThisRun);

  // entra “inclinado” antes de começar
  cardImg.style.setProperty("--dur", `${CLOSE_DUR}ms`);
  cardImg.style.transform = EDGE_T;

  timer = setTimeout(runDeck, 90);
}

// ===============================
// SWIPE INPUT (3 gestos) — NÃO inicia
// TAP no baralho inicia
// ===============================
const SWIPE_MIN = 42;

let sx = 0, sy = 0;
let touchStartTarget = null;
let suppressClickUntil = 0;
let swipeBuffer = [];

function dirToArrow(d) {
  return d === "U" ? "↑" : d === "R" ? "→" : d === "D" ? "↓" : "←";
}

function prettyCard(code) {
  const v = code.slice(0, -1);
  const s = code.slice(-1);

  const value = (v === "a") ? "A" :
                (v === "x") ? "10" :
                (v === "j") ? "J" :
                (v === "q") ? "Q" :
                (v === "k") ? "K" : v;

  const suit = (s === "s") ? "♠" :
               (s === "h") ? "♥" :
               (s === "c") ? "♣" : "♦";

  return `${value}${suit}`;
}

function decodeSwipe([a, b, c]) {
  const valueMap = {
    "UR":"a",
    "RU":"2",
    "RR":"3",
    "RD":"4",
    "DR":"5",
    "DD":"6",
    "DL":"7",
    "LD":"8",
    "LL":"9",
    "LU":"x",
    "UL":"j",
    "UU":"q",
    "UD":"k"
  };

  const suitMap = {
    "U":"s",
    "R":"h",
    "D":"c",
    "L":"d"
  };

  const value = valueMap[a + b];
  const suit = suitMap[c];
  if (!value || !suit) return null;
  return value + suit;
}

document.addEventListener("touchstart", (e) => {
  if (running) return;
  sx = e.touches[0].clientX;
  sy = e.touches[0].clientY;
  touchStartTarget = e.target;
}, { passive: true });

document.addEventListener("touchend", (e) => {
  if (running) return;

  const ex = e.changedTouches[0].clientX;
  const ey = e.changedTouches[0].clientY;

  const dx = ex - sx;
  const dy = ey - sy;

  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  const isSwipe = (absX >= SWIPE_MIN || absY >= SWIPE_MIN);

  if (isSwipe) {
    let dir;
    if (absX > absY) dir = dx > 0 ? "R" : "L";
    else dir = dy > 0 ? "D" : "U";

    swipeBuffer.push(dir);

    if (swipeBuffer.length < 3) {
      showIndicator(swipeBuffer.map(dirToArrow).join(" "), true);
    }

    if (swipeBuffer.length === 3) {
      const arrows = swipeBuffer.map(dirToArrow).join(" ");
      const card = decodeSwipe(swipeBuffer);
      swipeBuffer = [];

      if (card) {
        forcedOverride = card;
        forcedRunsLeft = 2;
        showIndicator(`${arrows}  →  ${prettyCard(card)}`, true);
      } else {
        showIndicator(`${arrows}  →  inválido`, false);
      }
    }

    suppressClickUntil = Date.now() + 450;
    return;
  }

  // TAP: só inicia se tocou no baralho
  if (Date.now() < suppressClickUntil) return;

  const tappedDeck = deckEl.contains(touchStartTarget);
  if (tappedDeck) {
    suppressClickUntil = Date.now() + 450;
    startDeck();
  }
}, { passive: true });

// Desktop: click no baralho inicia
deckEl.addEventListener("click", () => {
  if (Date.now() < suppressClickUntil) return;
  startDeck();
});
