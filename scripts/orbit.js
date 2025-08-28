"use strict"

import { vecLength, vecLengthSq, twoPi, solveBisection, vecFromPolar, vecRotate } from "./math.js";

const G = 6.67430E-11;

class Orbit {
    constructor(sma, e, arg, mna, epoch, direction = 1
    ) {
        this.sma = sma;
        this.e = e;
        this.arg = arg;
        this.mna = mna;
        this.epoch = epoch;
        this.direction = direction;
    }

    static solveEccentricAnomaly(M, e) {
        const tau = twoPi;
        const maxIter = 100;
        const threshold = 1E-12;

        if (e < 0.8) {
            let E = M;
            for (let i = 0; i < maxIter; i++) {
                const f = E - e * Math.sin(E) - M;
                const fprime = 1 - e * Math.cos(E);
                const dE = -f / fprime;
                E += dE;
                if (Math.abs(dE) < threshold) break;
            }
            return E;
        } else if (e < 1) {
            M = ((M % tau) + tau) % tau;
            return solveBisection(
                (E) => E - e * Math.sin(E),
                0, tau, M, threshold, maxIter
            );
        } else {
            let H = Math.log(2 * Math.abs(M) / e + 1.8);
            for (let i = 0; i < maxIter; i++) {
                let f = e * Math.sinh(H) - H - M;
                let fprime = e * Math.cosh(H) - 1;
                let dH = -f / fprime;
                H += dH;
                if (Math.abs(dH) < 1E-12) break;
            }
            return H;
        }
    }

    static fromStateVectors(pos, vel, mu, epoch = 0) {
        const r = vecLength(pos);
        const v2 = vecLengthSq(vel);

        const dotRV = pos[0] * vel[0] + pos[1] * vel[1];

        const eVec = [
            ((v2 - mu / r) * pos[0] - dotRV * vel[0]) / mu,
            ((v2 - mu / r) * pos[1] - dotRV * vel[1]) / mu
        ];

        const e = vecLength(eVec);
        const energy = v2 / 2 - mu / r;

        let a;
        if (Math.abs(e - 1) < 1e-8) {
            a = Infinity;
        } else {
            a = -mu / (2 * energy);
        }

        const arg = Math.atan2(eVec[1], eVec[0]);

        let f = Math.atan2(pos[1], pos[0]) - arg;
        f = ((f % twoPi) + twoPi) % twoPi;

        let mna;
        if (e < 1) {
            const cosE = (e + Math.cos(f)) / (1 + e * Math.cos(f));
            const sinE =
                (Math.sqrt(1 - e * e) * Math.sin(f))
                / (1 + e * Math.cos(f));
            const E = Math.atan2(sinE, cosE);
            mna = E - e * Math.sin(E);
            mna = ((mna % twoPi) + twoPi) % twoPi;
        } else {
            const coshH =
                (e + Math.cos(f))
                / (1 + e * Math.cos(f));
            const H = Math.acosh(coshH);
            const sign = (dotRV >= 0) ? 1 : -1;
            mna = sign * (e * Math.sinh(H) - H);
        }

        const h = pos[0] * vel[1] - pos[1] * vel[0];
        const direction = (h >= 0) ? +1 : -1;

        return new Orbit(a, e, arg, mna, epoch, direction);
    }

    static getStateVectors(orbit, mu, time) {
        const { sma, e, arg, mna, epoch, direction } = orbit;

        const T = twoPi * Math.sqrt(sma * sma * sma / mu);
        const n = direction * (twoPi / T);
        const M = mna + n * (time - epoch);

        const E = Orbit.solveEccentricAnomaly(M, e);
        const cosE = Math.cos(E);
        const sinE = Math.sin(E);
        const sqrtOneMinusE2 = Math.sqrt(1 - e * e);
        const f = Math.atan2(sqrtOneMinusE2 * sinE, cosE - e);

        const r = sma * (1 - e * cosE);
        const pos = [0, 0], vel = [0, 0];
        vecFromPolar(pos, r, f + arg);

        const v = [
            -Math.sqrt(mu * sma) / r * sinE,
            Math.sqrt(mu * sma) / r * sqrtOneMinusE2 * cosE
        ];

        vecRotate(vel, v, arg);

        if (direction < 0) {
            vel[0] *= -1;
            vel[1] *= -1;
        }

        return { pos: pos, vel: vel };
    }

