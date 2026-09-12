# Programme d’affiliation : mise en production et exploitation

## Pré-requis bloquants

1. Appliquer les migrations Supabase dans l’ordre :
   - `015_atomic_generation_quota.sql`
   - `016_affiliate_production.sql`
2. Ajouter en Preview et Production :
   - `AFFILIATE_COOKIE_SECRET` : secret aléatoire d’au moins 32 caractères ;
   - `CRON_SECRET` : autre secret aléatoire ;
   - les variables Stripe, Supabase et `ADMIN_EMAIL` déjà utilisées par l’application.
3. Redéployer après les migrations et variables. Le code et la migration `016` doivent être livrés ensemble.

## Événements du webhook Stripe

L’endpoint `/api/webhooks/stripe` doit recevoir au minimum :

- `checkout.session.completed`
- `invoice.paid`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `refund.created`
- `charge.refunded` (compatibilité et rattrapage)
- `charge.dispute.created`
- `charge.dispute.closed`

Ne pas supprimer `refund.created` : une charge peut contenir plus de remboursements que la liste embarquée dans `charge.refunded`.

## Cycle d’une commission

1. `invoice.paid` crée une écriture `pending` à partir du montant encaissé hors taxes.
2. Après le délai configuré, le cron quotidien appelle `affiliate_mature_commissions` et la rend `payable`.
3. Un remboursement ou litige crée une écriture d’ajustement immuable. Les événements dupliqués sont ignorés.
4. L’admin prépare un lot : la base calcule et verrouille elle-même le montant net exact.
5. Après le transfert PayPal/bancaire, l’admin saisit obligatoirement la référence externe pour confirmer.
6. Si le transfert échoue, l’admin marque le lot en échec et les écritures redeviennent payables.

## Contrôles opérationnels

- Vérifier quotidiennement les erreurs 5xx de `/api/webhooks/stripe`.
- Inspecter `stripe_webhook_events` pour les lignes `failed` ou `processing` anciennes.
- Inspecter `affiliate_pending_adjustments` et `affiliate_pending_dispute_reversals` pour les lignes non traitées anciennes : elles signalent un événement reçu avant sa facture source ou une facture jamais rapprochée.
- Ne jamais modifier directement les montants, statuts de commission ou `payout_id` dans Supabase.
- Ne jamais confirmer un lot avant d’avoir une preuve du transfert externe.
- Un solde net négatif est reporté et compensé par les commissions futures.

## Test après déploiement

Effectuer avec des données Stripe de test :

1. attribution par un lien affilié puis création d’un nouveau compte ;
2. vérification de l’e-mail ou OAuth ;
3. paiement d’un abonnement et réception de `invoice.paid` ;
4. remboursement partiel puis total ;
5. envoi répété du même événement Stripe ;
6. création et clôture gagnée d’un litige ;
7. préparation, échec puis nouvelle préparation d’un paiement affilié ;
8. confirmation avec une référence externe.

Le déploiement n’est validé que si les montants du registre et le solde net correspondent à Stripe dans chaque scénario.
