require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const socketIO = require("socket.io");
const helmet = require("helmet");
const http = require("http");
const { v4: uuidv4 } = require("uuid");
const runner = require("./test-runner.js");
const fccTestingRoutes = require("./routes/fcctesting.js");

const app = express();

app.use("/public", express.static(process.cwd() + "/public"));
app.use("/assets", express.static(process.cwd() + "/assets"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(helmet.noCache());
app.use(helmet.hidePoweredBy({ setTo: "PHP 7.4.3" }));

app.route("/").get(function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.use(function (req, res, next) {
  res.status(404).type("text").send("Not Found");
});

const portNum = process.env.PORT || 3000;

const startServer = async () => {
  const server = app.listen(portNum, () => {
    console.log(`Listening on port ${portNum}`);
    if (process.env.NODE_ENV === "test") {
      console.log("Running Tests...");
      setTimeout(function () {
        try {
          runner.run();
        } catch (error) {
          console.log("Tests are not valid:");
          console.error(error);
        }
      }, 1500);
    }
  });

  const io = socketIO(server);

  // Use dynamic import for ESM compatibility
  const PlayerModulePromise = import("./public/Player.mjs");
  const CollectibleModulePromise = import("./public/Collectible.mjs");

  // Resolve the promises to get the actual modules
  const PlayerModule = await PlayerModulePromise;
  const CollectibleModule = await CollectibleModulePromise;

  // Instansiasi objek Player
  const Player = PlayerModule.default;
  const player = new Player({ x: 0, y: 0, score: 0, id: "exampleId" });

  // Instansiasi objek Collectible
  const Collectible = CollectibleModule.default;
  const collectible = new Collectible({
    x: 0,
    y: 0,
    value: 1,
    id: "exampleId",
  });

  const players = {};
  const collectibles = {};

  io.on("connection", (socket) => {
    console.log("Connect", socket.id);

    // Membuat player segera setelah koneksi baru
    const player = new Player({
      x: Math.max(0, Math.min(Math.random() * 800, 800)),
      y: Math.max(0, Math.min(Math.random() * 600, 600)),
      score: 0,
      id: socket.id,
    });

    // Batasi posisi pemain ke dalam batas-batas kanvas
    player.x = Math.min(Math.max(player.x, 0), 800);
    player.y = Math.min(Math.max(player.y, 0), 600);

    players[socket.id] = player;

    // Membuat collectible segera setelah pemain dibuat
    const newCollectible = new Collectible({
      x: Math.max(0, Math.min(Math.random() * 800, 800)),
      y: Math.max(0, Math.min(Math.random() * 600, 600)),
      value: 1,
      id: uuidv4(),
    });

    console.log("New collectible created:", newCollectible);

    collectibles[newCollectible.id] = newCollectible;
    io.emit("newCollectible", newCollectible);

    socket.emit("initialState", { players, collectibles });
    io.emit("newPlayer", player);

    socket.on("move", ({ direction, speed }) => {
      // Perbarui posisi pemain sesuai arah dan kecepatan
      switch (direction) {
        case "up":
          player.y -= speed;
          break;
        case "down":
          player.y += speed;
          break;
        case "left":
          player.x -= speed;
          break;
        case "right":
          player.x += speed;
          break;
        default:
          return;
      }

      // Batasi posisi pemain ke dalam batas-batas kanvas
      player.x = Math.max(0, Math.min(player.x, 800));
      player.y = Math.max(0, Math.min(player.y, 600));

      // Kabari semua klien tentang pembaruan posisi pemain
      io.emit("updatePlayer", player);
    });

    socket.on("createCollectible", () => {
      const newCollectible = new Collectible({
        x: Math.max(0, Math.min(Math.random() * 800, 800)),
        y: Math.max(0, Math.min(Math.random() * 600, 600)),
        value: 1,
        id: uuidv4(),
      });

      console.log("New collectible created:", newCollectible);

      collectibles[newCollectible.id] = newCollectible;
      io.emit("newCollectible", newCollectible);
    });

    socket.on("disconnect", () => {
      delete players[socket.id];
      io.emit("disconnectPlayer", socket.id);
    });
  });
};

startServer().catch((error) => console.error(error));

module.exports = app;
