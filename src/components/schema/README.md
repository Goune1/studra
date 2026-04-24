# Schema canvas

Canvas natif React + SVG + Pointer Events pour l'édition des schémas conceptuels.
Aucune dépendance externe : tout est fait avec Tailwind 4, du SVG et des events natifs.

## Architecture

```
components/schema/
  Canvas.tsx         # orchestre viewport, pan/zoom, drag & drop, rendering
  Node.tsx           # nœud HTML (memoïsé) positionné par transform
  Edge.tsx           # arête SVG (Bezier) memoïsée
  Minimap.tsx        # mini-carte avec rect de viewport déplaçable
  Toolbar.tsx        # barre d'outils flottante (zoom, ajout, layout, lock, save)
  ContextBar.tsx     # barre contextuelle au-dessus d'un nœud sélectionné
  hooks/
    useViewport.ts     # helpers de pan/zoom (facultatifs)
    usePointerDrag.ts  # helper startPointerDrag pour pointer events
    useSchemaStore.ts  # reducer principal (nodes, edges, viewport, selection, locked, dirty)
    useAutoLayout.ts   # layout hiérarchique avec fallback radial
  utils/
    geometry.ts        # ancrages, Bezier, rects
    coords.ts          # conversion écran ↔ canvas, clamp zoom
    adapter.ts         # normalizeSchemaData (back-compat) + serializeSchemaData
```

Le composant `SchemaEditor` (dans `app/(dashboard)/schemas/[schemaId]/`) joue le
rôle d'orchestrateur : il instancie le store, branche le Canvas, la Toolbar, la
Minimap et la ContextBar, et gère la persistance.

## Données

Le JSONB stocké en Supabase respecte le schéma :

```ts
type SchemaNode = { id; label; x; y; width?; height?; color?: 'primary'|'neutral'|'accent' }
type SchemaEdge = { id; source; target; label? }
type SchemaViewport = { x; y; zoom }
type SchemaData = { nodes; edges; viewport? }
```

L'`adapter.ts` normalise les anciens schémas (format React Flow avec `position`
et `data.category`) vers la nouvelle forme, ce qui assure la rétrocompatibilité
sans migration SQL : le JSONB stocke déjà n'importe quelle structure.

## Interactions

- **Pan** : clic gauche sur le fond ou un doigt.
- **Zoom** : molette (desktop), pinch à deux doigts (mobile), bornes 0.25 – 2.5.
- **Sélection** : clic simple, Shift+clic pour toggle multi-sélection.
- **Drag nœud** : clic/doigt maintenu — déplace tous les nœuds sélectionnés.
- **Édition label** : double-clic / double-tap — input inline.
- **Création d'arête** :
  - desktop : glisser depuis un handle (pastille violette).
  - mobile : bouton « Connecter » dans la ContextBar, puis tap sur le nœud cible.
- **Suppression** : touche `Suppr` ou bouton poubelle.
- **Raccourci save** : `Ctrl/Cmd+S`.

Le handler `Canvas.tsx` utilise uniquement `pointer events` et `touch-action:
none` pour désactiver le zoom et le scroll natifs, ce qui garantit une
expérience mobile fiable à une main.

## Performance

- Les `Node` et `Edge` sont mémoïsés ; un drag de nœud ne re-render que les
  arêtes connectées parce que React compare shallow les props et que seul le
  nœud déplacé change d'identité.
- Les transformations utilisent `transform: translate3d(...) scale(...)` et
  `will-change: transform` uniquement pendant le drag.
- `ResizeObserver` sur le container — aucune mesure dans la boucle de rendu.

## Points d'extension

- **Groupes de nœuds** : ajouter un champ `groupId` sur `SchemaNode` et rendre
  un calque SVG en arrière-plan qui dessine les rectangles de groupe.
- **Types de nœuds** : étendre `SchemaNodeColor` en `SchemaNodeKind` et
  brancher un registre de composants `Node*.tsx`.
- **Export PNG / SVG** : sérialiser le calque SVG + les nœuds (`html2canvas`
  facultatif) et déclencher un download via le bouton à ajouter à la `Toolbar`.
- **Historique undo/redo** : ajouter un middleware sur `useSchemaStore` qui
  empile les snapshots sur chaque action `dirty`-ifiante.
- **Collaboration temps réel** : utiliser Supabase Realtime pour broadcaster
  les actions du reducer via un canal par `schemaId`.
