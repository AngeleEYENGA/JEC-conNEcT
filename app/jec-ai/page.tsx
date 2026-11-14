import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-provider";
import { JecAiAssistant } from "@/components/jec-ai-assistant";

export default function JecAiPage() {
  return (
    <main className="jec-ai-page">
      <header className="account-header">
        <Link href="/" className="brand-lockup">
          <span className="brand-mark"><span>JEC</span><i aria-hidden="true">✝</i></span>
          <span>conNEcT</span>
        </Link>
        <div>
          <LanguageSwitcher />
          <Link href="/" className="back-link-inline">Retour au portail</Link>
        </div>
      </header>
      <JecAiAssistant />
    </main>
  );
}
