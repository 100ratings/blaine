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
​
const deckEl = document.getElementById("deck");
const cardImg = document.getElementById("card");
const indicator = document.getElementById("swipe-indicator");
​
// ===============================
// FORCE STATE
// - por padrão: aleatório toda rodada
// - após swipe: força por 2 rodadas
// ===============================
let forcedOverride = null;
let forcedRunsLeft = 0;
let forceThisRun = null;
​
// ===============================
const SPEED_START = 60;
const SPEED_FORCE = 700; // ↓ diminuiu (segura menos tempo na carta forçada)
const SPEED_END   = 30;
​
// ===============================
let sequence = [];
let index = 0;
let running = false;
let timer = null;
​
// ===============================
// ESTADO "TENTAR DE NOVO"
// ===============================
let awaitingRetry = false;
​
// ===============================
// PRÉ-CARREGAMENTO (evita travada inicial)
// ===============================
deck.forEach(c => {
  const img = new Image();
  img.src = `cards/${c}.png`;
});
​
// ===============================
function getRandomCard() {
  return deck[Math.floor(Math.random() * deck.length)];
}
​
function prepareDeck(force) {
  let temp = deck.filter(c => c !== force);
  let middle = Math.floor(temp.length / 2);
  temp.splice(middle, 0, force);
  return temp;
}
​
function clearTimer() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}
​
// ===============================
// INDICADOR (STEALTH)
// - nada de verde / quadrado / bolinhas
// - mostra SOMENTE a carta após completar o swipe
// - fica mais pra direita
// ===============================
let indicatorTimeout = null;
let indicatorStyled = false;
​
function styleIndicatorOnce() {
  if (indicatorStyled || !indicator) return;
  indicatorStyled = true;
​
  Object.assign(indicator.style, {
    position: "fixed",
    right: "18px",
    left: "auto",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: "9999",
    background: "transparent",
    border: "0",
    boxShadow: "none",
    padding: "0",
    margin: "0",
    borderRadius: "0",
    color: "rgba(255,255,255,0.55)",
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
}
​
function showIndicatorStealth(text) {
  if (!indicator) return;
  styleIndicatorOnce();
​
  if (indicatorTimeout) clearTimeout(indicatorTimeout);
  indicator.textContent = text;
  indicator.style.opacity = "1";
​
  // bem rápido e discreto
  indicatorTimeout = setTimeout(() => {
    indicator.style.opacity = "0";
  }, 520);
}
​
// ===============================
// BOTÃO "TENTAR DE NOVO" (via JS; sem mexer em HTML/CSS)
// ===============================
const retryBtn = document.createElement("button");
retryBtn.type = "button";
retryBtn.textContent = "Tentar de novo";
retryBtn.setAttribute("aria-label", "Tentar de novo");
​
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
​
deckEl.appendChild(retryBtn);
​
function showRetryOnly() {
  awaitingRetry = true;
  cardImg.style.opacity = 0;
​
  retryBtn.style.display = "block";
  requestAnimationFrame(() => {
    retryBtn.style.opacity = "1";
  });
}
​
function hideRetryAndResetToAce() {
  awaitingRetry = false;
​
  retryBtn.style.opacity = "0";
  setTimeout(() => {
    retryBtn.style.display = "none";
  }, 200);
​
  cardImg.src = "cards/as.png";
  cardImg.style.opacity = 1;
  cardImg.style.transform = "translateY(-6px)";
}
​
retryBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  suppressClickUntil = Date.now() + 450;
​
  // ao clicar: já roda de novo (não espera tap no Ás)
  hideRetryAndResetToAce();
  setTimeout(() => startDeck(), 60);
});
​
// ===============================
// ANIMAÇÃO DO BARALHO
// ===============================
function runDeck() {
  if (!running) return;
​
  if (index >= sequence.length) {
    running = false;
    clearTimer();
​
    setTimeout(() => {
      showRetryOnly();
    }, 120);
​
    return;
  }
​
  const currentCard = sequence[index];
​
  cardImg.style.transform = "translateY(22px)";
​
  timer = setTimeout(() => {
    cardImg.src = `cards/${currentCard}.png`;
    cardImg.style.transform = "translateY(-6px)";
    index++;
  }, 20);
​
  let delay = SPEED_START;
​
  if (currentCard === forceThisRun) {
    delay = SPEED_FORCE;
  } else if (index > sequence.length * 0.65) {
    delay = SPEED_END;
  }
​
  timer = setTimeout(runDeck, delay);
}
​
function startDeck() {
  if (running) return;
  if (awaitingRetry) return;
​
  clearTimer();
  running = true;
  index = 0;
​
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
​
  cardImg.style.opacity = 1;
  cardImg.style.transform = "translateY(-6px)";
  cardImg.src = "cards/as.png";
​
  sequence = prepareDeck(forceThisRun);
  timer = setTimeout(runDeck, 140);
}
​
// ===============================
// SWIPE INPUT (3 gestos)
// - swipe NÃO inicia o baralho
// - após 3 swipes: mostra SÓ a carta (stealth) e seta force por 2 rodadas
// - tap NO BARALHO inicia
// ===============================
const SWIPE_MIN = 42;
​
let sx = 0, sy = 0;
let touchStartTarget = null;
let suppressClickUntil = 0;
​
let swipeBuffer = [];
​
function resetSwipeBuffer() {
  swipeBuffer = [];
}
​
function prettyCard(code) {
  const v = code.slice(0, -1);
  const s = code.slice(-1);
​
  const value = (v === "a") ? "A" :
                (v === "x") ? "10" :
                (v === "j") ? "J" :
                (v === "q") ? "Q" :
                (v === "k") ? "K" : v;
​
  const suit = (s === "s") ? "♠" :
               (s === "h") ? "♥" :
               (s === "c") ? "♣" : "♦";
​
  return `${value}${suit}`;
}
​
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
​
  const suitMap = {
    "U":"s",
    "R":"h",
    "D":"c",
    "L":"d"
  };
