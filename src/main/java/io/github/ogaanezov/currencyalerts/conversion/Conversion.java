package io.github.ogaanezov.currencyalerts.conversion;

import java.math.BigDecimal;
import java.time.Instant;

import io.github.ogaanezov.currencyalerts.domain.CurrencyPair;

public record Conversion(CurrencyPair pair, BigDecimal amount, BigDecimal rate, BigDecimal result, Instant rateTime) {
}