package io.github.ogaanezov.currencyalerts.rates;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import io.github.ogaanezov.currencyalerts.domain.Currency;
import io.github.ogaanezov.currencyalerts.domain.CurrencyPair;
import io.github.ogaanezov.currencyalerts.domain.ExchangeRate;

@Component
public class OpenExchangeRatesClient {

    private final RestClient restClient;
    private final String appId;

    public OpenExchangeRatesClient(
            RestClient.Builder restClientBuilder,
            @Value("${oxr.base-url}") String baseUrl,
            @Value("${oxr.app-id}") String appId) {
        this.restClient = restClientBuilder.baseUrl(baseUrl).build();
        this.appId = appId;
    }

    public List<ExchangeRate> fetchLatest(List<Currency> currencies) {
        List<String> codes = new ArrayList<>();
        for (Currency currency : currencies) {
            codes.add(currency.code());
        }

        LatestRatesResponse response = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/latest.json")
                        .queryParam("app_id", appId)
                        .queryParam("symbols", String.join(",", codes))
                        .build())
                .retrieve()
                .body(LatestRatesResponse.class);

        if (response == null || response.base() == null || response.rates() == null) {
            throw new IllegalStateException("Open Exchange Rates returned an empty response");
        }

        Currency base = new Currency(response.base());
        Instant time = Instant.ofEpochSecond(response.timestamp());
        List<ExchangeRate> rates = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> entry : response.rates().entrySet()) {
            CurrencyPair pair = new CurrencyPair(base, new Currency(entry.getKey()));
            rates.add(new ExchangeRate(pair, entry.getValue(), time));
        }
        return rates;
    }

    record LatestRatesResponse(long timestamp, String base, Map<String, BigDecimal> rates) {
    }
}