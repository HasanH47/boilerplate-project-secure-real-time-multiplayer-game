// game.mjs
import Player from "./Player.mjs";
import Collectible from "./Collectible.mjs";
const socket = io();

document.addEventListener("keydown", (event) => {
  let direction = "";
  let speed = 5; // Ubah kecepatan sesuai kebutuhan

  switch (event.key) {
    case "ArrowUp":
    case "w":
      direction = "up";
      break;
    case "ArrowDown":
    case "s":
      direction = "down";
      break;
    case "ArrowLeft":
    case "a":
      direction = "left";
      break;
    case "ArrowRight":
    case "d":
      direction = "right";
      break;
    default:
      return;
  }

  // Kirim pesan gerakan ke server
  socket.emit("move", { direction, speed });
});

export default class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.players = {};
    this.collectibles = {};
  }

  // Menambahkan fungsi untuk membatasi posisi pemain ke dalam batas-batas kanvas
  constrainPlayerPosition(player) {
    player.x = Math.max(0, Math.min(player.x, this.canvas.width));
    player.y = Math.max(0, Math.min(player.y, this.canvas.height));
  }

  // Menambahkan fungsi untuk membatasi posisi kolektibel ke dalam batas-batas kanvas
  constrainCollectiblePosition(collectible) {
    collectible.x = Math.max(0, Math.min(collectible.x, this.canvas.width));
    collectible.y = Math.max(0, Math.min(collectible.y, this.canvas.height));
  }

  // Menambahkan logika pembatasan posisi pemain saat menerima pesan "newPlayer" dan "updatePlayer"
  handleNewPlayer(newPlayer) {
    this.constrainPlayerPosition(newPlayer);
    this.players[newPlayer.id] = newPlayer;
  }

  handleUpdatePlayer(updatedPlayer) {
    this.constrainPlayerPosition(updatedPlayer);
    this.players[updatedPlayer.id] = updatedPlayer;
  }

  // Menambahkan logika pembatasan posisi kolektibel saat menerima pesan "newCollectible"
  handleNewCollectible(collectible) {
    this.constrainCollectiblePosition(collectible);
    this.drawCollectibles(collectible);
  }

  init() {
    socket.on("initialState", ({ players, collectibles }) => {
      this.players = players;
      this.collectibles = collectibles;
    });

    socket.on("newPlayer", (newPlayer) => {
      this.handleNewPlayer(newPlayer);
    });

    socket.on("updatePlayer", (updatedPlayer) => {
      this.handleUpdatePlayer(updatedPlayer);
    });

    socket.on("newCollectible", (collectible) => {
      console.log("New collectible received:", collectible);
      this.handleNewCollectible(collectible);
    });

    socket.on("removeCollectible", (collectibleId) => {
      delete this.collectibles[collectibleId];
    });

    socket.on("disconnectPlayer", (playerId) => {
      delete this.players[playerId];
    });

    this.gameLoop();
  }

  gameLoop() {
    this.drawPlayers();
    this.drawCollectibles();
    requestAnimationFrame(() => this.gameLoop());
  }

  drawPlayers() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    Object.values(this.players).forEach((player) => {
      this.context.fillStyle = "white";
      this.context.beginPath();
      this.context.arc(player.x, player.y, 10, 0, 2 * Math.PI);
      this.context.fill();
    });
  }

  drawCollectibles() {
    Object.values(this.collectibles).forEach((collectible) => {
      this.constrainCollectiblePosition(collectible);
      this.context.fillStyle = "gold";
      this.context.beginPath();
      this.context.arc(collectible.x, collectible.y, 10, 0, 2 * Math.PI);
      this.context.fill();
    });
  }
}
