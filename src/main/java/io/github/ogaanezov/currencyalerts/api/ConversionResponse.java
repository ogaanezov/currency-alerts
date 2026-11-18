package io.github.ogaanezov.currencyalerts.api;

import java.math.BigDecimal;
import java.time.Instant;

import io.github.ogaanezov.currencyalerts.conversion.Conversion;

public record ConversionResponse(String from, String to, BigDecimal amount, BigDecimal rate, BigDecimal result, Instant rateTime) {

    static ConversionResponse from(Conversion conversion) {
        return new ConversionResponse(
                conversion.pair().base().code(),
                conversion.pair().quote().code(),
                conversion.amount(),
                conversion.rate(),
                conversion.result(),
                conversion.rateTime());
    }
}