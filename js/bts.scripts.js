
function CameraFollow(cam, follow) {
    var self = this;
    self.cam = cam;
    self.follow = follow;
    self.update = function (delta) {
        if (cam.transform == null || follow.transform == null)
            return;

        cam.transform.pos.x = follow.transform.pos.x - (cam.screenX / 2.0);
        cam.transform.pos.y = follow.transform.pos.y - (cam.screenY / 2.0);
    };
}

var BLOCK_TYPE = {
    DIRT: 0,
    EMERALD: 1,
    RUBY: 2,
    SAPPHIRE: 3,
    STONE: 4,
    SURFACE:5
};

var THRESH = 4;

function Toad() {
    var self = this;
    self.gameObject = null;

    self.getGameObject = function () {

    };
}


function Player(obj, input, levelPos, axeSheet) {
    var self = this;
    self.obj = obj;
    self.world = null;
    self.input = input;
    self.level = 0;
    self.levelPos = levelPos;
    self.isFalling = false;    
    self.velocity = new Vector2(0.0, 0.0);
    self.destination = new Vector2(0.0, 0, 0);
    self.isGoing = false;
    self.isClimbing = false;
    self.onBlock = null;
    self.afterClimb = "";
    self.onLevelChange = new function () { };
    self.qIsDown = false;
    self.eIsDown = false;
    self.digMode = false;
    self.isDigging = false;
    self.onMove = new function () { };
    self.axeSheet = axeSheet;
    self.axeSheet.render = false;
    self.axeSheetIdx = 0;
    self.lastUpdate = 0;
    self.dirtCount = 0;
    self.stoneCount = 0;
    self.saphCount = 0;
    self.rubyCount = 0;
    self.emeraldCount = 0;

    self.update = function (delta) {       

        if (self.isClimbing) {
            var change = self.velocity.y * delta;
            self.obj.transform.pos.y += change;
            var distance = self.obj.transform.pos.distance(self.destination);
            if (distance < THRESH) {
                self.obj.transform.pos.y = self.destination.y;
                self.isClimbing = false;
                self.go(self.afterClimb);                
            }
            return;
        }

        if (self.isFalling) {
            self.obj.transform.pos.y += self.velocity.y * delta;
            var distance = self.obj.transform.pos.distance(self.destination);
            if (distance < THRESH) {
                self.obj.transform.pos.y = self.destination.y;
                self.isFalling = false;
                self.onBlock = self.world.getBlock(self.level, self.levelPos);
                if (self.onBlock == null) {
                    self.fall();
                }
            }
            return;
        };

        if (self.isGoing) {
            self.obj.transform.pos.x += self.velocity.x * delta;
            self.obj.transform.pos.y += self.velocity.y * delta;
            var distance = self.obj.transform.pos.distance(self.destination);
            if (distance < THRESH) {
                self.obj.transform.pos.x = self.destination.x;
                self.obj.transform.pos.y = self.destination.y;
                self.isGoing = false;
                self.onBlock = self.world.getBlock(self.level, self.levelPos);
                if (self.onBlock == null) {
                    self.fall();
                }                
            }           
            return;
        };

        if (self.onBlock != null)
            self.obj.zOrder = self.onBlock.gameObject.zOrder + 1000;

        if (self.onBlock.isDestroyed) {
            self.fall();
            return;
        }

        var keys = self.input.keyboardState.keys;

        if (keys[KEYS.Q].isDown() && !self.qIsDown) {
            self.world.showUpLevel();
            self.qIsDown = true;
        }
        if (keys[KEYS.Q].isUp()) {
            self.qIsDown = false;
        }

        if (keys[KEYS.E].isDown() && !self.eIsDown) {
            self.world.hideDownLevel();
            self.eIsDown = true;
        }
        if (keys[KEYS.E].isUp()) {
            self.eIsDown = false;
        }

        self.lastUpdate += delta;
        if (self.lastUpdate > 80) {
            self.axeSheetIdx++;
            if (self.axeSheetIdx > 2) {
                self.axeSheetIdx = 0;
                if (self.isDigging)
                    self.obj.soundRenderer.play("mine");
            }
            self.axeSheet.setDrawIdx(self.axeSheetIdx);
            self.lastUpdate = 0;
        };

        self.isDigging = false;
        self.axeSheet.render = false;

        if (keys[KEYS.W].isDown()) {
            self.obj.spriteRenderer.sprites[0].setDrawIdx(1);
            self.go("NW", delta);
            return;
        } else if (keys[KEYS.A].isDown()) {
            self.obj.spriteRenderer.sprites[0].setDrawIdx(1);
            self.go("SW", delta);
            return;
        } else if (keys[KEYS.S].isDown()) {
            self.obj.spriteRenderer.sprites[0].setDrawIdx(0);
            self.go("SE", delta);
            return;
        } else if (keys[KEYS.D].isDown()) {
            self.obj.spriteRenderer.sprites[0].setDrawIdx(0);
            self.go("NE", delta);
            return;
        }     

        //if (keys[KEYS.SPACE].isDown())
        //self.onBlock.mine(0.1 * delta);
    };

    self.toggleDigMode = function () {
        self.digMode = !self.digMode;
    };

    self.go = function (dir, delta) {
        
        if (self.level > 0) {
            var newPos = new Vector2(self.levelPos.x, self.levelPos.y);
            if (dir == "NW") {
                newPos.x -= 1;
            } else if (dir == "NE") {
                newPos.y -= 1;
            } else if (dir == "SW") {
                newPos.y += 1;
            } else if (dir == "SE") {
                newPos.x += 1;
            }
            var block = self.world.getBlock(self.level - 1, newPos);
            if (block != null) {
                //if (self.digMode) {
                self.isDigging = true;
                var result = block.mine(.1 * delta);
                if (result)
                    self.obj.soundRenderer.play("mined");

                self.axeSheet.render = true;
                //} else {
                    //self.climb(dir);
                //}
                return;
            }
        }

        self.isGoing = true;

        if (dir == "NW") {
            self.velocity.y = -0.1;
            self.destination.y = self.obj.transform.pos.y - 20;            
            self.velocity.x = -0.2;
            self.destination.x = self.obj.transform.pos.x - 40;
            self.levelPos.x -= 1;
        } else if (dir == "NE") {
            self.velocity.y = -0.1;
            self.destination.y = self.obj.transform.pos.y - 20;
            self.levelPos.y -= 1;
            self.velocity.x = 0.2;
            self.destination.x = self.obj.transform.pos.x + 40;
        } else if (dir == "SW") {
            self.velocity.y = 0.1;
            self.destination.y = self.obj.transform.pos.y + 20;
            self.levelPos.y += 1;
            self.velocity.x = -0.2;
            self.destination.x = self.obj.transform.pos.x - 40;
        } else if (dir == "SE") {
            self.velocity.y = 0.1;
            self.destination.y = self.obj.transform.pos.y + 20;
            self.velocity.x = 0.2;
            self.levelPos.x += 1;
            self.destination.x = self.obj.transform.pos.x + 40;
        }
        self.onMove();

        var toBlock = self.world.getBlock(self.level, self.levelPos);
        if (toBlock != null)
            self.obj.zOrder = toBlock.gameObject.zOrder + 1000;
    };

    self.climb = function (dir) {
        self.afterClimb = dir;
        self.isClimbing = true;
        self.velocity.y = -0.05;
        self.destination.y = self.obj.transform.pos.y - 40;
        var prevLevel = self.level;
        self.level -= 1;
        self.onLevelChange(prevLevel);
        self.onMove();
    };

    self.fall = function () {
        self.isFalling = true;
        self.destination.y = self.obj.transform.pos.y + 40;
        self.velocity.y = 0.3;
        var prevLevel = self.level;
        self.level += 1;
        self.onLevelChange(prevLevel);
        self.onMove();
        var toBlock = self.world.getBlock(self.level, self.levelPos);
        if (toBlock != null)
            self.obj.zOrder = toBlock.gameObject.zOrder + 1000;
    };
};

