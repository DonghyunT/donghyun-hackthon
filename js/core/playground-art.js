/* Original lightweight campus illustrations. No external assets or textbook imagery. */
(() => {
  'use strict';
  const svg = (viewBox, content) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none" aria-hidden="true" focusable="false">${content}</svg>`;
  const tree = (x, y, scale = 1, tone = '#88aa96') => `<g transform="translate(${x} ${y}) scale(${scale})"><ellipse cy="14" rx="18" ry="7" fill="#547267" opacity=".1"/><path d="M0 2v16" stroke="#938875" stroke-width="5" stroke-linecap="round"/><path d="M-19-5c0-13 8-22 19-22S19-18 19-5C19 9 10 13 0 13S-19 9-19-5Z" fill="${tone}"/><path d="M-10-10c0-7 5-11 10-12" stroke="#fff" stroke-opacity=".22" stroke-width="5" stroke-linecap="round"/></g>`;
  const shrub = (x, y) => `<g transform="translate(${x} ${y})"><ellipse rx="18" ry="7" fill="#abc2a8"/><circle cx="-5" cy="-3" r="5" fill="#c6d7b9"/><circle cx="7" cy="-4" r="6" fill="#b8ceb1"/></g>`;
  const bench = (x, y, rotate = 0) => `<g transform="translate(${x} ${y}) rotate(${rotate})"><path d="M-15 5v7m30-7v7" stroke="#8b9598" stroke-width="3"/><rect x="-20" y="-5" width="40" height="7" rx="2" fill="#c8b493"/><rect x="-20" y="4" width="40" height="6" rx="2" fill="#d7c3a3"/></g>`;
  const lamp = (x, y) => `<g transform="translate(${x} ${y})"><ellipse cy="10" rx="8" ry="3" fill="#547267" opacity=".1"/><path d="M0 8v-24" stroke="#839a94" stroke-width="3"/><rect x="-5" y="-29" width="10" height="12" rx="4" fill="#fff9dc" stroke="#839a94" stroke-width="2"/></g>`;
  const map = () => svg('0 0 1000 620', `
    <rect width="1000" height="620" rx="24" fill="#edf2ee"/>
    <path d="M0 82C164 127 197 45 343 60S563 119 707 68 879 62 1000 98V0H0Z" fill="#e4ece5"/>
    <path d="M0 530c167-54 237 56 397 37s212-69 349-40 164 41 254 10v83H0Z" fill="#e2ece6"/>
    <path d="M27 355c15-33 47-45 74-27s24 53 4 73-58 17-73-4-12-23-5-42Z" fill="#d4e5e7"/>
    <path d="M42 357c13-21 28-23 44-14M39 384c14 14 30 14 43 3" stroke="#edf4f3" stroke-width="4" stroke-linecap="round"/>
    <path d="M500 340V180M500 340 390 322H235v-20M500 340l110-18h155v-20M500 340v56l-60 64-140 68M500 396l60 64 140 68" stroke="#dde2dc" stroke-width="55" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M500 340V180M500 340 390 322H235v-20M500 340l110-18h155v-20M500 340v56l-60 64-140 68M500 396l60 64 140 68" stroke="#faf8ef" stroke-width="47" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="500" cy="340" r="71" fill="#faf8ef" stroke="#dde2dc" stroke-width="2"/>
    <circle cx="500" cy="340" r="57" stroke="#e3e5db" stroke-width="1.5" stroke-dasharray="3 9"/>
    <path d="m500 312 8 20 21 8-21 8-8 20-8-20-21-8 21-8Z" fill="#dde7df"/>
    <path d="M496 245h8m-8 18h8M321 318v8m20-8v8m318-8v8m20-8v8M422 465l5 6m-22 3 5 6m168-15-5 6m22 3-5 6" stroke="#dddcd0" stroke-width="2" stroke-linecap="round"/>
    <path d="M345 77h46M609 77h46M150 157h60M790 157h60" stroke="#d3dfd2" stroke-width="3" stroke-linecap="round"/>
    ${tree(78, 101, 1.3)}${tree(113, 130, .8, '#9cb69c')}${tree(905, 113, 1.3)}${tree(865, 140, .85, '#a9bd9d')}
    ${tree(123, 240, .8, '#aac0a3')}${tree(881, 240, .8, '#aac0a3')}${tree(78, 481, 1.35)}${tree(118, 520, .85)}
    ${tree(927, 467, 1.2)}${tree(884, 498, .85, '#abc0a0')}${tree(449, 88, .66, '#a7bca0')}${tree(551, 88, .66, '#a7bca0')}
    ${shrub(135, 185)}${shrub(865, 185)}${shrub(386, 211)}${shrub(614, 211)}${shrub(188, 435)}${shrub(812, 435)}
    ${shrub(445, 553)}${shrub(555, 553)}${bench(402, 357, -90)}${bench(598, 357, 90)}${bench(173, 366)}${bench(827, 366)}
    ${lamp(456, 263)}${lamp(544, 263)}${lamp(343, 426)}${lamp(657, 426)}
    <g fill="#b8c9b1"><path d="m167 102 2-5 2 5m-3-1-3-3m7 3 3-3M819 83l2-5 2 5m-3-1-3-3m7 3 3-3M143 470l2-5 2 5m-3-1-3-3m7 3 3-3M851 550l2-5 2 5m-3-1-3-3m7 3 3-3" stroke="#b8c9b1" stroke-width="2" stroke-linecap="round"/></g>
    <g fill="#d6cba8"><circle cx="161" cy="409" r="2.5"/><circle cx="171" cy="415" r="2"/><circle cx="835" cy="407" r="2.5"/><circle cx="844" cy="416" r="2"/></g>
    <g transform="translate(500 579)"><path d="M-37 0h24M13 0h24" stroke="#bdcdbf" stroke-width="1.5"/><path d="m0-7 7 7-7 7-7-7Z" fill="#b7cabb"/></g>
  `);
  const windows = (color) => `<g fill="${color}" stroke="#fff" stroke-width="2"><rect x="29" y="76" width="22" height="22" rx="3"/><rect x="129" y="76" width="22" height="22" rx="3"/></g><path d="M40 77v19m100-19v19" stroke="#fff" stroke-width="2"/>`;
  const foundation = (wall, side, roof, accent) => `
    <ellipse cx="91" cy="128" rx="77" ry="9" fill="#48695c" opacity=".12"/>
    <path d="M20 115h140l8 11H12Z" fill="#d4dcd4"/>
    <path d="M22 53h136v63H22Z" fill="${wall}" stroke="${side}" stroke-width="1.5"/>
    <path d="M145 53h13v63h-13Z" fill="${side}" opacity=".35"/>
    <path d="M16 51 33 26h114l17 25v9H16Z" fill="${roof}"/>
    <path d="M16 51h148v9H16Z" fill="${accent}"/>
    <path d="M68 89a22 22 0 0 1 44 0v27H68Z" fill="${side}" opacity=".3"/>
    <path d="M74 90a16 16 0 0 1 32 0v26H74Z" fill="${accent}"/>
    <path d="M90 76v38" stroke="#fff" stroke-opacity=".4" stroke-width="1.5"/>
    <circle cx="96" cy="99" r="1.5" fill="#fff"/>
    <path d="M70 116h40l5 9H65Z" fill="#f3f1e5"/>
    <rect x="61" y="63" width="58" height="15" rx="4" fill="#fffdf6"/>
  `;
  const building = (id) => {
    let content;
    if (id === 'computing') {
      content = foundation('#e9eee8', '#91aaa3', '#88b1a4', '#537e77') + windows('#b1cfc5') + `
        <path d="M20 36V14h18v13" stroke="#91aaa3" stroke-width="5"/><path d="M22 14h14" stroke="#bdd0c5" stroke-width="5"/>
        <rect x="63" y="7" width="54" height="37" rx="6" fill="#eff7ed" stroke="#537e77" stroke-width="3"/>
        <rect x="69" y="13" width="42" height="23" rx="2" fill="#547e76"/><path d="m78 20-4 4 4 4m24-8 4 4-4 4m-10-9-5 11" stroke="#d8eada" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M84 45h12m-6-3v3" stroke="#537e77" stroke-width="3" stroke-linecap="round"/>
        <path d="M78 70h24" stroke="#537e77" stroke-width="2" stroke-linecap="round"/>
        <rect x="12" y="95" width="10" height="22" rx="2" fill="#b8c5a1"/><path d="M17 95v-8m0 5-4-4m4 4 4-5" stroke="#749574" stroke-width="2"/>
      `;
    } else if (id === 'data') {
      content = foundation('#e6edf1', '#96aabd', '#9cbacf', '#63859f') + windows('#b9d4e5') + `
        <path d="M132 27V13h14v14" fill="#d7e4eb" stroke="#8eacc1" stroke-width="2"/>
        <rect x="57" y="7" width="66" height="39" rx="6" fill="#f2f7f9" stroke="#63859f" stroke-width="3"/>
        <path d="M66 36h48" stroke="#c5d6df" stroke-width="2"/><rect x="70" y="25" width="9" height="11" rx="2" fill="#a7c4cb"/><rect x="86" y="17" width="9" height="19" rx="2" fill="#8aa9c4"/><rect x="102" y="11" width="9" height="25" rx="2" fill="#63859f"/>
        <circle cx="77" cy="70" r="2" fill="#63859f"/><circle cx="90" cy="70" r="2" fill="#63859f"/><circle cx="103" cy="70" r="2" fill="#63859f"/>
        <g fill="#abc4cf" stroke="#63859f" stroke-width="1.5"><path d="M146 98v15c0 5 20 5 20 0V98"/><ellipse cx="156" cy="98" rx="10" ry="4"/></g><path d="M146 105c0 5 20 5 20 0" stroke="#63859f" stroke-width="1.5"/>
      `;
    } else if (id === 'algorithm') {
      content = foundation('#eeebf3', '#b4a8ca', '#aca0c6', '#776595') + windows('#cac0dc') + `
        <path d="M11 48 90 12l79 36v11H11Z" fill="#aca0c6"/><path d="m14 48 76-35 76 35" stroke="#8a7ba6" stroke-width="3" stroke-linejoin="round"/>
        <rect x="61" y="1" width="58" height="52" rx="7" fill="#fffdf9" stroke="#8a7ba6" stroke-width="2.5"/>
        <path d="M90 16v6m0 13v8m0-16h16v16" stroke="#8992a5" stroke-width="2"/>
        <rect x="80" y="8" width="20" height="9" rx="4.5" fill="#a079c3"/><path d="m90 21 10 8-10 8-10-8Z" fill="#e3a360"/><rect x="81" y="41" width="18" height="7" rx="1.5" fill="#729aca"/><path d="m103 40 11 0-3 8h-11Z" fill="#86ae81"/>
        <path d="M79 70h22" stroke="#776595" stroke-width="2" stroke-linecap="round"/>
        <path d="M156 75v34" stroke="#958e9f" stroke-width="2"/><path d="M157 76h15l-4 5 4 5h-15Z" fill="#c5b8db"/>
      `;
    } else if (id === 'ai') {
      content = `
        <ellipse cx="90" cy="128" rx="74" ry="9" fill="#48695c" opacity=".12"/>
        <path d="M25 114h130l10 12H15Z" fill="#dcd9cd"/>
        <rect x="26" y="59" width="128" height="56" rx="3" fill="#f2e9db" stroke="#cbb897" stroke-width="1.5"/>
        <path d="M24 60C26 20 49 9 90 9s64 11 66 51Z" fill="#d7c3a0"/>
        <path d="M48 60c0-30 13-48 42-51M132 60c0-30-13-48-42-51" stroke="#ecdfc5" stroke-width="2"/>
        <rect x="21" y="55" width="138" height="10" rx="4" fill="#ad9270"/>
        <path d="M90 10V1" stroke="#ad9270" stroke-width="3"/><circle cx="90" cy="3" r="3" fill="#9ab7aa"/>
        <rect x="63" y="23" width="54" height="28" rx="10" fill="#fffaf0" stroke="#ad9270" stroke-width="2"/>
        <circle cx="79" cy="35" r="4" fill="#7d918d"/><circle cx="101" cy="35" r="4" fill="#7d918d"/><path d="M85 43h10" stroke="#ad9270" stroke-width="2" stroke-linecap="round"/>
        <rect x="68" y="81" width="44" height="34" rx="16" fill="#ad9270"/><path d="M90 83v32" stroke="#e9d8b9" stroke-width="1.5"/>
        <rect x="65" y="68" width="50" height="9" rx="3" fill="#fffaf0"/><path d="M80 72h20" stroke="#ad9270" stroke-width="2" stroke-linecap="round"/>
        <g fill="#c4d8cd" stroke="#fffaf0" stroke-width="2"><circle cx="45" cy="85" r="10"/><circle cx="135" cy="85" r="10"/></g>
        <path d="M70 115h40l5 10H65Z" fill="#f8f2e7"/>
      `;
    } else {
      content = foundation('#eef0e2', '#a9b391', '#b7c49e', '#7c9471') + `
        <path d="M19 55 90 20l71 35" fill="#cbd5b8" stroke="#94a982" stroke-width="2" stroke-linejoin="round"/>
        <path d="M28 69v42m25-42v42m74-42v42m25-42v42" stroke="#fffdf2" stroke-width="9"/><path d="M28 110h25m74 0h25" stroke="#d3d8c2" stroke-width="5"/>
        <path d="M90 3 111 12v18c0 13-21 22-21 22s-21-9-21-22V12Z" fill="#f9fcf2" stroke="#7c9471" stroke-width="2.5"/>
        <path d="M90 20c-5-4-11-4-15-2v17c5-2 11-1 15 3 4-4 10-5 15-3V18c-4-2-10-2-15 2Z" fill="#c9d7b8" stroke="#7c9471" stroke-width="1.8" stroke-linejoin="round"/><path d="M90 20v18" stroke="#7c9471" stroke-width="1.8"/>
        <path d="M80 70h20" stroke="#7c9471" stroke-width="2" stroke-linecap="round"/>
        <rect x="5" y="101" width="14" height="16" rx="2" fill="#cbb99a"/><path d="M12 102v-14" stroke="#7c9471" stroke-width="2"/><path d="M12 96c-10 0-11-10-11-10 10 0 11 10 11 10m0-5c10 0 11-10 11-10-10 0-11 10-11 10" fill="#a4bc91"/>
      `;
    }
    return svg('0 0 180 140', content);
  };
  const avatar = () => svg('0 0 40 52', `
    <ellipse cx="20" cy="48" rx="13" ry="3" fill="#4c6b67" opacity=".2"/>
    <g class="pg-avatar-body">
      <path d="M14 41v5m12-5v5" stroke="#4e6372" stroke-width="5" stroke-linecap="round"/>
      <path d="M8 30 5 37m27-7 3 7" stroke="#9ab8bf" stroke-width="5" stroke-linecap="round"/>
      <rect x="10" y="26" width="20" height="17" rx="7" fill="#688e9d"/>
      <rect x="15" y="30" width="10" height="7" rx="2" fill="#d5e5e5"/>
      <path d="M20 8V4" stroke="#648a97" stroke-width="2"/><circle cx="20" cy="4" r="3" fill="#ddbc72"/>
      <rect x="5" y="10" width="30" height="20" rx="8" fill="#f9fcf8" stroke="#83a4ad" stroke-width="1.8"/>
      <rect x="9" y="14" width="22" height="11" rx="5" fill="#577889"/>
      <circle cx="15" cy="19" r="2" fill="#e6f4ef"/><circle cx="25" cy="19" r="2" fill="#e6f4ef"/>
      <path d="M18 24h4" stroke="#ddbc72" stroke-width="1.5" stroke-linecap="round"/>
    </g>
  `);
  window.PlaygroundArt = Object.freeze({ map, building, avatar });
})();
