package io.github.ogaanezov.currencyalerts.alerts;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;

import io.github.ogaanezov.currencyalerts.domain.AlertRule;
import io.github.ogaanezov.currencyalerts.domain.Currency;
import io.github.ogaanezov.currencyalerts.domain.CurrencyPair;
import io.github.ogaanezov.currencyalerts.domain.Direction;
import io.github.ogaanezov.currencyalerts.domain.ExchangeRate;
import io.github.ogaanezov.currencyalerts.domain.Notification;
import io.github.ogaanezov.currencyalerts.persistence.AlertRuleRepository;
import io.github.ogaanezov.currencyalerts.persistence.ExchangeRateRepository;
import io.github.ogaanezov.currencyalerts.persistence.NotificationRepository;
import io.github.ogaanezov.currencyalerts.persistence.StoredAlertRule;

class AlertCheckServiceTests {

    private final AlertRuleRepository ruleRepository = mock(AlertRuleRepository.class);
    private final ExchangeRateRepository rateRepository = mock(ExchangeRateRepository.class);
    private final NotificationRepository notificationRepository = mock(NotificationRepository.class);
    private final AlertCheckService service =
            new AlertCheckService(ruleRepository, rateRepository, notificationRepository);

    private final Instant now = Instant.parse("2026-11-11T12:00:00Z");
    private final CurrencyPair usdEur = new CurrencyPair(new Currency("USD"), new Currency("EUR"));
    private final AlertRule aboveRule = new AlertRule(usdEur, Direction.ABOVE, new BigDecimal("0.95"));

    private void givenRule(boolean triggered) {
        when(ruleRepository.findAll()).thenReturn(List.of(new StoredAlertRule(1, aboveRule, triggered)));
    }

    private void givenLatestRate(String rate) {
        when(rateRepository.findLatest(usdEur))
                .thenReturn(Optional.of(new ExchangeRate(usdEur, new BigDecimal(rate), now)));
    }

    @Test
    void notifiesWhenRateCrossesThreshold() {
        givenRule(false);
        givenLatestRate("0.96");

        assertEquals(1, service.checkRules(now));
        verify(notificationRepository).save(1, new Notification(aboveRule, new BigDecimal("0.96"), now));
        verify(ruleRepository).updateTriggered(1, true);
    }

    @Test
    void doesNotNotifyAgainWhileRateStaysAbove() {
        givenRule(true);
        givenLatestRate("0.97");

        assertEquals(0, service.checkRules(now));
        verify(notificationRepository, never()).save(anyLong(), any());
        verify(ruleRepository, never()).updateTriggered(anyLong(), anyBoolean());
    }

    @Test
    void resetsStateWhenRateReturnsBelow() {
        givenRule(true);
        givenLatestRate("0.94");

        assertEquals(0, service.checkRules(now));
        verify(notificationRepository, never()).save(anyLong(), any());
        verify(ruleRepository).updateTriggered(1, false);
    }

    @Test
    void doesNotNotifyWhenRateEqualsThreshold() {
        givenRule(false);
        givenLatestRate("0.95");

        assertEquals(0, service.checkRules(now));
        verify(notificationRepository, never()).save(anyLong(), any());
    }

    @Test
    void skipsRuleWithoutRates() {
        givenRule(false);
        when(rateRepository.findLatest(usdEur)).thenReturn(Optional.empty());

        assertEquals(0, service.checkRules(now));
        verify(notificationRepository, never()).save(anyLong(), any());
    }
}