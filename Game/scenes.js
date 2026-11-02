/* 原創 2D 場景：消失點透視、分層光影與材質，沒有 WebGL 或外部圖像。 */
(function(root){
  'use strict';
  let serial=0;
  const rect=(x,y,w,h,fill,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
  const text=(x,y,t,size=24,color='#d5d0c7',extra='')=>`<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-family="-apple-system,BlinkMacSystemFont,Microsoft JhengHei,sans-serif" ${extra}>${t}</text>`;
  function shell(body,label){
    // 每張圖有獨立漸層 ID，避免首頁、遊戲與筆記同時存在時互相覆蓋。
    const prefix='station-'+(++serial)+'-';
    let floorSeams='';
    for(const x of [-1800,-900,-250,260,720,1180,1690,2340,3240])floorSeams+=`<path d="M720 390L${x} 960"/>`;
    for(const y of [544,588,664,790])floorSeams+=`<path d="M0 ${y}H1440"/>`;
    const panels=[150,310,440].map(y=>`<path d="M0 ${y}L530 ${350+(y-350)*.25}M1440 ${y}L910 ${350+(y-350)*.25}"/>`).join('');
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 900" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="ceiling" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#17191e"/><stop offset="1" stop-color="#555451"/></linearGradient>
        <linearGradient id="leftwall"><stop stop-color="#292b30"/><stop offset=".75" stop-color="#66625b"/><stop offset="1" stop-color="#4c4a46"/></linearGradient>
        <linearGradient id="rightwall"><stop stop-color="#69635a"/><stop offset=".65" stop-color="#3a3c41"/><stop offset="1" stop-color="#202329"/></linearGradient>
        <linearGradient id="backwall" x2="0" y2="1"><stop stop-color="#656159"/><stop offset="1" stop-color="#33363a"/></linearGradient>
        <linearGradient id="floor" x2="0" y2="1"><stop stop-color="#49494a"/><stop offset=".5" stop-color="#25282e"/><stop offset="1" stop-color="#15181f"/></linearGradient>
        <linearGradient id="metal"><stop stop-color="#8d8d8b"/><stop offset=".08" stop-color="#b8b5ae"/><stop offset=".16" stop-color="#777879"/><stop offset=".65" stop-color="#50545b"/><stop offset="1" stop-color="#292d35"/></linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#c7b695" stop-opacity=".38"/><stop offset=".42" stop-color="#62666d" stop-opacity=".32"/><stop offset=".44" stop-color="#a9aaab" stop-opacity=".22"/><stop offset="1" stop-color="#11151d" stop-opacity=".97"/></linearGradient>
        <radialGradient id="light"><stop stop-color="#d8bd91" stop-opacity=".17"/><stop offset="1" stop-color="#bfa980" stop-opacity="0"/></radialGradient>
        <linearGradient id="beam" x2="0" y2="1"><stop stop-color="#ead7b8" stop-opacity=".12"/><stop offset="1" stop-color="#d4bc96" stop-opacity="0"/></linearGradient>
        <radialGradient id="floorLight"><stop stop-color="#dbc9ad" stop-opacity=".16"/><stop offset="1" stop-color="#cbb18b" stop-opacity="0"/></radialGradient>
        <radialGradient id="vignette"><stop offset=".36" stop-color="#080b11" stop-opacity="0"/><stop offset="1" stop-color="#06080d" stop-opacity=".68"/></radialGradient>
        <pattern id="paperLines" width="20" height="34" patternUnits="userSpaceOnUse"><path d="M0 33H20" stroke="#504c45" stroke-opacity=".17"/></pattern>
        <pattern id="vents" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M1 0V8" stroke="#080b10" stroke-width="3"/></pattern>
        <filter id="objectShadow" x="-25%" y="-25%" width="150%" height="155%"><feDropShadow dx="11" dy="17" stdDeviation="11" flood-color="#03050a" flood-opacity=".48"/></filter>
        <filter id="softGlow" x="-100%" y="-200%" width="300%" height="500%"><feGaussianBlur stdDeviation="11"/></filter>
        <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
        <clipPath id="floorClip"><path d="M0 900L530 520H910L1440 900Z"/></clipPath>
      </defs>
      <path d="M0 0H1440L910 350H530Z" fill="url(#ceiling)"/>
      <path d="M0 0L530 350V520L0 900Z" fill="url(#leftwall)"/>
      <path d="M1440 0L910 350V520L1440 900Z" fill="url(#rightwall)"/>
      ${rect(530,350,380,230,'url(#backwall)')}
      <path d="M0 900L530 520H910L1440 900Z" fill="url(#floor)"/>
      <g stroke="#d4c9b6" stroke-opacity=".075" fill="none" stroke-width="1.2">${panels}</g>
      <g clip-path="url(#floorClip)" stroke="#d8d4cf" stroke-opacity=".07" fill="none" stroke-width="1.1">${floorSeams}</g>
      <g stroke="#11151c" fill="none"><path d="M0 465L530 468H910L1440 465" stroke-width="22"/><path d="M0 459L530 465H910L1440 459" stroke="#bfb7aa" stroke-opacity=".22" stroke-width="2"/>
      <path d="M0 530L530 520H910L1440 530" stroke-width="9"/><path d="M530 350V520M910 350V520" stroke-width="3"/>
      <path d="M132 0L590 350M1308 0L850 350" stroke-width="16"/><path d="M155 0L596 350M1285 0L844 350" stroke="#9a958b" stroke-opacity=".18" stroke-width="2"/></g>
      <path d="M440 68H1000L955 108H485Z" fill="#0e1117"/>
      <path d="M460 78H980L944 97H496Z" fill="#d2ba96" opacity=".25" filter="url(#softGlow)"/>
      <path d="M466 78H974L940 94H500Z" fill="#e6d4b8" opacity=".75"/>
      <path d="M576 212H864L840 239H600Z" fill="#15181d"/>
      <path d="M588 222H852L837 232H603Z" fill="#e0cfb2" opacity=".85"/>
      <path d="M500 94H940L1105 650H335Z" fill="url(#beam)"/>
      <ellipse cx="720" cy="650" rx="490" ry="170" fill="url(#floorLight)"/>
      <ellipse cx="718" cy="412" rx="620" ry="400" fill="url(#light)"/>
      <g filter="url(#objectShadow)">${body}</g>
      <path d="M0 0H48L118 900H0Z" fill="#0b0e14" opacity=".65"/>
      <path d="M1440 0H1397L1325 900H1440Z" fill="#080b11" opacity=".6"/>
      <path d="M48 0L118 900M1397 0L1325 900" stroke="#b9b2a7" stroke-opacity=".07" stroke-width="2"/>
      ${rect(0,0,1440,900,'#fff','filter="url(#grain)" opacity=".025" pointer-events="none"')}
      <path d="M0 0H1440V900H0Z" fill="url(#vignette)" pointer-events="none"/>
      ${text(54,854,label,13,'#9a9996','letter-spacing="4" opacity=".7"')}
    </svg>`;
    return svg.replace(/id="([^"]+)"/g,(_,id)=>'id="'+prefix+id+'"').replace(/url\(#([^)]+)\)/g,(_,id)=>'url(#'+prefix+id+')');
  }
  function corridor(s){
    const frame=root.YellowContent.snapshots[s.loop];
    const footprint=s.loop===3?'<g fill="#353538" opacity=".85"><ellipse cx="713" cy="745" rx="14" ry="28" transform="rotate(30 713 745)"/><ellipse cx="770" cy="700" rx="12" ry="25" transform="rotate(30 770 700)"/><ellipse cx="821" cy="652" rx="10" ry="22" transform="rotate(30 821 652)"/><ellipse cx="855" cy="613" rx="8" ry="17" transform="rotate(30 855 613)"/></g>':'';
    return shell(`
      ${rect(626,357,194,183,'#353638')}${rect(640,370,165,168,'#434447')}
      <path d="M650 382H795V537H650Z" fill="url(#glass)"/>${rect(762,446,9,9,'#d5cfc3')}
      <path d="M185 443L364 466V710L185 740Z" fill="#363739"/>
      <path d="M180 438L340 438V735H180Z" fill="url(#metal)"/>
      ${rect(198,456,122,111,'#aeb0b8','rx="8"')}${rect(211,471,96,76,'url(#glass)','rx="5"')}
      ${rect(201,585,117,68,'#454548')}${rect(217,599,28,16,'#aeb0b7')}${rect(270,599,28,16,'#aeb0b7')}
      ${rect(217,632,80,7,'#2d2d2f')}${rect(242,666,63,43,'#bfa780','transform="rotate(-5 242 666)"')}
      ${text(247,686,'維修',13,'#3e3f41')}${text(204,727,'第零層',14)}
      <g transform="translate(637 192)"><circle r="48" fill="#29292b"/><circle r="40" fill="#b3b5bd"/><circle r="2" fill="#363739"/><path d="M0 0V-24M0 0L21 10" stroke="#353638" stroke-width="3"/>${text(-34,65,frame.clock,24,'#c4c6ce')}</g>
      <path d="M942 233L1207 154V229L942 289Z" fill="#313234" stroke="#aaacb3" stroke-width="2"/>
      ${text(968,249,frame.sign,36,'#c5c7d0','transform="rotate(-16 968 249)"')}
      <path d="M1072 375L1265 313V707L1072 607Z" fill="#404043" stroke="#8f9197" stroke-width="4"/>
      <path d="M1092 388L1242 344V655L1092 586Z" fill="#303133"/>${text(1121,450,'安全梯',23,'#b5b7bf','transform="rotate(-12 1121 450)"')}
      <path d="M602 770Q690 714 798 747T917 796Q756 843 602 810Z" fill="#8f9097" opacity=".17"/><g class="water-shimmer" fill="none" stroke="#d8cfb9" stroke-width="1.3"><path d="M643 782Q748 765 846 786M683 800Q752 791 810 800"/></g>${footprint}
      <g stroke="#d5cfc3" opacity=".5"><path d="M678 615L218 900" stroke-width="11"/><path d="M746 615L1220 900" stroke-width="11"/></g>
    `,'LEVEL 00 · CONCOURSE');
  }
  function stairs(s){
    let steps='';for(let i=0;i<7;i++)steps+=`<path d="M${460-i*33} ${380+i*47}H${970+i*30}V${410+i*47}H${460-i*33}Z" fill="${i%2?'#68696e':'#737479'}" stroke="#37383a" stroke-width="3"/>`;
    return shell(`${steps}<path d="M305 745L557 328M1130 745L880 328" stroke="#a3a5ac" stroke-width="11"/>
      ${rect(1060,450,200,215,'#454548')}${rect(1075,465,170,188,'url(#metal)')}${text(1092,510,'維修工具',24)}
      ${!s.flags.pry?'<path d="M1112 570L1195 585L1200 572L1117 557L1100 566Z" fill="#bec0c8"/>':''}
      ${!s.flags.badge?rect(1135,610,65,41,'#bfa780','rx="4"')+text(1140,637,'M0',18,'#37373a'):''}
      ${rect(218,258,230,88,'#3c3c3f')}${text(250,310,'安全出口 ↑',31,'#cbcdd6')}
    `,'LEVEL 00 · SERVICE STAIR');
  }
  function office(s){
    const p=s.flags.power;
    let controls='';for(let i=0;i<8;i++)controls+=rect(468+i*60,588,32,16,i===3&&p?'#d5cfc3':'#505155','rx="3"');
    return shell(`
      ${rect(135,276,287,301,'#343437')}${rect(151,291,255,270,'url(#metal)')}
      ${text(183,335,'備用電源',29)}${rect(188,371,184,137,s.flags.boxOpen?'#272829':'#58595d','stroke="#a1a3aa" stroke-width="3"')}
      ${s.flags.boxOpen?`<path d="M222 405L310 461M310 405L222 461" stroke="#bfa780" stroke-width="5"/>${rect(271,420,40,55,p?'#b3b4bc':'#bfa780')}`:text(220,453,'檢修盒',24)}
      <path d="M403 568L1055 568L1198 694H269Z" fill="#727378" stroke="#9c9da4" stroke-width="3"/>
      <path d="M269 694H1198L1155 822H315Z" fill="#404144"/>
      ${rect(523,365,341,206,'#353538','rx="9"')}${rect(542,385,303,161,p?'#5a5a5f':'#2d2d2f','rx="3"')}
      ${p?text(562,439,s.flags.broadcast?'記憶重播系統':'音序校準',30,'#d2d5de')+text(564,492,s.flags.broadcast?'SIGNAL FOUND':'━  ▪  ▪ ▪',31,'#d5cfc3'):text(570,470,'STANDBY',31,'#67686c')}
      ${controls}${rect(980,406,146,127,'#d5cfc3','transform="rotate(2 980 406)"')}
      ${text(1002,444,'維修刻痕',21,'#47474a')}${text(1005,487,'━ ▪ ▪ ▪',25,'#47474a')}
      ${rect(1084,336,127,43,'#414245')}${text(1092,365,'檔案室 →',20)}
      <g fill="#b9bbc4">${[0,1,2].map(i=>`<circle cx="${915+i*35}" cy="616" r="8" opacity="${p?'.8':'.2'}"/>`).join('')}</g>
    `,'LEVEL 00 · STATION CONTROL');
  }
  function archive(){
    let shelves='';for(let side=0;side<2;side++)for(let r=0;r<4;r++){
      const x=side?1040:100,y=277+r*74;
      shelves+=rect(x,y,285,8,'#2f3032');
      for(let j=0;j<8;j++)shelves+=rect(x+12+j*33,y-49,25,48,['#787a7f','#87898f','#bfa780'][j%3]);
    }
    return shell(`${shelves}${rect(574,338,290,175,'#343537')}${text(612,409,'事故紀錄室',31)}${text(647,452,'ARCHIVE',21,'#9d9ea6','letter-spacing="4"')}
      <path d="M388 568H1025L1175 760H225Z" fill="#7b7c82"/>
      <path d="M225 760H1175V781H225Z" fill="#3b3b3e"/>
      ${[0,1,2].map((i)=>{const x=367+i*230;return `<g transform="rotate(${i*3-3} ${x} 625)">${rect(x,593,175,139,'#d5cfc3')}${rect(x+12,605,151,113,'url(#paperLines)')}${text(x+20,642,['事故報告','維修簿','失聯名冊'][i],23,'#434346')}${text(x+20,687,['01:17','凌晨一點十七分','M0'][i],17,'#5b5c60')}</g>`;}).join('')}
      <path d="M1130 660L1094 515L1169 450" fill="none" stroke="#454548" stroke-width="12"/>
      <path d="M1125 437H1222L1192 474H1121Z" fill="#abadb5"/>
    `,'LEVEL 00 · RECORDS');
  }
  function platform(s){
    return shell(`
      <path d="M460 565L-100 900H1440L980 565Z" fill="#28282a"/><path d="M555 560L400 900M816 560L1050 900" stroke="#7c7d83" stroke-width="12"/>
      <path d="M490 560L90 900" stroke="#d5cfc3" stroke-width="22"/>
      <path d="M1030 336H1248V672H1030Z" fill="${s.flags.route?'#727378':'#3e3e41'}" stroke="#a3a5ac" stroke-width="5"/>
      ${text(1066,414,'維修出口',27)}${rect(1080,453,120,148,s.flags.route?'#acaeb6':'#333335')}
      ${text(1101,521,s.flags.route?'已解鎖':'M0',30,s.flags.route?'#424346':'#b1b3bb')}
      <path d="M177 288L556 336V641L177 711Z" fill="#454649" stroke="#8f9197" stroke-width="5"/>
      <path d="M193 311L537 352V620L193 678Z" fill="#323235"/>
      <g fill="none" stroke="${s.flags.batteryInstalled?'#d5cfc3':'#797a80'}" stroke-width="9"><path d="M231 586L311 490L420 518L496 414"/><path d="M311 490L381 405" opacity=".35"/></g>
      <g fill="${s.flags.batteryInstalled?'#d5cfc3':'#888990'}">${[[231,586],[311,490],[420,518],[496,414]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="9"/>`).join('')}</g>
      ${s.flags.filmMounted?'<path d="M209 328L526 365V605L209 655Z" fill="#d3c3a012" stroke="#d3c3a04d" stroke-width="2"/>':''}${s.flags.overlayFixed?'<path d="M216 333L260 339V358L216 352Z" fill="#b5a17d" stroke="#d7c6a5"/>':''}
      ${text(220,360,'路線校正',25)}${rect(330,691,134,56,'#505154')}${text(350,727,'電池槽',20)}
      <path d="M680 300H885V342H680Z" fill="#9b9ca3"/>${text(704,329,'北澤 ←',24,'#3e3e41')}
      <path d="M600 561L566 900M851 561L1230 900" stroke="#2f2f31" stroke-width="7"/>
    `,'LEVEL 00 · PLATFORM M0');
  }
  root.YellowScenes={draw:(room,s)=>({corridor,stairs,office,archive,platform}[room]||corridor)(s)};
})(globalThis);
