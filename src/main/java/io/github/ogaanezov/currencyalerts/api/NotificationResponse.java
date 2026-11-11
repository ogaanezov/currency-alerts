package io.github.ogaanezov.currencyalerts.api;

import java.math.BigDecimal;
import java.time.Instant;

import io.github.ogaanezov.currencyalerts.persistence.StoredNotification;

public record NotificationResponse(
        long id, long ruleId, String base, String quote, String direction, BigDecimal threshold,
        BigDecimal rate, Instant createdAt) {

    static NotificationResponse from(StoredNotification stored) {
        return new NotificationResponse(
                stored.id(),
                stored.ruleId(),
                stored.notification().rule().pair().base().code(),
                stored.notification().rule().pair().quote().code(),
                stored.notification().rule().direction().name(),
                stored.notification().rule().threshold(),
                stored.notification().rate(),
                stored.notification().createdAt());
    }
}