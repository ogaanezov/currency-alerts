package io.github.ogaanezov.currencyalerts.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class CurrencyTests {

    @Test
    void createsCurrencyWithValidCode() {
        Currency currency = new Currency("USD");

        assertEquals("USD", currency.code());
    }

    @Test
    void rejectsNullCode() {
        assertThrows(IllegalArgumentException.class, () -> new Currency(null));
    }

    @Test
    void rejectsLowercaseCode() {
        assertThrows(IllegalArgumentException.class, () -> new Currency("usd"));
    }

    @Test
    void rejectsCodeWithWrongLength() {
        assertThrows(IllegalArgumentException.class, () -> new Currency("US"));
    }
}