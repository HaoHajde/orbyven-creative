export const barberImages = {
  hero: "https://images.unsplash.com/photo-1702865272115-5afdbae975af?auto=format&fit=crop&w=2000&q=85",
  detail: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1100&q=85",
  gallery: [
    "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1150&q=82",
    "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1150&q=82",
    "https://images.unsplash.com/photo-1702865272115-5afdbae975af?auto=format&fit=crop&w=1150&q=82",
  ],
} as const;

export const barberServices = [
  { id: "cut", category: "Tunsoare", name: "Signature Cut", details: "Consultare, tuns, styling.", duration: 45, price: 90 },
  { id: "fade", category: "Tunsoare", name: "Skin Fade", details: "Fade precis și contur curat.", duration: 50, price: 105 },
  { id: "beard", category: "Barbă", name: "Beard Ritual", details: "Contur, prosop cald, îngrijire.", duration: 30, price: 60 },
  { id: "combo", category: "Pachet", name: "The Full Experience", details: "Tunsoare + barbă + styling.", duration: 75, price: 140 },
] as const;

export const barberTeam = [
  { id: "alex", name: "Alex", tag: "Fade & precision", initials: "AX" },
  { id: "matei", name: "Matei", tag: "Classic & beard", initials: "MT" },
  { id: "any", name: "Oricare disponibil", tag: "Primul slot potrivit", initials: "↗" },
] as const;

export type BarberServiceId = (typeof barberServices)[number]["id"];
export type BarberTeamId = (typeof barberTeam)[number]["id"];
