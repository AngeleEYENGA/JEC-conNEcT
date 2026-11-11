"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { LanguageSwitcher, useLanguage } from "@/components/language-provider";

type SongId = "rally" | "anthem";
type Copy = { en: string; fr: string };

const labels: Record<string,Copy> = {
  songs:{fr:"Chants et hymnes",en:"Songs & anthems"},
  subtitle:{fr:"La mémoire vivante de nos chants, à transmettre et à faire vivre.",en:"The living memory of our songs, to share and keep alive."},
  rally:{fr:"Chant de ralliement",en:"Rallying song"},
  anthem:{fr:"Hymne de la JEC",en:"JEC anthem"},
  rallySub:{fr:"Le chant qui rassemble les jécistes.",en:"The song that brings JEC members together."},
  anthemSub:{fr:"« Chantons amis, la vie est belle »",en:"“Friends, let us sing, life is beautiful”"},
  lyrics:{fr:"Paroles",en:"Lyrics"},
  language:{fr:"Langue des paroles",en:"Lyrics language"},
  uploadLyrics:{fr:"Ajouter les paroles officielles",en:"Add the official lyrics"},
  save:{fr:"Enregistrer mon brouillon",en:"Save my draft"},
  edit:{fr:"Modifier les paroles",en:"Edit lyrics"},
  cancel:{fr:"Annuler",en:"Cancel"},
  verses:{fr:"Couplets",en:"Verses"},
  audio:{fr:"Version audio",en:"Audio version"},
  uploadAudio:{fr:"Importer un fichier audio",en:"Upload an audio file"},
  missing:{fr:"Les paroles validées n'ont pas encore été intégrées.",en:"The approved lyrics have not been added yet."},
  missingAudio:{fr:"Aucun enregistrement officiel n'est disponible dans cette démonstration.",en:"No official recording is available in this demo yet."},
  sourceNote:{fr:"Espace patrimonial en construction. Les versions officielles, les auteurs et les droits de diffusion seront renseignés après validation.",en:"Music archive in progress. Official versions, authorship and distribution rights will be added after validation."},
  frVersion:{fr:"Français",en:"French"},
  enVersion:{fr:"Anglais",en:"English"},
  intro:{fr:"Retrouve les chants qui accompagnent la vie du mouvement : rassemblements, rencontres, célébrations et moments de fraternité.",en:"Discover the songs that accompany the movement: gatherings, meetings, celebrations and moments of fellowship."},
  needLyrics:{fr:"Colle ici la version complète et validée, en séparant chaque couplet par une ligne vide. Le brouillon est enregistré uniquement sur cet appareil.",en:"Paste the complete approved version here, separating each verse with a blank line. The draft is stored only on this device."},
  localOnly:{fr:"Brouillon local — non publié",en:"Local draft — not published"},
  addAudioHint:{fr:"Le fichier reste dans ton navigateur et n'est pas téléversé sur le serveur.",en:"The file stays in your browser and is not uploaded to the server."},
  heritage:{fr:"Patrimoine musical",en:"Musical heritage"},
  home:{fr:"Retour à l'accueil",en:"Back to home"}
};

function tr(key:string, lang:"fr"|"en") {
  return labels[key]?.[lang] ?? key;
}