function Block(levelPoint, type, level, texture, isClimbable) {
    var self = this;
    self.isHole = type == null;
    self.levelPoint = levelPoint;
    self.type = type;
    self.hp = 100;
    self.isDestroyed = false;
    self.gameObject = null;
    self.sprite = null;
    self.spriteH = null;
    self.spriteRenderer = null;
    self.level = level;
    self.offset = new Vector2(0, self.level * 40);
    self.xLoc = self.offset.x + (self.levelPoint.x * 40) - (self.levelPoint.y * 40);
    self.yLoc = self.offset.y + (self.levelPoint.x * 20) + (self.levelPoint.y * 20);
    self.isClimbable = isClimbable;
    self.getGameObject = function () {
        if (self.gameObject != null)
            return self.gameObject;
        self.gameObject = new GameObject((-1000 * (self.level + 1)) - (-self.levelPoint.y - self.levelPoint.x - self.levelPoint.y));
        self.gameObject.addComponent(new Transform(self.xLoc, self.yLoc));
        if (self.type == null) {
            self.sprite = new Sprite("block" + self.levelPoint.x + self.levelPoint.y, "sprites/hole.png");
        } else if (self.type == 23) {
            self.sprite = new Sprite("block" + self.levelPoint.x + self.levelPoint.y, "sprites/floor.png");
        } else  {
            self.sprite = new SpriteSheet("block" + self.levelPoint.x + self.levelPoint.y, "sprites/blocks.png", 3, 2);
            self.sprite.setDrawIdx(self.type);
        }
        self.spriteH = new Sprite("blockHighlight" + self.levelPoint.x + self.levelPoint.y, "sprites/highlight.png");
        self.spriteRenderer = new SpriteRenderer();
        self.spriteRenderer.addSprite(self.sprite);
        self.gameObject.addComponent(self.spriteRenderer);
        return self.gameObject;
    };
    self.supports = function (pos) {
        if (self.isDestroyed)
            return false;

        var distance = Math.sqrt(Math.pow(pos.x - self.gameObject.transform.pos.x, 2) +
                       Math.pow((pos.y + 40) - self.gameObject.transform.pos.y, 2));

        return distance < 25;
    };
    self.collidesWith = function (pos) {
        if (self.isDestroyed)
            return false;

        var distance = Math.sqrt(Math.pow(pos.x - self.gameObject.transform.pos.x, 2) +
                       Math.pow((pos.y) - self.gameObject.transform.pos.y, 2));

        return distance < 45;
    };
    self.mine = function (dmg) {
        self.hp -= dmg;
        if (self.hp < 0) {
            self.destroy();
            return true;
        };
        return false;
    };
    self.destroy = function () {
        self.isDestroyed = true;
        //self.spriteRenderer.render = false;
        self.spriteRenderer.sprites = [];
        self.spriteRenderer.addSprite(self.spriteH);
        
    };
    self.toggleTransparent = function (value) {
        if (self.spriteRenderer != null)
            self.spriteRenderer.toggleTransparent(value);
    };
    self.toggleRender = function (value) {
        if (!self.isDestroyed)
            self.spriteRenderer.render = value;
    };
    self.toggleHL = function (value) {
        if (self.isDestroyed)
            self.spriteRenderer.render = value;
    };

};

