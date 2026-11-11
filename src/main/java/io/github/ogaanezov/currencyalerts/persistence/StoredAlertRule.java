package io.github.ogaanezov.currencyalerts.persistence;

import io.github.ogaanezov.currencyalerts.domain.AlertRule;

public record StoredAlertRule(long id, AlertRule rule, boolean triggered) {
}