package com.ecommerce.service;

import com.ecommerce.dto.request.ReviewRequest;
import com.ecommerce.dto.response.ReviewResponse;
import com.ecommerce.entity.Order;
import com.ecommerce.entity.Review;
import com.ecommerce.entity.User;
import com.ecommerce.enums.OrderStatus;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.ReviewRepository;
import com.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final LoyaltyService loyaltyService;

    @Transactional
    public ReviewResponse createReview(Long userId, ReviewRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));

        Order order = orderRepository.findById(req.getOrderId())
                .orElseThrow(() -> new IllegalArgumentException("Commande introuvable"));

        // Verify order belongs to user
        if (order.getUser() == null || !order.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Cette commande ne vous appartient pas");
        }

        // Verify order is delivered
        if (order.getStatus() != OrderStatus.LIVREE) {
            throw new IllegalArgumentException("Vous ne pouvez donner un avis que sur une commande livrée");
        }

        // Verify product exists in order
        boolean productInOrder = order.getItems().stream()
                .anyMatch(item -> item.getProductId().equals(req.getProductId()));
        if (!productInOrder) {
            throw new IllegalArgumentException("Ce produit ne fait pas partie de cette commande");
        }

        // Check if already reviewed
        if (reviewRepository.existsByOrderIdAndProductId(req.getOrderId(), req.getProductId())) {
            throw new IllegalArgumentException("Vous avez déjà donné un avis pour ce produit sur cette commande");
        }

        String productName = order.getItems().stream()
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

        // Award points for submitting a review
        loyaltyService.awardPointsForReview(user);

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsByUser(Long userId) {
        return reviewRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getAllReviews() {
        return reviewRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getApprovedReviewsByProduct(Long productId) {
        return reviewRepository.findByProductIdAndStatutOrderByCreatedAtDesc(productId, "Approuvé")
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public ReviewResponse updateStatut(Long reviewId, String statut) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Avis introuvable"));
        review.setStatut(statut);
        return mapToResponse(reviewRepository.save(review));
    }

    @Transactional
    public ReviewResponse replyToReview(Long reviewId, String reponse) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Avis introuvable"));
        review.setReponse(reponse);
        return mapToResponse(reviewRepository.save(review));
    }

    @Transactional
    public void deleteReview(Long reviewId) {
        if (!reviewRepository.existsById(reviewId)) {
            throw new IllegalArgumentException("Avis introuvable");
        }
        reviewRepository.deleteById(reviewId);
    }

    @Transactional(readOnly = true)
    public boolean hasReviewed(Long orderId, Long productId) {
        return reviewRepository.existsByOrderIdAndProductId(orderId, productId);
    }

    private ReviewResponse mapToResponse(Review r) {
        User user = r.getUser();
        String firstName = user.getFirstName() != null ? user.getFirstName() : "";
        String lastName = user.getLastName() != null ? user.getLastName() : "";
        String fullName = (firstName + " " + lastName).trim();
        String initials = ((firstName.isEmpty() ? "" : firstName.substring(0, 1)) +
                (lastName.isEmpty() ? "" : lastName.substring(0, 1))).toUpperCase();

        return ReviewResponse.builder()
                .id(r.getId())
                .orderId(r.getOrder().getId())
                .orderReference(r.getOrder().getReference())
                .productId(r.getProductId())
                .productName(r.getProductName())
                .note(r.getNote())
                .commentaire(r.getCommentaire())
                .statut(r.getStatut())
                .reponse(r.getReponse())
                .userId(user.getId())
                .clientName(fullName)
                .clientInitials(initials)
                .createdAt(r.getCreatedAt())
                .build();
    }
}
