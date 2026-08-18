package com.naturessence.auth.security;

import com.naturessence.shared.entity.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Getter
public class UserPrincipal implements UserDetails {

    private final Long id;
    private final String firstName;
    private final String lastName;
    private final String email;
    private final String password;
    private final Collection<? extends GrantedAuthority> authorities;

    public UserPrincipal(User user) {
        this.id = user.getId();
        this.firstName = user.getFirstName();
        this.lastName = user.getLastName();
        this.email = user.getEmail();
        this.password = user.getPassword();

        List<GrantedAuthority> auths = new ArrayList<>();
        // Dynamic role authority
        auths.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().getName()));
        // Fine-grained permission authorities
        if (user.getRole().getPermissions() != null) {
            user.getRole().getPermissions().stream()
                    .filter(p -> p.isGranted())
                    .forEach(p -> auths.add(new SimpleGrantedAuthority("PERM_" + p.getModule().name())));
        }
        this.authorities = auths;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
