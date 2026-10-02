package com.naturessence.shared.security;

import com.naturessence.shared.entity.Shop;
import com.naturessence.shared.repository.ShopRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TenantGuardTest {

    @AfterEach
    void clear() {
        RequestContextHolder.resetRequestAttributes();
    }

    private void pin(String shop) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        if (shop != null) request.setAttribute(TenantGuard.ATTRIBUTE, shop);
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
    }

    @Test
    void creationAlwaysUsesTheCallersShop() {
        pin("shop-a");
        assertThat(TenantGuard.shopForCreation("shop-b")).isEqualTo("shop-a");
        pin(null);
        assertThat(TenantGuard.shopForCreation("shop-b")).isEqualTo("shop-b");
    }

    @Test
    void recordsOfAnotherShopAreNotFound() {
        ShopRepository shops = mock(ShopRepository.class);
        when(shops.findBySlug("shop-a")).thenReturn(Optional.of(Shop.builder().id(1L).slug("shop-a").build()));
        pin("shop-a");

        assertThatCode(() -> TenantGuard.assertOwned(1L, shops)).doesNotThrowAnyException();
        assertThatThrownBy(() -> TenantGuard.assertOwned(2L, shops)).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> TenantGuard.assertOwned(null, shops)).isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void publicRequestsAreNotRestricted() {
        assertThat(TenantGuard.pinnedShop()).isNull();
        assertThatCode(() -> TenantGuard.assertOwned(2L, mock(ShopRepository.class))).doesNotThrowAnyException();
    }
}
