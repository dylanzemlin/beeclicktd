const FPS = 60;
const DEFAULT_WIDTH = 35;

function lerp(a, b, n) {
    if (a == b) {
        return a;
    }

    if(Math.abs(b - a) <= 5) {
        return b;
    }

    return a + (a > b ? -n : n);
}

function hollowCircle(ctx, center, radius) {
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI, false);
    ctx.stroke();
}

function filledCircle(ctx, center, radius) {
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI, false);
    ctx.fill();
}

function calcDistance(p1, p2) {
    return Math.sqrt(Math.pow(p2.y - p1.y, 2) + Math.pow(p2.x - p1.x, 2));
}

class GameMap {
    constructor(data) {
        this.data = data;
    }

    draw(canvas, context) {
        // TODO: // Find a way to generate a "ground" texture on scene load
        context.fillStyle = this.data.groundColors[0];
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.lineWidth = 25;
        context.strokeStyle = "gray";
        context.beginPath();
        context.moveTo(this.data.path[0].x, this.data.path[0].y);
        for (let i = 1; i < this.data.path.length; i++) {
            const coord = this.data.path[i];
            context.lineTo(coord.x, coord.y);
        }
        context.stroke();

        for (const lake of this.data.lakes) {
            context.fillStyle = lake.color;
            context.fillRect(lake.x, lake.y, lake.width, lake.height);
        }
    }
}

class GameEnemy {
    constructor(pathing, speed, health, iconSrc) {
        this.pathing = pathing;
        this.speed = speed;
        this.health = health;
        this.canDraw = false;

        this.icon = new Image(48, 48);
        this.icon.src = iconSrc;
        this.icon.onload = () => {
            this.canDraw = true;
        }
    }

    clone() {
        return new GameEnemy(JSON.parse(JSON.stringify(this.pathing)), this.speed, this.health, this.icon.src);
    }

    onGameTick(game) {

    }

    attack(damage) {
        this.health -= damage;
    }

    draw(context) {
        if (this.health <= 0 || !this.canDraw) {
            return;
        }

        context.drawImage(this.icon, this.pathing.x - 20, this.pathing.y - 20, 48, 48);
    }
}

class BeeProjectile {
    constructor(position, velocity, target, size, color) {
        this.position = position;
        this.velocity = velocity;
        this.target = target;
        this.isDead = false;
        this.size = size;
        this.color = color;
    }

    draw(context) {
        context.fillStyle = this.color;
        filledCircle(context, this.position, 5);
    }
}

class BeeTower {
    constructor(position, speed, damage, iconSrc, range, cost) {
        this.position = position;
        this.canDraw = false;
        this.speed = speed;
        this.damage = damage;
        this.range = range;
        this.cost = cost;
        this.lastAttack = 0;

        this.icon = new Image(48, 48);
        this.icon.src = iconSrc;
        this.icon.onload = () => {
            this.canDraw = true;
        }
    }

    clone() {
        return new BeeTower(this.position, this.speed, this.damage, this.icon.src, this.range, this.cost);
    }

    onGameTick(game) {
        let targetEnemy = undefined;
        let closetEnemyDistance = 9999999;

        for (let enemy of game.enemies) {
            if (enemy.health <= 0) {
                continue;
            }

            const distance = calcDistance({
                x: this.position.x + 24,
                y: this.position.y + 24
            }, { x: enemy.pathing.x, y: enemy.pathing.y });
            if (distance > closetEnemyDistance) {
                continue;
            }

            targetEnemy = enemy;
            closetEnemyDistance = distance;
        }

        if (targetEnemy == undefined) {
            return;
        }

        const dist = calcDistance(this.position, { x: targetEnemy.pathing.x, y: targetEnemy.pathing.y });
        if (Date.now() - this.lastAttack > this.speed * 1000) {
            if (this.range < dist) {
                return;
            }

            // Attack
            this.lastAttack = Date.now();
            targetEnemy.attack(this.damage);

            game.fireProjectile(this.position, targetEnemy.pathing, { width: 3, height: 8 }, "yellow")
        }
    }

    draw(context, opacity) {
        if (!this.canDraw) {
            return;
        }

        const priorOpacity = context.globalAlpha;
        context.globalAlpha = opacity;
        context.drawImage(this.icon, this.position.x, this.position.y, 48, 48);
        if (isHoldingCtrl || opacity < 1) {
            context.lineWidth = 7;
            hollowCircle(context, { x: this.position.x + 24, y: this.position.y + 24 }, this.range);
        }

        context.globalAlpha = priorOpacity;
    }
}

