console.log("Bee Click Tower Defense");

const Scene = {
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
        this.stage = Scene.MENU; // the starting stage
        this.setScene(this.stage);

        // Hook mouse and keyboard events
        this.hookEvents();

        // Global game timer
        setInterval(() => this.onGameTick(), 1000);

        // Set default honey
        putHoney(0);
        putLives(50);
    }

    onGameTick() {
        if (this.stage === Scene.CLICKER) {
            if (click_time_remaining-- <= 0) {
                // TODO: If time permits, use some sort of scene switch scene?
                this.setScene(Scene.DEFENSE);
                click_time_remaining = 90; // TODO: Set based on wave or somethin

                return;
            }
        }

        if (this.stage === Scene.DEFENSE) {
            if (!this.stages["defense"].wavePlayed) {
                return;
            }

            let enemiesRemaining = this.stages["defense"].remainingEnemies();
            if (enemiesRemaining > 0) {
                return;
            }

            if (lives <= 0) {
                this.setScene(Scene.MENU);
                return;
            }

            this.setScene(Scene.CLICKER);
        }
    }

    getSceneObject() {
        switch (this.stage) {
            case Scene.CLICKER: {
                return this.stages["clicker"];
            }
            case Scene.DEFENSE: {
                return this.stages["defense"];
            }
            case Scene.MENU: {
                return this.stages["menu"];
            }
        }
    }

    setScene(stage) {
        try {
            this.getSceneObject().onSceneUnload();
        } catch { }

        this.stage = stage;
        switch (this.stage) {
            case Scene.CLICKER: {
                $("#stage-menu").addClass("hidden");
                $("#stage-defense").addClass("hidden");
                $("#stage-clicker").removeClass("hidden");
            } break;
            case Scene.DEFENSE: {
                $("#stage-menu").addClass("hidden");
                $("#stage-clicker").addClass("hidden");
                $("#stage-defense").removeClass("hidden");
            } break;
            case Scene.MENU: {
                $("#stage-clicker").addClass("hidden");
                $("#stage-defense").addClass("hidden");
                $("#stage-menu").removeClass("hidden");
            } break;
        }

        try {
            this.getSceneObject().onSceneLoad();
        } catch { }
    }

    hookEvents() {
        $("#create-game").click(() => {
            // Create Game
            this.setScene(Scene.CLICKER);
        });
    }
}

var game = new BeeTDGame();