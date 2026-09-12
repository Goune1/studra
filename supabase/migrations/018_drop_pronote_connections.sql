-- Retrait de l'intégration Pronote / simulateur bac.
-- Le code applicatif (routes /bac, /api/pronote/*, /api/bac/*) a été supprimé ;
-- plus aucun lecteur ni écrivain de cette table ne subsiste.
-- Supprime aussi les refresh tokens Pronote chiffrés qui y dormaient.
drop table if exists public.pronote_connections;