function Level(lvl, dim, levelMap) {
    var self = this;
    self.blocks = [];
    self.dim = dim;
    self.lvl = lvl;
    self.getRandomBlockType = function () {
        if (self.lvl == 0)
            return BLOCK_TYPE.SURFACE;

        var result = Math.floor(Math.random() * (100))
        if (result < 70)
            return BLOCK_TYPE.DIRT;
        if (result > 70 && result <= 85)
            return BLOCK_TYPE.STONE;
        if (result > 85 && result <= 92)
            return BLOCK_TYPE.RUBY;
        if (result > 92 && result <= 98)
            return BLOCK_TYPE.SAPPHIRE;
        if (result > 98 && result <= 100)
            return BLOCK_TYPE.EMERALD;

        return BLOCK_TYPE.DIRT;
    };
    self.lookupTexture = function (code) {
        if (code == 'l') {
            return "sprites/surfaceLadder.png";
        } else if (code == 's') {
            return "sprites/surface2.png";
        } else if (code == 'd') {
            return "sprites/dirt.png";
        } else if (code == 't') {
            return "sprites/stoneGray.png";
        } else if (code == 'x') {
            return "sprites/treasure.png";
        } else if (code == 'f') {
            return "sprites/floor.png";
        }
    };

    //for (var x = 0; x < levelMap.length; x++) {
    //    var col = levelMap[x];
    //    var column = [];
    //    for (var y = 0; y < col.length; y++) {
    //        var block = col[y];
    //        if (block == ' ') {
    //            column.push(null);
    //        } else {
    //            column.push(new Block(new Vector2(x, y), self.getRandomBlockType(), self.lvl, self.lookupTexture(block), block == 'l'));
    //        }
    //    };
    //    self.blocks.push(column);
    //};

    self.getExit = function (entry) {        
        var x = Math.floor(Math.random() * self.dim);
        if (x == 0) { x++; } else if (x == self.dim - 1) { x--; }
        var y = Math.floor(Math.random() * self.dim);
        if (y == 0) { y++; } else if (y == self.dim - 1) { y--; }
        if (x == entry.x && y == entry.y)
            return self.getExit(entry);
        return new Vector2(x, y);
    }

    self.generateLevel = function (entry) {
        var exit = entry;
        if (self.lvl != 0 && self.lvl % 2 == 1) {
            exit = self.getExit(entry);
        }

        for (var x = 0; x < dim; x++) {
            var column = [];
            for (var y = 0; y < dim; y++) {
                if (x == entry.x && y == entry.y) {
                    if (self.lvl % 2 == 0)
                        column.push(new Block(new Vector2(x, y), null, self.lvl));
                    else
                        column.push(null);
                } else if (x == exit.x && y == exit.y) {
                    column.push(null);
                } else if (self.lvl == 0) {
                    column.push(new Block(new Vector2(x, y), self.getRandomBlockType(), self.lvl));
                } else if (self.lvl % 2 == 0) {
                    if (y == 0 || y == dim - 1 || x == 0 || x == dim - 1) {
                        column.push(new Block(new Vector2(x, y), BLOCK_TYPE.DIRT, self.lvl));
                    }
                    else {
                        column.push(new Block(new Vector2(x, y), 23, self.lvl));
                    }
                } else {
                    if (y == 0 || y == dim - 1 || x == 0 || x == dim - 1) {
                        column.push(new Block(new Vector2(x, y), BLOCK_TYPE.DIRT, self.lvl));
                    }
                    else {
                        column.push(new Block(new Vector2(x, y), self.getRandomBlockType(), self.lvl));
                    }
                }
            }
            self.blocks.push(column);
        }

        return exit;
    };

};