var towerMap = {
    "hive": new BeeTower({ x: 0, y: 0 }, 0.25, 50, "assets/hives/hive0.png", 150, 25),
    "apiary": new BeeTower({ x: 0, y: 0 }, 1, 59, "assets/hives/apiary0.png", 130, 50),
    "rainbow_hive": new BeeTower({ x: 0, y: 0 }, 2, 150, "assets/hives/hive1.png", 200, 200),
    "ilumi_apiary": new BeeTower({ x: 0, y: 0 }, 0.7, 87, "assets/hives/apiary1.png", 90, 400),
}

var enemyMap = {
    "spooder": new GameEnemy({ x: 0, y: 0, index: 1 }, 6, 200, "assets/hives/spider0.png"),
    "booted_spooder": new GameEnemy({ x: 0, y: 0, index: 1 }, 4, 300, "assets/hives/spider1.png"),
    "winged_spooder": new GameEnemy({ x: 0, y: 0, index: 1 }, 8, 150, "assets/hives/spider2.png"),
    "wizard_spooder": new GameEnemy({ x: 0, y: 0, index: 1 }, 6, 250, "assets/hives/spider3.png")
}

var waveMap = {
    "beasy": [
        {
            quote: "This should be an easy start", // A quote displayed at the bottom of the screen
            enemies: [
                // enemy type, delay until next enemy
                "spooder", 1250,
                "spooder", 1250,
                "spooder", 1250,
                "spooder", 1250,
                "spooder", 1250,
                "spooder", 1250,
                "spooder", 1250,
                "spooder", 1250
            ]
        },
        {
            quote: "Its gonna start getting a little more heated", // A quote displayed at the bottom of the screen
            enemies: [
                // enemy type, delay until next enemy
                "spooder", 1000, "spooder", 1000, "spooder", 1000,
                "spooder", 1000, "spooder", 1000, "spooder", 1000,
                "spooder", 1000, "spooder", 1000, "spooder", 1000,
                "spooder", 1000, "spooder", 1000, "spooder", 1000,
                "spooder", 1000, "spooder", 1000, "spooder", 1000,
                "spooder", 1000, "spooder", 1000, "spooder", 1000
            ]
        },
        {
            quote: "A new enemy comes across the horizon", // A quote displayed at the bottom of the screen
            enemies: [
                // enemy type, delay until next enemy
                "booted_spooder", 2000, "spooder", 1000, "spooder", 1000,
                "spooder", 1000, "booted_spooder", 2000, "spooder", 1000,
                "spooder", 1000, "winged_spooder", 1000, "spooder", 1000,
                "booted_spooder", 2000, "spooder", 1000, "spooder", 1000,
                "spooder", 1000, "spooder", 1000, "booted_spooder", 2000
            ]
        },
        {
            quote: "Hopefully you can withstand this one!", // A quote displayed at the bottom of the screen
            enemies: [
                // enemy type, delay until next enemy
                "booted_spooder", 2000, "spooder", 1000, "spooder", 1000,
                "spooder", 1000, "booted_spooder", 2000, "spooder", 1000,
                "spooder", 1000, "spooder", 1000, "spooder", 1000,
                "winged_spooder", 2000, "winged_spooder", 1000, "spooder", 1000,
                "spooder", 1000, "spooder", 1000, "booted_spooder", 2000,
                "winged_spooder", 2000, "winged_spooder", 1000, "spooder", 1000,
                "spooder", 1000, "spooder", 1000, "booted_spooder", 2000
            ]
        },
        {
            quote: "Alright, I guess you can keep playing", // A quote displayed at the bottom of the screen
            enemies: [
                // enemy type, delay until next enemy
                "booted_spooder", 2000, "spooder", 1000, "spooder", 1000,
                "spooder", 1000, "booted_spooder", 2000, "spooder", 1000,
                "spooder", 1000, "spooder", 1000, "spooder", 1000,
                "winged_spooder", 2000, "winged_spooder", 1000, "spooder", 1000,
                "spooder", 1000, "spooder", 1000, "booted_spooder", 2000,
                "winged_spooder", 2000, "winged_spooder", 1000, "spooder", 1000,
                "spooder", 1000, "spooder", 1000, "booted_spooder", 2000,
                "winged_spooder", 2000, "winged_spooder", 1000, "spooder", 1000,
                "spooder", 1000, "spooder", 1000, "booted_spooder", 2000,
                "winged_spooder", 2000, "winged_spooder", 1000, "spooder", 1000,
                "spooder", 1000, "spooder", 1000, "booted_spooder", 2000
            ]
        }
    ]
}

