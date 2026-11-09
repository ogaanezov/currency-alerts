package io.github.ogaanezov.currencyalerts.domain;

public record Currency(String code) {

    public Currency {
        if (code == null || !code.matches("[A-Z]{3}")) {
            throw new IllegalArgumentException("Currency code must be 3 uppercase letters: " + code);
        }
    }
}