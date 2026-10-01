package com.naturessence.catalog.service;

import com.naturessence.shared.dto.request.ReviewRequest;
import com.naturessence.shared.dto.response.ReviewResponse;
import com.naturessence.shared.entity.Order;
import com.naturessence.shared.entity.Review;
import com.naturessence.shared.entity.User;
import com.naturessence.shared.enums.OrderStatus;
import com.naturessence.shared.repository.OrderRepository;
import com.naturessence.shared.repository.ReviewRepository;
import com.naturessence.shared.repository.ShopRepository;
import com.naturessence.shared.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final LoyaltyService loyaltyService;

    @Transactional
    public ReviewResponse createReview(Long userId, ReviewRequest req) {
        User user = userRepository
            .findById(userId)
            .orElseThrow(() ->
                new IllegalArgumentException("Utilisateur introuvable")
            );

        Order order = orderRepository
            .findById(req.getOrderId())
            .orElseThrow(() ->
                new IllegalArgumentException("Commande introuvable")
            );

        // Verify order belongs to user
        if (
            order.getUser() == null || !order.getUser().getId().equals(userId)
        ) {
            throw new IllegalArgumentException(
                "Cette commande ne vous appartient pas"
            );
        }

        // Verify order is delivered
        if (order.getStatus() != OrderStatus.LIVREE) {
            throw new IllegalArgumentException(
                "Vous ne pouvez donner un avis que sur une commande livrée"
            );
        }

        // Verify product exists in order
        boolean productInOrder = order
            .getItems()
            .stream()
            .anyMatch(item -> item.getProductId().equals(req.getProductId()));
        if (!productInOrder) {
            throw new IllegalArgumentException(
                "Ce produit ne fait pas partie de cette commande"
            );
        }

        // Check if already reviewed
        if (
            reviewRepository.existsByOrderIdAndProductId(
                req.getOrderId(),
                req.getProductId()
            )
        ) {
            throw new IllegalArgumentException(
                "Vous avez déjà donné un avis pour ce produit sur cette commande"
            );
        }

        String productName = order
            .getItems()
            .stream()
            .filter(item -> item.getProductId().equals(req.getProductId()))
            .map(item -> item.getProductName())
            .findFirst()
            .orElse("Produit");

        Review review = Review.builder()
            .user(user)
            .order(order)
            .productId(req.getProductId())
            .productName(productName)
            .note(req.getNote())
            .commentaire(req.getCommentaire())
            .statut("En attente")
            .build();

        Review saved = reviewRepository.save(review);
        // Loyalty points are granted when the merchant approves the review (see updateStatut).
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsByUser(Long userId) {
        return reviewRepository
            .findByUserIdOrderByCreatedAtDesc(userId)
            .stream()
            .map(this::mapToResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getAllReviews(String shopSlug) {
        Long shopId = shopIdOf(shopSlug);
        List<Review> reviews = shopId == null
            ? reviewRepository.findAllByOrderByCreatedAtDesc()
            : shopId < 0
                ? List.of()
                : reviewRepository.findByOrderShopId(shopId);
        return reviews.stream().map(this::mapToResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getApprovedReviewsByProduct(Long productId) {
        return reviewRepository
            .findByProductIdAndStatutOrderByCreatedAtDesc(productId, "Approuvé")
            .stream()
            .map(this::mapToResponse)
            .toList();
    }

    @Transactional
    public ReviewResponse updateStatut(Long reviewId, String statut, String shopSlug) {
        Review review = findInShop(reviewId, shopSlug);
        boolean approvedNow = "Approuvé".equals(statut) && !"Approuvé".equals(review.getStatut());
        review.setStatut(statut);
        Review saved = reviewRepository.save(review);
        if (approvedNow) loyaltyService.awardPointsForReview(saved.getUser(), saved.getId());
        return mapToResponse(saved);
    }

    @Transactional
    public ReviewResponse replyToReview(Long reviewId, String reponse, String shopSlug) {
        Review review = findInShop(reviewId, shopSlug);
        review.setReponse(reponse);
        return mapToResponse(reviewRepository.save(review));
    }

    @Transactional
    public void deleteReview(Long reviewId, String shopSlug) {
        Review review = findInShop(reviewId, shopSlug);
        reviewRepository.delete(review);
    }

    private Review findInShop(Long reviewId, String shopSlug) {
        Review review = reviewRepository
            .findById(reviewId)
            .orElseThrow(() -> new IllegalArgumentException("Avis introuvable"));
        Long shopId = shopIdOf(shopSlug);
        if (shopId == null) return review;
        Long orderShop = review.getOrder() != null ? review.getOrder().getShopId() : null;
        if (!shopId.equals(orderShop)) {
            throw new IllegalArgumentException("Avis introuvable");
        }
        return review;
    }

    private Long shopIdOf(String shopSlug) {
        if (shopSlug == null || shopSlug.isBlank()) return null;
        return shopRepository.findBySlug(shopSlug.trim().toLowerCase()).map(shop -> shop.getId()).orElse(-1L);
    }

    @Transactional(readOnly = true)
    public boolean hasReviewed(Long orderId, Long productId) {
        return reviewRepository.existsByOrderIdAndProductId(orderId, productId);
    }

    private ReviewResponse mapToResponse(Review r) {
        User user = r.getUser();
        String firstName = user != null && user.getFirstName() != null ? user.getFirstName() : "";
        String lastName = user != null && user.getLastName() != null ? user.getLastName() : "";
        String fullName = (firstName + " " + lastName).trim();
        String initials = (
            (firstName.isEmpty() ? "" : firstName.substring(0, 1)) +
            (lastName.isEmpty() ? "" : lastName.substring(0, 1))
        ).toUpperCase();

        return ReviewResponse.builder()
            .id(r.getId())
            .orderId(r.getOrder() != null ? r.getOrder().getId() : null)
            .orderReference(r.getOrder() != null ? r.getOrder().getReference() : null)
            .productId(r.getProductId())
            .productName(r.getProductName())
            .note(r.getNote())
            .commentaire(r.getCommentaire())
            .statut(r.getStatut())
            .reponse(r.getReponse())
            .userId(user != null ? user.getId() : null)
            .clientName(fullName.isEmpty() ? "Client" : fullName)
            .clientInitials(initials)
            .createdAt(r.getCreatedAt())
            .build();
    }
}
