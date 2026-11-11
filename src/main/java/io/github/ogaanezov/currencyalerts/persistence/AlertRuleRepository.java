package io.github.ogaanezov.currencyalerts.persistence;

import java.util.List;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import io.github.ogaanezov.currencyalerts.domain.AlertRule;
import io.github.ogaanezov.currencyalerts.domain.Currency;
import io.github.ogaanezov.currencyalerts.domain.CurrencyPair;
import io.github.ogaanezov.currencyalerts.domain.Direction;

@Repository
public class AlertRuleRepository {

    private final JdbcClient jdbcClient;

    public AlertRuleRepository(JdbcClient jdbcClient) {
        this.jdbcClient = jdbcClient;
    }

    public long save(AlertRule rule) {
        return jdbcClient.sql("""
                INSERT INTO alert_rules (base_currency, quote_currency, direction, threshold)
                VALUES (:base, :quote, :direction, :threshold)
                RETURNING id
                """)
                .param("base", rule.pair().base().code())
                .param("quote", rule.pair().quote().code())
                .param("direction", rule.direction().name())
                .param("threshold", rule.threshold())
                .query(Long.class)
                .single();
    }

    public List<StoredAlertRule> findAll() {
        return jdbcClient.sql("""
                SELECT id, base_currency, quote_currency, direction, threshold, triggered
                FROM alert_rules
                ORDER BY id
                """)
                .query((row, rowNumber) -> new StoredAlertRule(
                        row.getLong("id"),
                        new AlertRule(
                                new CurrencyPair(
                                        new Currency(row.getString("base_currency")),
                                        new Currency(row.getString("quote_currency"))),
                                Direction.valueOf(row.getString("direction")),
                                row.getBigDecimal("threshold")),
                        row.getBoolean("triggered")))
                .list();
    }

    public void updateTriggered(long id, boolean triggered) {
        jdbcClient.sql("UPDATE alert_rules SET triggered = :triggered WHERE id = :id")
                .param("triggered", triggered)
                .param("id", id)
                .update();
    }
}