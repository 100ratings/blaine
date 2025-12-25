const deck = [
  "as","2s","3s","4s","5s","6s","7s","8s","9s","xs","js","qs","ks",
  "ac","2c","3c","4c","5c","6c","7c","8c","9c","xc","jc","qc","kc",
  "ad","2d","3d","4d","5d","6d","7d","8d","9d","xd","jd","qd","kd",
  "ah","2h","3h","4h","5h","6h","7h","8h","9h","xh","jh","qh","kh"
];

const cardImg = document.getElementById("card");
const stack = document.getElementById("stack");

let forcedCard = "qh"; // <<< carta forçada

const SPEED_START = 60;
const SPEED_FORCE = 420;
const SPEED_END   = 30;

let sequence = [];
let index = 0;
let running = false;

function prepareDeck(force) {
  let temp = deck.filter(c => c !== force);
  let middle = Math.floor(temp.length / 2);
  temp.splice(middle, 0, force);
  return temp;
}

function updateStack() {
  const remaining = sequence.length - index;
  const ratio = remaining / sequence.length;

  const offset = 6 * ratio;

  stack.style.transform = `translate(${offset}px, ${offset}px)`;
  stack.style.opacity = ratio;
}

function runDeck() {
  if (!running) return;

  if (index >= sequence.length) {
    // FECHA O BARALHO (não mostra última carta)
    cardImg.style.opacity = 0;
    stack.style.opacity = 0;
    running = false;
    return;
  }

  cardImg.src = `cards/${sequence[index]}.png`;
  updateStack();

  let delay = SPEED_START;

  if (sequence[index] === forcedCard) {
    delay = SPEED_FORCE;
  } else if (index > sequence.length * 0.65) {
    delay = SPEED_END;
  }

  index++;
  setTimeout(runDeck, delay);
}

function startDeck() {
  if (running) return;

  running = true;
  index = 0;
  cardImg.style.opacity = 1;
  stack.style.opacity = 1;

  sequence = prepareDeck(forcedCard);
  cardImg.src = "cards/as.png";

  setTimeout(runDeck, 120);
}

document.body.addEventListener("click", startDeck);
document.body.addEventListener("touchstart", startDeck);
