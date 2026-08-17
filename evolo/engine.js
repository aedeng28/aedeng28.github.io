const cv = document.getElementById('s'), cx = cv.getContext('2d');
const nc = document.getElementById('nc'), nx = nc.getContext('2d');
cv.width = window.innerWidth; cv.height = window.innerHeight; const GY = cv.height - 180;

document.getElementById('ds').addEventListener('input', (e) => { window.maxD = parseInt(e.target.value); document.getElementById('dv').innerText = window.maxD; });
document.getElementById('sb').addEventListener('click', () => { window.simSpeed = window.simSpeed === 1 ? 2 : window.simSpeed === 2 ? 5 : 1; document.getElementById('sb').innerText = `⏩ Speed: ${window.simSpeed}x`; });
document.getElementById('tb').addEventListener('click', () => {
    if (window.started) return alert("Reset the page layout to switch network channels mid-simulation!");
    window.brainMode = window.brainMode === "SIMPLE" ? "SMART" : "SIMPLE";
    document.getElementById('tb').style.background = window.brainMode === "SIMPLE" ? "#ff9800" : "#009688";
    document.getElementById('tb').innerText = `🧠 Brain: ${window.brainMode}`; initPop();
});
document.getElementById('cb').addEventListener('click', () => { if (window.pop[window.cIdx]) navigator.clipboard.writeText(JSON.stringify(window.pop[window.cIdx].r)); });
document.getElementById('lb').addEventListener('click', () => { window.started = true; try { window.pop[window.cIdx].r = window.rehydrate(JSON.parse(document.getElementById('li').value.trim())); window.pop[window.cIdx].f = 0; window.cc = new Creature(window.pop[window.cIdx]); window.ticks = 0; } catch (e) { alert("Error parsing layout code!"); } });

class Pt { constructor(x, y) { this.x = x; this.y = y; this.oX = x; this.oY = y; this.ig = false; } }
class Bone { constructor(p1, p2, len, thick) { this.p1 = p1; this.p2 = p2; this.l = len; this.t = thick; } }
class Muscle { constructor(p1, p2, baseLen, dna) { this.p1 = p1; this.p2 = p2; this.bL = baseLen; this.cL = baseLen; this.d = dna; this.tn = 0; } }

