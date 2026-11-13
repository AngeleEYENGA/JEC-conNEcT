"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, X } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type UserNotification = {
  id: string;
  recipient_id: string;
  event_type: string;
  title_fr: string;
  title_en: string;
  body_fr: string;
  body_en: string;
  target_path: string;
  read_at: string | null;
  created_at: string;
};

function formatNotificationDate(value: string, en: boolean) {
  return new Intl.DateTimeFormat(en ? "en-GB" : "fr-FR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function NotificationCenter() {
  const { lang } = useLanguage();
  const en = lang === "en";
  const [userId, setUserId] = useState("");
  const [items, setItems] = useState<UserNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const unreadCount = useMemo(
    () => items.filter(item => !item.read_at).length,
    [items]
  );

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    let mounted = true;

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextId = session?.user?.id ?? "";
      setUserId(nextId);
      if (!nextId) setItems([]);
    });

    void supabase.auth.getUser().then(({ data, error: authError }) => {
      if (!mounted) return;
      if (authError) setError(authError.message);
      setUserId(data.user?.id ?? "");
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loadNotifications = useCallback(async () => {
    if (!userId) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from("jec_user_notifications")
      .select("id,recipient_id,event_type,title_fr,title_en,body_fr,body_en,target_path,read_at,created_at")
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (queryError) setError(queryError.message);
    else {
      setError("");
      setItems((data ?? []) as UserNotification[]);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    let active = true;

    void loadNotifications();

    const channel = supabase
      .channel("jec-user-notifications:" + userId)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "jec_user_notifications",
          filter: "recipient_id=eq." + userId
        },
        payload => {
          const incoming = payload.new as UserNotification;
          if (!active) return;
          setItems(current => [
            incoming,
            ...current.filter(item => item.id !== incoming.id)
          ].slice(0, 30));
        }
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [userId, loadNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!userId) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const readAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("jec_user_notifications")
      .update({ read_at: readAt })
      .eq("id", notificationId)
      .eq("recipient_id", userId)
      .is("read_at", null);

    if (updateError) setError(updateError.message);
    else {
      setItems(current => current.map(item =>
        item.id === notificationId ? { ...item, read_at: readAt } : item
      ));
    }
  }, [userId]);

  const markAllAsRead = useCallback(async () => {
    if (!userId || !unreadCount) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const readAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("jec_user_notifications")
      .update({ read_at: readAt })
      .eq("recipient_id", userId)
      .is("read_at", null);

    if (updateError) setError(updateError.message);
    else setItems(current => current.map(item => item.read_at ? item : { ...item, read_at: readAt }));
  }, [userId, unreadCount]);

  if (!userId) return null;

  return (
    <div className="global-notification-center">
      <button
        className="global-notification-trigger"
        type="button"
        aria-label={en ? "Notifications" : "Notifications"}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(value => !value)}
      >
        <Bell size={19} aria-hidden="true" />
        {unreadCount > 0 && <span className="global-notification-count">{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </button>

      {open && (
        <section className="global-notification-panel" role="dialog" aria-label={en ? "Notification center" : "Centre de notifications"}>
          <header className="global-notification-header">
            <div>
              <strong>{en ? "Notifications" : "Notifications"}</strong>
              <small>{en ? unreadCount + " unread" : unreadCount + " non lue(s)"}</small>
            </div>
            <div className="global-notification-actions">
              {unreadCount > 0 && (
                <button type="button" onClick={() => void markAllAsRead()}>
                  <CheckCheck size={15} />
                  <span>{en ? "Mark all read" : "Tout lire"}</span>
                </button>
              )}
              <button type="button" aria-label={en ? "Close" : "Fermer"} onClick={() => setOpen(false)}>
                <X size={17} />
              </button>
            </div>
          </header>

          {error && <p className="global-notification-error">{error}</p>}

          <div className="global-notification-list">
            {loading && items.length === 0 ? (
              <p className="global-notification-empty">{en ? "Loading…" : "Chargement…"}</p>
            ) : items.length === 0 ? (
              <p className="global-notification-empty">{en ? "You are all caught up." : "Tu es à jour. Aucune notification."}</p>
            ) : items.map(item => (
              <Link
                className={item.read_at ? "global-notification-item" : "global-notification-item unread"}
                href={item.target_path}
                key={item.id}
                onClick={() => {
                  if (!item.read_at) void markAsRead(item.id);
                  setOpen(false);
                }}
              >
                <span className="global-notification-indicator" aria-hidden="true" />
                <span className="global-notification-copy">
                  <strong>{en ? item.title_en : item.title_fr}</strong>
                  {(en ? item.body_en : item.body_fr) && <span>{en ? item.body_en : item.body_fr}</span>}
                  <time>{formatNotificationDate(item.created_at, en)}</time>
                </span>
              </Link>
            ))}
          </div>

          <footer className="global-notification-footer">
            <button type="button" onClick={() => void loadNotifications()}>
              {en ? "Refresh" : "Actualiser"}
            </button>
          </footer>
        </section>
      )}
    </div>
  );
}
