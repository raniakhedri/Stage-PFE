package com.ecommerce.service;

import com.ecommerce.dto.request.ReturnPolicyRequest;
import com.ecommerce.dto.response.ReturnPolicyResponse;
import com.ecommerce.entity.ReturnPolicy;
import com.ecommerce.repository.ReturnPolicyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ReturnPolicyService {

    private final ReturnPolicyRepository repository;

    private static final Long SINGLETON_ID = 1L;

    public ReturnPolicyResponse getPolicy() {
        return repository.findById(SINGLETON_ID)
                .map(this::toResponse)
                .orElse(defaults());
    }

    public ReturnPolicyResponse savePolicy(ReturnPolicyRequest req) {
        ReturnPolicy policy = repository.findById(SINGLETON_ID)
                .orElse(ReturnPolicy.builder().id(SINGLETON_ID).build());
        policy.setDureeJours(req.getDureeJours() != null ? req.getDureeJours() : 30);
        policy.setEligibilite(req.getEligibilite());
        policy.setModeRemboursement(req.getModeRemboursement());
        policy.setFraisRetour(req.getFraisRetour());
        policy.setConditionsSpeciales(req.getConditionsSpeciales());
        return toResponse(repository.save(policy));
    }

    private ReturnPolicyResponse toResponse(ReturnPolicy p) {
        return ReturnPolicyResponse.builder()
                .dureeJours(p.getDureeJours() != null ? p.getDureeJours() : 30)
                .eligibilite(p.getEligibilite())
                .modeRemboursement(p.getModeRemboursement())
                .fraisRetour(p.getFraisRetour())
                .conditionsSpeciales(p.getConditionsSpeciales())
                .build();
    }

    private ReturnPolicyResponse defaults() {
        return ReturnPolicyResponse.builder()
                .dureeJours(30)
                .eligibilite("Non ouvert / Scellé")
                .modeRemboursement("Mode original")
                .fraisRetour("Gratuit (Tunisie)")
                .conditionsSpeciales(null)
                .build();
    }
}
