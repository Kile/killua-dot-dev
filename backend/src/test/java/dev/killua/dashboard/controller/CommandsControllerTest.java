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

import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class CommandsControllerTest {

    private MockMvc mockMvc;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private CommandsController commandsController;

    @BeforeEach
    void setup() {
        mockMvc = MockMvcBuilders.standaloneSetup(commandsController).build();
    }

    // No local command models; proxy-only

    @Test
    @DisplayName("GET /api/commands - returns remote payload when API succeeds")
    void getAllCommands_remote() throws Exception {
        Mockito.when(restTemplate.getForObject(anyString(), eq(Map.class)))
            .thenReturn(Map.of("commands", List.of(Map.of("name", "ping"))));

        mockMvc.perform(get("/api/commands"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.commands", hasSize(1)))
            .andExpect(jsonPath("$.commands[0].name", is("ping")));
    }

    @Test
    @DisplayName("GET /api/commands - upstream error returns 502")
    void getAllCommands_upstreamError() throws Exception {
        Mockito.when(restTemplate.getForObject(anyString(), eq(Map.class)))
            .thenThrow(new RuntimeException("down"));

        mockMvc.perform(get("/api/commands"))
            .andExpect(status().isBadGateway());
    }

    // Removed other endpoints: proxy-only controller now exposes only GET /api/commands
}
