package io.github.ogaanezov.currencyalerts.domain;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

class AlertRuleTests {

    private final CurrencyPair usdEur = new CurrencyPair(new Currency("USD"), new Currency("EUR"));
    private final BigDecimal threshold = new BigDecimal("0.95");

    @Test
    void rejectsNullDirection() {
        assertThrows(IllegalArgumentException.class, () -> new AlertRule(usdEur, null, threshold));
    }

    @Test
    void rejectsZeroThreshold() {
        assertThrows(IllegalArgumentException.class, () -> new AlertRule(usdEur, Direction.ABOVE, BigDecimal.ZERO));
    }

    @Test
    void aboveRuleTriggersWhenRateIsHigher() {
        AlertRule rule = new AlertRule(usdEur, Direction.ABOVE, threshold);

        assertTrue(rule.isTriggeredBy(new BigDecimal("0.96")));
    }

    @Test
    void aboveRuleDoesNotTriggerWhenRateIsLower() {
        AlertRule rule = new AlertRule(usdEur, Direction.ABOVE, threshold);

        assertFalse(rule.isTriggeredBy(new BigDecimal("0.94")));
    }

    @Test
    void aboveRuleDoesNotTriggerWhenRateEqualsThreshold() {
        AlertRule rule = new AlertRule(usdEur, Direction.ABOVE, threshold);

        assertFalse(rule.isTriggeredBy(new BigDecimal("0.95")));
    }

    @Test
    void belowRuleTriggersWhenRateIsLower() {
        AlertRule rule = new AlertRule(usdEur, Direction.BELOW, threshold);

        assertTrue(rule.isTriggeredBy(new BigDecimal("0.94")));
    }

    @Test
    void belowRuleDoesNotTriggerWhenRateIsHigher() {
        AlertRule rule = new AlertRule(usdEur, Direction.BELOW, threshold);

        assertFalse(rule.isTriggeredBy(new BigDecimal("0.96")));
    }
}