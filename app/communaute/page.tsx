"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { LanguageSwitcher, useLanguage } from "@/components/language-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Mood = "joyful" | "grateful" | "hopeful" | "thoughtful" | "tired" | "concerned" | "motivated" | "celebrating";
type ReactionType = "like" | "love" | "support" | "celebrate" | "pray";
type Profile = { user_id: string; first_name: string | null; last_name: string | null; display_name: string | null; avatar_url: string | null };
type Reaction = { post_id: string; user_id: string; reaction_type: ReactionType };
type Comment = { id: string; post_id: string; author_id: string; body: string; status: string; created_at: string };
type BasePost = { id: string; author_id: string; body: string; mood: Mood | null; status: string; created_at: string; updated_at: string; shared_post_id: string | null };
type MediaRow = { id: string; post_id: string; owner_id: string; storage_path: string; file_name: string; mime_type: string; file_size: number; position: number };
type MediaAsset = MediaRow & { signedUrl: string | null };
type SharedPost = BasePost & { media: MediaAsset[] };
type Post = BasePost & { reactions: Reaction[]; comments: Comment[]; media: MediaAsset[]; sharedPost: SharedPost | null };
type Report = { id: string; post_id: string | null; comment_id: string | null; reporter_id: string; reason: string; details: string; status: string; created_at: string; target_body: string };

const moods: Array<{ value: Mood; emoji: string; fr: string; en: string }> = [
  { value: "joyful", emoji: "😄", fr: "De bonne humeur", en: "Feeling joyful" },
  { value: "grateful", emoji: "🙏", fr: "Reconnaissant·e", en: "Grateful" },
  { value: "hopeful", emoji: "🌱", fr: "Plein·e d'espoir", en: "Hopeful" },
  { value: "thoughtful", emoji: "💭", fr: "En réflexion", en: "Reflective" },
  { value: "tired", emoji: "🌙", fr: "Un peu fatigué·e", en: "A little tired" },
  { value: "concerned", emoji: "💙", fr: "Préoccupé·e", en: "Concerned" },
  { value: "motivated", emoji: "🔥", fr: "Motivé·e", en: "Motivated" },
  { value: "celebrating", emoji: "🎉", fr: "En célébration", en: "Celebrating" }
];

const reactions: Array<{ value: ReactionType; emoji: string; fr: string; en: string }> = [
  { value: "like", emoji: "👍", fr: "J'aime", en: "Like" },
  { value: "love", emoji: "❤️", fr: "J'adore", en: "Love" },
  { value: "support", emoji: "🤝", fr: "Soutien", en: "Support" },
  { value: "celebrate", emoji: "🎉", fr: "Bravo", en: "Celebrate" },
  { value: "pray", emoji: "🙏", fr: "Prière", en: "Prayer" }
];

const COMMUNITY_MEDIA_BUCKET = "jec-community-media";
const MAX_MEDIA_FILES = 5;
const MAX_MEDIA_FILE_SIZE = 20 * 1024 * 1024;
const MAX_MEDIA_TOTAL_SIZE = 50 * 1024 * 1024;
const allowedMediaTypes = new Set([
  "image/jpeg","image/png","image/webp","image/gif",
  "video/mp4","video/webm",
  "audio/mpeg","audio/mp4","audio/aac","audio/wav","audio/ogg","audio/webm"
]);

function getMediaMimeType(file: File): string | null {
  if (allowedMediaTypes.has(file.type)) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const byExtension: Record<string,string> = {
    jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",webp:"image/webp",gif:"image/gif",
    mp4:"video/mp4",webm:"video/webm",mp3:"audio/mpeg",m4a:"audio/mp4",aac:"audio/aac",
    wav:"audio/wav",ogg:"audio/ogg"
  };
  return byExtension[extension] ?? null;
}

function formatMediaSize(bytes: number, en: boolean) {
  return bytes < 1024 * 1024
    ? Math.max(1,Math.round(bytes / 1024)) + " KB"
    : (bytes / (1024 * 1024)).toFixed(1) + (en ? " MB" : " Mo");
}

function safeMediaFileName(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-zA-Z0-9._-]+/g,"_").slice(-180) || "community-media";
}

const reportReasons = [
  { value: "spam", fr: "Spam ou publicité", en: "Spam or advertising" },
  { value: "harassment", fr: "Harcèlement ou intimidation", en: "Harassment or bullying" },
  { value: "inappropriate", fr: "Contenu inapproprié", en: "Inappropriate content" },
  { value: "misinformation", fr: "Information trompeuse", en: "Misleading information" },
  { value: "privacy", fr: "Atteinte à la vie privée", en: "Privacy concern" },
  { value: "other", fr: "Autre motif", en: "Other reason" }
];

