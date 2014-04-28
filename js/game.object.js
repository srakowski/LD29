// --------------------------------------------------
// Resource
// --------------------------------------------------
function Resource(id, src) {
    var self = this;
    self.id = id;
    self.src = src;
};

// --------------------------------------------------
// Component
// --------------------------------------------------
function Component(type) {
    var self = this;
    self.type = type;
};

// --------------------------------------------------
// Transform
// --------------------------------------------------
function Transform(startingX, startingY) {
    var self = this;
    self.base = Component;
    self.base(Transform);
    self.pos = new Vector2(startingX, startingY);
    self.attachTo = function (obj) {
        obj.transform = self;
    };
}; Transform.prototype = new Component;

// --------------------------------------------------
// Sprite
// --------------------------------------------------
function Sprite(id, src) {
    var self = this;    
    self.base = Resource;
    self.base(id, src);
    self.center = new Vector2(0.0, 0.0);
    self.offset = new Vector2(0.0, 0.0);
    self.img = new Image();
    self.img.onload = function () {
        self.center.x = this.width / 2.0;
        self.center.y = this.height / 2.0;
    };
    self.img.src = self.src;
    self.draw = function (ctx, origin) {
        ctx.drawImage(self.img,
            origin.x - self.center.x + self.offset.x,
            origin.y - self.center.y + self.offset.y);
    };
    self.setOffset = function (x, y) {
        self.offset.x = x;
        self.offset.y = y;
        return self;
    };
}; Sprite.prototype = new Resource;

// --------------------------------------------------
// SpriteSheet
// --------------------------------------------------
function SpriteSheet(id, src, cols, rows) {
    var self = this;
    self.base = Resource;
    self.base(id, src);
    self.render = true;
    self.cols = cols;
    self.rows = rows;
    self.spriteWidth = 0;
    self.spriteHeight = 0;
    self.center = new Vector2(0.0, 0.0);
    self.offset = new Vector2(0.0, 0.0);
    self.img = new Image();
    self.drawIdx = 0;
    self.img.onload = function () {
        self.spriteWidth = (this.width / cols);
        self.spriteHeight = (this.height / rows);
        self.center.x = self.spriteWidth / 2.0;
        self.center.y = self.spriteHeight / 2.0;
    };
    self.img.src = self.src;
    self.draw = function (ctx, origin) {
        if (!self.render)
            return;

        ctx.drawImage(self.img,
            ((self.drawIdx % cols) * self.spriteWidth),
            (Math.floor((self.drawIdx / cols)) * self.spriteHeight),
            self.spriteWidth,
            self.spriteHeight,
            origin.x - self.center.x + self.offset.x,
            origin.y - self.center.y + self.offset.y,
            self.spriteWidth,
            self.spriteHeight);
    };
    self.setOffset = function (x, y) {
        self.offset.x = x;
        self.offset.y = y;
        return self;
    };
    self.setDrawIdx = function (idx) {
        self.drawIdx = idx;
    };
}; Sprite.prototype = new Resource;

// --------------------------------------------------
// SpriteRenderer
// --------------------------------------------------
function SpriteRenderer() {    
    var self = this;
    self.base = Component;
    self.base(SpriteRenderer);
    self.sprites = [];
    self.render = true;
    self.transparent = false;
    self.addSprite = function (sprite) {
        self.sprites.push(sprite);
        return self;
    };
    self.draw = function (delta, ctx, origin) {
        if (!self.render)
            return;
        ctx.save();
        if (self.transparent) {
            ctx.globalAlpha = 0.5;
        }
        self.sprites.forEach(function (sprite) {
            sprite.draw(ctx, origin);
        });
        ctx.restore();
    };
    self.toggleTransparent = function (value) {
        self.transparent = value;
    };
} Sprite.prototype = new Component;

