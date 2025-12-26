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
const tryAgain = document.getElementById("try-again");

// ===============================
// FORCE STATE
// - por padrão: aleatório toda rodada
// - após swipe: força por 2 rodadas
// ===============================
let forcedOverride = null;
let forcedRunsLeft = 0;
let forceThisRun = null;

// ===============================
// SPEED (mantém seu “flick” atual)
// ===============================
const SPEED_START = 60;
const SPEED_FORCE = 420;
const SPEED_END   = 30;

// ===============================
let sequence = [];
let index = 0;
let running = false;
let awaitingRetry = false;

let swapTimer = null;
let nextTimer = null;

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

function prepareDeck(force) {
  let temp = deck.filter(c => c !== force);
  let middle = Math.floor(temp.length / 2);
  temp.splice(middle, 0, force);
  return temp;
}

function clearTimers() {
  if (swapTimer) { clearTimeout(swapTimer); swapTimer = null; }
  if (nextTimer) { clearTimeout(nextTimer); nextTimer = null; }
}

// ===============================
// INDICADOR (sutil, só a carta)
// ===============================
let indicatorTimeout = null;

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

function showCardIndicator(text) {
  if (indicatorTimeout) clearTimeout(indicatorTimeout);

  indicator.textContent = text;
  indicator.classList.add("show");

  indicatorTimeout = setTimeout(() => {
    indicator.classList.remove("show");
  }, 520);
}

// ===============================
// TRY AGAIN
// ===============================
function showTryAgain() {
  awaitingRetry = true;
  tryAgain.classList.remove("hidden");
}

function hideTryAgain() {
  awaitingRetry = false;
  tryAgain.classList.add("hidden");
}

// ===============================
// ANIMAÇÃO DO BARALHO (mantida)
// - force: “peek” levemente pra direita
// - último passo: NÃO mostra a última carta (só some)
// ===============================
function runDeck() {
  if (!running) return;

  // se chegou no fim (segurança)
  if (index >= sequence.length) {
    running = false;
    clearTimers();
    cardImg.style.opacity = 0;
    showTryAgain();
    return;
  }

  const isLastStep = (index === sequence.length - 1);
  const currentCard = sequence[index];

  // “queda”
  cardImg.style.transform = "translateY(22px) translateX(0px)";

  if (isLastStep) {
    // não troca pro último frame — só some
    swapTimer = setTimeout(() => {
      cardImg.style.opacity = 0;
    }, 20);

    running = false;
    clearTimers();

    nextTimer = setTimeout(() => {
      showTryAgain();
    }, 160);

    return;
  }

  // troca normal
  swapTimer = setTimeout(() => {
    cardImg.src = `cards/${currentCard}.png`;

    // volta pro topo — com “peek” na carta forçada
    if (currentCard === forceThisRun) {
      cardImg.style.transform = "translateY(-6px) translateX(18px)";
    } else {
      cardImg.style.transform = "translateY(-6px) translateX(0px)";
    }

    cardImg.style.opacity = 1;
    index++;
  }, 20);

  let delay = SPEED_START;

  if (currentCard === forceThisRun) {
    delay = SPEED_FORCE;
  } else if (index > sequence.length * 0.65) {
    delay = SPEED_END;
  }

  nextTimer = setTimeout(runDeck, delay);
}

function startDeck() {
  if (running) return;
  if (awaitingRetry) return;

  clearTimers();
  running = true;
  index = 0;

  // decide a carta forçada desta rodada
  if (forcedRunsLeft > 0 && forcedOverride) {
    forceThisRun = forcedOverride;
    forcedRunsLeft--;
    if (forcedRunsLeft === 0) {
      forcedOverride = null; // volta ao aleatório depois de 2 rodadas
    }
  } else {
    forceThisRun = getRandomCard();
  }

  cardImg.style.opacity = 1;
  cardImg.style.transform = "translateY(-6px) translateX(0px)";
  cardImg.src = "cards/as.png";

  sequence = prepareDeck(forceThisRun);
  nextTimer = setTimeout(runDeck, 140);
}

// ===============================
// SWIPE INPUT (3 gestos) — mantém perfeito
// - swipe NÃO inicia o baralho
// - mostra só a CARTA (sutil)
// ===============================
const SWIPE_MIN = 42;

let sx = 0, sy = 0;
let touchStartTarget = null;
let suppressClickUntil = 0;

let swipeBuffer = [];

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

    if (swipeBuffer.length === 3) {
      const card = decodeSwipe(swipeBuffer);
      swipeBuffer = [];

      if (card) {
        forcedOverride = card;
        forcedRunsLeft = 2;
        showCardIndicator(prettyCard(card));
      }
    }

    suppressClickUntil = Date.now() + 450;
    return;
  }

  // TAP (sem swipe)
  const now = Date.now();
  if (now < suppressClickUntil) return;

  // se estiver em “tentar de novo”, só aceita clique no botão
  if (awaitingRetry) {
    if (tryAgain.contains(touchStartTarget)) {
      hideTryAgain();

      cardImg.src = "cards/as.png";
      cardImg.style.opacity = 1;
      cardImg.style.transform = "translateY(-6px) translateX(0px)";

      suppressClickUntil = Date.now() + 350;
      startDeck();
    }
    return;
  }

  // normal: inicia se tap no baralho
  const tappedDeck = deckEl.contains(touchStartTarget);
  if (tappedDeck) {
    suppressClickUntil = Date.now() + 450;
    startDeck();
  }
}, { passive: true });

// Desktop clicks
deckEl.addEventListener("click", () => {
  const now = Date.now();
  if (now < suppressClickUntil) return;
  if (awaitingRetry) return;
  startDeck();
});

tryAgain.addEventListener("click", () => {
  if (!awaitingRetry) return;

  hideTryAgain();

  cardImg.src = "cards/as.png";
  cardImg.style.opacity = 1;
  cardImg.style.transform = "translateY(-6px) translateX(0px)";

  suppressClickUntil = Date.now() + 250;
  startDeck();
});

// estado inicial: não mostrar “tentar de novo”
hideTryAgain();
cardImg.style.opacity = 1;
