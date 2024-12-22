class Mole {
  constructor(t) {
    this.type = t;
    this.time = Math.random() * type_speed_range[this.type][1] + type_speed_range[this.type][0];
    this.img = type_images[t];
    const { width, height } = { width: canvas.width, height: canvas.height };

    let dim = Math.min(canvas.width, canvas.height)
    this.x = Math.floor(Math.random() * 7);
    this.y = Math.floor(Math.random() * 7);
    this.deleted = false;
    setTimeout(() => {
      this.deleted = true;
    }, this.time * 1000);
  }

  get_x_y() {
    let dim = Math.min(canvas.width, canvas.height);
    return {
      x: dim / 10 + this.x / 7 * (canvas.width - 2 * dim / 10),
      y: dim / 10 + this.y / 7 * (canvas.height - 2 * dim / 10),
    }
  }

  hit(x, y) {
    let dim = Math.min(canvas.width, canvas.height);
    let { x: pos_x, y: pos_y } = this.get_x_y();
    return x > pos_x && y > pos_y && x < pos_x + dim / 10 && y < pos_y + dim / 10;

  }

  display(ctx) {

    let dim = Math.min(canvas.width, canvas.height)
    let { x, y } = this.get_x_y();
    ctx.drawImage(this.img, x, y, dim / 10, dim / 10);
    // ctx.fillStyle = "white";


    // ctx.fillRect(this.x, this.y, 50, 50);
    // ctx.fillStyle = "black";
  }
}

function run_frame() {
  let time = performance.now();
  timer += (last_time - time) / 1000;
  last_time = time;


  // clear screen
  const { width, height } = { width: canvas.width, height: canvas.height };
  ctx.drawImage(bg, 0, 0, width, height);



  // add new mole
  update_probs()
  for (p in type_prob) {
    if (Math.random() < type_prob[p]) {
      moles.push(new Mole(p));
    }
  }

  let n_effects = [];
  for (f in effects) {
    if (!effects[f].finished) {
      n_effects.push(effects[f]);
      let e = effects[f];
      let dim = Math.min(canvas.width, canvas.height);
      ctx.drawImage(e.effect, e.x, e.y, dim / 15, dim / 15);
    }
  }
  effects = n_effects;

  // display moles
  let n_moles = []
  for (m in moles) {
    if (!moles[m].deleted) {
      n_moles.push(moles[m])
    }
    moles[m].display(ctx);
  }

  moles = n_moles


  let max_dim = Math.max(canvas.width, canvas.height);
  ctx.font = `${Math.max(max_dim / 40, 10)}px serif`
  ctx.fillText(`Tid kvar: ${timer.toFixed(2)} seconds`, max_dim / 20, max_dim / 20)

  ctx.fillText(`Träffar: ${points}`, max_dim / 20, max_dim / 10);

  // call next frame
  if (timer > 0) {
    setTimeout(run_frame, 10);
  } else {
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

    document.getElementById("game_over_menu").style.display = "flex";

    document.getElementById("score_shower").innerHTML = points;
  }
}



const canvas = document.getElementById("gameCanvas");

canvas.onclick = (e) => {
  console.log(e)
  let x = e.clientX;
  let y = e.clientY;
  let hit = false;
  for (m in moles) {
    if (moles[m].hit(x, y)) {
      if (moles[m].type == 5) {
        timer -= 10;
        hits_in_row = 0;
        moles[m].deleted = true;
      } else {
        hit = true;
        moles[m].deleted = true;
        points += 1;
      }
    }
  }
  if (hit) {
    let img = new Image();
    img.src = "assets/splat.png";
    let item = { effect: img, x: x, y: y, finished: false };
    effects.push(item);
    play_splat()
    hits_in_row += 1;
    if (hits_in_row >= 5) {
      hits_in_row -= 5;
      timer += 5;
    }
    setTimeout(() => {
      item.finished = true;
    }, 500);
  } else {
    hits_in_row = 0;
    let img = new Image();
    img.src = "assets/miss.webp";
    let item = { effect: img, x: x, y: y, finished: false };
    effects.push(item);

    play_miss()
    setTimeout(() => {
      item.finished = true;
    }, 200);
  }
}



let bg = new Image();
bg.src = "assets/bg.webp";

const ctx = canvas.getContext('2d');

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
});
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;



bg.addEventListener("load", () => {
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
});

const type_image_paths = ["assets/mamma.png", "assets/edit.png", "assets/vidar.png", "assets/pappa.png", "assets/tage.png", "assets/ebbot.jpg"];

let type_images = [];
for (i in type_image_paths) {
  type_images.push(new Image());
  type_images[i].src = type_image_paths[i];
}

let type_prob = [0.02, 0.002, 0.0008, 0.002, 0.02, 0.008];

function update_probs() {
  if (points == 0) {
    return;
  }
  type_prob[4] = 0.002 * (points ** (1 / 3));
  type_prob[1] = 0.002 * (points ** (1 / 3));
  type_prob[2] = 0.0008 * (points ** (1 / 1.2));

}

const type_speed_range = [[1.5, 1], [0.8, 0.5], [0.3, 0.7], [1.5, 0], [0.5, 1.5], [1, 1]];

let points = 0;

// init mole list
let moles = []

let effects = [];

let timer = 60;

let hits_in_row = 0;

const miss_audio = document.getElementById("miss_audio")
const splat_audio = document.getElementById("splat_audio")
const game_audio = document.getElementById("game_audio")


let started_sound = 0;

setInterval(() => {
  if (performance.now() - started_sound > 200) {
    miss_audio.volume = 0;
    splat_audio.volume = 0;
  };
}, 20);

function play_splat() {
  if (splat_audio.paused) {
    splat_audio.play();
  }
  splat_audio.currentTime = 0;
  splat_audio.volume = 1;
  miss_audio.volume = 0;
  started_sound = performance.now();
}

function play_miss() {
  if (miss_audio.paused) {
    miss_audio.play();
  }
  miss_audio.currentTime = 0;
  miss_audio.volume = 1;
  splat_audio.volume = 0;
  started_sound = performance.now();
}

let time = performance.now();
let last_time = performance.now();
function init() {
  game_audio.currentTime = 0;
  game_audio.play();
  points = 0;

  // init mole list
  moles = [];

  hits_in_row = 0;

  effects = [];

  timer = 60;

  time = performance.now();
  last_time = time;
}

let start_button = document.getElementById("start_button");
start_button.onclick = () => {
  document.getElementById("start_menu").style.display = "none";
  // start game

  init();
  run_frame();
}

let restart_button = document.getElementById("restart_button");

restart_button.onclick = () => {
  document.getElementById("game_over_menu").style.display = "none";
  init();
  run_frame();
}


