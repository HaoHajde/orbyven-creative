import type { Metadata } from "next";
import InvitationServiceLanding from "@/components/InvitationServiceLanding";
import InvitationStructuredData from "@/components/InvitationStructuredData";

export const metadata: Metadata = {
  title: "Invitații de nuntă digitale și personalizate",
  description: "Invitații de nuntă digitale ORBYVEN CREATIVE: design elegant, detalii despre eveniment, confirmare RSVP și personalizare. Descoperă un model interactiv.",
  alternates: { canonical: "/invitatii-nunta" },
  openGraph: {
    url: "/invitatii-nunta",
    title: "Invitații de nuntă digitale | ORBYVEN CREATIVE",
    description: "Invitații digitale de nuntă personalizate, cu RSVP și o prezentare elegantă a evenimentului.",
  },
};

export default function WeddingInvitationsPage() {
  return (
    <>
    <InvitationStructuredData path="/invitatii-nunta" name="Invitații de nuntă digitale personalizate" description="Invitații digitale de nuntă cu design personalizat, locații, program și opțiune de confirmare RSVP." />
    <InvitationServiceLanding
      label="Invitații de nuntă"
      title="Invitații de nuntă digitale, cu povestea voastră."
      introduction="O invitație de nuntă online care reunește povestea, programul, locația și confirmarea participării într-o experiență plăcută pentru invitați, inclusiv pe telefon."
      highlights={[
        { title: "Design personalizat", description: "Pornim de la un model și îl adaptăm stilului evenimentului: culori, text, fotografii și detalii importante." },
        { title: "RSVP pentru invitați", description: "Confirmarea participării poate fi integrată direct în invitație, pentru un răspuns ușor de oferit." },
        { title: "Totul într-un link", description: "Program, locație și informații utile accesibile invitaților fără mesaje și fișiere separate." },
      ]}
      previews={[
        { href: "/demo/nunta/elegant", title: "Elegant · Nuntă", description: "Explorează o invitație digitală cu prezentare, detalii de eveniment și confirmare." },
        { href: "/templates", title: "Colecția ORBYVEN", description: "Vezi și alte direcții vizuale pentru evenimente și experiențe digitale." },
      ]}
      relatedHref="/invitatii-botez"
      relatedLabel="Vezi invitațiile de botez"
      faq={[{"question":"Cum trimit invitația digitală?","answer":"Primești un link către invitația online, pe care îl poți distribui prin WhatsApp, mesaj sau e-mail. Invitații o pot deschide de pe telefon sau calculator."},{"question":"Putem modifica un model existent?","answer":"Da. Putem adapta textele, culorile, imaginile, locațiile și structura evenimentului. Stabilim ce elemente rămân din modelul ales și ce se schimbă."},{"question":"Poate invitația să aibă confirmare RSVP?","answer":"Da, invitația poate include un formular de confirmare a participării. Detaliile colectate se stabilesc în funcție de eveniment și de modelul ales."},{"question":"Trebuie să avem deja toate detaliile nunții?","answer":"Nu neapărat. Putem porni de la model și putem completa programul, adresele și informațiile finale înainte de distribuire."}]}
    />
    </>
  );
}
