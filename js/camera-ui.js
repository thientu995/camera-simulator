// camera-ui.js - DOM updates and rendering
CameraSimulator.prototype.spin = function(name, arr, idx, fmt) {
    var p = document.getElementById(name + '-prev');
    var c = document.getElementById(name + '-val');
    var x = document.getElementById(name + '-next');
    if (p) p.textContent = idx > 0 ? fmt(arr[idx - 1]) : '';
    if (c) c.textContent = fmt(arr[idx]);
    if (x) x.textContent = idx < arr.length - 1 ? fmt(arr[idx + 1]) : '';
};

CameraSimulator.prototype.updateAll = function() {
    var C = CameraSimulator, s = this.state, self = this;
    document.querySelectorAll('.mode-btn').forEach(function(b) {
        b.classList.toggle('active', b.dataset.mode === s.mode);
    });
    document.getElementById('sim-mode-badge').textContent = s.mode;

    var ag = document.getElementById('aperture-group');
    var sg = document.getElementById('shutter-group');
    var ig = document.getElementById('iso-group');
    ag.classList.remove('disabled'); sg.classList.remove('disabled'); ig.classList.remove('disabled');
    if (s.mode === 'P') { ag.classList.add('disabled'); sg.classList.add('disabled'); }
    else if (s.mode === 'Av') { sg.classList.add('disabled'); }
    else if (s.mode === 'Tv') { ag.classList.add('disabled'); }

    this.autoAdjust();

    this.spin('aperture', C.APERTURES, s.ai, function(v) { return 'f/' + v; });
    this.spin('shutter', C.SHUTTERS, s.si, function(v) { return v; });
    this.spin('iso', C.ISOS, s.ii, function(v) { return v; });
    this.spin('focal', C.FOCALS, s.fi, function(v) { return v + 'mm'; });
    this.spin('wb', C.WBS, s.wi, function(v) { return v + 'K'; });

    document.getElementById('info-aperture').textContent = 'f/' + C.APERTURES[s.ai];
    document.getElementById('info-shutter').textContent = C.SHUTTERS[s.si];
    document.getElementById('info-iso').textContent = C.ISOS[s.ii];
    document.getElementById('info-focal').textContent = C.FOCALS[s.fi] + 'mm';
    document.getElementById('info-wb').textContent = C.WBS[s.wi] + 'K';
    document.getElementById('lighting-label').textContent = C.LIGHT_LABELS[s.lighting];
    document.getElementById('distance-label').textContent = s.distance + 'm';
    document.getElementById('bg-distance-label').textContent = s.bgDistance + 'm';

    this.updatePreview();
    this.updateMeter();
};

CameraSimulator.prototype.updateMeter = function() {
    var ind = document.getElementById('meter-indicator');
    if (!ind) return;
    var n = Math.max(-3, Math.min(3, this.exposure()));
    ind.style.left = (50 + (n / 3) * 35) + '%';
    var evd = document.getElementById('info-ev');
    if (evd) evd.textContent = (n >= 0 ? '+' : '') + n.toFixed(1) + ' EV';
};

