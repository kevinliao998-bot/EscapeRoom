/* 情境互動的純資料／規則；真正的道具消耗仍由 core.js 驗證。 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.YellowInteractions=api;})(globalThis,function(){
 'use strict';
 const rooms={
  corridor:[
   {id:'sticker',label:'飲水機貼紙',x:19,y:76,w:11,h:15,kind:'inspect',material:'paper',tilt:-5},
   {id:'clock',label:'時鐘',x:44.3,y:23,w:13,h:19,kind:'inspect',material:'metal',tilt:0},
   {id:'sign',label:'站名牌',x:74.8,y:25,w:23,h:18,kind:'inspect',material:'metal',tilt:-16},
   {id:'puddle',label:'地面水漬',x:53,y:87,w:28,h:19,kind:'inspect',material:'water',tilt:0},
   {id:'stairs',label:'安全梯間',x:81,y:58,w:15,h:37,kind:'navigate',material:'metal',tilt:-10}
  ],
  stairs:[
   {id:'pry',label:'撬片',x:80,y:63,w:12,h:12,kind:'collect',material:'metal',tilt:0},
   {id:'badge',label:'維修員名牌',x:81,y:70,w:11,h:12,kind:'collect',material:'metal',tilt:0}
  ],
  office:[
   {id:'panel',label:'檢修盒',x:19.5,y:49,w:19,h:25,kind:'mechanism',material:'metal',tilt:0},
   {id:'power',label:'備用電源',x:25,y:69,w:12,h:12,kind:'mechanism',material:'metal',tilt:0},
   {id:'soundGuide',label:'維修刻痕',x:73,y:51,w:14,h:19,kind:'inspect',material:'paper',tilt:2},
   {id:'sound',label:'廣播控制台',x:48,y:52,w:24,h:23,kind:'mechanism',material:'metal',tilt:0}
  ],
  archive:[
   {id:'report',label:'事故報告',x:31.5,y:73,w:14,h:19,kind:'inspect',material:'paper',tilt:-3},
   {id:'book',label:'維修簿',x:47.5,y:73,w:14,h:19,kind:'inspect',material:'paper',tilt:0},
   {id:'roster',label:'失聯名冊',x:63.5,y:73,w:14,h:19,kind:'inspect',material:'paper',tilt:3}
  ],
  platform:[
   {id:'map',label:'路線圖',x:25,y:55,w:28,h:43,kind:'mechanism',material:'metal',tilt:8},
   {id:'exit',label:'維修門',x:80,y:56,w:16,h:37,kind:'navigate',material:'metal',tilt:0}
  ]
 };
 function describe(room,state){
  const f=state.flags;
  return (rooms[room]||[]).filter(h=>{
   if(h.id==='stairs')return f.trusted;
   if(h.id==='pry'||h.id==='badge')return !f[h.id];
   if(h.id==='power')return f.boxOpen&&!f.power;
   if(h.id==='sound')return f.power;
   if(h.id==='exit')return f.route;
   return true;
  }).map(h=>({...h}));
 }
 function targetFor(id){return id==='panel'?'panel':id==='map'?'map':null;}
 function canDrop(state,item,id){
  if(!state.inventory.includes(item))return false;
  if(id==='panel')return state.room==='office'&&item==='pry';
  if(id!=='map'||state.room!=='platform'||!state.flags.archive)return false;
  return item==='film'||item==='battery'||(item==='badge'&&state.flags.filmMounted);
 }
 function observation(id,state,C){
  const n=C.notes[id];if(!n)return null;
  const frame=C.snapshots[state.loop];
  if(id==='clock')return {...n,text:`時鐘顯示 ${frame.clock}。\n\n${state.loop?'入口的紀錄是 01:16。顯示已經改變，時鐘不能單獨證明方向。':'先記下現在的時間。下一次回到這裡，還會是同一分鐘嗎？'}`};
  if(id==='sign')return {...n,text:`站名牌：${frame.sign}\n\n${state.loop>=2?'方向與入口紀錄相反；掛鉤、刮痕卻完全相同。':'掛鉤有些鬆動，金屬表面留著舊刮痕。先記下箭頭的方向。'}`};
  if(id==='puddle'&&state.loop<3)return {...n,text:`${frame.trace}。\n\n水面映著天花板的燈，邊緣沒有被踩過的痕跡。把這次觀察留在手帳，之後可以重新比對。`};
  return {...n};
 }
 function cleanPins(value,acquired){return Array.isArray(value)?[...new Set(value.filter(x=>typeof x==='string'&&acquired.includes(x)))].slice(0,3):[];}
 function cueFor(id){
  if(id==='puddle')return 'water';
  if(['sticker','report','book','roster','soundGuide','mapGuide'].includes(id))return 'paper';
  if(['clock','sign','panel','power','sound','stairs','pry','badge','map','exit'].includes(id))return 'metal';
  return null;
 }
 return {describe,targetFor,canDrop,observation,cleanPins,cueFor};
});
