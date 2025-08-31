"use strict";

class Armor {
    constructor(tiers, eff = 1) {
        this.tiers = tiers;

        const massFactor = (tier) => tier * (tier + 1) * 0.5
        this.massPerArea = [
            eff * massFactor(tiers[0]) * 50,
            eff * massFactor(tiers[1]) * 10,
            eff * massFactor(tiers[2]) * 25
        ];
        this.armorPerArea = [
            eff * tiers[0] * 20,
            eff * tiers[1] * 10,
            eff * tiers[2] * 5,
        ]
        this.reduction = [
            eff * (1 - 2 ** -tiers[0]),
            eff * (1 - 2 ** -tiers[1]),
            eff * (1 - 2 ** -tiers[2]),
        ];
    }
}

export { Armor }