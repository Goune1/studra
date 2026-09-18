import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const drafts = [
  ['comprehension.md', 'CT'],
  ['calcul.md', 'CAL'],
  ['conditions-minimales.md', 'CM'],
  ['expression.md', 'EX'],
  ['raisonnement-argumentation.md', 'RA'],
  ['logique.md', 'LOG'],
]

function readDraft(file) {
  return readFileSync(new URL(`../docs/tage-mage-drafts/${file}`, import.meta.url), 'utf8')
}

function levelOf(block) {
  const numeric = block.match(/Niveau(?:\s*:)?(?:\*\*)?\s*(?:—\s*)?([123])\b/i)?.[1]
  if (numeric) return Number(numeric)
  const label = block.match(/Niveau\s*:\*\*\s*(Accessible|Intermédiaire|Discriminant(?:e)?)/i)?.[1]?.toLowerCase()
  return label === 'accessible' ? 1 : label === 'intermédiaire' ? 2 : label?.startsWith('discriminant') ? 3 : null
}

test('les six brouillons contiennent dix questions structurellement complètes', () => {
  for (const [file, prefix] of drafts) {
    const source = readDraft(file)
    assert.match(source.slice(0, 700), /non publiable/i, `${file}: avertissement de publication absent de l’en-tête`)

    const headingPattern = new RegExp(`^##\\s+(${prefix}-\\d{2})\\b`, 'gm')
    const headings = [...source.matchAll(headingPattern)]
    assert.equal(headings.length, 10, `${file}: dix questions attendues`)
    assert.equal(new Set(headings.map((match) => match[1])).size, 10, `${file}: identifiants uniques attendus`)

    const levels = []
    const answerKeys = []
    for (let index = 0; index < headings.length; index += 1) {
      const start = headings[index].index
      const end = headings[index + 1]?.index ?? source.length
      const block = source.slice(start, end)
      const options = block.match(/^(?:[A-E]\.\s|\|\s*[A-E]\s*\|)/gm) ?? []
      const compactChoices = /Choix\s*:\*\*\s*A,\s*B,\s*C,\s*D,\s*E/i.test(block)
      assert.equal(compactChoices ? 5 : options.length, 5, `${file} ${headings[index][1]}: cinq choix attendus`)
      const answer = block.match(/\*\*Bonne réponse\s*:\s*([A-E])(?:\.[^*]*)?\*\*/i)?.[1]
        ?? block.match(/\*\*Bonne réponse\s*:\*\*\s*([A-E])\b/i)?.[1]
      assert.ok(answer, `${file} ${headings[index][1]}: bonne réponse manquante`)
      answerKeys.push(answer)
      const level = levelOf(block)
      assert.ok(level, `${file} ${headings[index][1]}: niveau manquant`)
      levels.push(level)
      for (const label of ['Explication', 'Méthode', 'Piège']) {
        assert.match(block, new RegExp(label, 'i'), `${file} ${headings[index][1]}: ${label.toLowerCase()} manquant`)
      }
      assert.match(block, /Distracteurs|Justification des distracteurs|Erreurs représentées par les distracteurs/i, `${file} ${headings[index][1]}: analyse des distracteurs manquante`)
    }

    assert.deepEqual(levels.toSorted(), [1, 1, 2, 2, 2, 2, 2, 3, 3, 3], `${file}: répartition 2/5/3 attendue`)
    assert.ok(new Set(answerKeys).size >= 3, `${file}: les clés doivent utiliser au moins trois positions`)
  }
})
