// camera-visuals.js - Visual computations and effects
CameraSimulator.prototype.kelvinToTint = function(k) {
    var d = (k - 5500) / 2500;
    if (Math.abs(d) < 0.05) return { color: 'transparent', opacity: 0 };
    return d < 0
        ? { color: 'rgb(80,120,220)', opacity: Math.min(0.35, Math.abs(d) * 0.3) }
        : { color: 'rgb(255,180,60)', opacity: Math.min(0.35, d * 0.3) };
};

CameraSimulator.prototype.computeVisuals = function() {
    var C = CameraSimulator, s = this.state;
    var focal = C.FOCALS[s.fi], shutSec = C.SHT_SEC[s.si];
    var brightness = Math.max(0.05, Math.min(2.8, 1.0 + this.exposure() * 0.3));
    var focalFactor = Math.pow(focal / C.FOCAL_MAX, 0.7);
    var distFactor = Math.max(0.3, 1.5 - s.distance * 0.12);
    var maxAi = C.APERTURES.length - 1;
    var aBlur = Math.max(0, (maxAi - s.ai) / maxAi * 9);
    var blurPx = aBlur * (0.2 + focalFactor * 0.8) * distFactor;

    // Background scale
    var bgZoom = 1.0 + (focal - C.FOCAL_MIN) / C.FOCAL_RANGE * 1.2;
    var bgDistZoom = 1.0 + (10 - s.distance) * 0.03;
    var bgScale = bgZoom * bgDistZoom * (blurPx > 0 ? 1 + blurPx * 0.008 : 1);

    // Subject scale
    var focalScale = 0.3 + (focal - C.FOCAL_MIN) / C.FOCAL_RANGE * 0.65;
    var distScale = 1.8 / Math.pow(s.distance, 0.55);
    var subjScale = focalScale * distScale;

    // Wide-angle stretch
    var wideStretch = focal < 50 ? 1 + (50 - focal) / C.FOCAL_WIDE_RANGE * 0.12 : 1;

    // Focal perspective distortion on subject
    // Wide: face narrower+elongated, Tele: face wider+flatter
    var subjDistortX = 1 + (focal < 50 ? -(50 - focal) / C.FOCAL_WIDE_RANGE * 0.2 : (focal - 50) / 150 * 0.1);
    var subjDistortY = 1 + (focal < 50 ? (50 - focal) / C.FOCAL_WIDE_RANGE * 0.15 : -(focal - 50) / 150 * 0.08);

    // Motion blur ghost count
    var ghostCount = Math.min(8, Math.max(0, Math.round(Math.log2(shutSec * 500) * 1.2)));

    // White balance tint
    var tint = this.kelvinToTint(C.WBS[s.wi]);

    // Noise
    var isoVal = C.ISO_NUM[s.ii];
    var noiseLevel = isoVal > 800 ? Math.min(0.8, Math.log2(isoVal / 800) * 0.12) : 0;

    // Camera shake
    var needsShake = shutSec > (1 / 60) && !s.tripod;

    return {
        brightness: brightness, blurPx: blurPx, bgScale: bgScale,
        subjScale: subjScale, wideStretch: wideStretch,
        subjDistortX: subjDistortX, subjDistortY: subjDistortY,
        ghostCount: ghostCount, tint: tint, noiseLevel: noiseLevel,
        needsShake: needsShake, shutSec: shutSec, focal: focal
    };
};

CameraSimulator.prototype.updateBarrelDistortion = function(focal) {
    if (focal === this._lastBarrelFocal) return;
    this._lastBarrelFocal = focal;
    var scene = document.getElementById('sim-scene');
    if (!scene) return;
    if (focal >= 50) { scene.style.transform = ''; return; }
    var t = (50 - focal) / CameraSimulator.FOCAL_WIDE_RANGE;
    scene.style.transform = 'scale(' + (1 + t * 0.04).toFixed(4) + ')';
};
