package io.github.ogaanezov.currencyalerts.domain;

import java.math.BigDecimal;

public record AlertRule(CurrencyPair pair, Direction direction, BigDecimal threshold) {

    public AlertRule {
        if (pair == null || direction == null || threshold == null) {
            throw new IllegalArgumentException("Pair, direction and threshold must not be null");
        }
        if (threshold.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Threshold must be positive: " + threshold);
        }
        threshold = threshold.stripTrailingZeros();
    }

    public boolean isTriggeredBy(BigDecimal rate) {
        if (direction == Direction.ABOVE) {
            return rate.compareTo(threshold) > 0;
        }
        return rate.compareTo(threshold) < 0;
    }
}