class GameStageDefense {
    constructor() {
        this.log("Initialized");

        this.canvas = document.getElementById("towerCanvas");
        this.context = this.canvas.getContext("2d");
        this.wavePlayed = false;
        this.isHoldingShift = false;
        this.enemies = [];
        this.projectiles = [];
        this.towers = []
        this.timerId = undefined;
        this.lastFrame = 0;
        this.next = 0;
        this.map = new GameMap({
            map_name: "Default Map",
            groundColors: ["#567d46", "#446438", "#22321C"],
            path: [
                { x: 0, y: 300 },
                { x: 550, y: 300 },
                { x: 550, y: 500 },
                { x: 200, y: 500 },
                { x: 200, y: 700 },
                { x: 900, y: 700 },
                { x: 900, y: 0 },
            ],
            lakes: [
                { x: 400, y: 40, width: 350, height: 185, color: "#006994" }
            ]
        });

        this.placingTower = undefined;

        $(document).mousedown((event) => this.onClick(event));
        $(document).on("keydown", (event) => this.onKeyDown(event));
        $(document).on("keyup", (event) => this.onKeyUp(event));

        for (const key of Object.keys(towerMap)) {
            const tower = towerMap[key];
            const clone = $("#fake-tower").clone();
            clone.removeClass("hidden");
            clone.attr("id", key);
            $(".icon", clone).attr("src", `${tower.icon.src}`);
            $(".cost", clone).text(`Honey Cost: ${tower.cost}`);
            $(".towers").append(clone);
            clone.click(() => {
                this.placingTower = towerMap[key].clone();
            });
        }

        $(".start-wave").click(() => {
            $(".start-wave").hide();
            this.startWave(0);
        });
    }

    isOverLake() {
        for (let lake of this.map.data.lakes) {
            if (mousePos.x >= lake.x - 15 && mousePos.x < lake.x + lake.width + 15
                && mousePos.y >= lake.y - 15 && mousePos.y < lake.y + lake.height + 15) {
                return true;
            }
        }

        return false;
    }

    isOverPath() {
        // TODO: This does not work properly in some instances, figure that out later
        for (let i = 0; i < this.map.data.path.length - 1; i++) {
            const pathPoint = this.map.data.path[i];
            const next = this.map.data.path[i + 1];
            const width = Math.abs(next.x - pathPoint.x);
            const height = Math.abs(next.y - pathPoint.y);
            if (mousePos.x >= pathPoint.x - 15 && mousePos.x < pathPoint.x + width + 15
                && mousePos.y >= pathPoint.y - 15 && mousePos.y < pathPoint.y + height + 15) {
                return true;
            }
        }

        return false;
    }

    isOverTower() {
        for (const tower of this.towers) {
            const dist = calcDistance(mousePos, {
                x: tower.position.x + 24,
                y: tower.position.y + 24
            });
            if (dist <= 35) {
                return true;
            }
        }

        return false;
    }

    fireProjectile(position, target, size, color) {
        this.projectiles.push(new BeeProjectile(JSON.parse(JSON.stringify(position)), { x: 18, y: 18 }, target, size, color));
    }

    onClick(event) {
        // event.which contains which button
        // 1 is left, 2 is middle, 3 is right, 4 is strange
        if (event.which == 3 && this.placingTower) {
            this.placingTower = undefined;
            event.preventDefault();
        }

        if (event.which === 1 && this.placingTower) {
            if (mousePos.x > 1100 || mousePos.x < 10 || mousePos.y < 10) {
                return;
            }

            // Clone the towers positions so it doesn't get effected by the global object
            if (this.isOverLake()) {
                return;
            }

            if (this.isOverTower()) {
                return;
            }

            if (this.isOverPath()) {
                return;
            }

            this.placingTower.position = JSON.parse(JSON.stringify(this.placingTower.position));
            this.towers.push(this.placingTower.clone());

            putHoney(-1 * this.placingTower.cost);

            if (!this.isHoldingShift || this.placingTower.cost > honey) {
                this.placingTower = undefined;
            }
        } else if (event.which === 1) {
            // Detect towers under mouse
        }
    }

    onKeyDown(event) {
        if (event.key == "Escape" && this.placingTower) {
            this.placingTower = undefined;
        }

        if (event.key == "Shift") {
            this.isHoldingShift = true;
        }

        if (event.key == "Control") {
            isHoldingCtrl = true;
        }
    }

    onKeyUp(event) {
        if (event.key == "Shift") {
            this.isHoldingShift = false;
        }

        if (event.key == "Control") {
            isHoldingCtrl = false;
        }
    }

