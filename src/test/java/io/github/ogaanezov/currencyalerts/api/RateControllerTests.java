package io.github.ogaanezov.currencyalerts.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.Instant;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import io.github.ogaanezov.currencyalerts.TestcontainersConfiguration;
import io.github.ogaanezov.currencyalerts.domain.Currency;
import io.github.ogaanezov.currencyalerts.domain.CurrencyPair;
import io.github.ogaanezov.currencyalerts.domain.ExchangeRate;
import io.github.ogaanezov.currencyalerts.persistence.ExchangeRateRepository;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class RateControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ExchangeRateRepository repository;

    @Test
    void returnsRateHistoryNewestFirst() throws Exception {
        CurrencyPair usdJpy = new CurrencyPair(new Currency("USD"), new Currency("JPY"));
        repository.save(new ExchangeRate(usdJpy, new BigDecimal("150.1"), Instant.parse("2026-11-11T09:00:00Z")));
        repository.save(new ExchangeRate(usdJpy, new BigDecimal("150.2"), Instant.parse("2026-11-11T10:00:00Z")));

        mockMvc.perform(get("/api/rates/USD/JPY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].rate").value(150.2))
                .andExpect(jsonPath("$[1].rate").value(150.1));
    }

    @Test
    void rejectsTooLargeLimit() throws Exception {
        mockMvc.perform(get("/api/rates/USD/EUR").param("limit", "5000"))
                .andExpect(status().isBadRequest());
    }
}