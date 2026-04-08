package com.ecommerce.config;

import com.ecommerce.entity.*;
import com.ecommerce.enums.AccountStatus;
import com.ecommerce.enums.PermissionModule;
import com.ecommerce.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

        private final RoleRepository roleRepository;
        private final SegmentRepository segmentRepository;
        private final UserRepository userRepository;
        private final PermissionRepository permissionRepository;
        private final PasswordEncoder passwordEncoder;
        private final TvaRateRepository tvaRateRepository;
        private final TvaConfigRepository tvaConfigRepository;
        private final ShippingZoneRepository shippingZoneRepository;
        private final JdbcTemplate jdbcTemplate;

        @Value("${app.seed.admin-email}")
        private String adminEmail;

        @Value("${app.seed.admin-password}")
        private String adminPassword;

        @Override
        @Transactional
        public void run(String... args) {
                migrateSchema();
                seedRoles();
                seedSegments();
                seedSuperAdmin();
                seedTvaAndShipping();
        }

        private void migrateSchema() {
                // Fix NULL values for new boolean columns added by ddl-auto=update
                jdbcTemplate.execute(
                        "UPDATE products SET pinned_in_sub_category = false WHERE pinned_in_sub_category IS NULL");
                // Drop deprecated column if it still exists
                jdbcTemplate.execute(
                        "ALTER TABLE products DROP COLUMN IF EXISTS visible_landing");
        }

        private void seedRoles() {
                if (roleRepository.count() > 0) {
                        // Detect old enum values — purge and re-seed permissions only
                        Set<String> currentModules = Set.of(Arrays.stream(PermissionModule.values())
                                        .map(Enum::name).toArray(String[]::new));
                        Set<String> dbModules = permissionRepository.findAllModuleNamesNative();
                        boolean hasOldData = dbModules.stream()
                                        .anyMatch(m -> !currentModules.contains(m));
                        if (!hasOldData) {
                                log.info("Rôles déjà initialisés, skip seed.");
                                return;
                        }
                        log.info("Anciens modules détectés — mise à jour des permissions...");
                        // Drop old check constraint so new enum values are accepted
                        jdbcTemplate.execute(
                                        "ALTER TABLE permissions DROP CONSTRAINT IF EXISTS permissions_module_check");
                        // Delete permissions natively; cache is cleared by clearAutomatically=true
                        permissionRepository.deleteAllNative();
                        // Re-attach updated permissions to existing roles
                        roleRepository.findByName("SUPER_ADMIN").ifPresent(role -> {
                                for (PermissionModule module : PermissionModule.values()) {
                                        role.addPermission(Permission.builder()
                                                        .module(module).granted(true).build());
                                }
                                roleRepository.save(role);
                        });
                        roleRepository.findByName("ADMIN").ifPresent(role -> {
                                for (PermissionModule module : PermissionModule.values()) {
                                        boolean granted = module != PermissionModule.ROLES_PERMISSIONS
                                                        && module != PermissionModule.COMPTE_HEBERGEMENT;
                                        role.addPermission(Permission.builder()
                                                        .module(module).granted(granted).build());
                                }
                                roleRepository.save(role);
                        });
                        roleRepository.findByName("CLIENT").ifPresent(role -> {
                                for (PermissionModule module : PermissionModule.values()) {
                                        boolean granted = module == PermissionModule.TABLEAU_DE_BORD
                                                        || module == PermissionModule.COMMANDES
                                                        || module == PermissionModule.RETOURS;
                                        role.addPermission(Permission.builder()
                                                        .module(module).granted(granted).build());
                                }
                                roleRepository.save(role);
                        });
                        log.info("Permissions mises à jour pour les rôles existants.");
                        return;
                }

                log.info("Initialisation des rôles et permissions...");

                // ── SUPER_ADMIN: all permissions granted ──
                Role superAdmin = Role.builder()
                                .name("SUPER_ADMIN")
                                .label("Super Admin")
                                .description("Accès total et illimité à toutes les fonctionnalités et paramètres système.")
                                .build();
                for (PermissionModule module : PermissionModule.values()) {
                        superAdmin.addPermission(Permission.builder()
                                        .module(module).granted(true).build());
                }
                roleRepository.save(superAdmin);

                // ── ADMIN: all except Roles & Permissions ──
                Role admin = Role.builder()
                                .name("ADMIN")
                                .label("Administrateur")
                                .description("Gestion opérationnelle complète de la boutique et du catalogue.")
                                .build();
                for (PermissionModule module : PermissionModule.values()) {
                        boolean granted = module != PermissionModule.ROLES_PERMISSIONS
                                        && module != PermissionModule.COMPTE_HEBERGEMENT;
                        admin.addPermission(Permission.builder()
                                        .module(module).granted(granted).build());
                }
                roleRepository.save(admin);

                // ── CLIENT: only dashboard + orders ──
                Role client = Role.builder()
                                .name("CLIENT")
                                .label("Client")
                                .description("Compte client standard avec accès portail commandes uniquement.")
                                .build();
                for (PermissionModule module : PermissionModule.values()) {
                        boolean granted = module == PermissionModule.TABLEAU_DE_BORD
                                        || module == PermissionModule.COMMANDES
                                        || module == PermissionModule.RETOURS;
                        client.addPermission(Permission.builder()
                                        .module(module).granted(granted).build());
                }
                roleRepository.save(client);

                log.info("3 rôles créés: SUPER_ADMIN, ADMIN, CLIENT");
        }

        private void seedSegments() {
                if (segmentRepository.count() > 0) {
                        log.info("Segments déjà initialisés, skip seed.");
                        return;
                }

                log.info("Initialisation des segments client...");

                segmentRepository.save(Segment.builder()
                                .name("NOUVEAU").label("Nouveau")
                                .description("Client récemment inscrit")
                                .color("bg-blue-100 text-blue-800")
                                .icon("UserPlus")
                                .build());

                segmentRepository.save(Segment.builder()
                                .name("FIDELE").label("Fidèle")
                                .description("Client régulier avec plusieurs commandes")
                                .color("bg-green-100 text-green-800")
                                .icon("Heart")
                                .build());

                segmentRepository.save(Segment.builder()
                                .name("VIP").label("VIP")
                                .description("Client premium à forte valeur")
                                .color("bg-amber-100 text-amber-800")
                                .icon("Star")
                                .build());

                segmentRepository.save(Segment.builder()
                                .name("INACTIF").label("Inactif")
                                .description("Client sans activité récente")
                                .color("bg-gray-100 text-gray-800")
                                .icon("Clock")
                                .build());

                log.info("4 segments créés: NOUVEAU, FIDELE, VIP, INACTIF");
        }

        private void seedSuperAdmin() {
                if (userRepository.existsByEmailIgnoreCase(adminEmail)) {
                        log.info("Super Admin déjà existant, skip seed.");
                        return;
                }

                Role superAdminRole = roleRepository.findByName("SUPER_ADMIN")
                                .orElseThrow(() -> new RuntimeException("Rôle SUPER_ADMIN non trouvé"));

                Segment defaultSegment = segmentRepository.findByName("NOUVEAU")
                                .orElseThrow(() -> new RuntimeException("Segment NOUVEAU non trouvé"));

                User superAdmin = User.builder()
                                .firstName("Super")
                                .lastName("Admin")
                                .email(adminEmail.toLowerCase().trim())
                                .password(passwordEncoder.encode(adminPassword))
                                .role(superAdminRole)
                                .segment(defaultSegment)
                                .status(AccountStatus.ACTIVE)
                                .build();

                userRepository.save(superAdmin);
                log.info("Super Admin créé: {}", adminEmail);
        }

        private void seedTvaAndShipping() {
                // ── TVA Config (singleton) ──
                if (tvaConfigRepository.count() == 0) {
                        tvaConfigRepository.save(TvaConfig.builder()
                                        .tvaActive(true)
                                        .tauxDefaut(19.0)
                                        .devise("Dinar Tunisien (TND)")
                                        .standardEnabled(true)
                                        .standardSeuil(200.0)
                                        .standardDelai("3 à 5 jours ouvrés")
                                        .expressEnabled(true)
                                        .expressDelai("24h à 48h")
                                        .build());
                        log.info("Configuration TVA par défaut créée (TND).");
                }

                // ── TVA Rates ──
                if (tvaRateRepository.count() == 0) {
                        tvaRateRepository.save(
                                        TvaRate.builder().nom("TVA Standard (19%)").valeur(19.0).actif(true).build());
                        tvaRateRepository.save(
                                        TvaRate.builder().nom("TVA Réduite (7%)").valeur(7.0).actif(true).build());
                        tvaRateRepository.save(
                                        TvaRate.builder().nom("TVA Réduite (13%)").valeur(13.0).actif(true).build());
                        tvaRateRepository.save(
                                        TvaRate.builder().nom("Exonéré (Export)").valeur(0.0).actif(false).build());
                        log.info("4 taux TVA tunisiens créés.");
                }

                // ── Shipping Zones ──
                if (shippingZoneRepository.count() == 0) {
                        shippingZoneRepository.save(ShippingZone.builder()
                                        .nom("Grand Tunis").regions("Tunis, Ariana, Ben Arous, Manouba")
                                        .methode("Livraison directe").estimation("1-2 jours").cout(7.0)
                                        .statut("Ouverte").build());
                        shippingZoneRepository.save(ShippingZone.builder()
                                        .nom("Nord")
                                        .regions("Bizerte, Béja, Jendouba, Le Kef, Siliana, Zaghouan, Nabeul")
                                        .methode("Transporteur national").estimation("2-3 jours").cout(9.0)
                                        .statut("Ouverte").build());
                        shippingZoneRepository.save(ShippingZone.builder()
                                        .nom("Centre")
                                        .regions("Sousse, Monastir, Mahdia, Sfax, Kairouan, Kasserine, Sidi Bouzid")
                                        .methode("Transporteur national").estimation("2-4 jours").cout(10.0)
                                        .statut("Ouverte").build());
                        shippingZoneRepository.save(ShippingZone.builder()
                                        .nom("Sud").regions("Gabès, Médenine, Tataouine, Gafsa, Tozeur, Kébili")
                                        .methode("Transporteur national").estimation("3-5 jours").cout(12.0)
                                        .statut("Ouverte").build());
                        log.info("4 zones de livraison tunisiennes créées.");
                }
        }
}
