package io.github.ogaanezov.currencyalerts.persistence;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import io.github.ogaanezov.currencyalerts.domain.CurrencyPair;
import io.github.ogaanezov.currencyalerts.domain.ExchangeRate;

@Repository
public class ExchangeRateRepository {

    private final JdbcClient jdbcClient;

    public ExchangeRateRepository(JdbcClient jdbcClient) {
        this.jdbcClient = jdbcClient;
    }

    public boolean save(ExchangeRate exchangeRate) {
        int insertedRows = jdbcClient.sql("""
                INSERT INTO exchange_rates (base_currency, quote_currency, rate, rate_time)
                VALUES (:base, :quote, :rate, :rateTime)
                ON CONFLICT (base_currency, quote_currency, rate_time) DO NOTHING
                """)
                .param("base", exchangeRate.pair().base().code())
                .param("quote", exchangeRate.pair().quote().code())
                .param("rate", exchangeRate.rate())
                .param("rateTime", exchangeRate.timestamp().atOffset(ZoneOffset.UTC))
                .update();
        return insertedRows == 1;
    }

    public Optional<ExchangeRate> findLatest(CurrencyPair pair) {
        return jdbcClient.sql("""
                SELECT rate, rate_time
                FROM exchange_rates
                WHERE base_currency = :base AND quote_currency = :quote
                ORDER BY rate_time DESC
                LIMIT 1
                """)
                .param("base", pair.base().code())
                .param("quote", pair.quote().code())
                .query((row, rowNumber) -> new ExchangeRate(
                        pair,
                        row.getBigDecimal("rate"),
                        row.getObject("rate_time", OffsetDateTime.class).toInstant()))
                .optional();
    }

    public Optional<Instant> findLatestRateTime() {
        return jdbcClient.sql("""
                SELECT rate_time
                FROM exchange_rates
                ORDER BY rate_time DESC
                LIMIT 1
                """)
                .query((row, rowNumber) -> row.getObject("rate_time", OffsetDateTime.class).toInstant())
                .optional();
    }
}