"use strict"

const twoPi = 2 * Math.PI;
const deg2Rad = Math.PI / 180;

function vecLength(vec) {
    return Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1]);
}

function vecLengthSq(vec) {
    return vec[0] * vec[0] + vec[1] * vec[1];
}

function vecDistance(a, b) {
    const x = a[0] - b[0];
    const y = a[1] - b[1];
    return Math.sqrt(x * x + y * y);
}

function vecDistanceSq(a, b) {
    const x = a[0] - b[0];
    const y = a[1] - b[1];
    return x * x + y * y;
}

function vecNormalize(out, vec) {
    const len = vecLength(vec);
    if (len === 0) {
        out[0] = 0;
        out[1] = 0;
    } else {
        out[0] = vec[0] / len;
        out[1] = vec[1] / len;
    }
    return out;
}

function vecAdd(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    return out;
}

function vecSub(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    return out;
}

function vecMul(out, vec, scalar) {
    out[0] = vec[0] * scalar;
    out[1] = vec[1] * scalar;
    return out;
}

function vecFromPolar(out, r, angle) {
    out[0] = r * Math.cos(angle);
    out[1] = r * Math.sin(angle);
    return out;
}

function vecRotate(out, vec, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const x = vec[0], y = vec[1];
    out[0] = x * c - y * s;
    out[1] = x * s + y * c;
    return out;
}

function vecMulAdd(out, a, b, scalar) {
    out[0] = a[0] + b[0] * scalar;
    out[1] = a[1] + b[1] * scalar;
    return out;
}

function vecDot(a, b) {
    return a[0] * b[0] + a[1] * b[1];
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

export {
    twoPi, deg2Rad,
    vecLength, vecLengthSq,
    vecDistance, vecDistanceSq,
    vecNormalize,
    vecAdd, vecSub, vecMul, vecMulAdd,
    vecFromPolar, vecRotate, vecDot,
    solveBisection
}