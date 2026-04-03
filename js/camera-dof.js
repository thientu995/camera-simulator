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
    // Fixed scale: 0 (camera) to bgDist (background)
    // Camera = left edge, BG = right edge, subject moves between them
    var totalDist = dof.bgDist; // camera to BG distance

    function toPercent(m) { return Math.max(0, Math.min(100, (m / totalDist) * 100)); }
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
    }

    // Subject marker: moves based on distance
    var subjMark = document.getElementById('dof-subject');
    if (subjMark) subjMark.style.left = toPercent(dof.subjectDist) + '%';

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
