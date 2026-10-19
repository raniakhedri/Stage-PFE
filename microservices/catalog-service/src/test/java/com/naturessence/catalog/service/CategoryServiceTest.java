package com.naturessence.catalog.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.naturessence.shared.dto.request.CategoryRequest;
import com.naturessence.shared.dto.response.CategoryResponse;
import com.naturessence.shared.entity.Category;
import com.naturessence.shared.entity.Shop;
import com.naturessence.shared.repository.CategoryRepository;
import com.naturessence.shared.repository.ProductRepository;
import com.naturessence.shared.repository.ShopRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock private CategoryRepository categoryRepository;
    @Mock private ProductRepository productRepository;
    @Mock private ShopRepository shopRepository;

    @InjectMocks
    private CategoryService service;

    @Test
    void createCategory_slugifiesAndAttachesTheShop() {
        when(shopRepository.findBySlug("demo")).thenReturn(Optional.of(Shop.builder().id(3L).name("Demo").slug("demo").build()));
        when(categoryRepository.existsBySlug("/huiles-essentielles")).thenReturn(false);
        when(categoryRepository.findByParentIsNullOrderByMenuPositionAsc()).thenReturn(List.of());
        when(categoryRepository.save(any())).thenAnswer(invocation -> {
            Category saved = invocation.getArgument(0);
            saved.setId(4L);
            return saved;
        });
        when(categoryRepository.countByParentId(4L)).thenReturn(0L);
        when(productRepository.countNonArchivedInCategoryTree(4L)).thenReturn(2L);
        CategoryRequest request = new CategoryRequest();
        request.setNom("Huiles Essentielles");
        request.setShopSlug("Demo");

        CategoryResponse created = service.createCategory(request);

        assertThat(created.getSlug()).isEqualTo("/huiles-essentielles");
        assertThat(created.getNom()).isEqualTo("Huiles Essentielles");
        assertThat(created.getProductCount()).isEqualTo(2L);
    }

    @Test
    void createCategory_rejectsADuplicateSlug() {
        when(categoryRepository.existsBySlug("/soins")).thenReturn(true);
        CategoryRequest request = new CategoryRequest();
        request.setNom("Soins");
        request.setSlug("soins");

        assertThatThrownBy(() -> service.createCategory(request))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("slug");
    }

    @Test
    void updateCategory_rejectsItselfAsParent() {
        Category category = Category.builder().id(4L).nom("Soins").slug("/soins").shopId(3L).menuPosition(1).build();
        when(categoryRepository.findById(4L)).thenReturn(Optional.of(category));
        when(categoryRepository.findByParentIsNullOrderByMenuPositionAsc()).thenReturn(List.of());
        when(categoryRepository.findByParentIdOrderByMenuPositionAsc(4L)).thenReturn(List.of());
        CategoryRequest request = new CategoryRequest();
        request.setNom("Soins");
        request.setParentId(4L);

        assertThatThrownBy(() -> service.updateCategory(4L, request))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("propre parent");
    }

    @Test
    void deleteCategory_refusesWhenChildrenExist() {
        Category category = Category.builder().id(4L).nom("Soins").slug("/soins").shopId(3L).build();
        when(categoryRepository.findById(4L)).thenReturn(Optional.of(category));
        when(categoryRepository.countByParentId(4L)).thenReturn(2L);

        assertThatThrownBy(() -> service.deleteCategory(4L))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("sous-catégorie");
        verify(categoryRepository, org.mockito.Mockito.never()).delete(any());
    }

    @Test
    void getMenuCategories_returnsNothingForAnUnknownShop() {
        when(shopRepository.findBySlug("missing")).thenReturn(Optional.empty());
        when(categoryRepository.findMenuCategories()).thenReturn(List.of(
            Category.builder().id(1L).nom("Soins").slug("/soins").shopId(3L).build()
        ));

        assertThat(service.getMenuCategories("Missing")).isEmpty();
    }

    @Test
    void reorderCategories_writesPositionsFromOne() {
        Category first = Category.builder().id(1L).nom("A").slug("/a").shopId(3L).menuPosition(9).build();
        Category second = Category.builder().id(2L).nom("B").slug("/b").shopId(3L).menuPosition(1).build();
        when(categoryRepository.findById(2L)).thenReturn(Optional.of(second));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(first));

        service.reorderCategories(List.of(2L, 1L));

        assertThat(second.getMenuPosition()).isEqualTo(1);
        assertThat(first.getMenuPosition()).isEqualTo(2);
    }
}
