class Player {
  constructor({ x, y, score, id }) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.score = score;
  }

  movePlayer(dir, speed) {
    // Implement player movement logic
    switch (dir) {
      case "up":
        this.y -= speed;
        break;
      case "down":
        this.y += speed;
        break;
      case "left":
        this.x -= speed;
        break;
      case "right":
        this.x += speed;
        break;
      default:
        // Handle invalid direction
        break;
    }
  }

  collision(item) {
    // Implement collision detection logic
    const distance = Math.sqrt((this.x - item.x) ** 2 + (this.y - item.y) ** 2);
    return distance < 20; // Adjust the collision distance as needed
  }

  calculateRank(arr) {
    // Implement rank calculation logic
    const sortedPlayers = [...arr].sort((a, b) => b.score - a.score);
    const currentRanking =
      sortedPlayers.findIndex((player) => player.id === this.id) + 1;
    return `Rank: ${currentRanking}/${arr.length}`;
  }
}
try {
  module.exports = Player;
} catch (e) {}
export default Player;
