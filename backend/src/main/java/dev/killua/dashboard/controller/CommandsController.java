package dev.killua.dashboard.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/api/commands")
@CrossOrigin(origins = "*")
public class CommandsController {

    @Autowired
    private RestTemplate restTemplate;

    @Value("${external.api.base-url:https://api.killua.dev}")
    private String externalApiBaseUrl;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllCommands() {
        try {
            String base = (externalApiBaseUrl != null && !externalApiBaseUrl.isBlank())
                ? externalApiBaseUrl
                : "https://api.killua.dev";
            String apiUrl = base + "/commands";
            Map<String, Object> commands = restTemplate.getForObject(apiUrl, Map.class);
            if (commands != null) {
                return ResponseEntity.ok(commands);
            }
            return ResponseEntity.status(502).body(Map.of("error", "Upstream returned null"));
        } catch (Exception e) {
            return ResponseEntity.status(502).body(Map.of("error", "Failed to fetch upstream commands"));
        }
    }
}
