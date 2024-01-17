type Vec2 = [number, number];
type Vec3 = [number, number, number];

export default class Input {
    public pointerIsLocked: boolean;
    public readonly mouseDelta: Vec2;

    // Every key is composed only of lowercase letters
    private readonly pressedKeys: Set<string>;

    constructor(node: HTMLElement) {
        this.pointerIsLocked = false;
        this.mouseDelta = [0, 0];

        this.pressedKeys = new Set();

        // Make node focusable / have keyboard input
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

    up(): boolean {
        return this.pressedKeys.has("w") || this.pressedKeys.has("arrowup");
    }
    left(): boolean {
        return this.pressedKeys.has("a") || this.pressedKeys.has("arrowleft");
    }
    down(): boolean {
        return this.pressedKeys.has("s") || this.pressedKeys.has("arrowdown");
    }
    right(): boolean {
        return this.pressedKeys.has("d") || this.pressedKeys.has("arrowright");
    }
    space(): boolean {
        return this.pressedKeys.has(" ");
    }
    shift(): boolean {
        return this.pressedKeys.has("shift");
    }
    movement(): Vec3 {
        return [
            Number(this.right()) - Number(this.left()),
            Number(this.space()) - Number(this.shift()),
            Number(this.down()) - Number(this.up())
        ];
    }

    endFrame(): void {
        this.mouseDelta[0] = 0;
        this.mouseDelta[1] = 0;
    }
}