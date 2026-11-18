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
class ConversionControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ExchangeRateRepository repository;

    @Test
    void convertsAmount() throws Exception {
        CurrencyPair usdGel = new CurrencyPair(new Currency("USD"), new Currency("GEL"));
        repository.save(new ExchangeRate(usdGel, new BigDecimal("2.7"), Instant.parse("2026-11-11T12:00:00Z")));

        mockMvc.perform(get("/api/convert").param("from", "USD").param("to", "GEL").param("amount", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rate").value(2.7))
                .andExpect(jsonPath("$.result").value(27.0));
    }

    @Test
    void rejectsSameCurrency() throws Exception {
        mockMvc.perform(get("/api/convert").param("from", "USD").param("to", "USD").param("amount", "10"))
                .andExpect(status().isBadRequest());
    }
}