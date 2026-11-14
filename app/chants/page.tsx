"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { LanguageSwitcher, useLanguage } from "@/components/language-provider";
import { PWAInstallButton } from "@/components/pwa-install-button";
import { getAudioLocally, removeAudioLocally, saveAudioLocally } from "@/lib/audio-db";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type SongId = "rally" | "anthem";
type Copy = { en: string; fr: string };

const officialLyrics: Record<SongId, Record<"fr"|"en", string>> = {
  rally: { fr: "CHANT DE RALLIEMENT\n\n1. Nous irons jusqu’au bout du monde, la JEC ne périra pas (2x)\n\nRefrain (à reprendre)\nLa J.E.C., oui, oui, oui !\nLa J.E.C., oui, c’est vrai !\nLa J.E.C. ne périra pas (2x)\n\n2. Tous ensemble, il faut qu’on s’imprègne de l’idéal de la J.E.C. (2x)\n\nRefrain\nDe l’idéal, oui, oui, oui !\nDe l’idéal, oui, c’est vrai !\nDe l’idéal de la J.E.C. (2x)\n\n3. Travaillons avec tous nos frères à rendre meilleur le monde étudiant (2x)\n\nRefrain\nÀ rendre meilleur, oui, oui, oui !\nÀ rendre meilleur, oui, c’est vrai !\nÀ rendre meilleur le monde étudiant (2x)\n\n4. Par l’action et par la prière, nous serons forts pour changer les cœurs (2x)\n\nRefrain\nPar l’action, oui, oui, oui !\nPar la prière, oui, c’est vrai !\nNous serons forts pour changer les cœurs (2x)\n\n5. Si je meurs, il faut qu’on m’enterre à la centrale de la J.E.C. (2x)\n\nRefrain\nÀ la centrale, oui, oui, oui !\nÀ la centrale, oui, c’est vrai !\nÀ la centrale de la J.E.C. (2x)\n\n6. Ce jour-là, il faut qu’on invite les aumôniers de la JEC (2x)\n\nRefrain\nLes aumôniers, oui, oui, oui !\nLes aumôniers, oui, c’est vrai !\nLes aumôniers de la J.E.C. (2x)\n\n7. Sur ma tombe, il faut qu’on inscrive les initiales de la J.E.C. (2x)\n\nRefrain\nLes initiales, oui, oui, oui !\nLes initiales, oui, c’est vrai !\nLes initiales de la J.E.C. (2x)", en: "SONG OF RALLIEMENT — ENGLISH VERSION\n\n1. We shall go to the ends of the world and the YCS shall never perish (twice).\n\nRefrain (repeat)\nThe YCS, yes, yes, yes!\nThe YCS, yes, it’s true!\nThe YCS shall never perish (twice).\n\n2. Together, we have to be filled with the ideal of the YCS (twice).\n\nRefrain\nThe ideal, yes, yes, yes!\nThe ideal, yes, it’s true!\nThe ideal of the YCS (twice).\n\n3. Let us work with all our brothers to make the student world a better place (twice).\n\nRefrain\nTo make it better, yes, yes, yes!\nTo make it better, yes, it’s true!\nTo make the student world better (twice).\n\n4. By action and prayer, we shall be strong enough to change hearts (twice).\n\nRefrain\nBy action, yes, yes, yes!\nBy prayer, yes, it’s true!\nWe shall be strong enough to change hearts (twice).\n\n5. If I die, I shall be buried at the centre of the YCS (twice).\n\nRefrain\nAt the centre, yes, yes, yes!\nAt the centre, yes, it’s true!\nAt the centre of the YCS (twice).\n\n6. On that day, we must invite the YCS chaplains (twice).\n\nRefrain\nThe chaplains, yes, yes, yes!\nThe chaplains, yes, it’s true!\nThe chaplains of the YCS (twice).\n\n7. On my tomb, the initials of the YCS must be written (twice).\n\nRefrain\nThe initials, yes, yes, yes!\nThe initials, yes, it’s true!\nThe initials of the YCS (twice)." },
  anthem: { fr: "HYMNE DE LA JEC — FRANÇAIS\n\nREFRAIN\nChantons amis, la vie est belle,\nPour nos cœurs joyeux et fervents ;\nJécistes, le Christ nous appelle (2x)\nVers l’avenir, en avant (2x).\n\nCOUPLET\nNous sommes la jeunesse ardente,\nPhalanges sans regret ni peur,\nEt dans nos poitrines vibrantes\nBat le cœur du Christ Rédempteur.\n\nPortons à travers les écoles\nSon nom, sa loi, sa charité ;\nQue tous entendent ses paroles,\nQu’ils naissent à la vérité.", en: "YCS HYMN — ENGLISH VERSION\n\nCHORUS\nLet us sing, friends, life is beautiful,\nFor our joyful and fervent hearts;\nYoung Christian Students, Christ calls us (twice),\nTowards the future, forward (twice).\n\nSTANZA\nWe are the fiery youth,\nPhalanxes without regret or fear,\nAnd in our vibrant hearts\nBeats the heart of Christ the Redeemer.\n\nLet us carry through the schools\nHis name, His law, His charity;\nMay everyone hear His words,\nAnd be born into the truth." }
};

