package io.github.ogaanezov.currencyalerts.api;

import java.math.BigDecimal;

import io.github.ogaanezov.currencyalerts.persistence.StoredAlertRule;

public record RuleResponse(long id, String base, String quote, String direction, BigDecimal threshold, boolean triggered) {

    static RuleResponse from(StoredAlertRule stored) {
        return new RuleResponse(
                stored.id(),
                stored.rule().pair().base().code(),
                stored.rule().pair().quote().code(),
                stored.rule().direction().name(),
                stored.rule().threshold(),
                stored.triggered());
    }
}