// Global configuration data
const FREQS = {
    'a': 8.17, 'b': 1.49, 'c': 2.78, 'd': 4.25, 'e': 12.70, 'f': 2.23, 'g': 2.02,
    'h': 6.09, 'i': 6.97, 'j': 0.15, 'k': 0.77, 'l': 4.03, 'm': 2.41, 'n': 6.75,
    'o': 7.51, 'p': 1.93, 'q': 0.09, 'r': 5.99, 's': 6.33, 't': 9.06, 'u': 2.76,
    'v': 0.98, 'w': 2.36, 'x': 0.15, 'y': 1.97, 'z': 0.07
};

function toggleFields() {
    const isOld = document.getElementById('cipherVersion').value === 'old';
    document.getElementById('oldKeyWrap').classList.toggle('hide', !isOld);
    document.getElementById('newKeyWrap').classList.toggle('hide', isOld);
    document.getElementById('output').innerText = "System reset.";
}

function run(isEncrypt) {
    const version = document.getElementById('cipherVersion').value;
    const input = document.getElementById('inputData').value.trim();
    const out = document.getElementById('output');

    if (!input) { out.innerText = "Error: Input text is required."; return; }

    if (version === 'old') {
        processOld(isEncrypt, input, out);
    } else {
        processNew(isEncrypt, input, out);
    }
}

function processOld(isEncrypt, text, out) {
    let key = document.getElementById('oldKey').value.toLowerCase().replace(/[^a-z]/g, '');
    if (!key) { out.innerText = "Error: Key letters required."; return; }

    if (isEncrypt) {
        let clean = text.toLowerCase(), ctxt = "", kIdx = 0;
        for (let i = 0; i < clean.length; i++) {
            if (clean[i] === ' ') { ctxt += ' '; }
            else if (clean[i] >= 'a' && clean[i] <= 'z') {
                let v = ( (clean[i].charCodeAt(0) - 96) * (key.charCodeAt(kIdx % key.length) - 96) ) % 26;
                ctxt += String.fromCharCode((v === 0 ? 26 : v) + 96);
                kIdx++;
            } else { ctxt += clean[i]; }
        }
        out.innerText = `Encrypted Ciphertext:\n${ctxt}`;
    } else {
        let ctxt = text.toLowerCase(), fpos = [], kIdx = 0;
        for (let i = 0; i < ctxt.length; i++) {
            if (ctxt[i] === ' ') { fpos.push([' ']); }
            else if (ctxt[i] >= 'a' && ctxt[i] <= 'z') {
                let pos = [], pInit = ctxt[i].charCodeAt(0) - 96, kVal = key.charCodeAt(kIdx % key.length) - 96;
                for (let j = 0; j < 26; j++) {
                    let p = pInit;
                    for (let s = 0; s <= j; s++) { p = ((p - kVal) % 26 + 26) % 26; }
                    if (p === 0) pos.push(String.fromCharCode((j % 26) + 97));
                }
                fpos.push(pos.length ? pos : [ctxt[i]]); kIdx++;
            } else { fpos.push([ctxt[i]]); }
        }
        
        let bestText = "", bestScore = -1;
        const combos = fpos.reduce((acc, curr) => acc.flatMap(a => curr.map(b => a + b)), [""]);
        
        for (let str of combos) {
            let score = 0;
            for (let c of str) { score += FREQS[c] || 0; }
            if (score > bestScore) { bestScore = score; bestText = str; }
        }
        out.innerText = `Top 1 Decoded Match Found:\n${bestText}`;
    }
}

function processNew(isEncrypt, text, out) {
    const enc = new TextEncoder(), dec = new TextDecoder();
    if (isEncrypt) {
        let pBytes = enc.encode(text), kBytes = new Uint8Array(pBytes.length), cBytes = new Uint8Array(pBytes.length);
        window.crypto.getRandomValues(kBytes);
        for (let i = 0; i < pBytes.length; i++) cBytes[i] = pBytes[i] ^ kBytes[i];
        
        let hKey = Array.from(kBytes).map(b => b.toString(16).padStart(2,'0')).join('');
        let hCtxt = Array.from(cBytes).map(b => b.toString(16).padStart(2,'0')).join('');
        let bKey = btoa(String.fromCharCode.apply(null, kBytes));
        let bCtxt = btoa(String.fromCharCode.apply(null, cBytes));
        
        out.innerText = `📋 Safe Text Strings (Base64):\nKey:  ${bKey}\nData: ${bCtxt}\n\n🔒 Hex Strings:\nKey:  ${hKey}\nData: ${hCtxt}`;
    } else {
        let kStr = document.getElementById('newKey').value.trim();
        if (!kStr) { out.innerText = "Error: Key Block input is empty."; return; }
        try {
            let kBytes, cBytes;
            if (/^[0-9a-fA-F]+$/.test(kStr)) {
                kBytes = new Uint8Array(kStr.match(/.{1,2}/g).map(b => parseInt(b, 16)));
                cBytes = new Uint8Array(text.match(/.{1,2}/g).map(b => parseInt(b, 16)));
            } else {
                kBytes = new Uint8Array(atob(kStr).split("").map(c => c.charCodeAt(0)));
                cBytes = new Uint8Array(atob(text).split("").map(c => c.charCodeAt(0)));
            }
            let pBytes = new Uint8Array(cBytes.length);
            for (let i = 0; i < cBytes.length; i++) pBytes[i] = cBytes[i] ^ kBytes[i];
            out.innerText = `🔓 Decrypted Message:\n${dec.decode(pBytes)}`;
        } catch(e) { out.innerText = "Error: Invalid format matching."; }
    }
}
