# ORBYVEN SEO Foundation v2

Data: 18 septembrie 2026

## Obiectiv
Mutăm ORBYVEN de la „site indexabil” la o arhitectură SEO cu pagini dedicate intențiilor comerciale și cu dovadă prin piloți.

## Keyword map (SERP-informed, fără volum declarat)
- creare site -> /creare-site
- site de prezentare / creare site de prezentare -> /site-prezentare
- web design București / creare site București -> /web-design-bucuresti
- redesign site / refacere site -> /redesign-site
- site pentru firme mici -> /site-pentru-firme-mici
- site pentru instalatori / firmă instalații -> /site-pentru-instalatori
- site detailing auto / web design auto -> /site-pentru-detailing-auto
- site servicii evenimente -> /site-pentru-servicii-evenimente

## Hubs
- /solutii
- /studii-de-caz
- /ghid
- /despre

## Case studies
- Obsidian Moments
- Neagu Costică SRL
- VIAFORTE
- Hao's Customs

Studiile de caz descriu implementările și fluxurile construite. Nu pretind rezultate comerciale nemăsurate.

## Content foundation
- cât costă un site de prezentare
- ce trebuie să conțină site-ul unei firme
- când merită redesign
- site vs. Facebook pentru o afacere

## Technical decisions
- domeniu canonic de fallback: https://orbyven.ro
- sitemap-ul conține doar URL-uri care trebuie indexate
- demo-urile dinamice /templates/[slug] sunt noindex, follow și canonical către /templates
- paginile SEO au canonical self, OpenGraph și structured data
- landing pages: Service + BreadcrumbList + FAQPage
- guides: Article + BreadcrumbList
- case studies: CreativeWork + BreadcrumbList
- internal linking din footer și între paginile SEO

## Deferred — necesită acces/identitate externă
- Google Business Profile / verificare business
- conturi sociale oficiale + sameAs
- backlinkuri / PR / directoare relevante
- orbyven.com + versiunea EN + hreflang cross-domain
- date legale complete ale firmei, dacă se dorește LocalBusiness schema
- keyword volumes exacte dintr-un tool SEO plătit/conectat

## Reguli
- fără pagini „oraș + serviciu” unde ORBYVEN nu poate susține acoperirea
- fără testimoniale sau rezultate inventate
- fără conținut generat doar pentru volum
- fiecare pagină comercială are o intenție principală distinctă
