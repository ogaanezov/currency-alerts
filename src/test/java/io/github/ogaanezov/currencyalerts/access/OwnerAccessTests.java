package io.github.ogaanezov.currencyalerts.access;

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
@SpringBootTest(properties = "app.admin-token=test-owner-token")
@AutoConfigureMockMvc
class OwnerAccessTests {

    private static final String RULE = """
            {"base": "USD", "quote": "EUR", "direction": "ABOVE", "threshold": 0.95}
            """;

    @Autowired
    private MockMvc mockMvc;

    @Test
    void guestCanReadRules() throws Exception {
        mockMvc.perform(get("/api/rules")).andExpect(status().isOk());
        mockMvc.perform(get("/api/access")).andExpect(jsonPath("$.canEdit").value(false));
    }

    @Test
    void guestCannotChangeRules() throws Exception {
        mockMvc.perform(post("/api/rules").contentType(MediaType.APPLICATION_JSON).content(RULE))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/rules/1")).andExpect(status().isForbidden());
    }

    @Test
    void wrongTokenIsRejected() throws Exception {
        mockMvc.perform(post("/api/rules").header(OwnerAccess.HEADER, "wrong")
                        .contentType(MediaType.APPLICATION_JSON).content(RULE))
                .andExpect(status().isForbidden());
    }

    @Test
    void ownerCanChangeRules() throws Exception {
        mockMvc.perform(get("/api/access").header(OwnerAccess.HEADER, "test-owner-token"))
                .andExpect(jsonPath("$.canEdit").value(true));
        mockMvc.perform(post("/api/rules").header(OwnerAccess.HEADER, "test-owner-token")
                        .contentType(MediaType.APPLICATION_JSON).content(RULE))
                .andExpect(status().isCreated());
    }
}
