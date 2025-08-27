"use strict";

import { ctx, canvas, resizeCanvas, renderScene } from "./renderer.js";
import { setupInput } from "./input.js";
import { updateHUD } from "./hud.js";
import { Game } from "./game.js";
import { J2000 } from "./time.js";

const startDate = new Date(Date.UTC(2063, 7, 25, 12, 0, 0))
let time = (startDate.getTime() - J2000.getTime()) / 1000;

let timeSpeed = 1;
let lastLoop = performance.now();

const targetFrameTime = 1 / 60;

document.addEventListener('contextmenu', (e) =>
    e.preventDefault()
);

function start() {
    Game.start(time);
    setupInput({
        canvas,
        timeSpeedRef: () => timeSpeed,
        setTimeSpeed: (v) => timeSpeed = v
    });
    resizeCanvas();
    requestAnimationFrame(loop);
}

function loop() {
    const now = performance.now();
    const frameTime = now - lastLoop;
    const dt = timeSpeed * targetFrameTime;
    time += dt;

    Game.update(time, timeSpeed, dt);

    renderScene(ctx, canvas, time);
    updateHUD(time);

    document.getElementById("fps").innerText = frameTime.toFixed(1) + " ms";

    lastLoop = now;
    requestAnimationFrame(loop);
}

export { start };
