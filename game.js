const express = require('express')
const app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var Player = require('./player');

var port = process.env.PORT || 8080

var socket;
var players = [];

app.use(express.static('public'));

function playerById (id) {
  for (let i = 0; i < players.length; i++) {
    if (players[i].id === id) return players[i];
  }
  return false;
}

io
  .of('/')	
  .on('connection', function(socket) {
    socket.on('disconnect', function() {
      var removePlayer = playerById(this.id);
      if (!removePlayer) return;
      players.splice(players.indexOf(removePlayer), 1);
      socket.broadcast.emit('remove player', {id: this.id})
    });
    socket.on('new player', function(data) {
      var newPlayer = new Player(data.x, data.y, data.angle)
      newPlayer.id = this.id
      socket.broadcast.emit('new player', {id: newPlayer.id, x: newPlayer.getX(), y: newPlayer.getY(), angle: newPlayer.getAngle()})
      var i, existingPlayer;
      for (i = 0; i < players.length; i++) {
        existingPlayer = players[i]
        socket.emit('new player', {id: existingPlayer.id, x: existingPlayer.getX(), y: existingPlayer.getY(), angle: existingPlayer.getAngle()})
      }
      players.push(newPlayer);
    });
    socket.on('move player', function (data) {
      var movePlayer = playerById(this.id);
      if (!movePlayer) return;
      movePlayer.setX(data.x);
      movePlayer.setY(data.y);
      movePlayer.setAngle(data.angle);
      socket.broadcast.emit('move player', {id: movePlayer.id, x: movePlayer.getX(), y: movePlayer.getY(), angle: movePlayer.getAngle()})
    });
    socket.on('shoot player', function (data) {
      var shootPlayer = playerById(this.id);
      if (!shootPlayer) return;
      socket.broadcast.emit('shoot player', {id: shootPlayer.id, x: shootPlayer.getX(), y: shootPlayer.getY(), angle: shootPlayer.getAngle() });
    });
  });


http.listen(port, () => {});
