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
        this.stage = GameStage.CLICKER; // the starting stage
        this.setStage(this.stage);

        // Hook mouse and keyboard events
        this.hookEvents();

        // Global game timer
        setInterval(() => this.onGameTick(), 1000);

        // Set default honey
        putHoney(0);
        putLives(50);
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
            if(!this.stages["defense"].wavePlayed) {
                return;
            }

            let enemiesRemaining = this.stages["defense"].remainingEnemies();
            if (enemiesRemaining > 0) {
                return;
            }

            if (lives <= 0) {
                this.setStage(GameStage.MENU);
                return;
            }

            this.setStage(GameStage.CLICKER);
        }
    }

    getStageObject() {
        switch (this.stage) {
            case GameStage.CLICKER: {
                return this.stages["clicker"];
            }
            case GameStage.DEFENSE: {
                return this.stages["defense"];
            }
            case GameStage.MENU: {
                return this.stages["menu"];
            }
        }
    }

    setStage(stage) {
        try {
            this.getStageObject().onSceneUnload();
        } catch {}

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

        try {
            this.getStageObject().onSceneLoad();
        } catch {}
    }

    hookEvents() {
        $("#create-game").click(() => {
            // Create Game
        });
    }
}

var game = new BeeTDGame();