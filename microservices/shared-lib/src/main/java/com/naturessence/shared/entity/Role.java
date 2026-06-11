package com.naturessence.shared.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "roles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private String label;

    private String description;

    @Builder.Default
    @OneToMany(mappedBy = "role", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<Permission> permissions = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "role")
    private List<User> users = new ArrayList<>();

    public void addPermission(Permission permission) {
        permissions.add(permission);
        permission.setRole(this);
    }

    public void removePermission(Permission permission) {
        permissions.remove(permission);
        permission.setRole(null);
    }
}
