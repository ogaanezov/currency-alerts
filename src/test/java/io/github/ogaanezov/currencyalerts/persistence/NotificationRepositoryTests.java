package io.github.ogaanezov.currencyalerts.persistence;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import io.github.ogaanezov.currencyalerts.TestcontainersConfiguration;
import io.github.ogaanezov.currencyalerts.domain.AlertRule;
import io.github.ogaanezov.currencyalerts.domain.Currency;
import io.github.ogaanezov.currencyalerts.domain.CurrencyPair;
import io.github.ogaanezov.currencyalerts.domain.Direction;
import io.github.ogaanezov.currencyalerts.domain.Notification;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class NotificationRepositoryTests {

    @Autowired
    private AlertRuleRepository ruleRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Test
    void savesAndFindsNotificationsOfRule() {
        AlertRule rule = new AlertRule(
                new CurrencyPair(new Currency("USD"), new Currency("GBP")),
                Direction.BELOW,
                new BigDecimal("0.75"));
        long ruleId = ruleRepository.save(rule);
        Notification notification = new Notification(rule, new BigDecimal("0.74"), Instant.parse("2026-11-11T10:00:00Z"));

        notificationRepository.save(ruleId, notification);

        assertEquals(List.of(notification), notificationRepository.findByRule(ruleId));
    }
}