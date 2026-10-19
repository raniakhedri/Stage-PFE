package com.naturessence.catalog.controller;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.naturessence.catalog.config.SecurityConfig;
import com.naturessence.catalog.service.CategoryService;
import com.naturessence.shared.dto.response.CategoryResponse;
import com.naturessence.shared.security.JwtUtil;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;

/** Keeps the slice off CatalogServiceApplication, which would start JPA. */
@WebMvcTest(controllers = { PublicCategoryController.class, AdminCategoryController.class })
@ContextConfiguration(classes = { PublicCategoryController.class, AdminCategoryController.class, SecurityConfig.class })
@AutoConfigureMockMvc
class CategoryControllerTest {

    @Autowired
    private MockMvc mvc;

    @MockBean
    private CategoryService categoryService;

    @MockBean
    private JwtUtil jwtUtil;

    @Test
    void publicMenu_isOpenAndReturnsTheMenuPayload() throws Exception {
        when(categoryService.getMenuCategories("demo")).thenReturn(List.of(
            CategoryResponse.builder().id(1L).nom("Soins").slug("/soins").build()
        ));

        mvc.perform(get("/api/v1/public/categories/menu").param("shop", "demo"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].nom").value("Soins"))
            .andExpect(jsonPath("$[0].slug").value("/soins"));
    }

    @Test
    void publicIndex_currentlyServesTheMenuNotEveryCategory() throws Exception {
        when(categoryService.getMenuCategories("demo")).thenReturn(List.of());

        mvc.perform(get("/api/v1/public/categories").param("shop", "demo"))
            .andExpect(status().isOk());

        verify(categoryService).getMenuCategories("demo");
    }

    @Test
    void adminList_isRejectedWithoutAuthentication() throws Exception {
        mvc.perform(get("/api/v1/admin/categories"))
            .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "CLIENT")
    void adminList_isRejectedForACustomer() throws Exception {
        mvc.perform(get("/api/v1/admin/categories"))
            .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminCreate_rejectsAMissingName() throws Exception {
        mvc.perform(post("/api/v1/admin/categories").contentType("application/json").content("{}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminList_isAllowedForAnAdmin() throws Exception {
        when(categoryService.getAllCategories("demo")).thenReturn(List.of(
            CategoryResponse.builder().id(2L).nom("Corps").slug("/corps").build()
        ));

        mvc.perform(get("/api/v1/admin/categories").param("shop", "demo"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].nom").value("Corps"));
    }
}
