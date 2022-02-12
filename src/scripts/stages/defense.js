const FPS = 60;

class GameMap {
    constructor(data) {
        this.data = data;
    }

    draw(canvas, context) {
        // Draw the ground first
        const { width, height } = canvas;
        context.fillStyle = data.groundColor;
        context.fillRect(0, 0, width, height);
    }
}

class GameStageDefense {
    constructor() {
        this.log("Initialized");

        this.canvas = document.getElementById("towerCanvas");
        this.context = this.canvas.getContext("2d");
        this.timerId = undefined;
        this.lastFrame = 0;
        this.map = new GameMap({
            map_name: "Default Map",
            groundColor: "#567d46",
            path: [
                {  }
            ]
        });
    }

    onUpdate(deltaTime) {
        this.lastFrame = Date.now();

        // Clear Canvas
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // First draw the map
        this.map.draw(this.canvas, this.context);
    }

    onSceneLoad() {
        this.timer = setInterval(() => {
            this.onUpdate((Date.now() - this.lastFrame) / 1000.0)
        }, 1000 / FPS);
    }

    onSceneUnload() {
        clearInterval(this.timerId);
    }

    log(data) {
        console.log(`[Game Stage | D] ${data}`);
    }
}