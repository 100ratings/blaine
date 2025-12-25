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
// ELEMENTOS
// ===============================
const cardImg = document.getElementById("card");
const stack   = document.getElementById("stack");

// ===============================
// CONFIGURAÇÃO
// ===============================
let forcedCard = "qh"; // <<< carta forçada

const SPEED_START = 60;
const SPEED_FORCE = 420;
const SPEED_END   = 30;

// ===============================
// ESTADO
// ===============================
let sequence = [];
let index = 0;
let running = false;

// ===============================
// PREPARA BARALHO (FORÇA NO MEIO)
// ===============================
function prepareDeck(force) {
  let temp = deck.filter(c => c !== force);
  let middle = Math.floor(temp.length / 2);
  temp.splice(middle, 0, force);
  return temp;
}

// ===============================
// ATUALIZA ESPESSURA DO BARALHO
// ===============================
function updateStack() {
  const remaining = sequence.length - index;
  const ratio = remaining / sequence.length;

  const x = 10 * ratio;
  const y = -14 * ratio;

  stack.style.transform =
    `translate(${x}px, ${y}px) skewY(-2deg)`;

  stack.style.opacity = ratio;
}

// ===============================
// ANIMAÇÃO PRINCIPAL
// ===============================
function runDeck() {
  if (!running) return;

  // FINAL — fecha o baralho
  if (index >= sequence.length) {
    running = false;

    setTimeout(() => {
      cardImg.src = "cards/as.png";
      cardImg.style.opacity = 1;
      cardImg.style.transform = "translateY(-6px)";
      stack.style.opacity = 1;
      stack.style.transform = "translate(10px, -14px) skewY(-2deg)";
    }, 120);

    return;
  }

  // carta "caindo para a frente"
  cardImg.style.transform = "translateY(22px)";

  setTimeout(() => {
    cardImg.src = `cards/${sequence[index]}.png`;
    cardImg.style.transform = "translateY(-6px)";
    updateStack();
  }, 20);

  let delay = SPEED_START;

  if (sequence[index] === forcedCard) {
    delay = SPEED_FORCE;
  } else if (index > sequence.length * 0.65) {
    delay = SPEED_END;
  }

  index++;
  setTimeout(runDeck, delay);
}

// ===============================
// START / RESET
// ===============================
function startDeck() {
  if (running) return;

  running = true;
  index = 0;

  cardImg.style.opacity = 1;
  cardImg.style.transform = "translateY(-6px)";
  stack.style.opacity = 1;
  stack.style.transform = "translate(10px, -14px) skewY(-2deg)";

  sequence = prepareDeck(forcedCard);
  cardImg.src = "cards/as.png";

  setTimeout(runDeck, 140);
}

// ===============================
// INTERAÇÃO
// ===============================
document.body.addEventListener("click", startDeck);
document.body.addEventListener("touchstart", startDeck);
