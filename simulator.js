// Camera Simulator - Full featured (standalone)
(function () {
    const APERTURES = ['1','1.1','1.2','1.4','1.6','1.8','2','2.2','2.5','2.8','3.2','3.5','4','4.5','5.0','5.6','6.3','7.1','8','9','10','11','13','14','16','18','20','22','25','28','32','36','40','45','50','57','64','72','80','90'];
    const APT_FNUM = [1,1.122,1.26,1.414,1.587,1.782,2,2.245,2.52,2.828,3.175,3.564,4,4.49,5.04,5.657,6.35,7.127,8,8.98,10.079,11.314,12.699,14.254,16,17.959,20.159,22.627,25.398,28.509,32,35.919,40.318,45.255,50.797,57.018,64,71.838,80.635,90.51];
    const SHUTTERS = ['1/8000','1/6400','1/5000','1/4000','1/3200','1/2500','1/2000','1/1600','1/1250','1/1000','1/800','1/640','1/500','1/400','1/320','1/250','1/200','1/160','1/125','1/100','1/80','1/60','1/50','1/40','1/30','1/25','1/20','1/15','1/13','1/10','1/8','1/6','1/5','1/4','1/3','1/2.5','1/2','1/1.6','1/1.3','1"','1.3"','1.6"','2"','2.5"','3"','4"','5"','6"','8"','10"','13"','16"','20"','25"','30"','40"','50"','60"'];
    const SHT_SEC = [1/8000,1/6400,1/5000,1/4000,1/3200,1/2500,1/2000,1/1600,1/1250,1/1000,1/800,1/640,1/500,1/400,1/320,1/250,1/200,1/160,1/125,1/100,1/80,1/60,1/50,1/40,1/30,1/25,1/20,1/15,1/13,1/10,1/8,1/6,1/5,1/4,1/3,0.3968503,0.5,0.6299605,0.7937005,1,1.2599,1.5874,2,2.5198,3.1748,4,5.0397,6.3496,8,10.0794,12.6992,16,20.1587,25.3984,32,40.3174,50.7968,64];
    const ISOS = [25,32,40,50,64,80,100,125,160,200,250,320,400,500,640,800,1000,1250,1600,2000,2500,3200,4000,5000,6400,8000,10000,12800,16000,20000,25600,32000,40000,51200,64000,80000,102400];
    const ISO_NUM = [25,31.498,39.685,50,62.996,79.37,100,125.992,158.74,200,251.984,317.48,400,503.968,634.96,800,1007.937,1269.921,1600,2015.874,2539.841,3200,4031.747,5079.683,6400,8063.494,10159.366,12800,16126.989,20318.7,25600,32254,40637,51200,64508,81275,102400];
    const FOCALS = [14,18,24,35,50,70,85,100,135,200];
    const WBS = [2500,2600,2700,2800,2900,3000,3100,3200,3300,3400,3500,3600,3700,3800,3900,4000,4100,4200,4300,4400,4500,4600,4700,4800,4900,5000,5100,5200,5300,5400,5500,5600,5700,5800,5900,6000,6100,6200,6300,6400,6500,6600,6700,6800,6900,7000,7100,7200,7300,7400,7500,7600,7700,7800,7900,8000,8100,8200,8300,8400,8500,8600,8700,8800,8900,9000,9100,9200,9300,9400,9500,9600,9700,9800,9900];
    const LIGHT_LABELS = ['Tối đen','Đêm tối','Ánh nến','Phòng tối','Trong nhà','Trong nhà sáng','Trời râm','Ngoài trời','Nắng nhẹ','Nắng gắt','Cực sáng'];
    const APT_EV = APT_FNUM.map(f => Math.log2(f*f));
    const SHT_EV = SHT_SEC.map(s => -Math.log2(s));
    const ISO_EV = ISO_NUM.map(i => Math.log2(i/100));
    let state = { mode:'Av', ai:5, si:18, ii:6, fi:4, wi:30, lighting:6, distance:1, tripod:false };

    function init(){ const s=document.getElementById('camera-sim'); if(!s)return; state.mode=s.dataset.initialMode||'Av'; updateAll(); }
    function sceneEV(){ return 1+state.lighting*1.5; }
    function exposure(){ return sceneEV()+ISO_EV[state.ii]-APT_EV[state.ai]-SHT_EV[state.si]; }
    function autoAdjust(){
        const t=sceneEV()+ISO_EV[state.ii];
        if(state.mode==='P'){ state.ai=15; state.si=closest(SHT_EV,t-APT_EV[15]); }
        else if(state.mode==='Av'){ state.si=closest(SHT_EV,t-APT_EV[state.ai]); }
        else if(state.mode==='Tv'){ state.ai=closest(APT_EV,t-SHT_EV[state.si]); }
    }
    function closest(a,t){ let b=0,d=Infinity; for(let i=0;i<a.length;i++){const dd=Math.abs(a[i]-t);if(dd<d){d=dd;b=i;}} return b; }
    function spin(n,a,i,f){ const p=document.getElementById(n+'-prev'),c=document.getElementById(n+'-val'),x=document.getElementById(n+'-next');
        if(p)p.textContent=i>0?f(a[i-1]):''; if(c)c.textContent=f(a[i]); if(x)x.textContent=i<a.length-1?f(a[i+1]):''; }
    function kelvinToTint(k){ const d=(k-5500)/2500; if(Math.abs(d)<0.05)return{color:'transparent',opacity:0};
        return d<0?{color:'rgb(80,120,220)',opacity:Math.min(0.35,Math.abs(d)*0.3)}:{color:'rgb(255,180,60)',opacity:Math.min(0.35,d*0.3)}; }

    // Compute all visual params (shared between live preview and canvas capture)
    function computeVisuals(){
        const focal=FOCALS[state.fi], shutSec=SHT_SEC[state.si];
        const brightness=Math.max(0.05,Math.min(2.8,1.0+exposure()*0.3));
        const focalFactor=Math.pow(focal/200,0.7);
        const distFactor=Math.max(0.3,1.5-state.distance*0.12);
        const maxAi=APERTURES.length-1;
        const aBlur=Math.max(0,(maxAi-state.ai)/maxAi*9);
        const blurPx=aBlur*(0.2+focalFactor*0.8)*distFactor;
        const bgZoom=1.0+(focal-14)/(200-14)*1.2;
        const bgDistZoom=1.0+(10-state.distance)*0.03;
        const bgScale=bgZoom*bgDistZoom*(blurPx>0?1+blurPx*0.008:1);
        const focalScale=0.3+(focal-14)/(200-14)*0.65;
        const distScale=1.8/Math.pow(state.distance,0.55);
        const subjScale=focalScale*distScale;
        const wideStretch=focal<50?1+(50-focal)/36*0.08:1;
        const ghostCount=Math.min(8,Math.max(0,Math.round(Math.log2(shutSec*500)*1.2)));
        const tint=kelvinToTint(WBS[state.wi]);
        const isoVal=ISO_NUM[state.ii];
        const noiseLevel=isoVal>800?Math.min(0.8,Math.log2(isoVal/800)*0.12):0;
        const needsShake=shutSec>(1/60)&&!state.tripod;
        return {brightness,blurPx,bgScale,subjScale,wideStretch,ghostCount,tint,noiseLevel,needsShake,shutSec,focal};
    }

    function updateAll(){
        document.querySelectorAll('.mode-btn').forEach(b=>b.classList.toggle('active',b.dataset.mode===state.mode));
        document.getElementById('sim-mode-badge').textContent=state.mode;
        const ag=document.getElementById('aperture-group'),sg=document.getElementById('shutter-group'),ig=document.getElementById('iso-group');
        ag.classList.remove('disabled');sg.classList.remove('disabled');ig.classList.remove('disabled');
        if(state.mode==='P'){ag.classList.add('disabled');sg.classList.add('disabled');}
        else if(state.mode==='Av'){sg.classList.add('disabled');}
        else if(state.mode==='Tv'){ag.classList.add('disabled');}
        autoAdjust();
        spin('aperture',APERTURES,state.ai,v=>'f/'+v);spin('shutter',SHUTTERS,state.si,v=>v);
        spin('iso',ISOS,state.ii,v=>v);spin('focal',FOCALS,state.fi,v=>v+'mm');spin('wb',WBS,state.wi,v=>v+'K');
        document.getElementById('info-aperture').textContent='f/'+APERTURES[state.ai];
        document.getElementById('info-shutter').textContent=SHUTTERS[state.si];
        document.getElementById('info-iso').textContent=ISOS[state.ii];
        document.getElementById('info-focal').textContent=FOCALS[state.fi]+'mm';
        document.getElementById('info-wb').textContent=WBS[state.wi]+'K';
        document.getElementById('lighting-label').textContent=LIGHT_LABELS[state.lighting];
        document.getElementById('distance-label').textContent=state.distance+'m';
        updatePreview();updateMeter();
    }

    function updatePreview(){
        const bg=document.getElementById('sim-bg'),subj=document.getElementById('sim-subject');
        const overlay=document.getElementById('sim-overlay'),wbOv=document.getElementById('sim-wb'),noise=document.getElementById('sim-noise');
        if(!bg||!subj||!overlay)return;
        const v=computeVisuals();
        bg.style.filter=`brightness(${v.brightness}) blur(${v.blurPx.toFixed(1)}px)`;
        bg.style.transform=`scale(${v.bgScale.toFixed(3)})`;
        subj.style.filter=`brightness(${v.brightness})`;
        subj.style.width=Math.min(120,v.subjScale*100).toFixed(1)+'%';
        subj.style.height=Math.min(130,v.subjScale*120).toFixed(1)+'%';
        subj.style.transform=`translateX(-50%) scaleX(${v.wideStretch.toFixed(3)})`;
        if(v.brightness<0.4)overlay.style.background=`rgba(0,0,0,${(0.8-v.brightness*1.5).toFixed(2)})`;
        else if(v.brightness>1.8)overlay.style.background=`rgba(255,255,255,${((v.brightness-1.8)*0.45).toFixed(2)})`;
        else overlay.style.background='transparent';
        if(wbOv){wbOv.style.background=v.tint.color;wbOv.style.opacity=v.tint.opacity;}
        // Windmill ghosts
        const wm=document.getElementById('sim-windmill'),gh=document.getElementById('windmill-ghosts'),bl=document.getElementById('windmill-blades');
        if(wm&&gh&&bl){
            wm.style.filter=`brightness(${v.brightness}) blur(${v.blurPx.toFixed(1)}px)`;
            gh.innerHTML='';
            for(let g=0;g<v.ghostCount;g++){
                const a=(g+1)*(360/(v.ghostCount+1)/3),op=Math.max(0.05,0.25-g*0.02);
                const d=document.createElement('div');d.className='windmill-ghost';d.style.transform=`rotate(${a}deg)`;d.style.opacity=op;
                d.innerHTML='<div class="blade" style="transform:rotate(0deg)"></div><div class="blade" style="transform:rotate(120deg)"></div><div class="blade" style="transform:rotate(240deg)"></div>';
                gh.appendChild(d);
            }
            bl.style.opacity=v.ghostCount>4?0.4:v.ghostCount>0?0.7:1;
        }

        // Sun: bokeh ball at wide aperture, starburst at narrow
        const sun=document.getElementById('sim-sun');
        const sunGlow=sun?sun.querySelector('.sun-glow'):null;
        const sunRays=document.getElementById('sun-rays');
        if(sun&&sunGlow&&sunRays){
            sun.style.filter=`brightness(${v.brightness}) blur(${v.blurPx.toFixed(1)}px)`;
            const fNum=APT_FNUM[state.ai];
            // Glow size: large soft at f/1-f/2.8, shrinks at f/8+
            const glowSize = fNum<2.8 ? 120-fNum*20 : Math.max(20, 60-fNum*2);
            sunGlow.style.width=glowSize+'px';
            sunGlow.style.height=glowSize+'px';
            sunGlow.style.opacity = fNum<4 ? 0.9 : Math.max(0.3, 0.9-fNum*0.03);

            // Starburst rays: appear from f/8+, strong at f/16+
            // Number of rays = blade count * 2 (typical 7-blade = 14 rays)
            const bladeCount=7;
            const rayCount=bladeCount*2;
            // Ray intensity: 0 at f/1-f/4, grows from f/5.6+
            const rayIntensity = fNum<5 ? 0 : Math.min(1, (fNum-5)/11);
            const rayLength = rayIntensity * (40 + fNum*2);
            const rayWidth = 1 + rayIntensity*1.5;

            sunRays.innerHTML='';
            if(rayIntensity>0){
                for(let r=0;r<rayCount;r++){
                    const angle=r*(360/rayCount);
                    const ray=document.createElement('div');
                    ray.className='sun-ray';
                    ray.style.height=rayLength+'px';
                    ray.style.width=rayWidth+'px';
                    ray.style.opacity=rayIntensity*0.8;
                    ray.style.transform=`rotate(${angle}deg)`;
                    sunRays.appendChild(ray);
                }
            }
        }

        if(noise){noise.style.opacity=v.noiseLevel;}
    }

    function updateMeter(){
        const ind=document.getElementById('meter-indicator');if(!ind)return;
        const n=Math.max(-3,Math.min(3,exposure()));
        ind.style.left=(50+(n/3)*35)+'%';
        const evd=document.getElementById('info-ev');
        if(evd)evd.textContent=(n>=0?'+':'')+n.toFixed(1)+' EV';
    }

    window.changeLighting=v=>{state.lighting=parseInt(v);updateAll();};
    window.changeDistance=v=>{state.distance=parseInt(v);updateAll();};
    window.setMode=m=>{state.mode=m;updateAll()};
    window.changeAperture=d=>{const n=state.ai+d;if(n>=0&&n<APERTURES.length){state.ai=n;updateAll()}};
    window.changeShutter=d=>{const n=state.si+d;if(n>=0&&n<SHUTTERS.length){state.si=n;updateAll()}};
    window.changeISO=d=>{const n=state.ii+d;if(n>=0&&n<ISOS.length){state.ii=n;updateAll()}};
    window.changeFocal=d=>{const n=state.fi+d;if(n>=0&&n<FOCALS.length){state.fi=n;updateAll()}};
    window.changeWB=d=>{const n=state.wi+d;if(n>=0&&n<WBS.length){state.wi=n;updateAll()}};
    window.setWBPreset=i=>{if(i>=0&&i<WBS.length){state.wi=i;updateAll()}};
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
