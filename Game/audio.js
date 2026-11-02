/* 程式合成的材質擬音：紙張、金屬、水滴；不是現場錄音。 */
(function(root){
 'use strict';
 let ctx=null,bus=null,ambience=null,enabled=false,noiseBuffer=null;
 const voices=new Set(),levels={master:.35,ambient:.3,effects:.6};
 function getContext(){
  if(!ctx){const C=root.AudioContext||root.webkitAudioContext;if(!C)return null;ctx=new C();bus=ctx.createGain();bus.gain.value=0;bus.connect(ctx.destination);}
  return ctx;
 }
 function ready(){return enabled&&ctx&&ctx.state==='running';}
 function track(source,nodes){
  voices.add(source);source.onended=()=>{voices.delete(source);source.disconnect();nodes.forEach(n=>n.disconnect());};
 }
 function tone(freq=420,duration=.1,delay=0,volume=.08,shape='sine',endFreq=freq){
  if(!ready())return;
  const t=ctx.currentTime+delay,o=ctx.createOscillator(),g=ctx.createGain();
  o.type=shape;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(30,endFreq),t+duration);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume*levels.effects,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
  o.connect(g);g.connect(bus);track(o,[g]);o.start(t);o.stop(t+duration+.02);
 }
 function rustle(duration,delay,frequency,volume){
  if(!ready())return;
  if(!noiseBuffer){noiseBuffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate),ctx.sampleRate);const a=noiseBuffer.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;}
  const t=ctx.currentTime+delay,s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();
  s.buffer=noiseBuffer;f.type='bandpass';f.frequency.value=frequency;f.Q.value=.6;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume*levels.effects,t+.025);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
  s.connect(f);f.connect(g);g.connect(bus);track(s,[f,g]);s.start(t,.14);s.stop(t+duration+.02);
 }
 function stopAmbience(){if(ambience){try{ambience.stop();}catch{}ambience.disconnect();ambience=null;}}
 function stopVoices(){for(const s of voices){try{s.stop();}catch{}}voices.clear();}
 function ambient(){
  stopAmbience();if(!ready())return;
  const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=73;g.gain.value=levels.ambient*.018;o.connect(g);g.connect(bus);o.start();ambience=o;o.onended=()=>g.disconnect();
 }
 async function setEnabled(value){
  if(!value){enabled=false;stopAmbience();stopVoices();if(bus)bus.gain.setTargetAtTime(0,ctx.currentTime,.008);return false;}
  try{if(!getContext())return false;await ctx.resume();enabled=ctx.state==='running';bus.gain.setTargetAtTime(enabled?levels.master:0,ctx.currentTime,.02);ambient();return enabled;}catch{enabled=false;return false;}
 }
 function play(name){
  if(!ready())return;
  if(voices.size>24)stopVoices();
  if(name==='paper'){rustle(.12,0,2200,.14);rustle(.2,.07,1450,.09);rustle(.1,.2,2900,.05);}
  else if(name==='metal'){tone(115,.24,0,.12,'triangle',65);tone(590,.35,.016,.024,'sine',310);tone(1017,.18,.01,.012);rustle(.06,0,1700,.08);}
  else if(name==='water'){tone(1320,.15,0,.045,'sine',410);tone(820,.24,.09,.02,'sine',300);}
  else if(name==='long')tone(360,.55);
  else if(name==='short')tone(540,.14);
  else if(name==='double'){tone(440,.11);tone(440,.11,.22);}
  else if(name==='success'){tone(330,.16);tone(440,.2,.16);tone(550,.28,.33);}
  else if(name==='error')tone(190,.13,0,.035);
  else if(['power','start','ending'].includes(name)){tone(170,.4,0,.04);tone(340,.32,.2,.04);}
  else tone(470,.055,0,.025);
 }
 function configure(next){for(const key of Object.keys(levels))if(Number.isFinite(next[key]))levels[key]=Math.max(0,Math.min(1,next[key]));if(bus)bus.gain.setTargetAtTime(enabled?levels.master:0,ctx.currentTime,.02);ambient();}
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stopAmbience();stopVoices();if(ctx)ctx.suspend().catch(()=>{});}else if(enabled&&ctx)ctx.resume().then(ambient).catch(()=>{});});
 root.YellowAudio={setEnabled,play,configure,isEnabled:()=>enabled};
})(globalThis);
