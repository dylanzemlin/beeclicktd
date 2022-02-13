class BeeUpgrade {
    constructor(name, honeyCost, honeyCostDecay, honeyOutput, requirePrevious, icon) {
        this.name = name;
        this.id = name.replace(" ", "-").toLowerCase();
        this.cost = honeyCost;
        this.costDecay = honeyCostDecay;
        this.output = honeyOutput;
        this.requirePrevious = requirePrevious;
        this.icon = icon;
        this.timerId = undefined;
        this.owned = 0;
    }

    add() {
        this.owned++;
    }
}

class GameStageClicker {
    constructor() {
        // name - honeyCost - honeyCostDecay - honeyOutput - requirePrevious, icon
        this.upgrades = {
            "honeycomb": new BeeUpgrade("Honeycomb", 5, 0.8, 1, 0, "https://beeclick.org/img/bee-clicker-upgrades.png"),
            "honeyboo": new BeeUpgrade("Honeyboo", 10, 0.6, 2, 5, "https://beeclick.org/img/bee-clicker-upgrades.png"),
        }

        $("#bee").click(() => this.onBeeClicked());
        for (const key of Object.keys(this.upgrades)) {
            const upgrade = this.upgrades[key];
            const clonedUpgrade = $(".fake-upgrade").clone();
            $(".icon", clonedUpgrade).css("background-image", `url(\"${upgrade.icon}\")`);
            $(".upgrade-text", clonedUpgrade).text(`${upgrade.name} (0)`);
            $(".upgrade-cost", clonedUpgrade).text(upgrade.cost);
            clonedUpgrade.attr("id", upgrade.id);
            clonedUpgrade.removeClass("hidden");
            clonedUpgrade.removeClass("fake-upgrade");
            clonedUpgrade.click(() => {
                if (honey < upgrade.cost + Math.ceil(upgrade.cost * upgrade.costDecay * upgrade.owned)
                    || clonedUpgrade.hasClass("unavailable")) {
                    return;
                }

                this.addUpgrade(upgrade);
            });
            $(".upgrades").append(clonedUpgrade);
        }
        this.log("Initialized");
    }

    onBeeClicked() {
        putHoney(1);
    }

    addUpgrade(upgrade) {
        putHoney(-1 * (upgrade.cost + (upgrade.cost * upgrade.costDecay * upgrade.owned)));

        const element = $(`#${upgrade.id}`);
        upgrade.owned++;
        $(".upgrade-cost", element).text(`${Math.floor(upgrade.cost + (upgrade.cost * upgrade.costDecay * upgrade.owned))}`);
        $(".upgrade-text", element).text(`${upgrade.name} (${upgrade.owned})`);
    }

    onSceneLoad() {
        this.timerId = setInterval(() => this.onBeeTick(), 100);
    }

    onSceneUnload() {
        clearInterval(this.timerId);
    }

    onBeeTick() {
        $("#stage-clicker .timer").text(`Time Remaining: ${moment.utc(click_time_remaining * 1000).format("mm:ss")}`);
        if (click_time_remaining <= 15) {
            $("#stage-clicker .timer").css("color", "red");
        } else {
            $("#stage-clicker .timer").css("color", "white");
        }

        let lastUpgrade = undefined;
        for (const key of Object.keys(this.upgrades)) {
            const upgrade = this.upgrades[key];
            const element = $(`#${upgrade.id}`);

            if (upgrade.owned !== 0) {
                const additive = upgrade.output * (upgrade.owned * 0.8) * 0.1;
                putHoney(additive);
            }

            if (honey >= upgrade.cost + (upgrade.cost * upgrade.costDecay * upgrade.owned)) {
                if (element == undefined || !element.hasClass("unavailable")) {
                    // The upgrade element was undefined or it was already available
                    lastUpgrade = upgrade;
                    continue;
                }

                if (lastUpgrade !== undefined && upgrade.requirePrevious > lastUpgrade.owned) {
                    // We do not have enough of the previous upgrade to use this one
                    lastUpgrade = upgrade;
                    continue;
                }

                element.removeClass("unavailable");
            } else {
                if (element == undefined || element.hasClass("unavailable")) {
                    lastUpgrade = upgrade;
                    continue;
                }

                element.addClass("unavailable");
            }

            lastUpgrade = upgrade;
        }
    }

    log(data) {
        console.log(`[Game Stage | Clicker] ${data}`);
    }
}