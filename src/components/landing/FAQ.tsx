import { FAQ_ITEMS } from "./faq-data";

const FAQ_CONTENT = {
  "items.difference.question": "C'est différent d'Anki ou de Quizlet ?",
  "items.difference.answer": "Anki ne génère rien — tu écris tes cartes à la main. Quizlet fait des QCM basiques. Studra prend ton cours et génère flashcards, fiches, schémas, examens et dialogues socratiques, le tout connecté au même algorithme de répétition espacée.",
  "items.accuracy.question": "L'IA peut se tromper sur les flashcards générées ?",
  "items.accuracy.answer": "Oui, ça arrive. Chaque carte est éditable en un clic. On affiche un score de confiance quand la génération hésite, et tu peux corriger ou supprimer en deux secondes.",
  "items.privacy.question": "Mes cours sont confidentiels ?",
  "items.privacy.answer": "Tes cours te restent. On ne les utilise pas pour entraîner de modèle. Les fichiers sont chiffrés, hébergés en Europe, et tu peux tout supprimer depuis ton compte.",
  "items.subjects.question": "Ça marche pour quelles matières ?",
  "items.subjects.answer": "Toutes les matières textuelles fonctionnent très bien — histoire, philo, SVT, langues, droit, médecine. Pour les maths et la physique, les flashcards et les fiches sont solides ; les schémas conceptuels marchent moins bien sur des démonstrations longues.",
  "items.results.question": "Combien de temps avant de voir un effet ?",
  "items.results.answer": "Dès la première semaine, tu remarques ce que tu retiens vraiment et ce que tu pensais retenir. L'effet sur la mémoire long terme est mesurable après deux à trois semaines de sessions régulières.",
  "items.cancel.question": "Je peux annuler Pro à tout moment ?",
  "items.cancel.answer": "Oui, en un clic depuis les paramètres. Pas de période d'engagement. Tu gardes Pro jusqu'à la fin du mois en cours, puis tu repasses sur Free sans rien perdre.",
  "items.trial.question": "Vous avez un essai gratuit ?",
  "items.trial.answer": "Le plan Free n'est pas une démo limitée dans le temps : il reste gratuit. Pour tester Pro, on rembourse les 14 premiers jours si ça ne te convient pas.",
  "items.teacher.question": "Studra remplace mon prof ?",
  "items.teacher.answer": "Non.",
} as const;
export default function FAQ() {
  return (
    <section className="sec" id="faq">
      <div className="container" style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 48 }}>
          <div className="eyebrow">
            <span className="eyebrow-dot" style={{ background: "var(--ink-400)", animation: "none" }} />
            <span>{"Questions fréquentes"}</span>
          </div>
          <h2 className="section-h">
            {"Tout ce que tu peux te demander"}<br />
            <span className="dim">{"avant de t'inscrire."}</span>
          </h2>
        </div>

        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {FAQ_ITEMS.map((item, index) => (
            <li key={item.questionKey} style={{ borderBottom: "1px solid var(--ink-200)" }}>
              <details className="faq-native" open={index === 0}>
                <summary style={{ width: "100%", padding: "22px 4px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, fontSize: 17.5, fontWeight: 500, letterSpacing: "-.015em", color: "var(--ink)", cursor: "pointer", textAlign: "left" }}>
                  <span>{FAQ_CONTENT[item.questionKey]}</span>
                  <span className="faq-symbol" aria-hidden="true" />
                </summary>
                <div style={{ padding: "0 4px 22px", fontSize: 15.5, lineHeight: 1.6, color: "var(--ink-700)", maxWidth: "60ch" }}>
                  {FAQ_CONTENT[item.answerKey]}
                </div>
              </details>
            </li>
          ))}
        </ul>
      </div>

      <style>{`
        .faq-native summary { list-style: none; }
        .faq-native summary::-webkit-details-marker { display: none; }
        .faq-symbol {
          color: var(--ink-400);
          flex-shrink: 0;
          font-size: 22px;
          font-weight: 400;
          line-height: 1;
        }
        .faq-symbol::before { content: "+"; }
        .faq-native[open] .faq-symbol::before { content: "−"; }
      `}</style>
    </section>
  );
}
