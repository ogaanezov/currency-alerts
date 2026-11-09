package io.github.ogaanezov.currencyalerts.domain;

import java.math.BigDecimal;
import java.time.Instant;

public record ExchangeRate(CurrencyPair pair, BigDecimal rate, Instant timestamp) {

    public ExchangeRate {
        if (pair == null || rate == null || timestamp == null) {
            throw new IllegalArgumentException("Pair, rate and timestamp must not be null");
        }
        if (rate.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Rate must be positive: " + rate);
        }
    }
}