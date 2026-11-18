package io.github.ogaanezov.currencyalerts.conversion;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;

import org.springframework.stereotype.Service;

import io.github.ogaanezov.currencyalerts.domain.Currency;
import io.github.ogaanezov.currencyalerts.domain.CurrencyPair;
import io.github.ogaanezov.currencyalerts.domain.ExchangeRate;
import io.github.ogaanezov.currencyalerts.persistence.ExchangeRateRepository;

@Service
public class ConversionService {

    private static final Currency USD = new Currency("USD");
    private static final int RATE_SCALE = 10;
    private static final int RESULT_SCALE = 2;

    private final ExchangeRateRepository repository;

    public ConversionService(ExchangeRateRepository repository) {
        this.repository = repository;
    }

    public Conversion convert(CurrencyPair pair, BigDecimal amount) {
        if (amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("Amount must be positive: " + amount);
        }
        Currency from = pair.base();
        Currency to = pair.quote();

        BigDecimal rate;
        Instant rateTime;
        if (from.equals(USD)) {
            // USD -> EUR: курс USD/EUR есть в базе как есть.
            ExchangeRate usdToTarget = latestUsdRate(to);
            rate = usdToTarget.rate();
            rateTime = usdToTarget.timestamp();
        } else if (to.equals(USD)) {
            // EUR -> USD: обратный курс, 1 / (USD/EUR).
            ExchangeRate usdToSource = latestUsdRate(from);
            rate = BigDecimal.ONE.divide(usdToSource.rate(), RATE_SCALE, RoundingMode.HALF_EVEN);
            rateTime = usdToSource.timestamp();
        } else {
            // EUR -> GBP: кросс-курс через доллар, (USD/GBP) / (USD/EUR).
            ExchangeRate usdToSource = latestUsdRate(from);
            ExchangeRate usdToTarget = latestUsdRate(to);
            rate = usdToTarget.rate().divide(usdToSource.rate(), RATE_SCALE, RoundingMode.HALF_EVEN);
            rateTime = earlier(usdToSource.timestamp(), usdToTarget.timestamp());
        }

        // Убираем лишние нули: 1.2500000000 -> 1.25. Но 500 не должно стать 5E+2.
        rate = rate.stripTrailingZeros();
        if (rate.scale() < 0) {
            rate = rate.setScale(0);
        }
        BigDecimal result = amount.multiply(rate).setScale(RESULT_SCALE, RoundingMode.HALF_EVEN);
        return new Conversion(pair, amount, rate, result, rateTime);
    }

    private ExchangeRate latestUsdRate(Currency currency) {
        return repository.findLatest(new CurrencyPair(USD, currency))
                .orElseThrow(() -> new IllegalArgumentException("No rate for " + currency.code() + " yet"));
    }

    private static Instant earlier(Instant first, Instant second) {
        return first.isBefore(second) ? first : second;
    }
}