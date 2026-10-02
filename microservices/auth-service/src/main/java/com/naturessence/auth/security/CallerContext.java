package com.naturessence.auth.security;

import com.naturessence.shared.security.CurrentUser;
import com.naturessence.shared.security.PlatformRoles;
import com.naturessence.shared.entity.User;
import com.naturessence.shared.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/** The signed-in account behind the current request, and the shop it may manage. */
@Component
@RequiredArgsConstructor
public class CallerContext {

    private final UserRepository userRepository;

    public User require() {
        Long userId = CurrentUser.id();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Connexion requise");
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Connexion requise"));
    }

    public static boolean isPlatformAdmin(User user) {
        return user.getRole() != null && PlatformRoles.isPlatform(user.getRole().getName());
    }

    /** Shop managed by a merchant or team member; fails for accounts without a shop. */
    public Long requireShopId(User user) {
        if (user.getShopId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ce compte n'a pas de boutique");
        }
        return user.getShopId();
    }
}
