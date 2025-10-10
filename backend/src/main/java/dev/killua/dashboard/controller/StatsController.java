package dev.killua.dashboard.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/api/stats")
@CrossOrigin(origins = "*")
public class StatsController extends BaseController {

    public StatsController(RestTemplate restTemplate) {
        super(restTemplate);
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getStats() {
        try {
            String apiUrl = getBaseUrl() + "/stats";

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
