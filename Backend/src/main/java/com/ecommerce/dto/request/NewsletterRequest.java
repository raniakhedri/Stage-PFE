package com.ecommerce.dto.request;

import lombok.Data;

@Data
public class NewsletterRequest {
    private String subject;
    private String htmlContent;
    /** "ALL", "NOUVEAU", "FIDELE", "VIP", "INACTIF" */
    private String segment;
}
