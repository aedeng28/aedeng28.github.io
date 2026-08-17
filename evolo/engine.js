// --- VERLET PHYSICS & BRAIN VISUALIZATION SYSTEMS ---
const cv = document.getElementById('s'), cx = cv.getContext('2d');
const nc = document.getElementById('nc'), nx = nc.getContext('2d');

cv.width = window.innerWidth; cv.height = window.innerHeight;
const GY = cv.height - 180, PS = 10, MT = 240;

let pop = [], cIdx = 0, gen = 1, cc = null, best = 0, ticks = 0, maxD = 3, rtc = 0, camX = 0, simSpeed = 1, brainMode = "SIMPLE", started = false;

document.getElementById('ds').addEventListener('input', (e) => {
    maxD = parseInt(e.target.value);
    document.getElementById('dv').innerText = maxD;
});

document.getElementById('sb').addEventListener('click', () => {
    simSpeed = simSpeed === 1 ? 2 : simSpeed === 2 ? 5 : 1;
    document.getElementById('sb').innerText = `⏩ Speed: ${simSpeed}x`;
});

document.getElementById('tb').addEventListener('click', () => {
    if (started) return alert("Reset page to change brain mode!");
    brainMode = brainMode === "SIMPLE" ? "SMART" : "SIMPLE";
    document.getElementById('tb').style.background = brainMode === "SIMPLE" ? "#ff9800" : "#009688";
    document.getElementById('tb').innerText = `🧠 Brain: ${brainMode}`;
    initPop();
});

document.getElementById('cb').addEventListener('click', () => {
    if (pop[cIdx]) navigator.clipboard.writeText(JSON.stringify(pop[cIdx].r));
});

document.getElementById('lb').addEventListener('click', () => {
    started = true;
    try {
        pop[cIdx].r = rehydrate(JSON.parse(document.getElementById('li').value.trim()));
        pop[cIdx].f = 0; cc = new Creature(pop[cIdx]); ticks = 0;
    } catch (e) { alert("Error!"); }
});

class Pt { constructor(x, y) { this.x = x; this.y = y; this.oX = x; this.oY = y; this.ig = false; } }
class Bone { constructor(p1, p2, len, thick) { this.p1 = p1; this.p2 = p2; this.l = len; this.t = thick; } }
class Muscle { constructor(p1, p2, baseLen, dna) { this.p1 = p1; this.p2 = p2; this.bL = baseLen; this.cL = baseLen; this.d = dna; this.tn = 0; } }