// --------------------------------------------------
// SoundEffect
// --------------------------------------------------
function SoundEffect(id, src) {
    var self = this;
    self.base = Resource;
    self.base(id, src);
    self.snd = new Audio(self.src);
    self.play = function () {
        self.snd.currentTime = 0;
        self.snd.volume = 0.5;
        self.snd.play();
    };
}; SoundEffect.prototype = new Resource;

// --------------------------------------------------
// SoundRenderer
// --------------------------------------------------
function SoundRenderer() {
    var self = this;
    self.base = Component;
    self.base(SoundRenderer);    
    self.soundEffects = [];
    self.addSoundEffect = function (soundEffect) {
        self.soundEffects.push(soundEffect);
        return self;
    };
    self.play = function (id) {
        self.soundEffects.forEach(function (se) {
            if (se.id == id)
                se.play();
        });
    };
} SoundEffect.prototype = new Component;

// --------------------------------------------------
// Text
// --------------------------------------------------
function Text(id, text) {
    var self = this;
    self.base = Resource;
    self.base(id, text);
    self.text = text;
    self.offset = new Vector2(0, 0);
    self.draw = function (ctx, origin) {
        ctx.fillStyle = "white";
        ctx.font = "20px Georgia";
        ctx.fillText(self.text, self.offset.x + origin.x, self.offset.y + origin.y);
    };
    self.setOffset = function (x, y) {
        self.offset.x = x;
        self.offset.y = y;
        return self;
    };
}; Text.prototype = new Resource;

// --------------------------------------------------
// TextRenderer
// --------------------------------------------------
function TextRenderer() {
    var self = this;
    self.base = Component;
    self.base(TextRenderer);
    self.texts = [];
    self.addText = function (text) {
        self.texts.push(text);
        return self;
    };
    self.draw = function (delta, ctx, origin) {
        ctx.save();        
        self.texts.forEach(function (text) {
            text.draw(ctx, origin);
        });
        ctx.restore();
    };
} TextRenderer.prototype = new Component;

// --------------------------------------------------
// Script
// --------------------------------------------------
function Script(script) {
    var self = this;
    self.base = Component;
    self.base(Script);

    self.script = script;
    self.obj = null;

    self.update = function (delta) {
        if (typeof self.script.update == 'function') {
            self.script.update(delta, self.obj);
        }
    }

} Script.prototype = new Component;

// --------------------------------------------------
// GameObject
// --------------------------------------------------
function GameObject(zOrder) {
    var self = this;

    self.zOrder = zOrder;
    self.transform = null;
    self.spriteRenderer = null;
    self.soundRenderer = null;
    self.textRenderer = null;
    self.scripts = [];

    self.addComponent = function (component) {
        if (component.type == Transform) {
            self.transform = component;
        } else if (component.type == SpriteRenderer) {
            self.spriteRenderer = component;
        } else if (component.type == SoundRenderer) {
            self.soundRenderer = component;
        } else if (component.type == Script) {
            self.scripts.push(component);
        } else if (component.type == TextRenderer) {
            self.textRenderer = component;
        }
        return self;
    };

    self.update = function (delta) {
        self.scripts.forEach(function (script) {
            if (typeof script.update == 'function')
                script.update(delta);
        });
    };

    self.draw = function (delta, ctx) {
        ctx.save();
        if (self.spriteRenderer != null && self.transform != null) {            
            self.spriteRenderer.draw(delta, ctx, self.transform.pos);            
        }
        if (self.textRenderer != null && self.transform != null) {
            self.textRenderer.draw(delta, ctx, self.transform.pos);
        }
        ctx.restore();
    };
};

// --------------------------------------------------
// Camera
// --------------------------------------------------
function Camera(zOrder, screenX, screenY) {
    var self = this;
    self.base = GameObject;
    self.base(zOrder);
    var self = this;
    self.screenX = screenX;
    self.screenY = screenY;
    self.draw = function (delta, ctx) {
        ctx.translate(-self.transform.pos.x, -self.transform.pos.y);
    }
}; Camera.prototype = new GameObject;