class Creature {
    constructor(dna) {
        this.dna = dna; this.pts = []; this.bones = []; this.muscles = []; this.sX = 200;
        let p0 = new Pt(this.sX, GY - 140), p1 = new Pt(this.sX + dna.r.l, GY - 140); this.pts.push(p0, p1); this.bones.push(new Bone(p0, p1, dna.r.l, dna.r.t));
        let self = this; function bld(node, pPt, pParentPt, cAn) {
            let a = cAn + node.a, eP = new Pt(pPt.x + Math.cos(a) * node.l, pPt.y + Math.sin(a) * node.l); self.pts.push(eP); self.bones.push(new Bone(pPt, eP, node.l, node.t));
            let dX = eP.x - pParentPt.x, dY = eP.y - pParentPt.y, ds = Math.sqrt(dX * dX + dY * dY) || 1; self.muscles.push(new Muscle(pParentPt, eP, ds, node)); node.ch.forEach(c => bld(c, eP, pPt, a));
        }
        dna.r.ch.forEach(c => bld(c, p1, p0, 0)); this.sV = []; this.hV = []; this.oV = [];
    }
    update() {
        window.started = true; this.pts.forEach(p => { let vx = (p.x - p.oX) * 0.85, vy = (p.y - p.oY) * 0.85; p.oX = p.x; p.oY = p.y; p.x += vx; p.y += vy + 0.45; });
        if (window.brainMode === "SIMPLE") { this.muscles.forEach(m => { if (m.d) { m.tn = Math.sin(window.rtc * m.d.speed + m.d.phase); m.cL = m.bL * (1 + m.tn * 0.35); } }); } 
        else {
            let mb = this.bones.find(() => true); this.sV = [Math.sin(window.ticks * 0.05), mb ? Math.atan2(mb.p2.y - mb.p1.y, mb.p2.x - mb.p1.x) : 0, this.pts.some(p => p.ig) ? 1 : 0, Math.sin(window.rtc * 0.1)]; let dB = this.dna.r;
            for (let h = 0; h < 4; h++) { let sum = dB.bi[h]; for (let i = 0; i < 4; i++) sum += this.sV[i] * dB.wIH[h * 4 + i]; this.hV[h] = Math.tanh(sum); }
            for (let o = 0; o < 4; o++) { let sum = dB.bi[4 + o]; for (let h = 0; h < 4; h++) sum += this.hV[h] * dB.wHO[o * 4 + h]; this.oV[o] = Math.tanh(sum); }
            this.muscles.forEach((m, idx) => { if (m.d) { m.tn = this.oV[idx % 4]; m.cL = m.bL * (1 + m.tn * 0.35); } });
        }
        for (let p = 0; p < 8; p++) {
            this.bones.forEach(b => { let dx = b.p2.x - b.p1.x, dy = b.p2.y - b.p1.y, ds = Math.sqrt(dx * dx + dy * dy) || 1, df = b.l - ds, co = (df / ds) * 0.5, ox = dx * co, oy = dy * co; b.p1.x -= ox; b.p1.y -= oy; b.p2.x += ox; b.p2.y += oy; });
            this.muscles.forEach(m => { let dx = m.p2.x - m.p1.x, dy = m.p2.y - m.p1.y, ds = Math.sqrt(dx * dx + dy * dy) || 1, df = m.cL - ds, co = (df / ds) * 0.3, ox = dx * co, oy = dy * co; m.p1.x -= ox; m.p1.y -= oy; m.p2.x += ox; m.p2.y += oy; });
            this.pts.forEach(p => { if (p.y >= GY) { p.y = GY; p.x = p.oX; p.oY = GY; p.ig = true; } else { p.ig = false; } });
        }
        window.camX += (this.getavg() - 300 - window.camX) * 0.08;
    }
    draw() {
        cx.save(); cx.translate(-window.camX, 0); cx.strokeStyle = '#555'; cx.lineWidth = 4; cx.beginPath(); cx.moveTo(window.camX, GY); cx.lineTo(window.camX + cv.width, GY); cx.stroke();
        this.muscles.forEach(m => { cx.strokeStyle = m.tn > 0 ? '#ff1744' : '#9a0007'; cx.lineWidth = m.tn > 0 ? 4 : 2; cx.beginPath(); cx.moveTo(m.p1.x, m.p1.y); cx.lineTo(m.p2.x, m.p2.y); cx.stroke(); });
        this.bones.forEach(b => { cx.strokeStyle = '#4caf50'; cx.lineWidth = b.t; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(b.p1.x, b.p1.y); cx.lineTo(b.p2.x, b.p2.y); cx.stroke(); });
        this.pts.forEach(p => { cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(p.x, p.y, 5, 0, Math.PI * 2); cx.fill(); }); cx.restore(); drFB(this.sV, this.hV, this.oV, this.dna.r);
    }
    getavg() { let s = 0; this.pts.forEach(p => s += p.x); return s / this.pts.length; }
}

