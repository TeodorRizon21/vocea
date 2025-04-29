"use client";

import { useLanguage } from "@/components/LanguageToggle"
import { useMemo } from "react"

export default function GDPRPage() {
  const { language } = useLanguage()

  const content = useMemo(() => {
    if (language === "ro") {
      return {
        title: "Politica de Confidențialitate – VoceaCampusului.ro",
        sections: [
          {
            title: "Introducere",
            content: [
              "Protecția datelor dumneavoastră cu caracter personal este foarte importantă pentru noi. Această Politică de Confidențialitate explică modul în care site-ul VoceaCampusului.ro (denumit în continuare \"Vocea Campusului\" sau \"platforma\") colectează, utilizează și protejează datele cu caracter personal ale utilizatorilor, în conformitate cu Regulamentul (UE) 2016/679 (\"GDPR\"), Legea nr. 190/2018 și alte legi aplicabile din România. Vă rugăm să citiți cu atenție această politică pentru a înțelege practicile noastre privind datele personale.",
              "Prin utilizarea site-ului nostru, confirmați că ați citit și ați înțeles prezenta Politică de Confidențialitate și sunteți de acord cu prelucrarea datelor dumneavoastră personale în condițiile descrise mai jos."
            ]
          },
          {
            title: "Operatorul de date și contact",
            content: [
              "Operatorul datelor cu caracter personal colectate prin intermediul VoceaCampusului.ro este EARTHTRANSPORT LIMITED S.R.L., societate cu răspundere limitată cu sediul în Municipiul București, Sector 3, B-dul Basarabia nr. 256G, biroul 7.1.B, înregistrată la Registrul Comerțului cu nr. J40/19151/2021, CUI 45173290 (denumită în continuare \"Operatorul\" sau \"noi\"). Operatorul este responsabil de asigurarea conformității cu legislația privind protecția datelor.",
              "Pentru orice întrebări sau solicitări legate de protecția datelor, ne puteți contacta la:",
              "- Persoana de contact responsabilă GDPR: COVRIG LIVIU GABRIEL",
              "- Email: liviu.covrig@gmail.com",
              "- Telefon: +40 752 475 753",
              "Ne puteți contacta la aceste coordonate pentru exercitarea drepturilor legate de datele dumneavoastră personale (descrise mai jos) sau pentru orice nelămuriri privind această politică."
            ]
          },
          {
            title: "Conținut încărcat de utilizatori și răspunderea acestora",
            content: [
              "Vocea Campusului este o platformă educațională colaborativă care permite utilizatorilor să încarce, să publice și să comercializeze conținut educațional propriu, cum ar fi proiecte, referate, lucrări de licență/disertație sau alte materiale similare. Fiecare utilizator este în mod exclusiv responsabil de legalitatea, originalitatea și calitatea conținutului pe care îl încarcă sau îl oferă spre vânzare pe platformă. Prin încărcarea oricărui material, declarați că aveți dreptul legal de a-l distribui și că acesta nu încalcă drepturile de autor sau alte legi.",
              "Operatorul platformei nu poate fi tras la răspundere pentru conținutul încărcat de utilizatori. Cu toate acestea, ne angajăm să monitorizăm și să acționăm prompt pentru a elimina orice material care încalcă legea sau regulile platformei, inclusiv materiale ce constituie plagiat sau care încalcă drepturile de autor ale altor persoane. În conformitate cu legislația din România privind combaterea plagiatului în educație (de exemplu, Legea nr. 427/2023 care modifică Legea învățământului universitar nr. 199/2023), vânzarea, cumpărarea sau facilitarea obținerii de lucrări academice în scopul fraudării examenelor este strict interzisă și se sancționează cu amenzi cuprinse între 100.000 și 200.000 Lei. De asemenea, dacă o lucrare plagiată este distribuită online, autoritățile pot solicita eliminarea acesteia, iar în caz de refuz pot dispune blocarea domeniului web al site-ului care o găzduiește. VoceaCampusului.ro se conformează acestor prevederi legale și va coopera cu autoritățile competente, eliminând imediat orice conținut neconform de pe platformă.",
              "Prin urmare, utilizatorii platformei trebuie să folosească serviciul în mod responsabil. Orice abuz sau încălcare a legislației va atrage ștergerea materialului respectiv și, după caz, suspendarea contului, fără a aduce atingere oricăror acțiuni legale ce pot fi întreprinse de autorități împotriva persoanelor implicate."
            ]
          },
          {
            title: "Ce date colectăm despre dumneavoastră",
            content: [
              "Pentru a vă oferi acces la platformă și serviciile noastre, este necesar să colectăm diverse tipuri de date cu caracter personal. Datele pe care le colectăm pot include:",
              "- Date de înregistrare și profil: informații furnizate direct de dumneavoastră la crearea unui cont sau completarea profilului pe VoceaCampusului.ro. Acestea pot include numele și prenumele, adresa de email, numărul de telefon, numele de utilizator, parola (stocată într-o formă securizată) și alte detalii opționale de profil (de exemplu, fotografie de profil, informații despre educație sau instituția de învățământ, dacă decideți să le oferiți).",
              "- Conținutul încărcat: orice materiale educaționale sau informații pe care le încărcați, publicați sau transmiteți prin intermediul platformei (de exemplu, fișiere cu proiecte, referate, descrieri ale materialelor, comentarii, mesaje în chat-ul platformei). Aceste conținuturi pot conține în mod indirect date personale (de exemplu, numele autorului pe un document sau alte informații incluse în material).",
              "- Date tranzacționale: informații necesare pentru a facilita cumpărarea și vânzarea de conținut pe platformă. Acestea pot include detalii despre tranzacțiile efectuate (materialele cumpărate sau vândute, prețul, data și ora tranzacției), adresa de facturare (dacă este cazul), precum și informații necesare procesării plăților.",
              "- Date tehnice și de utilizare: informații colectate automat atunci când utilizați site-ul. Acestea pot include adresa IP, tipul dispozitivului folosit pentru acces, tipul și versiunea browser-ului, sistemul de operare, identificatori unici de dispozitiv, setările de limbă, ora și durata accesului, paginile vizitate, precum și informații colectate prin cookie-uri și tehnologii similare.",
              "- Date de comunicare: orice informații conținute în corespondența dintre dumneavoastră și Vocea Campusului (de exemplu, e-mailuri trimise către suportul nostru sau mesaje transmise prin funcționalitățile site-ului)."
            ]
          },
          {
            title: "Scopurile și temeiurile legale ale prelucrării datelor",
            content: [
              "VoceaCampusului.ro colectează și prelucrează datele dumneavoastră personale doar în scopuri legitime, bazându-ne pe un temei legal adecvat, conform GDPR. În principal, folosim datele în următoarele scopuri:",
              "- Furnizarea serviciilor platformei și gestionarea contului – Utilizăm datele de înregistrare și profil pentru a vă crea și administra contul de utilizator, pentru a vă permite autentificarea pe site, publicarea de conținut și interacțiunea cu alți utilizatori (de exemplu, comunicarea prin chat sau comentarii). De asemenea, folosim aceste date pentru a vă oferi funcționalitățile solicitate (cum ar fi afișarea anunțurilor sau materialelor încărcate de dumneavoastră și facilitarea vânzării/cumpărării acelor materiale). Temei legal: Executarea unui contract la care persoana vizată este parte (art. 6 alin. (1) lit. b GDPR) – respectiv Termenii și Condițiile acceptate la crearea contului.",
              "- Procesarea tranzacțiilor și plăților – Folosim datele tranzacționale pentru a intermedia cumpărarea și vânzarea de materiale educaționale între utilizatori, pentru a asigura efectuarea plăților către vânzători și, dacă este cazul, emiterea facturilor. Temei legal: Executarea contractului (art. 6 alin. (1) lit. b GDPR) pentru a onora tranzacțiile pe care le inițiați pe platformă, precum și îndeplinirea obligațiilor legale financiar-contabile și fiscale (art. 6 alin. (1) lit. c GDPR), de exemplu păstrarea evidențelor de facturare.",
              "- Comunicare și asistență – Putem folosi adresa de email și alte date de contact pentru a vă trimite notificări legate de funcționarea serviciului (de exemplu, confirmarea înregistrării contului, notificări despre tranzacții, schimbări importante ale platformei sau ale politicilor noastre) și pentru a răspunde întrebărilor sau solicitărilor pe care ni le transmiteți prin canalele de suport. Temei legal: Interesul legitim al Operatorului (art. 6 alin. (1) lit. f GDPR) de a asigura o comunicare eficientă cu utilizatorii și de a rezolva eventualele probleme, precum și, în unele cazuri, executarea contractului (dacă mesajele sunt necesare pentru furnizarea serviciului solicitat).",
              "- Menținerea securității platformei și respectarea legii – Datele tehnice (cum ar fi log-urile serverului, adresele IP) sunt prelucrate pentru a proteja securitatea website-ului, a preveni fraudele și abuzurile, accesul neautorizat la conturi, precum și pentru a detecta și remedia erori de funcționare. Totodată, putem monitoriza și verifica conținutul publicat de utilizatori pentru a ne asigura că nu încalcă Termenii și Condițiile platformei sau prevederile legale (de exemplu, prevenirea publicării de conținut plagiat sau ilegal). Temei legal: Interesul nostru legitim (art. 6 alin. (1) lit. f GDPR) de a asigura integritatea și siguranța platformei, precum și îndeplinirea unor obligații legale (art. 6 alin. (1) lit. c GDPR) – de exemplu, obligația de a înlătura conținutul ilegal sau de a coopera cu autoritățile în caz de încălcare a legii.",
              "- Îmbunătățirea serviciilor și statistici – Putem analiza date agregate despre utilizarea site-ului (de ex. numărul de vizitatori, conținutul accesat frecvent, feedback primit) pentru a înțelege cum este folosită platforma și a aduce îmbunătățiri funcționalităților sau conținutului oferit. Atunci când este posibil, aceste date de analiză sunt colectate într-o formă care nu identifică direct persoanele (de exemplu, prin cookie-uri analitice sau instrumente de statistică web). Temei legal: Interesul legitim (art. 6 alin. (1) lit. f GDPR) al Operatorului de a optimiza serviciile oferite și de a dezvolta platforma în concordanță cu nevoile utilizatorilor. În măsura în care folosim cookie-uri sau identificatori online neesențiali pentru aceste analize, vom obține consimțământul prealabil al utilizatorilor, conform legislației aplicabile (vezi secțiunea despre cookie-uri).",
              "- Comunicări de marketing (opțional) – În cazul în care v-ați abonat la newsletter-ul nostru sau v-ați dat acordul să primiți comunicări comerciale, vom folosi datele de contact (precum adresa de email) pentru a vă trimite informații despre noutăți, oferte sau evenimente legate de Vocea Campusului. Veți avea întotdeauna posibilitatea de a vă dezabona de la astfel de comunicări. Temei legal: Consimțământul dumneavoastră (art. 6 alin. (1) lit. a GDPR). Lipsa consimțământului sau retragerea lui nu va afecta accesul la platformă; comunicările esențiale privind funcționarea serviciului vă vor fi trimise în continuare pe baza temeiului legal al interesului legitim sau al executării contractului, după caz.",
              "În situația în care vom dori să prelucrăm datele personale în alte scopuri decât cele menționate mai sus, vă vom informa în prealabil și, dacă legea o impune, vom solicita consimțământul dumneavoastră."
            ]
          },
          {
            title: "Cookie-uri și tehnologii similare",
            content: [
              "Site-ul VoceaCampusului.ro utilizează cookie-uri și tehnologii similare (cum ar fi pixeli, stocare locală în browser) pentru a vă oferi o experiență optimă și personalizată. Un cookie este un fișier de mici dimensiuni, format din litere și numere, care este stocat pe dispozitivul pe care îl folosiți pentru a accesa internetul (computer, smartphone etc.) atunci când vizitați un site web.",
              "Cum folosim cookie-urile?:",
              "- Cookie-uri necesare pentru funcționarea site-ului: Aceste cookie-uri sunt esențiale pentru utilizarea platformei. De exemplu, ele vă mențin autentificat(ă) în cont, rețin preferințele de limbă sau alte setări și contribuie la securitatea site-ului. Fără aceste cookie-uri, site-ul nu poate funcționa corect, de aceea ele sunt activate automat și nu necesită consimțământ.",
              "- Cookie-uri de analiză și performanță: Aceste cookie-uri ne ajută să înțelegem cum interacționează utilizatorii cu site-ul, oferindu-ne informații anonime sau agregate despre secțiunile vizitate, timpul petrecut pe pagini, eventuale erori întâmpinate etc. Prin acestea putem îmbunătăți constant platforma. Vom folosi astfel de cookie-uri (sau tehnologii analitice terțe, cum ar fi Google Analytics) doar dacă avem consimțământul dumneavoastră prin intermediul banner-ului sau setărilor de cookie de pe site. Puteți alege să acceptați sau să refuzați cookie-urile de analiză.",
              "- Cookie-uri de funcționalitate și social media: Acestea permit integrarea cu rețele sociale sau alte funcționalități opționale (de exemplu, butoane de share, înregistrare/autentificare cu contul de Facebook/Google – dacă oferim această opțiune). Astfel de cookie-uri pot colecta informații despre dumneavoastră doar atunci când le folosiți. Și acestea vor fi folosite doar dacă v-ați exprimat acordul.",
              "- Cookie-uri de targetare/publicitate: Momentan, VoceaCampusului.ro nu folosește cookie-uri de publicitate terță parte care să creeze profiluri de utilizator sau să afișeze reclame personalizate. Dacă în viitor vom implementa astfel de soluții, vom actualiza politica și vom solicita acordul utilizatorilor prealabil.",
              "Aveți posibilitatea de a controla și șterge cookie-urile prin setările browser-ului dumneavoastră. Puteți seta browser-ul să blocheze anumite cookie-uri sau să vă alerteze atunci când un cookie este plasat. Țineți cont că dezactivarea totală a cookie-urilor esențiale poate afecta funcționarea platformei. Pentru mai multe detalii despre cookie-urile specifice pe care le folosim și opțiunile dumneavoastră, vă rugăm să consultați Politica de Cookie-uri a site-ului (dacă este disponibilă) sau secțiunea de setări de confidențialitate de pe VoceaCampusului.ro.",
              "Continuarea utilizării site-ului nostru cu browser-ul setat să accepte cookie-uri implică acordul dumneavoastră implicit pentru folosirea acestor tehnologii, în limitele prezentei politici de confidențialitate."
            ]
          },
          {
            title: "Drepturile dumneavoastră în calitate de persoană vizată",
            content: [
              "Conform GDPR, aveți următoarele drepturi în ceea ce privește datele dumneavoastră personale:",
              "- Dreptul de acces – Puteți solicita informații despre datele personale pe care le prelucrăm despre dumneavoastră și o copie a acestora.",
              "- Dreptul la rectificare – Puteți cere corectarea datelor inexacte sau completarea celor incomplete.",
              "- Dreptul la ștergere („dreptul de a fi uitat”) – În anumite condiții, puteți cere ștergerea datelor dumneavoastră personale.",
              "- Dreptul la restricționarea prelucrării – În anumite situații, puteți cere limitarea prelucrării datelor dumneavoastră personale.",
              "- Dreptul la portabilitatea datelor – Puteți primi datele dumneavoastră personale într-un format structurat, utilizat în mod obișnuit și care poate fi citit automat și/sau puteți cere transmiterea acestor date către un alt operator.",
              "- Dreptul de opoziție – Puteți vă opune prelucrării datelor dumneavoastră personale în anumite circumstanțe, cum ar fi marketingul direct.",
              "- Dreptul de a nu fi supus unei decizii individuale automatizate – Aveți dreptul de a nu fi supus unei decizii bazate exclusiv pe prelucrarea automatizată, inclusiv crearea de profiluri, care produce efecte juridice care vă afectează sau vă afectează în mod similar în mod semnificativ.",
              "Pentru a exercita oricare dintre aceste drepturi, vă rugăm să ne contactați folosind detaliile de contact furnizate în secțiunea „Contact” a acestei politici. Vom răspunde la solicitările dumneavoastră în termen de 30 de zile, cu posibilitatea de a extinde acest termen cu încă 60 de zile dacă este necesar, în conformitate cu GDPR.",
              "De asemenea, aveți dreptul de a depune o plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP) dacă considerați că prelucrarea datelor dumneavoastră personale încalcă GDPR."
            ]
          },
          {
            title: "Securitatea datelor",
            content: [
              "Ne angajăm să protejăm datele dumneavoastră personale și să implementăm măsuri tehnice și organizatorice adecvate pentru a asigura securitatea acestora. Printre măsurile pe care le implementăm se numără:",
              "- Criptarea datelor sensibile",
              "- Controlul accesului bazat pe roluri",
              "- Monitorizarea și auditul regulat al sistemelor",
              "- Formarea angajaților în domeniul securității datelor",
              "- Actualizări regulate ale sistemelor și software-ului",
              "Deși implementăm măsuri de securitate robuste, trebuie să rețineți că nicio metodă de transmisie pe internet sau de stocare electronică nu este 100% sigură. Prin urmare, nu putem garanta securitatea absolută a datelor transmise către sau de la site-ul nostru."
            ]
          },
          {
            title: "Transferul datelor în afara SEE",
            content: [
              "În general, datele dumneavoastră personale sunt stocate și prelucrate în Spațiul Economic European (SEE). Cu toate acestea, în anumite cazuri, datele pot fi transferate în țări din afara SEE, cum ar fi Statele Unite, atunci când folosim servicii de la furnizori terți (de exemplu, servicii de hosting sau analiză).",
              "În astfel de cazuri, ne asigurăm că transferurile de date sunt efectuate în conformitate cu GDPR, folosind unul dintre următoarele mecanisme:",
              "- Decizii de adecvare ale Comisiei Europene",
              "- Clauze contractuale standard",
              "- Mecanisme de certificare (cum ar fi Privacy Shield pentru transferurile către SUA)",
              "Puteți obține mai multe informații despre transferurile de date și garanțiile aplicabile prin contactarea noastră folosind detaliile furnizate în secțiunea „Contact”."
            ]
          },
          {
            title: "Contact",
            content: [
              "Dacă aveți întrebări sau nelămuriri cu privire la această Politică de Confidențialitate sau dacă doriți să exercitați drepturile dumneavoastră în calitate de persoană vizată, vă rugăm să ne contactați la:",
              "Email: contact@voceacampusului.ro",
              "Adresa: B-dul Basarabia no. 256G, office 7.1.B, Sector 3, Bucharest, Romania",
              "Telefon: +40 752 475 753",
              "Nume: VoceaCampusului.ro",
              "CUI: 45173290",
              "Număr de înregistrare: J40/19151/2021",
              "Vă rugăm să includeți în mesajul dumneavoastră toate informațiile necesare pentru a ne putea identifica și procesa solicitarea dumneavoastră în mod corespunzător."
            ]
          },
          {
            title: "Modificări ale Politicii de Confidențialitate",
            content: [
              "Ne rezervăm dreptul de a actualiza sau modifica această Politică de Confidențialitate în orice moment. Vă vom informa despre orice modificări semnificative prin publicarea noii versiuni a politicii pe site-ul nostru sau prin alte mijloace de comunicare adecvate.",
              "Vă încurajăm să revizuiți periodic această Politică de Confidențialitate pentru a fi la curent cu modul în care protejăm informațiile dumneavoastră.",
              "Ultima actualizare: [Data ultimei actualizări]"
            ]
          }
        ]
      }
    }
    return {
      title: "Privacy Policy - VoceaCampusului.ro",
      sections: [
        {
          title: "Introduction",
          content: [
            "The protection of your personal data is very important to us. This Privacy Policy explains how the VoceaCampusului.ro website (hereinafter referred to as \"Vocea Campusului\" or \"platform\") collects, uses and protects users' personal data, in accordance with Regulation (EU) 2016/679 (\"GDPR\"), Law no. 190/2018 and other applicable laws in Romania. Please read this policy carefully to understand our practices regarding personal data.",
            "By using our website, you confirm that you have read and understood this Privacy Policy and agree to the processing of your personal data under the conditions described below."
          ]
        },
        {
          title: "Data Controller and Contact",
          content: [
            "The controller of personal data collected through VoceaCampusului.ro is EARTHTRANSPORT LIMITED S.R.L., a limited liability company with headquarters in Bucharest, Sector 3, B-dul Basarabia no. 256G, office 7.1.B, registered with the Trade Register under no. J40/19151/2021, CUI 45173290 (hereinafter referred to as the \"Controller\" or \"we\"). The Controller is responsible for ensuring compliance with data protection legislation.",
            "For any questions or requests related to data protection, you can contact us at:",
            "- GDPR Responsible Contact Person: COVRIG LIVIU GABRIEL",
            "- Email: liviu.covrig@gmail.com",
            "- Phone: +40 752 475 753",
            "You can contact us at these coordinates to exercise your rights related to your personal data (described below) or for any questions regarding this policy."
          ]
        },
        {
          title: "Content Uploaded by Users and Their Responsibility",
          content: [
            "Vocea Campusului is an educational collaborative platform that allows users to upload, publish and commercialize their own educational content, such as projects, essays, thesis/dissertation works or similar materials. Each user is exclusively responsible for the legality, originality and quality of the content they upload or offer for sale on the platform. By uploading any material, you declare that you have the legal right to distribute it and that it does not infringe copyrights or other laws.",
            "The platform cannot be held responsible for content uploaded by users. However, we commit to monitor and promptly address any content that violates the law or platform rules, including plagiarized content or content infringing on the copyrights of others. In accordance with the law in Romania regarding plagiarism in education (e.g., Law no. 427/2023 amending Law no. 199/2023 on higher education), selling, buying or facilitating the obtaining of academic works for the purpose of cheating exams is strictly prohibited and punishable by fines ranging from 100,000 to 200,000 Lei. Additionally, if a plagiarized work is distributed online, authorities may request its removal, and in case of refusal, they may order the blocking of the website hosting the work.",
            "VoceaCampusului.ro complies with these legal requirements and will cooperate with competent authorities, promptly removing any illegal content from the platform."
          ]
        },
        {
          title: "What Personal Data We Collect About You",
          content: [
            "In order to provide you with access to our platform and services, we need to collect various types of personal data. The data we collect may include:",
            "- Registration and Profile Data: information provided directly by you at the creation of an account or completion of your profile on VoceaCampusului.ro. This may include your name and surname, email address, phone number, username, password (stored in a secure form), and other profile details (e.g., profile picture, education or institution information, if you choose to provide it).",
            "- Uploaded Content: any educational materials or information you upload, publish or transmit through the platform (e.g., project files, essays, material descriptions, comments, messages in the platform's chat). These contents may contain personal data indirectly (e.g., the author's name on a document or other information included in the material).",
            "- Transactional Data: information necessary to facilitate the purchase and sale of content on the platform. This may include details about transactions made (materials bought or sold, price, date and time of transaction), billing address (if applicable), as well as information needed for payment processing.",
            "- Technical and Usage Data: information collected automatically when you use the website. This may include IP address, type of device used for access, browser type and version, operating system, unique device identifiers, language settings, time and duration of access, pages visited, as well as information collected through cookies and similar technologies.",
            "- Communication Data: any information contained in correspondence between you and Vocea Campusului (e.g., emails sent to our support or messages transmitted through the website's features)."
          ]
        },
        {
          title: "Purposes and Legal Bases for Data Processing",
          content: [
            "VoceaCampusului.ro collects and processes your personal data only for legitimate purposes, based on an appropriate legal basis, in accordance with GDPR. We mainly use the data for the following purposes:",
            "- Providing platform services and account management – We use registration and profile data to create and manage your user account, to allow you to authenticate on the site, publish content and interact with other users (e.g., communication through chat or comments). We also use this data to provide you with the requested functionalities (such as displaying announcements or materials uploaded by you and facilitating the sale/purchase of those materials). Legal basis: Performance of a contract to which the data subject is party (Art. 6(1)(b) GDPR) – respectively the Terms and Conditions accepted when creating the account.",
            "- Transaction and payment processing – We use transactional data to mediate the purchase and sale of educational materials between users, to ensure payments to sellers and, if applicable, invoice issuance. Legal basis: Performance of contract (Art. 6(1)(b) GDPR) to honor transactions you initiate on the platform, as well as compliance with financial-accounting and tax legal obligations (Art. 6(1)(c) GDPR), for example keeping billing records.",
            "- Communication and support – We may use email address and other contact data to send you notifications related to the service operation (e.g., account registration confirmation, transaction notifications, important platform or policy changes) and to respond to questions or requests you send us through support channels. Legal basis: The Controller's legitimate interest (Art. 6(1)(f) GDPR) to ensure effective communication with users and resolve any issues, as well as, in some cases, performance of contract (if messages are necessary for providing the requested service).",
            "- Maintaining platform security and legal compliance – Technical data (such as server logs, IP addresses) is processed to protect website security, prevent fraud and abuse, unauthorized account access, as well as to detect and remedy operational errors. Additionally, we may monitor and verify content published by users to ensure it does not violate the Platform's Terms and Conditions or legal provisions (e.g., preventing the publication of plagiarized or illegal content). Legal basis: Our legitimate interest (Art. 6(1)(f) GDPR) to ensure platform integrity and security, as well as compliance with legal obligations (Art. 6(1)(c) GDPR) – for example, the obligation to remove illegal content or cooperate with authorities in case of law violation.",
            "- Service improvement and statistics – We may analyze aggregated data about website usage (e.g., number of visitors, frequently accessed content, received feedback) to understand how the platform is used and to improve functionalities or offered content. When possible, this analysis data is collected in a form that does not directly identify individuals (e.g., through analytical cookies or web statistics tools). Legal basis: The Controller's legitimate interest (Art. 6(1)(f) GDPR) to optimize offered services and develop the platform in accordance with user needs. To the extent we use cookies or non-essential online identifiers for these analyses, we will obtain users' prior consent, in accordance with applicable legislation (see the section about cookies).",
            "- Marketing communications (optional) – If you have subscribed to our newsletter or given consent to receive commercial communications, we will use contact data (such as email address) to send you information about news, offers or events related to Vocea Campusului. You will always have the option to unsubscribe from such communications. Legal basis: Your consent (Art. 6(1)(a) GDPR). Lack of consent or its withdrawal will not affect access to the platform; essential communications regarding service operation will continue to be sent based on the legal basis of legitimate interest or contract performance, as applicable.",
            "If we wish to process personal data for purposes other than those mentioned above, we will inform you in advance and, if required by law, request your consent."
          ]
        },
        {
          title: "Cookies and Similar Technologies",
          content: [
            "The VoceaCampusului.ro website uses cookies and similar technologies (such as pixels, local browser storage) to provide you with an optimal and personalized experience. A cookie is a small file, consisting of letters and numbers, that is stored on the device you use to access the internet (computer, smartphone, etc.) when you visit a website.",
            "How do we use cookies?:",
            "- Essential cookies for website operation: These cookies are essential for using the platform. For example, they keep you logged in to your account, remember language preferences or other settings, and contribute to site security. Without these cookies, the site cannot function properly, which is why they are automatically activated and do not require consent.",
            "- Analytics and performance cookies: These cookies help us understand how users interact with the site, providing us with anonymous or aggregated information about visited sections, time spent on pages, any errors encountered, etc. Through these, we can constantly improve the platform. We will use such cookies (or third-party analytics technologies, such as Google Analytics) only if we have your consent through the banner or cookie settings on the site. You can choose to accept or refuse analytics cookies.",
            "- Functionality and social media cookies: These allow integration with social networks or other optional functionalities (e.g., share buttons, registration/login with Facebook/Google account – if we offer this option). Such cookies may collect information about you only when you use them. And these will be used only if you have expressed consent.",
            "- Targeting/advertising cookies: Currently, VoceaCampusului.ro does not use third-party advertising cookies that create user profiles or display personalized ads. If we implement such solutions in the future, we will update the policy and request users' prior consent.",
            "You have the ability to control and delete cookies through your browser settings. You can set your browser to block certain cookies or alert you when a cookie is placed. Please note that completely disabling essential cookies may affect platform functionality. For more details about the specific cookies we use and your options, please consult the site's Cookie Policy (if available) or the privacy settings section on VoceaCampusului.ro.",
            "Continuing to use our site with your browser set to accept cookies implies your implicit consent to the use of these technologies, within the limits of this privacy policy."
          ]
        },
        {
          title: "Your Rights as a Data Subject",
          content: [
            "Under GDPR, you have the following rights regarding your personal data:",
            "- Right of access – You can request information about the personal data we process about you and a copy of it.",
            "- Right to rectification – You can request the correction of inaccurate data or the completion of incomplete data.",
            "- Right to erasure (\"right to be forgotten\") – Under certain conditions, you can request the erasure of your personal data.",
            "- Right to restriction of processing – In certain situations, you can request the limitation of the processing of your personal data.",
            "- Right to data portability – You can receive your personal data in a structured, commonly used and machine-readable format and/or request the transmission of this data to another controller.",
            "- Right to object – You can object to the processing of your personal data in certain circumstances, such as direct marketing.",
            "- Right not to be subject to automated individual decision-making – You have the right not to be subject to a decision based solely on automated processing, including profiling, which produces legal effects concerning you or similarly significantly affects you.",
            "To exercise any of these rights, please contact us using the contact details provided in the \"Contact\" section of this policy. We will respond to your requests within 30 days, with the possibility of extending this period by an additional 60 days if necessary, in accordance with GDPR.",
            "You also have the right to lodge a complaint with the National Supervisory Authority for Personal Data Processing (ANSPDCP) if you believe that the processing of your personal data violates GDPR."
          ]
        },
        {
          title: "Data Security",
          content: [
            "We are committed to protecting your personal data and implementing appropriate technical and organizational measures to ensure its security. Among the measures we implement are:",
            "- Encryption of sensitive data",
            "- Role-based access control",
            "- Regular monitoring and auditing of systems",
            "- Employee training in data security",
            "- Regular updates of systems and software",
            "While we implement robust security measures, please note that no method of transmission over the internet or electronic storage is 100% secure. Therefore, we cannot guarantee absolute security of data transmitted to or from our website."
          ]
        },
        {
          title: "Data Transfers Outside the EEA",
          content: [
            "Generally, your personal data is stored and processed in the European Economic Area (EEA). However, in certain cases, data may be transferred to countries outside the EEA, such as the United States, when we use services from third-party providers (e.g., hosting or analytics services).",
            "In such cases, we ensure that data transfers are carried out in accordance with GDPR, using one of the following mechanisms:",
            "- European Commission adequacy decisions",
            "- Standard contractual clauses",
            "- Certification mechanisms (such as Privacy Shield for transfers to the US)",
            "You can obtain more information about data transfers and applicable safeguards by contacting us using the details provided in the \"Contact\" section."
          ]
        },
        {
          title: "Contact",
          content: [
            "If you have any questions or concerns about this Privacy Policy or if you wish to exercise your rights as a data subject, please contact us at:",
            "Email: contact@voceacampusului.ro",
            "Address: B-dul Basarabia no. 256G, office 7.1.B, Sector 3, Bucharest, Romania",
            "Phone: +40 752 475 753",
            "Name: VoceaCampusului.ro",
            "VAT ID: 45173290",
            "Registration number: J40/19151/2021",
            "Please include in your message all necessary information to enable us to identify and process your request appropriately."
          ]
        },
        {
          title: "Changes to the Privacy Policy",
          content: [
            "We reserve the right to update or modify this Privacy Policy at any time. We will inform you of any significant changes by posting the new version of the policy on our website or through other appropriate means of communication.",
            "We encourage you to periodically review this Privacy Policy to stay informed about how we are protecting your information.",
            "Last updated: 29.04.2025"
          ]
        }
      ]
    }
  }, [language])

  return (
    <div className="container max-w-4xl py-12">
      <h1 className="text-4xl font-bold text-purple-600 mb-8">{content.title}</h1>
      
      <div className="prose dark:prose-invert max-w-none">
        {content.sections.map((section, index) => (
          <section key={index} className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{section.title}</h2>
            <div className="space-y-4">
              {section.content.map((paragraph, pIndex) => (
                <p key={pIndex}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
} 