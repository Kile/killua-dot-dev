package dev.killua.dashboard.controller;

import dev.killua.dashboard.dto.UserDto;
import dev.killua.dashboard.service.AuthService;
import dev.killua.dashboard.service.DiscordTokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/guild")
@CrossOrigin(origins = "*")
public class GuildController {

    @Autowired
    private AuthService authService;
    
    @Autowired
    private DiscordTokenService discordTokenService;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${external.api.base-url}")
    private String externalApiBaseUrl;

    @Autowired
    private RestTemplate restTemplate;

    /**
     * Extracts JWT token from Authorization header
     */
    private String extractJwtToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        return authHeader.substring(7);
    }

    /**
     * Creates a bad request response for invalid authorization header
     */
    private ResponseEntity<?> createInvalidAuthResponse() {
        return ResponseEntity.badRequest().body(Map.of("error", "Invalid authorization header"));
    }

    @GetMapping("/{guildId}/info")
    public ResponseEntity<?> getGuildInfo(@RequestHeader("Authorization") String authHeader, @PathVariable String guildId) {
        String jwtToken = extractJwtToken(authHeader);
        if (jwtToken == null) {
            return createInvalidAuthResponse();
        }
        
        try {
            // Verify the JWT token first
            authService.verifyToken(jwtToken);
            
            // Get the Discord token from the service
            String discordToken = discordTokenService.getDiscordToken(jwtToken);
            
            if (discordToken == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Discord token not found"));
            }
            
            // Fetch guild info from external API
            String apiUrl = externalApiBaseUrl + "/guild/" + guildId + "/info";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(discordToken);
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<String> request = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                apiUrl,
                HttpMethod.GET,
                request,
                String.class
            );
            
            if (response.getStatusCode() != HttpStatus.OK) {
                return ResponseEntity.status(response.getStatusCode())
                    .body(Map.of("error", "Failed to fetch guild info"));
            }
            
            // Parse the response
            Map<String, Object> guildInfo = objectMapper.readValue(response.getBody(), Map.class);
            
            // Convert user_id fields to strings to preserve precision for JavaScript
            Object tagsObj = guildInfo.get("tags");
            if (tagsObj instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                java.util.List<Map<String, Object>> tags = (java.util.List<Map<String, Object>>) tagsObj;
                for (Map<String, Object> tag : tags) {
                    Object ownerObj = tag.get("owner");
                    if (ownerObj instanceof Map) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> owner = (Map<String, Object>) ownerObj;
                        Object userId = owner.get("user_id");
                        if (userId != null) {
                            owner.put("user_id", String.valueOf(userId));
                        }
                    }
                }
            }
            
            return ResponseEntity.ok(guildInfo);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/{guildId}/edit")
    public ResponseEntity<?> editGuildSettings(@RequestHeader("Authorization") String authHeader, 
                                                @PathVariable String guildId,
                                                @RequestBody Map<String, Object> payload) {
        String jwtToken = extractJwtToken(authHeader);
        if (jwtToken == null) {
            return createInvalidAuthResponse();
        }
        
        try {
            // Verify the JWT token first
            authService.verifyToken(jwtToken);
            
            // Get the Discord token from the service
            String discordToken = discordTokenService.getDiscordToken(jwtToken);
            
            if (discordToken == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Discord token not found"));
            }
            
            // Call external API to edit guild settings
            String apiUrl = externalApiBaseUrl + "/guild/" + guildId + "/edit";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(discordToken);
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                apiUrl,
                HttpMethod.POST,
                request,
                String.class
            );
            
            if (response.getStatusCode() != HttpStatus.OK) {
                return ResponseEntity.status(response.getStatusCode())
                    .body(Map.of("error", "Failed to update guild settings"));
            }
            
            return ResponseEntity.ok(Map.of("success", true, "message", "Guild settings updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/{guildId}/tag/create")
    public ResponseEntity<?> createTag(@RequestHeader("Authorization") String authHeader,
                                        @PathVariable String guildId,
                                        @RequestBody Map<String, Object> payload) {
        String jwtToken = extractJwtToken(authHeader);
        if (jwtToken == null) {
            return createInvalidAuthResponse();
        }
        
        try {
            // Verify the JWT token first
            UserDto user = authService.verifyToken(jwtToken);
            
            // Get the Discord token from the service
            String discordToken = discordTokenService.getDiscordToken(jwtToken);
            
            if (discordToken == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Discord token not found"));
            }
            
            // Build request for external API (convert guild_id and user_id to long)
            Map<String, Object> apiPayload = new java.util.HashMap<>();
            apiPayload.put("guild_id", Long.parseLong(guildId));
            apiPayload.put("user_id", Long.parseLong(user.getDiscordId()));
            apiPayload.put("name", payload.get("name"));
            apiPayload.put("content", payload.get("content"));
            
            String apiUrl = externalApiBaseUrl + "/guild/" + guildId + "/tag/create";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(discordToken);
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(apiPayload, headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                apiUrl,
                HttpMethod.POST,
                request,
                String.class
            );
            
            Map<String, Object> responseBody = objectMapper.readValue(response.getBody(), Map.class);
            
            if (response.getStatusCode() != HttpStatus.OK || !Boolean.TRUE.equals(responseBody.get("success"))) {
                return ResponseEntity.status(response.getStatusCode())
                    .body(Map.of("error", responseBody.getOrDefault("message", "Failed to create tag")));
            }
            
            return ResponseEntity.ok(responseBody);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/{guildId}/tag/edit")
    public ResponseEntity<?> editTag(@RequestHeader("Authorization") String authHeader,
                                      @PathVariable String guildId,
                                      @RequestBody Map<String, Object> payload) {
        String jwtToken = extractJwtToken(authHeader);
        if (jwtToken == null) {
            return createInvalidAuthResponse();
        }
        
        try {
            // Verify the JWT token first
            UserDto user = authService.verifyToken(jwtToken);
            
            // Get the Discord token from the service
            String discordToken = discordTokenService.getDiscordToken(jwtToken);
            
            if (discordToken == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Discord token not found"));
            }
            
            // Build request for external API (convert IDs to long)
            Map<String, Object> apiPayload = new java.util.HashMap<>();
            apiPayload.put("guild_id", Long.parseLong(guildId));
            apiPayload.put("user_id", Long.parseLong(user.getDiscordId()));
            apiPayload.put("name", payload.get("name"));
            if (payload.containsKey("content")) {
                apiPayload.put("content", payload.get("content"));
            }
            if (payload.containsKey("new_name")) {
                apiPayload.put("new_name", payload.get("new_name"));
            }
            if (payload.containsKey("new_owner")) {
                // Convert new_owner string to long
                Object newOwner = payload.get("new_owner");
                if (newOwner != null) {
                    apiPayload.put("new_owner", Long.parseLong(newOwner.toString()));
                }
            }
            
            String apiUrl = externalApiBaseUrl + "/guild/" + guildId + "/tag/edit";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(discordToken);
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(apiPayload, headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                apiUrl,
                HttpMethod.POST,
                request,
                String.class
            );
            
            Map<String, Object> responseBody = objectMapper.readValue(response.getBody(), Map.class);
            
            if (response.getStatusCode() != HttpStatus.OK || !Boolean.TRUE.equals(responseBody.get("success"))) {
                return ResponseEntity.status(response.getStatusCode())
                    .body(Map.of("error", responseBody.getOrDefault("message", "Failed to edit tag")));
            }
            
            return ResponseEntity.ok(responseBody);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @DeleteMapping("/{guildId}/tag/delete")
    public ResponseEntity<?> deleteTag(@RequestHeader("Authorization") String authHeader,
                                        @PathVariable String guildId,
                                        @RequestBody Map<String, Object> payload) {
        String jwtToken = extractJwtToken(authHeader);
        if (jwtToken == null) {
            return createInvalidAuthResponse();
        }
        
        try {
            // Verify the JWT token first
            UserDto user = authService.verifyToken(jwtToken);
            
            // Get the Discord token from the service
            String discordToken = discordTokenService.getDiscordToken(jwtToken);
            
            if (discordToken == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Discord token not found"));
            }
            
            // Build request for external API
            Map<String, Object> apiPayload = new java.util.HashMap<>();
            apiPayload.put("guild_id", Long.parseLong(guildId));
            apiPayload.put("user_id", Long.parseLong(user.getDiscordId()));
            apiPayload.put("name", payload.get("name"));
            
            String apiUrl = externalApiBaseUrl + "/guild/" + guildId + "/tag/delete";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(discordToken);
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(apiPayload, headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                apiUrl,
                HttpMethod.DELETE,
                request,
                String.class
            );
            
            Map<String, Object> responseBody = objectMapper.readValue(response.getBody(), Map.class);
            
            if (response.getStatusCode() != HttpStatus.OK || !Boolean.TRUE.equals(responseBody.get("success"))) {
                return ResponseEntity.status(response.getStatusCode())
                    .body(Map.of("error", responseBody.getOrDefault("message", "Failed to delete tag")));
            }
            
            return ResponseEntity.ok(responseBody);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}