const officialSources: Record<SongId, Record<"fr"|"en", string>> = {
  "rally": {
    "fr": "Chant_de_ralliement_JEC_avec_logo.docx",
    "en": "YCS_Rallying_Chant_EN.docx"
  },
  "anthem": {
    "fr": "Hymne_principal_JEC.docx",
    "en": "YCS_Main_Hymn_EN.docx"
  }
};

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
  missing:{fr:"Le texte issu du document JEC est affiché ci-dessous.",en:"The text from the JEC source document is shown below."},
  sourceLabel:{fr:"Document source",en:"Source document"},
  sourceValidation:{fr:"Texte transcrit depuis le document fourni ; la validation éditoriale finale reste à confirmer.",en:"Transcribed from the supplied document; final editorial approval remains to be confirmed."},
  restore:{fr:"Revenir au texte source",en:"Restore source text"},
  draftSaved:{fr:"Modifications locales enregistrées",en:"Local changes saved"},
  officialText:{fr:"Texte source",en:"Source text"},
  missingAudio:{fr:"Aucun enregistrement officiel n'est disponible dans cette démonstration.",en:"No official recording is available in this demo yet."},
  sourceNote:{fr:"Espace patrimonial en construction. Les versions officielles, les auteurs et les droits de diffusion seront renseignés après validation.",en:"Music archive in progress. Official versions, authorship and distribution rights will be added after validation."},
  frVersion:{fr:"Français",en:"French"},
  enVersion:{fr:"Anglais",en:"English"},
  intro:{fr:"Retrouve les chants qui accompagnent la vie du mouvement : rassemblements, rencontres, célébrations et moments de fraternité.",en:"Discover the songs that accompany the movement: gatherings, meetings, celebrations and moments of fellowship."},
  needLyrics:{fr:"Colle ici la version complète et validée, en séparant chaque couplet par une ligne vide. Le brouillon est enregistré uniquement sur cet appareil.",en:"Paste the complete approved version here, separating each verse with a blank line. The draft is stored only on this device."},
  localOnly:{fr:"Brouillon local — non publié",en:"Local draft — not published"},
  addAudioHint:{fr:"Connecte-toi pour publier cet enregistrement dans la bibliothèque commune.",en:"Sign in to publish this recording to the shared music library."},
  saveAudio:{fr:"Enregistrer et publier pour tous",en:"Save and publish for everyone"},
  audioSaved:{fr:"Audio enregistré sur cet appareil",en:"Audio saved on this device"},
  audioCloudSaved:{fr:"Audio enregistré dans la bibliothèque commune.",en:"Audio saved to the shared music library."},
  audioPublished:{fr:"Version officielle publiée : elle est désormais accessible à tout le monde.",en:"Official version published: it is now available to everyone."},
  publishAudio:{fr:"Publier la version officielle",en:"Publish official version"},
  publishPending:{fr:"La publication rendra ce fichier accessible à toutes les personnes qui consultent la bibliothèque musicale.",en:"Publishing this file will make it accessible to everyone viewing the music library."},
  publicBadge:{fr:"VERSION PUBLIQUE OFFICIELLE",en:"OFFICIAL PUBLIC VERSION"},
  cloudPending:{fr:"Connecte-toi pour enregistrer cet audio dans la bibliothèque commune.",en:"Sign in to save this audio to the shared music library."},
  retryCloud:{fr:"Réessayer la synchronisation",en:"Retry cloud sync"},
  audioCloudPrivate:{fr:"Audio enregistré dans la bibliothèque commune.",en:"Audio saved to the shared music library."},
  removeAudio:{fr:"Supprimer l’audio enregistré",en:"Remove saved audio"},
  downloadAudio:{fr:"Télécharger",en:"Download"},
  localStorageLimit:{fr:"Tout enregistrement envoyé dans la bibliothèque sera public : vérifie que tu disposes des droits de diffusion.",en:"Every recording uploaded to the library will be public: make sure you have permission to share it."},
  heritage:{fr:"Patrimoine musical",en:"Musical heritage"},
  home:{fr:"Retour à l'accueil",en:"Back to home"}
};

