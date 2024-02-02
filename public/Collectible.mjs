class Collectible {
  constructor({ x, y, value, id }) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.value = value;
  }
}
try {
  module.exports = Collectible;
} catch (e) {}
export default Collectible;
