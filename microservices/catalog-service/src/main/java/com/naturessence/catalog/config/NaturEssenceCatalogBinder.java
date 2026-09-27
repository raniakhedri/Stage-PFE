package com.naturessence.catalog.config;

import com.naturessence.shared.repository.CategoryRepository;
import com.naturessence.shared.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class NaturEssenceCatalogBinder implements ApplicationRunner {

    private final ShopRepository shopRepository;
    private final CategoryRepository categoryRepository;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        jdbcTemplate.queryForList(
                "SELECT conname FROM pg_constraint WHERE conrelid = 'products'::regclass AND contype = 'u' AND pg_get_constraintdef(oid) = 'UNIQUE (slug)'",
                String.class
        ).forEach(name -> jdbcTemplate.execute("ALTER TABLE products DROP CONSTRAINT IF EXISTS \"" + name + "\""));
        shopRepository.findBySlug("naturessence").ifPresent(shop ->
                categoryRepository.findAll().forEach(category -> {
                    if (category.getShopId() == null) {
                        category.setShopId(shop.getId());
                        categoryRepository.save(category);
                    }
                }));
    }
}
