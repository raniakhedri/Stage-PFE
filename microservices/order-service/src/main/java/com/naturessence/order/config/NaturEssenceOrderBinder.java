package com.naturessence.order.config;

import com.naturessence.shared.repository.CouponRepository;
import com.naturessence.shared.repository.OrderRepository;
import com.naturessence.shared.repository.ShippingZoneRepository;
import com.naturessence.shared.repository.ShopRepository;
import com.naturessence.shared.repository.TvaConfigRepository;
import com.naturessence.shared.repository.TvaRateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class NaturEssenceOrderBinder implements ApplicationRunner {

    private final ShopRepository shopRepository;
    private final OrderRepository orderRepository;
    private final CouponRepository couponRepository;
    private final TvaConfigRepository tvaConfigRepository;
    private final TvaRateRepository tvaRateRepository;
    private final ShippingZoneRepository shippingZoneRepository;

    @Override
    public void run(ApplicationArguments args) {
        shopRepository.findBySlug("naturessence").ifPresent(shop -> {
            orderRepository.findAll().forEach(order -> {
                if (order.getShopId() == null) {
                    order.setShopId(shop.getId());
                    orderRepository.save(order);
                }
            });
            couponRepository.findAll().forEach(coupon -> {
                if (coupon.getShopId() == null) {
                    coupon.setShopId(shop.getId());
                    couponRepository.save(coupon);
                }
            });
            tvaConfigRepository.findAll().forEach(config -> {
                if (config.getShopId() == null) {
                    config.setShopId(shop.getId());
                    tvaConfigRepository.save(config);
                }
            });
            tvaRateRepository.findAll().forEach(rate -> {
                if (rate.getShopId() == null) {
                    rate.setShopId(shop.getId());
                    tvaRateRepository.save(rate);
                }
            });
            shippingZoneRepository.findAll().forEach(zone -> {
                if (zone.getShopId() == null) {
                    zone.setShopId(shop.getId());
                    shippingZoneRepository.save(zone);
                }
            });
        });
    }
}
