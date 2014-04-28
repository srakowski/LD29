
function MouseState() {
    var self = this;
    self.pos = new Vector2(0.0, 0.0);
    self.isDown = false;
}

function KeyboardState() {
    var self = this;
    self.keys = [];
    for (var i = 0; i < 256; i++) {
        self.keys.push(new Key(i));
    }
}

function Input() {
    var self = this;
    self.mouseState = new MouseState();
    self.keyboardState = new KeyboardState();
}

function GameScene() {
    var self = this;
    self.sceneMgr = null;
    self.gameObjs = [];

    self.addGameObj = function (gameObj) {
        self.gameObjs.push(gameObj);
        return self;
    };

    self.update = function (delta) {
        var objectsToUpdate = self.gameObjs.slice(0);
        objectsToUpdate.forEach(function (obj) {
            if (typeof obj.update == 'function')
                obj.update(delta);
        });
    };

    self.draw = function (delta) {
        var objectsToDraw = self.gameObjs.slice(0);
        objectsToDraw.sort(function (a, b) {
            if (a.zOrder < b.zOrder)
                return -1;
            if (a.zOrder > b.zOrder)
                return 1;
            return 0;
        });
        objectsToDraw.forEach(function (obj) {
            if (typeof obj.draw == 'function')
                obj.draw(delta, self.sceneMgr.ctx);
        });
    };

};

function SceneManager() {
    var self = this;

    self.ctx = null;
    self.scenes = [];

    self.pushScene = function (scene) {
        scene.sceneMgr = self;
        self.scenes.push(scene);
    };

    self.popScene = function () {
        self.scenes.pop();
    };

    self.init = function (ctx) {
        self.ctx = ctx;
    };

    self.update = function (delta) {
        var scenes = self.scenes.slice();
        scenes.forEach(function (scene) {
            if (typeof scene.update == 'function')
                scene.update(delta)
        });
    };

    self.draw = function (delta) {
        var scenes = self.scenes.slice();
        scenes.forEach(function (scene) {
            if (typeof scene.draw == 'function')
                scene.draw(delta)
        });
    };
}