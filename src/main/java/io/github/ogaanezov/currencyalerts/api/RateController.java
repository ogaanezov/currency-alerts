package io.github.ogaanezov.currencyalerts.api;

import java.util.ArrayList;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.github.ogaanezov.currencyalerts.domain.Currency;
import io.github.ogaanezov.currencyalerts.domain.CurrencyPair;
import io.github.ogaanezov.currencyalerts.domain.ExchangeRate;
import io.github.ogaanezov.currencyalerts.persistence.ExchangeRateRepository;

@RestController
@RequestMapping("/api/rates")
public class RateController {

    private static final int MAX_LIMIT = 1000;

    private final ExchangeRateRepository repository;

    public RateController(ExchangeRateRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/{base}/{quote}")
    public List<RateResponse> history(
            @PathVariable String base,
            @PathVariable String quote,
            @RequestParam(defaultValue = "24") int limit) {
        if (limit < 1 || limit > MAX_LIMIT) {
            throw new IllegalArgumentException("Limit must be between 1 and " + MAX_LIMIT);
        }
        CurrencyPair pair = new CurrencyPair(new Currency(base), new Currency(quote));
        List<RateResponse> rates = new ArrayList<>();
        for (ExchangeRate rate : repository.findHistory(pair, limit)) {
            rates.add(RateResponse.from(rate));
        }
        return rates;
    }
}