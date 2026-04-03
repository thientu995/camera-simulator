// camera-dof.js - DOF calculation and visualization bar
CameraSimulator.prototype.calcDOF = function() {
    var C = CameraSimulator, s = this.state;
    var f = C.FOCALS[s.fi];          // focal mm
    var N = C.APT_FNUM[s.ai];        // f-number
    var d = s.distance;               // subject distance m
    var coc = C.COC_LIMIT;            // 0.03mm
    var fMm = f;                      // focal in mm
    var dMm = d * 1000;               // subject distance in mm

    // Hyperfocal distance: H = f^2 / (N * c) + f
    var H = (fMm * fMm) / (N * coc) + fMm;

    // Near limit: Dn = (H * dMm) / (H + (dMm - fMm))
    var Dn = (H * dMm) / (H + (dMm - fMm));

    // Far limit: Df = (H * dMm) / (H - (dMm - fMm))
    // If dMm >= H, far limit = infinity
    var Df;
    if (dMm >= H - fMm) {
        Df = Infinity;
    } else {
        Df = (H * dMm) / (H - (dMm - fMm));
    }

    var nearM = Dn / 1000;
    var farM = Df === Infinity ? Infinity : Df / 1000;
    var totalDOF = farM === Infinity ? Infinity : farM - nearM;
    var inFront = d - nearM;
    var behind = farM === Infinity ? Infinity : farM - d;
    var hyperM = H / 1000;

    return {
        coc: coc,
        near: nearM,
        far: farM,
        total: totalDOF,
        inFront: inFront,
        behind: behind,
        hyperfocal: hyperM,
        subjectDist: d,
        bgDist: d + s.bgDistance
    };
};

CameraSimulator.prototype.updateDOFBar = function() {
    var bar = document.getElementById('dof-bar');
    if (!bar || bar.style.display === 'none') return;

    var dof = this.calcDOF();
    var s = this.state;
    var totalDist = dof.bgDist;

    // Logarithmic scale: spreads near distances wider, compresses far distances
    // This keeps subject visible even when BG is very far
    var logMax = Math.log(totalDist + 1);
    function toPercent(m) {
        if (m <= 0) return 0;
        return Math.max(0, Math.min(100, (Math.log(m + 1) / logMax) * 100));
    }
    function fmtDist(m) {
        if (m === Infinity) return '\u221E';
        return m < 1 ? (m * 100).toFixed(0) + 'cm' : m.toFixed(2) + 'm';
    }

    // DOF zone (green bar)
    var nearPct = toPercent(dof.near);
    var farPct = dof.far === Infinity ? 100 : toPercent(Math.min(dof.far, totalDist));
    var zone = document.getElementById('dof-zone');
    if (zone) {
        zone.style.left = nearPct + '%';
        zone.style.width = (farPct - nearPct) + '%';
        // Hide arrows/border when zone edge is too close to track edge (would overlap icons)
        var trackEl = document.querySelector('.dof-track');
        var trackW = trackEl ? trackEl.offsetWidth : 400;
        var arrowsW = 50; // approximate width of 2 arrow buttons
        var atLeft = (nearPct / 100 * trackW) < arrowsW;
        var atRight = ((100 - farPct) / 100 * trackW) < arrowsW;
        var arrowsL = zone.querySelector('.dof-arrows-left');
        var arrowsR = zone.querySelector('.dof-arrows-right');
        zone.style.borderLeftColor = atLeft ? 'transparent' : '';
        zone.style.borderRightColor = atRight ? 'transparent' : '';
        if (arrowsL) arrowsL.style.display = atLeft ? 'none' : '';
        if (arrowsR) arrowsR.style.display = atRight ? 'none' : '';
    }

    // Subject marker: moves based on distance
    var subjMark = document.getElementById('dof-subject');
    if (subjMark) {
        var trackEl = document.querySelector('.dof-track');
        var tw = trackEl ? trackEl.offsetWidth : 400;
        var minP = 24 / tw * 100;
        var maxP = 100 - 24 / tw * 100;
        subjMark.style.left = Math.max(minP, Math.min(maxP, toPercent(dof.subjectDist))) + '%';
    }

    // BG marker: always at right edge (100%)
    var bgMark = document.getElementById('dof-bg');
    if (bgMark) bgMark.style.left = '100%';

    // Info text
    var info = document.getElementById('dof-info');
    if (info) {
        var totalStr = dof.total === Infinity ? '\u221E' : fmtDist(dof.total);
        var rangeStr = fmtDist(dof.near) + ' ~ ' + fmtDist(dof.far);
        info.innerHTML =
            '<span>CoC: ' + dof.coc + 'mm</span>'
            + '<span>In front: ' + fmtDist(dof.inFront) + '</span>'
            + '<span>Behind: ' + fmtDist(dof.behind) + '</span>'
            + '<span>Hyperfocal: ' + fmtDist(dof.hyperfocal) + '</span>'
            + '<span class="dof-total">DOF: ' + totalStr + ' (' + rangeStr + ')</span>';
    }

    // Tick labels
    var ticks = document.getElementById('dof-ticks');
    if (ticks) {
        ticks.innerHTML = '';
        // Generate smart tick marks based on total distance
        var step;
        if (totalDist <= 5) step = 1;
        else if (totalDist <= 20) step = 2;
        else if (totalDist <= 60) step = 10;
        else step = 25;
        for (var d = 0; d <= totalDist; d += step) {
            var tick = document.createElement('span');
            tick.style.left = toPercent(d) + '%';
            tick.textContent = d + 'm';
            ticks.appendChild(tick);
        }
        // Always show max
        if (totalDist % step !== 0) {
            var last = document.createElement('span');
            last.style.left = '100%';
            last.textContent = totalDist.toFixed(0) + 'm';
            ticks.appendChild(last);
        }
    }
};

