// camera-exposure.js - Exposure calculations
CameraSimulator.prototype.sceneEV = function() {
    return 1 + this.state.lighting * 1.5;
};

CameraSimulator.prototype.exposure = function() {
    var C = CameraSimulator;
    return this.sceneEV() + C.ISO_EV[this.state.ii] - C.APT_EV[this.state.ai] - C.SHT_EV[this.state.si];
};

CameraSimulator.prototype.autoAdjust = function() {
    var C = CameraSimulator, s = this.state;
    var t = this.sceneEV() + C.ISO_EV[s.ii];
    if (s.mode === 'P') {
        s.ai = 15;
        s.si = this.closest(C.SHT_EV, t - C.APT_EV[15]);
    } else if (s.mode === 'Av') {
        s.si = this.closest(C.SHT_EV, t - C.APT_EV[s.ai]);
    } else if (s.mode === 'Tv') {
        s.ai = this.closest(C.APT_EV, t - C.SHT_EV[s.si]);
    }
};

CameraSimulator.prototype.closest = function(arr, target) {
    var best = 0, diff = Infinity;
    for (var i = 0; i < arr.length; i++) {
        var d = Math.abs(arr[i] - target);
        if (d < diff) { diff = d; best = i; }
    }
    return best;
};
