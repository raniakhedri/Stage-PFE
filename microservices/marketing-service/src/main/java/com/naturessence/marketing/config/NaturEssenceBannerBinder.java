package com.naturessence.marketing.config;

import com.naturessence.shared.repository.BannerRepository;
import com.naturessence.shared.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class NaturEssenceBannerBinder implements ApplicationRunner {

    private final ShopRepository shopRepository;
    private final BannerRepository bannerRepository;

    @Override
    public void run(ApplicationArguments args) {
        shopRepository.findBySlug("naturessence").ifPresent(shop ->
                bannerRepository.findAll().forEach(banner -> {
                    if (banner.getShopId() == null) {
                        banner.setShopId(shop.getId());
                        bannerRepository.save(banner);
                    }
                }));
    }
}
