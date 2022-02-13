const FPS = 60;
const DEFAULT_WIDTH = 35;

function lerp(a, b, n) {
    if (a == b) {
        return a;
    }

    return a + (a > b ? -n : n);
}

function circle(ctx, center, radius) {
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI, false);
    ctx.fill();
}

function hollowCircle(ctx, center, radius) {
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI, false);
    ctx.stroke();
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
        context.beginPath();
        context.moveTo(this.data.path[0].x, this.data.path[0].y);
        for (let i = 1; i < this.data.path.length; i++) {
            const coord = this.data.path[i];
            context.lineTo(coord.x, coord.y);
        }
        context.stroke();
    }
}

class GameEnemy {
    constructor(pathing, speed, health, color, size) {
        this.pathing = pathing;
        this.speed = speed;
        this.health = health;
        this.color = color;
        this.size = size;
    }

    clone() {
        return new GameEnemy(JSON.parse(JSON.stringify(this.pathing)), this.speed, this.health, this.color, this.size);
    }

    onGameTick(game) {

    }

    attack(damage) {
        this.health -= damage;
    }

    draw(context) {
        if (this.health <= 0) {
            return;
        }

        context.fillStyle = this.color;
        context.fillRect(this.pathing.x - this.size / 2, this.pathing.y - this.size / 2, this.size, this.size);
    }
}

class BeeTower {
    constructor(position, speed, damage, iconSrc, size, range, cost) {
        this.position = position;
        this.canDraw = false;
        this.speed = speed;
        this.damage = damage;
        this.size = size;
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
        return new BeeTower(this.position, this.speed, this.damage, this.icon.src, this.size, this.range, this.cost);
    }

    onGameTick(game) {
        let targetEnemy = undefined;
        let closetEnemyDistance = 9999999;

        for (let enemy of game.enemies) {
            if (enemy.health <= 0) {
                continue;
            }

            const distance = calcDistance(this.position, { x: enemy.pathing.x, y: enemy.pathing.y });
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

            // Draw Attack Line
            game.context.lineWidth = 5;
            game.context.beginPath();
            game.context.moveTo(this.position.x, this.position.y);
            game.context.lineTo(targetEnemy.pathing.x, targetEnemy.pathing.y);
            game.context.stroke();
        }
    }

    draw(context, opacity) {
        if(!this.canDraw) {
            return;
        }
        
        const priorOpacity = context.globalAlpha;
        context.globalAlpha = opacity;
        context.drawImage(this.icon, this.position.x, this.position.y, 48, 48);
        if (isHoldingCtrl) {
            hollowCircle(context, this.position, this.range);
        }
        context.globalAlpha = priorOpacity;
    }
}

var towerMap = {
    "basic": new BeeTower({ x: 0, y: 0 }, 1, 50, "assets/hives/hive0.png", 18, 150, 25)
    // "smash": new BeeTower({ x: 0, y: 0 }, 2.3, 100, "orange", 18, 75, 50),
}

var enemyMap = {
    "basic": new GameEnemy({ x: 0, y: 0, index: 1 }, 5, 200, "red", 15)
}

var waveMap = {
    "beasy": [
        {
            quote: "This should be an easy start", // A quote displayed at the bottom of the screen
            enemies: [
                // enemy type, delay until next enemy
                "basic", 1000,
                "basic", 1000,
                "basic", 1000,
                "basic", 1000,
                "basic", 1000,
                "basic", 1000,
                "basic", 1000,
                "basic", 1000
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

    onClick(event) {
        // event.which contains which button
        // 1 is left, 2 is middle, 3 is right, 4 is strange
        if (event.which == 3 && this.placingTower) {
            this.placingTower = undefined;
            event.preventDefault();
        }

        if (event.which === 1 && this.placingTower) {
            if (mousePos.x > 1100 || mousePos.x < 0 || mousePos.y < 1) {
                return;
            }

            // Clone the towers positions so it doesn't get effected by the global object
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

        // Draw Path
        this.context.fillStyle = "red";
        for (const partOfPath of this.map.data.path) {
            this.context.fillRect(partOfPath.x, partOfPath.y, 5, 5);
        }

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

            if (Math.abs(this.map.data.path[enemy.pathing.index].x - enemy.pathing.x) <= 3
                && Math.abs(this.map.data.path[enemy.pathing.index].y - enemy.pathing.y) <= 3) {
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

        // Debug Information
        this.context.font = "18px Arial";
        this.context.fillStyle = "white";
        this.context.fillText(`(${mousePos.x}, ${mousePos.y})`, 15, 30);
        this.context.fillText(`Shift: ${this.isHoldingShift}`, 15, 50);
        this.context.fillText(`Ctrl: ${isHoldingCtrl}`, 15, 70);
        this.context.fillText(`Wave: ${wave}`, 15, 90);
        this.context.fillText(`Enemies: ${this.remainingEnemies()}`, 15, 110);
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
        this.wavePlayed = false;
        clearInterval(this.timerId);
    }

    log(data) {
        console.log(`[Game Stage | Defense] ${data}`);
    }
}