function World(levels, levelDim, player) {
    var self = this;
    self.player = player;
    self.player.world = this;    
    self.levels = [];
    self.levelVis = -1;

    var entry = null;
    for (var l = 0; l < levels; l++) {
        if (entry == null) {
            var x = Math.floor(Math.random() * levelDim);
            if (x == 0) { x++; } else if (x == levelDim - 1) { x--; }
            var y = Math.floor(Math.random() * levelDim);
            if (y == 0) { y++; } else if (y == levelDim - 1) { y--; }
            var entry = new Vector2(x, y);
        }
        var level = new Level(l, levelDim);
        entry = level.generateLevel(entry);
        self.levels.push(level);
    }

    //for (var l = 0; l < levelMaps.length; l++) {
    //    var levelMap = levelMaps[l];
    //    self.levels.push(new Level(l, levelDim, levelMap));
    //}
    self.levelDim = levelDim;

    self.getBlocks = function () {
        var blocks = [];
        self.levels.forEach(function (level) {
            level.blocks.forEach(function (blockCol) {
                blockCol.forEach(function (block) {
                    blocks.push(block);
                });
            });
        });
        return blocks;
    }

    self.update = function (delta) {
    };

    self.getBlock = function (lvl, loc) {
        if (lvl < 0 || lvl >= self.levels.length)
            return null;

        var level = self.levels[lvl];
        if (loc.x < 0 || loc.x >= level.blocks.length)
            return null;

        var col = level.blocks[loc.x];
        if (loc.y < 0 || loc.y >= col.length)
            return null;

        var block = col[loc.y];
        if (block != null)
            if (block.isDestroyed || block.isHole)
                return null;

        return block;
    };

    self.player.onBlock = self.getBlock(self.player.level, self.player.levelPos);

    self.hideLevel = function (lvl) {
        if (lvl < 0)
            return;

        self.levels[lvl].blocks.forEach(function (blockCol) {
            blockCol.forEach(function (block) {
                if (block != null)
                    block.toggleRender(false);
            });
        });
    };

    self.showLevel = function (lvl) {
        if (lvl < 0)
            return;

        self.levels[lvl].blocks.forEach(function (blockCol) {
            blockCol.forEach(function (block) {
                if (block != null)
                    block.toggleRender(true);
            });
        });
    };

    self.showUpLevel = function () {
        if (self.levelVis > self.levels.length)
            return;

        self.hideLevel(self.levelVis);
        self.levelVis++;
    };

    self.hideDownLevel = function () {
        if (self.levelVis == 0)
            return;

        self.levelVis--;
        self.showLevel(self.levelVis);                
    };

    self.player.onLevelChange = function (prevLvl) {       
        if (prevLvl < self.player.level) { // i've fallen            
            self.showUpLevel();
            if (prevLvl >= 0) {
                self.levels[prevLvl].blocks.forEach(function (blockCol) {
                    blockCol.forEach(function (block) {
                        if (block != null)
                            block.toggleHL(true);
                    });
                });
            }
            if (prevLvl - 1  >= 0) {
                self.levels[prevLvl - 1].blocks.forEach(function (blockCol) {
                    blockCol.forEach(function (block) {
                        if (block != null)
                            block.toggleHL(false);
                    });
                });
            }
        } else { // i've climbed
            self.hideDownLevel();

            self.levels[player.level].blocks.forEach(function (blockCol) {
                blockCol.forEach(function (block) {
                    if (block != null)
                        block.toggleTransparent(false);
                        block.toggleHL(false);
                });
            });
            for (var l = self.player.level; l > self.player.level - 2 && l >= 0; l--) {
                self.levels[l].blocks.forEach(function (blockCol) {
                    blockCol.forEach(function (block) {
                        if (block != null)
                            block.toggleRender(true);
                    });
                });
            }
        }
    }

    self.player.onMove = function () {
        if (self.player.level <= 0)
            return;

        self.levels[self.player.level - 1].blocks.forEach(function (blockCol) {
            blockCol.forEach(function (block) {
                if (block != null)
                    block.toggleTransparent(false);
            });
        });
        self.setTransparencyRecur(true, self.player.level - 1, self.player.levelPos);
    };

    self.setTransparencyRecur = function (first, level, pos) {
        var next = new Vector2(pos.x + 1, pos.y + 1);
        var nextblock = self.getBlock(level, next);
        if (nextblock != null) nextblock.toggleTransparent(true);
        var block = self.getBlock(level, new Vector2(pos.x + 1, pos.y));
        if (block != null) block.toggleTransparent(true);
        block = self.getBlock(level, new Vector2(pos.x, pos.y + 1));
        if (block != null) block.toggleTransparent(true);
        block = self.getBlock(level, new Vector2(pos.x + 2, pos.y));
        if (block != null) block.toggleTransparent(true);
        block = self.getBlock(level, new Vector2(pos.x, pos.y + 2));
        if (block != null) block.toggleTransparent(true);
        block = self.getBlock(level, new Vector2(pos.x + 1, pos.y + 2));
        if (block != null) block.toggleTransparent(true);
        block = self.getBlock(level, new Vector2(pos.x + 2, pos.y + 1));
        if (block != null) block.toggleTransparent(true);
        block = self.getBlock(level, new Vector2(pos.x + 2, pos.y + 2));
        if (block != null) block.toggleTransparent(true);
        block = self.getBlock(level, new Vector2(pos.x - 1, pos.y));
        if (block != null) block.toggleTransparent(true);
        block = self.getBlock(level, new Vector2(pos.x, pos.y - 1));
        if (block != null) block.toggleTransparent(true);
        block = self.getBlock(level, new Vector2(pos.x - 1, pos.y - 1));
        if (block != null) block.toggleTransparent(true);

        
        //self.setTransparencyRecur(false, level - 1, next);
    };

};

function GameController(levels, player, onDie) {
    var self = this;
    self.levelCount = levels;
    self.player = player;
    self.onDie = onDie;
    self.update = function (delta) {
        if (self.player.level >= self.levelCount) {
            self.onDie();
        }
    };
};

function Hud(player, dirtText, stoneText, rText, sText, eText) {
    var self = this;
    self.player = player;
    self.dirtText = dirtText;
    self.stoneText = stoneText;
    self.rubyText = rText;
    self.saphText = sText;
    self.eText = eText;
    self.update = function (delta) {
        self.dirtText.text = self.player.dirtCount;
        self.stoneText.text = self.player.stoneCount;
        self.rubyText.text = self.player.rubyCount;
        self.saphText.text = self.player.saphCount;
        self.eText.text = self.player.emeraldCount;
    };

};