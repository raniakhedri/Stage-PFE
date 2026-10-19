package com.naturessence.catalog.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.naturessence.shared.dto.request.CollectionRequest;
import com.naturessence.shared.dto.response.CollectionResponse;
import com.naturessence.shared.entity.Collection;
import com.naturessence.shared.entity.Product;
import com.naturessence.shared.repository.CollectionRepository;
import com.naturessence.shared.repository.ProductRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CollectionServiceTest {

    @Mock private CollectionRepository collectionRepository;
    @Mock private ProductRepository productRepository;

    @InjectMocks
    private CollectionService service;

    @Test
    void createCollection_rejectsADuplicateSlugAndStoresLinkedCategories() {
        when(collectionRepository.existsBySlug("ete-2026")).thenReturn(true, false);
        CollectionRequest duplicate = request("Été 2026");
        duplicate.setSlug("/ete-2026");
        assertThatThrownBy(() -> service.createCollection(duplicate))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("slug");
        when(collectionRepository.save(any())).thenAnswer(invocation -> {
            Collection saved = invocation.getArgument(0);
            saved.setId(5L);
            return saved;
        });
        Product product = Product.builder().id(9L).nom("Savon").collections("Hiver").build();
        when(productRepository.findAll()).thenReturn(List.of(product));
        CollectionRequest created = request("Été 2026");
        created.setLinkedCategories(List.of("Soins", "Corps"));
        created.setProductIds(List.of(9L));

        CollectionResponse response = service.createCollection(created);

        assertThat(response.getSlug()).isEqualTo("ete-2026");
        assertThat(response.getLinkedCategories()).containsExactly("Soins", "Corps");
        assertThat(product.getCollections()).isEqualTo("Hiver,Été 2026");
    }

    @Test
    void getCollectionBySlug_throwsWhenMissing() {
        when(collectionRepository.findBySlug("absent")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getCollectionBySlug("absent"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("introuvable");
    }

    @Test
    void getHomepageCollections_keepsOnlyPositionedOnes() {
        Collection shown = Collection.builder().id(1L).nom("Hero").slug("hero").homepagePosition("large").build();
        Collection hidden = Collection.builder().id(2L).nom("Archive").slug("archive").build();
        when(collectionRepository.findAll()).thenReturn(List.of(shown, hidden));

        assertThat(service.getHomepageCollections()).extracting(CollectionResponse::getSlug).containsExactly("hero");
    }

    @Test
    void deleteCollection_removesTheNameFromProducts() {
        Collection collection = Collection.builder().id(5L).nom("Été").slug("ete").build();
        Product product = Product.builder().id(9L).nom("Savon").collections("Été, Hiver").build();
        when(collectionRepository.findById(5L)).thenReturn(Optional.of(collection));
        when(productRepository.findAll()).thenReturn(List.of(product));

        service.deleteCollection(5L);

        assertThat(product.getCollections()).isEqualTo("Hiver");
        verify(collectionRepository).delete(collection);
        verify(productRepository).save(product);
    }

    private static CollectionRequest request(String name) {
        CollectionRequest request = new CollectionRequest();
        request.setNom(name);
        return request;
    }
}
