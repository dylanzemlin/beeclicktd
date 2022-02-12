console.log("Bee Click Tower Defense");

const GameStage = {
    CLICKER: 0,
    DEFENSE: 1,
    MENU: 2
}

class BeeTDGame {
    constructor() {
        this.stages = {
            "clicker": new GameStageClicker(),
            "defense": new GameStageDefense(),
            "menu": new GameStageMenu()
        };
        this.stage = GameStage.DEFENSE;
        this.setStage(this.stage);

        // Hook mouse and keyboard events
        this.hookEvents();

        // Global game timer
        setInterval(() => this.onGameTick(), 1000);

        // Set default honey
        putHoney(0);
    }

    onGameTick() {
        if (this.stage === GameStage.CLICKER) {
            if (click_time_remaining-- <= 0) {
                // TODO: If time permits, use some sort of scene switch scene?
                this.setStage(GameStage.DEFENSE);
                click_time_remaining = 90; // TODO: Set based on wave or somethin

                return;
            }
        }

        if (this.stage === GameStage.DEFENSE) {

        }
    }

    setStage(stage) {
        this.stage = stage;

        switch (this.stage) {
            case GameStage.CLICKER: {
                $("#stage-menu").addClass("hidden");
                $("#stage-defense").addClass("hidden");
                $("#stage-clicker").removeClass("hidden");
            } break;
            case GameStage.DEFENSE: {
                $("#stage-menu").addClass("hidden");
                $("#stage-clicker").addClass("hidden");
                $("#stage-defense").removeClass("hidden");
            } break;
            case GameStage.MENU: {
                $("#stage-clicker").addClass("hidden");
                $("#stage-defense").addClass("hidden");
                $("#stage-menu").removeClass("hidden");
            } break;
        }
    }

    hookEvents() {
        $("#create-game").click(() => {
            // Create Game
        });
    }
}

var game = new BeeTDGame();