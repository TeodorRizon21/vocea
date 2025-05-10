"use client";

import { useLanguage } from "@/components/LanguageToggle"
import { useMemo } from "react"

const RO_TRANSLATIONS = {
  title: "Termeni și Condiții",
  lastUpdated: "Ultima actualizare",
  sections: {
    introduction: {
      title: "1. Introducere și Acceptarea Termenilor",
      content: {
        p1: "Bine ați venit pe platforma destinata anunturilor de proiecte pentru studenți operată de EARTHTRANSPORT LIMITED SRL, prin intermediul site-ului www.voceacampusului.ro (denumit în continuare \"Platforma\" sau \"Site-ul\"). Utilizarea acestui Site (crearea unui cont, încărcarea sau descărcarea de conținut, efectuarea de tranzacții etc.) implică acceptarea integrală și necondiționată a prezentelor Termeni și Condiții. Dacă nu sunteți de acord cu oricare dintre prevederile de mai jos, vă rugăm să nu utilizați Platforma.",
        p2: "Utilizatorul confirmă că are cel puțin 18 ani (sau este minor cu acordul reprezentantului legal) și că deține capacitatea legală de a încheia contracte conform legislației în vigoare. Prin acceptarea Termenilor, se încheie un acord juridic între Utilizator și EARTHTRANSPORT LIMITED SRL, guvernat de prevederile de mai jos și de legislația aplicabilă."
      }
    },
    definitions: {
      title: "2. Definiții",
      content: {
        intro: "În sensul prezentului document, următorii termeni vor fi interpretați astfel:",
        items: {
          platform: "Website-ul operat de EARTHTRANSPORT LIMITED SRL, care facilitează încărcarea, publicarea de anunturi de proiecte și lucrări între studenți.",
          user: "Orice persoană care accesează Platforma, indiferent dacă își creează sau nu cont, inclusiv cei care încarcă (vânzători) sau descarcă (cumpărători) conținut.",
          content: "Orice material (documente, proiecte, lucrări de seminar, lucrări de licență/disertație, referate etc.) pe care Utilizatorul îl încarcă pe Platformă în vederea vânzării sau pe care îl achiziționează de pe Platformă.",
          operator: "EARTHTRANSPORT LIMITED SRL, în calitate de proprietar și administrator al Platformei.",
          terms: "Prezentul acord contractual care stabilește regulile de utilizare a Platformei, drepturile și obligațiile părților (Utilizator și Operator)."
        }
      }
    },
    acceptance: {
      title: "3. Obligațiile Utilizatorilor și Responsabilitatea asupra Conținutului",
      content: {
        p1: "Prin utilizarea Platformei, fiecare Utilizator (atât vânzător, cât și cumpărător) își asumă următoarele obligații și responsabilități cu privire la conținutul încărcat, vândut sau cumpărat:",
        p2: "•	Originalitate și autenticitate: Utilizatorul garantează că fiecare lucrare sau anunt încărcat pe Platformă este o creație originală, autentică și îi aparține. Autorul oricărei lucrări academice este responsabil pentru asigurarea originalității conținutului acesteia. Este strict interzisă postarea sau vânzarea de conținut care nu vă aparține, pe care nu aveți dreptul legal de a-l distribui, sau care încalcă drepturile de autor ale terților. Utilizatorul se obligă să mențină un standard academic și etic ridicat, evitând orice formă de plagiat (inclusiv copierea parțială sau integrală a altor lucrări fără atribuirea sursei).",
        p3: "•	Interzicerea activităților ilegale: Utilizatorilor le este strict interzis să utilizeze Platforma pentru orice activități ilegale, imorale sau care încalcă politicile academice. Aceasta include (fără a se limita la) furnizarea, vânzarea, cumpărarea sau distribuirea de lucrări academice în scopul prezentării acestora drept creații proprii ale cumpărătorului. Astfel de fapte constituie încălcări grave ale prezentelor Termeni și Condiții și ale legislației din România. Nu postați conținut plagiat, duplicat sau care contravine normelor academice privind originalitatea. Utilizatorii care încearcă să cumpere lucrări pentru a le utiliza ca lucrări proprii comit de asemenea o abatere gravă și ilegală.",
        p4: "•	Consecințe academice: Utilizatorii înțeleg că utilizarea necorespunzătoare a materialelor achiziționate (spre exemplu, prezentarea unui anunt de proiect ca fiind propria lucrare într-un cadru academic) poate constitui plagiat academic și poate atrage sancțiuni din partea instituțiilor de învățământ (ex. anularea lucrării, exmatriculare, etc.). Platforma nu încurajează și nu tolerează astfel de practici, rolul său fiind strict de a facilita schimbul de cunoștințe și proiecte originale între studenți, nu de a submina integritatea academică. ",
        p5: "•	Exactitate și legalitate: Utilizatorul este singurul responsabil de legalitatea, calitatea, acuratețea și integritatea materialelor pe care le încarcă sau le transmite prin intermediul Platformei. Prin încărcarea de conținut, declarați și garantați că dețineți toate drepturile necesare asupra respectivului material și că acesta nu încalcă nicio lege sau reglementare în vigoare. Operatorul nu verifică în prealabil conținutul încărcat și nu garantează legalitatea, originalitatea sau calitatea acestuia – această responsabilitate aparține în întregime Utilizatorilor"
      }
    },
    accounts: {
      title: "4. Politica de Originalitate și Interzicerea Plagiatului",
      content: {
        p1: "Platforma EARTHTRANSPORT LIMITED SRL promovează și apără principiul integrității academice. Orice formă de plagiat este interzisă în mod explicit pe Site, atât prin politicile interne, cât și prin lege. În acest sens, următoarele reguli se aplică strict:",
        p2: "•	Definiția plagiatului: În contextul utilizării Platformei, plagiatul reprezintă prezentarea unei lucrări sau a unor părți dintr-o lucrare realizată de altcineva ca fiind creația proprie a Utilizatorului. Acest lucru poate include copierea ideilor, textelor, codului sursă sau oricăror elemente fără citarea corespunzătoare a sursei și fără acordul autorului original. De asemenea, vânzarea sau cumpărarea de lucrări cu scopul de a le utiliza ca materiale proprii constituie plagiat și este interzisă",
        p3: "•	Interdicția vânzării și cumpărării de lucrări academice: Este strict interzisă oferirea spre vânzare, vânzarea sau punerea la dispoziție, prin intermediul Platformei, a oricăror lucrări academice (referate, proiecte, lucrări de licență, disertație, lucrări de diplomă, doctorat etc.) în scopul utilizării lor frauduloase în cadrul unor evaluări sau prezentării ca fiind ale cumpărătorului. De asemenea, este interzis ca orice Utilizator al Platformei să achiziționeze astfel de lucrări cu intenția de a le prezenta ca fiind realizate de el însuși. Aceste fapte constituie încălcări ale legii educației și sunt considerate contravenții grave. ", 
        p4: "•	Declarație de originalitate: La încărcarea oricărui conținut pe Platformă, Utilizatorul (vânzător) declara pe proprie răspundere că materialul este original, că nu încalcă drepturi de autor și că nu a fost obținut prin plagiere. Furnizarea cu bună știință de informații false (de ex., declararea ca original a unui material plagiat) constituie o încălcare gravă a Termenilor și poate avea consecințe legale. ",
        p5: "EARTHTRANSPORT LIMITED SRL își rezervă dreptul de a verifica autenticitatea oricărui material postat și de a refuza publicarea sau de a elimina de pe Platformă orice conținut care ridică suspiciuni de plagiat sau încălcare a drepturilor de autor, fără notificare prealabilă și la libera sa discreție. "
      }
    },
    delivery: {
      title: "5. Politica de Livrare și Retur/Anulare",
      content: {
        p1: "Serviciile oferite de Platformă sunt livrate exclusiv în format digital. După confirmarea plății, activarea abonamentului se face automat în contul Utilizatorului.",
        p2: "Activarea este de regulă instantă, dar poate dura până la 24 de ore în cazuri excepționale. Nu sunt necesare livrări fizice.",
        p3: "Conform legislației privind furnizarea de conținut digital, Utilizatorul își pierde dreptul de retragere din momentul activării serviciului cu acordul său explicit.",
        p4: "Totuși, dacă apar erori tehnice sau activări greșite, Utilizatorii pot contacta suportul la liviu.covrig@gmail.com în termen de 7 zile. Cazurile vor fi analizate individual.",
        p5: "Utilizatorii pot anula reînnoirea automată oricând din cont. Accesul rămâne valabil până la finalul perioadei deja plătite. Nu se oferă rambursări pentru perioadele deja facturate."
      }
    },
    content: {
      title: "6. Sancțiuni Legale privind Plagiatul și Avertismente",
      content: {
        p1: "Utilizatorii trebuie să fie conștienți că plagiatul și comercializarea lucrărilor academice nu sunt doar interzise de Platformă, ci și ilegale, fiind pasibile de sancțiuni extrem de severe conform legislației din România. În lumina noilor modificări legislative (Legea nr. 427/2023, care amendează Legea Învățământului Superior nr. 199/2023), următoarele consecințe legale se pot aplica:",
        p2: "•	Amenzi contravenționale substanțiale: Orice persoană care vinde, oferă, cumpără sau primește în mod deliberat lucrări științifice, referate, proiecte, lucrări de absolvire, de licență, de diplomă, de disertație sau de doctorat, în scopul de a fi folosite ca atare de către altcineva, săvârșește o contravenție gravă. Conform legii, aceste fapte se sancționează cu amendă cuprinsă între 100.000 lei și 200.000 lei. Aceste amenzi se aplică atât celui care vinde sau oferă spre vânzare lucrările, cât și celui care le cumpără ori le folosește ilegal. Platforma va coopera cu autoritățile competente în identificarea oricăror astfel de activități ilegale, dacă este cazul.",
        p3: "•	Închiderea sau blocarea site-urilor implicate: Legea 427/2023 prevede că autoritățile pot solicita închiderea sau blocarea platformelor online care facilitează comercializarea acestor lucrări academice în mod ilegal. Mai exact, dacă pe un site se constată prezența unor oferte de vânzare a lucrărilor academice interzise, reprezentanții Poliției ori ai altor organe abilitate pot cere blocarea accesului la site-ul respectiv . În cazul în care lucrarea plagiată este distribuită online, aceasta trebuie eliminată imediat; în caz de refuz, domeniul web al site-ului poate fi blocat. ANCOM (Autoritatea Națională pentru Administrare și Reglementare în Comunicații) poate dispune blocarea domeniilor  .ro sau eliminarea conținutului ilicit de la sursă, pentru a preveni continuarea acestor fapte ",
        p4: "•	Răspundere civilă și penală: Pe lângă sancțiunile contravenționale (amenzi și blocarea site-urilor), utilizatorii care comit plagiat pot fi trași la răspundere civilă (de exemplu, obligarea la daune-interese către autorii de drept ai lucrărilor originale) și, în anumite cazuri grave, pot exista și consecințe penale (dacă faptele se circumscriu altor infracțiuni, cum ar fi infracțiuni de fals intelectual, înșelăciune etc.). EARTHTRANSPORT LIMITED SRL își declină orice responsabilitate față de astfel de acțiuni ilegale ale utilizatorilor, răspunderea aparținând exclusiv persoanelor implicate în comiterea faptelor. ",
        p5: "Avertisment: Platforma afișează în mod vizibil aceste reguli și așteptări. Continuarea utilizării serviciilor noastre după luarea la cunoștință a acestor prevederi constituie acceptarea faptului că ați fost informat despre riscurile și sancțiunile legale asociate plagiatului. În cazul încălcării acestor prevederi, EARTHTRANSPORT LIMITED SRL își rezervă dreptul de a lua măsuri interne imediate (eliminarea conținutului, suspendarea sau închiderea contului, interdicția de a mai folosi Platforma) fără nicio despăgubire pentru Utilizatorul în culpă, pe lângă demersurile legale externe care pot fi inițiate de autorități. "
      }
    },
    userContent: {
      title: "7. Dreptul Administratorului de a Elimina Conținut și de a Suspenda Conturi",
      content: {
        p1: "EARTHTRANSPORT LIMITED SRL, în calitate de administrator al Platformei VoceaCampusului.ro, are dreptul (dar nu și obligația generală) de a monitoriza conținutul încărcat de Utilizatori. În scopul asigurării respectării Termenilor și a legislației aplicabile, Operatorul își rezervă dreptul de a lua oricând următoarele măsuri, la propria discreție:",
        p2: "•	Ștergerea sau dezactivarea conținutului neconform: Orice material încărcat pe Site care încalcă prevederile prezentului document sau ale legii (de exemplu, conținut plagiat, care încalcă drepturi de autor, conținut ofensator, ilegal etc.) poate fi șters, dezactivat ori eliminat fără avertisment prealabil. Aceasta include și obligația de a elimina prompt orice lucrare distribuită online care încalcă legislația privind plagiatul, conform cerințelor legale. Utilizatorii înțeleg și acceptă că Platforma poate elimina conținutul considerat neconform imediat ce ia la cunoștință de acesta, pentru a se proteja pe sine și pe ceilalți utilizatori.",
        p3: "•	Suspendarea sau închiderea conturilor: În cazul încălcării grave sau repetate a Termenilor (precum tentativa de vânzare/cumpărare de lucrări plagiate, încărcarea de conținut ilegal, fraudă etc.), Operatorul poate suspenda temporar sau închide definitiv contul Utilizatorului vinovat, blocând accesul acestuia la Platformă. Această măsură poate fi luată și preventiv, dacă există indicii clare de activitate ilegală, până la clarificarea situației. ",
        p4: "•	Notificarea autorităților competente: EARTHTRANSPORT LIMITED SRL poate, la propria apreciere sau dacă este obligată de lege, să informeze autoritățile competente (ex: Poliția, Ministerul Educației, ANCOM) despre orice activități suspecte sau ilegale desfășurate prin intermediul Platformei. Acest lucru este posibil mai ales în cazurile de plagiat comercializat, pentru care legea prevede expres intervenția autorităților și sancționarea făptuitorilor. Orice colaborare cu autoritățile se va face în conformitate cu legislația aplicabilă și cu respectarea drepturilor persoanelor vizate (inclusiv, dacă este cazul, a normelor privind protecția datelor personale).",
        p5: "Prin luarea acestor măsuri, EARTHTRANSPORT LIMITED SRL urmărește să mențină integritatea Platformei și să se conformeze obligațiilor legale. Utilizatorii nu vor avea dreptul la nicio despăgubire sau rambursare pentru eventuale pierderi (de exemplu, pierderea accesului la cont sau a veniturilor potențiale din vânzări) survenite ca urmare a aplicării acestor măsuri disciplinare, dacă acestea sunt cauzate de încălcarea de către Utilizator a Termenilor sau a legii. "
      }
    },
    privacy: {
      title: "8. Limitarea Răspunderii EARTHTRANSPORT LIMITED SRL",
      content: {
        p1: "EARTHTRANSPORT LIMITED SRL, în calitate de Operator al Platformei, depune eforturi pentru a asigura funcționarea în siguranță și conformitatea legală a Site-ului, însă nu își asumă răspunderea pentru conținutul generat de Utilizatori sau pentru acțiunile acestora. Înțelegeți și acceptați explicit următoarele limitări de răspundere:",
        p2: "•	Conținut generat de Utilizatori: Platforma este un intermediar tehnic care găzduiește conținutul încărcat de Utilizatori, fără a exercita un control editorial prealabil. Ca atare, Operatorul nu este responsabil pentru conținutul încărcat de Utilizatori și nu garantează legalitatea, originalitatea, autenticitatea, acuratețea sau calitatea acestuia. Orice opinie, informație, recomandare sau punct de vedere exprimat în materialele publicate aparține exclusiv autorului respectiv (Utilizatorului) și nu reflectă neapărat punctul de vedere al EARTHTRANSPORT LIMITED SRL.",
        p3: "•	Utilizarea Platformei pe riscul propriu: Utilizarea Site-ului și a serviciilor se face pe propria răspundere a Utilizatorului. EARTHTRANSPORT LIMITED SRL nu garantează că funcționarea Platformei va fi neîntreruptă sau lipsită de erori, însă va depune toate diligențele pentru a remedia eventualele disfuncționalități într-un timp rezonabil. De asemenea, nu garantăm că veți obține rezultate academice sau profesionale utilizând materialele achiziționate prin Platformă. Orice utilizare a lucrărilor cumpărate (inclusiv prezentarea lor ca lucrări proprii) se face pe riscul exclusiv al Utilizatorului, care își asumă consecințele aferente (inclusiv eventuale sancțiuni academice sau legale). ",
        p4: "•	Exonerare de răspundere pentru plagiat și încălcări ale legii: EARTHTRANSPORT LIMITED SRL nu va fi ținută răspunzătoare sub nicio formă (civil, contravențional/administrativ sau penal) pentru faptele utilizatorilor care încalcă legea sau drepturile terților prin intermediul Platformei. Aceasta include, fără limitare, cazurile de plagiat, încălcare a drepturilor de autor, fraudă sau orice altă activitate ilicită desfășurată de Utilizatori. Utilizatorii poartă întreaga răspundere pentru acțiunile lor și pentru conținutul pe care îl furnizează, și înțeleg că ei înșiși vor suporta integral consecințele juridice ale faptelor lor (inclusiv amenzi, despăgubiri sau alte sancțiuni menționate la secțiunea 5 de mai sus). ",
        p5: "•	Limitarea răspunderii pentru daune indirecte: În limitele maxime permise de lege, EARTHTRANSPORT LIMITED SRL nu va fi responsabilă pentru daune indirecte, speciale, punitive sau colaterale survenite în legătură cu utilizarea Platformei sau a serviciilor sale. De exemplu, Operatorul nu va fi răspunzător pentru pierderea de profit, pierderea oportunităților de afaceri, afectarea reputației, sancțiuni academice sau orice alte consecințe indirecte suferite de Utilizatori ca urmare a utilizării (sau imposibilității de a utiliza) Site-ul ori a folosirii materialelor obținute prin intermediul acestuia. ",
        p6: "•	Forță majoră: EARTHTRANSPORT LIMITED SRL nu își asumă răspunderea pentru neexecutarea obligațiilor ce îi revin conform Termenilor, dacă o astfel de neexecutare este cauzată de un eveniment de forță majoră (evenimente imprevizibile și de neînlăturat, precum dezastre naturale, atacuri informatice grave, întreruperi ale rețelelor de energie sau comunicații, acțiuni guvernamentale, conflicte militare, atacuri teroriste, pandemii etc.). În caz de forță majoră, obligațiile afectate vor fi suspendate pe durata evenimentului, urmând a fi reluate după încetarea acestuia. ",
        p7: "•	EARTHTRANSPORT LIMITED SRL prelucrează datele cu caracter personal ale Utilizatorilor în conformitate cu Regulamentul (UE) 2016/679 (GDPR), iar detaliile sunt disponibile în Politica de Confidențialitate publicată pe www.voceacampusului.ro. "
      }
    },
    liability: {
      title: "9. Despăgubirea (Indemnizația) și Răspunderea Utilizatorului",
      content: {
        p1: "Utilizatorul este de acord să apere, să despăgubească și să exonereze de răspundere EARTHTRANSPORT LIMITED SRL, partenerii săi, afiliații, angajații, directorii și agenții săi, pentru orice pretenții, reclamații, acțiuni, proceduri, daune, obligații, pierderi, costuri și cheltuieli (inclusiv onorarii avocațiale) care decurg din:",
        p2: "1.	Încălcarea de către Utilizator a oricărei prevederi din acești Termeni și Condiții;",
        p3: "2.	Încălcarea de către Utilizator a oricărei legi sau reglementări aplicabile (inclusiv, dar fără a se limita la, legislația privind drepturile de autor și combaterea plagiatului); ",
        p4: "3.	Încălcarea drepturilor unei terțe părți (de ex. drepturi de proprietate intelectuală, dreptul la imagine, etc.) prin conținutul încărcat sau activitatea desfășurată pe Platformă; ",
        p5: "4.	Orice informație sau material postat de Utilizator pe Platformă care provoacă prejudicii unei terțe părți sau EARTHTRANSPORT LIMITED SRL. ",
        p6: "Această obligație de despăgubire supraviețuiește încetării sau rezilierii relației contractuale dintre Utilizator și Operator, rămânând aplicabilă pe toată durata necesară acoperirii eventualelor pretenții formulate împotriva Operatorului. În cazul în care EARTHTRANSPORT LIMITED SRL este implicată într-un litigiu ca urmare a unei fapte a Utilizatorului, Operatorul își rezervă dreptul de a solicita de la Utilizator acoperirea integrală a oricăror costuri sau prejudicii suferite, în conformitate cu legislația aplicabilă. "
      }
    },
    changes: {
      title: "10. Protecția Datelor cu Caracter Personal",
      content: {
        p1: "(Notă: Această secțiune sumarizează pe scurt politica de confidențialitate în măsura în care este relevantă pentru Termeni. Pentru detalii complete, consultați Politica de Confidențialitate separat.)",
        p2: "EARTHTRANSPORT LIMITED SRL prelucrează datele cu caracter personal ale Utilizatorilor în conformitate cu Regulamentul (UE) 2016/679 (GDPR) și legislația națională aplicabilă privind protecția datelor. Datele furnizate la crearea contului și în cursul utilizării Platformei vor fi prelucrate în scopul furnizării serviciilor, al comunicării cu Utilizatorii și al îndeplinirii obligațiilor legale (inclusiv, dacă este cazul, colaborarea cu autoritățile competente menționată la secțiunea 6). Platforma ia măsuri de securitate adecvate pentru protejarea datelor, însă Utilizatorii sunt și ei responsabili să mențină confidențialitatea datelor de acces la cont (parolă, etc.). Pentru mai multe informații despre cum colectăm, utilizăm și protejăm datele personale, vă rugăm să consultați documentul Politica de Confidențialitate disponibil pe Site.",
        }
    },
    contact: {
      title: "11. Proprietatea Intelectuală",
      content: {
        p1: "Toate elementele de grafică ale Platformei, baza de date, design-ul, logo-urile, mărcile, precum și orice alte materiale prezentate de EARTHTRANSPORT LIMITED SRL pe Site (cu excepția conținutului încărcat de Utilizatori) sunt protejate prin drepturi de proprietate intelectuală aparținând Operatorului sau licențiatorilor săi. Este interzisă copierea, distribuirea, publicarea sau utilizarea oricăror elemente ale Site-ului în alt scop decât cel pentru care au fost destinate, fără acordul prealabil scris al Operatorului.",
        p2: "Utilizatorii păstrează drepturile de autor asupra conținutului original pe care îl încarcă. Prin încărcarea de conținut pe Platformă, Utilizatorul acordă EARTHTRANSPORT LIMITED SRL o licență neexclusivă, gratuită, teritorial nelimitată, pentru a stoca, afișa și transmite acel conținut prin intermediul Platformei către alți Utilizatori interesați, strict în scopul operării serviciilor. Operatorul nu își asumă drepturi de proprietate asupra materialelor încărcate, dar poate elimina sau dezactiva conținutul care încalcă Termenii sau legea, conform secțiunilor 4 și 6 de mai sus.",
        p3: "Utilizatorul garantează că are dreptul de a acorda licența sus-menționată și că nicio prevedere a utilizării conținutului pe Platformă nu încalcă drepturile vreunui terț. Orice utilizare neautorizată a conținutului de pe Site (atât a celui aparținând Operatorului, cât și a celui aparținând altor Utilizatori) poate constitui o încălcare a legii și atrage răspunderea persoanei vinovate. "
      }
    },
    modify: {
      title: "12. Modificarea Termenilor și Încetarea Contractului",
      content: {
        p1: "EARTHTRANSPORT LIMITED SRL își rezervă dreptul de a modifica sau actualiza în orice moment prezentele Termeni și Condiții, pentru a reflecta schimbări legislative, modificări ale funcționalităților Platformei sau ale politicilor interne. Orice modificare substanțială va fi anunțată Utilizatorilor prin mijloace adecvate (de ex. e-mail la adresa asociată contului sau notificare pe Site) cu o anticipație rezonabilă înainte de intrarea în vigoare, permițându-vă să luați cunoștință de noile prevederi. Continuarea utilizării Platformei după data intrării în vigoare a modificărilor constituie acceptarea de către dumneavoastră a Termenilor și Condițiilor astfel actualizate.",
        p2: "Dacă nu sunteți de acord cu modificările propuse, trebuie să încetați utilizarea Platformei și, opțional, să solicitați ștergerea contului dumneavoastră. Termenii și Condițiile actuali sunt publicați pe Site, împreună cu data ultimei actualizări. Este responsabilitatea Utilizatorului să verifice periodic eventualele actualizări.",
        p3: "Operatorul poate înceta furnizarea serviciilor către un Utilizator sau poate rezilia unilateral prezentul acord (prin suspendarea sau ștergerea contului), în cazul nerespectării de către Utilizator a obligațiilor asumate (conform secțiunilor de mai sus) sau dacă decide încetarea activității Platformei. În caz de reziliere, secțiunile din Termeni care, prin natura lor, produc efecte și după încetare (de ex. secțiunile privind Limitarea Răspunderii, Despăgubirea, Legea aplicabilă) vor continua să fie aplicabile. "
      }
    },
    jurisd: {
      title: "13. Legea Aplicabilă și Jurisdicția",
      content: {
        p1: "Prezentul acord este guvernat de legea română. Orice dispută apărută între EARTHTRANSPORT LIMITED SRL și un Utilizator în legătură cu utilizarea Platformei sau cu acești Termeni și Condiții va fi soluționată, pe cât posibil, pe cale amiabilă. În cazul în care nu este posibilă rezolvarea amiabilă, litigiul va fi supus soluționării instanțelor judecătorești competente din România, de la sediul social al EARTHTRANSPORT LIMITED SRL.",
        p2: "Utilizatorul este de acord că, înainte de a recurge la instanță, va încerca notificarea Operatorului cu privire la orice problemă apărută și va acorda un termen rezonabil pentru remediere. Această clauză nu aduce atingere drepturilor consumatorilor (dacă Utilizatorul are calitate de consumator) de a recurge la mecanisme legale de soluționare a disputelor sau la autoritățile competente pentru protecția consumatorilor.",
        }
    },
    final: {
      title: "14. Dispoziții Finale",
      content: {
        p1: "În cazul în care orice prevedere a Termenilor și Condițiilor este declarată nulă, nevalidă sau inaplicabilă de către o instanță competentă, acea prevedere va fi înlăturată sau modificată în mod corespunzător, fără a afecta valabilitatea celorlalte prevederi rămase. Neexercitarea sau întârzierea în exercitarea de către EARTHTRANSPORT LIMITED SRL a oricărui drept prevăzut de Termeni nu va fi interpretată drept o renunțare la acel drept.",
        p2: "Prezentul document, împreună cu eventualele politici la care face referire (ex: Politica de Confidențialitate), constituie întregul acord dintre Utilizator și Operator privind utilizarea Platformei și înlocuiește orice înțelegeri anterioare, scrise sau orale, referitoare la același subiect. Pentru orice clarificări sau întrebări privind Termenii și Condițiile, ne puteți contacta la adresa de email menționată pe Site.",
        p3: "Vă mulțumim că utilizați Platforma EARTHTRANSPORT LIMITED SRL într-un mod responsabil și legal. Ne dorim ca acest mediu să rămână unul sigur, etic și util pentru toți studenții. Prin respectarea acestor Termeni și a legislației, contribuiți la menținerea integrității academice și la succesul comunității noastre. ",
        p4: "Prin apăsarea butonului 'Accept' sau prin continuarea utilizării Platformei, confirmați că ați citit, ați înțeles și sunteți de acord cu acești Termeni și Condiții în integralitatea lor. ",
        p5: "EARTHTRANSPORT LIMITED SRL vă urează mult succes în activitatea academică și profesională, în condiții de onestitate și respect reciproc! "  
      }
    }
  }
}