​
  const value = valueMap[a + b];
  const suit = suitMap[c];
​
  if (!value || !suit) return null;
  return value + suit;
}
​
document.addEventListener("touchstart", (e) => {
  if (running) return;
  if (awaitingRetry) return;
​
  sx = e.touches[0].clientX;
  sy = e.touches[0].clientY;
  touchStartTarget = e.target;
}, { passive: true });
​
document.addEventListener("touchend", (e) => {
  if (running) return;
  if (awaitingRetry) return;
​
  const ex = e.changedTouches[0].clientX;
  const ey = e.changedTouches[0].clientY;
​
  const dx = ex - sx;
  const dy = ey - sy;
​
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
​
  const isSwipe = (absX >= SWIPE_MIN || absY >= SWIPE_MIN);
​
  if (isSwipe) {
    let dir;
    if (absX > absY) dir = dx > 0 ? "R" : "L";
    else dir = dy > 0 ? "D" : "U";
​
    swipeBuffer.push(dir);
​
    // só no 3º swipe: confirma (stealth) mostrando a carta
    if (swipeBuffer.length === 3) {
      const card = decodeSwipe(swipeBuffer);
      resetSwipeBuffer();
​
      if (card) {
        forcedOverride = card;
        forcedRunsLeft = 2;
        showIndicatorStealth(prettyCard(card)); // só a carta, bem discreto
      } else {
        showIndicatorStealth(" "); // falha silenciosa (quase invisível)
      }
    }
​
    suppressClickUntil = Date.now() + 450;
    return;
  }
​
  // TAP (sem swipe): só inicia se foi em cima do baralho
  const now = Date.now();
  if (now < suppressClickUntil) return;
​
  const tappedDeck = deckEl.contains(touchStartTarget);
  if (tappedDeck) {
    suppressClickUntil = Date.now() + 450;
    startDeck();
  }
}, { passive: true });
​
// Desktop: click no baralho inicia
deckEl.addEventListener("click", () => {
  const now = Date.now();
  if (now < suppressClickUntil) return;
  startDeck();
});