function drFB(sV, hV, oV, dB) {
    nx.clearRect(0, 0, nc.width, nc.height);
    if (window.brainMode === "SIMPLE") {
        nx.fillStyle = '#aaa'; nx.font = '10px sans-serif'; nx.fillText("Simple Oscillator Mode", 30, 55); nx.fillText("Limbs move on an isolated clock loop", 10, 75);
        if (window.cc && window.cc.muscles.length > 0) { nx.strokeStyle = '#ff1744'; nx.lineWidth = 2; nx.beginPath(); nx.moveTo(20, 110); for (let x = 20; x < 180; x++) nx.lineTo(x, 110 + Math.sin((x + window.ticks) * 0.08) * 10); nx.stroke(); } return;
    }
    let sX = 20, hX = 105, oX = 190; let sY = Array.from({ length: 4 }, (_, i) => 30 + i * 32), hY = Array.from({ length: 4 }, (_, i) => 30 + i * 32), oY = Array.from({ length: 4 }, (_, i) => 30 + i * 32);
    for (let i = 0; i < 4; i++) { let inI = Math.abs(sV[i] || 0); for (let h = 0; h < 4; h++) { let w = dB.wIH[h * 4 + i], op = Math.max(0.1, Math.min(0.8, inI * 0.8)); nx.lineWidth = Math.abs(w) * 2.5 + 0.5; nx.strokeStyle = w > 0 ? `rgba(76,175,80,${op})` : `rgba(255,23,68,${op})`; nx.beginPath(); nx.moveTo(sX, sY[i]); nx.lineTo(hX, hY[h]); nx.stroke(); } }
    for (let h = 0; h < 4; h++) { let hdI = Math.abs(hV[h] || 0); for (let o = 0; o < 4; o++) { let w = dB.wHO[o * 4 + h], op = Math.max(0.1, Math.min(0.8, hdI * 0.8)); nx.lineWidth = Math.abs(w) * 2.5 + 0.5; nx.strokeStyle = w > 0 ? `rgba(76,175,80,${op})` : `rgba(255,23,68,${op})`; nx.beginPath(); nx.moveTo(hX, hY[h]); nx.lineTo(oX, oY[o]); nx.stroke(); } }
    for (let i = 0; i < 4; i++) { nx.fillStyle = '#fff'; nx.shadowBlur = Math.abs(sV[i] || 0) * 10; nx.shadowColor = '#2196f3'; nx.beginPath(); nx.arc(sX, sY[i], 4, 0, Math.PI * 2); nx.fill(); }
    for (let h = 0; h < 4; h++) { nx.fillStyle = '#fff'; nx.shadowBlur = Math.abs(hV[h] || 0) * 10; nx.shadowColor = '#9c27b0'; nx.beginPath(); nx.arc(hX, hY[h], 4, 0, Math.PI * 2); nx.fill(); }
    for (let o = 0; o < 4; o++) { nx.fillStyle = '#fff'; nx.shadowBlur = Math.abs(oV[o] || 0) * 10; nx.shadowColor = oV[o] > 0 ? '#ff1744' : '#b71c1c'; nx.beginPath(); nx.arc(oX, oY[o], 4, 0, Math.PI * 2); nx.fill(); }
    nx.shadowBlur = 0; nx.fillStyle = '#aaa'; nx.font = '8px sans-serif'; nx.fillText("SENSORS", 5, 12); nx.fillText("HIDDEN", 85, 12); nx.fillText("MUSCLES", 160, 12);
}

function start() { document.getElementById("g").innerText = window.gen; document.getElementById("c").innerText = window.cIdx + 1; window.cc = new Creature(window.pop[window.cIdx]); window.ticks = 0; }
function nextGen() {
    window.pop.sort((a, b) => b.f - a.f); if (window.pop[0].f > window.best) window.best = window.pop[0].f; document.getElementById("b").innerText = Math.round(window.best);
    let nP = []; let s1 = new window.DNA(); s1.r = window.clone(window.pop[0].r); s1.f = window.pop[0].f; let s2 = new window.DNA(); s2.r = window.clone(window.pop[0].r); s2.f = window.pop[0].f; nP.push(s1, s2);
        // FIXED: Cleaned up the double-window typo so Generation 2 rolls over seamlessly!
    while (nP.length < window.PS) { let p = window.pop[Math.floor(Math.random() * 3)]; let c = new window.DNA(); c.r = window.clone(p.r); window.mutate(c.r); nP.push(c); }

    window.pop = nP; window.cIdx = 0; window.gen++; window.started = false; start();
}
function loop() { for (let s = 0; s < window.simSpeed; s++) { if (window.cc) { window.rtc += 0.15; window.cc.update(); window.ticks++; if (window.ticks >= window.MT) { window.pop[window.cIdx].f = Math.max(0, window.cc.getavg() - window.cc.sX); window.cIdx++; if (window.cIdx < window.PS) start(); else nextGen(); } } } cx.clearRect(0, 0, cv.width, cv.height); if (window.cc) window.cc.draw(); requestAnimationFrame(loop); }
function initPop() { window.pop = []; for (let i = 0; i < window.PS; i++) window.pop.push(new window.DNA()); window.cIdx = 0; window.gen = 1; window.best = 0; document.getElementById("b").innerText = 0; start(); }
initPop(); loop(); window.addEventListener('resize', () => { cv.width = window.innerWidth; cv.height = window.innerHeight; });
