package com.naturessence.shared.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * @deprecated Use {@link com.naturessence.shared.dto.analytics.UserFeaturesDTO}
 *             which contains the full feature set aligned with the ML dataset.
 */
@Deprecated
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserFeaturesDTO {

    private Long userId;
    private Long daysSinceLastLogin;
    private Long daysSinceLastOrder;
    private Integer totalOrders;
    private Double totalSpent;
    private Double avgOrderValue;
    private Integer reviewCount;
    private Integer returnsCount;
    private Integer loyaltyPoints;
}
