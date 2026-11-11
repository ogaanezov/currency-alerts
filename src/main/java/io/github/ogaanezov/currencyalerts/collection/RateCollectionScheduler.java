package io.github.ogaanezov.currencyalerts.collection;

import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import io.github.ogaanezov.currencyalerts.alerts.AlertCheckService;

@Component
@ConditionalOnProperty(name = "rates.collection.enabled", havingValue = "true")
public class RateCollectionScheduler {

    private static final Logger log = LoggerFactory.getLogger(RateCollectionScheduler.class);

    private final RateCollectionService collectionService;
    private final AlertCheckService alertCheckService;

    public RateCollectionScheduler(RateCollectionService collectionService, AlertCheckService alertCheckService) {
        this.collectionService = collectionService;
        this.alertCheckService = alertCheckService;
    }

    @Scheduled(fixedRateString = "${rates.collection.interval}")
    public void collectRates() {
        Instant now = Instant.now();
        try {
            collectionService.collect(now);
        } catch (RuntimeException e) {
            log.warn("Rate collection failed, will retry on next run: {}", e.getMessage());
        }
        try {
            alertCheckService.checkRules(now);
        } catch (RuntimeException e) {
            log.warn("Alert check failed, will retry on next run: {}", e.getMessage());
        }
    }
}