// Camera Simulator - Photography Course
// 2-layer: bg (blur by aperture+focal) + subject (sharp, scale by focal) + WB tint
(function () {
    const APERTURES = ['1','1.1','1.2','1.4','1.6','1.8','2','2.2','2.5','2.8','3.2','3.5','4','4.5','5.0','5.6','6.3','7.1','8','9','10','11','13','14','16','18','20','22','25','28','32','36','40','45','50','57','64','72','80','90'];
    const APT_FNUM = [1,1.122,1.26,1.414,1.587,1.782,2,2.245,2.52,2.828,3.175,3.564,4,4.49,5.04,5.657,6.35,7.127,8,8.98,10.079,11.314,12.699,14.254,16,17.959,20.159,22.627,25.398,28.509,32,35.919,40.318,45.255,50.797,57.018,64,71.838,80.635,90.51];
    const SHUTTERS = ['1/8000','1/6400','1/5000','1/4000','1/3200','1/2500','1/2000','1/1600','1/1250','1/1000','1/800','1/640','1/500','1/400','1/320','1/250','1/200','1/160','1/125','1/100','1/80','1/60','1/50','1/40','1/30','1/25','1/20','1/15','1/13','1/10','1/8','1/6','1/5','1/4','1/3','1/2.5','1/2','1/1.6','1/1.3','1"','1.3"','1.6"','2"','2.5"','3"','4"','5"','6"','8"','10"','13"','16"','20"','25"','30"','40"','50"','60"'];
    const SHT_SEC = [1/8000,1/6400,1/5000,1/4000,1/3200,1/2500,1/2000,1/1600,1/1250,1/1000,1/800,1/640,1/500,1/400,1/320,1/250,1/200,1/160,1/125,1/100,1/80,1/60,1/50,1/40,1/30,1/25,1/20,1/15,1/13,1/10,1/8,1/6,1/5,1/4,1/3,0.3968503,0.5,0.6299605,0.7937005,1,1.2599,1.5874,2,2.5198,3.1748,4,5.0397,6.3496,8,10.0794,12.6992,16,20.1587,25.3984,32,40.3174,50.7968,64];
    const ISOS = [25,32,40,50,64,80,100,125,160,200,250,320,400,500,640,800,1000,1250,1600,2000,2500,3200,4000,5000,6400,8000,10000,12800,16000,20000,25600,32000,40000,51200,64000,80000,102400];
    const ISO_NUM = [25,31.498,39.685,50,62.996,79.37,100,125.992,158.74,200,251.984,317.48,400,503.968,634.96,800,1007.937,1269.921,1600,2015.874,2539.841,3200,4031.747,5079.683,6400,8063.494,10159.366,12800,16126.989,20318.7,25600,32254,40637,51200,64508,81275,102400];
    const FOCALS = [14, 18, 24, 35, 50, 70, 85, 100, 135, 200];
    const WBS = [2500,2600,2700,2800,2900,3000,3100,3200,3300,3400,3500,3600,3700,3800,3900,4000,4100,4200,4300,4400,4500,4600,4700,4800,4900,5000,5100,5200,5300,5400,5500,5600,5700,5800,5900,6000,6100,6200,6300,6400,6500,6600,6700,6800,6900,7000,7100,7200,7300,7400,7500,7600,7700,7800,7900,8000,8100,8200,8300,8400,8500,8600,8700,8800,8900,9000,9100,9200,9300,9400,9500,9600,9700,9800,9900];
    const WB_NAMES = ['Candle','Tungsten','','Fluorescent','','Daylight','','Cloudy','','Shade'];

    // EV = log2(f²) computed from APT_FNUM
    const APT_EV = APT_FNUM.map(f => Math.log2(f * f));
    // SHT_EV = -log2(seconds): faster shutter = higher EV = less light
    const SHT_EV = SHT_SEC.map(s => -Math.log2(s));
    // ISO_EV = log2(ISO/100): ISO 100 = 0, ISO 200 = 1, etc.
    const ISO_EV = ISO_NUM.map(i => Math.log2(i / 100));

    // ai=5 => f/1.8, si=18 => 1/125 (auto will override), ii=6 => ISO 100, fi=4 => 50mm, wi=5 => 5500K
    let state = { mode:'Av', ai:5, si:18, ii:6, fi:4, wi:30 };

    function init() {
        const sim = document.getElementById('camera-sim');
        if (!sim) return;
        state.mode = sim.dataset.initialMode || 'M';
        updateAll();
    }

    function exposure() {
        return SHT_EV[state.si] + ISO_EV[state.ii] - APT_EV[state.ai];
    }

    function autoAdjust() {
        if (state.mode === 'P') { state.ai = 15; state.si = 18; }
        else if (state.mode === 'Av') {
            state.si = closest(SHT_EV, CORRECT_EV + APT_EV[state.ai] - ISO_EV[state.ii]);
        } else if (state.mode === 'Tv') {
            state.ai = closest(APT_EV, SHT_EV[state.si] + ISO_EV[state.ii] - CORRECT_EV);
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
        document.getElementById('info-iso').textContent = iso;
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
        // Normalize: index 0 (f/1) = max blur, index 39 (f/90) = no blur
        const focalFactor = Math.pow(focal/200, 0.7);
        const maxIdx = APERTURES.length - 1;
        const apertureBlur = Math.max(0, (maxIdx - state.ai) / maxIdx * 9);
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

        // === NOISE based on ISO value ===
        if (noise) {
            const isoVal = ISO_NUM[state.ii];
            // Noise visible from ISO 1600+, scales up to ISO 102400
            const noiseLevel = isoVal > 800 ? Math.min(0.8, Math.log2(isoVal / 800) * 0.12) : 0;
            noise.style.opacity = noiseLevel;
        }
    }

    // "Correct" exposure baseline for meter center (0)
    // Outdoor daylight: ~EV 2. Auto modes adjust to match this.
    const CORRECT_EV = 2.0;

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
