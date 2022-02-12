const FPS = 60;

class GameStageDefense {
    constructor() {
        this.log("Initialized");

        const canvas = document.getElementById("towerCanvas");
        this.context = canvas.getContext("2d");
        this.timerId = undefined;
    }

    onUpdate() {

    }

    onSceneLoad() {
        this.timer = setInterval(() => this.onUpdate(), 1000 / FPS);
    }

    onSceneUnload() {
        clearInterval(this.timerId);
    }

    log(data) {
        console.log(`[Game Stage | D] ${data}`);
    }
}