/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ClientStats } from './ClientStats';
import type { EvolutionMensuelle } from './EvolutionMensuelle';
import type { ProduitStats } from './ProduitStats';
export type TableauDeBordResponse = {
    chiffreAffairesMois?: number;
    chiffreAffairesAnnee?: number;
    evolutionCA?: number;
    nombreFacturesEmises?: number;
    nombreFacturesPayees?: number;
    nombreFacturesEnAttente?: number;
    montantFacturesEnAttente?: number;
    montantFacturesEnRetard?: number;
    nombreClients?: number;
    nombreNouveauxClients?: number;
    montantMoyenParClient?: number;
    nombreProduits?: number;
    nombreProduitsActifs?: number;
    nombreProduitsAlerteStock?: number;
    valeurTotaleStock?: number;
    nombreMouvementsStock?: number;
    montantAchatsMois?: number;
    nombreBonsCommande?: number;
    nombreBonsAchat?: number;
    soldeTresorerie?: number;
    encaissementsPrevus?: number;
    decaissementsPrevus?: number;
    topProduits?: Array<ProduitStats>;
    topClients?: Array<ClientStats>;
    evolutionCA12Mois?: Array<EvolutionMensuelle>;
    dateGeneration?: string;
};

