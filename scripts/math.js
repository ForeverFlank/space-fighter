"use strict"

const twoPi = 2 * Math.PI;
const deg2Rad = Math.PI / 180;

function vecLength(vec) {
    return Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1]);
}

function vecLengthSq(vec) {
    return vec[0] * vec[0] + vec[1] * vec[1];
}

function vecAdd(v1, v2) {
    return [
        v1[0] + v2[0],
        v1[1] + v2[1]
    ]
}

function vecSub(v1, v2) {
    return [
        v1[0] - v2[0],
        v1[1] - v2[1]
    ]
}

function vecMul(vec, scalar) {
    return [
        vec[0] * scalar,
        vec[1] * scalar
    ]
}

function vecFromPolar(r, angle) {
    return [
        r * Math.cos(angle),
        r * Math.sin(angle)
    ];
}

function vecRotate(vec, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    return [
        vec[0] * c - vec[1] * s,
        vec[0] * s + vec[1] * c
    ];
}

function solveBisection(
    fn,
    left,
    right,
    target = 0,
    threshold = 1E-10,
    maxIter = 100
) {
    let l = left;
    let r = right;
    let m;
    for (let i = 0; i < maxIter; i++) {
        m = (l + r) / 2;
        const result = fn(m);

        if (Math.abs(result) < threshold || Math.abs(r - l) < threshold) {
            break;
        }

        if (result < target) {
            l = m;
        } else {
            r = m;
        }
    }

    return m;
}

export { twoPi, deg2Rad, vecLength, vecLengthSq, vecAdd, vecSub, vecMul, vecFromPolar, vecRotate, solveBisection }