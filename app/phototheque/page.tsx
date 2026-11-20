"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LanguageSwitcher, useLanguage } from "@/components/language-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type PhotoAsset = {
  id: string; title_fr: string; title_en: string | null; caption_fr: string | null; caption_en: string | null;
  alt_text_fr: string; alt_text_en: string | null; event_name: string | null; event_date: string | null;
  country: string | null; image_url: string; source_name: string; source_url: string; photographer: string;
  license_name: string; license_url: string | null; is_featured: boolean;
};

export default function PhotoLibraryPage() {
  const { lang } = useLanguage();
  const en = lang === "en";
  const [photos, setPhotos] = useState<PhotoAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) { setError(en ? "The photo library is temporarily unavailable." : "La photothèque est temporairement indisponible."); setLoading(false); return; }
      const { data, error: queryError } = await supabase
        .from("jec_photo_assets")
        .select("id,title_fr,title_en,caption_fr,caption_en,alt_text_fr,alt_text_en,event_name,event_date,country,image_url,source_name,source_url,photographer,license_name,license_url,is_featured")
        .eq("is_published", true)
        .eq("rights_status", "approved")
        .eq("rights_confirmed", true)
        .in("subject_consent_status", ["confirmed", "not_applicable"])
        .order("is_featured", { ascending: false })
        .order("sort_order", { ascending: true })
        .order("event_date", { ascending: false, nullsFirst: false });
      if (!active) return;
      if (queryError) setError(queryError.message);
      else setPhotos((data ?? []) as PhotoAsset[]);
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, [en]);

  return <main className="photo-library-page">
    <header className="account-header">
      <Link href="/" className="brand-lockup"><span className="brand-mark"><span>JEC</span><i aria-hidden="true">✝</i></span><span>conNEcT</span></Link>
      <div className="member-header-actions"><LanguageSwitcher/><Link href="/" className="back-link-inline">{en ? "Back to portal" : "Retour au portail"}</Link></div>
    </header>
    <div className="photo-library-content">
      <section className="photo-library-hero">
        <div>
          <p className="eyebrow">{en ? "THE MOVEMENT IN PICTURES" : "LE MOUVEMENT EN IMAGES"}</p>
          <h1>{en ? "JEC, through the years and across communities." : "La JEC, au fil des rencontres et des communautés."}</h1>
          <p>{en ? "A curated collection of photographs documenting the life, events and commitments of Young Christian Students." : "Une collection de photographies qui raconte la vie, les rencontres et les engagements de la Jeunesse Étudiante Chrétienne."}</p>
          <span className="photo-library-hero-note">✦ {en ? "Real moments · Credited sources · Rights checked" : "Moments réels · Sources créditées · Droits vérifiés"}</span>
        </div>
        <div className="photo-library-hero-art"><div className="photo-library-hero-stack"><span>JEC</span><b>✝</b><small>{en ? "A living movement" : "Un mouvement vivant"}</small></div></div>
      </section>

      <div className="photo-library-heading">
        <div><p className="eyebrow">{en ? "OFFICIAL PHOTO COLLECTION" : "COLLECTION PHOTOGRAPHIQUE"}</p><h2>{en ? "Moments from our movement" : "Les moments de notre mouvement"}</h2></div>
        <span>{photos.length} {en ? (photos.length === 1 ? "photo" : "photos") : (photos.length === 1 ? "photo" : "photos")}</span>
      </div>

      {error && <p className="alert error">{error}</p>}
      {loading ? <div className="photo-library-empty"><span className="photo-library-spinner"/> {en ? "Loading the collection…" : "Chargement de la collection…"}</div>
        : photos.length ? <div className="photo-library-grid">
          {photos.map((photo, index) => <article className={"photo-library-card" + (photo.is_featured ? " featured" : "")} key={photo.id}>
            <a className="photo-library-image" href={photo.image_url} target="_blank" rel="noreferrer">
              <img src={photo.image_url} alt={en ? (photo.alt_text_en || photo.alt_text_fr) : photo.alt_text_fr} loading={index < 2 ? "eager" : "lazy"}/>
              {photo.is_featured && <span className="photo-library-featured">{en ? "Featured" : "À la une"}</span>}
              {photo.event_date && <span className="photo-library-date">{new Date(photo.event_date + "T12:00:00").toLocaleDateString(en ? "en-GB" : "fr-FR", { year: "numeric", month: "short", day: "numeric" })}</span>}
            </a>
            <div className="photo-library-card-copy">
              <h3>{en ? (photo.title_en || photo.title_fr) : photo.title_fr}</h3>
              {photo.event_name && <p className="photo-library-event">{photo.event_name}{photo.country ? " · " + photo.country : ""}</p>}
              {(en ? photo.caption_en : photo.caption_fr) && <p className="photo-library-caption">{en ? (photo.caption_en || photo.caption_fr) : photo.caption_fr}</p>}
              <div className="photo-library-credit"><span>{en ? "Photo" : "Photo"} · {photo.photographer}</span><a href={photo.source_url} target="_blank" rel="noreferrer">{photo.source_name} ↗</a></div>
              <div className="photo-library-license">{photo.license_url ? <a href={photo.license_url} target="_blank" rel="noreferrer">{photo.license_name}</a> : photo.license_name}</div>
            </div>
          </article>)}
        </div> : <section className="photo-library-empty-state">
          <span className="photo-library-empty-icon">▧</span>
          <h2>{en ? "The collection is being prepared." : "La collection se prépare."}</h2>
          <p>{en ? "Official event photographs will appear here as soon as their sources, image rights and participant consent have been checked." : "Les photographies officielles des événements apparaîtront ici après vérification de leur provenance, des droits d’utilisation et du consentement des personnes photographiées."}</p>
          <div className="photo-library-empty-tags"><span>JEC France</span><span>JECI-MIEC</span><span>IYCS-JECI</span></div>
        </section>}
      <p className="photo-library-footnote">{en ? "All photographs identify their photographer and source. Stock or illustrative images are not presented as actual JEC events." : "Chaque photographie mentionne son auteur et sa source. Les images d’illustration ne sont pas présentées comme des photographies d’événements JEC réels."}</p>
    </div>
  </main>;
}
