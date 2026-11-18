package io.github.ogaanezov.currencyalerts.persistence;

import io.github.ogaanezov.currencyalerts.domain.Notification;

public record StoredNotification(long id, long ruleId, Notification notification) {
}