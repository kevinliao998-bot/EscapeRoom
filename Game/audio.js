(function(root){
  'use strict';
  let ctx=null, bus=null, ambience=null, enabled=false;
  const levels={master:0.35,ambient:0.3,effects:0.6};
  function getContext(){
    if(!ctx){const C=root.AudioContext||root.webkitAudioContext;if(!C)return null;ctx=new C();bus=ctx.createGain();bus.gain.value=levels.master;bus.connect(ctx.destination);}
    return ctx;
  }
  function tone(freq=420,duration=0.1,delay=0,volume=0.08){
    if(!enabled||!ctx||ctx.state!=='running')return;
    const now=ctx.currentTime+delay, o=ctx.createOscillator(),g=ctx.createGain();
    o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(volume*levels.effects,now+0.015);g.gain.exponentialRampToValueAtTime(0.0001,now+duration);
    o.connect(g);g.connect(bus);o.start(now);o.stop(now+duration+0.02);o.onended=()=>{o.disconnect();g.disconnect();};
  }
  function stopAmbience(){if(ambience){try{ambience.stop();}catch{}ambience.disconnect();ambience=null;}}
  function ambient(){
    stopAmbience();if(!enabled||!ctx||ctx.state!=='running')return;
    const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=73;g.gain.value=levels.ambient*0.022;o.connect(g);g.connect(bus);o.start();ambience=o; o.onended=()=>g.disconnect();
  }
  async function setEnabled(value){
    if(!value){enabled=false;stopAmbience();return false;}
    try{if(!getContext())return false;await ctx.resume();enabled=ctx.state==='running';ambient();return enabled;}catch{enabled=false;return false;}
  }
  function play(name){
    if(name==='long')tone(360,0.55);
    else if(name==='short')tone(540,0.14);
    else if(name==='double'){tone(440,0.11);tone(440,0.11,0.22);}
    else if(name==='success'){tone(330,0.16);tone(440,0.2,0.16);tone(550,0.28,0.33);}
    else if(name==='error')tone(190,0.13,0,0.04);
    else if(['power','start','ending'].includes(name)){tone(170,0.4,0,0.04);tone(340,0.32,0.2,0.04);}
    else tone(name==='metal'?620:470,0.06,0,0.035);
  }
  function configure(next){for(const key of Object.keys(levels))if(Number.isFinite(next[key]))levels[key]=Math.max(0,Math.min(1,next[key]));if(bus)bus.gain.value=levels.master;ambient();}
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stopAmbience();if(ctx)ctx.suspend().catch(()=>{});}else if(enabled&&ctx)ctx.resume().then(ambient).catch(()=>{});});
  root.YellowAudio={setEnabled,play,configure,isEnabled:()=>enabled};
})(globalThis);
