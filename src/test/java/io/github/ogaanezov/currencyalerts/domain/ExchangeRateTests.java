package io.github.ogaanezov.currencyalerts.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;
import java.time.Instant;

import org.junit.jupiter.api.Test;

class ExchangeRateTests {

    private final CurrencyPair usdEur = new CurrencyPair(new Currency("USD"), new Currency("EUR"));
    private final Instant now = Instant.parse("2026-11-09T10:00:00Z");

    @Test
    void createsRateWithPositiveValue() {
        ExchangeRate rate = new ExchangeRate(usdEur, new BigDecimal("0.89715"), now);

        assertEquals(new BigDecimal("0.89715"), rate.rate());
    }

    @Test
    void rejectsNullRate() {
        assertThrows(IllegalArgumentException.class, () -> new ExchangeRate(usdEur, null, now));
    }

    @Test
    void rejectsZeroRate() {
        assertThrows(IllegalArgumentException.class, () -> new ExchangeRate(usdEur, BigDecimal.ZERO, now));
    }

    @Test
    void rejectsNegativeRate() {
        assertThrows(IllegalArgumentException.class, () -> new ExchangeRate(usdEur, new BigDecimal("-1"), now));
    }
}