package io.github.ogaanezov.currencyalerts.api;

import static org.hamcrest.Matchers.hasItem;
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
import io.github.ogaanezov.currencyalerts.domain.AlertRule;
import io.github.ogaanezov.currencyalerts.domain.Currency;
import io.github.ogaanezov.currencyalerts.domain.CurrencyPair;
import io.github.ogaanezov.currencyalerts.domain.Direction;
import io.github.ogaanezov.currencyalerts.domain.Notification;
import io.github.ogaanezov.currencyalerts.persistence.AlertRuleRepository;
import io.github.ogaanezov.currencyalerts.persistence.NotificationRepository;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class NotificationControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AlertRuleRepository ruleRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Test
    void listsNotifications() throws Exception {
        AlertRule rule = new AlertRule(
                new CurrencyPair(new Currency("USD"), new Currency("CAD")),
                Direction.ABOVE,
                new BigDecimal("1.3"));
        long ruleId = ruleRepository.save(rule);
        notificationRepository.save(ruleId, new Notification(rule, new BigDecimal("1.31"), Instant.parse("2026-11-11T10:00:00Z")));

        mockMvc.perform(get("/api/notifications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].ruleId").value(hasItem((int) ruleId)));
    }
}