class Creature {
    constructor(dna) {
        this.dna = dna; this.pts = []; this.bones = []; this.muscles = []; this.sX = 200;
        let p0 = new Pt(this.sX, GY - 140), p1 = new Pt(this.sX + dna.r.l, GY - 140);
        this.pts.push(p0, p1); this.bones.push(new Bone(p0, p1, dna.r.l, dna.r.t));
        
        let self = this;
        function bld(node, pPt, pParentPt, cAn) {
            let a = cAn + node.a, eP = new Pt(pPt.x + Math.cos(a) * node.l, pPt.y + Math.sin(a) * node.l);
            self.pts.push(eP); self.bones.push(new Bone(pPt, eP, node.l, node.t));
            let dX = eP.x - pParentPt.x, dY = eP.y - pParentPt.y, ds = Math.sqrt(dX * dX + dY * dY) || 1;
            self.muscles.push(new Muscle(pParentPt, eP, ds, node)); 
            node.ch.forEach(c => bld(c, eP, pPt, a));
        }
        dna.r.ch.forEach(c => bld(c, p1, p0, 0));
                // FIXED: Set these to empty arrays so the script compiles perfectly
        this.sV = []; 
        this.hV = []; 
        this.oV = [];

    }
    update() {
        started = true;
        this.pts.forEach(p => { let vx = (p.x - p.oX) * 0.85, vy = (p.y - p.oY) * 0.85; p.oX = p.x; p.oY = p.y; p.x += vx; p.y += vy + 0.45; });
        
        if (brainMode === "SIMPLE") {
            this.muscles.forEach(m => { if (m.d) { m.tn = Math.sin(rtc * m.d.speed + m.d.phase); m.cL = m.bL * (1 + m.tn * 0.35); } });
        } else {
            let mb = this.bones.find(() => true);
            this.sV[0] = Math.sin(ticks * 0.05);
            this.sV[1] = mb ? Math.atan2(mb.p2.y - mb.p1.y, mb.p2.x - mb.p1.x) : 0;
            this.sV[2] = this.pts.some(p => p.ig) ? 1 : 0;
            this.sV[3] = Math.sin(rtc * 0.1);
            let dB = this.dna.r;
            for (let h = 0; h < 4; h++) { 
                let sum = dB.bi[h]; 
                for (let i = 0; i < 4; i++) sum += this.sV[i] * dB.wIH[h * 4 + i]; 
                this.hV[h] = Math.tanh(sum); 
            }
            for (let o = 0; o < 4; o++) { 
                let sum = dB.bi[4 + o]; 
                for (let h = 0; h < 4; h++) sum += this.hV[h] * dB.wHO[o * 4 + h]; 
                this.oV[o] = Math.tanh(sum); 
            }
            this.muscles.forEach((m, idx) => { if (m.d) { m.tn = this.oV[idx % 4]; m.cL = m.bL * (1 + m.tn * 0.35); } });
        }
        for (let p = 0; p < 8; p++) {
            this.bones.forEach(b => { let dx = b.p2.x - b.p1.x, dy = b.p2.y - b.p1.y, ds = Math.sqrt(dx * dx + dy * dy) || 1, df = b.l - ds, co = (df / ds) * 0.5, ox = dx * co, oy = dy * co; b.p1.x -= ox; b.p1.y -= oy; b.p2.x += ox; b.p2.y += oy; });
            this.muscles.forEach(m => { let dx = m.p2.x - m.p1.x, dy = m.p2.y - m.p1.y, ds = Math.sqrt(dx * dx + dy * dy) || 1, df = m.cL - ds, co = (df / ds) * 0.3, ox = dx * co, oy = dy * co; m.p1.x -= ox; m.p1.y -= oy; m.p2.x += ox; m.p2.y += oy; });
            this.pts.forEach(p => { if (p.y >= GY) { p.y = GY; p.x = p.oX; p.oY = GY; p.ig = true; } else { p.ig = false; } });
        }
        camX += (this.getavg() - 300 - camX) * 0.08;
    }
    draw() {
        cx.save(); cx.translate(-camX, 0);
        cx.strokeStyle = '#555'; cx.lineWidth = 4; cx.beginPath(); cx.moveTo(camX, GY); cx.lineTo(camX + cv.width, GY); cx.stroke();
        this.muscles.forEach(m => { cx.strokeStyle = m.tn > 0 ? '#ff1744' : '#9a0007'; cx.lineWidth = m.tn > 0 ? 4 : 2; cx.beginPath(); cx.moveTo(m.p1.x, m.p1.y); cx.lineTo(m.p2.x, m.p2.y); cx.stroke(); });
        this.bones.forEach(b => { cx.strokeStyle = '#4caf50'; cx.lineWidth = b.t; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(b.p1.x, b.p1.y); cx.lineTo(b.p2.x, b.p2.y); cx.stroke(); });
        this.pts.forEach(p => { cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(p.x, p.y, 5, 0, Math.PI * 2); cx.fill(); });
        cx.restore();
        drFB(this.sV, this.hV, this.oV, this.dna.r);
    }
    getavg() { let s = 0; this.pts.forEach(p => s += p.x); return s / this.pts.length; }
}

