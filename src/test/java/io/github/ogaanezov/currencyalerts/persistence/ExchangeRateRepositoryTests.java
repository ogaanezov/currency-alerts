package io.github.ogaanezov.currencyalerts.persistence;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import io.github.ogaanezov.currencyalerts.TestcontainersConfiguration;
import io.github.ogaanezov.currencyalerts.domain.Currency;
import io.github.ogaanezov.currencyalerts.domain.CurrencyPair;
import io.github.ogaanezov.currencyalerts.domain.ExchangeRate;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class ExchangeRateRepositoryTests {

    @Autowired
    private ExchangeRateRepository repository;

    @Test
    void findsLatestSavedRate() {
        CurrencyPair usdEur = new CurrencyPair(new Currency("USD"), new Currency("EUR"));
        ExchangeRate older = new ExchangeRate(usdEur, new BigDecimal("0.89"), Instant.parse("2026-11-09T09:00:00Z"));
        ExchangeRate newer = new ExchangeRate(usdEur, new BigDecimal("0.90"), Instant.parse("2026-11-09T10:00:00Z"));

        repository.save(older);
        repository.save(newer);

        assertEquals(Optional.of(newer), repository.findLatest(usdEur));
    }

    @Test
    void returnsEmptyWhenPairHasNoRates() {
        CurrencyPair gbpJpy = new CurrencyPair(new Currency("GBP"), new Currency("JPY"));

        assertTrue(repository.findLatest(gbpJpy).isEmpty());
    }
}