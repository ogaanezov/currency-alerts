package io.github.ogaanezov.currencyalerts.domain;

public record CurrencyPair(Currency base, Currency quote) {

    public CurrencyPair {
        if (base == null || quote == null) {
            throw new IllegalArgumentException("Base and quote currencies must not be null");
        }
        if (base.equals(quote)) {
            throw new IllegalArgumentException("Base and quote currencies must be different");
        }
    }
}