/*
 * Media Fusion Card
 * Copyright (c) 2026 luigi-regolo
 * Licensed under GPL-3.0-only.
 * No remote analytics, external libraries, paid services or credentials.
 */
(() => {
"use strict";
const VERSION = "1.3";
const CARD_TAG = "media-fusion-card";
const EDITOR_TAG = "media-fusion-card-editor";
const MODULES = ["tv", "streaming", "light", "scripts"];
const MOD_FLAG = { tv: "show_tv", streaming: "show_streaming", light: "show_light", scripts: "show_scripts" };
const DEFAULT = Object.freeze({
  eyebrow: "Media Fusion Card", title: "Media Center", show_eyebrow: true, show_title: true,
  show_audio: true, show_progress: true, artwork_source: "audio",
  show_tv: true, show_streaming: true, show_light: true, show_scripts: true,
  order: MODULES, highlight_on: true, show_apps: true, apps: [], remote_target: "auto",
  theme: "auto", language: "auto",
  tv_entity: "", tv_remote: "", tv_on_script: "", tv_off_script: "", tv_name: "",
  streaming_entity: "", streaming_remote: "", streaming_adb_power: false, streaming_name: "",
  audio_entity: "", audio_name: "", light_entity: "", light_name: "", scripts: []
});
// Option names used by older versions: still read, then rewritten with the current names.
const LEGACY_KEYS = Object.freeze({
  samsung_entity: "tv_entity", samsung_remote: "tv_remote", fire_entity: "streaming_entity", fire_remote: "streaming_remote",
  alexa_entity: "audio_entity", ambilight_entity: "light_entity", fire_adb_power: "streaming_adb_power",
  show_samsung: "show_tv", show_fire: "show_streaming", show_alexa: "show_audio", show_ambilight: "show_light", fire_name: "streaming_name"
});
// Remote keys. TV: Samsung key names (remote.send_command). Player: Android Debug Bridge key names.
const TV_KEYS = Object.freeze({ up: "KEY_UP", down: "KEY_DOWN", left: "KEY_LEFT", right: "KEY_RIGHT", ok: "KEY_ENTER", back: "KEY_RETURN", home: "KEY_HOME", menu: "KEY_MENU", rew: "KEY_REWIND", ff: "KEY_FF", volup: "KEY_VOLUP", voldown: "KEY_VOLDOWN", mute: "KEY_MUTE", chup: "KEY_CHUP", chdown: "KEY_CHDOWN" });
const ADB_KEYS = Object.freeze({ up: "UP", down: "DOWN", left: "LEFT", right: "RIGHT", ok: "CENTER", back: "BACK", home: "HOME", menu: "MENU", rew: "REWIND", ff: "FAST_FORWARD" });
const NAV = ["up", "down", "left", "right", "ok", "back", "home", "menu", "rew", "ff"];
const F = { VOLUME_SET: 4, VOLUME_MUTE: 8, PREVIOUS: 16, NEXT: 32, TURN_ON: 128, TURN_OFF: 256, VOLUME_STEP: 1024, SELECT_SOURCE: 2048, PLAY: 16384 };
const LANGS = [["it", "Italiano"], ["en", "English"], ["de", "Deutsch"], ["fr", "Français"]];

/* ------------------------------------------------------------------ i18n */
const I18N = {
  it: {
    tv: "TV", streaming: "Lettore streaming", audio: "Home Theater", light: "Luci LED TV", scripts: "Script",
    on_f: "Accesa", off_f: "Spenta", on_m: "Acceso", off_m: "Spento", playing: "In riproduzione", paused: "In pausa",
    unreachable: "Non raggiungibile", unavailable: "Non disponibile", lights_on: "Accese", lights_off: "Spente",
    actions: n => n === 1 ? "1 azione" : `${n} azioni`, nothing: "Nessun brano", volume: "VOLUME", mute: "Mute",
    prev: "Precedente", next: "Successiva", playpause: "Riproduci o pausa", vol_down: "Abbassa volume", vol_up: "Alza volume",
    sources: "Sorgenti", tv_sources: "Sorgenti TV", inputs: "Ingressi", in_use: "In uso", available: "Disponibile",
    remote: "Telecomando", apps: "App del lettore", all_apps: "Tutte le app", tap_open: "Tocca per aprire", open_now: "Aperta ora", open_on: "Apri sul lettore",
    power: "Power", power_tv: "Accendi o spegni TV", power_st: "Accendi o spegni lettore", source: "Sorgente", back: "Indietro", home: "Home", app: "App", menu: "Menu",
    up: "Su", down: "Giù", left: "Sinistra", right: "Destra", rew: "Indietro veloce", ff: "Avanti veloce", ch_up: "Canale su", ch_down: "Canale giù",
    brightness: "Luminosità", light_switch: "Accendi o spegni", run: "Tocca per avviare", running: "In esecuzione",
    script_actions: "Script e azioni", empty: "Nessuna sezione da mostrare. Scegli le entità nella configurazione.",
    no_sources: "Questa entità non espone sorgenti selezionabili.", no_apps: "Nessuna app configurata. Aggiungile nella configurazione, modulo Lettore streaming.",
    err: "Comando non riuscito", cfg_entity: "Configura un'entità valida nell'editor", no_app_id: "Inserisci l'ID dell'app nella configurazione",
    tv_no_on: "La TV non si accende da sola: configura uno script di accensione.", tv_no_off: "La TV non si spegne da sola: configura uno script di spegnimento.",
    st_no_power: "Il lettore non espone l'accensione: attiva l'accensione tramite ADB o configura il telecomando.",
    no_remote: "Configura il telecomando nella configurazione.", close: "Chiudi", invalid: "Configurazione non valida",
    // editor
    tabs: "Sezioni", t_play: "Riproduzione", t_mods: "Moduli", t_look: "Aspetto",
    play_desc: "Il pannello in alto con brano, comandi e volume a cerchio. Spento: la card mostra solo i moduli scelti.",
    e_audio: "Entità audio", e_audio_h: "Il volume del cerchio e il mute (tocco sul numero) agiscono su questa entità.",
    e_panel: "Pannello Riproduzione", e_panel_h: "Brano, comandi e volume.", e_progress: "Barra di avanzamento", e_progress_h: "Mostra posizione e durata quando il media player le fornisce.",
    e_artwork: "Copertina da", e_art_audio: "Home Theater", e_art_st: "Lettore streaming", e_art_none: "Nessuna", e_name: "Nome (facoltativo)", e_name_h: "Vuoto: usa il nome dell'entità.",
    mods_desc: "Ogni modulo funziona anche da solo. Un modulo spento o senza entità non compare. Con le frecce cambi l'ordine nella card. Per una card con un solo modulo, spegni il pannello Riproduzione e lascia attivo solo quello.",
    h_tv: "Stato, sorgenti, accensione e telecomando unico.", h_streaming: "Stato, riproduzione, app e accensione.", h_light: "Piastrella con interruttore e luminosità nel popup.", h_scripts: "Piastrella che apre l'elenco delle tue azioni.",
    mod_on: "Modulo attivo", mv_up: n => `Sposta su ${n}`, mv_dn: n => `Sposta giù ${n}`,
    e_tv: "Entità TV", e_tv_remote: "Telecomando TV", e_tv_remote_h: "Serve per frecce, OK, Home, Indietro, volume e canali della TV.",
    e_on_script: "Script di accensione", e_on_script_h: "Facoltativo: per le TV che non si accendono da sole.", e_off_script: "Script di spegnimento", e_off_script_h: "Facoltativo.",
    e_target: "Frecce, OK, Home e Indietro del telecomando vanno a", e_target_h: "Power, sorgente, volume, mute e canali vanno sempre alla TV.",
    tg_auto: "Automatico: lettore se acceso, altrimenti TV", tg_tv: "Sempre alla TV", tg_st: "Sempre al lettore streaming",
    e_st: "Entità lettore", e_st_remote: "Telecomando lettore", e_st_remote_h: "Facoltativo: senza telecomando i tasti usano i comandi ADB del lettore.",
    e_adb: "Accensione tramite ADB (Fire TV)", e_adb_h: "Solo con l'integrazione Android Debug Bridge: usa WAKEUP e SLEEP.",
    e_show_apps: "Mostra le app sulla card", e_apps: "App", e_apps_h: "Per ogni app: icona, nome e ID. Con la Fire TV l'ID lo leggi in Home Assistant con l'app aperta: Strumenti per sviluppatori › Stati, attributo app_id del lettore.",
    app_name: "Nome app", app_id: "ID app, es. com.esempio.app", app_icon: "Icona", add_app: "+ Aggiungi app", remove: "Rimuovi",
    e_light: "Entità luce", e_scripts: "Script", script_name: "Nome del pulsante", add_script: "+ Aggiungi script",
    e_eyebrow: "Intestazione superiore", e_title: "Titolo", e_title_h: "Il punto verde finale lo aggiunge la card.",
    e_show_eyebrow: "Mostra intestazione superiore", e_show_title: "Mostra titolo",
    e_highlight: "Colora TV e lettore quando sono accesi", e_highlight_h: "Solo i loro riquadri. Il resto della card resta neutro.",
    e_theme: "Tema", th_auto: "Automatico (Home Assistant)", e_lang: "Lingua", lang_auto: "Automatica (Home Assistant)", e_lang_h: "Automatica segue la lingua dell'utente in Home Assistant. Se la lingua non è disponibile si usa l'inglese.",
    diag: "Diagnostica", diag_h: "Mostra le funzioni che ogni entità dichiara adesso. Riapri la scheda per aggiornare.",
    d_todo: "Da configurare", d_nf: "Entità non trovata", d_na: "Non disponibile", d_ok: "Disponibile", yes: "Sì", no: "No",
    f_on: "Accensione", f_off: "Spegnimento", f_src: "Sorgenti", f_vol: "Volume", f_mute: "Mute", f_level: "Livello volume", f_prev: "Precedente", f_next: "Successiva"
  },
  en: {
    tv: "TV", streaming: "Streaming player", audio: "Home Theater", light: "TV LED lights", scripts: "Scripts",
    on_f: "On", off_f: "Off", on_m: "On", off_m: "Off", playing: "Playing", paused: "Paused",
    unreachable: "Unreachable", unavailable: "Unavailable", lights_on: "On", lights_off: "Off",
    actions: n => n === 1 ? "1 action" : `${n} actions`, nothing: "Nothing playing", volume: "VOLUME", mute: "Mute",
    prev: "Previous", next: "Next", playpause: "Play or pause", vol_down: "Volume down", vol_up: "Volume up",
    sources: "Sources", tv_sources: "TV sources", inputs: "Inputs", in_use: "In use", available: "Available",
    remote: "Remote", apps: "Player apps", all_apps: "All apps", tap_open: "Tap to open", open_now: "Open now", open_on: "Open on the player",
    power: "Power", power_tv: "Turn the TV on or off", power_st: "Turn the player on or off", source: "Source", back: "Back", home: "Home", app: "Apps", menu: "Menu",
    up: "Up", down: "Down", left: "Left", right: "Right", rew: "Rewind", ff: "Fast forward", ch_up: "Channel up", ch_down: "Channel down",
    brightness: "Brightness", light_switch: "Turn on or off", run: "Tap to run", running: "Running",
    script_actions: "Scripts and actions", empty: "Nothing to show. Choose the entities in the configuration.",
    no_sources: "This entity exposes no selectable sources.", no_apps: "No apps configured. Add them in the configuration, Streaming player module.",
    err: "Command failed", cfg_entity: "Set a valid entity in the editor", no_app_id: "Enter the app ID in the configuration",
    tv_no_on: "This TV can't turn on by itself: set a turn-on script.", tv_no_off: "This TV can't turn off by itself: set a turn-off script.",
    st_no_power: "The player doesn't expose power control: enable ADB power or set the remote.",
    no_remote: "Set the remote in the configuration.", close: "Close", invalid: "Invalid configuration",
    tabs: "Sections", t_play: "Playback", t_mods: "Modules", t_look: "Appearance",
    play_desc: "The top panel with track, controls and the volume ring. Off: the card shows only the chosen modules.",
    e_audio: "Audio entity", e_audio_h: "The volume ring and mute (tap the number) act on this entity.",
    e_panel: "Playback panel", e_panel_h: "Track, controls and volume.", e_progress: "Progress bar", e_progress_h: "Shows position and duration when the media player provides them.",
    e_artwork: "Artwork from", e_art_audio: "Home Theater", e_art_st: "Streaming player", e_art_none: "None", e_name: "Name (optional)", e_name_h: "Empty: uses the entity name.",
    mods_desc: "Each module also works on its own. A module that is off or has no entity is not shown. Use the arrows to change the order in the card. For a card with a single module, turn off the Playback panel and leave only that module on.",
    h_tv: "State, sources, power and the single remote.", h_streaming: "State, playback, apps and power.", h_light: "Tile with switch and brightness in the popup.", h_scripts: "Tile that opens the list of your actions.",
    mod_on: "Module on", mv_up: n => `Move ${n} up`, mv_dn: n => `Move ${n} down`,
    e_tv: "TV entity", e_tv_remote: "TV remote", e_tv_remote_h: "Needed for the TV's arrows, OK, Home, Back, volume and channels.",
    e_on_script: "Turn-on script", e_on_script_h: "Optional: for TVs that can't turn on by themselves.", e_off_script: "Turn-off script", e_off_script_h: "Optional.",
    e_target: "Remote arrows, OK, Home and Back go to", e_target_h: "Power, source, volume, mute and channels always go to the TV.",
    tg_auto: "Automatic: player if on, otherwise TV", tg_tv: "Always the TV", tg_st: "Always the streaming player",
    e_st: "Player entity", e_st_remote: "Player remote", e_st_remote_h: "Optional: without a remote the keys use the player's ADB commands.",
    e_adb: "Power via ADB (Fire TV)", e_adb_h: "Android Debug Bridge integration only: uses WAKEUP and SLEEP.",
    e_show_apps: "Show apps on the card", e_apps: "Apps", e_apps_h: "For each app: icon, name and ID. With Fire TV, read the ID in Home Assistant while the app is open: Developer tools › States, the player's app_id attribute.",
    app_name: "App name", app_id: "App ID, e.g. com.example.app", app_icon: "Icon", add_app: "+ Add app", remove: "Remove",
    e_light: "Light entity", e_scripts: "Scripts", script_name: "Button name", add_script: "+ Add script",
    e_eyebrow: "Top label", e_title: "Title", e_title_h: "The green dot at the end is added by the card.",
    e_show_eyebrow: "Show top label", e_show_title: "Show title",
    e_highlight: "Colour TV and player when on", e_highlight_h: "Only their tiles. The rest of the card stays neutral.",
    e_theme: "Theme", th_auto: "Automatic (Home Assistant)", e_lang: "Language", lang_auto: "Automatic (Home Assistant)", e_lang_h: "Automatic follows the user's language in Home Assistant. If it isn't available, English is used.",
    diag: "Diagnostics", diag_h: "Shows the features each entity declares right now. Reopen the tab to refresh.",
    d_todo: "Not set", d_nf: "Entity not found", d_na: "Unavailable", d_ok: "Available", yes: "Yes", no: "No",
    f_on: "Turn on", f_off: "Turn off", f_src: "Sources", f_vol: "Volume", f_mute: "Mute", f_level: "Volume level", f_prev: "Previous", f_next: "Next"
  },
  de: {
    tv: "TV", streaming: "Streaming-Player", audio: "Heimkino", light: "TV-LED-Licht", scripts: "Skripte",
    on_f: "An", off_f: "Aus", on_m: "An", off_m: "Aus", playing: "Wiedergabe", paused: "Pausiert",
    unreachable: "Nicht erreichbar", unavailable: "Nicht verfügbar", lights_on: "An", lights_off: "Aus",
    actions: n => n === 1 ? "1 Aktion" : `${n} Aktionen`, nothing: "Keine Wiedergabe", volume: "LAUTSTÄRKE", mute: "Stumm",
    prev: "Zurück", next: "Weiter", playpause: "Wiedergabe oder Pause", vol_down: "Leiser", vol_up: "Lauter",
    sources: "Quellen", tv_sources: "TV-Quellen", inputs: "Eingänge", in_use: "Aktiv", available: "Verfügbar",
    remote: "Fernbedienung", apps: "Player-Apps", all_apps: "Alle Apps", tap_open: "Zum Öffnen tippen", open_now: "Jetzt geöffnet", open_on: "Auf dem Player öffnen",
    power: "Ein/Aus", power_tv: "TV ein- oder ausschalten", power_st: "Player ein- oder ausschalten", source: "Quelle", back: "Zurück", home: "Home", app: "Apps", menu: "Menü",
    up: "Hoch", down: "Runter", left: "Links", right: "Rechts", rew: "Zurückspulen", ff: "Vorspulen", ch_up: "Kanal hoch", ch_down: "Kanal runter",
    brightness: "Helligkeit", light_switch: "Ein- oder ausschalten", run: "Zum Starten tippen", running: "Läuft",
    script_actions: "Skripte und Aktionen", empty: "Nichts anzuzeigen. Wähle die Entitäten in der Konfiguration.",
    no_sources: "Diese Entität bietet keine auswählbaren Quellen.", no_apps: "Keine Apps konfiguriert. Füge sie in der Konfiguration im Modul Streaming-Player hinzu.",
    err: "Befehl fehlgeschlagen", cfg_entity: "Lege im Editor eine gültige Entität fest", no_app_id: "Gib die App-ID in der Konfiguration ein",
    tv_no_on: "Dieser TV schaltet sich nicht selbst ein: lege ein Einschalt-Skript fest.", tv_no_off: "Dieser TV schaltet sich nicht selbst aus: lege ein Ausschalt-Skript fest.",
    st_no_power: "Der Player bietet kein Ein/Aus: aktiviere Ein/Aus per ADB oder lege die Fernbedienung fest.",
    no_remote: "Lege die Fernbedienung in der Konfiguration fest.", close: "Schließen", invalid: "Ungültige Konfiguration",
    tabs: "Bereiche", t_play: "Wiedergabe", t_mods: "Module", t_look: "Darstellung",
    play_desc: "Das obere Feld mit Titel, Steuerung und Lautstärkering. Aus: Die Karte zeigt nur die gewählten Module.",
    e_audio: "Audio-Entität", e_audio_h: "Lautstärkering und Stummschaltung (Tippen auf die Zahl) wirken auf diese Entität.",
    e_panel: "Wiedergabefeld", e_panel_h: "Titel, Steuerung und Lautstärke.", e_progress: "Fortschrittsbalken", e_progress_h: "Zeigt Position und Dauer, wenn der Media Player sie liefert.",
    e_artwork: "Cover von", e_art_audio: "Heimkino", e_art_st: "Streaming-Player", e_art_none: "Keins", e_name: "Name (optional)", e_name_h: "Leer: Name der Entität.",
    mods_desc: "Jedes Modul funktioniert auch allein. Ein ausgeschaltetes Modul oder eines ohne Entität wird nicht angezeigt. Mit den Pfeilen änderst du die Reihenfolge. Für eine Karte mit nur einem Modul schalte das Wiedergabefeld aus und lass nur dieses Modul an.",
    h_tv: "Status, Quellen, Ein/Aus und die gemeinsame Fernbedienung.", h_streaming: "Status, Wiedergabe, Apps und Ein/Aus.", h_light: "Kachel mit Schalter und Helligkeit im Pop-up.", h_scripts: "Kachel, die die Liste deiner Aktionen öffnet.",
    mod_on: "Modul aktiv", mv_up: n => `${n} nach oben`, mv_dn: n => `${n} nach unten`,
    e_tv: "TV-Entität", e_tv_remote: "TV-Fernbedienung", e_tv_remote_h: "Für Pfeile, OK, Home, Zurück, Lautstärke und Kanäle des TV.",
    e_on_script: "Einschalt-Skript", e_on_script_h: "Optional: für TVs, die sich nicht selbst einschalten.", e_off_script: "Ausschalt-Skript", e_off_script_h: "Optional.",
    e_target: "Pfeile, OK, Home und Zurück der Fernbedienung gehen an", e_target_h: "Ein/Aus, Quelle, Lautstärke, Stumm und Kanäle gehen immer an den TV.",
    tg_auto: "Automatisch: Player, wenn an, sonst TV", tg_tv: "Immer an den TV", tg_st: "Immer an den Streaming-Player",
    e_st: "Player-Entität", e_st_remote: "Player-Fernbedienung", e_st_remote_h: "Optional: Ohne Fernbedienung nutzen die Tasten die ADB-Befehle des Players.",
    e_adb: "Ein/Aus per ADB (Fire TV)", e_adb_h: "Nur mit der Integration Android Debug Bridge: nutzt WAKEUP und SLEEP.",
    e_show_apps: "Apps auf der Karte zeigen", e_apps: "Apps", e_apps_h: "Für jede App: Symbol, Name und ID. Beim Fire TV liest du die ID in Home Assistant bei geöffneter App ab: Entwicklerwerkzeuge › Zustände, Attribut app_id des Players.",
    app_name: "App-Name", app_id: "App-ID, z. B. com.beispiel.app", app_icon: "Symbol", add_app: "+ App hinzufügen", remove: "Entfernen",
    e_light: "Licht-Entität", e_scripts: "Skripte", script_name: "Name der Taste", add_script: "+ Skript hinzufügen",
    e_eyebrow: "Obere Beschriftung", e_title: "Titel", e_title_h: "Den grünen Punkt am Ende setzt die Karte.",
    e_show_eyebrow: "Obere Beschriftung zeigen", e_show_title: "Titel zeigen",
    e_highlight: "TV und Player färben, wenn an", e_highlight_h: "Nur ihre Felder. Der Rest der Karte bleibt neutral.",
    e_theme: "Design", th_auto: "Automatisch (Home Assistant)", e_lang: "Sprache", lang_auto: "Automatisch (Home Assistant)", e_lang_h: "Automatisch folgt der Sprache des Benutzers in Home Assistant. Ist sie nicht verfügbar, wird Englisch verwendet.",
    diag: "Diagnose", diag_h: "Zeigt die Funktionen, die jede Entität gerade meldet. Öffne den Bereich erneut zum Aktualisieren.",
    d_todo: "Nicht festgelegt", d_nf: "Entität nicht gefunden", d_na: "Nicht verfügbar", d_ok: "Verfügbar", yes: "Ja", no: "Nein",
    f_on: "Einschalten", f_off: "Ausschalten", f_src: "Quellen", f_vol: "Lautstärke", f_mute: "Stumm", f_level: "Lautstärkepegel", f_prev: "Zurück", f_next: "Weiter"
  },
  fr: {
    tv: "TV", streaming: "Lecteur de streaming", audio: "Home cinéma", light: "LED de la TV", scripts: "Scripts",
    on_f: "Allumée", off_f: "Éteinte", on_m: "Allumé", off_m: "Éteint", playing: "Lecture", paused: "En pause",
    unreachable: "Injoignable", unavailable: "Indisponible", lights_on: "Allumées", lights_off: "Éteintes",
    actions: n => n === 1 ? "1 action" : `${n} actions`, nothing: "Aucune lecture", volume: "VOLUME", mute: "Muet",
    prev: "Précédent", next: "Suivant", playpause: "Lecture ou pause", vol_down: "Baisser le volume", vol_up: "Monter le volume",
    sources: "Sources", tv_sources: "Sources TV", inputs: "Entrées", in_use: "Utilisée", available: "Disponible",
    remote: "Télécommande", apps: "Apps du lecteur", all_apps: "Toutes les apps", tap_open: "Touchez pour ouvrir", open_now: "Ouverte", open_on: "Ouvrir sur le lecteur",
    power: "Marche", power_tv: "Allumer ou éteindre la TV", power_st: "Allumer ou éteindre le lecteur", source: "Source", back: "Retour", home: "Accueil", app: "Apps", menu: "Menu",
    up: "Haut", down: "Bas", left: "Gauche", right: "Droite", rew: "Retour rapide", ff: "Avance rapide", ch_up: "Chaîne suivante", ch_down: "Chaîne précédente",
    brightness: "Luminosité", light_switch: "Allumer ou éteindre", run: "Touchez pour lancer", running: "En cours",
    script_actions: "Scripts et actions", empty: "Rien à afficher. Choisissez les entités dans la configuration.",
    no_sources: "Cette entité n'expose aucune source sélectionnable.", no_apps: "Aucune app configurée. Ajoutez-les dans la configuration, module Lecteur de streaming.",
    err: "Échec de la commande", cfg_entity: "Choisissez une entité valide dans l'éditeur", no_app_id: "Saisissez l'ID de l'app dans la configuration",
    tv_no_on: "Cette TV ne s'allume pas seule : définissez un script d'allumage.", tv_no_off: "Cette TV ne s'éteint pas seule : définissez un script d'extinction.",
    st_no_power: "Le lecteur n'expose pas la mise en marche : activez la marche via ADB ou définissez la télécommande.",
    no_remote: "Définissez la télécommande dans la configuration.", close: "Fermer", invalid: "Configuration non valide",
    tabs: "Sections", t_play: "Lecture", t_mods: "Modules", t_look: "Apparence",
    play_desc: "Le panneau du haut avec titre, commandes et anneau de volume. Désactivé : la carte n'affiche que les modules choisis.",
    e_audio: "Entité audio", e_audio_h: "L'anneau de volume et le mode muet (toucher le chiffre) agissent sur cette entité.",
    e_panel: "Panneau Lecture", e_panel_h: "Titre, commandes et volume.", e_progress: "Barre de progression", e_progress_h: "Affiche la position et la durée quand le lecteur média les fournit.",
    e_artwork: "Pochette depuis", e_art_audio: "Home cinéma", e_art_st: "Lecteur de streaming", e_art_none: "Aucune", e_name: "Nom (facultatif)", e_name_h: "Vide : utilise le nom de l'entité.",
    mods_desc: "Chaque module fonctionne aussi seul. Un module désactivé ou sans entité n'apparaît pas. Les flèches changent l'ordre dans la carte. Pour une carte avec un seul module, désactivez le panneau Lecture et ne laissez que ce module actif.",
    h_tv: "État, sources, mise en marche et télécommande unique.", h_streaming: "État, lecture, apps et mise en marche.", h_light: "Tuile avec interrupteur et luminosité dans la fenêtre.", h_scripts: "Tuile qui ouvre la liste de vos actions.",
    mod_on: "Module actif", mv_up: n => `Monter ${n}`, mv_dn: n => `Descendre ${n}`,
    e_tv: "Entité TV", e_tv_remote: "Télécommande TV", e_tv_remote_h: "Sert aux flèches, OK, Accueil, Retour, volume et chaînes de la TV.",
    e_on_script: "Script d'allumage", e_on_script_h: "Facultatif : pour les TV qui ne s'allument pas seules.", e_off_script: "Script d'extinction", e_off_script_h: "Facultatif.",
    e_target: "Les flèches, OK, Accueil et Retour de la télécommande vont à", e_target_h: "Marche, source, volume, muet et chaînes vont toujours à la TV.",
    tg_auto: "Automatique : lecteur s'il est allumé, sinon TV", tg_tv: "Toujours la TV", tg_st: "Toujours le lecteur de streaming",
    e_st: "Entité lecteur", e_st_remote: "Télécommande du lecteur", e_st_remote_h: "Facultatif : sans télécommande, les touches utilisent les commandes ADB du lecteur.",
    e_adb: "Mise en marche via ADB (Fire TV)", e_adb_h: "Uniquement avec l'intégration Android Debug Bridge : utilise WAKEUP et SLEEP.",
    e_show_apps: "Afficher les apps sur la carte", e_apps: "Apps", e_apps_h: "Pour chaque app : icône, nom et ID. Avec Fire TV, lisez l'ID dans Home Assistant pendant que l'app est ouverte : Outils de développement › États, attribut app_id du lecteur.",
    app_name: "Nom de l'app", app_id: "ID de l'app, ex. com.exemple.app", app_icon: "Icône", add_app: "+ Ajouter une app", remove: "Supprimer",
    e_light: "Entité lumière", e_scripts: "Scripts", script_name: "Nom du bouton", add_script: "+ Ajouter un script",
    e_eyebrow: "Libellé supérieur", e_title: "Titre", e_title_h: "Le point vert final est ajouté par la carte.",
    e_show_eyebrow: "Afficher le libellé supérieur", e_show_title: "Afficher le titre",
    e_highlight: "Colorer la TV et le lecteur quand ils sont allumés", e_highlight_h: "Seulement leurs cadres. Le reste de la carte reste neutre.",
    e_theme: "Thème", th_auto: "Automatique (Home Assistant)", e_lang: "Langue", lang_auto: "Automatique (Home Assistant)", e_lang_h: "Automatique suit la langue de l'utilisateur dans Home Assistant. Si elle n'est pas disponible, l'anglais est utilisé.",
    diag: "Diagnostic", diag_h: "Affiche les fonctions que chaque entité déclare maintenant. Rouvrez l'onglet pour actualiser.",
    d_todo: "À configurer", d_nf: "Entité introuvable", d_na: "Indisponible", d_ok: "Disponible", yes: "Oui", no: "Non",
    f_on: "Allumage", f_off: "Extinction", f_src: "Sources", f_vol: "Volume", f_mute: "Muet", f_level: "Niveau du volume", f_prev: "Précédent", f_next: "Suivant"
  }
};
const pickLang = (cfg, hass) => {
  if (cfg && cfg !== "auto" && I18N[cfg]) return cfg;
  const l = String(hass?.locale?.language || hass?.language || (typeof navigator !== "undefined" ? navigator.language : "") || "en").slice(0, 2).toLowerCase();
  return I18N[l] ? l : "en";
};
const tr = (lang, key, ...a) => { const v = (I18N[lang] || I18N.en)[key] ?? I18N.en[key] ?? key; return typeof v === "function" ? v(...a) : v; };

/* --------------------------------------------------------------- helpers */
const entityValid = (id, domain) => typeof id === "string" && id.startsWith(domain + ".") && /^[a-z0-9_]+$/.test(id.slice(domain.length + 1));
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[c]);
const clamp = (v, min, max) => Math.min(max, Math.max(min, Number(v)));
const short = (s, fb) => (typeof s === "string" && s.trim() ? s.trim() : fb);
const validState = s => !!s && !["unavailable", "unknown"].includes(s.state);
const isOn = s => !!s && !["off", "standby", "unavailable", "unknown"].includes(s.state);
const supports = (s, f) => Number.isInteger(s?.attributes?.supported_features) && (s.attributes.supported_features & f) === f;
const iconOk = v => typeof v === "string" && /^mdi:[a-z0-9-]+$/.test(v);
const appIdOk = v => typeof v === "string" && /^[A-Za-z0-9._-]{1,120}$/.test(v);
const ico = (icon, cls = "") => `<ha-icon class="ico ${cls}" icon="${iconOk(icon) ? icon : "mdi:information-outline"}" aria-hidden="true"></ha-icon>`;
const fmtTime = s => { s = Math.max(0, Math.floor(Number(s) || 0)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = String(s % 60).padStart(2, "0"); return h ? `${h}:${String(m).padStart(2, "0")}:${x}` : `${m}:${x}`; };
const IS_PHONE = () => Math.min(window.screen?.width || 9999, window.screen?.height || 9999) < 600;

const normalize = config => {
  const src = { ...(config || {}) };
  for (const [oldKey, newKey] of Object.entries(LEGACY_KEYS)) {
    if (Object.hasOwn(src, oldKey)) { if (!Object.hasOwn(src, newKey)) src[newKey] = src[oldKey]; delete src[oldKey]; }
  }
  if (src.artwork_source === "alexa") src.artwork_source = "audio";
  if (src.artwork_source === "fire") src.artwork_source = "streaming";
  const c = { ...DEFAULT, ...src };
  if (!["auto", "light", "dark"].includes(c.theme)) c.theme = "auto";
  if (!["audio", "streaming", "none"].includes(c.artwork_source)) c.artwork_source = "audio";
  if (!["auto", "tv", "streaming"].includes(c.remote_target)) c.remote_target = "auto";
  if (c.language !== "auto" && !I18N[c.language]) c.language = "auto";
  for (const k of ["eyebrow", "title", "tv_name", "streaming_name", "audio_name", "light_name"]) c[k] = typeof c[k] === "string" ? c[k].trim().slice(0, 70) : "";
  for (const k of ["show_eyebrow", "show_title", "show_audio", "show_progress", "show_tv", "show_streaming", "show_light", "show_scripts", "highlight_on", "show_apps", "streaming_adb_power"]) c[k] = c[k] !== false && (k !== "streaming_adb_power" || c[k] === true);
  const order = Array.isArray(c.order) ? c.order.filter(k => MODULES.includes(k)) : [];
  c.order = [...new Set(order)].concat(MODULES.filter(k => !order.includes(k)));
  c.apps = Array.isArray(c.apps) ? c.apps.slice(0, 20).map(a => ({ name: String(a?.name ?? "").slice(0, 40), app_id: String(a?.app_id ?? "").trim().slice(0, 120), icon: iconOk(a?.icon) ? a.icon : "" })) : [];
  c.scripts = Array.isArray(c.scripts) ? c.scripts.slice(0, 30).map(s => ({ name: String(s?.name ?? "").slice(0, 60), entity_id: String(s?.entity_id ?? "") })) : [];
  return c;
};

/* ----------------------------------------------------------------- styles */
const PALETTE = `
:host{--p:#fafbf9;--p2:#f0f2ef;--c:#fff;--ink:#18221c;--mu:#56675c;--ln:#e0e5df;--em:#0a7156;--fg:#0a7156;--tr:#d8dfd9;--g0:#bfe9d4;--g1:#dcf3e8;--g2:#e6f4f1;--gb:#8fd0b3;--gt:#0a7156;--wbg:#f9f3de;--wbd:#d3bd63;--wfg:#5f4a10;--lit-b:color-mix(in srgb,#fff 70%,transparent);--lit-on:#0a7156}
:host([data-dark]){--p:#101211;--p2:#191c1a;--c:#282b29;--ink:#f5f7f4;--mu:#bbc5bd;--ln:#2b302c;--em:#0e795d;--fg:#f5f7f4;--tr:#323a35;--g0:#16523d;--g1:#0f372b;--g2:#13302e;--gb:#1f6b52;--gt:#6fe0b0;--wbg:#302b1b;--wbd:#816e31;--wfg:#f1d78b;--lit-b:color-mix(in srgb,#000 35%,transparent);--lit-on:#13a07a}
`;
const COMMON = `
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
[hidden]{display:none!important}
button{font:inherit;cursor:pointer;color:inherit;-webkit-user-select:none;user-select:none}
button:focus{outline:none}
button:focus-visible{outline:2px solid var(--em);outline-offset:2px}
button:disabled{cursor:not-allowed}
ha-icon.ico{display:inline-flex;align-items:center;justify-content:center;flex:none;width:18px;height:18px;--mdc-icon-size:18px;line-height:0}
ha-icon.ico.sm{width:16px;height:16px;--mdc-icon-size:16px}
ha-icon.ico.lg{width:22px;height:22px;--mdc-icon-size:22px}
@media (prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;transition:none!important}}
`;
const CARD_CSS = PALETTE + COMMON + `
:host{display:block;min-width:0;font-family:var(--ha-font-family-body,Roboto,Arial,sans-serif)}
.wrap{container-type:inline-size;min-width:0}
.mf{display:block;background:var(--p);color:var(--ink);border:1px solid var(--ln);border-radius:26px;padding:16px;min-width:0;font-size:14px;overflow:clip}
.hd{margin:2px 4px 15px;min-width:0}
.ey{font-size:10px;letter-spacing:1.7px;font-weight:750;color:var(--mu);text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:normal}
.ti{font-size:25px;font-weight:780;letter-spacing:-.7px;line-height:1.14;margin:7px 0 0;overflow-wrap:anywhere}
.ti:first-child{margin-top:0}
.ti b{color:var(--em);font-weight:800}
.stack{display:flex;flex-direction:column;gap:8px;min-width:0}
.box{background:var(--p2);border:1px solid var(--ln);border-radius:17px;padding:12px;min-width:0}
.t1{font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.t2{font-size:12px;color:var(--mu);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.b{width:36px;height:36px;border-radius:11px;border:1px solid var(--ln);background:var(--p);color:var(--ink);display:grid;place-items:center;padding:0;flex:none}
.b.on{background:color-mix(in srgb,var(--em) 14%,transparent);border-color:color-mix(in srgb,var(--em) 45%,transparent);color:var(--fg)}
.b.off{color:var(--mu)}
.b.warn{background:var(--wbg);border-color:var(--wbd);color:var(--wfg)}
.b:disabled,.app:disabled{opacity:.4}
.ring-num:disabled{opacity:1;cursor:default}
.grp{display:flex;gap:6px;align-items:center;flex:none}
.dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--em);margin-right:5px;vertical-align:1px}
.dot.off{background:var(--mu)}.dot.warn{background:var(--wbd)}
.np{display:flex;gap:10px;align-items:center;min-width:0}
.np>div:last-child{min-width:0;flex:1}
.art{width:44px;height:44px;border-radius:13px;display:grid;place-items:center;background:color-mix(in srgb,var(--em) 16%,transparent);color:var(--fg);flex:none;overflow:hidden}
.art img{width:100%;height:100%;object-fit:cover;display:block}
.prog{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:8px;align-items:center;margin-top:10px;font-size:11px;color:var(--mu);font-variant-numeric:tabular-nums;min-height:14px}
.prog i{display:block;height:4px;border-radius:4px;background:var(--tr);overflow:hidden}
.prog i b{display:block;height:100%;width:0;background:var(--em);border-radius:4px}
.ctl{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:10px}
.ring{position:relative;width:84px;height:84px;flex:none}
.ring svg{display:block;width:100%;height:100%}
.ring .vt{fill:none;stroke:var(--tr);stroke-width:9}
.ring .va{fill:none;stroke:var(--em);stroke-width:9;stroke-linecap:round;stroke-dasharray:251.3;transition:stroke-dashoffset .2s}
.ring-num{position:absolute;inset:12px;border-radius:50%;border:0;background:transparent;color:var(--ink);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0}
.ring-num strong{font-size:21px;font-weight:700;line-height:1;font-variant-numeric:tabular-nums}
.ring-num span{font-size:9px;letter-spacing:1px;color:var(--mu);font-weight:650;margin-top:4px}
.ring-num span.long{font-size:7.5px;letter-spacing:.3px}
.ring-num ha-icon.ico{color:var(--mu);margin-top:3px;width:15px;height:15px;--mdc-icon-size:15px}
.rows{padding:0 12px}
.row{display:grid;grid-template-columns:34px minmax(0,1fr) auto;gap:10px;align-items:center;padding:11px 0;min-height:60px}
.ic{width:34px;height:34px;border-radius:11px;color:var(--mu);display:grid;place-items:center;background:var(--c);transition:background .35s,color .35s}
.ic.warn{background:var(--wbg);color:var(--wfg)}
.t2.warn{color:var(--wfg)}
.dev{transition:background .35s,border-color .35s}
.dev.lit{background:radial-gradient(120% 140% at 0% 0%,var(--g0) 0%,transparent 55%),linear-gradient(135deg,var(--g1),var(--g2));border-color:var(--gb)}
:host(:not([data-dark])) .dev.lit{box-shadow:inset 0 1px 0 rgba(255,255,255,.4)}
.dev.lit .ic{background:var(--lit-on);color:#fff}
.dev.lit .t2{color:var(--gt);padding-left:5px;margin-left:-5px}
.dev.lit .dot{background:var(--gt);box-shadow:0 0 0 3px color-mix(in srgb,var(--em) 22%,transparent);animation:live 2.4s ease-in-out infinite}
@keyframes live{50%{box-shadow:0 0 0 6px color-mix(in srgb,var(--em) 0%,transparent)}}
.dev.lit .b,.dev.lit .app{background:var(--lit-b)}
.dev.lit .b.on,.dev.lit .app.act{background:var(--lit-on);border-color:var(--lit-on);color:#fff}
.dev.lit .apps{border-top-color:var(--gb)}
.apps{display:flex;gap:6px;overflow-x:auto;scroll-snap-type:x proximity;padding:10px 0 11px;scrollbar-width:none;border-top:1px solid var(--ln);overscroll-behavior-x:contain}
.apps::-webkit-scrollbar{display:none}
.app{flex:none;scroll-snap-align:start;display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 12px 0 9px;border-radius:999px;border:1px solid var(--ln);background:var(--p);color:var(--ink);font-size:12px;font-weight:600;white-space:nowrap;max-width:200px}
.app span{overflow:hidden;text-overflow:ellipsis}
.app ha-icon.ico{color:var(--mu);width:16px;height:16px;--mdc-icon-size:16px}
.app.act{background:color-mix(in srgb,var(--em) 14%,transparent);border-color:color-mix(in srgb,var(--em) 45%,transparent);color:var(--fg)}
.app.act ha-icon.ico,.dev.lit .app.act ha-icon.ico{color:inherit}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.tile{background:var(--p2);border:1px solid var(--ln);border-radius:15px;padding:11px 8px;text-align:center;min-width:0;color:var(--ink)}
.tile.span{grid-column:1/-1}
.tile .ib{width:36px;height:36px;border-radius:11px;margin:0 auto 7px;display:grid;place-items:center;background:var(--c);border:1px solid var(--ln);color:var(--mu)}
.tile.on .ib{color:var(--fg);background:color-mix(in srgb,var(--em) 14%,transparent);border-color:color-mix(in srgb,var(--em) 45%,transparent)}
.tile.warn .ib{background:var(--wbg);border-color:var(--wbd);color:var(--wfg)}
.tile .t1{font-size:13px}.tile .t2{font-size:11px}
.empty{font-size:13px;color:var(--mu);text-align:center;padding:22px 10px;border:1px dashed var(--ln);border-radius:15px;line-height:1.5}
.toast{position:fixed;left:50%;bottom:max(16px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:10000;max-width:min(410px,calc(100vw - 30px));padding:12px 14px;background:#182c24;color:#fff;border-radius:12px;box-shadow:0 10px 30px #0003;font-size:12px;line-height:1.45;pointer-events:none}
:host([data-dark]) .toast{background:#e0f4e8;color:#182d22}
@container (max-width:340px){.mf{padding:13px}.b{width:33px;height:33px}.ring{width:76px;height:76px}.ring-num strong{font-size:19px}.grp{gap:5px}.ti{font-size:23px}}
@container (max-width:300px){.ctl{flex-wrap:wrap;justify-content:center}.row{grid-template-columns:34px minmax(0,1fr)}.row .grp{grid-column:1/-1;justify-content:flex-end}}
`;
const POPUP_CSS = PALETTE + COMMON + `
:host{position:fixed;inset:0;z-index:9999;pointer-events:none;font-family:var(--ha-font-family-body,Roboto,Arial,sans-serif);color:var(--ink)}
.ov{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:#0009;font-size:14px;pointer-events:auto;
 padding:max(20px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) max(20px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left))}
.ov.open{display:flex}
.dlg{outline:none;width:min(390px,100%);min-width:0;height:min(calc(100vh - 40px),680px);height:min(calc(100dvh - 40px),680px);display:flex;flex-direction:column;background:var(--p);color:var(--ink);border:1px solid var(--ln);border-radius:26px;overflow:hidden;box-shadow:0 18px 60px #0005}
.ov.wide .dlg{width:min(1120px,100%);height:min(80vh,560px);height:min(80dvh,560px)}
.dlg.small,.ov.wide .dlg.small{width:min(390px,100%);height:auto;max-height:min(calc(100vh - 32px),680px);max-height:min(calc(100dvh - 32px),680px)}
.dlg.small .db{flex:0 1 auto}
.dh{flex:none;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:16px 16px 12px 18px;border-bottom:1px solid var(--ln);background:var(--p)}
.dh h3{margin:0;font-size:17px;font-weight:600;line-height:1.3;overflow-wrap:anywhere}
.x{width:40px;height:40px;border-radius:50%;background:var(--p2);border:1px solid var(--ln);color:var(--ink);display:grid;place-items:center;padding:0;flex:none}
.db{flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;padding:14px 18px 18px}
.ov.wide .cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:4px 18px;align-items:start}
.sec{font-size:10px;letter-spacing:1.6px;font-weight:750;color:var(--mu);margin:4px 0 8px;text-transform:uppercase;grid-column:1/-1}
.it{width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;border:0;border-radius:16px;background:var(--p2);color:var(--ink);padding:13px;margin-bottom:8px;text-align:left;min-width:0}
.it .l{display:flex;align-items:center;gap:12px;min-width:0}
.it .l>span{min-width:0;overflow-wrap:anywhere}
.it .l ha-icon.ico{color:var(--mu)}
.it.act{box-shadow:inset 0 0 0 2px var(--em)}.it.act ha-icon.ico{color:var(--fg)}
.it small{display:block;color:var(--mu);font-size:12px;margin-top:3px}
.it:disabled{opacity:.45}
.note{font-size:13px;color:var(--mu);line-height:1.55;margin:4px 2px}
.err{font-size:12px;color:var(--wfg);background:var(--wbg);border-radius:12px;padding:10px 12px;margin:10px 0 0;line-height:1.45}
.sw{width:44px;height:26px;border-radius:20px;border:0;background:#b9c4bc;padding:3px;display:flex;flex:none}
.sw:after{content:"";width:20px;height:20px;border-radius:50%;background:#fff;transition:transform .2s}
.sw.on{background:var(--em)}.sw.on:after{transform:translateX(18px)}
.sl{display:flex;align-items:center;gap:10px;color:var(--mu);min-height:58px}
.sl input{flex:1;accent-color:var(--em);min-width:0}
.sl output{width:44px;text-align:right;font-weight:600;color:var(--ink);font-variant-numeric:tabular-nums}
.spin{animation:spin .9s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
.rc{display:flex;justify-content:center;padding-top:2px}
.rmt{--rb:#f4f6f4;--rk:#fff;--rkb:#d9e0db;--rink:#18221c;--rring:#e9eeea;--cap:#6d7a72;position:relative;width:min(268px,100%);background:linear-gradient(180deg,var(--rb) 0%,color-mix(in srgb,var(--rb) 90%,#000 10%) 100%);border:1px solid var(--ln);border-radius:46px 46px 52px 52px;padding:14px 18px 18px;display:flex;flex-direction:column;gap:12px;box-shadow:inset 0 1px 0 #fff,inset 0 -10px 24px rgba(0,0,0,.04),0 14px 34px rgba(0,0,0,.10)}
:host([data-dark]) .rmt{--rb:#1e2220;--rk:#2b302d;--rkb:#3a423e;--rink:#f5f7f4;--rring:#252a27;--cap:#9aa69f;box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 14px 34px rgba(0,0,0,.45)}
.rmt:before{content:"";display:block;width:34px;height:4px;border-radius:4px;margin:0 auto -4px;background:var(--rkb)}
.rled{position:absolute;top:13px;left:50%;width:6px;height:6px;margin-left:-3px;border-radius:50%}
.rled.flash{background:var(--em);box-shadow:0 0 8px var(--em)}
.rhalf{display:flex;flex-direction:column;gap:12px;align-items:center}
.rr{display:flex;justify-content:space-between;align-items:flex-start;width:100%}
.rr.mid{align-items:center}
.kc{display:flex;flex-direction:column;align-items:center;gap:5px;font-size:10px;color:var(--cap);font-weight:600;min-width:0}
.rb{width:46px;height:46px;border-radius:50%;border:1px solid var(--rkb);background:var(--rk);color:var(--rink);display:grid;place-items:center;padding:0;box-shadow:0 2px 0 var(--rkb);transition:transform .08s,box-shadow .08s,background .2s}
.rb:disabled,.ring2 button:disabled,.rock button:disabled{opacity:.35}
.rb.pwr{color:#c0392b}:host([data-dark]) .rb.pwr{color:#ff8a7a}
.rb.pp{width:54px;height:54px;color:var(--em)}:host([data-dark]) .rb.pp{color:#6fe0b0}
.rb.sent,.rock button.sent{background:color-mix(in srgb,var(--em) 18%,var(--rk))}
.rb:active:not(:disabled),.rock button:active:not(:disabled){transform:translateY(1px);box-shadow:none}
.ring2{position:relative;width:176px;height:176px;border-radius:50%;background:var(--rring);border:1px solid var(--rkb);box-shadow:inset 0 2px 8px rgba(0,0,0,.07)}
.seg4{position:absolute;inset:0;border-radius:50%;pointer-events:none;background:conic-gradient(from var(--a,0deg),color-mix(in srgb,var(--em) 30%,transparent) 0 90deg,transparent 90deg);-webkit-mask:radial-gradient(circle,transparent 44px,#000 45px);mask:radial-gradient(circle,transparent 44px,#000 45px);opacity:0;transition:opacity .25s}
.seg4.on{opacity:1;transition:none}
.ring2 button{position:absolute;border:0;background:transparent;color:var(--rink);display:grid;place-items:center;width:52px;height:52px;border-radius:50%;padding:0}
.ring2 .u{top:2px;left:61px}.ring2 .d{bottom:2px;left:61px}.ring2 .l{left:2px;top:61px}.ring2 .r{right:2px;top:61px}
.ring2 .o{width:80px;height:80px;left:47px;top:47px;background:var(--rk);border:1px solid var(--rkb);box-shadow:0 3px 0 var(--rkb),0 6px 14px rgba(0,0,0,.08);font-weight:700;font-size:14px;letter-spacing:.5px;transition:transform .08s,box-shadow .08s,background .2s}
.ring2 .o:active:not(:disabled){transform:translateY(2px);box-shadow:0 1px 0 var(--rkb)}
.ring2 .o.sent{background:var(--em);color:#fff;border-color:var(--em)}
.rocks{display:grid;grid-template-columns:54px 1fr 54px;align-items:center;width:100%}
.rocks .kc{justify-self:center}
.rock{width:54px;height:114px;border-radius:27px;background:var(--rk);border:1px solid var(--rkb);box-shadow:0 2px 0 var(--rkb);display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:4px 0;color:var(--rink)}
.rock button{width:46px;height:46px;border-radius:50%;border:0;background:transparent;color:var(--rink);display:grid;place-items:center;padding:0;transition:background .2s}
.rock span{font-size:10px;font-weight:750;letter-spacing:1.2px;color:var(--cap)}
.ov.wide .rmt{width:auto;flex-direction:row;gap:40px;padding:22px 34px;border-radius:40px;align-items:center}
.ov.wide .rmt:before{display:none}
.ov.wide .rhalf{width:236px;gap:16px}
.ov.wide .ring2{width:188px;height:188px}
.ov.wide .ring2 .u,.ov.wide .ring2 .d{left:67px}.ov.wide .ring2 .l,.ov.wide .ring2 .r{top:67px}
.ov.wide .ring2 .o{width:84px;height:84px;left:51px;top:51px}
.ov.wide .seg4{-webkit-mask:radial-gradient(circle,transparent 46px,#000 47px);mask:radial-gradient(circle,transparent 46px,#000 47px)}
.ov.wide .rock{height:124px}
`;
const EDITOR_CSS = `
:host{display:block;color:var(--primary-text-color,#19221E);font-family:var(--ha-font-family-body,Roboto,Arial,sans-serif)}
*{box-sizing:border-box}
.ed{font-size:14px}
button,input,select{font:inherit;color:inherit}
.tabs{display:flex;gap:5px;overflow-x:auto;padding-bottom:14px;border-bottom:1px solid var(--divider-color,#E1E5E1)}
.tab{border:0;background:none;color:var(--secondary-text-color,#68716C);border-radius:13px;padding:10px 13px;white-space:nowrap;cursor:pointer}
.tab[aria-pressed="true"]{color:var(--primary-text-color,#19221E);background:var(--secondary-background-color,#F1F3EF);font-weight:650}
.heading{font-size:21px;font-weight:500;margin:25px 0 9px}
.desc{color:var(--secondary-text-color,#68716C);font-size:13px;line-height:1.5;margin-bottom:20px}
.field{display:block;margin:18px 0}
.label{font-size:14px;margin-bottom:10px}
.input{display:block;width:100%;background:var(--secondary-background-color,#F1F3EF);color:var(--primary-text-color,#19221E);border:0;border-bottom:1px solid var(--divider-color,#E1E5E1);padding:14px 13px;min-height:50px;border-radius:11px 11px 0 0}
.row{border-bottom:1px solid var(--divider-color,#E1E5E1);padding:13px 0;display:flex;align-items:center;justify-content:space-between;gap:15px}
.row label{flex:1;min-width:0}
input[type=checkbox]{width:18px;height:18px;accent-color:var(--primary-color,#064E3B);flex:none}
.muted{font-size:12px;line-height:1.5;color:var(--secondary-text-color,#68716C)}
.tiny{font-size:11px;color:var(--secondary-text-color,#68716C);margin:9px 0;line-height:1.5}
.action{background:var(--secondary-background-color,#F1F3EF);border:1px solid var(--divider-color,#E1E5E1);color:var(--primary-text-color,#19221E);padding:5px 9px;min-width:34px;border-radius:10px;cursor:pointer}
.action:disabled{opacity:.45;cursor:not-allowed}
.action.wide{padding:9px 12px;margin-top:8px}
.mod{border-bottom:1px solid var(--divider-color,#E1E5E1);padding:16px 0}
.mh{display:flex;align-items:center;gap:10px}
.mh .nm{flex:1;min-width:0;font-weight:600;font-size:15px}
.ctl{display:flex;gap:6px;flex:none}
.mb{margin-top:10px}
.chk{display:flex;align-items:center;gap:10px;margin:8px 0;font-size:13px}
.item{background:var(--secondary-background-color,#F1F3EF);border-radius:12px;padding:10px;margin-top:8px}
.item .top{display:flex;gap:8px;align-items:center}
.item .top input{flex:1;min-width:0;background:var(--card-background-color,#fff);border:0;border-bottom:1px solid var(--divider-color,#E1E5E1);border-radius:8px 8px 0 0;padding:10px}
.item .sub{margin-top:8px}
ha-selector{display:block;width:100%}
.diag{display:grid;gap:8px;margin-top:8px}
.diag-row{background:var(--secondary-background-color,#F1F3EF);border-radius:12px;padding:10px 12px}
.dn{font-size:13px;font-weight:600}.ds{font-size:12px;color:var(--secondary-text-color,#68716C);margin-top:2px}.df{font-size:12px;margin-top:6px;line-height:1.7}
.y{color:var(--primary-color,#0a7156);font-weight:650}.n{color:var(--warning-color,#b07a00);font-weight:650}
`;

/* ------------------------------------------------------------------ card */
class MediaFusionCard extends HTMLElement {
  static getConfigElement() { return document.createElement(EDITOR_TAG); }
  static getStubConfig() { return { show_eyebrow: true, show_title: true }; }
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = normalize({}); this._busy = new Set(); this._sig = ""; this._pop = null;
    this.shadowRoot.addEventListener("click", e => this._onClick(e));
  }
  setConfig(config) {
    if (config?.type && config.type !== `custom:${CARD_TAG}`) throw new Error("Invalid card type");
    const c = normalize(config);
    for (const [f, d] of [["tv_entity", "media_player"], ["streaming_entity", "media_player"], ["audio_entity", "media_player"], ["light_entity", "light"], ["tv_remote", "remote"], ["streaming_remote", "remote"], ["tv_on_script", "script"], ["tv_off_script", "script"]]) {
      if (c[f] && !entityValid(c[f], d)) throw new Error(`${tr(pickLang(c.language), "invalid")}: ${f}`);
    }
    this._config = c; this._sig = ""; this._lastVol = NaN;
    if (this.isConnected) this._render(true);
  }
  set hass(h) { this._hass = h; if (this.isConnected) this._render(false); }
  get hass() { return this._hass; }
  connectedCallback() { this._render(true); }
  disconnectedCallback() { this._closePop(); this._portal?.remove(); this._portal = null; clearTimeout(this._toastT); clearInterval(this._tick); this._tick = null; }
  getCardSize() { return 6; }
  getGridOptions() { return { columns: 12, min_columns: 6, rows: "auto", min_rows: 2 }; }

  get _l() { return pickLang(this._config.language, this._hass); }
  _t(k, ...a) { return tr(this._l, k, ...a); }
  _st(id) { return id ? this._hass?.states?.[id] : undefined; }
  _s(field) { return this._st(this._config[field]); }
  _dark() {
    const t = this._config.theme;
    if (t === "dark") return true;
    if (t === "light") return false;
    if (typeof this._hass?.themes?.darkMode === "boolean") return this._hass.themes.darkMode;
    return typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  _has(k) {
    const c = this._config;
    if (!c[MOD_FLAG[k]]) return false;
    if (k === "tv") return entityValid(c.tv_entity, "media_player");
    if (k === "streaming") return entityValid(c.streaming_entity, "media_player");
    if (k === "light") return entityValid(c.light_entity, "light");
    return c.scripts.some(s => entityValid(s.entity_id, "script"));
  }
  _hasPanel() { return this._config.show_audio && entityValid(this._config.audio_entity, "media_player"); }
  _target() {
    const t = this._config.remote_target;
    if (t === "tv" || t === "streaming") return t;
    return this._has("streaming") && isOn(this._s("streaming_entity")) ? "streaming" : "tv";
  }

  /* ---------- render ---------- */
  _render(force) {
    if (!this.shadowRoot) return;
    const dark = this._dark();
    this.toggleAttribute("data-dark", dark);
    this._portal?.toggleAttribute("data-dark", dark);
    const sig = JSON.stringify([this._l, dark, this._config, this._data(), this._pendVol?.value ?? null]);
    if (!force && sig === this._sig) return;
    this._sig = sig;
    const strip = this.shadowRoot.querySelector(".apps"), sl = strip ? strip.scrollLeft : 0;
    const focusKey = this.shadowRoot.activeElement?.dataset?.fk;
    if (!this._root) {
      this.shadowRoot.innerHTML = `<style>${CARD_CSS}</style><div class="wrap"><div class="mf"></div></div><div class="toast" role="status" aria-live="polite" hidden></div>`;
      this._root = this.shadowRoot.querySelector(".mf");
    }
    this._root.innerHTML = this._html();
    const ns = this.shadowRoot.querySelector(".apps");
    if (ns) { ns.scrollLeft = sl; if (!this._scrolled) { const a = ns.querySelector(".act"); if (a && a.offsetLeft > ns.clientWidth - 40) ns.scrollLeft = a.offsetLeft - 8; this._scrolled = true; } }
    if (focusKey) this.shadowRoot.querySelector(`[data-fk="${CSS.escape(focusKey)}"]`)?.focus({ preventScroll: true });
    this._artwork();
    this._ticker();
    this._refreshPop();
  }
  // The subset of Home Assistant state the card shows: re-rendering only when it changes keeps the card still.
  _data() {
    const pick = s => s ? [s.state, s.attributes?.friendly_name, s.attributes?.source, s.attributes?.app_id, s.attributes?.app_name, s.attributes?.media_title, s.attributes?.media_artist, s.attributes?.volume_level, s.attributes?.is_volume_muted, s.attributes?.supported_features, s.attributes?.brightness, s.attributes?.rgb_color, s.attributes?.icon, s.attributes?.media_duration, s.attributes?.media_position, s.attributes?.media_position_updated_at, s.attributes?.entity_picture] : null;
    const c = this._config;
    return [pick(this._s("tv_entity")), pick(this._s("streaming_entity")), pick(this._s("audio_entity")), pick(this._s("light_entity")), c.scripts.map(s => this._st(s.entity_id)?.state ?? null)];
  }
  _html() {
    const c = this._config, parts = [];
    let h = "";
    if (c.show_eyebrow || c.show_title) {
      const title = String(c.title || DEFAULT.title).replace(/\.+$/, "");
      h += `<div class="hd">${c.show_eyebrow ? `<div class="ey">${esc(c.eyebrow || DEFAULT.eyebrow)}</div>` : ""}${c.show_title ? `<div class="ti">${esc(title)}<b>.</b></div>` : ""}</div>`;
    }
    if (this._hasPanel()) parts.push(this._panel());
    let tiles = [];
    const flush = () => { if (tiles.length) { parts.push(`<div class="g2">${tiles.map(k => k === "light" ? this._lightTile(tiles.length === 1) : this._scriptTile(tiles.length === 1)).join("")}</div>`); tiles = []; } };
    for (const k of c.order) {
      if (!this._has(k)) continue;
      if (k === "light" || k === "scripts") tiles.push(k);
      else { flush(); parts.push(k === "tv" ? this._tv() : this._streaming()); }
    }
    flush();
    return h + `<div class="stack">${parts.length ? parts.join("") : `<div class="empty">${esc(this._t("empty"))}</div>`}</div>`;
  }
  _volInfo() {
    const c = this._config, s = this._s("audio_entity"), ok = validState(s);
    const lvl = s?.attributes?.volume_level, hasVol = ok && typeof lvl === "number" && Number.isFinite(lvl);
    const canSet = ok && supports(s, F.VOLUME_SET);
    if (!Number.isFinite(this._lastVol)) this._lastVol = this._loadVol();
    let v = hasVol ? Math.round(clamp(lvl * 100, 0, 100)) : null;
    const p = this._pendVol;
    if (p && (Date.now() > p.until || !ok || (v !== null && Math.abs(v - p.value) <= 1))) this._pendVol = null;
    if (this._pendVol) v = this._pendVol.value;
    else if (v === null && canSet && Number.isFinite(this._lastVol)) v = this._lastVol;
    return { s, ok, v, canSet, muted: s?.attributes?.is_volume_muted === true, canMute: ok && supports(s, F.VOLUME_MUTE) && typeof s?.attributes?.is_volume_muted === "boolean" };
  }
  _panel() {
    const c = this._config, { s, ok, v, canSet, muted, canMute } = this._volInfo();
    const playing = s?.state === "playing";
    const title = ok ? short(s.attributes?.media_title, this._t("nothing")) : this._t("unavailable");
    const name = short(c.audio_name, short(s?.attributes?.friendly_name, this._t("audio")));
    const sub = ok ? [short(s.attributes?.media_artist, ""), name].filter(Boolean).join(" · ") : name;
    const off = 251.3 * (1 - ((muted || v === null) ? 0 : v) / 100);
    const dis = ok ? "" : "disabled";
    const prog = c.show_progress ? `<div class="prog" data-prog><span data-pos>—:—</span><i><b></b></i><span data-dur>—:—</span></div>` : "";
    return `<div class="box">
      <div class="np"><div class="art" data-art${c.artwork_source === "none" ? " hidden" : ""}>${ico(s?.attributes?.icon && iconOk(s.attributes.icon) ? s.attributes.icon : "mdi:volume-high")}</div><div><div class="t1">${esc(title)}</div><div class="t2">${esc(sub)}</div></div></div>
      ${prog}
      <div class="ctl">
        <div class="grp">
          <button class="b" data-a="prev" data-fk="prev" aria-label="${esc(this._t("prev"))}" ${ok && supports(s, F.PREVIOUS) ? "" : "disabled"}>${ico("mdi:skip-previous")}</button>
          <button class="b on" data-a="play" data-fk="play" aria-label="${esc(this._t("playpause"))}" ${dis}>${ico(playing ? "mdi:pause" : "mdi:play")}</button>
          <button class="b" data-a="next" data-fk="next" aria-label="${esc(this._t("next"))}" ${ok && supports(s, F.NEXT) ? "" : "disabled"}>${ico("mdi:skip-next")}</button>
        </div>
        <div class="grp">
          <button class="b" data-a="vd" data-fk="vd" aria-label="${esc(this._t("vol_down"))}" ${canSet ? "" : "disabled"}>${ico("mdi:minus")}</button>
          <div class="ring"><svg viewBox="0 0 96 96" aria-hidden="true"><circle class="vt" cx="48" cy="48" r="40"></circle><circle class="va" cx="48" cy="48" r="40" transform="rotate(-90 48 48)" style="stroke-dashoffset:${off.toFixed(1)}"></circle></svg>
            <button class="ring-num" data-a="mute" data-fk="mute" aria-label="${esc(this._t("mute"))}" aria-pressed="${muted}" ${canMute ? "" : "disabled"}><strong>${v === null ? "—" : v}</strong>${muted ? ico("mdi:volume-off") : `<span${this._t("volume").length > 7 ? ' class="long"' : ""}>${esc(this._t("volume"))}</span>`}</button></div>
          <button class="b" data-a="vu" data-fk="vu" aria-label="${esc(this._t("vol_up"))}" ${canSet ? "" : "disabled"}>${ico("mdi:plus")}</button>
        </div>
      </div></div>`;
  }
  _tv() {
    const c = this._config, s = this._s("tv_entity"), ok = validState(s), on = ok && isOn(s);
    const canWake = entityValid(c.tv_on_script, "script");
    const name = short(c.tv_name, short(s?.attributes?.friendly_name, this._t("tv")));
    const meta = !ok ? `<span class="dot warn"></span>${esc(this._t("unreachable"))}` : on ? `<span class="dot"></span>${esc([this._t("on_f"), short(s.attributes?.source, "")].filter(Boolean).join(" · "))}` : `<span class="dot off"></span>${esc(this._t("off_f"))}`;
    const pw = !ok ? (canWake ? "warn" : "off") : on ? "on" : "off";
    const lit = on && c.highlight_on ? " lit" : "";
    return `<div class="box rows dev${lit}"><div class="row"><span class="ic${ok ? "" : " warn"}">${ico("mdi:television")}</span><div style="min-width:0"><div class="t1">${esc(name)}</div><div class="t2${ok ? "" : " warn"}">${meta}</div></div><div class="grp">
      <button class="b" data-pop="sources" data-fk="tvsrc" aria-label="${esc(this._t("tv_sources"))}" ${on && supports(s, F.SELECT_SOURCE) ? "" : "disabled"}>${ico("mdi:format-list-bulleted")}</button>
      <button class="b" data-pop="remote" data-fk="remote" aria-label="${esc(this._t("remote"))}">${ico("mdi:remote-tv")}</button>
      <button class="b ${pw}" data-a="tvpower" data-fk="tvpower" aria-label="${esc(this._t("power_tv"))}" ${ok || canWake ? "" : "disabled"}>${ico("mdi:power")}</button>
    </div></div></div>`;
  }
  // The open app: matched by app ID first, then by name.
  _activeApp(s) {
    if (!isOn(s)) return null;
    const at = s.attributes || {}, apps = this._config.apps;
    return apps.find(a => a.app_id && (at.app_id === a.app_id || at.source === a.app_id)) || apps.find(a => a.name && (at.app_name === a.name || at.source === a.name)) || null;
  }
  _streaming() {
    const c = this._config, s = this._s("streaming_entity"), ok = validState(s), on = ok && isOn(s);
    const name = short(c.streaming_name, short(s?.attributes?.friendly_name, this._t("streaming")));
    const active = on ? this._activeApp(s) : null;
    const appName = active ? short(active.name, active.app_id) : short(s?.attributes?.app_name, short(s?.attributes?.source, ""));
    const st = s?.state === "playing" ? this._t("playing") : s?.state === "paused" ? this._t("paused") : this._t("on_m");
    const meta = !ok ? `<span class="dot warn"></span>${esc(this._t("unavailable"))}` : on ? `<span class="dot"></span>${esc([st, appName].filter(Boolean).join(" · "))}` : `<span class="dot off"></span>${esc(this._t("off_m"))}`;
    const lit = on && c.highlight_on ? " lit" : "";
    const apps = c.show_apps && c.apps.length ? `<div class="apps" role="group" aria-label="${esc(this._t("apps"))}">${c.apps.map((a, i) => `<button class="app${active === a ? " act" : ""}" data-app="${i}" data-fk="app${i}" ${on ? "" : "disabled"}>${ico(a.icon || "mdi:application-outline")}<span>${esc(short(a.name, a.app_id || "App"))}</span></button>`).join("")}</div>` : "";
    return `<div class="box rows dev${lit}"><div class="row"><span class="ic${ok ? "" : " warn"}">${ico(iconOk(s?.attributes?.icon) ? s.attributes.icon : "mdi:television-play")}</span><div style="min-width:0"><div class="t1">${esc(name)}</div><div class="t2${ok ? "" : " warn"}">${meta}</div></div><div class="grp">
      <button class="b" data-pop="apps" data-fk="apps" aria-label="${esc(this._t("all_apps"))}" ${on ? "" : "disabled"}>${ico("mdi:apps")}</button>
      <button class="b" data-a="stplay" data-fk="stplay" aria-label="${esc(this._t("playpause"))}" ${on ? "" : "disabled"}>${ico(s?.state === "playing" ? "mdi:pause" : "mdi:play")}</button>
      <button class="b ${on ? "on" : "off"}" data-a="stpower" data-fk="stpower" aria-label="${esc(this._t("power_st"))}" ${ok ? "" : "disabled"}>${ico("mdi:power")}</button>
    </div></div>${apps}</div>`;
  }
  _lightInfo() {
    const s = this._s("light_entity"), ok = validState(s), on = ok && s.state === "on";
    const canB = on && typeof s.attributes?.brightness === "number";
    let b = canB ? Math.round(s.attributes.brightness / 255 * 100) : null;
    const p = this._pendBri;
    if (p && (Date.now() > p.until || !canB || Math.abs(b - p.value) <= 2)) this._pendBri = null;
    if (this._pendBri) b = this._pendBri.value;
    return { s, ok, on, b, dimmable: ok && (typeof s.attributes?.brightness === "number" || (Array.isArray(s.attributes?.supported_color_modes) && s.attributes.supported_color_modes.some(m => m !== "onoff"))) };
  }
  _lightTile(span) {
    const c = this._config, { s, ok, on, b } = this._lightInfo();
    const name = short(c.light_name, short(s?.attributes?.friendly_name, this._t("light")));
    const rgb = s?.attributes?.rgb_color, okRgb = on && Array.isArray(rgb) && rgb.length === 3 && rgb.every(x => Number.isInteger(x) && x >= 0 && x <= 255);
    const style = okRgb ? ` style="background:rgb(${rgb.join(",")});border-color:transparent;color:${(rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000 > 150 ? "#18221c" : "#fff"}"` : "";
    const sub = !ok ? this._t("unavailable") : on ? (b !== null ? `${this._t("lights_on")} · ${b}%` : this._t("lights_on")) : this._t("lights_off");
    return `<button class="tile${on ? " on" : ""}${ok ? "" : " warn"}${span ? " span" : ""}" data-pop="light" data-fk="light"><div class="ib"${style}>${ico(iconOk(s?.attributes?.icon) ? s.attributes.icon : "mdi:led-strip-variant")}</div><div class="t1">${esc(name)}</div><div class="t2">${esc(sub)}</div></button>`;
  }
  _scriptList() { return this._config.scripts.filter(s => entityValid(s.entity_id, "script")); }
  _scriptTile(span) {
    const n = this._scriptList().length, run = this._scriptList().some(s => this._st(s.entity_id)?.state === "on");
    return `<button class="tile on${span ? " span" : ""}" data-pop="scripts" data-fk="scripts"><div class="ib">${ico(run ? "mdi:loading" : "mdi:lightning-bolt-outline")}</div><div class="t1">${esc(this._t("scripts"))}</div><div class="t2">${esc(this._t("actions", n))}</div></button>`;
  }
  _artwork() {
    const box = this.shadowRoot.querySelector("[data-art]"); if (!box || box.hidden) return;
    const e = this._config.artwork_source === "streaming" ? this._s("streaming_entity") : this._s("audio_entity");
    const url = validState(e) ? e.attributes?.entity_picture : null;
    const ok = typeof url === "string" && url.startsWith("/") && !url.startsWith("//") && !url.includes("\\") && !/[\x00-\x1f]/.test(url);
    if (!ok) return;
    const img = document.createElement("img");
    img.alt = ""; img.loading = "lazy"; img.referrerPolicy = "same-origin"; img.hidden = true;
    img.addEventListener("load", () => { img.hidden = false; box.querySelector("ha-icon")?.setAttribute("hidden", ""); });
    img.addEventListener("error", () => img.remove());
    img.src = url; box.appendChild(img);
  }
  // Progress bar: updated every second without re-rendering the card.
  _ticker() {
    const upd = () => {
      const el = this.shadowRoot?.querySelector("[data-prog]"); if (!el) return;
      const s = this._s("audio_entity"), a = s?.attributes || {};
      const dur = Number(a.media_duration), pos0 = Number(a.media_position);
      if (!validState(s) || !Number.isFinite(dur) || dur <= 0 || !Number.isFinite(pos0)) { el.querySelector("[data-pos]").textContent = "—:—"; el.querySelector("[data-dur]").textContent = "—:—"; el.querySelector("b").style.width = "0%"; return; }
      let pos = pos0;
      const at = Date.parse(a.media_position_updated_at);
      if (s.state === "playing" && Number.isFinite(at)) pos += (Date.now() - at) / 1000;
      pos = clamp(pos, 0, dur);
      el.querySelector("[data-pos]").textContent = fmtTime(pos); el.querySelector("[data-dur]").textContent = fmtTime(dur);
      el.querySelector("b").style.width = `${(pos / dur * 100).toFixed(2)}%`;
    };
    upd();
    if (!this._tick) this._tick = setInterval(upd, 1000);
  }

  /* ---------- actions ---------- */
  async _call(domain, service, entity, data = {}, key = "", dom = domain) {
    if (!this._hass?.callService || !entityValid(entity, dom)) { this._toast(this._t("cfg_entity")); return false; }
    if (key && this._busy.has(key)) return false;
    if (key) this._busy.add(key);
    try { await this._hass.callService(domain, service, { entity_id: entity, ...data }); return true; }
    catch (err) {
      console.warn("Media Fusion Card:", domain, service, err);
      const m = `${this._t("err")}: ${String(err?.message || "").slice(0, 110)}`;
      this._toast(m);
      const e = this._pr?.querySelector("[data-err]"); if (e) { e.textContent = m; e.hidden = false; }
      return false;
    } finally { if (key) this._busy.delete(key); }
  }
  _toast(msg) {
    const el = this.shadowRoot.querySelector(".toast"); if (!el) return;
    el.textContent = msg; el.hidden = false;
    clearTimeout(this._toastT); this._toastT = setTimeout(() => { el.hidden = true; }, 4200);
  }
  _volKey() { return `media-fusion-card:volume:${this._config.audio_entity || ""}`; }
  _loadVol() { try { const r = localStorage.getItem(this._volKey()); const v = Number(r); return r !== null && Number.isFinite(v) ? clamp(Math.round(v), 0, 100) : NaN; } catch (e) { return NaN; } }
  _saveVol(n) { try { localStorage.setItem(this._volKey(), String(n)); } catch (e) { /* storage not available */ } }
  _setVol(pct) {
    const n = Math.round(clamp(pct, 0, 100));
    this._pendVol = { value: n, until: Date.now() + 3500 }; this._lastVol = n; this._saveVol(n);
    this._render(true);
    this._call("media_player", "volume_set", this._config.audio_entity, { volume_level: n / 100 }, "");
  }
  _tvPower() {
    const c = this._config, s = this._s("tv_entity");
    if (isOn(s)) {
      if (entityValid(c.tv_off_script, "script")) return this._call("script", "turn_on", c.tv_off_script, {}, "tvpower");
      if (supports(s, F.TURN_OFF)) return this._call("media_player", "turn_off", c.tv_entity, {}, "tvpower");
      return this._toast(this._t("tv_no_off"));
    }
    if (entityValid(c.tv_on_script, "script")) return this._call("script", "turn_on", c.tv_on_script, {}, "tvpower");
    if (validState(s) && supports(s, F.TURN_ON)) return this._call("media_player", "turn_on", c.tv_entity, {}, "tvpower");
    return this._toast(this._t("tv_no_on"));
  }
  _stPower() {
    const c = this._config, s = this._s("streaming_entity"), on = !isOn(s);
    if (!validState(s)) return this._toast(this._t("unavailable"));
    if (c.streaming_adb_power) return this._call("androidtv", "adb_command", c.streaming_entity, { command: on ? "WAKEUP" : "SLEEP" }, "stpower", "media_player");
    if (supports(s, on ? F.TURN_ON : F.TURN_OFF)) return this._call("media_player", on ? "turn_on" : "turn_off", c.streaming_entity, {}, "stpower");
    if (entityValid(c.streaming_remote, "remote") && validState(this._st(c.streaming_remote))) return this._call("remote", "send_command", c.streaming_remote, { command: on ? "WAKEUP" : "SLEEP" }, "stpower");
    return this._toast(this._t("st_no_power"));
  }
  // Apps: Android Debug Bridge launches an app with select_source and the app ID.
  async _openApp(i) {
    const c = this._config, a = c.apps[i], s = this._s("streaming_entity");
    if (!a || !validState(s)) return false;
    const list = Array.isArray(s.attributes?.source_list) ? s.attributes.source_list : [];
    let source = appIdOk(a.app_id) ? a.app_id : (a.name && list.includes(a.name) ? a.name : "");
    if (!source) { this._toast(this._t("no_app_id")); return false; }
    return this._call("media_player", "select_source", c.streaming_entity, { source }, `app${i}`);
  }
  _onClick(e) {
    const el = e.target.closest("button"); if (!el || el.disabled) return;
    if (el.dataset.pop) { this._openPop(el.dataset.pop, el); return; }
    if (el.dataset.app !== undefined) { this._openApp(Number(el.dataset.app)); return; }
    const c = this._config;
    switch (el.dataset.a) {
      case "play": { const s = this._s("audio_entity"); this._call("media_player", s?.state === "playing" ? "media_pause" : "media_play", c.audio_entity, {}, "play"); break; }
      case "prev": this._call("media_player", "media_previous_track", c.audio_entity, {}, "prev"); break;
      case "next": this._call("media_player", "media_next_track", c.audio_entity, {}, "next"); break;
      case "vd": case "vu": { const { v } = this._volInfo(); this._setVol((v ?? 0) + (el.dataset.a === "vu" ? 5 : -5)); break; }
      case "mute": { const s = this._s("audio_entity"); this._call("media_player", "volume_mute", c.audio_entity, { is_volume_muted: !s?.attributes?.is_volume_muted }, "mute"); break; }
      case "tvpower": this._tvPower(); break;
      case "stpower": this._stPower(); break;
      case "stplay": this._call("media_player", "media_play_pause", c.streaming_entity, {}, "stplay"); break;
    }
  }

  /* ---------- popup (portal outside the card container) ---------- */
  _ensurePortal() {
    if (this._portal) return;
    const p = document.createElement("div");
    const r = p.attachShadow({ mode: "open" });
    r.innerHTML = `<style>${POPUP_CSS}</style><div class="ov" role="dialog" aria-modal="true" aria-labelledby="dt"><div class="dlg" tabindex="-1"><div class="dh"><h3 id="dt"></h3><button class="x" data-x aria-label="">${ico("mdi:close")}</button></div><div class="db"></div></div></div>`;
    r.addEventListener("click", e => this._onPopClick(e));
    r.addEventListener("input", e => this._onPopInput(e));
    r.addEventListener("change", e => this._onPopInput(e, true));
    this._key = e => {
      if (!this._pop) return;
      if (e.key === "Escape") { e.preventDefault(); this._closePop(); return; }
      if (e.key === "Tab") {
        const b = [...r.querySelectorAll("button:not([disabled]),input:not([disabled])")]; if (!b.length) return;
        const a = r.activeElement;
        if (e.shiftKey && a === b[0]) { e.preventDefault(); b[b.length - 1].focus(); }
        else if (!e.shiftKey && a === b[b.length - 1]) { e.preventDefault(); b[0].focus(); }
      }
    };
    this._resize = () => this._size();
    document.body.appendChild(p);
    this._portal = p; this._pr = r;
    this._portal.toggleAttribute("data-dark", this._dark());
  }
  _size() { const ov = this._pr?.querySelector(".ov"); if (ov) ov.classList.toggle("wide", !IS_PHONE() && window.innerWidth >= 640 && window.innerHeight >= 600); }
  _openPop(kind, from) {
    this._ensurePortal();
    this._pop = kind; this._ret = from || null;
    this._pr.querySelector("[data-x]").setAttribute("aria-label", this._t("close"));
        this._size();
    this._fillPop(true);
    this._pr.querySelector(".ov").classList.add("open");
    document.addEventListener("keydown", this._key); window.addEventListener("resize", this._resize);
    this._pr.querySelector(".dlg").focus({ preventScroll: true });
  }
  _closePop() {
    if (!this._pop) return;
    this._pop = null;
    this._pr?.querySelector(".ov").classList.remove("open");
    document.removeEventListener("keydown", this._key); window.removeEventListener("resize", this._resize);
    if (this._ret?.isConnected) this._ret.focus({ preventScroll: true });
    else { const k = this._ret?.dataset?.fk; if (k) this.shadowRoot.querySelector(`[data-fk="${CSS.escape(k)}"]`)?.focus({ preventScroll: true }); }
    this._ret = null;
  }
  _refreshPop() { if (this._pop && this._pop !== "remote" && !this._dragging) this._fillPop(false); else if (this._pop === "remote") this._remoteState(); }
  _fillPop(first) {
    const db = this._pr.querySelector(".db"), st = db.scrollTop;
    const titles = { sources: "tv_sources", apps: "apps", remote: "remote", light: "light", scripts: "script_actions" };
    this._pr.querySelector("#dt").textContent = this._pop === "light" ? short(this._config.light_name, short(this._s("light_entity")?.attributes?.friendly_name, this._t("light"))) : this._t(titles[this._pop]);
    const err = db.querySelector("[data-err]:not([hidden])")?.textContent || "";
    db.innerHTML = this[`_pop_${this._pop}`]() + `<p class="err" data-err role="alert" ${err ? "" : "hidden"}>${esc(err)}</p>`;
    if (!first) db.scrollTop = st; else db.scrollTop = 0;
    if (this._pop === "remote") this._remoteState();
  }
  _pop_sources() {
    const s = this._s("tv_entity"), list = Array.isArray(s?.attributes?.source_list) ? s.attributes.source_list.filter(x => typeof x === "string") : [];
    if (!validState(s) || !supports(s, F.SELECT_SOURCE) || !list.length) return `<p class="note">${esc(this._t("no_sources"))}</p>`;
    return `<div class="cols"><div class="sec">${esc(this._t("inputs"))}</div>${list.map((x, i) => { const a = x === s.attributes?.source; return `<button class="it${a ? " act" : ""}" data-src="${i}"><span class="l">${ico("mdi:video-input-hdmi")}<span>${esc(x)}<small>${esc(this._t(a ? "in_use" : "available"))}</small></span></span>${a ? ico("mdi:check") : ""}</button>`; }).join("")}</div>`;
  }
  _pop_apps() {
    const c = this._config, s = this._s("streaming_entity"), on = isOn(s), cur = this._activeApp(s);
    if (c.apps.length) return `<div class="cols"><div class="sec">${esc(this._t("tap_open"))}</div>${c.apps.map((a, i) => { const act = a === cur; return `<button class="it${act ? " act" : ""}" data-papp="${i}" ${on ? "" : "disabled"}><span class="l">${ico(a.icon || "mdi:application-outline")}<span>${esc(short(a.name, a.app_id || "App"))}<small>${esc(this._t(act ? "open_now" : "open_on"))}</small></span></span>${act ? ico("mdi:check") : ""}</button>`; }).join("")}</div>`;
    // No apps configured: fall back to the player's own source list, as in earlier versions.
    const list = Array.isArray(s?.attributes?.source_list) ? s.attributes.source_list.filter(x => typeof x === "string") : [];
    if (validState(s) && supports(s, F.SELECT_SOURCE) && list.length) return `<div class="cols"><div class="sec">${esc(this._t("sources"))}</div>${list.map((x, i) => { const a = x === s.attributes?.source; return `<button class="it${a ? " act" : ""}" data-ssrc="${i}" ${on ? "" : "disabled"}><span class="l">${ico("mdi:application-outline")}<span>${esc(x)}</span></span>${a ? ico("mdi:check") : ""}</button>`; }).join("")}</div>`;
    return `<p class="note">${esc(this._t("no_apps"))}</p>`;
  }
  _pop_light() {
    const { ok, on, b, dimmable } = this._lightInfo();
    const name = short(this._config.light_name, short(this._s("light_entity")?.attributes?.friendly_name, this._t("light")));
    const sub = !ok ? this._t("unavailable") : on ? (b !== null ? `${this._t("lights_on")} · ${b}%` : this._t("lights_on")) : this._t("lights_off");
    return `<div class="cols"><div><div class="sec">${esc(this._t("light"))}</div><div class="it" style="cursor:default"><span class="l">${ico(iconOk(this._s("light_entity")?.attributes?.icon) ? this._s("light_entity").attributes.icon : "mdi:led-strip-variant")}<span>${esc(name)}<small>${esc(sub)}</small></span></span><button class="sw${on ? " on" : ""}" data-light role="switch" aria-checked="${on}" aria-label="${esc(this._t("light_switch"))}" ${ok ? "" : "disabled"}></button></div></div>
      ${dimmable ? `<div><div class="sec">${esc(this._t("brightness"))}</div><div class="it sl" style="cursor:default">${ico("mdi:white-balance-sunny")}<input type="range" min="1" max="100" step="1" value="${b ?? 0}" data-bri aria-label="${esc(this._t("brightness"))}" ${on ? "" : "disabled"}><output data-bro>${b === null ? "—" : `${b}%`}</output></div></div>` : ""}</div>`;
  }
  _pop_scripts() {
    return `<div class="cols"><div class="sec">${esc(this._t("script_actions"))}</div>${this._config.scripts.map((x, i) => {
      if (!entityValid(x.entity_id, "script")) return "";
      const st = this._st(x.entity_id), run = st?.state === "on", gone = !st || st.state === "unavailable";
      const label = short(x.name, short(st?.attributes?.friendly_name, x.entity_id));
      const icon = iconOk(st?.attributes?.icon) ? st.attributes.icon : "mdi:lightning-bolt-outline";
      return `<button class="it" data-run="${i}" ${gone || run ? "disabled" : ""}><span class="l">${run ? ico("mdi:loading", "spin") : ico(icon)}<span>${esc(label)}<small>${esc(this._t(gone ? "unavailable" : run ? "running" : "run"))}</small></span></span></button>`;
    }).join("")}</div>`;
  }
  _pop_remote() {
    const t = k => esc(this._t(k));
    const RK = (key, icon, label, cls = "", cap = "") => { const b = `<button class="rb ${cls}" data-key="${key}" aria-label="${t(label)}" title="${t(label)}">${ico(icon)}</button>`; return cap ? `<span class="kc">${b}${t(cap)}</span>` : b; };
    return `<div class="rc"><div class="rmt"><span class="rled" data-led></span>
      <div class="rhalf">
        <div class="rr">${RK("power", "mdi:power", "power_tv", "pwr", "power")}${RK("source", "mdi:login-variant", "tv_sources", "", "source")}</div>
        <div class="ring2"><span class="seg4" data-seg></span>
          <button class="u" data-key="up" data-dir="315" aria-label="${t("up")}">${ico("mdi:chevron-up", "lg")}</button>
          <button class="l" data-key="left" data-dir="225" aria-label="${t("left")}">${ico("mdi:chevron-left", "lg")}</button>
          <button class="o" data-key="ok" aria-label="OK">OK</button>
          <button class="r" data-key="right" data-dir="45" aria-label="${t("right")}">${ico("mdi:chevron-right", "lg")}</button>
          <button class="d" data-key="down" data-dir="135" aria-label="${t("down")}">${ico("mdi:chevron-down", "lg")}</button>
        </div>
        <div class="rr">${RK("back", "mdi:arrow-u-left-top", "back", "", "back")}${RK("home", "mdi:home-outline", "home", "", "home")}${RK("apps", "mdi:apps", "all_apps", "", "app")}${RK("menu", "mdi:menu", "menu", "", "menu")}</div>
      </div>
      <div class="rhalf">
        <div class="rr mid">${RK("rew", "mdi:rewind", "rew")}${RK("pp", "mdi:play-pause", "playpause", "pp")}${RK("ff", "mdi:fast-forward", "ff")}</div>
        <div class="rocks"><div class="rock"><button data-key="volup" aria-label="${t("vol_up")}">${ico("mdi:plus")}</button><span>VOL</span><button data-key="voldown" aria-label="${t("vol_down")}">${ico("mdi:minus")}</button></div>
          ${RK("mute", "mdi:volume-off", "mute", "", "mute")}
          <div class="rock"><button data-key="chup" aria-label="${t("ch_up")}">${ico("mdi:chevron-up")}</button><span>CH</span><button data-key="chdown" aria-label="${t("ch_down")}">${ico("mdi:chevron-down")}</button></div></div>
      </div></div></div>`;
  }
  // Where each remote key goes, or null when no route is configured.
  _route(key) {
    const c = this._config, tvR = entityValid(c.tv_remote, "remote") && validState(this._st(c.tv_remote)) ? c.tv_remote : "";
    const tv = this._s("tv_entity"), tvOk = this._has("tv") && validState(tv);
    if (key === "power") return this._has("tv") && (tvOk || entityValid(c.tv_on_script, "script")) ? { fn: () => this._tvPower() } : null;
    if (key === "source") return tvOk && isOn(tv) && supports(tv, F.SELECT_SOURCE) ? { fn: () => this._openPop("sources", this._ret) } : null;
    if (key === "apps") return this._has("streaming") && isOn(this._s("streaming_entity")) ? { fn: () => this._openPop("apps", this._ret) } : null;
    if (["volup", "voldown", "mute", "chup", "chdown"].includes(key)) {
      if (tvR) return { d: "remote", s: "send_command", e: tvR, data: { command: TV_KEYS[key] } };
      if (!tvOk || key.startsWith("ch")) return null;
      if (key === "mute") return supports(tv, F.VOLUME_MUTE) ? { d: "media_player", s: "volume_mute", e: c.tv_entity, data: { is_volume_muted: !tv.attributes?.is_volume_muted } } : null;
      return supports(tv, F.VOLUME_STEP) || supports(tv, F.VOLUME_SET) ? { d: "media_player", s: key === "volup" ? "volume_up" : "volume_down", e: c.tv_entity, data: {} } : null;
    }
    const target = this._target();
    if (key === "pp") {
      const ent = target === "streaming" ? c.streaming_entity : c.tv_entity, s = this._st(ent);
      return validState(s) ? { d: "media_player", s: "media_play_pause", e: ent, data: {} } : null;
    }
    if (!NAV.includes(key)) return null;
    if (target === "streaming") {
      const sr = entityValid(c.streaming_remote, "remote") && validState(this._st(c.streaming_remote)) ? c.streaming_remote : "";
      if (sr) return { d: "remote", s: "send_command", e: sr, data: { command: ADB_KEYS[key] } };
      return validState(this._s("streaming_entity")) ? { d: "androidtv", s: "adb_command", e: c.streaming_entity, data: { command: ADB_KEYS[key] }, dom: "media_player" } : null;
    }
    return tvR ? { d: "remote", s: "send_command", e: tvR, data: { command: TV_KEYS[key] } } : null;
  }
  _remoteState() {
    if (!this._pr) return;
    this._pr.querySelectorAll("[data-key]").forEach(b => { b.disabled = !this._route(b.dataset.key); });
  }
  _press(btn) {
    const key = btn.dataset.key, r = this._route(key);
    if (!r) { this._toast(this._t("no_remote")); return; }
    if (r.fn) { r.fn(); return; }
    btn.classList.add("sent"); setTimeout(() => btn.classList.remove("sent"), 220);
    const led = this._pr.querySelector("[data-led]"); if (led) { led.classList.add("flash"); setTimeout(() => led.classList.remove("flash"), 160); }
    const seg = this._pr.querySelector("[data-seg]"); if (seg && btn.dataset.dir) { seg.style.setProperty("--a", `${btn.dataset.dir}deg`); seg.classList.add("on"); setTimeout(() => seg.classList.remove("on"), 160); }
    this._call(r.d, r.s, r.e, r.data, "", r.dom || r.d);
  }
  async _onPopClick(e) {
    if (e.target.classList?.contains("ov")) { this._closePop(); return; }
    const el = e.target.closest("button"); if (!el || el.disabled) return;
    if (el.hasAttribute("data-x")) { this._closePop(); return; }
    if (el.dataset.key) { this._press(el); return; }
    const c = this._config;
    if (el.dataset.src !== undefined) {
      const s = this._s("tv_entity"), src = s?.attributes?.source_list?.[Number(el.dataset.src)];
      if (typeof src === "string" && await this._call("media_player", "select_source", c.tv_entity, { source: src }, "tvsrc")) this._closePop();
      return;
    }
    if (el.dataset.ssrc !== undefined) {
      const s = this._s("streaming_entity"), src = s?.attributes?.source_list?.[Number(el.dataset.ssrc)];
      if (typeof src === "string" && await this._call("media_player", "select_source", c.streaming_entity, { source: src }, "stsrc")) this._closePop();
      return;
    }
    if (el.dataset.papp !== undefined) { if (await this._openApp(Number(el.dataset.papp))) this._closePop(); return; }
    if (el.hasAttribute("data-light")) { const s = this._s("light_entity"); this._call("light", s?.state === "on" ? "turn_off" : "turn_on", c.light_entity, {}, "light"); return; }
    if (el.dataset.run !== undefined) { const x = c.scripts[Number(el.dataset.run)]; if (x && entityValid(x.entity_id, "script")) this._call("script", "turn_on", x.entity_id, {}, `run${el.dataset.run}`); }
  }
  _onPopInput(e, final) {
    if (!e.target.matches("[data-bri]")) return;
    const n = Math.round(clamp(e.target.value, 1, 100));
    this._dragging = !final;
    const o = this._pr.querySelector("[data-bro]"); if (o) o.textContent = `${n}%`;
    this._pendBri = { value: n, until: Date.now() + 3500 };
    clearTimeout(this._briT);
    const go = () => { this._lastBri = Date.now(); this._call("light", "turn_on", this._config.light_entity, { brightness_pct: this._pendBri?.value ?? n }); };
    const wait = final ? 0 : Math.max(0, 150 - (Date.now() - (this._lastBri || 0)));
    if (wait === 0) go(); else this._briT = setTimeout(go, wait);
    if (final) this._render(true);
  }
}

/* ---------------------------------------------------------------- editor */
class MediaFusionCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {}; this._tab = "play"; this._last = ""; this._built = false;
    this.shadowRoot.addEventListener("click", e => this._click(e));
    this.shadowRoot.addEventListener("change", e => this._change(e));
  }
  setConfig(config) {
    const j = JSON.stringify(config || {});
    if (this._built && j === this._last) return;
    this._config = JSON.parse(j); this._last = j; this._render();
  }
  set hass(h) {
    const first = !this._hass; this._hass = h;
    if (first && this._built) this._render();
    else this.shadowRoot.querySelectorAll("ha-selector").forEach(s => { s.hass = h; });
  }
  get _l() { return pickLang(this._config.language, this._hass); }
  _t(k, ...a) { return tr(this._l, k, ...a); }
  _n() { return normalize(this._config); }
  _emit(cfg) {
    this._config = cfg; this._last = JSON.stringify(cfg);
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: cfg }, bubbles: true, composed: true }));
  }
  _set(patch, rerender = false) {
    const c = { ...this._config, ...patch };
    for (const k of Object.keys(patch)) if (patch[k] === undefined || patch[k] === "") delete c[k];
    for (const [o] of Object.entries(LEGACY_KEYS)) delete c[o];
    if (!c.type) c.type = `custom:${CARD_TAG}`;
    this._emit(c);
    if (rerender) this._render();
  }
  _field(label, inner, help) { return `<div class="field"><div class="label">${esc(label)}</div>${inner}${help ? `<div class="tiny">${esc(help)}</div>` : ""}</div>`; }
  _check(id, label, help, on) { return `<div class="row"><label for="${id}">${esc(label)}${help ? `<div class="muted">${esc(help)}</div>` : ""}</label><input type="checkbox" id="${id}" ${on ? "checked" : ""}></div>`; }
  _ent(key, label, help) { return this._field(label, `<div data-slot="${key}"></div>`, help); }
  _text(id, value, max = 70, ph = "") { return `<input class="input" type="text" id="${id}" maxlength="${max}" value="${esc(value)}" placeholder="${esc(ph)}">`; }
  _select(id, opts, v) { return `<select class="input" id="${id}">${opts.map(([k, n]) => `<option value="${esc(k)}" ${v === k ? "selected" : ""}>${esc(n)}</option>`).join("")}</select>`; }

  _play(n) {
    return `<div class="heading">${esc(this._t("t_play"))}</div><div class="desc">${esc(this._t("play_desc"))}</div>` +
      this._ent("audio_entity", this._t("e_audio"), this._t("e_audio_h")) +
      this._field(this._t("e_name"), this._text("audio_name", n.audio_name, 70, this._t("audio")), this._t("e_name_h")) +
      this._check("show_audio", this._t("e_panel"), this._t("e_panel_h"), n.show_audio) +
      this._check("show_progress", this._t("e_progress"), this._t("e_progress_h"), n.show_progress) +
      this._field(this._t("e_artwork"), this._select("artwork_source", [["audio", this._t("e_art_audio")], ["streaming", this._t("e_art_st")], ["none", this._t("e_art_none")]], n.artwork_source));
  }
  _modBody(k, n) {
    if (k === "tv") return this._ent("tv_entity", this._t("e_tv")) + this._field(this._t("e_name"), this._text("tv_name", n.tv_name, 70, this._t("tv")), this._t("e_name_h")) +
      this._ent("tv_remote", this._t("e_tv_remote"), this._t("e_tv_remote_h")) + this._ent("tv_on_script", this._t("e_on_script"), this._t("e_on_script_h")) + this._ent("tv_off_script", this._t("e_off_script"), this._t("e_off_script_h")) +
      this._field(this._t("e_target"), this._select("remote_target", [["auto", this._t("tg_auto")], ["tv", this._t("tg_tv")], ["streaming", this._t("tg_st")]], n.remote_target), this._t("e_target_h"));
    if (k === "streaming") return this._ent("streaming_entity", this._t("e_st")) + this._field(this._t("e_name"), this._text("streaming_name", n.streaming_name, 70, this._t("streaming")), this._t("e_name_h")) +
      this._ent("streaming_remote", this._t("e_st_remote"), this._t("e_st_remote_h")) + this._check("streaming_adb_power", this._t("e_adb"), this._t("e_adb_h"), n.streaming_adb_power) +
      this._check("show_apps", this._t("e_show_apps"), "", n.show_apps) +
      this._field(this._t("e_apps"), n.apps.map((a, i) => `<div class="item"><div class="top"><input type="text" data-app-name="${i}" maxlength="40" value="${esc(a.name)}" placeholder="${esc(this._t("app_name"))}" aria-label="${esc(this._t("app_name"))}"><div class="ctl"><button type="button" class="action" data-amv="${i}:-1" ${i === 0 ? "disabled" : ""} aria-label="↑">↑</button><button type="button" class="action" data-amv="${i}:1" ${i === n.apps.length - 1 ? "disabled" : ""} aria-label="↓">↓</button><button type="button" class="action" data-adel="${i}" aria-label="${esc(this._t("remove"))}">✕</button></div></div><div class="top sub"><input type="text" data-app-id="${i}" maxlength="120" value="${esc(a.app_id)}" placeholder="${esc(this._t("app_id"))}" aria-label="${esc(this._t("app_id"))}" spellcheck="false" autocapitalize="off"></div><div class="sub" data-slot="app-icon-${i}"></div></div>`).join("") + `<button type="button" class="action wide" data-aadd ${n.apps.length >= 20 ? "disabled" : ""}>${esc(this._t("add_app"))}</button>`, this._t("e_apps_h"));
    if (k === "light") return this._ent("light_entity", this._t("e_light")) + this._field(this._t("e_name"), this._text("light_name", n.light_name, 70, this._t("light")), this._t("e_name_h"));
    return this._field(this._t("e_scripts"), n.scripts.map((s, i) => `<div class="item"><div class="top"><input type="text" data-script-name="${i}" maxlength="60" value="${esc(s.name)}" placeholder="${esc(this._t("script_name"))}" aria-label="${esc(this._t("script_name"))}"><div class="ctl"><button type="button" class="action" data-sdel="${i}" aria-label="${esc(this._t("remove"))}">✕</button></div></div><div class="sub" data-slot="script-${i}"></div></div>`).join("") + `<button type="button" class="action wide" data-sadd ${n.scripts.length >= 30 ? "disabled" : ""}>${esc(this._t("add_script"))}</button>`);
  }
  _mods(n) {
    const names = { tv: this._t("tv"), streaming: this._t("streaming"), light: this._t("light"), scripts: this._t("scripts") };
    let h = `<div class="heading">${esc(this._t("t_mods"))}</div><div class="desc">${esc(this._t("mods_desc"))}</div>`;
    n.order.forEach((k, i) => {
      const on = n[MOD_FLAG[k]];
      h += `<div class="mod"><div class="mh"><div class="nm">${esc(names[k])}</div><div class="ctl"><button type="button" class="action" data-move="${i}:-1" aria-label="${esc(this._t("mv_up", names[k]))}" ${i === 0 ? "disabled" : ""}>↑</button><button type="button" class="action" data-move="${i}:1" aria-label="${esc(this._t("mv_dn", names[k]))}" ${i === n.order.length - 1 ? "disabled" : ""}>↓</button></div></div>
        <div class="muted" style="margin-top:6px">${esc(this._t(`h_${k}`))}</div><div class="mb"><div class="chk"><input type="checkbox" id="${MOD_FLAG[k]}" ${on ? "checked" : ""}><label for="${MOD_FLAG[k]}">${esc(this._t("mod_on"))}</label></div>${on ? this._modBody(k, n) : ""}</div></div>`;
    });
    return h + this._diag(n);
  }
  _look(n) {
    return `<div class="heading">${esc(this._t("t_look"))}</div>` +
      this._field(this._t("e_eyebrow"), this._text("eyebrow", n.eyebrow, 60)) +
      this._field(this._t("e_title"), this._text("title", n.title, 60), this._t("e_title_h")) +
      this._check("show_eyebrow", this._t("e_show_eyebrow"), "", n.show_eyebrow) +
      this._check("show_title", this._t("e_show_title"), "", n.show_title) +
      this._check("highlight_on", this._t("e_highlight"), this._t("e_highlight_h"), n.highlight_on) +
      this._field(this._t("e_theme"), this._select("theme", [["auto", this._t("th_auto")], ["light", "Light Edera"], ["dark", "Dark Edera"]], n.theme)) +
      this._field(this._t("e_lang"), this._select("language", [["auto", this._t("lang_auto")], ...LANGS], n.language), this._t("e_lang_h"));
  }
  _diag(n) {
    const states = this._hass?.states, yn = v => `<span class="${v ? "y" : "n"}">${esc(this._t(v ? "yes" : "no"))}</span>`;
    const items = [
      [this._t("tv"), n.tv_entity, [["f_on", F.TURN_ON], ["f_off", F.TURN_OFF], ["f_src", F.SELECT_SOURCE]]],
      [this._t("audio"), n.audio_entity, [["f_level", "level"], ["f_vol", F.VOLUME_SET], ["f_mute", F.VOLUME_MUTE], ["f_prev", F.PREVIOUS], ["f_next", F.NEXT]]],
      [this._t("streaming"), n.streaming_entity, [["f_on", F.TURN_ON], ["f_off", F.TURN_OFF], ["f_src", F.SELECT_SOURCE]]],
      [this._t("light"), n.light_entity, []]
    ];
    return `<div class="heading">${esc(this._t("diag"))}</div><div class="diag">${items.map(([name, id, feats]) => {
      const st = id && states ? states[id] : undefined;
      let status, detail = "";
      if (!id) status = this._t("d_todo");
      else if (!st) status = this._t("d_nf");
      else if (!validState(st)) status = `${this._t("d_na")} (${st.state})`;
      else { status = `${this._t("d_ok")} · ${st.state}`; detail = feats.map(([k, f]) => `${esc(this._t(k))} ${yn(f === "level" ? typeof st.attributes?.volume_level === "number" : supports(st, f))}`).join(" · "); }
      return `<div class="diag-row"><div class="dn">${esc(name)}</div><div class="ds">${esc(status)}</div>${detail ? `<div class="df">${detail}</div>` : ""}</div>`;
    }).join("")}</div><p class="tiny">${esc(this._t("diag_h"))}</p>`;
  }
  _mount(slot, selector, value, cb) {
    const el = document.createElement("ha-selector");
    el.hass = this._hass; el.selector = selector; el.value = value; el.required = false;
    el.addEventListener("value-changed", ev => { ev.stopPropagation(); cb(ev.detail ? ev.detail.value : undefined); });
    slot.appendChild(el);
  }
  _render() {
    const n = this._n(), t = this._tab;
    const act = this.shadowRoot.activeElement?.id || "";
    this.shadowRoot.innerHTML = `<style>${EDITOR_CSS}</style><div class="ed"><div class="tabs" role="group" aria-label="${esc(this._t("tabs"))}">${[["play", "t_play"], ["mods", "t_mods"], ["look", "t_look"]].map(([k, l]) => `<button type="button" class="tab" data-tab="${k}" aria-pressed="${t === k}">${esc(this._t(l))}</button>`).join("")}</div>${t === "play" ? this._play(n) : t === "mods" ? this._mods(n) : this._look(n)}</div>`;
    this._built = true;
    const sl = name => this.shadowRoot.querySelector(`[data-slot="${name}"]`);
    const ents = { audio_entity: "media_player", tv_entity: "media_player", tv_remote: "remote", tv_on_script: "script", tv_off_script: "script", streaming_entity: "media_player", streaming_remote: "remote", light_entity: "light" };
    for (const [k, d] of Object.entries(ents)) { const s = sl(k); if (s) this._mount(s, { entity: { domain: d } }, n[k] || undefined, v => this._set({ [k]: v || undefined }, k === "audio_entity" || k === "tv_entity" || k === "streaming_entity" || k === "light_entity")); }
    n.apps.forEach((a, i) => { const s = sl(`app-icon-${i}`); if (s) this._mount(s, { icon: {} }, a.icon || undefined, v => { const apps = this._n().apps.map(x => ({ ...x })); if (apps[i]) { apps[i].icon = iconOk(v) ? v : ""; this._set({ apps }); } }); });
    n.scripts.forEach((x, i) => { const s = sl(`script-${i}`); if (s) this._mount(s, { entity: { domain: "script" } }, x.entity_id || undefined, v => { const scripts = this._n().scripts.map(y => ({ ...y })); if (scripts[i]) { scripts[i].entity_id = v || ""; this._set({ scripts }); } }); });
    if (act) { const el = this.shadowRoot.getElementById(act); if (el && !el.disabled) el.focus({ preventScroll: true }); }
  }
  _click(e) {
    let b = e.target.closest("[data-tab]"); if (b) { this._tab = b.dataset.tab; this._render(); return; }
    b = e.target.closest("button"); if (!b || b.disabled) return;
    const n = this._n();
    const swap = (arr, spec) => { const [i, d] = spec.split(":").map(Number), j = i + d; if (j < 0 || j >= arr.length) return null; const o = arr.slice(); [o[i], o[j]] = [o[j], o[i]]; return o; };
    if (b.dataset.move) { const o = swap(n.order, b.dataset.move); if (o) this._set({ order: o }, true); return; }
    if (b.dataset.amv) { const o = swap(n.apps, b.dataset.amv); if (o) this._set({ apps: o }, true); return; }
    if (b.dataset.adel !== undefined) { this._set({ apps: n.apps.filter((_, i) => i !== Number(b.dataset.adel)) }, true); return; }
    if (b.hasAttribute("data-aadd")) { this._set({ apps: [...n.apps, { name: "", app_id: "", icon: "" }] }, true); return; }
    if (b.dataset.sdel !== undefined) { this._set({ scripts: n.scripts.filter((_, i) => i !== Number(b.dataset.sdel)) }, true); return; }
    if (b.hasAttribute("data-sadd")) this._set({ scripts: [...n.scripts, { name: "", entity_id: "" }] }, true);
  }
  _change(e) {
    const el = e.target, n = this._n();
    if (el.type === "checkbox") {
      const rer = ["show_tv", "show_streaming", "show_light", "show_scripts"].includes(el.id);
      this._set({ [el.id]: el.checked }, rer); return;
    }
    if (["eyebrow", "title", "tv_name", "streaming_name", "audio_name", "light_name"].includes(el.id)) { this._set({ [el.id]: el.value.trim() || undefined }); return; }
    if (["artwork_source", "remote_target", "theme"].includes(el.id)) { this._set({ [el.id]: el.value }); return; }
    if (el.id === "language") { this._set({ language: el.value === "auto" ? undefined : el.value }, true); return; }
    if (el.dataset.appName !== undefined || el.dataset.appId !== undefined) {
      const i = Number(el.dataset.appName ?? el.dataset.appId), apps = n.apps.map(x => ({ ...x }));
      if (!apps[i]) return;
      if (el.dataset.appName !== undefined) apps[i].name = el.value.slice(0, 40); else apps[i].app_id = el.value.trim().slice(0, 120);
      this._set({ apps }); return;
    }
    if (el.dataset.scriptName !== undefined) { const i = Number(el.dataset.scriptName), scripts = n.scripts.map(x => ({ ...x })); if (scripts[i]) { scripts[i].name = el.value.slice(0, 60); this._set({ scripts }); } }
  }
}

if (!customElements.get(CARD_TAG)) customElements.define(CARD_TAG, MediaFusionCard);
if (!customElements.get(EDITOR_TAG)) customElements.define(EDITOR_TAG, MediaFusionCardEditor);
window.customCards = window.customCards || [];
if (!window.customCards.some(c => c.type === CARD_TAG)) window.customCards.push({
  type: CARD_TAG, name: "Media Fusion Card", description: "Controlli media, volume, telecomandi, luci e script in una card modulare", preview: true
});
console.info(`%c MEDIA-FUSION-CARD %c ${VERSION} `, "color:#fff;background:#0a7156;font-weight:700", "color:#0a7156;background:#fff");
})();
