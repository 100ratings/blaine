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

// Quanto tempo a ÚLTIMA carta fica na tela antes de sumir pro "Tentar de novo"
const LAST_CARD_EXIT_DELAY = SPEED_END;

// ===============================
let sequence = [];
let index = 0;
let running = false;
let timer = null;

// ===============================
// ESTADO "TENTAR DE NOVO"
// ===============================
let awaitingRetry = false;

// ===============================
// PRÉ-CARREGAMENTO
// ===============================
deck.forEach(c => {
  const img = new Image();
  img.src = `cards/${c}.png`;
});

function getRandomCard() {
  return deck[Math.floor(Math.random() * deck.length)];
}

function prepareDeck(force) {
  const temp = deck.filter(c => c !== force);
  const middle = Math.floor(temp.length / 2);
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
// INDICADOR (STEALTH)
// - só mostra a CARTA no final do swipe (sem verde / sem setas)
// - mais pra baixo (ajuste aqui)
// ===============================
let indicatorTimeout = null;
let indicatorStyled = false;

function styleIndicatorOnce() {
  if (indicatorStyled || !indicator) return;
  indicatorStyled = true;

  Object.assign(indicator.style, {
    position: "fixed",
    right: "10px",
    left: "auto",
    top: "62%",                 // <-- MAIS PRA BAIXO (ajuste fino aqui)
    transform: "translateY(-50%)",
    zIndex: "9999",
    background: "transparent",
    border: "0",
    boxShadow: "none",
    padding: "0",
    margin: "0",
    borderRadius: "0",
    color: "rgba(255,255,255,0.50)",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
    fontSize: "14px",
    fontWeight: "700",
    letterSpacing: "0.2px",
    textShadow: "0 2px 12px rgba(0,0,0,0.75)",
    pointerEvents: "none",
    opacity: "0",
    transition: "opacity 0.12s ease",
    userSelect: "none",
    WebkitUserSelect: "none",
  });

  indicator.classList.remove("show", "ok", "bad");
  indicator.textContent = "";
}

function showIndicatorStealth(text) {
  if (!indicator) return;
  styleIndicatorOnce();

  if (indicatorTimeout) clearTimeout(indicatorTimeout);
  indicator.textContent = text;
  indicator.style.opacity = "1";

  indicatorTimeout = setTimeout(() => {
    indicator.style.opacity = "0";
  }, 420);
}

// ===============================
// BOTÃO "TENTAR DE NOVO" (via JS)
// ===============================
const retryBtn = document.createElement("button");
retryBtn.type = "button";
retryBtn.textContent = "Tentar de novo";
retryBtn.setAttribute("aria-label", "Tentar de novo");

Object.assign(retryBtn.style, {
  position: "absolute",
  left: "50%",
  top: "50%",
  transform: "translate(-50%, -50%)",
  padding: "14px 18px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(0,0,0,0.55)",
  color: "rgba(255,255,255,0.92)",
  fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
  fontSize: "15px",
  letterSpacing: "0.2px",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  boxShadow: "0 14px 36px rgba(0,0,0,0.55)",
  opacity: "0",
  display: "none",
  transition: "opacity 0.18s ease",
  zIndex: "10",
  touchAction: "manipulation",
  userSelect: "none",
  WebkitUserSelect: "none",
});

deckEl.appendChild(retryBtn);

function showRetryOnly() {
  awaitingRetry = true;
  cardImg.style.opacity = "0";

  retryBtn.style.display = "block";
  requestAnimationFrame(() => {
    retryBtn.style.opacity = "1";
  });
}

function hideRetryAndShowAceOnly() {
  awaitingRetry = false;

  retryBtn.style.opacity = "0";
  setTimeout(() => {
    retryBtn.style.display = "none";
  }, 200);

  cardImg.src = "cards/as.png";
  cardImg.style.opacity = "1";
  cardImg.style.transform = "translateY(-6px)";
}

// IMPORTANTE: NÃO inicia automaticamente.
// Clicou "Tentar de novo" => volta pro Ás e espera toque no Ás.
let suppressClickUntil = 0;
retryBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  suppressClickUntil = Date.now() + 450;
  hideRetryAndShowAceOnly();
});

// ===============================
// ANIMAÇÃO DO BARALHO
// (fim: após mostrar a ÚLTIMA carta, espera ~SPEED_END e chama showRetryOnly())
// ===============================
function runDeck() {
  if (!running) return;

  // se por algum motivo alguém chamar com index já fora, encerra
  if (index >= sequence.length) {
    running = false;
    clearTimer();
    showRetryOnly();
    return;
  }

  const currentCard = sequence[index];

  // movimento "pra baixo"
  cardImg.style.transform = "translateY(22px)";

  // swap da carta
  clearTimer();
  timer = setTimeout(() => {
    cardImg.src = `cards/${currentCard}.png`;
    cardImg.style.transform = "translateY(-6px)";
    index++;

    // SE ACABOU de mostrar a última carta: encerra rápido -> "Tentar de novo"
    if (index >= sequence.length) {
      running = false;
      clearTimer();
      setTimeout(showRetryOnly, LAST_CARD_EXIT_DELAY);
      return;
    }

    // Próximo delay normal
    let delay = SPEED_START;

    if (currentCard === forceThisRun) {
      delay = SPEED_FORCE;
    } else if (index > sequence.length * 0.65) {
      delay = SPEED_END;
    }

    timer = setTimeout(runDeck, delay);
  }, 20);
}

function startDeck() {
  if (running) return;
  if (awaitingRetry) return;

  clearTimer();
  running = true;
  index = 0;

  // decide a carta forçada desta rodada
  if (forcedRunsLeft > 0 && forcedOverride) {
    forceThisRun = forcedOverride;
    forcedRunsLeft--;
    if (forcedRunsLeft === 0) forcedOverride = null; // volta ao aleatório
  } else {
    forceThisRun = getRandomCard();
  }

  cardImg.style.opacity = "1";
  cardImg.style.transform = "translateY(-6px)";
  cardImg.src = "cards/as.png";

  sequence = prepareDeck(forceThisRun);
  timer = setTimeout(runDeck, 140);
}

// ===============================
// SWIPE INPUT (3 gestos)
// - swipe NÃO inicia o baralho
// - após 3 swipes: confirma stealth (só carta) e seta force por 2 rodadas
// - toque no ÁS inicia
// ===============================
const SWIPE_MIN = 42;

let sx = 0, sy = 0;
let touchStartTarget = null;
let swipeBuffer = [];

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
  if (awaitingRetry) return;

  sx = e.touches[0].clientX;
  sy = e.touches[0].clientY;
  touchStartTarget = e.target;
}, { passive: true });

document.addEventListener("touchend", (e) => {
  if (running) return;
  if (awaitingRetry) return;

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
        showIndicatorStealth(prettyCard(card));
      }
    }

    suppressClickUntil = Date.now() + 450;
    return;
  }

  // TAP: exige tocar NO ÁS (imagem)
  const now = Date.now();
  if (now < suppressClickUntil) return;

  if (touchStartTarget === cardImg) {
    suppressClickUntil = Date.now() + 450;
    startDeck();
  }
}, { passive: true });

// Desktop: click no ÁS inicia
deckEl.addEventListener("click", (e) => {
  const now = Date.now();
  if (now < suppressClickUntil) return;
  if (awaitingRetry) return;
  if (e.target === cardImg) startDeck();
});
