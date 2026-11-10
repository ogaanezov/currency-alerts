package io.github.ogaanezov.currencyalerts.collection;

import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "rates.collection.enabled", havingValue = "true")
public class RateCollectionScheduler {

    private static final Logger log = LoggerFactory.getLogger(RateCollectionScheduler.class);

    private final RateCollectionService service;

    public RateCollectionScheduler(RateCollectionService service) {
        this.service = service;
    }

    @Scheduled(fixedRateString = "${rates.collection.interval}")
    public void collectRates() {
        try {
            service.collect(Instant.now());
        } catch (RuntimeException e) {
            log.warn("Rate collection failed, will retry on next run: {}", e.getMessage());
        }
    }
}