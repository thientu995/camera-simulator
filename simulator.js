// Camera Simulator - Photography Course
// 2-layer: bg (blur by aperture+focal) + subject (sharp, scale by focal) + WB tint
(function () {
    const APERTURES = [1.4, 1.8, 2, 2.8, 4, 5.6, 8, 11, 16, 22];
    const SHUTTERS = ['1/4000','1/2000','1/1000','1/500','1/250','1/125','1/60','1/30','1/15','1/8','1/4','1/2','1"','2"','4"'];
    const ISOS = ['Auto', 100, 200, 400, 800, 1600, 3200, 6400, 12800];
    const FOCALS = [14, 18, 24, 35, 50, 70, 85, 100, 135, 200];
    const WBS = [2500, 3000, 3500, 4000, 4500, 5500, 6000, 6500, 7500, 8000];
    const WB_NAMES = ['Candle','Tungsten','','Fluorescent','','Daylight','','Cloudy','','Shade'];

    const APT_EV = [0, 0.5, 0.7, 1.5, 2.7, 3.6, 4.6, 5.5, 6.6, 7.6];
    const SHT_EV = [8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6];
    const ISO_EV = [0, 0, 1, 2, 3, 4, 5, 6, 7];

    // fi=4 => 50mm, wi=5 => 5500K (daylight neutral)
    let state = { mode:'M', ai:5, si:5, ii:0, fi:4, wi:5 };

    function init() {
        const sim = document.getElementById('camera-sim');
        if (!sim) return;
        state.mode = sim.dataset.initialMode || 'M';
        updateAll();
    }

    function exposure() {
        const ie = state.ii === 0 ? 2 : ISO_EV[state.ii];
        return SHT_EV[state.si] + ie - APT_EV[state.ai];
    }

    function autoAdjust() {
        if (state.mode === 'P') { state.ai = 5; state.si = 5; }
        else if (state.mode === 'Av') {
            const ie = state.ii === 0 ? 2 : ISO_EV[state.ii];
            state.si = closest(SHT_EV, CORRECT_EV + APT_EV[state.ai] - ie);
        } else if (state.mode === 'Tv') {
            const ie = state.ii === 0 ? 2 : ISO_EV[state.ii];
            state.ai = closest(APT_EV, SHT_EV[state.si] + ie - CORRECT_EV);
        }
    }

    function closest(arr, t) {
        let b=0, d=Infinity;
        for(let i=0;i<arr.length;i++){const dd=Math.abs(arr[i]-t);if(dd<d){d=dd;b=i;}}
        return b;
    }

    function updateAll() {
        document.querySelectorAll('.mode-btn').forEach(b =>
            b.classList.toggle('active', b.dataset.mode === state.mode));
        document.getElementById('sim-mode-badge').textContent = state.mode;

        const ag=document.getElementById('aperture-group');
        const sg=document.getElementById('shutter-group');
        const ig=document.getElementById('iso-group');
        ag.classList.remove('disabled'); sg.classList.remove('disabled'); ig.classList.remove('disabled');
        if (state.mode==='P') { ag.classList.add('disabled'); sg.classList.add('disabled'); }
        else if (state.mode==='Av') { sg.classList.add('disabled'); }
        else if (state.mode==='Tv') { ag.classList.add('disabled'); }

        autoAdjust();

        spin('aperture', APERTURES, state.ai, v=>'f/'+v);
        spin('shutter', SHUTTERS, state.si, v=>v);
        spin('iso', ISOS, state.ii, v=>v);
        spin('focal', FOCALS, state.fi, v=>v+'mm');
        spin('wb', WBS, state.wi, v=>v+'K');

        document.getElementById('info-aperture').textContent = 'f/'+APERTURES[state.ai];
        document.getElementById('info-shutter').textContent = SHUTTERS[state.si];
        const iso = ISOS[state.ii];
        document.getElementById('info-iso').textContent = iso==='Auto'?'AUTO (100)':iso;
        document.getElementById('info-focal').textContent = FOCALS[state.fi]+'mm';
        document.getElementById('info-wb').textContent = WBS[state.wi]+'K';

        updatePreview();
        updateMeter();
    }

    function spin(name, arr, idx, fmt) {
        const p=document.getElementById(name+'-prev');
        const c=document.getElementById(name+'-val');
        const n=document.getElementById(name+'-next');
        if(p) p.textContent = idx>0 ? fmt(arr[idx-1]) : '';
        if(c) c.textContent = fmt(arr[idx]);
        if(n) n.textContent = idx<arr.length-1 ? fmt(arr[idx+1]) : '';
    }

    // Convert Kelvin to CSS color tint
    // Low K (2500) = cool blue tint (camera sees warm light, WB compensates to blue)
    // High K (8000) = warm orange tint (camera expects cool light, adds warmth)
    // 5500K = neutral (daylight)
    function kelvinToTint(kelvin) {
        // Deviation from neutral 5500K
        const dev = (kelvin - 5500) / 2500; // range roughly -1.2 to +1.0
        if (Math.abs(dev) < 0.05) return { color: 'transparent', opacity: 0 };

        let r, g, b, opacity;
        if (dev < 0) {
            // Low K = blue/cool tint (WB set too low for the scene)
            // Actually: setting WB to tungsten in daylight makes image blue
            r = 80; g = 120; b = 220;
            opacity = Math.min(0.35, Math.abs(dev) * 0.3);
        } else {
            // High K = warm/orange tint (WB set too high for the scene)
            // Setting WB to shade in daylight makes image warm/orange
            r = 255; g = 180; b = 60;
            opacity = Math.min(0.35, dev * 0.3);
        }
        return { color: `rgb(${r},${g},${b})`, opacity };
    }

    function updatePreview() {
        const bg = document.getElementById('sim-bg');
        const subj = document.getElementById('sim-subject');
        const overlay = document.getElementById('sim-overlay');
        const wbOverlay = document.getElementById('sim-wb');
        const noise = document.getElementById('sim-noise');
        if (!bg||!subj||!overlay) return;

        const exp = exposure();
        const focal = FOCALS[state.fi];
        const kelvin = WBS[state.wi];

        // === BRIGHTNESS ===
        // norm=0 → brightness=1.0 (correct), norm=-3 → dark, norm=+3 → bright
        const norm = exp - CORRECT_EV;
        const brightness = Math.max(0.05, Math.min(2.8, 1.0 + norm * 0.3));

        // === BACKGROUND BLUR (aperture + focal) ===
        const focalFactor = Math.pow(focal/200, 0.7);
        const apertureBlur = Math.max(0, (9-state.ai)*1.0);
        const blurPx = apertureBlur * (0.2 + focalFactor*0.8);

        // === FOCAL LENGTH VISUAL ===
        const bgZoom = 1.0 + (focal-14)/(200-14)*1.2;
        const blurEdge = blurPx>0 ? 1+blurPx*0.008 : 1;
        const bgScale = bgZoom * blurEdge;
        const subjScale = 0.3 + (focal-14)/(200-14)*0.65;

        // Apply bg
        bg.style.filter = `brightness(${brightness}) blur(${blurPx.toFixed(1)}px)`;
        bg.style.transform = `scale(${bgScale.toFixed(3)})`;

        // Apply subject
        subj.style.filter = `brightness(${brightness})`;
        subj.style.width = (subjScale*100).toFixed(1)+'%';

        // === EXPOSURE OVERLAY ===
        if (brightness<0.4) {
            overlay.style.background = `rgba(0,0,0,${(0.8-brightness*1.5).toFixed(2)})`;
        } else if (brightness>1.8) {
            overlay.style.background = `rgba(255,255,255,${((brightness-1.8)*0.45).toFixed(2)})`;
        } else {
            overlay.style.background = 'transparent';
        }

        // === WHITE BALANCE TINT ===
        if (wbOverlay) {
            const tint = kelvinToTint(kelvin);
            wbOverlay.style.background = tint.color;
            wbOverlay.style.opacity = tint.opacity;
        }

        // === NOISE ===
        if (noise) {
            const iIdx = state.ii===0?1:state.ii;
            noise.style.opacity = Math.max(0, (iIdx-4)*0.18);
        }
    }

    // "Correct" exposure baseline: the EV value that represents 0 on the meter
    // Default: f/5.6(3.6) + 1/125(3) + Auto ISO(2) = 3+2-3.6 = 1.4
    const CORRECT_EV = 1.4;

    function updateMeter() {
        const ind = document.getElementById('meter-indicator');
        if (!ind) return;
        const e = exposure();
        const norm = Math.max(-3, Math.min(3, e - CORRECT_EV));
        ind.style.left = (50 + (norm / 3) * 35) + '%';
        const evd = document.getElementById('info-ev');
        if (evd) evd.textContent = (norm >= 0 ? '+' : '') + norm.toFixed(1) + ' EV';
    }

    // Global handlers
    window.setMode = m => { state.mode=m; updateAll(); };
    window.changeAperture = d => { const n=state.ai+d; if(n>=0&&n<APERTURES.length){state.ai=n;updateAll();} };
    window.changeShutter = d => { const n=state.si+d; if(n>=0&&n<SHUTTERS.length){state.si=n;updateAll();} };
    window.changeISO = d => { const n=state.ii+d; if(n>=0&&n<ISOS.length){state.ii=n;updateAll();} };
    window.changeFocal = d => { const n=state.fi+d; if(n>=0&&n<FOCALS.length){state.fi=n;updateAll();} };
    window.changeWB = d => { const n=state.wi+d; if(n>=0&&n<WBS.length){state.wi=n;updateAll();} };
    window.setWBPreset = i => { if(i>=0&&i<WBS.length){state.wi=i;updateAll();} };

    if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
