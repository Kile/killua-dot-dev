package dev.killua.dashboard.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class StatsControllerTest {

    private MockMvc mockMvc;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private StatsController statsController;

    @BeforeEach
    void setup() {
        mockMvc = MockMvcBuilders.standaloneSetup(statsController).build();
    }

    @Test
    @DisplayName("GET /api/stats - returns payload from API")
    void getStats_remote() throws Exception {
        Mockito.when(restTemplate.getForObject(anyString(), eq(Map.class)))
            .thenReturn(Map.of(
                "guilds", 10,
                "shards", 2,
                "user_installs", 5,
                "registered_users", 3,
                "last_restart", System.currentTimeMillis()
            ));

        mockMvc.perform(get("/api/stats"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.guilds", is(10)))
            .andExpect(jsonPath("$.shards", is(2)));
    }

    @Test
    @DisplayName("GET /api/stats - falls back to defaults on error")
    void getStats_fallback() throws Exception {
        Mockito.doThrow(new RuntimeException("down"))
            .when(restTemplate)
            .getForObject(anyString(), eq(Map.class));

        mockMvc.perform(get("/api/stats"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.guilds", is(0)))
            .andExpect(jsonPath("$.user_installs", is(0)))
            .andExpect(jsonPath("$.registered_users", is(0)))
            .andExpect(jsonPath("$.last_restart", notNullValue()));
    }
}
