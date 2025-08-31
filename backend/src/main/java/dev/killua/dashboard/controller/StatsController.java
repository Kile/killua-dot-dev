package dev.killua.dashboard.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/stats")
@CrossOrigin(origins = "*")
public class StatsController {

    @Autowired
    private RestTemplate restTemplate;

    @Value("${external.api.base-url:https://api.killua.dev}")
    private String externalApiBaseUrl;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getStats() {
        try {
            String base = (externalApiBaseUrl != null && !externalApiBaseUrl.isBlank())
                ? externalApiBaseUrl
                : "https://api.killua.dev";
            String apiUrl = base + "/stats";

            @SuppressWarnings("unchecked")
            Map<String, Object> raw = restTemplate.getForObject(apiUrl, Map.class);
            
            return ResponseEntity.ok(raw);
        } catch (Exception e) {
            e.printStackTrace();
            // Return fallback stats if API fails
            Map<String, Object> fallbackStats = Map.of(
                "guilds", 0,
                "shards", 0,
                "user_installs", 0,
                "registered_users", 0,
                "last_restart", System.currentTimeMillis()
            );
            return ResponseEntity.ok(fallbackStats);
        }
    }
}
