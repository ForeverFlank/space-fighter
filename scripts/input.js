"use strict";

export const InputState = {
    mousePos: [0, 0],

    throttle: 0,
    sas: false,
    turning: 0,
    firing: 0,

    selectedWeapon: "cam"
}

export function setupInput({ canvas, timeSpeedRef, setTimeSpeed }) {
    window.addEventListener("keydown", (e) => {
        if (e.key === ",") {
            setTimeSpeed(Math.max(1, timeSpeedRef() / 10));
        } else if (e.key === ".") {
            setTimeSpeed(Math.min(100_000, timeSpeedRef() * 10));
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
}
