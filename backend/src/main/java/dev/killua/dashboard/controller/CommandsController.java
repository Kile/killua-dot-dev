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
public class CommandsController extends BaseController {

    public CommandsController(RestTemplate restTemplate) {
        super(restTemplate);
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllCommands() {
        try {
            String apiUrl = getBaseUrl() + "/commands";
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
