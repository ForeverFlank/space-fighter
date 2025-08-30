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
            eff * tiers[0] * 10,
            eff * tiers[1] * 5,
            eff * tiers[2] * 2,
        ]
        this.reduction = [
            eff * tiers[0] * 0.2,
            eff * tiers[1] * 0.2,
            eff * tiers[2] * 0.2,
        ];
    }
}

export { Armor }