package io.github.ogaanezov.currencyalerts.collection;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.github.ogaanezov.currencyalerts.domain.Currency;
import io.github.ogaanezov.currencyalerts.domain.ExchangeRate;
import io.github.ogaanezov.currencyalerts.persistence.ExchangeRateRepository;
import io.github.ogaanezov.currencyalerts.rates.OpenExchangeRatesClient;

@Service
public class RateCollectionService {

    private static final Logger log = LoggerFactory.getLogger(RateCollectionService.class);
    private static final Duration MIN_INTERVAL = Duration.ofHours(1);

    private final OpenExchangeRatesClient client;
    private final ExchangeRateRepository repository;
    private final List<Currency> currencies = new ArrayList<>();

    public RateCollectionService(
            OpenExchangeRatesClient client,
            ExchangeRateRepository repository,
            @Value("${rates.currencies}") List<String> currencyCodes) {
        this.client = client;
        this.repository = repository;
        for (String code : currencyCodes) {
            currencies.add(new Currency(code));
        }
    }

    public int collect(Instant now) {
        Optional<Instant> latestRateTime = repository.findLatestRateTime();
        if (latestRateTime.isPresent() && latestRateTime.get().isAfter(now.minus(MIN_INTERVAL))) {
            log.info("Rates are fresh (latest {}), skipping request", latestRateTime.get());
            return 0;
        }

        List<ExchangeRate> rates = client.fetchLatest(currencies);
        int savedCount = 0;
        for (ExchangeRate rate : rates) {
            if (repository.save(rate)) {
                savedCount++;
            }
        }
        log.info("Received {} rates, saved {} new", rates.size(), savedCount);
        return savedCount;
    }
}