var Bullet = new Phaser.Class({
    Extends: Phaser.GameObjects.Image,
    initialize: function Bullet (scene) {
        Phaser.GameObjects.Image.call(this, scene, 0, 0, 'bullet');
        this.speed = 1;
        this.born = 0;
        this.max = 100;
        this.direction = 0;
        this.distance = 10;
        this.frequency = 3;
        this.xSpeed = 0;
        this.ySpeed = 0;
    },
    fire: function (shooter) {
        this.setPosition(shooter.x+16*Math.cos(shooter.angle*Math.PI/180), shooter.y+16*Math.sin(shooter.angle*Math.PI/180));
        let x = this.x+this.distance*Math.cos(shooter.angle*Math.PI/180);
        let y = this.y+this.distance*Math.sin(shooter.angle*Math.PI/180);
        this.direction = Math.atan( (x-this.x) / (y-this.y));
        if (y >= this.y) {
            this.xSpeed = this.speed*Math.sin(this.direction);
            this.ySpeed = this.speed*Math.cos(this.direction);
        } else {
            this.xSpeed = -this.speed*Math.sin(this.direction);
            this.ySpeed = -this.speed*Math.cos(this.direction);
        }
        this.born = 0;
    },
    update: function (time, delta) {
        this.x += this.xSpeed * delta;
        this.y += this.ySpeed * delta;
        this.born += delta;
        if (this.born > this.max) {
            this.setActive(false);
            this.setVisible(false);
        }
    }
});