function tr(key:string, lang:"fr"|"en") {
  return labels[key]?.[lang] ?? key;
}

function getUploadAudioMimeType(file:File):string {
  const detected=(file.type||"").toLowerCase().trim();
  // Some browsers report AAC/ADTS recordings with this vendor MIME type.
  // Store them as standard AAC while keeping the original extension and bytes.
  if(detected==="audio/vnd.dna.adts") return "audio/aac";
  return detected||"application/octet-stream";
}

export default function ChantsPage() {
  const {lang}=useLanguage();
  const [selected,setSelected]=useState<SongId>("rally");
  const [lyricsLang,setLyricsLang]=useState<"fr"|"en">("fr");
  const [lyrics,setLyrics]=useState("");
  const [editing,setEditing]=useState(false);
  const [audioUrl,setAudioUrl]=useState("");
  const [audioName,setAudioName]=useState("");
  const [audioFile,setAudioFile]=useState<File|null>(null);
  const [audioSaved,setAudioSaved]=useState(false);
  const [audioCloudSaved,setAudioCloudSaved]=useState(false);
  const [audioIsPublic,setAudioIsPublic]=useState(false);
  const [audioMetaId,setAudioMetaId]=useState<string|null>(null);
  const [isAdmin,setIsAdmin]=useState(false);
  const [audioStatus,setAudioStatus]=useState("");
  const [savingAudio,setSavingAudio]=useState(false);
  const [saved,setSaved]=useState(false);
  const audioInput=useRef<HTMLInputElement>(null);

  const storageKey = `jec-connect-song-${selected}-${lyricsLang}-v5`;
  const audioStorageKey = `jec-connect-audio-${selected}-${lyricsLang}`;

  useEffect(()=>{
    const stored=window.localStorage.getItem(storageKey);
    setLyrics(stored ?? officialLyrics[selected][lyricsLang]);
    setEditing(false);
    setSaved(Boolean(stored));
  },[storageKey]);

  useEffect(()=>{
    let cancelled=false;
    async function restoreAudio(){
      const supabase=getSupabaseBrowserClient();
      try{
        if(supabase){
          const {data:{user}}=await supabase.auth.getUser();
          if(user){
            const {data:adminFlag}=await supabase.rpc("is_jec_admin");
            if(!cancelled)setIsAdmin(adminFlag===true);
          }
          const {data:publishedRows}=await supabase.from("jec_song_audio")
            .select("id,storage_path,file_name,mime_type,bucket_id")
            .eq("song_id",selected).eq("language",lyricsLang)
            .eq("is_published",true).eq("bucket_id","jec-audio")
            .order("published_at",{ascending:false}).limit(1);
          const published=publishedRows?.[0];
          if(published){
            const {data:publicFile}=supabase.storage.from("jec-audio").getPublicUrl(published.storage_path);
            if(!cancelled){
              setAudioFile(null);setAudioName(published.file_name);setAudioUrl(publicFile.publicUrl);
              setAudioSaved(true);setAudioCloudSaved(true);setAudioIsPublic(true);setAudioMetaId(published.id);
              setAudioStatus(tr("audioPublished",lang));return;
            }
          }
          if(user){
            const {data:rows}=await supabase.from("jec_song_audio")
              .select("id,storage_path,file_name,mime_type,bucket_id")
              .eq("song_id",selected).eq("language",lyricsLang)
              .eq("uploaded_by",user.id).eq("bucket_id","jec-audio").eq("is_published",false)
              .order("created_at",{ascending:false}).limit(1);
            const row=rows?.[0];
            if(row){
              const {data:signed}=await supabase.storage.from("jec-audio").createSignedUrl(row.storage_path,3600);
              if(signed?.signedUrl){
                const response=await fetch(signed.signedUrl);
                if(response.ok){
                  const blob=await response.blob();
                  const file=new File([blob],row.file_name,{type:row.mime_type||blob.type||"audio/mpeg"});
                  if(cancelled)return;
                  setAudioFile(file);setAudioName(file.name);setAudioUrl(URL.createObjectURL(file));
                  setAudioSaved(true);setAudioCloudSaved(true);setAudioIsPublic(false);setAudioMetaId(row.id);
                  setAudioStatus(tr("audioCloudPrivate",lang));return;
                }
              }
            }
          }
        }
        // Old local rally audio was once incorrectly associated with the anthem file.
        // Never restore that stale local copy; the correct rally recording will be uploaded separately.
        const localFile=selected==="rally" ? (await removeAudioLocally(audioStorageKey),null) : await getAudioLocally(audioStorageKey);
        if(cancelled)return;
        if(localFile){
          setAudioFile(localFile);setAudioName(localFile.name);setAudioUrl(URL.createObjectURL(localFile));
          setAudioSaved(true);setAudioCloudSaved(false);setAudioIsPublic(false);setAudioMetaId(null);
          setAudioStatus(tr("audioSaved",lang));
        }else{
          setAudioFile(null);setAudioName("");setAudioUrl("");setAudioSaved(false);
          setAudioCloudSaved(false);setAudioIsPublic(false);setAudioMetaId(null);setAudioStatus("");
        }
      }catch(error){
        if(!cancelled)setAudioStatus(error instanceof Error?error.message:(lang==="fr"?"Impossible de restaurer cet audio.":"Unable to restore this audio."));
      }
    }
    void restoreAudio();
    return ()=>{cancelled=true;};
  },[audioStorageKey]);

  useEffect(()=>{
    return ()=>{ if(audioUrl.startsWith("blob:")) URL.revokeObjectURL(audioUrl); };
  },[audioUrl]);

  const verses=useMemo(()=>lyrics.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean),[lyrics]);
  const title=selected==="rally" ? tr("rally",lang) : tr("anthem",lang);
  const songSubtitle=selected==="rally" ? tr("rallySub",lang) : tr("anthemSub",lang);

  function onAudioChange(file?:File) {
    if(!file) return;
    if(audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioFile(file);
    setAudioUrl(URL.createObjectURL(file));
    setAudioName(file.name);
    setAudioSaved(false);
    setAudioCloudSaved(false);
    setAudioIsPublic(false);
    setAudioMetaId(null);
    setAudioStatus(lang==="fr"?"Nouvel audio sélectionné — pense à l’enregistrer.":"New audio selected — remember to save it.");
  }

  async function saveAudio() {
    if(!audioFile) return;
    setSavingAudio(true);
    setAudioStatus("");
    let localSaveComplete=false;
    try {
      const supabase=getSupabaseBrowserClient();
      if(!supabase){
        setAudioStatus(tr("cloudPending",lang));
        return;
      }
      const {data:{user},error:authError}=await supabase.auth.getUser();
      if(authError || !user){
        setAudioStatus(tr("cloudPending",lang));
        return;
      }
      await saveAudioLocally(audioStorageKey,audioFile);
      localSaveComplete=true;
      setAudioSaved(true);
      setAudioStatus(tr("audioSaved",lang));
      const safeName=audioFile.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g,"_").slice(-100) || "audio";
      const uploadMimeType=getUploadAudioMimeType(audioFile);
      // Clone the bytes into a Blob whose own MIME type is normalized too.
      // Some browser/SDK combinations prefer File.type over FileOptions.contentType.
      const normalizedAudio=audioFile.slice(0,audioFile.size,uploadMimeType);
      const storagePath=user.id+"/"+selected+"/"+lyricsLang+"/"+safeName;
      const {error:uploadError}=await supabase.storage.from("jec-audio").upload(storagePath,normalizedAudio,{
        contentType:uploadMimeType,
        upsert:true
      });
      if(uploadError){
        setAudioStatus(tr("audioSaved",lang)+" · "+uploadError.message);
        return;
      }
      const {data:metadataRow,error:metadataError}=await supabase.from("jec_song_audio").upsert({
        song_id:selected,
        language:lyricsLang,
        storage_path:storagePath,
        file_name:audioFile.name,
        mime_type:uploadMimeType,
        file_size:audioFile.size,
        uploaded_by:user.id,
        bucket_id:"jec-audio",
        is_published:true,
        published_at:new Date().toISOString(),
        published_by:user.id
      },{onConflict:"storage_path"}).select("id").single();
      if(metadataError){
        setAudioStatus(tr("audioSaved",lang)+" · "+metadataError.message);
        return;
      }
      setAudioCloudSaved(true);
      setAudioIsPublic(true);
      setAudioMetaId(metadataRow?.id??null);
      const {data:publicFile}=supabase.storage.from("jec-audio").getPublicUrl(storagePath);
      setAudioUrl(publicFile.publicUrl);
      setAudioStatus(tr("audioPublished",lang));
    } catch(error) {
      setAudioSaved(localSaveComplete);
      setAudioStatus(localSaveComplete
        ? tr("audioSaved",lang)+" · "+(error instanceof Error?error.message:"Cloud sync failed.")
        : (error instanceof Error ? error.message : (lang==="fr"?"Impossible d'enregistrer cet audio.":"Unable to save this audio.")));
    } finally {
      setSavingAudio(false);
    }
  }

  async function publishAudio(){
    const supabase=getSupabaseBrowserClient();
    if(!supabase||!isAdmin||!audioMetaId)return;
    setSavingAudio(true);setAudioStatus("");
    try{
      const {data:{user}}=await supabase.auth.getUser();
      const {data:draft,error:draftError}=await supabase.from("jec_song_audio")
        .select("id,storage_path,file_name,mime_type,bucket_id")
        .eq("id",audioMetaId).single();
      if(draftError||!draft)throw draftError??new Error("Audio draft not found.");
      if(draft.bucket_id==="jec-audio-public"){
        const {data:publicInfo}=supabase.storage.from("jec-audio-public").getPublicUrl(draft.storage_path);
        setAudioUrl(publicInfo.publicUrl);setAudioIsPublic(true);setAudioStatus(tr("audioPublished",lang));return;
      }
      const {data:file,error:downloadError}=await supabase.storage.from("jec-audio").download(draft.storage_path);
      if(downloadError||!file)throw downloadError??new Error("Unable to retrieve the private audio.");
      const safeName=(draft.file_name||"audio").normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g,"_").slice(-100)||"audio";
      const publicPath="official/"+selected+"/"+lyricsLang+"/"+Date.now()+"-"+safeName;
      const {error:uploadError}=await supabase.storage.from("jec-audio-public").upload(publicPath,file,{
        contentType:draft.mime_type||file.type||"audio/mpeg",upsert:false
      });
      if(uploadError)throw uploadError;
      const {error:updateError}=await supabase.from("jec_song_audio").update({
        bucket_id:"jec-audio-public",storage_path:publicPath,is_published:true,
        published_at:new Date().toISOString(),published_by:user?.id??null
      }).eq("id",draft.id);
      if(updateError){
        await supabase.storage.from("jec-audio-public").remove([publicPath]);
        throw updateError;
      }
      const {data:publicInfo}=supabase.storage.from("jec-audio-public").getPublicUrl(publicPath);
      setAudioUrl(publicInfo.publicUrl);setAudioFile(null);setAudioCloudSaved(true);setAudioIsPublic(true);
      setAudioStatus(tr("audioPublished",lang));
    }catch(error){
      setAudioStatus(error instanceof Error?error.message:(lang==="fr"?"Impossible de publier cet audio.":"Unable to publish this audio."));
    }finally{setSavingAudio(false);}
  }

  async function deleteSavedAudio() {
    try {
      if(audioMetaId&&!audioIsPublic){
        const supabase=getSupabaseBrowserClient();
        if(supabase){
          const {data:record}=await supabase.from("jec_song_audio").select("storage_path").eq("id",audioMetaId).maybeSingle();
          if(record?.storage_path)await supabase.storage.from("jec-audio").remove([record.storage_path]);
          const {error:deleteError}=await supabase.from("jec_song_audio").delete().eq("id",audioMetaId);
          if(deleteError)throw deleteError;
        }
      }
      await removeAudioLocally(audioStorageKey);
      setAudioSaved(false);setAudioCloudSaved(false);setAudioIsPublic(false);setAudioMetaId(null);
      setAudioFile(null);setAudioName("");
      if(audioUrl.startsWith("blob:"))URL.revokeObjectURL(audioUrl);
      setAudioUrl("");
      setAudioStatus(lang==="fr"?"Audio supprimé de ton espace.":"Audio removed from your space.");
    }catch(error){
      setAudioStatus(error instanceof Error?error.message:(lang==="fr"?"Impossible de supprimer cet audio.":"Unable to remove this audio."));
    }
  }

  function saveLyrics() {
    window.localStorage.setItem(storageKey,lyrics);
    setSaved(true);
    setEditing(false);
  }

  function restoreOfficialLyrics() {
    window.localStorage.removeItem(storageKey);
    setLyrics(officialLyrics[selected][lyricsLang]);
    setSaved(false);
    setEditing(false);
  }

  return (
    <main className="songs-page">
      <header className="songs-header">
        <Link href="/" className="brand-lockup"><span className="brand-mark"><span>JEC</span><i aria-hidden="true">✝</i></span><span>conNEcT</span></Link>
        <div className="songs-header-actions"><PWAInstallButton/><LanguageSwitcher/><Link href="/" className="back-link-inline">← {tr("home",lang)}</Link></div>
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
          <button className={selected==="rally"?"song-select-card active":"song-select-card"} onClick={()=>{setSelected("rally");setAudioUrl("");setAudioName("");setAudioFile(null);setAudioSaved(false);setAudioCloudSaved(false);setAudioIsPublic(false);setAudioMetaId(null);setAudioStatus("");}}>
            <span className="song-select-icon rally-icon">✊</span><span className="song-select-meta">{lang==="fr"?"CHANT COLLECTIF":"COMMUNITY SONG"}</span><strong>{tr("rally",lang)}</strong><small>{tr("rallySub",lang)}</small><span className="select-arrow">↗</span>
          </button>
          <button className={selected==="anthem"?"song-select-card active":"song-select-card"} onClick={()=>{setSelected("anthem");setAudioUrl("");setAudioName("");setAudioFile(null);setAudioSaved(false);setAudioCloudSaved(false);setAudioIsPublic(false);setAudioMetaId(null);setAudioStatus("");}}>
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
              <div className="panel-title"><div><p className="eyebrow">{tr("lyrics",lang).toUpperCase()}</p><h3>{lyricsLang==="fr"?tr("frVersion",lang):tr("enVersion",lang)}</h3></div><span className="lyrics-state">{saved?tr("draftSaved",lang):tr("officialText",lang)}</span></div>
              {editing ? (
                <div className="lyrics-editor">
                  <textarea value={lyrics} onChange={e=>setLyrics(e.target.value)} placeholder={tr("needLyrics",lang)} rows={12}/>
                  <div className="editor-actions"><button className="quiet-button" onClick={()=>{setLyrics(window.localStorage.getItem(storageKey)??officialLyrics[selected][lyricsLang]);setEditing(false);}}>{tr("cancel",lang)}</button><button className="primary-button" onClick={saveLyrics}>{tr("save",lang)}</button></div>
                  <small>{tr("needLyrics",lang)}</small>
                </div>
              ) : verses.length ? (
                <div className="verses-list">{verses.map((verse,i)=><article className="verse-block" key={i}><span>{tr("verses",lang)} {i+1}</span><p>{verse}</p></article>)}</div>
              ) : (
                <div className="empty-lyrics"><div className="lyrics-note-icon">♪</div><h4>{tr("missing",lang)}</h4><p>{tr("needLyrics",lang)}</p><span>{tr("localOnly",lang)}</span></div>
              )}
              {!editing && <div className="lyrics-footer"><div className="lyrics-source-meta"><strong>{tr("sourceLabel",lang)} : {officialSources[selected][lyricsLang]}</strong><small>{tr("sourceValidation",lang)}</small><small>{tr("sourceNote",lang)}</small></div><div className="lyrics-actions"><button className="quiet-button" onClick={restoreOfficialLyrics}>{tr("restore",lang)}</button><button className="primary-button" onClick={()=>setEditing(true)}>{tr("edit",lang)}</button></div></div>}
            </section>

            <aside className="audio-panel">
              <div className="audio-art"><div className="audio-art-disc"><span>♫</span></div><i className="audio-note n1">♪</i><i className="audio-note n2">♫</i><div className="audio-spectrum"><b/><b/><b/><b/><b/><b/><b/><b/><b/><b/><b/></div></div>
              <p className="eyebrow">{tr("audio",lang).toUpperCase()}</p><h3>{title}</h3>{audioIsPublic&&<span className="audio-published-badge">{tr("publicBadge",lang)}</span>}
              {audioUrl ? <><p className="audio-filename">{audioName}</p><audio controls src={audioUrl} className="audio-player"/></> : <div className="audio-empty"><span>♫</span><p>{tr("missingAudio",lang)}</p></div>}
              <input ref={audioInput} type="file" accept="audio/*" hidden onChange={e=>onAudioChange(e.target.files?.[0])}/>
              <div className="audio-controls">
                <button className="audio-upload-button" onClick={()=>audioInput.current?.click()}>＋ {tr("uploadAudio",lang)}</button>
                {audioFile && <button className="primary-button audio-save-button" onClick={saveAudio} disabled={savingAudio || audioCloudSaved}>{savingAudio?(lang==="fr"?"Enregistrement…":"Saving…"):audioCloudSaved?tr("audioCloudSaved",lang):audioSaved?tr("retryCloud",lang):tr("saveAudio",lang)}</button>}{audioIsPublic&&<span className="audio-public-note">{tr("audioPublished",lang)}</span>}
                {audioUrl && <a className="audio-download-button" href={audioUrl} download={audioName || "jec-audio"}>↓ {tr("downloadAudio",lang)}</a>}
                {audioSaved && !audioIsPublic && <button className="audio-remove-button" onClick={deleteSavedAudio}>{tr("removeAudio",lang)}</button>}
              </div>
              {audioStatus && <p className={audioSaved?"audio-status saved":"audio-status"} role="status">{audioStatus}</p>}
              <small className="audio-privacy">{audioIsPublic?tr("audioPublished",lang):audioCloudSaved?tr("audioCloudPrivate",lang):tr("addAudioHint",lang)+" "+tr("localStorageLimit",lang)}{isAdmin&&audioCloudSaved&&!audioIsPublic?<span className="audio-privacy-admin"> {tr("publishPending",lang)}</span>:null}</small>
            </aside>
          </div>
        </section>

        <section className="jec-spiritual-heritage">
          <div className="songs-intro-row"><div><p className="eyebrow">{lang==="fr"?"TRANSMISSION ET IDENTITÉ":"TRANSMISSION AND IDENTITY"}</p><h2>{lang==="fr"?"Repères du jéciste":"YCS identity and prayer"}</h2></div><p>{lang==="fr"?"Des repères spirituels et communautaires repris dans le livret du Camp national universitaire Garoua 2026.":"Spiritual and community references included in the Garoua 2026 National University Camp booklet."}</p></div>
          <div className="jec-heritage-grid">
            <article className="collab-card jec-heritage-card">
              <p className="eyebrow">{lang==="fr"?"LA LOI DU JÉCISTE":"THE YCS LAW"}</p>
              <h3>{lang==="fr"?"Le jéciste…":"The YCS member…"}</h3>
              <ul>
                {(lang==="fr"?[
                  "A le sens de l’Église.",
                  "Combat pour la pureté.",
                  "A le sens de ses responsabilités.",
                  "Croit en l’amitié vraie.",
                  "Est au service de ses frères.",
                  "Vit en état de grâce.",
                  "Comprend la joie du travail.",
                  "Ne s’appartient pas, mais appartient au Christ.",
                  "Respecte la hiérarchie du mouvement et de l’Église.",
                  "Est fier, joyeux, pur et conséquent."
                ]:[
                  "Has a sense of the Church.",
                  "Strives for purity.",
                  "Takes responsibility seriously.",
                  "Believes in true friendship.",
                  "Serves brothers and sisters.",
                  "Seeks to live in a state of grace.",
                  "Understands the joy of work.",
                  "Does not belong to oneself, but to Christ.",
                  "Respects the hierarchy of the movement and the Church.",
                  "Is proud, joyful, pure and consistent."
                ]).map((item,i)=><li key={i}>{item}</li>)}
              </ul>
            </article>
            <article className="collab-card jec-heritage-card">
              <p className="eyebrow">{lang==="fr"?"PRIÈRE DU JÉCISTE":"YCS PRAYER"}</p>
              <h3>{lang==="fr"?"Prière commune":"A prayer for the movement"}</h3>
              <p>{lang==="fr"
                ?"Notre Père qui es aux cieux, nous te confions notre jeunesse, afin de préparer dès maintenant la fidélité sans défaillance de toute notre vie. Donne-nous la grâce de conserver vaillamment la pureté de nos âmes. Affermis en nos cœurs le désir de vivre selon ta volonté, d’être toujours et partout porteurs de ta parole pour la faire rayonner dans le monde. Donne-nous le courage d’imiter le Christ et d’être prêts aux sacrifices que tu nous demandes. Rends-nous dignes d’annoncer à nos camarades ta lumière, ta charité et ta vérité. Fais de nous une âme fraternelle qui aime tous ceux qui, dans toutes les classes de la société et toutes les nations du monde, recherchent la justice. Donne-nous la foi conquérante de tes apôtres afin d’être les messagers de ta parole dans notre milieu. Amen."
                :"Our Father in heaven, we entrust our youth to you and ask you to prepare us now for lifelong faithfulness. Give us the grace to preserve the purity of our souls. Strengthen in our hearts the desire to live according to your will and to carry your word everywhere. Give us the courage to imitate Christ and to accept the sacrifices you ask of us. Make us worthy to share your light, charity and truth with our friends. Give us a fraternal heart that loves all people who seek justice in every part of society and every nation. Give us the conquering faith of your apostles, so that we may be messengers of your word in our own environment. Amen."}</p>
            </article>
          </div>
          <p className="songs-disclaimer">{lang==="fr"?"Transcription du livret reçu. Les variantes locales éventuelles restent à documenter avec les responsables nationaux.":"Transcribed from the supplied booklet. Any local variants should be documented with the national leaders."}</p>
        </section>

        <section className="songs-memory-banner">
          <div className="memory-icon">✧</div><div><strong>{lang==="fr"?"Un patrimoine à transmettre":"A heritage to pass on"}</strong><p>{lang==="fr"?"Les versions validées des paroles, les enregistrements historiques, les auteurs et les dates de création seront conservés dans la bibliothèque musicale de la JEC.":"Approved lyrics, historical recordings, authors and dates of composition will be preserved in the JEC music library."}</p></div>
        </section>
        <p className="songs-disclaimer">{tr("sourceNote",lang)} · {tr("localOnly",lang)}</p>
      </div>
    </main>
  );
}
