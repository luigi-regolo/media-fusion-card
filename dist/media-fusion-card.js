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
  show_title:true, show_eyebrow:true, show_subtitle:false, artwork_source:"alexa", compact_mode:false, fire_adb_power:false, theme:"auto",
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
const ICON_MAP = Object.freeze({"tv":"television","power":"power","volume":"volume-high","mute":"volume-off","remote":"remote-tv","chevron":"chevron-right","arrow":"arrow-right","list":"format-list-bulleted","fire":"fire","play":"play","pause":"pause","prev":"skip-previous","next":"skip-next","minus":"minus","plus":"plus","sun":"white-balance-sunny","moon":"weather-night","glow":"lightbulb-on-outline","zap":"lightning-bolt-outline","spark":"auto-fix","home":"home","back":"arrow-left","up":"chevron-up","down":"chevron-down","left":"chevron-left","right":"chevron-right","close":"close","check":"check","settings":"cog-outline","info":"information-outline","loading":"loading"});
const ico = (id,cls="sm") => `<ha-icon class="ico ${cls}" icon="mdi:${ICON_MAP[id]||"information-outline"}" aria-hidden="true"></ha-icon>`;
const MEDIA_PREVIOUS_TRACK = 16, MEDIA_NEXT_TRACK = 32, MEDIA_TURN_ON = 128, MEDIA_TURN_OFF = 256, MEDIA_SELECT_SOURCE = 2048;
const supports = (state,feature) => Number.isInteger(state?.attributes?.supported_features) && (state.attributes.supported_features & feature)===feature;
const shownName = (custom,state,fallback) => short(custom,short(state?.attributes?.friendly_name,fallback)).slice(0,70);
const stateIcon = (state,fallback) => /^mdi:[a-z0-9-]+$/.test(state?.attributes?.icon||"") ? state.attributes.icon : fallback;
const normalize = config => {
  const merged = {...DEFAULT,...(config||{})};
  if (!["auto","light","dark"].includes(merged.theme)) merged.theme="auto";
  if (!["alexa","fire","none"].includes(merged.artwork_source)) merged.artwork_source="alexa";
  for(const key of ["tv_headline","tv_name","fire_name","audio_name","light_name"]) merged[key]=typeof merged[key]==="string" ? merged[key].trim().slice(0,70) : "";
  merged.scripts = Array.isArray(merged.scripts) ? merged.scripts.slice(0,30).map(s=>({name:String(s?.name??"").slice(0,60),entity_id:String(s?.entity_id??"")})) : [];
  return merged;
};
const validState = s => !!s && !["unavailable","unknown"].includes(s.state);
const isOn = s => !!s && !["off","standby","unavailable","unknown"].includes(s.state);
const short = (s, fallback) => (typeof s === "string" && s.trim() ? s.trim() : fallback);

