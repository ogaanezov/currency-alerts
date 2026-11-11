package io.github.ogaanezov.currencyalerts.api;

import java.math.BigDecimal;
import java.time.Instant;

import io.github.ogaanezov.currencyalerts.domain.ExchangeRate;

public record RateResponse(String base, String quote, BigDecimal rate, Instant time) {

    static RateResponse from(ExchangeRate rate) {
        return new RateResponse(rate.pair().base().code(), rate.pair().quote().code(), rate.rate(), rate.timestamp());
    }
}