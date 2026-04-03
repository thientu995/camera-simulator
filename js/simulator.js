// simulator.js - Main entry point, init and window API bindings
(function() {
    var sim;

    function init() {
        var el = document.getElementById('camera-sim');
        if (!el) return;
        sim = new CameraSimulator();
        sim.state.mode = el.dataset.initialMode || 'Av';
        sim.updateAll();
    }

    // Window API for HTML onclick handlers
    window.changeLighting = function(v) { sim.state.lighting = parseInt(v); sim.updateAll(); };
    window.changeDistance  = function(v) { sim.state.distance = parseInt(v); sim.updateAll(); };
    window.changeBgDistance = function(v) { sim.state.bgDistance = parseInt(v); sim.updateAll(); };
    window.setMode        = function(m) { sim.state.mode = m; sim.updateAll(); };
    window.changeAperture = function(d) {
        var n = sim.state.ai + d;
        if (n >= 0 && n < CameraSimulator.APERTURES.length) { sim.state.ai = n; sim.updateAll(); }
    };
    window.changeShutter = function(d) {
        var n = sim.state.si + d;
        if (n >= 0 && n < CameraSimulator.SHUTTERS.length) { sim.state.si = n; sim.updateAll(); }
    };
    window.changeISO = function(d) {
        var n = sim.state.ii + d;
        if (n >= 0 && n < CameraSimulator.ISOS.length) { sim.state.ii = n; sim.updateAll(); }
    };
    window.changeFocal = function(d) {
        var n = sim.state.fi + d;
        if (n >= 0 && n < CameraSimulator.FOCALS.length) { sim.state.fi = n; sim.updateAll(); }
    };
    window.changeWB = function(d) {
        var n = sim.state.wi + d;
        if (n >= 0 && n < CameraSimulator.WBS.length) { sim.state.wi = n; sim.updateAll(); }
    };
    window.setWBPreset = function(i) {
        if (i >= 0 && i < CameraSimulator.WBS.length) { sim.state.wi = i; sim.updateAll(); }
    };

    // Capture
    window.capturePhoto  = function() { sim.capture(); };
    window.downloadPhoto = function() { sim.downloadPhoto(); };
    window.closePhoto    = function() { sim.closePhoto(); };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
