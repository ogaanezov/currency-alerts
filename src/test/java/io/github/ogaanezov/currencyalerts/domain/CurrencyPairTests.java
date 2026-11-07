package io.github.ogaanezov.currencyalerts.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class CurrencyPairTests {

    private final Currency usd = new Currency("USD");
    private final Currency eur = new Currency("EUR");

    @Test
    void createsPairWithDifferentCurrencies() {
        CurrencyPair pair = new CurrencyPair(usd, eur);

        assertEquals(usd, pair.base());
        assertEquals(eur, pair.quote());
    }

    @Test
    void rejectsNullBase() {
        assertThrows(IllegalArgumentException.class, () -> new CurrencyPair(null, eur));
    }

    @Test
    void rejectsNullQuote() {
        assertThrows(IllegalArgumentException.class, () -> new CurrencyPair(usd, null));
    }

    @Test
    void rejectsSameCurrency() {
        assertThrows(IllegalArgumentException.class, () -> new CurrencyPair(usd, new Currency("USD")));
    }
}