function drFB(sV, hV, oV, dB) {
    nx.clearRect(0, 0, nc.width, nc.height);
    if (brainMode === "SIMPLE") {
        nx.fillStyle = '#aaa'; nx.font = '10px sans-serif'; nx.fillText("Simple Oscillator Mode", 30, 55); nx.fillText("Limbs move on an isolated clock loop", 10, 75);
        if (cc && cc.muscles.length > 0) { nx.strokeStyle = '#ff1744'; nx.lineWidth = 2; nx.beginPath(); nx.moveTo(20, 110); for (let x = 20; x < 180; x++) nx.lineTo(x, 110 + Math.sin((x + ticks) * 0.08) * 10); nx.stroke(); }
        return;
    }
    let sX = 20, hX = 105, oX = 190;
    let sY = Array.from({ length: 4 }, (_, i) => 30 + i * 32), hY = Array.from({ length: 4 }, (_, i) => 30 + i * 32), oY = Array.from({ length: 4 }, (_, i) => 30 + i * 32);
    for (let i = 0; i < 4; i++) {
        let inI = Math.abs(sV[i]);
        for (let h = 0; h < 4; h++) {
            let w = dB.wIH[h * 4 + i], op = Math.max(0.1, Math.min(0.8, inI * 0.8));
            nx.lineWidth = Math.abs(w) * 2.5 + 0.5; nx.strokeStyle = w > 0 ? `rgba(76,175,80,${op})` : `rgba(255,23,68,${op})`;
            nx.beginPath(); nx.moveTo(sX, sY[i]); nx.lineTo(hX, hY[h]); nx.stroke();
        }
    }
    for (let h = 0; h < 4; h++) {
        let hdI = Math.abs(hV[h]);
        for (let o = 0; o < 4; o++) {
            let w = dB.wHO[o * 4 + h], op = Math.max(0.1, Math.min(0.8, hdI * 0.8));
            nx.lineWidth = Math.abs(w) * 2.5 + 0.5; nx.strokeStyle = w > 0 ? `rgba(76,175,80,${op})` : `rgba(255,23,68,${op})`;
            nx.beginPath(); nx.moveTo(hX, hY[h]); nx.lineTo(oX, oY[o]); nx.stroke();
        }
    }
    for (let i = 0; i < 4; i++) { nx.fillStyle = '#fff'; nx.shadowBlur = Math.abs(sV[i]) * 10; nx.shadowColor = '#2196f3'; nx.beginPath(); nx.arc(sX, sY[i], 5, 0, Math.PI * 2); nx.fill(); }
    for (let h = 0; h < 4; h++) { nx.fillStyle = '#fff'; nx.shadowBlur = Math.abs(hV[h]) * 10; nx.shadowColor = '#9c27b0'; nx.beginPath(); nx.arc(hX, hY[h], 5, 0, Math.PI * 2); nx.fill(); }
    for (let o = 0; o < 4; o++) { nx.fillStyle = '#fff'; nx.shadowBlur = Math.abs(oV[o]) * 12; nx.shadowColor = oV[o] > 0 ? '#ff1744' : '#b71c1c'; nx.beginPath(); nx.arc(oX, oY[o], 5, 0, Math.PI * 2); nx.fill(); }
    nx.shadowBlur = 0; nx.fillStyle = '#aaa'; nx.font = '8px sans-serif'; nx.fillText("SENSORS", 5, 14); nx.fillText("HIDDEN", 85, 14); nx.fillText("MUSCLES", 170, 14);
}

function start() { document.getElementById("g").innerText = gen; document.getElementById("c").innerText = cIdx + 1; cc = new Creature(pop[cIdx]); ticks = 0; }

function nextGen() {
    pop.sort((a, b) => b.f - a.f); if (pop[0].f > best) best = pop[0].f; document.getElementById("b").innerText = Math.round(best);
    let nP = []; let s1 = new DNA(); s1.r = clone(pop[0].r); s1.f = pop[0].f; let s2 = new DNA(); s2.r = clone(pop[0].r); s2.f = pop[0].f; nP.push(s1, s2);
    while (nP.length < PS) { let p = pop[Math.floor(Math.random() * 3)]; let c = new DNA(); c.r = clone(p.r); mutate(c.r); nP.push(c); }
    pop = nP; cIdx = 0; gen++; start();
}

function loop() {
    for (let s = 0; s < simSpeed; s++) { if (cc) { rtc += 0.15; cc.update(); ticks++; if (ticks >= MT) { pop[cIdx].f = Math.max(0, cc.getavg() - cc.sX); cIdx++; if (cIdx < PS) start(); else nextGen(); } } }
    cx.clearRect(0, 0, cv.width, cv.height); if (cc) cc.draw(); requestAnimationFrame(loop);
}

function initPop() { pop = []; for (let i = 0; i < PS; i++) pop.push(new DNA()); cIdx = 0; gen = 1; best = 0; document.getElementById("b").innerText = 0; start(); }

initPop(); loop();
window.addEventListener('resize', () => { cv.width = window.innerWidth; cv.height = window.innerHeight; });
