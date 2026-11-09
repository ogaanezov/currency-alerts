package io.github.ogaanezov.currencyalerts.rates;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.restclient.test.autoconfigure.RestClientTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.HttpClientErrorException;

import io.github.ogaanezov.currencyalerts.domain.Currency;
import io.github.ogaanezov.currencyalerts.domain.CurrencyPair;
import io.github.ogaanezov.currencyalerts.domain.ExchangeRate;

@RestClientTest(components = OpenExchangeRatesClient.class, properties = "oxr.app-id=test-key")
class OpenExchangeRatesClientTests {

    private static final String LATEST_URL =
            "https://openexchangerates.org/api/latest.json?app_id=test-key&symbols=EUR,GBP";

    @Autowired
    private OpenExchangeRatesClient client;

    @Autowired
    private MockRestServiceServer server;

    private final List<Currency> currencies = List.of(new Currency("EUR"), new Currency("GBP"));

    @Test
    void parsesRatesFromResponse() {
        server.expect(requestTo(LATEST_URL))
                .andRespond(withSuccess("""
                        {
                          "timestamp": 1794045571,
                          "base": "USD",
                          "rates": { "EUR": 0.89715, "GBP": 0.748671 }
                        }
                        """, MediaType.APPLICATION_JSON));

        List<ExchangeRate> rates = client.fetchLatest(currencies);

        Currency usd = new Currency("USD");
        Instant time = Instant.ofEpochSecond(1794045571);
        assertEquals(List.of(
                        new ExchangeRate(new CurrencyPair(usd, new Currency("EUR")), new BigDecimal("0.89715"), time),
                        new ExchangeRate(new CurrencyPair(usd, new Currency("GBP")), new BigDecimal("0.748671"), time)),
                rates);
    }

    @Test
    void throwsWhenApiRejectsKey() {
        server.expect(requestTo(LATEST_URL))
                .andRespond(withStatus(HttpStatus.UNAUTHORIZED));

        assertThrows(HttpClientErrorException.class, () -> client.fetchLatest(currencies));
    }
}