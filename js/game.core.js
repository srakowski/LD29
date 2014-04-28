
function Vector2(x, y) {
    var self = this;
    self.x = x;
    self.y = y;
    self.distance = function (vector) {
        var dx = vector.x - self.x;
        dx = dx * dx;
        var dy = vector.y - self.y;
        dy = dy * dy;       
        return Math.sqrt(dx + dy);
    }
};

var KEY_STATE = {
    DOWN: 0, 
    UP: 1
}

function Key(code) {
    var self = this;
    self.code = code;
    self.previousState = KEY_STATE.DOWN;
    self.currentState = KEY_STATE.UP;    
    self.setState = function (isDown) {
        if (isDown && self.currentState == KEY_STATE.UP) {
            self.previousState = self.currentState;
            self.currentState = KEY_STATE.DOWN;
        } else if (!isDown && self.currentState == KEY_STATE.DOWN) {
            self.previousState = self.currentState;
            self.currentState = KEY_STATE.UP;
        }
    };
    self.isDown = function () {
        return self.currentState == KEY_STATE.DOWN;
    }
    self.wasDown = function () {
        return self.previousState == KEY_STATE.DOWN;
    }
    self.isUp = function () {
        return self.currentState == KEY_STATE.UP;
    }
    self.wasUp = function () {
        return self.previousState == KEY_STATE.UP;
    }
};

var KEYS = {
    W: 87,
    S: 83,
    D: 68,
    A: 65,
    Q: 81,
    E: 69,
    SPACE: 32
};