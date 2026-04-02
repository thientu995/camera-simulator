// camera-capture.js - Photo capture using dom-to-image-more
CameraSimulator.prototype.capture = function() {
    var scene = document.getElementById('sim-scene');
    if (!scene) return;
    var C = CameraSimulator;
    var s = this.state;

    var info = C.FOCALS[s.fi] + 'mm  f/' + C.APERTURES[s.ai]
        + '  ' + C.SHUTTERS[s.si] + '  ISO ' + C.ISOS[s.ii]
        + '  WB ' + C.WBS[s.wi] + 'K';

    var w = scene.offsetWidth;
    var h = scene.offsetHeight;

    domtoimage.toPng(scene, {
        width: w,
        height: h,
        style: {
            transform: 'none',
            'transform-origin': 'center center'
        }
    }).then(function(dataUrl) {
        var modal = document.getElementById('photo-modal');
        var target = document.getElementById('photo-canvas');
        var infoEl = document.getElementById('photo-modal-info');
        if (!modal || !target) return;

        var img = new Image();
        img.onload = function() {
            target.width = img.width;
            target.height = img.height;
            var ctx = target.getContext('2d');
            ctx.drawImage(img, 0, 0);
            if (infoEl) infoEl.textContent = info;
            modal.classList.add('show');
        };
        img.src = dataUrl;
    });
};

CameraSimulator.prototype.downloadPhoto = function() {
    var canvas = document.getElementById('photo-canvas');
    if (!canvas) return;
    var C = CameraSimulator, s = this.state;
    var link = document.createElement('a');
    link.download = 'photo_' + C.FOCALS[s.fi] + 'mm_f' + C.APERTURES[s.ai]
        + '_' + C.SHUTTERS[s.si].replace('/', '-') + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
};

CameraSimulator.prototype.closePhoto = function() {
    var modal = document.getElementById('photo-modal');
    if (modal) modal.classList.remove('show');
};
