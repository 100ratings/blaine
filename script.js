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
// - por padrão: aleatório toda rodada
// - após swipe: força por 2 rodadas
// ===============================
let forcedOverride = null;
let forcedRunsLeft = 0;
let forceThisRun = null;

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

function clearTimer() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
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
  }, 1400);
}

// ===============================
// HELPERS DE TRANSFORM (mantém a mesma animação)
// ===============================
function setCardTransform(y, x = 0) {
  // Mantém os mesmos valores de Y (-6 / 22), apenas adiciona X quando necessário (peek)
  cardImg.style.transform = `translate3d(${x}px, ${y}px, 0)`;
}

// ===============================
// PEEK (canônico): desloca levemente pra direita e some rápido
// - não altera timing do baralho
// - some e fica invisível até a próxima carta entrar
// ===============================
const PEEK_X = 18;        // leve deslocamento p/ direita
const PEEK_HIDE_MS = 110; // some rápido
let pendingPeekRestore = false;

// ===============================
// ANIMAÇÃO DO BARALHO
// ===============================
function runDeck() {
  if (!running) return;

  if (index >= sequence.length) {
    running = false;
    clearTimer();

    setTimeout(() => {
      cardImg.src = "cards/as.png";
      cardImg.style.opacity = 1;
      setCardTransform(-6, 0);
    }, 120);

    return;
  }

  const currentCard = sequence[index];

  // movimento "pra baixo" (igual ao original)
  setCardTransform(22, 0);

  timer = setTimeout(() => {
    // Se o peek deixou invisível, só voltamos a opacidade no momento do swap
    // (pra não “reaparecer” a carta forçada antes da próxima entrar)
    if (pendingPeekRestore) {
      cardImg.style.opacity = 1;
      pendingPeekRestore = false;
    }

    cardImg.src = `cards/${currentCard}.png`;

    // settle (igual ao original), com exceção do peek na carta forçada
    if (currentCard === forceThisRun) {
      // desloca pra direita (peek)
      setCardTransform(-6, PEEK_X);
      cardImg.style.opacity = 1;

      // some rapidamente
      setTimeout(() => {
        if (!running) return;
        // some e fica invisível até o próximo swap
        cardImg.style.opacity = 0;
        pendingPeekRestore = true;
      }, PEEK_HIDE_MS);
    } else {
      setCardTransform(-6, 0);
    }

    index++;
  }, 20);

  let delay = SPEED_START;

  if (currentCard === forceThisRun) {
    delay = SPEED_FORCE;
  } else if (index > sequence.length * 0.65) {
    delay = SPEED_END;
  }

  timer = setTimeout(runDeck, delay);
}

function startDeck() {
  if (running) return;

  clearTimer();
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

  pendingPeekRestore = false;

  cardImg.style.opacity = 1;
  setCardTransform(-6, 0);
  cardImg.src = "cards/as.png";

  sequence = prepareDeck(forceThisRun);
  timer = setTimeout(runDeck, 140);
}

// ===============================
// SWIPE INPUT (3 gestos)
// - swipe NÃO inicia o baralho
// - tap NO BARALHO inicia
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
  // code: "qh", "as", "8c" etc
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
    // define direção
    let dir;
    if (absX > absY) dir = dx > 0 ? "R" : "L";
    else dir = dy > 0 ? "D" : "U";

    swipeBuffer.push(dir);

    // feedback parcial ajuda a validar
    if (swipeBuffer.length < 3) {
      showIndicator(swipeBuffer.map(dirToArrow).join(" "), true);
    }

    // no 3º swipe, decodifica
    if (swipeBuffer.length === 3) {
      const card = decodeSwipe(swipeBuffer);
      const arrows = swipeBuffer.map(dirToArrow).join(" ");
      swipeBuffer = [];

      if (card) {
        forcedOverride = card;
        forcedRunsLeft = 2;
        showIndicator(`${arrows}  →  ${prettyCard(card)}`, true);
      } else {
        showIndicator(`${arrows}  →  inválido`, false);
      }
    }

    // evita que o "click" fantasma do iOS dispare start
    suppressClickUntil = Date.now() + 450;
    return;
  }

  // TAP (sem swipe): só inicia se foi em cima do baralho
  const now = Date.now();
  if (now < suppressClickUntil) return;

  const tappedDeck = deckEl.contains(touchStartTarget);
  if (tappedDeck) {
    suppressClickUntil = Date.now() + 450; // evita click duplicado
    startDeck();
  }
}, { passive: true });

// Desktop: click no baralho inicia
deckEl.addEventListener("click", (e) => {
  const now = Date.now();
  if (now < suppressClickUntil) return;
  startDeck();
});
