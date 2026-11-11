package io.github.ogaanezov.currencyalerts.persistence;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import io.github.ogaanezov.currencyalerts.domain.AlertRule;
import io.github.ogaanezov.currencyalerts.domain.Currency;
import io.github.ogaanezov.currencyalerts.domain.CurrencyPair;
import io.github.ogaanezov.currencyalerts.domain.Direction;
import io.github.ogaanezov.currencyalerts.domain.Notification;

@Repository
public class NotificationRepository {

    private final JdbcClient jdbcClient;

    public NotificationRepository(JdbcClient jdbcClient) {
        this.jdbcClient = jdbcClient;
    }

    public void save(long ruleId, Notification notification) {
        jdbcClient.sql("""
                INSERT INTO notifications (rule_id, rate, created_at)
                VALUES (:ruleId, :rate, :createdAt)
                """)
                .param("ruleId", ruleId)
                .param("rate", notification.rate())
                .param("createdAt", notification.createdAt().atOffset(ZoneOffset.UTC))
                .update();
    }

    public List<Notification> findByRule(long ruleId) {
        return jdbcClient.sql("""
                SELECT r.base_currency, r.quote_currency, r.direction, r.threshold,
                       n.rate, n.created_at
                FROM notifications n
                JOIN alert_rules r ON r.id = n.rule_id
                WHERE n.rule_id = :ruleId
                ORDER BY n.created_at
                """)
                .param("ruleId", ruleId)
                .query((row, rowNumber) -> new Notification(
                        new AlertRule(
                                new CurrencyPair(
                                        new Currency(row.getString("base_currency")),
                                        new Currency(row.getString("quote_currency"))),
                                Direction.valueOf(row.getString("direction")),
                                row.getBigDecimal("threshold")),
                        row.getBigDecimal("rate").stripTrailingZeros(),
                        row.getObject("created_at", OffsetDateTime.class).toInstant()))
                .list();
    }
}