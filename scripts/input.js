"use strict";

import { Timewarp } from "./main.js";

export const InputState = {
    mousePos: [0, 0],

    throttle: 0,
    sas: true,
    turning: 0,
    firing: 0,

    camMode: true,
    selectedWeapon: "cam"
}

export function setupInput(canvas) {
    window.addEventListener("keydown", (e) => {
        if (e.key === ",") {
            Timewarp.index = Math.max(
                0, Timewarp.index - 1
            );
        }
        if (e.key === ".") {
            Timewarp.index = Math.min(
                Timewarp.index + 1, Timewarp.options.length - 1
            );
        }
        if (e.key === '/') {
            Timewarp.index = 0;
        }
        Timewarp.speed = Timewarp.options[Timewarp.index];

        if (e.key === "c") {
            InputState.camMode = !InputState.camMode;
        }

        if (e.key === "t") {
            InputState.sas = !InputState.sas;
        }

        if (e.key === "z") {
            InputState.throttle = 1;
        }
        if (e.key === "x") {
            InputState.throttle = 0;
        }

        InputState.turning = 0;
        if (e.key === "q") {
            InputState.turning += 1;
        }
        if (e.key === "e") {
            InputState.turning -= 1;
        }
    });

    window.addEventListener("keyup", (e) => {
        InputState.turning = 0;
    });

    canvas.addEventListener("mousedown", (e) => {
        if (e.button === 0) {
            InputState.firing = true;
        }
    });

    canvas.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect();
        InputState.mousePos = [
            e.clientX - rect.left,
            e.clientY - rect.top
        ];
    });

    canvas.addEventListener("mouseup", (e) => {
        InputState.firing = false;
    });

    canvas.addEventListener("mouseleave", (e) => {
        InputState.firing = false;
    });

    const weaponsContainer = document.getElementById("weapons-menu");
    weaponsContainer.addEventListener("click", (e) => {
        if (e.target.tagName !== "BUTTON") return;
        const weapon = e.target.getAttribute("data-weapon");
        InputState.selectedWeapon = weapon;
    });

    const camButton = document.getElementById("button-cam");
    camButton.addEventListener("click", () => {
        InputState.camMode = !InputState.camMode;
    });
}