CameraSimulator.prototype.toggleDOFBar = function() {
    var bar = document.getElementById('dof-bar');
    if (!bar) return;
    var btn = document.getElementById('dof-toggle');
    if (bar.style.display === 'none') {
        bar.style.display = '';
        if (btn) btn.classList.add('active');
        this.updateDOFBar();
    } else {
        bar.style.display = 'none';
        if (btn) btn.classList.remove('active');
    }
};

// Arrow buttons on DOF zone edges
// side: 'left' or 'right', dir: 'out' (expand) or 'in' (shrink)
// Both sides: 'out' = close aperture (deeper DOF), 'in' = open aperture (shallower DOF)
CameraSimulator.prototype.dofChangeAperture = function(side, dir) {
    var C = CameraSimulator;
    // out = expand DOF = increase f-number = ai+1
    // in = shrink DOF = decrease f-number = ai-1
    var step = (dir === 'out') ? 1 : -1;
    var n = this.state.ai + step;
    if (n >= 0 && n < C.APERTURES.length) {
        this.state.ai = n;
        this.updateAll();
    }
};

// --- DOF bar drag interaction ---
CameraSimulator.prototype.initDOFDrag = function() {
    var self = this;
    var track = document.querySelector('.dof-track');
    if (!track) return;

    var dragging = null; // 'subject', 'dof-left', 'dof-right'

    function getPercent(e) {
        var rect = track.getBoundingClientRect();
        var x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        return Math.max(0, Math.min(1, x / rect.width));
    }

    function getTotalDist() {
        return self.state.distance + self.state.bgDistance;
    }

    // --- Subject drag: changes camera-to-subject distance ---
    var subjEl = document.getElementById('dof-subject');
    if (subjEl) {
        subjEl.style.cursor = 'ew-resize';
        subjEl.style.userSelect = 'none';
        subjEl.style.touchAction = 'none';
        subjEl.addEventListener('mousedown', function(e) {
            e.preventDefault();
            e.stopPropagation();
            dragging = 'subject';
        });
        subjEl.addEventListener('touchstart', function(e) {
            e.preventDefault();
            dragging = 'subject';
        });
    }

    // --- DOF zone edges: drag to change aperture ---
    var zoneEl = document.getElementById('dof-zone');
    if (zoneEl) {
        // Add invisible drag handles on left/right edges
        var handleL = document.createElement('div');
        handleL.className = 'dof-handle dof-handle-left';
        var handleR = document.createElement('div');
        handleR.className = 'dof-handle dof-handle-right';
        zoneEl.appendChild(handleL);
        zoneEl.appendChild(handleR);

        handleL.addEventListener('mousedown', function(e) { e.preventDefault(); e.stopPropagation(); dragging = 'dof-edge'; });
        handleL.addEventListener('touchstart', function(e) { e.stopPropagation(); dragging = 'dof-edge'; }, { passive: true });
        handleR.addEventListener('mousedown', function(e) { e.preventDefault(); e.stopPropagation(); dragging = 'dof-edge'; });
        handleR.addEventListener('touchstart', function(e) { e.stopPropagation(); dragging = 'dof-edge'; }, { passive: true });
    }

    function onMove(e) {
        if (!dragging) return;
        if (e.cancelable) e.preventDefault();
        var pct = getPercent(e);
        var total = getTotalDist();
        var C = CameraSimulator;

        if (dragging === 'subject') {
            // Limit based on icon width to avoid overlap with camera/mountain
            var trackW = track.getBoundingClientRect().width;
            var minPct = 24 / trackW; // ~24px from left edge
            var maxPct = 1 - 24 / trackW; // ~24px from right edge
            var clampedPct = Math.max(minPct, Math.min(maxPct, pct));
            // Inverse log scale: convert percent back to distance
            var logMax = Math.log(total + 1);
            var newDist = Math.exp(clampedPct * logMax) - 1;
            newDist = Math.round(newDist * 2) / 2;
            var newBg = total - newDist;
            self.state.distance = Math.max(1, Math.min(10, Math.round(newDist)));
            self.state.bgDistance = Math.max(1, Math.min(50, Math.round(newBg)));
            var ds = document.getElementById('distance-slider');
            var bs = document.getElementById('bg-distance-slider');
            if (ds) ds.value = self.state.distance;
            if (bs) bs.value = self.state.bgDistance;
            self.updateAll();
        } else if (dragging === 'dof-edge') {
            // Dragging DOF edge = changing aperture
            // Wider zone = larger f-number (smaller aperture, deeper DOF)
            // Narrower zone = smaller f-number (larger aperture, shallower DOF)
            var dof = self.calcDOF();
            var subjPct = self.state.distance / total;
            // How far is the drag from subject? Use as DOF width hint
            var dragDist = Math.abs(pct - subjPct) * total * 2; // approximate total DOF in meters

            // Find aperture that gives closest DOF to dragDist
            var bestAi = self.state.ai;
            var bestDiff = Infinity;
            var origAi = self.state.ai;
            for (var i = 0; i < C.APERTURES.length; i++) {
                self.state.ai = i;
                var testDof = self.calcDOF();
                var testTotal = testDof.total === Infinity ? 999 : testDof.total;
                var diff = Math.abs(testTotal - dragDist);
                if (diff < bestDiff) { bestDiff = diff; bestAi = i; }
            }
            self.state.ai = bestAi;
            self.updateAll();
        }
    }

    function onEnd() { dragging = null; }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
};
