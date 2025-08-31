"use strict";

import { Armor } from "./armor.js";

class Part {
    constructor({
        partType = "",
        pos = [0, 0],
        size = [10, 10, 10],
        density = 100,
        healthPerArea = 100,
        armorTiers = [0, 0, 0],
        armorEffectivity = 1,
        hitChance = 1,
        damageMultiplier = 1
    }) {
        this.partType = partType;
        this.pos = pos;
        this.size = size;
        this.density = density;
        this.healthPerArea = healthPerArea;

        this.armorConfig = new Armor(armorTiers, armorEffectivity);

        this.area = (size[0] + size[1]) * size[2] * 0.5;

        this.maxHealth = healthPerArea * this.area;
        this.health = this.maxHealth;

        this.mass =
            (density +
                this.armorConfig.massPerArea[0] +
                this.armorConfig.massPerArea[1] +
                this.armorConfig.massPerArea[2]) *
            this.area;

        this.maxArmor = [
            this.armorConfig.armorPerArea[0] * this.area,
            this.armorConfig.armorPerArea[1] * this.area,
            this.armorConfig.armorPerArea[2] * this.area
        ];
        this.armor = [...this.maxArmor];

        this.armorReduction = [...this.armorConfig.reduction];

        this.hitChance = hitChance;
        this.damageMultiplier = damageMultiplier;
    }

    getMass() {
        return this.mass;
    }
}

class HullPart extends Part {
    constructor(opts = {}) {
        super({
            partType: "Hull",
            ...opts
        });
    }
}

class ControlPart extends Part {
    constructor({ powerUsage = 1, ...opts }) {
        super({
            partType: "Control",
            ...opts
        });
        this.powerUsage = powerUsage;
    }
}

class TankPart extends Part {
    constructor({
        propDensity = 500,
        startProp = 1,
        ...opts
    }) {
        super({
            partType: "Tank",
            ...opts
        });

        this.propDensity = propDensity;
        this.propAmount = this.area * propDensity * startProp;
    }

    getMass() {
        return super.getMass() + this.propAmount;
    }
}

class EnginePart extends Part {
    constructor({
        thrust = 100000,
        isp = 1000,
        ...opts
    }) {
        super({
            partType: "Engine",
            density: 50,
            armorEffectivity: 0.5,
            ...opts
        });
        this.thrust = thrust;
        this.isp = isp;
    }
}

class ReactorPart extends Part {
    constructor({
        powerGeneration = 10,
        heatGeneration = 15,
        powerStorage = 1000,
        ...opts
    }) {
        super({
            partType: "Reactor",
            density: 200,
            ...opts
        });
        this.powerGeneration = powerGeneration;
        this.heatGeneration = heatGeneration;
        this.powerStorage = powerStorage;
    }
}

class RadiatorPart extends Part {
    constructor({
        dissipationPerArea = 0.2,
        ...opts
    }) {
        super({
            partType: "Radiator",
            density: 10,
            healthPerArea: 10,
            armorEffectivity: 0.1,
            hitChance: 0.2,
            ...opts
        });
        this.maxDissipationRate = this.area * dissipationPerArea;
    }

    getDissipationRate() {
        return this.maxDissipationRate * (this.health / this.maxHealth);
    }
}

export {
    Part,
    HullPart,
    ControlPart,
    TankPart,
    EnginePart,
    ReactorPart,
    RadiatorPart
};