const EN_TRANSLATIONS = {
  title: "Terms & Conditions",
  lastUpdated: "Last updated",
  sections: {
    introduction: {
      title: "1. Introduction and Acceptance of Terms",
      content: {
        p1: "Welcome to the platform dedicated to project announcements for students, operated by EARTHTRANSPORT LIMITED SRL through the website www.voceacampusului.ro (hereinafter referred to as the \"Platform\" or the \"Website\"). The use of this Website (creating an account, uploading or downloading content, conducting transactions, etc.) implies full and unconditional acceptance of these Terms and Conditions. If you do not agree with any of the provisions below, please do not use the Platform.",
        p2: "The User confirms that they are at least 18 years old (or a minor with the consent of a legal guardian) and that they have the legal capacity to enter into contracts in accordance with the applicable legislation. By accepting the Terms, a legal agreement is formed between the User and EARTHTRANSPORT LIMITED SRL, governed by the provisions below and the applicable laws."
      }
    },
    definitions: {
      title: "2. Definitions",
      content: {
        intro: "For the purpose of this document, the following terms shall be interpreted as follows:",
        items: {
          platform: "Platform/Site/VoceaCampusului.ro: The website operated by EARTHTRANSPORT LIMITED SRL that facilitates uploading, publishing, purchasing, and selling of projects and academic works between students.",
          user: "User: Any individual who accesses the Platform, regardless of whether they create an account, including those who upload (sellers) or download (buyers) content.",
          content: "Content: Any material (documents, projects, seminar papers, bachelor’s/master’s theses, reports, etc.) that the User uploads to the Platform for sale or purchases from the Platform.",
          operator: "Operator: EARTHTRANSPORT LIMITED SRL, as the owner and administrator of the Platform.",
          terms: "Terms and Conditions: This contractual agreement that establishes the rules for using the Platform, the rights and obligations of both parties (User and Operator)."
        }
      }
    },
    acceptance: {
      title: "3. User Obligations and Responsibility for Content",
      content: {
        p1: "By using the Platform, each User (both sellers and buyers) assumes the following obligations and responsibilities regarding the content uploaded, sold, or purchased:",
        p2: "• Originality and authenticity: The User guarantees that each work or project uploaded to the Platform is original, authentic, and their own creation. The author of any academic work is responsible for ensuring the originality of its content. It is strictly forbidden to post or sell content that you do not own, have no legal right to distribute, or that infringes third-party copyright. The User agrees to uphold a high academic and ethical standard, avoiding any form of plagiarism (including partial or full copying without proper source attribution).",
        p3: "Accuracy and legality: The User is solely responsible for the legality, quality, accuracy, and integrity of the materials uploaded or transmitted via the Platform. By uploading content, you declare and warrant that you hold all necessary rights to the material and that it does not violate any laws or regulations. The Operator does not pre-screen content and does not guarantee its legality, originality, or quality – full responsibility lies with the Users.",
        p4: "Prohibition of illegal activities: Users are strictly prohibited from using the Platform for any illegal, immoral activities or violations of academic policies. This includes (but is not limited to) providing, selling, buying, or distributing academic works with the intention of presenting them as the buyer's own. Such acts constitute serious violations of these Terms and Romanian law. Do not post plagiarized, duplicate content or content violating academic originality standards. Users who purchase works intending to submit them as their own also commit serious and unlawful violations.",
        p5: "• Academic consequences: Users understand that improper use of purchased materials (e.g., presenting a bought project as one’s own in an academic context) may constitute academic plagiarism and result in sanctions from educational institutions (e.g., cancellation of the work, expulsion, etc.). The Platform does not encourage or tolerate such practices—its role is strictly to facilitate the exchange of original projects and knowledge between students, not to undermine academic integrity. "
      }
    },
    accounts: {
      title: "4. Originality Policy and Plagiarism Prohibition",
      content: {
        p1: "EARTHTRANSPORT LIMITED SRL’s Platform promotes and upholds the principle of academic integrity. Any form of plagiarism is explicitly prohibited on the Site, both by internal policies and law. Accordingly, the following rules strictly apply:",
        p2: "• Definition of plagiarism: In the context of Platform use, plagiarism means presenting a work or parts of a work created by someone else as the User’s own. This includes copying ideas, texts, source code, or any other elements without proper citation or the original author’s consent. Selling or buying works with the intent to use them as your own also constitutes plagiarism and is forbidden.",
        p3: "• Prohibition of selling and buying academic works: Offering, selling, or providing any academic papers (e.g., reports, projects, bachelor’s/master’s/PhD theses) through the Platform for fraudulent use in evaluations or as someone else's work is strictly forbidden. Users are also prohibited from purchasing such works with the intent to present them as their own. These acts violate education laws and are considered serious offenses.",
        p4: "• Originality statement: When uploading any content to the Platform, the User (seller) declares under their own responsibility that the material is original, does not infringe copyright, and was not obtained through plagiarism. Knowingly submitting false information (e.g., claiming plagiarized content as original) is a serious violation of these Terms and may have legal consequences.",
        p5: "EARTHTRANSPORT LIMITED SRL reserves the right to verify the authenticity of any posted material and may refuse publication or remove any content suspected of plagiarism or copyright infringement without prior notice and at its sole discretion."
      }
    },
    delivery: {
      title: "5. Delivery and Cancellation Policy",
      content: {
        p1: "The services provided through the Platform are delivered exclusively in digital format. Once payment is confirmed, the subscription is automatically activated in the User’s account.",
        p2: "Activation is usually instant, but may take up to 24 hours in exceptional cases. No physical delivery is required.",
        p3: "According to legislation on digital content, the User loses their right of withdrawal once the service has been activated with their explicit consent.",
        p4: "However, if technical errors or incorrect activations occur, Users may contact support at liviu.covrig@gmail.com within 7 days. Each case will be reviewed individually.",
        p5: "Users can cancel auto-renewal at any time from their account. Access remains active until the end of the already paid period. No refunds are provided for billed periods."
      }
    },
    content: {
      title: "6. Legal Sanctions for Plagiarism and Warnings",
      content: {
        p1: "Users must be aware that plagiarism and academic work trading are not only prohibited by the Platform but also illegal, subject to severe penalties under Romanian law. In light of recent legislative changes (Law no. 427/2023, amending Law no. 199/2023 on Higher Education), the following legal consequences may apply:",
        p2: "• Substantial fines: Anyone who sells, offers, buys, or knowingly receives academic works (e.g., theses, reports, projects) for use by another person commits a serious offense. By law, these actions are punishable by fines between 100,000 and 200,000 RON. Fines apply to both the seller and the buyer. The Platform will cooperate with authorities in identifying such illegal activities when applicable.",
        p3: "• Website shutdown or blocking: Law 427/2023 allows authorities to request the closure or blocking of online platforms that facilitate illegal trading of academic works. If prohibited content is found on a website, police or other authorized bodies can request access to be blocked. If plagiarized work is distributed online, it must be removed immediately; failure to do so can result in domain blocking by ANCOM (National Authority for Communications).",
        p4: "• Civil and criminal liability: Beyond administrative penalties (fines and site blocking), users committing plagiarism may face civil liability (e.g., damages to original authors) and, in severe cases, criminal charges (e.g., intellectual fraud, deception). EARTHTRANSPORT LIMITED SRL disclaims any responsibility for users’ illegal actions, with full liability falling on the offenders. ",
        p5: "Warning: These rules and expectations are prominently displayed. Continued use of our services after reading this section constitutes your acknowledgment of the legal risks and consequences of plagiarism. In the event of violations, EARTHTRANSPORT LIMITED SRL reserves the right to take immediate internal measures (content removal, account suspension/deletion, Platform access ban), with no compensation due to the offending User, in addition to external legal action. ",
      }
    },
    userContent: {
      title: "7. Administrator's Right to Remove Content and Suspend Accounts",
      content: {
        p1: "EARTHTRANSPORT LIMITED SRL, as the administrator of VoceaCampusului.ro, reserves the right (but not the general obligation) to monitor content uploaded by Users. To ensure compliance with these Terms and applicable law, the Operator may take the following measures at its discretion:",
        p2: "• Removing or disabling non-compliant content: Any content that violates these Terms or the law (e.g., plagiarized, offensive, or illegal material) may be deleted, disabled, or removed without prior warning. This includes the obligation to promptly remove plagiarized works distributed online under legal requirements.",
        p3: "• Suspending or closing accounts: In cases of serious or repeated violations (e.g., trading plagiarized works, uploading illegal content, fraud), the Operator may temporarily suspend or permanently close the User’s account. Preventive action may also be taken if there is clear evidence of illegal activity.",
        p4: "• Notifying authorities: EARTHTRANSPORT LIMITED SRL may, at its discretion or if required by law, inform relevant authorities (e.g., Police, Ministry of Education, ANCOM) of suspicious or illegal activities conducted via the Platform, particularly in cases of commercial plagiarism. Collaboration will respect legal procedures and data protection regulations.",
        p5: "These measures aim to protect the Platform's integrity and ensure legal compliance. Users are not entitled to any compensation or refund for losses (e.g., lost access or sales revenue) resulting from disciplinary measures due to their own violations."
      }
    },
    privacy: {
      title: "8. Limitation of Liability of EARTHTRANSPORT LIMITED SRL",
      content: {
        p1: "As Platform Operator, EARTHTRANSPORT LIMITED SRL strives to ensure safe operation and legal compliance but assumes no responsibility for User-generated content or actions. Users explicitly agree to the following limitations:",
        p2: "• User-generated content: The Platform is a technical intermediary that hosts content without prior editorial control. The Operator is not responsible for User content and does not guarantee its legality, originality, authenticity, accuracy, or quality. Any opinions or materials reflect the author’s (User’s) view, not that of EARTHTRANSPORT LIMITED SRL.",
        p3: "• Use of the Platform at your own risk: Use of the Site and services is at your own risk. The Operator does not guarantee uninterrupted or error-free operation but will make reasonable efforts to fix issues. No academic or professional results are guaranteed through use of purchased materials. Misuse of such materials is entirely at the User’s risk and may lead to sanctions.",
        p4: "• No liability for plagiarism and legal violations: EARTHTRANSPORT LIMITED SRL shall not be liable (civilly, administratively, or criminally) for Users’ unlawful acts, including plagiarism, copyright violations, or fraud. Users bear full responsibility for their actions.",
        p5: "• Limitation of liability for indirect damages: To the maximum extent permitted by law, EARTHTRANSPORT LIMITED SRL shall not be liable for indirect, special, punitive, or collateral damages related to use of the Platform or its services.",
        p6: "• Force majeure: The Operator is not liable for failure to perform obligations due to force majeure events (e.g., natural disasters, cyberattacks, power outages, government actions, military conflicts, pandemics).",
        p7: "• Data processing: Personal data is processed in accordance with Regulation (EU) 2016/679 (GDPR); see the Privacy Policy on www.voceacampusului.ro for details."
      }
    },
    liability: {
      title: "9. User Indemnification and Liability",
      content: {
        p1: "The User agrees to defend, indemnify, and hold harmless EARTHTRANSPORT LIMITED SRL, its partners, affiliates, employees, directors, and agents from any claims, complaints, actions, proceedings, damages, obligations, losses, costs, and expenses (including attorney’s fees) arising from:",
        p2: "1.	The User’s violation of any provision of these Terms and Conditions;",
        p3: "2.	The User’s violation of any applicable law or regulation (including but not limited to copyright and anti-plagiarism legislation);",
        p4: "3.	The User’s infringement of any third party’s rights (e.g., intellectual property rights, image rights, etc.) through uploaded content or activities on the Platform;",
        p5: "4.	Any information or material posted by the User that causes harm to a third party or to EARTHTRANSPORT LIMITED SRL.",
        p6: "This indemnity obligation shall survive the termination of the contractual relationship between the User and the Operator and remains enforceable for as long as necessary to cover any potential claims against the Operator. If EARTHTRANSPORT LIMITED SRL becomes involved in a legal dispute due to a User's actions, the Operator reserves the right to seek full compensation from the User in accordance with applicable law."
      }
    },
    changes: {
      title: "10. Personal Data Protection",
      content: {
        p1: "(Note: This section provides a brief summary of the Privacy Policy as relevant to these Terms. For full details, see the separate Privacy Policy document.)",
        p2: "EARTHTRANSPORT LIMITED SRL processes Users’ personal data in accordance with Regulation (EU) 2016/679 (GDPR) and applicable national data protection laws. Data provided when creating an account or using the Platform is processed for service delivery, communication with Users, and legal compliance (including, if necessary, cooperation with authorities mentioned in section 6). The Platform applies appropriate security measures to protect data, but Users are also responsible for keeping their account access information (password, etc.) confidential. For more details on how personal data is collected, used, and protected, please refer to the Privacy Policy available on the Site."
      }
    },
    contact: {
      title: "11. Intellectual Property",
      content: {
        p1: "All graphical elements of the Platform, the database, design, logos, trademarks, and any other materials presented by EARTHTRANSPORT LIMITED SRL on the Site (excluding content uploaded by Users) are protected by intellectual property rights owned by the Operator or its licensors. Copying, distributing, publishing, or using any Site content for purposes other than its intended use is prohibited without prior written consent from the Operator.",
        p2: "Users retain copyright over the original content they upload. By uploading content to the Platform, the User grants EARTHTRANSPORT LIMITED SRL a non-exclusive, free, territory-unlimited license to store, display, and transmit that content via the Platform to other interested Users, solely for the purpose of operating the services. The Operator does not claim ownership of the uploaded materials but may remove or disable content that violates the Terms or the law, as outlined in sections 4 and 6.",
        p3: "The User warrants that they have the right to grant the aforementioned license and that no use of the content on the Platform infringes on third-party rights. Any unauthorized use of content on the Site (whether from the Operator or other Users) may constitute a legal violation and will result in the responsible party being held accountable."
      }
    },
    modify: {
      title: "12. Modification of the Terms and Termination of the Agreement",
      content: {
        p1: "EARTHTRANSPORT LIMITED SRL reserves the right to modify or update these Terms and Conditions at any time to reflect legal changes, Platform functionality updates, or internal policy adjustments. Any significant changes will be communicated to Users through appropriate means (e.g., email to the account-linked address or notification on the Site) with reasonable advance notice before taking effect, allowing you to review the new provisions. Continued use of the Platform after the changes take effect constitutes your acceptance of the updated Terms and Conditions",
        p2: "If you do not agree with the proposed changes, you must stop using the Platform and optionally request the deletion of your account. The current Terms and Conditions are published on the Site, along with the date of the last update. It is the User's responsibility to periodically check for updates.",
        p3: "The Operator may stop providing services to a User or unilaterally terminate this agreement (by suspending or deleting the account) in case of breach of obligations by the User (as described in the sections above) or if the Platform is discontinued. In the event of termination, the provisions that by their nature survive termination (e.g., Liability Limitation, Indemnity, Governing Law) will remain applicable."
      }
    },
    jurisd: {
      title: "13. Governing Law and Jurisdiction",
      content: {
        p1: "This agreement is governed by Romanian law. Any disputes between EARTHTRANSPORT LIMITED SRL and a User related to the use of the Platform or these Terms and Conditions will be resolved, as much as possible, amicably. If amicable resolution is not possible, the dispute will be submitted to the competent courts in Romania, at the registered office of EARTHTRANSPORT LIMITED SRL.",
        p2: "The User agrees that, before resorting to court, they will notify the Operator of any issue and allow a reasonable time for resolution. This clause does not affect the rights of consumers (if the User qualifies as a consumer) to access legal dispute resolution mechanisms or consumer protection authorities.",
        }
    },
    final: {
      title: "14. Final Provisions",
      content: {
        p1: "If any provision of these Terms and Conditions is declared void, invalid, or unenforceable by a competent court, that provision shall be removed or appropriately modified without affecting the validity of the remaining provisions. The failure or delay of EARTHTRANSPORT LIMITED SRL to exercise any right provided by these Terms shall not be construed as a waiver of that right.",
        p2: "This document, along with any policies it references (e.g., the Privacy Policy), constitutes the entire agreement between the User and the Operator regarding use of the Platform and replaces any prior agreements, written or oral, regarding the same subject. For any clarifications or questions regarding the Terms and Conditions, you may contact us at the email address listed on the Site.",
        p3: "Thank you for using EARTHTRANSPORT LIMITED SRL’s Platform responsibly and legally. We aim to keep this environment safe, ethical, and useful for all students. By respecting these Terms and the law, you contribute to preserving academic integrity and supporting our community’s success. ",
        p4: "By clicking “Accept” or by continuing to use the Platform, you confirm that you have read, understood, and agreed to these Terms and Conditions in full. ",
        p5: "EARTHTRANSPORT LIMITED SRL wishes you great success in your academic and professional journey, in the spirit of honesty and mutual respect!"  
      }
    },
  }
}