    static getPositionAtTime(orbit, mu, time) {
        return Orbit.getStateVectors(orbit, mu, time).pos;
    }

    static getVelocityAtTime(orbit, mu, time) {
        return Orbit.getStateVectors(orbit, mu, time).vel;
    }

    static getRadiusFromTrueAnomaly(sma, e, f) {
        return sma * (1 - e * e) / (1 + e * Math.cos(f));
    }

    static getPositionFromTrueAnomaly(orbit, f) {
        const { sma, e, arg, direction } = orbit;

        const r = this.getRadiusFromTrueAnomaly(sma, e, f);
        const trueAngle = direction * f + arg;
        
        const out = [0, 0];
        return vecFromPolar(out, r, trueAngle);
    }

    static getVelocityFromTrueAnomaly(orbit, mu, f) {
        const { sma, e } = orbit;

        const p = sma * (1 - e * e);
        const sqrtMuOverP = Math.sqrt(mu / p);

        const vr = sqrtMuOverP * e * Math.sin(f);
        const vtheta = sqrtMuOverP * (1 + e * Math.cos(f));

        const vx = vr * Math.cos(f) - vtheta * Math.sin(f);
        const vy = vr * Math.sin(f) + vtheta * Math.cos(f);

        return [vx, vy];
    }

    static getTrueAnomalyFromTime(orbit, mu, time) {
        const { sma, e, mna, epoch } = orbit;

        const dt = time - epoch;

        let M, f;
        if (e < 1) {
            const T = twoPi * Math.sqrt(sma * sma * sma / mu);
            const n = twoPi / T;
            M = mna + n * dt;
            M = ((M % twoPi) + twoPi) % twoPi;

            const E = Orbit.solveEccentricAnomaly(M, e);

            const cosE = Math.cos(E);
            const sinE = Math.sin(E);
            const sqrtOneMinusE2 = Math.sqrt(1 - e * e);

            f = Math.atan2(sqrtOneMinusE2 * sinE, cosE - e);
        } else {
            const n = Math.sqrt(-mu / (sma * sma * sma));
            M = mna + n * dt;

            const H = Orbit.solveEccentricAnomaly(M, e);

            const coshH = Math.cosh(H);
            const sinhH = Math.sinh(H);
            const sqrtE2Minus1 = Math.sqrt(e * e - 1);

            f = Math.atan2(sqrtE2Minus1 * sinhH, e - coshH);
        }

        return f;
    }

    static getTimeFromTrueAnomaly(orbit, mu, f) {
        const { sma, e, mna, epoch, direction } = orbit;

        if (e < 1) {
            const cosE = (e + Math.cos(f)) / (1 + e * Math.cos(f));
            const sinE = (Math.sqrt(1 - e * e) * Math.sin(f)) / (1 + e * Math.cos(f));
            let E = Math.atan2(sinE, cosE);

            let M = E - e * Math.sin(E);
            M = ((M % twoPi) + twoPi) % twoPi;

            const T = twoPi * Math.sqrt(sma * sma * sma / mu);
            const n = direction * (twoPi / T);

            let M0 = mna;
            let dM = M - M0;

            if (direction > 0 && dM < 0) dM += twoPi;
            if (direction < 0 && dM > 0) dM -= twoPi;

            const dt = dM / n;
            return epoch + dt;

        } else {
            const coshH = (e + Math.cos(f)) / (1 + e * Math.cos(f));
            const H = Math.acosh(coshH) * Math.sign(Math.tan(f / 2));

            const M = e * Math.sinh(H) - H;
            const n = direction * Math.sqrt(-mu / (sma * sma * sma));
            const dM = M - mna;

            const dt = dM / n;
            return epoch + dt;
        }
    }
}

export { G, Orbit }