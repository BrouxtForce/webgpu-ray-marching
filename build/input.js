export default class Input {
    pointerIsLocked;
    mouseDelta;
    pressedKeys;
    constructor(node) {
        this.pointerIsLocked = false;
        this.mouseDelta = [0, 0];
        this.pressedKeys = new Set();
        node.tabIndex = 0;
        node.addEventListener("keydown", event => {
            this.pressedKeys.add(event.key.toLowerCase());
        });
        node.addEventListener("keyup", event => {
            this.pressedKeys.delete(event.key.toLowerCase());
        });
        node.addEventListener("mousemove", event => {
            this.mouseDelta[0] = event.movementX;
            this.mouseDelta[1] = event.movementY;
        });
        node.addEventListener("mousedown", () => {
            node.requestPointerLock();
        });
        document.addEventListener("pointerlockchange", () => {
            this.pointerIsLocked = (document.pointerLockElement === node);
        });
        document.addEventListener("pointerlockerror", () => {
            console.error("Failed to lock pointer");
        });
    }
    up() {
        return this.pressedKeys.has("w") || this.pressedKeys.has("arrowup");
    }
    left() {
        return this.pressedKeys.has("a") || this.pressedKeys.has("arrowleft");
    }
    down() {
        return this.pressedKeys.has("s") || this.pressedKeys.has("arrowdown");
    }
    right() {
        return this.pressedKeys.has("d") || this.pressedKeys.has("arrowright");
    }
    space() {
        return this.pressedKeys.has(" ");
    }
    shift() {
        return this.pressedKeys.has("shift");
    }
    movement() {
        return [
            Number(this.right()) - Number(this.left()),
            Number(this.space()) - Number(this.shift()),
            Number(this.down()) - Number(this.up())
        ];
    }
    endFrame() {
        this.mouseDelta[0] = 0;
        this.mouseDelta[1] = 0;
    }
}
