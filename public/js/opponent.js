var RemotePlayer = function (index, game, player, startX, startY, startAngle) {
  var x = startX
  var y = startY
  var angle = startAngle;
  this.health = 3
  this.alive = true
  this.player = game.scene.scenes[0].physics.add.sprite(x, y, "enemy");
  this.player.name = index.toString();
  this.player.body.immovable = true;
  this.player.body.collideWorldBounds = true;
  this.player.angle = angle
  this.lastPosition = { x: x, y: y, angle: angle }
}

RemotePlayer.prototype.update = function () {
  this.lastPosition.x = this.player.x
  this.lastPosition.y = this.player.y
  this.lastPosition.angle = this.player.angle
}

window.RemotePlayer = RemotePlayer