const BASE_CSS = "\n:host{color-scheme:light;--bg:#edf1ed;--page:#f7f9f7;--panel:#fff;--panel2:#f5f7f5;--ink:#1c2923;--muted:#79847e;--line:#e5eae5;--emerald:#0a7156;--strong:#138252;--soft:#e9f7ef;--glow:rgba(20,161,99,.18);--shadow:0 18px 45px rgba(17,42,30,.055);--ring:#e7eee9;--switch:#cbd4cd;--greenText:#116b45}\n:host([data-dark]){color-scheme:dark;--bg:#151a19;--page:#1d2321;--panel:#252e2b;--panel2:#303a35;--ink:#f0f5f1;--muted:#a2afa8;--line:#3c4841;--emerald:#39c68d;--strong:#59dba4;--soft:#234538;--glow:rgba(47,195,131,.17);--shadow:0 17px 40px rgba(0,0,0,.17);--ring:#3b4740;--switch:#58665d;--greenText:#83ecb7}\n*{box-sizing:border-box}[hidden]{display:none!important}html{font-family:var(--ha-font-family-body,Roboto,Arial,sans-serif)}body{margin:0;color:var(--ink);background:radial-gradient(ellipse at 10% 0%,var(--glow),transparent 35%),var(--bg);min-height:100vh;transition:background .25s,color .25s}button,input{font:inherit}button{cursor:pointer}button:focus-visible,input:focus-visible{outline:3px solid rgba(48,191,125,.55);outline-offset:2px}button:disabled{opacity:.45;cursor:not-allowed}.ico{width:19px;height:19px;--mdc-icon-size:19px;display:inline-flex;align-items:center;justify-content:center;vertical-align:middle;flex:none}.ico.sm{width:16px;height:16px;--mdc-icon-size:16px}.ico.lg{width:24px;height:24px;--mdc-icon-size:24px}.container{width:min(1190px,calc(100% - 40px));margin:0 auto;padding-bottom:48px}\n.top{height:88px;display:flex;align-items:center;justify-content:space-between;gap:18px;border-bottom:1px solid rgba(120,142,128,.14)}.brand{display:flex;align-items:center;gap:12px}.mark{width:42px;height:42px;border-radius:15px;display:grid;place-items:center;background:var(--emerald);color:white;box-shadow:0 8px 20px var(--glow)}.brand-text{font-size:13px;font-weight:780;letter-spacing:.13em}.brand-text span{display:block;font-size:11px;margin-top:4px;color:var(--muted);letter-spacing:.04em;font-weight:500}.top-right{display:flex;align-items:center;gap:10px}.status-chip{font-size:11px;font-weight:700;border:1px solid var(--line);border-radius:30px;padding:10px 13px;color:var(--muted);white-space:nowrap}.status-chip::before{content:'';display:inline-block;background:#e6ad43;width:6px;height:6px;border-radius:50%;margin-right:8px}.mode-btn{width:39px;height:39px;border-radius:12px;border:1px solid var(--line);background:var(--panel);color:var(--ink);display:grid;place-items:center}\n.heading{padding:38px 0 26px}.eyebrow{color:var(--emerald);font-weight:800;letter-spacing:.16em;font-size:10px}.heading h1{font-size:clamp(25px,3.4vw,41px);letter-spacing:-.055em;font-weight:720;line-height:1.17;margin:12px 0 10px}.heading p{font-size:14px;max-width:660px;line-height:1.7;color:var(--muted);margin:0}.workspace{display:grid;grid-template-columns:minmax(0,1.58fr) minmax(300px,.9fr);gap:25px;align-items:start}.preview-label{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:13px}.overline{font-size:10px;letter-spacing:.16em;font-weight:790;color:var(--muted)}.tiny{font-size:11px;color:var(--muted)}.preview-shell{border:1px solid var(--line);border-radius:26px;background:var(--page);padding:19px;box-shadow:var(--shadow)}\n.media-card{border-radius:23px;background:var(--panel);padding:21px;border:1px solid var(--line);box-shadow:0 13px 32px rgba(0,0,0,.035);min-width:0}.media-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:20px}.head-left{display:flex;align-items:center;gap:12px;min-width:0}.head-icon{width:43px;height:43px;display:grid;place-items:center;border-radius:15px;background:var(--soft);color:var(--emerald);flex:none}.micro{font-size:10px;letter-spacing:1.7px;font-weight:750;color:var(--muted);margin-bottom:7px;text-transform:uppercase}.media-head h2{margin:0;font-size:25px;font-weight:780;letter-spacing:-.7px;line-height:1.14;white-space:normal;overflow-wrap:anywhere}.media-head h2 .dot{color:var(--emerald)}.subhead{font-size:11px;color:var(--muted);margin:6px 0 0}.circle-btn{width:37px;height:37px;border-radius:12px;background:var(--panel2);color:var(--ink);border:1px solid var(--line);display:grid;place-items:center;flex:none;transition:transform .18s}.circle-btn:hover,.action-pill:hover,.icon-btn:hover{transform:translateY(-1px)}\n.sections{display:grid;gap:11px}.device{border-radius:17px;border:1px solid var(--line);overflow:hidden;min-width:0}.samsung{padding:18px;color:#f8faf8;background:radial-gradient(circle at 75% 42%,rgba(52,185,140,.21),transparent 34%),linear-gradient(125deg,#202e2b,#17211e 78%);border-color:#263a31;position:relative}.samsung-upper{display:flex;align-items:center;justify-content:space-between;gap:8px}.device-id{display:flex;align-items:center;gap:9px;font-size:12px;font-weight:760;letter-spacing:.02em}.device-id .ico{opacity:.8}.status{display:inline-flex;align-items:center;gap:6px;font-size:10px;color:#b0c2b8;white-space:nowrap}.status i{width:6px;height:6px;background:#4fe3a2;display:block;border-radius:50%}.status.off i{background:#86928c}.tv-content{display:flex;align-items:center;justify-content:space-between;min-height:114px;gap:14px}.tv-info{min-width:0}.tv-info h3{font-size:23px;letter-spacing:-.05em;margin:0 0 8px;font-weight:660}.tv-info p{font-size:11px;color:#b5c7bd;margin:0}.screen{position:relative;width:146px;height:82px;border:5px solid #3d4d45;border-bottom-width:9px;border-radius:9px;background:radial-gradient(ellipse at 75% 25%,#4bb68e,transparent 45%),linear-gradient(155deg,#426e68,#18352b 55%,#121d24);transform:perspective(440px) rotateY(-11deg);box-shadow:0 10px 35px rgba(0,0,0,.25),0 0 20px rgba(58,195,123,.08);flex:none}.screen:after{content:'';position:absolute;bottom:-16px;width:42px;height:7px;background:#4a5b50;left:calc(50% - 21px);clip-path:polygon(40% 0,60% 0,70% 100%,30% 100%)}.screen .scircle{position:absolute;width:67px;height:67px;right:8px;top:3px;border-radius:50%;border:1px solid rgba(221,251,232,.3)}.device-btn-row{display:flex;gap:8px;flex-wrap:wrap}.action-pill{display:inline-flex;align-items:center;justify-content:center;gap:7px;border-radius:10px;padding:10px 12px;font-size:11px;font-weight:690;transition:.18s;white-space:nowrap;min-width:0}.samsung .action-pill{color:#ecf7ef;border:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.08)}.action-pill.main{background:var(--emerald);color:#fff;border-color:transparent}.samsung .power{margin-left:auto;padding:9px 11px}.samsung.tv-off .tv-info h3{opacity:.5}.samsung.tv-off .screen{filter:grayscale(1);opacity:.35}.samsung.tv-off .status i{background:#899a90}\n.fire{padding:14px 16px;background:var(--panel2);display:flex;align-items:center;justify-content:space-between;gap:11px}.fire-id{display:flex;gap:11px;align-items:center;min-width:0}.fire-logo{width:39px;height:39px;border-radius:13px;display:grid;place-items:center;color:#f4f6f3;background:linear-gradient(135deg,#ef9b42,#a34d2b)}.f-main{font-size:12px;font-weight:760}.f-meta{font-size:10px;color:var(--muted);margin-top:3px}.fire-actions{display:flex;gap:5px;align-items:center}.icon-btn{width:34px;height:34px;display:grid;place-items:center;color:var(--ink);background:var(--panel);border:1px solid var(--line);border-radius:10px;transition:transform .18s}.fire-actions .icon-btn{width:33px;height:33px}.fire-actions .primary{color:var(--emerald)}\n.alexa{padding:17px;background:var(--panel2)}.section-top{display:flex;justify-content:space-between;align-items:center;gap:7px;margin-bottom:13px}.sec-name{font-size:11px;font-weight:800;letter-spacing:.02em;display:flex;gap:8px;align-items:center}.sec-name .ico{color:var(--emerald)}.tag{color:var(--greenText);font-size:9px;background:var(--soft);border-radius:40px;padding:5px 8px;white-space:nowrap}.alexa-body{display:flex;align-items:center;justify-content:space-between;gap:15px}.track{display:flex;gap:10px;align-items:center;min-width:0}.art{width:61px;height:61px;border-radius:13px;background:radial-gradient(circle at 66% 33%,#87d6bb 0 10%,transparent 11%),radial-gradient(circle at 70% 70%,#1d6e61 0 24%,transparent 25%),linear-gradient(140deg,#2c645d,#102831);display:grid;place-items:center;flex:none;box-shadow:0 8px 19px rgba(3,28,20,.13);color:#c5eadb}.tracktext{min-width:0}.track-title{font-size:12px;font-weight:770;line-height:1.35}.track-sub{font-size:10px;color:var(--muted);margin:5px 0 8px;line-height:1.25}.playbar{display:flex;gap:7px}.mini-play{border:0;background:none;padding:3px;color:var(--ink)}.mini-play.active{color:var(--emerald)}.vol-group{display:flex;align-items:center;gap:8px;flex:none}.vol-btn{width:29px;height:29px;border:1px solid var(--line);background:var(--panel);color:var(--ink);display:grid;place-items:center;border-radius:9px}.vol-ring{--angle:151deg;width:92px;height:92px;border-radius:50%;background:conic-gradient(var(--emerald) 0deg var(--angle),var(--ring) var(--angle) 360deg);padding:9px;box-shadow:0 7px 22px var(--glow);position:relative}.vol-inner{background:var(--panel);width:100%;height:100%;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center}.vol-inner strong{font-size:22px;line-height:1;letter-spacing:-.06em;font-variant-numeric:tabular-nums}.vol-inner span{font-size:8px;color:var(--muted);margin-top:5px;font-weight:670;letter-spacing:.09em}.volume-line{display:flex;gap:10px;align-items:center;margin-top:13px}.volume-line .ico{color:var(--muted)}input[type=range]{appearance:none;-webkit-appearance:none;flex:1;height:5px;border-radius:20px;background:linear-gradient(to right,var(--emerald) 0%,var(--emerald) var(--fill,42%),var(--ring) var(--fill,42%),var(--ring) 100%);min-width:0;cursor:pointer}input[type=range]::-webkit-slider-thumb{appearance:none;width:15px;height:15px;border:3px solid var(--panel);background:var(--emerald);border-radius:50%;box-shadow:0 0 0 1px rgba(20,130,85,.26)}input[type=range]::-moz-range-thumb{width:10px;height:10px;border:3px solid var(--panel);background:var(--emerald);border-radius:50%;box-shadow:0 0 0 1px rgba(20,130,85,.26)}.volume-line output{width:30px;text-align:right;font-size:10px;color:var(--muted);font-variant-numeric:tabular-nums}\n.ambient{padding:13px 15px;background:linear-gradient(100deg,rgba(141,105,196,.095),rgba(29,180,124,.075));display:flex;align-items:center;justify-content:space-between;gap:9px;flex-wrap:wrap}.ambient-left{display:flex;align-items:center;gap:10px}.amb-logo{height:34px;width:34px;display:grid;place-items:center;border-radius:11px;background:linear-gradient(135deg,#9875c8,#51bba1);color:white}.amb-brightness{display:flex;gap:8px;align-items:center;flex:1;min-width:95px;max-width:115px}.switch{width:40px;height:24px;border-radius:20px;padding:3px;border:0;background:var(--switch);display:inline-flex;align-items:center;justify-content:flex-start;flex:none;transition:background .2s}.switch:after{content:'';width:18px;height:18px;box-shadow:0 2px 5px rgba(0,0,0,.12);background:white;display:block;border-radius:50%;transition:transform .2s}.switch.on{background:var(--emerald)}.switch.on:after{transform:translateX(16px)}.ambient-controls{display:flex;gap:11px;align-items:center}.ambient .f-meta{font-size:10px}\n.scripts{padding:14px 15px}.script-list{display:flex;flex-wrap:wrap;gap:7px}.script-button{border-radius:10px;border:1px solid var(--line);color:var(--ink);background:var(--panel);display:flex;align-items:center;gap:7px;padding:10px 12px;font-size:11px;font-weight:690}.script-button .ico{color:var(--emerald)}.script-button:hover{border-color:var(--emerald)}.details{background:var(--soft);border-radius:11px;color:var(--greenText);width:100%;border:0;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;font-size:11px;font-weight:750;margin-top:14px}.details .ico{width:15px;height:15px}.foot{display:flex;justify-content:space-between;font-size:10px;color:var(--muted);padding:12px 3px 0;gap:10px}.foot b{color:var(--emerald);font-weight:680}\n.editor{border-radius:22px;background:var(--panel);border:1px solid var(--line);box-shadow:var(--shadow);overflow:hidden}.editor-head{padding:19px 20px 15px;border-bottom:1px solid var(--line)}.editor-head .top-title{font-size:16px;font-weight:760;letter-spacing:-.035em;margin:6px 0 4px}.editor-head p{font-size:11px;color:var(--muted);margin:0;line-height:1.5}.tabs{display:flex;padding:10px;gap:4px;background:var(--panel2);border-bottom:1px solid var(--line)}.tabs button{flex:1;border:0;background:none;color:var(--muted);font-weight:720;font-size:11px;padding:10px 4px;border-radius:10px}.tabs button.selected{color:var(--greenText);background:var(--panel);box-shadow:0 1px 4px rgba(0,0,0,.045)}.settings-body{padding:17px 19px 19px;min-height:410px}.setting-group{margin-bottom:21px}.setting-group:last-child{margin-bottom:0}.group-title{font-size:10px;letter-spacing:.14em;color:var(--muted);font-weight:780;margin-bottom:10px}.setting{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:11px 0;border-bottom:1px solid var(--line)}.setting:last-child{border-bottom:0}.setting .setting-name{font-size:12px;font-weight:680}.setting .setting-description{font-size:10px;line-height:1.4;color:var(--muted);margin-top:4px;max-width:240px}.setting .switch{transform:scale(.9);transform-origin:right}.preset-row{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.preset{background:var(--panel2);border:1px solid var(--line);border-radius:11px;padding:11px 5px;color:var(--ink);font-size:10px;font-weight:720}.preset.active{border-color:var(--emerald);background:var(--soft);color:var(--greenText)}.entity-group{padding-top:5px}.field{margin:12px 0 0}.field label{display:block;font-size:10px;font-weight:720;color:var(--muted);margin-bottom:7px}.field input{width:100%;border:1px solid var(--line);background:var(--panel2);color:var(--ink);border-radius:10px;padding:11px 12px;font-size:11px;outline:none}.field input:focus{border-color:var(--emerald)}.field input::placeholder{color:var(--muted);opacity:.78}.tip{font-size:10px;color:var(--muted);background:var(--panel2);padding:12px;border-radius:11px;line-height:1.6;margin-top:14px}.tip .ico{color:var(--emerald)}.settings-bottom{border-top:1px solid var(--line);padding:14px 19px;font-size:10px;color:var(--muted);line-height:1.5}.editor-actions{display:flex;gap:7px;align-items:center;margin-top:10px}.green-btn{border:0;background:var(--emerald);color:white;border-radius:10px;font-size:11px;padding:10px 13px;font-weight:720}.lite-btn{border:1px solid var(--line);background:var(--panel2);color:var(--ink);font-size:11px;padding:10px 13px;border-radius:10px}.script-edit-row{display:flex;gap:6px;margin-top:8px}.script-edit-row input{flex:1;min-width:0;border-radius:9px;background:var(--panel2);border:1px solid var(--line);padding:10px;font-size:11px;color:var(--ink)}.script-edit-row button{border:1px solid var(--line);background:var(--panel2);color:var(--muted);border-radius:9px;padding:0 10px}.editor-small{font-size:10px;color:var(--muted);line-height:1.55;margin:10px 0}.hidden{display:none!important}\n/* Dialog */\n.overlay{position:fixed;z-index:50;inset:0;padding:24px;display:none;align-items:center;justify-content:center;background:rgba(9,20,16,.60);backdrop-filter:blur(4px)}.overlay.open{display:flex}.dialog{width:min(430px,100%);max-height:min(690px,calc(100dvh - 48px));display:flex;flex-direction:column;background:var(--panel);border-radius:22px;border:1px solid var(--line);box-shadow:0 30px 70px rgba(0,0,0,.25);overflow:hidden}.dialog-header{background:var(--panel);flex:none;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:19px 19px 15px;border-bottom:1px solid var(--line);z-index:1}.dialog-header h3{font-size:17px;letter-spacing:-.035em;margin:4px 0 0}.dialog-content{overflow-y:auto;overscroll-behavior:contain;flex:1;padding:18px 19px 20px}.dialog-item{border-radius:12px;border:1px solid var(--line);padding:13px;display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;background:var(--panel2)}.dialog-item span{display:block;font-weight:750;font-size:12px}.dialog-item small{color:var(--muted);display:block;font-size:10px;margin-top:4px}.dialog-item.active{border-color:var(--emerald);background:var(--soft)}.dialog-item .ico{color:var(--emerald)}.dialog-note{font-size:10px;line-height:1.6;color:var(--muted);margin:14px 0 0}.remote-frame{background:var(--panel2);border:1px solid var(--line);border-radius:18px;padding:15px;max-width:290px;margin:auto}.remote-switcher{display:flex;gap:8px;margin-bottom:15px}.remote-switcher button{flex:1;border-radius:9px;background:var(--panel);color:var(--muted);border:1px solid var(--line);padding:10px;font-size:11px;font-weight:750}.remote-switcher button.active{background:var(--soft);color:var(--greenText);border-color:var(--emerald)}.remote-top{display:flex;justify-content:space-between;margin-bottom:13px}.remote-top button,.remote-bottom button{height:37px;border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:11px;padding:0 13px;display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700}.dpad{width:181px;height:181px;margin:auto;display:grid;grid-template-areas:'. up .' 'left ok right' '. down .';grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);background:var(--panel);border-radius:50%;padding:6px;border:1px solid var(--line);box-shadow:0 6px 15px rgba(0,0,0,.04)}.dpad button{border:0;background:transparent;display:grid;place-items:center;color:var(--ink);border-radius:50%}.dpad button:hover{background:var(--soft)}.dpad .ok{grid-area:ok;background:var(--emerald);color:white;font-size:12px;font-weight:800;box-shadow:0 5px 13px var(--glow)}.dpad .up{grid-area:up}.dpad .down{grid-area:down}.dpad .left{grid-area:left}.dpad .right{grid-area:right}.remote-bottom{display:flex;justify-content:space-around;gap:9px;margin-top:16px}.remote-bottom button{flex:1;justify-content:center}.remote-num{display:flex;gap:6px;margin-top:10px}.remote-num button{flex:1;background:var(--panel);color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:9px}.toast{position:fixed;bottom:23px;left:50%;transform:translate(-50%,15px);max-width:min(440px,calc(100% - 30px));background:#182c24;color:#f1fff7;border:1px solid #426651;border-radius:12px;padding:12px 16px;font-size:12px;opacity:0;pointer-events:none;transition:opacity .22s,transform .22s;box-shadow:0 10px 35px #0002;z-index:80;text-align:center}.toast.show{opacity:1;transform:translate(-50%,0)}:host([data-dark]) .toast{background:#d8f8e5;color:#17382a}\n@media(min-width:1070px){.media-card{padding:23px}.sections{gap:12px}.samsung{padding:20px}.alexa{padding:18px}}@media(max-width:980px){.workspace{grid-template-columns:minmax(0,1fr) minmax(260px,.8fr);gap:16px}.container{width:min(1100px,calc(100% - 28px))}.preview-shell{padding:12px}.media-card{padding:15px}.vol-ring{height:78px;width:78px}.vol-inner strong{font-size:19px}.alexa-body{gap:7px}.track{gap:7px}.art{width:50px;height:50px}}@media(max-width:750px){.top{height:70px}.heading{padding:25px 0}.workspace{grid-template-columns:minmax(0,1fr)}.media-card{padding:19px}.preview-shell{padding:16px}.editor{max-width:750px}.settings-body{min-height:0}.vol-ring{height:90px;width:90px}.art{width:61px;height:61px}}@media(max-width:420px){.container{width:calc(100% - 22px)}.brand-text{font-size:11px}.brand-text span{font-size:10px}.mark{width:36px;height:36px;border-radius:12px}.status-chip{font-size:9px;padding:9px}.heading h1{font-size:27px}.heading p{font-size:12px}.preview-shell{padding:9px;border-radius:21px}.media-card{padding:13px;border-radius:18px}.media-head h2{font-size:18px}.media-head{margin-bottom:14px}.samsung{padding:13px}.tv-info h3{font-size:18px}.tv-content{min-height:102px}.screen{width:103px;height:63px}.action-pill{font-size:10px;padding:9px 10px}.fire{padding:11px}.fire-actions{gap:3px}.fire-actions .icon-btn{width:30px;height:30px}.alexa{padding:12px}.track{align-items:flex-start}.art{width:42px;height:42px}.track-title{font-size:11px}.track-sub{font-size:9px}.vol-group{gap:5px}.vol-ring{height:72px;width:72px;padding:7px}.vol-inner strong{font-size:18px}.vol-btn{width:23px;height:27px}.vol-btn .ico{width:14px;height:14px}.vol-inner span{font-size:7px}.script-button{font-size:10px;padding:9px}.amb-brightness{max-width:95px}.ambient-controls{gap:6px}.foot{font-size:9px}}@media(max-width:345px){.screen{display:none}.fire-logo{width:32px;height:32px}.vol-group{gap:3px}.vol-btn{width:20px}.vol-ring{height:64px;width:64px}.art{display:none}}\n@media(prefers-reduced-motion:reduce){*,*:before,*:after{scroll-behavior:auto!important;animation:none!important;transition:none!important}}\n\n:host{display:block;min-width:0;container-type:inline-size;color:var(--ink);font-family:Inter,-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,Arial,sans-serif;--ha-card-border-radius:23px}\nbutton,input{font-family:inherit}\nbutton[hidden],[hidden]{display:none!important}\n.media-card{box-sizing:border-box;width:100%;color:var(--ink)}\n.device.unavailable{opacity:.75}\n.device .state-unavailable{color:var(--muted)}\n.media-head.no-title .head-left,.media-head.no-title .head-icon{display:none}\n.media-head.no-title{justify-content:flex-end;margin-bottom:12px}\n.script-list:empty:after{content:\"Nessuno script configurato\";font-size:11px;color:var(--muted)}\n.action-pill:disabled,.icon-btn:disabled,.mini-play:disabled,.vol-btn:disabled,.switch:disabled{opacity:.4;cursor:not-allowed;transform:none}\n.ambient-controls input:disabled{opacity:.4;cursor:not-allowed}\n.media-card .device .f-meta,.media-card .track-title,.media-card .track-sub{overflow-wrap:anywhere}\n@container(max-width:520px){.media-card{padding:16px}.samsung{padding:15px}.screen{width:110px;height:70px}.alexa{padding:14px}.vol-ring{width:82px;height:82px}.vol-inner strong{font-size:20px}.vol-group{gap:5px}.track{gap:8px}.art{width:50px;height:50px}.fire{padding:12px}.media-head h2{font-size:19px}}\n@container(max-width:380px){.media-card{padding:13px;border-radius:19px}.tv-info h3{font-size:19px}.screen{width:85px;height:56px;border-width:4px}.alexa-body{gap:8px}.vol-ring{width:69px;height:69px;padding:7px}.vol-inner strong{font-size:17px}.vol-btn{width:24px;height:27px}.art{width:42px;height:42px}.track-title{font-size:11px}.tag{font-size:8px}.action-pill{padding:9px 10px}.fire-logo{width:33px;height:33px}.fire-actions .icon-btn{width:29px}}\n@container(max-width:315px){.screen{display:none}.alexa-body{flex-wrap:wrap}.vol-group{width:100%;justify-content:flex-end}.ambient-controls{width:100%;justify-content:space-between}.script-list{display:grid;grid-template-columns:1fr}}\n@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}\n\n/* Edera standard: native Home Assistant MDI icons, compact title punctuation. */\nha-icon.ico{display:inline-flex;align-items:center;justify-content:center;flex:none;width:19px;height:19px;--mdc-icon-size:19px;vertical-align:middle;fill:currentColor;stroke:none}\nha-icon.ico.sm{width:16px;height:16px;--mdc-icon-size:16px}\nha-icon.ico.lg{width:23px;height:23px;--mdc-icon-size:23px}\n.media-head h2 .dot{font-weight:800;color:var(--emerald);font-size:inherit;letter-spacing:0}\n/* Editor follows Camera Grid View Card standard layout and controls. */\n.editor{border:0;box-shadow:none;border-radius:0;background:transparent;overflow:visible}\n.editor .tabs{display:flex;gap:5px;padding:0 0 14px;background:transparent;border-bottom:1px solid var(--line);overflow-x:auto;position:static}\n.editor .tabs button{flex:none;border:0;background:none;color:var(--muted);border-radius:13px;padding:10px 13px;white-space:nowrap;font-weight:500;font-size:13px}\n.editor .tabs button.selected{color:var(--ink);background:var(--panel2);font-weight:650}\n.editor .editor-head{padding:24px 0 0;border:0;background:none}\n.editor .editor-head .eyebrow{display:none}\n.editor .editor-head .top-title{font-size:21px;font-weight:500;line-height:1.3;letter-spacing:-.025em}\n.editor .editor-head p{font-size:13px;color:var(--muted);line-height:1.5;margin:8px 0 16px}\n.editor .setting-group{padding:12px 0 20px;border-bottom:1px solid var(--line)}\n.editor .setting-group:last-child{border-bottom:0}\n.editor .group-title{font-size:13px;letter-spacing:0;font-weight:620;color:var(--ink);margin-bottom:8px}\n.editor .setting{display:flex;align-items:center;justify-content:space-between;gap:18px;border-bottom:1px solid var(--line);padding:15px 0}\n.editor .setting:last-child{border-bottom:0}\n.editor .setting label{min-width:0;flex:1;cursor:pointer}\n.editor .setting-name{font-weight:500;font-size:14px;line-height:1.4}\n.editor .setting-description{font-size:12px;line-height:1.5;color:var(--muted);margin-top:3px}\n.editor input[type=checkbox]{width:18px;height:18px;flex:none;accent-color:var(--emerald);cursor:pointer}\n.editor .field{margin:20px 0}\n.editor .field>label{display:block;font-size:14px;font-weight:500;margin-bottom:10px;color:var(--ink)}\n.editor .field input:not([type=checkbox]),.editor .field select{display:block;width:100%;min-height:49px;padding:12px 13px;background:var(--panel2);color:var(--ink);border:0;border-bottom:1px solid var(--line);border-radius:11px 11px 0 0;font-size:14px}\n.editor .field ha-selector{display:block;width:100%}\n.editor .settings-bottom{display:none}\n.editor .tip{margin:14px 0 0;padding:0;background:transparent;color:var(--muted);font-size:12px;line-height:1.5}\n.editor .green-btn,.editor .remove{border-radius:14px;font-size:13px;font-weight:500;padding:10px 14px}\n@media(max-width:480px){.editor .setting-group{padding:10px 0 18px}.editor .editor-head{padding:19px 0 0}}\n\n\n/* Authoritative Edera typography and surfaces copied from Weather Pulse Card's current CSS. */\n:host{font-family:var(--ha-font-family-body,Roboto,Arial,sans-serif);font-size:var(--ha-font-size-m,14px);--panel:#fafbf9;--panel2:#f0f2ef;--ink:#18221c;--muted:#56675c;--line:#e0e5df;--emerald:#0a7156;color:var(--ink)}\n:host([data-dark]){--panel:#101211;--panel2:#191c1a;--ink:#f5f7f4;--muted:#bbc5bd;--line:#2b302c;--emerald:#0e795d}\n.media-card{box-shadow:none;border-radius:26px;padding:18px;font-family:inherit;font-size:14px}\n.media-head{align-items:flex-start;gap:12px;margin:2px 4px 17px}\n.head-left{align-items:flex-start;gap:0;min-width:0}\n.head-icon{display:none}\n.media-head .micro{font-size:10px;letter-spacing:1.7px;font-weight:750;margin-bottom:7px;line-height:normal;text-transform:uppercase;color:var(--muted)}\n.media-head h2{font-size:25px!important;line-height:1.14;font-weight:780;letter-spacing:-.7px;margin:0;white-space:normal;overflow-wrap:anywhere;color:var(--ink)}\n.media-head h2 b.dot{color:var(--emerald);font-weight:800;font-size:inherit;letter-spacing:0}\n.media-head .subhead{font-size:12px;line-height:1.45;margin:7px 0 0;color:var(--muted)}\n/* Align labels, internal titles, controls and editor typography with the Weather/Camera family. */\n.device-id,.sec-name{font-size:12px;font-weight:650;letter-spacing:0}\n.tv-info h3{font-size:23px;font-weight:650;letter-spacing:-.7px}\n.f-main,.track-title{font-size:14px;font-weight:600;letter-spacing:0}\n.action-pill,.icon-btn,.script-list button{font-weight:600}\n.editor{font-family:inherit;font-size:14px}\n.editor .tabs{border-bottom:1px solid var(--line);padding:0 0 14px;background:transparent;gap:5px}\n.editor .tabs button{font-size:14px;font-weight:400;padding:10px 13px;border-radius:13px;flex:initial;color:var(--muted)}\n.editor .tabs button.selected{color:var(--ink);font-weight:650;background:var(--panel2)}\n.editor .editor-head{padding:24px 0 0;border:0;background:transparent}\n.editor .editor-head .top-title{font-size:21px;font-weight:500;line-height:1.3;letter-spacing:0}\n.editor .editor-head p{font-size:13px;line-height:1.5;color:var(--muted);margin:8px 0 16px}\n.editor .group-title{font-size:14px;letter-spacing:0;font-weight:600;color:var(--ink)}\n.editor .setting-name{font-size:14px;font-weight:500;line-height:1.4}\n.editor .field>label{font-size:14px;font-weight:500;color:var(--ink)}\n.editor .field input:not([type=checkbox]),.editor .field select{font-size:14px}\n.editor .setting-description,.editor .editor-small,.editor .tip{font-size:12px;line-height:1.5;color:var(--muted)}\n.editor .entity-setting{display:flex;gap:8px;align-items:center;min-width:0}\n.editor .entity-setting .entity-selector{flex:1;min-width:0}\n.editor .clear-entity{flex:none;display:grid;place-items:center;width:36px;height:36px;padding:0;border-radius:50%;border:1px solid var(--line);background:var(--panel2);color:var(--muted);cursor:pointer}\n.editor .clear-entity ha-icon{--mdc-icon-size:18px;width:18px;height:18px}\n.editor .clear-entity:hover{color:var(--ink);border-color:var(--emerald)}\n.editor .clear-entity:focus-visible{outline:2px solid var(--emerald);outline-offset:2px}\n.editor .clear-entity:disabled{opacity:.38;cursor:default}\n@container(max-width:520px){.media-head h2{font-size:23px!important}.media-card{padding:13px;border-radius:23px}}\n@container(max-width:310px){.media-head h2{font-size:21px!important}.media-head .micro{font-size:9px}}\n\n/* Match the typographic hierarchy of Weather Pulse Card without changing Home Assistant's fonts. */\n:host{font-family:var(--ha-font-family-body,Roboto,Arial,sans-serif);font-size:var(--ha-font-size-m,14px)}\n.media-card .micro{font-size:10px;letter-spacing:1.7px;font-weight:750;color:var(--muted);margin-bottom:7px}\n.media-card .media-head h2{font-size:25px;line-height:1.14;font-weight:780;letter-spacing:-.7px}\n.media-card .f-main,.media-card .sec-name,.media-card .device-id{font-size:14px;font-weight:600;letter-spacing:0}\n.media-card .f-meta,.media-card .track-sub{font-size:12px;line-height:1.4}\n.media-card .track-title{font-size:14px;font-weight:600}\n@container(max-width:420px){.media-card .media-head h2{font-size:23px}}\n/* Optional compact layout: modules remain configurable independently. */\n.sections.compact-mode{gap:7px}\n.media-card:has(.sections.compact-mode){padding:13px;border-radius:23px}\n.sections.compact-mode .samsung{padding:12px}\n.sections.compact-mode .tv-content{min-height:64px}\n.sections.compact-mode .screen{width:90px;height:51px;border-width:3px;border-bottom-width:5px}\n.sections.compact-mode .action-pill{padding:7px 10px}\n.sections.compact-mode .fire,.sections.compact-mode .ambient{padding:9px 12px}\n.sections.compact-mode .alexa{padding:11px 12px}\n.sections.compact-mode .vol-ring{width:72px;height:72px;padding:7px}\n.sections.compact-mode .vol-inner strong{font-size:18px}\n.sections.compact-mode .art{width:43px;height:43px}\n.sections.compact-mode .volume-line{margin-top:8px}\n.remote-link{width:100%;margin:10px 0 0;padding:11px 13px;border-radius:12px;background:var(--panel2);border:1px solid var(--line);color:var(--ink);font-size:13px;display:flex;align-items:center;gap:8px}\n.power-menu{display:grid;grid-template-columns:1fr 1fr;gap:10px}\n.power-menu button{display:flex;align-items:center;justify-content:center;gap:7px;padding:13px 10px;border-radius:14px;border:1px solid var(--line);color:var(--ink);background:var(--panel2);font-size:12px;font-weight:600}\n@media(max-width:360px){.power-menu{grid-template-columns:1fr}}\n\n.alexa .art{overflow:hidden;position:relative}.alexa .art img{display:block;width:100%;height:100%;object-fit:cover;border-radius:inherit}.alexa .art img[hidden]{display:none}.media-head .micro[hidden],.media-head h2[hidden]{display:none}.volume-line{gap:8px}\n\n/* Stable layout: never translate media buttons on hover or click. */\n.media-card button,.media-card button:hover,.media-card button:active{transform:none!important}\n.media-card .action-pill,.media-card .icon-btn,.media-card .circle-btn{transition:none!important}\n.media-card{max-width:100%;overflow:clip}\n.media-card .device{min-width:0}\n.media-card .device-id,.media-card .sec-name{min-width:0}\n/* Toggling lights must not change card height when the status label changes. */\n.media-card .ambient{flex-wrap:nowrap;min-height:64px}\n.media-card .ambient-left{flex:1 1 0;min-width:0}\n.media-card .ambient-left>div:last-child{flex:1 1 auto;min-width:0}\n.media-card .ambient .f-main,.media-card .ambient .f-meta{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.media-card .ambient-controls{flex:0 0 auto;min-width:0}\n/* Long HA entity names or media titles cannot push controls into another row. */\n.media-card .fire-id{flex:1 1 0;min-width:0}\n.media-card .fire-id>div:last-child{min-width:0;flex:1 1 0}\n.media-card .fire .f-main,.media-card .fire .f-meta{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block}\n.media-card .fire-actions{flex:0 0 auto}\n.media-card .alexa-body{min-width:0}\n.media-card .alexa .track{flex:1 1 0;min-width:0}\n.media-card .alexa .tracktext{min-width:0;flex:1 1 0;overflow:hidden}\n.media-card .alexa .track-title,.media-card .alexa .track-sub{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.media-card .alexa .vol-group{flex:0 0 auto}\n/* Feedback must not add an extra row below the card when a command fails. */\n.feedback{position:fixed;bottom:max(16px,env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);z-index:10000;max-width:min(410px,calc(100vw - 30px));padding:12px 14px;background:#182c24;color:white;border-radius:12px;box-shadow:0 10px 30px #0003;font-size:12px;line-height:1.45;pointer-events:none}\n:host([data-dark]) .feedback{background:#e0f4e8;color:#182d22}\n@container(max-width:335px){\n .media-card .ambient{display:grid;grid-template-columns:minmax(0,1fr);gap:8px}\n .media-card .ambient-left,.media-card .ambient-controls{width:100%;min-width:0}\n .media-card .ambient-controls{justify-content:space-between}\n}\n@container(max-width:290px){\n .media-card .fire{flex-wrap:wrap}\n .media-card .fire-actions{width:100%;justify-content:flex-end}\n}\n";
const EXTRA_CSS = `
:host{--circle:#fff;--track:#d8dfd9;--warnbg:#f9f3de;--warnbd:#d3bd63;--warnfg:#5f4a10;--btnfg:var(--emerald)}
:host([data-dark]){--circle:#282b29;--track:#323a35;--warnbg:#302b1b;--warnbd:#816e31;--warnfg:#f1d78b;--btnfg:var(--ink)}
.sections{gap:8px}
.sections .device{background:var(--panel2);border:1px solid var(--line);border-radius:17px;padding:14px;color:var(--ink)}
.sections .device.unavailable{opacity:1}
.dev-head{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center;min-width:0}
.dev-info{min-width:0}
.dev-info .f-main,.dev-info .f-meta{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ico-circle{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;flex:none;background:var(--circle);color:var(--muted);box-shadow:inset 0 0 0 1px var(--line)}
.ico-circle.on{background:color-mix(in srgb,var(--emerald) 14%,transparent);color:var(--btnfg);box-shadow:none}
.ico-circle.warn{background:var(--warnbg);color:var(--warnfg);box-shadow:inset 0 0 0 1px var(--warnbd)}
#tvCircle,#tvCircle.on,#tvCircle.warn{width:auto;height:auto;background:none;box-shadow:none;color:var(--muted)}
#audioCircle,#audioCircle.on,#audioCircle.warn{width:auto;height:auto;background:none;box-shadow:none;color:var(--btnfg)}
#audioCircle.warn{color:var(--warnfg)}
#fireCircle{width:40px;height:40px;border-radius:13px}
#lightCircle{width:36px;height:36px;border-radius:12px}
.badge{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);white-space:nowrap}
.badge:before{content:'';width:7px;height:7px;border-radius:50%;background:currentColor;flex:none}
.badge.on{color:var(--btnfg)}
.badge.on:before{background:var(--emerald)}
.badge.warn{color:var(--warnfg)}
.badge.warn:before{background:var(--warnbd)}
.tv-hero{font-size:18px;font-weight:650;letter-spacing:-.4px;margin:12px 0 0}
.samsung .device-btn-row{margin-top:12px;align-items:center}
.media-card .action-pill{padding:9px 12px;border-radius:10px;font-size:12px;color:var(--ink);background:var(--panel);border:1px solid var(--line)}
.media-card .action-pill:hover{border-color:var(--emerald)}
.media-card .action-pill.power{width:36px;min-width:36px;height:36px;padding:0;border-radius:11px;margin-left:auto}
.media-card .action-pill.pw-on,.media-card .icon-btn.pw-on{background:color-mix(in srgb,var(--emerald) 14%,transparent);border-color:color-mix(in srgb,var(--emerald) 45%,transparent);color:var(--btnfg)}
.media-card .action-pill.pw-warn{background:var(--warnbg);border-color:var(--warnbd);color:var(--warnfg)}
.media-card .action-pill.pw-off,.media-card .icon-btn.pw-off{color:var(--muted)}
.hint{font-size:12px;line-height:1.45;color:var(--warnfg);margin-top:10px}
.sections .fire{display:block}
.media-card .fire-actions{display:flex;gap:6px;align-items:center}
.media-card .fire-actions .icon-btn,.media-card .icon-btn{width:36px;height:36px;border-radius:11px;background:var(--panel);border:1px solid var(--line);color:var(--ink)}
.media-card .icon-btn.primary{color:var(--btnfg)}
.media-card .icon-btn.pw-on{background:color-mix(in srgb,var(--emerald) 14%,transparent);border-color:color-mix(in srgb,var(--emerald) 45%,transparent);color:var(--btnfg)}
.media-card .icon-btn.pw-off{color:var(--muted)}
.alexa-body{margin-top:12px}
.media-card .alexa .art{width:50px;height:50px;border-radius:13px;background:color-mix(in srgb,var(--emerald) 14%,transparent);box-shadow:none;color:var(--btnfg)}
.media-card .vol-ring{position:relative;width:98px;height:98px;padding:0;border-radius:0;background:none;box-shadow:none}
.media-card .sections.compact-mode .vol-ring{padding:0}
.vol-ring svg{width:100%;height:100%;display:block}
.vol-ring .vt{fill:none;stroke:var(--track);stroke-width:9}
.vol-ring .va{fill:none;stroke:var(--emerald);stroke-width:9;stroke-linecap:round;stroke-dasharray:251.3;stroke-dashoffset:251.3;transition:stroke-dashoffset .2s}
.media-card .vol-ring .vol-inner{position:absolute;inset:0;width:auto;height:auto;background:none}
.media-card .vol-ring .vol-inner strong{font-size:24px}
.media-card .vol-btn{width:36px;height:36px;border-radius:11px;background:var(--panel);border:1px solid var(--line);color:var(--ink)}
@container(max-width:380px){.media-card .vol-ring{width:78px;height:78px}.media-card .vol-ring .vol-inner strong{font-size:20px}}
.volume-line{display:flex;align-items:center;gap:12px;margin-top:14px}
.volume-line .mini-play{width:40px;height:40px;padding:0;border-radius:10px;border:1px solid var(--line);background:var(--panel);display:grid;place-items:center;color:var(--ink);flex:none}
.volume-line output{width:42px;text-align:right;font-size:14px;font-weight:600;color:var(--ink);font-variant-numeric:tabular-nums}
.media-card input[type=range]{height:10px;border-radius:20px;background:linear-gradient(to right,var(--emerald) 0,var(--emerald) var(--fill,0%),var(--track) var(--fill,0%),var(--track) 100%)}
.media-card input[type=range]::-webkit-slider-thumb{width:24px;height:24px;border:4px solid var(--panel2);background:var(--emerald);border-radius:50%;box-shadow:0 0 0 1px var(--emerald)}
.media-card input[type=range]::-moz-range-thumb{width:16px;height:16px;border:4px solid var(--panel2);background:var(--emerald);border-radius:50%;box-shadow:0 0 0 1px var(--emerald)}
.media-card input[type=range]:disabled{opacity:.4}
.novol{display:flex;align-items:center;gap:14px;margin-top:12px}
.novol .nr{position:relative;width:64px;height:64px;flex:none}
.novol .nr svg{width:100%;height:100%;display:block}
.novol .nr .vt{fill:none;stroke:var(--track);stroke-width:9;stroke-dasharray:6 8}
.novol .nr span{position:absolute;inset:0;display:grid;place-items:center;font-size:20px;color:var(--muted)}
.media-card .ambient{display:block;min-height:0;flex-wrap:wrap;background:var(--panel2)}
.ambient .volume-line{margin-top:12px}
.script-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.script-button{min-height:44px;border-radius:10px;background:var(--panel);border:1px solid var(--line);padding:10px 12px;min-width:0;color:var(--ink)}
.script-button span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.script-button.run{border-color:var(--emerald);color:var(--btnfg)}
.script-button:disabled{opacity:.4}
.spin{animation:mfspin .9s linear infinite}
@keyframes mfspin{to{transform:rotate(360deg)}}
.overlay{background:#0009;backdrop-filter:none;padding:max(16px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) max(16px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left))}
.dialog{width:min(390px,100%);max-height:min(88vh,680px);border-radius:26px;background:var(--panel);color:var(--ink);border:1px solid var(--line);box-shadow:0 18px 60px #0005}
.dialog-header{padding:16px 16px 12px 18px;background:var(--panel);border-bottom:1px solid var(--line)}
.dialog-header h3{font-size:17px;font-weight:600;line-height:1.3;margin:0;letter-spacing:0;overflow-wrap:anywhere}
#dialogEyebrow{display:none}
.dialog-content{padding:12px 18px 18px}
.circle-btn{width:40px;height:40px;border-radius:50%;background:var(--panel2);border:1px solid var(--line);color:var(--ink)}
.dialog-item{border:0;border-radius:16px;background:var(--panel2)}
.dialog-item.active{border:0;background:var(--panel2);box-shadow:inset 0 0 0 2px var(--emerald)}
button.dialog-item:hover{box-shadow:inset 0 0 0 1px var(--emerald)}
.dialog-item.active:hover{box-shadow:inset 0 0 0 2px var(--emerald)}
.dialog button:focus-visible,.circle-btn:focus-visible{outline:2px solid var(--emerald);outline-offset:2px}
.diag{display:grid;gap:8px;margin-top:8px}
.diag-row{background:var(--panel2);border-radius:14px;padding:10px 12px}
.diag-row .dn{font-size:13px;font-weight:600}
.diag-row .ds{font-size:12px;color:var(--muted);margin-top:2px}
.diag-row .df{font-size:12px;margin-top:6px;line-height:1.7}
.diag .y{color:var(--btnfg);font-weight:650}
.diag .n{color:var(--warnfg);font-weight:650}
`;
const ICONS = "";
const CARD_HTML = `<article class="media-card" role="group" aria-label="Media Fusion">
<header class="media-head" id="cardHeader"><div class="head-left"><div><div class="micro">MEDIA FUSION CARD</div><h2 id="viewTitle">Media Center<b class="dot">.</b></h2><p class="subhead" id="viewSubtitle" hidden></p></div></div></header>
<div class="sections" id="sections">
<section class="device samsung" data-section="samsung" id="samsung"><div class="dev-head"><span class="ico-circle" id="tvCircle"><ha-icon class="ico" icon="mdi:television" aria-hidden="true"></ha-icon></span><div class="dev-info"><div class="f-main" id="tvName">TV</div><div class="f-meta" id="tvInput" hidden></div></div><span class="badge" id="tvState"><span>Spenta</span></span></div><h3 class="tv-hero" id="tvHero" hidden></h3><div class="device-btn-row"><button class="action-pill" data-open="sources"><ha-icon class="ico sm" icon="mdi:format-list-bulleted" aria-hidden="true"></ha-icon> Sorgenti</button><button class="action-pill" data-open="remote-samsung"><ha-icon class="ico sm" icon="mdi:remote-tv" aria-hidden="true"></ha-icon> Telecomando</button><button aria-label="Accendi o spegni TV" class="action-pill power" id="tvPower" title="Accendi/spegni TV"><ha-icon class="ico sm" icon="mdi:power" aria-hidden="true"></ha-icon></button></div><div class="hint" id="tvHint" role="status" hidden></div></section>
<section class="device alexa" data-section="alexa"><div class="dev-head"><span class="ico-circle" id="audioCircle"><ha-icon class="ico" icon="mdi:volume-high" aria-hidden="true"></ha-icon></span><div class="dev-info"><div class="f-main" id="audioName">Home Theater</div></div><span class="tag">Da configurare</span></div><div class="alexa-body"><div class="track"><div aria-hidden="true" class="art"><ha-icon class="ico lg" icon="mdi:volume-high" aria-hidden="true"></ha-icon></div><div class="tracktext"><div class="track-title">Riproduzione</div><div class="track-sub" id="trackMeta">Controlli multimediali</div><div class="playbar"><button aria-label="Precedente" class="mini-play" id="alexaPrev" hidden><ha-icon class="ico sm" icon="mdi:skip-previous" aria-hidden="true"></ha-icon></button><button aria-label="Riproduzione Alexa" class="mini-play active" id="alexaPlay"><ha-icon class="ico sm" icon="mdi:play" aria-hidden="true"></ha-icon></button><button aria-label="Successiva" class="mini-play" id="alexaNext" hidden><ha-icon class="ico sm" icon="mdi:skip-next" aria-hidden="true"></ha-icon></button></div></div></div><div class="vol-group" id="volGroup"><button aria-label="Abbassa volume Alexa" class="vol-btn" id="volMinus"><ha-icon class="ico" icon="mdi:minus" aria-hidden="true"></ha-icon></button><div class="vol-ring" id="volRing"><svg viewBox="0 0 96 96" aria-hidden="true"><circle class="vt" cx="48" cy="48" r="40"></circle><circle class="va" id="volArc" cx="48" cy="48" r="40" transform="rotate(-90 48 48)"></circle></svg><div class="vol-inner"><strong id="volNumber">—</strong><span>VOLUME</span></div></div><button aria-label="Alza volume Alexa" class="vol-btn" id="volPlus"><ha-icon class="ico" icon="mdi:plus" aria-hidden="true"></ha-icon></button></div></div><div class="volume-line" id="volLine"><button aria-label="Mute Alexa" class="mini-play" id="volMute" title="Attiva o disattiva mute Alexa"><ha-icon class="ico sm" icon="mdi:volume-high" aria-hidden="true"></ha-icon></button><input aria-label="Volume Alexa" id="volume" max="100" min="0" type="range" value="0"/><output id="volOut">—</output></div><div class="novol" id="noVol" hidden><div class="nr"><svg viewBox="0 0 96 96" aria-hidden="true"><circle class="vt" cx="48" cy="48" r="40"></circle></svg><span>—</span></div><div><div class="f-main" id="noVolTitle">Volume non disponibile</div><div class="f-meta" id="noVolText">L'entità non fornisce il livello del volume.</div></div></div></section>
<section class="device fire" data-section="fire"><div class="dev-head"><span class="ico-circle" id="fireCircle"><ha-icon id="fireIcon" class="ico" icon="mdi:television-play" aria-hidden="true"></ha-icon></span><div class="dev-info"><div class="f-main" id="fireName">Lettore streaming</div><div class="f-meta" id="fireMeta">Da configurare</div></div><div class="fire-actions"><button aria-label="App lettore streaming" class="icon-btn" data-open="fireapps" title="Applicazioni e sorgenti"><ha-icon class="ico sm" icon="mdi:format-list-bulleted" aria-hidden="true"></ha-icon></button><button aria-label="Accendi o spegni lettore streaming" class="icon-btn" id="firePower" title="Accendi o spegni lettore streaming"><ha-icon class="ico sm" icon="mdi:power" aria-hidden="true"></ha-icon></button><button aria-label="Riproduci o pausa" class="icon-btn primary" id="firePlay" title="Riproduci o pausa lettore streaming" hidden><ha-icon class="ico sm" icon="mdi:play" aria-hidden="true"></ha-icon></button></div></div></section>
<section class="device ambient" data-section="ambilight"><div class="dev-head"><span class="ico-circle" id="lightCircle"><ha-icon id="lightIcon" class="ico" icon="mdi:led-strip-variant" aria-hidden="true"></ha-icon></span><div class="dev-info"><div class="f-main" id="lightName">Luci LED TV</div><div class="f-meta" id="ambientLabel">Da configurare</div></div><button aria-checked="false" aria-label="Accendi o spegni luci LED TV" class="switch" id="ambientSwitch" role="switch"></button></div><div class="volume-line" id="brightnessWrap"><ha-icon class="ico sm" icon="mdi:white-balance-sunny" aria-hidden="true"></ha-icon><input aria-label="Luminosità luci LED TV" id="brightness" max="100" min="1" type="range" value="68"/><output id="brightOut">—</output></div></section>
<section class="device scripts" data-section="scripts"><div class="section-top" style="margin-bottom:10px"><div class="sec-name"><ha-icon class="ico sm" icon="mdi:lightning-bolt-outline" aria-hidden="true"></ha-icon><span>Script e azioni</span></div><span class="tiny" id="scriptCount">0 azioni</span></div><div class="script-list" id="scriptButtons"></div></section>
</div></article>`;
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
    this.shadowRoot.innerHTML=`<style>${BASE_CSS}${EXTRA_CSS}</style>${ICONS}${CARD_HTML}<div id="feedback" aria-live="polite" class="feedback" hidden></div>`;
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
    head.hidden=!c.show_title&&!c.show_eyebrow;
    const eyebrow=head.querySelector(".micro");if(eyebrow)eyebrow.hidden=!c.show_eyebrow;
    this._q("viewTitle").hidden=!c.show_title;
    this._q("viewTitle").innerHTML=`${escapeHtml(String(c.title||"Media Center").trim().replace(/\.+$/, ""))}<b class="dot">.</b>`;
    this._q("viewSubtitle").hidden=true;
    this._q("sections").classList.toggle("compact-mode",c.compact_mode===true);
    const visibility={samsung:"show_samsung",fire:"show_fire",alexa:"show_alexa",ambilight:"show_ambilight",scripts:"show_scripts"};
    for(const [section,prop] of Object.entries(visibility)) {
      const el=this.shadowRoot.querySelector(`[data-section="${section}"]`);
      if(el)el.hidden=!c[prop];
    }
    this._updateSamsung(); this._updateFire(); this._updateAlexa();this._updateAmbient();this._updateScripts();
  }
  _updateSamsung(){
    const c=this._config,s=this._state("samsung_entity"),available=validState(s),on=available&&isOn(s);
    const canWake=entityValid(c.tv_on_script,"script"),canOff=entityValid(c.tv_off_script,"script");
    const node=this._q("samsung");node.classList.toggle("tv-off",!on);node.classList.toggle("unavailable",!available);
    const tone=!c.samsung_entity?"":!available?"warn":on?"on":"";
    const badge=this._q("tvState");badge.className="badge"+(tone?` ${tone}`:"");
    badge.querySelector("span").textContent=!c.samsung_entity?"Da configurare":!available?"Non raggiungibile":on?"Accesa":"Spenta";
    this._q("tvCircle").className="ico-circle"+(tone?` ${tone}`:"");
    this._setText("tvName",shownName(c.tv_name,s,"TV"));
    const heading=this._q("tvHero");heading.textContent=c.tv_headline;heading.hidden=!c.tv_headline;
    const input=this._q("tvInput");input.hidden=!on;input.textContent=`Sorgente · ${short(s?.attributes?.source,"—")}`;
    const power=this._q("tvPower");
    power.className="action-pill power "+(!available?(canWake?"pw-warn":"pw-off"):on?"pw-on":"pw-off");
    power.disabled=(!available&&!canWake)||this._busy.has("tvPower");
    let msg="";
    if(c.samsung_entity){
      if(!available)msg=canWake?"TV non raggiungibile: il pulsante power usa lo script di accensione.":"TV non raggiungibile. Configura uno script di accensione nell'editor, scheda Azioni.";
      else if(!on&&!canWake&&!supports(s,MEDIA_TURN_ON))msg="Questa TV non si accende da sola. Configura uno script di accensione nell'editor, scheda Azioni.";
      else if(on&&!canOff&&!supports(s,MEDIA_TURN_OFF))msg="Questa TV non si spegne da sola. Configura uno script di spegnimento nell'editor, scheda Azioni.";
    }
    const hint=this._q("tvHint");hint.hidden=!msg;hint.textContent=msg;
    const buttons=this.shadowRoot.querySelectorAll('[data-open="sources"],[data-open="remote-samsung"]');
    buttons.forEach(el=>el.disabled=!available);
  }
  _updateFire(){
    const c=this._config,s=this._state("fire_entity"),available=validState(s),on=available&&isOn(s);
    this._setText("fireName",shownName(c.fire_name,s,"Lettore streaming"));
    this._q("fireIcon").setAttribute("icon",stateIcon(s,"mdi:television-play"));
    const app=short(s?.attributes?.app_name,"");
    const label=!c.fire_entity?"Da configurare":!available?"Non disponibile":s.state==="playing"?"In riproduzione":s.state==="paused"?"In pausa":on?"Acceso":"Spento";
    this._setText("fireMeta",available&&on&&app?`${label} · ${app}`:label);
    this._q("fireCircle").className="ico-circle"+(!c.fire_entity?"":!available?" warn":on?" on":"");
    const power=this._q("firePower");power.disabled=!available;power.className="icon-btn "+(on?"pw-on":"pw-off");
    power.setAttribute("aria-label",on?"Spegni lettore streaming":"Accendi lettore streaming");
    const play=this._q("firePlay");play.hidden=!on;play.disabled=!available;play.innerHTML=ico(s?.state==="playing"?"pause":"play");
    this.shadowRoot.querySelectorAll('[data-open="fireapps"],[data-open="remote-fire"]').forEach(b=>b.disabled=!available);
  }
  _updateAlexa(){
    const c=this._config,s=this._state("alexa_entity"),available=validState(s);
    const n=this.shadowRoot.querySelector(".alexa .tag");
    this._setText("audioName",shownName(c.audio_name,s,"Home Theater"));
    if(n)n.textContent=!c.alexa_entity?"Da configurare":!available?"Non disponibile":"Media player";
    this._q("audioCircle").className="ico-circle"+(!c.alexa_entity?"":!available?" warn":" on");
    const title=this.shadowRoot.querySelector(".track-title");
    if(title)title.textContent=short(s?.attributes?.media_title,"Riproduzione");
    this._setText("trackMeta",!available?"Non disponibile":short(s?.attributes?.media_artist,s?.state==="playing"?"Riproduzione attiva":"Controlli multimediali"));
    const hasVol=available&&Number.isFinite(Number(s?.attributes?.volume_level))&&s?.attributes?.volume_level!==null&&s?.attributes?.volume_level!==undefined;
    const value=hasVol?Math.round(clamp(Number(s.attributes.volume_level)*100,0,100)):0;
    if(this._pendingVolume && (!hasVol || Math.abs(value-this._pendingVolume.value)<=1 || Date.now()>this._pendingVolume.until))this._pendingVolume=null;
    const presented=this._pendingVolume?.value ?? value;
    const muted=s?.attributes?.is_volume_muted===true;
    this._q("volGroup").hidden=!hasVol;this._q("volLine").hidden=!hasVol;
    this._q("noVol").hidden=hasVol||!c.alexa_entity;
    this._setText("noVolTitle",!available?"Dispositivo non disponibile":"Volume non disponibile");
    this._setText("noVolText",!available?"Controlla che il dispositivo sia acceso e raggiungibile da Home Assistant.":"L'entità non fornisce il livello del volume. Avvia una riproduzione o scegli un'altra entità.");
    if(!this._editingVolume){this._q("volume").value=String(presented);this._updateVolVisual(hasVol?presented:null,muted);}
    this._q("volMinus").disabled=!hasVol;
    this._q("volPlus").disabled=!hasVol;
    this._q("volMute").disabled=!available||typeof s?.attributes?.is_volume_muted!=="boolean";
    this._q("volume").disabled=!hasVol;
    this._q("alexaPlay").disabled=!available;
    this._q("alexaPlay").innerHTML=ico(s?.state==="playing"?"pause":"play");
    this._q("alexaPrev").hidden=!(available&&supports(s,MEDIA_PREVIOUS_TRACK));
    this._q("alexaNext").hidden=!(available&&supports(s,MEDIA_NEXT_TRACK));
    this._updateArtwork();
  }
  _updateArtwork(){
    const box=this.shadowRoot.querySelector(".alexa .art");if(!box)return;
    const kind=this._config.artwork_source;box.hidden=kind==="none";
    if(kind==="none")return;
    const entity=kind==="fire"?this._state("fire_entity"):this._state("alexa_entity");
    const url=validState(entity)?entity?.attributes?.entity_picture:null;
    const valid=typeof url==="string" && url.startsWith("/") && !url.startsWith("//") && !url.includes("\\") && !/[\x00-\x1f]/.test(url);
    const fallback=box.querySelector("ha-icon");
    let img=box.querySelector("img");
    if(!valid){if(img)img.remove();if(fallback)fallback.hidden=false;return;}
    if(!img){img=document.createElement("img");img.alt="Copertina fornita dal media player";img.loading="lazy";img.referrerPolicy="same-origin";img.addEventListener("load",()=>{img.hidden=false;if(fallback)fallback.hidden=true;});img.addEventListener("error",()=>{img.hidden=true;if(fallback)fallback.hidden=false;});box.appendChild(img);}
    if(img.getAttribute("src")!==url){img.hidden=true;if(fallback)fallback.hidden=false;img.setAttribute("src",url);}
  }
  _updateVolVisual(value,muted=false){
    const v=value===null?null:Math.round(clamp(value,0,100));
    const shown=v===null||muted?0:v;
    this._q("volArc").style.strokeDashoffset=String(Math.round(251.3*(1-shown/100)*10)/10);
    this._q("volume").style.setProperty("--fill",`${v===null?0:v}%`);
    this._setText("volNumber",v===null?"—":String(v));
    this._setText("volOut",v===null?"—":`${v}%`);
    this._q("volMute").style.color=muted?"var(--emerald)":"";
    this._q("volMute").setAttribute("aria-pressed",String(muted));
  }
  _updateAmbient(){
    const c=this._config,s=this._state("ambilight_entity"),available=validState(s),on=available&&s.state==="on";
    this._setText("lightName",shownName(c.light_name,s,"Luci LED TV"));
    this._q("lightIcon").setAttribute("icon",stateIcon(s,"mdi:led-strip-variant"));
    const btn=this._q("ambientSwitch");btn.classList.toggle("on",on);
    btn.setAttribute("aria-checked",String(on)); btn.disabled=!available;
    const canBright=available&&on&&typeof s.attributes?.brightness==="number";
    const bv=canBright?Math.round(s.attributes.brightness/255*100):null;
    this._setText("ambientLabel",!c.ambilight_entity?"Da configurare":!available?"Non disponibile":on?(bv!==null?`Illuminazione · Accesa ${bv}%`:"Illuminazione · Accesa"):"Illuminazione · Spenta");
    const circle=this._q("lightCircle");
    circle.className="ico-circle"+(!c.ambilight_entity?"":!available?" warn":on?" on":"");
    const rgb=s?.attributes?.rgb_color;
    const okRgb=on&&Array.isArray(rgb)&&rgb.length===3&&rgb.every(x=>Number.isInteger(x)&&x>=0&&x<=255);
    circle.style.background=okRgb?`rgb(${rgb[0]},${rgb[1]},${rgb[2]})`:"";
    circle.style.color=okRgb?((rgb[0]*299+rgb[1]*587+rgb[2]*114)/1000>150?"#18221c":"#ffffff"):"";
    circle.style.boxShadow=okRgb?"none":"";
    const bright=this._q("brightness");
    bright.disabled=!canBright;
    if(!this._editingBrightness){
      const v=canBright?bv:0;
      bright.value=String(v);bright.style.setProperty("--fill",`${v}%`);
      this._setText("brightOut",canBright?`${v}%`:"—");
    }
  }
  _updateScripts(){
    const scripts=this._config.scripts.filter(s=>entityValid(s.entity_id,"script"));
    this._setText("scriptCount",scripts.length===1?"1 azione":`${scripts.length} azioni`);
    const info=scripts.map(s=>{const st=this._stateById(s.entity_id);return {label:short(s.name,short(st?.attributes?.friendly_name,s.entity_id)),icon:stateIcon(st,""),run:st?.state==="on",gone:!st||st.state==="unavailable"};});
    const sig=JSON.stringify(info);
    if(sig===this._scriptsHash)return;
    this._scriptsHash=sig;
    this._q("scriptButtons").innerHTML=info.map((x,i)=>`<button type="button" class="script-button${x.run?" run":""}" data-script="${i}" ${x.gone?"disabled":""} aria-label="${x.run?"In esecuzione: ":"Avvia "}${escapeHtml(x.label)}">${x.run?ico("loading").replace('class="ico sm','class="ico sm spin'):(x.icon?`<ha-icon class="ico sm" icon="${x.icon}" aria-hidden="true"></ha-icon>`:ico(i===0?"power":i===1?"sun":"spark"))}<span>${escapeHtml(x.label)}${x.run?" · in corso":""}</span></button>`).join("");
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
    } else if(id==="firePower")this._fireToggle();
    else if(id==="firePlay") this._togglePlay("fire_entity");
    else if(id==="alexaPlay") this._togglePlay("alexa_entity");
    else if(id==="alexaPrev") this._send("media_player","media_previous_track",this._config.alexa_entity,{},"alexa-prev");
    else if(id==="alexaNext") this._send("media_player","media_next_track",this._config.alexa_entity,{},"alexa-next");
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
    else if(target.id==="brightness") {this._editingBrightness=true;target.style.setProperty("--fill",`${target.value}%`);this._setText("brightOut",`${target.value}%`);}
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
    if(!this._hass?.callService|| !entityValid(entityId,targetDomain)){this._toast("Configura un'entità valida nell'editor");return false;}
    if(key && this._busy.has(key))return false;
    if(key)this._busy.add(key);
    let succeeded=false;
    try{
      await this._hass.callService(domain,action,{entity_id:entityId,...data});
      succeeded=true;
    }catch(err){
      if(key==="alexa-volume")this._pendingVolume=null;
      console.warn("Media Fusion Card: errore servizio",domain,action,err);
      this._toast(`Comando non riuscito: ${String(err?.message||"verifica il dispositivo").slice(0,95)}`);
      const error=this._p("dialogError");if(error){error.textContent=`Comando non riuscito: ${String(err?.message||"verifica il dispositivo").slice(0,120)}`;error.hidden=false;}
    }finally{if(key)this._busy.delete(key);this._update();}
    return succeeded;
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
    root.innerHTML=`<style>${BASE_CSS}${EXTRA_CSS} :host{pointer-events:none;font-family:var(--ha-font-family-body,Roboto,Arial,sans-serif)}:host([data-dark]){--panel:#101211;--panel2:#191c1a;--ink:#f5f7f4;--muted:#bbc5bd;--line:#2b302c;--emerald:#0e795d;--soft:#1d352c;--greenText:#c4e8d8}.overlay.open{pointer-events:auto}.dialog-header{background:var(--panel);position:sticky;top:0;z-index:3}.dialog{color:var(--ink);font-size:14px}.dialog-note{font-size:12px}.dialog-error{color:#ee8585;font-size:12px;margin:10px 0 0;line-height:1.5}.remote-top button,.remote-bottom button{font-weight:600}.dialog-header .micro{letter-spacing:1.7px;font-size:10px;font-weight:750}</style>${ICONS}<div class="overlay" id="overlay" role="presentation"><div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialogTitle"><div class="dialog-header"><div><div class="micro" id="dialogEyebrow">MEDIA FUSION</div><h3 id="dialogTitle">Dettagli</h3></div><button class="circle-btn" id="closeDialog" aria-label="Chiudi finestra">${ico("close")}</button></div><div class="dialog-content" id="dialogContent"></div></div></div>`;
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
    this._p("dialogContent").innerHTML=`${html}<p id="dialogError" class="dialog-error" role="alert" hidden></p>`;
    this._p("overlay").classList.add("open");
    this._portal.style.pointerEvents="auto";
    this._p("closeDialog").focus({preventScroll:true});
  }
  _close(){
    if(!this._p("overlay")?.classList.contains("open"))return;
    this._p("overlay").classList.remove("open");this._portal.style.pointerEvents="none";
    if(this._returnFocus?.isConnected)this._returnFocus.focus({preventScroll:true});
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
    const available=validState(s),supported=supports(s,MEDIA_SELECT_SOURCE);
    const html=!available?`<p class="dialog-note">Dispositivo non disponibile.</p>`:
      !supported?`<p class="dialog-note">Questa entità non espone la selezione delle sorgenti.</p>`:
      list.length?list.map(src=>this._sourceItem(kind,src,src===s.attributes?.source)).join(""):
      `<p class="dialog-note">Nessuna sorgente nell'attributo source_list. Controlla le opzioni dell'integrazione del lettore.</p>`;
    this._open(kind==="samsung"?"Sorgenti TV":"Sorgenti streaming", "SORGENTI DISPONIBILI",html);
  }
  async _fireCommand(on){
    const s=this._state("fire_entity"),rid=this._config.fire_remote;
    if(this._config.fire_adb_power===true)return this._send("androidtv","adb_command",this._config.fire_entity,{command:on?"WAKEUP":"SLEEP"},`fire-adb:${on?"on":"off"}`,"media_player");
    if(supports(s,on?MEDIA_TURN_ON:MEDIA_TURN_OFF))return this._send("media_player",on?"turn_on":"turn_off",this._config.fire_entity,{},`fire:${on?"on":"off"}`);
    if(entityValid(rid,"remote") && validState(this._stateById(rid)))return this._send("remote","send_command",rid,{command:on?"WAKEUP":"SLEEP"},`fire-remote:${on?"on":"off"}`);
    return null;
  }
  async _fireToggle(){
    const s=this._state("fire_entity");
    if(!validState(s)){this._toast("Lettore streaming non disponibile");return;}
    const result=await this._fireCommand(!isOn(s));
    if(result===null)this._toast("Il lettore non espone il comando richiesto. Verifica le funzioni del dispositivo o configura il telecomando remote.");
  }
  _firePowerMenu(){
    if(!validState(this._state("fire_entity"))){this._toast("Lettore streaming non disponibile");return;}
    this._open("Alimentazione lettore","COMANDI DI ALIMENTAZIONE",`<div class="power-menu"><button type="button" data-fire-action="on">${ico("power")} Accendi</button><button type="button" data-fire-action="off">${ico("power")} Spegni</button></div>`);
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
      <div class="remote-bottom">${press("Volume meno",ks.voldown,"minus")}${press("Volume più",ks.volup,"plus")}</div></div>`;
  }
  async _onDialogClick(event){
    if(event.target===this._p("overlay")||event.target.closest("#closeDialog")){this._close();return;}
    const el=event.target.closest("button");if(!el||el.disabled)return;
    if(el.dataset.fireAction){
      const s=this._state("fire_entity"),on=el.dataset.fireAction==="on";
      const rid=this._config.fire_remote;
      let result=false;
      if(this._config.fire_adb_power===true)result=await this._send("androidtv","adb_command",this._config.fire_entity,{command:on?"WAKEUP":"SLEEP"},`fire-adb:${on?"on":"off"}`,"media_player");
      else if(supports(s,on?MEDIA_TURN_ON:MEDIA_TURN_OFF))result=await this._send("media_player",on?"turn_on":"turn_off",this._config.fire_entity,{},`fire:${on?"on":"off"}`);
      else if(entityValid(rid,"remote") && validState(this._stateById(rid)))result=await this._send("remote","send_command",rid,{command:on?"WAKEUP":"SLEEP"},`fire-remote:${on?"on":"off"}`);
      else {const e=this._p("dialogError");if(e){e.textContent="Il lettore non espone il comando richiesto. Verifica le funzioni del dispositivo o configura il telecomando remote.";e.hidden=false;}}
      if(result)this._close();
      return;
    }
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
      if(!supports(s,MEDIA_SELECT_SOURCE) || !Array.isArray(s?.attributes?.source_list) || !s.attributes.source_list.includes(el.dataset.source))return;
      const result=await this._send("media_player","select_source",this._config[kind==="samsung"?"samsung_entity":"fire_entity"],{source:el.dataset.source},`source:${kind}`);
      if(result)this._close();
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
    this.shadowRoot.innerHTML=`<style>${BASE_CSS}${EXTRA_CSS}
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
      <header class="editor-head"><div class="top-title">${this._tab==="sections"?"Sezioni disponibili":this._tab==="appearance"?"Aspetto Edera":"Dispositivi e azioni"}</div><p>${this._tab==="sections"?"Attiva soltanto i componenti che desideri visualizzare.":this._tab==="appearance"?"Personalizza intestazione, nomi delle sezioni e tema.":"Seleziona le entità Home Assistant e gli script da eseguire."}</p></header>
      ${this._tab==="sections" ? `
        <div class="settings-body">
        <div class="setting-group"><div class="group-title">Mostra nella dashboard</div>${GROUPS.map(([k,n,d])=>sw(k,n,d)).join("")}</div>
        <div class="tip">Le sezioni nascoste conservano la configurazione delle entità.</div></div>
      `:this._tab==="appearance"?`
        <div class="settings-body"><div class="setting-group"><div class="group-title">Intestazione</div>
          ${sw("show_eyebrow","Mostra scritta MEDIA FUSION CARD","Intestazione superiore indipendente dal titolo")}
          ${sw("show_title","Mostra titolo principale","Mostra o nascondi Media Center e il punto verde")}
          ${c.show_title?field("title","Titolo personalizzato","Media Center"):""}
          ${sw("compact_mode","Layout compatto","Riduce ingombri e spaziature senza rimuovere controlli")}
          <div class="field"><label for="ed-artwork_source">Copertina multimediale</label><select id="ed-artwork_source" data-artwork><option value="alexa" ${c.artwork_source==="alexa"?"selected":""}>Home Theater (se disponibile)</option><option value="fire" ${c.artwork_source==="fire"?"selected":""}>Lettore streaming (se disponibile)</option><option value="none" ${c.artwork_source==="none"?"selected":""}>Non mostrare</option></select></div>
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
          ${sw("fire_adb_power","Accensione tramite ADB (Fire TV)","Solo per dispositivi Android Debug Bridge: usa WAKEUP e SLEEP.")}
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
          </div>${this._diagHtml()}</div>
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
    this.shadowRoot.querySelectorAll("[data-check]").forEach(el=>el.addEventListener("change",()=>{this._set(el.dataset.check,el.checked);if(["show_title","show_eyebrow"].includes(el.dataset.check))this._render();}));
    this.shadowRoot.querySelectorAll("[data-text]").forEach(el=>el.addEventListener("change",()=>this._set(el.dataset.text,el.value)));
    this.shadowRoot.querySelectorAll("[data-theme]").forEach(el=>el.addEventListener("change",()=>this._set("theme",el.value)));
    this.shadowRoot.querySelectorAll("[data-artwork]").forEach(el=>el.addEventListener("change",()=>this._set("artwork_source",el.value)));
    this.shadowRoot.querySelectorAll("[data-script-name]").forEach(el=>el.addEventListener("change",()=>{
      const arr=this._config.scripts.map(s=>({...s}));if(arr[Number(el.dataset.scriptName)]) {arr[Number(el.dataset.scriptName)].name=el.value.slice(0,60);this._set("scripts",arr);}
    }));
  }
  _diagHtml(){
    const c=this._config,states=this._hass?.states;
    const yn=v=>`<span class="${v?"y":"n"}">${v?"Sì":"No"}</span>`;
    const items=[
      ["TV",c.samsung_entity,[["Accensione",MEDIA_TURN_ON],["Spegnimento",MEDIA_TURN_OFF],["Sorgenti",MEDIA_SELECT_SOURCE]]],
      ["Home Theater",c.alexa_entity,[["Livello volume","level"],["Volume",4],["Mute",8],["Precedente",MEDIA_PREVIOUS_TRACK],["Successiva",MEDIA_NEXT_TRACK]]],
      ["Lettore streaming",c.fire_entity,[["Accensione",MEDIA_TURN_ON],["Spegnimento",MEDIA_TURN_OFF],["Sorgenti",MEDIA_SELECT_SOURCE]]],
      ["Luci LED TV",c.ambilight_entity,[]]
    ];
    const rows=items.map(([name,id,feats])=>{
      const st=id&&states?states[id]:undefined;
      let status,detail="";
      if(!id)status="Da configurare";
      else if(!states)status="Stato non disponibile";
      else if(!st)status="Entità non trovata";
      else if(!validState(st)){status=`Non disponibile (${escapeHtml(st.state)})`;detail="Le funzioni non sono rilevabili finché il dispositivo non risponde.";}
      else{
        status=`Disponibile · ${escapeHtml(st.state)}`;
        detail=feats.map(([label,f])=>`${label} ${yn(f==="level"?typeof st.attributes?.volume_level==="number":supports(st,f))}`).join(" · ");
      }
      return `<div class="diag-row"><div class="dn">${escapeHtml(name)}</div><div class="ds">${status}</div>${detail?`<div class="df">${detail}</div>`:""}</div>`;
    }).join("");
    return `<div class="setting-group"><div class="group-title">Diagnostica</div><div class="diag">${rows}</div><p class="editor-small">Mostra le funzioni che ogni entità dichiara adesso. Riapri questa scheda per aggiornare i dati.</p></div>`;
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