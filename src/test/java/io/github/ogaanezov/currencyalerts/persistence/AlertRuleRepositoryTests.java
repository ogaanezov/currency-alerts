package io.github.ogaanezov.currencyalerts.persistence;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import io.github.ogaanezov.currencyalerts.TestcontainersConfiguration;
import io.github.ogaanezov.currencyalerts.domain.AlertRule;
import io.github.ogaanezov.currencyalerts.domain.Currency;
import io.github.ogaanezov.currencyalerts.domain.CurrencyPair;
import io.github.ogaanezov.currencyalerts.domain.Direction;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class AlertRuleRepositoryTests {

    @Autowired
    private AlertRuleRepository repository;

    @Test
    void savesAndFindsRule() {
        AlertRule rule = new AlertRule(
                new CurrencyPair(new Currency("USD"), new Currency("EUR")),
                Direction.ABOVE,
                new BigDecimal("0.95"));

        repository.save(rule);

        assertTrue(repository.findAll().contains(rule));
    }
}