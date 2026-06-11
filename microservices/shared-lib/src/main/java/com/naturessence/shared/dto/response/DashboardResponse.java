package com.naturessence.shared.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class DashboardResponse {

    // KPI
    private double caHT;
    private double tvaTotal;
    private double caTTC;
    private long commandesEnAttente;
    private long commandesTotal;
    private double panierMoyen;
    private long clientsActifs;
    private long nouveauxClients30j;
    private double tauxRetour;
    private double noteMoyenne;

    // Inventaire
    private long produitsTotalActifs;
    private long produitsRupture;
    private long produitsFaible;
    private double valeurStock;
    private List<StockAlertItem> produitsRuptureList;
    private List<StockAlertItem> produitsFaibleList;

    // Alertes
    private long retourEnAttente;
    private long avisEnAttente;
    private long commandesAnnulees;

    // Commandes par statut
    private long cmdEnAttente;
    private long cmdConfirmee;
    private long cmdEnPreparation;
    private long cmdExpediee;
    private long cmdLivree;
    private long cmdAnnulee;
    private long cmdRemboursee;

    // Commandes récentes
    private List<RecentOrderItem> commandesRecentes;

    // Top produits par ventes
    private List<TopProductItem> topProduits;

    // CA par catégorie
    private List<CategoryRevenueItem> caParCategorie;

    // Clients stats
    private long clientsFideles;
    private long clientsVIP;
    private long clientsInactifs;

    // Tendances mensuelles (12 mois)
    private List<MonthlyData> tendancesMensuelles;

    @Data
    @Builder
    public static class StockAlertItem {
        private Long id;
        private String nom;
        private String sku;
        private int stock;
        private String imageUrl;
    }

    @Data
    @Builder
    public static class RecentOrderItem {
        private Long id;
        private String reference;
        private String clientName;
        private String status;
        private double total;
        private String createdAt;
    }

    @Data
    @Builder
    public static class TopProductItem {
        private Long id;
        private String nom;
        private String imageUrl;
        private int totalVendu;
        private double totalRevenu;
        private int stock;
        private String categoryNom;
    }

    @Data
    @Builder
    public static class CategoryRevenueItem {
        private String category;
        private double revenu;
        private int totalVendu;
    }

    @Data
    @Builder
    public static class MonthlyData {
        private String mois;
        private double ca;
        private long commandes;
        private long clients;
    }
}
