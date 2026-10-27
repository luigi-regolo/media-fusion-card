/*
 * Media Fusion Card — development build for local Home Assistant testing (not a GitHub release)
 * Copyright (c) 2026 luigi-regolo
 * Derived from the user-approved Edera HTML prototype.
 * No remote analytics, external libraries, paid services or credentials.
 */
(() => {
"use strict";
const CARD_TAG = "media-fusion-card";
const EDITOR_TAG = "media-fusion-card-editor";
const DEFAULT = Object.freeze({
  title:"Media Center", subtitle:"Controlli multimediali", tv_headline:"", tv_name:"", fire_name:"", audio_name:"", light_name:"", tv_on_script:"",
  show_title:true, show_subtitle:false, theme:"auto",
  show_samsung:true, show_fire:true, show_alexa:true,
  show_ambilight:true, show_scripts:true,
  samsung_entity:"", samsung_remote:"", tv_off_script:"",
  fire_entity:"", fire_remote:"", alexa_entity:"",
  ambilight_entity:"", scripts:[]
});
const GROUPS = [
  ["show_samsung","TV","Sorgenti e telecomando"],
  ["show_fire","Lettore streaming","Riproduzione e applicazioni"],
  ["show_alexa","Home Theater","Volume e riproduzione"],
  ["show_ambilight","Luci LED TV","Luce e luminosità"],
  ["show_scripts","Script","Azioni personalizzate"]
];
const KEYSETS = {
  samsung: {up:"KEY_UP",down:"KEY_DOWN",left:"KEY_LEFT",right:"KEY_RIGHT",ok:"KEY_ENTER",back:"KEY_RETURN",home:"KEY_HOME",power:"KEY_POWER",mute:"KEY_MUTE",volup:"KEY_VOLUP",voldown:"KEY_VOLDOWN"},
  fire: {up:"UP",down:"DOWN",left:"LEFT",right:"RIGHT",ok:"CENTER",back:"BACK",home:"HOME",power:"POWER",mute:"MUTE",volup:"VOLUME_UP",voldown:"VOLUME_DOWN"}
};
const entityValid = (id,domain) => typeof id === "string" && id.startsWith(domain+".") && /^[a-z0-9_]+$/.test(id.slice(domain.length+1));
const escapeHtml = v => String(v ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[c]);
const clamp = (v,min,max) => Math.min(max,Math.max(min,Number(v)));
const ICON_MAP = Object.freeze({"tv":"television","power":"power","volume":"volume-high","mute":"volume-off","remote":"remote-tv","chevron":"chevron-right","arrow":"arrow-right","list":"format-list-bulleted","fire":"fire","play":"play","pause":"pause","prev":"skip-previous","next":"skip-next","minus":"minus","plus":"plus","sun":"white-balance-sunny","moon":"weather-night","glow":"lightbulb-on-outline","zap":"lightning-bolt-outline","spark":"auto-fix","home":"home","back":"arrow-left","up":"chevron-up","down":"chevron-down","left":"chevron-left","right":"chevron-right","close":"close","check":"check","settings":"cog-outline","info":"information-outline"});
const ico = (id,cls="sm") => `<ha-icon class="ico ${cls}" icon="mdi:${ICON_MAP[id]||"information-outline"}" aria-hidden="true"></ha-icon>`;
const MEDIA_TURN_ON = 128, MEDIA_TURN_OFF = 256;
const supports = (state,feature) => Number.isInteger(state?.attributes?.supported_features) && (state.attributes.supported_features & feature)===feature;
const shownName = (custom,state,fallback) => short(custom,short(state?.attributes?.friendly_name,fallback)).slice(0,70);
const stateIcon = (state,fallback) => /^mdi:[a-z0-9-]+$/.test(state?.attributes?.icon||"") ? state.attributes.icon : fallback;
const normalize = config => {
  const merged = {...DEFAULT,...(config||{})};
  if (!["auto","light","dark"].includes(merged.theme)) merged.theme="auto";
  for(const key of ["tv_headline","tv_name","fire_name","audio_name","light_name"]) merged[key]=typeof merged[key]==="string" ? merged[key].trim().slice(0,70) : "";
  merged.scripts = Array.isArray(merged.scripts) ? merged.scripts.slice(0,30).map(s=>({name:String(s?.name??"").slice(0,60),entity_id:String(s?.entity_id??"")})) : [];
  return merged;
};
const validState = s => !!s && !["unavailable","unknown"].includes(s.state);
const isOn = s => !!s && !["off","standby","unavailable","unknown"].includes(s.state);
const short = (s, fallback) => (typeof s === "string" && s.trim() ? s.trim() : fallback);

const BASE_CSS = "\n:host{color-scheme:light;--bg:#edf1ed;--page:#f7f9f7;--panel:#fff;--panel2:#f5f7f5;--ink:#1c2923;--muted:#79847e;--line:#e5eae5;--emerald:#0a7156;--strong:#138252;--soft:#e9f7ef;--glow:rgba(20,161,99,.18);--shadow:0 18px 45px rgba(17,42,30,.055);--ring:#e7eee9;--switch:#cbd4cd;--greenText:#116b45}\n:host([data-dark]){color-scheme:dark;--bg:#151a19;--page:#1d2321;--panel:#252e2b;--panel2:#303a35;--ink:#f0f5f1;--muted:#a2afa8;--line:#3c4841;--emerald:#39c68d;--strong:#59dba4;--soft:#234538;--glow:rgba(47,195,131,.17);--shadow:0 17px 40px rgba(0,0,0,.17);--ring:#3b4740;--switch:#58665d;--greenText:#83ecb7}\n*{box-sizing:border-box}[hidden]{display:none!important}html{font-family:var(--ha-font-family-body,Roboto,Arial,sans-serif)}body{margin:0;color:var(--ink);background:radial-gradient(ellipse at 10% 0%,var(--glow),transparent 35%),var(--bg);min-height:100vh;transition:background .25s,color .25s}button,input{font:inherit}button{cursor:pointer}button:focus-visible,input:focus-visible{outline:3px solid rgba(48,191,125,.55);outline-offset:2px}button:disabled{opacity:.45;cursor:not-allowed}.ico{width:19px;height:19px;--mdc-icon-size:19px;display:inline-flex;align-items:center;justify-content:center;vertical-align:middle;flex:none}.ico.sm{width:16px;height:16px;--mdc-icon-size:16px}.ico.lg{width:24px;height:24px;--mdc-icon-size:24px}.container{width:min(1190px,calc(100% - 40px));margin:0 auto;padding-bottom:48px}\n.top{height:88px;display:flex;align-items:center;justify-content:space-between;gap:18px;border-bottom:1px solid rgba(120,142,128,.14)}.brand{display:flex;align-items:center;gap:12px}.mark{width:42px;height:42px;border-radius:15px;display:grid;place-items:center;background:var(--emerald);color:white;box-shadow:0 8px 20px var(--glow)}.brand-text{font-size:13px;font-weight:780;letter-spacing:.13em}.brand-text span{display:block;font-size:11px;margin-top:4px;color:var(--muted);letter-spacing:.04em;font-weight:500}.top-right{display:flex;align-items:center;gap:10px}.status-chip{font-size:11px;font-weight:700;border:1px solid var(--line);border-radius:30px;padding:10px 13px;color:var(--muted);white-space:nowrap}.status-chip::before{content:'';display:inline-block;background:#e6ad43;width:6px;height:6px;border-radius:50%;margin-right:8px}.mode-btn{width:39px;height:39px;border-radius:12px;border:1px solid var(--line);background:var(--panel);color:var(--ink);display:grid;place-items:center}\n.heading{padding:38px 0 26px}.eyebrow{color:var(--emerald);font-weight:800;letter-spacing:.16em;font-size:10px}.heading h1{font-size:clamp(25px,3.4vw,41px);letter-spacing:-.055em;font-weight:720;line-height:1.17;margin:12px 0 10px}.heading p{font-size:14px;max-width:660px;line-height:1.7;color:var(--muted);margin:0}.workspace{display:grid;grid-template-columns:minmax(0,1.58fr) minmax(300px,.9fr);gap:25px;align-items:start}.preview-label{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:13px}.overline{font-size:10px;letter-spacing:.16em;font-weight:790;color:var(--muted)}.tiny{font-size:11px;color:var(--muted)}.preview-shell{border:1px solid var(--line);border-radius:26px;background:var(--page);padding:19px;box-shadow:var(--shadow)}\n.media-card{border-radius:23px;background:var(--panel);padding:21px;border:1px solid var(--line);box-shadow:0 13px 32px rgba(0,0,0,.035);min-width:0}.media-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:20px}.head-left{display:flex;align-items:center;gap:12px;min-width:0}.head-icon{width:43px;height:43px;display:grid;place-items:center;border-radius:15px;background:var(--soft);color:var(--emerald);flex:none}.micro{font-size:10px;letter-spacing:1.7px;font-weight:750;color:var(--muted);margin-bottom:7px;text-transform:uppercase}.media-head h2{margin:0;font-size:25px;font-weight:780;letter-spacing:-.7px;line-height:1.14;white-space:normal;overflow-wrap:anywhere}.media-head h2 .dot{color:var(--emerald)}.subhead{font-size:11px;color:var(--muted);margin:6px 0 0}.circle-btn{width:37px;height:37px;border-radius:12px;background:var(--panel2);color:var(--ink);border:1px solid var(--line);display:grid;place-items:center;flex:none;transition:transform .18s}.circle-btn:hover,.action-pill:hover,.icon-btn:hover{transform:translateY(-1px)}\n.sections{display:grid;gap:11px}.device{border-radius:17px;border:1px solid var(--line);overflow:hidden;min-width:0}.samsung{padding:18px;color:#f8faf8;background:radial-gradient(circle at 75% 42%,rgba(52,185,140,.21),transparent 34%),linear-gradient(125deg,#202e2b,#17211e 78%);border-color:#263a31;position:relative}.samsung-upper{display:flex;align-items:center;justify-content:space-between;gap:8px}.device-id{display:flex;align-items:center;gap:9px;font-size:12px;font-weight:760;letter-spacing:.02em}.device-id .ico{opacity:.8}.status{display:inline-flex;align-items:center;gap:6px;font-size:10px;color:#b0c2b8;white-space:nowrap}.status i{width:6px;height:6px;background:#4fe3a2;display:block;border-radius:50%}.status.off i{background:#86928c}.tv-content{display:flex;align-items:center;justify-content:space-between;min-height:114px;gap:14px}.tv-info{min-width:0}.tv-info h3{font-size:23px;letter-spacing:-.05em;margin:0 0 8px;font-weight:660}.tv-info p{font-size:11px;color:#b5c7bd;margin:0}.screen{position:relative;width:146px;height:82px;border:5px solid #3d4d45;border-bottom-width:9px;border-radius:9px;background:radial-gradient(ellipse at 75% 25%,#4bb68e,transparent 45%),linear-gradient(155deg,#426e68,#18352b 55%,#121d24);transform:perspective(440px) rotateY(-11deg);box-shadow:0 10px 35px rgba(0,0,0,.25),0 0 20px rgba(58,195,123,.08);flex:none}.screen:after{content:'';position:absolute;bottom:-16px;width:42px;height:7px;background:#4a5b50;left:calc(50% - 21px);clip-path:polygon(40% 0,60% 0,70% 100%,30% 100%)}.screen .scircle{position:absolute;width:67px;height:67px;right:8px;top:3px;border-radius:50%;border:1px solid rgba(221,251,232,.3)}.device-btn-row{display:flex;gap:8px;flex-wrap:wrap}.action-pill{display:inline-flex;align-items:center;justify-content:center;gap:7px;border-radius:10px;padding:10px 12px;font-size:11px;font-weight:690;transition:.18s;white-space:nowrap;min-width:0}.samsung .action-pill{color:#ecf7ef;border:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.08)}.action-pill.main{background:var(--emerald);color:#fff;border-color:transparent}.samsung .power{margin-left:auto;padding:9px 11px}.samsung.tv-off .tv-info h3{opacity:.5}.samsung.tv-off .screen{filter:grayscale(1);opacity:.35}.samsung.tv-off .status i{background:#899a90}\n.fire{padding:14px 16px;background:var(--panel2);display:flex;align-items:center;justify-content:space-between;gap:11px}.fire-id{display:flex;gap:11px;align-items:center;min-width:0}.fire-logo{width:39px;height:39px;border-radius:13px;display:grid;place-items:center;color:#f4f6f3;background:linear-gradient(135deg,#ef9b42,#a34d2b)}.f-main{font-size:12px;font-weight:760}.f-meta{font-size:10px;color:var(--muted);margin-top:3px}.fire-actions{display:flex;gap:5px;align-items:center}.icon-btn{width:34px;height:34px;display:grid;place-items:center;color:var(--ink);background:var(--panel);border:1px solid var(--line);border-radius:10px;transition:transform .18s}.fire-actions .icon-btn{width:33px;height:33px}.fire-actions .primary{color:var(--emerald)}\n.alexa{padding:17px;background:var(--panel2)}.section-top{display:flex;justify-content:space-between;align-items:center;gap:7px;margin-bottom:13px}.sec-name{font-size:11px;font-weight:800;letter-spacing:.02em;display:flex;gap:8px;align-items:center}.sec-name .ico{color:var(--emerald)}.tag{color:var(--greenText);font-size:9px;background:var(--soft);border-radius:40px;padding:5px 8px;white-space:nowrap}.alexa-body{display:flex;align-items:center;justify-content:space-between;gap:15px}.track{display:flex;gap:10px;align-items:center;min-width:0}.art{width:61px;height:61px;border-radius:13px;background:radial-gradient(circle at 66% 33%,#87d6bb 0 10%,transparent 11%),radial-gradient(circle at 70% 70%,#1d6e61 0 24%,transparent 25%),linear-gradient(140deg,#2c645d,#102831);display:grid;place-items:center;flex:none;box-shadow:0 8px 19px rgba(3,28,20,.13);color:#c5eadb}.tracktext{min-width:0}.track-title{font-size:12px;font-weight:770;line-height:1.35}.track-sub{font-size:10px;color:var(--muted);margin:5px 0 8px;line-height:1.25}.playbar{display:flex;gap:7px}.mini-play{border:0;background:none;padding:3px;color:var(--ink)}.mini-play.active{color:var(--emerald)}.vol-group{display:flex;align-items:center;gap:8px;flex:none}.vol-btn{width:29px;height:29px;border:1px solid var(--line);background:var(--panel);color:var(--ink);display:grid;place-items:center;border-radius:9px}.vol-ring{--angle:151deg;width:92px;height:92px;border-radius:50%;background:conic-gradient(var(--emerald) 0deg var(--angle),var(--ring) var(--angle) 360deg);padding:9px;box-shadow:0 7px 22px var(--glow);position:relative}.vol-inner{background:var(--panel);width:100%;height:100%;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center}.vol-inner strong{font-size:22px;line-height:1;letter-spacing:-.06em;font-variant-numeric:tabular-nums}.vol-inner span{font-size:8px;color:var(--muted);margin-top:5px;font-weight:670;letter-spacing:.09em}.volume-line{display:flex;gap:10px;align-items:center;margin-top:13px}.volume-line .ico{color:var(--muted)}input[type=range]{appearance:none;-webkit-appearance:none;flex:1;height:5px;border-radius:20px;background:linear-gradient(to right,var(--emerald) 0%,var(--emerald) var(--fill,42%),var(--ring) var(--fill,42%),var(--ring) 100%);min-width:0;cursor:pointer}input[type=range]::-webkit-slider-thumb{appearance:none;width:15px;height:15px;border:3px solid var(--panel);background:var(--emerald);border-radius:50%;box-shadow:0 0 0 1px rgba(20,130,85,.26)}input[type=range]::-moz-range-thumb{width:10px;height:10px;border:3px solid var(--panel);background:var(--emerald);border-radius:50%;box-shadow:0 0 0 1px rgba(20,130,85,.26)}.volume-line output{width:30px;text-align:right;font-size:10px;color:var(--muted);font-variant-numeric:tabular-nums}\n.ambient{padding:13px 15px;background:linear-gradient(100deg,rgba(141,105,196,.095),rgba(29,180,124,.075));display:flex;align-items:center;justify-content:space-between;gap:9px;flex-wrap:wrap}.ambient-left{display:flex;align-items:center;gap:10px}.amb-logo{height:34px;width:34px;display:grid;place-items:center;border-radius:11px;background:linear-gradient(135deg,#9875c8,#51bba1);color:white}.amb-brightness{display:flex;gap:8px;align-items:center;flex:1;min-width:95px;max-width:115px}.switch{width:40px;height:24px;border-radius:20px;padding:3px;border:0;background:var(--switch);display:inline-flex;align-items:center;justify-content:flex-start;flex:none;transition:background .2s}.switch:after{content:'';width:18px;height:18px;box-shadow:0 2px 5px rgba(0,0,0,.12);background:white;display:block;border-radius:50%;transition:transform .2s}.switch.on{background:var(--emerald)}.switch.on:after{transform:translateX(16px)}.ambient-controls{display:flex;gap:11px;align-items:center}.ambient .f-meta{font-size:10px}\n.scripts{padding:14px 15px}.script-list{display:flex;flex-wrap:wrap;gap:7px}.script-button{border-radius:10px;border:1px solid var(--line);color:var(--ink);background:var(--panel);display:flex;align-items:center;gap:7px;padding:10px 12px;font-size:11px;font-weight:690}.script-button .ico{color:var(--emerald)}.script-button:hover{border-color:var(--emerald)}.details{background:var(--soft);border-radius:11px;color:var(--greenText);width:100%;border:0;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;font-size:11px;font-weight:750;margin-top:14px}.details .ico{width:15px;height:15px}.foot{display:flex;justify-content:space-between;font-size:10px;color:var(--muted);padding:12px 3px 0;gap:10px}.foot b{color:var(--emerald);font-weight:680}\n.editor{border-radius:22px;background:var(--panel);border:1px solid var(--line);box-shadow:var(--shadow);overflow:hidden}.editor-head{padding:19px 20px 15px;border-bottom:1px solid var(--line)}.editor-head .top-title{font-size:16px;font-weight:760;letter-spacing:-.035em;margin:6px 0 4px}.editor-head p{font-size:11px;color:var(--muted);margin:0;line-height:1.5}.tabs{display:flex;padding:10px;gap:4px;background:var(--panel2);border-bottom:1px solid var(--line)}.tabs button{flex:1;border:0;background:none;color:var(--muted);font-weight:720;font-size:11px;padding:10px 4px;border-radius:10px}.tabs button.selected{color:var(--greenText);background:var(--panel);box-shadow:0 1px 4px rgba(0,0,0,.045)}.settings-body{padding:17px 19px 19px;min-height:410px}.setting-group{margin-bottom:21px}.setting-group:last-child{margin-bottom:0}.group-title{font-size:10px;letter-spacing:.14em;color:var(--muted);font-weight:780;margin-bottom:10px}.setting{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:11px 0;border-bottom:1px solid var(--line)}.setting:last-child{border-bottom:0}.setting .setting-name{font-size:12px;font-weight:680}.setting .setting-description{font-size:10px;line-height:1.4;color:var(--muted);margin-top:4px;max-width:240px}.setting .switch{transform:scale(.9);transform-origin:right}.preset-row{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.preset{background:var(--panel2);border:1px solid var(--line);border-radius:11px;padding:11px 5px;color:var(--ink);font-size:10px;font-weight:720}.preset.active{border-color:var(--emerald);background:var(--soft);color:var(--greenText)}.entity-group{padding-top:5px}.field{margin:12px 0 0}.field label{display:block;font-size:10px;font-weight:720;color:var(--muted);margin-bottom:7px}.field input{width:100%;border:1px solid var(--line);background:var(--panel2);color:var(--ink);border-radius:10px;padding:11px 12px;font-size:11px;outline:none}.field input:focus{border-color:var(--emerald)}.field input::placeholder{color:var(--muted);opacity:.78}.tip{font-size:10px;color:var(--muted);background:var(--panel2);padding:12px;border-radius:11px;line-height:1.6;margin-top:14px}.tip .ico{color:var(--emerald)}.settings-bottom{border-top:1px solid var(--line);padding:14px 19px;font-size:10px;color:var(--muted);line-height:1.5}.editor-actions{display:flex;gap:7px;align-items:center;margin-top:10px}.green-btn{border:0;background:var(--emerald);color:white;border-radius:10px;font-size:11px;padding:10px 13px;font-weight:720}.lite-btn{border:1px solid var(--line);background:var(--panel2);color:var(--ink);font-size:11px;padding:10px 13px;border-radius:10px}.script-edit-row{display:flex;gap:6px;margin-top:8px}.script-edit-row input{flex:1;min-width:0;border-radius:9px;background:var(--panel2);border:1px solid var(--line);padding:10px;font-size:11px;color:var(--ink)}.script-edit-row button{border:1px solid var(--line);background:var(--panel2);color:var(--muted);border-radius:9px;padding:0 10px}.editor-small{font-size:10px;color:var(--muted);line-height:1.55;margin:10px 0}.hidden{display:none!important}\n/* Dialog */\n.overlay{position:fixed;z-index:50;inset:0;padding:24px;display:none;align-items:center;justify-content:center;background:rgba(9,20,16,.60);backdrop-filter:blur(4px)}.overlay.open{display:flex}.dialog{width:min(430px,100%);max-height:min(690px,calc(100dvh - 48px));display:flex;flex-direction:column;background:var(--panel);border-radius:22px;border:1px solid var(--line);box-shadow:0 30px 70px rgba(0,0,0,.25);overflow:hidden}.dialog-header{background:var(--panel);flex:none;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:19px 19px 15px;border-bottom:1px solid var(--line);z-index:1}.dialog-header h3{font-size:17px;letter-spacing:-.035em;margin:4px 0 0}.dialog-content{overflow-y:auto;overscroll-behavior:contain;flex:1;padding:18px 19px 20px}.dialog-item{border-radius:12px;border:1px solid var(--line);padding:13px;display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;background:var(--panel2)}.dialog-item span{display:block;font-weight:750;font-size:12px}.dialog-item small{color:var(--muted);display:block;font-size:10px;margin-top:4px}.dialog-item.active{border-color:var(--emerald);background:var(--soft)}.dialog-item .ico{color:var(--emerald)}.dialog-note{font-size:10px;line-height:1.6;color:var(--muted);margin:14px 0 0}.remote-frame{background:var(--panel2);border:1px solid var(--line);border-radius:18px;padding:15px;max-width:290px;margin:auto}.remote-switcher{display:flex;gap:8px;margin-bottom:15px}.remote-switcher button{flex:1;border-radius:9px;background:var(--panel);color:var(--muted);border:1px solid var(--line);padding:10px;font-size:11px;font-weight:750}.remote-switcher button.active{background:var(--soft);color:var(--greenText);border-color:var(--emerald)}.remote-top{display:flex;justify-content:space-between;margin-bottom:13px}.remote-top button,.remote-bottom button{height:37px;border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:11px;padding:0 13px;display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700}.dpad{width:181px;height:181px;margin:auto;display:grid;grid-template-areas:'. up .' 'left ok right' '. down .';grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);background:var(--panel);border-radius:50%;padding:6px;border:1px solid var(--line);box-shadow:0 6px 15px rgba(0,0,0,.04)}.dpad button{border:0;background:transparent;display:grid;place-items:center;color:var(--ink);border-radius:50%}.dpad button:hover{background:var(--soft)}.dpad .ok{grid-area:ok;background:var(--emerald);color:white;font-size:12px;font-weight:800;box-shadow:0 5px 13px var(--glow)}.dpad .up{grid-area:up}.dpad .down{grid-area:down}.dpad .left{grid-area:left}.dpad .right{grid-area:right}.remote-bottom{display:flex;justify-content:space-around;gap:9px;margin-top:16px}.remote-bottom button{flex:1;justify-content:center}.remote-num{display:flex;gap:6px;margin-top:10px}.remote-num button{flex:1;background:var(--panel);color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:9px}.toast{position:fixed;bottom:23px;left:50%;transform:translate(-50%,15px);max-width:min(440px,calc(100% - 30px));background:#182c24;color:#f1fff7;border:1px solid #426651;border-radius:12px;padding:12px 16px;font-size:12px;opacity:0;pointer-events:none;transition:opacity .22s,transform .22s;box-shadow:0 10px 35px #0002;z-index:80;text-align:center}.toast.show{opacity:1;transform:translate(-50%,0)}:host([data-dark]) .toast{background:#d8f8e5;color:#17382a}\n@media(min-width:1070px){.media-card{padding:23px}.sections{gap:12px}.samsung{padding:20px}.alexa{padding:18px}}@media(max-width:980px){.workspace{grid-template-columns:minmax(0,1fr) minmax(260px,.8fr);gap:16px}.container{width:min(1100px,calc(100% - 28px))}.preview-shell{padding:12px}.media-card{padding:15px}.vol-ring{height:78px;width:78px}.vol-inner strong{font-size:19px}.alexa-body{gap:7px}.track{gap:7px}.art{width:50px;height:50px}}@media(max-width:750px){.top{height:70px}.heading{padding:25px 0}.workspace{grid-template-columns:minmax(0,1fr)}.media-card{padding:19px}.preview-shell{padding:16px}.editor{max-width:750px}.settings-body{min-height:0}.vol-ring{height:90px;width:90px}.art{width:61px;height:61px}}@media(max-width:420px){.container{width:calc(100% - 22px)}.brand-text{font-size:11px}.brand-text span{font-size:10px}.mark{width:36px;height:36px;border-radius:12px}.status-chip{font-size:9px;padding:9px}.heading h1{font-size:27px}.heading p{font-size:12px}.preview-shell{padding:9px;border-radius:21px}.media-card{padding:13px;border-radius:18px}.media-head h2{font-size:18px}.media-head{margin-bottom:14px}.samsung{padding:13px}.tv-info h3{font-size:18px}.tv-content{min-height:102px}.screen{width:103px;height:63px}.action-pill{font-size:10px;padding:9px 10px}.fire{padding:11px}.fire-actions{gap:3px}.fire-actions .icon-btn{width:30px;height:30px}.alexa{padding:12px}.track{align-items:flex-start}.art{width:42px;height:42px}.track-title{font-size:11px}.track-sub{font-size:9px}.vol-group{gap:5px}.vol-ring{height:72px;width:72px;padding:7px}.vol-inner strong{font-size:18px}.vol-btn{width:23px;height:27px}.vol-btn .ico{width:14px;height:14px}.vol-inner span{font-size:7px}.script-button{font-size:10px;padding:9px}.amb-brightness{max-width:95px}.ambient-controls{gap:6px}.foot{font-size:9px}}@media(max-width:345px){.screen{display:none}.fire-logo{width:32px;height:32px}.vol-group{gap:3px}.vol-btn{width:20px}.vol-ring{height:64px;width:64px}.art{display:none}}\n@media(prefers-reduced-motion:reduce){*,*:before,*:after{scroll-behavior:auto!important;animation:none!important;transition:none!important}}\n\n:host{display:block;min-width:0;container-type:inline-size;color:var(--ink);font-family:Inter,-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,Arial,sans-serif;--ha-card-border-radius:23px}\nbutton,input{font-family:inherit}\nbutton[hidden],[hidden]{display:none!important}\n.media-card{box-sizing:border-box;width:100%;color:var(--ink)}\n.device.unavailable{opacity:.75}\n.device .state-unavailable{color:var(--muted)}\n.media-head.no-title .head-left,.media-head.no-title .head-icon{display:none}\n.media-head.no-title{justify-content:flex-end;margin-bottom:12px}\n.script-list:empty:after{content:\"Nessuno script configurato\";font-size:11px;color:var(--muted)}\n.action-pill:disabled,.icon-btn:disabled,.mini-play:disabled,.vol-btn:disabled,.switch:disabled{opacity:.4;cursor:not-allowed;transform:none}\n.ambient-controls input:disabled{opacity:.4;cursor:not-allowed}\n.media-card .device .f-meta,.media-card .track-title,.media-card .track-sub{overflow-wrap:anywhere}\n@container(max-width:520px){.media-card{padding:16px}.samsung{padding:15px}.screen{width:110px;height:70px}.alexa{padding:14px}.vol-ring{width:82px;height:82px}.vol-inner strong{font-size:20px}.vol-group{gap:5px}.track{gap:8px}.art{width:50px;height:50px}.fire{padding:12px}.media-head h2{font-size:19px}}\n@container(max-width:380px){.media-card{padding:13px;border-radius:19px}.tv-info h3{font-size:19px}.screen{width:85px;height:56px;border-width:4px}.alexa-body{gap:8px}.vol-ring{width:69px;height:69px;padding:7px}.vol-inner strong{font-size:17px}.vol-btn{width:24px;height:27px}.art{width:42px;height:42px}.track-title{font-size:11px}.tag{font-size:8px}.action-pill{padding:9px 10px}.fire-logo{width:33px;height:33px}.fire-actions .icon-btn{width:29px}}\n@container(max-width:315px){.screen{display:none}.alexa-body{flex-wrap:wrap}.vol-group{width:100%;justify-content:flex-end}.ambient-controls{width:100%;justify-content:space-between}.script-list{display:grid;grid-template-columns:1fr}}\n@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}\n\n/* Edera standard: native Home Assistant MDI icons, compact title punctuation. */\nha-icon.ico{display:inline-flex;align-items:center;justify-content:center;flex:none;width:19px;height:19px;--mdc-icon-size:19px;vertical-align:middle;fill:currentColor;stroke:none}\nha-icon.ico.sm{width:16px;height:16px;--mdc-icon-size:16px}\nha-icon.ico.lg{width:23px;height:23px;--mdc-icon-size:23px}\n.media-head h2 .dot{font-weight:800;color:var(--emerald);font-size:inherit;letter-spacing:0}\n/* Editor follows Camera Grid View Card standard layout and controls. */\n.editor{border:0;box-shadow:none;border-radius:0;background:transparent;overflow:visible}\n.editor .tabs{display:flex;gap:5px;padding:0 0 14px;background:transparent;border-bottom:1px solid var(--line);overflow-x:auto;position:static}\n.editor .tabs button{flex:none;border:0;background:none;color:var(--muted);border-radius:13px;padding:10px 13px;white-space:nowrap;font-weight:500;font-size:13px}\n.editor .tabs button.selected{color:var(--ink);background:var(--panel2);font-weight:650}\n.editor .editor-head{padding:24px 0 0;border:0;background:none}\n.editor .editor-head .eyebrow{display:none}\n.editor .editor-head .top-title{font-size:21px;font-weight:500;line-height:1.3;letter-spacing:-.025em}\n.editor .editor-head p{font-size:13px;color:var(--muted);line-height:1.5;margin:8px 0 16px}\n.editor .setting-group{padding:12px 0 20px;border-bottom:1px solid var(--line)}\n.editor .setting-group:last-child{border-bottom:0}\n.editor .group-title{font-size:13px;letter-spacing:0;font-weight:620;color:var(--ink);margin-bottom:8px}\n.editor .setting{display:flex;align-items:center;justify-content:space-between;gap:18px;border-bottom:1px solid var(--line);padding:15px 0}\n.editor .setting:last-child{border-bottom:0}\n.editor .setting label{min-width:0;flex:1;cursor:pointer}\n.editor .setting-name{font-weight:500;font-size:14px;line-height:1.4}\n.editor .setting-description{font-size:12px;line-height:1.5;color:var(--muted);margin-top:3px}\n.editor input[type=checkbox]{width:18px;height:18px;flex:none;accent-color:var(--emerald);cursor:pointer}\n.editor .field{margin:20px 0}\n.editor .field>label{display:block;font-size:14px;font-weight:500;margin-bottom:10px;color:var(--ink)}\n.editor .field input:not([type=checkbox]),.editor .field select{display:block;width:100%;min-height:49px;padding:12px 13px;background:var(--panel2);color:var(--ink);border:0;border-bottom:1px solid var(--line);border-radius:11px 11px 0 0;font-size:14px}\n.editor .field ha-selector{display:block;width:100%}\n.editor .settings-bottom{display:none}\n.editor .tip{margin:14px 0 0;padding:0;background:transparent;color:var(--muted);font-size:12px;line-height:1.5}\n.editor .green-btn,.editor .remove{border-radius:14px;font-size:13px;font-weight:500;padding:10px 14px}\n@media(max-width:480px){.editor .setting-group{padding:10px 0 18px}.editor .editor-head{padding:19px 0 0}}\n\n\n/* Authoritative Edera typography and surfaces copied from Weather Pulse Card's current CSS. */\n:host{font-family:var(--ha-font-family-body,Roboto,Arial,sans-serif);font-size:var(--ha-font-size-m,14px);--panel:#fafbf9;--panel2:#f0f2ef;--ink:#18221c;--muted:#56675c;--line:#e0e5df;--emerald:#0a7156;color:var(--ink)}\n:host([data-dark]){--panel:#101211;--panel2:#191c1a;--ink:#f5f7f4;--muted:#bbc5bd;--line:#2b302c;--emerald:#0e795d}\n.media-card{box-shadow:none;border-radius:26px;padding:18px;font-family:inherit;font-size:14px}\n.media-head{align-items:flex-start;gap:12px;margin:2px 4px 17px}\n.head-left{align-items:flex-start;gap:0;min-width:0}\n.head-icon{display:none}\n.media-head .micro{font-size:10px;letter-spacing:1.7px;font-weight:750;margin-bottom:7px;line-height:normal;text-transform:uppercase;color:var(--muted)}\n.media-head h2{font-size:25px!important;line-height:1.14;font-weight:780;letter-spacing:-.7px;margin:0;white-space:normal;overflow-wrap:anywhere;color:var(--ink)}\n.media-head h2 b.dot{color:var(--emerald);font-weight:800;font-size:inherit;letter-spacing:0}\n.media-head .subhead{font-size:12px;line-height:1.45;margin:7px 0 0;color:var(--muted)}\n/* Align labels, internal titles, controls and editor typography with the Weather/Camera family. */\n.device-id,.sec-name{font-size:12px;font-weight:650;letter-spacing:0}\n.tv-info h3{font-size:23px;font-weight:650;letter-spacing:-.7px}\n.f-main,.track-title{font-size:14px;font-weight:600;letter-spacing:0}\n.action-pill,.icon-btn,.script-list button{font-weight:600}\n.editor{font-family:inherit;font-size:14px}\n.editor .tabs{border-bottom:1px solid var(--line);padding:0 0 14px;background:transparent;gap:5px}\n.editor .tabs button{font-size:14px;font-weight:400;padding:10px 13px;border-radius:13px;flex:initial;color:var(--muted)}\n.editor .tabs button.selected{color:var(--ink);font-weight:650;background:var(--panel2)}\n.editor .editor-head{padding:24px 0 0;border:0;background:transparent}\n.editor .editor-head .top-title{font-size:21px;font-weight:500;line-height:1.3;letter-spacing:0}\n.editor .editor-head p{font-size:13px;line-height:1.5;color:var(--muted);margin:8px 0 16px}\n.editor .group-title{font-size:14px;letter-spacing:0;font-weight:600;color:var(--ink)}\n.editor .setting-name{font-size:14px;font-weight:500;line-height:1.4}\n.editor .field>label{font-size:14px;font-weight:500;color:var(--ink)}\n.editor .field input:not([type=checkbox]),.editor .field select{font-size:14px}\n.editor .setting-description,.editor .editor-small,.editor .tip{font-size:12px;line-height:1.5;color:var(--muted)}\n.editor .entity-setting{display:flex;gap:8px;align-items:center;min-width:0}\n.editor .entity-setting .entity-selector{flex:1;min-width:0}\n.editor .clear-entity{flex:none;display:grid;place-items:center;width:36px;height:36px;padding:0;border-radius:50%;border:1px solid var(--line);background:var(--panel2);color:var(--muted);cursor:pointer}\n.editor .clear-entity ha-icon{--mdc-icon-size:18px;width:18px;height:18px}\n.editor .clear-entity:hover{color:var(--ink);border-color:var(--emerald)}\n.editor .clear-entity:focus-visible{outline:2px solid var(--emerald);outline-offset:2px}\n.editor .clear-entity:disabled{opacity:.38;cursor:default}\n@container(max-width:520px){.media-head h2{font-size:23px!important}.media-card{padding:13px;border-radius:23px}}\n@container(max-width:310px){.media-head h2{font-size:21px!important}.media-head .micro{font-size:9px}}\n";
const ICONS = "";
const CARD_HTML = "<article class=\"media-card\" role=\"group\" aria-label=\"Media Fusion\">\n<header class=\"media-head\" id=\"cardHeader\"><div class=\"head-left\"><div><div class=\"micro\">MEDIA FUSION CARD</div><h2 id=\"viewTitle\">Media Center<b class=\"dot\">.</b></h2><p class=\"subhead\" id=\"viewSubtitle\">Controlli multimediali</p></div></div></header>\n<div class=\"sections\" id=\"sections\">\n<section class=\"device samsung\" data-section=\"samsung\" id=\"samsung\"><div class=\"samsung-upper\"><div class=\"device-id\"><ha-icon class=\"ico\" icon=\"mdi:television\" aria-hidden=\"true\"></ha-icon><span id=\"tvName\">TV</span></div><div class=\"status\" id=\"tvState\"><i></i><span>Accesa</span></div></div><div class=\"tv-content\"><div class=\"tv-info\"><h3 id=\"tvHero\" hidden></h3><p id=\"tvInput\">Sorgente · —</p></div><div aria-hidden=\"true\" class=\"screen\"><div class=\"scircle\"></div></div></div><div class=\"device-btn-row\"><button class=\"action-pill\" data-open=\"sources\"><ha-icon class=\"ico sm\" icon=\"mdi:format-list-bulleted\" aria-hidden=\"true\"></ha-icon> Sorgenti</button><button class=\"action-pill\" data-open=\"remote-samsung\"><ha-icon class=\"ico sm\" icon=\"mdi:remote-tv\" aria-hidden=\"true\"></ha-icon> Telecomando</button><button aria-label=\"Accendi o spegni TV\" class=\"action-pill power\" id=\"tvPower\" title=\"Accendi/spegni TV\"><ha-icon class=\"ico sm\" icon=\"mdi:power\" aria-hidden=\"true\"></ha-icon></button></div></section>\n<section class=\"device fire\" data-section=\"fire\"><div class=\"fire-id\"><div class=\"fire-logo\"><ha-icon id=\"fireIcon\" class=\"ico lg\" icon=\"mdi:television-play\" aria-hidden=\"true\"></ha-icon></div><div><div class=\"f-main\" id=\"fireName\">Lettore streaming</div><div class=\"f-meta\" id=\"fireMeta\">Da configurare</div></div></div><div class=\"fire-actions\"><button aria-label=\"App lettore streaming\" class=\"icon-btn\" data-open=\"fireapps\" title=\"Applicazioni e sorgenti\"><ha-icon class=\"ico sm\" icon=\"mdi:format-list-bulleted\" aria-hidden=\"true\"></ha-icon></button><button aria-label=\"Telecomando lettore streaming\" class=\"icon-btn\" data-open=\"remote-fire\" title=\"Telecomando lettore streaming\"><ha-icon class=\"ico sm\" icon=\"mdi:remote-tv\" aria-hidden=\"true\"></ha-icon></button><button aria-label=\"Accendi o spegni lettore streaming\" class=\"icon-btn\" id=\"firePower\" title=\"Accendi o spegni lettore streaming\"><ha-icon class=\"ico sm\" icon=\"mdi:power\" aria-hidden=\"true\"></ha-icon></button><button aria-label=\"Riproduci o pausa\" class=\"icon-btn primary\" id=\"firePlay\" title=\"Riproduci o pausa Fire TV\"><ha-icon class=\"ico sm\" icon=\"mdi:play\" aria-hidden=\"true\"></ha-icon></button></div></section>\n<section class=\"device alexa\" data-section=\"alexa\"><div class=\"section-top\"><div class=\"sec-name\"><ha-icon class=\"ico sm\" icon=\"mdi:volume-high\" aria-hidden=\"true\"></ha-icon><span id=\"audioName\">Home Theater</span></div><span class=\"tag\">Da configurare</span></div><div class=\"alexa-body\"><div class=\"track\"><div aria-hidden=\"true\" class=\"art\"><ha-icon class=\"ico lg\" icon=\"mdi:auto-fix\" aria-hidden=\"true\"></ha-icon></div><div class=\"tracktext\"><div class=\"track-title\">Riproduzione</div><div class=\"track-sub\" id=\"trackMeta\">Controlli multimediali</div><div class=\"playbar\"><button aria-label=\"Precedente\" class=\"mini-play\" data-sim=\"Alexa · traccia precedente\"><ha-icon class=\"ico sm\" icon=\"mdi:skip-previous\" aria-hidden=\"true\"></ha-icon></button><button aria-label=\"Riproduzione Alexa\" class=\"mini-play active\" id=\"alexaPlay\"><ha-icon class=\"ico sm\" icon=\"mdi:play\" aria-hidden=\"true\"></ha-icon></button><button aria-label=\"Successiva\" class=\"mini-play\" data-sim=\"Alexa · traccia successiva\"><ha-icon class=\"ico sm\" icon=\"mdi:skip-next\" aria-hidden=\"true\"></ha-icon></button></div></div></div><div class=\"vol-group\"><button aria-label=\"Abbassa volume Alexa\" class=\"vol-btn\" id=\"volMinus\"><ha-icon class=\"ico\" icon=\"mdi:minus\" aria-hidden=\"true\"></ha-icon></button><div class=\"vol-ring\" id=\"volRing\"><div class=\"vol-inner\"><strong id=\"volNumber\">—</strong><span>VOLUME</span></div></div><button aria-label=\"Alza volume Alexa\" class=\"vol-btn\" id=\"volPlus\"><ha-icon class=\"ico\" icon=\"mdi:plus\" aria-hidden=\"true\"></ha-icon></button></div></div><div class=\"volume-line\"><button aria-label=\"Mute Alexa\" class=\"mini-play\" id=\"volMute\" title=\"Attiva o disattiva mute Alexa\"><ha-icon class=\"ico sm\" icon=\"mdi:volume-high\" aria-hidden=\"true\"></ha-icon></button><input aria-label=\"Volume Alexa\" id=\"volume\" max=\"100\" min=\"0\" type=\"range\" value=\"0\"/><output id=\"volText\">—</output></div></section>\n<section class=\"device ambient\" data-section=\"ambilight\"><div class=\"ambient-left\"><div class=\"amb-logo\"><ha-icon id=\"lightIcon\" class=\"ico\" icon=\"mdi:led-strip-variant\" aria-hidden=\"true\"></ha-icon></div><div><div class=\"f-main\" id=\"lightName\">Luci LED TV</div><div class=\"f-meta\" id=\"ambientLabel\">Da configurare</div></div></div><div class=\"ambient-controls\"><div class=\"amb-brightness\" id=\"brightnessWrap\"><ha-icon class=\"ico sm\" icon=\"mdi:white-balance-sunny\" aria-hidden=\"true\"></ha-icon><input aria-label=\"Luminosità luci LED TV\" id=\"brightness\" max=\"100\" min=\"1\" type=\"range\" value=\"68\"/></div><button aria-checked=\"true\" aria-label=\"Accendi o spegni luci LED TV\" class=\"switch on\" id=\"ambientSwitch\" role=\"switch\"></button></div></section>\n<section class=\"device scripts\" data-section=\"scripts\"><div class=\"section-top\" style=\"margin-bottom:10px\"><div class=\"sec-name\"><ha-icon class=\"ico sm\" icon=\"mdi:lightning-bolt-outline\" aria-hidden=\"true\"></ha-icon><span>Script e azioni</span></div><span class=\"tiny\" id=\"scriptCount\">0 azioni</span></div><div class=\"script-list\" id=\"scriptButtons\"></div></section>\n</div></article>";
class MediaFusionCard extends HTMLElement {
  static getConfigElement() { return document.createElement(EDITOR_TAG); }
  static getStubConfig() { return {...DEFAULT, scripts:[]}; }
  constructor() {
    super(); this.attachShadow({mode:"open"}); this._config=normalize({});
    this._busy=new Set(); this._editingVolume=false; this._modalMode=null;
  }
  setConfig(config) {
    if (config?.type && config.type!==`custom:${CARD_TAG}`) throw Error("Tipo card non valido");
    this._config=normalize(config);
    for (const [field,domain] of [["tv_on_script","script"],["samsung_entity","media_player"],["fire_entity","media_player"],["alexa_entity","media_player"],["ambilight_entity","light"],["samsung_remote","remote"],["fire_remote","remote"],["tv_off_script","script"]]) {
      const v=this._config[field]; if (v && !entityValid(v,domain)) throw Error(`Entità non valida: ${field}`);
    }
    for(const s of this._config.scripts) if(s.entity_id && !entityValid(s.entity_id,"script")) throw Error("Entità script non valida");
    if(this.isConnected) this._render();
  }
  set hass(hass){this._hass=hass;if(this.isConnected&&this._rendered)this._update();}
  connectedCallback(){this._render();}
  disconnectedCallback(){this._destroyPortal();}
  getCardSize(){return 7;}
  getGridOptions(){return {columns:12,min_columns:6,rows:8,min_rows:3};}
  _q(id){return this.shadowRoot.getElementById(id);}
  _state(field){const id=this._config[field];return id && this._hass?.states ? this._hass.states[id] : undefined;}
  _stateById(id){return this._hass?.states?.[id];}
  _setText(id,v){const el=this._q(id);if(el)el.textContent=v;}
  _render(){
    this.shadowRoot.innerHTML=`<style>${BASE_CSS}</style>${ICONS}${CARD_HTML}<div id="feedback" aria-live="polite" class="feedback" hidden></div>`;
    this._rendered=true;
    this.shadowRoot.addEventListener("click",this._onClickBound??=(event=>this._onClick(event)));
    this.shadowRoot.addEventListener("input",this._onInputBound??=(event=>this._onInput(event)));
    this.shadowRoot.addEventListener("change",this._onChangeBound??=(event=>this._onChange(event)));
    this._scriptsHash=null; this._ensurePortal(); this._update();
  }
  _applyTheme(){
    let dark = this._config.theme==="dark";
    if(this._config.theme==="auto"){
      dark = typeof this._hass?.themes?.darkMode==="boolean" ? this._hass.themes.darkMode :
        (typeof window.matchMedia==="function" ? window.matchMedia("(prefers-color-scheme: dark)").matches : false);
    }
    this.toggleAttribute("data-dark",!!dark);
    this._portal?.toggleAttribute("data-dark",!!dark);
  }
  _update(){
    if(!this._rendered)return;
    this._applyTheme();
    const c=this._config;
    const head=this._q("cardHeader");
    head.classList.toggle("no-title",!c.show_title&&!c.show_subtitle);
    this._q("viewTitle").hidden=!c.show_title;
    this._q("viewTitle").innerHTML=`${escapeHtml(String(c.title||"Media Center").trim().replace(/\.+$/, ""))}<b class="dot">.</b>`;
    this._q("viewSubtitle").hidden=!c.show_subtitle;
    this._setText("viewSubtitle",c.subtitle);
    const visibility={samsung:"show_samsung",fire:"show_fire",alexa:"show_alexa",ambilight:"show_ambilight",scripts:"show_scripts"};
    for(const [section,prop] of Object.entries(visibility)) {
      const el=this.shadowRoot.querySelector(`[data-section="${section}"]`);
      if(el)el.hidden=!c[prop];
    }
    this._updateSamsung(); this._updateFire(); this._updateAlexa();this._updateAmbient();this._updateScripts();
  }
  _updateSamsung(){
    const s=this._state("samsung_entity"),available=validState(s),on=isOn(s);
    const node=this._q("samsung");node.classList.toggle("tv-off",!on);node.classList.toggle("unavailable",!available);
    const state=this._q("tvState");state.classList.toggle("off",!on);
    state.querySelector("span").textContent=!this._config.samsung_entity?"Da configurare":!available?"Non disponibile":on?"Accesa":"Spenta";
    this._setText("tvName",shownName(this._config.tv_name,s,"TV"));
    const heading=this._q("tvHero");heading.textContent=this._config.tv_headline;heading.hidden=!this._config.tv_headline;
    this._setText("tvInput",!available?"Sorgente · —":`Sorgente · ${short(s?.attributes?.source,"—")}`);
    this._q("tvPower").disabled=!available || this._busy.has("tvPower");
    const buttons=this.shadowRoot.querySelectorAll('[data-open="sources"],[data-open="remote-samsung"]');
    buttons.forEach(el=>el.disabled=!available);
  }
  _updateFire(){
    const s=this._state("fire_entity"),available=validState(s);
    this._setText("fireName",shownName(this._config.fire_name,s,"Lettore streaming"));
    this._q("fireIcon").setAttribute("icon",stateIcon(s,"mdi:television-play"));
    this._setText("fireMeta", !this._config.fire_entity?"Da configurare":!available?"Non disponibile":`Streaming · ${short(s.attributes?.app_name,s.state==="playing"?"In riproduzione":s.state)}`);
    const power=this._q("firePower");power.disabled=!available||this._busy.has("firePower");power.setAttribute("aria-label",isOn(s)?"Spegni lettore streaming":"Accendi lettore streaming");
    const play=this._q("firePlay");play.disabled=!available;play.innerHTML=ico(s?.state==="playing"?"pause":"play");
    this.shadowRoot.querySelectorAll('[data-open="fireapps"],[data-open="remote-fire"]').forEach(b=>b.disabled=!available);
  }
  _updateAlexa(){
    const s=this._state("alexa_entity"),available=validState(s);
    const n=this.shadowRoot.querySelector(".alexa .tag");
    this._setText("audioName",shownName(this._config.audio_name,s,"Home Theater"));
    if(n)n.textContent=!this._config.alexa_entity?"Da configurare":!available?"Non disponibile":"Media player";
    const title=this.shadowRoot.querySelector(".track-title");
    if(title)title.textContent=short(s?.attributes?.media_title,"Riproduzione");
    this._setText("trackMeta",!available?"Non disponibile":short(s?.attributes?.media_artist,s?.state==="playing"?"Riproduzione attiva":"Controlli multimediali"));
    const hasVol=available&&Number.isFinite(Number(s?.attributes?.volume_level))&&s?.attributes?.volume_level!==null&&s?.attributes?.volume_level!==undefined;
    const value=hasVol?Math.round(clamp(Number(s.attributes.volume_level)*100,0,100)):0;
    if(this._pendingVolume && (!hasVol || Math.abs(value-this._pendingVolume.value)<=1 || Date.now()>this._pendingVolume.until))this._pendingVolume=null;
    const presented=this._pendingVolume?.value ?? value;
    const muted=s?.attributes?.is_volume_muted===true;
    if(!this._editingVolume){this._q("volume").value=String(presented);this._updateVolVisual(hasVol?presented:null,muted);} 
    this._q("volMinus").disabled=!hasVol;
    this._q("volPlus").disabled=!hasVol;
    this._q("volMute").disabled=!available||typeof s?.attributes?.is_volume_muted!=="boolean";
    this._q("volume").disabled=!hasVol;
    this._q("alexaPlay").disabled=!available;
    this._q("alexaPlay").innerHTML=ico(s?.state==="playing"?"pause":"play");
    this.shadowRoot.querySelectorAll(".playbar .mini-play").forEach(b=>b.disabled=!available);
  }
  _updateVolVisual(value,muted=false){
    const v=value===null?null:Math.round(clamp(value,0,100));
    const fill=v===null?0:v;
    this._q("volRing").style.setProperty("--angle",`${muted?0:fill*3.6}deg`);
    this._q("volume").style.setProperty("--fill",`${fill}%`);
    this._setText("volNumber",v===null?"—":`${v}%`);
    this._setText("volText",v===null?"—":`${v}%`);
    this._q("volMute").style.color=muted?"var(--emerald)":"";
    this._q("volMute").setAttribute("aria-pressed",String(muted));
  }
  _updateAmbient(){
    const s=this._state("ambilight_entity"),available=validState(s),on=available&&s.state==="on";
    this._setText("lightName",shownName(this._config.light_name,s,"Luci LED TV"));
    this._q("lightIcon").setAttribute("icon",stateIcon(s,"mdi:led-strip-variant"));
    const btn=this._q("ambientSwitch");btn.classList.toggle("on",on);
    btn.setAttribute("aria-checked",String(on)); btn.disabled=!available;
    this._setText("ambientLabel",!this._config.ambilight_entity?"Da configurare":!available?"Non disponibile":on?"Illuminazione · Accesa":"Illuminazione · Spenta");
    const bright=this._q("brightness");
    const canBright=available&&on&&typeof s.attributes?.brightness==="number";
    bright.disabled=!canBright;
    if(!this._editingBrightness){
      const v=canBright?Math.round(s.attributes.brightness/255*100):0;
      bright.value=String(v);bright.style.setProperty("--fill",`${v}%`);
    }
  }
  _updateScripts(){
    const scripts=this._config.scripts.filter(s=>entityValid(s.entity_id,"script"));
    this._setText("scriptCount",scripts.length===1?"1 azione":`${scripts.length} azioni`);
    const hash=JSON.stringify(scripts);
    if(hash===this._scriptsHash)return;
    this._scriptsHash=hash;
    this._q("scriptButtons").innerHTML=scripts.map((s,i)=>`<button type="button" class="script-button" data-script="${i}" aria-label="Avvia ${escapeHtml(short(s.name,s.entity_id))}">${ico(i===0?"power":i===1?"sun":"spark")}<span>${escapeHtml(short(s.name,s.entity_id))}</span></button>`).join("");
  }
  _onClick(event){
    const el=event.target.closest("button");if(!el||el.disabled)return;
    if(el.dataset.open){
      const type=el.dataset.open;
      if(type==="sources")this._sources("samsung");
      else if(type==="fireapps")this._sources("fire");
      else if(type==="remote-samsung")this._remote("samsung");
      else if(type==="remote-fire")this._remote("fire");
      return;
    }
    const id=el.id;
    if(id==="tvPower"){
      const s=this._state("samsung_entity");
      if(isOn(s)) {
        if(entityValid(this._config.tv_off_script,"script"))this._send("script","turn_on",this._config.tv_off_script,{},"tvPower");
        else if(supports(s,MEDIA_TURN_OFF))this._send("media_player","turn_off",this._config.samsung_entity,{},"tvPower");
        else this._toast("Configura uno script di spegnimento TV in Azioni.");
      } else {
        if(entityValid(this._config.tv_on_script,"script"))this._send("script","turn_on",this._config.tv_on_script,{},"tvPower");
        else if(supports(s,MEDIA_TURN_ON))this._send("media_player","turn_on",this._config.samsung_entity,{},"tvPower");
        else this._toast("La TV non supporta l’accensione diretta. Configura uno script di accensione TV in Azioni.");
      }
    } else if(id==="firePower"){
      const s=this._state("fire_entity"),on=isOn(s),feat=on?MEDIA_TURN_OFF:MEDIA_TURN_ON;
      if(supports(s,feat))this._send("media_player",on?"turn_off":"turn_on",this._config.fire_entity,{},"firePower");
      else this._toast("Il dispositivo non dichiara il supporto a questo comando di alimentazione.");
    } else if(id==="firePlay") this._togglePlay("fire_entity");
    else if(id==="alexaPlay") this._togglePlay("alexa_entity");
    else if(id==="volMinus"||id==="volPlus"){
      const s=this._state("alexa_entity");const v=s?.attributes?.volume_level;
      if(typeof v==="number")this._setVolume((this._pendingVolume?.value??Math.round(v*100))+(id==="volPlus"?5:-5));
    }else if(id==="volMute"){
      const s=this._state("alexa_entity");this._send("media_player","volume_mute",this._config.alexa_entity,{is_volume_muted:!s?.attributes?.is_volume_muted},"mute");
    }else if(id==="ambientSwitch"){
      const s=this._state("ambilight_entity");this._send("light",s?.state==="on"?"turn_off":"turn_on",this._config.ambilight_entity,{},"light");
    }else if(el.dataset.script!==undefined){
      const arr=this._config.scripts.filter(s=>entityValid(s.entity_id,"script"));const s=arr[Number(el.dataset.script)];
      if(s)this._send("script","turn_on",s.entity_id,{},`script:${s.entity_id}`);
    }else if(el.dataset.sim){this._toast("Azione non disponibile in questa configurazione");}
  }
  _onInput(event){
    const target=event.target;
    if(target.id==="volume") {this._editingVolume=true;this._updateVolVisual(Number(target.value),false);}
    else if(target.id==="brightness") {this._editingBrightness=true;target.style.setProperty("--fill",`${target.value}%`);}
  }
  _onChange(event){
    const target=event.target;
    if(target.id==="volume") {this._editingVolume=false;this._setVolume(Number(target.value));}
    else if(target.id==="brightness"){
      this._editingBrightness=false;
      this._send("light","turn_on",this._config.ambilight_entity,{brightness_pct:Math.round(clamp(target.value,1,100))},"light-brightness");
    }
  }
  _setVolume(pct){
    const n=Math.round(clamp(pct,0,100));
    this._pendingVolume={value:n,until:Date.now()+3500};
    this._updateVolVisual(n,false);
    this._send("media_player","volume_set",this._config.alexa_entity,{volume_level:n/100},"alexa-volume");
  }
  _togglePlay(field){
    const s=this._state(field); if(!validState(s))return;
    this._send("media_player",s.state==="playing"?"media_pause":"media_play",this._config[field],{},`play:${field}`);
  }
  async _send(domain,action,entityId,data={},key="",targetDomain=domain){
    if(!this._hass?.callService|| !entityValid(entityId,targetDomain)){this._toast("Configura un'entità valida nell'editor");return;}
    if(key && this._busy.has(key))return;
    if(key)this._busy.add(key);
    try{
      await this._hass.callService(domain,action,{entity_id:entityId,...data});
    }catch(err){if(key==="alexa-volume")this._pendingVolume=null;console.warn("Media Fusion Card: errore servizio",domain,action,err);this._toast(`Comando non riuscito: ${String(err?.message||"verifica il dispositivo").slice(0,95)}`);}
    finally{if(key)this._busy.delete(key);this._update();}
  }
  _toast(msg){
    const el=this._q("feedback");if(!el)return;
    el.hidden=false;el.textContent=msg;
    clearTimeout(this._toastTimeout);
    this._toastTimeout=setTimeout(()=>{el.hidden=true;},4600);
  }
  _ensurePortal(){
    if(this._portal)return;
    this._portal=document.createElement("div");this._portal.className="edera-media-portal";
    this._portal.style.cssText="position:fixed;inset:0;z-index:9999;pointer-events:none";
    const root=this._portal.attachShadow({mode:"open"});
    root.innerHTML=`<style>${BASE_CSS} :host{pointer-events:none;font-family:var(--ha-font-family-body,Roboto,Arial,sans-serif)}.overlay.open{pointer-events:auto}.dialog-header{background:var(--panel);position:sticky;top:0;z-index:3}</style>${ICONS}<div class="overlay" id="overlay" role="presentation"><div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialogTitle"><div class="dialog-header"><div><div class="micro" id="dialogEyebrow">MEDIA FUSION</div><h3 id="dialogTitle">Dettagli</h3></div><button class="circle-btn" id="closeDialog" aria-label="Chiudi finestra">${ico("close")}</button></div><div class="dialog-content" id="dialogContent"></div></div></div>`;
    root.addEventListener("click",event=>this._onDialogClick(event));
    document.addEventListener("keydown",this._keyListener??=(e=>this._onKey(e)));
    document.body.appendChild(this._portal);
  }
  _destroyPortal(){
    this._portal?.remove();this._portal=null;
    if(this._keyListener)document.removeEventListener("keydown",this._keyListener);
    clearTimeout(this._toastTimeout);
    this._rendered=false;
  }
  _p(id){return this._portal?.shadowRoot?.getElementById(id);}
  _open(title,eyebrow,html){
    this._ensurePortal();this._returnFocus=this.shadowRoot.activeElement;
    this._p("dialogTitle").textContent=title;
    this._p("dialogEyebrow").textContent=eyebrow;
    this._p("dialogContent").innerHTML=html;
    this._p("overlay").classList.add("open");
    this._portal.style.pointerEvents="auto";
    this._p("closeDialog").focus();
  }
  _close(){
    if(!this._p("overlay")?.classList.contains("open"))return;
    this._p("overlay").classList.remove("open");this._portal.style.pointerEvents="none";
    if(this._returnFocus?.isConnected)this._returnFocus.focus();
  }
  _onKey(e){
    if(!this._p("overlay")?.classList.contains("open"))return;
    if(e.key==="Escape"){e.preventDefault();this._close();return;}
    if(e.key==="Tab"){
      const b=Array.from(this._portal.shadowRoot.querySelectorAll(".overlay button:not([disabled])"));
      if(!b.length)return;
      const active=this._portal.shadowRoot.activeElement;
      if(e.shiftKey&&active===b[0]){e.preventDefault();b[b.length-1].focus();}
      else if(!e.shiftKey&&active===b[b.length-1]){e.preventDefault();b[0].focus();}
    }
  }
  _sourceItem(kind,name,selected){
    return `<button class="dialog-item ${selected?"active":""}" data-source-kind="${kind}" data-source="${escapeHtml(name)}" style="width:100%;text-align:left;cursor:pointer"><div><span>${escapeHtml(name)}</span><small>${kind==="samsung"?"Sorgente TV":"Applicazione / sorgente"}</small></div>${ico(selected?"check":"chevron")}</button>`;
  }
  _sources(kind){
    const s=this._state(kind==="samsung"?"samsung_entity":"fire_entity");
    const list=Array.isArray(s?.attributes?.source_list)?s.attributes.source_list.filter(x=>typeof x==="string"):[];
    const html=list.length?list.map(src=>this._sourceItem(kind,src,src===s.attributes?.source)).join(""):
      `<p class="dialog-note">Nessuna sorgente disponibile nell'attributo source_list di questa entità. La card non inventa applicazioni o ingressi.</p>`;
    this._open(kind==="samsung"?"Sorgenti TV":"Sorgenti streaming", "SORGENTI DISPONIBILI",html);
  }
  _remoteId(kind){return this._config[kind==="samsung"?"samsung_remote":"fire_remote"];}
  _remote(kind){this._modalMode=kind;this._open("Telecomando","CONTROLLO REMOTO",this._remoteHtml());}
  _remoteHtml(){
    const kind=this._modalMode,ks=KEYSETS[kind],id=this._remoteId(kind);
    const remoteAvailable=entityValid(id,"remote") && validState(this._stateById(id));
    const adbAvailable=kind==="fire" && validState(this._state("fire_entity"));
    const canUse=remoteAvailable||adbAvailable;
    const disabled=canUse?"":"disabled";
    const press=(label,key,ic)=>`<button ${disabled} data-remote-key="${escapeHtml(key)}">${ico(ic)} ${label}</button>`;
    return `<div class="remote-switcher"><button data-remmode="samsung" class="${kind==="samsung"?"active":""}">TV</button><button data-remmode="fire" class="${kind==="fire"?"active":""}">Lettore streaming</button></div>
      <div class="remote-frame"><div class="remote-top">${press("Home",ks.home,"home")}${press("Power",ks.power,"power")}</div>
      <div class="dpad">
      <button ${disabled} class="up" data-remote-key="${ks.up}" aria-label="Su">${ico("up","lg")}</button>
      <button ${disabled} class="left" data-remote-key="${ks.left}" aria-label="Sinistra">${ico("left","lg")}</button>
      <button ${disabled} class="ok" data-remote-key="${ks.ok}">OK</button>
      <button ${disabled} class="right" data-remote-key="${ks.right}" aria-label="Destra">${ico("right","lg")}</button>
      <button ${disabled} class="down" data-remote-key="${ks.down}" aria-label="Giù">${ico("down","lg")}</button>
      </div><div class="remote-bottom">${press("Indietro",ks.back,"back")}${press("Mute",ks.mute,"mute")}</div>
      <div class="remote-bottom">${press("Volume −",ks.voldown,"minus")}${press("Volume +",ks.volup,"plus")}</div></div>
      <p class="dialog-note">${canUse?(remoteAvailable?"I comandi sono inviati all’entità remote selezionata.":"I comandi streaming utilizzano Android Debug Bridge tramite il media_player selezionato.")+" Il supporto dipende dal dispositivo.":`Per attivare i tasti seleziona nell'editor l'entità remote del ${kind==="samsung"?"televisore":"lettore streaming"}. Il telecomando rimane visibile ma non invia comandi finché non è configurato.`}</p>`;
  }
  _onDialogClick(event){
    if(event.target===this._p("overlay")||event.target.closest("#closeDialog")){this._close();return;}
    const el=event.target.closest("button");if(!el||el.disabled)return;
    if(el.dataset.remmode){this._modalMode=el.dataset.remmode;this._p("dialogContent").innerHTML=this._remoteHtml();return;}
    if(el.dataset.remoteKey){
      const rid=this._remoteId(this._modalMode);
      const allowed=Object.values(KEYSETS[this._modalMode]);
      if(!allowed.includes(el.dataset.remoteKey))return;
      if(entityValid(rid,"remote") && validState(this._stateById(rid)))this._send("remote","send_command",rid,{command:el.dataset.remoteKey},`remote:${this._modalMode}:${el.dataset.remoteKey}`);
      else if(this._modalMode==="fire")this._send("androidtv","adb_command",this._config.fire_entity,{command:el.dataset.remoteKey},`adb:${el.dataset.remoteKey}`,"media_player");
      return;
    }
    if(el.dataset.source){
      const kind=el.dataset.sourceKind;
      const s=this._state(kind==="samsung"?"samsung_entity":"fire_entity");
      if(!Array.isArray(s?.attributes?.source_list) || !s.attributes.source_list.includes(el.dataset.source))return;
      this._send("media_player","select_source",this._config[kind==="samsung"?"samsung_entity":"fire_entity"],{source:el.dataset.source},`source:${kind}`);
      this._close();
    }
  }
}
class MediaFusionCardEditor extends HTMLElement {
  constructor(){super();this.attachShadow({mode:"open"});this._tab="sections";this._config=normalize({});}
  setConfig(config){
    this._config=normalize(config);
    this._config.type = config?.type||`custom:${CARD_TAG}`;
    this._applyTheme();
    if(this.isConnected)this._render();
  }
  set hass(hass){this._hass=hass;this._applyTheme();this.shadowRoot.querySelectorAll("ha-selector").forEach(el=>{el.hass=hass;});}
  connectedCallback(){this._render();}
  _applyTheme(){
    const dark=this._config.theme==="dark" || (this._config.theme==="auto" && (this._hass?.themes?.darkMode ?? (typeof window.matchMedia==="function" && window.matchMedia("(prefers-color-scheme: dark)").matches)));
    this.toggleAttribute("data-dark",!!dark);
  }
  _change(patch){
    this._config={...this._config,...patch};
    this._applyTheme();
    this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:{...this._config,scripts:this._config.scripts.map(s=>({...s}))}},bubbles:true,composed:true}));
  }
  _set(name,value){this._change({[name]:value});}
  _render(){
    const c=this._config;
    const sw=(field,name,desc)=>`<div class="setting"><label for="ed-${field}"><div class="setting-name">${name}</div><div class="setting-description">${desc}</div></label><input type="checkbox" id="ed-${field}" data-check="${field}" ${c[field]?"checked":""}/></div>`;
    const field=(name,label,placeholder="")=>`<div class="field"><label for="ed-${name}">${label}</label><input id="ed-${name}" data-text="${name}" type="text" value="${escapeHtml(c[name])}" placeholder="${escapeHtml(placeholder)}" /></div>`;
    const clearButton=(type,id,hasValue,label)=>`<button type="button" class="clear-entity" data-clear-${type}="${id}" aria-label="Rimuovi ${label}" title="Rimuovi ${label}" ${hasValue?"":"disabled"}>${ico("close")}</button>`;
    const ent=(name,label,domain)=>`<div class="field"><label>${label}</label><div class="entity-setting"><div class="entity-selector" data-entity-field="${name}" data-domain="${domain}"></div>${clearButton("entity",name,!!c[name],label)}</div></div>`;
    const tab=(n,label)=>`<button type="button" class="${this._tab===n?"selected":""}" data-tab="${n}">${label}</button>`;
    this.shadowRoot.innerHTML=`<style>${BASE_CSS}
      :host{display:block;color:var(--ink);font-family:var(--ha-font-family-body,Roboto,Arial,sans-serif)}
      .editor{width:100%}.entity-selector{min-height:37px}
      .field{margin-top:12px}.field>label{display:block;font-weight:650;font-size:11px}
      ha-selector{display:block;width:100%}
      .script-row{padding:11px 0;border-bottom:1px solid var(--line)}.script-row input{width:100%;box-sizing:border-box}.script-row button.remove{margin-top:7px}
      .settings-body{display:block}
      .setting-group{border-bottom:1px solid var(--line)}
      .setting-group:last-child{border:0}.editor-small{font-size:11px}
      .setting-name{font-size:14px}.setting-description{font-size:12px}
      .editor-actions{display:flex;justify-content:flex-start}
      .settings-bottom{display:none}
      @media(max-width:480px){.setting-group{padding:10px 0 18px}}
      </style><section class="editor">
      <div class="tabs" role="tablist" aria-label="Categorie editor">${tab("sections","Sezioni")}${tab("appearance","Aspetto")}${tab("actions","Azioni")}</div>
      <header class="editor-head"><div class="top-title">${this._tab==="sections"?"Sezioni disponibili":this._tab==="appearance"?"Aspetto Edera":"Dispositivi e azioni"}</div><p>${this._tab==="sections"?"Attiva soltanto i componenti che desideri visualizzare.":this._tab==="appearance"?"Personalizza titolo, sottotitolo e tema della card.":"Seleziona le entità Home Assistant e gli script da eseguire."}</p></header>
      ${this._tab==="sections" ? `
        <div class="settings-body">
        <div class="setting-group"><div class="group-title">Mostra nella dashboard</div>${GROUPS.map(([k,n,d])=>sw(k,n,d)).join("")}</div>
        <div class="tip">Le sezioni nascoste conservano la configurazione delle entità.</div></div>
      `:this._tab==="appearance"?`
        <div class="settings-body"><div class="setting-group"><div class="group-title">Titolo e sottotitolo</div>
          ${sw("show_title","Mostra titolo","Nascondi il titolo principale")}
          ${sw("show_subtitle","Mostra sottotitolo","Può essere nascosto separatamente")}
          ${field("title","Titolo personalizzato","Media Center")}
          ${field("subtitle","Sottotitolo personalizzato","Area multimediale")}
          </div><div class="setting-group"><div class="group-title">Nomi e testi (facoltativi)</div>
          ${field("tv_headline","Testo principale TV (vuoto per nasconderlo)","Vuoto = nascosto")}
          ${field("tv_name","Nome TV (vuoto = nome entità)","TV")}
          ${field("fire_name","Nome lettore streaming (vuoto = nome entità)","Lettore streaming")}
          ${field("audio_name","Nome Home Theater (vuoto = nome entità)","Home Theater")}
          ${field("light_name","Nome luci LED TV (vuoto = nome entità)","Luci LED TV")}
          </div><div class="setting-group"><div class="group-title">Tema</div><div class="field"><label for="ed-theme">Tema</label><select id="ed-theme" data-theme><option value="auto" ${c.theme==="auto"?"selected":""}>Automatico (Home Assistant)</option><option value="light" ${c.theme==="light"?"selected":""}>Light</option><option value="dark" ${c.theme==="dark"?"selected":""}>Graphite Dark</option></select></div></div></div>
      `:`
        <div class="settings-body"><div class="setting-group"><div class="group-title">Entità Home Assistant</div>
          ${ent("samsung_entity","TV · Media player","media_player")}
          ${ent("tv_on_script","TV · Script accensione (facoltativo)","script")}
          ${ent("samsung_remote","TV · Remote (opzionale)","remote")}
          ${ent("tv_off_script","TV · Script spegnimento (facoltativo)","script")}
          ${ent("fire_entity","Lettore streaming · Media player","media_player")}
          ${ent("fire_remote","Lettore streaming · Remote (facoltativo)","remote")}
          ${ent("alexa_entity","Home Theater · Media player","media_player")}
          ${ent("ambilight_entity","Luci LED TV · Luce","light")}
          </div>
          <div class="setting-group"><div class="group-title">Script personalizzati</div>
          ${c.scripts.map((s,i)=>`<div class="script-row" data-script-edit="${i}">
            <div class="field"><label>Etichetta script ${i+1}</label><input data-script-name="${i}" value="${escapeHtml(s.name)}" placeholder="Nome pulsante" /></div>
            <div class="field"><label>Entità script</label><div class="entity-setting"><div class="entity-selector" data-script-selector="${i}"></div>${clearButton("script",i,!!s.entity_id,"entità dello script "+(i+1))}</div></div>
            <button class="remove" data-remove="${i}" type="button">Rimuovi script</button>
          </div>`).join("")}
          <div class="editor-actions"><button type="button" class="green-btn" data-add-script>+ Aggiungi script</button></div>
          <p class="editor-small">Le azioni eseguono soltanto gli script configurati nella tua istanza.</p>
          </div></div>
      `}
      <footer class="settings-bottom">Nessun servizio esterno. Le modifiche si applicano alla configurazione della dashboard.</footer>
      </section>`;
    this.shadowRoot.querySelectorAll(".entity-selector").forEach(container=>{
      const key=container.dataset.entityField;
      const index=container.dataset.scriptSelector;
      const domain=index!==undefined?"script":container.dataset.domain;
      const el=document.createElement("ha-selector");
      el.hass=this._hass;
      el.selector={entity:{domain}};
      el.required=false;
      el.value=index!==undefined?(c.scripts[Number(index)]?.entity_id||""):(c[key]||"");
      el.addEventListener("value-changed",e=>{
        const value=e.detail?.value||"";
        if(index!==undefined){
          const arr=this._config.scripts.map(s=>({...s}));
          if(arr[Number(index)]) {arr[Number(index)].entity_id=value;this._set("scripts",arr);}
        }else this._set(key,value);
        this._render();
      });
      container.appendChild(el);
    });
    this.shadowRoot.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>this._onButton(b)));
    this.shadowRoot.querySelectorAll("[data-check]").forEach(el=>el.addEventListener("change",()=>this._set(el.dataset.check,el.checked)));
    this.shadowRoot.querySelectorAll("[data-text]").forEach(el=>el.addEventListener("change",()=>this._set(el.dataset.text,el.value)));
    this.shadowRoot.querySelectorAll("[data-theme]").forEach(el=>el.addEventListener("change",()=>this._set("theme",el.value)));
    this.shadowRoot.querySelectorAll("[data-script-name]").forEach(el=>el.addEventListener("change",()=>{
      const arr=this._config.scripts.map(s=>({...s}));if(arr[Number(el.dataset.scriptName)]) {arr[Number(el.dataset.scriptName)].name=el.value.slice(0,60);this._set("scripts",arr);}
    }));
  }
  _onButton(btn){
    if(btn.hasAttribute("data-clear-entity")){
      const key=btn.dataset.clearEntity;
      if(!Object.hasOwn(DEFAULT,key) || !["samsung_entity","samsung_remote","tv_on_script","tv_off_script","fire_entity","fire_remote","alexa_entity","ambilight_entity"].includes(key))return;
      this._set(key,"");this._render();return;
    }
    if(btn.hasAttribute("data-clear-script")){
      const i=Number(btn.dataset.clearScript);
      if(!Number.isInteger(i)||i<0||i>=this._config.scripts.length)return;
      const scripts=this._config.scripts.map((entry,j)=>j===i?{...entry,entity_id:""}:{...entry});
      this._set("scripts",scripts);this._render();return;
    }
    if(btn.dataset.tab){this._tab=btn.dataset.tab;this._render();return;}
    if(btn.dataset.toggle){const k=btn.dataset.toggle;this._set(k,!this._config[k]);btn.classList.toggle("on",this._config[k]);btn.setAttribute("aria-checked",String(this._config[k]));return;}
    if(btn.dataset.preset){
      const mode=btn.dataset.preset;
      const change={};for(const [k] of GROUPS)change[k]=mode==="all"||(mode==="tv"&&k==="show_samsung")||(mode==="alexa"&&k==="show_alexa");
      this._change(change);this._render();return;
    }
    if(btn.hasAttribute("data-add-script")){
      if(this._config.scripts.length>=30)return;
      this._change({scripts:[...this._config.scripts,{name:"",entity_id:""}]});this._render();return;
    }
    if(btn.dataset.remove!==undefined){
      const i=Number(btn.dataset.remove);
      this._change({scripts:this._config.scripts.filter((_,idx)=>idx!==i)});this._render();
    }
  }
}
if(!customElements.get(CARD_TAG))customElements.define(CARD_TAG,MediaFusionCard);
if(!customElements.get(EDITOR_TAG))customElements.define(EDITOR_TAG,MediaFusionCardEditor);
window.customCards=window.customCards||[];
if(!window.customCards.some(c=>c.type===CARD_TAG))window.customCards.push({
  type:CARD_TAG,name:"Media Fusion Card",description:"Controlli media, volume, telecomandi, luci e script in una card modulare",preview:true
});
})();