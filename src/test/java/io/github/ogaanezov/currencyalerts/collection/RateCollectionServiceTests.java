package io.github.ogaanezov.currencyalerts.collection;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;

import io.github.ogaanezov.currencyalerts.domain.Currency;
import io.github.ogaanezov.currencyalerts.domain.CurrencyPair;
import io.github.ogaanezov.currencyalerts.domain.ExchangeRate;
import io.github.ogaanezov.currencyalerts.persistence.ExchangeRateRepository;
import io.github.ogaanezov.currencyalerts.rates.OpenExchangeRatesClient;

class RateCollectionServiceTests {

    private final OpenExchangeRatesClient client = mock(OpenExchangeRatesClient.class);
    private final ExchangeRateRepository repository = mock(ExchangeRateRepository.class);
    private final RateCollectionService service = new RateCollectionService(client, repository, List.of("EUR"));

    private final Instant now = Instant.parse("2026-11-10T12:00:00Z");
    private final ExchangeRate rate = new ExchangeRate(
            new CurrencyPair(new Currency("USD"), new Currency("EUR")), new BigDecimal("0.9"), now);

    @Test
    void skipsRequestWhenRatesAreFresh() {
        when(repository.findLatestRateTime()).thenReturn(Optional.of(now.minusSeconds(30 * 60)));

        assertEquals(0, service.collect(now));
        verify(client, never()).fetchLatest(any());
    }

    @Test
    void fetchesAndSavesWhenRatesAreOld() {
        when(repository.findLatestRateTime()).thenReturn(Optional.of(now.minusSeconds(2 * 60 * 60)));
        when(client.fetchLatest(any())).thenReturn(List.of(rate));
        when(repository.save(rate)).thenReturn(true);

        assertEquals(1, service.collect(now));
    }

    @Test
    void fetchesWhenThereAreNoRatesYet() {
        when(repository.findLatestRateTime()).thenReturn(Optional.empty());
        when(client.fetchLatest(any())).thenReturn(List.of(rate));
        when(repository.save(rate)).thenReturn(false);

        assertEquals(0, service.collect(now));
        verify(client).fetchLatest(any());
    }
}