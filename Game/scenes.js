/* 原創 2D 向量場景；所有物件由幾何圖形繪製，沒有外部圖片。 */
(function(root){
  'use strict';
  const rect=(x,y,w,h,fill,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
  const text=(x,y,t,size=24,color='#d9d5b5',extra='')=>`<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-family="system-ui,sans-serif" ${extra}>${t}</text>`;
  function shell(body,label){
    let tiles='';for(let x=-1200;x<2700;x+=180)tiles+=`<path d="M720 350L${x} 900"/>`;
    for(const y of [405,460,535,640,790])tiles+=`<path d="M0 ${y}H1440"/>`;
    let wallLines='';for(const y of [180,270,360,450])wallLines+=`<path d="M0 ${y}L530 ${350+(y-350)*0.25}M1440 ${y}L910 ${350+(y-350)*0.25}"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 900" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="ceiling" x2="0" y2="1"><stop stop-color="#1c292b"/><stop offset="1" stop-color="#5d685e"/></linearGradient>
        <linearGradient id="leftwall" x2="1" y2="0"><stop stop-color="#4a5147"/><stop offset="1" stop-color="#8b8b70"/></linearGradient>
        <linearGradient id="rightwall"><stop stop-color="#747963"/><stop offset="1" stop-color="#3c504b"/></linearGradient>
        <linearGradient id="floor" x2="0" y2="1"><stop stop-color="#4c625c"/><stop offset="1" stop-color="#172a2b"/></linearGradient>
        <linearGradient id="metal"><stop stop-color="#9c9e85"/><stop offset=".45" stop-color="#64746c"/><stop offset="1" stop-color="#2b4744"/></linearGradient>
        <linearGradient id="glass" x2="1" y2="1"><stop stop-color="#608985" stop-opacity=".55"/><stop offset="1" stop-color="#122c31" stop-opacity=".9"/></linearGradient>
        <radialGradient id="light"><stop stop-color="#ebd397" stop-opacity=".22"/><stop offset="1" stop-color="#e7c180" stop-opacity="0"/></radialGradient>
        <radialGradient id="vignette"><stop offset=".4" stop-color="#081416" stop-opacity="0"/><stop offset="1" stop-color="#071417" stop-opacity=".65"/></radialGradient>
        <pattern id="paperLines" width="20" height="34" patternUnits="userSpaceOnUse"><path d="M0 33H20" stroke="#444b42" stroke-opacity=".2"/></pattern>
      </defs>
      <path d="M0 0H1440L910 350H530Z" fill="url(#ceiling)"/>
      <path d="M0 0L530 350V520L0 900Z" fill="url(#leftwall)"/>
      <path d="M1440 0L910 350V520L1440 900Z" fill="url(#rightwall)"/>
      ${rect(530,350,380,230,'#53655b')}
      <path d="M0 900L530 520H910L1440 900Z" fill="url(#floor)"/>
      <g stroke="#c4c6a4" stroke-opacity=".13" fill="none">${tiles}${wallLines}</g>
      <path d="M0 463L530 465H910L1440 463" fill="none" stroke="#283e3b" stroke-width="18"/>
      <g opacity=".75"><path d="M176 0L604 350M1264 0L836 350" stroke="#142d2e" stroke-width="8"/>
      <path d="M466 78H974L930 101H510Z" fill="#d7d6b1"/><path d="M585 222H855L839 235H601Z" fill="#eee4bb"/></g>
      <ellipse cx="720" cy="450" rx="650" ry="430" fill="url(#light)"/>
      ${body}
      <path d="M0 0H1440V900H0Z" fill="url(#vignette)" pointer-events="none"/>
      ${text(46,850,label,14,'#afbdad','letter-spacing="5"')}
    </svg>`;
  }
  function corridor(s){
    const frame=root.YellowContent.snapshots[s.loop];
    const footprint=s.loop===3?'<g fill="#273b35" opacity=".85"><ellipse cx="713" cy="745" rx="14" ry="28" transform="rotate(30 713 745)"/><ellipse cx="770" cy="700" rx="12" ry="25" transform="rotate(30 770 700)"/><ellipse cx="821" cy="652" rx="10" ry="22" transform="rotate(30 821 652)"/><ellipse cx="855" cy="613" rx="8" ry="17" transform="rotate(30 855 613)"/></g>':'';
    return shell(`
      ${rect(626,357,194,183,'#233c3a')}${rect(640,370,165,168,'#304b46')}
      <path d="M650 382H795V537H650Z" fill="url(#glass)"/>${rect(762,446,9,9,'#d3b166')}
      <path d="M185 443L364 466V710L185 740Z" fill="#253d3b"/>
      <path d="M180 438L340 438V735H180Z" fill="url(#metal)"/>
      ${rect(198,456,122,111,'#b1b5a0','rx="8"')}${rect(211,471,96,76,'url(#glass)','rx="5"')}
      ${rect(201,585,117,68,'#394b43')}${rect(217,599,28,16,'#aeb5a0')}${rect(270,599,28,16,'#aeb5a0')}
      ${rect(217,632,80,7,'#1a3431')}${rect(242,666,63,43,'#b7aa77','transform="rotate(-5 242 666)"')}
      ${text(247,686,'維修',13,'#35443a')}${text(204,727,'第零層',14)}
      <g transform="translate(637 192)"><circle r="48" fill="#172f30"/><circle r="40" fill="#b8baa2"/><circle r="2" fill="#273d37"/><path d="M0 0V-24M0 0L21 10" stroke="#263c36" stroke-width="3"/>${text(-34,65,frame.clock,24,'#c6ccb0')}</g>
      <path d="M942 233L1207 154V229L942 289Z" fill="#183b36" stroke="#a3b3a0" stroke-width="2"/>
      ${text(968,249,frame.sign,36,'#c9cfad','transform="rotate(-16 968 249)"')}
      <path d="M1072 375L1265 313V707L1072 607Z" fill="#2a4943" stroke="#899a7c" stroke-width="4"/>
      <path d="M1092 388L1242 344V655L1092 586Z" fill="#1c3836"/>${text(1121,450,'安全梯',23,'#bcbf95','transform="rotate(-12 1121 450)"')}
      <path d="M602 770Q690 714 798 747T917 796Q756 843 602 810Z" fill="#789b8d" opacity=".17"/>${footprint}
      <g stroke="#d2b967" opacity=".5"><path d="M678 615L218 900" stroke-width="11"/><path d="M746 615L1220 900" stroke-width="11"/></g>
    `,'LEVEL 00 · CONCOURSE');
  }
  function stairs(s){
    let steps='';for(let i=0;i<7;i++)steps+=`<path d="M${460-i*33} ${380+i*47}H${970+i*30}V${410+i*47}H${460-i*33}Z" fill="${i%2?'#5c7065':'#677b6f'}" stroke="#233f3b" stroke-width="3"/>`;
    return shell(`${steps}<path d="M305 745L557 328M1130 745L880 328" stroke="#a3ac90" stroke-width="11"/>
      ${rect(1060,450,200,215,'#354d42')}${rect(1075,465,170,188,'url(#metal)')}${text(1092,510,'維修工具',24)}
      ${!s.flags.pry?'<path d="M1112 570L1195 585L1200 572L1117 557L1100 566Z" fill="#c8c5a4"/>':''}
      ${!s.flags.badge?rect(1135,610,65,41,'#b5ad7d','rx="4"')+text(1140,637,'M0',18,'#293e35'):''}
      ${rect(218,258,230,88,'#1b4940')}${text(250,310,'安全出口 ↑',31,'#c9d7b2')}
    `,'LEVEL 00 · SERVICE STAIR');
  }
  function office(s){
    const p=s.flags.power;
    let controls='';for(let i=0;i<8;i++)controls+=rect(468+i*60,588,32,16,i===3&&p?'#d4bc71':'#41594e','rx="3"');
    return shell(`
      ${rect(135,276,287,301,'#223b38')}${rect(151,291,255,270,'url(#metal)')}
      ${text(183,335,'備用電源',29)}${rect(188,371,184,137,s.flags.boxOpen?'#132e2e':'#496057','stroke="#a1ab8c" stroke-width="3"')}
      ${s.flags.boxOpen?`<path d="M222 405L310 461M310 405L222 461" stroke="#c9b161" stroke-width="5"/>${rect(271,420,40,55,p?'#a4c78e':'#a47e55')}`:text(220,453,'檢修盒',24)}
      <path d="M403 568L1055 568L1198 694H269Z" fill="#657c69" stroke="#9aa48b" stroke-width="3"/>
      <path d="M269 694H1198L1155 822H315Z" fill="#2e4941"/>
      ${rect(523,365,341,206,'#203d38','rx="9"')}${rect(542,385,303,161,p?'#48664e':'#153534','rx="3"')}
      ${p?text(562,439,s.flags.broadcast?'記憶重播系統':'音序校準',30,'#d3dfb5')+text(564,492,s.flags.broadcast?'SIGNAL FOUND':'━  ▪  ▪ ▪',31,'#dbcb85'):text(570,470,'STANDBY',31,'#527167')}
      ${controls}${rect(980,406,146,127,'#b5ac83','transform="rotate(2 980 406)"')}
      ${text(1002,444,'維修刻痕',21,'#3d4e3f')}${text(1005,487,'━ ▪ ▪ ▪',25,'#3d4e3f')}
      ${rect(1084,336,127,43,'#294c43')}${text(1092,365,'檔案室 →',20)}
      <g fill="#b6c5a2">${[0,1,2].map(i=>`<circle cx="${915+i*35}" cy="616" r="8" opacity="${p?'.8':'.2'}"/>`).join('')}</g>
    `,'LEVEL 00 · STATION CONTROL');
  }
  function archive(){
    let shelves='';for(let side=0;side<2;side++)for(let r=0;r<4;r++){
      const x=side?1040:100,y=277+r*74;
      shelves+=rect(x,y,285,8,'#1c3732');
      for(let j=0;j<8;j++)shelves+=rect(x+12+j*33,y-49,25,48,['#73816a','#8f8e6f','#b3a47c'][j%3]);
    }
    return shell(`${shelves}${rect(574,338,290,175,'#203d35')}${text(612,409,'事故紀錄室',31)}${text(647,452,'ARCHIVE',21,'#91a98e','letter-spacing="4"')}
      <path d="M388 568H1025L1175 760H225Z" fill="#79836a"/>
      <path d="M225 760H1175V781H225Z" fill="#2c4337"/>
      ${[0,1,2].map((i)=>{const x=367+i*230;return `<g transform="rotate(${i*3-3} ${x} 625)">${rect(x,593,175,139,'#c6be94')}${rect(x+12,605,151,113,'url(#paperLines)')}${text(x+20,642,['事故報告','維修簿','失聯名冊'][i],23,'#344c3c')}${text(x+20,687,['01:17','凌晨一點十七分','M0'][i],17,'#53644d')}</g>`;}).join('')}
      <path d="M1130 660L1094 515L1169 450" fill="none" stroke="#344e40" stroke-width="12"/>
      <path d="M1125 437H1222L1192 474H1121Z" fill="#b5b48d"/>
    `,'LEVEL 00 · RECORDS');
  }
  function platform(s){
    return shell(`
      <path d="M460 565L-100 900H1440L980 565Z" fill="#162e2f"/><path d="M555 560L400 900M816 560L1050 900" stroke="#76817a" stroke-width="12"/>
      <path d="M490 560L90 900" stroke="#cfb567" stroke-width="22"/>
      <path d="M1030 336H1248V672H1030Z" fill="${s.flags.route?'#697c64':'#2b4640'}" stroke="#a5ae88" stroke-width="5"/>
      ${text(1066,414,'維修出口',27)}${rect(1080,453,120,148,s.flags.route?'#b5b787':'#193d36')}
      ${text(1101,521,s.flags.route?'已解鎖':'M0',30,s.flags.route?'#344b3b':'#b6bb93')}
      <path d="M177 288L556 336V641L177 711Z" fill="#344e43" stroke="#8a9a7b" stroke-width="5"/>
      <path d="M193 311L537 352V620L193 678Z" fill="#1b3b35"/>
      <g fill="none" stroke="${s.flags.batteryInstalled?'#c9b76c':'#68866c'}" stroke-width="9"><path d="M231 586L311 490L420 518L496 414"/><path d="M311 490L381 405" opacity=".35"/></g>
      <g fill="${s.flags.batteryInstalled?'#e3cf87':'#7c9479'}">${[[231,586],[311,490],[420,518],[496,414]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="9"/>`).join('')}</g>
      ${text(220,360,'路線校正',25)}${rect(330,691,134,56,'#3f5b47')}${text(350,727,'電池槽',20)}
      <path d="M680 300H885V342H680Z" fill="#a2a578"/>${text(704,329,'北澤 ←',24,'#29483b')}
      <path d="M600 561L566 900M851 561L1230 900" stroke="#1a3636" stroke-width="7"/>
    `,'LEVEL 00 · PLATFORM M0');
  }
  root.YellowScenes={draw:(room,s)=>({corridor,stairs,office,archive,platform}[room]||corridor)(s)};
})(globalThis);
