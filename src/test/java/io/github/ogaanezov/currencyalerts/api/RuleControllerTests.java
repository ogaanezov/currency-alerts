package io.github.ogaanezov.currencyalerts.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import io.github.ogaanezov.currencyalerts.TestcontainersConfiguration;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class RuleControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void createsRule() throws Exception {
        mockMvc.perform(post("/api/rules")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"base": "USD", "quote": "EUR", "direction": "ABOVE", "threshold": 0.95}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.base").value("USD"))
                .andExpect(jsonPath("$.direction").value("ABOVE"))
                .andExpect(jsonPath("$.triggered").value(false));
    }

    @Test
    void rejectsInvalidCurrency() throws Exception {
        mockMvc.perform(post("/api/rules")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"base": "usd", "quote": "EUR", "direction": "ABOVE", "threshold": 0.95}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Currency code must be 3 uppercase letters: usd"));
    }

    @Test
    void rejectsMissingDirection() throws Exception {
        mockMvc.perform(post("/api/rules")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"base": "USD", "quote": "EUR", "threshold": 0.95}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listsRules() throws Exception {
        mockMvc.perform(get("/api/rules"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void returnsNotFoundWhenDeletingUnknownRule() throws Exception {
        mockMvc.perform(delete("/api/rules/999999"))
                .andExpect(status().isNotFound());
    }
}