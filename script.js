const deck = [
  "as","5h","9s","2s","qh","3d","qc","8h","6s","5s","9h","kc",
  "2d","jh","3s","8s","6h","xc","5d","kd","2c","3h","8d","5c",
  "ks","jd","8c","xs","kh","jc","7s","xh","ad","4s","7h","4d",
  "ac","9c","js","qd","7d","qs","xd","6c","ah","9d","4c","2h",
  "7d","3c","4h","6d"
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

