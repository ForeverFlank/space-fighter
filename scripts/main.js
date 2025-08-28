"use strict";

import { ctx, canvas, resizeCanvas, renderScene } from "./renderer.js";
import { setupInput } from "./input.js";
import { updateHUD } from "./hud.js";
import { Game } from "./game.js";
import { J2000 } from "./time.js";
import { updateCamera } from "./camera.js";

const startDate = new Date(Date.UTC(2071, 7, 25, 12, 0, 0))
let time = (startDate.getTime() - J2000.getTime()) / 1000;

export const Timewarp = {
    speed: 1,
    index: 0,
    available: true,
    options: [1, 2, 3, 5, 10, 100, 1000, 10000, 100000],
    maxPhysicsTimewarpIndex: 3,
};

let lastLoop = performance.now();

const targetFrameTime = 1 / 60;

document.addEventListener('contextmenu', (e) =>
    e.preventDefault()
);

function start() {
    Game.start(time);
    setupInput(canvas);
    resizeCanvas();
    updateCamera(time);
    requestAnimationFrame(loop);
}

function loop() {
    const now = performance.now();
    const frameTime = now - lastLoop;
    const dt = Timewarp.speed * targetFrameTime;
    time += dt;

    Game.update(time, Timewarp.speed, dt);
    renderScene(ctx, canvas, time);
    updateHUD(time);

    document.getElementById("fps").innerText = frameTime.toFixed(1) + " ms";

    lastLoop = now;
    requestAnimationFrame(loop);
}

export { start };