export default function TermsPage() {
  const { language } = useLanguage()
  const translations = language === "ro" ? RO_TRANSLATIONS : EN_TRANSLATIONS

  return (
    <div className="container max-w-4xl py-12">
      <h1 className="text-4xl font-bold text-purple-600 mb-8">{translations.title}</h1>
      
      <div className="prose dark:prose-invert max-w-none">
        {/* Section 1 */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{translations.sections.introduction.title}</h2>
          <div className="space-y-4">
            <p>{translations.sections.introduction.content.p1}</p>
            <p>{translations.sections.introduction.content.p2}</p>
          </div>
        </section>

        {/* Section 2 */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{translations.sections.definitions.title}</h2>
          <div className="space-y-4">
            <p>{translations.sections.definitions.content.intro}</p>
            <ul>
              <li><b>• Platforma/Site-ul/VoceaCampusului.ro:</b> {translations.sections.definitions.content.items.platform}</li>
              <li><b>• Utilizator:</b> {translations.sections.definitions.content.items.user}</li>
              <li><b>• Conținut:</b> {translations.sections.definitions.content.items.content}</li>
              <li><b>• Operator:</b> {translations.sections.definitions.content.items.operator}</li>
              <li><b>• Termeni și Condiții:</b> {translations.sections.definitions.content.items.terms}</li>
            </ul>
          </div>
        </section>

        {/* Section 3 */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{translations.sections.acceptance.title}</h2>
          <div className="space-y-4">
            <p>{translations.sections.acceptance.content.p1}</p>
            <p>{translations.sections.acceptance.content.p2}</p>
            <p>{translations.sections.acceptance.content.p3}</p>
            <p>{translations.sections.acceptance.content.p4}</p>
            <p>{translations.sections.acceptance.content.p5}</p>
          </div>
        </section>

        {/* Section 4 */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{translations.sections.accounts.title}</h2>
          <div className="space-y-4">
            <p>{translations.sections.accounts.content.p1}</p>
            <p>{translations.sections.accounts.content.p2}</p>
            <p>{translations.sections.accounts.content.p3}</p>
            <p>{translations.sections.accounts.content.p4}</p>
            <p>{translations.sections.accounts.content.p5}</p>
          </div>
        </section>

        {/* Section 5 */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{translations.sections.delivery.title}</h2>
          <div className="space-y-4">
            <p>{translations.sections.delivery.content.p1}</p>
            <p>{translations.sections.delivery.content.p2}</p>
            <p>{translations.sections.delivery.content.p3}</p>
            <p>{translations.sections.delivery.content.p4}</p>
            <p>{translations.sections.delivery.content.p5}</p>
          </div>
        </section>

        {/* Section 6 */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{translations.sections.content.title}</h2>
          <div className="space-y-4">
            <p>{translations.sections.content.content.p1}</p>
            <p>{translations.sections.content.content.p2}</p>
            <p>{translations.sections.content.content.p3}</p>
            <p>{translations.sections.content.content.p4}</p>
            <p>{translations.sections.content.content.p5}</p>
          </div>
        </section>

        {/* Section 7 */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{translations.sections.userContent.title}</h2>
          <div className="space-y-4">
            <p>{translations.sections.userContent.content.p1}</p>
            <p>{translations.sections.userContent.content.p2}</p>
            <p>{translations.sections.userContent.content.p3}</p>
            <p>{translations.sections.userContent.content.p4}</p>
            <p>{translations.sections.userContent.content.p5}</p>
          </div>
        </section>

        {/* Section 8 */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{translations.sections.privacy.title}</h2>
          <div className="space-y-4">
            <p>{translations.sections.privacy.content.p1}</p>
            <p>{translations.sections.privacy.content.p2}</p>
            <p>{translations.sections.privacy.content.p3}</p>
            <p>{translations.sections.privacy.content.p4}</p>
            <p>{translations.sections.privacy.content.p5}</p>
            <p>{translations.sections.privacy.content.p6}</p>
            <p>{translations.sections.privacy.content.p7}</p>
          </div>
        </section>

        {/* Section 9 */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{translations.sections.liability.title}</h2>
          <div className="space-y-4">
            <p>{translations.sections.liability.content.p1}</p>
            <p>{translations.sections.liability.content.p2}</p>
            <p>{translations.sections.liability.content.p3}</p>
            <p>{translations.sections.liability.content.p4}</p>
            <p>{translations.sections.liability.content.p5}</p>
            <p>{translations.sections.liability.content.p6}</p>
          </div>
        </section>

        {/* Section 10 */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{translations.sections.changes.title}</h2>
          <div className="space-y-4">
            <p>{translations.sections.changes.content.p1}</p>
            <p>{translations.sections.changes.content.p2}</p>
          </div>
        </section>

        {/* Section 11 */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{translations.sections.contact.title}</h2>
          <div className="space-y-4">
            <p>{translations.sections.contact.content.p1}</p>
            <p>{translations.sections.contact.content.p2}</p>
            <p>{translations.sections.contact.content.p3}</p>
          </div>
        </section>

        {/* Section 12 */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{translations.sections.modify.title}</h2>
          <div className="space-y-4">
            <p>{translations.sections.modify.content.p1}</p>
            <p>{translations.sections.modify.content.p2}</p>
            <p>{translations.sections.modify.content.p3}</p>
          </div>
        </section>

        {/* Section 13 */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{translations.sections.jurisd.title}</h2>
          <div className="space-y-4">
            <p>{translations.sections.jurisd.content.p1}</p>
            <p>{translations.sections.jurisd.content.p2}</p>
          </div>
        </section>

        {/* Section 14 */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{translations.sections.final.title}</h2>
          <div className="space-y-4">
            <p>{translations.sections.final.content.p1}</p>
            <p>{translations.sections.final.content.p2}</p>
            <p>{translations.sections.final.content.p3}</p>
            <p>{translations.sections.final.content.p4}</p>
            <p>{translations.sections.final.content.p5}</p>
          </div>
        </section>

        {/* Last Updated */}
        <p className="text-sm text-muted-foreground mt-12">
          {translations.lastUpdated}: {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  )
} 