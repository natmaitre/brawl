var game = new Phaser.Game(
{
    type: Phaser.AUTO, 
    scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    input: {
        gamepad: true
    },
    physics: {
        default: 'arcade',
        arcade: {
	    fps: 20,
            gravity: { y: 0 },
            debug: false
        },
    },
    scene: { 
	preload: preload, 
	create: create, 
	update: update, 
	render: render 
    }
});

function preload () {
  this.load.image("tiles", "assets/tuxmon-sample-32px-extruded.png");
  this.load.tilemapTiledJSON("map", "assets/tuxemon-town.json");
  this.load.image('bullet', 'assets/bullet.png');
  this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 64, frameHeight: 64 })
  this.load.spritesheet('enemy', 'assets/dude.png', { frameWidth: 32, frameHeight: 32 })
  if(!this.scale.isFullscreen){
    this.scale.startFullscreen();
  }
}

var socket = io();
var player;
var playerBullets;
var enemies = [];
var enemiesBullets = [];
var cursors; var spacebar;
var prev = { x: 0, y:0 }; 
var layer;

function create () {
  this.cameras.main.setBounds(0,0,1600,1150);
  this.cameras.main.setZoom(2);
  this.physics.world.setBounds(0,0,1600,1150);

  var map = this.make.tilemap({ key: 'map', tileWidth: 32, tileHeight: 32 });
    
  const tileset = map.addTilesetImage("tuxmon-sample-32px-extruded", "tiles");
  const belowLayer = map.createStaticLayer("Below Player", tileset, 0, 0);
  const worldLayer = map.createStaticLayer("World", tileset, 0, 0);
  const aboveLayer = map.createStaticLayer("Above Player", tileset, 0, 0);

  worldLayer.setCollisionByProperty({ collides: true });
  aboveLayer.setDepth(10);

  layer = map.createStaticLayer(0, tileset, 0, 0);

  var startX = Math.round(Math.random() * (1000) - 500);
  var startY = Math.round(Math.random() * (1000) - 500);
  player = this.physics.add.sprite(128, 512, "dude", "dude").setScale(0.5);
  player.velocity = 50;
  player.setCollideWorldBounds(true);
  this.anims.create({
    key: 'move',
    frames: this.anims.generateFrameNumbers('dude'),
    frameRate: 30,
    repeat: -1
  });
  player.anims.load('move');
  player.anims.play('move');
  this.physics.add.collider(player, worldLayer);

  playerBullets = this.physics.add.group({ classType: Bullet, runChildUpdate: true });
  enemiesBullets[0] = this.physics.add.group({ classType: Bullet, runChildUpdate: true });
  enemiesBullets[1] = this.physics.add.group({ classType: Bullet, runChildUpdate: true });
  enemiesBullets[2] = this.physics.add.group({ classType: Bullet, runChildUpdate: true });
  enemiesBullets[3] = this.physics.add.group({ classType: Bullet, runChildUpdate: true });
  this.cameras.main.startFollow(player);
  this.cameras.main.setDeadzone(100, 100);
  cursors = this.input.keyboard.createCursorKeys();
  spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

  socket.emit('new player', { x:player.x, y: player.y, angle: player.angle })
}

  socket.on('connect', function(data) {
    enemies = [];
  });
  socket.on('disconnected', function () {
  });
  socket.on('new player', function (data) {
    var duplicate = playerById(data.id)
    if (duplicate) return
    enemies.push(new RemotePlayer(data.id, game, player, data.x, data.y, data.angle))
  });
  socket.on('move player', function(data) {
    var movePlayer = playerById(data.id);
    if (!movePlayer) return
    movePlayer.player.x = data.x
    movePlayer.player.y = data.y
    movePlayer.player.angle = data.angle
  });
  socket.on('remove player', function(data) {
    var removePlayer = playerById(data.id);
    if (!removePlayer) return;
    enemies.splice(enemies.indexOf(removePlayer), 1)
  });
  socket.on('shoot player', function(data) {
    var shootPlayer  = playerById(data.id);
    if (!shootPlayer) return;
    var bullet = enemiesBullets[0].get().setActive(true).setVisible(true).setScale(0.5);
    shootPlayer.x = data.x;
    shootPlayer.y = data.y;
    shootPlayer.angle = data.angle;
    if (bullet) bullet.fire(shootPlayer);
  });

function update () {
  for (var i = 0; i < enemies.length; i++) {
    if (enemies[i].alive) {
      enemies[i].update();
      //this.physics.add.collider(player, enemies[i].player);
    }
  }
  player.setVelocity(0);

  if (cursors.left.isDown) player.setVelocityX(-player.velocity);
  else if (cursors.right.isDown) player.setVelocityX(player.velocity);
  if (cursors.up.isDown) player.setVelocityY(-player.velocity);
  else if (cursors.down.isDown) player.setVelocityY(player.velocity);
  if (Phaser.Input.Keyboard.JustDown(spacebar)) {
    var bullet = playerBullets.get().setActive(true).setVisible(true).setScale(0.5);
    if (bullet) {
       bullet.fire(player);
       socket.emit('shoot player', { x: player.x, y: player.y, angle: player.angle});
       //this.physics.add.collider(player, bullet, hit);
    }
  }
  
  var gamepad = this.input.gamepad.gamepads[0];
  if (gamepad) {
    if (gamepad.A) {
        var bullet = playerBullets.get().setActive(true).setVisible(true);
        if (bullet) {
          bullet.fire(player);
          socket.emit('shoot player', { x: player.x, y: player.y, angle: player.angle});
          //this.physics.add.collider(player, bullet, hit);
        }
    }
    if (gamepad.left) player.setVelocityX(-player.velocity);
    else if (gamepad.right) player.setVelocityX(player.velocity);
    if (gamepad.up) player.setVelocityY(-player.velocity);
    else if (gamepad.down) player.setVelocityY(player.velocity);
  }

  if ((player.x !== prev.x) || (player.y !== prev.y)) {
    var angle = Phaser.Math.RAD_TO_DEG * Phaser.Math.Angle.Between(prev.x, prev.y, player.x, player.y);
    player.setAngle(angle);
    socket.emit('move player', { x: player.x, y: player.y, angle: player.angle });
    if (player.anims.isPaused) player.anims.resume();
    prev.x = player.x;
    prev.y = player.y;
  } else {
    player.anims.pause();
  }
}

function render () {
}

function hit(playerHit, bulletHit) {}

function playerById (id) {
  for (var i = 0; i < enemies.length; i++) {
    if (enemies[i].player.name === id) {
      return enemies[i]
    }
  }
  return false
}