    onUpdate(deltaTime) {
        this.lastFrame = Date.now();

        // Clear Canvas
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // First draw the map
        this.map.draw(this.canvas, this.context);

        // Draw Towers
        for (const tower of this.towers) {
            tower.draw(this.context, 1);
            tower.onGameTick(this);
        }

        // Draw Enemies
        for (const enemy of this.enemies) {
            if (enemy.health <= 0) {
                continue;
            }

            enemy.pathing.x = lerp(enemy.pathing.x, this.map.data.path[enemy.pathing.index].x, enemy.speed);
            enemy.pathing.y = lerp(enemy.pathing.y, this.map.data.path[enemy.pathing.index].y, enemy.speed);

            if (Math.abs(this.map.data.path[enemy.pathing.index].x - enemy.pathing.x) <= 4.5
                && Math.abs(this.map.data.path[enemy.pathing.index].y - enemy.pathing.y) <= 4.5) {
                if (enemy.pathing.index + 1 < this.map.data.path.length) {
                    enemy.pathing.index++;
                } else {
                    enemy.health = 0;
                    putLives(-1);
                }
            }

            enemy.draw(this.context);
            enemy.onGameTick(this);
        }

        // Draw Placing Tower
        if (this.placingTower !== undefined) {
            this.placingTower.position = { x: mousePos.x - 24, y: mousePos.y - 24 };
            this.placingTower.draw(this.context, 0.5);
        }

        // Simulate Projectiles
        for (const projectile of this.projectiles) {
            if (projectile.isDead) {
                continue;
            }

            projectile.position.x = lerp(projectile.position.x, projectile.target.x, projectile.velocity.x);
            projectile.position.y = lerp(projectile.position.y, projectile.target.y, projectile.velocity.y);
            projectile.draw(this.context);

            const distToTarget = calcDistance(projectile.position, projectile.target);
            if (distToTarget <= 15) {
                projectile.isDead = true;
                continue;
            }
        }

        this.context.font = "18px Arial";
        this.context.fillStyle = "white";

        if(isDebugging) {
            // Debug Information
            this.context.fillText(`(${mousePos.x}, ${mousePos.y})`, 15, 30);
            this.context.fillText(`Shift: ${this.isHoldingShift}`, 15, 50);
            this.context.fillText(`Ctrl: ${isHoldingCtrl}`, 15, 70);
            this.context.fillText(`Wave: ${wave + 1}`, 15, 90);
            this.context.fillText(`Enemies: ${this.remainingEnemies()} / ${waveMap["beasy"][wave].enemies.filter(x => typeof x === "string").length}`, 15, 110);
        } else {
            this.context.fillText(`Wave: ${wave + 1}`, 15, 30);
            this.context.fillText(`Enemies: ${this.remainingEnemies()} / ${waveMap["beasy"][wave].enemies.filter(x => typeof x === "string").length}`, 15, 50);
        }
    }

    startWave(enemyIndex) {
        const enemies = waveMap["beasy"][wave].enemies;
        if (enemyIndex >= enemies.length) {
            if (!$(".fun-text").hasClass("fun-text-hidden")) {
                $(".fun-text").addClass("fun-text-hidden");
            }
            return;
        }

        const enemy = enemyMap[enemies[enemyIndex]].clone();
        enemy.pathing = JSON.parse(JSON.stringify({ ...this.map.data.path[0], index: 1 }));
        this.enemies.push(enemy);

        this.wavePlayed = true;

        if (enemyIndex >= enemies.length / 3 && $(".fun-text").hasClass("fun-text-hidden")) {
            $(".fun-text").removeClass("fun-text-hidden");
            $(".fun-text").text(waveMap["beasy"][wave].quote);
        }

        if (enemyIndex >= enemies.length / 3 + 4) {
            if (!($(".fun-text").hasClass("fun-text-hidden"))) {
                $(".fun-text").addClass("fun-text-hidden");
            }
        }

        setTimeout(() => {
            this.startWave(enemyIndex + 2);
        }, enemies[enemyIndex + 1] ?? 1);
    }

    remainingEnemies() {
        return this.enemies.filter(x => x.health > 0).length;
    }

    isWaveFinishedSending() {
        return this.enemies.length >= waveMap["beasy"][wave].enemies.filter(x => typeof x === "string").length;
    }

    animationCallback() {
        requestAnimationFrame(() => this.animationCallback());

        let elapsed = Date.now() - this.next;
        if (elapsed > 1000 / FPS) {
            this.next = Date.now() - (elapsed % (1000 / FPS));
            this.onUpdate((Date.now() - this.lastFrame) / 1000.0);
        }
    }

    onSceneLoad() {
        this.canvas.width = $("#towerCanvas").width();
        this.canvas.height = $("#towerCanvas").height();

        requestAnimationFrame(() => this.animationCallback());
    }

    onSceneUnload() {
        this.projectiles = [];
        this.enemies = [];
        this.towers = [];
        $(".start-wave").show();

        this.wavePlayed = false;
        clearInterval(this.timerId);
    }

    log(data) {
        console.log(`[Game Stage | Defense] ${data}`);
    }
}