export default function ChantsPage() {
  const {lang}=useLanguage();
  const [selected,setSelected]=useState<SongId>("rally");
  const [lyricsLang,setLyricsLang]=useState<"fr"|"en">("fr");
  const [lyrics,setLyrics]=useState("");
  const [editing,setEditing]=useState(false);
  const [audioUrl,setAudioUrl]=useState("");
  const [audioName,setAudioName]=useState("");
  const [saved,setSaved]=useState(false);
  const audioInput=useRef<HTMLInputElement>(null);

  const storageKey = `jec-connect-song-${selected}-${lyricsLang}`;

  useEffect(()=>{
    const stored=window.localStorage.getItem(storageKey) ?? "";
    setLyrics(stored);
    setEditing(false);
    setSaved(Boolean(stored));
  },[storageKey]);

  useEffect(()=>{
    return ()=>{ if(audioUrl) URL.revokeObjectURL(audioUrl); };
  },[audioUrl]);

  const verses=useMemo(()=>lyrics.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean),[lyrics]);
  const title=selected==="rally" ? tr("rally",lang) : tr("anthem",lang);
  const songSubtitle=selected==="rally" ? tr("rallySub",lang) : tr("anthemSub",lang);

  function onAudioChange(file?:File) {
    if(!file) return;
    if(audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(URL.createObjectURL(file));
    setAudioName(file.name);
  }

  function saveLyrics() {
    window.localStorage.setItem(storageKey,lyrics);
    setSaved(true);
    setEditing(false);
  }

  return (
    <main className="songs-page">
      <header className="songs-header">
        <Link href="/" className="brand-lockup"><span className="brand-mark"><span>JEC</span><i>✳</i></span><span>conNEcT</span></Link>
        <div className="songs-header-actions"><LanguageSwitcher/><Link href="/" className="back-link-inline">← {tr("home",lang)}</Link></div>
      </header>

      <section className="songs-hero">
        <div className="songs-hero-copy">
          <p className="eyebrow light">{tr("heritage",lang).toUpperCase()} · JEC</p>
          <h1>{tr("songs",lang)}<br/><em>{lang==="fr"?"Nos voix, notre histoire.":"Our voices, our story."}</em></h1>
          <p>{tr("intro",lang)}</p>
          <div className="songs-hero-pills"><span>♫ {lang==="fr"?"Chants de rassemblement":"Gathering songs"}</span><span>♪ {lang==="fr"?"Hymnes":"Anthems"}</span><span>FR · EN</span></div>
        </div>
        <div className="songs-hero-art" aria-hidden="true">
          <img src="/images/jec-music-illustration.svg" alt="" className="songs-hero-illustration"/>
          <div className="music-orbit orbit-a"/><div className="music-orbit orbit-b"/>
          <div className="music-disc"><span>♫</span></div>
          <i className="note note-a">♪</i><i className="note note-b">♫</i><i className="note note-c">♪</i>
          <div className="music-ribbon"><b/><b/><b/><b/><b/></div>
        </div>
      </section>

      <div className="songs-content">
        <div className="songs-intro-row"><div><p className="eyebrow">{lang==="fr"?"LES VOIX DU MOUVEMENT":"THE VOICES OF THE MOVEMENT"}</p><h2>{lang==="fr"?"Le répertoire JEC":"The JEC repertoire"}</h2></div><p>{lang==="fr"?"Choisis un chant, consulte ses paroles et écoute un enregistrement lorsqu'il est disponible.":"Choose a song, read its lyrics and listen to a recording when available."}</p></div>

        <div className="song-selector">
          <button className={selected==="rally"?"song-select-card active":"song-select-card"} onClick={()=>{setSelected("rally");setAudioUrl("");setAudioName("");}}>
            <span className="song-select-icon rally-icon">✊</span><span className="song-select-meta">{lang==="fr"?"CHANT COLLECTIF":"COMMUNITY SONG"}</span><strong>{tr("rally",lang)}</strong><small>{tr("rallySub",lang)}</small><span className="select-arrow">↗</span>
          </button>
          <button className={selected==="anthem"?"song-select-card active":"song-select-card"} onClick={()=>{setSelected("anthem");setAudioUrl("");setAudioName("");}}>
            <span className="song-select-icon anthem-icon">♫</span><span className="song-select-meta">{lang==="fr"?"HYMNE OFFICIEL":"OFFICIAL ANTHEM"}</span><strong>{tr("anthem",lang)}</strong><small>{tr("anthemSub",lang)}</small><span className="select-arrow">↗</span>
          </button>
        </div>

        <section className="song-detail">
          <div className="song-detail-heading">
            <div><span className="post-tag violet">{selected==="rally"?(lang==="fr"?"CHANT DE RALLIEMENT":"RALLYING SONG"):(lang==="fr"?"HYMNE":"ANTHEM")}</span><h2>{title}</h2><p>{songSubtitle}</p></div>
            <div className="language-choice"><small>{tr("language",lang)}</small><div><button className={lyricsLang==="fr"?"active":""} onClick={()=>setLyricsLang("fr")}>FR</button><button className={lyricsLang==="en"?"active":""} onClick={()=>setLyricsLang("en")}>EN</button></div></div>
          </div>

          <div className="song-workspace-grid">
            <section className="lyrics-panel">
              <div className="panel-title"><div><p className="eyebrow">{tr("lyrics",lang).toUpperCase()}</p><h3>{lyricsLang==="fr"?tr("frVersion",lang):tr("enVersion",lang)}</h3></div><span className="lyrics-state">{verses.length? `${verses.length} ${tr("verses",lang).toLowerCase()}`:tr("localOnly",lang)}</span></div>
              {editing ? (
                <div className="lyrics-editor">
                  <textarea value={lyrics} onChange={e=>setLyrics(e.target.value)} placeholder={tr("needLyrics",lang)} rows={12}/>
                  <div className="editor-actions"><button className="quiet-button" onClick={()=>{setLyrics(window.localStorage.getItem(storageKey)??"");setEditing(false);}}>{tr("cancel",lang)}</button><button className="primary-button" onClick={saveLyrics}>{tr("save",lang)}</button></div>
                  <small>{tr("needLyrics",lang)}</small>
                </div>
              ) : verses.length ? (
                <div className="verses-list">{verses.map((verse,i)=><article className="verse-block" key={i}><span>{i===0?(lang==="fr"?"Refrain / Couplets":"Chorus / Verse"):`${tr("verses",lang)} ${i+1}`}</span><p>{verse}</p></article>)}</div>
              ) : (
                <div className="empty-lyrics"><div className="lyrics-note-icon">♪</div><h4>{tr("missing",lang)}</h4><p>{tr("needLyrics",lang)}</p><span>{tr("localOnly",lang)}</span></div>
              )}
              {!editing && <div className="lyrics-footer"><button className="primary-button" onClick={()=>setEditing(true)}>{verses.length?tr("edit",lang):tr("uploadLyrics",lang)}</button><small>{tr("sourceNote",lang)}</small></div>}
            </section>

            <aside className="audio-panel">
              <div className="audio-art"><div className="audio-art-disc"><span>♫</span></div><i className="audio-note n1">♪</i><i className="audio-note n2">♫</i><div className="audio-spectrum"><b/><b/><b/><b/><b/><b/><b/><b/><b/><b/><b/></div></div>
              <p className="eyebrow">{tr("audio",lang).toUpperCase()}</p><h3>{title}</h3>
              {audioUrl ? <><p className="audio-filename">{audioName}</p><audio controls src={audioUrl} className="audio-player"/></> : <div className="audio-empty"><span>♫</span><p>{tr("missingAudio",lang)}</p></div>}
              <input ref={audioInput} type="file" accept="audio/*" hidden onChange={e=>onAudioChange(e.target.files?.[0])}/>
              <button className="audio-upload-button" onClick={()=>audioInput.current?.click()}>＋ {tr("uploadAudio",lang)}</button>
              <small className="audio-privacy">{tr("addAudioHint",lang)}</small>
            </aside>
          </div>
        </section>

        <section className="songs-memory-banner">
          <div className="memory-icon">✧</div><div><strong>{lang==="fr"?"Un patrimoine à transmettre":"A heritage to pass on"}</strong><p>{lang==="fr"?"Les versions validées des paroles, les enregistrements historiques, les auteurs et les dates de création seront conservés dans la bibliothèque musicale de la JEC.":"Approved lyrics, historical recordings, authors and dates of composition will be preserved in the JEC music library."}</p></div>
        </section>
        <p className="songs-disclaimer">{tr("sourceNote",lang)} · {tr("localOnly",lang)}</p>
      </div>
    </main>
  );
}
