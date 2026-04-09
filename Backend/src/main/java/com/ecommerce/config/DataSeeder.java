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
        private final CategoryRepository categoryRepository;
        private final ProductRepository productRepository;
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
                seedCategoriesAndProducts();
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

        // ── Cosmetics Categories & Sample Products ──────────────────────
        private void seedCategoriesAndProducts() {
                if (categoryRepository.count() > 0) {
                        log.info("Catégories déjà initialisées, skip seed.");
                        return;
                }

                log.info("Initialisation des catégories cosmétiques et produits...");

                // ── 1. Huiles Essentielles ──
                Category essentielles = categoryRepository.save(Category.builder()
                                .nom("Huiles Essentielles").slug("essentielles")
                                .description("Découvrez l'âme des plantes à travers notre collection d'essences pures, certifiées biologiques et distillées avec un savoir-faire artisanal.")
                                .imageUrl("https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800")
                                .visMenu(true).visHomepage(true).menuPosition(1).displayOrder(1).statut("actif").build());
                String[] subEss = { "Agrumes", "Florales", "Boisées", "Épicées", "Herbacées", "Mentholées" };
                for (int i = 0; i < subEss.length; i++) {
                        categoryRepository.save(Category.builder()
                                        .nom(subEss[i]).slug("essentielles-" + slugify(subEss[i]))
                                        .parent(essentielles).type("Secondaire")
                                        .visMenu(true).menuPosition(i + 1).displayOrder(i + 1).statut("actif").build());
                }

                // ── 2. Huiles Végétales ──
                Category vegetales = categoryRepository.save(Category.builder()
                                .nom("Huiles Végétales").slug("vegetales")
                                .description("Nos huiles végétales vierges et biologiques sont obtenues par première pression à froid, préservant toute la richesse nutritive.")
                                .imageUrl("https://images.unsplash.com/photo-1474979266404-7f28db3e3b2a?w=800")
                                .visMenu(true).visHomepage(true).menuPosition(2).displayOrder(2).statut("actif").build());
                String[] subVeg = { "Visage", "Corps", "Cheveux", "Massage", "Cuisine" };
                for (int i = 0; i < subVeg.length; i++) {
                        categoryRepository.save(Category.builder()
                                        .nom(subVeg[i]).slug("vegetales-" + slugify(subVeg[i]))
                                        .parent(vegetales).type("Secondaire")
                                        .visMenu(true).menuPosition(i + 1).displayOrder(i + 1).statut("actif").build());
                }

                // ── 3. Actifs Cosmétiques ──
                Category actifs = categoryRepository.save(Category.builder()
                                .nom("Actifs Cosmétiques").slug("actifs")
                                .description("Des actifs puissants et concentrés pour formuler vos soins sur-mesure. Acide hyaluronique, vitamine C, rétinol végétal et bien plus.")
                                .imageUrl("https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800")
                                .visMenu(true).visHomepage(true).menuPosition(3).displayOrder(3).statut("actif").build());
                String[] subAct = { "Anti-âge", "Hydratants", "Éclaircissants", "Purifiants", "Antioxydants" };
                for (int i = 0; i < subAct.length; i++) {
                        categoryRepository.save(Category.builder()
                                        .nom(subAct[i]).slug("actifs-" + slugify(subAct[i]))
                                        .parent(actifs).type("Secondaire")
                                        .visMenu(true).menuPosition(i + 1).displayOrder(i + 1).statut("actif").build());
                }

                // ── 4. Beurres & Cires ──
                Category beurres = categoryRepository.save(Category.builder()
                                .nom("Beurres & Cires").slug("beurres")
                                .description("Des beurres végétaux bruts et des cires naturelles pour nourrir, protéger et sublimer votre peau et vos cheveux.")
                                .imageUrl("https://images.unsplash.com/photo-1547793549-70faf88c5ba4?w=800")
                                .visMenu(true).visHomepage(true).menuPosition(4).displayOrder(4).statut("actif").build());
                String[] subBeu = { "Beurres", "Cires", "Bases", "Émulsifiants" };
                for (int i = 0; i < subBeu.length; i++) {
                        categoryRepository.save(Category.builder()
                                        .nom(subBeu[i]).slug("beurres-" + slugify(subBeu[i]))
                                        .parent(beurres).type("Secondaire")
                                        .visMenu(true).menuPosition(i + 1).displayOrder(i + 1).statut("actif").build());
                }

                // ── 5. Hydrolats ──
                Category hydrolats = categoryRepository.save(Category.builder()
                                .nom("Hydrolats").slug("hydrolats")
                                .description("Eaux florales et hydrolats issus de la distillation de plantes aromatiques. Doux et polyvalents pour le soin du visage, du corps et des cheveux.")
                                .imageUrl("https://images.unsplash.com/photo-1599948128020-9a44505b0d1b?w=800")
                                .visMenu(true).visHomepage(true).menuPosition(5).displayOrder(5).statut("actif").build());
                String[] subHyd = { "Floraux", "Aromatiques", "Apaisants", "Tonifiants" };
                for (int i = 0; i < subHyd.length; i++) {
                        categoryRepository.save(Category.builder()
                                        .nom(subHyd[i]).slug("hydrolats-" + slugify(subHyd[i]))
                                        .parent(hydrolats).type("Secondaire")
                                        .visMenu(true).menuPosition(i + 1).displayOrder(i + 1).statut("actif").build());
                }

                // ── 6. Argiles & Poudres ──
                Category argiles = categoryRepository.save(Category.builder()
                                .nom("Argiles & Poudres").slug("argiles")
                                .description("Argiles pures et poudres végétales pour des masques, gommages et soins capillaires naturels. Des trésors de la terre pour votre beauté.")
                                .imageUrl("https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800")
                                .visMenu(true).visHomepage(true).menuPosition(6).displayOrder(6).statut("actif").build());
                String[] subArg = { "Argiles", "Poudres végétales", "Rhassoul", "Charbon actif" };
                for (int i = 0; i < subArg.length; i++) {
                        categoryRepository.save(Category.builder()
                                        .nom(subArg[i]).slug("argiles-" + slugify(subArg[i]))
                                        .parent(argiles).type("Secondaire")
                                        .visMenu(true).menuPosition(i + 1).displayOrder(i + 1).statut("actif").build());
                }

                log.info("6 catégories principales + sous-catégories cosmétiques créées.");

                // ── Sample products ──────────────────────────────────────────
                if (productRepository.count() > 0) {
                        log.info("Produits déjà existants, skip seed produits.");
                        return;
                }

                // Huiles Essentielles
                seedProduct("Huile Essentielle de Lavande Vraie", "lavande-vraie-bio", "Lavandula angustifolia", essentielles, 8.50, "10ml", true, true, "10ml,30ml", "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=600");
                seedProduct("Huile Essentielle de Citron Jaune", "citron-jaune-bio", "Citrus limon", essentielles, 5.90, "10ml", true, false, "10ml,30ml", "https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?w=600");
                seedProduct("Huile Essentielle d'Eucalyptus", "eucalyptus-bio", "Eucalyptus globulus", essentielles, 6.20, "10ml", true, false, "10ml,30ml", "https://images.unsplash.com/photo-1583316174775-bd6dc0e9f298?w=600");
                seedProduct("Huile Essentielle de Menthe Poivrée", "menthe-poivree-bio", "Mentha piperita", essentielles, 7.80, "10ml", true, false, "10ml,30ml", "https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=600");
                seedProduct("Huile Essentielle d'Ylang Ylang III", "ylang-ylang-bio", "Cananga odorata", essentielles, 12.40, "10ml", true, false, "10ml", "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600");
                seedProduct("Huile Essentielle de Tea Tree", "tea-tree-bio", "Melaleuca alternifolia", essentielles, 6.90, "10ml", true, false, "10ml,30ml", "https://images.unsplash.com/photo-1547793549-70faf88c5ba4?w=600");

                // Huiles Végétales
                seedProduct("Huile d'Argan Pure Bio", "argan-pure-bio", "Argania spinosa", vegetales, 14.90, "50ml", true, false, "30ml,50ml,100ml", "https://images.unsplash.com/photo-1608181831718-2501a42c1286?w=600");
                seedProduct("Huile de Jojoba Vierge Bio", "jojoba-vierge", "Simmondsia chinensis", vegetales, 9.90, "50ml", true, false, "30ml,50ml,100ml", "https://images.unsplash.com/photo-1600428877878-1a0ff561f8d1?w=600");
                seedProduct("Huile d'Amande Douce Bio", "amande-douce-bio", "Prunus amygdalus", vegetales, 12.90, "100ml", true, false, "50ml,100ml,200ml", "https://images.unsplash.com/photo-1474979266404-7f28db3e3b2a?w=600");
                seedProduct("Huile de Ricin Bio", "ricin-bio", "Ricinus communis", vegetales, 9.90, "100ml", true, true, "50ml,100ml", "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600");
                seedProduct("Huile de Coco Vierge Bio", "coco-vierge", "Cocos nucifera", vegetales, 8.50, "200ml", true, false, "100ml,200ml", "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=600");
                seedProduct("Huile de Rose Musquée Bio", "rose-musquee", "Rosa rubiginosa", vegetales, 15.90, "30ml", true, false, "15ml,30ml", "https://images.unsplash.com/photo-1601612628452-9e99aa484680?w=600");

                // Actifs Cosmétiques
                seedProduct("Acide Hyaluronique Pur", "acide-hyaluronique", "Sodium Hyaluronate", actifs, 14.90, "30ml", false, true, "15ml,30ml", "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600");
                seedProduct("Vitamine C Stabilisée", "vitamine-c", "Ascorbyl Glucoside", actifs, 11.50, "15ml", false, false, "15ml,30ml", "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=600");
                seedProduct("Gel d'Aloe Vera Bio", "aloe-vera-gel", "Aloe barbadensis", actifs, 9.90, "200ml", true, false, "100ml,200ml", "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=600");
                seedProduct("Niacinamide 10%", "niacinamide", "Nicotinamide", actifs, 9.90, "30ml", false, false, "15ml,30ml", "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600");
                seedProduct("Bakuchiol Végétal", "bakuchiol", "Psoralea corylifolia", actifs, 18.90, "15ml", true, true, "15ml", "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600");
                seedProduct("Coenzyme Q10", "coenzyme-q10", "Ubiquinone", actifs, 16.50, "15ml", false, false, "15ml,30ml", "https://images.unsplash.com/photo-1617897903246-719242758050?w=600");

                // Beurres & Cires
                seedProduct("Beurre de Karité Brut Bio", "karite-brut", "Butyrospermum parkii", beurres, 12.50, "200g", true, true, "100g,200g", "https://images.unsplash.com/photo-1599948128020-9a44505b0d1b?w=600");
                seedProduct("Beurre de Cacao Brut Bio", "cacao-brut", "Theobroma cacao", beurres, 10.90, "200g", true, false, "100g,200g", "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=600");
                seedProduct("Beurre de Mangue Bio", "mangue-brut", "Mangifera indica", beurres, 8.90, "100g", true, false, "50g,100g", "https://images.unsplash.com/photo-1547793549-70faf88c5ba4?w=600");
                seedProduct("Cire d'Abeille Jaune Bio", "cire-abeille", "Cera alba", beurres, 6.50, "100g", true, false, "50g,100g", "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=600");
                seedProduct("Beurre d'Avocat Bio", "avocat-brut", "Persea gratissima", beurres, 13.90, "100g", true, false, "50g,100g", "https://images.unsplash.com/photo-1519735777090-ec97162dc266?w=600");
                seedProduct("Beurre de Kokum Bio", "kokum-brut", "Garcinia indica", beurres, 9.90, "100g", true, false, "50g,100g", "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600");

                // Hydrolats
                seedProduct("Hydrolat de Rose de Damas Bio", "rose-damas", "Rosa damascena", hydrolats, 12.90, "200ml", true, false, "100ml,200ml", "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=600");
                seedProduct("Hydrolat de Fleur d'Oranger Bio", "fleur-oranger", "Citrus aurantium", hydrolats, 10.50, "200ml", true, false, "100ml,200ml", "https://images.unsplash.com/photo-1599948128020-9a44505b0d1b?w=600");
                seedProduct("Hydrolat de Lavande Bio", "lavande-hydrolat", "Lavandula angustifolia", hydrolats, 8.90, "200ml", true, false, "100ml,200ml", "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=600");
                seedProduct("Hydrolat de Camomille Romaine Bio", "camomille-hydrolat", "Chamaemelum nobile", hydrolats, 11.90, "200ml", true, true, "100ml,200ml", "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600");
                seedProduct("Hydrolat d'Hamamélis Bio", "hamamelis-hydrolat", "Hamamelis virginiana", hydrolats, 9.50, "200ml", true, false, "100ml,200ml", "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600");
                seedProduct("Hydrolat de Bleuet Bio", "bleuet-hydrolat", "Centaurea cyanus", hydrolats, 12.90, "200ml", true, false, "100ml,200ml", "https://images.unsplash.com/photo-1617897903246-719242758050?w=600");

                // Argiles & Poudres
                seedProduct("Argile Verte Surfine", "argile-verte", "Illite", argiles, 4.50, "250g", false, false, "150g,250g,500g", "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600");
                seedProduct("Argile Rose Surfine", "argile-rose", "Kaolin + Illite", argiles, 4.20, "250g", false, false, "150g,250g,500g", "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600");
                seedProduct("Argile Blanche (Kaolin)", "argile-blanche", "Kaolin", argiles, 3.90, "250g", false, false, "150g,250g,500g", "https://images.unsplash.com/photo-1599948128020-9a44505b0d1b?w=600");
                seedProduct("Rhassoul du Maroc", "rhassoul", "Hectorite", argiles, 5.90, "250g", false, false, "150g,250g", "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600");
                seedProduct("Poudre de Charbon Actif", "charbon-actif", "Carbo activatus", argiles, 6.90, "100g", false, true, "50g,100g", "https://images.unsplash.com/photo-1583316174775-bd6dc0e9f298?w=600");
                seedProduct("Poudre de Shikakai Bio", "poudre-shikakai", "Acacia concinna", argiles, 7.50, "100g", true, false, "50g,100g", "https://images.unsplash.com/photo-1547793549-70faf88c5ba4?w=600");

                log.info("36 produits cosmétiques créés.");
        }

        private void seedProduct(String nom, String slug, String latin, Category category,
                        double price, String defaultVolume, boolean bio, boolean nouveau, String volumes, String imageUrl) {
                productRepository.save(Product.builder()
                                .nom(nom)
                                .slug(slug)
                                .latin(latin)
                                .description("Produit naturel d'exception pour le soin et le bien-être.")
                                .category(category)
                                .salePrice(price)
                                .bio(bio)
                                .volumes(volumes)
                                .imageUrl(imageUrl)
                                .stock(100)
                                .statut("actif")
                                .badgeNouveau(nouveau)
                                .visibleSite(true)
                                .visibleCategory(true)
                                .build());
        }

        private String slugify(String input) {
                return java.text.Normalizer.normalize(input.trim().toLowerCase(), java.text.Normalizer.Form.NFD)
                                .replaceAll("[^\\p{ASCII}]", "")
                                .replaceAll("[^a-z0-9\\s-]", "")
                                .replaceAll("\\s+", "-");
        }
}