CameraSimulator.prototype.updatePreview = function() {
    var C = CameraSimulator, s = this.state;
    var bg = document.getElementById('sim-bg'), subj = document.getElementById('sim-subject');
    var overlay = document.getElementById('sim-overlay'), wbOv = document.getElementById('sim-wb');
    var noise = document.getElementById('sim-noise');
    if (!bg || !subj || !overlay) return;
    var v = this.computeVisuals();

    // Background
    bg.style.filter = 'brightness(' + v.brightness + ') blur(' + v.blurPx.toFixed(1) + 'px)';
    bg.style.transform = 'scale(' + v.bgScale.toFixed(3) + ')';

    // Subject
    subj.style.filter = 'brightness(' + v.brightness + ')';
    subj.style.width = Math.min(120, v.subjScale * 100).toFixed(1) + '%';
    subj.style.height = Math.min(130, v.subjScale * 120).toFixed(1) + '%';
    var totalScaleX = v.wideStretch * v.subjDistortX;
    subj.style.transform = 'translateX(-50%) scaleX(' + totalScaleX.toFixed(3) + ') scaleY(' + v.subjDistortY.toFixed(3) + ')';

    // Brightness overlay
    if (v.brightness < 0.4) overlay.style.background = 'rgba(0,0,0,' + (0.8 - v.brightness * 1.5).toFixed(2) + ')';
    else if (v.brightness > 1.8) overlay.style.background = 'rgba(255,255,255,' + ((v.brightness - 1.8) * 0.45).toFixed(2) + ')';
    else overlay.style.background = 'transparent';
    if (wbOv) { wbOv.style.background = v.tint.color; wbOv.style.opacity = v.tint.opacity; }

    // Windmill
    this.updateWindmill(v);
    // Sun
    this.updateSun(v);
    // Noise
    if (noise) noise.style.opacity = v.noiseLevel;
    // Barrel distortion
    this.updateBarrelDistortion(v.focal);
};

CameraSimulator.prototype.updateWindmill = function(v) {
    var wm = document.getElementById('sim-windmill');
    var gh = document.getElementById('windmill-ghosts');
    var bl = document.getElementById('windmill-blades');
    if (!wm || !gh || !bl) return;
    wm.style.filter = 'brightness(' + v.brightness + ') blur(' + v.blurPx.toFixed(1) + 'px)';
    gh.innerHTML = '';
    for (var g = 0; g < v.ghostCount; g++) {
        var a = (g + 1) * (360 / (v.ghostCount + 1) / 3);
        var op = Math.max(0.05, 0.25 - g * 0.02);
        var d = document.createElement('div');
        d.className = 'windmill-ghost';
        d.style.transform = 'rotate(' + a + 'deg)';
        d.style.opacity = op;
        d.innerHTML = '<div class="blade" style="transform:rotate(0deg)"></div>'
            + '<div class="blade" style="transform:rotate(120deg)"></div>'
            + '<div class="blade" style="transform:rotate(240deg)"></div>';
        gh.appendChild(d);
    }
    bl.style.opacity = v.ghostCount > 4 ? 0.4 : v.ghostCount > 0 ? 0.7 : 1;
};

CameraSimulator.prototype.updateSun = function(v) {
    var C = CameraSimulator;
    var sun = document.getElementById('sim-sun');
    var sunGlow = sun ? sun.querySelector('.sun-glow') : null;
    var sunRays = document.getElementById('sun-rays');
    if (!sun || !sunGlow || !sunRays) return;
    sun.style.filter = 'brightness(' + v.brightness + ') blur(' + v.blurPx.toFixed(1) + 'px)';
    var fNum = C.APT_FNUM[this.state.ai];
    var glowSize = fNum < 2.8 ? 120 - fNum * 20 : Math.max(20, 60 - fNum * 2);
    sunGlow.style.width = glowSize + 'px';
    sunGlow.style.height = glowSize + 'px';
    sunGlow.style.opacity = fNum < 4 ? 0.9 : Math.max(0.3, 0.9 - fNum * 0.03);
    var rayCount = 14; // 7 blades * 2
    var rayIntensity = fNum < 5 ? 0 : Math.min(1, (fNum - 5) / 11);
    var rayLength = rayIntensity * (40 + fNum * 2);
    var rayWidth = 1 + rayIntensity * 1.5;
    sunRays.innerHTML = '';
    if (rayIntensity > 0) {
        for (var r = 0; r < rayCount; r++) {
            var angle = r * (360 / rayCount);
            var ray = document.createElement('div');
            ray.className = 'sun-ray';
            ray.style.height = rayLength + 'px';
            ray.style.width = rayWidth + 'px';
            ray.style.opacity = rayIntensity * 0.8;
            ray.style.transform = 'rotate(' + angle + 'deg)';
            sunRays.appendChild(ray);
        }
    }
};
