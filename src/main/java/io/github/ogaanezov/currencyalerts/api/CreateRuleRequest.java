package io.github.ogaanezov.currencyalerts.api;

import java.math.BigDecimal;

public record CreateRuleRequest(String base, String quote, String direction, BigDecimal threshold) {
}