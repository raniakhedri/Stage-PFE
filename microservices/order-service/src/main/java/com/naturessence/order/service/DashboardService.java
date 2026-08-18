package com.naturessence.order.service;

import com.naturessence.shared.dto.response.DashboardResponse;
import com.naturessence.shared.entity.*;
import com.naturessence.shared.enums.AccountStatus;
import com.naturessence.shared.enums.OrderStatus;
import com.naturessence.shared.enums.ReturnStatus;
import com.naturessence.shared.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ReturnRequestRepository returnRequestRepository;
    private final ReviewRepository reviewRepository;
    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard() {
        List<Order> allOrders = orderRepository.findAllByOrderByCreatedAtDesc();
        List<Product> allProducts = productRepository.findAllByOrderByCreatedAtDesc();
        List<ReturnRequest> allReturns = returnRequestRepository.findAllByOrderByCreatedAtDesc();
        List<Review> allReviews = reviewRepository.findAllByOrderByCreatedAtDesc();

        // ── KPI ──
        // Only count non-cancelled orders for revenue
        List<Order> revenueOrders = allOrders.stream()
                .filter(o -> o.getStatus() != OrderStatus.ANNULEE && o.getStatus() != OrderStatus.REMBOURSEE)
                .toList();

        double caTTC = revenueOrders.stream().mapToDouble(Order::getTotal).sum();
        double tvaTotal = revenueOrders.stream().mapToDouble(Order::getTvaAmount).sum();
        double caHT = caTTC - tvaTotal;
        double panierMoyen = revenueOrders.isEmpty() ? 0 : caTTC / revenueOrders.size();

        long commandesEnAttente = allOrders.stream().filter(o -> o.getStatus() == OrderStatus.EN_ATTENTE).count();

        long clientsActifs = userRepository.countByStatus(AccountStatus.ACTIVE);
        long nouveauxClients = userRepository.countNewClientsSince(LocalDateTime.now().minusDays(30));

        // Taux de retour = returns / delivered orders
        long ordersLivrees = allOrders.stream().filter(o -> o.getStatus() == OrderStatus.LIVREE).count();
        double tauxRetour = ordersLivrees > 0 ? (double) allReturns.size() / ordersLivrees * 100 : 0;

        // Note moyenne
        double noteMoyenne = allReviews.stream()
                .filter(r -> "Approuvé".equals(r.getStatut()))
                .mapToInt(Review::getNote)
                .average().orElse(0);

        // ── Inventaire ──
        List<Product> activeProducts = allProducts.stream()
                .filter(p -> !"archive".equals(p.getStatut()))
                .toList();

        long produitsRupture = activeProducts.stream().filter(p -> p.getStock() == 0).count();
        long produitsFaible = activeProducts.stream().filter(p -> p.getStock() > 0 && p.getStock() <= 10).count();
        double valeurStock = activeProducts.stream().mapToDouble(p -> p.getStock() * p.getSalePrice()).sum();

        List<DashboardResponse.StockAlertItem> ruptureList = activeProducts.stream()
                .filter(p -> p.getStock() == 0)
                .limit(10)
                .map(p -> DashboardResponse.StockAlertItem.builder()
                        .id(p.getId()).nom(p.getNom()).sku(p.getSku())
                        .stock(p.getStock()).imageUrl(p.getImageUrl()).build())
                .toList();

        List<DashboardResponse.StockAlertItem> faibleList = activeProducts.stream()
                .filter(p -> p.getStock() > 0 && p.getStock() <= 10)
                .sorted(Comparator.comparingInt(Product::getStock))
                .limit(10)
                .map(p -> DashboardResponse.StockAlertItem.builder()
                        .id(p.getId()).nom(p.getNom()).sku(p.getSku())
                        .stock(p.getStock()).imageUrl(p.getImageUrl()).build())
                .toList();

        // ── Alertes ──
        long retourEnAttente = allReturns.stream().filter(r -> r.getStatus() == ReturnStatus.EN_ATTENTE).count();
        long avisEnAttente = allReviews.stream().filter(r -> "En attente".equals(r.getStatut())).count();
        long commandesAnnulees = allOrders.stream().filter(o -> o.getStatus() == OrderStatus.ANNULEE).count();

        // ── Commandes par statut ──
        Map<OrderStatus, Long> ordersByStatus = allOrders.stream()
                .collect(Collectors.groupingBy(Order::getStatus, Collectors.counting()));

        // ── Commandes récentes ──
        List<DashboardResponse.RecentOrderItem> recentOrders = allOrders.stream()
                .limit(5)
                .map(o -> DashboardResponse.RecentOrderItem.builder()
                        .id(o.getId())
                        .reference(o.getReference())
                        .clientName(o.getFirstName() + " " + o.getLastName())
                        .status(o.getStatus().name())
                        .total(o.getTotal())
                        .createdAt(o.getCreatedAt() != null ? o.getCreatedAt().toString() : null)
                        .build())
                .toList();

        // ── Top produits par ventes ──
        Map<Long, int[]> productSales = new HashMap<>(); // productId -> [totalQty, totalRevenue]
        for (Order o : revenueOrders) {
            if (o.getItems() == null)
                continue;
            for (OrderItem item : o.getItems()) {
                productSales.computeIfAbsent(item.getProductId(), k -> new int[] { 0, 0 });
                int[] vals = productSales.get(item.getProductId());
                vals[0] += item.getQuantity();
                vals[1] += (int) (item.getLineTotal() != null ? item.getLineTotal() : 0);
            }
        }

        Map<Long, Product> productMap = allProducts.stream()
                .collect(Collectors.toMap(Product::getId, p -> p, (a, b) -> a));

        List<DashboardResponse.TopProductItem> topProduits = productSales.entrySet().stream()
                .sorted((a, b) -> Integer.compare(b.getValue()[0], a.getValue()[0]))
                .limit(5)
                .map(e -> {
                    Product p = productMap.get(e.getKey());
                    return DashboardResponse.TopProductItem.builder()
                            .id(e.getKey())
                            .nom(p != null ? p.getNom() : "Produit #" + e.getKey())
                            .imageUrl(p != null ? p.getImageUrl() : null)
                            .totalVendu(e.getValue()[0])
                            .totalRevenu(e.getValue()[1])
                            .stock(p != null ? p.getStock() : 0)
                            .categoryNom(p != null && p.getCategory() != null ? p.getCategory().getNom() : "—")
                            .build();
                })
                .toList();

        // ── CA par catégorie (catégories principales uniquement) ──
        Map<String, double[]> catRevenue = new HashMap<>();
        for (Order o : revenueOrders) {
            if (o.getItems() == null)
                continue;
            for (OrderItem item : o.getItems()) {
                Product p = productMap.get(item.getProductId());
                String catName;
                if (p != null && p.getCategory() != null) {
                    Category cat = p.getCategory();
                    // Remonter à la catégorie principale (parent)
                    while (cat.getParent() != null) {
                        cat = cat.getParent();
                    }
                    catName = cat.getNom();
                } else {
                    catName = "Autre";
                }
                catRevenue.computeIfAbsent(catName, k -> new double[] { 0, 0 });
                double[] vals = catRevenue.get(catName);
                vals[0] += item.getLineTotal() != null ? item.getLineTotal() : 0;
                vals[1] += item.getQuantity();
            }
        }

        List<DashboardResponse.CategoryRevenueItem> caParCategorie = catRevenue.entrySet().stream()
                .sorted((a, b) -> Double.compare(b.getValue()[0], a.getValue()[0]))
                .map(e -> DashboardResponse.CategoryRevenueItem.builder()
                        .category(e.getKey())
                        .revenu(e.getValue()[0])
                        .totalVendu((int) e.getValue()[1])
                        .build())
                .toList();

        // ── Clients stats ──
        long clientsFideles = userRepository.countBySegmentName("FIDELE");
        long clientsVIP = userRepository.countBySegmentName("VIP");
        long clientsInactifs = userRepository.countByStatus(AccountStatus.INACTIVE);

        // ── Tendances mensuelles (12 derniers mois) ──
        List<DashboardResponse.MonthlyData> tendances = new ArrayList<>();
        YearMonth now = YearMonth.now();
        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMM yyyy", Locale.FRENCH);

        for (int i = 11; i >= 0; i--) {
            YearMonth ym = now.minusMonths(i);
            LocalDateTime start = ym.atDay(1).atStartOfDay();
            LocalDateTime end = ym.atEndOfMonth().atTime(23, 59, 59);

            double monthCA = allOrders.stream()
                    .filter(o -> o.getStatus() != OrderStatus.ANNULEE && o.getStatus() != OrderStatus.REMBOURSEE)
                    .filter(o -> o.getCreatedAt() != null && !o.getCreatedAt().isBefore(start)
                            && !o.getCreatedAt().isAfter(end))
                    .mapToDouble(Order::getTotal)
                    .sum();

            long monthCmds = allOrders.stream()
                    .filter(o -> o.getCreatedAt() != null && !o.getCreatedAt().isBefore(start)
                            && !o.getCreatedAt().isAfter(end))
                    .count();

            tendances.add(DashboardResponse.MonthlyData.builder()
                    .mois(ym.format(monthFormatter))
                    .ca(monthCA)
                    .commandes(monthCmds)
                    .clients(0)
                    .build());
        }

        return DashboardResponse.builder()
                .caHT(caHT)
                .tvaTotal(tvaTotal)
                .caTTC(caTTC)
                .commandesEnAttente(commandesEnAttente)
                .commandesTotal(allOrders.size())
                .panierMoyen(panierMoyen)
                .clientsActifs(clientsActifs)
                .nouveauxClients30j(nouveauxClients)
                .tauxRetour(Math.round(tauxRetour * 10.0) / 10.0)
                .noteMoyenne(Math.round(noteMoyenne * 10.0) / 10.0)
                .produitsTotalActifs(activeProducts.size())
                .produitsRupture(produitsRupture)
                .produitsFaible(produitsFaible)
                .valeurStock(valeurStock)
                .produitsRuptureList(ruptureList)
                .produitsFaibleList(faibleList)
                .retourEnAttente(retourEnAttente)
                .avisEnAttente(avisEnAttente)
                .commandesAnnulees(commandesAnnulees)
                .cmdEnAttente(ordersByStatus.getOrDefault(OrderStatus.EN_ATTENTE, 0L))
                .cmdConfirmee(ordersByStatus.getOrDefault(OrderStatus.CONFIRMEE, 0L))
                .cmdEnPreparation(ordersByStatus.getOrDefault(OrderStatus.EN_PREPARATION, 0L))
                .cmdExpediee(ordersByStatus.getOrDefault(OrderStatus.EXPEDIEE, 0L))
                .cmdLivree(ordersByStatus.getOrDefault(OrderStatus.LIVREE, 0L))
                .cmdAnnulee(ordersByStatus.getOrDefault(OrderStatus.ANNULEE, 0L))
                .cmdRemboursee(ordersByStatus.getOrDefault(OrderStatus.REMBOURSEE, 0L))
                .commandesRecentes(recentOrders)
                .topProduits(topProduits)
                .caParCategorie(caParCategorie)
                .clientsFideles(clientsFideles)
                .clientsVIP(clientsVIP)
                .clientsInactifs(clientsInactifs)
                .tendancesMensuelles(tendances)
                .build();
    }
}
