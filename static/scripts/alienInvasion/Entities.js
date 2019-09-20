class Entity extends Phaser.GameObjects.Sprite{
    constructor(scene, x, y, key, type){
        super(scene, x, y, key); 
        this.scene = scene
        this.scene.add.existing(this); 
        this.scene.physics.world.enableBody(this, 0); 
        this.setData("type", type); 
        this.setData("isDead", false); 
    }

    explode(canDestroy) {
        if (!this.getData("isDead")) {
          // Set the texture to the explosion image, then play the animation
          this.setTexture("sprExplosion");  // this refers to the same animation key we used when we added this.anims.create previously
          this.play("sprExplosion"); // play the animation
          // pick a random explosion sound within the array we defined in this.sfx in SceneMain
          this.scene.sfx.explosions[Phaser.Math.Between(0, this.scene.sfx.explosions.length - 1)].play();
          if (this.shootTimer !== undefined) {
            if (this.shootTimer) {
              this.shootTimer.remove(false);
            }
          }
          this.setAngle(0);
          this.body.setVelocity(0, 0);
          this.on('animationcomplete', function() {
            if (canDestroy) {
              this.destroy();
            }
            else {
              this.setVisible(false);
            }
          }, this);
          this.setData("isDead", true);
        }
    }
}

class Player extends Entity{
    constructor(scene, x, y, key){
        super(scene, x, y, key, "Player"); 
        this.setData("speed", 200); 
        this.setData("isShooting", false);
        this.setData("timerShootDelay", 5);
        this.setData("timerShootTick", this.getData("timerShootDelay") - 1);
    }

    moveUp(){
        this.body.velocity.y = -this.getData("speed"); 
    }

    moveDown(){
        this.body.velocity.y = this.getData("speed"); 
    }

    moveLeft(){
        this.body.velocity.x = -this.getData("speed"); 
    }

    moveRight(){
        this.body.velocity.x = this.getData("speed"); 
    }

    onDestroy() {
        this.scene.time.addEvent({ // go to game over scene
          delay: 1000,
          callback: function() {
            this.scene.scene.start("SceneGameOver");
          },
          callbackScope: this,
          loop: false
        });
      }

    update(){
        this.body.setVelocity(0, 0);
        this.x = Phaser.Math.Clamp(this.x, 0, this.scene.game.config.width); 
        this.y = Phaser.Math.Clamp(this.y, 0, this.scene.game.config.width); 
        if (this.getData("isShooting")) {
            if (this.getData("timerShootTick") < this.getData("timerShootDelay")) {
              this.setData("timerShootTick", this.getData("timerShootTick") + 1); // every game update, increase timerShootTick by one until we reach the value of timerShootDelay
            }
            else { // when the "manual timer" is triggered:
              var laser = new PlayerLaser(this.scene, this.x, this.y);
              this.scene.playerLasers.add(laser);
            
              this.scene.sfx.laser.play(); // play the laser sound effect
              this.setData("timerShootTick", 0);
            }
        }
        
    }
}

class PlayerLaser extends Entity{
    constructor(scene, x, y){
        super(scene, x, y, "sprLaserPlayer")
        this.body.velocity.y = -300; 
    }
}

class EnemyLaser extends Entity{
    constructor(scene, x, y){
        super(scene, x, y, "sprLaserEnemy0");
        this.body.velocity.y = 200; 
    }

}

class SmallAlien extends Entity{
    constructor(scene, x, y, key){
        super(scene, x, y, "smallAlien", "SmallAlien"); 
        this.body.velocity.y = Phaser.Math.Between(50, 100); 
        this.shootTimer = this.scene.time.addEvent({
            delay: 1000,
            callback: function() {
                if(Phaser.Math.Between(0, 10) <= 4){
                    var laser = new EnemyLaser(
                        this.scene,
                        this.x,
                        this.y
                    );
                    laser.setScale(this.scaleX);
                    this.scene.enemyLasers.add(laser); 
                }
            },
            callbackScope: this,
            loop: true
        });
    }

    onDestroy(){
        if (this.shootTimer !== undefined) {
            if (this.shootTimer) {
              this.shootTimer.remove(false);
            }
        }
    }
}

class BigAlien extends Entity{
    constructor(scene, x, y, key){
        super(scene, x, y, "bigAlien", "BigAlien"); 
        this.body.velocity.y = Phaser.Math.Between(20, 40); 
    }
}

class ScrollingBackground {
    constructor(scene, key, velocityY) {
      this.scene = scene;
      this.key = key;
      this.velocityY = velocityY;
  
      this.layers = this.scene.add.group();
  
      this.createLayers();
    }
  
    createLayers() {
      for (var i = 0; i < 2; i++) {
        // creating two backgrounds will allow a continuous flow giving the illusion that they are moving.
        var layer = this.scene.add.sprite(0, 0, this.key);
        layer.y = (layer.displayHeight * i);
        var flipX = Phaser.Math.Between(0, 10) >= 5 ? -1 : 1;
        var flipY = Phaser.Math.Between(0, 10) >= 5 ? -1 : 1;
        layer.setScale(flipX * 2, flipY * 2);
        layer.setDepth(-5 - (i - 1));
        this.scene.physics.world.enableBody(layer, 0);
        layer.body.velocity.y = this.velocityY;
  
        this.layers.add(layer);
      }
    }
  
    update() {
      if (this.layers.getChildren()[0].y > 0) {
        for (var i = 0; i < this.layers.getChildren().length; i++) {
          var layer = this.layers.getChildren()[i];
          layer.y = (-layer.displayHeight) + (layer.displayHeight * i);
        }
      }
    }
}