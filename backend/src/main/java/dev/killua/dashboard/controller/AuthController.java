package dev.killua.dashboard.controller;

import dev.killua.dashboard.dto.UserDto;
import dev.killua.dashboard.dto.UserEditPayloadDto;
import dev.killua.dashboard.dto.CommandResultDto;
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
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

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
     * @param authHeader The Authorization header
     * @return The JWT token or null if invalid
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

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String code = request.get("code");
        if (code == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Authorization code is required"));
        }

        try {
            Map<String, String> tokens = authService.processDiscordLogin(code);
            UserDto user = authService.getCurrentUser();
            return ResponseEntity.ok(Map.of(
                "token", tokens.get("jwt"), 
                "user", user
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/verify")
    public ResponseEntity<?> verifyToken(@RequestHeader("Authorization") String authHeader) {
        String token = extractJwtToken(authHeader);
        if (token == null) {
            return createInvalidAuthResponse();
        }
        
        try {
            UserDto user = authService.verifyToken(token);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader("Authorization") String authHeader) {
        // In a stateless JWT system, logout is typically handled client-side
        // by removing the token from storage
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
    
    @GetMapping("/discord-token")
    public ResponseEntity<?> getDiscordToken(@RequestHeader("Authorization") String authHeader) {
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
            
            return ResponseEntity.ok(Map.of(
                "discordToken", discordToken,
                "user", user
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/discord-token/debug")
    public ResponseEntity<?> debugDiscordToken(@RequestHeader("Authorization") String authHeader) {
        String jwtToken = extractJwtToken(authHeader);
        if (jwtToken == null) {
            return createInvalidAuthResponse();
        }
        
        try {
            // Verify the JWT token first
            UserDto user = authService.verifyToken(jwtToken);
            
            // Get the Discord token from the service
            String discordToken = discordTokenService.getDiscordToken(jwtToken);
            boolean hasToken = discordTokenService.hasDiscordToken(jwtToken);
            
            return ResponseEntity.ok(Map.of(
                "hasToken", hasToken,
                "discordToken", discordToken != null ? discordToken.substring(0, Math.min(50, discordToken.length())) + "..." : null,
                "discordTokenLength", discordToken != null ? discordToken.length() : 0,
                "user", user
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/user/info")
    public ResponseEntity<?> getUserInfo(@RequestHeader("Authorization") String authHeader) {
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
            
            // Fetch user info from external API using the Discord token
            String userInfo = authService.fetchUserInfoFromExternalApi(discordToken);
            
            // Parse the JSON string and return it as a proper object
            Map<String, Object> userInfoMap = objectMapper.readValue(userInfo, Map.class);
            return ResponseEntity.ok(userInfoMap);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/admin/check")
    public ResponseEntity<?> checkAdminStatus(@RequestHeader("Authorization") String authHeader) {
        String jwtToken = extractJwtToken(authHeader);
        if (jwtToken == null) {
            return createInvalidAuthResponse();
        }
        
        try {
            UserDto user = authService.verifyToken(jwtToken);
            boolean isAdmin = authService.isAdmin(user.getDiscordId());
            
            return ResponseEntity.ok(Map.of(
                "isAdmin", isAdmin,
                "user", user
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/admin/user/{discordId}")
    public ResponseEntity<?> getAdminUserInfo(@RequestHeader("Authorization") String authHeader, @PathVariable String discordId) {
        String jwtToken = extractJwtToken(authHeader);
        if (jwtToken == null) {
            return createInvalidAuthResponse();
        }
        
        try {
            UserDto user = authService.verifyToken(jwtToken);
            
            // Check if user is admin
            if (!authService.isAdmin(user.getDiscordId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied. Admin privileges required."));
            }
            
            // Get the Discord token from the service to use for the external API call
            String discordToken = discordTokenService.getDiscordToken(jwtToken);
            
            if (discordToken == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Discord token not found"));
            }
            
            // Fetch user info by Discord ID using the Discord token
            String userInfo = authService.fetchUserInfoFromExternalApiById(discordToken, discordId);
            
            // Parse the JSON string and return it as a proper object
            Map<String, Object> userInfoMap = objectMapper.readValue(userInfo, Map.class);
            return ResponseEntity.ok(userInfoMap);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PutMapping("/user/edit")
    public ResponseEntity<?> editUserSettings(@RequestHeader("Authorization") String authHeader, @RequestBody UserEditPayloadDto userEditPayload) {
        String jwtToken = extractJwtToken(authHeader);
        if (jwtToken == null) {
            return createInvalidAuthResponse();
        }
        
        try {
            // Verify the JWT token first
            UserDto user = authService.verifyToken(jwtToken);
            if (user == null) {
                return createInvalidAuthResponse();
            }
            
            // Update user settings
            authService.editUserSettings(jwtToken, user.getDiscordId(), userEditPayload);
            
            return ResponseEntity.ok(Map.of("success", true, "message", "User settings updated successfully"));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PutMapping("/admin/user/{discordId}/edit")
    public ResponseEntity<?> editAdminUserSettings(@RequestHeader("Authorization") String authHeader, @PathVariable String discordId, @RequestBody UserEditPayloadDto userEditPayload) {
        String jwtToken = extractJwtToken(authHeader);
        if (jwtToken == null) {
            return createInvalidAuthResponse();
        }
        
        try {
            // Verify the JWT token first
            UserDto user = authService.verifyToken(jwtToken);
            if (user == null) {
                return createInvalidAuthResponse();
            }
            
            // Check if user is admin
            if (!authService.isAdmin(user.getDiscordId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied. Admin privileges required."));
            }
            
            // Update user settings for the specified user
            authService.editUserSettings(jwtToken, discordId, userEditPayload);
            
            return ResponseEntity.ok(Map.of("success", true, "message", "User settings updated successfully"));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Test the update endpoint (admin only)
     */
    @PostMapping("/admin/update/test")
    public ResponseEntity<?> testUpdateEndpoint(@RequestHeader("Authorization") String authHeader) {
        String jwtToken = extractJwtToken(authHeader);
        if (jwtToken == null) {
            return createInvalidAuthResponse();
        }
        
        try {
            // Verify user is admin
            UserDto user = authService.verifyToken(jwtToken);
            if (!authService.isAdmin(user.getDiscordId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied. Admin privileges required."));
            }
            
            // Get the Discord token from the service to use for the external API call
            String discordToken = discordTokenService.getDiscordToken(jwtToken);
            
            if (discordToken == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Discord token not found"));
            }
            
            // Call external API with test parameter
            String apiUrl = externalApiBaseUrl + "/update?test=pass";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(discordToken);
            
            HttpEntity<String> request = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                apiUrl, 
                HttpMethod.POST, 
                request, 
                String.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK) {
                return ResponseEntity.ok(Map.of("success", true, "message", "Test endpoint passed"));
            } else {
                return ResponseEntity.status(response.getStatusCode())
                    .body(Map.of("error", "Test endpoint failed with status: " + response.getStatusCode()));
            }
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to test endpoint: " + e.getMessage()));
        }
    }

    /**
     * Update the bot (admin only)
     */
    @PostMapping("/admin/update/bot")
    public ResponseEntity<?> updateBot(@RequestHeader("Authorization") String authHeader) {
        String jwtToken = extractJwtToken(authHeader);
        if (jwtToken == null) {
            return createInvalidAuthResponse();
        }
        
        try {
            // Verify user is admin
            UserDto user = authService.verifyToken(jwtToken);
            if (!authService.isAdmin(user.getDiscordId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied. Admin privileges required."));
            }
            
            // Get the Discord token from the service to use for the external API call
            String discordToken = discordTokenService.getDiscordToken(jwtToken);
            
            if (discordToken == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Discord token not found"));
            }
            
            // Call external API without test parameter
            String apiUrl = externalApiBaseUrl + "/update";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(discordToken);
            
            HttpEntity<String> request = new HttpEntity<>(headers);
            
            ResponseEntity<CommandResultDto> response = restTemplate.exchange(
                apiUrl, 
                HttpMethod.POST, 
                request, 
                CommandResultDto.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK) {
                CommandResultDto result = response.getBody();
                if (result != null) {
                    return ResponseEntity.ok(result);
                } else {
                    return ResponseEntity.status(502).body(Map.of("error", "Empty response from external API"));
                }
            } else {
                return ResponseEntity.status(response.getStatusCode())
                    .body(Map.of("error", "Update failed with status: " + response.getStatusCode()));
            }
            
        } catch (Exception e) {
            // Check if the error is due to connection being dropped (which indicates successful restart)
            String errorMessage = e.getMessage();
            if (errorMessage != null && (
                errorMessage.contains("Connection reset") ||
                errorMessage.contains("Connection refused") ||
                errorMessage.contains("Connection timed out") ||
                errorMessage.contains("I/O error") ||
                errorMessage.contains("SocketTimeoutException") ||
                errorMessage.contains("ConnectException")
            )) {
                // Connection drop likely means the bot restarted successfully
                return ResponseEntity.ok(new CommandResultDto(0, "Bot update initiated successfully. Connection dropped, indicating restart."));
            }
            
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to update bot: " + e.getMessage()));
        }
    }
}