function initials(name: string) {
  return name.trim().split(/\\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "J";
}

function profileName(profile: Profile | undefined, fallback: string) {
  if (!profile) return fallback;
  return profile.display_name || [profile.first_name, profile.last_name].filter(Boolean).join(" ") || fallback;
}

function formatDate(value: string, en: boolean) {
  return new Date(value).toLocaleString(en ? "en-GB" : "fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

function moodLabel(value: Mood | null, en: boolean) {
  const mood = moods.find(item => item.value === value);
  return mood ? mood.emoji + " " + (en ? mood.en : mood.fr) : "";
}

export default function CommunityPage() {
  const { lang } = useLanguage();
  const en = lang === "en";
  const supabase = getSupabaseBrowserClient();
  const [userId, setUserId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState<Mood | "">("");
  const [activeTab, setActiveTab] = useState<"feed" | "mine" | "moderation">("feed");
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [reportTarget, setReportTarget] = useState<{ postId: string | null; commentId: string | null } | null>(null);
  const [reportReason, setReportReason] = useState("other");
  const [reportDetails, setReportDetails] = useState("");
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [search, setSearch] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [uploadLabel, setUploadLabel] = useState("");
  const [shareTarget, setShareTarget] = useState<Post | null>(null);
  const [shareComment, setShareComment] = useState("");

  const profileById = useMemo(() => new Map(profiles.map(profile => [profile.user_id, profile])), [profiles]);

  useEffect(() => {
    const urls = mediaFiles.map(file => URL.createObjectURL(file));
    setMediaPreviews(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [mediaFiles]);

  const loadFeed = useCallback(async () => {
    if (!supabase) {
      setError(en ? "Supabase is not configured." : "Supabase n'est pas configuré.");
      setLoading(false);
      return;
    }

    setError("");
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      window.location.href = "/login?next=%2Fcommunaute";
      return;
    }

    const [membershipResult, adminResult] = await Promise.all([
      supabase.from("jec_memberships").select("membership_status").eq("user_id", user.id).maybeSingle(),
      supabase.rpc("is_jec_admin")
    ]);
    const admin = adminResult.data === true && !adminResult.error;
    const verified = membershipResult.data?.membership_status === "verified";
    if (!verified && !admin) {
      window.location.href = "/compte";
      return;
    }

    setUserId(user.id);
    setIsAdmin(admin);

    const { data: postRows, error: postError } = await supabase
      .from("jec_community_posts")
      .select("id,author_id,body,mood,status,created_at,updated_at,shared_post_id")
      .order("created_at", { ascending: false })
      .limit(60);
    if (postError) {
      setError(postError.message);
      setLoading(false);
      return;
    }

    const basePosts = (postRows ?? []) as BasePost[];
    const postIds = basePosts.map(post => post.id);
    if (!postIds.length) {
      setPosts([]);
      setProfiles([]);
      setReports([]);
      setLoading(false);
      return;
    }

    const sharedIds = [...new Set(basePosts.map(post => post.shared_post_id).filter((id): id is string => Boolean(id)))];
    const allContentIds = [...new Set([...postIds,...sharedIds])];
    const [reactionResult, commentResult, sharedResult, mediaResult] = await Promise.all([
      supabase.from("jec_community_reactions").select("post_id,user_id,reaction_type").in("post_id", postIds),
      supabase.from("jec_community_comments")
        .select("id,post_id,author_id,body,status,created_at")
        .in("post_id", postIds).eq("status", "published")
        .order("created_at", { ascending: true }).limit(600),
      sharedIds.length
        ? supabase.from("jec_community_posts")
            .select("id,author_id,body,mood,status,created_at,updated_at,shared_post_id")
            .in("id",sharedIds).eq("status","published")
        : Promise.resolve({data:[] as BasePost[],error:null}),
      supabase.from("jec_community_media")
        .select("id,post_id,owner_id,storage_path,file_name,mime_type,file_size,position")
        .in("post_id",allContentIds).order("position",{ascending:true})
    ]);

    if (reactionResult.error) setError(reactionResult.error.message);
    if (commentResult.error) setError(commentResult.error.message);
    if (sharedResult.error) setError(sharedResult.error.message);
    if (mediaResult.error) setError(mediaResult.error.message);

    const reactionRows = (reactionResult.data ?? []) as Reaction[];
    const commentRows = (commentResult.data ?? []) as Comment[];
    const originalRows = (sharedResult.data ?? []) as BasePost[];
    const mediaRows = (mediaResult.data ?? []) as MediaRow[];
    const signedByPath = new Map<string,string>();
    if (mediaRows.length) {
      const {data:signedRows,error:signedError} = await supabase.storage
        .from(COMMUNITY_MEDIA_BUCKET).createSignedUrls(mediaRows.map(item => item.storage_path),3600);
      if (signedError) setError(en ? "Some media could not be loaded." : "Certains médias n'ont pas pu être chargés.");
      (signedRows ?? []).forEach(item => {
        if (item.path && item.signedUrl) signedByPath.set(item.path,item.signedUrl);
      });
    }

    const mediaByPostId = new Map<string,MediaAsset[]>();
    mediaRows.forEach(item => {
      const list=mediaByPostId.get(item.post_id) ?? [];
      list.push({...item,signedUrl:signedByPath.get(item.storage_path) ?? null});
      mediaByPostId.set(item.post_id,list);
    });

    const profileIds = [...new Set([
      ...basePosts.map(post => post.author_id),
      ...originalRows.map(post => post.author_id),
      ...commentRows.map(comment => comment.author_id)
    ])];
    let profileRows: Profile[] = [];
    if (profileIds.length) {
      const { data, error: profileError } = await supabase
        .from("jec_profiles").select("user_id,first_name,last_name,display_name,avatar_url")
        .in("user_id", profileIds);
      if (profileError) setError(profileError.message);
      profileRows = (data ?? []) as Profile[];
    }
    setProfiles(profileRows);

    const sharedById = new Map<string,SharedPost>(originalRows.map(post=>[
      post.id,{...post,media:mediaByPostId.get(post.id) ?? []} as SharedPost] as [string,SharedPost]
    ]));
    const hydrated = basePosts.map(post => ({
      ...post,
      reactions: reactionRows.filter(reaction => reaction.post_id === post.id),
      comments: commentRows.filter(comment => comment.post_id === post.id),
      media: mediaByPostId.get(post.id) ?? [],
      sharedPost: post.shared_post_id ? sharedById.get(post.shared_post_id) ?? null : null
    })) as Post[];
    setPosts(hydrated);

    if (admin) {
      const { data: reportRows, error: reportError } = await supabase
        .from("jec_community_reports")
        .select("id,post_id,comment_id,reporter_id,reason,details,status,created_at")
        .in("status", ["pending", "in_review"])
        .order("created_at", { ascending: true })
        .limit(100);
      if (reportError) setError(reportError.message);
      const reportBase = (reportRows ?? []) as Omit<Report, "target_body">[];
      const reportPostIds = [...new Set(reportBase.map(report => report.post_id).filter((id): id is string => Boolean(id)))];
      const reportCommentIds = [...new Set(reportBase.map(report => report.comment_id).filter((id): id is string => Boolean(id)))];
      const [reportedPosts, reportedComments] = await Promise.all([
        reportPostIds.length ? supabase.from("jec_community_posts").select("id,body").in("id", reportPostIds) : Promise.resolve({ data: [] as Array<{id:string;body:string}> }),
        reportCommentIds.length ? supabase.from("jec_community_comments").select("id,body").in("id", reportCommentIds) : Promise.resolve({ data: [] as Array<{id:string;body:string}> })
      ]);
      const contentById = new Map<string, string>();
      (reportedPosts.data ?? []).forEach((row: {id:string;body:string}) => contentById.set(row.id, row.body));
      (reportedComments.data ?? []).forEach((row: {id:string;body:string}) => contentById.set(row.id, row.body));
      setReports(reportBase.map(report => ({
        ...report,
        target_body: contentById.get(report.post_id ?? report.comment_id ?? "") ?? (en ? "Content unavailable" : "Contenu indisponible")
      })));
    } else {
      setReports([]);
    }

    const targetPost = new URLSearchParams(window.location.search).get("post");
    if (targetPost && postIds.includes(targetPost)) setOpenComments(targetPost);
    setLoading(false);
  }, [supabase, en]);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    if (!supabase || !userId) return;
    const channel = supabase.channel("jec-community-feed-" + userId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "jec_community_posts" }, () => { void loadFeed(); })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "jec_community_comments" }, () => { void loadFeed(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "jec_community_reactions" }, () => { void loadFeed(); })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "jec_community_media" }, () => { void loadFeed(); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [supabase, userId, loadFeed]);

  async function createPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !userId || (!body.trim() && mediaFiles.length===0)) return;
    setBusy(true); setError(""); setNotice("");
    const postId=crypto.randomUUID();
    const uploadedPaths:string[]=[];
    const mediaRowsToInsert:Array<Omit<MediaRow,"id">>=[];
    for (const [index,file] of mediaFiles.entries()) {
      const mimeType=getMediaMimeType(file);
      if (!mimeType) {
        setError(en ? "Unsupported media type." : "Type de média non pris en charge.");
        if(uploadedPaths.length) await supabase.storage.from(COMMUNITY_MEDIA_BUCKET).remove(uploadedPaths);
        setBusy(false); setUploadLabel(""); return;
      }
      setUploadLabel(en ? `Uploading media ${index+1}/${mediaFiles.length}…` : `Envoi du média ${index+1}/${mediaFiles.length}…`);
      const path=`${userId}/${postId}/${crypto.randomUUID()}-${safeMediaFileName(file.name)}`;
      const {error:uploadError}=await supabase.storage.from(COMMUNITY_MEDIA_BUCKET).upload(path,file,{
        cacheControl:"3600",contentType:mimeType,upsert:false
      });
      if(uploadError) {
        if(uploadedPaths.length) await supabase.storage.from(COMMUNITY_MEDIA_BUCKET).remove(uploadedPaths);
        setError((en ? "Media upload failed: " : "Échec de l'envoi du média : ")+uploadError.message);
        setBusy(false); setUploadLabel(""); return;
      }
      uploadedPaths.push(path);
      mediaRowsToInsert.push({
        post_id:postId,owner_id:userId,storage_path:path,
        file_name:file.name.slice(0,255),mime_type:mimeType,file_size:file.size,position:index
      });
    }

    setUploadLabel(en ? "Publishing…" : "Publication…");
    const {error:createError}=await supabase.from("jec_community_posts").insert({
      id:postId,author_id:userId,body:body.trim(),mood:mood||null,status:"published",shared_post_id:null
    });
    if(createError) {
      if(uploadedPaths.length) await supabase.storage.from(COMMUNITY_MEDIA_BUCKET).remove(uploadedPaths);
      setError(createError.message);
    } else {
      if(mediaRowsToInsert.length) {
        const {error:mediaError}=await supabase.from("jec_community_media").insert(mediaRowsToInsert);
        if(mediaError) {
          if(uploadedPaths.length) await supabase.storage.from(COMMUNITY_MEDIA_BUCKET).remove(uploadedPaths);
          await supabase.from("jec_community_posts").delete().eq("id",postId);
          setError(mediaError.message); setBusy(false); setUploadLabel(""); return;
        }
      }
      setBody(""); setMood(""); setMediaFiles([]);
      setNotice(en ? "Your post has been published." : "Ta publication a été publiée.");
      await loadFeed();
    }
    setBusy(false); setUploadLabel("");
  }

  async function resharePost() {
    if(!supabase || !userId || !shareTarget) return;
    setBusy(true); setError("");
    const {error:shareError}=await supabase.from("jec_community_posts").insert({
      id:crypto.randomUUID(),author_id:userId,body:shareComment.trim(),mood:null,
      status:"published",shared_post_id:shareTarget.shared_post_id ?? shareTarget.id
    });
    if(shareError) setError(shareError.message);
    else {
      setShareTarget(null); setShareComment("");
      setNotice(en ? "Post reshared with the community." : "Publication repartagée avec la communauté.");
      await loadFeed();
    }
    setBusy(false);
  }

  async function removeQueuedMedia(index:number) {
    setMediaFiles(current=>current.filter((_,currentIndex)=>currentIndex!==index));
  }

  async function toggleReaction(post: Post, type: ReactionType) {
    if (!supabase || !userId) return;
    setError("");
    const current = post.reactions.find(reaction => reaction.user_id === userId);
    let result;
    if (current?.reaction_type === type) {
      result = await supabase.from("jec_community_reactions").delete()
        .eq("post_id", post.id).eq("user_id", userId);
    } else {
      result = await supabase.from("jec_community_reactions").upsert({
        post_id: post.id,
        user_id: userId,
        reaction_type: type
      }, { onConflict: "post_id,user_id" });
    }
    if (result.error) setError(result.error.message);
    else await loadFeed();
  }

  async function addComment(event: FormEvent<HTMLFormElement>, postId: string) {
    event.preventDefault();
    if (!supabase || !userId) return;
    const text = (commentDrafts[postId] ?? "").trim();
    if (!text) return;
    setBusy(true);
    setError("");
    const { error: insertError } = await supabase.from("jec_community_comments").insert({
      post_id: postId,
      author_id: userId,
      body: text,
      status: "published"
    });
    if (insertError) setError(insertError.message);
    else {
      setCommentDrafts(current => ({ ...current, [postId]: "" }));
      await loadFeed();
    }
    setBusy(false);
  }

  async function deletePost(postId: string) {
    if (!supabase || !window.confirm(en ? "Delete this post and its comments?" : "Supprimer cette publication et ses commentaires ?")) return;
    const target=posts.find(post=>post.id===postId);
    const paths=target?.media.map(item=>item.storage_path) ?? [];
    const { error: deleteError } = await supabase.from("jec_community_posts").delete().eq("id", postId);
    if (deleteError) setError(deleteError.message);
    else {
      if(paths.length) {
        const {error:storageError}=await supabase.storage.from(COMMUNITY_MEDIA_BUCKET).remove(paths);
        if(storageError) setError(en ? "Post deleted, but some stored media could not be removed." : "Publication supprimée, mais certains fichiers n'ont pas pu être effacés.");
      }
      setNotice(en ? "Post deleted." : "Publication supprimée.");
      await loadFeed();
    }
  }

  async function savePostEdit(event: FormEvent<HTMLFormElement>, postId: string) {
    event.preventDefault();
    if (!supabase || !editBody.trim()) return;
    setBusy(true);
    const { error: updateError } = await supabase.from("jec_community_posts")
      .update({ body: editBody.trim() })
      .eq("id", postId)
      .eq("author_id", userId);
    if (updateError) setError(updateError.message);
    else {
      setEditingPostId(null);
      setEditBody("");
      setNotice(en ? "Post updated." : "Publication modifiée.");
      await loadFeed();
    }
    setBusy(false);
  }

  async function deleteComment(commentId: string) {
    if (!supabase) return;
    const { error: deleteError } = await supabase.from("jec_community_comments").delete().eq("id", commentId).eq("author_id", userId);
    if (deleteError) setError(deleteError.message);
    else await loadFeed();
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !userId || !reportTarget) return;
    setBusy(true);
    setError("");
    const { error: reportError } = await supabase.from("jec_community_reports").insert({
      post_id: reportTarget.postId,
      comment_id: reportTarget.commentId,
      reporter_id: userId,
      reason: reportReason,
      details: reportDetails.trim(),
      status: "pending"
    });
    if (reportError) setError(reportError.message);
    else {
      setReportTarget(null);
      setReportDetails("");
      setNotice(en ? "Your report has been sent to the moderation team." : "Ton signalement a été transmis à l'équipe de modération.");
    }
    setBusy(false);
  }

  async function reviewReport(report: Report, action: "hide" | "dismiss") {
    if (!supabase || !isAdmin) return;
    setBusy(true);
    setError("");
    let moderationFailed = false;
    if (action === "hide") {
      if (report.post_id) {
        const { error: hideError } = await supabase.from("jec_community_posts").update({ status: "hidden" }).eq("id", report.post_id);
        if (hideError) { moderationFailed = true; setError(hideError.message); }
      } else if (report.comment_id) {
        const { error: hideError } = await supabase.from("jec_community_comments").update({ status: "hidden" }).eq("id", report.comment_id);
        if (hideError) { moderationFailed = true; setError(hideError.message); }
      }
    }
    if (!moderationFailed) {
      const { error: reviewError } = await supabase.from("jec_community_reports").update({
        status: action === "hide" ? "resolved" : "dismissed",
        moderator_id: userId,
        reviewed_at: new Date().toISOString()
      }).eq("id", report.id);
      if (reviewError) setError(reviewError.message);
    }
    await loadFeed();
    setBusy(false);
  }

  const visiblePosts = posts.filter(post => {
    if (!isAdmin && post.status !== "published" && post.author_id !== userId) return false;
    if (activeTab === "mine" && post.author_id !== userId) return false;
    const author = profileName(profileById.get(post.author_id), en ? "JEC member" : "Membre JEC");
    const originalBody=post.sharedPost?.body ?? "";
    return (author + " " + post.body + " " + originalBody).toLowerCase().includes(search.toLowerCase());
  });

  function renderMedia(media:MediaAsset[], compact=false) {
    if(!media.length) return null;
    return <div className={compact ? "community-media-grid compact" : "community-media-grid"}>
      {media.map(item=>{
        if(!item.signedUrl) return <div className="community-media-unavailable" key={item.id}>{en ? "Media temporarily unavailable" : "Média temporairement indisponible"}</div>;
        if(item.mime_type.startsWith("image/")) return (
          <a className="community-media-item image" href={item.signedUrl} target="_blank" rel="noreferrer" key={item.id}>
            <img src={item.signedUrl} alt={item.file_name} loading="lazy"/>
          </a>
        );
        if(item.mime_type.startsWith("video/")) return (
          <div className="community-media-item video" key={item.id}>
            <video src={item.signedUrl} controls playsInline preload="metadata" aria-label={item.file_name}/>
          </div>
        );
        return (
          <div className="community-media-audio" key={item.id}>
            <span>♫</span><div><strong>{item.file_name}</strong><audio src={item.signedUrl} controls preload="metadata"/></div>
          </div>
        );
      })}
    </div>;
  }

  function renderPost(post: Post) {
    const author = profileById.get(post.author_id);
    const authorLabel = profileName(author, en ? "JEC member" : "Membre JEC");
    const own = post.author_id === userId;
    const moodText = moodLabel(post.mood, en);
    return (
      <article className={"community-post-card community-card-enter" + (post.status !== "published" ? " is-moderated" : "")} key={post.id}>
        <div className="community-post-header">
          <div className="community-avatar">
            {author?.avatar_url ? <img src={author.avatar_url} alt="" /> : initials(authorLabel)}
          </div>
          <div className="community-post-author">
            <strong>{authorLabel}</strong>
            <span>{en ? "Verified JEC member" : "Membre JEC vérifié"}{moodText ? " · " + moodText : ""}</span>
            <time>{formatDate(post.created_at, en)}</time>
          </div>
          <div className="community-post-menu">
            {post.status !== "published" && <span className="community-status-pill">{en ? post.status : post.status === "hidden" ? "Masquée" : "Retirée"}</span>}
            {own && post.status === "published" && <button type="button" className="community-text-action" onClick={() => { setEditingPostId(post.id); setEditBody(post.body); }}>{en ? "Edit" : "Modifier"}</button>}
            {(own || isAdmin) && <button type="button" className="community-text-action danger" onClick={() => void deletePost(post.id)}>{en ? "Delete" : "Supprimer"}</button>}
            {!own && <button type="button" className="community-text-action" onClick={() => { setReportTarget({ postId: post.id, commentId: null }); setReportReason("other"); }}>{en ? "Report" : "Signaler"}</button>}
          </div>
        </div>
        {post.shared_post_id && <div className="community-reshare-label">🔁 {en ? "Reshared by" : "Repartagé par"} {authorLabel}</div>}

        {editingPostId === post.id ? (
          <form className="community-edit-form" onSubmit={event => void savePostEdit(event, post.id)}>
            <textarea value={editBody} onChange={event => setEditBody(event.target.value)} rows={4} maxLength={5000} required />
            <div><button type="button" className="community-secondary-button" onClick={() => setEditingPostId(null)}>{en ? "Cancel" : "Annuler"}</button><button className="community-primary-button" disabled={busy || !editBody.trim()}>{en ? "Save changes" : "Enregistrer"}</button></div>
          </form>
        ) : post.shared_post_id ? (
          <div className="community-reshare-content">
            {post.body && <p className="community-post-body community-reshare-comment">{post.body}</p>}
            {post.sharedPost ? (
              <div className="community-shared-original">
                <div className="community-shared-author">
                  <div className="community-comment-avatar">
                    {profileById.get(post.sharedPost.author_id)?.avatar_url
                      ? <img src={profileById.get(post.sharedPost.author_id)?.avatar_url ?? ""} alt=""/>
                      : initials(profileName(profileById.get(post.sharedPost.author_id),en ? "JEC member" : "Membre JEC"))}
                  </div>
                  <div><strong>{profileName(profileById.get(post.sharedPost.author_id),en ? "JEC member" : "Membre JEC")}</strong><time>{formatDate(post.sharedPost.created_at,en)}</time></div>
                </div>
                {post.sharedPost.body && <p className="community-post-body">{post.sharedPost.body}</p>}
                {renderMedia(post.sharedPost.media,true)}
              </div>
            ) : <p className="community-media-unavailable">{en ? "The original post is no longer available." : "La publication d'origine n'est plus disponible."}</p>}
          </div>
        ) : (
          <>
            {post.body && <p className="community-post-body">{post.body}</p>}
            {renderMedia(post.media)}
          </>
        )}

        {post.status === "published" && (
          <>
            <div className="community-reactions">
              {reactions.map(option => {
                const count = post.reactions.filter(reaction => reaction.reaction_type === option.value).length;
                const active = post.reactions.some(reaction => reaction.user_id === userId && reaction.reaction_type === option.value);
                return (
                  <button key={option.value} type="button" className={"community-reaction" + (option.value==="like" ? " community-reaction-primary" : "") + (active ? " active" : "")} onClick={() => void toggleReaction(post, option.value)} aria-pressed={active}>
                    <span>{option.emoji}</span><small>{en ? option.en : option.fr}</small>{count > 0 && <b>{count}</b>}
                  </button>
                );
              })}
            </div>
            <div className="community-post-footer">
              <button type="button" className="community-text-action" onClick={() => setOpenComments(openComments === post.id ? null : post.id)}>
                <span>💬</span> {post.comments.length} {en ? "comments" : "commentaire(s)"}
              </button>
              <span>{post.reactions.length} {en ? "reactions" : "réaction(s)"}</span>
              {post.status==="published" && !post.shared_post_id && <button type="button" className="community-text-action community-share-action" onClick={() => {setShareTarget(post);setShareComment("");}}>
                <span>🔁</span> {en ? "Reshare" : "Repartager"}
              </button>}
            </div>
            {openComments === post.id && (
              <div className="community-comments">
                {post.comments.map(comment => {
                  const commenter = profileById.get(comment.author_id);
                  const commenterName = profileName(commenter, en ? "JEC member" : "Membre JEC");
                  return (
                    <div className="community-comment" key={comment.id}>
                      <div className="community-comment-avatar">{commenter?.avatar_url ? <img src={commenter.avatar_url} alt="" /> : initials(commenterName)}</div>
                      <div className="community-comment-content">
                        <div><strong>{commenterName}</strong><time>{formatDate(comment.created_at, en)}</time></div>
                        <p>{comment.body}</p>
                      </div>
                      {comment.author_id === userId && <button className="community-text-action danger" onClick={() => void deleteComment(comment.id)}>{en ? "Delete" : "Supprimer"}</button>}
                      {comment.author_id !== userId && <button className="community-text-action" onClick={() => setReportTarget({ postId: null, commentId: comment.id })}>{en ? "Report" : "Signaler"}</button>}
                    </div>
                  );
                })}
                <form className="community-comment-form" onSubmit={event => void addComment(event, post.id)}>
                  <input value={commentDrafts[post.id] ?? ""} onChange={event => setCommentDrafts(current => ({ ...current, [post.id]: event.target.value }))} placeholder={en ? "Write a comment…" : "Écrire un commentaire…"} maxLength={2000} />
                  <button className="community-primary-button" disabled={busy || !(commentDrafts[post.id] ?? "").trim()}>{en ? "Send" : "Envoyer"}</button>
                </form>
              </div>
            )}
          </>
        )}
      </article>
    );
  }

  return (
    <main className="community-page">
      <header className="community-header">
        <Link href="/" className="brand-lockup"><span className="brand-mark"><span>JEC</span><i aria-hidden="true">✝</i></span><span>conNEcT</span></Link>
        <div className="community-header-actions">
          <nav className="member-area-nav" aria-label={en ? "Member navigation" : "Navigation membre"}>
            <Link href="/workspace">{en ? "Workspace" : "Workspace"}</Link>
            <Link href="/communaute" aria-current="page">{en ? "Community" : "Communauté"}</Link>
            <Link href="/messagerie">{en ? "Messages" : "Messagerie"}</Link>
          </nav>
          <LanguageSwitcher />
          <Link href="/" className="community-back-link">{en ? "Portal" : "Portail JEC"}</Link>
        </div>
      </header>

      <section className="community-hero">
        <div className="community-hero-copy">
          <span className="community-eyebrow">{en ? "THE JEC COMMUNITY" : "LA COMMUNAUTÉ JEC"}</span>
          <h1>{en ? "A community that lives, shares and grows together." : "Une communauté qui vit, partage et grandit ensemble."}</h1>
          <p>{en ? "Share a moment, celebrate an initiative, ask a question or simply say how you feel. Your voice has a place here." : "Partage un moment, célèbre une initiative, pose une question ou exprime simplement ton humeur. Ta voix a sa place ici."}</p>
          <div className="community-hero-badges"><span>🤝 {en ? "Connection" : "Lien"}</span><span>💬 {en ? "Conversation" : "Échange"}</span><span>🌱 {en ? "Commitment" : "Engagement"}</span></div>
        </div>
        <div className="community-hero-visual"><img src="/images/jec-community-illustration.svg" alt={en ? "Young people sharing ideas and learning together" : "Des jeunes échangent et apprennent ensemble"} /></div>
      </section>

      <div className="community-layout">
        <section className="community-feed-column">
          {error && <p className="community-alert error">{error}</p>}
          {notice && <p className="community-alert success">{notice}</p>}

          <form className="community-composer" onSubmit={createPost}>
            <div className="community-composer-heading"><div className="community-composer-icon">✎</div><div><strong>{en ? "What would you like to share?" : "Qu'as-tu envie de partager ?"}</strong><span>{en ? "A thought, a feeling, a photo, a short video or audio…" : "Une pensée, une humeur, une photo, une courte vidéo ou un audio…"}</span></div></div>
            <textarea rows={4} value={body} onChange={event => setBody(event.target.value)} maxLength={5000} placeholder={en ? "Tell the community what's happening…" : "Raconte à la communauté ce qui se passe…"} />
            <div className="community-media-picker-row">
              <label className="community-media-picker">
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/ogg,audio/webm" multiple
                  onChange={event=>{
                    const picked=Array.from(event.target.files ?? []);
                    event.target.value="";
                    if(!picked.length) return;
                    const accepted:File[]=[];
                    for(const file of picked){
                      const mime=getMediaMimeType(file);
                      if(!mime){setError(en ? "Choose an image, video or audio file." : "Choisis un fichier image, vidéo ou audio.");continue;}
                      if(file.size>MAX_MEDIA_FILE_SIZE){setError(en ? "Each file must be 20 MB or smaller." : "Chaque fichier doit faire 20 Mo maximum.");continue;}
                      accepted.push(file);
                    }
                    setMediaFiles(current=>{
                      const next=[...current,...accepted];
                      if(next.length>MAX_MEDIA_FILES){setError(en ? "You can attach up to 5 files." : "Tu peux joindre jusqu'à 5 fichiers.");return current;}
                      if(next.reduce((sum,file)=>sum+file.size,0)>MAX_MEDIA_TOTAL_SIZE){setError(en ? "The total media size must not exceed 50 MB." : "Le poids total des médias ne doit pas dépasser 50 Mo.");return current;}
                      return next;
                    });
                  }}/>
                <span>＋</span><strong>{en ? "Add media" : "Ajouter un média"}</strong>
              </label>
              <small>{en ? "Photos · GIFs · Videos · Audio" : "Photos · GIF · Vidéos · Audio"} · 5 {en ? "files max" : "fichiers max"}</small>
            </div>
            {mediaFiles.length>0 && <div className="community-media-preview-list">
              {mediaFiles.map((file,index)=>{
                const mime=getMediaMimeType(file) ?? "";
                return <div className="community-media-preview" key={file.name+"-"+file.size+"-"+index}>
                  {mime.startsWith("image/") ? <img src={mediaPreviews[index]} alt={file.name}/> : mime.startsWith("video/") ? <video src={mediaPreviews[index]} muted controls playsInline/> : <div className="community-audio-preview"><span>♫</span><strong>{file.name}</strong></div>}
                  <div className="community-media-preview-meta"><strong>{file.name}</strong><small>{formatMediaSize(file.size,en)}</small></div>
                  <button type="button" onClick={()=>void removeQueuedMedia(index)} aria-label={en ? "Remove media" : "Retirer le média"}>×</button>
                </div>;
              })}
            </div>}
            <div className="community-composer-bottom">
              <label className="community-mood-select"><span>😊 {en ? "My mood" : "Mon humeur"}</span><select value={mood} onChange={event => setMood(event.target.value as Mood | "")}><option value="">{en ? "Choose (optional)" : "Choisir (facultatif)"}</option>{moods.map(item => <option value={item.value} key={item.value}>{item.emoji} {en ? item.en : item.fr}</option>)}</select></label>
              <span className="community-char-count">{body.length}/5000</span>
              <button className="community-primary-button" disabled={busy || (!body.trim() && mediaFiles.length===0)}>{busy ? (uploadLabel || (en ? "Publishing…" : "Publication…")) : (en ? "Publish" : "Publier")} <span>↗</span></button>
            </div>
            <p className="community-privacy-note">🔒 {en ? "Visible only to verified JEC members. Be kind and protect everyone's privacy." : "Visible uniquement aux membres JEC vérifiés. Restons bienveillants et protégeons la vie privée de chacun."}</p>
          </form>

          <div className="community-feed-toolbar">
            <div><span className="community-eyebrow">{en ? "THE FEED" : "LE FIL D'ACTUALITÉ"}</span><h2>{en ? "Latest posts" : "Les dernières publications"}</h2></div>
            <input aria-label={en ? "Search community" : "Rechercher dans la communauté"} value={search} onChange={event => setSearch(event.target.value)} placeholder={en ? "Search…" : "Rechercher…"} />
          </div>

          <nav className="community-tabs">
            <button className={activeTab === "feed" ? "active" : ""} onClick={() => setActiveTab("feed")}>{en ? "All posts" : "Tout le fil"}</button>
            <button className={activeTab === "mine" ? "active" : ""} onClick={() => setActiveTab("mine")}>{en ? "My posts" : "Mes publications"}</button>
            {isAdmin && <button className={activeTab === "moderation" ? "active" : ""} onClick={() => setActiveTab("moderation")}>{en ? "Moderation" : "Modération"}{reports.length > 0 && <b>{reports.length}</b>}</button>}
            <button className="community-refresh" onClick={() => void loadFeed()}>{en ? "Refresh ↻" : "Actualiser ↻"}</button>
          </nav>

          {loading ? <div className="community-empty"><span>✧</span><p>{en ? "Loading community…" : "Chargement de la communauté…"}</p></div> : activeTab === "moderation" && isAdmin ? (
            <div className="community-moderation-list">
              {reports.length === 0 ? <div className="community-empty"><span>✓</span><h3>{en ? "No reports to review" : "Aucun signalement en attente"}</h3><p>{en ? "The moderation queue is clear." : "La file de modération est vide."}</p></div> : reports.map(report => (
                <article className="community-report-card" key={report.id}>
                  <div className="community-report-head"><strong>{en ? "Content reported" : "Contenu signalé"}</strong><time>{formatDate(report.created_at, en)}</time></div>
                  <span className="community-report-reason">{reportReasons.find(reason => reason.value === report.reason)?.[en ? "en" : "fr"] ?? report.reason}</span>
                  <p className="community-report-body">{report.target_body}</p>
                  {report.details && <small>{en ? "Reporter note: " : "Précision : "}{report.details}</small>}
                  <div className="community-report-actions">
                    <button className="community-secondary-button" disabled={busy} onClick={() => void reviewReport(report, "dismiss")}>{en ? "Dismiss report" : "Classer sans suite"}</button>
                    <button className="community-danger-button" disabled={busy} onClick={() => void reviewReport(report, "hide")}>{en ? "Hide content" : "Masquer le contenu"}</button>
                  </div>
                </article>
              ))}
            </div>
          ) : visiblePosts.length === 0 ? (
            <div className="community-empty"><span>🌱</span><h3>{en ? "The conversation starts with you" : "La conversation commence avec toi"}</h3><p>{en ? "No posts match this view yet. Share a first thought with the JEC community." : "Aucune publication dans cette vue pour le moment. Partage une première pensée avec la communauté JEC."}</p></div>
          ) : visiblePosts.map(renderPost)}
        </section>

        <aside className="community-sidebar">
          <section className="community-side-card community-guidelines">
            <span className="community-side-icon">🌿</span><h3>{en ? "A welcoming space" : "Un espace accueillant"}</h3>
            <p>{en ? "This feed belongs to the JEC members. Each person can share, listen and contribute to the life of the movement." : "Ce fil appartient aux membres de la JEC. Chacun peut partager, écouter et contribuer à la vie du mouvement."}</p>
            <ul><li>{en ? "Respect every person." : "Respecter chaque personne."}</li><li>{en ? "Discuss ideas, not identities." : "Débattre des idées, pas attaquer les personnes."}</li><li>{en ? "Do not share private information." : "Ne pas publier d'informations privées."}</li><li>{en ? "Report harmful content." : "Signaler les contenus problématiques."}</li></ul>
          </section>
          <section className="community-side-card">
            <span className="community-side-icon">✝</span><h3>{en ? "The JEC spirit" : "L'esprit JEC"}</h3>
            <p>{en ? "See, Judge, Act: share experiences, reflect together and turn ideas into collective action." : "Voir, Juger, Agir : partageons nos expériences, réfléchissons ensemble et transformons les idées en actions collectives."}</p>
            <Link href="/decouvrir#frise-chronologique">{en ? "Discover the movement →" : "Découvrir le mouvement →"}</Link>
          </section>
          <p className="community-sidebar-note">{en ? "The feed is private to verified JEC members. Public pages remain available to visitors." : "Le fil est privé et réservé aux membres JEC vérifiés. Les pages publiques restent accessibles aux visiteurs."}</p>
        </aside>
      </div>

      {shareTarget && <div className="community-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target===event.currentTarget) setShareTarget(null); }}>
        <section className="community-share-modal" role="dialog" aria-modal="true" aria-labelledby="community-share-title">
          <button type="button" className="community-modal-close" onClick={()=>setShareTarget(null)} aria-label={en ? "Close" : "Fermer"}>×</button>
          <span className="community-eyebrow">{en ? "SPREAD THE WORD" : "FAIRE CIRCULER"}</span>
          <h2 id="community-share-title">{en ? "Reshare this post" : "Repartager cette publication"}</h2>
          <p>{en ? "Add a thought to introduce this post to the community (optional)." : "Ajoute un mot pour accompagner cette publication (facultatif)."}</p>
          <textarea rows={4} maxLength={5000} value={shareComment} onChange={event=>setShareComment(event.target.value)} placeholder={en ? "Why are you sharing it?" : "Pourquoi souhaites-tu la partager ?"} />
          <div><button type="button" className="community-secondary-button" onClick={()=>setShareTarget(null)}>{en ? "Cancel" : "Annuler"}</button><button type="button" className="community-primary-button" disabled={busy} onClick={()=>void resharePost()}>{en ? "Reshare" : "Repartager"} ↗</button></div>
        </section>
      </div>}

      {reportTarget && <div className="community-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setReportTarget(null); }}>
        <section className="community-report-modal" role="dialog" aria-modal="true" aria-labelledby="community-report-title">
          <button type="button" className="community-modal-close" onClick={() => setReportTarget(null)} aria-label={en ? "Close" : "Fermer"}>×</button>
          <span className="community-eyebrow">{en ? "COMMUNITY SAFETY" : "SÉCURITÉ DE LA COMMUNAUTÉ"}</span>
          <h2 id="community-report-title">{en ? "Report content" : "Signaler un contenu"}</h2>
          <p>{en ? "Your report will be sent to the JEC moderation team. It will not be visible to other members." : "Ton signalement sera transmis à l'équipe de modération JEC. Il ne sera pas visible par les autres membres."}</p>
          <form onSubmit={submitReport}>
            <label>{en ? "Reason" : "Motif"}<select value={reportReason} onChange={event => setReportReason(event.target.value)}>{reportReasons.map(reason => <option value={reason.value} key={reason.value}>{en ? reason.en : reason.fr}</option>)}</select></label>
            <label>{en ? "Additional details (optional)" : "Précisions (facultatif)"}<textarea rows={3} maxLength={1000} value={reportDetails} onChange={event => setReportDetails(event.target.value)} /></label>
            <div><button type="button" className="community-secondary-button" onClick={() => setReportTarget(null)}>{en ? "Cancel" : "Annuler"}</button><button className="community-primary-button" disabled={busy}>{en ? "Send report" : "Envoyer le signalement"}</button></div>
          </form>
        </section>
      </div>}
    </main>
  );
}
