package io.github.ogaanezov.currencyalerts.conversion;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import io.github.ogaanezov.currencyalerts.domain.Currency;
import io.github.ogaanezov.currencyalerts.domain.CurrencyPair;
import io.github.ogaanezov.currencyalerts.domain.ExchangeRate;
import io.github.ogaanezov.currencyalerts.persistence.ExchangeRateRepository;

class ConversionServiceTests {

    private final ExchangeRateRepository repository = mock(ExchangeRateRepository.class);
    private final ConversionService service = new ConversionService(repository);

    private final Currency usd = new Currency("USD");
    private final Currency eur = new Currency("EUR");
    private final Currency amd = new Currency("AMD");
    private final Instant eurTime = Instant.parse("2026-11-11T12:00:00Z");
    private final Instant amdTime = Instant.parse("2026-11-11T11:00:00Z");

    @BeforeEach
    void givenRates() {
        givenUsdRate(eur, "0.8", eurTime);
        givenUsdRate(amd, "400", amdTime);
    }

    private void givenUsdRate(Currency currency, String rate, Instant time) {
        CurrencyPair pair = new CurrencyPair(usd, currency);
        when(repository.findLatest(pair)).thenReturn(Optional.of(new ExchangeRate(pair, new BigDecimal(rate), time)));
    }

    @Test
    void convertsFromUsd() {
        Conversion conversion = service.convert(new CurrencyPair(usd, eur), new BigDecimal("100"));

        assertEquals(new BigDecimal("0.8"), conversion.rate());
        assertEquals(new BigDecimal("80.00"), conversion.result());
        assertEquals(eurTime, conversion.rateTime());
    }

    @Test
    void convertsToUsdWithInverseRate() {
        Conversion conversion = service.convert(new CurrencyPair(eur, usd), new BigDecimal("100"));

        assertEquals(new BigDecimal("1.25"), conversion.rate());
        assertEquals(new BigDecimal("125.00"), conversion.result());
    }

    @Test
    void convertsBetweenTwoCurrenciesThroughUsd() {
        // 1 EUR = 1 / 0.8 USD = 1.25 USD = 1.25 * 400 AMD = 500 AMD
        Conversion conversion = service.convert(new CurrencyPair(eur, amd), new BigDecimal("10"));

        assertEquals(new BigDecimal("500"), conversion.rate());
        assertEquals(new BigDecimal("5000.00"), conversion.result());
        assertEquals(amdTime, conversion.rateTime());
    }

    @Test
    void failsWhenRateIsMissing() {
        CurrencyPair usdGel = new CurrencyPair(usd, new Currency("GEL"));
        when(repository.findLatest(usdGel)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> service.convert(usdGel, BigDecimal.ONE));
    }

    @Test
    void rejectsNonPositiveAmount() {
        assertThrows(IllegalArgumentException.class,
                () -> service.convert(new CurrencyPair(usd, eur), BigDecimal.ZERO));
    }
}