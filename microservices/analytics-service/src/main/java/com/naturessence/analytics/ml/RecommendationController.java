package com.naturessence.analytics.ml;

import com.naturessence.analytics.ShopAccess;
import com.naturessence.shared.entity.Shop;
import com.naturessence.shared.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.Set;

/** Public storefront endpoints. Responses are product ids; the storefront loads details from the catalogue. */
@RestController
@RequestMapping("/api/v1/analytics/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService service;
    private final ShopAccess shopAccess;

    /** "Vous aimerez aussi" on a product page. */
    @GetMapping("/similar")
    public RecommendationService.Result similar(@RequestParam String shop, @RequestParam long productId,
                                                @RequestParam(defaultValue = "8") int limit) {
        return service.similar(shopAccess.bySlug(shop).getId(), productId, clamp(limit));
    }

    /** "Recommandé pour vous" — personalised from this visitor's recent behaviour. */
    @GetMapping("/for-you")
    public RecommendationService.Result forYou(@RequestParam String shop, @RequestParam(required = false) String visitorId,
                                               @RequestParam(defaultValue = "8") int limit) {
        Shop s = shopAccess.bySlug(shop);
        User user = shopAccess.currentUser();
        Long userId = user != null && s.getId().equals(user.getShopId()) ? user.getId() : null;
        return service.forVisitor(s.getId(), visitorId, userId, clamp(limit));
    }

    /** "Souvent achetés ensemble" in the cart. ids = products currently in the cart. */
    @GetMapping("/bought-together")
    public RecommendationService.Result boughtTogether(@RequestParam String shop, @RequestParam String ids,
                                                       @RequestParam(defaultValue = "4") int limit) {
        List<Long> productIds = Arrays.stream(ids.split(","))
            .map(String::trim).filter(v -> v.matches("\\d{1,18}")).map(Long::valueOf).filter(Objects::nonNull).limit(30).toList();
        return service.boughtTogether(shopAccess.bySlug(shop).getId(), productIds, clamp(limit));
    }

    @GetMapping("/popular")
    public RecommendationService.Result popular(@RequestParam String shop, @RequestParam(defaultValue = "8") int limit) {
        return service.popular(shopAccess.bySlug(shop).getId(), clamp(limit), Set.of());
    }

    private static int clamp(int limit) {
        return Math.max(1, Math.min(limit, 24));
    }
}
