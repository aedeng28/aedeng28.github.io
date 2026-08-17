window.maxD = 3; window.brainMode = "SIMPLE"; window.PS = 10; window.MT = 240;
window.pop = []; window.cIdx = 0; window.gen = 1; window.cc = null; window.best = 0; window.ticks = 0; window.rtc = 0; window.camX = 0; window.simSpeed = 1; window.started = false;

const randW = (n) => { let a = []; for (let i = 0; i < n; i++) a.push((Math.random() - 0.5) * 2); return a; };
const mutW = (a, r, m) => a.map(w => Math.random() < r ? Math.max(-2, Math.min(2, w + (Math.random() - 0.5) * m)) : w);

class SegDNA {
    constructor(d = 0) {
        this.l = Math.random() * 20 + 35; this.t = Math.random() * 4 + 5; this.a = (Math.random() - 0.5) * 1.8;
        this.phase = Math.random() * Math.PI * 2; this.speed = Math.random() * 0.12 + 0.06;
        this.wIH = randW(16); this.wHO = randW(16); this.bi = randW(8); this.ch = [];
        if (d === 0) { this.ch.push(new SegDNA(1), new SegDNA(1)); } 
        else if (d < window.maxD && Math.random() < 0.7) { this.ch.push(new SegDNA(d + 1)); if (Math.random() < 0.3) this.ch.push(new SegDNA(d + 1)); }
    }
}
class DNA { constructor() { this.r = new SegDNA(0); this.f = 0; } }

function clone(n) { let c = Object.assign(Object.create(Object.getPrototypeOf(n)), n); c.ch = n.ch.map(clone); return c; }
function rehydrate(r) {
    let s = new SegDNA(); s.l = r.l; s.t = r.t; s.a = r.a; s.phase = r.phase; s.speed = r.speed;
    s.wIH = [...r.wIH]; s.wHO = [...r.wHO]; s.bi = [...r.bi]; s.ch = (r.ch || []).map(rehydrate); return s;
}

function mutate(n, d = 0) {
    if (Math.random() < 0.3) n.l = Math.max(20, Math.min(65, n.l + (Math.random() - 0.5) * 10));
    if (Math.random() < 0.3) n.t = Math.max(4, Math.min(12, n.t + (Math.random() - 0.5) * 2));
    if (Math.random() < 0.3) n.a = Math.max(-2, Math.min(2, n.a + (Math.random() - 0.5) * 0.3));
    if (window.brainMode === "SIMPLE") {
        if (Math.random() < 0.3) n.phase += (Math.random() - 0.5) * 0.5;
        if (Math.random() < 0.3) n.speed = Math.max(0.03, Math.min(0.25, n.speed + (Math.random() - 0.5) * 0.02));
    } else { n.wIH = mutW(n.wIH, 0.35, 0.4); n.wHO = mutW(n.wHO, 0.35, 0.4); n.bi = mutW(n.bi, 0.35, 0.2); }
    if (Math.random() < 0.15 && d < window.maxD && n.ch.length < 3) n.ch.push(new SegDNA(d + 1));
    if ((n.ch.length > 0 && d > 0 && Math.random() < 0.05) || (d >= window.maxD)) n.ch.splice(0, n.ch.length);
    n.ch.forEach(c => mutate(c, d + 1));
}

window.DNA = DNA; window.clone = clone; window.rehydrate = rehydrate; window.mutate = mutate;
